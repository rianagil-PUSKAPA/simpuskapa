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
import { PartnerService } from '../services/partner.service'
import { VendorService } from '../services/vendor.service'
import { HttpBaseResponse } from '../types/base.response.dto'
import { Partner, PartnerCode, PartnerCreatedCodeResponse, PartnerListResponse } from '../types/partner.dto'
import { v4 as uuidv4 } from 'uuid'

import { VendorDataResponse, VendorDto, VendorListResponse } from '../types/vendor.dto'

@Controller()
export class PartnerController {
  private readonly logger = new Logger(PartnerController.name)
  private static readonly apiTags = 'paartner'
  private lang = Language.use(new BaseLanguageDefinition())

  constructor(private readonly partnerService: PartnerService) {}

  @Post('/v1/partners')
  @ApiTags(PartnerController.apiTags)
  @ApiOperation({ summary: 'create new partner' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiCreatedResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async createPartner(@Body() partner: Partner, @Req() request: Request, @Res() response: Response): Promise<Response> {
    const code = await this.partnerService.createPartner(partner.name)
    console.log('========>', code)

    return response
      .status(HttpStatus.CREATED)
      .send(
        new PartnerCreatedCodeResponse(this.lang.lang(LD.RESPONSE_CREATED, ['Partner']), { code: code } as PartnerCode),
      )
  }

  @Get('/v1/partners')
  @ApiTags(PartnerController.apiTags)
  @ApiOperation({ summary: 'get partner' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: PartnerListResponse })
  @ApiBearerAuth()
  async getPartnerList(@Req() request: Request, @Res() response: Response): Promise<Response> {
    const result = await this.partnerService.getPartnersAll()

    return response
      .status(HttpStatus.OK)
      .send(new PartnerListResponse(this.lang.lang(LD.RESPONSE_OK, ['Partner']), result))
  }
}
