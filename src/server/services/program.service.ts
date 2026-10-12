import { BucketsEnum } from '@/shared/file.system'
import { RoleDefinition } from '@/shared/role.access'
import { ServerBadRequest, ServerNotFound } from '@/shared/server.errors'
import { Injectable } from '@nestjs/common'
import {
  activities,
  budgets,
  ProgramApproval,
  programs,
  projects,
  vendor_category_information,
  vendor_type,
} from '@prisma/client'
import { uploadCsvFileString } from '../commands/s3uploader'
import { formatDateToCsv } from '../common/date.util'
import { BudgetRepository } from '../repositories/budget.repository'
import { EmployeeRepository } from '../repositories/employee.repository'
import { GeneralRepository } from '../repositories/general.repository'
import { MailRepository } from '../repositories/mail.repository'
import { NotificationRepository } from '../repositories/notification.repository'
import { PartnerRepository } from '../repositories/partner.repository'
import { PRRepository } from '../repositories/pr.repository'
import { ProgramRepository } from '../repositories/program.repository'
import { RfRepository } from '../repositories/rf.repository'
import { UserRepository } from '../repositories/user.repository'
import { NotifType } from '../types/notification.dto'
import {
  ActivityBudgetList,
  Budget,
  BudgetProgramProjectActivity,
  BudgetProgramProjectDetail,
  BudgetProgramProjectListResponse,
  BudgetProject,
  EmployeeProfile,
  ProgramBudgetRevision,
  ProgramContract,
  ProgramDetail,
  ProgramListData,
  ProgramPerdiemSettings,
  ProgramReceivedFundDetail,
  ProgramTimeLine,
} from '../types/program.dto'
import { EmployeeSimpleDetail } from '../types/rf.dto'

type Snapshoot = programs & {
  projects: (projects & {
    activities: (activities & {
      budgets: Array<
        budgets & {
          vendor_category_info: vendor_category_information & {
            vendor_type: vendor_type
          }
        }
      >
    })[]
  })[]
}

@Injectable()
export class ProgramService {
  constructor(
    private programRepository: ProgramRepository,
    private partnerRepository: PartnerRepository,
    private employeeRepository: EmployeeRepository,
    private budgetRepository: BudgetRepository,
    private userRepository: UserRepository,
    private rfRepository: RfRepository,
    private prRepository: PRRepository,
    private generalRepo: GeneralRepository,
    private notifRepo: NotificationRepository,
    private mailRepo: MailRepository,
  ) {}

  private async createSnapshootBudgetCsv(budgets: Snapshoot, filename: string, submittedAt: Date, approvedAt: Date) {
    const rows = []
    rows.push([
      'project_code',
      'project_description',
      'activity_code',
      'activity_description',
      'code',
      'description',
      'type',
      'category',
      'qty',
      'unit',
      'pkg_qty',
      'pkg_unit',
      'cost_value',
      'cost',
    ])

    for (const project of budgets.projects) {
      for (const activity of project.activities) {
        for (const budget of activity.budgets) {
          rows.push([
            project.code,
            project.description,
            activity.code,
            activity.description,
            budget.code,
            budget.description,
            budget.vendor_category_info.vendor_type.name,
            budget.vendor_category_info.name,
            String(budget.qty),
            budget.unit,
            String(budget.pkg_qty),
            budget.pkg_unit,
            String(budget.cost),
            String(Number(budget.qty) * Number(budget.pkg_qty) * budget.cost),
          ])
        }
      }
    }

    let csv = ''
    rows.forEach((v) => {
      csv += v.join(',').toString() + '\n'
    })

    await uploadCsvFileString(csv, filename, BucketsEnum.program_snapshoot)

    const lastRevison: ProgramBudgetRevision[] = []
    const lastDbRev = budgets.revisions_path as ProgramBudgetRevision[]
    if (lastDbRev) {
      lastRevison.push(...lastDbRev)
    }
    const rev = new ProgramBudgetRevision()
    rev.path = filename
    rev.approved_at = approvedAt.toISOString()
    rev.submitted_at = submittedAt.toISOString()

    lastRevison.push(rev)

    await this.programRepository.updateRevisionPath(lastRevison, budgets.id)
  }

  async getBudgets(programId: string): Promise<BudgetProgramProjectListResponse> {
    const baseData = await this.programRepository.getListForReportByProgramId(programId)

    const result = new BudgetProgramProjectListResponse()
    result.projects = []

    for (const project of baseData.projects) {
      const projectIndices = new BudgetProgramProjectDetail()
      projectIndices.id = project.id
      projectIndices.code = project.code
      projectIndices.description = project.description
      projectIndices.ordering_seq = project.ordering_seq
      projectIndices.activities = []

      for (const activity of project.activities) {
        const activityIndices = new BudgetProgramProjectActivity()
        activityIndices.id = activity.id
        activityIndices.ordering_seq = activity.ordering_seq
        activityIndices.code = activity.code
        activityIndices.description = activity.description

        activityIndices.budgets = []
        for (const budget of activity.budgets) {
          console.log('budget ===>', budget)
          const budgetIndices = new ActivityBudgetList()
          budgetIndices.id = budget.id
          budgetIndices.qty = budget.qty
          budgetIndices.code = budget.code
          budgetIndices.ordering_seq = budget.ordering_seq
          budgetIndices.description = budget.description
          budgetIndices.vendor_category_information = budget.vendor_category_info
          budgetIndices.unit = budget.unit
          budgetIndices.pkg_qty = Number(budget.pkg_qty)
          budgetIndices.pkg_unit = budget.pkg_unit
          budgetIndices.unit_cost_value = budget.cost
          budgetIndices.unit_cost = `${baseData.currency}_${budget.cost}`
          activityIndices.budgets.push(budgetIndices)
        }

        projectIndices.activities.push(activityIndices)
      }

      result.projects.push(projectIndices)
    }
    return result
  }

  async setReviseBudget(
    programId: string,
    revisePath: string[],
    userId: string,
    reviseNote = '',
    reviseAmount = null,
  ): Promise<any> {
    const employee = await this.employeeRepository.getEmployeeByUserId(userId)

    await this.programRepository.update(
      {
        approval: ProgramApproval.revision,
        revise_approval_doc_path: revisePath,
        submitted_at: new Date().toISOString(),
        submitted_by: employee[0].id,
        budget_revision_note: reviseNote,
        budget_revision_requested_at: new Date(),
        revise_amount: reviseAmount,
      },
      programId,
    )
    const program = await this.programRepository.getById(programId)
    await this.notifRepo.resolveNotif(program.submitted_by, programId, NotifType.ACTION_PROGRAM_BUDGET)

    const revisionApprover = program.program_ownership_type === 'INTERNAL'
      ? program.program_manager
      : program.grant_manager

    await this.mailRepo.sendWorkflowToEmployees(
      [revisionApprover],
      'Permintaan Revisi Budget Needs',
      `Permintaan revisi Budget Needs untuk "${program.program_name}" telah diajukan.${reviseNote ? ' Catatan: ' + reviseNote : ''}`,
      `https://sim.puskapa.org/dashboard/project/${programId}?tab=budget-needs`,
      'Tinjau Revisi Budget',
    )

    await this.generalRepo.createLog({
      pr_id: '',
      rf_id: '',
      user_id: employee[0].user_id,
      log_type: 'Program',
      raw_data: '',
      program_id: programId,
      message: `Opened a revision for <a href="/dashboard/project/${programId}">${program.program_name}</a> project with attached documents and message:`,
    })
  }

