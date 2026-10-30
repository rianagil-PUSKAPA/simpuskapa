import { Injectable } from '@nestjs/common'
import { vendor_packages as VendorPackage, Prisma } from '@prisma/client'

import { CommonPrismaClient } from '@server/common/prisma.client'

@Injectable()
export class VendorPackageRepository {
  constructor(private prisma: CommonPrismaClient) {}

  async createVendorPackages(data: Prisma.vendor_packagesCreateManyInput[]): Promise<any> {
    return this.prisma.vendor_packages.createMany({
      skipDuplicates: true,
      data: data,
    })
  }

  async getVendorPackages(vendorId: string): Promise<VendorPackage[] | null> {
    return this.prisma.vendor_packages.findMany({
      where: {
        vendor_id: vendorId,
      },
    })
  }

  async deleteVendorPackagesByVEndorId(vendorId: string): Promise<any> {
    return this.prisma.vendor_packages.deleteMany({
      where: {
        vendor_id: vendorId,
      },
    })
  }
}
