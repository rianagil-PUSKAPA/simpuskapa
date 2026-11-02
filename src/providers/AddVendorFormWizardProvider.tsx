import { VendorEnum } from '@/types/vendor'
import { getVendorDetail, getVendorTypeDetail, vendorExternalApi } from '@/utils/apiRequestHelper'
import { UNFIX_TRANSPORT } from '@/utils/constant'
import { slugToCamelCase } from '@/utils/globalHelper'
import { VendorDto, VendorType } from '@sdk'
import { useRouter } from 'next/router'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type AvailableForms = 'vendorType' | 'vendorInformation' | 'vendorPackages' | 'vendorPayment'

export interface AddVendorFormWizardProps {
  identifier: string
  status: boolean
  percentage: number
}

export interface ContextProps {
  stepFormWizardHistory: AddVendorFormWizardProps[]
  formWizardCurrentState: AvailableForms
  handleFormWizardHistory: (
    currentIndetifier: AvailableForms,
    nextIndetifier: AvailableForms,
    totalPercentage: number,
    isReset?: boolean,
  ) => void
}

export const VENDOR_TYPE_TOTAL_PAGE = 1
export const VENDOR_INFORMATION_TOTAL_PAGE = {
  GOODS: 9,
  SUBSCRIPTION: 7,
  MISC: 9,
  SERVICES: 12,
  TRAVEL: 9,
  EVENT: 9,
  CONSULTANT: 11,
}
export const VENDOR_PACKAGES_TOTAL_PAGE = 1
export const VENDOR_PAYMENT_TOTAL_PAGE = 5

const WIZARD_HISTORY_DEFAULT_VALUE = [
  {
    identifier: 'vendorType',
    status: false,
    percentage: 0,
  },
  {
    identifier: 'vendorInformation',
    status: false,
    percentage: 0,
  },
  {
    identifier: 'vendorPackages',
    status: false,
    percentage: 0,
  },
  {
    identifier: 'vendorPayment',
    status: false,
    percentage: 0,
  },
]

const FormWizardContext = createContext<ContextProps | null>(null)

export const useAddVendorFormWizardProvider = () => useContext(FormWizardContext)

export const AddVendorFormWizardProvider = ({ children }) => {
  const router = useRouter()
  const [stepFormWizardHistory, setStepFormWizardHistory] =
    useState<AddVendorFormWizardProps[]>(WIZARD_HISTORY_DEFAULT_VALUE)
  const [formWizardCurrentState, setFormWizardCurrentState] = useState<AvailableForms>('vendorType')
  const [vendorDetailDraftData, setVendorDetailDraftData] = useState<VendorDto | null>(null)

  const handleFormWizardHistory = (
    currentIndetifier: AvailableForms,
    nextIndetifier: AvailableForms,
    totalPercentage: number,
    isReset = false,
  ) => {
    const exec = async () => {
      let vendorDetail = null

      if (router?.query?.id) {
        vendorDetail = await getVendorDetail(router.query.id as string)
      } else {
        const vendorIdOnprogress = JSON.parse(localStorage.getItem('vendor_id_onprogress'))
        if (vendorIdOnprogress) {
          vendorDetail = await getVendorDetail(vendorIdOnprogress)
        }
      }

      const choosenType = await getVendorTypeDetail(vendorDetail.vendor_type)

      let percentage = null

      switch (currentIndetifier) {
        case 'vendorType':
          percentage = vendorTypeFiltration(vendorDetail)
          break
        case 'vendorInformation':
          percentage = vendorInformationFiltration(vendorDetail, choosenType)
          break
        case 'vendorPackages':
          percentage = vendorPackagesFiltration(vendorDetail)
          break
        case 'vendorPayment':
          percentage = vendorPaymentFiltration(vendorDetail)
          break
        default:
          break
      }

      setFormWizardCurrentState(nextIndetifier)

      let filterDuplicateId: AddVendorFormWizardProps[]

      if (isReset) {
        filterDuplicateId = WIZARD_HISTORY_DEFAULT_VALUE.filter((item) => item.identifier !== currentIndetifier)
      } else {
        filterDuplicateId = stepFormWizardHistory.filter((item) => item.identifier !== currentIndetifier)
      }

      const insertedNewValue = [
        ...filterDuplicateId,
        {
          identifier: currentIndetifier,
          status: true,
          percentage: (percentage / totalPercentage) * 100,
        },
      ]

      // console.log('insertedNewValue', insertedNewValue)

      setStepFormWizardHistory(insertedNewValue)

      const formCalculation = insertedNewValue.reduce((accum, item) => accum + item.percentage, 0)

      // console.log('formCalculation', formCalculation)

      const percentageFormCalculation = ((Number(formCalculation) / 400) * 100).toFixed(0)

      // console.log('percentageFormCalculation', percentageFormCalculation)

      await vendorExternalApi.vendorControllerUpdateVendor(vendorDetail?.id || '', {
        ...vendorDetail,
        form_progress: Number(percentageFormCalculation),
        form_state: String(JSON.stringify(insertedNewValue)),
        vendor_categories: vendorDetail.vendor_categories.map((item) => item.vendor_category_info_id),
      })
    }
    exec()
  }

  useEffect(() => {
    if (vendorDetailDraftData && vendorDetailDraftData?.form_state) {
      setStepFormWizardHistory(JSON.parse(vendorDetailDraftData?.form_state))
    }
  }, [vendorDetailDraftData])

  useEffect(() => {
    const exec = async () => {
      if (router?.query?.id) {
        const result = await getVendorDetail(router.query.id as string)
        setVendorDetailDraftData(result)
      } else {
        const vendorIdOnprogress = JSON.parse(localStorage.getItem('vendor_id_onprogress'))
        if (vendorIdOnprogress) {
          const result = await getVendorDetail(vendorIdOnprogress)
          setVendorDetailDraftData(result)
        }
      }
    }
    exec()

    setTimeout(() => {
      exec()
    }, 600)
  }, [router])

  const contextValue: ContextProps = useMemo(
    () => ({
      stepFormWizardHistory,
      formWizardCurrentState,
      handleFormWizardHistory,
    }),
    [stepFormWizardHistory, formWizardCurrentState, handleFormWizardHistory],
  )

  useEffect(() => {
    if (router.query.section) {
      setFormWizardCurrentState(slugToCamelCase(router.query.section as string))
    }
  }, [])

  return <FormWizardContext.Provider value={contextValue}>{children}</FormWizardContext.Provider>
}

