import { BaseLanguageDefinition, LD } from '@/i18n/base.language.definition'
import { Language } from '@/i18n/language'
import { Body, Controller, Get, HttpStatus, Logger, Param, Post, Put, Query, Req, Res } from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger'
import { Request, Response } from 'express'
import { ProjectService } from '../services/project.service'
import { HttpBaseResponse } from '../types/base.response.dto'
import { ProgramCreateRequest, ProgramListResponse } from '../types/program.dto'
import { ProjectCreateRequest, ProjectListResponse } from '../types/project.dto'

import { VendorDto } from '../types/vendor.dto'

@Controller()
export class ProjectController {
  private readonly logger = new Logger(ProjectController.name)
  private static readonly apiTags = 'project'
  private lang = Language.use(new BaseLanguageDefinition())

  constructor(private readonly projectService: ProjectService) {}

  @Post('/v1/program/:program_id/projects')
  @ApiTags(ProjectController.apiTags)
  @ApiOperation({ summary: 'create new project' })
  @ApiParam({ name: 'program_id', type: 'string' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiCreatedResponse({ type: HttpBaseResponse })
  @ApiExtraModels(ProgramCreateRequest)
  @ApiBearerAuth()
  async createProject(
    @Param('program_id') program_id: string,
    @Body() project: ProjectCreateRequest,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const userClaims = JSON.parse(request.headers.authorization)

    await this.projectService.createProject(project, program_id, userClaims['id'])

    return response
      .status(HttpStatus.CREATED)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_CREATED, ['Project']), ''))
  }

  @Get('/v1/program/:program_id/projects')
  @ApiTags(ProjectController.apiTags)
  @ApiOperation({ summary: 'get project list' })
  @ApiParam({ name: 'program_id', type: 'string' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: ProjectListResponse })
  @ApiExtraModels(ProjectListResponse)
  @ApiBearerAuth()
  async getProjectList(
    @Param('program_id') program_id: string,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const result = await this.projectService.getProjectList(program_id)

    return response
      .status(HttpStatus.OK)
      .send(new ProjectListResponse(this.lang.lang(LD.RESPONSE_OK, ['Project']), result))
  }

  @Put('/v1/program/:program_id/projects')
  @ApiTags(ProjectController.apiTags)
  @ApiOperation({ summary: 'update project' })
  @ApiParam({ name: 'program_id', type: 'string' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiCreatedResponse({ type: HttpBaseResponse })
  @ApiExtraModels(VendorDto)
  @ApiBearerAuth()
  async updateProject(
    @Param('program_id') program_id: string,
    @Body() project: ProjectCreateRequest,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const userClaims = JSON.parse(request.headers.authorization)

    await this.projectService.updateProject(project, program_id, userClaims['id'])

    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_UPDATED, ['Project']), ''))
  }
}
