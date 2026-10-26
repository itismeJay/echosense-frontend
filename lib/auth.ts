"use client";

import { useState, useEffect } from 'react'
import { API_URL } from './config'
import { parseValidJwtClaims } from './auth-token'
import { clearSessionCookies, handleForbiddenResponse, setPasswordChangeFlag } from './session'
import { SCHOOL_INACTIVE, SCHOOL_INACTIVE_MESSAGE } from './session-errors'
import { clearSchoolScope } from './school-scope'

export type AuthUser = {
  id: string
  email: string
  role: 'admin' | 'staff' | 'counselor'
  school_id: string | null
  is_super_admin: boolean
  must_change_password: boolean
}

let currentUserRequest: {
  token: string
  promise: Promise<AuthUser | null>
} | null = null

export function setAuthCookie(token: string) {
  const secure = window.location.protocol === 'https:' ? '; secure' : ''
  document.cookie = `echosense_token=${token}; path=/; max-age=86400; samesite=strict${secure}`
}

export function clearAuthCookie() {
  clearSessionCookies()
  currentUserRequest = null
}

function getTokenFromCookie(): string | undefined {
  if (typeof document === 'undefined') return undefined
  return document.cookie
    .split('; ')
    .find(r => r.startsWith('echosense_token='))
    ?.split('=')[1]
}

function decodeToken(token: string): AuthUser | null {
  const payload = parseValidJwtClaims(token)
  return payload
    ? {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        school_id: null,
        is_super_admin: false,
        must_change_password: false,
      }
    : null
}

function parseAuthUser(value: unknown): AuthUser | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }
  const user = value as Record<string, unknown>
  const validSchoolId =
    user.school_id === undefined ||
    user.school_id === null ||
    (typeof user.school_id === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(user.school_id))
  if (
    typeof user.id === 'string' &&
    typeof user.email === 'string' &&
    ['admin', 'staff', 'counselor'].includes(String(user.role)) &&
    validSchoolId &&
    (user.is_super_admin === undefined || typeof user.is_super_admin === 'boolean') &&
    (user.must_change_password === undefined || typeof user.must_change_password === 'boolean')
  ) {
    return {
      id: user.id,
      email: user.email,
      role: user.role as AuthUser['role'],
      school_id: typeof user.school_id === 'string' ? user.school_id : null,
      is_super_admin: user.is_super_admin === true,
      must_change_password: user.must_change_password === true,
    }
  }
  return null
}

async function readErrorDetail(response: Response): Promise<unknown> {
  try {
    const value = (await response.json()) as unknown
    return typeof value === 'object' && value !== null && 'detail' in value
      ? (value as { detail: unknown }).detail
      : undefined
  } catch {
    return undefined
  }
}

function redirectInvalidSession() {
  clearAuthCookie()
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

async function fetchCurrentUser(
  token: string,
  claims: AuthUser
): Promise<AuthUser | null> {
  const response = await fetch(`${API_URL}/auth/me`, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(60_000),
  })
  if (response.status === 403) {
    if (handleForbiddenResponse(await readErrorDetail(response)) === 'no_permission') {
      redirectInvalidSession()
    }
    return null
  }
  if (response.status === 401) {
    redirectInvalidSession()
    return null
  }
  if (!response.ok) {
    throw new Error('Unable to validate the current EchoSense session')
  }

  const user = parseAuthUser(await response.json())
  if (
    !user ||
    user.id !== claims.id ||
    user.email !== claims.email ||
    user.role !== claims.role
  ) {
    redirectInvalidSession()
    return null
  }
  // Keep the proxy's navigation hint in step with the backend's account state.
  setPasswordChangeFlag(user.must_change_password)
  return user
}

function validateCurrentUser(token: string, claims: AuthUser) {
  if (currentUserRequest?.token === token) return currentUserRequest.promise

  const promise = fetchCurrentUser(token, claims)
  currentUserRequest = { token, promise }
  void promise.catch(() => {
    if (currentUserRequest?.promise === promise) currentUserRequest = null
  })
  return promise
}

export async function login(email: string, password: string): Promise<AuthUser> {
  let res: Response
  try {
    res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      signal: AbortSignal.timeout(60_000),
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new Error('The server took too long to respond. Please try again.')
    }
    throw new Error('Unable to reach the EchoSense server')
  }
  if (res.status === 401) throw new Error('Invalid email or password')
  if (res.status === 403) {
    if ((await readErrorDetail(res)) === SCHOOL_INACTIVE) {
      throw new Error(SCHOOL_INACTIVE_MESSAGE)
    }
    throw new Error('This account is not authorized to access EchoSense')
  }
  if (!res.ok) {
    throw new Error('Unable to sign in right now. Please try again.')
  }
  const data = await res.json() as {
    access_token?: unknown
    must_change_password?: unknown
    user?: unknown
  }
  const parsedUser = parseAuthUser(data.user)
  const user = parsedUser && {
    ...parsedUser,
    must_change_password:
      parsedUser.must_change_password || data.must_change_password === true,
  }
  if (
    typeof data.access_token !== 'string' ||
    !user
  ) {
    throw new Error('The server returned an invalid login response')
  }
  const claims = parseValidJwtClaims(data.access_token)
  if (
    !claims ||
    claims.sub !== user.id ||
    claims.email !== user.email ||
    claims.role !== user.role
  ) {
    throw new Error('The server returned an invalid or expired login token')
  }
  clearSchoolScope()
  setAuthCookie(data.access_token)
  setPasswordChangeFlag(user.must_change_password)
  // The login response is the stored user until the next /auth/me refresh.
  currentUserRequest = { token: data.access_token, promise: Promise.resolve(user) }
  return user
}

/** Re-reads /auth/me, e.g. after a password change cleared must_change_password. */
export async function refreshCurrentUser(): Promise<AuthUser | null> {
  const token = getTokenFromCookie()
  const decoded = token ? decodeToken(token) : null
  if (!token || !decoded) return null
  currentUserRequest = null
  return validateCurrentUser(token, decoded)
}

export function logout() {
  clearAuthCookie()
  window.location.href = '/login'
}

export type CurrentUserStatus = 'loading' | 'ready' | 'error'

export function useCurrentUserState(): { user: AuthUser | null; status: CurrentUserStatus } {
  const [state, setState] = useState<{ user: AuthUser | null; status: CurrentUserStatus }>({
    user: null,
    status: 'loading',
  })
  useEffect(() => {
    const token = getTokenFromCookie()
    const decoded = token ? decodeToken(token) : null
    if (!token || !decoded) {
      if (token) clearAuthCookie()
      const timer = setTimeout(() => setState({ user: null, status: 'error' }), 0)
      return () => clearTimeout(timer)
    }

    let active = true
    void validateCurrentUser(token, decoded)
      .then((validatedUser) => {
        if (active) {
          setState({ user: validatedUser, status: validatedUser ? 'ready' : 'error' })
        }
      })
      .catch(() => {
        if (active) setState({ user: null, status: 'error' })
      })
    return () => {
      active = false
    }
  }, [])
  return state
}

export function useCurrentUser(): AuthUser | null {
  return useCurrentUserState().user
}
