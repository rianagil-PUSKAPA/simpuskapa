import { PRDetailResponse } from '@sdk'
import dayjs from 'dayjs'
import Excel from 'exceljs'
import saveAs from 'file-saver'

export const saveExcelPaidPayments = async (detailPayments: PRDetailResponse[]) => {
  const wb = new Excel.Workbook()
  const ws = wb.addWorksheet('Payment Request List')

  // Set column widths
  const colA = ws.getColumn('A')
  const colB = ws.getColumn('B')
  const colC = ws.getColumn('C')
  const colD = ws.getColumn('D')
  const colE = ws.getColumn('E')
  const colF = ws.getColumn('F')
  const colG = ws.getColumn('G')
  const colH = ws.getColumn('H')
  const colI = ws.getColumn('I')
  const colJ = ws.getColumn('J')

  colA.width = 20 // Bank Name
  colB.width = 25 // Bank Account Name
  colC.width = 25 // Bank Account Number
  colD.width = 18 // Amount
  colE.width = 50 // Description
  colF.width = 20 // Deadline
  colG.width = 25 // Requested by
  colH.width = 20 // Paid At
  colI.width = 25 // Paid By
  colJ.width = 20 // Requested At

  // Enable text wrapping for column E
  colE.alignment = { wrapText: true }

  // Add header row
  const headerRow = ws.addRow([
    'Bank Name',
    'Bank Account Name',
    'Bank Account Number',
    'Amount',
    'Description',
    'Deadline',
    'Requested by',
    'Paid At',
    'Paid By',
    'Created At',
  ])

  // Style header row
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

    ws.addRow([
      data.requested_by['bank_name'] || '-',
      data.requested_by['bank_acc_name'] || '-',
      data.requested_by['bank_acc_number'] || '-',
      data.transfer_amount || 0,
      data.description || '-',
      data.payment_date ? dayjs(data.payment_date).format('DD/MM/YYYY') : '-',
      data.requested_by?.name || '-',
      data.paid_at ? dayjs(data.paid_at).format('DD/MM/YYYY HH:mm') : '-',
      data.processed_by?.name || '-',
      data.requested_at ? dayjs(data.requested_at as unknown as string).format('DD/MM/YYYY HH:mm') : '-',
    ])
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
  const fileName = `Payment_Request_List_${timestamp}.xlsx`

  // Save file
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  saveAs(blob, fileName)
}
