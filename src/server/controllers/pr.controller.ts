import { BaseLanguageDefinition, LD } from '@/i18n/base.language.definition'
import { Language } from '@/i18n/language'
import { JwtLib } from '@/shared/jwt.lib'
import { PRTypes } from '@/shared/pr.type'
import * as ExcelJS from 'exceljs'
import { v4 as uuidv4 } from 'uuid'

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
} from '@nestjs/common'
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
import { PRServiceService } from '../services/pr.service'
import { RfServiceService } from '../services/rf.service'
import { HttpBaseResponse } from '../types/base.response.dto'
import {
  APSApprovalStatusRequest,
  CalculationTaxResult,
  CreatePaymentReportApiRequest,
  CreatePaymentRequestApiRequest,
  FinanceProcessBankAccountResponse,
  PaymentReport,
  PaymentRequestDetail,
  PRApprovalStatusRequest,
  PRCalculationTaxResultResponse,
  PRCheckingRejectPayload,
  PRDetailResponse,
  PRListResponse,
  PRReportDetailResponse,
  SetFinanceCheckerProcessBulkApiRequest,
  UpdateAPSforAPRApiRequest,
} from '../types/pr.dto'
import { EmployeeProfile } from '../types/program.dto'
import { RFListResponse } from '../types/rf.dto'
import { uploadObject } from '../commands/s3uploader'
import { BucketsEnum, ObjectStorageHelpers } from '@/shared/file.system'

@Controller()
export class PRController {
  private readonly logger = new Logger(PRController.name)
  private static readonly apiTags = 'payment-request'
  private lang = Language.use(new BaseLanguageDefinition())

  constructor(private readonly prService: PRServiceService) {}

