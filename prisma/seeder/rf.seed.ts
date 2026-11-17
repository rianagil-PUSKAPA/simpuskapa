import { faker } from '@faker-js/faker'
import { Prisma, PrismaClient, ProgramApproval } from '@prisma/client'

function reformatNumber(n: number): string {
  // determine number length
  const numberStringLength = String(n)

  const formatedNumber = '0000'.slice(0, -numberStringLength.length)

  // merge as string
  return formatedNumber + String(n)
}

async function createRf(
  prisma: PrismaClient,
  data: Prisma.requisition_formUncheckedCreateInput,
  partnerCode: string,
): Promise<any> {
  return prisma.$transaction(async (tx) => {
    // generate id RF/UCF/2023/0001
    let rfNumber = 'RF-:type/:partner_code/:year/:number'
    rfNumber = rfNumber.replaceAll(':year', String(new Date().getUTCFullYear()))

    if (data.rf_type == 'PROCUREMENT') {
      rfNumber = rfNumber.replaceAll(':type', 'PC')
    } else if (data.rf_type == 'PERSONAL_HIRE') {
      rfNumber = rfNumber.replaceAll(':type', 'PH')
    } else if (data.rf_type == 'TRAVEL') {
      rfNumber = rfNumber.replaceAll(':type', 'TR')
    }

    rfNumber = rfNumber.replaceAll(':partner_code', partnerCode)

    const lastRf = await prisma.requisition_form.findFirst({
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

    return prisma.requisition_form.create({
      data: data,
    })
  })
}

export async function seedRF(prisma: PrismaClient) {
  const programsAll = await prisma.programs.findMany()
  const employees = await prisma.employee.findMany()
  const programs = [programsAll[0], programsAll[1]]
  // create 5 Procurement
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

      await createRf(
        prisma,
        {
          action_by: employees[0].id,
          program_id: program.id,
          rf_type: 'PROCUREMENT',
          about_request: faker.lorem.words(5),
          deadline: new Date().toISOString(),
          program_project_related_id: project.id,
          program_manager_approval_status: ProgramApproval.pending,
          budget_controller_approval_status: ProgramApproval.pending,
          requested_at: new Date().toISOString(),
          requested_by: employees[0].id,
          request_number: 'xxx',
          request_number_seq: 0,
          rf_budgets: JSON.stringify(budgets),
        },
        program.partner_code,
      )
    }
    const vendors = await prisma.vendor.findMany()
    // create PH
    for (const project of projects) {
      const activities = await prisma.activities.findMany({
        where: { project_id: project.id },
      })
      const budgets = await prisma.budgets.findMany({
        where: { activity_id: activities[0].id },
        take: 5,
      })

      await createRf(
        prisma,
        {
          action_by: employees[0].id,
          program_id: program.id,
          rf_type: 'PERSONAL_HIRE',
          about_request: faker.lorem.words(5),
          deadline: new Date().toISOString(),
          program_project_related_id: project.id,
          program_manager_approval_status: ProgramApproval.pending,
          budget_controller_approval_status: ProgramApproval.pending,
          requested_at: new Date().toISOString(),
          requested_by: employees[0].id,
          request_number: 'xxx',
          request_number_seq: 0,
          rf_budgets: JSON.stringify(budgets),
          personal_hire_information: {
            vendor_id: vendors[0].id,
            type_hire: 'direct',
            primary_division: 'division',
            notes: faker.lorem.words(5),
            background_docs: [faker.image.imageUrl()],
            hire_process_docs: [faker.image.imageUrl()],
            offer_page_docs: [faker.image.imageUrl()],
            other_docs: [faker.image.imageUrl()],
          },
        },
        program.partner_code,
      )
    }

    // create TR

    for (const project of projects) {
      const activities = await prisma.activities.findMany({
        where: { project_id: project.id },
      })
      const budgets = await prisma.budgets.findMany({
        where: { activity_id: activities[0].id },
        take: 5,
      })

      await createRf(
        prisma,
        {
          action_by: employees[0].id,
          program_id: program.id,
          rf_type: 'TRAVEL',
          about_request: faker.lorem.words(5),
          deadline: new Date().toISOString(),
          program_project_related_id: project.id,
          program_manager_approval_status: ProgramApproval.pending,
          budget_controller_approval_status: ProgramApproval.pending,
          requested_at: new Date().toISOString(),
          requested_by: employees[0].id,
          request_number: 'xxx',
          request_number_seq: 0,
          rf_budgets: JSON.stringify(budgets),
          travel_detail: {
            who_traveling: faker.name.fullName(),
            employee_id: employees[0].id,
            date_start: new Date().toISOString(),
            date_end: new Date().toISOString(),
          },
        },
        program.partner_code,
      )
    }
  }
}
