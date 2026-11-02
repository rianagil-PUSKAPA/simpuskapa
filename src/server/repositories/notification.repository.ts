import { Injectable } from '@nestjs/common'
import { notifications, Prisma } from '@prisma/client'
import { CommonPrismaClient } from '@server/common/prisma.client'
import { NotifType } from '../types/notification.dto'

@Injectable()
export class NotificationRepository {
  constructor(private prisma: CommonPrismaClient) {}

  async create(data: Prisma.notificationsUncheckedCreateInput): Promise<notifications> {
    return this.prisma.notifications.create({
      data: data,
    })
  }

  async resolveNotif(employeeId: string, refId: string, notfType: NotifType): Promise<any> {
    return this.prisma.notifications.updateMany({
      data: {
        deleted_at: new Date(),
      },
      where: {
        notif_type: notfType,
        ref_id: refId,
        employee_id: employeeId,
      },
    })
  }

  async resolveNotifByRefId(refId: string, notfType: NotifType): Promise<any> {
    return this.prisma.notifications.updateMany({
      data: {
        deleted_at: new Date(),
      },
      where: {
        notif_type: notfType,
        ref_id: refId,
      },
    })
  }

  async deleteNotifByRefIdOnly(refId: string): Promise<any> {
    return this.prisma.notifications.deleteMany({ where: { ref_id: refId } })
  }

  async update(data: Prisma.notificationsUncheckedUpdateInput, id: string): Promise<notifications> {
    return this.prisma.notifications.update({
      data: data,
      where: {
        id: id,
      },
    })
  }

  async getAll(employeeId: string): Promise<Array<notifications> | null> {
    return this.prisma.notifications.findMany({
      where: {
        deleted_at: null,
        employee_id: employeeId,
      },
      orderBy: {
        created_at: 'desc',
      },
    })
  }
}
