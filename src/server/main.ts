import { ServerValidationError } from '@/shared/server.errors'
import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { json, urlencoded } from 'express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { init } from '@sentry/node'
import { AppModule } from '@server/app.module'
import {
  BadRequestExceptionFilter,
  NotFoundExceptionFilter,
  PrismaExceptionFilter,
  UnauthorizedExceptionFilter,
  ValidationErrorExceptionFilter,
} from './common/catch.response'
import * as Sentry from '@sentry/node'
import { apiReference } from '@scalar/nestjs-api-reference'

async function bootstrap() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
  })
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  })

  app.use(json({ limit: '10mb' }))
  app.use(urlencoded({ extended: true, limit: '10mb' }))

  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory(errors) {
        throw new ServerValidationError(JSON.stringify(errors[0].constraints))
      },
    }),
  )
  app.useGlobalFilters(
    new ValidationErrorExceptionFilter(),
    new NotFoundExceptionFilter(),
    new BadRequestExceptionFilter(),
    new PrismaExceptionFilter(),
    new UnauthorizedExceptionFilter(),
  )
  const config = new DocumentBuilder()
    .setTitle('SIMPUSKAPA API')
    .setDescription('SIMPUSKAPA API description')
    .setVersion('1.0')
    .addTag('identity')
    .addTag('employee')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('swagger', app, document)
  app.enableCors({
    origin: process.env.ALLOW_CLIENT.split('|'),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  })

  init({
    dsn: 'https://d6a11dcdc42f4151a4a870fd19b27744@o4504946693111808.ingest.sentry.io/4505106489868288',
    tracesSampleRate: 1.0,
  })

  app.use(
    '/docs',
    apiReference({
      spec: {
        url: '/swagger-json',
      },
    }),
  )

  await app.listen(process.env.PORT || 8000)
}
bootstrap()
