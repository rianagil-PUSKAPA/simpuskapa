import { BadRequestException, Injectable } from '@nestjs/common'
import { Prisma, ProgramApproval, requisition_form } from '@prisma/client'

import { ServerNotFound } from '@/shared/server.errors'
import { BudgetRepository } from '../repositories/budget.repository'
import { EmployeeRepository } from '../repositories/employee.repository'
import { ProgramRepository } from '../repositories/program.repository'
import { RfRepository } from '../repositories/rf.repository'
import { VendorRepository } from '../repositories/vendor.repository'
import { BudgetActivity, BudgetProgramProjectActivity, BudgetProgramProjectDetail } from '../types/program.dto'
import {
  CreatePersonalHireRfApiRequest,
  CreateProcurementRfApiRequest,
  CreateStaffCostRfApiRequest,
  CreateTravelRfApiRequest,
  EmployeeSimpleDetail,
  RFActionBy,
  RFApprovalDataForList,
  RequisitionFormDetail,
  RequisitionFormSimple,
  TravelRfDetail,
} from '../types/rf.dto'

import { RequisitionFormEnum } from '../../shared/rf.type'
import { GeneralRepository } from '../repositories/general.repository'
import { MailRepository } from '../repositories/mail.repository'
import { NotificationRepository } from '../repositories/notification.repository'
import { PRRepository } from '../repositories/pr.repository'
import { EmployeeProfile } from '../types/metadata.dto'
import { NotifType } from '../types/notification.dto'
import { RoleDefinition } from '@/shared/role.access'
import { UserRepository } from '../repositories/user.repository'

@Injectable()
export class RfServiceService {
  constructor(
    private rfRepository: RfRepository,
    private emplyeeRepository: EmployeeRepository,
    private programRepository: ProgramRepository,
    private budgetRepository: BudgetRepository,
    private vendorRepository: VendorRepository,
    private generalRepo: GeneralRepository,
    private prRepository: PRRepository,
    private notifRepo: NotificationRepository,
    private employeeRepository: EmployeeRepository,
    private mailRepo: MailRepository,
    private userRepository: UserRepository,
  ) {}


  private getRfActionEmployeeId(actionBy: string | null | undefined): string | null {
    const parts = String(actionBy ?? '').split(':')
    return parts.length === 2 && parts[0] === 'employee' && parts[1] ? parts[1] : null
  }

  private async notifyRfSubmitted(rf: requisition_form): Promise<void> {
    const program = await this.programRepository.getById(rf.program_id)
    if (!program) return

    const url = `https://sim.puskapa.org/dashboard/procurement/${program.id}/detail/${rf.program_project_related_id}/${rf.id}`
    const label = ({
      PROCUREMENT: 'Procurement',
      PERSONAL_HIRE: 'Personal Hire',
      TRAVEL: 'Travel',
      STAFF_COST: 'Staff Cost',
    }[rf.rf_type] || 'Requisition') + ' RF'
    const context = `${label} "${rf.about_request}" pada ${program.program_name}`

    await this.mailRepo.sendWorkflowToEmployees(
      [rf.requested_by],
      `${label} berhasil diajukan`,
      `Pengajuan ${context} berhasil dibuat atau diajukan kembali.`,
      url,
      'Lihat RF',
    )

    const actionEmployeeId = this.getRfActionEmployeeId(rf.action_by)
    if (actionEmployeeId) {
      await this.mailRepo.sendWorkflowToEmployees(
        [actionEmployeeId],
        `Ditugaskan sebagai Action by - ${label}`,
        `Anda dipilih sebagai Action by untuk ${context}. Silakan periksa penugasan pada SIM PUSKAPA.`,
        url,
        'Lihat Penugasan',
      )
    }
  }

  private async notifyRfDecision(
    rf: requisition_form,
    status: 'approved' | 'rejected',
    rejectNote = '',
  ): Promise<void> {
    const program = await this.programRepository.getById(rf.program_id)
    if (!program) return

    const url = `https://sim.puskapa.org/dashboard/procurement/${program.id}/detail/${rf.program_project_related_id}/${rf.id}`
    const subject = status === 'approved' ? 'RF Disetujui' : 'RF Ditolak / Perlu Revisi'
    await this.mailRepo.sendWorkflowToEmployees(
      [rf.requested_by],
      subject,
      `RF "${rf.about_request}" pada ${program.program_name} ${status === 'approved' ? 'telah disetujui' : 'ditolak dan perlu direvisi'}.${rejectNote ? ' Catatan: ' + rejectNote : ''}`,
      url,
      'Lihat Status RF',
    )

    if (status === 'approved') {
      const actionEmployeeId = this.getRfActionEmployeeId(rf.action_by)
      if (actionEmployeeId) {
        await this.mailRepo.sendWorkflowToEmployees(
          [actionEmployeeId],
          'RF Telah Disetujui - Action by',
          `RF "${rf.about_request}" pada ${program.program_name} telah disetujui. Silakan tindak lanjuti penugasan Anda.`,
          url,
          'Buka RF',
        )
      }
    }
  }

  async sendNotifToProgramManagerToApprove(rfId: string, programManagerEmployeeId: string) {
    const rf = await this.rfRepository.getRfByOnlyId(rfId)
    const program = await this.programRepository.getById(rf.program_id)

    if (!program) {
      throw new ServerNotFound('Program not found')
    }

    let approvalEmployee = await this.employeeRepository.getEmployeeById(programManagerEmployeeId)

    if (program.program_ownership_type === 'INTERNAL') {
      const generalManagerUser = await this.userRepository.getUserByRole(RoleDefinition.GENERAL_MANAGER)
      const generalManagerEmployees = generalManagerUser
        ? await this.employeeRepository.getEmployeeByUserId(generalManagerUser.id)
        : []

      approvalEmployee = generalManagerEmployees?.[0]
        ? await this.employeeRepository.getEmployeeById(generalManagerEmployees[0].id)
        : null
    }

    if (!approvalEmployee) {
      throw new ServerNotFound(
        program.program_ownership_type === 'INTERNAL'
          ? 'General Manager employee not found'
          : 'Project Manager employee not found',
      )
    }

    // Notification dan email menggunakan recipient yang sama.
    await this.notifRepo.create({
      employee_id: approvalEmployee.id,
      ref_id: rfId,
      notif_type: NotifType.APPROVAL_REQUISITION_FORM,
      deleted_at: null,
    })

    if (approvalEmployee.user?.email) {
      const typeLabel =
        {
          PROCUREMENT: 'Procurement',
          PERSONAL_HIRE: 'Personal Hire',
          TRAVEL: 'Travel',
          STAFF_COST: 'Staff Cost',
        }[String(rf.rf_type)] || 'Requisition Form'

      const tempVal = new Map<string, string>()

      tempVal.set('{{.HEADING}}', `${typeLabel} RF Approval Request`)

      tempVal.set(
        '{{.BODY}}',
        `A new <b>${typeLabel} RF</b> "<b>${rf.about_request}</b>" was submitted for <b>${program.program_name}</b> project.`,
      )

      tempVal.set('{{.BUTTON_TITLE}}', 'Review RF')

      tempVal.set(
        '{{.BUTTON_URL}}',
        `https://sim.puskapa.org/dashboard/procurement/${program.id}/detail/${rf.program_project_related_id}/${rf.id}`,
      )

      await this.mailRepo.sendNotificationNoReply(
        `${typeLabel} RF Approval Request`,
        approvalEmployee.user.email,
        tempVal,
      )
    }
  }

