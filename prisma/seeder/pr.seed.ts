import { PRTypes } from '../../src/shared/pr.type'
import { faker } from '@faker-js/faker'
import { Prisma, PrismaClient, ProgramApproval } from '@prisma/client'

function reformatNumber(n: number): string {
  // determine number length
  const numberStringLength = String(n)

  const formatedNumber = '0000'.slice(0, -numberStringLength.length)

  // merge as string
  return formatedNumber + String(n)
}

async function createPR(
  prisma: PrismaClient,
  data: Prisma.payment_requestUncheckedCreateInput,
  partnerCode: string,
): Promise<any> {
  return prisma.$transaction(async (tx) => {
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

    const lastRf = await prisma.payment_request.findFirst({
      orderBy: {
        request_number_seq: 'desc',
      },
    })

    let lastRfSeqNumber = 1
    if (lastRf && lastRf.request_number_seq) {
      lastRfSeqNumber = lastRf.request_number_seq
    }

    rfNumber = rfNumber.replaceAll(':number', reformatNumber(lastRfSeqNumber))
    console.log(rfNumber)

    // convert to prefixed 0000
    data.request_number = rfNumber
    data.request_number_seq = lastRfSeqNumber + 1

    return prisma.payment_request.create({
      data: data,
    })
  })
}

export async function seedPR(prisma: PrismaClient) {
  const programsAll = await prisma.programs.findMany()
  const employees = await prisma.employee.findMany()
  const programs = [programsAll[0], programsAll[1]]
  // create 5 Procurement
  let request_number_seq = 0
  for (const program of programs) {
    const projects = await prisma.projects.findMany({
      where: { program_id: program.id },
      take: 1,
    })
    for (const project of projects) {
      const activities = await prisma.activities.findMany({
        where: { project_id: project.id },
      })
      const budgets = await prisma.budgets.findMany({
        where: { activity_id: activities[0].id },
        take: 5,
      })

      const rfs = await prisma.requisition_form.findMany()
      const vendors = await prisma.vendor.findMany()
      // PR

      await createPR(
        prisma,
        {
          payment_type: PRTypes.PR,
          rf_id: rfs[0].id,
          vendor_id: vendors[0].id,
          with_ppn: false,
          pr_budgets: JSON.stringify(budgets),
          attachments: [],
          payment_date: new Date().toISOString(),
          processed_by: null,
          requested_by: employees[0].id,
          requested_at: new Date().toISOString(),
          request_number: 'xxx',
          request_number_seq: request_number_seq,
          head_of_finance_approval: null,
          budget_controller_approval: null,
          head_of_finance_approval_by: null,
          budget_controller_approval_by: null,
        },
        program.partner_code,
      )

      await createPR(
        prisma,
        {
          payment_type: PRTypes.APR,
          rf_id: rfs[0].id,
          vendor_id: vendors[0].id,
          with_ppn: false,
          pr_budgets: JSON.stringify(budgets),
          attachments: [],
          payment_date: new Date().toISOString(),
          processed_by: null,
          requested_by: employees[0].id,
          requested_at: new Date().toISOString(),
          request_number: 'xxx',
          request_number_seq: request_number_seq,
          head_of_finance_approval: null,
          budget_controller_approval: null,
          head_of_finance_approval_by: null,
          budget_controller_approval_by: null,
        },
        program.partner_code,
      )

      request_number_seq = request_number_seq + 1
    }

    // seed aps

    const aprs = await prisma.payment_request.findMany({
      where: {
        aps_related_apr_id: null,
        payment_type: PRTypes.APR,
      },
    })

    for (const apr of aprs) {
      await createPR(
        prisma,
        {
          payment_type: PRTypes.APS,
          rf_id: apr.rf_id,
          vendor_id: apr.vendor_id,
          with_ppn: false,
          pr_budgets: apr.pr_budgets,
          attachments: [],
          payment_date: new Date().toISOString(),
          processed_by: null,
          requested_by: employees[0].id,
          requested_at: new Date().toISOString(),
          request_number: 'xxx',
          request_number_seq: request_number_seq,
          head_of_finance_approval: null,
          budget_controller_approval: null,
          head_of_finance_approval_by: null,
          budget_controller_approval_by: null,
          aps_related_apr_id: apr.id,
        },
        program.partner_code,
      )
    }
  }
}
