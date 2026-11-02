import { Injectable } from '@nestjs/common'
import { partners as Partner, Prisma, vendor_packages } from '@prisma/client'
import { CommonPrismaClient } from '@server/common/prisma.client'

@Injectable()
export class PartnerRepository {
  constructor(private prisma: CommonPrismaClient) {}

  async create(data: Prisma.partnersUncheckedCreateInput): Promise<Partner> {
    return this.prisma.partners.create({
      data,
    })
  }

  async getAll(): Promise<Partner[] | null> {
    return this.prisma.partners.findMany()
  }

  async getByCode(code: string): Promise<Partner | null> {
    return this.prisma.partners.findFirst({
      where: {
        code: code,
      },
    })
  }
}