  async createRFProcurement(
    rf: CreateProcurementRfApiRequest,
    programId: string,
    projectId: string,
    userId: string,
  ): Promise<string> {
    const submittedByEmployee = await this.emplyeeRepository.getEmployeeByUserId(userId)

    if (submittedByEmployee.length <= 0) {
      throw new ServerNotFound('submited employee by not found')
    }

    const program = await this.programRepository.getById(programId)

    if (rf.budgets) {
      for (const budget of rf.budgets) {
        const chekedBudget = await this.budgetRepository.getDetailBudgetUpTree(budget.id)
        if (!chekedBudget) {
          throw new BadRequestException('Budget Not Found')
        }
      }
    }

    const insertedRf = await this.rfRepository.create(
      {
        action_by: rf.action_by,
        program_id: programId,
        rf_type: RequisitionFormEnum.PROCUREMENT,
        about_request: rf.about_request,
        deadline: rf.deadline,
        program_project_related_id: projectId,
        program_manager_approval_status: ProgramApproval.pending,
        requested_at: new Date().toISOString(),
        requested_by: submittedByEmployee[0].id,
        request_number: 'xxx',
        request_number_seq: 0,
        rf_budgets: JSON.stringify(rf.budgets),
        staff_id: '',
      },
      program.partner.code,
    )

    const employee = await this.emplyeeRepository.getEmployeeByUserId(userId)

    await this.generalRepo.createLog({
      pr_id: '',
      rf_id: insertedRf.id,
      user_id: employee[0].user_id,
      log_type: 'RequisitionForm',
      raw_data: '',
      program_id: programId,
      message: `Submitted a new Procurement RF <a href="/dashboard/procurement/${program.id}/detail/${projectId}/${insertedRf.id}">"${insertedRf.about_request}"</a> from ${program.program_name} project`,
    })

    await this.sendNotifToProgramManagerToApprove(insertedRf.id, program.program_manager)
    await this.notifyRfSubmitted(insertedRf)
    await this.notifRepo.create({
      employee_id: insertedRf.requested_by,
      ref_id: insertedRf.id,
      notif_type: NotifType.TRACKING_REQUESTITION_FORM,
      deleted_at: null,
    })

    return insertedRf.id
  }

  async createRFStaffCost(
    rf: CreateStaffCostRfApiRequest,
    programId: string,
    projectId: string,
    userId: string,
  ): Promise<string> {
    const submittedByEmployee = await this.emplyeeRepository.getEmployeeByUserId(userId)

    if (submittedByEmployee.length <= 0) {
      throw new ServerNotFound('submited employee by not found')
    }

    const program = await this.programRepository.getById(programId)

    if (rf.budgets) {
      for (const budget of rf.budgets) {
        const chekedBudget = await this.budgetRepository.getDetailBudgetUpTree(budget.id)
        if (!chekedBudget) {
          throw new BadRequestException('Budget Not Found')
        }
      }
    }

    const insertedRf = await this.rfRepository.create(
      {
        action_by: rf.action_by,
        program_id: programId,
        rf_type: RequisitionFormEnum.STAFF_COST,
        about_request: rf.about_request,
        deadline: rf.deadline,
        program_project_related_id: projectId,
        program_manager_approval_status: ProgramApproval.pending,
        requested_at: new Date().toISOString(),
        requested_by: submittedByEmployee[0].id,
        request_number: 'xxx',
        request_number_seq: 0,
        rf_budgets: JSON.stringify(rf.budgets),
        staff_id: rf.staff_id,
      },
      program.partner.code,
    )

    const employee = await this.emplyeeRepository.getEmployeeByUserId(userId)

    await this.generalRepo.createLog({
      pr_id: '',
      rf_id: insertedRf.id,
      user_id: employee[0].user_id,
      log_type: 'RequisitionForm',
      raw_data: '',
      program_id: programId,
      message: `Submitted a new Staff Cost RF <a href="/dashboard/procurement/${program.id}/detail/${projectId}/${insertedRf.id}">"${insertedRf.about_request}"</a> from ${program.program_name} project`,
    })

    await this.sendNotifToProgramManagerToApprove(insertedRf.id, program.program_manager)
    await this.notifyRfSubmitted(insertedRf)
    await this.notifRepo.create({
      employee_id: insertedRf.requested_by,
      ref_id: insertedRf.id,
      notif_type: NotifType.TRACKING_REQUESTITION_FORM,
      deleted_at: null,
    })

    return insertedRf.id
  }

  async updateRFProcurement(
    rf: CreateProcurementRfApiRequest,
    programId: string,
    projectId: string,
    rfId: string,
    userId: string,
  ): Promise<string> {
    const submittedByEmployee = await this.emplyeeRepository.getEmployeeByUserId(userId)

    if (submittedByEmployee.length <= 0) {
      throw new ServerNotFound('submited employee by not found')
    }

    const program = await this.programRepository.getById(programId)

    if (rf.budgets) {
      for (const budget of rf.budgets) {
        const chekedBudget = await this.budgetRepository.getDetailBudgetUpTree(budget.id)
        if (!chekedBudget) {
          throw new BadRequestException('Budget Not Found')
        }
      }
    }

    const insertedRf = await this.rfRepository.updateById(rfId, {
      action_by: rf.action_by,
      program_id: programId,
      rf_type: RequisitionFormEnum.PROCUREMENT,
      about_request: rf.about_request,
      deadline: rf.deadline,
      program_project_related_id: projectId,
      program_manager_approval_status: ProgramApproval.pending,
      requested_at: new Date().toISOString(),
      requested_by: submittedByEmployee[0].id,
      rf_budgets: JSON.stringify(rf.budgets),
    })

    await this.sendNotifToProgramManagerToApprove(insertedRf.id, program.program_manager)
    await this.notifyRfSubmitted(insertedRf)
    await this.notifRepo.create({
      employee_id: insertedRf.requested_by,
      ref_id: insertedRf.id,
      notif_type: NotifType.TRACKING_REQUESTITION_FORM,
      deleted_at: null,
    })

    await this.generalRepo.createLog({
      pr_id: '',
      rf_id: rfId,
      user_id: submittedByEmployee[0].user_id,
      log_type: 'RequisitionForm',
      raw_data: '',
      program_id: programId,
      message: `Re-submitted a new <a href="/dashboard/procurement/${program.id}/detail/${projectId}/${insertedRf.id}">"${insertedRf.about_request}"</a> from ${program.program_name} project`,
    })

    return insertedRf.id
  }

