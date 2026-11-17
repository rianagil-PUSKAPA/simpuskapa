import { RoleDefinition } from '@/shared/role.access'
import { Injectable } from '@nestjs/common'
import { finance_logs, ProgramApproval } from '@prisma/client'
import { argv0 } from 'process'
import { BudgetRepository } from '../repositories/budget.repository'
import { EmployeeRepository } from '../repositories/employee.repository'
import { GeneralRepository } from '../repositories/general.repository'
import { NotificationRepository } from '../repositories/notification.repository'
import { PRRepository } from '../repositories/pr.repository'
import { ProgramRepository } from '../repositories/program.repository'
import { RfRepository } from '../repositories/rf.repository'
import { TimeOffQuotaRepository } from '../repositories/time.off.quota.repository'
import { DashboardFinance, EmployeeProfile, Log, MetadataDashboard, MetadataTotals } from '../types/metadata.dto'
import { NotificationRef, NotificationsResponse, Notificaton, NotifType } from '../types/notification.dto'
import { PRServiceService } from './pr.service'
import { ProgramService } from './program.service'
import { RfServiceService } from './rf.service'
import { TimeOffRequestService } from './time.off.request.service'

@Injectable()
export class MetadataService {
  constructor(
    private timeOffRepo: TimeOffQuotaRepository,
    private timeoffService: TimeOffRequestService,
    private logRepo: GeneralRepository,
    private employeeRepository: EmployeeRepository,
    private rfRepository: RfRepository,
    private programRepository: ProgramRepository,
    private programService: ProgramService,
    private prRepository: PRRepository,
    private budgetRepository: BudgetRepository,
    private notifRepo: NotificationRepository,
    private rfService: RfServiceService,
    private prService: PRServiceService,
  ) {}

  async getMetadataForTotals(userId: string, userRole?: string[]): Promise<MetadataTotals> {
    const employee = await this.employeeRepository.getEmployeeByUserId(userId)
    if (!employee) {
      return new MetadataTotals()
    }

    const time_off_requested = await this.timeOffRepo.countByStatus('requested')

    const response = new MetadataTotals()
    response.time_off_requested = time_off_requested
    response.need_approval_pr = 0
    response.need_approval_rf = 0
    response.need_approval_program_budget = 0
    response.need_approval_timeoff = 0

    // RF Need Approval
    // rf -> program_manager_approval_status is null AND program_manager is current user

    const rfs = await this.rfRepository.getListRfByProgramManager(employee[0].id)
    console.log('RF EXISTTT')
    for (const rf of rfs) {
      if (rf.program_manager_approval_status != 'approved') {
        response.need_approval_rf += 1
      }
      const roles: Array<string> = employee[0].user.role as []
      if (!rf.budget_controller_approval_status && roles.indexOf('head_of_finance') < 1) {
        response.need_approval_rf += 1
      }
    }
    const all_rfs = await this.rfRepository.getListRfAll()
    for (const rf of all_rfs) {
      const roles: Array<string> = employee[0].user.role as []

      if (rf.budget_controller_approval_status != 'approved' && roles.indexOf('head_of_operation') > -1) {
        response.need_approval_rf += 1
      }
    }

    // total budget approval for head of finance
    if (userRole) {
      if (userRole.indexOf(RoleDefinition.HEAD_OF_FINANCE.toString()) > -1) {
        const total_unapproved_budget = await this.programRepository.getCountTotalByStatus(ProgramApproval.pending)
        response.need_approval_program_budget = total_unapproved_budget
      }
    }

    // PR NEED APPROVAL
    // as budget_controller_approval_by or head of finance or finance_checking_process_by
    const prs = await this.logRepo.getAllNeedApprovalOnPaymentRequest(employee[0].id)
    if (prs) {
      response.need_approval_pr += prs.length
    }

    return response
  }

  async getFilteredLogActivities(log_type: string, ref_id: string): Promise<Log[]> {
    const logs = await this.logRepo.getByLogTypeRef(log_type, ref_id)

    const lastLogs = []

    for (const log of logs) {
      const employee = await this.employeeRepository.getEmployeeByUserId(log.user_id)
      if (employee.length > 0) {
        const actualLog = new Log()

        actualLog.message = log.message
        actualLog.user = new EmployeeProfile()
        actualLog.user.id = log.user_id
        actualLog.user.name = employee[0].full_name
        actualLog.user.employee_pass_photo = employee[0].pass_photo_path[0]
        actualLog.created_at = log.created_at.toISOString()
        actualLog.body = log.body

        lastLogs.push(actualLog)
      }
    }

    return lastLogs
  }