  async setBudgetSubmitted(programId: string, userId: string): Promise<any> {
    const employee = await this.employeeRepository.getEmployeeByUserId(userId)

    if (!employee.length) {
      throw new ServerNotFound('Submitted employee not found')
    }

    const previousProgram = await this.programRepository.getById(programId)

    if (!previousProgram) {
      throw new ServerNotFound('Program not found')
    }

    const isResubmission = Boolean(previousProgram.submitted_by)

    await this.programRepository.update(
      {
        approval: ProgramApproval.pending,
        submitted_at: new Date().toISOString(),
        submitted_by: employee[0].id,
      },
      programId,
    )

    const program = await this.programRepository.getById(programId)

    if (!program) {
      throw new ServerNotFound('Program not found')
    }

    const isInternal = program.program_ownership_type === 'INTERNAL'

    if (isInternal) {
      /*
       * INTERNAL:
       * Budget Needs -> General Manager
       *
       * General Manager is resolved from User Management role,
       * not from supervisor assignment.
       */
      const generalManagerUser = await this.userRepository.getUserByRole(RoleDefinition.GENERAL_MANAGER)

      const generalManagerEmployees = generalManagerUser
        ? await this.employeeRepository.getEmployeeByUserId(generalManagerUser.id)
        : []

      const gm = generalManagerEmployees?.[0] ?? null

      if (!gm) {
        throw new ServerNotFound('General Manager employee not found')
      }

      await this.notifRepo.create({
        employee_id: gm.id,
        ref_id: programId,
        notif_type: NotifType.APPROVAL_PROGRAM_BUDGET,
        deleted_at: null,
      })

      const tempVal = new Map<string, string>()

      tempVal.set('{{.HEADING}}', 'Budget Needs Approval Request')

      tempVal.set(
        '{{.BODY}}',
        `${employee[0].full_name} ${isResubmission ? 're-submitted' : 'submitted'} the Budget Needs for <b>${
          program.program_name
        }</b> project.`,
      )

      tempVal.set('{{.BUTTON_TITLE}}', 'Review Budget Needs')

      tempVal.set('{{.BUTTON_URL}}', `https://sim.puskapa.org/dashboard/project/${program.id}?tab=budget-needs`)

      if (gm.user?.email) {
        await this.mailRepo.sendNotificationNoReply('Budget Needs Approval Request', gm.user.email, tempVal)
      }

      await this.generalRepo.createLog({
        pr_id: '',
        rf_id: '',
        user_id: employee[0].user_id,
        log_type: 'Program',
        raw_data: '',
        program_id: programId,
        message: `${
          isResubmission ? 'Re-submitted' : 'Submitted'
        } the Budget Needs for <a href="/dashboard/project/${programId}">${
          program.program_name
        }</a> project for General Manager approval`,
      })

      return true
    }

    /*
     * PROGRAM workflow remains Grant Manager + Project Manager.
     */
    const approverIds = [program.grant_manager, program.program_manager].filter(Boolean)

    for (const approverId of [...new Set(approverIds)]) {
      const approver = await this.employeeRepository.getEmployeeById(approverId)

      if (!approver) {
        continue
      }

      await this.notifRepo.create({
        employee_id: approver.id,
        ref_id: programId,
        notif_type: NotifType.APPROVAL_PROGRAM_BUDGET,
        deleted_at: null,
      })

      if (approver.user?.email) {
        const tempVal = new Map<string, string>()

        tempVal.set('{{.HEADING}}', 'Budget Needs Approval Request')

        tempVal.set(
          '{{.BODY}}',
          `${employee[0].full_name} ${isResubmission ? 're-submitted' : 'submitted'} the Budget Needs for <b>${
            program.program_name
          }</b> project.`,
        )

        tempVal.set('{{.BUTTON_TITLE}}', 'Review Budget Needs')

        tempVal.set('{{.BUTTON_URL}}', `https://sim.puskapa.org/dashboard/project/${program.id}?tab=budget-needs`)

        await this.mailRepo.sendNotificationNoReply('Budget Needs Approval Request', approver.user.email, tempVal)
      }
    }

    await this.generalRepo.createLog({
      pr_id: '',
      rf_id: '',
      user_id: employee[0].user_id,
      log_type: 'Program',
      raw_data: '',
      program_id: programId,
      message: `${
        isResubmission ? 'Re-submitted' : 'Submitted'
      } the Budget Needs for <a href="/dashboard/project/${programId}">${program.program_name}</a> project`,
    })

    return true
  }

  async setBudget(programId: string, budgets: Budget, userId: string): Promise<boolean> {
    // const employee = await this.employeeRepository.getEmployeeByUserId(userId)
    // if (employee.length < 1) {
    //   throw new ServerBadRequest('Employee submit not found')
    // }
    // await this.programRepository.update(
    //   {
    //     submitted_at: new Date(),
    //     submitted_by: employee[0].id,
    //   },
    //   programId,
    // )
    const program = await this.programRepository.getById(programId)

    // update revise approval
    // if (budgets.revise_approval_doc?.length > 0) {
    //   await this.programRepository.updateRevisedBudgetApprovalDoc(budgets.revise_approval_doc[0], programId)

    //   await this.generalRepo.createLog({
    //     pr_id: '',
    //     rf_id: '',
    //     user_id: employee[0].user_id,
    //     log_type: 'Program',
    //     raw_data: '',
    //     program_id: programId,
    //     message: `Updated the Budget Needs draft for <a href="/dashboard/project/${programId}?tab=budget-needs">${program.program_name}</a> project`,
    //   })
    // } else {
    //   await this.generalRepo.createLog({
    //     pr_id: '',
    //     rf_id: '',
    //     user_id: employee[0].user_id,
    //     log_type: 'Program',
    //     raw_data: '',
    //     program_id: programId,
    //     message: `Saved a new Budget Needs draft for <a href="/dashboard/project/${programId}?tab=budget-needs">${program.program_name}</a> project`,
    //   })
    // }

    const task = []
    for (const project of budgets.projects) {
      const projectUpdateBudget = async (budgetProject: BudgetProject): Promise<any> => {
        // delete all budget from activities
        for (const activity of budgetProject.activities) {
          await this.budgetRepository.deleteAllByactivityId(activity.id)

          for (const budget of activity.budgets) {
            await this.budgetRepository.add({
              id: budget.id,
              activity_id: activity.id,
              ordering_seq: budget.ordering_seq,
              code: budget.code,
              description: budget.description,
              vendor_category_info_id: budget.vendor_category_id,
              qty: budget.qty,
              unit: budget.unit,
              pkg_qty: budget.pkg_qty,
              pkg_unit: budget.pkg_unit,
              cost: budget.unit_cost_value,
            })
          }
        }
      }

      task.push(projectUpdateBudget(project))
    }

    // start task
    await Promise.all(task)

    return true
  }

