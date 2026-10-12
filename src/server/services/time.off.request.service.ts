import { BadRequestException, Injectable } from '@nestjs/common'
import { LeaveType, Prisma, TimeOffRequestStatus } from '@prisma/client'
import { group, time } from 'console'
import dayjs from 'dayjs'
import { Emblema_One } from 'next/font/google'
import { argv0 } from 'process'
import { EmployeeContractRepository } from '../repositories/employee.contract.repository'
import { EmployeeRepository } from '../repositories/employee.repository'
import { NotificationRepository } from '../repositories/notification.repository'
import { TimeOffQuotaRepository } from '../repositories/time.off.quota.repository'
import { NotifType } from '../types/notification.dto'
import {
  EmployeeAnnualTimeOffRow,
  SummaryDetail,
  TimeOffListDataResponse,
  TimeOffRow,
} from '../types/time.off.request.dto'

@Injectable()
export class TimeOffRequestService {
  private readonly timeOffQuota: number = 12
  constructor(
    private employeeRepo: EmployeeRepository,
    private timeOffQuotaRepository: TimeOffQuotaRepository,
    private notifRepo: NotificationRepository,
    private employeeContractRepo: EmployeeContractRepository,
  ) {}

  async updateTimeOffRequest(
    fileName: string[],
    employeeId: string,
    startDate: string,
    endDate: string,
    leaveType: string,
    duration: number,
    notes: string,
    picId: string,
    status: string,
    id: string,
  ): Promise<boolean> {
    // validate startDate < +6 month ahead
    const now = new Date()
    const future = new Date(now.setMonth(now.getMonth() + 6))
    console.log(new Date(startDate), future)
    if (new Date(startDate) > future) {
      throw new Error('Start date must be less than 6 months from now')
    }

    console.log('last year total time off', new Date().getFullYear() + 1)
    const lastYearTotalTimeOff = await this.timeOffQuotaRepository.countLastYearTotal(
      new Date().getFullYear(),
      'approved',
    )
    const fineThisYear = await this.timeOffQuotaRepository.countLastYearTotal(new Date().getFullYear() + 1, 'fine')
    console.log('last->', lastYearTotalTimeOff, fineThisYear)
    if (fineThisYear == 0 && lastYearTotalTimeOff > this.timeOffQuota) {
      // create fine this year
      this.timeOffQuotaRepository.createEmployee({
        employee_id: employeeId,
        start_date: `${new Date().getFullYear()}-02-01`,
        end_date: `${new Date().getFullYear()}-02-01`,
        duration: lastYearTotalTimeOff - this.timeOffQuota,
        leave_type: LeaveType.fine,
        notes: 'Fine for last year',
        status: status,
        doc_path: fileName,
        pic_employee_id: picId,
      } as Prisma.time_off_requestUncheckedCreateInput)
    }

    this.timeOffQuotaRepository.updateTimeOffRequest(id, {
      employee_id: employeeId,
      start_date: startDate,
      end_date: endDate,
      duration: duration,
      leave_type: leaveType,
      notes: notes,
      status: status,
      doc_path: fileName,
      pic_employee_id: picId,
    } as Prisma.time_off_requestUncheckedCreateInput)
    return true
  }

  async deleteTimeOff(id: string): Promise<boolean> {
    this.timeOffQuotaRepository.deleteTimeOff(id)
    return true
  }

  async updateTimeOffStatus(status: string, id: string): Promise<boolean> {
    if (status == TimeOffRequestStatus.approved.toString()) {
      this.timeOffQuotaRepository.updateTimeOffRequest(id, {
        approved_at: new Date(),
        status: status,
      } as Prisma.time_off_requestUncheckedCreateInput)
    } else {
      this.timeOffQuotaRepository.updateTimeOffRequest(id, {
        status: status,
      } as Prisma.time_off_requestUncheckedCreateInput)
    }

    return true
  }

  async bulkCreateTimeOffRequest(
    fileName: string[],
    startDate: string,
    endDate: string,
    leaveType: string,
    duration: number,
    notes: string,
    picId: string,
  ): Promise<boolean> {
    const employees = await this.employeeRepo.getAllEmployee()
    for (const employee of employees) {
      await this.createTimeOffRequest(
        fileName,
        employee.id,
        startDate,
        endDate,
        leaveType,
        duration,
        notes,
        picId,
        true,
      )
    }

    return
  }

