import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class CommonPrismaClient extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      log: ['error'],
      errorFormat: 'pretty',
    })
  }
  async onModuleInit() {
    await this.$connect()
  }

  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit', async () => {
      await app.close()
    })
  }
}
