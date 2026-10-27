import { ProjectType, RequisitionFormDetailImprovement } from '@/layout/procurement/RequisitionDetail'
import { getPaymentRequestList, handleFinanceStatusBadgeText } from '@/layout/program/PaymentRequestList'
import { PRApprovalStatus, PRFinanceCheckingStatus, PRTypes } from '@/shared/pr.type'
import { RequisitionFormEnum } from '@/shared/rf.type'
import { PaymentRequestListType } from '@/types/payment-request'
import { getDetailPayment, vendorExternalApi } from '@/utils/apiRequestHelper'
import {
  calculateAdvancePaymentPerActivity,
  calculatePureTotalBudget,
  calculateTotalAdvancePaymentRequest,
  calculateTotalBudget,
  calculateUnitCostPerActivity,
  capitalizeFirstLetter,
  getOriginalUrlFile,
  requisitionType,
  translateAttachmentKey,
} from '@/utils/globalHelper'
import { Employee, ProgramDetail, ProgramPerdiemSettings, VendorDto } from '@sdk'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'
import Excel from 'exceljs'
import saveAs from 'file-saver'
import JSZip from 'jszip'
import { Dispatch, SetStateAction } from 'react'

dayjs.extend(relativeTime)
dayjs.extend(utc)

const saveExcelRf = async (
  setLoadingButtonStatement: Dispatch<
    SetStateAction<{
      'payment-request': boolean
      'advance-payment-request': boolean
      'advance-perdiem-fee': boolean
      'travel-expense': boolean
      'advance-payment-statement': boolean
      exportExcel: boolean
      approve: boolean
      reject: boolean
      deleteRf: boolean
      closeRF: boolean
    }>
  >,
  programDetail: ProgramDetail,
  requisitionFormDetail: RequisitionFormDetailImprovement,
  rfType:
    | RequisitionFormEnum.PROCUREMENT
    | RequisitionFormEnum.PERSONAL_HIRE
    | RequisitionFormEnum.TRAVEL
    | RequisitionFormEnum.STAFF_COST,
  vendorDetail: VendorDto | null,
  supervisorData: Employee,
  isInternal: boolean,
  projectBudgetsModified: ProjectType[],
  userLoggedinInformation: {
    id: string
    email: string
    acl: any[]
    avatar: string
    employee_name: string
    employee_id: string
    role: any
  },
  isTravelInformationStatement: {
    ACTION_BY_OPERATIONAL: boolean
    ACTION_BY_TRAVELLER: boolean
  },
  programId: string,
  rfId: string,
  perdiemSettingData: ProgramPerdiemSettings,
  travellerPerdiemTax: number,
) => {
  const zip = new JSZip()
  setLoadingButtonStatement((prev) => ({ ...prev, exportExcel: true }))
  let attachmentFiles = []

  const rfWB = new Excel.Workbook()
  const prWB = new Excel.Workbook()
  const aprWB = new Excel.Workbook()
  const apsWB = new Excel.Workbook()
  const apfWB = new Excel.Workbook()
  const teWB = new Excel.Workbook()

  const workSheetNameRF = 'RF Detail'
  const workSheetNamePR = 'Payment Request'
  const workSheetNameAPR = 'Advance Payment Request'
  const workSheetNameAPS = 'Advance Payment Statement'
  const workSheetNameAPF = 'Advance Perdiem Fee'
  const workSheetNameTE = 'Travel Expenses'
  const workSheetNameTI = 'Travel Information'
  const workSheetNamePHI = 'Personnel Hire Information'
  const IDRCurrencyFormat = '"Rp "#,##0;[Red]-"Rp "#,##0'
  // ===============
  const workSheetNamePRDetail = 'PR Detail'
  const workSheetNameAPRDetail = 'APR Detail'
  const workSheetNameAPSDetail = 'APS Detail'
  const workSheetNameAPFDetail = 'APF Detail'
  const workSheetNameTEDetail = 'TE Detail'
  const workSheetNameAdditionalAttactment = 'Additional Attachments'
  const workSheetNameTravelExpensesAttachment = 'Travel Expenses Attachments'
  const workSheetNameVendorInformation = 'Vendor Information'
  const workSheetNameBankInformation = 'Bank Information'

  try {
    /* ----------------------------------------------------------------------------------------
    REQUISITION DETAIL : START
    ---------------------------------------------------------------------------------------- */
    const fileNameRFDetail = `${requisitionFormDetail?.number.replace(/\//g, '_').toUpperCase()}`

    // RF DETAIL WORKSHEET
    const rfDetailWS = rfWB.addWorksheet(workSheetNameRF)

    // ======================== 3-4 ========================

    rfDetailWS.getCell('A3').value = 'Project'
    rfDetailWS.getCell('A4').value = programDetail?.program_name

    rfDetailWS.getCell('D3').value = 'Partner'
    rfDetailWS.getCell('D4').value = programDetail?.partner?.name

    rfDetailWS.getCell('G3').value = 'Activity'
    rfDetailWS.getCell(
      'G4',
    ).value = `(${requisitionFormDetail?.projects[0].code}) ${requisitionFormDetail?.projects[0].description}`

    rfDetailWS.getRow(3).font = {
      size: 12,
      color: { argb: '#667085' },
    }
    rfDetailWS.getRow(4).font = {
      bold: true,
      size: 14,
      color: { argb: '#101828' },
    }

    // ======================== 7-8 ========================

    rfDetailWS.getCell('A7').value = 'Type of Requisition Form'
    rfDetailWS.getCell('A8').value = requisitionType(rfType)
    rfDetailWS.getCell('A8').alignment = {
      vertical: 'middle',
      horizontal: 'left',
    }

    rfDetailWS.getCell('D7').value = 'Request Date'
    rfDetailWS.getCell('D8').value = dayjs(requisitionFormDetail?.requested_at as unknown as string).format(
      'dddd, DD MMM YYYY',
    )
    rfDetailWS.getCell('D8').alignment = {
      vertical: 'middle',
      horizontal: 'left',
    }

    rfDetailWS.getCell('G7').value = 'Total Request'
    rfDetailWS.getCell('G8').value = calculateTotalBudget(requisitionFormDetail)
    rfDetailWS.getCell('G8').numFmt = IDRCurrencyFormat
    rfDetailWS.mergeCells(`G8:H8`)
    rfDetailWS.getCell('G8').alignment = {
      vertical: 'middle',
      horizontal: 'left',
    }

    rfDetailWS.getRow(7).font = {
      size: 12,
      color: { argb: '#667085' },
    }
    rfDetailWS.getRow(8).font = {
      bold: true,
      size: 14,
      color: { argb: '#101828' },
    }

    rfDetailWS.getCell('G8').font = {
      size: 20,
      bold: true,
      color: { argb: '#101828' },
    }

    // ======================== 10-11 ========================

    rfDetailWS.getCell('A10').value = 'Request Number'
    rfDetailWS.getCell('A11').value = requisitionFormDetail?.number.toUpperCase()
    rfDetailWS.mergeCells(`A11:B11`)
    rfDetailWS.getCell('A11').alignment = {
      vertical: 'middle',
      horizontal: 'left',
      wrapText: true,
    }

    rfDetailWS.getCell('D10').value = 'Deadline'
    rfDetailWS.getCell('D11').value = dayjs(requisitionFormDetail?.deadline as unknown as string).format(
      'dddd, DD MMM YYYY',
    )
    rfDetailWS.mergeCells(`D11:E11`)
    rfDetailWS.getCell('D11').alignment = {
      vertical: 'middle',
      horizontal: 'left',
      wrapText: true,
    }

    rfDetailWS.getCell('G10').value = 'Activity Name'
    rfDetailWS.getCell('G11').value = requisitionFormDetail?.about_request
    rfDetailWS.mergeCells(`G11:K11`)
    rfDetailWS.getCell('G11').alignment = {
      vertical: 'middle',
      horizontal: 'left',
      wrapText: true,
    }

    rfDetailWS.getRow(10).font = {
      size: 12,
      color: { argb: '#667085' },
    }
    rfDetailWS.getRow(11).font = {
      bold: true,
      size: 14,
      color: { argb: '#101828' },
    }

    if (rfType === RequisitionFormEnum.TRAVEL) {
      // ======================== 14-15 ========================

      rfDetailWS.getCell('A14').value = 'Traveller'
      rfDetailWS.getCell('A15').value = requisitionFormDetail?.rf_attributes?.who_traveling.name

      rfDetailWS.getCell('D14').value = 'Penyelenggara Acara'
      rfDetailWS.getCell('D15').value = requisitionFormDetail?.rf_attributes?.additional_data.travel_organizer

      rfDetailWS.getCell('G14').value = 'Travel Information'
      rfDetailWS.getCell('G15').value = 'See worksheet: Travel Information'

      rfDetailWS.getRow(14).font = {
        size: 12,
        color: { argb: '#667085' },
      }
      rfDetailWS.getRow(15).font = {
        bold: true,
        size: 14,
        color: { argb: '#101828' },
      }

      // Travel Information Offcanvas
      const travelInformation = rfWB.addWorksheet(workSheetNameTI)
      travelInformation.getCell('A1').value = 'Travel Information'
      travelInformation.getCell('A2').value = requisitionFormDetail?.number.toUpperCase()

      // Boarding
      travelInformation.getCell('A4').value = 'ATTACHMENT'
      travelInformation.mergeCells('A4:B4')

      travelInformation.getCell('A5').value = 'Invitation Documents'
      travelInformation.getCell('B5').value = requisitionFormDetail?.rf_attributes?.additional_data.invitation_path
        ? requisitionFormDetail?.rf_attributes?.additional_data.invitation_path[0].split('/')[1]
        : '-'
      const invitationDocFileUrl = await getOriginalUrlFile(
        requisitionFormDetail?.rf_attributes?.additional_data.invitation_path[0],
      )
      attachmentFiles.push({
        name: requisitionFormDetail?.rf_attributes?.additional_data.invitation_path[0].split('/')[1],
        url: invitationDocFileUrl,
      })
      travelInformation.getCell('A5').alignment = {
        horizontal: 'left',
        vertical: 'middle',
      }
      travelInformation.getCell('B5').alignment = {
        wrapText: true,
      }

      travelInformation.getCell('A6').value = 'ToR'
      travelInformation.getCell('B6').value = requisitionFormDetail?.rf_attributes?.additional_data.tor_path
        ? requisitionFormDetail?.rf_attributes?.additional_data.tor_path[0].split('/')[1]
        : '-'
      const torDocFileUrl = await getOriginalUrlFile(requisitionFormDetail?.rf_attributes?.additional_data.tor_path[0])
      attachmentFiles.push({
        name: requisitionFormDetail?.rf_attributes?.additional_data.tor_path[0].split('/')[1],
        url: torDocFileUrl,
      })
      travelInformation.getCell('A6').alignment = {
        horizontal: 'left',
        vertical: 'middle',
      }
      travelInformation.getCell('B6').alignment = {
        wrapText: true,
      }

      travelInformation.getCell('A7').value = 'Assigment Letter'
      travelInformation.getCell('B7').value = requisitionFormDetail?.rf_attributes?.additional_data
        .assignment_letter_path
        ? requisitionFormDetail?.rf_attributes?.additional_data.assignment_letter_path[0].split('/')[1]
        : '-'
      const assignmentLetterUrl = await getOriginalUrlFile(
        requisitionFormDetail?.rf_attributes?.additional_data.assignment_letter_path[0],
      )
      attachmentFiles.push({
        name: requisitionFormDetail?.rf_attributes?.additional_data.assignment_letter_path[0].split('/')[1],
        url: assignmentLetterUrl,
      })
      travelInformation.getCell('A7').alignment = {
        horizontal: 'left',
        vertical: 'middle',
      }
      travelInformation.getCell('B7').alignment = {
        wrapText: true,
      }

      travelInformation.getCell('A8').value = 'NOTES'
      travelInformation.mergeCells('A8:B8')

      travelInformation.getCell('A9').value = 'Notes (Optional)'
      travelInformation.getCell('B9').value = requisitionFormDetail?.rf_attributes?.additional_data.notes || '-'
      travelInformation.getCell('A9').alignment = {
        horizontal: 'left',
        vertical: 'middle',
      }
      travelInformation.getCell('B9').alignment = {
        wrapText: true,
      }

      // Style airfare detail worksheet
      travelInformation.getRow(1).font = {
        bold: true,
        size: 16,
      }
      travelInformation.getRow(2).font = {
        size: 14,
        color: { argb: '#101828' },
      }
      travelInformation.getCell(`A4`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '#fce5cd' },
      }
      travelInformation.getCell(`A4`).alignment = {
        vertical: 'middle',
        horizontal: 'center',
      }
      travelInformation.getRow(4).height = 22

      travelInformation.getCell(`A8`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '#fce5cd' },
      }
      travelInformation.getCell(`A8`).alignment = {
        vertical: 'middle',
        horizontal: 'center',
      }
      travelInformation.getRow(8).height = 22

      travelInformation.getColumn('A').width = 25
      travelInformation.getColumn('B').width = 90
    }

    if (rfType === RequisitionFormEnum.PERSONAL_HIRE) {
      // ======================== 14-15 ========================

      rfDetailWS.getCell('A14').value = 'Consultant'
      rfDetailWS.getCell('A15').value = vendorDetail?.vendor_information['name']

      rfDetailWS.getCell('D14').value = 'Type of Hire'
      rfDetailWS.getCell('D15').value = requisitionFormDetail?.rf_attributes.type_hire

      rfDetailWS.getCell('G14').value = 'Primary Division'
      rfDetailWS.getCell('G15').value = requisitionFormDetail?.rf_attributes.primary_division

      rfDetailWS.getCell('J14').value = 'Documents'
      rfDetailWS.getCell('J15').value = 'See Worksheet: Personnel Hire Information'

      rfDetailWS.getRow(14).font = {
        size: 12,
        color: { argb: '#667085' },
      }
      rfDetailWS.getRow(15).font = {
        bold: true,
        size: 14,
        color: { argb: '#101828' },
      }

      // Personnel Hire Offcanvas - Documents
      const personnelHireInformation = rfWB.addWorksheet(workSheetNamePHI)
      personnelHireInformation.getCell('A1').value = workSheetNamePHI
      personnelHireInformation.getCell('A2').value = requisitionFormDetail?.number.toUpperCase()

      // Boarding
      personnelHireInformation.getCell('A4').value = 'NOTES'
      personnelHireInformation.mergeCells('A4:B4')

      personnelHireInformation.getCell('A5').value = 'Notes (Optional)'
      personnelHireInformation.getCell('B5').value = requisitionFormDetail?.rf_attributes.notes || '-'
      personnelHireInformation.getCell('A5').alignment = {
        horizontal: 'left',
        vertical: 'middle',
      }
      personnelHireInformation.getCell('B5').alignment = {
        wrapText: true,
      }

      personnelHireInformation.getCell('A7').value = 'ATTACHMENT'
      personnelHireInformation.mergeCells('A7:B7')

      personnelHireInformation.getCell('A8').value = 'Background Documents'
      personnelHireInformation.getCell('B8').value = requisitionFormDetail?.rf_attributes?.background_docs
        ? requisitionFormDetail?.rf_attributes?.background_docs[0].split('/')[1]
        : '-'
      const backgroundDocFileUrl = await getOriginalUrlFile(requisitionFormDetail?.rf_attributes?.background_docs[0])
      attachmentFiles.push({
        name: requisitionFormDetail?.rf_attributes?.background_docs[0].split('/')[1],
        url: backgroundDocFileUrl,
      })

      personnelHireInformation.getCell('A8').alignment = {
        horizontal: 'left',
        vertical: 'middle',
      }
      personnelHireInformation.getCell('B8').alignment = {
        wrapText: true,
      }

      personnelHireInformation.getCell('A9').value = 'Hire Process Documents'
      personnelHireInformation.getCell('B9').value = requisitionFormDetail?.rf_attributes?.hire_process_docs
        ? requisitionFormDetail?.rf_attributes?.hire_process_docs[0].split('/')[1]
        : '-'
      const hireProcessDocFileUrl = await getOriginalUrlFile(requisitionFormDetail?.rf_attributes?.hire_process_docs[0])
      attachmentFiles.push({
        name: requisitionFormDetail?.rf_attributes?.hire_process_docs[0].split('/')[1],
        url: hireProcessDocFileUrl,
      })
      personnelHireInformation.getCell('A9').alignment = {
        horizontal: 'left',
        vertical: 'middle',
      }
      personnelHireInformation.getCell('B9').alignment = {
        wrapText: true,
      }

      personnelHireInformation.getCell('A10').value = 'Principal of Offer Page Documents'
      personnelHireInformation.getCell('B10').value = requisitionFormDetail?.rf_attributes?.offer_page_docs
        ? requisitionFormDetail?.rf_attributes?.offer_page_docs[0].split('/')[1]
        : '-'
      const offerDocFileUrl = await getOriginalUrlFile(requisitionFormDetail?.rf_attributes?.offer_page_docs[0])
      attachmentFiles.push({
        name: requisitionFormDetail?.rf_attributes?.offer_page_docs[0].split('/')[1],
        url: offerDocFileUrl,
      })
      personnelHireInformation.getCell('A10').alignment = {
        horizontal: 'left',
        vertical: 'middle',
      }
      personnelHireInformation.getCell('B10').alignment = {
        wrapText: true,
      }
      let lastRow = 10

      requisitionFormDetail?.rf_attributes?.other_docs.map(async (file: any) => {
        const indexing = lastRow++
        personnelHireInformation.getCell(`A${indexing}`).value = 'Other Documents (Optional)'
        personnelHireInformation.getCell(`B${indexing}`).value = file.split('/')[1] || '-'
        const otherDocFileUrl = await getOriginalUrlFile(file)
        attachmentFiles.push({
          name: file.split('/')[1],
          url: otherDocFileUrl,
        })
        personnelHireInformation.getCell(`A${indexing}`).alignment = {
          horizontal: 'left',
          vertical: 'middle',
        }
        personnelHireInformation.getCell(`B${indexing}`).alignment = {
          wrapText: true,
        }
      })

      personnelHireInformation.mergeCells('A11', `A${lastRow}`)

      // Style personnel hire worksheet
      personnelHireInformation.getRow(1).font = {
        bold: true,
        size: 16,
      }
      personnelHireInformation.getRow(2).font = {
        size: 14,
        color: { argb: '#101828' },
      }
      personnelHireInformation.getCell(`A4`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '#fce5cd' },
      }
      personnelHireInformation.getCell(`A4`).alignment = {
        vertical: 'middle',
        horizontal: 'center',
      }
      personnelHireInformation.getRow(4).height = 22

      personnelHireInformation.getCell(`A7`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '#fce5cd' },
      }
      personnelHireInformation.getCell(`A7`).alignment = {
        vertical: 'middle',
        horizontal: 'center',
      }
      personnelHireInformation.getRow(7).height = 22

      personnelHireInformation.getColumn('A').width = 35
      personnelHireInformation.getColumn('B').width = 90
    }

    // ======================== 18-19 ========================

    rfDetailWS.getCell('A18').value = 'Requested by'
    rfDetailWS.getCell('A19').value = requisitionFormDetail?.requested_by.name
    rfDetailWS.getCell('A20').value = dayjs(requisitionFormDetail.requested_at as unknown as string)
      .utc()
      .local()
      .format('dddd, DD MMMM YYYY (HH:mm)')

    rfDetailWS.getCell('D18').value = 'Project Manager'
    rfDetailWS.getCell('D19').value = !isInternal
      ? programDetail?.program_manager?.full_name
      : supervisorData?.full_name
    rfDetailWS.getCell('D20').value = dayjs(requisitionFormDetail.program_manager_approval_at as unknown as string)
      .utc()
      .local()
      .format('dddd, DD MMMM YYYY (HH:mm)')

    rfDetailWS.getCell('G18').value = 'Budget Controller'
    rfDetailWS.getCell('G19').value = '-'
    rfDetailWS.getCell('G20').value = '-'

    rfDetailWS.getCell(`${rfType === RequisitionFormEnum.TRAVEL ? 'I' : 'J'}18`).value = `Action by ${
      rfType === RequisitionFormEnum.TRAVEL ? '(Operational)' : ''
    }`
    rfDetailWS.getCell(`${rfType === RequisitionFormEnum.TRAVEL ? 'I' : 'J'}19`).value =
      requisitionFormDetail?.action_by.name
    rfDetailWS.getCell(`${rfType === RequisitionFormEnum.TRAVEL ? 'I' : 'J'}20`).value = dayjs(
      requisitionFormDetail.budget_controller_approval_at as unknown as string,
    )
      .utc()
      .local()
      .format('dddd, DD MMMM YYYY (HH:mm)')

    rfDetailWS.getRow(18).font = {
      size: 12,
      color: { argb: '#667085' },
    }
    rfDetailWS.getRow(19).font = {
      bold: true,
      size: 14,
      color: { argb: '#101828' },
    }
    rfDetailWS.getRow(20).font = {
      size: 10,
      color: { argb: '#101828' },
    }

    // ======================== 22-X ========================

    if (rfType !== RequisitionFormEnum.TRAVEL) {
      // Special FOR PH and PC
      const defaultActivityPCPH = 22
      const defaultTablePCPH = 23

      // Loop
      projectBudgetsModified.map((project, projectIndex) =>
        project.activities?.map((activity, activityIndex) => {
          const index = projectIndex + activityIndex
          const activityFormula = defaultActivityPCPH + 5 * index
          const tableDataFormula = defaultTablePCPH + 5 * index

          // Activity
          rfDetailWS.getCell(`A${activityFormula}`).value = activity.code
          rfDetailWS.getCell(`B${activityFormula}`).value = activity.description
          rfDetailWS.getCell(`M${activityFormula}`).value = calculateUnitCostPerActivity(activity)
          rfDetailWS.getCell(`M${activityFormula}`).numFmt = IDRCurrencyFormat

          if (activity.budgets.length > 0) {
            const dynamicDataTableRows = activity.budgets.map((budget) => [
              budget.code.replace(/\.(\d+)$/, '-$1'),
              budget.description,
              budget.vendor_category_information.vendor_type.name,
              budget.vendor_category_information.name,
              (rfType !== RequisitionFormEnum.PERSONAL_HIRE && budget.recommended_vendor) || '-',
              budget.qty,
              budget.unit,
              budget.pkg_qty,
              budget.pkg_unit,
              budget.unit_cost_value,
              budget.qty * budget.pkg_qty * budget.unit_cost_value,
              budget.total_prs,
              budget.qty * budget.pkg_qty * budget.unit_cost_value - budget.total_prs,
            ])

            rfDetailWS.addTable({
              name: `Requisition Detail Table (${requisitionType(rfType)})`,
              ref: `A${tableDataFormula}`,
              headerRow: true,
              columns: [
                {
                  name: 'No',
                },
                {
                  name: 'Description',
                },
                {
                  name: 'Vendor Type',
                },
                {
                  name: 'Vendor Category',
                },
                {
                  name: 'Recommended Vendor',
                },
                {
                  name: 'Qty',
                },
                {
                  name: 'Unit',
                },
                {
                  name: 'Pckg Qty',
                },
                {
                  name: 'Pckg Unit',
                },
                {
                  name: 'Unit Cost',
                },
                {
                  name: 'Total Requested (RF)',
                },
                {
                  name: 'Total Payment Request',
                },
                {
                  name: 'Remaining (RF)',
                },
              ],
              rows: dynamicDataTableRows,
            })

            // Styling
            rfDetailWS.getRow(activityFormula).font = {
              bold: true,
              size: 14,
              color: { argb: '#101828' },
            }
            rfDetailWS.getCell(`A${activityFormula}`).alignment = {
              horizontal: 'center',
            }
            rfDetailWS.getCell(`M${activityFormula}`).alignment = {
              horizontal: 'right',
            }

            // Table
            const descriptionColumn = rfDetailWS.getColumn('B')
            const vendorTypeColumn = rfDetailWS.getColumn('C')
            const vendorCategoryColumn = rfDetailWS.getColumn('D')
            const recommendedVendorColumn = rfDetailWS.getColumn('E')
            const qtyColumn = rfDetailWS.getColumn('F')
            const unitColumn = rfDetailWS.getColumn('G')
            const pkgQtyColumn = rfDetailWS.getColumn('H')
            const pkgUnitColumn = rfDetailWS.getColumn('I')
            const unitCostColumn = rfDetailWS.getColumn('J')
            const totalRequestedColumn = rfDetailWS.getColumn('K')
            const totalPaymentRequestColumn = rfDetailWS.getColumn('L')
            const remainingRfColumn = rfDetailWS.getColumn('M')

            descriptionColumn.width = 30
            vendorTypeColumn.width = 18
            vendorCategoryColumn.width = 18
            recommendedVendorColumn.width = 25
            qtyColumn.width = 10
            unitColumn.width = 15
            pkgQtyColumn.width = 10
            pkgUnitColumn.width = 15
            unitCostColumn.width = 20
            totalRequestedColumn.width = 20
            totalPaymentRequestColumn.width = 25
            remainingRfColumn.width = 20

            // =============== Table Header : START ===============
            const columnLists = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M']
            columnLists.map((item) => {
              rfDetailWS.getCell(`${item}${tableDataFormula}`).alignment = {
                vertical: 'middle',
                horizontal: 'left',
              }
              rfDetailWS.getCell(`${item}${tableDataFormula}`).font = {
                color: { argb: '#475467' },
              }
              rfDetailWS.getCell(`${item}${tableDataFormula}`).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '#f9fafb' },
              }
              rfDetailWS.getCell(`${item}${tableDataFormula}`).border = {
                top: { style: 'thin', color: { argb: 'eaecf0' } },
                bottom: { style: 'thin', color: { argb: 'eaecf0' } },
              }
            })
            rfDetailWS.getColumn('J').numFmt = IDRCurrencyFormat
            rfDetailWS.getColumn('K').numFmt = IDRCurrencyFormat
            rfDetailWS.getColumn('L').numFmt = IDRCurrencyFormat
            rfDetailWS.getColumn('M').numFmt = IDRCurrencyFormat

            rfDetailWS.getRow(tableDataFormula).height = 24

            // =============== Table Header : END ===============

            dynamicDataTableRows.map((_, itemIndex) => {
              // Aliignment
              rfDetailWS.getCell(`A${tableDataFormula + (itemIndex + 1)}`).alignment = {
                vertical: 'middle',
                horizontal: 'left',
              }
              rfDetailWS.getCell(`B${tableDataFormula + (itemIndex + 1)}`).alignment = {
                vertical: 'middle',
                horizontal: 'left',
                wrapText: true,
              }
              rfDetailWS.getCell(`C${tableDataFormula + (itemIndex + 1)}`).alignment = {
                vertical: 'middle',
                horizontal: 'left',
              }
              rfDetailWS.getCell(`D${tableDataFormula + (itemIndex + 1)}`).alignment = {
                vertical: 'middle',
                horizontal: 'left',
              }
              rfDetailWS.getCell(`E${tableDataFormula + (itemIndex + 1)}`).alignment = {
                vertical: 'middle',
                horizontal: 'left',
              }
              rfDetailWS.getCell(`F${tableDataFormula + (itemIndex + 1)}`).alignment = {
                vertical: 'middle',
                horizontal: 'left',
              }
              rfDetailWS.getCell(`G${tableDataFormula + (itemIndex + 1)}`).alignment = {
                vertical: 'middle',
                horizontal: 'left',
              }
              rfDetailWS.getCell(`H${tableDataFormula + (itemIndex + 1)}`).alignment = {
                vertical: 'middle',
                horizontal: 'left',
              }
              rfDetailWS.getCell(`I${tableDataFormula + (itemIndex + 1)}`).alignment = {
                vertical: 'middle',
                horizontal: 'left',
              }
              rfDetailWS.getCell(`J${tableDataFormula + (itemIndex + 1)}`).alignment = {
                vertical: 'middle',
                horizontal: 'left',
              }
              rfDetailWS.getCell(`K${tableDataFormula + (itemIndex + 1)}`).alignment = {
                vertical: 'middle',
                horizontal: 'left',
              }
              rfDetailWS.getCell(`L${tableDataFormula + (itemIndex + 1)}`).alignment = {
                vertical: 'middle',
                horizontal: 'left',
              }
              rfDetailWS.getCell(`M${tableDataFormula + (itemIndex + 1)}`).alignment = {
                vertical: 'middle',
                horizontal: 'left',
              }

              // Font
              rfDetailWS.getCell(`A${tableDataFormula + (itemIndex + 1)}`).font = {
                color: { argb: '#475467' },
              }
              rfDetailWS.getCell(`B${tableDataFormula + (itemIndex + 1)}`).font = {
                color: { argb: '#475467' },
              }
              rfDetailWS.getCell(`C${tableDataFormula + (itemIndex + 1)}`).font = {
                color: { argb: '#475467' },
              }
              rfDetailWS.getCell(`D${tableDataFormula + (itemIndex + 1)}`).font = {
                color: { argb: '#475467' },
              }
              rfDetailWS.getCell(`E${tableDataFormula + (itemIndex + 1)}`).font = {
                color: { argb: '#475467' },
              }
              rfDetailWS.getCell(`F${tableDataFormula + (itemIndex + 1)}`).font = {
                color: { argb: '#475467' },
              }
              rfDetailWS.getCell(`G${tableDataFormula + (itemIndex + 1)}`).font = {
                color: { argb: '#475467' },
              }
              rfDetailWS.getCell(`H${tableDataFormula + (itemIndex + 1)}`).font = {
                color: { argb: '#475467' },
              }
              rfDetailWS.getCell(`I${tableDataFormula + (itemIndex + 1)}`).font = {
                color: { argb: '#475467' },
              }
              rfDetailWS.getCell(`J${tableDataFormula + (itemIndex + 1)}`).font = {
                color: { argb: '#475467' },
              }
              rfDetailWS.getCell(`K${tableDataFormula + (itemIndex + 1)}`).font = {
                color: { argb: '#475467' },
              }
              rfDetailWS.getCell(`L${tableDataFormula + (itemIndex + 1)}`).font = {
                color: { argb: '#475467' },
              }
              rfDetailWS.getCell(`M${tableDataFormula + (itemIndex + 1)}`).font = {
                color: { argb: '#475467' },
              }
            })
          }
        }),
      )

      if (rfType === RequisitionFormEnum.PROCUREMENT) {
        // Delete row (12-15)
        rfDetailWS.spliceRows(12, 4)
      }
    } else {
      // TR (ACTION_BY_OPERATIONAL)
      const travellerCategoryByOperational = 22
      const defaultStartTitleByOperational = 23
      const defaultStartValueByOperational = 24
      const defaultActivityByOperational = 25
      const defaultTableByOperational = 26

      const budgetFlattenByOperational = projectBudgetsModified.flatMap((project) =>
        project.activities.flatMap((activity) =>
          activity.budgets
            .filter((budget) => budget.vendor_category_information.action_by === 'ACTION_BY_OPERATIONAL')
            .flatMap((budget) => budget),
        ),
      )

      if (requisitionFormDetail?.rf_attributes?.who_traveling.id !== userLoggedinInformation?.employee_id) {
        if (
          userLoggedinInformation?.employee_id === requisitionFormDetail?.rf_attributes?.who_traveling.id &&
          isTravelInformationStatement.ACTION_BY_OPERATIONAL
        ) {
        }

        // Loop Data
        projectBudgetsModified?.map((project) =>
          project.activities?.map((activity, activityIndex) =>
            activity.budgets
              .filter((budget) => budget.vendor_category_information.action_by === 'ACTION_BY_OPERATIONAL')
              ?.map((budget, budgetIndex) => {
                const index = activityIndex + budgetIndex

                const titleFormula = defaultStartTitleByOperational + 7 * index
                const valueFormula = defaultStartValueByOperational + 7 * index
                const activityFormula = defaultActivityByOperational + 7 * index
                const tableDataFormula = defaultTableByOperational + 7 * index
                const travellerCategoryFormula = travellerCategoryByOperational + 7 * index

                if (activityIndex === 0) {
                  rfDetailWS.mergeCells(`A${travellerCategoryFormula}:J${travellerCategoryFormula}`)
                  rfDetailWS.getCell(`A${travellerCategoryFormula}`).value = 'ACTION BY OPERATIONAL'

                  rfDetailWS.getCell(`A${travellerCategoryFormula}`).alignment = {
                    vertical: 'middle',
                    horizontal: 'center',
                  }
                  rfDetailWS.getCell(`A${travellerCategoryFormula}`).font = {
                    bold: true,
                    color: { argb: '#ffffff' },
                  }
                  rfDetailWS.getCell(`A${travellerCategoryFormula}`).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: '#6172f3' },
                  }
                  rfDetailWS.getRow(travellerCategoryFormula).height = 22
                }

                // Titles
                rfDetailWS.getCell(`A${titleFormula}`).value = 'Vendor Category'
                rfDetailWS.getCell(`E${titleFormula}`).value = `${budget.vendor_category_information.name} Vendor`
                rfDetailWS.getCell(`I${titleFormula}`).value =
                  budget.vendor_category_information.name.toLowerCase() === 'airfare'
                    ? 'Airfare Information'
                    : `${budget.vendor_category_information.name} Information`

                // Values
                rfDetailWS.getCell(`A${valueFormula}`).value = budget.vendor_category_information.name
                rfDetailWS.getCell(`E${valueFormula}`).value = budget.recommended_vendor || '-'
                rfDetailWS.getCell(`I${valueFormula}`).value =
                  budget.vendor_category_information.name.toLowerCase() === 'airfare'
                    ? `See Worksheet: ${activity.description} - Airfare`
                    : `${dayjs(budget.additional_data['travel_information']['vendor_date_range']['start']).format(
                        'dddd, DD MMM YYYY',
                      )} - ${dayjs(budget.additional_data['travel_information']['vendor_date_range']['end']).format(
                        'dddd, DD MMM YYYY',
                      )}`
                rfDetailWS.mergeCells(`I${valueFormula}:J${valueFormula}`)
                // Airfare Flights Information
                if (budget.vendor_category_information.name.toLowerCase() === 'airfare') {
                  const airfareDetail = rfWB.addWorksheet(`${activity.description} - Airfare`)
                  airfareDetail.getCell('A1').value = 'Airfare Information'
                  airfareDetail.getCell('A2').value = programDetail?.program_name

                  // Boarding
                  airfareDetail.getCell('A4').value = 'BOARDING'
                  airfareDetail.mergeCells('A4:B4')

                  airfareDetail.getCell('A5').value = 'Date'
                  airfareDetail.getCell('B5').value = dayjs(
                    budget.additional_data['travel_information']['boarding_date'],
                  ).format('dddd, DD MMM YYYY')

                  airfareDetail.getCell('A6').value = 'Time'
                  airfareDetail.getCell('B6').value = dayjs(
                    budget.additional_data['travel_information']['boarding_time'],
                  ).format('hh:mm A')

                  airfareDetail.getCell('A7').value = 'Flight Code'
                  airfareDetail.getCell('B7').value =
                    budget.additional_data['travel_information']['boarding_flight_code']

                  // Arrival
                  airfareDetail.getCell('A9').value = 'ARRIVAL'
                  airfareDetail.mergeCells('A9:B9')

                  airfareDetail.getCell('A10').value = 'Date'
                  airfareDetail.getCell('B10').value = dayjs(
                    budget.additional_data['travel_information']['arrival_date'],
                  ).format('dddd, DD MMM YYYY')

                  airfareDetail.getCell('A11').value = 'Time'
                  airfareDetail.getCell('B11').value = dayjs(
                    budget.additional_data['travel_information']['arrival_time'],
                  ).format('hh:mm A')

                  airfareDetail.getCell('A12').value = 'Flight Code'
                  airfareDetail.getCell('B12').value =
                    budget.additional_data['travel_information']['arrival_flight_code']

                  // Style airfare detail worksheet
                  airfareDetail.getRow(1).font = {
                    bold: true,
                    size: 16,
                  }
                  airfareDetail.getRow(2).font = {
                    size: 14,
                    color: { argb: '#101828' },
                  }
                  airfareDetail.getCell(`A4`).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: '#fce5cd' },
                  }
                  airfareDetail.getCell(`A4`).alignment = {
                    vertical: 'middle',
                    horizontal: 'center',
                  }
                  airfareDetail.getRow(4).height = 22

                  airfareDetail.getCell(`A9`).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: '#fce5cd' },
                  }
                  airfareDetail.getCell(`A9`).alignment = {
                    vertical: 'middle',
                    horizontal: 'center',
                  }
                  airfareDetail.getRow(9).height = 22

                  airfareDetail.getColumn('A').width = 20
                  airfareDetail.getColumn('B').width = 25
                }
                // Activity
                rfDetailWS.getCell(`A${activityFormula}`).value = `${budget.code?.split('.')[0]}.${
                  budget.code?.split('.')[1]
                }`
                rfDetailWS.getCell(`B${activityFormula}`).value = activity.description
                rfDetailWS.getCell(`J${activityFormula}`).value = budget.qty * budget.pkg_qty * budget.unit_cost_value
                rfDetailWS.getCell(`J${activityFormula}`).numFmt = IDRCurrencyFormat

                //=========== Table dynamic ===========

                const dynamicDataTableRows = budgetFlattenByOperational.map((budget) => [
                  budget.code.replace(/\.(\d+)$/, '-$1'),
                  budget.description,
                  budget.qty,
                  budget.unit,
                  budget.pkg_qty,
                  budget.pkg_unit,
                  budget.unit_cost_value,
                  budget.qty * budget.pkg_qty * budget.unit_cost_value,
                  budget.total_prs,
                  budget.qty * budget.pkg_qty * budget.unit_cost_value - budget.total_prs,
                ])

                rfDetailWS.addTable({
                  name: 'Requisition Detail Table (TR - Action By OPERATIONAL)',
                  ref: `A${tableDataFormula}`,
                  headerRow: true,
                  columns: [
                    {
                      name: 'No',
                    },
                    {
                      name: 'Description',
                    },
                    {
                      name: 'Qty',
                    },
                    {
                      name: 'Unit',
                    },
                    {
                      name: 'Pckg Qty',
                    },
                    {
                      name: 'Pckg Unit',
                    },
                    {
                      name: 'Unit Cost',
                    },
                    {
                      name: 'Total Requested (RF)',
                    },
                    {
                      name: 'Total Payment Request',
                    },
                    {
                      // Action by Operational
                      name: 'Remaining (RF)',
                    },
                  ],
                  rows: [dynamicDataTableRows[index]],
                })

                // Styling
                rfDetailWS.getRow(titleFormula).font = {
                  size: 12,
                  color: { argb: '#667085' },
                }
                rfDetailWS.getRow(valueFormula).font = {
                  bold: true,
                  size: 14,
                  color: { argb: '#101828' },
                }
                rfDetailWS.getRow(activityFormula).font = {
                  bold: true,
                  size: 14,
                  color: { argb: '#101828' },
                }
                rfDetailWS.getCell(`A${activityFormula}`).alignment = {
                  horizontal: 'center',
                }
                rfDetailWS.getCell(`J${activityFormula}`).alignment = {
                  horizontal: 'right',
                }

                // Table
                const descriptionColumn = rfDetailWS.getColumn('B')
                const qtyColumn = rfDetailWS.getColumn('C')
                const unitColumn = rfDetailWS.getColumn('D')
                const pkgQtyColumn = rfDetailWS.getColumn('E')
                const pkgUnitColumn = rfDetailWS.getColumn('F')
                const unitCostColumn = rfDetailWS.getColumn('G')
                const totalRequestedColumn = rfDetailWS.getColumn('H')
                const totalPaymentRequestColumn = rfDetailWS.getColumn('I')
                const remainingRfColumn = rfDetailWS.getColumn('J')

                descriptionColumn.width = 30
                qtyColumn.width = 10
                unitColumn.width = 15
                pkgQtyColumn.width = 10
                pkgUnitColumn.width = 15
                unitCostColumn.width = 20
                totalRequestedColumn.width = 20
                totalPaymentRequestColumn.width = 25
                remainingRfColumn.width = 30

                // =============== Table Header : START ===============
                const columnLists = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
                columnLists.map((item) => {
                  rfDetailWS.getCell(`${item}${tableDataFormula}`).alignment = {
                    vertical: 'middle',
                    horizontal: 'left',
                  }
                  rfDetailWS.getCell(`${item}${tableDataFormula}`).font = {
                    color: { argb: '#475467' },
                  }
                  rfDetailWS.getCell(`${item}${tableDataFormula}`).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: '#f9fafb' },
                  }
                  rfDetailWS.getCell(`${item}${tableDataFormula}`).border = {
                    top: { style: 'thin', color: { argb: 'eaecf0' } },
                    bottom: { style: 'thin', color: { argb: 'eaecf0' } },
                  }
                })

                rfDetailWS.getRow(tableDataFormula).height = 24

                // =============== Table Header : END ===============

                // Alignment
                rfDetailWS.getCell(`A${tableDataFormula + 1}`).alignment = {
                  vertical: 'middle',
                  horizontal: 'left',
                }
                rfDetailWS.getCell(`B${tableDataFormula + 1}`).alignment = {
                  vertical: 'middle',
                  horizontal: 'left',
                  wrapText: true,
                }
                rfDetailWS.getCell(`C${tableDataFormula + 1}`).alignment = {
                  vertical: 'middle',
                  horizontal: 'left',
                }
                rfDetailWS.getCell(`D${tableDataFormula + 1}`).alignment = {
                  vertical: 'middle',
                  horizontal: 'left',
                }
                rfDetailWS.getCell(`E${tableDataFormula + 1}`).alignment = {
                  vertical: 'middle',
                  horizontal: 'left',
                }
                rfDetailWS.getCell(`F${tableDataFormula + 1}`).alignment = {
                  vertical: 'middle',
                  horizontal: 'left',
                }
                rfDetailWS.getCell(`G${tableDataFormula + 1}`).alignment = {
                  vertical: 'middle',
                  horizontal: 'left',
                }
                rfDetailWS.getCell(`H${tableDataFormula + 1}`).alignment = {
                  vertical: 'middle',
                  horizontal: 'left',
                }
                rfDetailWS.getCell(`I${tableDataFormula + 1}`).alignment = {
                  vertical: 'middle',
                  horizontal: 'left',
                }
                rfDetailWS.getCell(`J${tableDataFormula + 1}`).alignment = {
                  vertical: 'middle',
                  horizontal: 'left',
                }

                // Font
                rfDetailWS.getCell(`A${tableDataFormula + 1}`).font = {
                  color: { argb: '#475467' },
                }
                rfDetailWS.getCell(`B${tableDataFormula + 1}`).font = {
                  color: { argb: '#475467' },
                }
                rfDetailWS.getCell(`C${tableDataFormula + 1}`).font = {
                  color: { argb: '#475467' },
                }
                rfDetailWS.getCell(`D${tableDataFormula + 1}`).font = {
                  color: { argb: '#475467' },
                }
                rfDetailWS.getCell(`E${tableDataFormula + 1}`).font = {
                  color: { argb: '#475467' },
                }
                rfDetailWS.getCell(`F${tableDataFormula + 1}`).font = {
                  color: { argb: '#475467' },
                }
                rfDetailWS.getCell(`G${tableDataFormula + 1}`).font = {
                  color: { argb: '#475467' },
                }
                rfDetailWS.getCell(`H${tableDataFormula + 1}`).font = {
                  color: { argb: '#475467' },
                }
                rfDetailWS.getCell(`I${tableDataFormula + 1}`).font = {
                  color: { argb: '#475467' },
                }
                rfDetailWS.getCell(`J${tableDataFormula + 1}`).font = {
                  color: { argb: '#475467' },
                }
              }),
          ),
        )
      }

      // TR (ACTION_BY_TRAVELLER)
      const lastRowNumber = rfDetailWS.lastRow.number
      const travellerCategoryByTraveller = lastRowNumber + 3
      const defaultActivityByTraveller = lastRowNumber + 4
      const defaultTableByTraveller = lastRowNumber + 5

      const budgetFlattenByTraveller = projectBudgetsModified.flatMap((project) =>
        project.activities.flatMap((activity) =>
          activity.budgets
            .filter((budget) => budget.vendor_category_information.action_by === 'ACTION_BY_TRAVELLER')
            .flatMap((budget) => {
              return {
                ...budget,
                activity_index: Number(budget.code.split('.')[1]),
              }
            }),
        ),
      )

      if (requisitionFormDetail?.action_by.id !== userLoggedinInformation?.employee_id) {
        // Empty
        if (
          requisitionFormDetail?.action_by.id === userLoggedinInformation?.employee_id &&
          isTravelInformationStatement.ACTION_BY_TRAVELLER
        ) {
        } else {
          const travellerCategoryFormula = travellerCategoryByTraveller + 7 * 0 // Lelele

          rfDetailWS.mergeCells(`A${travellerCategoryFormula}:J${travellerCategoryFormula}`)
          rfDetailWS.getCell(`A${travellerCategoryFormula}`).value = 'ACTION BY TRAVELLER'

          rfDetailWS.getCell(`A${travellerCategoryFormula}`).alignment = {
            vertical: 'middle',
            horizontal: 'center',
          }
          rfDetailWS.getCell(`A${travellerCategoryFormula}`).font = {
            bold: true,
            color: { argb: '#ffffff' },
          }
          rfDetailWS.getCell(`A${travellerCategoryFormula}`).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '#fd6f8e' },
          }
          rfDetailWS.getRow(travellerCategoryFormula).height = 22

          // STATIC - ACTION BY TRAVELLER
          // Loop Data
          projectBudgetsModified?.map((project, projectIndex) =>
            project.activities?.map((activity, activityIndex) => {
              if (
                calculatePureTotalBudget(
                  activity.budgets.filter(
                    (budget) => budget.vendor_category_information.action_by === 'ACTION_BY_TRAVELLER',
                  ),
                ) > 0
              ) {
                const index = projectIndex + activityIndex
                const activityFormula = defaultActivityByTraveller + 7 * index
                const tableDataFormula = defaultTableByTraveller + 7 * index

                // Activity
                rfDetailWS.getCell(`A${activityFormula}`).value = activity.code
                rfDetailWS.getCell(`B${activityFormula}`).value = activity.description
                rfDetailWS.getCell(`J${activityFormula}`).value = calculatePureTotalBudget(
                  activity.budgets.filter(
                    (budget) => budget.vendor_category_information.action_by === 'ACTION_BY_TRAVELLER',
                  ),
                )
                rfDetailWS.getCell(`J${activityFormula}`).numFmt = IDRCurrencyFormat

                if (activity.budgets.length > 0) {
                  const dynamicDataTableRows = budgetFlattenByTraveller
                    .filter((budget) => budget.activity_index === index + 1)
                    .map((budget) => [
                      budget.code.replace(/\.(\d+)$/, '-$1'),
                      budget.description,
                      budget.qty,
                      budget.unit,
                      budget.pkg_qty,
                      budget.pkg_unit,
                      budget.unit_cost_value,
                      budget.qty * budget.pkg_qty * budget.unit_cost_value,
                      budget.total_prs,
                      budget.qty * budget.pkg_qty * budget.unit_cost_value -
                        budget.total_prs -
                        budget.advance_payment_total,
                    ])

                  rfDetailWS.addTable({
                    name: 'Requisition Detail Table (TR - Action By TRAVELLER)',
                    ref: `A${tableDataFormula}`,
                    headerRow: true,
                    columns: [
                      {
                        name: 'No',
                      },
                      {
                        name: 'Description',
                      },
                      {
                        name: 'Qty',
                      },
                      {
                        name: 'Unit',
                      },
                      {
                        name: 'Pckg Qty',
                      },
                      {
                        name: 'Pckg Unit',
                      },
                      {
                        name: 'Unit Cost',
                      },
                      {
                        name: 'Total Requested (RF)',
                      },
                      {
                        name: 'Total Travel Expense',
                      },
                      {
                        // Action by Traveller
                        name: 'Remaining (RF)',
                      },
                    ],
                    rows: dynamicDataTableRows,
                  })

                  // Styling
                  rfDetailWS.getRow(activityFormula).font = {
                    bold: true,
                    size: 14,
                    color: { argb: '#101828' },
                  }
                  rfDetailWS.getCell(`A${activityFormula}`).alignment = {
                    horizontal: 'center',
                  }
                  rfDetailWS.getCell(`J${activityFormula}`).alignment = {
                    horizontal: 'right',
                  }

                  // Table
                  const descriptionColumn = rfDetailWS.getColumn('B')
                  const qtyColumn = rfDetailWS.getColumn('C')
                  const unitColumn = rfDetailWS.getColumn('D')
                  const pkgQtyColumn = rfDetailWS.getColumn('E')
                  const pkgUnitColumn = rfDetailWS.getColumn('F')
                  const unitCostColumn = rfDetailWS.getColumn('G')
                  const totalRequestedColumn = rfDetailWS.getColumn('H')
                  const totalPaymentRequestColumn = rfDetailWS.getColumn('I')
                  const remainingRfColumn = rfDetailWS.getColumn('J')

                  descriptionColumn.width = 30
                  qtyColumn.width = 10
                  unitColumn.width = 15
                  pkgQtyColumn.width = 10
                  pkgUnitColumn.width = 15
                  unitCostColumn.width = 20
                  totalRequestedColumn.width = 20
                  totalPaymentRequestColumn.width = 25
                  remainingRfColumn.width = 30

                  // =============== Table Header : START ===============
                  const columnLists = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
                  columnLists.map((item) => {
                    rfDetailWS.getCell(`${item}${tableDataFormula}`).alignment = {
                      vertical: 'middle',
                      horizontal: 'left',
                    }
                    rfDetailWS.getCell(`${item}${tableDataFormula}`).font = {
                      color: { argb: '#475467' },
                    }
                    rfDetailWS.getCell(`${item}${tableDataFormula}`).fill = {
                      type: 'pattern',
                      pattern: 'solid',
                      fgColor: { argb: '#f9fafb' },
                    }
                    rfDetailWS.getCell(`${item}${tableDataFormula}`).border = {
                      top: { style: 'thin', color: { argb: 'eaecf0' } },
                      bottom: { style: 'thin', color: { argb: 'eaecf0' } },
                    }
                  })

                  rfDetailWS.getRow(tableDataFormula).height = 24

                  // =============== Table Header : END ===============

                  dynamicDataTableRows.map((_, itemIndex) => {
                    // Alignment
                    rfDetailWS.getCell(`A${tableDataFormula + (itemIndex + 1)}`).alignment = {
                      vertical: 'middle',
                      horizontal: 'left',
                    }
                    rfDetailWS.getCell(`B${tableDataFormula + (itemIndex + 1)}`).alignment = {
                      vertical: 'middle',
                      horizontal: 'left',
                      wrapText: true,
                    }
                    rfDetailWS.getCell(`C${tableDataFormula + (itemIndex + 1)}`).alignment = {
                      vertical: 'middle',
                      horizontal: 'left',
                    }
                    rfDetailWS.getCell(`D${tableDataFormula + (itemIndex + 1)}`).alignment = {
                      vertical: 'middle',
                      horizontal: 'left',
                    }
                    rfDetailWS.getCell(`E${tableDataFormula + (itemIndex + 1)}`).alignment = {
                      vertical: 'middle',
                      horizontal: 'left',
                    }
                    rfDetailWS.getCell(`F${tableDataFormula + (itemIndex + 1)}`).alignment = {
                      vertical: 'middle',
                      horizontal: 'left',
                    }
                    rfDetailWS.getCell(`G${tableDataFormula + (itemIndex + 1)}`).alignment = {
                      vertical: 'middle',
                      horizontal: 'left',
                    }
                    rfDetailWS.getCell(`H${tableDataFormula + (itemIndex + 1)}`).alignment = {
                      vertical: 'middle',
                      horizontal: 'left',
                    }
                    rfDetailWS.getCell(`I${tableDataFormula + (itemIndex + 1)}`).alignment = {
                      vertical: 'middle',
                      horizontal: 'left',
                    }
                    rfDetailWS.getCell(`J${tableDataFormula + (itemIndex + 1)}`).alignment = {
                      vertical: 'middle',
                      horizontal: 'left',
                    }

                    // Font
                    rfDetailWS.getCell(`A${tableDataFormula + (itemIndex + 1)}`).font = {
                      color: { argb: '#475467' },
                    }
                    rfDetailWS.getCell(`B${tableDataFormula + (itemIndex + 1)}`).font = {
                      color: { argb: '#475467' },
                    }
                    rfDetailWS.getCell(`C${tableDataFormula + (itemIndex + 1)}`).font = {
                      color: { argb: '#475467' },
                    }
                    rfDetailWS.getCell(`D${tableDataFormula + (itemIndex + 1)}`).font = {
                      color: { argb: '#475467' },
                    }
                    rfDetailWS.getCell(`E${tableDataFormula + (itemIndex + 1)}`).font = {
                      color: { argb: '#475467' },
                    }
                    rfDetailWS.getCell(`F${tableDataFormula + (itemIndex + 1)}`).font = {
                      color: { argb: '#475467' },
                    }
                    rfDetailWS.getCell(`G${tableDataFormula + (itemIndex + 1)}`).font = {
                      color: { argb: '#475467' },
                    }
                    rfDetailWS.getCell(`H${tableDataFormula + (itemIndex + 1)}`).font = {
                      color: { argb: '#475467' },
                    }
                    rfDetailWS.getCell(`I${tableDataFormula + (itemIndex + 1)}`).font = {
                      color: { argb: '#475467' },
                    }
                    rfDetailWS.getCell(`J${tableDataFormula + (itemIndex + 1)}`).font = {
                      color: { argb: '#475467' },
                    }
                  })

                  rfDetailWS.getColumn('G').numFmt = IDRCurrencyFormat
                  rfDetailWS.getColumn('H').numFmt = IDRCurrencyFormat
                  rfDetailWS.getColumn('I').numFmt = IDRCurrencyFormat
                  rfDetailWS.getColumn('J').numFmt = IDRCurrencyFormat
                  // rfDetailWS.getColumn('K').numFmt = IDRCurrencyFormat
                }
              }
            }),
          )
        }
      }
    }

    const [prListResult, aprListResult, apsListResult, apfListResult, teListResult] = await Promise.all([
      getPaymentRequestList(`${PRTypes.PR}/${programId}/${rfId}/false/undefined/undefined`),
      getPaymentRequestList(`${PRTypes.APR}/${programId}/${rfId}/false/undefined/undefined`),
      getPaymentRequestList(`${PRTypes.APS}/${programId}/${rfId}/false/undefined/undefined`),
      getPaymentRequestList(`${PRTypes.APF}/${programId}/${rfId}/false/undefined/undefined`),
      getPaymentRequestList(`${PRTypes.TE}/${programId}/${rfId}/false/undefined/undefined`),
    ])

    // console.log('prListResult', prListResult)

    // PAYMENT REQUEST LIST WORKSHEET
    const prWS = rfWB.addWorksheet(workSheetNamePR)
    generatePaymentListTable(prListResult, prWS, workSheetNamePR, IDRCurrencyFormat)
    // ADVANCE PAYMENT REQUEST LIST WORKSHEET
    const aprWS = rfWB.addWorksheet(workSheetNameAPR)
    generatePaymentListTable(aprListResult, aprWS, workSheetNamePR, IDRCurrencyFormat)

    // ADVANCE PAYMENT STATEMENT LIST WORKSHEET
    const apsWS = rfWB.addWorksheet(workSheetNameAPS)
    generatePaymentListTable(apsListResult, apsWS, workSheetNamePR, IDRCurrencyFormat)

    if (rfType === RequisitionFormEnum.TRAVEL) {
      const apfWS = rfWB.addWorksheet(workSheetNameAPF)
      generatePaymentListTable(apfListResult, apfWS, workSheetNamePR, IDRCurrencyFormat)

      const teWS = rfWB.addWorksheet(workSheetNameTE)
      generatePaymentListTable(teListResult, teWS, workSheetNamePR, IDRCurrencyFormat)
    }

    const rfDetailBuf = await rfWB.xlsx.writeBuffer()

    const rfDetailExcel = new Blob([rfDetailBuf], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    zip.file(`${fileNameRFDetail}.xlsx`, rfDetailExcel)

    /* ----------------------------------------------------------------------------------------
    REQUISITION DETAIL : END
    ---------------------------------------------------------------------------------------- */

    /* ----------------------------------------------------------------------------------------
    MAIN FORMULA FOR PAYMENT DETAIL : START
    ---------------------------------------------------------------------------------------- */
    const handleExportDetailPayments = async (
      payments: PaymentRequestListType[],
      workSheetNameInternal: string,
      workbook: Excel.Workbook,
    ) => {
      const listPaymentDetails = payments?.map(async (pr) => await getDetailPayment(pr.id))
      const listPaymentDetailsResult = await Promise.all(listPaymentDetails)

      // PR DETAIL WORKSHEET
      const prDetailWS = workbook.addWorksheet(workSheetNameInternal)

      for (const prDetail of listPaymentDetailsResult) {
        const internalTaxCalculation = prDetail?.projects.flatMap((activity) =>
          activity.activities.flatMap((budget) => budget.budgets),
        )

        const totalTaxCalculationInternalNonTE =
          internalTaxCalculation?.map((budget) => budget.tax_amount || 0).reduce((acc, cur) => acc + cur, 0) || 0

        const vendorDetailPromise = async () => {
          if (prDetail.vendor_id) {
            const vendorRes = await vendorExternalApi.vendorControllerGetVendorDetail(prDetail.vendor_id)
            const vendorResult = vendorRes.data.data
            return vendorResult
          } else {
            return Promise.resolve(null)
          }
        }

        const vendorDetail = await vendorDetailPromise()

        const paymentType = prDetail.number.replace(/\s/g, '').split('/')[0].toUpperCase()
        const fileNamePRDetail = prDetail.number.replace(/\s/g, '').replace(/\//g, '_').toUpperCase()

        const paymentIdentifier = () => {
          let name = ''
          switch (paymentType) {
            case 'PR':
              name = 'payment-request'
              break
            case 'APR':
              name = 'advance-payment-request'
              break
            case 'APS':
              name = 'advance-payment-statement'
              break
            case 'APF':
              name = 'advance-perdiem-fee'
              break
            case 'TE':
              name = 'travel-expenses'
              break
            default:
              break
          }
          return name
        }

        const showBankInformation = () => {
          // Personnel Hire Offcanvas - Documents
          const bankInformationWS = workbook.addWorksheet(workSheetNameBankInformation)
          bankInformationWS.getCell('A1').value = 'Bank Account'
          bankInformationWS.getCell('A2').value = `(${prDetail.number.toUpperCase()})`

          // Bank Information
          bankInformationWS.getCell('A4').value = 'INFORMATION'
          bankInformationWS.mergeCells('A4:B4')

          if (vendorDetail) {
            // Vendor Name
            bankInformationWS.getCell('A5').value = 'Vendor Name'
            bankInformationWS.getCell('B5').value = vendorDetail?.vendor_information['name'] || '-'
            bankInformationWS.getCell('A5').alignment = {
              horizontal: 'left',
              vertical: 'middle',
            }
            bankInformationWS.getCell('B5').alignment = {
              wrapText: true,
            }
          } else {
            bankInformationWS.getCell('A5').value = 'Requester Name'
            bankInformationWS.getCell('B5').value = prDetail.requested_by.name
            bankInformationWS.getCell('A5').alignment = {
              horizontal: 'left',
              vertical: 'middle',
            }
            bankInformationWS.getCell('B5').alignment = {
              wrapText: true,
            }
          }
          // Beneficiary Name
          bankInformationWS.getCell('A6').value = 'Beneficiary Name'
          bankInformationWS.getCell('B6').value = vendorDetail
            ? vendorDetail?.vendor_payment.bank_acc_name
            : prDetail.requested_by['bank_acc_name'] || '-'
          bankInformationWS.getCell('A6').alignment = {
            horizontal: 'left',
            vertical: 'middle',
          }
          bankInformationWS.getCell('B6').alignment = {
            wrapText: true,
          }
          // Bank Name
          bankInformationWS.getCell('A7').value = 'Bank Name'
          bankInformationWS.getCell('B7').value = vendorDetail
            ? vendorDetail?.vendor_payment.bank_name
            : prDetail.requested_by['bank_name'] || '-'
          bankInformationWS.getCell('A7').alignment = {
            horizontal: 'left',
            vertical: 'middle',
          }
          bankInformationWS.getCell('B7').alignment = {
            wrapText: true,
          }
          // Bank Account Number
          bankInformationWS.getCell('A8').value = 'Bank Account Number'
          bankInformationWS.getCell('B8').value = vendorDetail
            ? vendorDetail?.vendor_payment.bank_acc_number
            : prDetail.requested_by['bank_acc_number'] || '-'
          bankInformationWS.getCell('A8').alignment = {
            horizontal: 'left',
            vertical: 'middle',
          }
          bankInformationWS.getCell('B8').alignment = {
            wrapText: true,
          }

          // Style bank information worksheet
          bankInformationWS.getRow(1).font = {
            bold: true,
            size: 16,
          }
          bankInformationWS.getRow(2).font = {
            size: 14,
            color: { argb: '#101828' },
          }
          bankInformationWS.getCell(`A4`).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '#fce5cd' },
          }
          bankInformationWS.getCell(`A4`).alignment = {
            vertical: 'middle',
            horizontal: 'center',
          }
          bankInformationWS.getRow(4).height = 22

          bankInformationWS.getColumn('A').width = 35
          bankInformationWS.getColumn('B').width = 90
        }
        // ======================== 3-4 ========================

        prDetailWS.getCell('A3').value = 'Project'
        prDetailWS.getCell('A4').value = programDetail?.program_name

        prDetailWS.getCell('D3').value = 'Partner'
        prDetailWS.getCell('D4').value = programDetail?.partner?.name

        prDetailWS.getCell('H3').value = 'Activity Name'
        prDetailWS.getCell('H4').value = prDetail.description

        prDetailWS.getRow(3).font = {
          size: 12,
          color: { argb: '#667085' },
        }
        prDetailWS.getRow(4).font = {
          bold: true,
          size: 14,
          color: { argb: '#101828' },
        }

        // ======================== 7-8 ========================
        if (paymentType === 'TE') {
          prDetailWS.getCell('A7').value = 'Finance Request Code'
          prDetailWS.getCell('A8').value = prDetail.number.replace(/\s/g, '').toUpperCase()
          prDetailWS.mergeCells('A8:B8')
          prDetailWS.getCell('A8').alignment = {
            vertical: 'middle',
            horizontal: 'left',
            wrapText: true,
          }

          prDetailWS.getCell('D7').value = 'Requisition Form'
          prDetailWS.getCell('D8').value = requisitionFormDetail?.number.toUpperCase()
          prDetailWS.mergeCells('D8:E8')
          prDetailWS.getCell('D8').alignment = {
            vertical: 'middle',
            horizontal: 'left',
          }

          prDetailWS.getCell('H7').value = 'Travel Date End'
          prDetailWS.getCell('H8').value = dayjs(prDetail.travel_end_date_estimation).format('dddd, DD MMM YYYY')
          prDetailWS.getCell('H8').alignment = {
            vertical: 'middle',
            horizontal: 'left',
          }

          prDetailWS.getCell('J7').value = 'Attachment'
          prDetailWS.getCell('J8').value = `See worksheet: Travel Expenses Attachments`
          prDetailWS.getCell('J8').alignment = {
            vertical: 'middle',
            horizontal: 'left',
          }

          // WORKBOOK
          // Travel Expenses Attachment Offcanvas
          const additionalAttachmentWS = workbook.addWorksheet(workSheetNameTravelExpensesAttachment)
          additionalAttachmentWS.getCell('A1').value = workSheetNameTravelExpensesAttachment
          additionalAttachmentWS.getCell('A2').value = prDetail.number.replace(/\s/g, '').toUpperCase()

          additionalAttachmentWS.getCell('A4').value = 'ATTACHMENT'
          additionalAttachmentWS.mergeCells('A4:B4')

          let lastRow = 4

          const paymentAttachments = JSON.parse(prDetail.attachments as unknown as string) || prDetail.attachments

          for (const attachment of paymentAttachments) {
            const indexing = lastRow++
            additionalAttachmentWS.getCell(`A${indexing}`).value = translateAttachmentKey(attachment.key)
            additionalAttachmentWS.getCell(`B${indexing}`).value = attachment?.file_path?.[0]?.split('/')[1] || '-'

            const attachmentUrl = await getOriginalUrlFile(attachment?.file_path?.[0])
            attachmentFiles.push({
              name: `${paymentIdentifier()}/${attachment?.file_path?.[0]?.split('/')[1]}`,
              url: attachmentUrl,
            })

            additionalAttachmentWS.getCell(`A${indexing}`).alignment = {
              horizontal: 'left',
              vertical: 'middle',
            }
            additionalAttachmentWS.getCell(`B${indexing}`).alignment = {
              wrapText: true,
            }
          }

          // Style additional attachment
          additionalAttachmentWS.getRow(1).font = {
            bold: true,
            size: 16,
          }
          additionalAttachmentWS.getRow(2).font = {
            size: 14,
            color: { argb: '#101828' },
          }
          additionalAttachmentWS.getCell(`A4`).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '#fce5cd' },
          }
          additionalAttachmentWS.getCell(`A4`).alignment = {
            vertical: 'middle',
            horizontal: 'center',
          }
          additionalAttachmentWS.getRow(4).height = 22

          additionalAttachmentWS.getColumn('A').width = 35
          additionalAttachmentWS.getColumn('B').width = 90

          // Style
          prDetailWS.getRow(7).font = {
            size: 12,
            color: { argb: '#667085' },
          }
          prDetailWS.getRow(8).font = {
            bold: true,
            size: 14,
            color: { argb: '#101828' },
          }
        } else {
          prDetailWS.getCell('A7').value = 'Requisition Form'
          prDetailWS.getCell('A8').value = requisitionFormDetail?.number.toUpperCase()
          prDetailWS.mergeCells('A8:B8')
          prDetailWS.getCell('A8').alignment = {
            vertical: 'middle',
            horizontal: 'left',
            wrapText: true,
          }

          prDetailWS.getCell('D7').value = 'Vendor Type'
          prDetailWS.getCell('D8').value =
            prDetail.projects[0].activities[0].budgets[0].vendor_category_information.vendor_type.name
          prDetailWS.getCell('D8').alignment = {
            vertical: 'middle',
            horizontal: 'left',
          }

          if (paymentType === 'PR' || paymentType === 'APS') {
            prDetailWS.getCell('H7').value = 'Attachment'
            prDetailWS.getCell('H8').value = `See worksheet: Attachment`
            prDetailWS.getCell('H8').alignment = {
              vertical: 'middle',
              horizontal: 'left',
            }

            // WORKBOOK
            // Additional Attachment Offcanvas
            const additionalAttachmentWS = workbook.addWorksheet(workSheetNameAdditionalAttactment)
            additionalAttachmentWS.getCell('A1').value = workSheetNameAdditionalAttactment
            additionalAttachmentWS.getCell('A2').value = prDetail.number.replace(/\s/g, '').toUpperCase()

            additionalAttachmentWS.getCell('A4').value = 'ATTACHMENT'
            additionalAttachmentWS.mergeCells('A4:B4')

            let lastRow = 4

            const paymentAttachments = JSON.parse(prDetail.attachments as unknown as string) || prDetail.attachments

            for (const attachment of paymentAttachments) {
              const indexing = lastRow++
              additionalAttachmentWS.getCell(`A${indexing}`).value = translateAttachmentKey(attachment.key)
              additionalAttachmentWS.getCell(`B${indexing}`).value = attachment?.file_path?.[0]?.split('/')[1] || '-'

              const attachmentUrl = await getOriginalUrlFile(attachment?.file_path?.[0])
              attachmentFiles.push({
                name: `${paymentIdentifier()}/${attachment?.file_path?.[0]?.split('/')[1]}`,
                url: attachmentUrl,
              })

              additionalAttachmentWS.getCell(`A${indexing}`).alignment = {
                horizontal: 'left',
                vertical: 'middle',
              }
              additionalAttachmentWS.getCell(`B${indexing}`).alignment = {
                wrapText: true,
              }
            }

            // Style additional attachment
            additionalAttachmentWS.getRow(1).font = {
              bold: true,
              size: 16,
            }
            additionalAttachmentWS.getRow(2).font = {
              size: 14,
              color: { argb: '#101828' },
            }
            additionalAttachmentWS.getCell(`A4`).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: '#fce5cd' },
            }
            additionalAttachmentWS.getCell(`A4`).alignment = {
              vertical: 'middle',
              horizontal: 'center',
            }
            additionalAttachmentWS.getRow(4).height = 22

            additionalAttachmentWS.getColumn('A').width = 35
            additionalAttachmentWS.getColumn('B').width = 90
          }

          if (paymentType === 'APR') {
            prDetailWS.getCell('H7').value = 'Advance Payment Date'
            prDetailWS.getCell('H8').value = prDetail.expected_payment_date
              ? dayjs(prDetail.expected_payment_date).format('ddd, DD MMM YYYY')
              : '-'
            prDetailWS.getCell('H8').alignment = {
              vertical: 'middle',
              horizontal: 'left',
            }
          }

          if (paymentType === 'APF') {
            prDetailWS.getCell('H7').value = 'Advance Perdiem Fee Date'
            prDetailWS.getCell('H8').value = prDetail.expected_payment_date
              ? dayjs(prDetail.expected_payment_date).format('ddd, DD MMM YYYY')
              : '-'
            prDetailWS.getCell('H8').alignment = {
              vertical: 'middle',
              horizontal: 'left',
            }
          }

          prDetailWS.getRow(7).font = {
            size: 12,
            color: { argb: '#667085' },
          }
          prDetailWS.getRow(8).font = {
            bold: true,
            size: 14,
            color: { argb: '#101828' },
          }
        }

        // ======================== 10-11 ========================
        if (paymentType === 'TE') {
          prDetailWS.getCell('A10').value = 'Travel Expenses State'
          prDetailWS.getCell('A11').value = 'Finance transfer to Traveler'
          prDetailWS.mergeCells(`A11:B11`)
          prDetailWS.getCell('A11').alignment = {
            vertical: 'middle',
            horizontal: 'left',
            wrapText: true,
          }

          prDetailWS.getCell('D10').value = 'Advance Perdiem Fee'
          prDetailWS.getCell('D11').value = prDetail?.number.replace(/\s/g, '').toUpperCase()
          prDetailWS.mergeCells(`D11:F11`)
          prDetailWS.getCell('D11').alignment = {
            vertical: 'middle',
            horizontal: 'left',
            wrapText: true,
          }

          prDetailWS.getCell('H10').value = 'Estimated Payment Date'
          prDetailWS.getCell('H11').value = dayjs(prDetail.expected_payment_date).format('dddd, DD MMM YYYY')
          prDetailWS.mergeCells(`H11:I11`)
          prDetailWS.getCell('H11').alignment = {
            vertical: 'middle',
            horizontal: 'left',
            wrapText: true,
          }

          prDetailWS.getCell('J10').value = 'Bank Information'
          prDetailWS.getCell('J11').value = 'See Worksheet: Bank Information'

          // Bank offcanvas / new worksheet
          showBankInformation()

          prDetailWS.getRow(10).font = {
            size: 12,
            color: { argb: '#667085' },
          }
          prDetailWS.getRow(11).font = {
            bold: true,
            size: 14,
            color: { argb: '#101828' },
          }
        } else {
          const vendorTypes = () => {
            const localVendorTypes = []
            prDetail.projects.map((project) =>
              project.activities.map((activity) =>
                activity.budgets.map((budget) => {
                  localVendorTypes.push(budget.vendor_category_information.name)
                }),
              ),
            )
            return [...new Set(localVendorTypes)]
          }

          prDetailWS.getCell('A10').value = 'Finance Request Code'
          prDetailWS.getCell('A11').value = prDetail.number.replace(/\s/g, '').toUpperCase()
          prDetailWS.mergeCells(`A11:B11`)
          prDetailWS.getCell('A11').alignment = {
            vertical: 'middle',
            horizontal: 'left',
            wrapText: true,
          }

          prDetailWS.getCell('D10').value = 'Vendor Category'
          prDetailWS.getCell('D11').value = vendorTypes().join(', ')
          prDetailWS.mergeCells(`D11:F11`)
          prDetailWS.getCell('D11').alignment = {
            vertical: 'middle',
            horizontal: 'left',
            wrapText: true,
          }
          if (paymentType === 'PR' || paymentType === 'APS') {
            prDetailWS.getCell('H10').value = 'Vendor Information'
            prDetailWS.getCell('H11').value = 'See worksheet: Vendor Information'
            prDetailWS.mergeCells(`H11:J11`)
            prDetailWS.getCell('H11').alignment = {
              vertical: 'middle',
              horizontal: 'left',
              wrapText: true,
            }

            // WORKBOOK
            // Vendor Information Offcanvas
            const vendorInformationWS = workbook.addWorksheet(workSheetNameVendorInformation)
            vendorInformationWS.getCell('A1').value = workSheetNameVendorInformation
            vendorInformationWS.getCell('A2').value = prDetail.number.replace(/\s/g, '').toUpperCase()

            vendorInformationWS.getCell('A4').value = 'DETAIL INFORMATION'
            vendorInformationWS.mergeCells('A4:B4')

            vendorInformationWS.getCell('A5').value = 'Vendor Name'
            vendorInformationWS.getCell('B5').value = vendorDetail?.vendor_information['name'] || '-'
            vendorInformationWS.getCell('A5').alignment = {
              horizontal: 'left',
              vertical: 'middle',
            }
            vendorInformationWS.getCell('B5').alignment = {
              wrapText: true,
            }

            // File loop indexing
            // NPWP
            if (vendorDetail?.vendor_information['npwp_path']) {
              for (const file of vendorDetail?.vendor_information['npwp_path']) {
                vendorInformationWS.getCell('A6').value = 'NPWP'
                vendorInformationWS.getCell('B6').value = file.split('/')[1] || '-'
                const fileUrl = await getOriginalUrlFile(file)
                attachmentFiles.push({
                  name: `${paymentIdentifier()}/${file.split('/')[1]}`,
                  url: fileUrl,
                })
                vendorInformationWS.getCell('A6').alignment = {
                  horizontal: 'left',
                  vertical: 'middle',
                }
                vendorInformationWS.getCell('B6').alignment = {
                  wrapText: true,
                }
              }
            } else {
              vendorInformationWS.getCell('A6').value = 'NPWP'
              vendorInformationWS.getCell('B6').value = '-'
            }
            // Nationality Card
            if (vendorDetail?.vendor_information['identity_path']) {
              for (const file of vendorDetail?.vendor_information['identity_path']) {
                vendorInformationWS.getCell('A7').value = 'Nationality Card'
                vendorInformationWS.getCell('B7').value = file.split('/')[1] || '-'
                const fileUrl = await getOriginalUrlFile(file)
                attachmentFiles.push({
                  name: `${paymentIdentifier()}/${file.split('/')[1]}`,
                  url: fileUrl,
                })
                vendorInformationWS.getCell('A7').alignment = {
                  horizontal: 'left',
                  vertical: 'middle',
                }
                vendorInformationWS.getCell('B7').alignment = {
                  wrapText: true,
                }
              }
            } else {
              vendorInformationWS.getCell('A7').value = 'Nationality Card'
              vendorInformationWS.getCell('B7').value = '-'
            }
            // Surat Izin Mengemudi (SIM)
            if (vendorDetail?.vendor_information['driving_license_path']) {
              for (const file of vendorDetail?.vendor_information['driving_license_path']) {
                vendorInformationWS.getCell('A8').value = 'Surat Izin Mengemudi (SIM)'
                vendorInformationWS.getCell('B8').value = file.split('/')[1] || '-'
                const fileUrl = await getOriginalUrlFile(file)
                attachmentFiles.push({
                  name: `${paymentIdentifier()}/${file.split('/')[1]}`,
                  url: fileUrl,
                })
                vendorInformationWS.getCell('A8').alignment = {
                  horizontal: 'left',
                  vertical: 'middle',
                }
                vendorInformationWS.getCell('B8').alignment = {
                  wrapText: true,
                }
              }
            } else {
              vendorInformationWS.getCell('A8').value = 'Surat Izin Mengemudi (SIM)'
              vendorInformationWS.getCell('B8').value = '-'
            }
            // Surat Tanda Nomor Kendaraan (STNK)
            if (vendorDetail?.vendor_information['vechile_registration_path']) {
              for (const file of vendorDetail?.vendor_information['vechile_registration_path']) {
                vendorInformationWS.getCell('A9').value = 'Surat Tanda Nomor Kendaraan (STNK)'
                vendorInformationWS.getCell('B9').value = file.split('/')[1] || '-'
                const fileUrl = await getOriginalUrlFile(file)
                attachmentFiles.push({
                  name: `${paymentIdentifier()}/${file.split('/')[1]}`,
                  url: fileUrl,
                })
                vendorInformationWS.getCell('A9').alignment = {
                  horizontal: 'left',
                  vertical: 'middle',
                }
                vendorInformationWS.getCell('B9').alignment = {
                  wrapText: true,
                }
              }
            } else {
              vendorInformationWS.getCell('A9').value = 'Surat Tanda Nomor Kendaraan (STNK)'
              vendorInformationWS.getCell('B9').value = '-'
            }
            // Curriculum Vitae (CV)
            if (vendorDetail?.vendor_information['cv_path']) {
              for (const file of vendorDetail?.vendor_information['cv_path']) {
                vendorInformationWS.getCell('A10').value = 'Curriculum Vitae (CV)'
                vendorInformationWS.getCell('B10').value = file.split('/')[1] || '-'
                const fileUrl = await getOriginalUrlFile(file)
                attachmentFiles.push({
                  name: `${paymentIdentifier()}/${file.split('/')[1]}`,
                  url: fileUrl,
                })
                vendorInformationWS.getCell('A10').alignment = {
                  horizontal: 'left',
                  vertical: 'middle',
                }
                vendorInformationWS.getCell('B10').alignment = {
                  wrapText: true,
                }
              }
            } else {
              vendorInformationWS.getCell('A10').value = 'Curriculum Vitae (CV)'
              vendorInformationWS.getCell('B10').value = '-'
            }
            // Certificate of Domicile (CoD)
            if (vendorDetail?.vendor_information['cod_path']) {
              for (const file of vendorDetail?.vendor_information['cod_path']) {
                vendorInformationWS.getCell('A11').value = 'Certificate of Domicile (CoD)'
                vendorInformationWS.getCell('B11').value = file.split('/')[1] || '-'
                const fileUrl = await getOriginalUrlFile(file)
                attachmentFiles.push({
                  name: `${paymentIdentifier()}/${file.split('/')[1]}`,
                  url: fileUrl,
                })
                vendorInformationWS.getCell('A11').alignment = {
                  horizontal: 'left',
                  vertical: 'middle',
                }
                vendorInformationWS.getCell('B11').alignment = {
                  wrapText: true,
                }
              }
            } else {
              vendorInformationWS.getCell('A11').value = 'Certificate of Domicile (CoD)'
              vendorInformationWS.getCell('B11').value = '-'
            }
            // Additional Documents
            if (vendorDetail?.vendor_information['other_path']) {
              let lastRow = 11
              for (const file of vendorDetail?.vendor_information['other_path']) {
                const indexing = lastRow++
                vendorInformationWS.getCell(`A${indexing}`).value = 'Additional Documents'
                vendorInformationWS.getCell(`B${indexing}`).value = file.split('/')[1] || '-'
                const otherDocFileUrl = await getOriginalUrlFile(file)
                attachmentFiles.push({
                  name: `${paymentIdentifier()}/${file.split('/')[1]}`,
                  url: otherDocFileUrl,
                })
                vendorInformationWS.getCell(`A${indexing}`).alignment = {
                  horizontal: 'left',
                  vertical: 'middle',
                }
                vendorInformationWS.getCell(`B${indexing}`).alignment = {
                  wrapText: true,
                }
              }
              vendorInformationWS.mergeCells('A12', `A${lastRow}`)
            }

            // Style vendor information worksheet
            vendorInformationWS.getRow(1).font = {
              bold: true,
              size: 16,
            }
            vendorInformationWS.getRow(2).font = {
              size: 14,
              color: { argb: '#101828' },
            }
            vendorInformationWS.getCell(`A4`).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: '#fce5cd' },
            }
            vendorInformationWS.getCell(`A4`).alignment = {
              vertical: 'middle',
              horizontal: 'center',
            }
            vendorInformationWS.getRow(4).height = 22

            vendorInformationWS.getColumn('A').width = 35
            vendorInformationWS.getColumn('B').width = 90
          }

          if (paymentType === 'APR') {
            prDetailWS.getCell('H10').value = 'Estimated Deadline Date to Spend the Money'
            prDetailWS.getCell('H11').value = prDetail.spending_deadline
              ? dayjs(prDetail.spending_deadline).format('ddd, DD MMM YYYY')
              : '-'
            prDetailWS.mergeCells(`H11:J11`)
            prDetailWS.getCell('H11').alignment = {
              vertical: 'middle',
              horizontal: 'left',
              wrapText: true,
            }
          }

          if (paymentType === 'APF') {
            prDetailWS.getCell('H10').value = 'Estimated Travel Done'
            prDetailWS.getCell('H11').value = prDetail.travel_end_date_estimation
              ? dayjs(prDetail.travel_end_date_estimation).format('ddd, DD MMM YYYY')
              : '-'
            prDetailWS.mergeCells(`H11:J11`)
            prDetailWS.getCell('H11').alignment = {
              vertical: 'middle',
              horizontal: 'left',
              wrapText: true,
            }
          }

          prDetailWS.getRow(10).font = {
            size: 12,
            color: { argb: '#667085' },
          }
          prDetailWS.getRow(11).font = {
            bold: true,
            size: 14,
            color: { argb: '#101828' },
          }
        }

        // ======================== 13-14 ========================
        if (paymentType === 'PR' || paymentType === 'APS') {
          const statement = () => {
            const REAL_PAYMENT = calculateTotalBudget(prDetail)
            const APR = calculateTotalAdvancePaymentRequest(prDetail)
            if (APR > REAL_PAYMENT) {
              return 'Money Settlement'
            } else if (APR === REAL_PAYMENT) {
              return 'Report Closure'
            } else if (APR < REAL_PAYMENT) {
              return 'Payment Request'
            }
          }

          if (paymentType === 'PR') {
            prDetailWS.getCell('A13').value = 'Payment Date'
            prDetailWS.getCell('A14').value = dayjs(prDetail.expected_payment_date).format('ddd, DD MMM YYYY')
          }
          if (paymentType === 'APS') {
            prDetailWS.getCell('A13').value = 'Statement Result'
            prDetailWS.getCell('A14').value = statement()
          }

          prDetailWS.getCell('D13').value = 'Vendor'
          prDetailWS.getCell('D14').value = prDetail.projects[0].activities[0].budgets[0].recommended_vendor

          prDetailWS.getCell('H13').value = 'Bank Information'
          prDetailWS.getCell('H14').value = 'See Worksheet: Bank Information'

          prDetailWS.getRow(13).font = {
            size: 12,
            color: { argb: '#667085' },
          }
          prDetailWS.getRow(14).font = {
            bold: true,
            size: 14,
            color: { argb: '#101828' },
          }
          // Bank offcanvas / new worksheet
          showBankInformation()
        }

        // ================= 14-15 SPECIAL FOR TE ================
        const taxBenchmark = perdiemSettingData?.travel_expense_percentages.non_overnight

        // Tax calculation for non others or the another side this is for transportation
        const nonOtherTaxCalculation = prDetail?.projects.flatMap((activity) =>
          activity.activities.flatMap((budget) => budget.budgets),
        )

        const nonOtherTaxInternalCalculation = nonOtherTaxCalculation
          ?.map((budget) => budget.tax_amount || 0)
          .reduce((acc, cur) => acc + cur, 0)

        // setTotalTaxCalculationForTransportationLevel(
        //   nonOtherTaxInternalCalculation || 0,
        // )
        const totalTaxCalculationForTransportationLevel = nonOtherTaxInternalCalculation

        // Tax calculation for  others
        const otherTaxCalculation = prDetail?.projects.flatMap((activity) =>
          activity.activities.flatMap((budget) =>
            budget.budgets.flatMap((item) => item?.additional_data?.['detail_other']?.flatMap((other) => other)),
          ),
        )

        const otherTaxInternalCalculation = otherTaxCalculation
          ?.map((budget) => budget?.tax_amount || 0)
          .reduce((acc, cur) => acc + cur, 0)
        const totalTaxCalculationForOtherLevel = otherTaxInternalCalculation || 0
        const totalTaxCalculation = (nonOtherTaxInternalCalculation || 0) + (otherTaxInternalCalculation || 0)

        if (paymentType === 'TE') {
          const perdiemTotal = prDetail.projects.flatMap((project) =>
            project.activities.flatMap((activity) => {
              return activity.budgets
                .filter(
                  (item) =>
                    item.vendor_category_information.name === 'Overseas Perdiem' ||
                    item.vendor_category_information.name === 'Normal Perdiem' ||
                    item.vendor_category_information.name === 'Remote Area Perdiem',
                )
                .flatMap((budget) => {
                  const totalPerdiemPerBudget = budget.qty * budget.pkg_qty * budget.unit_cost_value
                  const staticPerdiemTotal = budget.additional_data['static_data'].reduce(
                    (a: number, b: any) => a + b.total,
                    0,
                  )
                  const thp = totalPerdiemPerBudget + staticPerdiemTotal
                  const tax =
                    Math.abs(budget.additional_data['static_data']['3']['tax']) === Math.abs(taxBenchmark)
                      ? budget.qty *
                        budget.unit_cost_value *
                        (budget.pkg_qty - budget.additional_data['static_data']['3']['pkg_qty']) *
                        (travellerPerdiemTax / 100)
                      : budget.qty * budget.unit_cost_value * budget.pkg_qty * (travellerPerdiemTax / 100)

                  const finalTotal = thp - tax - budget.additional_data['apf']

                  // console.log('thp', thp)
                  // console.log('tax', tax)
                  // console.log('apfTotal', budget.additional_data['apf'])

                  return finalTotal
                })
            }),
          )

          // Calculation
          const totalTravelExpenses = // Perdiem
            Number(perdiemTotal) +
            // Transportation
            Number(
              prDetail.projects
                .flatMap((project) =>
                  project.activities.flatMap((activity) =>
                    activity.budgets
                      .filter((budget) => budget.vendor_category_information.name === 'Transportation')
                      .flatMap((budget) => budget.additional_data['total_expenses_real']),
                  ),
                )
                .reduce((accumulator, currentValue) => accumulator + currentValue, 0),
            ) +
            // Other
            Number(
              prDetail.projects
                .flatMap((project) =>
                  project.activities.flatMap((activity) =>
                    activity.budgets
                      .filter((budget) => budget.vendor_category_information.name === 'Other')
                      ?.flatMap((budget) =>
                        budget.additional_data['detail_other']?.flatMap((budgetOther) => budgetOther.total_expenses),
                      ),
                  ),
                )
                .reduce((accumulator, currentValue) => accumulator + currentValue, 0),
            ) -
            totalTaxCalculation

          const transportation = prDetail.projects
            .flatMap((project) =>
              project.activities.flatMap((activity) =>
                activity.budgets
                  .filter((budget) => budget.vendor_category_information.name === 'Transportation')
                  .flatMap((budget) => budget.additional_data['total_expenses_real']),
              ),
            )
            .reduce((accumulator, currentValue) => accumulator + currentValue, 0)

          const others = prDetail.projects
            .flatMap((project) =>
              project.activities.flatMap((activity) =>
                activity.budgets
                  .filter((budget) => budget.vendor_category_information.name === 'Other')
                  ?.flatMap((budget) =>
                    budget.additional_data?.['detail_other']?.flatMap((budgetOther) => budgetOther.total_expenses),
                  ),
              ),
            )
            .reduce((accumulator, currentValue) => accumulator + currentValue, 0)

          prDetailWS.getCell('A14').value = 'Total Travel Expenses'
          prDetailWS.getCell('A15').value = totalTravelExpenses
          prDetailWS.mergeCells('A15:B15')
          prDetailWS.getCell('A15').numFmt = IDRCurrencyFormat
          prDetailWS.getCell('A15').font = {
            size: 20,
            bold: true,
          }
          prDetailWS.getCell('A15').alignment = {
            vertical: 'middle',
            horizontal: 'left',
          }

          prDetailWS.getCell('C14').value = 'Perdiem'
          prDetailWS.getCell('C15').value = Number(perdiemTotal)
          prDetailWS.getCell('C15').numFmt = IDRCurrencyFormat
          prDetailWS.getCell('C15').font = {
            size: 14,
            bold: true,
          }
          prDetailWS.getCell('C15').alignment = {
            vertical: 'middle',
            horizontal: 'left',
          }
          prDetailWS.mergeCells('C15:D15')

          prDetailWS.getCell('E14').value = 'Transport'
          prDetailWS.getCell('E15').value = transportation
          prDetailWS.getCell('E15').numFmt = IDRCurrencyFormat
          prDetailWS.mergeCells('E15:F15')
          prDetailWS.getCell('E15').font = {
            size: 14,
            bold: true,
          }
          prDetailWS.getCell('E15').alignment = {
            vertical: 'middle',
            horizontal: 'left',
          }

          prDetailWS.getCell('H14').value = 'Others'
          prDetailWS.getCell('H15').value = others
          prDetailWS.getCell('H15').numFmt = IDRCurrencyFormat
          prDetailWS.getCell('H15').font = {
            size: 14,
            bold: true,
          }
          prDetailWS.getCell('H15').alignment = {
            vertical: 'middle',
            horizontal: 'left',
          }

          prDetailWS.getCell('J14').value = 'Pajak'
          prDetailWS.getCell('J15').value = totalTaxCalculation
          prDetailWS.getCell('J15').numFmt = IDRCurrencyFormat
          prDetailWS.getCell('J15').font = {
            size: 14,
            bold: true,
          }
          prDetailWS.getCell('J15').alignment = {
            vertical: 'middle',
            horizontal: 'left',
          }
          prDetailWS.mergeCells('J15:K15')
        }

        // ======================== 16-17 ========================
        if (paymentType !== 'APS') {
          if (paymentType === 'PR') {
            prDetailWS.getCell('A16').value = 'Transfer Amount'
            prDetailWS.getCell('A17').value = calculateTotalBudget(prDetail) - totalTaxCalculationInternalNonTE
            prDetailWS.getCell('A17').numFmt = IDRCurrencyFormat
            prDetailWS.mergeCells('A17:B17')
            prDetailWS.getCell('A17').alignment = {
              vertical: 'middle',
              horizontal: 'left',
            }
          }
          // D16-D17
          if (paymentType === 'PR') {
            prDetailWS.getCell('D16').value = 'Total Payment Requested'
            prDetailWS.getCell('D17').value = calculateTotalBudget(prDetail)
            prDetailWS.getCell('D17').numFmt = IDRCurrencyFormat
            prDetailWS.mergeCells('D17:E17')
            prDetailWS.getCell('D17').alignment = {
              vertical: 'middle',
              horizontal: 'left',
            }
          }
          // if (paymentType === 'APR') {
          //   prDetailWS.getCell('D16').value = 'Requester Bank Information'
          //   prDetailWS.getCell('D17').value =
          //     'See Worksheet: Requester Bank Information'
          // }

          // F16-F17
          if (paymentType === 'PR') {
            prDetailWS.getCell('H16').value = 'Pajak'
            prDetailWS.getCell('H17').value = totalTaxCalculationInternalNonTE
            prDetailWS.getCell('H17').numFmt = IDRCurrencyFormat
            prDetailWS.mergeCells('H17:I17')
            prDetailWS.getCell('H17').alignment = {
              vertical: 'middle',
              horizontal: 'left',
            }
          }
        } else {
          // APS
          prDetailWS.getCell('A16').value = 'Total Payment Used/Requested'
          prDetailWS.getCell('A17').value = calculateTotalBudget(prDetail)
          prDetailWS.getCell('A17').numFmt = IDRCurrencyFormat
          prDetailWS.mergeCells('A17:B17')
          prDetailWS.getCell('A17').font = {
            size: 20,
          }
          prDetailWS.getCell('A17').alignment = {
            vertical: 'middle',
            horizontal: 'left',
          }

          prDetailWS.getCell('D16').value = 'Pajak'
          prDetailWS.getCell('D17').value = totalTaxCalculationInternalNonTE
          prDetailWS.getCell('D17').numFmt = IDRCurrencyFormat
          prDetailWS.mergeCells('D17:E17')
          prDetailWS.getCell('D17').alignment = {
            vertical: 'middle',
            horizontal: 'left',
          }

          prDetailWS.getCell('H16').value = 'Total Advance Payment'
          prDetailWS.getCell('H17').value = calculateTotalAdvancePaymentRequest(prDetail) || 0
          prDetailWS.getCell('H17').numFmt = IDRCurrencyFormat
          prDetailWS.mergeCells('H17:I17')
          prDetailWS.getCell('H17').alignment = {
            vertical: 'middle',
            horizontal: 'left',
          }
        }

        prDetailWS.getRow(16).font = {
          size: 12,
          color: { argb: '#667085' },
        }
        prDetailWS.getRow(17).font = {
          bold: true,
          size: 14,
          color: { argb: '#101828' },
        }

        // ======================== 20-21 ========================
        if (paymentType === 'APR' || paymentType === 'APS' || paymentType === 'APF') {
          if (paymentType === 'APR') {
            prDetailWS.getCell('A20').value = 'Transfer Amount'
            prDetailWS.getCell('A21').value = calculateTotalAdvancePaymentRequest(prDetail) || 0

            prDetailWS.getCell('D20').value = 'Requester Bank Information'
            prDetailWS.getCell('D21').value = 'See worksheet: Bank Information'
            prDetailWS.mergeCells('D21:G21')
            // Bank offcanvas / new worksheet
            showBankInformation()
          }

          if (paymentType === 'APS') {
            prDetailWS.getCell('A20').value = 'Money to Processed'
            prDetailWS.getCell('A21').value =
              calculateTotalBudget(prDetail) -
              totalTaxCalculationInternalNonTE -
              (calculateTotalAdvancePaymentRequest(prDetail) || 0)

            // Download Finance Process Attachment
            const url = JSON.parse(prDetail.report_documents as unknown as string)[0]

            const backgroundDocFileUrl = await getOriginalUrlFile(url)
            attachmentFiles.push({
              name: `${paymentIdentifier()}/${url.split('/')[1]}`,
              url: backgroundDocFileUrl,
            })

            prDetailWS.getCell('D20').value = 'Finance Process Attachment'
            prDetailWS.getCell('D21').value = `See file: ${url.split('/')[1]}`
            prDetailWS.mergeCells('D21:I21')
          }

          if (paymentType === 'APF') {
            prDetailWS.getCell('A20').value = 'Total Advance Perdiem Fee'
            prDetailWS.getCell('A21').value = calculateTotalAdvancePaymentRequest(prDetail) || 0

            prDetailWS.getCell('D20').value = 'Requester Bank Information'
            prDetailWS.getCell('D21').value = 'See worksheet: Bank Information'
            prDetailWS.mergeCells('D21:G21')
            // Bank offcanvas / new worksheet
            showBankInformation()
          }

          prDetailWS.getRow(20).font = {
            size: 12,
            color: { argb: '#667085' },
          }
          prDetailWS.getRow(21).font = {
            bold: true,
            size: 14,
            color: { argb: '#101828' },
          }
          prDetailWS.getCell('A21').alignment = {
            vertical: 'middle',
            horizontal: 'left',
          }
          prDetailWS.getCell('D21').alignment = {
            wrapText: true,
            vertical: 'middle',
            horizontal: 'left',
          }
          prDetailWS.getCell('A21').numFmt = IDRCurrencyFormat
          prDetailWS.mergeCells('A21:B21')
          prDetailWS.getCell('A21').font = {
            size: 20,
            bold: true,
          }
        }

        // ======================== 24-25 ========================
        const checkFinanceStatus = () => {
          if (prDetail.finance_checking_process_status === null) {
            return 'Waiting Finance Team'
          } else if (prDetail.finance_checking_process_status === PRFinanceCheckingStatus.CHECKING) {
            return 'Ongoing Checking the Documents'
          } else if (prDetail.finance_checking_process_status === PRFinanceCheckingStatus.CHECKED) {
            return 'Done Check'
          } else if (prDetail.finance_checking_process_status === PRFinanceCheckingStatus.REVISION) {
            return 'Rejected'
          }
        }

        const pmApproval = () => {
          if (
            prDetail.program_manager_approval === PRApprovalStatus.PENDING &&
            prDetail.finance_checking_process_status === null
          ) {
            return 'Waiting Checking Process Done'
          } else {
            return (
              {
                approved: PRApprovalStatus.APPROVED,
                pending: 'Pending Approval',
                rejected: 'Rejected',
              }[prDetail.program_manager_approval] || 'No Status'
            )
          }
        }

        const bcApproval = () => {
          if (
            prDetail.budget_controller_approval === PRApprovalStatus.PENDING &&
            prDetail.finance_checking_process_status === null
          ) {
            return 'Waiting Checking Process Done'
          } else {
            return (
              {
                approved: PRApprovalStatus.APPROVED,
                pending: 'Pending Approval',
                rejected: 'Rejected',
              }[prDetail.budget_controller_approval] || 'No Status'
            )
          }
        }

        const financeTeamProcessApproval = () => {
          if (prDetail.processed_by === null) {
            return 'Waiting Finance Team to Mark this Payment'
          } else if (prDetail.processed_by !== null) {
            if (prDetail.paid_at) {
              return 'Done Process'
            } else {
              return 'Wait for Process Done'
            }
          }
        }

        // Approval grids
        prDetailWS.getCell('A24').value = 'Requested by'
        prDetailWS.getCell('A25').value = prDetail.requested_by.name
        prDetailWS.getCell('A26').value = 'Submitted'

        prDetailWS.getCell('C24').value = 'Finance Checker'
        prDetailWS.getCell('C25').value =
          prDetail.finance_checking_process_status === null ? 'Finance Team' : prDetail.finance_checking_process_by.name
        prDetailWS.getCell('C26').value = checkFinanceStatus()

        prDetailWS.getCell('E24').value = 'Project Manager'
        prDetailWS.getCell('E25').value = programDetail?.program_manager?.full_name || '-'
        prDetailWS.getCell('E26').value = capitalizeFirstLetter(pmApproval())

        prDetailWS.getCell('H24').value = 'Budget Controller'
        prDetailWS.getCell('H25').value = '-'
        prDetailWS.getCell('H26').value = '-'

        prDetailWS.getCell('J24').value = 'Finance Team Process'
        prDetailWS.getCell('J25').value =
          prDetail.processed_by === null ? 'Waiting Finance Team' : prDetail.processed_by.name
        prDetailWS.getCell('J26').value = financeTeamProcessApproval()

        prDetailWS.getRow(24).font = {
          size: 12,
          color: { argb: '#667085' },
        }
        prDetailWS.getRow(25).font = {
          bold: true,
          size: 14,
          color: { argb: '#101828' },
        }

        // ======================== 28-X ========================
        const defaultActivity = 28
        let defaulttravelInformationGridTitle = 0
        let defaulttravelInformationGridValue = 0
        let defaultTable = 0

        if (paymentType === 'TE') {
          defaulttravelInformationGridTitle = 29
          defaulttravelInformationGridValue = 30
          defaultTable = 32
        } else {
          defaultTable = 29
        }

        let indexPerdiem = 0
        let indexOther = 0
        let indexTransportation = 0

        prDetail.projects.map((project, projectIndex) => {
          project.activities.map((activity, activityIndex) => {
            const index = projectIndex + activityIndex
            const activityFormula = defaultActivity + 5 * index
            const travelInformationTitleFormula = defaulttravelInformationGridTitle + 5 * index
            const travelInformationValueFormula = defaulttravelInformationGridValue + 5 * index
            const tableDataFormula = defaultTable + 5 * index

            const calculatePerActivity = () => {
              if (paymentType === 'APR') {
                return calculateAdvancePaymentPerActivity(activity.budgets)
              } else {
                return calculateUnitCostPerActivity(activity)
              }
            }

            // Activity
            prDetailWS.getCell(`A${activityFormula}`).value = activity.code
            prDetailWS.getCell(`B${activityFormula}`).value = activity.description

            if (paymentType === 'PR') {
              prDetailWS.getCell(`L${activityFormula}`).value = calculatePerActivity()
              prDetailWS.getCell(`L${activityFormula}`).numFmt = IDRCurrencyFormat
              prDetailWS.getCell(`L${activityFormula}`).alignment = {
                horizontal: 'right',
                vertical: 'middle',
              }
            } else {
              if (paymentType !== 'TE') {
                prDetailWS.getCell(`K${activityFormula}`).value = calculatePerActivity()
                prDetailWS.getCell(`K${activityFormula}`).numFmt = IDRCurrencyFormat
                prDetailWS.getCell(`K${activityFormula}`).alignment = {
                  horizontal: 'right',
                  vertical: 'middle',
                }
              }
            }

            if (activity.budgets.length > 0) {
              if (paymentType === 'TE') {
                let perdiemTotalRows = 0
                let otherTotalRows = 0

                const dynamicDataTableRowsTravel = activity.budgets.map((budget, budgetIndex) => {
                  // ======================   dynamicDataTableRowsTravel:PERDIEM   ======================
                  if (
                    budget.vendor_category_information.name === 'Overseas Perdiem' ||
                    budget.vendor_category_information.name === 'Normal Perdiem' ||
                    budget.vendor_category_information.name === 'Remote Area Perdiem'
                  ) {
                    // Vendor Category
                    prDetailWS.getCell(`A${travelInformationTitleFormula + 5 * budgetIndex}`).value = 'Vendor Category'
                    prDetailWS.getCell(`A${travelInformationValueFormula + 5 * budgetIndex}`).value =
                      budget.vendor_category_information.name
                    prDetailWS.getCell(`A${travelInformationTitleFormula + 5 * budgetIndex}`).font = {
                      size: 12,
                      color: { argb: '#667085' },
                    }
                    prDetailWS.getCell(`A${travelInformationValueFormula + 5 * budgetIndex}`).font = {
                      bold: true,
                      size: 14,
                      color: { argb: '#101828' },
                    }

                    // Total Hak Perdiem
                    prDetailWS.getCell(`C${travelInformationTitleFormula + 5 * budgetIndex}`).value =
                      'Total Hak Perdiem'
                    prDetailWS.getCell(`C${travelInformationValueFormula + 5 * budgetIndex}`).value =
                      budget.qty * budget.pkg_qty * budget.unit_cost_value +
                      budget.additional_data['static_data'].reduce((a, b) => a + b.total, 0)
                    prDetailWS.getCell(`C${travelInformationValueFormula + 5 * budgetIndex}`).numFmt = IDRCurrencyFormat
                    prDetailWS.getCell(`C${travelInformationTitleFormula + 5 * budgetIndex}`).font = {
                      size: 12,
                      color: { argb: '#667085' },
                    }
                    prDetailWS.getCell(`C${travelInformationValueFormula + 5 * budgetIndex}`).font = {
                      bold: true,
                      size: 14,
                      color: { argb: '#101828' },
                    }
                    // prDetailWS.mergeCells('C24:D24')

                    // Pajak
                    prDetailWS.getCell(`E${travelInformationTitleFormula + 5 * budgetIndex}`).value = `Pajak (${
                      Math.abs(budget.additional_data['static_data']['3']['tax']) === Math.abs(taxBenchmark)
                        ? 'Menginap'
                        : 'Perjalanan'
                    }) - ${travellerPerdiemTax} %`
                    prDetailWS.getCell(`E${travelInformationValueFormula + 5 * budgetIndex}`).value =
                      Math.abs(budget.additional_data['static_data']['3']['tax']) === Math.abs(taxBenchmark)
                        ? budget.qty *
                          budget.unit_cost_value *
                          (budget.pkg_qty - budget.additional_data['static_data']['3']['pkg_qty']) *
                          (travellerPerdiemTax / 100)
                        : budget.qty * budget.unit_cost_value * budget.pkg_qty * (travellerPerdiemTax / 100)
                    prDetailWS.getCell(`E${travelInformationTitleFormula + 5 * budgetIndex}`).font = {
                      size: 12,
                      color: { argb: '#667085' },
                    }
                    prDetailWS.getCell(`E${travelInformationValueFormula + 5 * budgetIndex}`).font = {
                      bold: true,
                      size: 14,
                      color: { argb: '#101828' },
                    }
                    prDetailWS.getCell(`E${travelInformationValueFormula + 5 * budgetIndex}`).numFmt = IDRCurrencyFormat
                    prDetailWS.getCell(`E${travelInformationValueFormula + 5 * budgetIndex}`).alignment = {
                      vertical: 'middle',
                      horizontal: 'left',
                    }

                    // Advance Perdiem Fee
                    prDetailWS.getCell(`H${travelInformationTitleFormula + 5 * budgetIndex}`).value =
                      'Advance Perdiem Fee'
                    prDetailWS.getCell(`H${travelInformationValueFormula + 5 * budgetIndex}`).value =
                      budget.additional_data['apf']

                    prDetailWS.getCell(`H${travelInformationTitleFormula + 5 * budgetIndex}`).font = {
                      size: 12,
                      color: { argb: '#667085' },
                    }
                    prDetailWS.getCell(`H${travelInformationValueFormula + 5 * budgetIndex}`).font = {
                      bold: true,
                      size: 14,
                      color: { argb: '#101828' },
                    }
                    prDetailWS.getCell(`H${travelInformationValueFormula + 5 * budgetIndex}`).numFmt = IDRCurrencyFormat
                    prDetailWS.getCell(`H${travelInformationValueFormula + 5 * budgetIndex}`).alignment = {
                      vertical: 'middle',
                      horizontal: 'left',
                    }

                    // Terima Bersih
                    prDetailWS.getCell(`J${travelInformationTitleFormula + 5 * budgetIndex}`).value = 'Terima Bersih'
                    prDetailWS.getCell(`J${travelInformationValueFormula + 5 * budgetIndex}`).value = // THP
                      budget.qty * budget.pkg_qty * budget.unit_cost_value +
                      budget.additional_data['static_data'].reduce((a, b) => a + b.total, 0) -
                      // Tax
                      (Math.abs(budget.additional_data['static_data']['3']['tax']) === Math.abs(taxBenchmark)
                        ? budget.qty *
                          budget.unit_cost_value *
                          (budget.pkg_qty - budget.additional_data['static_data']['3']['pkg_qty']) *
                          (travellerPerdiemTax / 100)
                        : budget.qty * budget.unit_cost_value * budget.pkg_qty * (travellerPerdiemTax / 100)) -
                      // apf
                      budget.additional_data['apf']

                    prDetailWS.getCell(`J${travelInformationTitleFormula + 5 * budgetIndex}`).font = {
                      size: 12,
                      color: { argb: '#667085' },
                    }
                    prDetailWS.getCell(`J${travelInformationValueFormula + 5 * budgetIndex}`).font = {
                      bold: true,
                      size: 14,
                      color: { argb: '#101828' },
                    }
                    prDetailWS.getCell(`J${travelInformationValueFormula + 5 * budgetIndex}`).numFmt = IDRCurrencyFormat
                    prDetailWS.getCell(`J${travelInformationValueFormula + 5 * budgetIndex}`).alignment = {
                      vertical: 'middle',
                      horizontal: 'left',
                    }

                    const columns = [
                      {
                        name: 'No',
                      },
                      {
                        name: 'Description',
                      },
                      {
                        name: 'Qty',
                      },
                      {
                        name: 'Unit',
                      },
                      {
                        name: 'Pckg Qty',
                      },
                      {
                        name: 'Pckg Unit',
                      },
                      {
                        name: 'Unit Cost (Perdiem)',
                      },
                      {
                        name: '%',
                      },
                      {
                        name: 'Total',
                      },
                    ]

                    const initialPerdiemArr = [
                      budget.code.replace(/\.(\d+)$/, '-$1'),
                      budget.description,
                      budget.qty,
                      budget.unit,
                      budget.pkg_qty,
                      budget.pkg_unit,
                      budget.unit_cost_value,
                      '100%',
                      budget.qty * budget.pkg_qty * budget.unit_cost_value,
                    ]

                    const staticPerdiem = budget.additional_data['static_data'].map((staticData) => [
                      '-',
                      staticData.description,
                      budget.qty,
                      budget.unit,
                      staticData.pkg_qty,
                      budget.pkg_unit,
                      budget.unit_cost_value,
                      `${staticData.tax}%`,
                      budget.qty * staticData.pkg_qty * budget.unit_cost_value * (staticData.tax / 100),
                    ])

                    const rows = [initialPerdiemArr, ...staticPerdiem]

                    perdiemTotalRows = rows.length

                    return { rows, columns, prType: 'perdiem' }
                  }

                  // ======================   dynamicDataTableRowsTravel:OTHER   ======================
                  if (budget.vendor_category_information.name.toLowerCase() === 'other') {
                    // Vendor Category
                    prDetailWS.getCell(
                      `A${travelInformationTitleFormula + (perdiemTotalRows * 2 + 1) * budgetIndex}`,
                    ).value = 'Vendor Category'
                    prDetailWS.getCell(
                      `A${travelInformationValueFormula + (perdiemTotalRows * 2 + 1) * budgetIndex}`,
                    ).value = 'Other'

                    prDetailWS.getCell(
                      `A${travelInformationTitleFormula + (perdiemTotalRows * 2 + 1) * budgetIndex}`,
                    ).font = {
                      size: 12,
                      color: { argb: '#667085' },
                    }
                    prDetailWS.getCell(
                      `A${travelInformationValueFormula + (perdiemTotalRows * 2 + 1) * budgetIndex}`,
                    ).font = {
                      bold: true,
                      size: 14,
                      color: { argb: '#101828' },
                    }

                    // Description
                    prDetailWS.getCell(
                      `C${travelInformationTitleFormula + (perdiemTotalRows * 2 + 1) * budgetIndex}`,
                    ).value = 'Description'
                    prDetailWS.getCell(
                      `C${travelInformationValueFormula + (perdiemTotalRows * 2 + 1) * budgetIndex}`,
                    ).value = budget.description
                    prDetailWS.getCell(
                      `C${travelInformationTitleFormula + (perdiemTotalRows * 2 + 1) * budgetIndex}`,
                    ).font = {
                      size: 12,
                      color: { argb: '#667085' },
                    }
                    prDetailWS.getCell(
                      `C${travelInformationValueFormula + (perdiemTotalRows * 2 + 1) * budgetIndex}`,
                    ).font = {
                      bold: true,
                      size: 14,
                      color: { argb: '#101828' },
                    }

                    // Total Requested (from TR)
                    prDetailWS.getCell(
                      `E${travelInformationTitleFormula + (perdiemTotalRows * 2 + 1) * budgetIndex}`,
                    ).value = 'Total Requested (from TR)'
                    prDetailWS.getCell(
                      `E${travelInformationValueFormula + (perdiemTotalRows * 2 + 1) * budgetIndex}`,
                    ).value = project.activities[activityIndex].budgets
                      .filter((budget) => budget.vendor_category_information.name === 'Other')
                      .map((budget) =>
                        budget?.additional_data ? budget?.additional_data['total_requested_from_tr'] || 0 : 0,
                      )
                      .reduce((accumulator, currentValue) => accumulator + Number(currentValue), 0)
                    prDetailWS.getCell(
                      `E${travelInformationTitleFormula + (perdiemTotalRows * 2 + 1) * budgetIndex}`,
                    ).font = {
                      size: 12,
                      color: { argb: '#667085' },
                    }
                    prDetailWS.getCell(
                      `E${travelInformationValueFormula + (perdiemTotalRows * 2 + 1) * budgetIndex}`,
                    ).font = {
                      bold: true,
                      size: 14,
                      color: { argb: '#101828' },
                    }
                    prDetailWS.getCell(
                      `E${travelInformationValueFormula + (perdiemTotalRows * 2 + 1) * budgetIndex}`,
                    ).numFmt = IDRCurrencyFormat
                    prDetailWS.getCell(
                      `E${travelInformationValueFormula + (perdiemTotalRows * 2 + 1) * budgetIndex}`,
                    ).alignment = {
                      vertical: 'middle',
                      horizontal: 'left',
                    }

                    // Total Others Expenses
                    prDetailWS.getCell(
                      `H${travelInformationTitleFormula + (perdiemTotalRows * 2 + 1) * budgetIndex}`,
                    ).value = 'Total Others Expenses'
                    prDetailWS.getCell(
                      `H${travelInformationValueFormula + (perdiemTotalRows * 2 + 1) * budgetIndex}`,
                    ).value = activity.budgets
                      .find((budget) => budget.vendor_category_information.name.toLowerCase() === 'other')
                      .additional_data['detail_other']?.reduce((a, b) => a + Number(b.total_expenses), 0)
                    prDetailWS.getCell(
                      `H${travelInformationTitleFormula + (perdiemTotalRows * 2 + 1) * budgetIndex}`,
                    ).font = {
                      size: 12,
                      color: { argb: '#667085' },
                    }
                    prDetailWS.getCell(
                      `H${travelInformationValueFormula + (perdiemTotalRows * 2 + 1) * budgetIndex}`,
                    ).font = {
                      bold: true,
                      size: 14,
                      color: { argb: '#101828' },
                    }
                    prDetailWS.getCell(
                      `H${travelInformationValueFormula + (perdiemTotalRows * 2 + 1) * budgetIndex}`,
                    ).numFmt = IDRCurrencyFormat
                    prDetailWS.getCell(
                      `H${travelInformationValueFormula + (perdiemTotalRows * 2 + 1) * budgetIndex}`,
                    ).alignment = {
                      vertical: 'middle',
                      horizontal: 'left',
                    }

                    if (prDetail.finance_checking_process_status === PRFinanceCheckingStatus.CHECKED) {
                      // Total Potongan Pajak
                      prDetailWS.getCell(
                        `J${travelInformationTitleFormula + (perdiemTotalRows * 2 + 1) * budgetIndex}`,
                      ).value = 'Total Potongan Pajak'
                      prDetailWS.getCell(
                        `J${travelInformationValueFormula + (perdiemTotalRows * 2 + 1) * budgetIndex}`,
                      ).value = totalTaxCalculationForOtherLevel
                      prDetailWS.getCell(
                        `J${travelInformationTitleFormula + (perdiemTotalRows * 2 + 1) * budgetIndex}`,
                      ).font = {
                        size: 12,
                        color: { argb: '#667085' },
                      }
                      prDetailWS.getCell(
                        `J${travelInformationValueFormula + (perdiemTotalRows * 2 + 1) * budgetIndex}`,
                      ).font = {
                        bold: true,
                        size: 14,
                        color: { argb: '#101828' },
                      }
                      prDetailWS.getCell(
                        `J${travelInformationValueFormula + (perdiemTotalRows * 2 + 1) * budgetIndex}`,
                      ).numFmt = IDRCurrencyFormat
                      prDetailWS.getCell(
                        `J${travelInformationValueFormula + (perdiemTotalRows * 2 + 1) * budgetIndex}`,
                      ).alignment = {
                        vertical: 'middle',
                        horizontal: 'left',
                      }
                    }

                    const columns = [
                      {
                        name: 'No',
                      },
                      {
                        name: 'Description',
                      },
                      {
                        name: 'Qty',
                      },
                      {
                        name: 'Unit',
                      },
                      {
                        name: 'Pckg Qty',
                      },
                      {
                        name: 'Pckg Unit',
                      },
                      {
                        name: 'Unit Cost',
                      },
                      {
                        name: 'Expenses',
                      },
                    ]

                    if (prDetail.finance_checking_process_status === PRFinanceCheckingStatus.CHECKED) {
                      columns.push({
                        name: 'Potongan Pajak',
                      })
                    }

                    let detailOther = budget.additional_data['detail_other'].map((otherDynamic) => [
                      '-',
                      otherDynamic.description,
                      otherDynamic.qty,
                      otherDynamic.unit,
                      otherDynamic.pkg_qty,
                      otherDynamic.pkg_unit,
                      otherDynamic.unit_cost_value,
                      otherDynamic.qty * otherDynamic.pkg_qty * otherDynamic.unit_cost_value,
                      ,
                    ])

                    if (prDetail.finance_checking_process_status === PRFinanceCheckingStatus.CHECKED) {
                      detailOther = detailOther.map((otherDynamic, otherDynamicIndex) => [
                        ...otherDynamic,
                        prDetail?.projects[projectIndex].activities[activityIndex].budgets[budgetIndex].additional_data[
                          'detail_other'
                        ][otherDynamicIndex].tax_amount,
                      ])
                    }

                    const rows = detailOther
                    otherTotalRows = rows.length

                    return { rows, columns, prType: 'other' }
                  }

                  // ======================   dynamicDataTableRowsTravel:TRANSPORTATION   ======================
                  if (budget.vendor_category_information.name.toLowerCase() === 'transportation') {
                    const indexTransportationTitle =
                      travelInformationTitleFormula +
                      (otherTotalRows ? otherTotalRows * 2 + 2 : perdiemTotalRows * 2 + 1) * budgetIndex
                    const indexTransportationValue =
                      travelInformationValueFormula +
                      (otherTotalRows ? otherTotalRows * 2 + 2 : perdiemTotalRows * 2 + 1) * budgetIndex

                    // Vendor Category
                    prDetailWS.getCell(`A${indexTransportationTitle}`).value = 'Vendor Category'
                    prDetailWS.getCell(`A${indexTransportationValue}`).value = 'Transportation'

                    prDetailWS.getCell(`A${indexTransportationTitle}`).font = {
                      size: 12,
                      color: { argb: '#667085' },
                    }
                    prDetailWS.getCell(`A${indexTransportationValue}`).font = {
                      bold: true,
                      size: 14,
                      color: { argb: '#101828' },
                    }

                    // Total Requested (from TR) - Transportation
                    prDetailWS.getCell(`C${indexTransportationTitle}`).value = 'Total Requested (from TR)'
                    prDetailWS.getCell(`C${indexTransportationValue}`).value = calculatePureTotalBudget(
                      activity.budgets.filter(
                        (budget) => budget.vendor_category_information.name.toLowerCase() === 'transportation',
                      ),
                    )
                    prDetailWS.getCell(`C${indexTransportationTitle}`).font = {
                      size: 12,
                      color: { argb: '#667085' },
                    }
                    prDetailWS.getCell(`C${indexTransportationValue}`).font = {
                      bold: true,
                      size: 14,
                      color: { argb: '#101828' },
                    }
                    prDetailWS.getCell(`C${indexTransportationValue}`).numFmt = IDRCurrencyFormat

                    // Total Expenses
                    prDetailWS.getCell(`E${indexTransportationTitle}`).value = 'Total Expenses'
                    prDetailWS.getCell(`E${indexTransportationValue}`).value = project.activities[activityIndex].budgets
                      .filter((budget) => budget.vendor_category_information.name === 'Transportation')
                      .map((budget) => budget.additional_data['total_expenses_real'])
                      .reduce((accumulator, currentValue) => accumulator + currentValue, 0)
                    prDetailWS.getCell(`E${indexTransportationTitle}`).font = {
                      size: 12,
                      color: { argb: '#667085' },
                    }
                    prDetailWS.getCell(`E${indexTransportationValue}`).font = {
                      bold: true,
                      size: 14,
                      color: { argb: '#101828' },
                    }
                    prDetailWS.getCell(`E${indexTransportationValue}`).numFmt = IDRCurrencyFormat
                    prDetailWS.getCell(`E${indexTransportationValue}`).alignment = {
                      vertical: 'middle',
                      horizontal: 'left',
                    }

                    if (prDetail.finance_checking_process_status === PRFinanceCheckingStatus.CHECKED) {
                      // Total Potongan Pajak
                      prDetailWS.getCell(`H${indexTransportationTitle}`).value = 'Total Potongan Pajak'
                      prDetailWS.getCell(`H${indexTransportationValue}`).value =
                        totalTaxCalculationForTransportationLevel
                      prDetailWS.getCell(`H${indexTransportationTitle}`).font = {
                        size: 12,
                        color: { argb: '#667085' },
                      }
                      prDetailWS.getCell(`H${indexTransportationValue}`).font = {
                        bold: true,
                        size: 14,
                        color: { argb: '#101828' },
                      }
                      prDetailWS.getCell(`H${indexTransportationValue}`).numFmt = IDRCurrencyFormat
                      prDetailWS.getCell(`H${indexTransportationValue}`).alignment = {
                        vertical: 'middle',
                        horizontal: 'left',
                      }
                    }

                    const columns = [
                      {
                        name: 'No',
                      },
                      {
                        name: 'Description',
                      },
                      {
                        name: 'Qty',
                      },
                      {
                        name: 'Unit',
                      },
                      {
                        name: 'Pckg Qty',
                      },
                      {
                        name: 'Pckg Unit',
                      },
                      {
                        name: 'Unit Cost',
                      },
                      {
                        name: 'Requested (TR)',
                      },
                      {
                        name: 'Expenses',
                      },
                    ]

                    if (prDetail.finance_checking_process_status === PRFinanceCheckingStatus.CHECKED) {
                      columns.push({
                        name: 'Potongan Pajak',
                      })
                    }

                    let transportationList = [
                      budget.code.replace(/\.(\d+)$/, '-$1'),
                      budget.description,
                      budget.qty,
                      budget.unit,
                      budget.pkg_qty,
                      budget.pkg_unit,
                      budget.unit_cost_value,
                      budget.qty * budget.pkg_qty * budget.unit_cost_value,
                      Number(budget.additional_data['total_expenses_real']),
                    ]

                    if (prDetail.finance_checking_process_status === PRFinanceCheckingStatus.CHECKED) {
                      transportationList = [...transportationList, budget.tax_amount || 0]
                    }

                    const rows = [transportationList]

                    return { rows, columns, prType: 'transportation' }
                  }
                })

                dynamicDataTableRowsTravel.map((tableRow, tableRowIndex) => {
                  if (tableRow !== undefined) {
                    if (tableRow.prType === 'perdiem') {
                      prDetailWS.addTable({
                        name: `Perdiem Table Static + Dynamic`,
                        ref: `A${tableDataFormula + tableRowIndex * 7}`,
                        headerRow: true,
                        columns: tableRow['columns'],
                        rows: tableRow['rows'],
                      })

                      // Table
                      const descriptionColumn = prDetailWS.getColumn('B')
                      const qtyColumn = prDetailWS.getColumn('C')
                      const unitColumn = prDetailWS.getColumn('D')
                      const pkgQtyColumn = prDetailWS.getColumn('E')
                      const pkgUnitColumn = prDetailWS.getColumn('F')
                      const unitCostColumn = prDetailWS.getColumn('G')
                      const percentageColumn = prDetailWS.getColumn('H')
                      const totalColumn = prDetailWS.getColumn('I')

                      descriptionColumn.width = 30
                      qtyColumn.width = 10
                      unitColumn.width = 20
                      pkgQtyColumn.width = 10
                      pkgUnitColumn.width = 20
                      unitCostColumn.width = 25
                      percentageColumn.width = 25
                      totalColumn.width = 20

                      // =============== Table Header : START ===============
                      const columnLists = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']

                      columnLists.map((item) => {
                        prDetailWS.getCell(`${item}${tableDataFormula}`).alignment = {
                          vertical: 'middle',
                          horizontal: 'left',
                        }
                        prDetailWS.getCell(`${item}${tableDataFormula}`).font = {
                          color: { argb: '#475467' },
                        }
                        prDetailWS.getCell(`${item}${tableDataFormula}`).fill = {
                          type: 'pattern',
                          pattern: 'solid',
                          fgColor: { argb: '#f9fafb' },
                        }
                        prDetailWS.getCell(`${item}${tableDataFormula}`).border = {
                          top: { style: 'thin', color: { argb: 'eaecf0' } },
                          bottom: {
                            style: 'thin',
                            color: { argb: 'eaecf0' },
                          },
                        }
                      })

                      prDetailWS.getColumn('G').numFmt = IDRCurrencyFormat
                      prDetailWS.getColumn('I').numFmt = IDRCurrencyFormat

                      prDetailWS.getRow(tableDataFormula).height = 24

                      // =============== Table Header : END ===============
                    }

                    if (tableRow.prType === 'other') {
                      prDetailWS.addTable({
                        name: `Other Table (${requisitionType(rfType)})`,
                        ref: `A${tableDataFormula + tableRowIndex * (perdiemTotalRows * 2 + 1)}`,
                        headerRow: true,
                        columns: tableRow['columns'],
                        rows: tableRow['rows'],
                      })

                      // Table
                      const descriptionColumn = prDetailWS.getColumn('B')
                      const qtyColumn = prDetailWS.getColumn('C')
                      const unitColumn = prDetailWS.getColumn('D')
                      const pkgQtyColumn = prDetailWS.getColumn('E')
                      const pkgUnitColumn = prDetailWS.getColumn('F')
                      const unitCostColumn = prDetailWS.getColumn('G')
                      const expensesColumn = prDetailWS.getColumn('H')
                      const taxColumn = prDetailWS.getColumn('I')

                      descriptionColumn.width = 30
                      qtyColumn.width = 10
                      unitColumn.width = 20
                      pkgQtyColumn.width = 10
                      pkgUnitColumn.width = 20
                      unitCostColumn.width = 25
                      expensesColumn.width = 25
                      taxColumn.width = 20

                      // =============== Table Header : START ===============
                      const columnLists = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']

                      columnLists.map((item) => {
                        prDetailWS.getCell(
                          `${item}${tableDataFormula + tableRowIndex * (perdiemTotalRows * 2 + 1)}`,
                        ).alignment = {
                          vertical: 'middle',
                          horizontal: 'left',
                        }
                        prDetailWS.getCell(
                          `${item}${tableDataFormula + tableRowIndex * (perdiemTotalRows * 2 + 1)}`,
                        ).font = {
                          color: { argb: '#475467' },
                        }
                        prDetailWS.getCell(
                          `${item}${tableDataFormula + tableRowIndex * (perdiemTotalRows * 2 + 1)}`,
                        ).fill = {
                          type: 'pattern',
                          pattern: 'solid',
                          fgColor: { argb: '#f9fafb' },
                        }
                        prDetailWS.getCell(
                          `${item}${tableDataFormula + tableRowIndex * (perdiemTotalRows * 2 + 1)}`,
                        ).border = {
                          top: { style: 'thin', color: { argb: 'eaecf0' } },
                          bottom: {
                            style: 'thin',
                            color: { argb: 'eaecf0' },
                          },
                        }
                      })
                      prDetailWS.getColumn('G').numFmt = IDRCurrencyFormat
                      prDetailWS.getColumn('H').numFmt = IDRCurrencyFormat
                      prDetailWS.getColumn('I').numFmt = IDRCurrencyFormat

                      prDetailWS.getRow(tableDataFormula + tableRowIndex * (perdiemTotalRows * 2 + 1)).height = 24

                      // =============== Table Header : END ===============
                    }

                    if (tableRow.prType === 'transportation') {
                      const indexingTransportation =
                        tableDataFormula +
                        tableRowIndex * (otherTotalRows ? otherTotalRows * 2 + 2 : perdiemTotalRows * 2 + 1)

                      prDetailWS.addTable({
                        name: `Transportation Table (${requisitionType(rfType)})`,
                        ref: `A${indexingTransportation}`,
                        headerRow: true,
                        columns: tableRow['columns'],
                        rows: tableRow['rows'],
                      })

                      // Table
                      const descriptionColumn = prDetailWS.getColumn('B')
                      const qtyColumn = prDetailWS.getColumn('C')
                      const unitColumn = prDetailWS.getColumn('D')
                      const pkgQtyColumn = prDetailWS.getColumn('E')
                      const pkgUnitColumn = prDetailWS.getColumn('F')
                      const unitCostColumn = prDetailWS.getColumn('G')
                      const requestedTR = prDetailWS.getColumn('H')
                      const expensesColumn = prDetailWS.getColumn('I')
                      const taxColumn = prDetailWS.getColumn('J')

                      descriptionColumn.width = 30
                      qtyColumn.width = 10
                      unitColumn.width = 20
                      pkgQtyColumn.width = 10
                      pkgUnitColumn.width = 20
                      unitCostColumn.width = 25
                      requestedTR.width = 25
                      expensesColumn.width = 25
                      taxColumn.width = 20

                      // =============== Table Header : START ===============
                      const columnLists = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']

                      if (prDetail.finance_checking_process_status === PRFinanceCheckingStatus.CHECKED) {
                        columnLists.push('J')
                      }

                      columnLists.map((item) => {
                        prDetailWS.getCell(`${item}${indexingTransportation}`).alignment = {
                          vertical: 'middle',
                          horizontal: 'left',
                        }
                        prDetailWS.getCell(`${item}${indexingTransportation}`).font = {
                          color: { argb: '#475467' },
                        }
                        prDetailWS.getCell(`${item}${indexingTransportation}`).fill = {
                          type: 'pattern',
                          pattern: 'solid',
                          fgColor: { argb: '#f9fafb' },
                        }
                        prDetailWS.getCell(`${item}${indexingTransportation}`).border = {
                          top: { style: 'thin', color: { argb: 'eaecf0' } },
                          bottom: {
                            style: 'thin',
                            color: { argb: 'eaecf0' },
                          },
                        }
                      })
                      prDetailWS.getColumn('G').numFmt = IDRCurrencyFormat
                      prDetailWS.getColumn('H').numFmt = IDRCurrencyFormat
                      prDetailWS.getColumn('I').numFmt = IDRCurrencyFormat
                      prDetailWS.getColumn('J').numFmt = IDRCurrencyFormat

                      prDetailWS.getRow(indexingTransportation).height = 24
                      // =============== Table Header : END ===============
                    }

                    // Re assign index value
                    if (tableRow.prType === 'perdiem') {
                      indexPerdiem = travelInformationValueFormula + 5 * 0 - 6
                    }
                    if (tableRow.prType === 'other') {
                      indexOther = travelInformationValueFormula + (perdiemTotalRows * 2 + 1) * 1 - 6
                    }
                    if (tableRow.prType === 'transportation') {
                      if (indexOther === 0) {
                        indexTransportation = travelInformationValueFormula + (perdiemTotalRows * 2 + 1) * 1 - 6
                      } else {
                        indexTransportation = travelInformationValueFormula + (otherTotalRows * 2 + 2) * 2 - 6
                      }
                    }
                  }
                })

                // Aliignment
                prDetailWS.getColumn('A').alignment = {
                  vertical: 'middle',
                  horizontal: 'left',
                }
                prDetailWS.getColumn('B').alignment = {
                  vertical: 'middle',
                  horizontal: 'left',
                  wrapText: true,
                }
                prDetailWS.getColumn('C').alignment = {
                  vertical: 'middle',
                  horizontal: 'left',
                }
                prDetailWS.getColumn('D').alignment = {
                  vertical: 'middle',
                  horizontal: 'left',
                }
                prDetailWS.getColumn('E').alignment = {
                  vertical: 'middle',
                  horizontal: 'left',
                }
                prDetailWS.getColumn('F').alignment = {
                  vertical: 'middle',
                  horizontal: 'left',
                }
                prDetailWS.getColumn('G').alignment = {
                  vertical: 'middle',
                  horizontal: 'left',
                }
                prDetailWS.getColumn('H').alignment = {
                  vertical: 'middle',
                  horizontal: 'left',
                }
                prDetailWS.getColumn('I').alignment = {
                  vertical: 'middle',
                  horizontal: 'left',
                }
                prDetailWS.getColumn('J').alignment = {
                  vertical: 'middle',
                  horizontal: 'left',
                }
                prDetailWS.getColumn('K').alignment = {
                  vertical: 'middle',
                  horizontal: 'left',
                }
                prDetailWS.getColumn('L').alignment = {
                  vertical: 'middle',
                  horizontal: 'left',
                }
              } else {
                // Special for PC and PH
                const dynamicDataTableRows = activity.budgets.map((budget) => {
                  const additionalColumns = []

                  if (paymentType === 'APS') {
                    if (
                      prDetail.program_manager_approval !== 'approved' &&
                      prDetail.budget_controller_approval !== 'approved'
                    ) {
                      additionalColumns.push(
                        budget.qty * budget.pkg_qty * budget.unit_cost_value - budget.advance_payment_total,
                      )
                    }

                    if (prDetail.finance_checking_process_status === PRFinanceCheckingStatus.CHECKED) {
                      additionalColumns.push(budget.tax_amount)
                    }
                  }

                  if (paymentType === 'PR') {
                    additionalColumns.push(budget.additional_data['remaining_budget'])

                    if (prDetail.finance_checking_process_status === PRFinanceCheckingStatus.CHECKED) {
                      additionalColumns.push(budget.tax_amount)
                    }
                  }

                  if (paymentType === 'APR') {
                    additionalColumns.push(
                      budget.advance_payment_total
                        ? Number(budget.qty) * Number(budget.pkg_qty) * budget.unit_cost_value -
                            budget.advance_payment_total
                        : 0,
                    )
                  }

                  const result = [
                    budget.code.replace(/\.(\d+)$/, '-$1'),
                    budget.description,
                    budget.vendor_category_information.name,
                    budget.qty,
                    budget.unit,
                    budget.pkg_qty,
                    budget.pkg_unit,
                    budget.unit_cost_value,
                    budget.qty * budget.pkg_qty * budget.unit_cost_value,
                    budget.advance_payment_total,
                    ...additionalColumns,
                  ]

                  if (paymentType === 'APF') {
                    result.pop()
                  }

                  return result
                })

                // console.log('dynamicDataTableRows', dynamicDataTableRows)

                const columns = [
                  {
                    name: 'No',
                  },
                  {
                    name: 'Description',
                  },
                  {
                    name: 'Vendor Category',
                  },
                  {
                    name: 'Qty',
                  },
                  {
                    name: 'Unit',
                  },
                  {
                    name: 'Pckg Qty',
                  },
                  {
                    name: 'Pckg Unit',
                  },
                  {
                    name: 'Unit Cost',
                  },
                  {
                    name: 'Total Payment Request',
                  },
                  {
                    name: 'Advance Payment',
                  },
                ]

                if (paymentType === 'APS') {
                  if (
                    prDetail.program_manager_approval !== 'approved' &&
                    prDetail.budget_controller_approval !== 'approved'
                  ) {
                    columns.push({
                      name: 'Money to Processed',
                    })
                  }

                  if (prDetail.finance_checking_process_status === PRFinanceCheckingStatus.CHECKED) {
                    columns.push({
                      name: 'Potongan Pajak',
                    })
                  }
                }

                if (paymentType === 'PR') {
                  columns.push({
                    name: 'Remaining Budget',
                  })

                  if (prDetail.finance_checking_process_status === PRFinanceCheckingStatus.CHECKED) {
                    columns.push({
                      name: 'Potongan Pajak',
                    })
                  }
                }

                if (paymentType === 'APR') {
                  columns.push({
                    name: 'Remaining Budget',
                  })
                }

                if (paymentType === 'APF') {
                  columns.pop()
                  columns.pop()
                  columns.push({
                    name: 'Advance Perdiem Fee',
                  })
                }

                prDetailWS.addTable({
                  name: `payment Detail Table (${requisitionType(rfType)})`,
                  ref: `A${tableDataFormula}`,
                  headerRow: true,
                  columns,
                  rows: dynamicDataTableRows,
                })

                // Styling
                prDetailWS.getRow(activityFormula).font = {
                  bold: true,
                  size: 14,
                  color: { argb: '#101828' },
                }
                prDetailWS.getCell(`A${activityFormula}`).alignment = {
                  horizontal: 'center',
                }

                // Table
                const descriptionColumn = prDetailWS.getColumn('B')
                const vendorCategoryColumn = prDetailWS.getColumn('C')
                const qtyColumn = prDetailWS.getColumn('D')
                const unitColumn = prDetailWS.getColumn('E')
                const pkgQtyColumn = prDetailWS.getColumn('F')
                const pkgUnitColumn = prDetailWS.getColumn('G')
                const unitCostColumn = prDetailWS.getColumn('H')
                const totalPaymentRequestColumn = prDetailWS.getColumn('I')
                const advancePaymentColumn = prDetailWS.getColumn('J')
                const remainingBudgetColumn = prDetailWS.getColumn('K')

                descriptionColumn.width = 30
                vendorCategoryColumn.width = 20
                qtyColumn.width = 10
                unitColumn.width = 15
                pkgQtyColumn.width = 10
                pkgUnitColumn.width = 15
                unitCostColumn.width = 20
                totalPaymentRequestColumn.width = 25
                advancePaymentColumn.width = 20
                remainingBudgetColumn.width = 20

                if (paymentType === 'PR') {
                  const taxBudgetColumn = prDetailWS.getColumn('L')
                  taxBudgetColumn.width = 20
                }

                // =============== Table Header : START ===============
                const columnLists = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']

                if (paymentType === 'PR') {
                  columnLists.push('L')
                }

                columnLists.map((item) => {
                  prDetailWS.getCell(`${item}${tableDataFormula}`).alignment = {
                    vertical: 'middle',
                    horizontal: 'left',
                  }
                  prDetailWS.getCell(`${item}${tableDataFormula}`).font = {
                    color: { argb: '#475467' },
                  }
                  prDetailWS.getCell(`${item}${tableDataFormula}`).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: '#f9fafb' },
                  }
                  prDetailWS.getCell(`${item}${tableDataFormula}`).border = {
                    top: { style: 'thin', color: { argb: 'eaecf0' } },
                    bottom: { style: 'thin', color: { argb: 'eaecf0' } },
                  }
                })
                prDetailWS.getColumn('H').numFmt = IDRCurrencyFormat
                prDetailWS.getColumn('I').numFmt = IDRCurrencyFormat
                prDetailWS.getColumn('J').numFmt = IDRCurrencyFormat
                prDetailWS.getColumn('K').numFmt = IDRCurrencyFormat
                prDetailWS.getColumn('L').numFmt = IDRCurrencyFormat

                prDetailWS.getRow(tableDataFormula).height = 24

                // =============== Table Header : END ===============

                dynamicDataTableRows.map((_, itemIndex) => {
                  // Aliignment
                  prDetailWS.getCell(`A${tableDataFormula + (itemIndex + 1)}`).alignment = {
                    vertical: 'middle',
                    horizontal: 'left',
                  }
                  prDetailWS.getCell(`B${tableDataFormula + (itemIndex + 1)}`).alignment = {
                    vertical: 'middle',
                    horizontal: 'left',
                    wrapText: true,
                  }
                  prDetailWS.getCell(`C${tableDataFormula + (itemIndex + 1)}`).alignment = {
                    vertical: 'middle',
                    horizontal: 'left',
                  }
                  prDetailWS.getCell(`D${tableDataFormula + (itemIndex + 1)}`).alignment = {
                    vertical: 'middle',
                    horizontal: 'left',
                  }
                  prDetailWS.getCell(`E${tableDataFormula + (itemIndex + 1)}`).alignment = {
                    vertical: 'middle',
                    horizontal: 'left',
                  }
                  prDetailWS.getCell(`F${tableDataFormula + (itemIndex + 1)}`).alignment = {
                    vertical: 'middle',
                    horizontal: 'left',
                  }
                  prDetailWS.getCell(`G${tableDataFormula + (itemIndex + 1)}`).alignment = {
                    vertical: 'middle',
                    horizontal: 'left',
                  }
                  prDetailWS.getCell(`H${tableDataFormula + (itemIndex + 1)}`).alignment = {
                    vertical: 'middle',
                    horizontal: 'left',
                  }
                  prDetailWS.getCell(`I${tableDataFormula + (itemIndex + 1)}`).alignment = {
                    vertical: 'middle',
                    horizontal: 'left',
                  }
                  prDetailWS.getCell(`J${tableDataFormula + (itemIndex + 1)}`).alignment = {
                    vertical: 'middle',
                    horizontal: 'left',
                  }
                  prDetailWS.getCell(`K${tableDataFormula + (itemIndex + 1)}`).alignment = {
                    vertical: 'middle',
                    horizontal: 'left',
                  }
                  prDetailWS.getCell(`L${tableDataFormula + (itemIndex + 1)}`).alignment = {
                    vertical: 'middle',
                    horizontal: 'left',
                  }

                  // Font
                  prDetailWS.getCell(`A${tableDataFormula + (itemIndex + 1)}`).font = {
                    color: { argb: '#475467' },
                  }
                  prDetailWS.getCell(`B${tableDataFormula + (itemIndex + 1)}`).font = {
                    color: { argb: '#475467' },
                  }
                  prDetailWS.getCell(`C${tableDataFormula + (itemIndex + 1)}`).font = {
                    color: { argb: '#475467' },
                  }
                  prDetailWS.getCell(`D${tableDataFormula + (itemIndex + 1)}`).font = {
                    color: { argb: '#475467' },
                  }
                  prDetailWS.getCell(`E${tableDataFormula + (itemIndex + 1)}`).font = {
                    color: { argb: '#475467' },
                  }
                  prDetailWS.getCell(`F${tableDataFormula + (itemIndex + 1)}`).font = {
                    color: { argb: '#475467' },
                  }
                  prDetailWS.getCell(`G${tableDataFormula + (itemIndex + 1)}`).font = {
                    color: { argb: '#475467' },
                  }
                  prDetailWS.getCell(`H${tableDataFormula + (itemIndex + 1)}`).font = {
                    color: { argb: '#475467' },
                  }
                  prDetailWS.getCell(`I${tableDataFormula + (itemIndex + 1)}`).font = {
                    color: { argb: '#475467' },
                  }
                  prDetailWS.getCell(`J${tableDataFormula + (itemIndex + 1)}`).font = {
                    color: { argb: '#475467' },
                  }
                  prDetailWS.getCell(`K${tableDataFormula + (itemIndex + 1)}`).font = {
                    color: { argb: '#475467' },
                  }
                  prDetailWS.getCell(`L${tableDataFormula + (itemIndex + 1)}`).font = {
                    color: { argb: '#475467' },
                  }
                })
              }
            }
          })
        })

        if (paymentType === 'APR' || paymentType === 'APF') {
          // Delete row (13-18)
          prDetailWS.spliceRows(12, 6)
          prDetailWS.mergeCells('A15:B15')
          prDetailWS.mergeCells('D15:G15')
        }

        if (paymentType === 'PR') {
          // Delete row (20-23)
          prDetailWS.spliceRows(20, 4)
        }

        if (paymentType === 'TE') {
          // Delete row (17-22)
          prDetailWS.spliceRows(17, 6)

          // Merge Cells
          // Peridem
          if (indexPerdiem !== 0) {
            prDetailWS.mergeCells(`C${indexPerdiem}:D${indexPerdiem}`)
            prDetailWS.mergeCells(`E${indexPerdiem}:F${indexPerdiem}`)
            prDetailWS.mergeCells(`J${indexPerdiem}:L${indexPerdiem}`)
          }

          // Other
          if (indexOther !== 0) {
            prDetailWS.mergeCells(`E${indexOther}:F${indexOther}`)
            prDetailWS.mergeCells(`J${indexOther}:L${indexOther}`)
          }

          // Transportation
          if (indexTransportation !== 0) {
            prDetailWS.mergeCells(`C${indexTransportation}:D${indexTransportation}`)
            prDetailWS.mergeCells(`E${indexTransportation}:F${indexTransportation}`)
          }

          // console.log('indexPerdiem', indexPerdiem)
          // console.log('indexOther', indexOther)
          // console.log('indexTransportation', indexTransportation)
        }

        const prDetailBuf = await workbook.xlsx.writeBuffer()

        const prDetailExcel = new Blob([prDetailBuf], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })

        zip.file(`${paymentIdentifier()}/${fileNamePRDetail}.xlsx`, prDetailExcel)
      }
    }
    /* ----------------------------------------------------------------------------------------
    MAIN FORMULA FOR PAYMENT DETAIL : END
    ---------------------------------------------------------------------------------------- */

    /* ----------------------------------------------------------------------------------------
    CALL PAYMENT DETAILS : START
    ---------------------------------------------------------------------------------------- */
    await handleExportDetailPayments(prListResult, workSheetNamePRDetail, prWB)
    await handleExportDetailPayments(aprListResult, workSheetNameAPRDetail, aprWB)
    await handleExportDetailPayments(apsListResult, workSheetNameAPSDetail, apsWB)
    await handleExportDetailPayments(apfListResult, workSheetNameAPFDetail, apfWB)
    await handleExportDetailPayments(teListResult, workSheetNameTEDetail, teWB)
    /* ----------------------------------------------------------------------------------------
    CALL PAYMENT DETAILS : END
    ---------------------------------------------------------------------------------------- */

    // console.log('attachmentFiles', attachmentFiles)

    const attachmentBlobCollections = attachmentFiles.map(async (file) => {
      const response = await fetch(file.url)
      const data = await response.blob()
      zip.file(file.name, data)

      return data
    })

    const zipName = requisitionFormDetail?.number.toUpperCase().replaceAll('/', '_')

    Promise.all(attachmentBlobCollections)
      .then(() => {
        zip.generateAsync({ type: 'blob' }).then((content) => {
          saveAs(content, `${zipName}.zip`)
        })
        setTimeout(() => {
          setLoadingButtonStatement((prev) => ({
            ...prev,
            exportExcel: false,
          }))
        }, 800)
      })
      .catch(() => {
        setTimeout(() => {
          setLoadingButtonStatement((prev) => ({
            ...prev,
            exportExcel: false,
          }))
        }, 800)
      })
  } catch (error) {
    console.error('<<<ERRROR>>>', error)
    console.error('Something Went Wrong', error.message)
  } finally {
    // removing worksheet's instance to create new one
    rfWB.removeWorksheet(workSheetNameRF)
    rfWB.removeWorksheet(workSheetNamePR)
    rfWB.removeWorksheet(workSheetNameAPR)
    rfWB.removeWorksheet(workSheetNameAPS)
    rfWB.removeWorksheet(workSheetNameTI)
    rfWB.removeWorksheet(workSheetNamePHI)

    prWB.removeWorksheet(workSheetNamePRDetail)
    prWB.removeWorksheet(workSheetNameAPRDetail)
    prWB.removeWorksheet(workSheetNameAPSDetail)
    prWB.removeWorksheet(workSheetNameAPFDetail)
    prWB.removeWorksheet(workSheetNameTEDetail)
    prWB.removeWorksheet(workSheetNameAdditionalAttactment)
    prWB.removeWorksheet(workSheetNameVendorInformation)
    prWB.removeWorksheet(workSheetNameBankInformation)

    aprWB.removeWorksheet(workSheetNamePRDetail)
    aprWB.removeWorksheet(workSheetNameAPRDetail)
    aprWB.removeWorksheet(workSheetNameAPSDetail)
    aprWB.removeWorksheet(workSheetNameAPFDetail)
    aprWB.removeWorksheet(workSheetNameTEDetail)
    aprWB.removeWorksheet(workSheetNameAdditionalAttactment)
    aprWB.removeWorksheet(workSheetNameVendorInformation)
    aprWB.removeWorksheet(workSheetNameBankInformation)

    apsWB.removeWorksheet(workSheetNamePRDetail)
    apsWB.removeWorksheet(workSheetNameAPRDetail)
    apsWB.removeWorksheet(workSheetNameAPSDetail)
    apsWB.removeWorksheet(workSheetNameAPFDetail)
    apsWB.removeWorksheet(workSheetNameTEDetail)
    apsWB.removeWorksheet(workSheetNameAdditionalAttactment)
    apsWB.removeWorksheet(workSheetNameVendorInformation)
    apsWB.removeWorksheet(workSheetNameBankInformation)

    apfWB.removeWorksheet(workSheetNamePRDetail)
    apfWB.removeWorksheet(workSheetNameAPRDetail)
    apfWB.removeWorksheet(workSheetNameAPSDetail)
    apfWB.removeWorksheet(workSheetNameAPFDetail)
    apfWB.removeWorksheet(workSheetNameTEDetail)
    apfWB.removeWorksheet(workSheetNameAdditionalAttactment)
    apfWB.removeWorksheet(workSheetNameVendorInformation)
    apfWB.removeWorksheet(workSheetNameBankInformation)

    teWB.removeWorksheet(workSheetNamePRDetail)
    teWB.removeWorksheet(workSheetNameAPRDetail)
    teWB.removeWorksheet(workSheetNameAPSDetail)
    teWB.removeWorksheet(workSheetNameAPFDetail)
    teWB.removeWorksheet(workSheetNameTEDetail)
    teWB.removeWorksheet(workSheetNameAdditionalAttactment)
    teWB.removeWorksheet(workSheetNameVendorInformation)
    teWB.removeWorksheet(workSheetNameBankInformation)

    projectBudgetsModified?.map((project) =>
      project.activities?.map((activity) =>
        activity.budgets
          .filter((budget) => budget.vendor_category_information.action_by === 'ACTION_BY_OPERATIONAL')
          ?.map(() => {
            rfWB.removeWorksheet(`${activity.description} - Airfare`)
          }),
      ),
    )

    setTimeout(() => {
      setLoadingButtonStatement((prev) => ({
        ...prev,
        exportExcel: false,
      }))
    }, 800)
    attachmentFiles = []
  }
}