  async getLatestLogActivities(): Promise<Log[]> {
    const logs = await this.logRepo.getLatestLog(100)

    const lastLogs = []

    for (const log of logs) {
      const employee = await this.employeeRepository.getEmployeeByUserId(log.user_id)
      if (employee.length > 0) {
        const actualLog = new Log()

        actualLog.message = log.message
        actualLog.user = new EmployeeProfile()
        actualLog.user.id = log.user_id
        actualLog.user.name = employee[0].full_name
        actualLog.user.employee_pass_photo = employee[0].pass_photo_path[0]
        actualLog.created_at = log.created_at.toISOString()
        actualLog.body = log.body

        lastLogs.push(actualLog)
      }
    }

    return lastLogs
  }

  async getMetadataForDashboard(userId: string, userRole?: string[]): Promise<MetadataDashboard> {
    const meta = new MetadataDashboard()
    meta.need_action_rf = 0
    meta.need_action_pr = 0
    meta.need_approval_pr = 0
    meta.need_approval_rf = 0
    meta.need_approval_timeoff = 0
    meta.need_approval_program_budget = 0

    const employee = await this.employeeRepository.getEmployeeByUserId(userId)
    if (!employee) {
      return meta
    }
    // -- need action rf (action by)
    const actionByRF = await this.logRepo.getAllRfByActionByNotNotified(employee[0].id)
    if (actionByRF) {
      meta.need_action_rf = actionByRF.length
    }

    // - finance checking on pr
    // finance_checking_process_by -
    const financeCheckingPR = await this.logRepo.getAllNeedFinanceCheckingOnPR(employee[0].id)
    if (financeCheckingPR) {
      meta.need_action_pr = financeCheckingPR.length
    }

    // RF Need Approval
    // rf -> program_manager_approval_status is null AND program_manager is current user

    const rfs = await this.rfRepository.getListRfByProgramManager(employee[0].id)
    console.log('RF EXISTTT')
    for (const rf of rfs) {
      if (rf.program_manager_approval_status != 'approved') {
        meta.need_approval_rf += 1
      }
      const roles: Array<string> = employee[0].user.role as []
      if (!rf.budget_controller_approval_status && roles.indexOf('head_of_finance') < 1) {
        meta.need_approval_rf += 1
      }
    }

    const all_rfs = await this.rfRepository.getListRfAll()
    for (const rf of all_rfs) {
      const roles: Array<string> = employee[0].user.role as []

      if (rf.budget_controller_approval_status != 'approved' && roles.indexOf('head_of_operation') > -1) {
        meta.need_approval_rf += 1
      }
    }

    // PR NEED APPROVAL
    // as budget_controller_approval_by or head of finance or finance_checking_process_by
    const prs = await this.logRepo.getAllNeedApprovalOnPaymentRequest(employee[0].id)
    if (prs) {
      meta.need_approval_pr += prs.length
    }

    // total budget approval for head of finance
    if (userRole) {
      if (userRole.indexOf(RoleDefinition.HEAD_OF_FINANCE.toString()) > -1) {
        const total_unapproved_budget = await this.programRepository.getCountTotalByStatus(ProgramApproval.pending)
        meta.need_approval_program_budget = total_unapproved_budget
      }
    }

    return meta
  }

