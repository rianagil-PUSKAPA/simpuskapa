import { Injectable } from '@nestjs/common'
import { projects } from '@prisma/client'
import { useId } from 'react'
import { ids } from 'webpack'
import { ActivityRepository } from '../repositories/activity.repository'
import { EmployeeRepository } from '../repositories/employee.repository'
import { GeneralRepository } from '../repositories/general.repository'
import { ProgramRepository } from '../repositories/program.repository'
import { ProjectRepository } from '../repositories/project.repository'
import { Project, ProjectActivity, ProjectCreateRequest, ProjectListResponse } from '../types/project.dto'

@Injectable()
export class ProjectService {
  constructor(
    private projectRepository: ProjectRepository,
    private activityRepository: ActivityRepository,
    private generalRepo: GeneralRepository,
    private programRepository: ProgramRepository,
  ) {}

  async updateProject(projects: ProjectCreateRequest, programId: string, userId: string): Promise<boolean> {
    console.log(projects)

    // delete alla ctivity which not in activity ids

    const keepProjectsIds: string[] = []
    for (const project of projects.projects) {
      keepProjectsIds.push(project.id)

      const keepIds: string[] = []
      for (const activity of project.activities) {
        keepIds.push(activity.id)
      }
      console.log(keepIds)
      await this.activityRepository.deleteWhereNotinIds(keepIds, project.id)
    }

    console.log(keepProjectsIds)
    await this.projectRepository.deleteWhereNotinIds(keepProjectsIds, programId)

    for (const project of projects.projects) {
      let usedProjectId = project.id
      try {
        await this.projectRepository.update(
          {
            code: project.code,
            description: project.description,
            ordering_seq: project.ordering_seq,
          },
          project.id,
        )
        console.log('updating')
      } catch (e) {
        const inserted = await this.projectRepository.create({
          id: project.id,
          ordering_seq: project.ordering_seq,
          description: project.description,
          code: project.code,
          program_id: programId,
        })
        usedProjectId = inserted.id
        console.log('insert new', inserted)
      }

      // insert activities
      for (const activity of project.activities) {
        try {
          await this.activityRepository.update(
            {
              ordering_seq: activity.ordering_seq,
              description: activity.description,
              notes: activity.notes,
              code: activity.code,
              due_date: activity.due_date,
              timeline: activity.timeline as any,
              project_id: usedProjectId,
              proposed_milestone: activity.proposed_milestone,
            },
            activity.id,
          )
        } catch (e) {
          if (e.code == 'P2025') {
            console.log('activity not found, creating new one')
            await this.activityRepository.create({
              ordering_seq: activity.ordering_seq,
              description: activity.description,
              notes: activity.notes,
              code: activity.code,
              due_date: activity.due_date,
              timeline: activity.timeline as any,
              project_id: usedProjectId,
              proposed_milestone: activity.proposed_milestone,
              id: activity.id,
            })
          }
          console.log(e)
        }
      }
    }
    const programDetail = await this.programRepository.getById(programId)

    await this.generalRepo.createLog({
      pr_id: '',
      rf_id: '',
      user_id: userId,
      log_type: 'Program',
      raw_data: JSON.stringify(projects),
      program_id: programId,
      message: `Updated the activity for <a href="/dashboard/project/${programId}?tab=activity">${programDetail.program_name}</a> project`,
    })

    return true
  }

  async createProject(projects: ProjectCreateRequest, programId: string, userId: string): Promise<boolean> {
    console.log(projects)
    for (const project of projects.projects) {
      const inserted = await this.projectRepository.create({
        code: project.code,
        description: project.description,
        ordering_seq: project.ordering_seq,
        program_id: programId,
      })
      console.log(project.activities)
      // insert activities
      for (const activity of project.activities) {
        await this.activityRepository.create({
          ordering_seq: activity.ordering_seq,
          description: activity.description,
          notes: activity.notes,
          code: activity.code,
          due_date: activity.due_date,
          timeline: activity.timeline as any,
          project_id: inserted.id,
          proposed_milestone: activity.proposed_milestone,
        })
      }
    }
    const programDetail = await this.programRepository.getById(programId)

    await this.generalRepo.createLog({
      pr_id: '',
      rf_id: '',
      user_id: userId,
      log_type: 'Program',
      raw_data: JSON.stringify(projects),
      program_id: programId,
      message: `Added new activity for <a href="/dashboard/project/${programId}?tab=activity">${programDetail.program_name}</a> project`,
    })

    return true
  }

  async getProjectList(programId: string): Promise<Project[]> {
    const projects = await this.projectRepository.getAllByProgramId(programId)

    const result = []
    for (const project of projects) {
      const formatedProject = new Project()
      formatedProject.activities = project.activities as unknown as ProjectActivity[]
      formatedProject.code = project.code
      formatedProject.description = project.description
      formatedProject.ordering_seq = project.ordering_seq
      formatedProject.id = project.id

      result.push(formatedProject)
    }

    return result
  }
}
