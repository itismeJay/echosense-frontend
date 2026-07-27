import { NextRequest, NextResponse } from 'next/server'

const ADMIN_ONLY_PATHS = ['/settings', '/users', '/admin']
const COUNSELOR_PATHS = ['/counselor', '/analytics']

function getRoleFromToken(token: string): string | null {
  try {
    const base64url = token.split('.')[1]
    const normalized = base64url.replace(/-/g, '+').replace(/_/g, '/')
    const base64 = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    const payload = JSON.parse(atob(base64)) as { role?: unknown }
    return typeof payload.role === 'string' ? payload.role : null
  } catch {
    return null
  }
}

export function proxy(request: NextRequest) {
  const token = request.cookies.get('echosense_token')?.value
  const { pathname } = request.nextUrl
  const isLogin = pathname === '/login'

  if (isLogin && token) return NextResponse.redirect(new URL('/dashboard', request.url))
  if (!isLogin && !token) return NextResponse.redirect(new URL('/login', request.url))

  if (token && ADMIN_ONLY_PATHS.some(p => pathname === p || pathname.startsWith(`${p}/`))) {
    const role = getRoleFromToken(token)
    if (role !== 'admin') return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (token && COUNSELOR_PATHS.some(p => pathname === p || pathname.startsWith(`${p}/`))) {
    const role = getRoleFromToken(token)
    if (role !== 'admin' && role !== 'counselor') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/alerts/:path*',
    '/analytics/:path*',
    '/logs/:path*',
    '/profile/:path*',
    '/counselor/:path*',
    '/admin/:path*',
    '/settings/:path*',
    '/users/:path*',
    '/login',
  ],
}
