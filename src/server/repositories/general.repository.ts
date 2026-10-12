import { Injectable } from '@nestjs/common'
import { activities as Activity, finance_logs, Prisma } from '@prisma/client'
import { CommonPrismaClient } from '@server/common/prisma.client'

@Injectable()
export class GeneralRepository {
  constructor(private prisma: CommonPrismaClient) {}

  async createLog(data: Prisma.finance_logsUncheckedCreateInput): Promise<finance_logs> {
    return this.prisma.finance_logs.create({
      data: data,
    })
  }

  async getByLogTypeRef(log_type: string, ref_id: string): Promise<finance_logs[]> {
    return this.prisma.finance_logs.findMany({
      where: {
        log_type: log_type,
        OR: [
          {
            program_id: ref_id,
          },
          {
            rf_id: ref_id,
          },
          {
            pr_id: ref_id,
          },
        ],
      },
      orderBy: {
        created_at: 'desc',
      },
    })
  }

  async getLatestLog(limit: number): Promise<finance_logs[]> {
    return this.prisma.finance_logs.findMany({
      take: limit,
      orderBy: {
        created_at: 'desc',
      },
    })
  }

  async getAllRfByActionByNotNotified(employeeId: string): Promise<any> {
    return await this.prisma.requisition_form.findMany({
      where: { action_by: { contains: employeeId } },
    })
  }

  async getAllNeedFinanceCheckingOnPR(employeeId: string): Promise<any> {
    return this.prisma.payment_request.findMany({
      where: {
        finance_checking_process_by: employeeId,
        finance_checking_process_status: null,
      },
    })
  }

  // as budget_controller_approval_by or head of finance or finance_checking_process_by
  async getAllNeedApprovalOnPaymentRequest(employeeId: string): Promise<any> {
    return this.prisma.payment_request.findMany({
      where: {
        OR: [
          {
            AND: [{ budget_controller_approval_by: employeeId }, { budget_controller_approval: { not: 'approved' } }],
          },
          {
            AND: [{ head_of_finance_approval_by: employeeId }, { head_of_finance_approval: { not: 'approved' } }],
          },
          {
            AND: [{ finance_checking_process_by: employeeId }, { finance_checking_process_status: { not: 'checked' } }],
          },
        ],
      },
    })
  }
}
