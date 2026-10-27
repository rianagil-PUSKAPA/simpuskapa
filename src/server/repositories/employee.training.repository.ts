import { Injectable } from '@nestjs/common'
import { Prisma, trainings as EmployeeTraining } from '@prisma/client'
import { CommonPrismaClient } from '@server/common/prisma.client'

@Injectable()
export class EmployeeTrainingRepository {
  constructor(private prisma: CommonPrismaClient) {}

  async saveEmployeeTraining(data: Prisma.trainingsUncheckedCreateInput): Promise<EmployeeTraining> {
    return this.prisma.trainings.create({
      data,
    })
  }

  async getEmployeeTrainings(employeeId: string): Promise<EmployeeTraining[] | null> {
    return this.prisma.trainings.findMany({
      where: {
        employee_id: employeeId,
        deleted_at: null,
      },
      orderBy: {
        created_at: 'desc',
      },
    })
  }
}
