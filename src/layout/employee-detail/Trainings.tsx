import { Button } from '@/components/Button'
import { DatePickerCalendar } from '@/components/DatePickerCalendar'
import { Drawer } from '@/components/Drawer'
import { FilePreview } from '@/components/FilePreview'
import { Input } from '@/components/Input'
import { SwitchableUploadField } from '@/components/SwitchableUploadField'
import { TableCore } from '@/components/TableCore'
import { Award04Icon } from '@/components/icon/Award04Icon'
import { Edit05Icon } from '@/components/icon/Edit05Icon'
import { FileSearch02Icon } from '@/components/icon/FileSearch02Icon'
import { LinkExternal02Icon } from '@/components/icon/LinkExternal02Icon'
import { PlusIcon } from '@/components/icon/PlusIcon'
import { BucketsEnum } from '@/shared/file.system'
import { DynamicProgressType, TrainingForms } from '@/types/global'
import { downloadS3File, employeeApi, fileApi } from '@/utils/apiRequestHelper'
import { isValidUrl } from '@/utils/globalHelper'
import { createColumnHelper } from '@tanstack/react-table'
import axios from 'axios'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { Employee, EmployeeTraining } from 'sdk/api'
import useSWRMutation from 'swr/mutation'
dayjs.extend(utc)

type TrainingsProps = {
  employeeDetail: Employee
}

const columnHelperEmploymentTraining = createColumnHelper<EmployeeTraining>()

