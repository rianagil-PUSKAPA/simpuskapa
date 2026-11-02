import { Injectable } from '@nestjs/common'
import { employee as Employee, employee_contracts, Prisma, users } from '@prisma/client'

import { CommonPrismaClient } from '@server/common/prisma.client'

@Injectable()
export class EmployeeRepository {
  constructor(private prisma: CommonPrismaClient) {}

  async createEmployee(data: Prisma.employeeUncheckedCreateInput): Promise<Employee> {
    return this.prisma.employee.create({
      data,
    })
  }

  async softDeleteEmployee(id: string, name: string): Promise<Employee> {
    return this.prisma.employee.update({
      where: {
        id: id,
      },
      data: {
        full_name: name,
        deleted_at: new Date().toISOString(),
      },
    })
  }

  async getEmployeeByEmployeeId(Id: string): Promise<Array<Employee & { user: users }> | null> {
    return this.prisma.employee.findMany({
      where: { id: Id },
      take: 1,
      include: {
        user: {},
      },
    })
  }

  async getEmployeeByUserId(userId: string): Promise<Array<Employee & { user: users }> | null> {
    return this.prisma.employee.findMany({
      where: { user_id: userId },
      take: 1,
      include: {
        user: {},
      },
    })
  }
  async getEmployeeByJabatan(jabatan: string): Promise<Employee | null> {
    return this.prisma.employee.findFirst({
      where: {
        deleted_at: null,
        employee_contracts: {
          every: {
            position: jabatan,
          },
        },
      },
      include: {
        employee_contracts: {
          orderBy: {
            contract_started: 'desc',
          },
          take: 1,
        },
        user: {
          select: {
            email: true,
            avatar: true,
          },
        },
      },
    })
  }

  async getEmployeeByDepartment(
    jabatan: string,
  ): Promise<Array<Employee & { user: Pick<users, 'email' | 'avatar'> }> | null> {
    return this.prisma.employee.findMany({
      where: {
        deleted_at: null,
        employee_contracts: {
          every: {
            department: jabatan,
          },
        },
      },
      include: {
        employee_contracts: {
          orderBy: {
            contract_started: 'desc',
          },
          take: 1,
        },
        user: {
          select: {
            email: true,
            avatar: true,
          },
        },
      },
    })
  }
  async getEmployeeByIdSimple(id: string): Promise<Employee | null> {
    return this.prisma.employee.findFirst({
      where: { id: id },
    })
  }

  async getEmployeeById(id: string): Promise<Prisma.employeeGetPayload<{
    include: { employee_contracts: true; user: true }
  }> | null> {
    if (id == null) {
      return null
    }
    return this.prisma.employee.findFirst({
      where: {
        id: id,
      },
      include: {
        employee_contracts: {
          orderBy: {
            contract_started: 'desc',
          },
          take: 1,
        },
        user: {},
      },
    })
  }

  async getAllEmployee(): Promise<
    | Prisma.employeeGetPayload<{
        include: { employee_contracts: true; user: true }
      }>[]
    | null
  > {
    return this.prisma.employee.findMany({
      where: {
        deleted_at: null,
        is_lock: true,
      },
      orderBy: {
        created_at: 'desc',
      },
      include: {
        employee_contracts: {
          orderBy: {
            contract_started: 'desc',
          },
          take: 1,
        },
        user: {},
      },
    })
  }

  async getAllEmployeeNotCompletedForm(): Promise<Employee[] | null> {
    return this.prisma.employee.findMany({
      where: {
        deleted_at: null,
        is_lock: false,
      },
      orderBy: {
        created_at: 'desc',
      },
      include: {
        employee_contracts: {
          orderBy: {
            contract_started: 'desc',
          },
          take: 1,
        },
        user: {
          select: {
            status: true,
            role: true,
            email: true,
            avatar: true,
          },
        },
      },
    })
  }

  async updateEmployeeById(id: string, data: Prisma.employeeUncheckedUpdateInput): Promise<Employee> {
    return this.prisma.employee.update({
      where: {
        id: id,
      },
      data,
    })
  }

  async deleteEmployeeById(id: string): Promise<Employee> {
    return this.prisma.employee.update({
      where: { id: id },
      data: { deleted_at: new Date() },
    })
  }
}
