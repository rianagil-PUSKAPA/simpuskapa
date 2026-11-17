import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { VendorRepository } from '../repositories/vendor.repository'
import { VendorPackageRepository } from '../repositories/vendor.package.repository'
import { VendorDto, VendorPackage, VendorPayment } from '../types/vendor.dto'
import { v4 as uuidv4 } from 'uuid'
import { ObjectStorageHelpers } from 'src/shared/file.system'

@Injectable()
export class FileService {
  constructor(private vendorRepo: VendorRepository, private vendorPackageRepository: VendorPackageRepository) {}

  async updateVendor(buckerName: string, fileName: string, clearPath: string): Promise<boolean> {
    // delete file
    await ObjectStorageHelpers.deleteFile(buckerName, fileName)

    // clear path

    return false
  }
}