  async getMetadataForFinanceDashboard(year: number): Promise<DashboardFinance> {
    const res = new DashboardFinance()

    const programs = await this.programRepository.getAllByYear(null, year)

    let total_budget_allocation = 0
    let total_expenses = 0
    let total_paid_budget = 0
    let total_pending_requested = 0
    let total_ongoing_program = 0
    let total_payment_request = 0
    let total_pending_prs = 0

    for (const program of programs) {
      if (!program.submitted_at) {
        continue
      }
      if (program.submitted_at.getFullYear() != year) {
        continue
      }
      let totalBudget = 0
      total_expenses += await this.programService.calculatePaidByProgramId(program.id)

      const rfs = await this.rfRepository.getListRf(program.id, '')
      for (const rf of rfs) {
        const prs = await this.prRepository.getTotalCountPrByRfId(rf.id)
        for (const pr of prs) {
          total_payment_request += 1

          if (!pr.paid_at) {
            total_pending_prs += 1
          }
        }
      }

      for (const p of program.projects) {
        for (const a of p.activities) {
          for (const b of a.budgets) {
            total_paid_budget += await this.programService.calculatePaidByBudgetId(b.id)
            total_pending_requested += await this.programService.calculatePendingRequestedByBudgetId(b.id)
            totalBudget += Number(b.qty) * Number(b.pkg_qty) * b.cost
          }
        }
      }

      if (total_expenses < totalBudget) {
        total_ongoing_program += 1
      }

      total_budget_allocation += totalBudget
    }

    res.total_budget_allocation_amount = total_budget_allocation
    res.total_remaining_budget_amount = res.total_budget_allocation_amount - total_expenses
    res.total_paid_payment_amount = total_paid_budget
    res.total_pending_requested_amount = total_pending_requested
    res.total_ongoing = total_ongoing_program
    res.total_payment_request = total_payment_request
    res.pending_payment_request = total_pending_prs

    return res
  }

