import { ServerUnauthorized } from '@/shared/server.errors'
import { Request } from 'express'

export class SessionContext {
  public userId: string
  public acls: string[]
}

export class ApplicationContext {
  public contexts: Map<string, any>
  public session: SessionContext

  public static getContext(request: Request): ApplicationContext {
    const claims = request.headers['authorization']
    if (!JSON.parse(claims)['acl']) {
      throw new ServerUnauthorized()
    } else {
      return {
        session: {
          userId: JSON.parse(claims)['id'],
          acls: JSON.parse(claims)['acl'],
        } as SessionContext,
      } as ApplicationContext
    }
  }
}

export class AclCheckResult {
  public valid: boolean
  public session: SessionContext
}

export class AclGate {
  public static check(
    ctx: ApplicationContext,
    hasAcl: string,
    moreGate?: (session: SessionContext) => boolean | null,
  ): AclCheckResult {
    // first step acl gate
    if (ctx.session.acls.find((l) => l == hasAcl) == undefined) {
      throw new ServerUnauthorized()
    }
    const aclResult = {
      valid: true,
      session: ctx.session,
    } as AclCheckResult
    if (!moreGate) {
      aclResult.valid = true
      return aclResult
    }
    // second step acl gate
    if (moreGate(ctx.session)) {
      aclResult.valid = true
      return aclResult
    }
    aclResult.valid = false
    return aclResult
  }
}
