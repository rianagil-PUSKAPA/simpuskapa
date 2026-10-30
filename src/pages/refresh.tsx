import { MAIN_URL_BE } from '@/utils/constant'
import Cookies from 'cookies'
import { GetServerSideProps } from 'next'

const RefreshAuth = () => {
  return <>Refreshing Auth Token........</>
}

export default RefreshAuth

// Only allow redirecting back to a same-origin URL. `referer` is client-controlled,
// so an unchecked redirect is an open-redirect vuln. Fall back to /dashboard.
function getSafeRedirect(referer: string | undefined, host: string | undefined): string {
  if (!referer) return '/dashboard'
  try {
    const url = new URL(referer)
    if (host && url.host === host) {
      return url.pathname + url.search
    }
  } catch {
    // malformed referer
  }
  return '/dashboard'
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = new Cookies(context.req, context.res)

    const refreshToken = context.req.cookies.refresh_token

    const refresTokenReq = await fetch(`${MAIN_URL_BE}/v1/auth/refresh?refresh_token=${refreshToken}`, {
      method: 'GET',
    })
    const res = await refresTokenReq.json()
    const newAuthToken = res.data.auth_token
    const newRefreshToken = res.data.refresh_token

    cookies.set('auth_token', newAuthToken, {
      httpOnly: false,
    })
    cookies.set('refresh_token', newRefreshToken)

    if (newAuthToken && newRefreshToken) {
      return {
        redirect: {
          destination: getSafeRedirect(context.req.headers.referer, context.req.headers.host),
          permanent: false,
        },
      }
    } else {
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      }
    }
  } catch (e) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    }
  }
}