const generatePaymentListTable = (
  paymentListData: PaymentRequestListType[],
  wsInit: Excel.Worksheet,
  wsName: string,
  currencyFormat: string,
) => {
  const tableData = paymentListData.map((payment) => [
    payment.pr_number.replace(/ /g, '').toUpperCase(),
    payment.program_name,
    Number(payment.transfer_amount.split('_')[1]),
    {
      pending: 'Pending Approval',
      approved: 'Approved',
      rejected: 'Rejected',
    }[payment.program_manager_approval],
    payment.program_manager_approval !== 'approved'
      ? 'Waiting Previous Approval'
      : {
          pending: 'Pending Approval',
          approved: 'Approved',
          rejected: 'Rejected',
        }[payment.budget_controller_approval],
    handleFinanceStatusBadgeText(payment.budget_controller_approval, payment.processed_by?.name, payment.paid_at),
  ])

  wsInit.addTable({
    name: `Table - ${wsName}`,
    ref: 'A1',
    headerRow: true,
    columns: [
      {
        name: 'Payment Request Code',
      },
      {
        name: 'Project Name',
      },
      {
        name: 'Transfer Amount',
      },
      {
        name: 'Project Manager Status',
      },
      {
        name: 'Budget Controller Status',
      },
      {
        name: 'Finance Team Status',
      },
    ],
    rows: tableData,
  })
  // Table
  const paymentRequestCode = wsInit.getColumn('A')
  const programName = wsInit.getColumn('B')
  const transferAmount = wsInit.getColumn('C')
  const programManagerStatus = wsInit.getColumn('D')
  const budgetControllerStatus = wsInit.getColumn('E')
  const financeTeamStatus = wsInit.getColumn('F')

  paymentRequestCode.width = 25
  programName.width = 40
  transferAmount.width = 20
  programManagerStatus.width = 30
  budgetControllerStatus.width = 30
  financeTeamStatus.width = 30

  // =============== Table Header : START ===============
  const columnLists = ['A', 'B', 'C', 'D', 'E', 'F']
  columnLists.map((item) => {
    wsInit.getCell(`${item}1`).alignment = {
      vertical: 'middle',
      horizontal: 'left',
    }
    wsInit.getCell(`${item}1`).font = {
      color: { argb: '#475467' },
    }
    wsInit.getCell(`${item}1`).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '#f9fafb' },
    }
    wsInit.getCell(`${item}1`).border = {
      top: { style: 'thin', color: { argb: 'eaecf0' } },
      bottom: { style: 'thin', color: { argb: 'eaecf0' } },
    }
  })
  wsInit.getColumn('C').numFmt = currencyFormat
  wsInit.getColumn('C').alignment = {
    vertical: 'middle',
    horizontal: 'left',
  }

  wsInit.getRow(1).height = 24

  // =============== Table Header : END ===============
}

export default saveExcelRf
