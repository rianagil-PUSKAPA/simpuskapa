import { RoleDefinition } from '@/shared/role.access'
import { ServerInternalError } from '@/shared/server.errors'
import { Injectable } from '@nestjs/common'
import {
  programs as Program,
  Prisma,
  vendor_packages,
  partners,
  projects,
  activities,
  budgets,
  ProgramApproval,
  vendor_category_information,
  vendor_type,
  perdiem_settings,
  fund_received_history,
} from '@prisma/client'
import { CommonPrismaClient } from '@server/common/prisma.client'

@Injectable()
export class ProgramRepository {
  constructor(private prisma: CommonPrismaClient) {}

  async getPerdiemSettingByProgramId(programId: string): Promise<perdiem_settings> {
    return this.prisma.perdiem_settings.findFirst({
      where: { program_id: programId },
    })
  }
  async createPerdiemSetting(perdiem: Prisma.perdiem_settingsUncheckedCreateInput): Promise<any> {
    return this.prisma.perdiem_settings.create({ data: perdiem })
  }

  async updatePerdiemSetting(perdiem: Prisma.perdiem_settingsUncheckedCreateInput): Promise<any> {
    return this.prisma.perdiem_settings.update({
      where: { id: perdiem.id },
      data: perdiem,
    })
  }

  async create(data: Prisma.programsUncheckedCreateInput): Promise<Program> {
    return this.prisma.programs.create({
      data: data,
    })
  }

  async delete(id: string): Promise<Program> {
    return this.prisma.programs.delete({ where: { id: id } })
  }

  async update(data: Prisma.programsUncheckedUpdateInput, id: string): Promise<Program> {
    return this.prisma.programs.update({
      where: {
        id: id,
      },
      data: data,
    })
  }

  async updateRevisedBudgetApprovalDoc(path: string, programId: string): Promise<any> {
    return this.prisma.programs.update({
      where: {
        id: programId,
      },
      data: {
        revise_approval_doc_path: [path],
      },
    })
  }

  async updateRevisionPath(path: any[], programId: string): Promise<Program> {
    return this.prisma.programs.update({
      data: {
        revisions_path: path,
      },
      where: {
        id: programId,
      },
    })
  }

  async createApproval(status: string, approvedAt: Date, id: string, notes: string = ''): Promise<Program> {
    return this.prisma.programs.update({
      data: {
        approval: status,
        approved_at: approvedAt.toISOString(),
        approval_note: notes,
      } as Prisma.programsUncheckedUpdateInput,
      where: { id: id },
    })
  }

  async getAllByYear(
    approval_status: ProgramApproval | null = null,
    fyear: number = 2024,
  ): Promise<Array<
    Program & {
      partner: partners
      projects: (projects & {
        activities: (activities & {
          budgets: budgets[]
        })[]
      })[]
    }
  > | null> {
    if (approval_status) {
      return this.prisma.programs.findMany({
        where: {
          approval: approval_status,
          created_at: {
            gte: new Date(`${fyear}-01-01`),
            lte: new Date(`${fyear + 1}-01-01`),
          },
        },
        include: {
          partner: {},
          projects: {
            include: {
              activities: {
                orderBy: {
                  ordering_seq: 'asc',
                },
                include: {
                  budgets: {
                    orderBy: {
                      ordering_seq: 'asc',
                    },
                  },
                },
              },
            },
          },
        },
      })
    }

    return this.prisma.programs.findMany({
      include: {
        partner: {},
        projects: {
          include: {
            activities: {
              orderBy: {
                ordering_seq: 'asc',
              },
              include: {
                budgets: {
                  orderBy: {
                    ordering_seq: 'asc',
                  },
                },
              },
            },
          },
        },
      },
    })
  }

  async getDetailedById(programId: string): Promise<
    Program & {
      partner: partners
      projects: (projects & {
        activities: (activities & {
          budgets: budgets[]
        })[]
      })[]
    }
  > | null {
    return this.prisma.programs.findFirst({
      where: {
        id: programId,
      },
      include: {
        partner: {},
        projects: {
          include: {
            activities: {
              include: {
                budgets: {},
              },
            },
          },
        },
      },
    })
  }

