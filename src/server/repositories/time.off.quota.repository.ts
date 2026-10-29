import { Injectable } from '@nestjs/common'
import { CommonPrismaClient } from '@server/common/prisma.client'
import { annual_timeoff_reset_history, LeaveType, Prisma, TimeOffRequestStatus, time_off_request } from '@prisma/client'

@Injectable()
export class TimeOffQuotaRepository {
  constructor(private prisma: CommonPrismaClient) {}

  async deleteTimeOff(id: string): Promise<time_off_request> {
    return this.prisma.time_off_request.delete({
      where: {
        id: id,
      },
    })
  }

  async createEmployee(data: Prisma.time_off_requestUncheckedCreateInput): Promise<time_off_request> {
    return this.prisma.time_off_request.create({
      data,
    })
  }

  async updateTimeOffRequest(id: string, data: Prisma.time_off_requestUncheckedUpdateInput): Promise<time_off_request> {
    return this.prisma.time_off_request.update({
      where: {
        id: id,
      },
      data,
    })
  }

  async countLastYearTotal(yearNow: number, status: string): Promise<number> {
    const start = `${yearNow - 1}-02-01`
    const end = `${yearNow}-01-31`
    return this.prisma.$queryRaw`
      SELECT SUM(tor.duration) as total FROM time_off_request tor
      WHERE tor.status = ${status}
      AND tor.start_date BETWEEN ${start} AND ${end}
      AND tor.end_date BETWEEN ${start} AND ${end}
    `
  }

  async getAllActiveTimeOffBetweenDates(start: string, end: string): Promise<time_off_request[]> {
    return this.prisma.$queryRaw`
          SELECT
          tor.id,
          tor.leave_type,
          tor.start_date,
          tor.end_date,
          tor.duration,
          tor.notes,
          tor.doc_path,
          tor.status,
          tor.created_at,
          tor.updated_at,
          tor.approved_at,
          JSON_OBJECT(
            'id', emp.id,
            'full_name', emp.full_name,
            'pass_photo_path', emp.pass_photo_path,
            'avatar', usr.avatar,
            'email', usr.email,
            'contract', (SELECT JSON_OBJECT('position', ec9.position, 'department', ec9.department, 'spv_id', ec9.supervisor_id) FROM employee_contracts ec9 WHERE ec9.employee_id = emp.id ORDER BY ec9.created_at DESC LIMIT 1) 
          ) as employee,
            (SELECT JSON_OBJECT(
                'id', emp2.id,
                'full_name', emp2.full_name,
                'pass_photo_path', emp2.pass_photo_path,
                'avatar', usr2.avatar,
                'email', usr2.email,
                'contract', (SELECT JSON_OBJECT('position', ec9.position, 'department', ec9.department, 'spv_id', ec9.supervisor_id) FROM employee_contracts ec9 WHERE ec9.employee_id = emp2.id ORDER BY ec9.created_at DESC LIMIT 1)
            ) FROM employee emp2 JOIN users usr2 ON usr2.id = emp2.user_id WHERE emp2.id = tor.pic_employee_id) AS pic_employee
        FROM time_off_request tor
        JOIN employee emp ON emp.id = tor.employee_id
        JOIN users usr ON usr.id = emp.user_id
        WHERE  tor.start_date <= ${end} AND tor.end_date >= ${start}
        AND tor.deleted_at IS NULL
        ORDER BY tor.created_at DESC
      `
  }

  async getAllByEmployeeid(employeeId: string): Promise<time_off_request[]> {
    return this.prisma.$queryRaw`
          SELECT
          tor.id,
          tor.leave_type,
          tor.start_date,
          tor.end_date,
          tor.duration,
          tor.notes,
          tor.doc_path,
          tor.status,
          tor.created_at,
          tor.updated_at,
          tor.approved_at,
          JSON_OBJECT(
            'id', emp.id,
            'full_name', emp.full_name,
            'pass_photo_path', emp.pass_photo_path,
            'avatar', usr.avatar
          ) as employee,
            (SELECT JSON_OBJECT(
                'id', emp2.id,
                'full_name', emp2.full_name,
                'pass_photo_path', emp2.pass_photo_path,
                'avatar', usr2.avatar, 'email', usr2.email
            ) FROM employee emp2 JOIN users usr2 ON usr2.id = emp2.user_id WHERE emp2.id = tor.pic_employee_id) AS pic_employee
        FROM time_off_request tor
        JOIN employee emp ON emp.id = tor.employee_id
        JOIN users usr ON usr.id = emp.user_id
        WHERE tor.employee_id = ${employeeId}
        AND tor.deleted_at IS NULL
        ORDER BY tor.created_at DESC
      `
  }

  async findByIdSimple(id: string): Promise<time_off_request | null> {
    return this.prisma.time_off_request.findFirst({
      where: { id, deleted_at: null },
    })
  }

