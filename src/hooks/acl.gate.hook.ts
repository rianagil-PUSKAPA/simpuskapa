import { JwtLib } from '@/shared/jwt.lib'
import { getCookie } from 'typescript-cookie'

// acl will decoded from cookie 'auth_token'
const useAccessControlGate = (acl: string, redirect = '/') => {
  while (true) {
    if (typeof window !== 'undefined') {
      const authToken = getCookie('auth_token')

      if (!authToken) {
        window.document.location.href = redirect
      }

      JwtLib.decodeOnly(authToken)
        .then((claim) => {
          if (!claim) {
            window.document.location.href = redirect
          }

          const userAcls: string[] = claim['acl']
          if (userAcls.find((l) => l == acl) == undefined) {
            window.document.location.href = redirect
          }
        })
        .catch(() => {
          window.document.location.href = redirect
        })
      break
    } else {
      break
    }
  }
}

export default useAccessControlGate
