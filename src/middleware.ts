// middleware.ts (For frontend purpose)

import { NextRequest, NextResponse } from 'next/server'
import { JwtLib } from '@/shared/jwt.lib'
import { MAIN_URL_BE } from './utils/constant'

export async function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth_token')?.value
  const refreshToken = request.cookies.get('refresh_token')?.value

  // console.log('middleware running')

  if (authToken && refreshToken) {
    try {
      // Check token validity
      const claims = await JwtLib.decodeJwtToken(authToken)
      console.log('JWT VERIFIED', claims)
      if (!claims.is_active) {
        const response = NextResponse.redirect(new URL('/inactive-user', request.url))
        response.cookies.delete('auth_token')
        response.cookies.delete('refresh_token')
        return response
      }
      return NextResponse.next()
    } catch (error) {
      console.error('JWT VERIFY FAILED')
      console.error(error)
      try {
        const refresTokenReq = await fetch(`${MAIN_URL_BE}/v1/auth/refresh?refresh_token=${refreshToken}`, {
          method: 'GET',
        })
        const res = await refresTokenReq.json()
        console.log('REFRESH RESPONSE')
        console.log(JSON.stringify(res, null, 2))
        const response = NextResponse.next()
        const authTokenCookie = {
          name: 'auth_token',
          value: res?.data?.auth_token,
          httpOnly: false,
        }
        const refreshTokenCookie = {
          name: 'refresh_token',
          value: res?.data?.refresh_token,
          httpOnly: true,
        }
        response.cookies.set(authTokenCookie)
        response.cookies.set(refreshTokenCookie)
        response.cookies.set({
          name: 'refreshed_at',
          value: Date.now().toString(),
        })
        // console.log('REFRESHED TOKEN')
        request.cookies.set(authTokenCookie)
        request.cookies.set(refreshTokenCookie)
        return response
      } catch (error) {
        const response = NextResponse.redirect(new URL('/login', request.url))
        response.cookies.delete('auth_token')
        response.cookies.delete('refresh_token')
        return response
      }
    }
  } else {
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('auth_token')
    response.cookies.delete('refresh_token')
    return response
  }
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: '/dashboard/:path*',
}
