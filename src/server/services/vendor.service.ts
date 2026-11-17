import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { VendorRepository } from '../repositories/vendor.repository'
import { VendorPackageRepository } from '../repositories/vendor.package.repository'
import { VendorCategoryInformation, VendorDto, VendorPackage, VendorPayment, VendorType } from '../types/vendor.dto'
import { v4 as uuidv4 } from 'uuid'
import { ServerNotFound } from '@/shared/server.errors'

@Injectable()
export class VendorService {
  constructor(private vendorRepo: VendorRepository, private vendorPackageRepository: VendorPackageRepository) {}

  async updateVendor(
    vendorInformation: Map<string, string>,
    vendorType: string,
    categoryIds: string[],
    packages: VendorPackage[],
    formState: string,
    formProgress: number,
    vendorPayment: VendorPayment,
    vendorId: string,
  ): Promise<boolean> {
    // update vendor
    const aboutVendorJson = {}
    if (vendorInformation == undefined || !vendorInformation) {
      vendorInformation = new Map<string, string>()
    }
    Object.keys(vendorInformation).forEach(function (key) {
      aboutVendorJson[key] = vendorInformation[key]
    })

    // delete all vendor category relation

    await this.vendorRepo.unAssignVendorCategory(vendorId)
    // create vendor category
    for (const category of categoryIds) {
      await this.vendorRepo.assignVendorCategory(vendorId, category)
    }
    await this.vendorRepo.updateVendor(
      {
        vendor_information: aboutVendorJson,
        form_progress: formProgress,
        form_state: formState,
        vendor_type: vendorType,
        vendor_payment: {
          bank_name: vendorPayment.bank_name,
          bank_branch: vendorPayment.bank_branch,
          bank_acc_number: vendorPayment.bank_acc_number,
          bank_acc_name: vendorPayment.bank_acc_name,
          swift_code: vendorPayment.swift_code,
        },
      },
      vendorId,
    )

    // delete packages
    await this.vendorPackageRepository.deleteVendorPackagesByVEndorId(vendorId)
    // create packages
    const packagesInput = []
    if (packages != undefined && packages.length > 0) {
      packages.forEach((v, k) => {
        packagesInput.push({
          id: uuidv4(),
          vendor_id: vendorId,
          name: v.name,
          unit: v.unit,
          price: v.price,
          currency: v.currency,
        } as Prisma.vendor_packagesUncheckedCreateInput)
      })
      await this.vendorPackageRepository.createVendorPackages(packagesInput)
    }
    return true
  }

  async createVendor(
    vendorType: string,
    vendorInformation: Map<string, string>,
    categoryIds: string[],
    packages: VendorPackage[],
    formState: string,
    formProgress: number,
    vendorPayment: VendorPayment,
    createdBy?: string,
  ): Promise<string> {
    console.log(vendorType)
    const aboutVendorJson = {}

    Object.keys(vendorInformation).forEach(function (key) {
      aboutVendorJson[key] = vendorInformation[key]
    })
    const vendorCreated = await this.vendorRepo.createVendor({
      vendor_information: aboutVendorJson as Prisma.InputJsonValue,
      form_state: formState,
      form_progress: formProgress,
      vendor_type: vendorType,
      created_by: createdBy,
      vendor_payment: {
        bank_name: vendorPayment.bank_name,
        bank_branch: vendorPayment.bank_branch,
        bank_acc_number: vendorPayment.bank_acc_number,
        bank_acc_name: vendorPayment.bank_acc_name,
        swift_code: vendorPayment.swift_code,
      },
    })

    // create vendor category
    for (const category of categoryIds) {
      await this.vendorRepo.assignVendorCategory(vendorCreated.id, category)
    }

    const packagesInput = []
    packages.forEach((v, k) => {
      packagesInput.push({
        id: uuidv4(),
        vendor_id: vendorCreated.id,
        name: v.name,
        unit: v.unit,
        price: v.price,
        currency: v.currency,
      } as Prisma.vendor_packagesUncheckedCreateInput)
    })
    await this.vendorPackageRepository.createVendorPackages(packagesInput)

    return vendorCreated.id
  }

  async getVendorTypes(): Promise<VendorType[]> {
    const vendorTypes = await this.vendorRepo.getAllVendorsType()

    return vendorTypes
  }

  async getVendorTypeById(id: string): Promise<VendorType> {
    return await this.vendorRepo.getVendorTypeById(id)
  }

  async getVendorCategories(vendorTypeId: string): Promise<VendorCategoryInformation[]> {
    const vendorCategories = await this.vendorRepo.getVendorCategoriesByVendorType(vendorTypeId)

    return vendorCategories
  }

  async getVendorCategoryAttachmentFields(categoryId: string): Promise<string[]> {
    const category = await this.vendorRepo.getVendorCategoryAttachmentFieldsByCategoryId(categoryId)
    console.log(category)
    return category.attachment_list as string[]
  }

  async getVendors(
    page: number,
    perPage: number,
    order: string,
    vendorType: string,
    categoryIds?: string,
  ): Promise<VendorDto[]> {
    page--
    const limit = perPage
    const offset = page * limit
    const orderKey = order.split('|')[0] ?? ''
    const orderMode = order.split('|')[1] ?? ''

    const categoriesFilter = categoryIds == '' ? [] : categoryIds?.split(',')

    let vendors = await this.vendorRepo.getVendors(0, 1000000, orderKey, orderMode, vendorType)
    console.log('TOTAL VENDOR', vendors.length)

    if (categoriesFilter?.length > 0) {
      vendors = vendors.filter((vendor) => {
        for (const vendorCategory of vendor.vendor_categories) {
          if (categoriesFilter.indexOf(vendorCategory.vendor_category_info_id) > -1) {
            return true
          }
        }
      })
    }

    console.log(vendors)

    return vendors as unknown as VendorDto[]
  }

  async getVendorById(id: string): Promise<VendorDto> {
    const vendors = await this.vendorRepo.getVendorById(id)
    console.log(vendors)

    return vendors as unknown as VendorDto
  }

  async getVendorByCreatedById(logedInUserId?: string): Promise<VendorDto | null> {
    const vendors = await this.vendorRepo.getVendorCreatedBy(logedInUserId)
    console.log(vendors)

    if (!vendors) {
      return null
    }

    return vendors as unknown as VendorDto
  }

  async softDeleteVendor(vendor_id?: string): Promise<VendorDto | null> {
    await this.vendorRepo.updateVendor({ deleted_at: new Date() }, vendor_id)
    return null
  }

  async updateVendorPayment(id: string, payment: VendorPayment): Promise<VendorCategoryInformation[]> {
    const vendorCategories = await this.vendorRepo.updateVendor(
      {
        vendor_payment: JSON.stringify(payment),
      },
      id,
    )

    return vendorCategories
  }

  async updateAboutVendor(id: string, about: Map<string, string>): Promise<VendorCategoryInformation[]> {
    const vendorCategories = await this.vendorRepo.updateVendor(
      {
        vendor_information: JSON.stringify(about),
      },
      id,
    )

    return vendorCategories
  }
}