  async createRFTravel(
    rf: CreateTravelRfApiRequest,
    programId: string,
    projectId: string,
    userId: string,
  ): Promise<string> {
    const submittedByEmployee = await this.emplyeeRepository.getEmployeeByUserId(userId)

    if (submittedByEmployee.length <= 0) {
      throw new ServerNotFound('submited employee by not found')
    }

    const program = await this.programRepository.getById(programId)

    if (rf.budgets) {
      for (const budget of rf.budgets) {
        const chekedBudget = await this.budgetRepository.getDetailBudgetUpTree(budget.id)
        if (!chekedBudget) {
          throw new BadRequestException('Budget Not Found')
        }
      }
    }

    const rfd = await this.rfRepository.create(
      {
        action_by: rf.action_by,
        rf_type: RequisitionFormEnum.TRAVEL,
        program_id: programId,
        about_request: rf.about_request,
        deadline: rf.deadline,
        program_project_related_id: projectId,
        program_manager_approval_status: ProgramApproval.pending,
        requested_at: new Date().toISOString(),
        requested_by: submittedByEmployee[0].id,
        request_number: 'xxx',
        request_number_seq: 0,
        travel_detail: rf.travel_detail as Prisma.InputJsonObject,
        rf_budgets: JSON.stringify(rf.budgets),
        staff_id: '',
      },
      program.partner.code,
    )

    const employee = await this.emplyeeRepository.getEmployeeByUserId(userId)

    await this.generalRepo.createLog({
      pr_id: '',
      rf_id: rfd.id,
      user_id: employee[0].user_id,
      log_type: 'RequisitionForm',
      raw_data: '',
      program_id: programId,
      message: `Submitted a new Travel Request RF <a href="/dashboard/procurement/${program.id}/detail/${projectId}/${rfd.id}">"${rfd.about_request}"</a> from ${program.program_name} project, and assign ${rf.travel_detail.who_traveling.name} as the traveller`,
    })

    await this.sendNotifToProgramManagerToApprove(rfd.id, program.program_manager)
    await this.notifyRfSubmitted(rfd)
    await this.notifRepo.create({
      employee_id: rfd.requested_by,
      ref_id: rfd.id,
      notif_type: NotifType.TRACKING_REQUESTITION_FORM,
      deleted_at: null,
    })

    return rfd.id
  }

  async updateRFTravel(
    rf: CreateTravelRfApiRequest,
    programId: string,
    projectId: string,
    rfId: string,
    userId: string,
  ): Promise<string> {
    const submittedByEmployee = await this.emplyeeRepository.getEmployeeByUserId(userId)

    if (submittedByEmployee.length <= 0) {
      throw new ServerNotFound('submited employee by not found')
    }

    const program = await this.programRepository.getById(programId)

    if (rf.budgets) {
      for (const budget of rf.budgets) {
        const chekedBudget = await this.budgetRepository.getDetailBudgetUpTree(budget.id)
        if (!chekedBudget) {
          throw new BadRequestException('Budget Not Found')
        }
      }
    }

    const rfd = await this.rfRepository.updateById(rfId, {
      action_by: rf.action_by,
      rf_type: RequisitionFormEnum.TRAVEL,
      program_id: programId,
      about_request: rf.about_request,
      deadline: rf.deadline,
      program_project_related_id: projectId,
      program_manager_approval_status: ProgramApproval.pending,
      requested_at: new Date().toISOString(),
      requested_by: submittedByEmployee[0].id,
      travel_detail: rf.travel_detail as Prisma.InputJsonObject,
      rf_budgets: JSON.stringify(rf.budgets),
    })

    await this.sendNotifToProgramManagerToApprove(rfd.id, program.program_manager)
    await this.notifyRfSubmitted(rfd)
    await this.notifRepo.create({
      employee_id: rfd.requested_by,
      ref_id: rfd.id,
      notif_type: NotifType.TRACKING_REQUESTITION_FORM,
      deleted_at: null,
    })

    await this.generalRepo.createLog({
      pr_id: '',
      rf_id: rfId,
      user_id: submittedByEmployee[0].user_id,
      log_type: 'RequisitionForm',
      raw_data: '',
      program_id: programId,
      message: `Re-submitted a new Travel Request RF <a href="/dashboard/procurement/${program.id}/detail/${projectId}/${rfd.id}">"${rfd.about_request}"</a> from ${program.program_name} project, and assign ${rf.travel_detail.who_traveling.name} as the traveller`,
    })

    return rfd.id
  }

  async ackActionBy(rfId: string): Promise<string> {
    return this.rfRepository.updateById(rfId, {
      action_by_notified_status: true,
      action_at: new Date(),
    })
  }

