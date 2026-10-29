import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { LeaveType, Prisma, TimeOffRequestStatus } from '@prisma/client'
import { group, time } from 'console'
import dayjs from 'dayjs'
import { Emblema_One } from 'next/font/google'
import { argv0 } from 'process'
import { EmployeeContractRepository } from '../repositories/employee.contract.repository'
import { EmployeeRepository } from '../repositories/employee.repository'
import { NotificationRepository } from '../repositories/notification.repository'
import { MailRepository } from '../repositories/mail.repository'
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
    private mailRepo: MailRepository,
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
    const previous = await this.timeOffQuotaRepository.findByIdSimple(id)
    if (!previous) throw new BadRequestException('Time off request not found')

    if (status === TimeOffRequestStatus.approved) {
      await this.timeOffQuotaRepository.updateTimeOffRequest(id, {
        approved_at: new Date(),
        status,
      } as Prisma.time_off_requestUncheckedCreateInput)
    } else {
      await this.timeOffQuotaRepository.updateTimeOffRequest(id, {
        status,
      } as Prisma.time_off_requestUncheckedCreateInput)
    }

    if (previous.status === status) return true

    if (status === 'approved' || status === 'rejected' || status === 'declined' || status === 'cancelled') {
      const message = status === 'approved' ? 'disetujui' : status === 'cancelled' ? 'dibatalkan' : 'ditolak'
      await this.mailRepo.sendWorkflowToEmployees(
        [previous.employee_id],
        `Pengajuan Cuti ${message}`,
        `Pengajuan cuti tanggal ${dayjs(previous.start_date).format('DD MMM YYYY')} sampai ${dayjs(
          previous.end_date,
        ).format('DD MMM YYYY')} telah ${message}.`,
        'https://sim.puskapa.org/dashboard/internal/timeoff-request',
        'Lihat Status Cuti',
      )

      const contracts = await this.employeeContractRepo.getContractByEmployeeById(previous.employee_id)
      const supervisorId = contracts?.[0]?.supervisor_id
      if (supervisorId) {
        await this.notifRepo.resolveNotif(supervisorId, id, NotifType.APPROVAL_TIMEOFF)
      }

      // Announcement is sent only for a newly approved time-off request.
      // Notes for medical/family leave are intentionally omitted from all-staff mail.
      if (status === 'approved' && previous.leave_type !== LeaveType.fine) {
        const employee = await this.employeeRepo.getEmployeeById(previous.employee_id)
        if (employee) {
          const replacement = previous.pic_employee_id
            ? await this.employeeRepo.getEmployeeById(previous.pic_employee_id)
            : null

          const leaveLabels: Record<string, string> = {
            annual: 'Cuti Tahunan',
            sick_certified: 'Izin Sakit (dengan Surat Dokter)',
            sick_uncertified: 'Izin Sakit',
            special: 'Izin Khusus',
            compensatory: 'Cuti Pengganti',
            maternity: 'Cuti Melahirkan',
            paternity: 'Cuti Ayah',
            work_remotely: 'Bekerja dari Jarak Jauh',
            isolation: 'Isolasi Mandiri',
            caregiving: 'Cuti Perawatan Keluarga',
            joint_holiday: 'Cuti Bersama',
          }
          const leaveLabel = previous.leave_type
            ? leaveLabels[previous.leave_type] || previous.leave_type
            : 'Cuti / Izin'

          const privateLeaveTypes: LeaveType[] = [
            LeaveType.special,
            LeaveType.sick_certified,
            LeaveType.sick_uncertified,
            LeaveType.maternity,
            LeaveType.paternity,
            LeaveType.caregiving,
            LeaveType.isolation,
          ]
          const note =
            previous.leave_type && privateLeaveTypes.includes(previous.leave_type)
              ? 'Tidak ditampilkan untuk menjaga privasi'
              : previous.notes?.trim() || '-'

          const start = previous.start_date ? dayjs(previous.start_date).format('DD/MM/YYYY') : '-'
          const end = previous.end_date ? dayjs(previous.end_date).format('DD/MM/YYYY') : '-'
          const duration = previous.duration ?? '-'
          const requester = employee.full_name
          const picName = replacement?.full_name || 'Belum ditentukan'

          const announcement = [
            'Dear All,',
            '',
            `Melalui email ini saya ingin memberitahukan bahwa saya, ${requester}, akan mengambil cuti/izin dengan rincian sebagai berikut:`,
            '',
            `Jenis Izin: ${leaveLabel}`,
            `Dari Tanggal: ${start}`,
            `Sampai Tanggal: ${end}`,
            `Jumlah hari cuti: ${duration} hari`,
            `Catatan: ${note}`,
            '',
            `Selama tidak berada di kantor, yang akan menggantikan ${requester} adalah ${picName} (Person in Charge while Time Off).`,
            '',
            'Dengan Hormat,',
            requester,
          ].join('\n')

          const differentYear = Boolean(
            previous.start_date &&
              previous.end_date &&
              dayjs(previous.start_date).year() !== dayjs(previous.end_date).year(),
          )
          const subjectDateFormat = differentYear ? 'D MMM YYYY' : 'D MMM'
          const subjectStart = previous.start_date
            ? dayjs(previous.start_date).locale('en').format(subjectDateFormat)
            : '-'
          const subjectEnd = previous.end_date ? dayjs(previous.end_date).locale('en').format(subjectDateFormat) : '-'

          await this.mailRepo.sendWorkflowToAllActiveUsers(
            `Leave Announcement - ${requester} from ${subjectStart} to ${subjectEnd}`,
            announcement,
            'https://sim.puskapa.org/dashboard/internal/timeoff/all',
            'Lihat Kalender Cuti',
          )
        }
      }
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

    // One announcement per collective leave event, not one per employee.
    await this.mailRepo.sendWorkflowToAllActiveUsers(
      'Informasi Cuti Bersama',
      `Cuti bersama dijadwalkan pada ${dayjs(startDate).format('DD MMM YYYY')} sampai ${dayjs(endDate).format(
        'DD MMM YYYY',
      )}.`,
      'https://sim.puskapa.org/dashboard/internal/timeoff/all',
      'Lihat Kalender Cuti',
    )

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

    // Directly approved collective leave should not leave an obsolete approval task.
    if (!forceApprove) {
      const supervisorId = contract?.[0]?.supervisor_id
      if (supervisorId) {
        await this.notifRepo.create({
          employee_id: supervisorId,
          ref_id: inserted.id,
          notif_type: NotifType.APPROVAL_TIMEOFF,
          deleted_at: null,
        })

        const requester = await this.employeeRepo.getEmployeeById(employeeId)
        await this.mailRepo.sendWorkflowToEmployees(
          [supervisorId],
          'Permintaan Approval Cuti',
          `${requester?.full_name || 'Staf'} mengajukan cuti ${dayjs(startDate).format('DD MMM YYYY')} sampai ${dayjs(
            endDate,
          ).format('DD MMM YYYY')} dan membutuhkan persetujuan Anda.`,
          'https://sim.puskapa.org/dashboard/internal/timeoff/requests',
          'Tinjau Cuti',
        )
      }

      await this.mailRepo.sendWorkflowToEmployees(
        [employeeId],
        'Pengajuan Cuti Diterima',
        `Pengajuan cuti Anda untuk ${dayjs(startDate).format('DD MMM YYYY')} sampai ${dayjs(endDate).format(
          'DD MMM YYYY',
        )} telah tercatat dan menunggu keputusan.`,
        'https://sim.puskapa.org/dashboard/internal/timeoff-request',
        'Lihat Pengajuan Cuti',
      )
    }

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

  // Changes to quota must be explicit. Reading annual summaries must never modify balances.
  async updateAnnualQuota(employeeId: string, quota: number): Promise<number> {
    if (!Number.isInteger(quota) || quota < 0 || quota > 365) {
      throw new BadRequestException('Annual leave quota must be a whole number between 0 and 365')
    }

    const employee = await this.employeeRepo.getEmployeeByIdSimple(employeeId)
    if (!employee || employee.deleted_at) {
      throw new NotFoundException('Employee not found')
    }

    const captured = await this.timeOffQuotaRepository.getCapturedAnnualByYear(String(new Date().getFullYear()))
    if (captured) {
      throw new BadRequestException('The current year has already been archived; quota cannot be edited')
    }

    await this.employeeRepo.updateEmployeeById(employeeId, { annual_quota: quota })
    return quota
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
