import { PaymentRequestSimple, PRDetailResponse } from '@sdk'
import Excel from 'exceljs'
import saveAs from 'file-saver'

export const saveExcelTaxPayments = async (
  detailPayments: PRDetailResponse[],
  filteredPaidPayments: PaymentRequestSimple[],
) => {
  const wb = new Excel.Workbook()
  const ws = wb.addWorksheet('Tax Payment List')

  // Set column widths
  const colA = ws.getColumn('A')
  const colB = ws.getColumn('B')
  const colC = ws.getColumn('C')
  const colD = ws.getColumn('D')
  const colE = ws.getColumn('E')
  const colF = ws.getColumn('F')
  const colG = ws.getColumn('G')
  const colH = ws.getColumn('H')

  colA.width = 40 // Program Name
  colB.width = 40 // Project Name
  colC.width = 40 // Activity Name
  colD.width = 40 // Budget Name
  colE.width = 50 // Description
  colF.width = 25 // Total Payment Request
  colG.width = 20 // Tax
  colH.width = 20 // Transfer Amount

  // Enable text wrapping for columns B, C, D, and E
  colB.alignment = { wrapText: true }
  colC.alignment = { wrapText: true }
  colD.alignment = { wrapText: true }
  colE.alignment = { wrapText: true }

  // Add header row
  const headerRow = ws.addRow([
    'Project Name',
    'Activity Name',
    'Sub Activity Name',
    'Budget Name',
    'Description',
    'Total Payment Request',
    'Tax',
    'Transfer Amount',
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

    // Find the corresponding paid payment to get transfer_amount_value
    const paidPayment = filteredPaidPayments.find((p) => p.id === data.id)

    // Iterate through projects, activities, and budgets to extract tax information
    data.projects?.forEach((project) => {
      project.activities?.forEach((activity) => {
        activity.budgets?.forEach((budget) => {
          ws.addRow([
            paidPayment.program_name || '-',
            project.description || '-',
            activity.description || '-',
            budget.description || '-',
            data.description || '-',
            budget.qty * budget.pkg_qty * budget.unit_cost_value,
            budget.tax_amount || 0,
            budget.qty * budget.pkg_qty * budget.unit_cost_value - (budget.tax_amount || 0),
          ])
        })
      })
    })
  })

  // Format amount columns as currency
  ws.getColumn('F').numFmt = '#,##0'
  ws.getColumn('G').numFmt = '#,##0'
  ws.getColumn('H').numFmt = '#,##0'

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
  const fileName = `Tax_Payment_List_${timestamp}.xlsx`

  // Save file
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  saveAs(blob, fileName)
}