  async createTimeOffRequest(
    fileName: string[],
    employeeId: string,
    startDate: string,
    endDate: string,
    leaveType: string,
    duration: number,
    notes: string,
    picId: string,
    forceApprove = false,
  ): Promise<boolean> {
    // validate startDate < +6 month ahead
    const now = new Date()
    const future = new Date(now.setMonth(now.getMonth() + 6))
    console.log(new Date(startDate), future)
    if (new Date(startDate) > future) {
      throw new Error('Start date must be less than 6 months from now')
    }

    console.log('last year total time off', new Date().getFullYear() + 1)
    const lastYearTotalTimeOff = await this.timeOffQuotaRepository.countLastYearTotal(
      new Date().getFullYear(),
      'approved',
    )
    const fineThisYear = await this.timeOffQuotaRepository.countLastYearTotal(new Date().getFullYear() + 1, 'fine')
    console.log('last->', lastYearTotalTimeOff, fineThisYear)
    if (fineThisYear == 0 && lastYearTotalTimeOff > this.timeOffQuota) {
      // create fine this year
      await this.timeOffQuotaRepository.createEmployee({
        employee_id: employeeId,
        start_date: `${new Date().getFullYear()}-02-01`,
        end_date: `${new Date().getFullYear()}-02-01`,
        duration: lastYearTotalTimeOff - this.timeOffQuota,
        leave_type: LeaveType.fine,
        notes: 'Fine for last year',
        status: 'approved',
        doc_path: fileName,
        pic_employee_id: picId,
      } as Prisma.time_off_requestUncheckedCreateInput)
    }

    const inserted = await this.timeOffQuotaRepository.createEmployee({
      employee_id: employeeId,
      start_date: startDate,
      end_date: endDate,
      duration: duration,
      leave_type: leaveType,
      notes: notes,
      status: TimeOffRequestStatus.requested,
      doc_path: fileName,
      pic_employee_id: picId,
    } as Prisma.time_off_requestUncheckedCreateInput)

    if (forceApprove) {
      await this.timeOffQuotaRepository.updateTimeOffRequest(inserted.id, {
        status: TimeOffRequestStatus.approved,
      })
    }

    const contract = await this.employeeContractRepo.getContractByEmployeeById(employeeId)

    await this.notifRepo.create({
      employee_id: contract[0].supervisor_id,
      ref_id: inserted.id,
      notif_type: NotifType.APPROVAL_TIMEOFF,
      deleted_at: null,
    })

    return true
  }

  async getAllActiveTimeOffBetweenDates(
    start: string,
    end: string,
    status: string,
    spvId: string,
    leaveType: string,
    groupByDate: string = '',
  ): Promise<TimeOffListDataResponse> {
    let allTimeOffs = await this.timeOffQuotaRepository.getAllActiveTimeOffBetweenDates(
      dayjs(start).format('YYYY-MM-DD HH:mm:ss'),
      dayjs(end).format('YYYY-MM-DD HH:mm:ss'),
    )

    console.log('TO', allTimeOffs)

    if (spvId && spvId != '') {
      allTimeOffs = allTimeOffs.filter((timeOff) => (timeOff as any).employee.contract.spv_id === spvId)
    }

    if (leaveType && leaveType != '') {
      allTimeOffs = allTimeOffs.filter((timeOff) => timeOff.leave_type === spvId)
    }

    if (status && status != '') {
      const filters = status.split('|')
      allTimeOffs = allTimeOffs.filter((timeOff) => filters.includes(timeOff.status))
    }

    if (groupByDate && groupByDate != '') {
      const grouped = new Map<string, TimeOffRow>()
      for (const to of allTimeOffs) {
        grouped.set(`${to.start_date}-${to.end_date}`, to as TimeOffRow)
      }

      const groupedList = Array.from(grouped.values())

      return new TimeOffListDataResponse('Success', groupedList)
    }

    return new TimeOffListDataResponse('Success', allTimeOffs as TimeOffRow[])
  }

  async getTimeOffList(employeeId: string): Promise<TimeOffListDataResponse> {
    const allTimeOffs = await this.timeOffQuotaRepository.getAllByEmployeeid(employeeId)

    const result = new TimeOffListDataResponse('Success', allTimeOffs as TimeOffRow[])

    // calculate summary
    const summary: SummaryDetail[] = []

    const leaveTypes = Object.values(LeaveType)

    leaveTypes.forEach((leaveType) => {
      // calculate total by leave type
      const total = result.data
        .filter((timeOff) => timeOff.status == 'approved')
        .filter((timeOff) => timeOff.leave_type === leaveType)
        .reduce((sum, current) => sum + current.duration, 0)

      summary.push({
        title: leaveType,
        totalDays: total,
      } as SummaryDetail)
    })

    result.summary = summary

    return result
  }

