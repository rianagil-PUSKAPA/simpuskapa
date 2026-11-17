import { LD } from '@/i18n/base.language.definition'
import { Language } from '@/i18n/language'
import { ServerBadRequest, ServerNotFound, ServerUnauthorized, ServerValidationError } from '@/shared/server.errors'
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { HttpBaseResponse } from '@server/types/base.response.dto'
import { Response } from 'express'
import { BaseExceptionFilter } from '@nestjs/core'
import * as Sentry from '@sentry/node'

@Catch(HttpException)
export class GlobalExceptionFilter implements ExceptionFilter {
  public catch(err: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse() as Response
    Sentry.captureException(err)

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(new HttpBaseResponse(err.message, err))
  }
}

@Catch(ServerValidationError)
export class ValidationErrorExceptionFilter implements ExceptionFilter<ServerValidationError> {
  private lang = Language.use()
  public catch(exception, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse() as Response
    response
      .status(HttpStatus.UNPROCESSABLE_ENTITY)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.VALIDATION_ERROR), JSON.parse(exception.message)))
  }
}
@Catch(ServerBadRequest)
export class BadRequestExceptionFilter implements ExceptionFilter<ServerBadRequest> {
  private lang = Language.use()
  public catch(exception: ServerBadRequest, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse() as Response
    Sentry.captureException(exception)
    response
      .status(HttpStatus.BAD_REQUEST)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.BAD_REQUEST_ERROR), exception.message))
  }
}

@Catch(ServerNotFound)
export class NotFoundExceptionFilter implements ExceptionFilter<ServerNotFound> {
  private lang = Language.use()
  public catch(exception, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse() as Response
    response
      .status(HttpStatus.NOT_FOUND)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.BAD_NOT_FOUND), exception.message))
  }
}

@Catch(ServerUnauthorized)
export class UnauthorizedExceptionFilter implements ExceptionFilter<ServerUnauthorized> {
  private lang = Language.use()
  public catch(exception, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse() as Response
    response
      .status(HttpStatus.UNAUTHORIZED)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_UNAUTHORIZED), exception.message))
  }
}

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter<Prisma.PrismaClientKnownRequestError> {
  private lang = Language.use()
  public catch(err, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse() as Response
    Sentry.captureException(err)

    return response.status(HttpStatus.BAD_REQUEST).send(new HttpBaseResponse(err, null))

    let errMsg = 'Unknown Error'
    switch (err.code) {
      case 'P2002':
        errMsg = `Duplicate field value: ${err.meta.target}`
        return response.status(HttpStatus.BAD_REQUEST).send(new HttpBaseResponse(errMsg, null))
      case 'P2014':
        errMsg = `Invalid ID: ${err.meta.target}`
        return response.status(HttpStatus.BAD_REQUEST).send(new HttpBaseResponse(errMsg, null))
      case 'P2003':
        errMsg = `Invalid input data: ${err.meta.target}`
        return response.status(HttpStatus.BAD_REQUEST).send(new HttpBaseResponse(errMsg, null))
      case 'P2025':
        errMsg = `One or more records that were required but not found.: ${err.meta.target}`
        return response.status(HttpStatus.BAD_REQUEST).send(new HttpBaseResponse(errMsg, null))
      default:
        errMsg = `Something went wrong: ${err.code}`
        return response.status(HttpStatus.BAD_REQUEST).send(new HttpBaseResponse(errMsg, null))
    }
  }
}

export function getAppExceptionFilters(): ExceptionFilter<any>[] {
  return [
    new ValidationErrorExceptionFilter(),
    new NotFoundExceptionFilter(),
    new BadRequestExceptionFilter(),
    new PrismaExceptionFilter(),
    new UnauthorizedExceptionFilter(),
  ]
}