  async getAll(
    offset: number,
    limit: number,
    approval_status: ProgramApproval | null = null,
    program_ownership_type = 'PROGRAM',
    partner_code = '',
    program_manager_id = '',
    sort = '',
    keyword = '',
  ): Promise<Array<
    Program & {
      partner: partners
      projects: (projects & {
        activities: (activities & {
          budgets: budgets[]
        })[]
      })[]
    }
  > | null> {
    // this.prisma.programs.findMany({
    //   where: {
    //     program_manager_rel: {
    //       full_name:
    //     }
    //   }
    // })

    const qq = {
      take: Number(limit),
      skip: Number(offset),
      where: {
        program_ownership_type: program_ownership_type,
      },
      include: {
        partner: {},
        projects: {
          include: {
            activities: {
              include: {
                budgets: {},
              },
            },
          },
        },
      },
    }

    // this.prisma.programs.findMany({
    //   orderBy: {
    //     program_manager_rel: {
    //       full_name: 'asc'
    //     },
    //    program_name: 'asc',
    //    partner: {
    //     name: 'asc'
    //    }
    //   }
    // })

    if (approval_status) {
      qq['where']['approval'] = approval_status
    }

    if (partner_code != '') {
      qq['where']['partner'] = { name: partner_code }
    }

    if (program_manager_id != '') {
      if (program_ownership_type === 'INTERNAL') {
        // Pada INTERNAL, filter program_manager dari frontend
        // dipakai sebagai General Manager.
        //
        // General Manager adalah role global User Management,
        // bukan kolom program_manager pada tabel program.
        const generalManagerUser = await this.prisma.users.findFirst({
          where: {
            deleted_at: null,
            status: true,
            role: {
              array_contains: RoleDefinition.GENERAL_MANAGER,
            },
          },
        })

        const generalManagerEmployee = generalManagerUser
          ? await this.prisma.employee.findFirst({
              where: {
                user_id: generalManagerUser.id,
              },
            })
          : null

        if (!generalManagerEmployee || generalManagerEmployee.full_name !== program_manager_id) {
          // Tidak ada Internal project yang cocok.
          qq['where']['id'] = { in: [] }
        }
      } else {
        // PROGRAM tetap menggunakan Project Manager seperti sebelumnya.
        qq['where']['program_manager_rel'] = {
          full_name: program_manager_id,
        }
      }
    }

    if (keyword != '') {
      qq['where']['program_name'] = {
        contains: keyword,
      }
    }
    qq['orderBy'] = {
      created_at: 'desc',
    }

    if (sort != '') {
      const sortParam = sort.split('|')

      if (sortParam[0] == 'program_name') {
        qq['orderBy'] = {
          program_name: sortParam[1],
        }
      }
      if (sortParam[0] == 'partner_name') {
        qq['orderBy'] = {
          partner: {
            name: sortParam[1],
          },
        }
      }
      if (sortParam[0] == 'program_manager') {
        qq['orderBy'] = {
          program_manager_rel: {
            full_name: sortParam[1],
          },
        }
      }
    }

    return this.prisma.programs.findMany(qq)

    // return this.prisma.programs.findMany({
    //   take: Number(limit),
    //   skip: Number(offset),
    //   where: {
    //     approval: approval_status,
    //     program_ownership_type: program_ownership_type,
    //   },
    //   include: {
    //     partner: {},
    //     projects: {
    //       include: {
    //         activities: {
    //           orderBy: {
    //             ordering_seq: 'asc',
    //           },
    //           include: {
    //             budgets: {
    //               orderBy: {
    //                 ordering_seq: 'asc',
    //               },
    //             },
    //           },
    //         },
    //       },
    //     },
    //   },
    // })
  }

  async getAllCount(
    approval_status: ProgramApproval | null = null,
    program_ownership_type = '',
    partner_code = '',
    program_manager_id = '',
    sort = '',
    keyword = '',
  ): Promise<number> {
    const qq = {
      where: {},
    }
    qq['orderBy'] = { created_at: 'desc' }

    if (program_ownership_type != '') {
      qq['where']['program_ownership_type'] = program_ownership_type
    }
    if (approval_status) {
      qq['where']['approval'] = approval_status
    }

    if (partner_code != '') {
      qq['where']['partner'] = { name: partner_code }
    }

    if (program_manager_id != '') {
      qq['where']['program_manager_rel'] = { full_name: program_manager_id }
    }

    if (keyword != '') {
      qq['where']['program_name'] = {
        contains: keyword,
      }
    }

    if (sort != '') {
      const sortParam = sort.split('|')

      if (sortParam[0] == 'program_name') {
        qq['orderBy'] = {
          program_name: sortParam[1],
        }
      }
      if (sortParam[0] == 'partner_name') {
        qq['orderBy'] = {
          partner: {
            name: sortParam[1],
          },
        }
      }
      if (sortParam[0] == 'program_manager') {
        qq['orderBy'] = {
          program_manager_rel: {
            full_name: sortParam[1],
          },
        }
      }
    }

    return this.prisma.programs.count(qq)
  }

  async getById(id: string): Promise<Program & { partner: partners }> {
    return this.prisma.programs.findFirst({
      where: {
        id: id,
      },
      include: {
        partner: {},
      },
    })
  }

  async getCountTotalByStatus(status: ProgramApproval): Promise<number> {
    return this.prisma.programs.count({
      where: {
        approval: { not: 'success' },
      },
    })
  }

  async getProgramIdByActivityId(activityId: string): Promise<any> {
    return this.prisma.$queryRaw`
    SELECT programs.id FROM programs
    JOIN projects ON projects.program_id = programs.id
    JOIN activities ON activities.project_id = projects.id
    WHERE activities.id = ${activityId}
    `
  }

  async getByCreatedUserId(id: string): Promise<Program & { partner: partners }> {
    return this.prisma.programs.findFirst({
      where: {
        created_by: id,
        form_progress: {
          lt: 100,
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      include: {
        partner: {},
      },
    })
  }

  async getListForReportByProgramId(programId: string): Promise<
    Program & {
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
  > {
    return this.prisma.programs.findFirst({
      where: {
        id: programId,
      },
      include: {
        projects: {
          orderBy: {
            code: 'asc',
          },
          include: {
            activities: {
              orderBy: {
                ordering_seq: 'asc',
              },
              include: {
                budgets: {
                  include: {
                    vendor_category_info: {
                      include: {
                        vendor_type: {},
                      },
                    },
                  },
                  orderBy: {
                    ordering_seq: 'asc',
                  },
                },
              },
            },
          },
        },
      },
    })
  }

  async addFundReceived(fund: Prisma.fund_received_historyUncheckedCreateInput): Promise<fund_received_history> {
    return this.prisma.fund_received_history.create({ data: fund })
  }
  async getFundReceived(programId: string): Promise<fund_received_history[]> {
    return this.prisma.fund_received_history.findMany({
      where: { program_id: programId },
      orderBy: { created_at: 'desc' },
    })
  }
}