  async getById(id: string, employeeId: string): Promise<TimeOffRow | null> {
    const timeoff = this.timeOffQuotaRepository.getById(id, employeeId)
    return timeoff as unknown as TimeOffRow
  }

  async cancelTimeOffRequest(id: string): Promise<boolean> {
    await this.timeOffQuotaRepository.updateTimeOffRequest(id, {
      status: TimeOffRequestStatus.cancelled,
    })

    return true
  }

  async getAnnualTimeOffListRealtime(): Promise<EmployeeAnnualTimeOffRow[]> {
    const time_off_not_resetted = await this.timeOffQuotaRepository.getUsedNotResetted()

    const used_map = new Map<string, number>()
    for (const timeoff of time_off_not_resetted) {
      used_map.set(timeoff.employeeId, timeoff.totalDuration)
    }

    const employees = await this.employeeRepo.getAllEmployee()

    const timeoffAnnual: EmployeeAnnualTimeOffRow[] = []

    for (const employee of employees) {
      const to = new EmployeeAnnualTimeOffRow()
      to.employee_id = employee.id
      to.full_name = employee.full_name
      to.avatar = employee.pass_photo_path[0]
      to.position = employee.employee_contracts[0].position
      to.department = employee.employee_contracts[0].department
      to.quota = employee.annual_quota ?? 0
      to.used = used_map.get(employee.id) ?? 0
      to.remaining = to.quota - to.used
      to.email = employee.user.email
      to.employee_number = employee.identity_number
      timeoffAnnual.push(to)
    }

    return timeoffAnnual
  }

  async getAnnualTimeOffList(year: string): Promise<EmployeeAnnualTimeOffRow[]> {
    // find captured data if not exist use realtime calculation
    const captured = await this.timeOffQuotaRepository.getCapturedAnnualByYear(year)
    if (!captured) {
      return this.getAnnualTimeOffListRealtime()
    }

    const result: EmployeeAnnualTimeOffRow[] = []

    for (const capt of JSON.parse(JSON.stringify(captured.captured))) {
      const to = new EmployeeAnnualTimeOffRow()
      const employeeDetail = await this.employeeRepo.getEmployeeById(capt['employee_id'])
      if (!employeeDetail) {
        continue
      }

      to.employee_id = employeeDetail.id
      to.full_name = employeeDetail.full_name
      to.avatar = employeeDetail.pass_photo_path[0]
      to.position = employeeDetail.employee_contracts[0].position
      to.department = employeeDetail.employee_contracts[0].department
      to.quota = capt['quota'] ?? 0
      to.used = capt['used'] ?? 0
      to.remaining = to.quota - to.used
      to.email = employeeDetail.user.email
      to.employee_number = employeeDetail.identity_number

      result.push(to)

      // add remaining to next year
      await this.employeeRepo.updateEmployeeById(employeeDetail.id, {
        annual_quota: employeeDetail.annual_quota + to.remaining,
      })
    }
    return result
  }

  async resetAnnualTimeOffList(resetDate: string): Promise<boolean> {
    const resetAt = dayjs(resetDate).toDate()
    const resetYear = dayjs(resetDate).toDate().getFullYear()

    // get all timeoff between very last resetted annual and desired resets date
    const last_reset = await this.timeOffQuotaRepository.getLastCapturedAnnualByYear()

    if (last_reset.year == resetYear) {
      throw new BadRequestException('Cant reset, you have been resetting, try next period')
    }

    const time_off_active = await this.timeOffQuotaRepository.getTimeOffBetweenDates(last_reset.reset_date, resetAt)

    // capture
    const annual_agregated_summary = await this.getAnnualTimeOffListRealtime()
    const time_off_captured = []
    for (const to of annual_agregated_summary) {
      time_off_captured.push({
        employee_id: to.employee_id,
        used: to.used,
        quota: to.quota,
      })
    }

    await this.timeOffQuotaRepository.addAnnualCaptureHistory({
      year: last_reset.year + 1,
      captured: time_off_captured,
      reset_date: resetAt,
      reseted_by: '',
    })

    // reset
    for (const to of time_off_active) {
      await this.timeOffQuotaRepository.updateTimeOffRequest(to.id, {
        resetted_at: resetAt,
      })
    }

    return true
  }
}
