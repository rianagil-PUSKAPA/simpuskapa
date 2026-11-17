import { finance_logs } from '@prisma/client'

export enum LogType {
  program_budget_approved,
  program_created,
  program_updated,
  rf_created_pc,
  rf_created_tr,
  rf_created_ph,
  rf_approved_by_program_manager,
  rf_approved_by_budget_controller,
  pr_created,
  pr_report_created,
  pr_marked_processed,
  pr_marked_unprocessed,
  pr_marked_paid,
  aps_marked_processed,
  aps_marked_unprocessed,
  aps_approved,
  pr_finance_on_checking,
  pr_finance_checking_finished,
  pr_finance_checking_revision,
  program_id,
  rf_id,
  pr_id,
  user_id,
}

export class LogMessageTemplate {
  // replacer $label
  public static readonly finance: Map<LogType, string> = new Map<LogType, string>([
    [
      LogType.program_created,
      'Program <a href="/dashboard/project/$program_id">$program_name</a> created by <a href="/dashboard/internal/employee/$employee_id">$employee_name</a>',
    ],
  ])
}

function renderLogMessage(logType: LogType, logData: finance_logs): string {
  let message = ''
  switch (logType) {
    case LogType.program_created: {
      let msg = LogMessageTemplate.finance.get(logType)
      msg = msg.replaceAll('$program_id', logData.program_id)
      msg = msg.replaceAll('$program_name', logData.program_id)

      break
    }
    default: {
      message = ''
      break
    }
  }

  return message
}
