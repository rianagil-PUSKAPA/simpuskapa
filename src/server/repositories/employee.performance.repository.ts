import { Injectable } from '@nestjs/common'
import { performances as EmployeePerformance, trainings as EmployeeTraining, Prisma } from '@prisma/client'
import { CommonPrismaClient } from '@server/common/prisma.client'
import { EmployeePerformance as EmployeePerformanceDTO } from '@server/types/employee.performance.dto'

@Injectable()
export class EmployeePerformanceRepository {
  constructor(private prisma: CommonPrismaClient) {}

  async saveEmployeePerformance(data: Prisma.performancesUncheckedCreateInput): Promise<EmployeePerformance> {
    return this.prisma.performances.create({
      data,
    })
  }

  async saveEmployeeTraining(data: Prisma.trainingsUncheckedCreateInput): Promise<EmployeeTraining> {
    return this.prisma.trainings.create({
      data,
    })
  }

  async updateEmployeeTraining(id: string, data: Prisma.trainingsUncheckedUpdateInput): Promise<EmployeeTraining> {
    return this.prisma.trainings.update({
      where: {
        id: id,
      },
      data,
    })
  }

  async getEmployeePerformanceByEmployeeAndPerformanceID(
    employeeId: string,
    performanceId: string,
  ): Promise<EmployeePerformance> {
    return this.prisma.performances.findFirst({
      where: {
        id: performanceId,
        employee_id: employeeId,
        deleted_at: null,
      },
      orderBy: {
        created_at: 'desc',
      },
    })
  }

  async getEmployeePerformancesAllFilterBySpvId(spvId: string): Promise<EmployeePerformance[]> {
    return this.prisma.performances.findMany({
      where: {
        deleted_at: null,
        employee: {
          employee_contracts: {
            every: {
              supervisor_id: spvId,
            },
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      include: {
        employee: {
          include: {
            user: {},
            employee_contracts: { take: 1 },
          },
        },
      },
    })
  }

  async getEmployeePerformancesAll(): Promise<EmployeePerformance[]> {
    return this.prisma.performances.findMany({
      where: {
        deleted_at: null,
      },
      orderBy: {
        created_at: 'desc',
      },
      include: {
        employee: {
          include: {
            user: {},
            employee_contracts: { take: 1 },
          },
        },
      },
    })
  }

  async getEmployeePerformancesByEmployeeID(employeeId: string): Promise<EmployeePerformance[]> {
    return this.prisma.performances.findMany({
      where: {
        employee_id: employeeId,
        deleted_at: null,
      },
      orderBy: {
        created_at: 'desc',
      },
      include: {
        employee: {
          include: {
            user: {},
            employee_contracts: { take: 1 },
          },
        },
      },
    })
  }

  async updateEmployeePerformance(
    employeeId: string,
    performanceId: string,
    data: Prisma.performancesUncheckedUpdateInput,
  ): Promise<EmployeePerformance> {
    return this.prisma.performances.update({
      where: {
        where_performance_employee: {
          id: performanceId,
          employee_id: employeeId,
        },
      },
      data,
    })
  }

  async deleteEmployeePerfomanceByEmployeeAndPerformanceID(
    employeeId: string,
    performanceId: string,
  ): Promise<EmployeePerformance> {
    return this.prisma.performances.update({
      where: {
        where_performance_employee: {
          employee_id: employeeId,
          id: performanceId,
        },
      },
      data: { deleted_at: new Date() },
    })
  }
}