  async createPersonalHire(
    rf: CreatePersonalHireRfApiRequest,
    programId: string,
    projectId: string,
    userId: string,
  ): Promise<string> {
    const submittedByEmployee = await this.emplyeeRepository.getEmployeeByUserId(userId)

    if (submittedByEmployee.length <= 0) {
      throw new ServerNotFound('submited employee by not found')
    }

    const program = await this.programRepository.getById(programId)

    if (rf.budgets) {
      for (const budget of rf.budgets) {
        const chekedBudget = await this.budgetRepository.getDetailBudgetUpTree(budget.id)
        if (!chekedBudget) {
          throw new BadRequestException('Budget Not Found')
        }
      }
    }
    const inserted = await this.rfRepository.create(
      {
        action_by: rf.action_by,
        rf_type: RequisitionFormEnum.PERSONAL_HIRE,
        program_id: programId,
        about_request: rf.about_request,
        deadline: rf.deadline,
        program_project_related_id: projectId,
        program_manager_approval_status: ProgramApproval.pending,
        requested_at: new Date().toISOString(),
        requested_by: submittedByEmployee[0].id,
        request_number: 'xxx',
        request_number_seq: 0,
        personal_hire_information: rf.personal_hire_information as Prisma.InputJsonObject,
        rf_budgets: JSON.stringify(rf.budgets),
        staff_id: '',
      },
      program.partner.code,
    )

    const employee = await this.emplyeeRepository.getEmployeeByUserId(userId)

    await this.generalRepo.createLog({
      pr_id: '',
      rf_id: inserted.id,
      user_id: employee[0].user_id,
      log_type: 'RequisitionForm',
      raw_data: '',
      program_id: programId,
      message: `Submitted a new Personal Hire RF <a href="/dashboard/procurement/${program.id}/detail/${projectId}/${inserted.id}">"${inserted.about_request}"</a> from ${program.program_name} project`,
    })

    await this.sendNotifToProgramManagerToApprove(inserted.id, program.program_manager)
    await this.notifyRfSubmitted(inserted)
    await this.notifRepo.create({
      employee_id: inserted.requested_by,
      ref_id: inserted.id,
      notif_type: NotifType.TRACKING_REQUESTITION_FORM,
      deleted_at: null,
    })

    return inserted.id
  }

  async updatePersonalHire(
    rf: CreatePersonalHireRfApiRequest,
    programId: string,
    projectId: string,
    rfId: string,
    userId: string,
  ): Promise<string> {
    const submittedByEmployee = await this.emplyeeRepository.getEmployeeByUserId(userId)

    if (submittedByEmployee.length <= 0) {
      throw new ServerNotFound('submited employee by not found')
    }

    const program = await this.programRepository.getById(programId)

    if (rf.budgets) {
      for (const budget of rf.budgets) {
        const chekedBudget = await this.budgetRepository.getDetailBudgetUpTree(budget.id)
        if (!chekedBudget) {
          throw new BadRequestException('Budget Not Found')
        }
      }
    }
    const inserted = await this.rfRepository.updateById(rfId, {
      action_by: rf.action_by,
      rf_type: RequisitionFormEnum.PERSONAL_HIRE,
      program_id: programId,
      about_request: rf.about_request,
      deadline: rf.deadline,
      program_project_related_id: projectId,
      program_manager_approval_status: ProgramApproval.pending,
      requested_at: new Date().toISOString(),
      requested_by: submittedByEmployee[0].id,
      personal_hire_information: rf.personal_hire_information as Prisma.InputJsonObject,
      rf_budgets: JSON.stringify(rf.budgets),
    })

    await this.sendNotifToProgramManagerToApprove(inserted.id, program.program_manager)
    await this.notifyRfSubmitted(inserted)
    await this.notifRepo.create({
      employee_id: inserted.requested_by,
      ref_id: inserted.id,
      notif_type: NotifType.TRACKING_REQUESTITION_FORM,
      deleted_at: null,
    })

    await this.generalRepo.createLog({
      pr_id: '',
      rf_id: rfId,
      user_id: submittedByEmployee[0].user_id,
      log_type: 'RequisitionForm',
      raw_data: '',
      program_id: programId,
      message: `Re-submitted a new <a href="/dashboard/procurement/${program.id}/detail/${projectId}/${inserted.id}">"${inserted.about_request}"</a> from ${program.program_name} project`,
    })

    return inserted.id
  }

  async checkIfLogedInUserHasRfInProgram(programId: string, userId: string): Promise<boolean> {
    const employee = await this.emplyeeRepository.getEmployeeByUserId(userId)
    const hasRf = await this.rfRepository.getListRfByProgramAndActionBy(programId, employee[0].id)
    if (hasRf.length > 0) {
      return true
    }
    return false
  }

  async getRfList(
    programId: string,
    userId: string,
    filterByActionByEmployeeId?: string,
  ): Promise<RequisitionFormSimple[]> {
    const rfs = await this.rfRepository.getListRf(programId, filterByActionByEmployeeId, true)
    const program = await this.programRepository.getById(programId)

    const formatedRfs = []

    for (const rf of rfs) {
      let totalBudgetRequest = 0
      for (const budget of JSON.parse(rf.rf_budgets)) {
        console.log('====>', budget)
        totalBudgetRequest +=
          Number(budget.qty) * Number(budget.pkg_qty) * Number(budget.cost ?? budget.unit_cost_value)
      }
      console.log(rf.id, totalBudgetRequest)

      const reformatedRF = new RequisitionFormSimple()

      reformatedRF.total_request = `${program.currency}_${totalBudgetRequest}`
      reformatedRF.project_id = rf.program_projects_related.id
      reformatedRF.program_id = rf.program_id
      reformatedRF.total_request_value = totalBudgetRequest
      reformatedRF.id = rf.id
      reformatedRF.type = rf.rf_type
      reformatedRF.rf_number = rf.request_number
      reformatedRF.program_manager_approval_status = rf.program_manager_approval_status
      reformatedRF.about_request = rf.about_request

      reformatedRF.program_name = program.program_name
      reformatedRF.partner_name = program.partner.name

      if (reformatedRF.closed_by) {
        const employee = await this.emplyeeRepository.getEmployeeById(rf.closed_by)
        reformatedRF.closed_by = {
          id: employee.id,
          name: employee.full_name,
          employee_pass_photo: employee.pass_photo_path,
        } as EmployeeProfile
      } else {
        reformatedRF.closed_by = null
      }
      reformatedRF.closed_at = rf.has_retur ? new Date().toISOString() : null

      if (rf.requested_by) {
        const employee = await this.emplyeeRepository.getEmployeeById(rf.requested_by)
        reformatedRF.requested_by = {
          id: employee.id,
          name: employee.full_name,
          employee_pass_photo: employee.pass_photo_path,
        } as EmployeeProfile
      } else {
        reformatedRF.requested_by = null
      }

      if (rf.action_by) {
        const employeeActionByDeterminer = String(rf.action_by).split(':')

        if (employeeActionByDeterminer.length > 1) {
          const actionByEmployee = await this.emplyeeRepository.getEmployeeById(employeeActionByDeterminer[1])

          reformatedRF.action_by = {
            id: actionByEmployee.id,
            name: actionByEmployee.full_name,
            pass_photo: actionByEmployee.pass_photo_path,
          } as RFActionBy
        } else {
          reformatedRF.action_by = {
            id: '',
            name: rf.action_by,
            pass_photo: [''],
          } as RFActionBy
        }
      } else {
        reformatedRF.action_by = null
      }

      if (rf.program_manager_approval_by) {
        const employee = await this.emplyeeRepository.getEmployeeById(rf.program_manager_approval_by)
        reformatedRF.program_manager_approval_by = {
          id: employee.id,

          name: employee.full_name,
          employee_pass_photo: employee.pass_photo_path,
        } as EmployeeProfile
      } else {
        const employee = await this.emplyeeRepository.getEmployeeById(program.program_manager)

        reformatedRF.program_manager_approval_by = {
          id: employee.id,

          name: employee.full_name,
          employee_pass_photo: employee.pass_photo_path,
        } as EmployeeProfile
      }

      formatedRfs.push(reformatedRF)
    }

    console.log(rfs)

    console.log(formatedRfs)

    return formatedRfs
  }

