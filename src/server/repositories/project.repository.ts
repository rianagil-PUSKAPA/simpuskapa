import { Injectable } from '@nestjs/common'
import { projects as Project, Prisma, activities } from '@prisma/client'
import { CommonPrismaClient } from '@server/common/prisma.client'

@Injectable()
export class ProjectRepository {
  constructor(private prisma: CommonPrismaClient) {}

  async create(data: Prisma.projectsUncheckedCreateInput): Promise<Project> {
    return this.prisma.projects.create({
      data: data,
    })
  }

  async update(data: Prisma.projectsUncheckedUpdateInput, id: string): Promise<Project> {
    return this.prisma.projects.update({
      data: data,
      where: {
        id: id,
      },
    })
  }

  async deleteWhereNotinIds(ids: string[], programId: string): Promise<Prisma.BatchPayload> {
    console.log('tobe not deleted', ids)
    return this.prisma.projects.deleteMany({
      where: {
        id: {
          notIn: ids,
        },
        program_id: programId,
      },
    })
  }

  async getAllByProgramId(programId: string): Promise<Array<Project & { activities: activities[] }> | null> {
    return this.prisma.projects.findMany({
      where: {
        program_id: programId,
      },
      orderBy: {
        ordering_seq: 'asc',
      },
      include: {
        activities: {
          orderBy: {
            ordering_seq: 'asc',
          },
        },
      },
    })
  }

  async getAll(offset: number, limit: number): Promise<Array<Project & { activities: activities[] }> | null> {
    return this.prisma.projects.findMany({
      take: Number(limit),
      skip: Number(offset),
      orderBy: { ordering_seq: 'asc' },
      include: {
        activities: { orderBy: { ordering_seq: 'asc' } },
      },
    })
  }
}
