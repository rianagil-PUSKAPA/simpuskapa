import { JwtLib } from '@/shared/jwt.lib'
import { HttpStatus, Inject, Injectable, NestMiddleware } from '@nestjs/common'
import { HttpBaseResponse } from '@server/types/base.response.dto'
import { NextFunction, Request, Response } from 'express'
import { CommonRedisClient } from '../common/memached.client'

@Injectable()
export class AuthJwtMiddleware implements NestMiddleware {
  constructor(@Inject(CommonRedisClient) private cacheManager: CommonRedisClient) {}

  use(req: Request, res: Response, next: NextFunction) {
    const publicRoutes = [
      '/v1/auth/login',
      '/v1/auth/login-arbitary',
      '/v1/auth/oauth/google',
      '/v1/auth/oauth/google/callback',
      '/v1/users/forgot-password',
      '/complete-forgot-password',
    ]

    if (publicRoutes.includes(req.path)) {
      return next()
    }

    if (!req.headers['authorization']) {
      return res.status(HttpStatus.UNAUTHORIZED).send(new HttpBaseResponse('TOKEN UNAUTHORIZED', null))
    }

    const jwtToken = req.headers['authorization'].slice(7)

    JwtLib.decodeJwtToken(jwtToken)
      .then((claim) => {
        this.cacheManager.cacheClient
          .get(`session:${claim.id}`)
          .then((session) => {
            if (!claim.is_active || session == undefined) {
              return res.status(HttpStatus.UNAUTHORIZED).send(new HttpBaseResponse('UNAUTHORIZED SESSION USER', null))
            }

            req.headers['authorization'] = JSON.stringify(claim)
            next()
          })
          .catch(() => {
            return res.status(HttpStatus.UNAUTHORIZED).send(new HttpBaseResponse('UNAUTHORIZED SESSION USER', null))
          })
      })
      .catch(() => {
        return res.status(HttpStatus.UNAUTHORIZED).send(new HttpBaseResponse('TOKEN UNAUTHORIZED', null))
      })
  }
}
