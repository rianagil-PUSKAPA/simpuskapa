import { Injectable } from '@nestjs/common'
import { employee_contracts as EmployeeContract, Prisma } from '@prisma/client'

import { CommonPrismaClient } from '@server/common/prisma.client'

@Injectable()
export class EmployeeContractRepository {
  constructor(private prisma: CommonPrismaClient) {}

  async getContractAllEmployee(): Promise<EmployeeContract[] | null> {
    return this.prisma.$queryRaw`
      SELECT 
      ec.*,
      (SELECT JSON_OBJECT(
        'id', emp2.id, 
        'full_name', emp2.full_name, 
        'pass_photo', emp2.pass_photo_path, 
        'avatar', usr2.avatar,
        'email', usr2.email
      ) FROM employee emp2 JOIN users usr2 ON usr2.id = emp2.user_id WHERE emp2.id = ec.employee_id LIMIT 1 ) as emp_detail,
      ee.full_name as spv_name, 
      ee.id as spv_id , 
      (SELECT avatar FROM users WHERE id = ee.user_id) as spv_avatar 
      FROM employee_contracts ec 
      LEFT OUTER JOIN employee ee ON ec.supervisor_id = ee.id 
      ORDER BY ec.contract_started DESC`
  }

  async getContractAllEmployeeFilterSPV(spvId: string): Promise<EmployeeContract[] | null> {
    return this.prisma.$queryRaw`
      SELECT 
      ec.*,
      (SELECT JSON_OBJECT(
        'id', emp2.id, 
        'full_name', emp2.full_name, 
        'pass_photo', emp2.pass_photo_path, 
        'avatar', usr2.avatar,
        'email', usr2.email
      ) FROM employee emp2 JOIN users usr2 ON usr2.id = emp2.user_id WHERE emp2.id = ec.employee_id LIMIT 1 ) as emp_detail,
      ee.full_name as spv_name, 
      ee.id as spv_id , 
      (SELECT avatar FROM users WHERE id = ee.user_id) as spv_avatar 
      FROM employee_contracts ec 
      LEFT OUTER JOIN employee ee ON ec.supervisor_id = ee.id 
      WHERE ec.supervisor_id = ${spvId}
      ORDER BY ec.contract_started DESC`
  }

  async getContractByEmployeeById(employeeId: string): Promise<EmployeeContract[] | null> {
    return this.prisma
      .$queryRaw`SELECT ec.*, ee.full_name as spv_name, ee.id as spv_id , (SELECT avatar FROM users WHERE id = ee.user_id) as spv_avatar FROM employee_contracts ec LEFT OUTER JOIN employee ee ON ec.supervisor_id = ee.id WHERE ec.employee_id = ${employeeId} ORDER BY ec.contract_started DESC`
  }

  async deleteAllEmployeeContractByEmployeeById(employeeId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.employee_contracts.deleteMany({
      where: {
        employee_id: employeeId,
      },
    })
  }

  async createContractByEmployeeById(
    contract: Prisma.employee_contractsUncheckedCreateInput,
  ): Promise<EmployeeContract | null> {
    return this.prisma.employee_contracts.create({
      data: contract,
    })
  }
}
