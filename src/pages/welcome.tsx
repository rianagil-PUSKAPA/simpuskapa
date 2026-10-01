import Cookies from 'cookies'
import { GetServerSideProps } from 'next'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { MAIN_URL_BE } from '@/utils/constant'

const Welcome = ({ auth_token, refresh_token }) => {
  const router = useRouter()

  useEffect(() => {
    async function loadProfile() {
      const res = await fetch(`${MAIN_URL_BE}/v1/users/me`, {
        headers: {
          Authorization: `Bearer ${auth_token}`,
        },
      })

      const data = await res.json()

      if (data.must_change_password) {
        router.replace('/change-password')
      } else {
        router.replace('/dashboard')
      }
    }

    if (auth_token) {
      loadProfile()
    }
  }, [auth_token])

  return null
}

export default Welcome

export const getServerSideProps: GetServerSideProps = async (context) => {
  const cookies = new Cookies(context.req, context.res)

  const auth_token = context.query.auth_token
  const refresh_token = context.query.refresh_token

  cookies.set('auth_token', auth_token, {
    httpOnly: false,
  })

  cookies.set('refresh_token', refresh_token)

  return {
    props: {
      auth_token,
      refresh_token,
    },
  }
}
