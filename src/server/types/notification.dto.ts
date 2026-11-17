import { ApiProperty } from '@nestjs/swagger'

import { HttpBaseResponse } from '@server/types/base.response.dto'
import { PaymentRequestSimple } from './pr.dto'
import { ProgramListData } from './program.dto'
import { RequisitionFormSimple, RFListResponse } from './rf.dto'
import { TimeOffRow } from './time.off.request.dto'

export class NotifType {
  public static readonly APPROVAL_TIMEOFF = 'APPROVAL_TIMEOFF'
  public static readonly APPROVAL_PROGRAM_BUDGET = 'APPROVAL_PROGRAM_BUDGET'
  public static readonly APPROVAL_PROGRAM_BUDGET_REVISION = 'APPROVAL_PROGRAM_BUDGET_REVISION'
  public static readonly ACTION_PROGRAM_BUDGET_REVISION = 'ACTION_PROGRAM_BUDGET_REVISION'
  public static readonly APPROVAL_REQUISITION_FORM = 'APPROVAL_REQUISITION_FORM'
  public static readonly APPROVAL_PAYMENT_REQUEST = 'APPROVAL_PAYMENT_REQUEST'
  public static readonly ACTION_REQUISITION_FORM = 'ACTION_REQUISITION_FORM'
  public static readonly ACTION_PAYMENT_REQUEST_PAY = 'ACTION_PAYMENT_REQUEST_PAY'
  public static readonly ACTION_PAYMENT_REQUEST_CHECK = 'ACTION_PAYMENT_REQUEST_CHECK'
  public static readonly TRACKING_PAYMENT_REQUEST = 'TRACKING_PAYMENT_REQUEST'
  public static readonly ACTION_PROGRAM_BUDGET = 'ACTION_PROGRAM_BUDGET'

  public static readonly TRACKING_REQUESTITION_FORM = 'TRACKING_REQUESTITION_FORM'
}

export class NotificationRef {
  @ApiProperty()
  id?: string
  @ApiProperty()
  ref_type?: string
  @ApiProperty()
  ref_id?: string
  @ApiProperty()
  employee_id?: string
  @ApiProperty({
    oneOf: [
      { type: 'ProgramListData' },
      { type: 'RequisitionFormSimple' },
      { type: 'PaymentRequestSimple' },
      { type: 'TimeOffRow' },
    ],
  })
  notif_detail?: ProgramListData | RequisitionFormSimple | PaymentRequestSimple | TimeOffRow
}

export class Notificaton {
  @ApiProperty()
  tracking_rf_total?: number
  @ApiProperty()
  tracking_pr_total?: number

  @ApiProperty()
  need_action_rf_total?: number
  @ApiProperty()
  need_action_pr_check_total?: number
  @ApiProperty()
  need_action_pr_pay_total?: number
  @ApiProperty()
  need_approval_timeoff_total?: number
  @ApiProperty()
  need_approval_program_budget_total?: number
  @ApiProperty()
  need_approval_rf_total?: number
  @ApiProperty()
  need_approval_pr_total?: number

  @ApiProperty({ type: [NotificationRef] })
  need_action_rf?: NotificationRef[]
  @ApiProperty({ type: [NotificationRef] })
  need_action_pr_check?: NotificationRef[]
  @ApiProperty({ type: [NotificationRef] })
  need_action_pr_pay?: NotificationRef[]

  @ApiProperty({ type: [NotificationRef] })
  need_approval_timeoff?: NotificationRef[]
  @ApiProperty({ type: [NotificationRef] })
  need_approval_program_budget?: NotificationRef[]
  @ApiProperty({ type: [NotificationRef] })
  need_approval_rf?: NotificationRef[]
  @ApiProperty({ type: [NotificationRef] })
  need_approval_pr?: NotificationRef[]

  @ApiProperty({ type: [NotificationRef] })
  tracking_pr?: NotificationRef[]
  @ApiProperty({ type: [NotificationRef] })
  tracking_rf?: NotificationRef[]
  @ApiProperty({ type: [NotificationRef] })
  need_action_program_budget?: NotificationRef[]
  @ApiProperty()
  need_action_program_budget_total?: number
}

export class NotificationsResponse extends HttpBaseResponse<Notificaton> {
  @ApiProperty({ type: Notificaton })
  data: Notificaton
}
