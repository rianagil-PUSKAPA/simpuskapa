import { Injectable } from '@nestjs/common'
import { PartnerRepository } from '../repositories/partner.repository'
import { Partner } from '../types/partner.dto'

@Injectable()
export class PartnerService {
  constructor(private partnerRepo: PartnerRepository) {}

  async createPartner(name: string): Promise<string> {
    const actualName = name
    name = name.replace(/[^a-zA-Z0-9]/g, '')
    let code: string = name.at(0)
    code += name.at(Math.floor(name.length - 1) / 2)
    code += name.at(name.length - 1)

    const created = await this.partnerRepo.create({
      code: code.replaceAll(' ', '').toUpperCase(),
      name: actualName,
    })

    return created.code
  }

  async getPartnersAll(): Promise<Partner[]> {
    return await this.partnerRepo.getAll()
  }
}