  async getProgramDetailById(id: string, createdByUser?: string): Promise<ProgramDetail | null> {
    let program = await this.programRepository.getById(id)

    if (createdByUser) {
      program = await this.programRepository.getByCreatedUserId(id)
    }

    if (!program || program == undefined) {
      return null
    }
    console.log(program)

    const programResult = new ProgramDetail()

    programResult.id = program.id
    programResult.revise_amount = Number(program.revise_amount ?? 0)
    programResult.approval_note = program.approval_note
    programResult.partner = program.partner
    programResult.program_name = program.program_name
    programResult.program_code = program.code
    programResult.program_description = program.program_description
    programResult.estimated_budget_value = program.estimated_budget
    programResult.estimated_budget = `${program.currency}_${program.estimated_budget}`
    programResult.currency = program.currency
    programResult.form_state = program.form_state
    programResult.form_progress = program.form_progress
    programResult.program_ownership_type = program.program_ownership_type

    programResult.budget_revision_note = program.budget_revision_note
    programResult.budget_revision_requested_at = program.budget_revision_requested_at?.toISOString()

    if (program.program_manager) {
      const employee = await this.employeeRepository.getEmployeeById(program.program_manager)

      programResult.program_manager = {
        id: employee.id,
        full_name: employee.full_name,
        pass_photo_path: [employee.pass_photo_path[0]],
        avatar: [(employee as any).user.avatar],
      }
    } else {
      programResult.program_manager = null
    }

    if (program.program_officer) {
      console.log(program.program_officer)
      const employee = await this.employeeRepository.getEmployeeById(program.program_officer)

      programResult.program_officer = {
        id: employee.id,
        full_name: employee.full_name,
        pass_photo_path: [employee.pass_photo_path[0]],
        avatar: [(employee as any).user.avatar],
      }
    } else {
      programResult.program_officer = null
    }

    if (program.grant_manager) {
      const employee = await this.employeeRepository.getEmployeeById(program.grant_manager)

      programResult.grant_manager = {
        id: employee.id,
        full_name: employee.full_name,
        pass_photo_path: [employee.pass_photo_path[0]],
        avatar: [(employee as any).user.avatar],
      }
    } else {
      programResult.grant_manager = null
    }

    if (program.budget_controller) {
      const employee = await this.employeeRepository.getEmployeeById(program.budget_controller)

      programResult.budget_controller = {
        id: employee.id,
        full_name: employee.full_name,
        pass_photo_path: [employee.pass_photo_path[0]],
        avatar: [(employee as any).user.avatar],
      }
    } else {
      programResult.budget_controller = null
    }

    programResult.timeline = program.timeline as ProgramTimeLine
    programResult.contract = program.contract as ProgramContract
    programResult.finance_progress = program.finance_progress
    programResult.approval = program.approval
    programResult.submitted_at = program.submitted_at?.toISOString()
    programResult.approved_at = program.approved_at?.toISOString()

    if (program.submitted_by) {
      const submitedByEmployeeProfile = await this.employeeRepository.getEmployeeById(program.submitted_by)

      if (!submitedByEmployeeProfile) {
        throw new ServerBadRequest('Sumited Employee not found')
      }
      programResult.submitted_by = {
        name: submitedByEmployeeProfile.full_name,
        employee_pass_photo: submitedByEmployeeProfile.pass_photo_path,
      } as EmployeeProfile
    } else {
      programResult.submitted_by = null
    }

    programResult.snapshoot_path = program.revisions_path as ProgramBudgetRevision[]

    // head of finance

    const headOfFinanceUser = await this.userRepository.getUserByRole(RoleDefinition.HEAD_OF_FINANCE)
    if (!headOfFinanceUser) {
      throw new ServerNotFound('Head Of Operation hasnt be set')
    }

    const headFinance = await this.employeeRepository.getEmployeeByUserId(headOfFinanceUser.id)
    if (headFinance) {
      programResult.head_finance = {
        name: headFinance[0].full_name,
        employee_pass_photo: headFinance[0].pass_photo_path[0],
      }
    } else {
      programResult.head_finance = {}
    }

    const headOfOperationUser = await this.userRepository.getUserByRole(RoleDefinition.HEAD_OF_OPERATION)
    if (!headOfOperationUser) {
      throw new ServerNotFound('Head Of Operation hasnt be set')
    }
    const headOperation = await this.employeeRepository.getEmployeeByUserId(headOfOperationUser.id)
    if (headOperation) {
      programResult.head_operation = {
        name: headOperation[0].full_name,
        employee_pass_photo: headOperation[0].pass_photo_path[0],
      }
    } else {
      programResult.head_operation = {}
    }

    programResult.revise_approval_doc = (program.revise_approval_doc_path as string[]) ?? ([] as string[])

    if (program.created_by) {
      const employee = await this.employeeRepository.getEmployeeByUserId(program.created_by)
      programResult.created_by = {
        id: employee[0].id,
        name: employee[0].full_name,
        employee_pass_photo: employee[0].pass_photo_path[0],
      }
    } else {
      programResult.created_by = null
    }

    return programResult
  }

  async getProgramsList(
    page: number,
    perPage: number,
    approval_status: string,
    program_ownership_type = 'PROGRAM',
    partner_code = '',
    program_manager_id = '',
    sort = '',
    keyword = '',
  ): Promise<ProgramListData[]> {
    console.log('ownership 2', program_ownership_type)
    page--
    const limit = perPage
    const offset = page * limit
    const programs = await this.programRepository.getAll(
      offset,
      limit,
      ProgramApproval[approval_status],
      program_ownership_type,
      partner_code,
      program_manager_id,
      sort,
      keyword,
    )

    const result = []

    for (const v of programs) {
      const progam = new ProgramListData()
      progam.id = v.id
      progam.program_name = v.program_name
      progam.partner_name = v.partner.name
      progam.form_progress = v.form_progress
      progam.form_state = v.form_state
      progam.revision_path = (v.revise_approval_doc_path as string[]) ?? ([] as string[])

      if (v.program_manager) {
        const employee = await this.employeeRepository.getEmployeeById(v.program_manager)

        progam.program_manager = {
          id: employee.id,
          full_name: employee.full_name,
          pass_photo_path: [employee.pass_photo_path[0]],
          avatar: [(employee as any).user.avatar],
        }
      } else {
        progam.program_manager = null
      }

      if (v.grant_manager) {
        const employeeGrantManager = await this.employeeRepository.getEmployeeById(v.grant_manager)

        progam.grant_manager = {
          id: employeeGrantManager.id,
          full_name: employeeGrantManager.full_name,
          pass_photo_path: [employeeGrantManager.pass_photo_path[0]],
          avatar: [(employeeGrantManager as any).user.avatar],
        }
      } else {
        progam.grant_manager = null
      }

      if (v.budget_controller) {
        const employeeGrantManager = await this.employeeRepository.getEmployeeById(v.budget_controller)

        progam.budget_controller = {
          id: employeeGrantManager.id,
          full_name: employeeGrantManager.full_name,
          pass_photo_path: [employeeGrantManager.pass_photo_path[0]],
          avatar: [(employeeGrantManager as any).user.avatar],
        }
      } else {
        progam.budget_controller = null
      }

      progam.finance_progress = v.finance_progress
      progam.currency = v.currency
      progam.total_budget_value = 0
      progam.total_expenses_value = 0
      progam.program_ownership_type = v.program_ownership_type

      let totalBudget = 0
      const totalExpenses = await this.calculatePaidByProgramId(progam.id, true)
      for (const p of v.projects) {
        for (const a of p.activities) {
          for (const b of a.budgets) {
            console.log('total ---->', b.cost, b.pkg_qty, b.qty)
            totalBudget += Number(b.qty) * Number(b.pkg_qty) * b.cost
          }
        }
      }

      progam.total_budget = `${v.currency}_${totalBudget}`
      progam.total_budget_value = progam.total_budget_value

      progam.total_expenses = `${v.currency}_${totalExpenses}`
      progam.total_expenses_value = totalExpenses

      progam.finance_progress = Math.floor((totalExpenses / totalBudget) * 100)

      progam.approval = v.approval

      if (v.created_by) {
        const employee = await this.employeeRepository.getEmployeeByUserId(v.created_by)
        progam.created_by = {
          id: employee[0].id,
          name: employee[0].full_name,
          employee_pass_photo: employee[0].pass_photo_path[0],
        }
      } else {
        progam.created_by = null
      }

      result.push(progam)
    }

    return result
  }

