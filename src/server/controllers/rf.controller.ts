import { BaseLanguageDefinition, LD } from '@/i18n/base.language.definition'
import { Language } from '@/i18n/language'
import { Body, Controller, Delete, Get, HttpStatus, Logger, Param, Post, Put, Query, Req, Res } from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger'
import { Request, Response } from 'express'
import { RfServiceService } from '../services/rf.service'
import { HttpBaseResponse } from '../types/base.response.dto'
import {
  CreatePersonalHireRfApiRequest,
  CreateProcurementRfApiRequest,
  CreateStaffCostRfApiRequest,
  CreateTravelRfApiRequest,
  RFApprovalListResponse,
  RFApprovalStatusRequest,
  RFDetailResponse,
  RFListResponse,
} from '../types/rf.dto'

@Controller()
export class RFController {
  private readonly logger = new Logger(RFController.name)
  private static readonly apiTags = 'requisition-form'
  private lang = Language.use(new BaseLanguageDefinition())

  constructor(private readonly rfService: RfServiceService) {}

  @Post('/v1/programs/:program_id/projects/:project_id/rf/procurement')
  @ApiTags(RFController.apiTags)
  @ApiOperation({ summary: 'create rf for procurement' })
  @ApiParam({ name: 'program_id', type: 'string', description: 'program id' })
  @ApiParam({ name: 'project_id', type: 'string', description: 'project id' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiCreatedResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async createRFProcurement(
    @Param('program_id') program_id: string,
    @Param('project_id') project_id: string,
    @Body() rf: CreateProcurementRfApiRequest,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    // submited by is using employeeid
    const userClaims = JSON.parse(request.headers.authorization)

    const id = await this.rfService.createRFProcurement(rf, program_id, project_id, userClaims['id'])

    return response
      .status(HttpStatus.CREATED)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_CREATED, ['RF Procurement']), id))
  }

  @Put('/v1/programs/:program_id/projects/:project_id/rf/procurement/:rf_id')
  @ApiTags(RFController.apiTags)
  @ApiOperation({ summary: 'update rf for procurement' })
  @ApiParam({ name: 'program_id', type: 'string', description: 'program id' })
  @ApiParam({ name: 'project_id', type: 'string', description: 'project id' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async updateRFProcurement(
    @Param('program_id') program_id: string,
    @Param('project_id') project_id: string,
    @Param('rf_id') rf_id: string,
    @Body() rf: CreateProcurementRfApiRequest,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const userClaims = JSON.parse(request.headers.authorization)

    const id = await this.rfService.updateRFProcurement(rf, program_id, project_id, rf_id, userClaims['id'])

    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_UPDATED, ['RF Procurement']), id))
  }

  @Post('/v1/programs/:program_id/projects/:project_id/rf/travel')
  @ApiTags(RFController.apiTags)
  @ApiOperation({ summary: 'create rf for travel' })
  @ApiParam({ name: 'program_id', type: 'string', description: 'program id' })
  @ApiParam({ name: 'project_id', type: 'string', description: 'project id' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiCreatedResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async createRFTravel(
    @Param('program_id') program_id: string,
    @Param('project_id') project_id: string,
    @Body() rf: CreateTravelRfApiRequest,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    // submited by is using employeeid
    const userClaims = JSON.parse(request.headers.authorization)

    const id = await this.rfService.createRFTravel(rf, program_id, project_id, userClaims['id'])

    return response
      .status(HttpStatus.CREATED)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_CREATED, ['RF Travel']), id))
  }

  @Put('/v1/programs/:program_id/projects/:project_id/rf/travel/:rf_id')
  @ApiTags(RFController.apiTags)
  @ApiOperation({ summary: 'update rf for travel' })
  @ApiParam({ name: 'program_id', type: 'string', description: 'program id' })
  @ApiParam({ name: 'project_id', type: 'string', description: 'rf id' })
  @ApiParam({ name: 'rf_id', type: 'string', description: 'rf id' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async updateRFTravel(
    @Param('program_id') program_id: string,
    @Param('project_id') project_id: string,
    @Param('rf_id') rf_id: string,
    @Body() rf: CreateTravelRfApiRequest,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    // submited by is using employeeid
    const userClaims = JSON.parse(request.headers.authorization)

    const id = await this.rfService.updateRFTravel(rf, program_id, project_id, rf_id, userClaims['id'])

    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_UPDATED, ['RF Travel']), id))
  }

  @Post('/v1/programs/:program_id/projects/:project_id/rf/personal-hire')
  @ApiTags(RFController.apiTags)
  @ApiOperation({ summary: 'create rf for personal hire' })
  @ApiParam({ name: 'program_id', type: 'string', description: 'program id' })
  @ApiParam({ name: 'project_id', type: 'string', description: 'project id' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiCreatedResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async createRFTPersonalHire(
    @Param('program_id') program_id: string,
    @Param('project_id') project_id: string,
    @Body() rf: CreatePersonalHireRfApiRequest,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    // submited by is using employeeid
    const userClaims = JSON.parse(request.headers.authorization)

    const id = await this.rfService.createPersonalHire(rf, program_id, project_id, userClaims['id'])

    return response
      .status(HttpStatus.CREATED)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_CREATED, ['RF Travel']), id))
  }

  @Put('/v1/programs/:program_id/projects/:project_id/rf/personal-hire/:rf_id')
  @ApiTags(RFController.apiTags)
  @ApiOperation({ summary: 'update rf for personal hire' })
  @ApiParam({ name: 'program_id', type: 'string', description: 'program id' })
  @ApiParam({ name: 'project_id', type: 'string', description: 'project id' })
  @ApiParam({ name: 'rf_id', type: 'string', description: 'rf id' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiCreatedResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async updateRFTPersonalHire(
    @Param('program_id') program_id: string,
    @Param('project_id') project_id: string,
    @Param('rf_id') rf_id: string,
    @Body() rf: CreatePersonalHireRfApiRequest,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    // submited by is using employeeid
    const userClaims = JSON.parse(request.headers.authorization)

    const id = await this.rfService.updatePersonalHire(rf, program_id, project_id, rf_id, userClaims['id'])

    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_UPDATED, ['RF Travel']), id))
  }

  @Put('/v1/rfs/:id/action-by/ack')
  @ApiTags(RFController.apiTags)
  @ApiOperation({ summary: 'ack rf' })
  @ApiParam({ name: 'id', type: 'string', description: ' id' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiCreatedResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async ackActionBy(@Param('id') id: string, @Req() request: Request, @Res() response: Response): Promise<Response> {
    // submited by is using employeeid
    const userClaims = JSON.parse(request.headers.authorization)

    await this.rfService.ackActionBy(id)

    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_CREATED, ['RF Travel']), ''))
  }

  @Get('/v1/programs/:program_id/rfs')
  @ApiTags(RFController.apiTags)
  @ApiOperation({ summary: 'get rf lists' })
  @ApiParam({ name: 'program_id', type: 'string', description: 'program id' })
  @ApiQuery({
    name: 'action_by_employee_id',
    required: false,
    type: 'string',
    description: 'filter by action by employee id',
  })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: RFListResponse })
  @ApiBearerAuth()
  async getListRf(
    @Param('program_id') program_id: string,
    @Query('action_by_employee_id') action_by_employee_id = '',
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    // submited by is using employeeid
    const userClaims = JSON.parse(request.headers.authorization)

    const rfs = await this.rfService.getRfList(program_id, userClaims['id'], action_by_employee_id)

    return response.status(HttpStatus.OK).send(new RFListResponse(this.lang.lang(LD.RESPONSE_OK, ['RF List']), rfs))
  }

  @Get('/v1/rfs-all')
  @ApiTags(RFController.apiTags)
  @ApiOperation({ summary: 'get rf lists all' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: RFListResponse })
  @ApiBearerAuth()
  async getListRfAll(@Req() request: Request, @Res() response: Response): Promise<Response> {
    // submited by is using employeeid
    const userClaims = JSON.parse(request.headers.authorization)

    const rfs = await this.rfService.getRfListAll()

    return response.status(HttpStatus.OK).send(new RFListResponse(this.lang.lang(LD.RESPONSE_OK, ['RF List']), rfs))
  }

  @Get('/v1/programs/:program_id/projects/:project_id/rf/:rf_id')
  @ApiTags(RFController.apiTags)
  @ApiOperation({ summary: 'get rf detail' })
  @ApiParam({ name: 'program_id', type: 'string', description: 'program id' })
  @ApiParam({ name: 'project_id', type: 'string', description: 'project id' })
  @ApiParam({ name: 'rf_id', type: 'string', description: 'rf id' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: RFDetailResponse })
  @ApiBearerAuth()
  async getRfDetail(
    @Param('program_id') program_id: string,
    @Param('project_id') project_id: string,
    @Param('rf_id') rf_id: string,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    // submited by is using employeeid
    const userClaims = JSON.parse(request.headers.authorization)

    const rf = await this.rfService.getRfDetail(program_id, project_id, rf_id, userClaims['id'])

    console.log('RF DETAIL', rf)

    return response.status(HttpStatus.OK).send(new RFDetailResponse(this.lang.lang(LD.RESPONSE_OK, ['RF']), rf))
  }

  @Delete('/v1/programs/:program_id/projects/:project_id/rf/:rf_id')
  @ApiTags(RFController.apiTags)
  @ApiOperation({ summary: 'delete rf bi id and related' })
  @ApiParam({ name: 'program_id', type: 'string', description: 'program id' })
  @ApiParam({ name: 'project_id', type: 'string', description: 'project id' })
  @ApiParam({ name: 'rf_id', type: 'string', description: 'rf id' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: RFDetailResponse })
  @ApiBearerAuth()
  async deleteRFById(
    @Param('program_id') program_id: string,
    @Param('project_id') project_id: string,
    @Param('rf_id') rf_id: string,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const userClaims = JSON.parse(request.headers.authorization)

    const rf = await this.rfService.deleteById(program_id, project_id, rf_id, userClaims['id'])

    console.log('RF DETAIL', rf)

    return response.status(HttpStatus.OK).send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_OK, ['RF']), rf))
  }

  @Put('/v1/programs/:program_id/projects/:project_id/rf/:rf_id/approval')
  @ApiTags(RFController.apiTags)
  @ApiOperation({ summary: 'rf approval' })
  @ApiParam({ name: 'program_id', type: 'string', description: 'program id' })
  @ApiParam({ name: 'project_id', type: 'string', description: 'project id' })
  @ApiParam({ name: 'rf_id', type: 'string', description: 'rf id' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiCreatedResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async approveRF(
    @Param('program_id') program_id: string,
    @Param('rf_id') rf_id: string,
    @Param('project_id') project_id: string,
    @Body() approval: RFApprovalStatusRequest,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    // submited by is using employeeid
    const userClaims = JSON.parse(request.headers.authorization)

    await this.rfService.approveRfRequest(
      approval.approved_by,
      approval.status,
      program_id,
      project_id,
      rf_id,
      userClaims['id'],
      approval.rejection_note,
    )

    return response
      .status(HttpStatus.CREATED)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_OK, ['RF']), ''))
  }

  @Get('/v1/programs/:program_id/projects/:project_id/rf/approvals')
  @ApiTags(RFController.apiTags)
  @ApiOperation({ summary: 'get rf apprival lists' })
  @ApiParam({ name: 'program_id', type: 'string', description: 'program id' })
  @ApiParam({ name: 'project_id', type: 'string', description: 'project id' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiCreatedResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async getRfApprovalList(
    @Param('program_id') program_id: string,
    @Param('project_id') project_id: string,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    // submited by is using employeeid
    const userClaims = JSON.parse(request.headers.authorization)

    const rf = await this.rfService.getRfApprovalList(program_id, project_id, userClaims['id'])

    return response
      .status(HttpStatus.OK)
      .send(new RFApprovalListResponse(this.lang.lang(LD.RESPONSE_OK, ['RF APPROVALS']), rf))
  }

  @Get('/v1/rf-total/:rf_id')
  @ApiTags(RFController.apiTags)
  @ApiOperation({ summary: 'rf total calculation' })
  @ApiParam({ name: 'rf_id', type: 'string', description: 'rf id' })
  @ApiQuery({
    name: 'category_id',
    type: 'string',
    description: 'vendor category id',
  })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiCreatedResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async calculateTotalRF(
    @Param('rf_id') rf_id: string,
    @Query('category_id') category_id = '',
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    // submited by is using employeeid
    const userClaims = JSON.parse(request.headers.authorization)

    const total = await this.rfService.calculateTotalRF(rf_id, category_id)

    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse<number>(this.lang.lang(LD.RESPONSE_OK, ['RF']), total))
  }

  @Get('/v1/rf-check/has-rf')
  @ApiTags(RFController.apiTags)
  @ApiOperation({ summary: 'check logedin user has rf in program' })
  @ApiQuery({
    name: 'program_id',
    type: 'string',
    description: 'program id',
  })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiCreatedResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async checkLogedinUserHasRfInProgram(
    @Query('program_id') program_id = '',
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    // submited by is using employeeid
    const userClaims = JSON.parse(request.headers.authorization)

    const total = await this.rfService.checkIfLogedInUserHasRfInProgram(program_id, userClaims['id'])

    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse<boolean>(this.lang.lang(LD.RESPONSE_OK, ['RF']), total))
  }

  @Get('/v1/rf-calculation/remaining-budget-rf')
  @ApiTags(RFController.apiTags)
  @ApiOperation({
    summary: 'get remaining budget in rf',
  })
  @ApiQuery({
    name: 'budget_id',
    type: 'string',
    description: 'budget id',
  })
  @ApiQuery({
    name: 'rf_id',
    type: 'string',
    description: 'rf id',
  })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiCreatedResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async calculateRfRemainingBudget(
    @Query('budget_id') budget_id = '',
    @Query('rf_id') rf_id = '',
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    // submited by is using employeeid
    const userClaims = JSON.parse(request.headers.authorization)

    const total = await this.rfService.calculateRFRemainingBudget(budget_id, rf_id)

    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse<number>(this.lang.lang(LD.RESPONSE_OK, ['RF']), total))
  }

  @Get('/v1/pr-calculation/remaining-budget-rf')
  @ApiTags(RFController.apiTags)
  @ApiOperation({
    summary: 'get remaining budget in rf',
  })
  @ApiQuery({
    name: 'budget_id',
    type: 'string',
    description: 'budget id',
  })
  @ApiQuery({
    name: 'rf_id',
    type: 'string',
    description: 'rf id',
  })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiCreatedResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async calculateRfForPrRemainingBudget(
    @Query('budget_id') budget_id = '',
    @Query('rf_id') rf_id = '',
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    // submited by is using employeeid
    const userClaims = JSON.parse(request.headers.authorization)

    const total = await this.rfService.getTotalPaymentRequestFromRFIdByBudgetId(rf_id, budget_id)

    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse<number>(this.lang.lang(LD.RESPONSE_OK, ['RF']), total))
  }

  @Post('/v1/programs/:program_id/projects/:project_id/rf/staff-cost')
  @ApiTags(RFController.apiTags)
  @ApiOperation({ summary: 'create rf for staffcost' })
  @ApiParam({ name: 'program_id', type: 'string', description: 'program id' })
  @ApiParam({ name: 'project_id', type: 'string', description: 'project id' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiCreatedResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async createRFStaffCost(
    @Param('program_id') program_id: string,
    @Param('project_id') project_id: string,
    @Body() rf: CreateStaffCostRfApiRequest,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    // submited by is using employeeid
    const userClaims = JSON.parse(request.headers.authorization)

    const id = await this.rfService.createRFStaffCost(rf, program_id, project_id, userClaims['id'])

    return response
      .status(HttpStatus.CREATED)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_CREATED, ['RF staffcost']), id))
  }

  @Put('/v1/programs/:program_id/projects/:project_id/rf/staff-cost/:rf_id')
  @ApiTags(RFController.apiTags)
  @ApiOperation({ summary: 'update rf for staffcost' })
  @ApiParam({ name: 'program_id', type: 'string', description: 'program id' })
  @ApiParam({ name: 'project_id', type: 'string', description: 'project id' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async updateRFStaffCost(
    @Param('program_id') program_id: string,
    @Param('project_id') project_id: string,
    @Param('rf_id') rf_id: string,
    @Body() rf: CreateStaffCostRfApiRequest,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const userClaims = JSON.parse(request.headers.authorization)

    const id = await this.rfService.updateRFStaffCost(rf, program_id, project_id, rf_id, userClaims['id'])

    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_UPDATED, ['RF Staff Cost']), id))
  }

  @Put('/v1/programs/:program_id/projects/:project_id/rf/close-rf/:rf_id')
  @ApiTags(RFController.apiTags)
  @ApiOperation({ summary: 'close RF' })
  @ApiParam({ name: 'program_id', type: 'string', description: 'program id' })
  @ApiParam({ name: 'project_id', type: 'string', description: 'project id' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async closeRequisitionForm(
    @Param('program_id') program_id: string,
    @Param('project_id') project_id: string,
    @Param('rf_id') rf_id: string,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const userClaims = JSON.parse(request.headers.authorization)

    const id = await this.rfService.closeRequisitionForm(rf_id, userClaims['id'])

    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_UPDATED, ['RF Closed']), id))
  }
}
