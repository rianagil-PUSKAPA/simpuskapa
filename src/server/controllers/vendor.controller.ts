import { BaseLanguageDefinition, LD } from '@/i18n/base.language.definition'
import { Language } from '@/i18n/language'
import { JwtLib } from '@/shared/jwt.lib'
import {
  Body,
  Controller,
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
  Delete,
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
import { VendorService } from '../services/vendor.service'
import { HttpBaseResponse } from '../types/base.response.dto'

import {
  VendorCategoryInformationListResponse,
  VendorDataResponse,
  VendorDto,
  VendorListResponse,
  VendorPayment,
  VendorRequestDto,
  VendorTypesListResponse,
  VendorTypesResponse,
} from '../types/vendor.dto'

@Controller()
export class VendorController {
  private readonly logger = new Logger(VendorController.name)
  private static readonly apiTags = 'vendor-external'
  private lang = Language.use(new BaseLanguageDefinition())

  constructor(private readonly vendorService: VendorService) {}

  @Post('/v1/vendors')
  @ApiTags(VendorController.apiTags)
  @ApiOperation({ summary: 'create new vendor' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiCreatedResponse({ type: HttpBaseResponse })
  @ApiExtraModels(VendorDto)
  @ApiBearerAuth()
  async createVendor(
    @Body() vendor: VendorRequestDto,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const userClaims = JSON.parse(request.headers.authorization)

    console.log(vendor.vendor_type)
    const id = await this.vendorService.createVendor(
      vendor.vendor_type,
      vendor.vendor_information,
      vendor.vendor_categories,
      vendor.vendor_packages,
      vendor.form_state,
      vendor.form_progress,
      vendor.vendor_payment,
      userClaims['id'],
    )

    return response
      .status(HttpStatus.CREATED)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_CREATED, ['Vendor']), id))
  }

  @Get('/v1/vendors')
  @ApiTags(VendorController.apiTags)
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'per_page', required: false, example: 10 })
  @ApiQuery({ name: 'vedor_type', required: false, example: 'apa' })
  @ApiQuery({ name: 'order', required: false, example: 'vendor_type|desc' })
  @ApiQuery({
    name: 'category_id',
    required: false,
    example: 'filter by category ids separated by comas = 1,2,3,4',
  })
  @ApiOperation({ summary: 'get vendors' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: VendorListResponse })
  @ApiBearerAuth()
  async getVendorList(
    @Req() request: Request,
    @Res() response: Response,
    @Query('page') page = 1,
    @Query('per_page') perPage = 10,
    @Query('order') order = '',
    @Query('vedor_type') vedor_type = '',
    @Query('category_id') category_id = '',
  ): Promise<Response> {
    const result = await this.vendorService.getVendors(page, perPage, order, vedor_type, category_id)
    return response
      .status(HttpStatus.OK)
      .send(new VendorListResponse(this.lang.lang(LD.RESPONSE_OK, ['Employee']), result))
  }

  @Get('/v1/vendors/categories')
  @ApiTags(VendorController.apiTags)
  @ApiOperation({ summary: 'get vendors categories' })
  @ApiQuery({ name: 'vendor_type_id', required: true, example: 'uuid' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: VendorCategoryInformationListResponse })
  @ApiBearerAuth()
  async getVendorCategories(
    @Query('vendor_type_id') vendor_type_id = '',
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const result = await this.vendorService.getVendorCategories(vendor_type_id)

    return response
      .status(HttpStatus.OK)
      .send(new VendorCategoryInformationListResponse(this.lang.lang(LD.RESPONSE_OK, ['vendor categories']), result))
  }

  @Get('/v1/vendors/types')
  @ApiTags(VendorController.apiTags)
  @ApiOperation({ summary: 'get vendors types' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: VendorTypesListResponse })
  @ApiBearerAuth()
  async getVendorTypes(@Req() request: Request, @Res() response: Response): Promise<Response> {
    const result = await this.vendorService.getVendorTypes()

    return response
      .status(HttpStatus.OK)
      .send(new VendorTypesListResponse(this.lang.lang(LD.RESPONSE_OK, ['type']), result))
  }

  @Get('/v1/vendors/types/:id')
  @ApiTags(VendorController.apiTags)
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOperation({ summary: 'get vendors types' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: VendorTypesListResponse })
  @ApiBearerAuth()
  async getVendorTypeById(
    @Req() request: Request,
    @Res() response: Response,
    @Param('id') id: string,
  ): Promise<Response> {
    const result = await this.vendorService.getVendorTypeById(id)

    return response
      .status(HttpStatus.OK)
      .send(new VendorTypesResponse(this.lang.lang(LD.RESPONSE_OK, ['type']), result))
  }

  @Get('/v1/vendors/:id')
  @ApiTags(VendorController.apiTags)
  @ApiOperation({ summary: 'get vendor detail' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: VendorDataResponse })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBearerAuth()
  async getVendorDetail(
    @Param('id') id: string,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const res = await this.vendorService.getVendorById(id)

    return response.status(HttpStatus.OK).send(new VendorDataResponse(this.lang.lang(LD.RESPONSE_OK, ['Vendor']), res))
  }

  @Get('/v1/vendor-draft')
  @ApiTags(VendorController.apiTags)
  @ApiOperation({ summary: 'get vendor detail on draft' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: VendorDataResponse })
  @ApiBearerAuth()
  async getVendorDetailOnDraftByLogedInuser(@Req() request: Request, @Res() response: Response): Promise<Response> {
    const userClaims = JSON.parse(request.headers.authorization)

    const res = await this.vendorService.getVendorByCreatedById(userClaims['id'])

    return response.status(HttpStatus.OK).send(new VendorDataResponse(this.lang.lang(LD.RESPONSE_OK, ['Vendor']), res))
  }

  @Put('/v1/vendors/:id')
  @ApiTags(VendorController.apiTags)
  @ApiOperation({ summary: 'update vendor' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: HttpBaseResponse })
  @ApiExtraModels(VendorDto)
  @ApiBearerAuth()
  async updateVendor(
    @Param('id') id: string,
    @Body() vendor: VendorRequestDto,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    console.log(vendor.vendor_type)
    await this.vendorService.updateVendor(
      vendor.vendor_information,
      vendor.vendor_type,
      vendor.vendor_categories,
      vendor.vendor_packages,
      vendor.form_state,
      vendor.form_progress,
      vendor.vendor_payment,
      id,
    )

    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_OK, ['Vendor']), null))
  }

  @Get('/v1/vendors/category-attachment-fields/:id')
  @ApiTags(VendorController.apiTags)
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOperation({ summary: 'get vendor category attachment fields' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async getVendorCategoryAttachmentList(
    @Req() request: Request,
    @Res() response: Response,
    @Param('id') id: string,
  ): Promise<Response> {
    const result = await this.vendorService.getVendorCategoryAttachmentFields(id)
    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse<string[]>(this.lang.lang(LD.RESPONSE_OK, ['vendor category attachment list']), result))
  }

  @Patch('/v1/vendors/:id/vendor-payment')
  @ApiTags(VendorController.apiTags)
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOperation({ summary: 'update vendor payment' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async updateVendorPayment(
    @Param('id') id: string,

    @Body() vendorPayment: VendorPayment,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const userClaims = JSON.parse(request.headers.authorization)

    await this.vendorService.updateVendorPayment(id, vendorPayment)

    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_OK, ['Vendor']), ''))
  }

  @Delete('/v1/vendors/:id')
  @ApiTags(VendorController.apiTags)
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOperation({ summary: 'delete vendor soft' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async softDeleteVendor(
    @Param('id') id: string,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    await this.vendorService.softDeleteVendor(id)

    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_OK, ['Vendor']), ''))
  }

  @Patch('/v1/vendors/:id/about-vendor')
  @ApiTags(VendorController.apiTags)
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOperation({ summary: 'update about vendor' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async updateAboutVendor(
    @Param('id') id: string,
    @Body() aboutVendor: Map<string, string>,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const userClaims = JSON.parse(request.headers.authorization)

    await this.vendorService.updateAboutVendor(id, aboutVendor)

    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse<string>(this.lang.lang(LD.RESPONSE_OK, ['Vendor']), ''))
  }
}
