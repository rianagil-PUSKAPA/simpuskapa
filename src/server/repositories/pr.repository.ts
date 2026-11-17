import { PRFinanceCheckingStatus, PRTypes } from '@/shared/pr.type'
import { Injectable } from '@nestjs/common'
import { payment_request, Prisma, requisition_form } from '@prisma/client'
import { CommonPrismaClient } from '@server/common/prisma.client'
import { RequisitionFormEnum } from '../../shared/rf.type'

@Injectable()
export class PRRepository {
  constructor(private prisma: CommonPrismaClient) {}

  reformatNumber(n: number): string {
    // determine number length
    const numberStringLength = String(n)

    const formatedNumber = '0000'.slice(0, -numberStringLength.length)

    // merge as string
    return formatedNumber + String(n)
  }

  async updateApprovalProgramManager(rfId: string, status: string): Promise<any> {
    return this.prisma.requisition_form.update({
      where: {
        id: rfId,
      },
      data: {
        program_manager_approval_status: status,
      },
    })
  }

  async updateApprovalBudgetController(rfId: string, status: string): Promise<any> {
    return this.prisma.requisition_form.update({
      where: {
        id: rfId,
      },
      data: {
        budget_controller_approval_status: status,
      },
    })
  }

  async deleteById(prId: string): Promise<any> {
    return this.prisma.payment_request.delete({
      where: {
        id: prId,
      },
    })
  }

  async updateById(prId: string, data: Prisma.payment_requestUncheckedUpdateInput): Promise<any> {
    return this.prisma.payment_request.update({
      where: {
        id: prId,
      },
      data: data,
    })
  }

  async create(data: Prisma.payment_requestUncheckedCreateInput, partnerCode: string): Promise<any> {
    return this.prisma.$transaction(async (tx) => {
      // generate id PR/UCF/2023/0001
      let rfNumber = ':type/:partner_code/:year/:number'
      rfNumber = rfNumber.replaceAll(':year', String(new Date().getUTCFullYear()))

      if (data.payment_type == PRTypes.PR) {
        rfNumber = rfNumber.replaceAll(':type', 'PR')
      } else if (data.payment_type == PRTypes.APR) {
        rfNumber = rfNumber.replaceAll(':type', 'APR')
      } else if (data.payment_type == PRTypes.TE) {
        rfNumber = rfNumber.replaceAll(':type', 'TE')
      } else if (data.payment_type == PRTypes.APS) {
        rfNumber = rfNumber.replaceAll(':type', 'APS')
      } else if (data.payment_type == PRTypes.APF) {
        rfNumber = rfNumber.replaceAll(':type', 'APF')
      }

      rfNumber = rfNumber.replaceAll(':partner_code', partnerCode)
      console.log(rfNumber)

      const lastRf = await this.prisma.payment_request.findFirst({
        orderBy: {
          request_number_seq: 'desc',
        },
      })

      let lastRfSeqNumber = 1
      if (lastRf && lastRf.request_number_seq) {
        lastRfSeqNumber = lastRf.request_number_seq
      }

      rfNumber = rfNumber.replaceAll(':number', this.reformatNumber(lastRfSeqNumber))

      // convert to prefixed 0000
      data.request_number = rfNumber
      data.request_number_seq = lastRfSeqNumber + 1

      return this.prisma.payment_request.create({
        data: data,
      })
    })
  }

  async getListPrByTypeAndRfID(rfId: string, type: string): Promise<any> {
    return this.prisma.payment_request.findMany({
      where: {
        id: rfId,
        payment_type: type,
      },
    })
  }

  async getListRf(programId: string): Promise<any> {
    return this.prisma.requisition_form.findMany({
      where: {
        program_id: programId,
      },
      include: {
        program_projects_related: {
          include: {
            activities: {
              include: {
                budgets: {},
              },
            },
          },
        },
      },
    })
  }

  async getListTEByRFID(rfId: string): Promise<payment_request[]> {
    return this.prisma.payment_request.findMany({
      where: {
        rf_id: rfId,
        payment_type: 'travel-expense',
        NOT: {
          paid_at: null,
        },
      },
    })
  }

  async getListAllPRByRFID(rfId: string): Promise<payment_request[]> {
    return this.prisma.payment_request.findMany({
      where: {
        rf_id: rfId,
      },
    })
  }

  async getListPRByRFID(
    rfId: string,
    excludeClosed = false,
  ): Promise<(requisition_form & { payment_request: payment_request[] })[]> {
    const q = {
      where: {
        id: rfId,
        payment_request: {
          every: {
            NOT: {
              finance_checking_process_status: 'rejected',
              program_manager_approval: 'rejected',
              budget_controller_approval: 'rejected',
            },
          },
        },
      },
      include: {
        payment_request: {},
      },
    }

    if (excludeClosed) {
      q['where']['closed_at'] = { not: null }
    }
    return this.prisma.requisition_form.findMany(q)
  }

  async markPaymentRequestProcessed(prId: string, userId: string | null): Promise<any> {
    return this.prisma.payment_request.update({
      where: {
        id: prId,
      },
      data: {
        processed_by: userId,
        processed_at: new Date(),
      },
    })
  }

  async markPaymentStatementProcessed(prId: string, userId: string | null): Promise<any> {
    return this.prisma.payment_request.update({
      where: {
        id: prId,
      },
      data: {
        aps_processed_by: userId,
        processed_by: userId,
      },
    })
  }

  async markPaymentPaid(prId: string, userId: string | null): Promise<any> {
    return this.prisma.payment_request.update({
      where: {
        id: prId,
      },
      data: {
        paid_at: new Date().toISOString(),
      },
    })
  }

