import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('echosense_token')?.value
  const isLogin = request.nextUrl.pathname === '/login'

  if (isLogin && token) return NextResponse.redirect(new URL('/dashboard', request.url))
  if (!isLogin && !token) return NextResponse.redirect(new URL('/login', request.url))
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/analytics/:path*',
    '/logs/:path*',
    '/settings/:path*',
    '/login',
  ],
}