  async getById(id: string, employeeId: string): Promise<time_off_request | null> {
    return this.prisma.$queryRaw`
          SELECT
          tor.id,
          tor.leave_type,
          tor.start_date,
          tor.end_date,
          tor.duration,
          tor.notes,
          tor.doc_path,
          tor.status,
          tor.created_at,
          tor.updated_at,
          tor.approved_at,
          JSON_OBJECT(
            'id', emp.id,
            'full_name', emp.full_name,
            'pass_photo_path', emp.pass_photo_path,
            'avatar', usr.avatar
          ) as employee,
            (SELECT JSON_OBJECT(
                'id', emp2.id,
                'full_name', emp2.full_name,
                'pass_photo_path', emp2.pass_photo_path,
                'avatar', usr2.avatar
            ) FROM employee emp2 JOIN users usr2 ON usr2.id = emp2.user_id WHERE emp2.id = tor.pic_employee_id) AS pic_employee
        FROM time_off_request tor
        JOIN employee emp ON emp.id = tor.employee_id
        JOIN users usr ON usr.id = emp.user_id
        WHERE tor.id = ${id}
        AND tor.deleted_at IS NULL
        ORDER BY tor.created_at DESC
      `
  }

  async countByStatus(status: TimeOffRequestStatus) {
    return this.prisma.time_off_request.count({ where: { status: status } })
  }

  async getUsedNotResetted(): Promise<{ employeeId: string; totalDuration: number | null }[]> {
    const records = await this.prisma.time_off_request.findMany({
      where: {
        resetted_at: null,
        deleted_at: null,
        status: TimeOffRequestStatus.approved,
        leave_type: LeaveType.annual,
      },
      select: {
        employee_id: true,
        duration: true,
      },
    })

    const grouped = records.reduce((acc, record) => {
      acc[record.employee_id] = (acc[record.employee_id] || 0) + (record.duration ?? 0)
      return acc
    }, {} as Record<string, number>)

    return Object.entries(grouped).map(([employee_id, total_duration]) => ({
      employeeId: employee_id,
      totalDuration: total_duration,
    }))
  }

  async getTimeOffBetweenDates(start: Date, end: Date): Promise<time_off_request[]> {
    return this.prisma.time_off_request.findMany({
      where: {
        end_date: {
          lte: end,
          gt: start,
        },
      },
    })
  }

  async getUsedNotResettedLessThan(maxdate: Date): Promise<{ employeeId: string; totalDuration: number | null }[]> {
    const records = await this.prisma.time_off_request.findMany({
      where: {
        resetted_at: null,
        deleted_at: null,
        status: TimeOffRequestStatus.approved,
        leave_type: LeaveType.annual,
        end_date: { lte: maxdate },
      },
      select: {
        employee_id: true,
        duration: true,
      },
    })

    const grouped = records.reduce((acc, record) => {
      acc[record.employee_id] = (acc[record.employee_id] || 0) + (record.duration ?? 0)
      return acc
    }, {} as Record<string, number>)

    return Object.entries(grouped).map(([employee_id, total_duration]) => ({
      employeeId: employee_id,
      totalDuration: total_duration,
    }))
  }

  async getAllLessThanDate(maxdate: Date): Promise<time_off_request[]> {
    const records = await this.prisma.time_off_request.findMany({
      where: { end_date: { lt: maxdate } },
    })
    return records
  }

  async getCapturedAnnualByYear(year: string): Promise<annual_timeoff_reset_history> {
    return this.prisma.annual_timeoff_reset_history.findFirst({
      where: {
        year: Number(year),
      },
    })
  }

  async getLastCapturedAnnualByYear(): Promise<annual_timeoff_reset_history> {
    return this.prisma.annual_timeoff_reset_history.findFirst({
      orderBy: {
        year: 'desc',
      },
      take: 1,
    })
  }

  /**
   * Capture a completed cycle and apply carry-over once, as a single database transaction.
   * This replaces the previous (unsafe) rollover side effect in the GET endpoint.
   */
  async applyAnnualReset(
    year: number,
    resetAt: Date,
    captured: Array<{ employee_id: string; quota: number; used: number }>,
    requestIds: string[],
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const alreadyCaptured = await tx.annual_timeoff_reset_history.findFirst({ where: { year } })
      if (alreadyCaptured) {
        throw new Error('Annual leave cycle has already been reset for this year')
      }

      await tx.annual_timeoff_reset_history.create({
        data: { year, captured, reset_date: resetAt, reseted_by: '' },
      })

      if (requestIds.length > 0) {
        await tx.time_off_request.updateMany({
          where: { id: { in: requestIds }, resetted_at: null },
          data: { resetted_at: resetAt },
        })
      }

      for (const item of captured) {
        // Existing policy carries unused days forward in addition to the current quota.
        const carryOver = item.quota - item.used
        if (carryOver !== 0) {
          await tx.employee.update({
            where: { id: item.employee_id },
            data: { annual_quota: { increment: carryOver } },
          })
        }
      }
    })
  }

  async addAnnualCaptureHistory(
    capture: Prisma.annual_timeoff_reset_historyUncheckedCreateInput,
  ): Promise<annual_timeoff_reset_history> {
    return this.prisma.annual_timeoff_reset_history.create({ data: capture })
  }
}