  async getRfOneLikeList(rfId: string): Promise<RequisitionFormSimple> {
    const rf = await this.rfRepository.getRfById('', '', rfId)
    if (!rf) {
      return null
    }
    const program = await this.programRepository.getById(rf.program_id)

    let totalBudgetRequest = 0
    for (const budget of JSON.parse(rf.rf_budgets)) {
      console.log('====>', budget)
      totalBudgetRequest += Number(budget.qty) * Number(budget.pkg_qty) * Number(budget.cost ?? budget.unit_cost_value)
    }
    console.log(rf.id, totalBudgetRequest)

    const reformatedRF = new RequisitionFormSimple()

    reformatedRF.total_request = `${program.currency}_${totalBudgetRequest}`
    reformatedRF.project_id = rf.program_projects_related.id
    reformatedRF.total_request_value = totalBudgetRequest
    reformatedRF.id = rf.id
    reformatedRF.type = rf.rf_type
    reformatedRF.rf_number = rf.request_number
    reformatedRF.program_manager_approval_status = rf.program_manager_approval_status
    reformatedRF.about_request = rf.about_request

    reformatedRF.program_id = program.id
    reformatedRF.program_name = program.program_name
    reformatedRF.partner_name = program.partner.name
    if (rf.requested_by) {
      const employee = await this.emplyeeRepository.getEmployeeById(rf.requested_by)
      reformatedRF.requested_by = {
        id: employee.id,
        name: employee.full_name,
        employee_pass_photo: employee.pass_photo_path,
      } as EmployeeProfile
    } else {
      reformatedRF.requested_by = null
    }

    if (rf.action_by) {
      const employeeActionByDeterminer = String(rf.action_by).split(':')

      if (employeeActionByDeterminer.length > 1) {
        const actionByEmployee = await this.emplyeeRepository.getEmployeeById(employeeActionByDeterminer[1])

        reformatedRF.action_by = {
          id: actionByEmployee.id,
          name: actionByEmployee.full_name,
          pass_photo: actionByEmployee.pass_photo_path,
        } as RFActionBy
      } else {
        reformatedRF.action_by = {
          id: '',
          name: rf.action_by,
          pass_photo: [''],
        } as RFActionBy
      }
    } else {
      reformatedRF.action_by = null
    }

    if (rf.program_manager_approval_by) {
      const employee = await this.emplyeeRepository.getEmployeeById(rf.program_manager_approval_by)
      reformatedRF.program_manager_approval_by = {
        id: employee.id,

        name: employee.full_name,
        employee_pass_photo: employee.pass_photo_path,
      } as EmployeeProfile
    } else {
      const employee = await this.emplyeeRepository.getEmployeeById(program.program_manager)

      reformatedRF.program_manager_approval_by = {
        id: employee.id,

        name: employee.full_name,
        employee_pass_photo: employee.pass_photo_path,
      } as EmployeeProfile
    }

    return reformatedRF
  }

  async getRfListAll(): Promise<RequisitionFormSimple[]> {
    const rfs = await this.rfRepository.getListRfAll()

    const formatedRfs = []

    for (const rf of rfs) {
      let totalBudgetRequest = 0
      for (const budget of JSON.parse(rf.rf_budgets)) {
        console.log('====>', budget)
        totalBudgetRequest +=
          Number(budget.qty) * Number(budget.pkg_qty) * Number(budget.cost ?? budget.unit_cost_value)
      }
      console.log(rf.id, totalBudgetRequest)

      const reformatedRF = new RequisitionFormSimple()
      const program = await this.programRepository.getById(rf.program_id)
      reformatedRF.total_request = `${program.currency}_${totalBudgetRequest}`
      reformatedRF.project_id = rf.program_projects_related.id
      reformatedRF.total_request_value = totalBudgetRequest
      reformatedRF.id = rf.id
      reformatedRF.type = rf.rf_type
      reformatedRF.rf_number = rf.request_number
      reformatedRF.program_manager_approval_status = rf.program_manager_approval_status
      reformatedRF.about_request = rf.about_request

      reformatedRF.closed_at = rf.has_retur ? new Date().toISOString() : null
      if (rf.closed_by) {
        const employeeRequestedBy = await this.emplyeeRepository.getEmployeeById(rf.closed_by)
        reformatedRF.closed_by = {
          id: employeeRequestedBy.id,
          name: employeeRequestedBy.full_name,
          pass_photo: employeeRequestedBy.pass_photo_path,
        } as EmployeeSimpleDetail
      } else {
        reformatedRF.closed_by = null
      }

      reformatedRF.program_name = program.program_name
      reformatedRF.partner_name = program.partner.name
      reformatedRF.requested_by = rf.requested_by
      reformatedRF.program_manager_id = program.program_manager
      reformatedRF.program_id = program.id
      reformatedRF.action_by_employee_id = rf.action_by
      reformatedRF.action_by_employee_ack_status = rf.action_by_notified_status

      if (rf.requested_by) {
        const employee = await this.emplyeeRepository.getEmployeeById(rf.requested_by)
        reformatedRF.requested_by = {
          id: employee.id,
          name: employee.full_name,
          employee_pass_photo: employee.pass_photo_path,
        } as EmployeeProfile
      } else {
        reformatedRF.requested_by = null
      }

      if (rf.program_manager_approval_by) {
        const employee = await this.emplyeeRepository.getEmployeeById(rf.program_manager_approval_by)
        reformatedRF.program_manager_approval_by = {
          id: employee.id,

          name: employee.full_name,
          employee_pass_photo: employee.pass_photo_path,
        } as EmployeeProfile
      } else {
        const employee = await this.emplyeeRepository.getEmployeeById(program.program_manager)

        reformatedRF.program_manager_approval_by = {
          id: employee.id,

          name: employee.full_name,
          employee_pass_photo: employee.pass_photo_path,
        } as EmployeeProfile
      }

      formatedRfs.push(reformatedRF)
    }

    console.log(rfs)

    console.log(formatedRfs)

    return formatedRfs
  }

