import { Injectable } from '@nestjs/common'
import { Prisma, requisition_form } from '@prisma/client'
import { CommonPrismaClient } from '@server/common/prisma.client'
import { RequisitionFormEnum } from '../../shared/rf.type'

@Injectable()
export class RfRepository {
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
        program_manager_approval_status_at: new Date(),
      },
    })
  }

  async updateById(rfId: string, data: Prisma.requisition_formUncheckedUpdateInput): Promise<any> {
    return this.prisma.requisition_form.update({
      where: {
        id: rfId,
      },
      data: data,
    })
  }

  async create(data: Prisma.requisition_formUncheckedCreateInput, partnerCode: string): Promise<requisition_form> {
    return this.prisma.$transaction(async (tx) => {
      // generate id RF/UCF/2023/0001
      let rfNumber = 'RF-:type/:partner_code/:year/:number'
      rfNumber = rfNumber.replaceAll(':year', String(new Date().getUTCFullYear()))

      if (data.rf_type == RequisitionFormEnum.PROCUREMENT) {
        rfNumber = rfNumber.replaceAll(':type', 'PC')
      } else if (data.rf_type == RequisitionFormEnum.PERSONAL_HIRE) {
        rfNumber = rfNumber.replaceAll(':type', 'PH')
      } else if (data.rf_type == RequisitionFormEnum.TRAVEL) {
        rfNumber = rfNumber.replaceAll(':type', 'TR')
      } else if (data.rf_type == RequisitionFormEnum.STAFF_COST) {
        rfNumber = rfNumber.replaceAll(':type', 'SC')
      }

      rfNumber = rfNumber.replaceAll(':partner_code', partnerCode.replaceAll(' ', ''))
      console.log(rfNumber)

      const lastRf = await this.prisma.requisition_form.findFirst({
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

      return this.prisma.requisition_form.create({
        data: data,
      })
    })
  }

  async getListRfByProgramAndActionBy(programId: string, employeeId: string): Promise<requisition_form[]> {
    return this.prisma.requisition_form.findMany({
      where: {
        program_id: programId,
        action_by: {
          contains: employeeId,
        },
      },
    })
  }

  async getListRf(
    programId: string,
    filterByActionByEmployeeId: string,
    include_rejected = false,
    exclude_closed = true,
  ): Promise<any> {
    const q = {
      where: {
        program_id: programId,
      } as Prisma.requisition_formWhereInput,
      include: {
        payment_request: {},
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
    }

    if (!include_rejected) {
      q['where']['OR'] = {
        program_manager_approval_status: { not: 'rejected' },
      }
    }

    if (filterByActionByEmployeeId && filterByActionByEmployeeId != '') {
      q['where']['action_by'] = { contains: filterByActionByEmployeeId }
    }
    if (exclude_closed) {
      q['where']['closed_at'] = null
    }

    q['orderBy'] = [{ request_number_seq: 'desc' }, { requested_at: 'desc' }]

    return this.prisma.requisition_form.findMany(q)
  }

  async getListRfAll(): Promise<any> {
    return this.prisma.requisition_form.findMany({
      where: {
        closed_at: null,
      },
      orderBy: [{ request_number_seq: 'desc' }, { requested_at: 'desc' }],
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

  async getListRfForUserApproval(programId: string, projectId: string, userId: string): Promise<any> {
    return this.prisma.requisition_form.findMany({
      where: {
        program_id: programId,
        program_project_related_id: projectId,
        OR: {
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

  async getRfByOnlyId(rfId: string): Promise<any> {
    return this.prisma.requisition_form.findFirst({
      where: {
        id: rfId,
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

  async deleteById(programId: string, projectId: string, rfId: string): Promise<any> {
    await this.prisma.requisition_form.delete({
      where: {
        id: rfId,
      },
    })

    await this.prisma.payment_request.deleteMany({
      where: {
        rf_id: rfId,
      },
    })
    return ''
  }

  async getRfById(programId: string, projectId: string, rfId: string): Promise<any> {
    return this.prisma.requisition_form.findFirst({
      where: {
        id: rfId,
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

  async getListRfByProgramManager(employeeId: string): Promise<requisition_form[]> {
    return this.prisma.requisition_form.findMany({
      where: {
        programs: {
          program_manager: employeeId,
        },
      },
    })
  }
}