const vendorTypeFiltration = (vendorDetailData: VendorDto) => {
  let percentage = 0

  if (vendorDetailData?.vendor_type) {
    percentage++
  }

  return percentage
}
const vendorInformationFiltration = (vendorDetailData: VendorDto, choosenType: VendorType) => {
  // const choosenType = await getVendorTypeDetail(vendorDetailData?.vendor_type)

  let percentage = 0

  if (vendorDetailData?.vendor_categories.length) {
    percentage++
    // console.log(1)
  }
  if (vendorDetailData?.vendor_information['name']) {
    percentage++
    // console.log(2)
  }
  if (choosenType.name.toLowerCase() !== VendorEnum.SUBSCRIPTIONS) {
    if (vendorDetailData?.vendor_information['organization_type']) {
      percentage++
      // console.log(3)
    }
  }
  if (
    choosenType?.name.toLowerCase() === VendorEnum.SERVICES ||
    choosenType?.name.toLowerCase() === VendorEnum.MISC ||
    choosenType?.name.toLowerCase() === VendorEnum.CONSULTANT
  ) {
    if (vendorDetailData?.vendor_information['nationality']) {
      percentage++
      // console.log(4)
    }
  }
  if (vendorDetailData?.vendor_information['description']) {
    percentage++
    // console.log(5)
  }

  if (choosenType.name.toLowerCase() !== VendorEnum.SUBSCRIPTIONS) {
    if (vendorDetailData?.vendor_information['location']) {
      percentage++
      // console.log(6)
    }
  }

  if (choosenType.name.toLowerCase() === VendorEnum.SUBSCRIPTIONS) {
    if (vendorDetailData?.vendor_information['website']) {
      percentage++
      // console.log(7)
    }
  }

  if (vendorDetailData?.vendor_information['recommended_by']) {
    percentage++
    // console.log(8)
  }

  if (choosenType.name.toLowerCase() !== VendorEnum.SUBSCRIPTIONS) {
    if (choosenType.name.toLowerCase() !== VendorEnum.CONSULTANT) {
      if (vendorDetailData?.vendor_information['pic']) {
        percentage++
        // console.log(9)
      }
    }
    if (vendorDetailData?.vendor_information['phone_number']) {
      percentage++
      // console.log(10)
    }
  }
  if (vendorDetailData?.vendor_information['email']) {
    percentage++
    // console.log(11)
  }
  if (
    choosenType.name.toLowerCase() === VendorEnum.SERVICES ||
    choosenType.name.toLowerCase() === VendorEnum.CONSULTANT
  ) {
    if (choosenType.name.toLowerCase() === VendorEnum.SERVICES) {
      if (
        vendorDetailData?.vendor_categories.some(
          (category) =>
            category.vendor_category_info.name === 'Key Person' || category.vendor_category_info.name === 'Moderator',
        )
      ) {
        if (vendorDetailData?.vendor_information['identity_path']) {
          percentage++
          // console.log(12)
        }
      }
    } else {
      if (vendorDetailData?.vendor_information['identity_path']) {
        percentage++
        // console.log(13)
      }
    }
  }

  if (
    choosenType?.name.toLowerCase() !== VendorEnum.TRAVEL &&
    choosenType?.name.toLowerCase() !== VendorEnum.SUBSCRIPTIONS
  ) {
    if (
      choosenType?.name.toLowerCase() === VendorEnum.GOODS ||
      choosenType?.name.toLowerCase() === VendorEnum.EVENT ||
      choosenType?.name.toLowerCase() === VendorEnum.MISC
    ) {
      if (
        vendorDetailData?.vendor_categories.some(
          (category) =>
            // Goods
            category.vendor_category_info.name === 'IT/Peripherals' ||
            category.vendor_category_info.name === 'Equipment' ||
            // Event
            category.vendor_category_info.name === UNFIX_TRANSPORT ||
            category.vendor_category_info.name === 'Food Services' ||
            category.vendor_category_info.name === 'Event Organizer' ||
            // Miscellaneous
            category.vendor_category_info.name === 'Auditor' ||
            category.vendor_category_info.name === 'Contractor',
        )
      ) {
        if (vendorDetailData?.vendor_information['npwp_path']) {
          percentage++
          // console.log(14)
        }
      }
    } else {
      if (vendorDetailData?.vendor_information['npwp_path']) {
        percentage++
        // console.log(15)
      }
    }
  }

  if (choosenType?.name.toLowerCase() === VendorEnum.EVENT) {
    if (
      vendorDetailData?.vendor_categories.some((category) => category.vendor_category_info.name === 'Transportation')
    ) {
      if (vendorDetailData?.vendor_information['driving_license_path']) {
        percentage++
        // console.log(16)
      }
      if (vendorDetailData?.vendor_information['vechile_registration_path']) {
        percentage++
        // console.log(17)
      }
    }

    if (
      vendorDetailData?.vendor_categories.some((category) => category.vendor_category_info.name === 'Event Organizer')
    ) {
      if (vendorDetailData?.vendor_information['cv_path']) {
        percentage++
        // console.log(18)
      }
    }
  }

  if (
    choosenType?.name.toLowerCase() === VendorEnum.SERVICES ||
    choosenType?.name.toLowerCase() === VendorEnum.CONSULTANT
  ) {
    if (vendorDetailData?.vendor_information['cv_path']) {
      percentage++
      // console.log(19)
    }
    if (vendorDetailData?.vendor_information['nationality'] === 'warga_negara_asing') {
      if (vendorDetailData?.vendor_information['cod_path']) {
        percentage++
        // console.log(20)
      }
    }
  }

  if (vendorDetailData?.vendor_information['other_path']) {
    percentage++
    // console.log(21)
  }

  return percentage
}
const vendorPackagesFiltration = (vendorDetailData: VendorDto) => {
  let percentage = 0

  if (vendorDetailData.vendor_packages.length > 0) {
    percentage++
  }

  return percentage
}
const vendorPaymentFiltration = (vendorDetailData: VendorDto) => {
  let percentage = 0

  if (vendorDetailData?.vendor_payment.bank_name) {
    percentage++
  }
  if (vendorDetailData?.vendor_payment.bank_branch) {
    percentage++
  }
  if (vendorDetailData?.vendor_payment.bank_acc_number) {
    percentage++
  }
  if (vendorDetailData?.vendor_payment.bank_acc_name) {
    percentage++
  }
  if (vendorDetailData?.vendor_payment.swift_code) {
    percentage++
  }

  return percentage
}