  async deleteById(programId: string, projectId: string, rfId: string, userId: string): Promise<string> {
    await this.rfRepository.deleteById(programId, projectId, rfId)

    await this.notifRepo.deleteNotifByRefIdOnly(rfId)

    return ''
  }

  async getRfDetail(
    programId: string,
    projectId: string,
    rfId: string,
    userId: string,
  ): Promise<RequisitionFormDetail> {
    const rf = await this.rfRepository.getRfById(programId, projectId, rfId)

    if (!rf) {
      return Promise.reject('Not Found')
    }

    if (!rf.rf_budgets) {
      return Promise.reject('Not Found')
    }

    const formatedRfs = new RequisitionFormDetail()

    let totalBudgetRequest = 0
    if (rf.rf_budgets) {
      for (const budget of JSON.parse(rf.rf_budgets)) {
        totalBudgetRequest +=
          Number(budget.qty) * Number(budget.pkg_qty) * Number(budget.cost ?? budget.unit_cost_value)
      }
    }

    formatedRfs.id = rf.id
    formatedRfs.about_request = rf.about_request
    formatedRfs.number = rf.request_number
    formatedRfs.program_manager_approval_at = rf.program_manager_approval_status_at
    formatedRfs.action_by_notified_at = rf.action_at
    formatedRfs.has_retur = rf.has_retur

    formatedRfs.program_manager_approval_status = rf.program_manager_approval_status
    formatedRfs.action_by_notified_status = rf.action_by_notified_status

    formatedRfs.closed_at = rf.has_retur ? new Date().toISOString() : null
    if (rf.closed_by) {
      const employeeRequestedBy = await this.emplyeeRepository.getEmployeeById(rf.closed_by)
      formatedRfs.closed_by = {
        id: employeeRequestedBy.id,
        name: employeeRequestedBy.full_name,
        pass_photo: employeeRequestedBy.pass_photo_path,
      } as EmployeeSimpleDetail
    } else {
      formatedRfs.closed_by = null
    }

    const employeeRequestedBy = await this.emplyeeRepository.getEmployeeById(rf.requested_by)
    formatedRfs.requested_by = {
      id: employeeRequestedBy.id,
      name: employeeRequestedBy.full_name,
      pass_photo: employeeRequestedBy.pass_photo_path,
    } as EmployeeSimpleDetail

    if (rf.staff_id) {
      const employeeRequestedBy = await this.emplyeeRepository.getEmployeeById(rf.staff_id)
      formatedRfs.staff_detail = {
        id: employeeRequestedBy.id,
        name: employeeRequestedBy.full_name,
        pass_photo: employeeRequestedBy.pass_photo_path,
      } as EmployeeSimpleDetail
    } else {
      formatedRfs.staff_detail = null
    }
    formatedRfs.requested_at = rf.requested_at

    const employeeActionByDeterminer = String(rf.action_by).split(':')

    if (employeeActionByDeterminer.length > 1) {
      const actionByEmployee = await this.emplyeeRepository.getEmployeeById(employeeActionByDeterminer[1])

      formatedRfs.action_by = {
        id: actionByEmployee.id,
        name: actionByEmployee.full_name,
        pass_photo: actionByEmployee.pass_photo_path,
      } as RFActionBy
    } else {
      formatedRfs.action_by = {
        id: '',
        name: rf.action_by,
        pass_photo: [''],
      } as RFActionBy
    }

    formatedRfs.rf_type = rf.rf_type
    if (rf.rf_type == RequisitionFormEnum.PERSONAL_HIRE) {
      formatedRfs.rf_attributes = rf.personal_hire_information
    } else if (rf.rf_type == RequisitionFormEnum.TRAVEL) {
      const travelDetail = rf.travel_detail as TravelRfDetail
      travelDetail.who_traveling = {} as RFActionBy

      if (travelDetail?.employee_id?.split(':')?.length > 1) {
        if (travelDetail?.employee_id?.split(':')[0] == 'employee') {
          try {
            const employee = await this.emplyeeRepository.getEmployeeById(
              travelDetail?.employee_id?.split(':').reverse()[0],
            )
            travelDetail.who_traveling.id = employee.id
            travelDetail.who_traveling.name = employee.full_name
            travelDetail.who_traveling.pass_photo = employee.pass_photo_path as string[]
          } catch (e) {
            travelDetail.who_traveling.name = travelDetail.employee_id
          }
        } else if (travelDetail?.employee_id?.split(':')[0] == 'vendor') {
          try {
            const vendor = await this.vendorRepository.getVendorById(travelDetail?.employee_id?.split(':').reverse()[0])
            travelDetail.who_traveling.id = vendor.id
            travelDetail.who_traveling.name = JSON.parse(JSON.stringify(vendor.vendor_information))['name']
          } catch (e) {
            travelDetail.who_traveling.name = travelDetail.employee_id
          }
        }
      } else {
        travelDetail.who_traveling.name = travelDetail.employee_id
      }

      formatedRfs.staff_detail = null
      if (rf.staff_id) {
        const actionByEmployee = await this.emplyeeRepository.getEmployeeById(rf.staff_id)

        formatedRfs.staff_detail = {
          id: actionByEmployee.id,
          name: actionByEmployee.full_name,
          pass_photo: actionByEmployee.pass_photo_path,
        } as EmployeeSimpleDetail
      }

      formatedRfs.rf_attributes = travelDetail
    }
    formatedRfs.deadline = rf.deadline

    // iterate projects
    const projects = []

    // insert project
    console.log('RAWW DATA -- XX')
    console.log(rf.rf_budgets)
    for (const budget of JSON.parse(rf.rf_budgets)) {
      const budgetDetail = await this.budgetRepository.getDetailBudgetUpTree(budget.id)
      console.log('budget -==> ', budgetDetail)

      const project = new BudgetProgramProjectDetail()
      project.id = budgetDetail.activities.projects.id
      project.code = budgetDetail.activities.projects.code
      project.description = budgetDetail.activities.projects.description
      project.ordering_seq = budgetDetail.activities.projects.ordering_seq
      project.activities = []

      // if poject id exist dont push

      const exist = projects.filter((prj) => {
        return prj.id == project.id
      })
      if (exist.length < 1) {
        projects.push(project)
      }
    }
    console.log('TOTAL SAVED BUDGET', JSON.parse(rf.rf_budgets).length)

    // iterate activity
    for (const budget of JSON.parse(rf.rf_budgets)) {
      const budgetDetail = await this.budgetRepository.getDetailBudgetUpTree(budget.id)
      console.log('budget -==> ', budgetDetail)

      const activity = new BudgetProgramProjectActivity()
      activity.id = budgetDetail.activities.id
      activity.ordering_seq = budgetDetail.activities.ordering_seq
      activity.description = budgetDetail.activities.description
      activity.code = budgetDetail.activities.code
      activity.budgets = []

      for (const prj of projects) {
        if (prj.id == budgetDetail.activities.project_id) {
          const idxOf = projects.indexOf(prj)
          console.log(idxOf)

          const exist = projects[idxOf].activities.filter((actvt) => {
            return actvt.id == activity.id
          })
          if (exist.length < 1) {
            projects[idxOf].activities.push(activity)
          }
        }
      }
    }

    // interate budget
    for (const budget of JSON.parse(rf.rf_budgets)) {
      const budgetDetail = await this.budgetRepository.getDetailBudgetUpTree(budget.id)
      console.log('budget -==> ', budgetDetail)

      const budgetD = budget as BudgetActivity

      console.log('busget category info', budgetDetail.vendor_category_info)

      budget.vendor_category_information = budgetDetail.vendor_category_info

      try {
        const vendor = await this.vendorRepository.getVendorById(budget.recommended_vendor)
        console.log('recommended vendor', vendor.vendor_information)

        budget.recommended_vendor = vendor?.vendor_information['name']
      } catch (e) {
        budget.recommended_vendor = ''
      }

      for (const prj of projects) {
        if (prj.id == budgetDetail.activities.project_id) {
          const idxOf = projects.indexOf(prj)
          console.log(idxOf)

          for (const actv of projects[idxOf].activities) {
            if (actv.id == budgetDetail.activities.id) {
              const actIdxOf = projects[idxOf].activities.indexOf(actv)

              const exist = projects[idxOf].activities[actIdxOf].budgets.filter((bdgt) => {
                return bdgt.id == budgetD.id
              })
              if (exist.length < 1) {
                projects[idxOf].activities[actIdxOf].budgets.push(budgetD)
              }
            }
          }
        }
      }
    }

    formatedRfs.projects = projects

    console.log(rf)

    console.dir(JSON.stringify(formatedRfs))

    return formatedRfs
  }

