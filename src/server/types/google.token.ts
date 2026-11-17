export class GoogleToken {
  access_token: string
  expires_in: number
  token_type: string
  scope: string
  refresh_token: string
}

export class GoogleUserInformation {
  id: string
  email: string
  verified_email: boolean
  name: string
  picture: string
}
