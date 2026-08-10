"use client";

import { useState, useEffect } from 'react'
import { API_URL } from './config'
import { parseValidJwtClaims } from './auth-token'

export type AuthUser = {
  id: string
  email: string
  role: 'admin' | 'staff' | 'counselor'
  school_id: string | null
  is_super_admin: boolean
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
  document.cookie = 'echosense_token=; path=/; max-age=0'
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
    (user.is_super_admin === undefined || typeof user.is_super_admin === 'boolean')
  ) {
    return {
      id: user.id,
      email: user.email,
      role: user.role as AuthUser['role'],
      school_id: typeof user.school_id === 'string' ? user.school_id : null,
      is_super_admin: user.is_super_admin === true,
    }
  }
  return null
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
  if (response.status === 401 || response.status === 403) {
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
    throw new Error('This account is not authorized to access EchoSense')
  }
  if (!res.ok) {
    throw new Error('Unable to sign in right now. Please try again.')
  }
  const data = await res.json() as {
    access_token?: unknown
    user?: unknown
  }
  const user = parseAuthUser(data.user)
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
  setAuthCookie(data.access_token)
  currentUserRequest = null
  return user
}

export function logout() {
  clearAuthCookie()
  window.location.href = '/login'
}

export function useCurrentUser(): AuthUser | null {
  const [user, setUser] = useState<AuthUser | null>(null)
  useEffect(() => {
    const token = getTokenFromCookie()
    const decoded = token ? decodeToken(token) : null
    if (!token) return
    if (!decoded) {
      clearAuthCookie()
      return
    }

    let active = true
    void validateCurrentUser(token, decoded)
      .then((validatedUser) => {
        if (active) setUser(validatedUser)
      })
      .catch(() => {
        if (active) setUser(null)
      })
    return () => {
      active = false
    }
  }, [])
  return user
}