  async calculateTotalRF(id: string, categoryId: string): Promise<number> {
    const rf = await this.rfRepository.getRfByOnlyId(id)
    if (!rf.rf_budgets) {
      return 0
    }
    let totalBudgetRequest = 0
    if (rf.rf_budgets) {
      for (const budget of JSON.parse(rf.rf_budgets)) {
        if (budget.vendor_category_id != categoryId) {
          continue
        }

        totalBudgetRequest +=
          Number(budget.qty) * Number(budget.pkg_qty) * Number(budget.cost ?? budget.unit_cost_value)
      }
    }

    return totalBudgetRequest
  }

  async approveRfRequest(
    by: string,
    status: string,
    programId: string,
    projectId: string,
    rfId: string,
    userId: string,
    rejectNote = '',
  ): Promise<string> {
    const submittedByEmployee = await this.emplyeeRepository.getEmployeeByUserId(userId)

    if (submittedByEmployee.length <= 0) {
      throw new ServerNotFound('submited employee by not found')
    }

    const program = await this.programRepository.getById(programId)

    let approvalEmployeeId = ''

    if (String(program.program_manager) !== String(submittedByEmployee[0].id)) {
      throw new BadRequestException('Only the assigned Project Manager can approve this request')
    }

    approvalEmployeeId = program.program_manager

    /*
     * RF approval uses the existing program_manager approval slot.
     *
     * PROGRAM / PROJECT:
     *   Program Manager
     *
     * INTERNAL:
     *   General Manager
     */
    by = 'program_manager_approval_status'

    const rf = await this.rfRepository.getRfByOnlyId(rfId)

    if (status == 'rejected') {
      await this.notifRepo.resolveNotif(approvalEmployeeId, rfId, NotifType.APPROVAL_REQUISITION_FORM)

      await this.generalRepo.createLog({
        pr_id: '',
        rf_id: rfId,
        user_id: submittedByEmployee[0].user_id,
        log_type: 'RequisitionForm',
        raw_data: '',
        program_id: programId,
        message: `Rejected the ${
          {
            PROCUREMENT: 'Procurement',
            PERSONAL_HIRE: 'Personal Hire',
            TRAVEL: 'Travel',
          }[(rf as requisition_form).rf_type]
        } RF <a href="/dashboard/procurement/${program.id}/detail/${projectId}/${rf.id}">"${
          rf.about_request
        }"</a> from ${program.program_name} project as ${
          program.program_ownership_type === 'INTERNAL' ? 'General Manager' : 'Project Manager'
        } with a message:`,
        body: rejectNote,
      })

      await this.rfRepository.updateById(rfId, {
        rejection_note: rejectNote,
      })

      await this.rfRepository.updateApprovalProgramManager(rfId, 'revision')
      await this.notifyRfDecision(rf, 'rejected', rejectNote)

      return ''
    }

    await this.rfRepository.updateApprovalProgramManager(rfId, status)

    await this.notifRepo.resolveNotif(approvalEmployeeId, rfId, NotifType.APPROVAL_REQUISITION_FORM)

    await this.notifRepo.create({
      employee_id: (rf as requisition_form).action_by,
      ref_id: rfId,
      notif_type: NotifType.TRACKING_REQUESTITION_FORM,
      deleted_at: null,
    })

    const employee = await this.emplyeeRepository.getEmployeeByUserId(userId)

    if (status == 'approved') {
      await this.generalRepo.createLog({
        pr_id: '',
        rf_id: rfId,
        user_id: employee[0].user_id,
        log_type: 'RequisitionForm',
        raw_data: '',
        program_id: programId,
        message: `Approved the ${
          {
            PROCUREMENT: 'Procurement',
            PERSONAL_HIRE: 'Personal Hire',
            TRAVEL: 'Travel',
          }[(rf as requisition_form).rf_type]
        } RF <a href="/dashboard/procurement/${program.id}/detail/${projectId}/${rf.id}">"${
          rf.about_request
        }"</a> from ${program.program_name} project as ${
          program.program_ownership_type === 'INTERNAL' ? 'General Manager' : 'Project Manager'
        }`,
      })
    }

    if (status === 'approved') {
      await this.notifyRfDecision(rf, 'approved')
    }

    return ''
  }

