import { BaseLanguageDefinition, LD } from '@/i18n/base.language.definition'
import { Language } from '@/i18n/language'
import {
  ProgramPerdiemSettings,
  ProgramPerdiemSettingsResponse,
  ProgramReceivedFundList,
  ProgramReceivedFundRequest,
  ProgramReviseBudgetDocs,
} from '@/server/types/program.dto'
import { Body, Controller, Delete, Get, HttpStatus, Logger, Param, Post, Put, Query, Req, Res } from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger'
import { Request, Response } from 'express'
import { ProgramService } from '../services/program.service'
import { HttpBaseResponse } from '../types/base.response.dto'
import {
  Budget,
  BudgetProgramListResponse,
  ProgramCreateRequest,
  ProgramDetail,
  ProgramDetailResponse,
  ProgramListData,
  ProgramListResponse,
} from '../types/program.dto'

class ProgramStatus {
  @ApiProperty({ enum: ['success', 'pending', 'rejected', 'cancelled'] })
  status: string
  @ApiProperty()
  notes?: string
}

@Controller()
export class ProgramController {
  private readonly logger = new Logger(ProgramController.name)
  private static readonly apiTags = 'program'
  private lang = Language.use(new BaseLanguageDefinition())

  constructor(private readonly programService: ProgramService) {}