  async getProgramsLikeList(programId: string): Promise<ProgramListData> {
    const v = await this.programRepository.getDetailedById(programId)
    if (!v) {
      return
    }

    const progam = new ProgramListData()
    progam.id = v.id
    progam.program_name = v.program_name
    progam.partner_name = v.partner.name
    progam.form_progress = v.form_progress
    progam.form_state = v.form_state
    progam.revision_path = (v.revise_approval_doc_path as string[]) ?? ([] as string[])

    if (v.program_manager) {
      const employee = await this.employeeRepository.getEmployeeById(v.program_manager)

      progam.program_manager = {
        id: employee.id,
        full_name: employee.full_name,
        pass_photo_path: [employee.pass_photo_path[0]],
        avatar: [(employee as any).user.avatar],
      }
    } else {
      progam.program_manager = null
    }

    if (v.grant_manager) {
      const employeeGrantManager = await this.employeeRepository.getEmployeeById(v.grant_manager)

      progam.grant_manager = {
        id: employeeGrantManager.id,
        full_name: employeeGrantManager.full_name,
        pass_photo_path: [employeeGrantManager.pass_photo_path[0]],
        avatar: [(employeeGrantManager as any).user.avatar],
      }
    } else {
      progam.grant_manager = null
    }

    if (v.budget_controller) {
      const employeeGrantManager = await this.employeeRepository.getEmployeeById(v.budget_controller)

      progam.budget_controller = {
        id: employeeGrantManager.id,
        full_name: employeeGrantManager.full_name,
        pass_photo_path: [employeeGrantManager.pass_photo_path[0]],
        avatar: [(employeeGrantManager as any).user.avatar],
      }
    } else {
      progam.budget_controller = null
    }

    progam.finance_progress = v.finance_progress
    progam.currency = v.currency
    progam.total_budget_value = 0
    progam.total_expenses_value = 0
    progam.program_ownership_type = v.program_ownership_type

    let totalBudget = 0
    const totalExpenses = await this.calculatePaidByProgramId(progam.id)
    for (const p of v.projects) {
      for (const a of p.activities) {
        for (const b of a.budgets) {
          console.log('total ---->', b.cost, b.pkg_qty, b.qty)
          totalBudget += Number(b.qty) * Number(b.pkg_qty) * b.cost
        }
      }
    }

    progam.total_budget = `${v.currency}_${totalBudget}`
    progam.total_budget_value = progam.total_budget_value

    progam.total_expenses = `${v.currency}_${totalExpenses}`
    progam.total_expenses_value = totalExpenses

    progam.finance_progress = Math.ceil((totalExpenses / totalBudget) * 100)

    progam.approval = v.approval

    if (v.created_by) {
      const employee = await this.employeeRepository.getEmployeeByUserId(v.created_by)
      progam.created_by = {
        id: employee[0].id,
        name: employee[0].full_name,
        employee_pass_photo: employee[0].pass_photo_path[0],
      }
    } else {
      progam.created_by = null
    }

    return progam
  }

  async getProgramsListTotal(
    approval_status: string,
    program_ownership_type = '',
    partner_code = '',
    program_manager_id = '',
    sort = '',
    keyword = '',
  ): Promise<number> {
    return await this.programRepository.getAllCount(
      ProgramApproval[approval_status],
      program_ownership_type,
      partner_code,
      program_manager_id,
      sort,
      keyword,
    )
  }