  async getRfApprovalList(programId: string, projectId: string, userId: string): Promise<RFApprovalDataForList[]> {
    const program = await this.programRepository.getById(programId)

    const result = []

    const rfs = await this.rfRepository.getListRfForUserApproval(programId, projectId, userId)

    for (const rf of rfs) {
      const approval = new RFApprovalDataForList()
      approval.id = rf.id
      approval.type = rf.rf_type
      approval.partner = program.partner_code
      approval.about_request = rf.about_request

      let totalBudgetRequest = 0
      if (rf.rf_budgets) {
        for (const budget of JSON.parse(rf.rf_budgets)) {
          totalBudgetRequest += Number(budget.qty) * Number(budget.pkg_qty) * Number(budget.unit_cost_value)
        }
      }

      approval.total_request_value = totalBudgetRequest
      approval.total_request = `${program.currency}_${String(totalBudgetRequest)}`

      result.push(approval)
    }

    return result
  }

  async getTotalPaymentRequestFromRFIdByBudgetId(rfId: string, budgetId: string): Promise<number> {
    const rfs = await this.prRepository.getListPRByRFID(rfId)

    let totalPrRequested = 0
    for (const rf of rfs) {
      for (const pr of rf.payment_request) {
        if (pr.payment_type == 'advance-payment-request') {
          for (const budget of JSON.parse(pr.pr_budgets.toString())) {
            if (budget.id == budgetId) {
              totalPrRequested += budget.advance_payment_total
            }
          }
        }
      }
    }

    return totalPrRequested
  }

  async calculateRFRemainingBudget(budgetId: string, rfId: string): Promise<number> {
    let allRfsInProgram = []
    let total_retur = 0
    const realbudget = await this.budgetRepository.getById(budgetId)
    total_retur += realbudget.retur
    if (rfId != '') {
      console.log('find rfs')
      const rf = await this.rfRepository.getRfByOnlyId(rfId)

      allRfsInProgram = await this.rfRepository.getListRf(rf.program_id, null, true)
    } else {
      // if rfid not found get by programid of budget
      try {
        const budget = await this.budgetRepository.getDetailBudgetUpTree(budgetId)
        const programId = budget.activities.projects.program_id

        allRfsInProgram = await this.rfRepository.getListRf(programId, null, true)
      } catch (e) {
        console.log(e)
      }
    }

    console.log('FOUND RFS', allRfsInProgram)

    let totalRequestedInRfs = 0

    const realBudget = await this.budgetRepository.getDetailBudgetUpTree(budgetId)

    for (const rfItem of allRfsInProgram) {
      console.log('RAW BUDGET', rfItem.rf_budgets)

      if (
        rfItem.program_manager_approval_status == 'rejected' ||
        rfItem.program_manager_approval_status == 'revision'
      ) {
        continue
      }

      for (const budget of JSON.parse(rfItem.rf_budgets.toString())) {
        if (budget.id == budgetId) {
          totalRequestedInRfs +=
            Number(budget.qty) * Number(budget.pkg_qty) * Number(budget.cost ?? budget.unit_cost_value)
        }
      }
    }

    console.log(realBudget.pkg_qty)
    console.log(realBudget.qty, realBudget.pkg_qty, realBudget.cost, totalRequestedInRfs)

    const left = realBudget.qty * realBudget.pkg_qty * realBudget.cost - totalRequestedInRfs
    console.log('left amount', left)
    return left + total_retur
  }

  async closeRequisitionForm(rfId: string, userId: string): Promise<string> {
    // ensure all pr under this rf are closed (paid_at)
    const rf = await this.rfRepository.getRfById(null, null, rfId)

    for (const budget of JSON.parse(rf.rf_budgets.toString())) {
      console.log('BUDGET', budget)
      let total_budget_retur = 0

      const total_budget_rf = Number(budget.qty) * Number(budget.pkg_qty) * Number(budget.unit_cost_value)

      let total_payment_paid = 0

      const prs = await this.prRepository.getListAllPRByRFID(rfId)
      for (const pr of prs) {
        if (pr.paid_at) {
          for (const prBudget of JSON.parse(pr.pr_budgets.toString())) {
            if (prBudget.id == budget.id) {
              total_payment_paid += Number(prBudget.qty) * Number(prBudget.pkg_qty) * Number(prBudget.unit_cost_value)
            }
          }
        }
      }
      total_budget_retur += total_budget_rf - total_payment_paid

      // add retur to budget + retur from column retur
      await this.budgetRepository.incrementReturnBudget(budget.id, total_budget_retur)
      await this.rfRepository.updateById(rfId, { has_retur: true })

      await this.notifRepo.resolveNotifByRefId(rfId, NotifType.TRACKING_REQUESTITION_FORM)
    }

    return 'OK'
  }

  async updateRFStaffCost(
    rf: CreateStaffCostRfApiRequest,
    programId: string,
    projectId: string,
    rfId: string,
    userId: string,
  ): Promise<string> {
    const submittedByEmployee = await this.emplyeeRepository.getEmployeeByUserId(userId)

    if (submittedByEmployee.length <= 0) {
      throw new ServerNotFound('submited employee by not found')
    }

    const program = await this.programRepository.getById(programId)

    if (rf.budgets) {
      for (const budget of rf.budgets) {
        const chekedBudget = await this.budgetRepository.getDetailBudgetUpTree(budget.id)
        if (!chekedBudget) {
          throw new BadRequestException('Budget Not Found')
        }
      }
    }

    const insertedRf = await this.rfRepository.updateById(rfId, {
      action_by: rf.action_by,
      program_id: programId,
      rf_type: RequisitionFormEnum.STAFF_COST,
      about_request: rf.about_request,
      deadline: rf.deadline,
      program_project_related_id: projectId,
      program_manager_approval_status: ProgramApproval.pending,
      requested_at: new Date().toISOString(),
      requested_by: submittedByEmployee[0].id,
      rf_budgets: JSON.stringify(rf.budgets),
      staff_id: rf.staff_id,
    })

    await this.sendNotifToProgramManagerToApprove(insertedRf.id, program.program_manager)
    await this.notifyRfSubmitted(insertedRf)
    await this.notifRepo.create({
      employee_id: insertedRf.requested_by,
      ref_id: insertedRf.id,
      notif_type: NotifType.TRACKING_REQUESTITION_FORM,
      deleted_at: null,
    })

    await this.generalRepo.createLog({
      pr_id: '',
      rf_id: rfId,
      user_id: submittedByEmployee[0].user_id,
      log_type: 'RequisitionForm',
      raw_data: '',
      program_id: programId,
      message: `Re-submitted a new <a href="/dashboard/procurement/${program.id}/detail/${projectId}/${insertedRf.id}">"${insertedRf.about_request}"</a> from ${program.program_name} project`,
    })

    return insertedRf.id
  }
}
