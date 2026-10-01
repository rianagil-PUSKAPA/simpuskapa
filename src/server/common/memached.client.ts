import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common'
import { createClient, RedisClientType } from 'redis'

@Injectable()
export class CommonRedisClient implements OnModuleInit {
  public cacheClient: RedisClientType<any, any, any>

  async onModuleInit() {
    const client = await createClient({ url: 'redis://:@localhost:6379' })
      .on('error', (err) => console.log('Redis Client Error', err))
      .connect()
    this.cacheClient = client
  }
  async enableShutdownHooks(app: INestApplication) {
    this.cacheClient.disconnect()
    await app.close()
  }
}