  async approveProgram(id: string, status: string, userId: string, notes: string = ''): Promise<boolean> {
    const approvedAt = new Date()

    const program = await this.programRepository.getById(id)
    const employee = await this.employeeRepository.getEmployeeByUserId(userId)

    if (!program) {
      throw new ServerNotFound('Program not found')
    }

    if (!employee.length) {
      throw new ServerNotFound('Approver employee not found')
    }

    const isInternal = program.program_ownership_type === 'INTERNAL'

    let expectedApproverIds: string[] = []

    if (isInternal) {
      expectedApproverIds = [program.program_manager].filter(Boolean)
    } else {
      expectedApproverIds = [program.grant_manager, program.program_manager].filter(Boolean)
    }

    expectedApproverIds = [...new Set(expectedApproverIds)]

    // INTERNAL Budget Needs:
    // hanya employee yang tersimpan di program.program_manager
    // yang boleh Approve / Reject.
    // PROGRAM/PROJECT tidak diubah.
    if (
      isInternal &&
      (status === 'success' || status === 'rejected') &&
      !expectedApproverIds.includes(employee[0].id)
    ) {
      throw new ServerBadRequest('Only the assigned General Manager can approve or reject INTERNAL Budget Needs')
    }

    if (status === 'success') {
      const fileName = `${formatDateToCsv(new Date())}-${program.program_name}.csv`

      const budgetsOfProgram = await this.programRepository.getListForReportByProgramId(id)

      await this.createSnapshootBudgetCsv(budgetsOfProgram, fileName, program.submitted_at ?? new Date(), approvedAt)

      await this.generalRepo.createLog({
        pr_id: '',
        rf_id: '',
        user_id: userId,
        log_type: 'Program',
        raw_data: '',
        program_id: id,
        message:
          `Approved the Budget Needs for ` +
          `<a href="/dashboard/project/${program.id}?tab=budget-needs">` +
          `${program.program_name}</a> project as ` +
          `${isInternal ? 'General Manager' : 'assigned approver'}`,
      })
    }

    if (status === 'cancelled') {
      await this.generalRepo.createLog({
        pr_id: '',
        rf_id: '',
        user_id: userId,
        log_type: 'Program',
        raw_data: '',
        program_id: id,
        message:
          `Cancelled the submission of Budget Needs for ` +
          `<a href="/dashboard/project/${program.id}?tab=budget-needs">` +
          `${program.program_name}</a> project`,
      })
    }

    await this.programRepository.createApproval(status, approvedAt, id, notes)

    for (const approverId of expectedApproverIds) {
      await this.notifRepo.resolveNotif(approverId, program.id, NotifType.APPROVAL_PROGRAM_BUDGET)
    }

    if (status === 'success' && program.submitted_by) {
      await this.mailRepo.sendWorkflowToEmployees(
        [program.submitted_by],
        'Budget Needs Disetujui',
        `Budget Needs untuk "${program.program_name}" telah disetujui.`,
        `https://sim.puskapa.org/dashboard/project/${program.id}?tab=budget-needs`,
        'Lihat Budget Needs',
      )
    }

    if (status === 'rejected') {
      if (program.submitted_by) {
        await this.notifRepo.create({
          employee_id: program.submitted_by,
          ref_id: program.id,
          notif_type: NotifType.ACTION_PROGRAM_BUDGET,
          deleted_at: null,
        })

        const submittedBy = await this.employeeRepository.getEmployeeById(program.submitted_by)

        const tempVal = new Map<string, string>()

        tempVal.set('{{.HEADING}}', 'Budget Needs Approval Request')

        tempVal.set(
          '{{.BODY}}',
          `${employee[0].full_name} rejected the Budget Needs for <b>${program.program_name}</b> as ${
            isInternal ? 'General Manager' : 'assigned approver'
          }, with a message: ${notes}.`,
        )

        tempVal.set('{{.BUTTON_TITLE}}', 'Revise Budget Needs')

        tempVal.set('{{.BUTTON_URL}}', `https://sim.puskapa.org/dashboard/project/${program.id}`)

        if (submittedBy?.user?.email) {
          await this.mailRepo.sendNotificationNoReply('Budget Needs Approval Request', submittedBy.user.email, tempVal)
        }
      }

      await this.generalRepo.createLog({
        pr_id: '',
        rf_id: '',
        user_id: userId,
        log_type: 'Program',
        raw_data: '',
        program_id: id,
        message:
          `Rejected the Budget Needs for ` +
          `<a href="/dashboard/project/${program.id}?tab=budget-needs">` +
          `${program.program_name}</a> project as ` +
          `${isInternal ? 'General Manager' : 'assigned approver'}, ` +
          `with a message:`,
        body: notes,
      })
    }

    return true
  }

  async createProgram(
    currency: string,
    contract: object,
    timeline: object,
    partner_code: string,
    program_name: string,
    grant_manager: string,
    program_manager: string,
    program_officer: string,
    budget_controller: string,
    estimated_budget: number,
    program_description: string,
    code: string,
    form_state: string,
    form_progress: number,
    program_ownership_type?: string,
    createdBy?: string,
  ): Promise<string> {
    // cehck partner exist
    const partner = await this.partnerRepository.getByCode(partner_code)
    if (!partner) {
      throw new ServerBadRequest('Partner Not Found')
    }

    const inserted = await this.programRepository.create({
      currency: currency,
      contract: contract,
      timeline: timeline,
      partner_code: partner_code,
      program_name: program_name,
      grant_manager: grant_manager,
      program_manager: program_manager,
      program_officer: program_officer,
      estimated_budget: estimated_budget,
      budget_controller: budget_controller,
      program_description: program_description,
      created_by: createdBy,
      code: code,
      form_progress: form_progress,
      form_state: form_state,
      program_ownership_type: program_ownership_type,
      created_at: new Date(),
    })

    const employee = await this.employeeRepository.getEmployeeByUserId(createdBy)

    await this.generalRepo.createLog({
      pr_id: '',
      rf_id: '',
      user_id: employee[0].user_id,
      log_type: 'Program',
      raw_data: JSON.stringify(inserted, (_, value) => (typeof value === 'bigint' ? value.toString() : value)),
      program_id: inserted.id,
      message: `Create a <a href="/dashboard/project/${inserted.id}">${inserted.program_name}</a> project`,
    })

    const tempVal = new Map<string, string>()
    tempVal.set('{{.HEADING}}', `Project ${inserted.program_name} was created by ${employee[0].full_name}`)
    tempVal.set('{{.BODY}}', 'Congratulations, project created')
    tempVal.set('{{.BUTTON_TITLE}}', 'Open Project')
    tempVal.set('{{.BUTTON_URL}}', `https://staging.sim.puskapa.org/dashboard/project/${inserted.id}`)

    await this.mailRepo.sendNotificationNoReply(
      `Project ${inserted.program_name} was created by ${employee[0].full_name}`,
      employee[0].user.email,
      tempVal,
    )

    const notificationTarget = inserted.program_ownership_type === 'INTERNAL'
      ? inserted.program_manager
      : inserted.grant_manager

    if (notificationTarget && notificationTarget !== employee[0].id) {
      await this.mailRepo.sendWorkflowToEmployees(
        [notificationTarget],
        inserted.program_ownership_type === 'INTERNAL' ? 'Internal Needs Baru' : 'Project Baru',
        `Project "${inserted.program_name}" telah dibuat oleh ${employee[0].full_name} dan Anda ditetapkan sebagai ${inserted.program_ownership_type === 'INTERNAL' ? 'General Manager' : 'Grant Manager'}.`,
        `https://sim.puskapa.org/dashboard/project/${inserted.id}`,
        'Lihat Project',
      )
    }

    return inserted.id
  }

  async deleteProgram(id: string): Promise<boolean> {
    await this.programRepository.delete(id)
    return true
  }

  async updateProgram(
    currency: string,
    contract: object,
    timeline: object,
    partner_code: string,
    program_name: string,
    grant_manager: string,
    program_manager: string,
    program_officer: string,
    budget_controller: string,
    estimated_budget: number,
    program_description: string,
    code: string,
    finance_progress: number,
    form_state: string,
    form_progress: number,
    id: string,
    userId: string,
  ): Promise<string> {
    // cehck partner exist
    const partner = await this.partnerRepository.getByCode(partner_code)
    if (!partner) {
      throw new ServerBadRequest('Partner Not Found')
    }

    const inserted = await this.programRepository.update(
      {
        currency: currency,
        contract: contract,
        timeline: timeline,
        partner_code: partner_code,
        program_name: program_name,
        grant_manager: grant_manager,
        program_manager: program_manager,
        program_officer: program_officer,
        budget_controller: budget_controller,
        finance_progress: finance_progress,
        estimated_budget: estimated_budget,
        program_description: program_description,
        code: code,
        form_state: form_state,
        form_progress: form_progress,
      },
      id,
    )

    const employee = await this.employeeRepository.getEmployeeByUserId(userId)

    await this.generalRepo.createLog({
      pr_id: '',
      rf_id: '',
      user_id: employee[0].user_id,
      log_type: 'Program',
      raw_data: JSON.stringify(inserted, (_, value) => (typeof value === 'bigint' ? value.toString() : value)),
      program_id: inserted.id,
      message: `Updated the <a href="/dashboard/project/${inserted.id}">${inserted.program_name}</a> project information`,
    })

    return inserted.id
  }

