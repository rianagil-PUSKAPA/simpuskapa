/* eslint-disable tailwindcss/no-custom-classname */
import { resolveAuthToken, safeDecodeJwt } from '@/utils/ssrAuth'
import { cn } from '@/lib/utils'
import { useDashboardContext } from '@/providers/DashboardProvider'
import ProgramRoleAccessControlProvider, { accessActionType, programTasks } from '@/providers/ProgramRoleAccessControl'
import { BucketsEnum } from '@/shared/file.system'
import { DynamicProgressType } from '@/types/global'
import { theme } from '@/types/themes'
import { createAPIConfig } from '@/utils/apiAuthToken'
import {
  downloadS3File,
  fileApi,
  getBudgetNeeds,
  getPerdiemSetting,
  getProgramDetail,
  getSubmittedFundReceived,
  programApi,
  rfGetPaidBudget,
  rfGetPendingRequested,
  rfGetRemainingBudget,
} from '@/utils/apiRequestHelper'
import { FUND_RECEIVED_TYPE, MAIN_URL_FE } from '@/utils/constant'
import {
  calculateTotalBudget,
  calculateUnitCostPerActivity,
  calculateUnitCostPerProject,
  checkIsLoggedInRoleAll,
  formatCurrency,
  getOriginalUrlFile,
  isValidUrl,
  monthNumberToString,
  programDataBadgeStatus,
} from '@/utils/globalHelper'
import { Menu, Transition } from '@headlessui/react'
import {
  BudgetProgramProjectListResponse,
  FilesApi,
  Log,
  MetadataApi,
  ProgramApi,
  ProgramCreateRequestProgramOwnershipTypeEnum,
  ProgramDetail as ProgramDetailSDK,
  ProgramPerdiemSettings,
  ProgramReceivedFundRequest,
  ProgramReviseBudgetDocs,
  ProgramStatusStatusEnum,
  Project,
  ProjectApi,
} from '@sdk'
import axios from 'axios'
import dayjs from 'dayjs'
import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import useSWRMutation from 'swr/mutation'
import { setCookie } from 'typescript-cookie'

const Drawer: any = dynamic(() => import('@/components/Drawer').then((mod) => mod.Drawer))
const CoinsHandIcon: any = dynamic(() => import('@/components/icon/CoinsHandIcon').then((mod) => mod.CoinsHandIcon))
const CoinStacked01Icon: any = dynamic(() =>
  import('@/components/icon/CoinStacked01Icon').then((mod) => mod.CoinStacked01Icon),
)
const FileAttachment02Icon: any = dynamic(() =>
  import('@/components/icon/FileAttachment02Icon').then((mod) => mod.FileAttachment02Icon),
)
const FileDownload02Icon: any = dynamic(() =>
  import('@/components/icon/FileDownload02Icon').then((mod) => mod.FileDownload02Icon),
)
const FileSearch02Icon: any = dynamic(() =>
  import('@/components/icon/FileSearch02Icon').then((mod) => mod.FileSearch02Icon),
)
const Link03Icon: any = dynamic(() => import('@/components/icon/Link03Icon').then((mod) => mod.Link03Icon))
//
const Button: any = dynamic(() => import('@/components/Button').then((mod) => mod.Button))
const SwitchableUploadField: any = dynamic(() =>
  import('@/components/SwitchableUploadField').then((mod) => mod.SwitchableUploadField),
)
const HorizontalTabs: any = dynamic(() => import('@/components/HorizontalTabs').then((mod) => mod.HorizontalTabs))
const ActivityIcon: any = dynamic(() => import('@/components/icon/ActivityIcon').then((mod) => mod.ActivityIcon))
const ChevronDownIcon: any = dynamic(() =>
  import('@/components/icon/ChevronDownIcon').then((mod) => mod.ChevronDownIcon),
)
const CoinsStacked03Icon: any = dynamic(() =>
  import('@/components/icon/CoinsStacked03Icon').then((mod) => mod.CoinsStacked03Icon),
)
const Edit03Icon: any = dynamic(() => import('@/components/icon/Edit03Icon').then((mod) => mod.Edit03Icon))
const LayersThree02Icon: any = dynamic(() =>
  import('@/components/icon/LayersThree02Icon').then((mod) => mod.LayersThree02Icon),
)
const PlusIcon: any = dynamic(() => import('@/components/icon/PlusIcon').then((mod) => mod.PlusIcon))
const Save01Icon: any = dynamic(() => import('@/components/icon/Save01Icon').then((mod) => mod.Save01Icon))
const Input: any = dynamic(() => import('@/components/Input').then((mod) => mod.Input))
const Loader: any = dynamic(() => import('@/components/Loader').then((mod) => mod.Loader))
const LogActivity: any = dynamic(() => import('@/components/LogActivity').then((mod) => mod.LogActivity))
const Modal: any = dynamic(() => import('@/components/Modal').then((mod) => mod.Modal))
const Switch: any = dynamic(() => import('@/components/ui/switch').then((mod) => mod.Switch))
const Dashboard: any = dynamic(() => import('@/layout/Dashboard').then((mod) => mod.Dashboard))
const ProjectActivityDetail: any = dynamic(() =>
  import('@/layout/program/activity/ProjectActivityDetail').then((mod) => mod.ProjectActivityDetail),
)
const ProjectActivityForm: any = dynamic(() =>
  import('@/layout/program/activity/ProjectActivityForm').then((mod) => mod.ProjectActivityForm),
)
const BudgetNeedsDetail: any = dynamic(() =>
  import('@/layout/program/budget-needs/BudgetNeedsDetail').then((mod) => mod.BudgetNeedsDetail),
)
const BudgetNeedsForm: any = dynamic(() =>
  import('@/layout/program/budget-needs/BudgetNeedsForm').then((mod) => mod.BudgetNeedsForm),
)
const ProgramInformation: any = dynamic(() =>
  import('@/layout/program/Information').then((mod) => mod.ProgramInformation),
)
const PaymentRequestList: any = dynamic(() =>
  import('@/layout/program/PaymentRequestList').then((mod) => mod.PaymentRequestList),
)
const RequisitionList: any = dynamic(() =>
  import('@/layout/program/RequisitionList').then((mod) => mod.RequisitionList),
)

type EmployeeListProps = {
  programDetail: ProgramDetailSDK
  slugIdentifier: string[]
  isProjectActivityEmpty: boolean
  isBudgetNeedEmpty: boolean
  programBudgetDetail: BudgetProgramProjectListResponse
  programLogs: Log[]
  projectActivityDetailData: Project[]
}

type ModalStatement = {
  reviseProject: boolean
}

export type ButtonStatementForProjectTabs = {
  activity: boolean
  budgetNeeds: boolean
  submitFundReceived: boolean
  exportExcel: boolean
}

