import { Injectable } from '@nestjs/common'
import { vendor as Vendor, vendor_category_information, Prisma, vendor_packages, vendor_type } from '@prisma/client'
import { CommonPrismaClient } from '@server/common/prisma.client'

@Injectable()
export class VendorRepository {
  constructor(private prisma: CommonPrismaClient) {}

  async createVendor(data: Prisma.vendorUncheckedCreateInput): Promise<Vendor> {
    return this.prisma.vendor.create({
      data,
    })
  }

  async assignVendorCategory(vendorId: string, categoryId: string): Promise<any> {
    return this.prisma.vendor_categories.create({
      data: {
        vendor_id: vendorId,
        vendor_category_info_id: categoryId,
      } as Prisma.vendor_categoriesUncheckedCreateInput,
    })
  }

  async unAssignVendorCategory(vendorId: string): Promise<any> {
    return this.prisma.vendor_categories.deleteMany({
      where: {
        vendor_id: vendorId,
      },
    } as Prisma.vendor_categoriesDeleteManyArgs)
  }

  async updateVendor(data: Prisma.vendorUncheckedUpdateInput, vendorId: string): Promise<any> {
    return this.prisma.vendor.update({
      data: data,
      where: {
        id: vendorId,
      },
    })
  }

  async getAllVendors(): Promise<Vendor[] | null> {
    return this.prisma.vendor.findMany()
  }

  async getAllVendorsType(): Promise<
    Array<
      vendor_type & {
        vendor_category_information: vendor_category_information[]
      }
    >
  > {
    return this.prisma.vendor_type.findMany({
      include: { vendor_category_information: {} },
    })
  }

  async getVendorTypeById(id: string): Promise<
    vendor_type & {
      vendor_category_information: vendor_category_information[]
    }
  > {
    return this.prisma.vendor_type.findFirst({
      where: {
        id: id,
      },
      include: { vendor_category_information: {} },
    })
  }

  async getVendorCategoriesByVendorType(vendorTypeId: string): Promise<vendor_category_information[]> {
    return this.prisma.vendor_category_information.findMany({
      where: {
        vendor_type_id: vendorTypeId,
      },
      include: {
        vendor_type: {
          select: {
            name: true,
            id: true,
          },
        },
      },
    })
  }

  async getCategoryById(categoryId: string): Promise<vendor_category_information & { vendor_type: vendor_type }> {
    return this.prisma.vendor_category_information.findFirst({
      where: {
        id: categoryId,
      },
      include: {
        vendor_type: {},
      },
    })
  }

  async getVendorCategoryAttachmentFieldsByCategoryId(
    categoryId: string,
  ): Promise<vendor_category_information & { vendor_type: vendor_type }> {
    return this.prisma.vendor_category_information.findFirst({
      where: {
        id: categoryId,
      },
      include: {
        vendor_type: {},
      },
    })
  }

  async getVendors(
    offset: number,
    limit: number,
    orderKey: string,
    orderMode: string,
    vendorType: string,
  ): Promise<any[] | null> {
    const q = {
      take: Number(limit),
      skip: Number(offset),
      include: {
        vendor_packages: {},
        vendor_categories: {
          include: {
            vendor_category_info: {
              include: {
                vendor_type: {},
              },
            },
          },
        },
      } as Prisma.vendorInclude,
    }

    if (orderKey != '' && orderMode != '') {
      q['orderBy'] = {
        orderKey: orderMode,
      }
    }

    if (vendorType != '') {
      q['where'] = {
        deleted_at: null,
        vendor_categories: {
          every: {
            vendor_category_info: {
              vendor_type: {
                name: vendorType,
              },
            },
          },
        },
      } as Prisma.vendorWhereInput
    }

    return this.prisma.vendor.findMany(q)
  }

  async getVendorById(id: string): Promise<Vendor | null> {
    return this.prisma.vendor.findFirst({
      where: {
        id: id,
      },
      include: {
        vendor_packages: {},
        vendor_categories: {
          include: {
            vendor_category_info: {
              include: {
                vendor_type: {},
              },
            },
          },
        },
      },
    })
  }

  async getVendorCreatedBy(createdByUserId: string): Promise<Vendor | null> {
    return this.prisma.vendor.findFirst({
      where: {
        created_by: createdByUserId,
        form_progress: {
          lt: 100,
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      include: {
        vendor_packages: {},
        vendor_categories: {
          include: {
            vendor_category_info: {
              include: {
                vendor_type: {},
              },
            },
          },
        },
      },
    })
  }
}