  async updateAPSHOFApproval(prId: string, approval: string, employeeid: string): Promise<any> {
    return this.prisma.payment_request.update({
      where: {
        id: prId,
      },
      data: {
        aps_haed_of_finance_approval: approval,
        aps_haed_of_finance_approval_by: employeeid,
      },
    })
  }

  async updateAPSBudgetControllerApproval(prId: string, approval: string, employeeid: string): Promise<any> {
    return this.prisma.payment_request.update({
      where: {
        id: prId,
      },
      data: {
        aps_budget_controller_approval: approval,
        aps_budget_controller_approval_by: employeeid,
      },
    })
  }

  async updatePrHOFApproval(prId: string, approval: string, employeeid: string): Promise<any> {
    return this.prisma.payment_request.update({
      where: {
        id: prId,
      },
      data: {
        head_of_finance_approval: approval,
        head_of_finance_approval_by: employeeid,
      },
    })
  }

  async updatePrBudgetControllerApproval(prId: string, approval: string, employeeid: string): Promise<any> {
    return this.prisma.payment_request.update({
      where: {
        id: prId,
      },
      data: {
        budget_controller_approval: approval,
        budget_controller_approval_by: employeeid,
        budget_controller_approval_at: new Date(),
      },
    })
  }

  async updateProgramManagerApproval(prId: string, approval: string, employeeid: string): Promise<any> {
    return this.prisma.payment_request.update({
      where: {
        id: prId,
      },
      data: {
        program_manager_approval: approval,
        program_manager_approval_by: employeeid,
        program_manager_approval_at: new Date(),
      },
    })
  }

  async getListAPRByRfId(rf_id?: string): Promise<payment_request[]> {
    return this.prisma.payment_request.findMany({
      where: {
        rf_id: rf_id,
        payment_type: 'advance-payment-request',
      },
    })
  }

  async getListPRAll(
    programId?: string,
    rfId?: string,
    prType?: string,
    paid?: boolean,
    year?: number,
    vendorId?: string,
    finance_checker_rejected_by?: string,
    pr_status = '',
  ): Promise<payment_request[]> {
    const q = {}

    const where = {} as Prisma.payment_requestWhereInput
    if ((programId && programId != '') || (rfId && rfId != '')) {
      where['requisition_form'] = {}

      if (programId) {
        where['requisition_form']['program_id'] = programId
      }

      if (rfId) {
        where['requisition_form']['id'] = rfId
      }
    }

    if (prType) {
      where['payment_type'] = prType
    }

    if (paid) {
      where['paid_at'] = { not: null }
    }
    if (vendorId && vendorId != '' && vendorId != undefined) {
      where['vendor_id'] = vendorId
      // Preserve chronological vendor history used by tax calculations.
      q['orderBy'] = { created_at: 'asc' }
    } else {
      q['orderBy'] = [{ created_at: 'desc' }, { request_number_seq: 'desc' }]
    }

    if (finance_checker_rejected_by && finance_checker_rejected_by != '' && finance_checker_rejected_by != undefined) {
      where['finance_checking_process_by'] = finance_checker_rejected_by
      where['finance_checking_process_status'] = PRFinanceCheckingStatus.REVISION.toString()
    }

    if (pr_status == 'ready_to_process') {
      where['program_manager_approval_by'] = { not: null }
      where['finance_checking_process_status'] = PRFinanceCheckingStatus.CHECKED.toString()
      where['paid_at'] = null
    }
    if (pr_status == 'ready_to_check') {
      where['program_manager_approval_by'] = null
      where['budget_controller_approval_by'] = null
      where['paid_at'] = null
    }
    if (pr_status == 'pending') {
      where['paid_at'] = null
    }
    if (pr_status == 'paid') {
      where['paid_at'] = { not: null }
    }

    q['where'] = where

    return this.prisma.payment_request.findMany(q)
  }

  async getListRfForUserApproval(programId: string, projectId: string, userId: string): Promise<any> {
    return this.prisma.requisition_form.findMany({
      where: {
        program_id: programId,
        program_project_related_id: projectId,
        OR: {
          budget_controller_approval_status: userId,
          program_manager_approval_status: userId,
        },
      },
      include: {
        program_projects_related: {
          include: {
            activities: {
              include: {
                budgets: {},
              },
            },
          },
        },
      },
    })
  }

  async getAPSByFInanceProcessBy(employee_id: string): Promise<any> {
    return this.prisma.payment_request.findFirst({
      where: {
        aps_processed_by: employee_id,
      },
    })
  }

  async getPRByFInanceProcessBy(employee_id: string): Promise<any> {
    return this.prisma.payment_request.findMany({
      where: {
        processed_by: employee_id,
      },
    })
  }

  async getPRById(id: string): Promise<any> {
    return this.prisma.payment_request.findFirst({
      where: {
        id: id,
      },
    })
  }

  async markPaymentRequestCheckingStatus(
    prId: string,
    userId: string | null,
    status: PRFinanceCheckingStatus,
    reject_note?: string,
  ): Promise<any> {
    return this.prisma.payment_request.update({
      where: {
        id: prId,
      },
      data: {
        finance_checking_process_by: userId,
        finance_checking_process_status: status.toString(),
        finance_checking_process_notes: reject_note,
        finance_checking_process_at: new Date(),
      },
    })
  }

  async unMarkPaymentRequestCheckingStatus(prId: string): Promise<any> {
    return this.prisma.payment_request.update({
      where: {
        id: prId,
      },
      data: {
        finance_checking_process_by: null,
        finance_checking_process_status: null,
        finance_checking_process_at: null,
      },
    })
  }

  async getTotalCountPrByRfId(rf_id: string): Promise<payment_request[]> {
    return this.prisma.payment_request.findMany({
      where: {
        rf_id: rf_id,
      },
    })
  }
}
