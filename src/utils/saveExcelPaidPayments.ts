import { PRDetailResponse } from '@sdk'
import dayjs from 'dayjs'
import Excel from 'exceljs'
import saveAs from 'file-saver'

const saveExcelPaymentList = async (detailPayments: PRDetailResponse[], status: 'paid' | 'pending') => {
  const wb = new Excel.Workbook()
  const ws = wb.addWorksheet('Payment Request List')
  const isPaid = status === 'paid'

  const widths = [20, 25, 25, 18, 50, 20, 25]
  const headers = [
    'Bank Name',
    'Bank Account Name',
    'Bank Account Number',
    'Amount',
    'Description',
    'Deadline',
    'Requested by',
  ]
  if (isPaid) {
    widths.push(20, 25, 20)
    headers.push('Paid At', 'Paid By', 'Created At')
  }

  widths.forEach((width, index) => {
    ws.getColumn(index + 1).width = width
  })
  ws.getColumn('E').alignment = { wrapText: true }

  // Style header row
  const headerRow = ws.addRow(headers)
  headerRow.font = { bold: true }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9D9D9' },
  }

  // Add data rows
  detailPayments.forEach((payment) => {
    const data = payment.data
    const deadline = isPaid ? data.payment_date : data.expected_payment_date || data.payment_date
    const row = [
      data.requested_by?.['bank_name'] || '-',
      data.requested_by?.['bank_acc_name'] || '-',
      String(data.requested_by?.['bank_acc_number'] || '-'),
      data.transfer_amount || 0,
      data.description || '-',
      deadline ? dayjs(deadline).format('DD/MM/YYYY') : '-',
      data.requested_by?.name || '-',
    ]
    if (isPaid) {
      row.push(
        data.paid_at ? dayjs(data.paid_at).format('DD/MM/YYYY HH:mm') : '-',
        data.processed_by?.name || '-',
        data.requested_at ? dayjs(data.requested_at as unknown as string).format('DD/MM/YYYY HH:mm') : '-',
      )
    }
    ws.addRow(row)
  })

  // Format amount column as currency
  ws.getColumn('D').numFmt = '#,##0'

  // Add borders to all cells
  ws.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      }
    })
  })

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().split('T')[0]
  const fileName = isPaid ? `Payment_Request_List_${timestamp}.xlsx` : 'payment request list (process).xlsx'

  // Save file
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  saveAs(blob, fileName)
}

export const saveExcelPaidPayments = (detailPayments: PRDetailResponse[]) =>
  saveExcelPaymentList(detailPayments, 'paid')

export const saveExcelPendingPayments = (detailPayments: PRDetailResponse[]) =>
  saveExcelPaymentList(detailPayments, 'pending')
