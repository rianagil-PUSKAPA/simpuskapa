import { AppJwtPayloadShared, JwtLib } from '@/shared/jwt.lib'
import { Configuration } from '@sdk'
import axios from 'axios'
import { getCookie } from 'typescript-cookie'
import { MAIN_URL_BE } from './constant'

export const createAPIConfig = (authToken?: string) => {
  let localCookie = null

  if (typeof window !== 'undefined') {
    localCookie = getCookie('auth_token')
  }

  authToken = authToken ?? localCookie

  const config = new Configuration({
    basePath: MAIN_URL_BE,
    accessToken: authToken,
  })

  return config
}

export const getUserInfo = async (authToken?: string): Promise<AppJwtPayloadShared> => {
  authToken = authToken ?? getCookie('auth_token')
  const claim = await JwtLib.decodeOnly(authToken)
  return claim
}

export const createAxiosInstance = () => {
  const api = axios.create({
    baseURL: MAIN_URL_BE,
  })
  api.interceptors.response.use(
    (response) => {
      // console.log('USING INTERCEPTOR OK')
      return response
    },
    (error) => {
      // console.log('USING INTERCEPTOR ERROR')
      if (error?.response?.status === 401) {
        // set oken empty or invalid
        // window.document.write('Refresh Authentication Session')
        window.location.href = '/refresh'
      }
      return error
    },
  )
  return api
}