const ProgramDetailLayout = ({
  programDetail,
  slugIdentifier,
  isProjectActivityEmpty,
  isBudgetNeedEmpty,
  programBudgetDetail,
  programLogs,
  projectActivityDetailData,
}: EmployeeListProps) => {
  const { isInternal, handleInternal } = useDashboardContext()
  /*
  - programId mean program id coming after /program url
  - programTabsIdentifier mean the available tabs of program, it will be like 'activity', 'budget-needs', etc
  */

  const [programId, programTabsIdentifier] = slugIdentifier
  const router = useRouter()

  const [loadingButtonStatement, setLoadingButtonStatement] = useState<ButtonStatementForProjectTabs>({
    activity: false,
    budgetNeeds: false,
    submitFundReceived: false,
    exportExcel: false,
  })

  const [isOpenModal, setIsOpenModal] = useState<ModalStatement | null>({
    reviseProject: false,
  })
  const [tempProgressUpload, setTempProgressUpload] = useState<DynamicProgressType>({})
  const [reviseBudgetNeedsDoc, setReviseBudgetNeedsDoc] = useState([])
  const [isCheckboxEnabled, setIsCheckboxEnabled] = useState(false)
  const [budgetNeedsVersionDrawer, setBudgetNeedsVersionDrawer] = useState<boolean>(false)
  const [perdiemSettingDrawer, setPerdiemSettingDrawer] = useState<boolean>(false)
  const [submitFundReceivedDrawer, setSubmitFundReceivedDrawer] = useState<boolean>(false)
  const [viewFundReceivedDrawer, setViewFundReceivedDrawer] = useState<boolean>(false)
  const [switchTogglableButton, setSwitchTogglableButton] = useState<{
    fundReceivedDocuments: boolean
    reviseDocument: boolean
  }>({
    fundReceivedDocuments: false,
    reviseDocument: false,
  })
  const [fundReceivedDocuments, setFundReceivedDocuments] = useState([])
  const [documentsPath, setDocumentsPath] = useState<object | null>(null)

  const { data: perdiemSettingData, trigger: perdiemSettingTrigger } = useSWRMutation(programId, getPerdiemSetting)

  const { data: fundReceivedData, trigger: fundReceivedTrigger } = useSWRMutation(programId, getSubmittedFundReceived)

  // Exisitng Total
  const { data: budgetNeedsData, trigger: budgetNeedsTrigger } = useSWRMutation(
    `budget-needs/${programId}`,
    getBudgetNeeds,
  )

  const {
    data: programData,
    trigger: programTrigger,
    isMutating: isProgramMutating,
  } = useSWRMutation(`project/${programId}`, getProgramDetail)

  const {
    register,
    setValue,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProgramReviseBudgetDocs>({
    shouldUnregister: true,
  })

  const {
    register: registerPerdiemSetting,
    control: controlPerdiemSetting,
    setValue: setValuePerdiemSetting,
  } = useForm<ProgramPerdiemSettings>()

  const {
    register: registerFundReceived,
    control: controlFundReceived,
    handleSubmit: handleSubmitFundReceived,
    setValue: setValueFundReceived,
    formState: { errors: errorsFundReceived },
    reset: resetFundReceived,
  } = useForm<ProgramReceivedFundRequest>()

  const downloadBudgetNeedsExcel = async () => {
    // Lazy-load heavy export libs (exceljs/jszip/file-saver) only when the user
    // exports, keeping them out of the initial page bundle.
    const [{ default: Excel }, { default: JSZip }, { default: saveAs }] = await Promise.all([
      import('exceljs'),
      import('jszip'),
      import('file-saver'),
    ])

    const zip = new JSZip()
    setLoadingButtonStatement((prev) => ({ ...prev, exportExcel: true }))

    let attachmentFiles = []

    const bnWB = new Excel.Workbook()

    const workSheetNameBN = 'Budget Needs List'
    const workSheetNameFundReceived = 'View Fund Received'
    const workSheetNameBNVersion = 'Budget Need Version'
    const workSheetNamePerdiemSetting = 'Perdiem Setting'

    try {
      /* ----------------------------------------------------------------------------------------
    BUDGET NEEDS LIST HEADER : START
    ---------------------------------------------------------------------------------------- */
      const fileNameBN = programDetail.program_name

      // RF DETAIL WORKSHEET
      const bnDetailWS = bnWB.addWorksheet(workSheetNameBN)

      // Default setting
      // Column width
      const colA = bnDetailWS.getColumn('A')
      const colB = bnDetailWS.getColumn('B')
      const colC = bnDetailWS.getColumn('C')
      const colD = bnDetailWS.getColumn('D')
      const colE = bnDetailWS.getColumn('E')
      const colF = bnDetailWS.getColumn('F')
      const colG = bnDetailWS.getColumn('G')
      const colH = bnDetailWS.getColumn('H')
      const colI = bnDetailWS.getColumn('I')
      const colK = bnDetailWS.getColumn('K')
      const colL = bnDetailWS.getColumn('L')
      const colM = bnDetailWS.getColumn('M')
      const colN = bnDetailWS.getColumn('N')
      const colO = bnDetailWS.getColumn('O')
      const colP = bnDetailWS.getColumn('P')
      const colQ = bnDetailWS.getColumn('Q')
      const colR = bnDetailWS.getColumn('R')
      const colS = bnDetailWS.getColumn('S')
      const colT = bnDetailWS.getColumn('T')
      const colU = bnDetailWS.getColumn('U')

      colA.width = 18
      colB.width = 18
      colC.width = 18
      colD.width = 24
      colE.width = 18
      colF.width = 18
      colG.width = 24
      colH.width = 18
      colI.width = 18
      colK.width = 18
      colL.width = 18
      colM.width = 18
      colN.width = 18
      colO.width = 18
      colP.width = 18
      colQ.width = 18
      colR.width = 18
      colS.width = 18
      colT.width = 18
      colU.width = 18

      // Title
      bnDetailWS.getCell('A1').value = 'Budget Needs'

      // Format
      const IDRCurrencyFormat = '"Rp "#,##0;[Red]-"Rp "#,##0'

      // ======================== 3-5 ========================
      // Total Project Budget
      bnDetailWS.getCell('A3').value = 'Total Project Budget'
      bnDetailWS.getCell('A4').value = calculateTotalBudget(programBudgetDetail)
      bnDetailWS.getCell('A4').numFmt = IDRCurrencyFormat

      // Submitted Status
      bnDetailWS.getCell('D3').value = `Submitted Status: ${programDataBadgeStatus(programDetail.approval)}`
      bnDetailWS.getCell('D4').value = `${
        isInternal ? (programDetail as any)?.general_manager?.full_name : programDetail?.program_officer?.full_name
      }: (${isInternal ? 'Created By' : 'Program Officer'})`
      bnDetailWS.getCell('D5').value =
        programDetail.approval === null ||
        programDetail.approval === 'revision' ||
        programDetail.approval === 'rejected'
          ? `(Wait for the budget to be submitted)`
          : dayjs(programDetail.submitted_at).utc().local().format('dddd, DD MMMM YYYY (HH:mm)')

      // Approval Status
      bnDetailWS.getCell('H3').value = `Approval Status: ${programDataBadgeStatus(programDetail.approval)}`
      bnDetailWS.getCell('H4').value = `${
        isInternal ? (programDetail as any)?.general_manager?.full_name : programDetail?.grant_manager?.full_name
      }: (${isInternal ? 'General Manager' : 'Grant Manager'})`
      bnDetailWS.getCell('H5').value =
        programDetail.approval === null ||
        programDetail.approval === 'revision' ||
        programDetail.approval === 'rejected'
          ? `(Wait for the budget to be submitted)`
          : programDetail.approval === 'success'
          ? dayjs(programDetail.approved_at).utc().local().format('dddd, DD MMMM YYYY (HH:mm)')
          : `(Wait for the approval)`

      bnDetailWS.getRow(1).font = {
        bold: true,
        size: 14,
        color: { argb: '#101828' },
      }
      bnDetailWS.getRow(3).font = {
        size: 12,
        color: { argb: '#667085' },
      }
      bnDetailWS.getRow(4).font = {
        bold: true,
        size: 14,
        color: { argb: '#101828' },
      }
      bnDetailWS.getCell('A4').font = {
        bold: true,
        size: 22,
        color: { argb: '#101828' },
      }
      bnDetailWS.getRow(5).font = {
        size: 10,
        color: { argb: '#101828' },
      }
      bnDetailWS.getCell('A4').alignment = {
        horizontal: 'left',
        vertical: 'middle',
      }
      bnDetailWS.getCell('D5').alignment = {
        horizontal: 'left',
        vertical: 'middle',
      }
      bnDetailWS.getCell('H5').alignment = {
        horizontal: 'left',
        vertical: 'middle',
      }
      bnDetailWS.mergeCells('A4:B5')

      // ======================== 8-x ========================

      const defaultStartTitleActivity = 8
      // const defaultStartValueActivity = 9
      // const defaultStartValueSubActivity = 11
      // const defaultStartBudgetNeedsTable = 13

      const initialProjectBudgets = projectActivityDetailData?.map((project, projectIndex) => ({
        ...project,
        is_checked: false,
        is_disabled: false,
        activities: project.activities.map((activity, activityIndex) => {
          const pureBudgetNeeds = programBudgetDetail?.projects[projectIndex].activities[activityIndex].budgets
            .filter((budget) => budget.ordering_seq !== 0)
            .map((budget) => ({
              ...budget,
              is_checked: false,
              remaining: 0,
            }))

          return {
            ...activity,
            is_checked: false,
            budgets: pureBudgetNeeds,
          }
        }),
      })) as any

      if (initialProjectBudgets === undefined) return

      const dispatchers = []
      for (const project of initialProjectBudgets) {
        for (const activity of project.activities) {
          for (const budget of activity.budgets) {
            const dispatcher = new Promise(async (resolve) => {
              const remaining = await rfGetRemainingBudget(budget.id)
              budget.remaining = remaining

              const pendingRequested = await rfGetPendingRequested(budget.id)
              budget.pending_requested = pendingRequested

              const paidTotal = await rfGetPaidBudget(budget.id)
              budget.paid_total = paidTotal

              resolve(budget)
            })
            dispatchers.push(dispatcher)
          }
        }
      }

      const awaiter = await Promise.all(dispatchers)

      if (awaiter.length === 0) return false

      const totalBudgetCollectionForActivity = []

      initialProjectBudgets.map((project, projectIndex) => {
        // Activity
        const totalActivity = project.activities.flat().length
        const totalBudgetPerActivity = project.activities.map((activity) => activity.budgets).flat().length

        totalBudgetCollectionForActivity.push(totalBudgetPerActivity)

        const activityTitleFormula =
          defaultStartTitleActivity +
          (totalBudgetCollectionForActivity[projectIndex > 1 ? projectIndex - 1 : 0] + 4 * totalActivity + 2 + 2) *
            projectIndex
        const activityValueFormula = activityTitleFormula + 1

        // Project
        bnDetailWS.getCell(`A${activityTitleFormula}`).value = `Activity (${project.code})`
        bnDetailWS.getCell(`A${activityValueFormula}`).value = project.description
        bnDetailWS.getCell(`L${activityTitleFormula}`).value = formatCurrency(
          'IDR',
          calculateUnitCostPerProject(project),
        )

        bnDetailWS.getRow(activityTitleFormula).font = {
          size: 11,
          color: { argb: '#667085' },
        }
        bnDetailWS.getRow(activityValueFormula).font = {
          size: 14,
          color: { argb: '#101828' },
        }
        bnDetailWS.getCell(`L${activityTitleFormula}`).font = {
          size: 18,
          bold: true,
          color: { argb: '#101828' },
        }
        bnDetailWS.getCell(`L${activityTitleFormula}`).alignment = {
          vertical: 'middle',
          horizontal: 'right',
        }

        const totalBudgetCollection = []

        project.activities.map((activity, activityIndex) => {
          const totalBudget = activity.budgets.length
          totalBudgetCollection.push(totalBudget)

          const subActivityValueFormula =
            activityValueFormula +
            2 +
            (totalBudgetCollection[activityIndex > 0 ? activityIndex - 1 : 0] + 2 * totalBudgetCollection.length) *
              activityIndex
          const tableDataFormula = subActivityValueFormula + 2

          // Sub Activity
          bnDetailWS.getCell(`A${subActivityValueFormula}`).value = activity.code
          bnDetailWS.getCell(`B${subActivityValueFormula}`).value = activity.description
          bnDetailWS.getCell(`L${subActivityValueFormula}`).value = formatCurrency(
            'IDR',
            calculateUnitCostPerActivity(activity),
          )

          bnDetailWS.getRow(subActivityValueFormula).font = {
            size: 12,
            color: { argb: '#101828' },
          }
          bnDetailWS.getCell(`A${subActivityValueFormula}`).alignment = {
            vertical: 'middle',
            horizontal: 'center',
          }
          bnDetailWS.getCell(`B${subActivityValueFormula}`).alignment = {
            vertical: 'middle',
            horizontal: 'left',
          }
          bnDetailWS.getCell(`L${subActivityValueFormula}`).alignment = {
            vertical: 'middle',
            horizontal: 'right',
          }
          bnDetailWS.getCell(`L${subActivityValueFormula}`).font = {
            size: 16,
            bold: true,
            color: { argb: '#101828' },
          }

          // Table: list of budget needs
          if (activity.budgets.length > 0) {
            const dynamicDataTableRows = activity.budgets.map((budget, budgetIndex) => [
              `${activity.code}-${budgetIndex < 9 ? 0 : ''}${budgetIndex + 1}`,
              budget.description,
              budget.vendor_category_information.vendor_type.name,
              budget.vendor_category_information.name,
              budget.qty,
              budget.unit,
              budget.pkg_qty,
              budget.pkg_unit,
              budget.unit_cost_value,
              budget.qty * budget.pkg_qty * budget.unit_cost_value,
              budget.remaining,
              budget.pending_requested,
              budget.paid_total,
            ])

            bnDetailWS.addTable({
              name: 'Budget Needs Table',
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
                  name: 'Total Budget Cost',
                },
                {
                  name: 'Remaining Budget',
                },
                {
                  name: 'Pending Requested',
                },
                {
                  name: 'Total Payment',
                },
              ],
              rows: dynamicDataTableRows,
            })

            // Table
            // const numberColumn = bnDetailWS.getColumn('A')
            const descriptionColumn = bnDetailWS.getColumn('B')
            const vendorTypeColumn = bnDetailWS.getColumn('C')
            const vendorCategoryColumn = bnDetailWS.getColumn('D')
            const recommendedVendorColumn = bnDetailWS.getColumn('E')
            const qtyColumn = bnDetailWS.getColumn('F')
            const unitColumn = bnDetailWS.getColumn('G')
            const pkgQtyColumn = bnDetailWS.getColumn('H')
            const pkgUnitColumn = bnDetailWS.getColumn('I')
            const unitCostColumn = bnDetailWS.getColumn('J')
            const totalRequestedColumn = bnDetailWS.getColumn('K')
            const totalPaymentRequestColumn = bnDetailWS.getColumn('L')
            const remainingRfColumn = bnDetailWS.getColumn('M')

            descriptionColumn.width = 30
            vendorTypeColumn.width = 18
            vendorCategoryColumn.width = 25
            recommendedVendorColumn.width = 10
            qtyColumn.width = 15
            unitColumn.width = 10
            pkgQtyColumn.width = 15
            pkgUnitColumn.width = 15
            unitCostColumn.width = 20
            totalRequestedColumn.width = 20
            totalPaymentRequestColumn.width = 25
            remainingRfColumn.width = 20

            // =============== Table Header : START ===============
            const columnLists = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M']
            columnLists.map((item) => {
              bnDetailWS.getCell(`${item}${tableDataFormula}`).alignment = {
                vertical: 'middle',
                horizontal: 'left',
              }
              bnDetailWS.getCell(`${item}${tableDataFormula}`).font = {
                color: { argb: '#475467' },
              }
              bnDetailWS.getCell(`${item}${tableDataFormula}`).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '#f9fafb' },
              }
              bnDetailWS.getCell(`${item}${tableDataFormula}`).border = {
                top: { style: 'thin', color: { argb: 'eaecf0' } },
                bottom: { style: 'thin', color: { argb: 'eaecf0' } },
              }
            })
            bnDetailWS.getColumn('I').numFmt = IDRCurrencyFormat
            bnDetailWS.getColumn('J').numFmt = IDRCurrencyFormat
            bnDetailWS.getColumn('K').numFmt = IDRCurrencyFormat
            bnDetailWS.getColumn('L').numFmt = IDRCurrencyFormat
            bnDetailWS.getColumn('M').numFmt = IDRCurrencyFormat

            bnDetailWS.getRow(tableDataFormula).height = 24

            // =============== Table Header : END ===============

            dynamicDataTableRows.map((_, itemIndex) => {
              // Alignment
              bnDetailWS.getCell(`A${tableDataFormula + (itemIndex + 1)}`).alignment = {
                vertical: 'middle',
                horizontal: 'left',
              }
              bnDetailWS.getCell(`B${tableDataFormula + (itemIndex + 1)}`).alignment = {
                vertical: 'middle',
                horizontal: 'left',
                wrapText: true,
              }
              bnDetailWS.getCell(`C${tableDataFormula + (itemIndex + 1)}`).alignment = {
                vertical: 'middle',
                horizontal: 'left',
              }
              bnDetailWS.getCell(`D${tableDataFormula + (itemIndex + 1)}`).alignment = {
                vertical: 'middle',
                horizontal: 'left',
              }
              bnDetailWS.getCell(`E${tableDataFormula + (itemIndex + 1)}`).alignment = {
                vertical: 'middle',
                horizontal: 'left',
              }
              bnDetailWS.getCell(`F${tableDataFormula + (itemIndex + 1)}`).alignment = {
                vertical: 'middle',
                horizontal: 'left',
              }
              bnDetailWS.getCell(`G${tableDataFormula + (itemIndex + 1)}`).alignment = {
                vertical: 'middle',
                horizontal: 'left',
              }
              bnDetailWS.getCell(`H${tableDataFormula + (itemIndex + 1)}`).alignment = {
                vertical: 'middle',
                horizontal: 'left',
              }
              bnDetailWS.getCell(`I${tableDataFormula + (itemIndex + 1)}`).alignment = {
                vertical: 'middle',
                horizontal: 'left',
              }
              bnDetailWS.getCell(`J${tableDataFormula + (itemIndex + 1)}`).alignment = {
                vertical: 'middle',
                horizontal: 'left',
              }
              bnDetailWS.getCell(`K${tableDataFormula + (itemIndex + 1)}`).alignment = {
                vertical: 'middle',
                horizontal: 'left',
              }
              bnDetailWS.getCell(`L${tableDataFormula + (itemIndex + 1)}`).alignment = {
                vertical: 'middle',
                horizontal: 'left',
              }
              bnDetailWS.getCell(`M${tableDataFormula + (itemIndex + 1)}`).alignment = {
                vertical: 'middle',
                horizontal: 'left',
              }

              // Font
              bnDetailWS.getCell(`A${tableDataFormula + (itemIndex + 1)}`).font = {
                color: { argb: '#475467' },
              }
              bnDetailWS.getCell(`B${tableDataFormula + (itemIndex + 1)}`).font = {
                color: { argb: '#475467' },
              }
              bnDetailWS.getCell(`C${tableDataFormula + (itemIndex + 1)}`).font = {
                color: { argb: '#475467' },
              }
              bnDetailWS.getCell(`D${tableDataFormula + (itemIndex + 1)}`).font = {
                color: { argb: '#475467' },
              }
              bnDetailWS.getCell(`E${tableDataFormula + (itemIndex + 1)}`).font = {
                color: { argb: '#475467' },
              }
              bnDetailWS.getCell(`F${tableDataFormula + (itemIndex + 1)}`).font = {
                color: { argb: '#475467' },
              }
              bnDetailWS.getCell(`G${tableDataFormula + (itemIndex + 1)}`).font = {
                color: { argb: '#475467' },
              }
              bnDetailWS.getCell(`H${tableDataFormula + (itemIndex + 1)}`).font = {
                color: { argb: '#475467' },
              }
              bnDetailWS.getCell(`I${tableDataFormula + (itemIndex + 1)}`).font = {
                color: { argb: '#475467' },
              }
              bnDetailWS.getCell(`J${tableDataFormula + (itemIndex + 1)}`).font = {
                color: { argb: '#475467' },
              }
              bnDetailWS.getCell(`K${tableDataFormula + (itemIndex + 1)}`).font = {
                color: { argb: '#475467' },
              }
              bnDetailWS.getCell(`L${tableDataFormula + (itemIndex + 1)}`).font = {
                color: { argb: '#475467' },
              }
              bnDetailWS.getCell(`M${tableDataFormula + (itemIndex + 1)}`).font = {
                color: { argb: '#475467' },
              }
            })
          }

          bnDetailWS.mergeCells(`L${subActivityValueFormula}:M${subActivityValueFormula}`)
        })

        bnDetailWS.mergeCells(`L${activityTitleFormula}:M${activityValueFormula}`)
      })

      // ================== WORKBOOK (Fund Received): START ==================
      const workSheetNameFundWS = bnWB.addWorksheet(workSheetNameFundReceived)

      workSheetNameFundWS.getCell('A1').value = workSheetNameFundReceived
      workSheetNameFundWS.getCell('A2').value = programDetail.program_name

      workSheetNameFundWS.getCell('A4').value = 'Total Fund Received Amount'
      workSheetNameFundWS.getCell('A5').value = fundReceivedData?.reduce((acc, curr) => acc + curr.amount, 0)
      workSheetNameFundWS.mergeCells('A5:B5')

      workSheetNameFundWS.getCell('A7').value = 'PROOF OF PAYMENT'
      workSheetNameFundWS.mergeCells('A7:D7')

      let lastRowFundReceived = 7

      if (fundReceivedData.length > 0) {
        for (const [index, attachment] of fundReceivedData.entries()) {
          const indexing = ++lastRowFundReceived
          workSheetNameFundWS.getCell(`A${indexing}`).value = `${index < 9 ? '0' : ''}${
            fundReceivedData.length - index
          }`
          workSheetNameFundWS.getCell(`B${indexing}`).value = dayjs(attachment.created_at).format('DD MMM YYYY, HH:mm')
          workSheetNameFundWS.getCell(`C${indexing}`).value = attachment.amount
          workSheetNameFundWS.getCell(`D${indexing}`).value =
            typeof attachment.documents === 'string'
              ? {
                  text: attachment.documents,
                  hyperlink: attachment.documents,
                  tooltip: attachment.documents,
                }
              : attachment?.documents?.[0]?.split('/')[1] || '-'

          // Mean ony process the file format, not string url
          if (typeof attachment.documents !== 'string') {
            const attachmentUrl = await getOriginalUrlFile(attachment?.documents?.[0])

            attachmentFiles.push({
              name: `fund-received/${attachment?.documents?.[0]?.split('/')[1]}`,
              url: attachmentUrl,
            })
          }

          // Style additional attachment
          workSheetNameFundWS.getRow(1).font = {
            bold: true,
            size: 16,
          }
          workSheetNameFundWS.getRow(2).font = {
            size: 14,
            color: { argb: '#101828' },
          }

          workSheetNameFundWS.getRow(4).font = {
            size: 14,
          }
          workSheetNameFundWS.getRow(5).font = {
            bold: true,
            size: 16,
            color: { argb: '#101828' },
          }
          workSheetNameFundWS.getCell(`A5`).alignment = {
            vertical: 'middle',
            horizontal: 'left',
          }
          workSheetNameFundWS.getCell(`A7`).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '#fce5cd' },
          }
          workSheetNameFundWS.getCell(`A7`).alignment = {
            vertical: 'middle',
            horizontal: 'center',
          }
          workSheetNameFundWS.getRow(7).height = 22

          workSheetNameFundWS.getCell(`C${indexing}`).alignment = {
            vertical: 'middle',
            horizontal: 'left',
          }

          workSheetNameFundWS.getCell('A5').numFmt = IDRCurrencyFormat
          workSheetNameFundWS.getColumn('C').numFmt = IDRCurrencyFormat

          workSheetNameFundWS.getColumn('A').width = 7
          workSheetNameFundWS.getColumn('B').width = 25
          workSheetNameFundWS.getColumn('C').width = 20
          workSheetNameFundWS.getColumn('D').width = 90
        }
      }

      // ================== WORKBOOK (Fund Received): END ==================

      // ================== WORKBOOK (Budget Need Version): START ==================
      const workSheetNameBNVersionWS = bnWB.addWorksheet(workSheetNameBNVersion)

      workSheetNameBNVersionWS.getCell('A1').value = workSheetNameBNVersion
      workSheetNameBNVersionWS.getCell('A2').value = programDetail.program_name

      workSheetNameBNVersionWS.getCell('A4').value = 'REVISION VERSIONING'
      workSheetNameBNVersionWS.mergeCells('A4:D4')

      let lastRowBNVersion = 4

      const reversedSnapshot = programDetail?.snapshoot_path.reverse()

      if (reversedSnapshot.length > 0) {
        for (const result of reversedSnapshot.entries()) {
          const index = result[0]
          const snapshoot = result[1]
          let indexingBottom = 0

          const indexing = ++lastRowBNVersion + indexingBottom + index
          indexingBottom = indexing + 1

          workSheetNameBNVersionWS.getCell(`A${indexing}`).value = `v${
            reversedSnapshot.length - index < 10 ? '0' : ''
          }${reversedSnapshot.length - index}`
          workSheetNameBNVersionWS.getCell(`B${indexing}`).value = 'Submitted'
          workSheetNameBNVersionWS.getCell(`B${indexingBottom}`).value = dayjs(snapshoot.submitted_at).format(
            'DD MMM YYYY, HH:mm',
          )
          workSheetNameBNVersionWS.getCell(`C${indexing}`).value = 'Approved'
          workSheetNameBNVersionWS.getCell(`C${indexingBottom}`).value = dayjs(snapshoot.approved_at).format(
            'DD MMM YYYY, HH:mm',
          )

          const attachmentUrl = await getOriginalUrlFile(`puskapa-program-snapshoot/${snapshoot.path}`)

          workSheetNameBNVersionWS.getCell(`D${indexing}`).value = snapshoot.path

          attachmentFiles.push({
            name: `budget-need-revision/${snapshoot.path}`,
            url: attachmentUrl,
          })

          // Style additional attachment
          workSheetNameBNVersionWS.mergeCells(`A${indexing}:A${indexingBottom}`)
          workSheetNameBNVersionWS.mergeCells(`D${indexing}:D${indexingBottom}`)
          workSheetNameBNVersionWS.getCell(`A${indexing}`).alignment = {
            vertical: 'middle',
            horizontal: 'center',
          }
          workSheetNameBNVersionWS.getCell(`D${indexing}`).alignment = {
            vertical: 'middle',
            horizontal: 'center',
          }
          workSheetNameBNVersionWS.getRow(1).font = {
            bold: true,
            size: 16,
          }
          workSheetNameBNVersionWS.getRow(2).font = {
            size: 14,
            color: { argb: '#101828' },
          }
          workSheetNameBNVersionWS.getCell('A4').fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '#fce5cd' },
          }
          workSheetNameBNVersionWS.getCell('A4').alignment = {
            vertical: 'middle',
            horizontal: 'center',
          }
          workSheetNameBNVersionWS.getRow(4).height = 22

          workSheetNameBNVersionWS.getColumn('A').width = 7
          workSheetNameBNVersionWS.getColumn('B').width = 20
          workSheetNameBNVersionWS.getColumn('C').width = 20
          workSheetNameBNVersionWS.getColumn('D').width = 40
        }
      }
      // ================== WORKBOOK (Budget Need Version): END ==================

      // ================== WORKBOOK (Perdiem Setting): START ==================
      const workSheetNamePerdiemSettingWS = bnWB.addWorksheet(workSheetNamePerdiemSetting)

      workSheetNamePerdiemSettingWS.getCell('A1').value = workSheetNamePerdiemSetting
      workSheetNamePerdiemSettingWS.getCell('A2').value = programDetail.program_name

      workSheetNamePerdiemSettingWS.getCell('A4').value = 'Perdiem Base Value'
      workSheetNamePerdiemSettingWS.getCell('A5').value = 'This will serve as Unit Cost of Perdiem.'

      workSheetNamePerdiemSettingWS.getCell('A7').value = 'Perdiem: Normal'
      workSheetNamePerdiemSettingWS.getCell('B7').value = perdiemSettingData?.base_value_normal
      workSheetNamePerdiemSettingWS.getCell('B7').numFmt = IDRCurrencyFormat
      workSheetNamePerdiemSettingWS.getCell('A7').alignment = {
        vertical: 'middle',
        horizontal: 'left',
      }
      workSheetNamePerdiemSettingWS.getCell('B7').alignment = {
        vertical: 'middle',
        horizontal: 'left',
      }

      workSheetNamePerdiemSettingWS.getCell('A8').value = 'Perdiem: Pelosok'
      workSheetNamePerdiemSettingWS.getCell('B8').value = perdiemSettingData?.base_value_remote_area
      workSheetNamePerdiemSettingWS.getCell('B8').numFmt = IDRCurrencyFormat
      workSheetNamePerdiemSettingWS.getCell('A8').alignment = {
        vertical: 'middle',
        horizontal: 'left',
      }
      workSheetNamePerdiemSettingWS.getCell('B8').alignment = {
        vertical: 'middle',
        horizontal: 'left',
      }

      workSheetNamePerdiemSettingWS.getCell('A9').value = 'Perdiem: Luar Negeri'
      workSheetNamePerdiemSettingWS.getCell('B9').value = perdiemSettingData?.base_value_overseas
      workSheetNamePerdiemSettingWS.getCell('B9').numFmt = IDRCurrencyFormat
      workSheetNamePerdiemSettingWS.getCell('A9').alignment = {
        vertical: 'middle',
        horizontal: 'left',
      }
      workSheetNamePerdiemSettingWS.getCell('B9').alignment = {
        vertical: 'middle',
        horizontal: 'left',
      }

      workSheetNamePerdiemSettingWS.getCell('A11').value = 'Percentage Calculation'
      workSheetNamePerdiemSettingWS.getCell('A12').value = 'This setup relate to Travel Expenses'

      // ============   Percentage Calculation: START   ============
      workSheetNamePerdiemSettingWS.getCell('A14').value = 'Makan Pagi Ditanggung'
      workSheetNamePerdiemSettingWS.getCell('A15').value = '(Pengurangan dari total Perdiem)'
      workSheetNamePerdiemSettingWS.getCell('A15').font = {
        size: 11,
      }
      workSheetNamePerdiemSettingWS.getCell('B14').value = `${perdiemSettingData.travel_expense_percentages.breakfast}%`
      workSheetNamePerdiemSettingWS.getCell('B14').font = {
        size: 16,
        bold: true,
      }
      workSheetNamePerdiemSettingWS.mergeCells('B14:B15')
      workSheetNamePerdiemSettingWS.getCell('B14').alignment = {
        vertical: 'middle',
        horizontal: 'center',
      }

      workSheetNamePerdiemSettingWS.getCell('A16').value = 'Makan Siang Ditanggung'
      workSheetNamePerdiemSettingWS.getCell('A17').value = '(Pengurangan dari total Perdiem)'
      workSheetNamePerdiemSettingWS.getCell('A17').font = {
        size: 11,
      }
      workSheetNamePerdiemSettingWS.getCell('B16').value = `${perdiemSettingData.travel_expense_percentages.lunch}%`
      workSheetNamePerdiemSettingWS.getCell('B16').font = {
        size: 16,
        bold: true,
      }
      workSheetNamePerdiemSettingWS.mergeCells('B16:B17')
      workSheetNamePerdiemSettingWS.getCell('B16').alignment = {
        vertical: 'middle',
        horizontal: 'center',
      }

      workSheetNamePerdiemSettingWS.getCell('A18').value = 'Makan Malam Ditanggung'
      workSheetNamePerdiemSettingWS.getCell('A19').value = '(Pengurangan dari total Perdiem)'
      workSheetNamePerdiemSettingWS.getCell('A19').font = {
        size: 11,
      }
      workSheetNamePerdiemSettingWS.getCell('B18').value = `${perdiemSettingData.travel_expense_percentages.dinner}%`
      workSheetNamePerdiemSettingWS.getCell('B18').font = {
        size: 16,
        bold: true,
      }
      workSheetNamePerdiemSettingWS.mergeCells('B18:B19')
      workSheetNamePerdiemSettingWS.getCell('B18').alignment = {
        vertical: 'middle',
        horizontal: 'center',
      }

      workSheetNamePerdiemSettingWS.getCell('A20').value = 'Malam Tidak Menginap'
      workSheetNamePerdiemSettingWS.getCell('A21').value = '(Pengurangan dari total Perdiem)'
      workSheetNamePerdiemSettingWS.getCell('A21').font = {
        size: 11,
      }
      workSheetNamePerdiemSettingWS.getCell(
        'B20',
      ).value = `${perdiemSettingData.travel_expense_percentages.non_overnight}%`
      workSheetNamePerdiemSettingWS.getCell('B20').font = {
        size: 16,
        bold: true,
      }
      workSheetNamePerdiemSettingWS.mergeCells('B20:B21')
      workSheetNamePerdiemSettingWS.getCell('B20').alignment = {
        vertical: 'middle',
        horizontal: 'center',
      }

      workSheetNamePerdiemSettingWS.getCell('A22').value = 'Hari Perjalanan'
      workSheetNamePerdiemSettingWS.getCell('A23').value = '(Penambahan dari total Perdiem)'
      workSheetNamePerdiemSettingWS.getCell('A23').font = {
        size: 11,
      }
      workSheetNamePerdiemSettingWS.getCell(
        'B22',
      ).value = `${perdiemSettingData.travel_expense_percentages.travel_days}%`
      workSheetNamePerdiemSettingWS.getCell('B22').font = {
        size: 16,
        bold: true,
      }
      workSheetNamePerdiemSettingWS.mergeCells('B22:B23')
      workSheetNamePerdiemSettingWS.getCell('B22').alignment = {
        vertical: 'middle',
        horizontal: 'center',
      }
      // ============   Percentage Calculation: END   ============

      workSheetNamePerdiemSettingWS.getCell('A25').value = 'Notes (Optional)'
      workSheetNamePerdiemSettingWS.getCell('A25').alignment = {
        vertical: 'middle',
        horizontal: 'left',
      }
      workSheetNamePerdiemSettingWS.getCell('B25').value = perdiemSettingData.note
      workSheetNamePerdiemSettingWS.mergeCells('B25:F25')
      workSheetNamePerdiemSettingWS.getCell('B25').alignment = {
        vertical: 'middle',
        horizontal: 'left',
        wrapText: true,
      }

      // Styling
      workSheetNamePerdiemSettingWS.getRow(1).font = {
        bold: true,
        size: 16,
      }
      workSheetNamePerdiemSettingWS.getRow(2).font = {
        size: 14,
        color: { argb: '#101828' },
      }

      workSheetNamePerdiemSettingWS.getRow(4).font = {
        size: 13,
      }
      workSheetNamePerdiemSettingWS.getRow(5).font = {
        size: 12,
      }
      workSheetNamePerdiemSettingWS.getRow(11).font = {
        size: 13,
      }
      workSheetNamePerdiemSettingWS.getRow(12).font = {
        size: 12,
      }

      workSheetNamePerdiemSettingWS.getColumn('A').width = 30
      workSheetNamePerdiemSettingWS.getColumn('B').width = 20

      // ================== WORKBOOK (Perdiem Setting): END ==================

      const bnDetailBuf = await bnWB.xlsx.writeBuffer()
      const budgetNeedsExcel = new Blob([bnDetailBuf], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })

      zip.file(`${fileNameBN}.xlsx`, budgetNeedsExcel)

      // ============

      const attachmentBlobCollections = attachmentFiles.map(async (file) => {
        const response = await fetch(file.url)
        const data = await response.blob()
        zip.file(file.name, data)

        return data
      })

      const zipName = `${programDetail.program_name} - Budget Needs`

      Promise.all(attachmentBlobCollections).then(() => {
        zip.generateAsync({ type: 'blob' }).then((content) => {
          saveAs(content, `${zipName}.zip`)
        })
      })
    } catch (error) {
      console.error('<<<ERRROR>>>', error)
      console.error('Something Went Wrong', error.message)
    } finally {
      bnWB.removeWorksheet(workSheetNameBN)
      bnWB.removeWorksheet(workSheetNameFundReceived)
      bnWB.removeWorksheet(workSheetNameBNVersion)
      bnWB.removeWorksheet(workSheetNamePerdiemSetting)

      setTimeout(() => {
        setLoadingButtonStatement((prev) => ({
          ...prev,
          exportExcel: false,
        }))
      }, 800)

      attachmentFiles = []
    }
  }

  const submitFundReceivedHandler: SubmitHandler<ProgramReceivedFundRequest> = async (formInput) => {
    setLoadingButtonStatement((prev) => ({ ...prev, submitFundReceived: true }))

    if (formInput.source.toUpperCase() === FUND_RECEIVED_TYPE.DONOR_REIMBURSE) {
      const puskapaTotal =
        fundReceivedData
          ?.filter((item) => item.source === FUND_RECEIVED_TYPE.PUSKAPA)
          ?.reduce((acc, curr) => acc + curr.amount, 0) || 0
      const donorReimburseTotal =
        fundReceivedData
          ?.filter((item) => item.source === FUND_RECEIVED_TYPE.DONOR_REIMBURSE)
          ?.reduce((acc, curr) => acc + curr.amount, 0) || 0
      const grandTotalOfPuskapa = puskapaTotal - donorReimburseTotal < 0 ? 0 : puskapaTotal - donorReimburseTotal

      if (Number(formInput.amount) > Number(grandTotalOfPuskapa)) {
        toast.warn(
          `Donor (reimburse) may not be greater than Puskapa (${formatCurrency('IDR', Number(grandTotalOfPuskapa))})`,
        )
        setLoadingButtonStatement((prev) => ({
          ...prev,
          submitFundReceived: false,
        }))
        return
      }
    }

    const result = {
      amount: Number(formInput.amount),
      notes: formInput.notes,
      source: formInput.source.toUpperCase(),
      documents: switchTogglableButton.fundReceivedDocuments
        ? [`${formInput.documents}`]
        : documentsPath?.['fund_received_documents'],
    }

    const submitFundReceive = programApi.programControllerSubmitFundReceived(programId, result)

    toast.promise(submitFundReceive, {
      pending: 'Submitting fund received',
      success: 'Fund received submitted successfully',
      error: 'Fund received submit failed',
    })

    submitFundReceive.finally(() => {
      fundReceivedTrigger()
      closeSubmitFundReceivedDrawer()

      setSwitchTogglableButton((prev) => ({
        ...prev,
        fundReceivedDocuments: false,
      }))

      setTimeout(() => {
        openViewFundReceivedDrawer()
      }, 500)

      setTimeout(() => {
        resetFundReceived()
        setLoadingButtonStatement((prev) => ({
          ...prev,
          submitFundReceived: false,
        }))
      }, 1000)
    })
  }

  const handleUploadFile = async (fileObjects: File[], fileUploadType: 'fund_received_documents') => {
    if (!Array.isArray(fileObjects)) return
    const bucketName = BucketsEnum.program_snapshoot

    fileObjects.map(async (fileObject) => {
      const presignUrl = await fileApi.fileControllerGetPresignUrl(fileObject.name, bucketName)

      const fileNameS3 = String(presignUrl.data.data).split('::')[0]

      await axios.put(String(presignUrl.data.data).split('::')[1], fileObject, {
        headers: {
          'Content-Type': fileObject.type,
        },
        onUploadProgress: (e) => {
          const percentCompleted = Math.round((e.loaded * 100) / e.total)

          setTempProgressUpload((prev) => ({
            ...prev,
            [fileUploadType]: {
              bucketName,
              progress: percentCompleted,
              identifier: fileUploadType,
            },
          }))
        },
      })

      switch (fileUploadType) {
        case 'fund_received_documents':
          const fundReceivedDocs = [`${BucketsEnum.program_snapshoot}/${fileNameS3}`]

          setDocumentsPath((prev) => ({
            ...prev,
            fund_received_documents: fundReceivedDocs,
          }))
          break
        default:
          break
      }
    })
  }

  // Tab configuration object for better maintainability
  const TAB_CONFIG = {
    information: { index: 0, slug: 'information' },
    activity: { index: 1, slug: 'activity' },
    'budget-needs': { index: 2, slug: 'budget-needs' },
    'requisition-form': { index: 3, slug: 'requisition-form' },
    'payment-request': { index: 4, slug: 'payment-request' },
    'log-activity': { index: 5, slug: 'log-activity' },
  } as const

  type TabSlug = keyof typeof TAB_CONFIG

  // Helper functions
  const getIndexFromTab = (tab: string | string[] | undefined): number => {
    const tabKey = (tab || 'information') as TabSlug
    return TAB_CONFIG[tabKey]?.index ?? 0
  }

  const getTabFromIndex = (indexValue: number): TabSlug => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const entry = Object.entries(TAB_CONFIG).find(([_, config]) => config.index === indexValue)
    return (entry?.[0] as TabSlug) ?? 'information'
  }

  // Derive index from URL query param (single source of truth)
  const index = getIndexFromTab(router.query.tab)

  const submitRef = useRef(null)

  const openBudgetNeedsVersion = () => {
    setBudgetNeedsVersionDrawer(true)
  }

  const openPerdiemSettingDrawer = () => {
    setPerdiemSettingDrawer(true)
  }

  const closePerdiemSettingDrawer = useCallback(() => {
    setPerdiemSettingDrawer(false)
  }, [])

  const openSubmitFundReceivedDrawer = () => {
    setSubmitFundReceivedDrawer(true)
  }

  const closeSubmitFundReceivedDrawer = useCallback(() => {
    setSubmitFundReceivedDrawer(false)
    resetFundReceived()
    setFundReceivedDocuments([])
    setTempProgressUpload({})
  }, [])

  const openViewFundReceivedDrawer = () => {
    setViewFundReceivedDrawer(true)
  }

  const closeViewFundReceivedDrawer = useCallback(() => {
    setViewFundReceivedDrawer(false)
  }, [])

  const openReviseBudget = () => {
    setIsOpenModal((prev: ModalStatement) => ({
      ...prev,
      reviseProject: true,
    }))
  }

  const closeReviseProject = () => {
    reset()
    setReviseBudgetNeedsDoc([])
    setIsOpenModal((prev: ModalStatement) => ({
      ...prev,
      reviseProject: false,
    }))
  }

  const reviseProjectSubmit: SubmitHandler<ProgramReviseBudgetDocs> = async (input) => {
    let fileNameS3 = ''

    if (!switchTogglableButton.reviseDocument) {
      const identifier = 'revise_doc_path'
      const presignUrl = await fileApi.fileControllerGetPresignUrl(
        reviseBudgetNeedsDoc[0].name,
        BucketsEnum.revise_approval_doc,
      )

      fileNameS3 = String(presignUrl.data.data).split('::')[0]

      await axios.put(String(presignUrl.data.data).split('::')[1], reviseBudgetNeedsDoc[0], {
        headers: {
          'Content-Type': reviseBudgetNeedsDoc[0].type,
        },
        onUploadProgress: (e) => {
          const percentCompleted = Math.round((e.loaded * 100) / e.total)
          setTempProgressUpload((prev) => ({
            ...prev,
            [identifier]: {
              bucketName: BucketsEnum.revise_approval_doc,
              progress: percentCompleted,
              identifier,
            },
          }))
        },
      })
    }

    const result = {
      revise_doc_path: switchTogglableButton.reviseDocument
        ? [`${input.revise_doc_path}`]
        : [`${BucketsEnum.revise_approval_doc}/${fileNameS3}`],
      revise_note: input.revise_note,
      revise_amount: Number(input.revise_amount) || 0,
    } as ProgramReviseBudgetDocs

    const requestReviseBudget = programApi.programControllerReviseBudget(programId, result)

    toast.promise(requestReviseBudget, {
      pending: 'Submitting revise project',
      success: 'Revise project added',
      error: 'Promise rejected 🤯',
    })

    requestReviseBudget.finally(() => {
      closeReviseProject()
      router.replace(router.asPath)
      triggerCollection()
    })
  }

  const handleLoadingButton = (action: string, statement: boolean) => {
    if (action === 'activity') {
      setLoadingButtonStatement((prev) => ({ ...prev, activity: statement }))
    } else if (action === 'budgetNeeds') {
      setLoadingButtonStatement((prev) => ({ ...prev, budgetNeeds: statement }))
    }
  }

  const cancelSubmissionHandler = async () => {
    const approvalResponse = programApi.programControllerApprovalProgram(programId, {
      status: ProgramStatusStatusEnum.Cancelled,
      notes: '',
    })

    toast.promise(approvalResponse, {
      pending: 'Cancelling budget needs',
      success: 'Budget needs canceled',
      error: 'Promise rejected 🤯',
    })

    approvalResponse.finally(() => {
      router.replace(router.asPath)
      triggerCollection()
    })
  }

  const handleIndexTabs = (value: number) => {
    const tab = getTabFromIndex(value)
    router.push({
      pathname: router.pathname,
      query: {
        ...router.query,
        tab,
      },
    })
  }

  const triggerCollection = () => {
    budgetNeedsTrigger()
    programTrigger()
    perdiemSettingTrigger()
  }

  const deleteReviseBudgetNeedsDoc = async (filename: string) => {
    setValue('revise_doc_path', undefined)
    setReviseBudgetNeedsDoc((prev) => prev.filter((item) => item.path !== filename))
  }

  const deleteFundReceivedDocuments = async (filename: string) => {
    setDocumentsPath((prev) => {
      prev['fund_received_documents'] = prev['fund_received_documents'].filter((path) => !path.includes(filename))
      return prev
    })
    setFundReceivedDocuments((prev) => prev.filter((item) => item.path !== filename))
  }

  useEffect(() => {
    if (programDetail?.program_ownership_type === ProgramCreateRequestProgramOwnershipTypeEnum.Internal) {
      handleInternal(true)
    } else {
      handleInternal(false)
    }
  }, [programDetail?.program_ownership_type])

  useEffect(() => {
    if (!programBudgetDetail) return

    if (isCheckboxEnabled) {
      setValue('revise_amount', calculateTotalBudget(programBudgetDetail))
    } else {
      setValue('revise_amount', 0)
    }
  }, [isCheckboxEnabled, programBudgetDetail])

  useEffect(() => {
    if (perdiemSettingData?.base_value_normal) {
      setValuePerdiemSetting('base_value_normal', perdiemSettingData?.base_value_normal)
      setValuePerdiemSetting('base_value_overseas', perdiemSettingData?.base_value_overseas)
      setValuePerdiemSetting('base_value_remote_area', perdiemSettingData?.base_value_remote_area)
      setValuePerdiemSetting('travel_perdiem', perdiemSettingData?.travel_perdiem)
      setValuePerdiemSetting('activity_perdiem', perdiemSettingData?.activity_perdiem)
      setValuePerdiemSetting(
        'travel_expense_percentages.breakfast',
        perdiemSettingData?.travel_expense_percentages.breakfast,
      )
      setValuePerdiemSetting('travel_expense_percentages.lunch', perdiemSettingData?.travel_expense_percentages.lunch)
      setValuePerdiemSetting('travel_expense_percentages.dinner', perdiemSettingData?.travel_expense_percentages.dinner)
      setValuePerdiemSetting(
        'travel_expense_percentages.non_overnight',
        perdiemSettingData?.travel_expense_percentages.non_overnight,
      )
      setValuePerdiemSetting(
        'travel_expense_percentages.travel_days',
        perdiemSettingData?.travel_expense_percentages.travel_days,
      )
      setValuePerdiemSetting('note', perdiemSettingData?.note)
    }
  }, [perdiemSettingData])

  useEffect(() => {
    perdiemSettingTrigger()
    fundReceivedTrigger()
  }, [])

  if (!programDetail) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader customText="Loading Data..." />
      </div>
    )
  }

  if (
    (programDetail.approval === 'success' || programDetail.approval === 'pending') &&
    programTabsIdentifier === 'activity'
  ) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Not allowed to update activity - bypass detected</p>
      </div>
    )
  }

  if (
    (programDetail.approval === 'success' || programDetail.approval === 'pending') &&
    programTabsIdentifier === 'budget-needs'
  ) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Not allowed to update budget needs - bypass detected</p>
      </div>
    )
  }

  return (
    <>
      <NextSeo
        title={`${programDetail.program_name} - Project Detail`}
        canonical={`${MAIN_URL_FE}dashboard/project/${programId}`}
      />
      <Dashboard
        breadcrumbLists={[
          { title: 'Project List', url: '/dashboard/project' },
          {
            title: programDetail.program_name,
            url: `/dashboard/project/${programId}`,
          },
        ]}
      >
        <>
          <div className="mb-1 mt-5 flex flex-col items-start justify-between gap-4 border-b border-b-gray-200 px-7 pb-5 sm:flex-row sm:items-center sm:gap-2 xl:px-10">
            {programTabsIdentifier === 'activity' && (
              <>
                <h1 className="text-2xl font-semibold capitalize text-gray-900">Activity Form</h1>
                <div className="flex shrink-0 flex-wrap items-center gap-2 xxs:gap-3">
                  <Button
                    type="button"
                    btnType="normal"
                    size="md"
                    variant="secondary-gray"
                    onClick={() => {
                      return router.back()
                      // router.push(`/dashboard/project/${programId}`)
                    }}
                  >
                    Back
                  </Button>
                  <ProgramRoleAccessControlProvider
                    programId={programId}
                    task={programTasks.EDIT_PROJECT_ACTIVITY}
                    action={accessActionType.UPDATE}
                    replaceWith={
                      <Button type="button" btnType="normal" size="md" variant="primary" disabled>
                        Save Activity
                        <PlusIcon className="h-5 w-5 stroke-white" />
                      </Button>
                    }
                  >
                    <Button
                      type="submit"
                      btnType="normal"
                      size="md"
                      variant="primary"
                      isLoading={loadingButtonStatement.activity}
                      onClick={() => submitRef.current.click()}
                    >
                      Save Activity
                      <PlusIcon className="h-5 w-5 stroke-white" />
                    </Button>
                  </ProgramRoleAccessControlProvider>
                </div>
              </>
            )}
            {programId && programTabsIdentifier === undefined && (
              <>
                <div className="inline-flex items-center gap-3.5 xxs:gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-gray-200 bg-gray-100">
                    <LayersThree02Icon className="h-8 w-8 stroke-gray-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold capitalize text-gray-900 xxs:mb-1">
                      {programDetail.program_name}
                    </h1>
                    <p className="text-sm font-medium text-gray-400">{programDetail.partner.name}</p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2 xxs:gap-4">
                  <Menu as="div" className="relative inline-block text-left">
                    <Menu.Button className="button secondary grow justify-center gap-2 border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 duration-300 hover:bg-gray-50 hover:text-gray-800 focus:border-gray-300 focus:bg-white focus:ring-4 focus:ring-gray-100 focus-visible:outline-none disabled:border-gray-25 disabled:bg-gray-25 disabled:text-gray-300 disabled:hover:bg-gray-25 disabled:hover:text-gray-300 xxs:justify-start">
                      About Project
                      <ChevronDownIcon data-icon="rotation" className="h-5 w-5 stroke-gray-700" />
                    </Menu.Button>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="min-w absolute right-0 z-20 mt-2 w-64 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
                        <Menu.Item>
                          <div className="w-full px-6 py-4">
                            <p className="text-xs font-semibold text-gray-400">Partner</p>
                            <p className="text-sm text-gray-600">{programDetail.partner.name}</p>
                          </div>
                        </Menu.Item>
                        {!isInternal ? (
                          <>
                            <Menu.Item>
                              <div className="w-full px-6 py-4">
                                <p className="text-xs font-semibold text-gray-400">Grant Manager</p>
                                <p className="text-sm text-gray-600">{programDetail.grant_manager?.full_name}</p>
                              </div>
                            </Menu.Item>
                            <Menu.Item>
                              <div className="w-full px-6 py-4">
                                <p className="text-xs font-semibold text-gray-400">Project Manager</p>
                                <p className="text-sm text-gray-600">{programDetail.program_manager?.full_name}</p>
                              </div>
                            </Menu.Item>
                          </>
                        ) : (
                          <>
                            <Menu.Item>
                              <div className="w-full px-6 py-4">
                                <p className="text-xs font-semibold text-gray-400">Requested By</p>
                                <p className="text-sm text-gray-600">{programDetail.created_by.name}</p>
                              </div>
                            </Menu.Item>
                          </>
                        )}

                        <Menu.Item>
                          <div className="w-full px-6 py-4">
                            <p className="text-xs font-semibold text-gray-400">Timeline</p>
                            <p className="text-sm text-gray-600">
                              {monthNumberToString(programDetail.timeline.start_date.month)}{' '}
                              {programDetail.timeline.start_date.year} -{' '}
                              {monthNumberToString(programDetail.timeline.end_date.month)}{' '}
                              {programDetail.timeline.end_date.year}
                            </p>
                          </div>
                        </Menu.Item>
                        <Menu.Item>
                          <div className="w-full px-6 py-4">
                            <p className="text-xs font-semibold text-gray-400">Total Budget</p>
                            <p className="text-sm text-gray-600">
                              {formatCurrency('IDR', calculateTotalBudget(programBudgetDetail))}
                            </p>
                          </div>
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                  <Menu as="div" className="relative inline-block text-left">
                    <Menu.Button className="button secondary grow justify-center gap-2 border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 duration-300 hover:bg-gray-50 hover:text-gray-800 focus:border-gray-300 focus:bg-white focus:ring-4 focus:ring-gray-100 focus-visible:outline-none disabled:border-gray-25 disabled:bg-gray-25 disabled:text-gray-300 disabled:hover:bg-gray-25 disabled:hover:text-gray-300 xxs:justify-start">
                      {loadingButtonStatement.activity ||
                      loadingButtonStatement.budgetNeeds ||
                      loadingButtonStatement.submitFundReceived ||
                      loadingButtonStatement.exportExcel ? (
                        <div aria-label="Loading..." role="status">
                          <svg
                            aria-hidden="true"
                            className={cn(
                              'h-5 w-5 animate-spin-fast fill-gray-700 text-gray-200 group-disabled:opacity-20',
                            )}
                            viewBox="0 0 100 101"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                              fill="currentColor"
                            />
                            <path
                              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                              fill="currentFill"
                            />
                          </svg>
                        </div>
                      ) : null}
                      Menu
                      <ChevronDownIcon data-icon="rotation" className="h-5 w-5 stroke-gray-700" />
                    </Menu.Button>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 z-20 mt-2 w-64 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
                        <div className="flex flex-col gap-0.5 px-1.5 py-1">
                          <ProgramRoleAccessControlProvider
                            programId={programId}
                            task={programTasks.EDIT_PROJECT_ACTIVITY}
                            action={accessActionType.UPDATE}
                            replaceWith={
                              <Menu.Item disabled>
                                <div className="group flex w-full items-center gap-2 rounded-md border-gray-200 bg-white px-4 py-2.5 text-start text-sm font-medium text-gray-300 duration-300 hover:cursor-not-allowed">
                                  <ActivityIcon className="h-4 w-4 stroke-gray-300" />
                                  Edit Activity
                                </div>
                              </Menu.Item>
                            }
                          >
                            <Menu.Item>
                              {() => (
                                <>
                                  {isProjectActivityEmpty ? (
                                    <div className="group flex w-full items-center gap-2 rounded-md border-gray-200 bg-white px-4 py-2.5 text-start text-sm font-medium text-gray-300 duration-300 hover:cursor-not-allowed">
                                      <ActivityIcon className="h-4 w-4 stroke-gray-300" />
                                      Edit Activity
                                    </div>
                                  ) : (
                                    <>
                                      {programDetail.approval === null ||
                                      programDetail.approval === 'revision' ||
                                      programDetail.approval === 'cancelled' ||
                                      programDetail.approval === 'rejected' ? (
                                        <Link
                                          href={`/dashboard/project/${programId}/activity`}
                                          className="group flex w-full items-center gap-2 rounded-md px-4 py-2.5 text-start text-sm font-medium duration-300 hover:bg-gray-50 hover:text-gray-700"
                                        >
                                          <ActivityIcon className="h-4 w-4 stroke-gray-700" />
                                          Edit Activity
                                        </Link>
                                      ) : (
                                        <div className="group flex w-full items-center gap-2 rounded-md border-gray-200 bg-white px-4 py-2.5 text-start text-sm font-medium text-gray-300 duration-300 hover:cursor-not-allowed">
                                          <ActivityIcon className="h-4 w-4 stroke-gray-300" />
                                          Edit Activity
                                        </div>
                                      )}
                                    </>
                                  )}
                                </>
                              )}
                            </Menu.Item>
                          </ProgramRoleAccessControlProvider>
                          <ProgramRoleAccessControlProvider
                            programId={programId}
                            task={programTasks.EDIT_BUDGET_NEED}
                            action={accessActionType.UPDATE}
                            replaceWith={
                              <Menu.Item disabled>
                                <div className="group flex w-full items-center gap-2 rounded-md border-gray-200 bg-white px-4 py-2.5 text-start text-sm font-medium text-gray-300 duration-300 hover:cursor-not-allowed">
                                  <CoinsStacked03Icon className="h-4 w-4 stroke-gray-300" />
                                  Edit Budget Needs
                                </div>
                              </Menu.Item>
                            }
                          >
                            <Menu.Item>
                              {() => (
                                <>
                                  {isBudgetNeedEmpty ? (
                                    <div className="group flex w-full items-center gap-2 rounded-md border-gray-200 bg-white px-4 py-2.5 text-start text-sm font-medium text-gray-300 duration-300 hover:cursor-not-allowed">
                                      <CoinsStacked03Icon className="h-4 w-4 stroke-gray-300" />
                                      Edit Budget Needs
                                    </div>
                                  ) : (
                                    <>
                                      {programDetail.approval === null ||
                                      programDetail.approval === 'revision' ||
                                      programDetail.approval === 'cancelled' ||
                                      programDetail.approval === 'rejected' ? (
                                        <Link
                                          href={`/dashboard/project/${programId}/budget-needs`}
                                          className="group flex w-full items-center gap-2 rounded-md px-4 py-2.5 text-start text-sm font-medium duration-300 hover:bg-gray-50 hover:text-gray-700"
                                        >
                                          <CoinsStacked03Icon className="h-4 w-4 stroke-gray-700" />
                                          Edit Budget Needs
                                        </Link>
                                      ) : (
                                        <div className="group flex w-full items-center gap-2 rounded-md border-gray-200 bg-white px-4 py-2.5 text-start text-sm font-medium text-gray-300 duration-300 hover:cursor-not-allowed">
                                          <CoinsStacked03Icon className="h-4 w-4 stroke-gray-300" />
                                          Edit Budget Needs
                                        </div>
                                      )}
                                    </>
                                  )}
                                </>
                              )}
                            </Menu.Item>
                          </ProgramRoleAccessControlProvider>
                          <ProgramRoleAccessControlProvider
                            programId={programId}
                            task={programTasks.EDIT_PROGRAM_INFO}
                            action={accessActionType.UPDATE}
                            replaceWith={
                              <Menu.Item disabled>
                                <div className="group flex w-full items-center gap-2 rounded-md border-gray-200 bg-white px-4 py-2.5 text-start text-sm font-medium text-gray-300 duration-300 hover:cursor-not-allowed">
                                  <Edit03Icon className="h-4 w-4 stroke-gray-300" />
                                  Edit Project
                                </div>
                              </Menu.Item>
                            }
                          >
                            <Menu.Item>
                              {() => (
                                <>
                                  {programDetail.approval === null ||
                                  programDetail.approval === 'revision' ||
                                  programDetail.approval === 'cancelled' ||
                                  programDetail.approval === 'rejected' ? (
                                    <>
                                      {programDetail.approval !== 'success' ? (
                                        <button
                                          type="button"
                                          className="group flex w-full items-center gap-2 rounded-md px-4 py-2.5 text-start text-sm font-medium duration-300 hover:bg-gray-50 hover:text-gray-700"
                                          onClick={() => {
                                            setCookie('program_id', programDetail.id)
                                            setCookie('form_wizard_history_add_program', programDetail.form_state)
                                            router.push(`/dashboard/project/edit/${programDetail.id}`)
                                          }}
                                        >
                                          <Edit03Icon className="h-4 w-4 stroke-gray-700" />
                                          Edit Project
                                        </button>
                                      ) : (
                                        <div className="group flex w-full items-center gap-2 rounded-md border-gray-200 bg-white px-4 py-2.5 text-start text-sm font-medium text-gray-300 duration-300 hover:cursor-not-allowed">
                                          <Edit03Icon className="h-4 w-4 stroke-gray-300" />
                                          Edit Project
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <div className="group flex w-full items-center gap-2 rounded-md border-gray-200 bg-white px-4 py-2.5 text-start text-sm font-medium text-gray-300 duration-300 hover:cursor-not-allowed">
                                      <Edit03Icon className="h-4 w-4 stroke-gray-300" />
                                      Edit Project
                                    </div>
                                  )}
                                </>
                              )}
                            </Menu.Item>
                          </ProgramRoleAccessControlProvider>
                        </div>
                        <div className="flex flex-col gap-0.5 px-1.5 py-1">
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                type="button"
                                className={cn(
                                  active ? 'bg-gray-50' : 'text-gray-700',
                                  `group flex w-full items-center gap-2 rounded-md px-4 py-2.5 text-start text-sm font-medium duration-300`,
                                )}
                                onClick={openSubmitFundReceivedDrawer}
                              >
                                <CoinsHandIcon className="h-4 w-4 stroke-gray-700" />
                                Submit Fund Received
                              </button>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                type="button"
                                className={cn(
                                  active ? 'bg-gray-50' : 'text-gray-700',
                                  `group flex w-full items-center gap-2 rounded-md px-4 py-2.5 text-start text-sm font-medium duration-300`,
                                )}
                                onClick={openViewFundReceivedDrawer}
                              >
                                <CoinStacked01Icon className="h-4 w-4 stroke-gray-700" />
                                View Fund Received
                              </button>
                            )}
                          </Menu.Item>
                        </div>
                        <div className="flex flex-col gap-0.5 px-1.5 py-1">
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                type="button"
                                className={cn(
                                  active ? 'bg-gray-50' : 'text-gray-700',
                                  `group flex w-full items-center gap-2 rounded-md px-4 py-2.5 text-start text-sm font-medium duration-300`,
                                )}
                                onClick={openPerdiemSettingDrawer}
                              >
                                <FileSearch02Icon className="h-4 w-4 stroke-gray-700" />
                                View Perdiem Setting
                              </button>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                type="button"
                                className={cn(
                                  active ? 'bg-gray-50' : 'text-gray-700',
                                  `group flex w-full items-center gap-2 rounded-md px-4 py-2.5 text-start text-sm font-medium duration-300`,
                                )}
                                onClick={openBudgetNeedsVersion}
                              >
                                <FileSearch02Icon className="h-4 w-4 stroke-gray-700" />
                                View Budget Needs Vers
                              </button>
                            )}
                          </Menu.Item>
                          {programDetail.approval === 'success' ? (
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  type="button"
                                  className={cn(
                                    active ? 'bg-gray-50' : 'text-gray-700',
                                    `group flex w-full items-center gap-2 rounded-md px-4 py-2.5 text-start text-sm font-medium duration-300`,
                                  )}
                                  onClick={downloadBudgetNeedsExcel}
                                >
                                  <FileDownload02Icon className="h-4 w-4 stroke-gray-700" />
                                  Download Budget Needs
                                </button>
                              )}
                            </Menu.Item>
                          ) : (
                            <Menu.Item disabled>
                              <div className="group flex w-full items-center gap-2 rounded-md border-gray-200 bg-white px-4 py-2.5 text-start text-sm font-medium text-gray-300 duration-300 hover:cursor-not-allowed">
                                <FileDownload02Icon className="h-4 w-4 stroke-gray-300" />
                                Download Budget Needs
                              </div>
                            </Menu.Item>
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5 px-1.5 py-1">
                          <Menu.Item>
                            {({ active }) => (
                              <>
                                {programDetail.approval === 'success' ? (
                                  <ProgramRoleAccessControlProvider
                                    programId={programId}
                                    task={programTasks.REVISE_BUDGET_NEED}
                                    action={accessActionType.CREATE}
                                    replaceWith={
                                      <div className="group flex w-full items-center gap-2 rounded-md border-gray-200 bg-white px-4 py-2.5 text-start text-sm font-medium text-gray-300 duration-300 hover:cursor-not-allowed">
                                        <Edit03Icon className="h-4 w-4 stroke-gray-300" />
                                        Request Project Revision
                                      </div>
                                    }
                                  >
                                    <button
                                      type="button"
                                      className={cn(
                                        active ? 'bg-gray-50' : 'text-gray-700',
                                        `group flex w-full items-center gap-2 rounded-md px-4 py-2.5 text-start text-sm font-medium duration-300`,
                                      )}
                                      onClick={openReviseBudget}
                                    >
                                      <Edit03Icon className="h-4 w-4 stroke-gray-700" />
                                      Request Project Revision
                                    </button>
                                  </ProgramRoleAccessControlProvider>
                                ) : (
                                  <div className="group flex w-full items-center gap-2 rounded-md border-gray-200 bg-white px-4 py-2.5 text-start text-sm font-medium text-gray-300 duration-300 hover:cursor-not-allowed">
                                    <Edit03Icon className="h-4 w-4 stroke-gray-300" />
                                    Request Project Revision
                                  </div>
                                )}
                              </>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <>
                                {programDetail.approval === 'pending' ? (
                                  <ProgramRoleAccessControlProvider
                                    programId={programId}
                                    task={programTasks.REVISE_BUDGET_NEED}
                                    action={accessActionType.CREATE}
                                    replaceWith={
                                      <div className="group flex w-full items-center gap-2 rounded-md border-gray-200 bg-white px-4 py-2.5 text-start text-sm font-medium text-gray-300 duration-300 hover:cursor-not-allowed">
                                        <Edit03Icon className="h-4 w-4 stroke-gray-300" />
                                        Cancel Submission
                                      </div>
                                    }
                                  >
                                    <button
                                      type="button"
                                      className={cn(
                                        active ? 'bg-gray-50' : 'text-gray-700',
                                        `group flex w-full items-center gap-2 rounded-md px-4 py-2.5 text-start text-sm font-medium duration-300`,
                                      )}
                                      onClick={cancelSubmissionHandler}
                                    >
                                      <Edit03Icon className="h-4 w-4 stroke-gray-700" />
                                      Cancel Submission
                                    </button>
                                  </ProgramRoleAccessControlProvider>
                                ) : (
                                  <div className="group flex w-full items-center gap-2 rounded-md border-gray-200 bg-white px-4 py-2.5 text-start text-sm font-medium text-gray-300 duration-300 hover:cursor-not-allowed">
                                    <Edit03Icon className="h-4 w-4 stroke-gray-300" />
                                    Cancel Submission
                                  </div>
                                )}
                              </>
                            )}
                          </Menu.Item>
                        </div>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </div>
              </>
            )}
            {programTabsIdentifier === 'budget-needs' && (
              <>
                <h1 className="text-2xl font-semibold capitalize text-gray-900">Budget Need Form</h1>
                <div className="flex shrink-0 flex-wrap items-center gap-2 xxs:gap-3">
                  <Button
                    type="button"
                    btnType="normal"
                    size="md"
                    variant="secondary-gray"
                    onClick={() => {
                      return router.back()
                    }}
                  >
                    Back
                  </Button>
                  <ProgramRoleAccessControlProvider
                    programId={programId}
                    task={programTasks.ADD_BUDGET_NEED}
                    action={accessActionType.CREATE}
                    replaceWith={
                      <Button type="button" btnType="normal" size="md" variant="primary" disabled>
                        Save Budget Needs
                      </Button>
                    }
                  >
                    <Button
                      type="submit"
                      btnType="normal"
                      size="md"
                      variant="primary"
                      isLoading={loadingButtonStatement.budgetNeeds}
                      onClick={() => submitRef.current.click()}
                    >
                      Save Budget Needs
                    </Button>
                  </ProgramRoleAccessControlProvider>
                </div>
              </>
            )}
          </div>

          {programTabsIdentifier === 'activity' && (
            <div className="p-7 xl:p-10">
              <h6 className="mb-4 text-lg font-semibold text-gray-900">Activities & Sub-Activities</h6>
              <ProjectActivityForm
                handleLoadingButton={handleLoadingButton}
                submitRef={submitRef}
                slugIdentifier={slugIdentifier}
              />
            </div>
          )}

          {programTabsIdentifier === 'budget-needs' && (
            <div className="p-7 xl:p-10">
              <BudgetNeedsForm
                handleLoadingButton={handleLoadingButton}
                submitRef={submitRef}
                slugIdentifier={slugIdentifier}
                programDetail={programDetail}
              />
            </div>
          )}

          {programId && programTabsIdentifier === undefined ? (
            <HorizontalTabs
              tabLists={[
                'Information',
                'Activity',
                'Budget Needs',
                'Requisition Form',
                'Payment Request',
                'Log Activity',
              ]}
              type="underline"
              size="sm"
              handleIndex={handleIndexTabs}
              index={index}
              gapLayout={true}
            >
              <div>
                <ProgramInformation slugIdentifier={slugIdentifier} />
              </div>
              <div>
                <ProjectActivityDetail slugIdentifier={slugIdentifier} />
              </div>
              <div>
                <BudgetNeedsDetail
                  slugIdentifier={slugIdentifier}
                  logProgram={programLogs}
                  totalFundReceived={(() => {
                    const puskapaTotal =
                      fundReceivedData
                        ?.filter((item) => item.source === FUND_RECEIVED_TYPE.PUSKAPA)
                        ?.reduce((acc, curr) => acc + curr.amount, 0) || 0
                    const donorTotal =
                      fundReceivedData
                        ?.filter((item) => item.source === FUND_RECEIVED_TYPE.DONOR)
                        ?.reduce((acc, curr) => acc + curr.amount, 0) || 0
                    const donorReimburseTotal =
                      fundReceivedData
                        ?.filter((item) => item.source === FUND_RECEIVED_TYPE.DONOR_REIMBURSE)
                        ?.reduce((acc, curr) => acc + curr.amount, 0) || 0
                    return (
                      donorTotal +
                      donorReimburseTotal +
                      (puskapaTotal - donorReimburseTotal < 0 ? 0 : puskapaTotal - donorReimburseTotal)
                    )
                  })()}
                  perdiemSettingData={perdiemSettingData}
                  budgetNeedsData={budgetNeedsData}
                  programData={programData}
                  triggerCollection={triggerCollection}
                  isProgramMutating={isProgramMutating}
                />
              </div>
              <div>
                <RequisitionList slugIdentifier={slugIdentifier} />
              </div>
              <div>
                <PaymentRequestList slugIdentifier={slugIdentifier} isGlobalType={true} pageScope="program_details" />
              </div>
              <div>
                <LogActivity logProgram={programLogs} isUsedAtProject={true} />
              </div>
            </HorizontalTabs>
          ) : null}
        </>
      </Dashboard>

      {/* Revise Budget Needs Modal */}
      <Modal
        icon={<Save01Icon className="h-6 w-6 stroke-warning-600" />}
        theme={theme.WARNING}
        modalTitle="Before Revise Project"
        modalDescription="Please upload approval documents from partner and write a message about why you need to revise."
        stateModal={isOpenModal.reviseProject}
        handleCloseModal={closeReviseProject}
      >
        <form className="mt-6" onSubmit={handleSubmit(reviseProjectSubmit)}>
          <div className="flex flex-col gap-5">
            <div>
              <SwitchableUploadField
                name="revise_doc_path"
                label="Document"
                fieldKey="revise_doc_path"
                control={control}
                errors={errors}
                setValue={setValue}
                isLinkMode={switchTogglableButton.reviseDocument}
                onToggle={() => {
                  setSwitchTogglableButton((prev) => ({
                    ...prev,
                    reviseDocument: !prev.reviseDocument,
                  }))
                  setReviseBudgetNeedsDoc([])
                }}
                bucketName={BucketsEnum.revise_approval_doc}
                uploadProgress={tempProgressUpload}
                uploadedFiles={reviseBudgetNeedsDoc}
                setUploadedFiles={setReviseBudgetNeedsDoc}
                handleUploadFile={() => {}}
                deleteFilePath={deleteReviseBudgetNeedsDoc}
                maxFiles={1}
                informationText="IMAGE or DOCUMENTS (max. 5MB)"
                existingFilePath={null}
                handleDeleteExistingFile={() => {}}
                isEditMode={false}
                isRequired={true}
              />
            </div>
            <div>
              <textarea
                {...register('revise_note', {
                  required: 'Notes is required field',
                })}
                id="decline-budget-notes"
                className={cn(
                  'form-textarea w-full resize-none rounded-lg border px-3.5 py-3 text-gray-900 shadow-xs placeholder:text-gray-500 focus:ring-4 disabled:border-gray-300 disabled:bg-gray-50',
                  errors.revise_note
                    ? 'border-error-300 focus:border-error-300 focus:ring-error-100'
                    : 'border-gray-300 focus:border-primary-300 focus:ring-primary-100',
                )}
                rows={5}
                placeholder="Enter a message..."
              ></textarea>
              {errors.revise_note && <span className="input-hint-text error">{errors.revise_note?.message}</span>}
            </div>
            <div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">Change the project’s budget total.</p>
                <div className="hover:cursor-pointer">
                  <Switch checked={isCheckboxEnabled} onCheckedChange={() => setIsCheckboxEnabled((prev) => !prev)} />
                </div>
              </div>
              {isCheckboxEnabled ? (
                <div className="mt-3 flex items-center gap-3">
                  <p className="text-gray-500">Rp</p>
                  <div className="w-full">
                    <Controller
                      control={control}
                      name="revise_amount"
                      render={({ field: { onChange, value } }) => (
                        <Input
                          type="number"
                          value={value || ''}
                          placeholder="(Pasang angka yang sebelumnya)"
                          onChange={onChange}
                          size="sm"
                          isCurrency={true}
                          inputSelectionInit="IDR"
                        />
                      )}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          <div className="mt-8 flex items-center justify-between gap-3">
            <Button
              type="button"
              btnType="normal"
              variant="secondary-gray"
              className="w-full justify-center"
              size="lg"
              onClick={closeReviseProject}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              btnType="normal"
              variant="primary"
              className="w-full justify-center"
              size="lg"
              isLoading={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Confirm'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Budget Need Version */}
      <Drawer
        isOpen={budgetNeedsVersionDrawer}
        setIsOpen={setBudgetNeedsVersionDrawer}
        title="Budget Need Version"
        description={programDetail.program_name}
        icon={<FileSearch02Icon className="h-5 w-5 stroke-primary-600" />}
        drawerWidth="w-[600px]"
      >
        <div>
          <label className="input-label gap-wide">Revision Versioning</label>
          <div className="flex flex-col-reverse gap-3">
            {programDetail?.snapshoot_path === null && (
              <p className="text-sm text-gray-600">No revision versioning found</p>
            )}
            {programDetail?.snapshoot_path?.map((snapshoot, index) => (
              <div
                key={`${snapshoot.path}-${snapshoot.submitted_at}-${snapshoot.approved_at}`}
                className="flex items-center justify-between rounded-lg border border-gray-300 py-4 pl-6 pr-4"
              >
                <span className="w-12 text-sm font-medium text-gray-900">{`v${index < 9 ? '0' : ''}${++index}`}</span>
                <div className="ml-6 mr-auto flex flex-col">
                  <p className="truncate text-sm font-medium text-gray-900">Submitted</p>
                  <span className="text-sm text-gray-600">
                    {dayjs(snapshoot.submitted_at).format('DD MMM YYYY, HH:mm')}
                  </span>
                </div>
                <div className="ml-6 mr-auto flex flex-col">
                  <p className="truncate text-sm font-medium text-gray-900">Approved</p>
                  <span className="text-sm text-gray-600">
                    {dayjs(snapshoot.approved_at).format('DD MMM YYYY, HH:mm')}
                  </span>
                </div>
                <div className="flex items-center text-right">
                  {isValidUrl(snapshoot.path) ? (
                    <Link href={snapshoot.path} target="_blank" rel="noopener noreferrer">
                      <Button btnType="div" size="sm" variant="secondary-gray" btnFormat="square">
                        <Link03Icon className="h-5 w-5 stroke-gray-700" />
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      type="button"
                      btnType="normal"
                      size="sm"
                      variant="secondary-gray"
                      btnFormat="square"
                      onClick={() => {
                        downloadS3File(`puskapa-program-snapshoot/${snapshoot.path}`)
                      }}
                    >
                      <FileAttachment02Icon className="h-5 w-5 stroke-gray-700" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Drawer>

      {/* Perdiem Setting Drawer */}
      <Drawer
        drawerWidth="w-[28rem]"
        isOpen={perdiemSettingDrawer}
        setIsOpen={setPerdiemSettingDrawer}
        title="Perdiem Setting"
        description={programDetail.program_name}
        icon={<FileSearch02Icon className="h-5 w-5 stroke-primary-600" />}
        footerButton={[
          <>
            <Button
              type="button"
              btnType="normal"
              variant="secondary-gray"
              size="md"
              onClick={closePerdiemSettingDrawer}
            >
              Cancel
            </Button>
          </>,
        ]}
      >
        <div className="flex flex-col gap-6">
          <div>
            <label htmlFor="base_value_normal" className="input-label">
              Perdiem Base Value
            </label>
            <p className="text-xs text-gray-700">This will serve as Unit Cost of Perdiem.</p>
          </div>
          {/* Perdiem: Normal */}
          <div className="flex flex-col gap-3">
            <div>
              <div>
                <label htmlFor="base_value_normal" className="input-label">
                  Perdiem: Normal
                </label>
              </div>
              <Controller
                control={controlPerdiemSetting}
                name="base_value_normal"
                rules={{
                  required: 'Perdiem base value is required field',
                  min: {
                    value: 0,
                    message: 'Perdiem base value must be greater than 0',
                  },
                }}
                render={({ field: { onChange, value }, fieldState: { invalid } }) => (
                  <div className="mx-2 flex items-center gap-2">
                    <p className="text-gray-500">Rp</p>
                    <Input
                      readonly
                      type="number"
                      id="base_value_normal"
                      placeholder="0"
                      isCurrency={true}
                      onChange={onChange}
                      value={value || ''}
                      error={invalid}
                      className="flex-1"
                    />
                  </div>
                )}
              />
            </div>
            {/* Perdiem: Luar Negeri */}
            <div>
              <div>
                <label htmlFor="base_value_remote_area" className="input-label">
                  Perdiem: Pelosok
                </label>
              </div>
              <Controller
                control={controlPerdiemSetting}
                name="base_value_remote_area"
                rules={{
                  required: 'Perdiem base value is required field',
                  min: {
                    value: 0,
                    message: 'Perdiem base value must be greater than 0',
                  },
                }}
                render={({ field: { onChange, value }, fieldState: { invalid } }) => (
                  <div className="mx-2 flex items-center gap-2">
                    <p className="text-gray-500">Rp</p>
                    <Input
                      readonly
                      type="number"
                      id="base_value_remote_area"
                      placeholder="0"
                      isCurrency={true}
                      onChange={onChange}
                      value={value || ''}
                      error={invalid}
                      className="flex-1"
                    />
                  </div>
                )}
              />
            </div>
            {/* Perdiem: Luar Negeri */}
            <div>
              <div>
                <label htmlFor="base_value_overseas" className="input-label">
                  Perdiem: Luar Negeri
                </label>
              </div>
              <Controller
                control={controlPerdiemSetting}
                name="base_value_overseas"
                rules={{
                  required: 'Perdiem base value is required field',
                  min: {
                    value: 0,
                    message: 'Perdiem base value must be greater than 0',
                  },
                }}
                render={({ field: { onChange, value }, fieldState: { invalid } }) => (
                  <div className="mx-2 flex items-center gap-2">
                    <p className="text-gray-500">Rp</p>
                    <Input
                      readonly
                      type="number"
                      id="base_value_overseas"
                      placeholder="0"
                      isCurrency={true}
                      onChange={onChange}
                      value={value || ''}
                      error={invalid}
                      className="flex-1"
                    />
                  </div>
                )}
              />
            </div>
          </div>
          <div className="h-px w-full bg-gray-200"></div>
          <div>
            <label htmlFor="base_value_normal" className="input-label !mb-1">
              Percentage Calculation
            </label>
            <p className="text-xs text-gray-700">This setup relate to Travel Expenses</p>
          </div>
          <div>
            <Controller
              control={controlPerdiemSetting}
              name="travel_expense_percentages.breakfast"
              rules={{
                required: 'Breakfast value is required field',
                min: {
                  value: 0,
                  message: 'Breakfast value must be greater than 0',
                },
                max: {
                  value: 100,
                  message: 'Breakfast value must be less than 100',
                },
              }}
              render={({ field: { onChange, value }, fieldState: { invalid } }) => (
                <div className="mx-2 flex items-center gap-2">
                  <div className="w-52">
                    <label
                      htmlFor="travel_expense_percentages.breakfast"
                      className="w-24 text-sm font-medium text-gray-700"
                    >
                      Makan Pagi Ditanggung
                    </label>
                    <p className="text-xs text-gray-700">(Pengurangan dari total Perdiem)</p>
                  </div>
                  <Input
                    readonly
                    type="number"
                    id="travel_expense_percentages.breakfast"
                    placeholder="0"
                    onChange={onChange}
                    value={value || ''}
                    error={invalid}
                    className="w-16"
                  />
                  <p className="text-sm text-gray-700">%</p>
                </div>
              )}
            />
          </div>
          <div>
            <Controller
              control={controlPerdiemSetting}
              name="travel_expense_percentages.lunch"
              rules={{
                required: 'Lunch value is required field',
                min: {
                  value: 0,
                  message: 'Lunch value must be greater than 0',
                },
                max: {
                  value: 100,
                  message: 'Lunch value must be less than 100',
                },
              }}
              render={({ field: { onChange, value }, fieldState: { invalid } }) => (
                <div className="mx-2 flex items-center gap-2">
                  <div className="w-52">
                    <label
                      htmlFor="travel_expense_percentages.lunch"
                      className="w-24 text-sm font-medium text-gray-700"
                    >
                      Makan Siang Ditanggung
                    </label>
                    <p className="text-xs text-gray-700">(Pengurangan dari total Perdiem)</p>
                  </div>
                  <Input
                    readonly
                    type="number"
                    id="travel_expense_percentages.lunch"
                    placeholder="0"
                    onChange={onChange}
                    value={value || ''}
                    error={invalid}
                    className="w-16"
                  />
                  <p className="text-sm text-gray-700">%</p>
                </div>
              )}
            />
          </div>
          <div>
            <Controller
              control={controlPerdiemSetting}
              name="travel_expense_percentages.dinner"
              rules={{
                required: 'Dinner value is required field',
                min: {
                  value: 0,
                  message: 'Dinner value must be greater than 0',
                },
                max: {
                  value: 100,
                  message: 'Dinner value must be less than 100',
                },
              }}
              render={({ field: { onChange, value }, fieldState: { invalid } }) => (
                <div className="mx-2 flex items-center gap-2">
                  <div className="w-52">
                    <label
                      htmlFor="travel_expense_percentages.dinner"
                      className="w-24 text-sm font-medium text-gray-700"
                    >
                      Makan Malam Ditanggung
                    </label>
                    <p className="text-xs text-gray-700">(Pengurangan dari total Perdiem)</p>
                  </div>
                  <Input
                    readonly
                    type="number"
                    id="travel_expense_percentages.dinner"
                    placeholder="0"
                    onChange={onChange}
                    value={value || ''}
                    error={invalid}
                    className="w-16"
                  />
                  <p className="text-sm text-gray-700">%</p>
                </div>
              )}
            />
          </div>
          <div>
            <Controller
              control={controlPerdiemSetting}
              name="travel_expense_percentages.non_overnight"
              rules={{
                required: 'Non overnight value is required field',
                min: {
                  value: 0,
                  message: 'Non overnight value must be greater than 0',
                },
                max: {
                  value: 100,
                  message: 'Non overnight value must be less than 100',
                },
              }}
              render={({ field: { onChange, value }, fieldState: { invalid } }) => (
                <div className="mx-2 flex items-center gap-2">
                  <div className="w-52">
                    <label
                      htmlFor="travel_expense_percentages.non_overnight"
                      className="w-24 text-sm font-medium text-gray-700"
                    >
                      Malam Tidak Menginap
                    </label>
                    <p className="text-xs text-gray-700">(Pengurangan dari total Perdiem)</p>
                  </div>
                  <Input
                    readonly
                    type="number"
                    id="travel_expense_percentages.non_overnight"
                    placeholder="0"
                    onChange={onChange}
                    value={value || ''}
                    error={invalid}
                    className="w-16"
                  />
                  <p className="text-sm text-gray-700">%</p>
                </div>
              )}
            />
          </div>
          <div>
            <Controller
              control={controlPerdiemSetting}
              name="travel_expense_percentages.travel_days"
              rules={{
                required: 'Travel days value is required field',
                min: {
                  value: 0,
                  message: 'Travel days value must be greater than 0',
                },
                max: {
                  value: 100,
                  message: 'Travel days value must be less than 100',
                },
              }}
              render={({ field: { onChange, value }, fieldState: { invalid } }) => (
                <div className="mx-2 flex items-center gap-2">
                  <div className="w-52">
                    <label
                      htmlFor="travel_expense_percentages.travel_days"
                      className="w-24 text-sm font-medium text-gray-700"
                    >
                      Hari Perjalanan
                    </label>
                    <p className="text-xs text-gray-700">(Penambahan dari total Perdiem)</p>
                  </div>
                  <Input
                    readonly
                    type="number"
                    id="travel_expense_percentages.travel_days"
                    placeholder="0"
                    onChange={onChange}
                    value={value || ''}
                    error={invalid}
                    className="w-16"
                  />
                  <p className="text-sm text-gray-700">%</p>
                </div>
              )}
            />
          </div>
          <div className="h-px w-full bg-gray-200"></div>
          <div>
            <label htmlFor="note" className="input-label">
              Notes (Optional)
            </label>
            <textarea
              readOnly
              {...registerPerdiemSetting('note')}
              id="note"
              className="textarea-input resize-none"
              rows={5}
              placeholder="Write notes about this perdiem setting"
            ></textarea>
          </div>
        </div>
      </Drawer>

      {/* View Fund Received */}
      <Drawer
        drawerWidth="w-[28rem]"
        isOpen={viewFundReceivedDrawer}
        setIsOpen={setViewFundReceivedDrawer}
        title="View Fund Received"
        description={programDetail.program_name}
        icon={<FileSearch02Icon className="h-5 w-5 stroke-primary-600" />}
        // usingFooter={false}
        footerButton={[
          <>
            <Button
              type="button"
              btnType="normal"
              variant="secondary-gray"
              size="md"
              onClick={closeViewFundReceivedDrawer}
            >
              Cancel
            </Button>
          </>,
          <>
            <Button
              type="submit"
              btnType="normal"
              variant="primary"
              size="md"
              onClick={() => {
                closeViewFundReceivedDrawer()
                openSubmitFundReceivedDrawer()
              }}
            >
              Add Fund Received
            </Button>
          </>,
        ]}
      >
        <div className="mb-6 rounded-lg bg-primary-200 px-6 py-4">
          <p className="mb-1 text-gray-700">Total Fund Received Amount</p>
          <p className="text-2xl font-semibold text-gray-700">
            {formatCurrency(
              'IDR',
              (() => {
                const puskapaTotal =
                  fundReceivedData
                    ?.filter((item) => item.source === FUND_RECEIVED_TYPE.PUSKAPA)
                    ?.reduce((acc, curr) => acc + curr.amount, 0) || 0
                const donorTotal =
                  fundReceivedData
                    ?.filter((item) => item.source === FUND_RECEIVED_TYPE.DONOR)
                    ?.reduce((acc, curr) => acc + curr.amount, 0) || 0
                const donorReimburseTotal =
                  fundReceivedData
                    ?.filter((item) => item.source === FUND_RECEIVED_TYPE.DONOR_REIMBURSE)
                    ?.reduce((acc, curr) => acc + curr.amount, 0) || 0
                return (
                  donorTotal +
                  donorReimburseTotal +
                  (puskapaTotal - donorReimburseTotal < 0 ? 0 : puskapaTotal - donorReimburseTotal)
                )
              })(),
            )}
          </p>
        </div>
        <div className="mb-6 flex flex-col gap-3">
          <div className="rounded-lg bg-primary-50 px-6 py-4">
            <p className="mb-1 text-gray-700">Total Fund from DONOR</p>
            <p className="text-2xl font-semibold text-gray-700">
              {formatCurrency(
                'IDR',
                fundReceivedData
                  ?.filter((item) =>
                    [FUND_RECEIVED_TYPE.DONOR, FUND_RECEIVED_TYPE.DONOR_REIMBURSE].includes(item.source),
                  )
                  ?.reduce((acc, curr) => acc + curr.amount, 0),
              )}
            </p>
          </div>
          <div className="rounded-lg bg-primary-50 px-6 py-4">
            <p className="mb-1 text-gray-700">Total Fund from PUSKAPA</p>
            <p className="text-2xl font-semibold text-gray-700">
              {formatCurrency(
                'IDR',
                (() => {
                  const puskapaTotal =
                    fundReceivedData
                      ?.filter((item) => item.source === FUND_RECEIVED_TYPE.PUSKAPA)
                      ?.reduce((acc, curr) => acc + curr.amount, 0) || 0
                  const donorReimburseTotal =
                    fundReceivedData
                      ?.filter((item) => item.source === FUND_RECEIVED_TYPE.DONOR_REIMBURSE)
                      ?.reduce((acc, curr) => acc + curr.amount, 0) || 0
                  return puskapaTotal - donorReimburseTotal < 0 ? 0 : puskapaTotal - donorReimburseTotal
                })(),
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {fundReceivedData === null && <p className="text-sm text-gray-600">No Fund Received</p>}
          {fundReceivedData?.map((fundReceived, index) => (
            <div
              key={fundReceived.id}
              className="flex items-start justify-between rounded-lg border border-gray-300 py-4 pl-6 pr-4"
            >
              <span className="mt-2.5 w-12 text-sm font-medium text-gray-900">
                {`${index < 9 ? '0' : ''}${fundReceivedData.length - index}`}
              </span>
              <div className="ml-4 mr-auto flex flex-col">
                <p className="truncate text-sm font-medium text-gray-900">
                  {formatCurrency('IDR', fundReceived.amount)}
                </p>
                <span className="text-sm text-gray-600">
                  {dayjs(fundReceived.created_at).format('DD MMM YYYY, HH:mm')}
                </span>
                <p className="mt-3 text-sm text-gray-600">
                  From:{' '}
                  <span className="font-bold">
                    {fundReceived.source.toLocaleLowerCase() === 'donor-reimburse'
                      ? 'DONOR (REIMBURSE)'
                      : fundReceived.source}
                  </span>
                </p>
              </div>
              <div className="flex items-center text-right">
                {isValidUrl(fundReceived.documents && fundReceived.documents[0]) ? (
                  <Link href={fundReceived.documents[0]} target="_blank" rel="noopener noreferrer">
                    <Button btnType="div" size="sm" variant="secondary-gray" btnFormat="square">
                      <Link03Icon className="h-5 w-5 stroke-gray-700" />
                    </Button>
                  </Link>
                ) : (
                  <Button
                    type="button"
                    btnType="normal"
                    size="sm"
                    variant="secondary-gray"
                    btnFormat="square"
                    onClick={() => {
                      downloadS3File(fundReceived.documents[0])
                    }}
                  >
                    <FileAttachment02Icon className="h-5 w-5 stroke-gray-700" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Drawer>

      {/* Submit Fund Received */}
      <form onSubmit={handleSubmitFundReceived(submitFundReceivedHandler)}>
        <Drawer
          drawerWidth="w-[28rem]"
          isOpen={submitFundReceivedDrawer}
          setIsOpen={setSubmitFundReceivedDrawer}
          title="Submit Fund Received"
          description={programDetail.program_name}
          icon={<FileSearch02Icon className="h-5 w-5 stroke-primary-600" />}
          footerButton={[
            <>
              <Button
                type="button"
                btnType="normal"
                variant="secondary-gray"
                size="md"
                onClick={closeSubmitFundReceivedDrawer}
              >
                Cancel
              </Button>
            </>,
            <>
              <Button
                type="submit"
                btnType="normal"
                variant="primary"
                size="md"
                isLoading={loadingButtonStatement.submitFundReceived}
              >
                Submit
              </Button>
            </>,
          ]}
        >
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <div>
                <div>
                  <label htmlFor="fund_received_amount" className="input-label">
                    Fund Received Amount
                  </label>
                </div>
                <Controller
                  control={controlFundReceived}
                  name="amount"
                  rules={{
                    required: 'Fund received amount is required field',
                    min: {
                      value: 0,
                      message: 'Fund received amount must be greater than 0',
                    },
                  }}
                  render={({ field: { onChange, value }, fieldState: { invalid } }) => (
                    <>
                      <div className="mx-2 flex items-center gap-2">
                        <p className="text-gray-500">Rp</p>
                        <Input
                          type="number"
                          id="fund_received_amount"
                          placeholder="0"
                          isCurrency={true}
                          onChange={onChange}
                          value={value || ''}
                          error={invalid}
                          className="flex-1"
                        />
                      </div>
                      {errorsFundReceived?.amount && (
                        <span className="input-hint-text error">{errorsFundReceived?.amount?.message}</span>
                      )}
                    </>
                  )}
                />
              </div>
            </div>
            <div>
              <SwitchableUploadField
                name="documents"
                label="Documents"
                fieldKey="fund_received_documents"
                control={controlFundReceived}
                errors={errorsFundReceived}
                setValue={setValueFundReceived}
                isLinkMode={switchTogglableButton.fundReceivedDocuments}
                onToggle={() => {
                  setSwitchTogglableButton((prev) => ({
                    ...prev,
                    fundReceivedDocuments: !prev.fundReceivedDocuments,
                  }))
                }}
                bucketName={BucketsEnum.program_snapshoot}
                uploadProgress={tempProgressUpload}
                uploadedFiles={fundReceivedDocuments}
                setUploadedFiles={setFundReceivedDocuments}
                handleUploadFile={handleUploadFile}
                deleteFilePath={deleteFundReceivedDocuments}
                maxFiles={1}
                informationText="IMAGE or DOCUMENTS (max. 5MB)"
                existingFilePath={null}
                handleDeleteExistingFile={() => {}}
                isEditMode={false}
                isRequired={true}
              />
            </div>
            <div>
              <label htmlFor="source" className="input-label">
                Fund from:
              </label>
              <Controller
                control={controlFundReceived}
                name="source"
                rules={{
                  required: "Please choose fund source, it's required field",
                }}
                render={({ field: { onChange } }) => (
                  <div className="ml-3 flex flex-col gap-2">
                    <div className="inline-flex items-center gap-3">
                      <input
                        type="radio"
                        id="source_donor"
                        name="source"
                        value="donor"
                        className="radio-button"
                        onChange={(e) => onChange(e)}
                      />
                      <label htmlFor="source_donor" className="font-medium text-gray-700 hover:cursor-pointer">
                        Donor
                      </label>
                    </div>
                    <div className="inline-flex items-center gap-3">
                      <input
                        type="radio"
                        id="donor_reimburse"
                        name="source"
                        value="donor-reimburse"
                        className="radio-button"
                        onChange={(e) => onChange(e)}
                      />
                      <label htmlFor="donor_reimburse" className="font-medium text-gray-700 hover:cursor-pointer">
                        Donor (Reimburse)
                      </label>
                    </div>
                    <div className="inline-flex items-center gap-3">
                      <input
                        type="radio"
                        id="source_puskapa"
                        name="source"
                        value="puskapa"
                        className="radio-button"
                        onChange={(e) => onChange(e)}
                      />
                      <label htmlFor="source_puskapa" className="font-medium text-gray-700 hover:cursor-pointer">
                        Puskapa
                      </label>
                    </div>
                  </div>
                )}
              />
              {errorsFundReceived.source && (
                <span className="input-hint-text error">{errorsFundReceived.source?.message}</span>
              )}
            </div>
            <div>
              <label htmlFor="notes" className="input-label">
                Notes (Optional)
              </label>
              <textarea
                {...registerFundReceived('notes')}
                id="notes"
                className="textarea-input resize-none"
                rows={5}
                placeholder="Write notes about fund received here"
              ></textarea>
            </div>
          </div>
        </Drawer>
      </form>
    </>
  )
}

export default ProgramDetailLayout

export const getServerSideProps: GetServerSideProps = async (context) => {
  const programId = context.params.slug[0]
  /*
  Quite weird and tricky case, because cookies at next server won't get updated cookies (refresh_token) from middleware in normal way, so i found this amazing hint from next's github issus, finally after hour :))
  https://github.com/vercel/next.js/issues/36049
  */
  const getUpdatedCookiesFromMiddleware = context.res.getHeader('set-cookie')
  // parseAuthToken handled by resolveAuthToken helper

  const auth_token = resolveAuthToken(getUpdatedCookiesFromMiddleware, context.req.cookies.auth_token)

  const programApi = new ProgramApi(createAPIConfig(auth_token as string))
  const projectApi = new ProjectApi(createAPIConfig(auth_token as string))
  const metadataApi = new MetadataApi(createAPIConfig(auth_token as string))
  const fileApi = new FilesApi(createAPIConfig(auth_token as string))

  try {
    console.log('PROGRAM ID =', programId)
    console.log('STEP 1')
    const getProgramDetail = await programApi.programControllerGetProgramDetail(programId)
    console.log('STEP 2')
    const getProjectDetail = await projectApi.projectControllerGetProjectList(programId)
    console.log('STEP 3')
    const getProgramBudgetDetail = await programApi.programControllerGetProgramBudget(programId)
    console.log('STEP 4')
    const authTokenJWT = safeDecodeJwt(auth_token)

    if (!authTokenJWT) {
      return { redirect: { destination: '/refresh', permanent: false } }
    }
    const checkUserRole = checkIsLoggedInRoleAll(authTokenJWT.payload['role'])

    if (!checkUserRole) {
      return {
        notFound: true,
      }
    }

    const programDetail = getProgramDetail.data.data
    const projectActivityDetailData = getProjectDetail.data.data
    const programBudgetDetail = getProgramBudgetDetail.data.data

    let isProjectActivityEmpty = false
    let isBudgetNeedEmpty = false

    if (projectActivityDetailData?.length === 0) {
      isProjectActivityEmpty = true
    }

    isBudgetNeedEmpty = programBudgetDetail?.projects.every((project) =>
      project.activities.every((activity) => activity.budgets.length === 0),
    )

    if (programDetail === null) {
      return {
        notFound: true,
      }
    }

    // Related to logs and requesting S3 url
    console.log('========== STEP 5 ==========')
    const logsRes = await metadataApi.metadataControllerGetLogsFiltered(context.params.slug[0], 'Program')
    const logs = logsRes?.data?.data
    const renderedIds = new Set()

    const uniqueLogs = logs.filter((log) => {
      if (renderedIds.has(log.user.id)) {
        return false
      }
      renderedIds.add(log.user.id)
      return true
    })

    const dispatchers = []
    for (const uniqueLog of uniqueLogs) {
      const [bucketName, fileName] = uniqueLog.user.employee_pass_photo?.split('/')
      const expiry = 3600 * 24

      const dispatcher = new Promise(async (resolve) => {
        const presignUrlRes = await fileApi.fileControllerGetPresignUrlForDownload(
          fileName,
          bucketName as any,
          expiry as number,
        )

        const presignUrl = presignUrlRes?.data.data

        uniqueLog.user['avatar_url'] = presignUrl

        resolve(uniqueLog)
      })

      dispatchers.push(dispatcher)
    }

    const logModified = await Promise.all(dispatchers)

    const programLogs = logs.map((log) => {
      return {
        ...log,
        user: {
          ...log.user,
          avatar_url: logModified.find((logUnique) => logUnique.user.id === log.user.id)?.user.avatar_url,
        },
      }
    })

    // Pass data to the page via props
    return {
      props: {
        programDetail,
        activeSidebar: 'Project List',
        slugIdentifier: context.params.slug,
        isProjectActivityEmpty,
        isBudgetNeedEmpty,
        programBudgetDetail,
        programLogs,
        projectActivityDetailData,
      },
    }
  } catch (error: any) {
    console.error('========================')
    console.error('STATUS :', error.response?.status)
    console.error('URL    :', error.config?.url)
    console.error('DATA   :', error.response?.data)
    console.error('MESSAGE:', error.message)
    console.error(error)
    console.error('========================')

    if (error.message === 'Request failed with status code 500') {
      return {
        notFound: true,
      }
    }

    if (error.message === 'Request failed with status code 401') {
      return {
        redirect: {
          destination: '/refresh',
          permanent: false,
        },
      }
    }

    return {
      notFound: true,
    }
  }
}
