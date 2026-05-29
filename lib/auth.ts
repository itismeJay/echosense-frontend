"use client";

import { useState, useEffect } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export type AuthUser = {
  id: string
  email: string
  role: 'admin' | 'user'
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
    const payload = JSON.parse(atob(token.split('.')[1]))
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
    })
  } catch {
    throw new Error('Unable to reach server')
  }
  if (res.status === 401) throw new Error('Invalid credentials')
  if (!res.ok) throw new Error('Unable to reach server')
  const data = await res.json()
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
    setUser(token ? decodeToken(token) : null)
  }, [])
  return user
}
