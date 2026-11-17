import { Injectable } from '@nestjs/common'
import { activities as Activity, Prisma } from '@prisma/client'
import { CommonPrismaClient } from '@server/common/prisma.client'

@Injectable()
export class ActivityRepository {
  constructor(private prisma: CommonPrismaClient) {}

  async create(data: Prisma.activitiesUncheckedCreateInput): Promise<Activity> {
    return this.prisma.activities.create({
      data: data,
    })
  }

  async deleteWhereNotinIds(ids: string[], projectId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.activities.deleteMany({
      where: {
        id: {
          notIn: ids,
        },
        project_id: projectId,
      },
    })
  }

  async update(data: Prisma.activitiesUncheckedUpdateInput, id: string): Promise<Activity> {
    return this.prisma.activities.update({
      data: data,
      where: {
        id: id,
      },
    })
  }

  async getAll(offset: number, limit: number): Promise<Array<Activity> | null> {
    return this.prisma.activities.findMany({
      take: Number(limit),
      skip: Number(offset),
      orderBy: {
        ordering_seq: 'asc',
      },
    })
  }
}