  async calculateRemainingBudget(budgetId: string): Promise<number> {
    let allRfsInProgram = []

    const budget = await this.budgetRepository.getDetailBudgetUpTree(budgetId)
    const programId = budget.activities.projects.program_id

    allRfsInProgram = await this.rfRepository.getListRf(programId, null)

    //console.log('FOUND RFS INSIDE PROGRAM', allRfsInProgram.length)

    let totalRequestedInRfs = 0

    const realBudget = await this.budgetRepository.getDetailBudgetUpTree(budgetId)

    for (const rfItem of allRfsInProgram) {
      if (rfItem.rf_budgets != undefined) {
        for (const budget of JSON.parse(rfItem.rf_budgets)) {
          if (budget.id != budgetId) {
            continue
          }
          totalRequestedInRfs +=
            Number(budget.qty) * Number(budget.pkg_qty) * Number(budget.cost ?? budget.unit_cost_value)
        }
      }
    }

    const remaining = realBudget.qty * realBudget.pkg_qty * realBudget.cost - totalRequestedInRfs
    console.log('remaining', remaining)
    return remaining
  }

  async calculateRemainingBudgetBtActivityId(activityId: string): Promise<number> {
    if (activityId == undefined) {
      return -1
    }
    let allRfsInProgram = []
    console.log('calculating for activity id', activityId)

    const program = await this.programRepository.getProgramIdByActivityId(activityId)
    if (program.lenght < 1) {
      return -1
    }
    console.log('program', program[0]['id'])

    allRfsInProgram = await this.rfRepository.getListRf(program[0]['id'], null)

    //console.log('FOUND RFS', allRfsInProgram.length)

    let totalAllRemaining = 0

    for (const rfItem of allRfsInProgram) {
      if (rfItem.rf_budgets != undefined) {
        for (const budget of JSON.parse(rfItem.rf_budgets)) {
          //console.log('calculating', budget.description)
          const realBudget = await this.budgetRepository.getDetailBudgetUpTree(budget.id)
          if (realBudget.activities.id == activityId) {
            totalAllRemaining += await this.calculateRemainingBudget(budget.id)
            //console.log('REMAINGN', budget.description, totalAllRemaining)
          }
        }
      }
    }

    if (allRfsInProgram.length < 1) {
    }

    return totalAllRemaining
  }

  async calculatePendingRequestedByBudgetId(budgetId: string): Promise<number> {
    // paid - rf total request
    let total_retur = 0
    const realbudget = await this.budgetRepository.getById(budgetId)
    total_retur += realbudget.retur
    // get total budget on rf requested (find rf contain budget)
    const budget = await this.budgetRepository.getDetailBudgetUpTree(budgetId)
    // get all rf in  program
    if (!budget) {
      return 0
    }
    const programId = budget.activities.projects.program_id

    let requestedRfTotal = 0
    let paidTotal = 0

    const rfs = await this.rfRepository.getListRf(programId, null, true)

    // get total payment request paid (find pr contain budget)
    for (const rf of rfs) {
      if (
        rf.program_manager_approval_status == 'rejected' ||
        rf.program_manager_approval_status == 'revision' ||
        rf.budget_controller_approval_status == 'rejected'
      ) {
        continue
      }

      for (const rfBudget of JSON.parse(rf.rf_budgets)) {
        if (rfBudget.id == budgetId) {
          requestedRfTotal += rfBudget.unit_cost_value * rfBudget.qty * rfBudget.pkg_qty

          console.log(
            'FOUND RF',
            rf.id,
            budgetId,
            'TOTAL RF REQUESTED',
            rfBudget.unit_cost_value * rfBudget.qty * rfBudget.pkg_qty,
          )

          const prListByProgram = await this.prRepository.getListPRByRFID(rf.id)

          for (const rf of prListByProgram) {
            for (const pr of rf.payment_request) {
              let totalBudget = 0
              if (!pr.paid_at) {
                continue
              }

              if (pr.pr_budgets) {
                if (pr.payment_type == 'payment-request') {
                  for (const budget of JSON.parse(pr.pr_budgets as string)) {
                    if (budget.id == budgetId) {
                      totalBudget += Number(budget.qty) * Number(budget.pkg_qty) * Number(budget.unit_cost_value)
                    }
                  }
                }

                if (pr.payment_type == 'advance-perdiem-fee') {
                  for (const budget of JSON.parse(pr.pr_budgets as string)) {
                    const traveExpense = await this.prRepository.getListTEByRFID(rf.id)
                    console.log('FIND IF RF HAS TE', rf.id, rf.about_request, traveExpense)
                    if (budget.id == budgetId && traveExpense.length == 0) {
                      totalBudget += Number(budget.qty) * Number(budget.pkg_qty) * Number(budget.unit_cost_value)
                    }
                  }
                }
                if (pr.payment_type == 'travel-expense') {
                  for (const budget of JSON.parse(pr.pr_budgets as string)) {
                    if (budget.id == budgetId) {
                      if ('total_expenses_real' in budget.additional_data) {
                        console.log(budget.description, budget.additional_data.total_expenses_real)
                        console.log('===========')
                        totalBudget += budget.additional_data.total_expenses_real
                      } else if ('static_data' in budget.additional_data) {
                        let apf = 0
                        if ('apf' in budget.additional_data) {
                          apf = budget.additional_data.apf
                        }

                        let total_expense = budget.total_expenses
                        for (const perdiem of budget.additional_data.static_data) {
                          total_expense += perdiem.total
                        }

                        // TAX

                        const travellerPerdiemTax = budget.additional_data.traveller_perdiem_tax
                        const taxBenchmark = budget.additional_data['tax_benchmark']
                        const perdiemTax =
                          Math.abs(budget.additional_data['static_data']['3']['tax']) === Math.abs(taxBenchmark)
                            ? budget.qty *
                              budget.unit_cost_value *
                              (budget.pkg_qty - budget.additional_data['static_data']['3']['pkg_qty']) *
                              (travellerPerdiemTax / 100)
                            : budget.qty * budget.unit_cost_value * budget.pkg_qty * (travellerPerdiemTax / 100)

                        console.log('travel tax ===>', budget.description)
                        console.log('TOTAL_EXPENSE', total_expense)
                        console.log('APF TOTAL', apf)
                        console.log('PERDIEM TAX', perdiemTax)
                        console.log('CALCULATION', total_expense, apf, perdiemTax, total_expense - apf - perdiemTax)
                        totalBudget += total_expense - perdiemTax

                        console.log(budget.description, apf, total_expense)
                        console.log('===========')
                      } else {
                        totalBudget += budget.total_expenses
                      }
                    }
                  }
                }
                if (pr.payment_type == 'advance-payment-request') {
                  for (const budget of JSON.parse(pr.pr_budgets as string)) {
                    if (budget.id == budgetId) {
                      totalBudget += budget.advance_payment_total
                    }
                  }
                }
                if (pr.payment_type == 'advance-payment-statement') {
                  for (const budget of JSON.parse(pr.pr_budgets as string)) {
                    if (budget.id == budgetId) {
                      const total = Number(budget.qty) * Number(budget.pkg_qty) * Number(budget.unit_cost_value)
                      console.log('APS DECCCC', budget.advance_payment_total, total)
                      totalBudget += total - budget.advance_payment_total
                    }
                  }
                }
              }

              // TODO: substract tax
              // let totalTax = 0
              // if (pr.tax) {
              //   try {
              //     const taxes = JSON.parse(pr.tax.toString())['taxes']
              //     for (const tax of taxes) {
              //       totalTax += tax.total_tax
              //     }
              //   } catch (e) {
              //     console.log('Faoled to calculate tax', e)
              //   }
              // }
              // totalBudget -= totalTax
              paidTotal += totalBudget
            }
          }
        }
      }
    }
    console.log('pending requested budget', budget.description, requestedRfTotal, paidTotal, total_retur)
    return requestedRfTotal - paidTotal - total_retur
  }

