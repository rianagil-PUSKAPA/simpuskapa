import { ApiProperty } from '@nestjs/swagger'

import { HttpBaseResponse } from '@server/types/base.response.dto'
import { create } from 'domain'

export class VendorPackage {
  @ApiProperty()
  id?: string
  @ApiProperty()
  name?: string
  @ApiProperty()
  currency?: string
  @ApiProperty()
  price?: number
  @ApiProperty()
  unit?: string
}

export class VendorCategoryVendorType {
  @ApiProperty()
  id?: string
  @ApiProperty()
  name?: string
}

export class VendorCategoryInformation {
  @ApiProperty()
  id?: string
  @ApiProperty()
  name?: string
  @ApiProperty()
  action_by?: string
  @ApiProperty({ type: VendorCategoryVendorType })
  vendor_type?: VendorCategoryVendorType
}

export class VendorCategoryCorelation {
  @ApiProperty()
  id?: string
  @ApiProperty()
  vendor_id?: string
  @ApiProperty()
  vendor_category_info_id?: string
  @ApiProperty({ type: VendorCategoryInformation })
  vendor_category_info?: VendorCategoryInformation
}

export class VendorCategoryInformationListResponse extends HttpBaseResponse<VendorCategoryInformation[]> {
  @ApiProperty({ type: [VendorCategoryInformation] })
  data: VendorCategoryInformation[]
}

export class VendorType {
  @ApiProperty()
  id?: string
  @ApiProperty()
  name?: string
  @ApiProperty({ type: [VendorCategoryInformation] })
  vendor_category_information?: VendorCategoryInformation[]
}

export class VendorTypesListResponse extends HttpBaseResponse<VendorType[]> {
  @ApiProperty({ type: [VendorType] })
  data: VendorType[]
}

export class VendorTypesResponse extends HttpBaseResponse<VendorType> {
  @ApiProperty({ type: VendorType })
  data: VendorType
}

export class VendorPayment {
  @ApiProperty()
  bank_name?: string
  @ApiProperty()
  bank_branch?: string
  @ApiProperty()
  bank_acc_number?: string
  @ApiProperty()
  bank_acc_name?: string
  @ApiProperty()
  swift_code?: string
}

export class VendorDto {
  @ApiProperty()
  id?: string
  @ApiProperty()
  vendor_type?: string
  @ApiProperty({ type: [VendorCategoryCorelation] })
  vendor_categories?: VendorCategoryCorelation[]
  @ApiProperty()
  vendor_information?: Map<string, string>
  @ApiProperty({ type: [VendorPackage] })
  vendor_packages?: VendorPackage[]
  @ApiProperty()
  form_state?: string
  @ApiProperty()
  form_progress?: number
  @ApiProperty()
  vendor_payment?: VendorPayment
}

export class VendorRequestDto {
  @ApiProperty()
  id?: string
  @ApiProperty()
  vendor_type?: string
  @ApiProperty()
  vendor_categories?: string[]
  @ApiProperty()
  vendor_information?: Map<string, string>
  @ApiProperty({ type: [VendorPackage] })
  vendor_packages?: VendorPackage[]
  @ApiProperty()
  form_state?: string
  @ApiProperty()
  form_progress?: number
  @ApiProperty()
  vendor_payment?: VendorPayment
}

export class VendorListResponse extends HttpBaseResponse<VendorDto[]> {
  @ApiProperty({ type: [VendorDto] })
  data: VendorDto[]
}

export class VendorDataResponse extends HttpBaseResponse<VendorDto> {
  @ApiProperty({ type: VendorDto })
  data: VendorDto
}
