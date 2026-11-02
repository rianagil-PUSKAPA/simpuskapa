import { Injectable } from '@nestjs/common'
import { Prisma, budgets } from '@prisma/client'
import { CommonPrismaClient } from '@server/common/prisma.client'

@Injectable()
export class BudgetRepository {
  constructor(private prisma: CommonPrismaClient) {}

  async add(data: Prisma.budgetsUncheckedCreateInput): Promise<budgets> {
    return this.prisma.budgets.create({
      data: data,
    })
  }

  async deleteAllByactivityId(activityId: string): Promise<any> {
    return this.prisma.budgets.deleteMany({
      where: {
        activity_id: activityId,
      },
    })
  }

  async updateBudget(budgetId: string, data: Prisma.budgetsUncheckedUpdateInput): Promise<any> {
    return this.prisma.budgets.update({
      where: {
        id: budgetId,
      },
      data: data,
    })
  }

  async incrementReturnBudget(budgetId: string, amount: number): Promise<any> {
    return this.prisma.budgets.update({
      where: {
        id: budgetId,
      },
      data: {
        retur: {
          increment: amount,
        },
      },
    })
  }

  async getById(budgetId: string): Promise<any> {
    return this.prisma.budgets.findFirst({
      where: {
        id: budgetId,
      },
    })
  }

  async getDetailBudgetUpTree(budgetId: string): Promise<any> {
    return this.prisma.budgets.findFirst({
      where: {
        id: budgetId,
      },
      include: {
        vendor_category_info: {
          include: {
            vendor_type: {},
          },
        },
        activities: {
          include: {
            projects: {},
          },
        },
      },
    })
  }
}