  async calculatePaidByBudgetId(budgetId: string): Promise<number> {
    // paid - rf total request

    // get total budget on rf requested (find rf contain budget)
    const budget = await this.budgetRepository.getDetailBudgetUpTree(budgetId)
    // get all rf in  program
    if (!budget) {
      return 0
    }
    const programId = budget.activities.projects.program_id

    let paidTotal = 0
    const rfs = await this.rfRepository.getListRf(programId, null)
    console.log('total rfs', rfs.length)
    const advancedPaymentPaid = 0

    // get total payment request paid (find pr contain budget)
    for (const rf of rfs) {
      for (const rfBudget of JSON.parse(rf.rf_budgets)) {
        console.log('budget is', rfBudget.id, budgetId)
        if (rfBudget.id == budgetId) {
          const prListByProgram = await this.prRepository.getListPRByRFID(rf.id)
          console.log('total prs', rfs.length)

          for (const rf of prListByProgram) {
            for (const pr of rf.payment_request) {
              let totalBudget = 0

              if (pr.pr_budgets) {
                if (!pr.paid_at) {
                  continue
                }

                if (pr.payment_type == 'payment-request') {
                  for (const budget of JSON.parse(pr.pr_budgets as string)) {
                    if (budget.id == budgetId) {
                      totalBudget += Number(budget.qty) * Number(budget.pkg_qty) * Number(budget.unit_cost_value)
                    }
                  }
                }
                if (pr.payment_type == 'travel-expense') {
                  for (const budget of JSON.parse(pr.pr_budgets as string)) {
                    if (budget.id == budgetId) {
                      if ('total_expenses_real' in budget.additional_data) {
                        console.log(budget.description, budget.additional_data.total_expenses_real)
                        console.log('===========')
                        totalBudget += budget.additional_data.total_expenses_real
                      } else if ('static_data' in budget.additional_data) {
                        let apf = 0
                        if ('apf' in budget.additional_data) {
                          apf = budget.additional_data.apf
                        }

                        let total_expense = budget.total_expenses
                        for (const perdiem of budget.additional_data.static_data) {
                          total_expense += perdiem.total
                        }

                        // TAX

                        const travellerPerdiemTax = budget.additional_data.traveller_perdiem_tax
                        const taxBenchmark = budget.additional_data['tax_benchmark']
                        const perdiemTax =
                          Math.abs(budget.additional_data['static_data']['3']['tax']) === Math.abs(taxBenchmark)
                            ? budget.qty *
                              budget.unit_cost_value *
                              (budget.pkg_qty - budget.additional_data['static_data']['3']['pkg_qty']) *
                              (travellerPerdiemTax / 100)
                            : budget.qty * budget.unit_cost_value * budget.pkg_qty * (travellerPerdiemTax / 100)

                        console.log('travel tax ===>', budget.description)
                        console.log('TOTAL_EXPENSE', total_expense)
                        console.log('APF TOTAL', apf)
                        console.log('PERDIEM TAX', perdiemTax)
                        console.log('CALCULATION', total_expense, apf, perdiemTax, total_expense - perdiemTax)
                        totalBudget += total_expense - perdiemTax

                        console.log(budget.description, apf, total_expense)
                        console.log('===========')
                      } else {
                        totalBudget += budget.total_expenses
                      }
                    }
                  }
                }
                if (pr.payment_type == 'advance-perdiem-fee') {
                  for (const budget of JSON.parse(pr.pr_budgets as string)) {
                    const travelExpense = await this.prRepository.getListTEByRFID(rf.id)

                    if (budget.id == budgetId && travelExpense.length == 0) {
                      totalBudget += Number(budget.qty) * Number(budget.pkg_qty) * Number(budget.unit_cost_value)
                    }
                  }
                }

                if (pr.payment_type == 'advance-payment-request') {
                  for (const budget of JSON.parse(pr.pr_budgets as string)) {
                    if (budget.id == budgetId) {
                      totalBudget += budget.advance_payment_total
                    }
                  }
                }
                if (pr.payment_type == 'advance-payment-statement') {
                  for (const budget of JSON.parse(pr.pr_budgets as string)) {
                    if (budget.id == budgetId) {
                      const total = Number(budget.qty) * Number(budget.pkg_qty) * Number(budget.unit_cost_value)
                      console.log('APS DECCCC', budget.advance_payment_total, total)
                      totalBudget += total - budget.advance_payment_total
                    }
                  }
                }

                // if it was APS use closure number to substract
              }

              paidTotal += totalBudget
            }
          }
        }
      }
    }
    console.log('paid budget', budget.description, paidTotal)
    console.log('payment_total', paidTotal)
    console.log('advance total', advancedPaymentPaid)

    if (paidTotal == 0 && advancedPaymentPaid > 0) {
      return advancedPaymentPaid
    }

    return paidTotal + advancedPaymentPaid
  }

