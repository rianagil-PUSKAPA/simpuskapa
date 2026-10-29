import { Prisma, PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker'

export async function seedPartner(prisma: PrismaClient) {
  for (let x = 0; x < 10; x++) {
    await prisma.partners.create({
      data: {
        code: faker.datatype.hexadecimal({ length: 5, case: 'upper' }),
        name: faker.company.name(),
      },
    })
  }

  console.log('partner.seed')
}
