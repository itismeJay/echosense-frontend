"use client";

import { useState, useEffect } from 'react'
import { API_URL } from './config'

export type AuthUser = {
  id: string
  email: string
  role: 'admin' | 'staff' | 'counselor'
}

export function setAuthCookie(token: string) {
  document.cookie = `echosense_token=${token}; path=/; max-age=86400; samesite=strict`
}

export function clearAuthCookie() {
  document.cookie = 'echosense_token=; path=/; max-age=0'
}

function getTokenFromCookie(): string | undefined {
  if (typeof document === 'undefined') return undefined
  return document.cookie
    .split('; ')
    .find(r => r.startsWith('echosense_token='))
    ?.split('=')[1]
}

function decodeToken(token: string): AuthUser | null {
  try {
    const base64url = token.split('.')[1]
    const normalized = base64url.replace(/-/g, '+').replace(/_/g, '/')
    const base64 = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    const payload = JSON.parse(atob(base64))
    return { id: String(payload.sub), email: payload.email, role: payload.role }
  } catch {
    return null
  }
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
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { detail?: unknown }
    throw new Error(
      typeof body.detail === 'string'
        ? body.detail
        : 'Unable to sign in right now. Please try again.'
    )
  }
  const data = await res.json() as {
    access_token?: unknown
    user?: { id?: unknown; email?: unknown; role?: unknown }
  }
  if (
    typeof data.access_token !== 'string' ||
    !data.user ||
    typeof data.user.id !== 'string' ||
    typeof data.user.email !== 'string' ||
    !['admin', 'staff', 'counselor'].includes(String(data.user.role))
  ) {
    throw new Error('The server returned an invalid login response')
  }
  setAuthCookie(data.access_token)
  return data.user as AuthUser
}

export function logout() {
  clearAuthCookie()
  window.location.href = '/login'
}

export function useCurrentUser(): AuthUser | null {
  const [user, setUser] = useState<AuthUser | null>(null)
  useEffect(() => {
    const token = getTokenFromCookie()
    const timer = setTimeout(() => {
      setUser(token ? decodeToken(token) : null)
    }, 0)
    return () => clearTimeout(timer)
  }, [])
  return user
}