  async calculatePaidByProgramId(programId: string, skipTax = false): Promise<number> {
    // paid - rf total request

    let paidTotal = 0

    const rfs = await this.rfRepository.getListRf(programId, null)

    for (const rf of rfs) {
      const prListByProgram = await this.prRepository.getListPRByRFID(rf.id)
      for (const rf of prListByProgram) {
        if (
          rf.program_manager_approval_status == 'rejected' ||
          rf.budget_controller_approval_status == 'rejected' ||
          rf.program_manager_approval_status == 'revision'
        ) {
          continue
        }

        for (const pr of rf.payment_request) {
          if (pr.paid_at) {
            let totalBudget = 0

            if (pr.pr_budgets) {
              if (!pr.paid_at) {
                continue
              }

              if (pr.payment_type == 'payment-request') {
                for (const budget of JSON.parse(pr.pr_budgets as string)) {
                  totalBudget += Number(budget.qty) * Number(budget.pkg_qty) * Number(budget.unit_cost_value)
                }
              }

              if (pr.payment_type == 'travel-expense') {
                for (const budget of JSON.parse(pr.pr_budgets as string)) {
                  if ('total_expenses_real' in budget.additional_data) {
                    totalBudget += budget.additional_data.total_expenses_real
                  } else if ('perdiem_final' in budget.additional_data) {
                    totalBudget += budget.additional_data.perdiem_final
                  } else {
                    totalBudget += budget.total_expenses
                  }
                }
              }

              if (pr.payment_type == 'advance-perdiem-fee') {
                for (const budget of JSON.parse(pr.pr_budgets as string)) {
                  const traveExpense = await this.prRepository.getListTEByRFID(rf.id)
                  console.log('FIND IF RF HAS TE', rf.id, rf.about_request, traveExpense)
                  if (traveExpense.length == 0) {
                    totalBudget += Number(budget.qty) * Number(budget.pkg_qty) * Number(budget.unit_cost_value)
                  }
                }
              }

              if (pr.payment_type == 'advance-payment-request') {
                for (const budget of JSON.parse(pr.pr_budgets as string)) {
                  totalBudget += budget.advance_payment_total
                }
              }
              if (pr.payment_type == 'advance-payment-statement') {
                for (const budget of JSON.parse(pr.pr_budgets as string)) {
                  const total = Number(budget.qty) * Number(budget.pkg_qty) * Number(budget.unit_cost_value)
                  console.log('APS DECCCC', budget.advance_payment_total, total)
                  totalBudget += total - budget.advance_payment_total
                }
              }
            }

            paidTotal += totalBudget
          }
        }
      }
    }
    return paidTotal
  }

  async setProgramPerdiemSettings(program_id: string, perdiem: ProgramPerdiemSettings, userId: string): Promise<any> {
    let current_perdiem = await this.programRepository.getPerdiemSettingByProgramId(program_id)
    if (!current_perdiem) {
      current_perdiem = await this.programRepository.createPerdiemSetting({
        base_value_normal: perdiem.base_value_normal,
        base_value_overseas: perdiem.base_value_overseas,
        base_value_remote_area: perdiem.base_value_remote_area,
        travel_perdiem: perdiem.travel_perdiem,
        activity_perdiem: perdiem.activity_perdiem,
        program_id: program_id,
        note: perdiem.note,
        travel_expense_percentages_breakfast: perdiem.travel_expense_percentages.breakfast,
        travel_expense_percentages_lunch: perdiem.travel_expense_percentages.lunch,
        travel_expense_percentages_dinner: perdiem.travel_expense_percentages.dinner,
        travel_expense_non_overnight: perdiem.travel_expense_percentages.non_overnight,
        travel_expense_travel_days: perdiem.travel_expense_percentages.travel_days,
      })
      const programDetail = await this.programRepository.getById(program_id)

      await this.generalRepo.createLog({
        pr_id: '',
        rf_id: '',
        user_id: userId,
        log_type: 'Program',
        raw_data: '',
        program_id: program_id,
        message: `Set up the Perdiem Setting for <a href="/dashboard/project/${program_id}">${programDetail.program_name}</a> project`,
      })

      return
    }

    // update

    await this.programRepository.updatePerdiemSetting({
      base_value_overseas: perdiem.base_value_overseas,
      base_value_normal: perdiem.base_value_normal,
      base_value_remote_area: perdiem.base_value_remote_area,
      travel_perdiem: perdiem.travel_perdiem,
      activity_perdiem: perdiem.activity_perdiem,
      program_id: program_id,
      note: perdiem.note,
      travel_expense_percentages_breakfast: perdiem.travel_expense_percentages.breakfast,
      travel_expense_percentages_lunch: perdiem.travel_expense_percentages.lunch,
      travel_expense_percentages_dinner: perdiem.travel_expense_percentages.dinner,
      travel_expense_travel_days: perdiem.travel_expense_percentages.travel_days,
      travel_expense_non_overnight: perdiem.travel_expense_percentages.non_overnight,
      id: current_perdiem.id,
    })

    const programDetail = await this.programRepository.getById(program_id)

    await this.generalRepo.createLog({
      pr_id: '',
      rf_id: '',
      user_id: userId,
      log_type: 'Program',
      raw_data: '',
      program_id: program_id,
      message: `Updated the Perdiem Setting for <a href="/dashboard/project/${program_id}">${programDetail.program_name}</a> project`,
    })

    return true
  }

  async getProgramPerdiemSettings(program_id: string): Promise<ProgramPerdiemSettings> {
    const perdiem = await this.programRepository.getPerdiemSettingByProgramId(program_id)
    if (!perdiem) {
      throw new ServerNotFound('Perdiem settings must be setted')
    }

    return {
      base_value_remote_area: Number(perdiem.base_value_remote_area.toString()),
      base_value_normal: Number(perdiem.base_value_normal.toString()),
      base_value_overseas: Number(perdiem.base_value_overseas.toString()),
      travel_perdiem: Number(perdiem.travel_perdiem.toString()),
      activity_perdiem: Number(perdiem.activity_perdiem.toString()),
      note: perdiem.note,
      travel_expense_percentages: {
        breakfast: Number(perdiem.travel_expense_percentages_breakfast.toString()),
        lunch: Number(perdiem.travel_expense_percentages_lunch.toString()),
        dinner: Number(perdiem.travel_expense_percentages_dinner.toString()),
        non_overnight: Number(perdiem.travel_expense_non_overnight.toString()),
        travel_days: Number(perdiem.travel_expense_travel_days.toString()),
      },
    } as ProgramPerdiemSettings
  }

  async addFundReceviced(
    programId: string,
    userId: string,
    amount?: number,
    notes?: string,
    documents?: string[],
    source?: string,
  ): Promise<any> {
    const employee = await this.employeeRepository.getEmployeeByUserId(userId)

    const normalizedAmount = amount == null ? null : BigInt(Math.round(Number(amount)))

    return await this.programRepository.addFundReceived({
      program_id: programId,
      created_at: new Date(),
      submitted_by: employee[0].id,
      amount: normalizedAmount,
      notes: notes,
      documents: documents,
      source: source,
    })
  }

  async getFundReceviced(programId: string): Promise<ProgramReceivedFundDetail[]> {
    const funds = await this.programRepository.getFundReceived(programId)

    const fundsFormated = []

    for (const fund of funds) {
      const fundFormat = new ProgramReceivedFundDetail()
      fundFormat.notes = fund.notes
      fundFormat.id = fund.id
      fundFormat.documents = fund.documents as string[]
      fundFormat.amount = Number(fund.amount)
      fundFormat.created_at = fund.created_at.toString()
      fundFormat.source = fund.source

      const employee = await this.employeeRepository.getEmployeeById(fund.submitted_by)

      fundFormat.created_by = {
        id: employee.id,
        name: employee.full_name,
        pass_photo: employee.pass_photo_path?.[0],
      } as EmployeeSimpleDetail

      fundsFormated.push(fundFormat)
    }

    return fundsFormated
  }
}
