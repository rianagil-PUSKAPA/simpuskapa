import { PairJWTResponse, UserLoginRequest } from 'sdk/api'
import { identityApi } from './apiRequestHelper'

export async function loginArbitary(email: string): Promise<PairJWTResponse> {
  const result = await identityApi.userControllerLoginUserArbitary({
    email: email,
    password: 'xxx',
  } as UserLoginRequest)

  return result.data
}