  @Put('/v1/programs/:id/perdiem-settings')
  @ApiTags(ProgramController.apiTags)
  @ApiParam({ name: 'id', type: 'string', description: 'program id' })
  @ApiOperation({ summary: 'set perdiem settings' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async setProgramPerdiemSettings(
    @Param('id') id: string,
    @Body() perdiem: ProgramPerdiemSettings,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const userClaims = JSON.parse(request.headers.authorization)

    await this.programService.setProgramPerdiemSettings(id, perdiem, userClaims['id'])

    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_OK, ['Perdiem']), null))
  }

  @Get('/v1/programs/:id/perdiem-settings')
  @ApiTags(ProgramController.apiTags)
  @ApiParam({ name: 'id', type: 'string', description: 'program id' })
  @ApiOperation({ summary: 'get perdiem settings' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async getProgramPerdiemSettings(
    @Param('id') id: string,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const result = await this.programService.getProgramPerdiemSettings(id)

    return response
      .status(HttpStatus.OK)
      .send(new ProgramPerdiemSettingsResponse(this.lang.lang(LD.RESPONSE_OK, ['Perdiem']), result))
  }

  @Get('/v1/programs/:id/budgets')
  @ApiTags(ProgramController.apiTags)
  @ApiParam({ name: 'id', type: 'string', description: 'program id' })
  @ApiOperation({ summary: "get program's budget" })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: BudgetProgramListResponse })
  @ApiExtraModels(BudgetProgramListResponse)
  @ApiBearerAuth()
  async getProgramBudget(
    @Param('id') id: string,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const result = await this.programService.getBudgets(id)

    return response
      .status(HttpStatus.OK)
      .send(new BudgetProgramListResponse(this.lang.lang(LD.RESPONSE_OK, ['Budget']), result))
  }

  @Put('/v1/programs/:id/budgets/revise')
  @ApiTags(ProgramController.apiTags)
  @ApiParam({ name: 'id', type: 'string', description: 'program id' })
  @ApiOperation({ summary: "revise program's budget" })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: HttpBaseResponse })
  @ApiExtraModels(Budget)
  @ApiBearerAuth()
  async reviseBudget(
    @Param('id') id: string,
    @Body() revise: ProgramReviseBudgetDocs,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const userClaims = JSON.parse(request.headers.authorization)

    await this.programService.setReviseBudget(
      id,
      revise.revise_doc_path,
      userClaims['id'],
      revise.revise_note,
      revise.revise_amount,
    )

    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_OK, ['Budget']), ''))
  }

  @Put('/v1/programs/:id/budgets/submit')
  @ApiTags(ProgramController.apiTags)
  @ApiParam({ name: 'id', type: 'string', description: 'program id' })
  @ApiOperation({ summary: "submit program's budget at the first time" })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: HttpBaseResponse })
  @ApiExtraModels(Budget)
  @ApiBearerAuth()
  async submitBudget(
    @Param('id') id: string,
    @Body() revise: ProgramReviseBudgetDocs,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const userClaims = JSON.parse(request.headers.authorization)

    await this.programService.setBudgetSubmitted(id, userClaims['id'])

    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_OK, ['Budget']), ''))
  }

  @Put('/v1/programs/:id/budgets')
  @ApiTags(ProgramController.apiTags)
  @ApiParam({ name: 'id', type: 'string', description: 'program id' })
  @ApiOperation({ summary: "set program's budget" })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: HttpBaseResponse })
  @ApiExtraModels(Budget)
  @ApiBearerAuth()
  async setProgramBudget(
    @Param('id') id: string,
    @Body() budgets: Budget,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const userClaims = JSON.parse(request.headers.authorization)

    await this.programService.setBudget(id, budgets, userClaims['id'])

    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_OK, ['Budget']), ''))
  }

  @Put('/v1/programs/:id/approval')
  @ApiTags(ProgramController.apiTags)
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOperation({ summary: 'approval program' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiCreatedResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async approvalProgram(
    @Param('id') id: string,
    @Body() status: ProgramStatus,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const userClaims = JSON.parse(request.headers.authorization)
    await this.programService.approveProgram(id, status.status, userClaims['id'], status.notes)

    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_CREATED, ['Program']), id))
  }

  @Post('/v1/programs')
  @ApiTags(ProgramController.apiTags)
  @ApiOperation({ summary: 'create new program' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiCreatedResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async createProgram(
    @Body() program: ProgramCreateRequest,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const userClaims = JSON.parse(request.headers.authorization)

    const id = await this.programService.createProgram(
      program.currency,
      program.contract,
      program.timeline,
      program.partner_code,
      program.program_name,
      program.grant_manager,
      program.program_manager,
      program.program_officer,
      program.budget_controller,
      program.estimated_budget,
      program.program_description,
      program.code,
      program.form_state,
      program.form_progress,
      program.program_ownership_type,
      userClaims['id'],
    )

    return response
      .status(HttpStatus.CREATED)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_CREATED, ['Program']), id))
  }

  @Delete('/v1/programs/:id')
  @ApiTags(ProgramController.apiTags)
  @ApiOperation({ summary: 'delete program' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiCreatedResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async deleteProgram(@Param('id') id: string, @Req() request: Request, @Res() response: Response): Promise<Response> {
    const userClaims = JSON.parse(request.headers.authorization)
    await this.programService.deleteProgram(id)

    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_CREATED, ['Program']), id))
  }

  @Put('/v1/programs/:id')
  @ApiTags(ProgramController.apiTags)
  @ApiOperation({ summary: 'update program' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiCreatedResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async updateProgram(
    @Body() program: ProgramCreateRequest,
    @Param('id') id: string,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const userClaims = JSON.parse(request.headers.authorization)
    await this.programService.updateProgram(
      program.currency,
      program.contract,
      program.timeline,
      program.partner_code,
      program.program_name,
      program.grant_manager,
      program.program_manager,
      program.program_officer,
      program.budget_controller,
      program.estimated_budget,
      program.program_description,
      program.code,
      program.finance_progress,
      program.form_state,
      program.form_progress,
      id,
      userClaims['id'],
    )

    return response
      .status(HttpStatus.CREATED)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_CREATED, ['Program']), id))
  }

  @Get('/v1/programs')
  @ApiTags(ProgramController.apiTags)
  @ApiOperation({ summary: 'get program list' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'per_page', required: false, example: 10 })
  @ApiQuery({
    name: 'approval_status',
    required: false,
    example: 'approved',
    enum: ['approved', 'rejected', 'pending', 'revision', ''],
  })
  @ApiQuery({
    name: 'program_ownership_type',
    required: true,
    example: 'INTERNAL',
    enum: ['INTERNAL', 'PROGRAM'],
  })
  @ApiQuery({
    name: 'partner',
    required: false,
    example: 'Pet',
  })
  @ApiQuery({
    name: 'program_manager',
    description: 'program manager id',
    required: false,
    example: '00dab1b5-5514-4b1c-81cb-7abd5a55918c',
  })
  @ApiQuery({
    name: 'sort',
    description: 'sorting result',
    required: false,
    example: 'program_name|asc',
    enum: [
      'program_name|asc',
      'program_name|desc',
      'partner|asc',
      'partner|desc',
      'program_manager|asc',
      'program_manager|desc',
    ],
  })
  @ApiQuery({
    name: 'program_name',
    description: 'search program name',
    required: false,
    example: 'hello',
  })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: ProgramListResponse })
  @ApiExtraModels(ProgramListData)
  @ApiBearerAuth()
  async getProgramList(
    @Query('page') page = 1,
    @Query('per_page') perPage = 10,
    @Query('approval_status') approval_status = '',
    @Query('program_ownership_type') program_ownership_type = 'PROGRAM',
    @Query('partner') partner = '',
    @Query('program_manager') program_manager = '',
    @Query('sort') sort = '',
    @Query('program_name') program_name = '',
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    console.log('ownership', program_ownership_type)
    const result = await this.programService.getProgramsList(
      page,
      perPage,
      approval_status,
      program_ownership_type,
      partner,
      program_manager,
      sort,
      program_name,
    )

    const total = await this.programService.getProgramsListTotal(
      approval_status,
      program_ownership_type,
      partner,
      program_manager,
      sort,
      program_name,
    )

    return response
      .status(HttpStatus.OK)
      .send(new ProgramListResponse(this.lang.lang(LD.RESPONSE_OK, ['Program']), result, total))
  }

  @Get('/v1/programs-drafted')
  @ApiTags(ProgramController.apiTags)
  @ApiOperation({ summary: 'get program drafted detail by user' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: ProgramDetailResponse })
  @ApiExtraModels(ProgramDetail)
  @ApiBearerAuth()
  async getProgramDetailDraftedByUserLogedIn(@Req() request: Request, @Res() response: Response): Promise<Response> {
    const userClaims = JSON.parse(request.headers.authorization)

    const program = await this.programService.getProgramDetailById('x', userClaims['id'])

    return response
      .status(HttpStatus.OK)
      .send(new ProgramDetailResponse(this.lang.lang(LD.RESPONSE_OK, ['Program']), program))
  }

  @Get('/v1/programs/:id')
  @ApiTags(ProgramController.apiTags)
  @ApiOperation({ summary: 'get program detail' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: ProgramDetailResponse })
  @ApiExtraModels(ProgramDetail)
  @ApiBearerAuth()
  async getProgramDetail(
    @Param('id') id: string,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const program = await this.programService.getProgramDetailById(id)

    return response
      .status(HttpStatus.OK)
      .send(new ProgramDetailResponse(this.lang.lang(LD.RESPONSE_OK, ['Program']), program))
  }

  @Get('/v1/progam-budget/remaining-budget-by-activity-id')
  @ApiTags(ProgramController.apiTags)
  @ApiOperation({ summary: 'get remaining budget by activity id' })
  @ApiQuery({ name: 'activity_id', type: 'string' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: HttpBaseResponse })
  @ApiExtraModels(ProgramDetail)
  @ApiBearerAuth()
  async getRemainingBudgetByActivityId(
    @Query('activity_id') activity_id: string,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const total = await this.programService.calculateRemainingBudgetBtActivityId(activity_id)

    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse<number>(this.lang.lang(LD.RESPONSE_OK, ['Program']), total))
  }

  @Get('/v1/progam-budget/pending-requested-buget')
  @ApiTags(ProgramController.apiTags)
  @ApiOperation({
    summary: 'get pending requested budget from payment request',
  })
  @ApiQuery({ name: 'budget_id', type: 'string' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: HttpBaseResponse })
  @ApiExtraModels(ProgramDetail)
  @ApiBearerAuth()
  async getPendingRequestedBudget(
    @Query('budget_id') budget_id: string,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const total = await this.programService.calculatePendingRequestedByBudgetId(budget_id)

    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse<number>(this.lang.lang(LD.RESPONSE_OK, ['Program']), total))
  }

  @Get('/v1/progam-budget/paid-buget')
  @ApiTags(ProgramController.apiTags)
  @ApiOperation({
    summary: 'get paid budget',
  })
  @ApiQuery({ name: 'budget_id', type: 'string' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: HttpBaseResponse })
  @ApiExtraModels(ProgramDetail)
  @ApiBearerAuth()
  async getPaidBudget(
    @Query('budget_id') budget_id: string,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const total = await this.programService.calculatePaidByBudgetId(budget_id)

    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse<number>(this.lang.lang(LD.RESPONSE_OK, ['Program']), total))
  }

  @Post('/v1/programs/:id/budgets-fund-received/submit')
  @ApiTags(ProgramController.apiTags)
  @ApiParam({ name: 'id', type: 'string', description: 'program id' })
  @ApiOperation({ summary: 'Submit fund received' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: HttpBaseResponse })
  @ApiExtraModels(ProgramReceivedFundRequest)
  @ApiBearerAuth()
  async submitFundReceived(
    @Param('id') id: string,
    @Body() fund: ProgramReceivedFundRequest,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const userClaims = JSON.parse(request.headers.authorization)

    await this.programService.addFundReceviced(
      id,
      userClaims['id'],
      fund.amount,
      fund.notes,
      fund.documents,
      fund.source,
    )

    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_OK, ['Received Fund']), ''))
  }

  @Get('/v1/programs/:id/budgets-fund-received')
  @ApiTags(ProgramController.apiTags)
  @ApiParam({ name: 'id', type: 'string', description: 'program id' })
  @ApiOperation({ summary: 'Get fund received' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async getSubmittedFundReceived(
    @Param('id') id: string,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const userClaims = JSON.parse(request.headers.authorization)

    const funds = await this.programService.getFundReceviced(id)

    return response
      .status(HttpStatus.OK)
      .send(new ProgramReceivedFundList(this.lang.lang(LD.RESPONSE_OK, ['Received Fund']), funds))
  }
}
