import { base64url, decodeJwt, jwtVerify, SignJWT } from 'jose'

export class AppJwtPayloadShared {
  id: string
  email: string
  acl: string[]
  role: string[]
  employee_name?: string
  employee_id?: string
  avatar?: string
  pass_photo?: string
  is_active?: boolean
}

export class JwtLib {
  public static issuer = 'urn:simpuskapa:issuer'
  public static audience = 'urn:simpuskapa:audience'

  public static async generateJwtToken(payload: AppJwtPayloadShared, expiredTTL = '24h'): Promise<string> {
    const secret = base64url.decode(process.env.JWT_SECRET)

    const jwt = await new SignJWT({ payload })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer(JwtLib.issuer)
      .setAudience(JwtLib.audience)
      .setExpirationTime(expiredTTL)
      .sign(secret)

    return jwt
  }
  public static async decodeJwtToken(jwt: string): Promise<AppJwtPayloadShared> {
    const secret = base64url.decode(process.env.JWT_SECRET)

    const res = await jwtVerify(jwt, secret, {
      issuer: JwtLib.issuer,
      audience: JwtLib.audience,
    })
    return {
      id: res.payload['payload']['id'],
      email: res.payload['payload']['email'],
      acl: res.payload['payload']['acl'],
      role: res.payload['payload']['role'],
      pass_photo: res.payload['payload']['pass_photo'],
      is_active: res.payload['payload']['is_active'],
    } as AppJwtPayloadShared
  }

  public static async decodeOnly(jwt: string): Promise<AppJwtPayloadShared | null> {
    try {
      const res = await decodeJwt(jwt)
      return {
        id: res.payload['id'],
        email: res.payload['email'],
        acl: res.payload['acl'],
        avatar: res.payload['pass_photo'] || res.payload['avatar'],
        employee_name: res.payload['employee_name'],
        employee_id: res.payload['employee_id'],
        role: res.payload['role'],
        is_active: res.payload['is_active'],
      } as AppJwtPayloadShared
    } catch (e) {
      return null
    }
  }
}