  @Delete('/v1/payment-requests/:id')
  @ApiTags(PRController.apiTags)
  @ApiOperation({ summary: 'create pr' })
  @ApiParam({ name: 'id', type: 'string', description: 'pr id' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiCreatedResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async deletePaymentRequest(
    @Param('id') id: string,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const userClaims = JSON.parse(request.headers.authorization)

    const createdId = await this.prService.deletePR(id)

    return response
      .status(HttpStatus.CREATED)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_CREATED, ['Payment Request']), createdId))
  }

  @Post('/v1/payment-requests')
  @ApiTags(PRController.apiTags)
  @ApiOperation({ summary: 'create pr' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiCreatedResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async createPaymentRequest(
    @Body() pr: CreatePaymentRequestApiRequest,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    // submited by is using employeeid
    const userClaims = JSON.parse(request.headers.authorization)

    const id = await this.prService.createPaymentRequest(pr, userClaims['id'])

    return response
      .status(HttpStatus.CREATED)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_CREATED, ['Payment Request']), id))
  }

  @Get('/v1/payment-requests-transfer-list')
  @ApiTags(PRController.apiTags)
  @ApiOperation({ summary: 'transfer pr' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiCreatedResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async getTransferList(@Req() request: Request, @Res() response: Response): Promise<Response> {
    // submited by is using employeeid
    const userClaims = JSON.parse(request.headers.authorization)

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Transfer List')
    const transfers = await this.prService.getListOfBankAccountToTransferByEmployeeId(userClaims['id'])
    worksheet.columns = [
      { header: 'Bank Name', key: 'bank_name', width: 50 },
      { header: 'Account Number', key: 'rekening', width: 50 },
      { header: 'Account Holder', key: 'account_holder', width: 50 },
      { header: 'Amount', key: 'amount', width: 50 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Project Name', key: 'project_name', width: 50 },
      { header: 'Deadline', key: 'deadline', width: 50 },
    ]
    for (const tf of transfers) {
      worksheet.addRow({
        pr_number: tf.pr_number,
        bank_name: tf.transfer_to.bank_name,
        rekening: tf.transfer_to.bank_acc_number,
        account_holder: tf.transfer_to.bank_acc_name,
        amount: tf.amount,
        description: tf.pr_description,
        project_name: tf.project_name,
        deadline: tf.transfer_deadline,
      })
    }

    const name = uuidv4()
    await workbook.xlsx.writeFile(`/tmp/${name}.xlsx`)

    await uploadObject(`/tmp/${name}.xlsx`, `${name}.xlsx`, BucketsEnum.pr_attachment)
    const url = await ObjectStorageHelpers.getDownloadPresignedUrl(BucketsEnum.pr_attachment, `${name}.xlsx`, 1800)

    return response
      .status(HttpStatus.CREATED)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_CREATED, ['Payment Request']), url))
  }

  @Post('/v1/payment-requests/set-ready-to-process')
  @ApiTags(PRController.apiTags)
  @ApiOperation({ summary: 'set-ready-to-process' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiCreatedResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async setFinanceReadyToProcessBulk(
    @Body() pr: SetFinanceCheckerProcessBulkApiRequest,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    // submited by is using employeeid
    const userClaims = JSON.parse(request.headers.authorization)

    const id = await this.prService.bulkMarkPrProcess(pr.payment_requests)

    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_CREATED, ['Payment Request']), null))
  }

  @Put('/v1/payment-requests/:id')
  @ApiTags(PRController.apiTags)
  @ApiOperation({ summary: 'update pr' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiCreatedResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async updatePaymentRequest(
    @Param('id') prId: string,
    @Body() pr: CreatePaymentRequestApiRequest,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    // submited by is using employeeid
    const userClaims = JSON.parse(request.headers.authorization)

    const id = await this.prService.updatePaymentRequest(pr, prId, userClaims['id'])

    return response
      .status(HttpStatus.CREATED)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_CREATED, ['Payment Request']), id))
  }

  @Get('/v1/payment-requests/:id')
  @ApiTags(PRController.apiTags)
  @ApiOperation({ summary: 'get pr detail' })
  @ApiParam({ name: 'id', type: 'string', description: 'pr id' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: PRDetailResponse })
  @ApiExtraModels(PaymentRequestDetail)
  @ApiExtraModels(EmployeeProfile)
  @ApiBearerAuth()
  async getDetailPaymentRequest(
    @Param('id') id: string,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    // submited by is using employeeid
    const userClaims = JSON.parse(request.headers.authorization)

    const detail = await this.prService.getPrDetail(id, userClaims['id'])

    return response.status(HttpStatus.OK).send(new PRDetailResponse(this.lang.lang(LD.RESPONSE_OK, ['PR']), detail))
  }

  @Get('/v1/payment-requests')
  @ApiTags(PRController.apiTags)
  @ApiOperation({ summary: 'get pr lists' })
  @ApiQuery({ name: 'program_id', required: false })
  @ApiQuery({ name: 'rf_id', required: false })
  @ApiQuery({ name: 'finance_checker_rejected_by', required: false })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['ready_to_process', 'ready_to_check', 'pending', 'paid'],
  })
  @ApiQuery({ name: 'vendor_id', required: false })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: [PRTypes.PR, PRTypes.APR, PRTypes.TE, PRTypes.APS, PRTypes.APF],
  })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: PRListResponse })
  @ApiBearerAuth()
  async getListPaymentRequest(
    @Req() request: Request,
    @Res() response: Response,
    @Query('program_id') program_id?: string,
    @Query('rf_id') rf_id?: string,
    @Query('type') pr_type?: string,
    @Query('vendor_id') vendor_id?: string,
    @Query('finance_checker_rejected_by') finance_checker_rejected_by?: string,
    @Query('status') status: string = '',
  ): Promise<Response> {
    // submited by is using employeeid
    const userClaims = JSON.parse(request.headers.authorization)

    const result = await this.prService.getPrLists(
      program_id,
      rf_id,
      pr_type,
      finance_checker_rejected_by,
      vendor_id,
      status,
    )

    return response.status(HttpStatus.OK).send(new PRListResponse(this.lang.lang(LD.RESPONSE_OK, ['PR List']), result))
  }

  @Patch('/v1/payment-requests/:id/approval')
  @ApiTags(PRController.apiTags)
  @ApiOperation({ summary: 'approval' })
  @ApiParam({ name: 'id', type: 'string', description: 'pr id' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: RFListResponse })
  @ApiBearerAuth()
  async approvalPaymentRequest(
    @Param('id') id: string,
    @Body() prApproval: PRApprovalStatusRequest,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    // submited by is using employeeid
    const userClaims = JSON.parse(request.headers.authorization)

    await this.prService.prApproval(
      prApproval.approved_by,
      prApproval.status,
      userClaims['id'],
      id,
      prApproval.rejection_note,
    )

    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_OK, ['PR Approval']), ''))
  }

  @Patch('/v1/payment-requests/:id/mark-processed')
  @ApiTags(PRController.apiTags)
  @ApiOperation({ summary: 'mark processed' })
  @ApiParam({ name: 'id', type: 'string', description: 'pr id' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: RFListResponse })
  @ApiBearerAuth()
  async markProcessedPaymentRequest(
    @Param('id') id: string,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    // submited by is using employeeid
    const userClaims = JSON.parse(request.headers.authorization)

    await this.prService.prMarkProcessed(id, userClaims['id'])

    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_OK, ['PR Approval']), ''))
  }

  @Patch('/v1/payment-requests/:id/mark-on-checking')
  @ApiTags(PRController.apiTags)
  @ApiOperation({ summary: 'mark checking process on progress checking' })
  @ApiParam({ name: 'id', type: 'string', description: 'pr id' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async markPaymentRequestOnChecking(
    @Param('id') id: string,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    // submited by is using employeeid
    const userClaims = JSON.parse(request.headers.authorization)

    await this.prService.prMarkFinanceOnChecking(id, userClaims['id'])

    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_OK, ['PR Checking']), ''))
  }

  @Patch('/v1/payment-requests/:id/unmark-on-checking')
  @ApiTags(PRController.apiTags)
  @ApiOperation({ summary: 'unmark checking process on progress checking' })
  @ApiParam({ name: 'id', type: 'string', description: 'pr id' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async unMarkPaymentRequestOnChecking(
    @Param('id') id: string,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    // submited by is using employeeid
    const userClaims = JSON.parse(request.headers.authorization)

    await this.prService.prUnMarkFinanceOnChecking(id, userClaims['id'])

    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_OK, ['PR Checking']), ''))
  }

  @Patch('/v1/payment-requests/:id/mark-checking-passed')
  @ApiTags(PRController.apiTags)
  @ApiOperation({ summary: 'mark checking process on progress as checked' })
  @ApiParam({ name: 'id', type: 'string', description: 'pr id' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async markPaymentRequestCheckingPassed(
    @Param('id') id: string,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    // submited by is using employeeid
    const userClaims = JSON.parse(request.headers.authorization)

    await this.prService.prMarkFinanceCheckedFinish(id, userClaims['id'])

    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_OK, ['PR checking']), ''))
  }

  @Patch('/v1/payment-requests/:id/mark-checking-revision')
  @ApiTags(PRController.apiTags)
  @ApiOperation({ summary: 'mark checking process on progress as revision' })
  @ApiParam({ name: 'id', type: 'string', description: 'pr id' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async markPaymentRequestCheckingNeedRevision(
    @Param('id') id: string,
    @Body() rejectNote: PRCheckingRejectPayload,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    // submited by is using employeeid
    const userClaims = JSON.parse(request.headers.authorization)

    await this.prService.prMarkFinanceNeedRevision(id, userClaims['id'], rejectNote.note)

    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_OK, ['PR Checking']), ''))
  }

  @Patch('/v1/payment-requests/:id/unmark-processed')
  @ApiTags(PRController.apiTags)
  @ApiOperation({ summary: 'mark processed' })
  @ApiParam({ name: 'id', type: 'string', description: 'pr id' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: RFListResponse })
  @ApiBearerAuth()
  async unMarkProcessedPaymentRequest(
    @Param('id') id: string,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    // submited by is using employeeid
    const userClaims = JSON.parse(request.headers.authorization)

    await this.prService.prMarkUnProcessed(id, userClaims['id'])

    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_OK, ['PR Approval']), ''))
  }

  @Patch('/v1/payment-requests/:id/mark-paid')
  @ApiTags(PRController.apiTags)
  @ApiOperation({ summary: 'mark paid' })
  @ApiParam({ name: 'id', type: 'string', description: 'pr id' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: RFListResponse })
  @ApiBearerAuth()
  async markAsPaid(@Param('id') id: string, @Req() request: Request, @Res() response: Response): Promise<Response> {
    // submited by is using employeeid
    const userClaims = JSON.parse(request.headers.authorization)

    await this.prService.prMarkPaid(id, userClaims['id'])

    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_OK, ['PR PAID']), ''))
  }

  @Get('/v1/payment-requests/:id/tax')
  @ApiTags(PRController.apiTags)
  @ApiOperation({ summary: 'mark paid' })
  @ApiParam({ name: 'id', type: 'string', description: 'pr id' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: PRCalculationTaxResultResponse })
  @ApiExtraModels(CalculationTaxResult)
  @ApiBearerAuth()
  async getTax(@Param('id') id: string, @Req() request: Request, @Res() response: Response): Promise<Response> {
    // submited by is using employeeid
    const userClaims = JSON.parse(request.headers.authorization)

    const tax = (await this.prService.getPrTax(id)) as CalculationTaxResult

    return response
      .status(HttpStatus.OK)
      .send(new PRCalculationTaxResultResponse(this.lang.lang(LD.RESPONSE_OK, ['PR TAX']), tax))
  }

  @Post('/v1/payment-report/:id')
  @ApiTags(PRController.apiTags)
  @ApiOperation({ summary: 'create payment report' })
  @ApiParam({ name: 'id', type: 'string', description: 'pr id' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiCreatedResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async createPaymentReport(
    @Param('id') id: string,
    @Body() pr: CreatePaymentReportApiRequest,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    // submited by is using employeeid
    const userClaims = JSON.parse(request.headers.authorization)

    await this.prService.createPaymentReport(id, pr.payment_date, pr.report_documents, userClaims['id'])

    return response
      .status(HttpStatus.CREATED)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_CREATED, ['Payment Report']), ''))
  }

  @Get('/v1/payment-report/:id')
  @ApiTags(PRController.apiTags)
  @ApiOperation({ summary: 'create payment report' })
  @ApiParam({ name: 'id', type: 'string', description: 'pr id' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: PRReportDetailResponse })
  @ApiExtraModels(PaymentReport)
  @ApiBearerAuth()
  async getPaymentReport(
    @Param('id') id: string,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    // submited by is using employeeid
    const userClaims = JSON.parse(request.headers.authorization)

    const res = await this.prService.getPaymentReport(id)

    return response
      .status(HttpStatus.CREATED)
      .send(new PRReportDetailResponse(this.lang.lang(LD.RESPONSE_CREATED, ['Payment Report']), res))
  }

  @Post('/v1/pr/:id/tax-recalculation')
  @ApiTags(PRController.apiTags)
  @ApiOperation({ summary: 'recalculate tax' })
  @ApiParam({ name: 'id', type: 'string', description: 'pr id' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async recalculatePRTax(
    @Param('id') id: string,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const tax = await this.prService.recalculateTax(id)

    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_OK, ['TAX']), tax))
  }
}