export const Trainings = ({ employeeDetail }: TrainingsProps) => {
  const router = useRouter()

  const [trainingId, setTrainingId] = useState<string>('')
  const [trainingDetail, setTrainingDetail] = useState<EmployeeTraining | null>(null)
  const [addNewTraining, setAddNewTraining] = useState<boolean>(false)
  const [updateTraining, setUpdateTraining] = useState<boolean>(false)
  const [trainingCompletion, setTrainingCompletion] = useState(new Date())
  const [trainingCertificateUpload, setTrainingCertificateUpload] = useState([])
  const [tempProgressUpload, setTempProgressUpload] = useState<DynamicProgressType>({})
  const [loadingButtonStatement, setLoadingButtonStatement] = useState<{
    training: boolean
  }>({
    training: false,
  })
  const [switchTogglableButton, setSwitchTogglableButton] = useState<{
    create_training_certificate: boolean
    update_training_certificate: boolean
  }>({
    create_training_certificate: false,
    update_training_certificate: false,
  })

  const {
    data: employeeTrainingsData,
    error: employeeTrainingsError,
    trigger: employeeTrainingsTrigger,
  } = useSWRMutation(router.query.id ? `${router.query.id}/training` : null, getEmployeeTrainings)

  const {
    handleSubmit: handleSubmitAddNewTraining,
    control: controlAddNewTraining,
    getValues: getValuesAddNewTraining,
    setValue: setValueAddNewTraining,
    reset: resetAddNewTraining,
    formState: { errors: errorsAddNewTraining },
  } = useForm<TrainingForms>()

  const {
    handleSubmit: handleSubmitUpdateTraining,
    control: controlUpdateTraining,
    setValue: setValueUpdateTraining,
    setError: setErrorUpdateTraining,
    formState: { errors: errorsUpdateTraining },
  } = useForm<TrainingForms>()

  const openAddNewTrainingDrawer = () => {
    setAddNewTraining(true)
  }
  const closeAddNewTrainingDrawer = useCallback(() => {
    setAddNewTraining(false)

    setTrainingCompletion(null)
    setTrainingCertificateUpload([])
    setTempProgressUpload({})

    resetAddNewTraining({
      source_fund: '',
      training_name: '',
      organizer: '',
      training_date: '',
      certificate: null,
    })
  }, [resetAddNewTraining])

  const openUpdateTrainingDrawer = () => {
    setUpdateTraining(true)
  }

  const closeUpdateTrainingDrawer = () => {
    setUpdateTraining(false)

    setTrainingCompletion(null)
    setTrainingCertificateUpload([])
    setTempProgressUpload({})

    resetAddNewTraining({
      source_fund: '',
      training_name: '',
      organizer: '',
      training_date: '',
      certificate: null,
    })

    setTrainingCompletion(null)
    setTrainingCertificateUpload([])
  }

  const handleOpenEditTrainingDrawer = useCallback(
    (parameter: EmployeeTraining) => {
      openUpdateTrainingDrawer()
      if (parameter.id) {
        setTrainingDetail(parameter)

        setValueUpdateTraining('training_name', parameter.training_name)
        setValueUpdateTraining('training_date', parameter.training_date as unknown as string)
        setTrainingCompletion(new Date(parameter.training_date as unknown as string))
        setValueUpdateTraining('source_fund', parameter.source_fund)
        setValueUpdateTraining('organizer', parameter.organizer)
        setValueUpdateTraining('certificate', parameter.certificate_path)
        setTrainingId(parameter.id)
      }
    },
    [setValueUpdateTraining],
  )

  const addNewTrainingSubmit: SubmitHandler<TrainingForms> = async (formInput) => {
    setLoadingButtonStatement((prev) => ({ ...prev, training: true }))

    let fileNameS3 = ''
    if (!switchTogglableButton.create_training_certificate) {
      const presignUrl = await fileApi.fileControllerGetPresignUrl(
        trainingCertificateUpload[0].name,
        BucketsEnum.employee_trainings,
      )

      fileNameS3 = String(presignUrl.data.data).split('::')[0]
      const identifier = 'certificate'

      await axios.put(String(presignUrl.data.data).split('::')[1], trainingCertificateUpload[0], {
        headers: {
          'Content-Type': trainingCertificateUpload[0].type,
        },
        onUploadProgress: (e) => {
          const percentCompleted = Math.round((e.loaded * 100) / e.total)

          setTempProgressUpload((prev) => ({
            ...prev,
            [identifier]: {
              bucketName: BucketsEnum.employee_trainings,
              progress: percentCompleted,
              identifier,
            },
          }))
        },
      })
    }

    const trainingValues = {
      training_name: formInput.training_name,
      organizer: formInput.organizer,
      source_fund: formInput.source_fund,
      training_date: dayjs(formInput.training_date).utc().format(),
      file_path: switchTogglableButton.create_training_certificate
        ? [`${formInput.certificate}`]
        : [`${BucketsEnum.employee_trainings}/${fileNameS3}`],
    }

    // console.log('trainingValues', trainingValues)
    // setLoadingButtonStatement((prev) => ({ ...prev, training: false }))
    // return false

    const addNewTrainings = employeeApi.employeeControllerAddEmployeeTraining(router.query.id as string, trainingValues)

    toast.promise(addNewTrainings, {
      pending: 'Adding New Training',
      success: 'New Training Addedd',
      error: 'Promise rejected 🤯',
    })

    addNewTrainings.then(() => {
      closeAddNewTrainingDrawer()
      employeeTrainingsTrigger()
    })

    addNewTrainings.finally(() => {
      setLoadingButtonStatement((prev) => ({ ...prev, training: false }))
    })
  }

  const updateTrainingSubmit: SubmitHandler<TrainingForms> = async (formInput) => {
    let fileNameS3 = null
    setLoadingButtonStatement((prev) => ({ ...prev, training: true }))
    let filePath = null

    // If user choose to update training certificate file
    if (!switchTogglableButton.update_training_certificate && trainingCertificateUpload.length) {
      const presignUrl = await fileApi.fileControllerGetPresignUrl(
        trainingCertificateUpload[0].name,
        BucketsEnum.employee_trainings,
      )

      fileNameS3 = String(presignUrl.data.data).split('::')[0]
      const identifier = 'certificate'

      await axios.put(String(presignUrl.data.data).split('::')[1], trainingCertificateUpload[0], {
        headers: {
          'Content-Type': trainingCertificateUpload[0].type,
        },
        onUploadProgress: (e) => {
          const percentCompleted = Math.round((e.loaded * 100) / e.total)

          setTempProgressUpload((prev) => ({
            ...prev,
            [identifier]: {
              bucketName: BucketsEnum.employee_trainings,
              progress: percentCompleted,
              identifier,
            },
          }))
        },
      })

      filePath = [`${BucketsEnum.employee_trainings}/${fileNameS3}`]
    }

    // Link validation
    if (switchTogglableButton.update_training_certificate && !isValidUrl(formInput.certificate as unknown as string)) {
      setErrorUpdateTraining('certificate', {
        message: 'Please enter a valid URL',
      })
      setLoadingButtonStatement((prev) => ({ ...prev, training: false }))
      return
    }

    // If user choose to update training certificate link
    if (switchTogglableButton.update_training_certificate && formInput.certificate) {
      filePath = [`${formInput.certificate}`]
    }

    const trainingValues = {
      file_path: filePath || [`${formInput.certificate}`],
      training_name: formInput.training_name,
      training_date: dayjs(formInput.training_date).utc().format(),
      organizer: formInput.organizer,
      source_fund: formInput.source_fund,
    }

    // console.log('trainingValues', trainingValues)
    // setLoadingButtonStatement((prev) => ({ ...prev, training: false }))
    // return false

    const updateTrainings = employeeApi.employeeControllerUpdateEmployeeTraining(trainingId, trainingValues)

    toast.promise(updateTrainings, {
      pending: 'Update Training',
      success: 'Training Updated',
      error: 'Promise rejected 🤯',
    })

    updateTrainings.then(() => {
      closeUpdateTrainingDrawer()
      employeeTrainingsTrigger()
    })

    updateTrainings.finally(() => {
      setLoadingButtonStatement((prev) => ({ ...prev, training: false }))
    })
  }

  const deleteCertificateFileUpload = async (filename: string) => {
    setValueAddNewTraining('certificate', undefined)
    setValueUpdateTraining('certificate', undefined)
    setTrainingCertificateUpload((prev) => prev.filter((item) => item.path !== filename))
  }

  const columnsEmployeeTrainingTable = useMemo(
    () => [
      columnHelperEmploymentTraining.accessor((row) => row.training_name, {
        id: 'name',
        header: 'Name',
        size: 260,
      }),
      columnHelperEmploymentTraining.accessor((row) => row.organizer, {
        id: 'provider',
        header: 'Provider',
        size: 170,
      }),
      columnHelperEmploymentTraining.accessor((row) => row.training_date, {
        id: 'date',
        header: 'Date',
        size: 140,
        cell: (info) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          return dayjs(info.renderValue()).format('MMMM YYYY')
        },
      }),
      columnHelperEmploymentTraining.accessor((row) => row.source_fund, {
        id: 'sourceFunds',
        header: 'Source Funds',
        size: 220,
      }),
      columnHelperEmploymentTraining.accessor((row) => row.id, {
        id: 'certificate',
        header: () => 'Certificate',
        size: 100,
        enableSorting: false,
        cell: (info) => (
          <div className="inline-flex items-center gap-1">
            {isValidUrl(info.row.original.certificate_path && info.row.original.certificate_path[0]) ? (
              <Link href={info.row.original.certificate_path[0]} target="_blank" rel="noopener noreferrer">
                <Button btnType="div" size="md" variant="secondary-gray" btnFormat="square">
                  <LinkExternal02Icon className="h-5 w-5 stroke-gray-700" />
                </Button>
              </Link>
            ) : (
              <Button
                type="button"
                btnType="normal"
                size="md"
                variant="secondary-gray"
                btnFormat="square"
                onClick={() => downloadS3File(info.row.original.certificate_path[0])}
              >
                <FileSearch02Icon className="h-5 w-5 stroke-gray-600" />
              </Button>
            )}
            <Button
              type="button"
              btnType="normal"
              size="sm"
              variant="secondary-gray"
              btnFormat="square"
              onClick={() => handleOpenEditTrainingDrawer(info.row.original)}
            >
              <Edit05Icon className="h-5 w-5 stroke-gray-600" />
            </Button>
          </div>
        ),
      }),
    ],
    [handleOpenEditTrainingDrawer],
  )

  useEffect(() => {
    employeeTrainingsTrigger()
  }, [employeeTrainingsTrigger])

  useEffect(() => {
    if (!addNewTraining) {
      closeAddNewTrainingDrawer()
    }
  }, [addNewTraining, closeAddNewTrainingDrawer])

  if (employeeTrainingsError) {
    return <pre>Error: {JSON.stringify(employeeTrainingsError, null, 2)}</pre>
  }

  if (!employeeTrainingsData) {
    return <></>
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="mb-1 text-lg font-semibold text-gray-900">Trainings</p>
          <p className="text-sm font-normal text-gray-600 ">See all trainings done by Employee</p>
        </div>
        <div className="inline-flex items-center gap-4">
          <Button type="button" btnType="normal" size="md" variant="primary" onClick={openAddNewTrainingDrawer}>
            Add New Training
            <PlusIcon className="h-5 w-5 stroke-white" />
          </Button>
        </div>
      </div>
      {employeeTrainingsData?.length ? (
        <TableCore data={employeeTrainingsData} columns={columnsEmployeeTrainingTable} supportTableType="external" />
      ) : (
        <div className="flex justify-center rounded-xl border border-gray-200 bg-gray-50 p-10">
          <div className="w-[22rem] text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-[6px] border-primary-50 bg-primary-100">
              <Award04Icon className="h-6 w-6 stroke-primary-600" />
            </div>
            <p className="mb-1 font-semibold text-gray-900">No Training Found</p>
            <span className="mb-6 inline-block text-sm font-normal leading-5 text-gray-600">
              There is no training added in your database. Please add if you have completed a training
            </span>
            <Button
              type="button"
              btnType="normal"
              size="md"
              variant="primary"
              onClick={openAddNewTrainingDrawer}
              className="mx-auto"
            >
              <PlusIcon className="h-5 w-5 stroke-white" />
              New Training
            </Button>
          </div>
        </div>
      )}
      {/* New Training : Create Form */}
      <form onSubmit={handleSubmitAddNewTraining(addNewTrainingSubmit)}>
        <Drawer
          isOpen={addNewTraining}
          setIsOpen={setAddNewTraining}
          title="Add New Training"
          description={employeeDetail.full_name}
          icon={<Award04Icon className="h-5 w-5 stroke-primary-600" />}
          footerButton={[
            <>
              <Button
                type="button"
                btnType="normal"
                variant="secondary-gray"
                className=""
                size="md"
                onClick={closeAddNewTrainingDrawer}
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
                isLoading={loadingButtonStatement.training}
              >
                Add Training
              </Button>
            </>,
          ]}
        >
          <div className="flex flex-col gap-6">
            <div>
              <label htmlFor="sourceFunds" className="input-label">
                Source of Funds
              </label>
              <Controller
                control={controlAddNewTraining}
                name="source_fund"
                rules={{ required: 'This is required field' }}
                render={({ field: { onChange }, fieldState: { invalid } }) => (
                  <>
                    <Input
                      type="text"
                      id="sourceFunds"
                      placeholder="Write the source of funds"
                      onChange={onChange}
                      value={getValuesAddNewTraining('source_fund') || ''}
                      error={invalid}
                    />
                    {errorsAddNewTraining.source_fund && (
                      <span className="input-hint-text error">{errorsAddNewTraining.source_fund?.message}</span>
                    )}
                  </>
                )}
              />
            </div>
            <div>
              <label htmlFor="training_name" className="input-label">
                Name of Training
              </label>
              <Controller
                control={controlAddNewTraining}
                name="training_name"
                rules={{ required: 'This is required field' }}
                render={({ field: { onChange }, fieldState: { invalid } }) => (
                  <>
                    <Input
                      type="text"
                      id="training_name"
                      placeholder="Write the name of training"
                      value={getValuesAddNewTraining('training_name') || ''}
                      onChange={onChange}
                      error={invalid}
                    />
                    {errorsAddNewTraining.training_name && (
                      <span className="input-hint-text error">{errorsAddNewTraining.training_name?.message}</span>
                    )}
                  </>
                )}
              />
            </div>
            <div>
              <label htmlFor="organizer" className="input-label">
                Provider
              </label>
              <Controller
                control={controlAddNewTraining}
                name="organizer"
                rules={{ required: 'This is required field' }}
                render={({ field: { onChange }, fieldState: { invalid } }) => (
                  <>
                    <Input
                      type="text"
                      id="organizer"
                      placeholder="Write the name of training’s provider"
                      value={getValuesAddNewTraining('organizer') || ''}
                      onChange={onChange}
                      error={invalid}
                    />
                    {errorsAddNewTraining.organizer && (
                      <span className="input-hint-text error">{errorsAddNewTraining.organizer?.message}</span>
                    )}
                  </>
                )}
              />
            </div>
            <div>
              <label htmlFor="training_date" className="input-label">
                Date of Training Completion
              </label>
              <Controller
                control={controlAddNewTraining}
                name="training_date"
                rules={{ required: 'This is required field' }}
                render={({ field: { onChange }, fieldState: { invalid } }) => (
                  <>
                    <DatePickerCalendar
                      id="training_date"
                      selected={trainingCompletion}
                      onChange={(date: Date) => {
                        onChange(date)
                        setTrainingCompletion(date)
                      }}
                      error={invalid}
                    />
                    {errorsAddNewTraining.training_date && (
                      <span className="input-hint-text error">{errorsAddNewTraining.training_date?.message}</span>
                    )}
                  </>
                )}
              />
            </div>
            <div className="h-px w-full bg-gray-200"></div>
            <SwitchableUploadField
              name="certificate"
              label="Training Certificate"
              fieldKey="certificate"
              control={controlAddNewTraining}
              errors={errorsAddNewTraining}
              setValue={setValueAddNewTraining}
              isLinkMode={switchTogglableButton.create_training_certificate}
              onToggle={() => {
                setSwitchTogglableButton((prev) => ({
                  ...prev,
                  create_training_certificate: !prev.create_training_certificate,
                }))
                setTrainingCertificateUpload([])
              }}
              bucketName={BucketsEnum.employee_trainings}
              uploadProgress={tempProgressUpload}
              uploadedFiles={trainingCertificateUpload}
              setUploadedFiles={setTrainingCertificateUpload}
              handleUploadFile={(files: File[]) => {
                setTrainingCertificateUpload(files as any)
              }}
              deleteFilePath={deleteCertificateFileUpload}
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

      {/* Edit Training : Update Form */}
      <form onSubmit={handleSubmitUpdateTraining(updateTrainingSubmit)}>
        <Drawer
          isOpen={updateTraining}
          setIsOpen={setUpdateTraining}
          title="Edit Trainings"
          description={employeeDetail.full_name}
          icon={<Award04Icon className="h-5 w-5 stroke-primary-600" />}
          footerButton={[
            <>
              <Button
                type="button"
                btnType="normal"
                variant="secondary-gray"
                className=""
                size="md"
                onClick={closeUpdateTrainingDrawer}
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
                isLoading={loadingButtonStatement.training}
              >
                Save Training
              </Button>
            </>,
          ]}
        >
          <div className="flex flex-col gap-6">
            <div>
              <label htmlFor="training_name" className="input-label">
                Name of Training
              </label>
              <Controller
                control={controlUpdateTraining}
                name="training_name"
                rules={{ required: 'This is required field' }}
                render={({ field: { value, onChange }, fieldState: { invalid } }) => (
                  <>
                    <Input
                      type="text"
                      id="training_name"
                      placeholder="Write the name of training"
                      onChange={onChange}
                      error={invalid}
                      value={value || ''}
                    />
                    {errorsUpdateTraining.training_name && (
                      <span className="input-hint-text error">{errorsUpdateTraining.training_name?.message}</span>
                    )}
                  </>
                )}
              />
            </div>
            <div>
              <label htmlFor="training_date" className="input-label">
                Date of Training Completion
              </label>
              <Controller
                control={controlUpdateTraining}
                name="training_date"
                rules={{ required: 'This is required field' }}
                render={({ field: { onChange }, fieldState: { invalid } }) => (
                  <>
                    <DatePickerCalendar
                      id="training_date"
                      selected={trainingCompletion}
                      onChange={(date: Date) => {
                        onChange(date)
                        setTrainingCompletion(date)
                      }}
                      error={invalid}
                    />
                    {errorsUpdateTraining.training_date && (
                      <span className="input-hint-text error">{errorsUpdateTraining.training_date?.message}</span>
                    )}
                  </>
                )}
              />
            </div>
            <div>
              <label htmlFor="sourceFunds" className="input-label">
                Source of Funds
              </label>
              <Controller
                control={controlUpdateTraining}
                name="source_fund"
                rules={{ required: 'This is required field' }}
                render={({ field: { value, onChange }, fieldState: { invalid } }) => (
                  <>
                    <Input
                      type="text"
                      id="sourceFunds"
                      placeholder="Write the source of funds"
                      onChange={onChange}
                      error={invalid}
                      value={value || ''}
                    />
                    {errorsUpdateTraining.source_fund && (
                      <span className="input-hint-text error">{errorsUpdateTraining.source_fund?.message}</span>
                    )}
                  </>
                )}
              />
            </div>
            <div>
              <label htmlFor="provider" className="input-label">
                Provider
              </label>
              <Controller
                control={controlUpdateTraining}
                name="organizer"
                rules={{ required: 'This is required field' }}
                render={({ field: { value, onChange }, fieldState: { invalid } }) => (
                  <>
                    <Input
                      type="text"
                      id="organizer"
                      placeholder="Write the Provider"
                      onChange={onChange}
                      error={invalid}
                      value={value || ''}
                    />
                    {errorsUpdateTraining.organizer && (
                      <span className="input-hint-text error">{errorsUpdateTraining.organizer?.message}</span>
                    )}
                  </>
                )}
              />
            </div>
            <div className="h-px w-full bg-gray-200"></div>
            <SwitchableUploadField
              name="certificate"
              label="Training Certificate"
              fieldKey="certificate"
              control={controlUpdateTraining}
              errors={errorsUpdateTraining}
              setValue={setValueUpdateTraining}
              isLinkMode={switchTogglableButton.update_training_certificate}
              onToggle={() => {
                setSwitchTogglableButton((prev) => ({
                  ...prev,
                  update_training_certificate: !prev.update_training_certificate,
                }))
              }}
              bucketName={BucketsEnum.employee_trainings}
              uploadProgress={tempProgressUpload}
              uploadedFiles={trainingCertificateUpload}
              setUploadedFiles={setTrainingCertificateUpload}
              handleUploadFile={(files: File[]) => {
                setTrainingCertificateUpload(files as any)
              }}
              deleteFilePath={deleteCertificateFileUpload}
              maxFiles={1}
              informationText="IMAGE or DOCUMENTS (max. 5MB)"
              existingFilePath={
                trainingDetail?.certificate_path?.length > 0 ? trainingDetail?.certificate_path[0] : null
              }
              handleDeleteExistingFile={() => {}}
              isEditMode={true}
              isRequired={true}
            />
          </div>
        </Drawer>
      </form>
    </>
  )
}

const getEmployeeTrainings = async (parameter: string) => {
  const id = parameter.split('/')[0]

  const employeeTrainingRes = await employeeApi.employeeControllerGetEmployeeTrainings(id as string)

  return employeeTrainingRes.data.data
}