  async getPersonalizedNotification(userId: string): Promise<Notificaton> {
    const notif_result = new Notificaton()
    notif_result.need_approval_timeoff_total = 0
    notif_result.need_approval_timeoff = []

    notif_result.need_approval_rf_total = 0
    notif_result.need_approval_rf = []
    notif_result.need_approval_program_budget_total = 0
    notif_result.need_approval_program_budget = []

    notif_result.tracking_rf_total = 0
    notif_result.tracking_rf = []
    notif_result.tracking_pr = []
    notif_result.tracking_pr_total = 0

    notif_result.need_action_rf = []
    notif_result.need_action_rf_total = 0

    notif_result.need_action_pr_check_total = 0
    notif_result.need_action_pr_check = []
    notif_result.need_action_pr_pay_total = 0
    notif_result.need_action_pr_pay = []

    notif_result.need_action_program_budget = []
    notif_result.need_approval_program_budget_total = 0

    notif_result.need_approval_pr_total = 0
    notif_result.need_approval_pr = []

    const employee = await this.employeeRepository.getEmployeeByUserId(userId)
    if (employee.length <= 0) {
      return notif_result
    }
    const employe = employee[0]

    const notifs = await this.notifRepo.getAll(employe.id)
    if (notifs.length > 0) {
      for (const notif of notifs) {
        switch (notif.notif_type) {
          case NotifType.APPROVAL_PROGRAM_BUDGET_REVISION:
          case NotifType.APPROVAL_PROGRAM_BUDGET: {
            const notif_detail = {
              id: notif.id,
              ref_id: notif.ref_id,
              ref_type: notif.notif_type,
              employee_id: notif.employee_id,
            } as NotificationRef

            const program = await this.programService.getProgramsLikeList(notif_detail.ref_id)
            notif_detail.notif_detail = program

            if (notif_detail.notif_detail) {
              notif_result.need_approval_program_budget.push(notif_detail)
              notif_result.need_approval_program_budget_total += 1
            }
            break
          }
          case NotifType.APPROVAL_REQUISITION_FORM: {
            const notif_detail = {
              id: notif.id,
              ref_id: notif.ref_id,
              ref_type: notif.notif_type,
              employee_id: notif.employee_id,
            } as NotificationRef

            notif_detail.notif_detail = await this.rfService.getRfOneLikeList(notif_detail.ref_id)

            if (notif_detail.notif_detail) {
              notif_result.need_approval_rf.push(notif_detail)
              notif_result.need_approval_rf_total += 1
            }
            break
          }
          case NotifType.TRACKING_PAYMENT_REQUEST: {
            const notif_detail = {
              id: notif.id,
              ref_id: notif.ref_id,
              ref_type: notif.notif_type,
              employee_id: notif.employee_id,
            } as NotificationRef
            notif_detail.notif_detail = await this.prService.getPrOneLikeLists(notif.ref_id)

            if (notif_detail.notif_detail) {
              notif_result.tracking_pr.push(notif_detail)
              notif_result.tracking_pr_total += 1
            }
            break
          }
          case NotifType.ACTION_REQUISITION_FORM: {
            const notif_detail = {
              id: notif.id,
              ref_id: notif.ref_id,
              ref_type: notif.notif_type,
              employee_id: notif.employee_id,
            } as NotificationRef

            notif_detail.notif_detail = await this.rfService.getRfOneLikeList(notif_detail.ref_id)

            if (notif_detail.notif_detail) {
              notif_result.need_action_rf.push(notif_detail)
              notif_result.need_action_rf_total += 1
            }
            break
          }
          case NotifType.TRACKING_REQUESTITION_FORM: {
            const notif_detail = {
              id: notif.id,
              ref_id: notif.ref_id,
              ref_type: notif.notif_type,
              employee_id: notif.employee_id,
            } as NotificationRef

            notif_detail.notif_detail = await this.rfService.getRfOneLikeList(notif_detail.ref_id)

            if (notif_detail.notif_detail) {
              notif_result.tracking_rf.push(notif_detail)
              notif_result.tracking_rf_total += 1
              notif_result.need_action_rf.push(notif_detail)
              notif_result.need_action_rf_total += 1
            }

            break
          }
          case NotifType.ACTION_PAYMENT_REQUEST_CHECK: {
            const notif_detail = {
              id: notif.id,
              ref_id: notif.ref_id,
              ref_type: notif.notif_type,
              employee_id: notif.employee_id,
            } as NotificationRef

            notif_detail.notif_detail = await this.prService.getPrOneLikeLists(notif.ref_id)

            if (notif_detail.notif_detail) {
              notif_result.need_action_pr_check.push(notif_detail)
              notif_result.need_action_pr_check_total += 1
            }

            break
          }
          case NotifType.ACTION_PAYMENT_REQUEST_PAY: {
            const notif_detail = {
              id: notif.id,
              ref_id: notif.ref_id,
              ref_type: notif.notif_type,
              employee_id: notif.employee_id,
            } as NotificationRef

            notif_detail.notif_detail = await this.prService.getPrOneLikeLists(notif.ref_id)

            if (notif_detail.notif_detail) {
              notif_result.need_action_pr_pay.push(notif_detail)
              notif_result.need_action_pr_pay_total += 1
            }

            break
          }
          case NotifType.ACTION_PROGRAM_BUDGET_REVISION:
          case NotifType.ACTION_PROGRAM_BUDGET: {
            const notif_detail = {
              id: notif.id,
              ref_id: notif.ref_id,
              ref_type: notif.notif_type,
              employee_id: notif.employee_id,
            } as NotificationRef
            const program = await this.programService.getProgramsLikeList(notif_detail.ref_id)
            notif_detail.notif_detail = program

            if (notif_detail.notif_detail) {
              notif_result.need_action_program_budget.push(notif_detail)
              notif_result.need_action_program_budget_total += 1
            }

            break
          }
          case NotifType.APPROVAL_PAYMENT_REQUEST: {
            const notif_detail = {
              id: notif.id,
              ref_id: notif.ref_id,
              ref_type: notif.notif_type,
              employee_id: notif.employee_id,
            } as NotificationRef
            notif_detail.notif_detail = await this.prService.getPrOneLikeLists(notif.ref_id)

            if (notif_detail.notif_detail) {
              notif_result.need_approval_pr.push(notif_detail)
              notif_result.need_approval_pr_total += 1
            }
            break
          }
          case NotifType.APPROVAL_TIMEOFF: {
            const notif_detail = {
              id: notif.id,
              ref_id: notif.ref_id,
              ref_type: notif.notif_type,
              employee_id: notif.employee_id,
            } as NotificationRef
            notif_detail.notif_detail = await this.timeoffService.getById(notif.ref_id, '')[0]
            if (notif_detail.notif_detail) {
              notif_result.need_approval_timeoff.push(notif_detail)
              notif_result.need_approval_timeoff_total += 1
            }

            break
          }
        }
      }
    }

    const approval_pr_mapped = new Map<string, NotificationRef>()
    const approval_rf_mapped = new Map<string, NotificationRef>()

    notif_result.need_approval_pr.forEach((notif) => {
      approval_pr_mapped.set(`${notif.ref_id}#${notif.ref_type}#${notif.employee_id}`, notif)
    })
    notif_result.need_approval_rf.forEach((notif) => {
      approval_rf_mapped.set(`${notif.ref_id}#${notif.ref_type}#${notif.employee_id}`, notif)
    })

    notif_result.need_approval_pr = Array.from(approval_pr_mapped.values())
    notif_result.need_approval_rf = Array.from(approval_rf_mapped.values())

    return notif_result
  }
}
