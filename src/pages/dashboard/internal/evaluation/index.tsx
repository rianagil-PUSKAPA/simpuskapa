import { resolveAuthToken, safeDecodeJwt } from '@/utils/ssrAuth'
import { SwitchableUploadField } from '@/components/SwitchableUploadField'
import { TableCore } from '@/components/TableCore'
import { useDashboardContext } from '@/providers/DashboardProvider'
import { BucketsEnum } from '@/shared/file.system'
import { RoleDefinition } from '@/shared/role.access'
import { ComboboxType, DynamicProgressType } from '@/types/global'
import { createAPIConfig } from '@/utils/apiAuthToken'
import { employeePerformanceApi, fileApi, getAllEmployee, getEmployeePerformance } from '@/utils/apiRequestHelper'
import { MAIN_URL_FE } from '@/utils/constant'
import {
  Employee,
  EmployeePerformanceAggregated,
  EmployeePerformanceApi,
  EmployeePerformanceCreateRequest,
  EmployeePerformanceCreateRequestDocTypeEnum,
} from '@sdk'
import { createColumnHelper } from '@tanstack/react-table'
import axios from 'axios'
import dayjs from 'dayjs'
import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import useSWRMutation from 'swr/mutation'

const AvatarLabelGroup: any = dynamic(() => import('@/components/AvatarLabelGroup').then((mod) => mod.AvatarLabelGroup))
const AvatarPlacement: any = dynamic(() => import('@/components/AvatarPlacement').then((mod) => mod.AvatarPlacement))
const Button: any = dynamic(() => import('@/components/Button').then((mod) => mod.Button))
const ComboboxAutocomplete: any = dynamic(() =>
  import('@/components/ComboboxAutocomplete').then((mod) => mod.ComboboxAutocomplete),
)
const Drawer: any = dynamic(() => import('@/components/Drawer').then((mod) => mod.Drawer))
const FilePreview: any = dynamic(() => import('@/components/FilePreview').then((mod) => mod.FilePreview))
const YearPickerCalendar: any = dynamic(() =>
  import('@/components/YearPickerCalendar').then((mod) => mod.YearPickerCalendar),
)
const FileAttachment02Icon: any = dynamic(() =>
  import('@/components/icon/FileAttachment02Icon').then((mod) => mod.FileAttachment02Icon),
)
const PlusIcon: any = dynamic(() => import('@/components/icon/PlusIcon').then((mod) => mod.PlusIcon))
const User01Icon: any = dynamic(() => import('@/components/icon/User01Icon').then((mod) => mod.User01Icon))
const Dashboard: any = dynamic(() => import('@/layout/Dashboard').then((mod) => mod.Dashboard))

type IEvaluationType = 'planning' | 'mid-year' | 'end-year'

type ReportForm = {
  subordinate: string
  evaluation_type: IEvaluationType
  year: string
  document_report: string
}

const columnHelper = createColumnHelper<EmployeePerformanceAggregated>()

