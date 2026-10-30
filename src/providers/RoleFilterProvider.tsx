import {
  AddNewEmployeeData,
  ViewEmployeeDetailAll,
  ViewEmployeeDetailSelf,
  ViewEmployeeDetailSubordinate,
  ViewEmployeeListAll,
  ViewEmployeeListSubordinate,
} from '@/types/user-management'
import { ROLE_FEATURES } from '@/utils/constant'
import { decodeJwt } from 'jose'
import { useEffect, useState } from 'react'
import { getCookie } from 'typescript-cookie'

type Props = {
  children: JSX.Element
} & (
  | AddNewEmployeeData
  | ViewEmployeeListAll
  | ViewEmployeeListSubordinate
  | ViewEmployeeDetailSelf
  | ViewEmployeeDetailAll
  | ViewEmployeeDetailSubordinate
)

const RoleFilterProvider = (props: Props) => {
  const { children, features } = props

  const [allow, setAllow] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authToken = getCookie('auth_token')

      if (!authToken) {
        // console.log('redirected', authToken)
        setAllow(false)
        return
      }
      const authTokenJWT = decodeJwt(authToken)
      const ROLE = authTokenJWT.payload['role']

      if (ROLE) {
        const singleFeature = ROLE_FEATURES.find((item) => item.name === features)

        if (singleFeature.roles.includes(ROLE)) {
          setAllow(true)
          return
        }

        setAllow(false)
        return
      } else {
        setAllow(false)
        return
      }
    }
  }, [])

  return allow ? children : null
}

export default RoleFilterProvider
