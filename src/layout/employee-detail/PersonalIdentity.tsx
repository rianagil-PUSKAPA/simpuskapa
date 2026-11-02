import { AvatarPlacement } from '@/components/AvatarPlacement'
import { Button } from '@/components/Button'
import { Drawer } from '@/components/Drawer'
import { FilePreview } from '@/components/FilePreview'
import { FileSearch02Icon } from '@/components/icon/FileSearch02Icon'
import { Link03Icon } from '@/components/icon/Link03Icon'
import { UserSquareIcon } from '@/components/icon/UserSquareIcon'
import { cn } from '@/lib/utils'
import { downloadS3File, getS3HeaderInformation } from '@/utils/apiRequestHelper'
import { capitalizeFirstLetter, isValidUrl } from '@/utils/globalHelper'
import dayjs from 'dayjs'
import ScrollTrigger from 'gsap/dist/ScrollTrigger'
import gsap from 'gsap/dist/gsap'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Employee } from 'sdk/api'

type PersonalIdentityProps = {
  employeeDetail: Employee
}

export const PersonalIdentity = ({ employeeDetail }: PersonalIdentityProps) => {
  const scrollsypControllerRef = useRef(null)

  const [cvLastModified, setCvLastModified] = useState('')
  const [recruitmentData, setRecruitmentData] = useState<boolean>(false)

  /* Drawer: Recruitment Data */
  const openRecruitmentDataDrawer = () => {
    setRecruitmentData(true)
  }

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      gsap.registerPlugin(ScrollTrigger)

      const sections = gsap.utils.toArray('.column-items')

      let initialActive = null

      const initialStateActive = () => {
        initialActive = document.querySelector("[data-tabs-id='personal']")
        initialActive?.classList.add('active-shadow')
      }

      const checkActive = (self: any) => {
        const classListTarget = document.querySelector(`[data-tabs-id="${self.trigger.id}"]`)?.classList

        if (self.progress === 0) {
          initialActive?.classList.add('active-shadow')
        }
        if (self.isActive) {
          initialActive?.classList.remove('active-shadow')
          classListTarget?.add('active')
        } else {
          classListTarget?.remove('active')
        }
      }

      sections.forEach((section: any, index: any) => {
        if (index === sections.length - 1) {
          /* The last */
          ScrollTrigger.create({
            trigger: section,
            // markers: true,
            start: 'top center',
            end: 'bottom center',
            onToggle: checkActive,
            onRefreshInit: initialStateActive,
          })
        } else {
          ScrollTrigger.create({
            trigger: section,
            // markers: true,
            start: 'top center',
            end: 'bottom center',
            onToggle: checkActive,
            onRefreshInit: initialStateActive,
          })
        }
      })
    }, scrollsypControllerRef)

    return () => ctx.revert()
  }, [])

  useEffect(() => {
    const exec = async () => {
      if (employeeDetail?.cv_path) {
        const result = await getS3HeaderInformation(employeeDetail.cv_path[0])
        setCvLastModified(result)
      }
    }
    exec()
  }, [employeeDetail])

  if (!employeeDetail) {
    return <></>
  }

  return (
    <>
      <div
        ref={scrollsypControllerRef}
        className="flex flex-col items-start gap-6 sm:gap-8 md:flex-row lg:gap-12 2xl:gap-16"
      >
        <div className="top-0 block w-full shrink-0 md:sticky md:w-52">
          <ul className="vertical-tabs md:mt-5">
            <li className="vertical-tabs-item" data-tabs-id="personal">
              <a href="#personal">Personal</a>
            </li>
            <li className="vertical-tabs-item" data-tabs-id="contact-address">
              <a href="#contact-address">Contacts & Address</a>
            </li>
            <li className="vertical-tabs-item" data-tabs-id="identity-data">
              <a href="#identity-data">Identity Data</a>
            </li>
            <li className="vertical-tabs-item" data-tabs-id="bank-details">
              <a href="#bank-details">Bank Details</a>
            </li>
            <li className="vertical-tabs-item" data-tabs-id="emergency-contact">
              <a href="#emergency-contact">Emergency Contact</a>
            </li>
          </ul>
        </div>
        <div className="mb-28 flex flex-col">
          <div className="column-items" id="personal">
            <div className="flex items-center justify-between border-b border-b-gray-200 px-0 py-5 xxs:px-5 xs:px-6">
              <h6 className="text-base font-semibold text-gray-900 xxs:text-lg">Personal Data</h6>
            </div>
            <table className="w-full table-fixed">
              <tbody className="table-striped">
                <tr className="flex flex-col xxs:table-row xxs:flex-row">
                  <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-60 xs:px-6 xs:py-5">
                    Staff ID
                  </td>
                  <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                    {employeeDetail.staff_id}
                  </td>
                </tr>
                <tr className="flex flex-col xxs:table-row xxs:flex-row">
                  <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-60 xs:px-6 xs:py-5">
                    Full Name
                  </td>
                  <td className="px-0 py-3 text-sm capitalize text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                    {employeeDetail.full_name}
                  </td>
                </tr>
                <tr className="flex flex-col xxs:table-row xxs:flex-row">
                  <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-60 xs:px-6 xs:py-5">
                    Gender
                  </td>
                  <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                    {capitalizeFirstLetter(employeeDetail.gender)}
                  </td>
                </tr>
                <tr className="flex flex-col xxs:table-row xxs:flex-row">
                  <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-60 xs:px-6 xs:py-5">
                    Birthplace
                  </td>
                  <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                    {employeeDetail.pob}
                  </td>
                </tr>
                <tr className="flex flex-col xxs:table-row xxs:flex-row">
                  <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-60 xs:px-6 xs:py-5">
                    Birthdate
                  </td>
                  <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                    {dayjs(employeeDetail.dob).format('DD MMMM YYYY')}
                  </td>
                </tr>
                <tr className="flex flex-col xxs:table-row xxs:flex-row">
                  <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-60 xs:px-6 xs:py-5">
                    Religion
                  </td>
                  <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                    {capitalizeFirstLetter(employeeDetail.religion)}
                  </td>
                </tr>
                <tr className="flex flex-col xxs:table-row xxs:flex-row">
                  <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-60 xs:px-6 xs:py-5">
                    Martial Status
                  </td>
                  <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                    {capitalizeFirstLetter(employeeDetail.marital_status)}
                  </td>
                </tr>
                <tr className="flex flex-col xxs:table-row xxs:flex-row">
                  <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-60 xs:px-6 xs:py-5">
                    Nationality
                  </td>
                  <td className="px-0 py-3 text-sm capitalize text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                    {employeeDetail.nationality === 'wni' ? 'Warga Negara Indonesia' : employeeDetail.nationality}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="column-items" id="contact-address">
            <div className="flex items-center justify-between border-b border-b-gray-200 px-0 py-5 xxs:px-5 xs:px-6">
              <h6 className="text-base font-semibold text-gray-900 xxs:text-lg">Contacts & Address</h6>
            </div>
            <table className="w-full table-fixed">
              <tbody className="table-striped">
                <tr className="flex flex-col xxs:table-row xxs:flex-row">
                  <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-60 xs:px-6 xs:py-5">
                    Address (based on ID)
                  </td>
                  <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                    {employeeDetail.id_card_address}
                  </td>
                </tr>
                <tr className="flex flex-col xxs:table-row xxs:flex-row">
                  <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-60 xs:px-6 xs:py-5">
                    Address
                  </td>
                  <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                    {employeeDetail.residence_address}
                  </td>
                </tr>
                <tr className="flex flex-col xxs:table-row xxs:flex-row">
                  <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-60 xs:px-6 xs:py-5">
                    Phone Number
                  </td>
                  <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                    {employeeDetail.phone_number.replace('_', ' ')}
                  </td>
                </tr>
                <tr className="flex flex-col xxs:table-row xxs:flex-row">
                  <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-60 xs:px-6 xs:py-5">
                    Email
                  </td>
                  <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                    {employeeDetail.user.email}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="column-items" id="identity-data">
            <div className="flex items-center justify-between border-b border-b-gray-200 px-0 py-5 xxs:px-5 xs:px-6">
              <h6 className="text-base font-semibold text-gray-900 xxs:text-lg">Identity Data</h6>
            </div>
            <table className="w-full table-fixed">
              <tbody className="table-striped">
                <tr className="flex flex-col xxs:table-row xxs:flex-row">
                  <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-60 xs:px-6 xs:py-5">
                    Nationality Identity Card
                  </td>
                  <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                    {employeeDetail.identity_number}
                  </td>
                  {employeeDetail.identity_path[0] && (
                    <td className="flex justify-end px-0 py-3 text-right xxs:px-5 xs:px-6">
                      {isValidUrl(employeeDetail.identity_path && employeeDetail.identity_path[0]) ? (
                        <Link href={employeeDetail.identity_path[0]} target="_blank" rel="noopener noreferrer">
                          <Button btnType="div" size="md" variant="secondary-gray">
                            <Link03Icon className="h-5 w-5 stroke-gray-700" />
                            View
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          type="button"
                          btnType="normal"
                          size="md"
                          variant="secondary-gray"
                          onClick={() => {
                            downloadS3File(employeeDetail.identity_path[0])
                          }}
                        >
                          <FileSearch02Icon className="h-5 w-5 stroke-gray-700" />
                          View
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
                <tr className="flex flex-col xxs:table-row xxs:flex-row">
                  <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-60 xs:px-6 xs:py-5">
                    NPWP
                  </td>
                  <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                    {employeeDetail.npwp_number}
                  </td>
                  {employeeDetail.npwp_path[0] && (
                    <td className="flex justify-end px-0 py-3 text-right xxs:px-5 xs:px-6">
                      {isValidUrl(employeeDetail.npwp_path && employeeDetail.npwp_path[0]) ? (
                        <Link href={employeeDetail.npwp_path[0]} target="_blank" rel="noopener noreferrer">
                          <Button btnType="div" size="md" variant="secondary-gray">
                            <Link03Icon className="h-5 w-5 stroke-gray-700" />
                            View
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          type="button"
                          btnType="normal"
                          size="md"
                          variant="secondary-gray"
                          onClick={() => {
                            downloadS3File(employeeDetail.npwp_path[0])
                          }}
                        >
                          <FileSearch02Icon className="h-5 w-5 stroke-gray-700" />
                          View
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
                <tr className="flex flex-col xxs:table-row xxs:flex-row">
                  <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-60 xs:px-6 xs:py-5">
                    BPJS Kesehatan
                  </td>
                  <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                    {employeeDetail.bpjs_number}
                  </td>
                  {employeeDetail.bpjs_path[0] && (
                    <td className="flex justify-end px-0 py-3 text-right xxs:px-5 xs:px-6">
                      {isValidUrl(employeeDetail.bpjs_path && employeeDetail.bpjs_path[0]) ? (
                        <Link href={employeeDetail.bpjs_path[0]} target="_blank" rel="noopener noreferrer">
                          <Button btnType="div" size="md" variant="secondary-gray">
                            <Link03Icon className="h-5 w-5 stroke-gray-700" />
                            View
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          type="button"
                          btnType="normal"
                          size="md"
                          variant="secondary-gray"
                          onClick={() => {
                            downloadS3File(employeeDetail.bpjs_path[0])
                          }}
                        >
                          <FileSearch02Icon className="h-5 w-5 stroke-gray-700" />
                          View
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
                <tr className="flex flex-col xxs:table-row xxs:flex-row">
                  <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-60 xs:px-6 xs:py-5">
                    BPJS Ketenagakerjaan
                  </td>
                  <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                    {employeeDetail.bpjs_tkn_number}
                  </td>
                  {employeeDetail.bpjs_emp_path[0] && (
                    <td className="flex justify-end px-0 py-3 text-right xxs:px-5 xs:px-6">
                      {isValidUrl(employeeDetail.bpjs_emp_path && employeeDetail.bpjs_emp_path[0]) ? (
                        <Link href={employeeDetail.bpjs_emp_path[0]} target="_blank" rel="noopener noreferrer">
                          <Button btnType="div" size="md" variant="secondary-gray">
                            <Link03Icon className="h-5 w-5 stroke-gray-700" />
                            View
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          type="button"
                          btnType="normal"
                          size="md"
                          variant="secondary-gray"
                          onClick={() => {
                            downloadS3File(employeeDetail.bpjs_emp_path[0])
                          }}
                        >
                          <FileSearch02Icon className="h-5 w-5 stroke-gray-700" />
                          View
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
                <tr className="flex flex-col xxs:table-row xxs:flex-row">
                  <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-60 xs:px-6 xs:py-5">
                    Passport
                  </td>
                  <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                    {employeeDetail.passport_number}
                    <p className="text-xs">
                      Exp:{' '}
                      {employeeDetail.passport_expiry
                        ? dayjs(employeeDetail.passport_expiry).format('DD MMMM YYYY')
                        : null}
                    </p>
                  </td>
                  {employeeDetail.passport_path[0] && (
                    <td className="flex justify-end px-0 py-3 text-right xxs:px-5 xs:px-6">
                      {isValidUrl(employeeDetail.passport_path && employeeDetail.passport_path[0]) ? (
                        <Link href={employeeDetail.passport_path[0]} target="_blank" rel="noopener noreferrer">
                          <Button btnType="div" size="md" variant="secondary-gray">
                            <Link03Icon className="h-5 w-5 stroke-gray-700" />
                            View
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          type="button"
                          btnType="normal"
                          size="md"
                          variant="secondary-gray"
                          onClick={() => {
                            downloadS3File(employeeDetail.passport_path[0])
                          }}
                        >
                          <FileSearch02Icon className="h-5 w-5 stroke-gray-700" />
                          View
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
                <tr className="flex flex-col xxs:table-row xxs:flex-row">
                  <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-60 xs:px-6 xs:py-5">
                    Family Identity Card
                  </td>
                  <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                    {employeeDetail.kk_number}
                  </td>
                  {employeeDetail.kk_path[0] && (
                    <td className="flex justify-end px-0 py-3 text-right xxs:px-5 xs:px-6">
                      {isValidUrl(employeeDetail.kk_path && employeeDetail.kk_path[0]) ? (
                        <Link href={employeeDetail.kk_path[0]} target="_blank" rel="noopener noreferrer">
                          <Button btnType="div" size="md" variant="secondary-gray">
                            <Link03Icon className="h-5 w-5 stroke-gray-700" />
                            View
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          type="button"
                          btnType="normal"
                          size="md"
                          variant="secondary-gray"
                          onClick={() => {
                            downloadS3File(employeeDetail.kk_path[0])
                          }}
                        >
                          <FileSearch02Icon className="h-5 w-5 stroke-gray-700" />
                          View
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
                <tr className="flex flex-col xxs:table-row xxs:flex-row">
                  <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-60 xs:px-6 xs:py-5">
                    Insurance Health Number
                  </td>
                  <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                    {employeeDetail.health_insurance_number}
                  </td>
                  {employeeDetail.health_insurance_path[0] && (
                    <td className="flex justify-end px-0 py-3 text-right xxs:px-5 xs:px-6">
                      {isValidUrl(employeeDetail.health_insurance_path && employeeDetail.health_insurance_path[0]) ? (
                        <Link href={employeeDetail.health_insurance_path[0]} target="_blank" rel="noopener noreferrer">
                          <Button btnType="div" size="md" variant="secondary-gray">
                            <Link03Icon className="h-5 w-5 stroke-gray-700" />
                            View
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          type="button"
                          btnType="normal"
                          size="md"
                          variant="secondary-gray"
                          onClick={() => {
                            downloadS3File(employeeDetail.health_insurance_path[0])
                          }}
                        >
                          <FileSearch02Icon className="h-5 w-5 stroke-gray-700" />
                          View
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
                <tr className="flex flex-col xxs:table-row xxs:flex-row">
                  <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-60 xs:px-6 xs:py-5">
                    CV
                  </td>
                  <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                    CV (Latest Update: {dayjs(cvLastModified).format('YYYY')})
                  </td>
                  {employeeDetail.cv_path[0] && (
                    <td className="flex justify-end px-0 py-3 text-right xxs:px-5 xs:px-6">
                      {isValidUrl(employeeDetail.cv_path && employeeDetail.cv_path[0]) ? (
                        <Link href={employeeDetail.cv_path[0]} target="_blank" rel="noopener noreferrer">
                          <Button btnType="div" size="md" variant="secondary-gray">
                            <Link03Icon className="h-5 w-5 stroke-gray-700" />
                            View
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          type="button"
                          btnType="normal"
                          size="md"
                          variant="secondary-gray"
                          onClick={() => {
                            downloadS3File(employeeDetail.cv_path[0])
                          }}
                        >
                          <FileSearch02Icon className="h-5 w-5 stroke-gray-700" />
                          View
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
                <tr className="flex flex-col xxs:table-row xxs:flex-row">
                  <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-60 xs:px-6 xs:py-5">
                    Recruitment Data
                  </td>
                  <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                    {employeeDetail.recruitment_documents_title}
                  </td>
                  <td className="flex justify-end px-0 py-3 text-right xxs:px-5 xs:px-6">
                    <Button
                      type="button"
                      btnType="normal"
                      size="md"
                      variant="secondary-gray"
                      onClick={openRecruitmentDataDrawer}
                    >
                      <FileSearch02Icon className="h-5 w-5 stroke-gray-700" />
                      View
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="column-items" id="bank-details">
            <div className="flex items-center justify-between border-b border-b-gray-200 px-0 py-5 xxs:px-5 xs:px-6">
              <h6 className="text-base font-semibold text-gray-900 xxs:text-lg">Bank Data</h6>
            </div>
            <table className="w-full table-fixed">
              <tbody className="table-striped">
                <tr className="flex flex-col xxs:table-row xxs:flex-row">
                  <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-60 xs:px-6 xs:py-5">
                    Bank Name
                  </td>
                  <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                    {employeeDetail.bank_name}
                  </td>
                </tr>
                <tr className="flex flex-col xxs:table-row xxs:flex-row">
                  <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-60 xs:px-6 xs:py-5">
                    Branch Name
                  </td>
                  <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                    {employeeDetail.bank_branch}
                  </td>
                </tr>
                <tr className="flex flex-col xxs:table-row xxs:flex-row">
                  <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-60 xs:px-6 xs:py-5">
                    Account Holder Name
                  </td>
                  <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                    {employeeDetail.bank_acc_name}
                  </td>
                </tr>
                <tr className="flex flex-col xxs:table-row xxs:flex-row">
                  <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-60 xs:px-6 xs:py-5">
                    Bank Number
                  </td>
                  <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                    {employeeDetail.bank_acc_number}
                  </td>
                </tr>
                <tr className="flex flex-col xxs:table-row xxs:flex-row">
                  <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-60 xs:px-6 xs:py-5">
                    SWIFT Code
                  </td>
                  <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                    {employeeDetail.swift_code}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="column-items" id="emergency-contact">
            <div className="flex items-center justify-between border-b border-b-gray-200 px-0 py-5 xxs:px-5 xs:px-6">
              <h6 className="text-base font-semibold text-gray-900 xxs:text-lg">Emergency Contact</h6>
            </div>
            <table className="w-full table-fixed">
              <tbody className="table-striped">
                {JSON.parse(employeeDetail?.emergency_contacts as unknown as string).map((item: any, index: number) => (
                  <tr key={index} className="flex flex-col xxs:table-row xxs:flex-row">
                    <td className="w-24 px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                      {index < 9 ? `0${++index}` : ++index}
                    </td>
                    <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                      {item.emergency_name}
                    </td>
                    <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                      {item.emergency_relationship}
                    </td>
                    <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                      {item.emergency_phone_number.replace('_', ' ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recruitment Data*/}
      <Drawer
        isOpen={recruitmentData}
        setIsOpen={setRecruitmentData}
        title="Recruitment Data"
        description={employeeDetail.full_name}
        icon={<UserSquareIcon className="h-5 w-5 stroke-primary-600" />}
      >
        <div className="flex flex-col gap-6">
          <div>
            <label htmlFor="training_name" className="input-label">
              Subordinate
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 p-2.5 capitalize shadow-xs">
              <AvatarPlacement
                size="xs"
                image={employeeDetail?.pass_photo_path ? employeeDetail?.pass_photo_path?.[0] : ''}
                text={employeeDetail?.full_name}
              />
              <p className="text-gray-500">{employeeDetail?.full_name}</p>
            </div>
          </div>
          <div>
            <label htmlFor="training_name" className="input-label">
              Documents Title
            </label>
            <div className="rounded-lg border border-gray-300 bg-gray-50 p-2.5 capitalize shadow-xs">
              <p className={cn(employeeDetail?.recruitment_documents_title ? 'text-gray-500' : 'text-gray-500/40')}>
                {employeeDetail?.recruitment_documents_title || <em>No Documents title</em>}
              </p>
            </div>
          </div>
          <div className="h-px w-full bg-gray-200"></div>
          <div>
            <label className="input-label">Documents</label>
            {employeeDetail?.recruitment_documents_path.map((file, index) => (
              <div key={index}>
                <FilePreview fileName={file} />
              </div>
            ))}
          </div>
        </div>
      </Drawer>
    </>
  )
}