const Evaluation = () => {
  const { userLoggedinInformation } = useDashboardContext()
  const router = useRouter()

  const [addNewReport, setNewReport] = useState<boolean>(false)
  const [viewReport, setViewReport] = useState<boolean>(false)
  const [isUpdateReport, setIsUpdateReport] = useState<boolean>(false)
  const [viewReportDataHolder, setViewReportDataHolder] = useState<EmployeePerformanceAggregated | null>(null)
  const [viewReportType, setViewReportType] = useState<IEvaluationType | null>(null)
  const [reportTitleDrawer, setReportTitleDrawer] = useState<'Add New Report' | 'View Report' | 'Edit Report' | ''>('')
  const [tempProgressUpload, setTempProgressUpload] = useState<DynamicProgressType>({})
  const [subordinateList, setSubordinateList] = useState<ComboboxType[]>([])
  const [reportDocument, setReportDocument] = useState([])
  const [reportYear, setReportYear] = useState<Date | null>(new Date())
  const [loadingButtonStatement, setLoadingButtonStatement] = useState<{
    add_report: boolean
    update_report: boolean
  }>({
    add_report: false,
    update_report: false,
  })
  const [switchTogglableButton, setSwitchTogglableButton] = useState<{
    add_document_report: boolean
    update_document_report: boolean
  }>({
    add_document_report: false,
    update_document_report: false,
  })

  const {
    data: employeePerformanceData,
    trigger: employeePerformanceTrigger,
    isMutating: employeePerformanceIsMutating,
  } = useSWRMutation(`performance-evaluation`, getEmployeePerformance)

  const columnsEmployeePerformanceTable = useMemo(
    () => [
      columnHelper.accessor((row) => `${row.employee_name}`, {
        id: 'name',
        header: 'Name',
        size: 260,
        cell: (info) => (
          <AvatarLabelGroup
            size={'md'}
            image={info.row.original.employee_pass_photo}
            text={info.row.original.employee_name}
            supportingText={info.row.original.email}
            statusIcon={false}
          />
        ),
      }),
      columnHelper.accessor((row) => row.contract_department, {
        id: 'contract_department',
        header: 'Department',
        size: 160,
      }),
      columnHelper.accessor((row) => row.contract_position, {
        id: 'contract_position',
        header: 'Position',
        size: 200,
      }),
      columnHelper.accessor(`year`, {
        id: 'year',
        header: 'Year',
        filterFn: 'weakEquals',
        size: 120,
      }),
      columnHelper.accessor((row) => row.planning, {
        id: 'planning',
        header: 'Planning',
        size: 160,
        cell: (info) => (
          <div>
            {info.getValue()?.id ? (
              <Button
                type="button"
                btnType="normal"
                size="md"
                variant="secondary-gray"
                onClick={() => {
                  handleViewReportData(info.row.original, EmployeePerformanceCreateRequestDocTypeEnum.Planning)
                  openViewReport()
                }}
              >
                <FileAttachment02Icon className="h-5 w-5 stroke-gray-700" />
                View
              </Button>
            ) : (
              <Button
                type="button"
                btnType="normal"
                size="md"
                variant="secondary"
                onClick={() => {
                  handleAddReportData(info.row.original, EmployeePerformanceCreateRequestDocTypeEnum.Planning)
                  openViewReport()
                }}
              >
                <FileAttachment02Icon className="h-5 w-5 stroke-primary-700" />
                Add
              </Button>
            )}
          </div>
        ),
      }),
      columnHelper.accessor((row) => row.end_year, {
        id: 'endYear',
        header: 'End Year',
        size: 160,
        cell: (info) => (
          <div>
            {info.getValue()?.id ? (
              <Button
                type="button"
                btnType="normal"
                size="md"
                variant="secondary-gray"
                onClick={() => {
                  handleViewReportData(info.row.original, EmployeePerformanceCreateRequestDocTypeEnum.EndYear)
                  openViewReport()
                }}
              >
                <FileAttachment02Icon className="h-5 w-5 stroke-gray-700" />
                View
              </Button>
            ) : (
              <Button
                type="button"
                btnType="normal"
                size="md"
                variant="secondary"
                onClick={() => {
                  handleAddReportData(info.row.original, EmployeePerformanceCreateRequestDocTypeEnum.EndYear)
                  openViewReport()
                }}
              >
                <FileAttachment02Icon className="h-5 w-5 stroke-primary-700" />
                Add
              </Button>
            )}
          </div>
        ),
      }),
    ],
    [],
  )

  /* Drawer: Request New Report */
  const closeAddNewReport = () => {
    setNewReport(false)
    setTempProgressUpload({})
    setViewReportType(null)
  }
  const openAddNewReport = () => {
    setNewReport(true)
  }
  /* Drawer: Request New Report */
  const closeViewReport = () => {
    setViewReport(false)
    setTempProgressUpload({})
    setViewReportType(null)
    setViewReportDataHolder(null)
  }
  const openViewReport = () => {
    setViewReport(true)
  }

  const handleViewReportData = (
    employeePerformance: EmployeePerformanceAggregated,
    evaluationType: IEvaluationType,
  ) => {
    setViewReportDataHolder(employeePerformance)
    setReportYear(new Date(Date.parse(String(employeePerformance.year))))
    // setValue('year', String(dayjs(employeePerformance.year).format('YYYY')))
    setViewReportType(evaluationType)
    const evaluationradioType = document.getElementById(`view_${evaluationType}`) as HTMLInputElement
    evaluationradioType.checked = true
    setReportTitleDrawer('View Report')
  }

  const handleAddReportData = (employeePerformance: EmployeePerformanceAggregated, evaluationType: IEvaluationType) => {
    setViewReportDataHolder(employeePerformance)
    setReportYear(new Date(Date.parse(String(employeePerformance.year))))
    setValue('year', String(dayjs(employeePerformance.year).format('YYYY')))
    setViewReportType(evaluationType)
    const evaluationradioType = document.getElementById(`view_${evaluationType}`) as HTMLInputElement
    evaluationradioType.checked = true
    setReportTitleDrawer('Add New Report')
  }

  const {
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ReportForm>()

  const {
    handleSubmit: handleSubmitUpdateReport,
    control: controlUpdateReport,
    setValue: setValueUpdateReport,
    reset: resetUpdateReport,
    formState: { errors: errorsUpdateReport },
  } = useForm<ReportForm>()

  const addNewReportSubmit: SubmitHandler<ReportForm> = async (formInput) => {
    setLoadingButtonStatement((prev) => ({ ...prev, add_report: true }))
    let fileNameS3 = ''

    if (!switchTogglableButton.add_document_report) {
      const presignUrl = await fileApi.fileControllerGetPresignUrl(
        reportDocument[0].name,
        BucketsEnum.employee_performance,
      )

      fileNameS3 = String(presignUrl.data.data).split('::')[0]
      const identifier = 'document_report'

      await axios.put(String(presignUrl.data.data).split('::')[1], reportDocument[0], {
        headers: {
          'Content-Type': reportDocument[0].type,
        },
        onUploadProgress: (e) => {
          const percentCompleted = Math.round((e.loaded * 100) / e.total)
          setTempProgressUpload((prev) => ({
            ...prev,
            [identifier]: {
              bucketName: BucketsEnum.employee_performance,
              progress: percentCompleted,
              identifier,
            },
          }))
        },
      })
    }

    const employeePerformanceCreateRequest: EmployeePerformanceCreateRequest = {
      file: switchTogglableButton.add_document_report
        ? [`${formInput.document_report}`]
        : [`${BucketsEnum.employee_performance}/${fileNameS3}`],
      year: reportTitleDrawer === 'Add New Report' ? viewReportDataHolder?.year : dayjs(formInput.year).year(),
      doc_type: formInput.evaluation_type || viewReportType,
    }

    // console.log(
    //   'CREATE: employeePerformanceCreateRequest',
    //   employeePerformanceCreateRequest,
    // )
    // setLoadingButtonStatement((prev) => ({ ...prev, add_report: false }))
    // return false

    const addNewEmployeePerformance = employeePerformanceApi.employeePerformanceControllerCreateEmployeePerformanceCV(
      reportTitleDrawer === 'Add New Report' ? viewReportDataHolder?.employee_id : formInput.subordinate?.['id'],
      employeePerformanceCreateRequest,
    )

    toast.promise(addNewEmployeePerformance, {
      pending: 'Adding Employee Performance',
      success: 'Employee Performance Added',
      error: 'Promise rejected 🤯',
    })

    addNewEmployeePerformance.then(() => {
      const formId = document.getElementById('employee-performance-add-report') as HTMLFormElement
      formId?.reset()
      setReportDocument([])
      closeAddNewReport()
      closeViewReport()
    })

    addNewEmployeePerformance.finally(() => {
      setLoadingButtonStatement((prev) => ({ ...prev, add_report: false }))
      employeePerformanceTrigger()
    })
  }

  const updateReportSubmit: SubmitHandler<ReportForm> = async (formInput) => {
    setLoadingButtonStatement((prev) => ({ ...prev, update_report: true }))
    let fileNameS3 = ''

    const performanceId = (type: IEvaluationType) => {
      let id = null
      switch (type) {
        case EmployeePerformanceCreateRequestDocTypeEnum.Planning:
          id = viewReportDataHolder.planning?.id || null
          break
        case EmployeePerformanceCreateRequestDocTypeEnum.EndYear:
          id = viewReportDataHolder.end_year?.id || null
          break
        default:
          break
      }
      return id
    }

    if (!switchTogglableButton.update_document_report) {
      const presignUrl = await fileApi.fileControllerGetPresignUrl(
        reportDocument[0].name,
        BucketsEnum.employee_performance,
      )

      fileNameS3 = String(presignUrl.data.data).split('::')[0]
      const identifier = 'document_report'

      await axios.put(String(presignUrl.data.data).split('::')[1], reportDocument[0], {
        headers: {
          'Content-Type': reportDocument[0].type,
        },
        onUploadProgress: (e) => {
          const percentCompleted = Math.round((e.loaded * 100) / e.total)

          setTempProgressUpload((prev) => ({
            ...prev,
            [identifier]: {
              bucketName: BucketsEnum.employee_performance,
              progress: percentCompleted,
              identifier,
            },
          }))
        },
      })
    }

    const employeePerformanceCreateRequest: EmployeePerformanceCreateRequest = {
      file: switchTogglableButton.update_document_report
        ? [`${formInput.document_report}`]
        : [`${BucketsEnum.employee_performance}/${fileNameS3}`],
      year: viewReportDataHolder.year,
      doc_type: viewReportType,
    }

    // console.log(
    //   'UPDATE: employeePerformanceCreateRequest',
    //   employeePerformanceCreateRequest,
    // )
    // return false

    const updateEmployeePerformanceDocument =
      employeePerformanceApi.employeePerformanceControllerUpdateEmployeePerformanceCV(
        viewReportDataHolder.employee_id,
        performanceId(viewReportType),
        employeePerformanceCreateRequest,
      )

    toast.promise(updateEmployeePerformanceDocument, {
      pending: 'Update Employee Performance Document',
      success: 'Employee Performance Document Updated',
      error: 'Promise rejected 🤯',
    })

    updateEmployeePerformanceDocument.then(() => {
      const formId = document.getElementById('employee-performance-view-report') as HTMLFormElement
      formId?.reset()
      setReportDocument([])
      closeViewReport()
      closeAddNewReport()
    })

    updateEmployeePerformanceDocument.finally(() => {
      setLoadingButtonStatement((prev) => ({ ...prev, update_report: false }))
      employeePerformanceTrigger()
    })
  }

  const deleteReportDocumentsFile = async (filename: string) => {
    setValue('document_report', undefined)
    setValueUpdateReport('document_report', undefined)
    setReportDocument((prev) => prev.filter((item) => item.path !== filename))
  }

  useEffect(() => {
    const getAllSubordinate = async () => {
      const employeeList = await getAllEmployee()

      const subordinateList = employeeList?.filter((employee: Employee) => {
        if (userLoggedinInformation?.role?.includes(RoleDefinition.SUPERADMIN)) {
          return employeeList
        } else {
          return employee.employee_contracts[0]?.supervisor_id === userLoggedinInformation?.employee_id
        }
      })

      const result = subordinateList.map((item: any) => ({
        id: item.id,
        name: item.full_name,
        avatarUrl: item.pass_photo_path,
      }))

      setSubordinateList(result)
    }

    getAllSubordinate()
  }, [router.isReady, addNewReport, viewReport])

  useEffect(() => {
    if (!viewReport) {
      setTimeout(() => {
        setIsUpdateReport(false)
        setReportTitleDrawer('')
        setReportDocument([])
        setReportYear(null)
        resetUpdateReport()
        reset()
      }, 500)
    }
  }, [viewReport])

  useEffect(() => {
    if (addNewReport) {
      const defaultValueEvaluationType = document.getElementById(
        EmployeePerformanceCreateRequestDocTypeEnum.Planning,
      ) as HTMLInputElement
      if (defaultValueEvaluationType) {
        defaultValueEvaluationType.checked = true
      }
      setValue('evaluation_type', EmployeePerformanceCreateRequestDocTypeEnum.Planning)
    } else {
      setValue('subordinate', null)
    }

    // setValue('year', String(dayjs(new Date()).format('YYYY')))
  }, [addNewReport, setValue])

  useEffect(() => {
    employeePerformanceTrigger()
  }, [router.isReady])

  if (employeePerformanceIsMutating) {
    return <></>
  }

  return (
    <>
      <NextSeo title="Performance Evaluation" canonical={`${MAIN_URL_FE}dashboard/internal/evaluation`} />
      <Dashboard
        breadcrumbLists={[
          { title: 'Internal', url: '' },
          { title: 'Performace Evaluation', url: '' },
        ]}
      >
        <div className="sim-ui-v3 sim-ui-v3--people">
          <div className="flex flex-col items-start justify-between gap-4 border-b border-b-gray-200 px-10 py-5 sm:flex-row sm:items-center sm:gap-2">
            <div>
              <h1 className="mb-1 text-2xl font-semibold text-gray-900">Performance Evaluation</h1>
              <p className="text-base font-normal text-gray-600">
                Manage your subordinate performance evaluation documents.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <Button type="button" btnType="normal" size="md" variant="primary" onClick={openAddNewReport}>
                Add Evaluation
                <PlusIcon className="h-5 w-5 stroke-white" />
              </Button>
            </div>
          </div>
          <div className="my-4 px-10 xs:my-6 sm:my-8">
            <TableCore
              supportTableType="normal"
              useSearchBar={true}
              data={employeePerformanceData}
              columns={columnsEmployeePerformanceTable}
              buttons={[
                {
                  id: 'contract_department',
                  column: 'contract_department',
                  label: 'Department',
                },
                {
                  id: 'contract_position',
                  column: 'contract_position',
                  label: 'Position',
                },
                // {
                //   id: 'year',
                //   column: 'year',
                //   label: 'Year',
                //
                // },
              ]}
            />
          </div>
        </div>
      </Dashboard>

      <form id="employee-performance-add-report" onSubmit={handleSubmit(addNewReportSubmit)}>
        <Drawer
          isOpen={addNewReport}
          setIsOpen={setNewReport}
          title="Add New Report"
          description=""
          icon={<FileAttachment02Icon className="h-5 w-5 stroke-primary-600" />}
          footerButton={[
            <>
              <Button
                type="button"
                btnType="normal"
                variant="secondary-gray"
                className=""
                size="md"
                onClick={() => setNewReport(false)}
              >
                Cancel
              </Button>
            </>,
            <>
              <Button
                type="submit"
                btnType="normal"
                variant="primary"
                className=""
                size="md"
                isLoading={loadingButtonStatement.add_report}
              >
                Add Report
              </Button>
            </>,
          ]}
        >
          <div className="flex flex-col gap-6">
            <div>
              <label htmlFor="training_name" className="input-label">
                Subordinate
              </label>
              <Controller
                control={control}
                name="subordinate"
                rules={{ required: 'This is required field' }}
                render={({ field: { onChange, value }, fieldState: { invalid } }) => (
                  <ComboboxAutocomplete
                    icon={<User01Icon className="h-5 w-5 stroke-gray-500" />}
                    id="subordinate"
                    placeholder="Find your subordinate"
                    value={(value || '') as any}
                    handleChange={(subordinate) => {
                      onChange(subordinate)
                    }}
                    listData={subordinateList}
                    error={invalid}
                  />
                )}
              />
              {errors.subordinate && <span className="input-hint-text error">{errors.subordinate?.message}</span>}
            </div>
            <div>
              <label htmlFor="evaluation_type" className="input-label">
                Evaluation Type
              </label>
              <Controller
                control={control}
                name="evaluation_type"
                rules={{ required: 'This is required field' }}
                render={({ field: { onChange } }) => (
                  <div className="flex flex-col gap-2">
                    <div className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        id="planning"
                        name="evaluation_type"
                        value="planning"
                        className="radio-button"
                        onChange={(e) => onChange(e)}
                      />
                      <label htmlFor="planning" className="font-medium text-gray-700 hover:cursor-pointer">
                        Planning
                      </label>
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        id="end_year"
                        name="evaluation_type"
                        value="end_year"
                        className="radio-button"
                        onChange={(e) => onChange(e)}
                      />
                      <label htmlFor="end_year" className="font-medium text-gray-700 hover:cursor-pointer">
                        End-Year
                      </label>
                    </div>
                  </div>
                )}
              />
              {errors.evaluation_type && (
                <span className="input-hint-text error">{errors.evaluation_type?.message}</span>
              )}
            </div>
            <div>
              <label htmlFor="year" className="input-label">
                Year
              </label>
              <Controller
                control={control}
                name="year"
                rules={{ required: 'This is required field' }}
                render={({ field: { onChange }, fieldState: { invalid } }) => (
                  <>
                    <YearPickerCalendar
                      id="year"
                      selected={reportYear}
                      onChange={(date: Date) => {
                        onChange(date)
                        setReportYear(date)
                      }}
                      error={invalid}
                    />
                    {errors.year && <span className="input-hint-text error">{errors.year?.message}</span>}
                  </>
                )}
              />
            </div>
            <div className="h-px w-full bg-gray-200"></div>
            <SwitchableUploadField
              name="document_report"
              label="Documents Upload"
              fieldKey="document_report"
              control={control}
              errors={errors}
              setValue={setValue}
              isLinkMode={switchTogglableButton.add_document_report}
              onToggle={() => {
                setSwitchTogglableButton((prev) => ({
                  ...prev,
                  add_document_report: !prev.add_document_report,
                }))
                setTempProgressUpload({})
                setReportDocument([])
              }}
              bucketName={BucketsEnum.employee_performance}
              uploadProgress={tempProgressUpload}
              uploadedFiles={reportDocument}
              setUploadedFiles={setReportDocument}
              handleUploadFile={(files: File[], fieldKey: string) => {
                setReportDocument(files as any)
              }}
              deleteFilePath={deleteReportDocumentsFile}
              maxFiles={1}
              informationText="IMAGE or DOCUMENTS (max. 5MB)"
              existingFilePath={null}
              handleDeleteExistingFile={() => {}}
              isEditMode={false}
              isRequired={true}
            />
          </div>
        </Drawer>
      </form>

      <form
        id="employee-performance-view-report"
        onSubmit={handleSubmitUpdateReport(isUpdateReport ? updateReportSubmit : addNewReportSubmit)}
      >
        <Drawer
          isOpen={viewReport}
          setIsOpen={setViewReport}
          title={reportTitleDrawer}
          description=""
          icon={<FileAttachment02Icon className="h-5 w-5 stroke-primary-600" />}
          footerButton={[
            <Button
              key={0}
              type="button"
              btnType="normal"
              variant="secondary-gray"
              size="md"
              onClick={() => setViewReport(false)}
            >
              Cancel
            </Button>,
            <>
              {reportTitleDrawer === 'Add New Report' ? (
                <Button
                  type="submit"
                  btnType="normal"
                  variant="primary"
                  className=""
                  size="md"
                  isLoading={loadingButtonStatement.add_report}
                >
                  Add Report
                </Button>
              ) : (
                <>
                  {!isUpdateReport && (
                    <Button
                      type="button"
                      btnType="normal"
                      variant="secondary-gray"
                      size="md"
                      onClick={() => {
                        setIsUpdateReport(true)
                        setReportTitleDrawer('Edit Report')
                      }}
                    >
                      Edit Report
                    </Button>
                  )}
                </>
              )}
            </>,
            <>
              {isUpdateReport && (
                <Button
                  type="submit"
                  btnType="normal"
                  variant="primary"
                  size="md"
                  isLoading={loadingButtonStatement.update_report}
                >
                  Submit Report
                </Button>
              )}
            </>,
          ]}
        >
          <div className="flex flex-col gap-6">
            <div>
              <label htmlFor="training_name" className="input-label">
                Subordinate
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 p-2.5 shadow-xs">
                {viewReportDataHolder ? (
                  <>
                    <AvatarPlacement
                      size="xs"
                      image={viewReportDataHolder.employee_pass_photo}
                      text={viewReportDataHolder.employee_name}
                    />
                    <p className="text-gray-500">{viewReportDataHolder.employee_name}</p>
                  </>
                ) : null}
              </div>
            </div>
            <div>
              <label htmlFor="evaluation_type" className="input-label">
                Evaluation Type
              </label>
              <div className="flex flex-col gap-2">
                <div className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    id={`view_${EmployeePerformanceCreateRequestDocTypeEnum.Planning}`}
                    name="evaluation_type"
                    value="planning"
                    className="radio-button"
                    disabled
                  />
                  <label htmlFor="planning" className="font-medium text-gray-700">
                    Planning
                  </label>
                </div>
                <div className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    id={`view_${EmployeePerformanceCreateRequestDocTypeEnum.EndYear}`}
                    name="evaluation_type"
                    value="end_year"
                    className="radio-button"
                    disabled
                  />
                  <label htmlFor="end_year" className="font-medium text-gray-700">
                    End-Year
                  </label>
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="year" className="input-label">
                Year
              </label>
              <YearPickerCalendar id="year" selected={reportYear} disabled />
            </div>
            <div className="h-px w-full bg-gray-200"></div>
            {isUpdateReport || reportTitleDrawer === 'Add New Report' ? (
              <SwitchableUploadField
                name="document_report"
                label="Documents Upload"
                fieldKey="document_report"
                control={controlUpdateReport}
                errors={errorsUpdateReport}
                setValue={setValueUpdateReport}
                isLinkMode={switchTogglableButton.update_document_report}
                onToggle={() => {
                  setSwitchTogglableButton((prev) => ({
                    ...prev,
                    update_document_report: !prev.update_document_report,
                  }))
                  setTempProgressUpload({})
                  setReportDocument([])
                }}
                bucketName={BucketsEnum.employee_performance}
                uploadProgress={tempProgressUpload}
                uploadedFiles={reportDocument}
                setUploadedFiles={setReportDocument}
                handleUploadFile={(files: File[], fieldKey: string) => {
                  setReportDocument(files as any)
                }}
                deleteFilePath={deleteReportDocumentsFile}
                maxFiles={1}
                informationText="IMAGE or DOCUMENTS (max. 5MB)"
                existingFilePath={null}
                handleDeleteExistingFile={() => {}}
                isEditMode={isUpdateReport}
                isRequired={true}
              />
            ) : (
              <div>
                <label htmlFor="document_report" className="input-label mb-2.5">
                  Documents Upload
                </label>
                {viewReportType === EmployeePerformanceCreateRequestDocTypeEnum.Planning &&
                  viewReportDataHolder.planning?.path && <FilePreview fileName={viewReportDataHolder.planning?.path} />}
                {viewReportType === EmployeePerformanceCreateRequestDocTypeEnum.EndYear &&
                  viewReportDataHolder.end_year?.path && <FilePreview fileName={viewReportDataHolder.end_year?.path} />}
              </div>
            )}
          </div>
        </Drawer>
      </form>
    </>
  )
}

export default Evaluation

export const getServerSideProps: GetServerSideProps = async (context) => {
  /* 
      Quite weird and tricky case, because cookies at next server won't get updated cookies (refresh_token) from middleware in normal way, so i found this amazing hint from next's github issus, finally after hour :))
      https://github.com/vercel/next.js/issues/36049
      */

  const getUpdatedCookiesFromMiddleware = context.res.getHeader('set-cookie')
  // parseAuthToken handled by resolveAuthToken helper

  const auth_token = resolveAuthToken(getUpdatedCookiesFromMiddleware, context.req.cookies.auth_token)

  const authTokenJWT = safeDecodeJwt(auth_token)

  if (!authTokenJWT) {
    return { redirect: { destination: '/refresh', permanent: false } }
  }
  if (
    !authTokenJWT['payload']['role'].includes(RoleDefinition.SUPERVISOR) &&
    !authTokenJWT['payload']['role'].includes(RoleDefinition.SUPERADMIN)
  ) {
    return {
      notFound: true,
    }
  }

  const employeePerformanceApi = new EmployeePerformanceApi(createAPIConfig(auth_token))

  try {
    await employeePerformanceApi.employeePerformanceControllerGetEmployeePerformanceAll()

    return {
      props: {
        activeSidebar: 'Perf. Evaluation',
      },
    }
  } catch (error) {
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
  }
}
