import { AvatarPlacement } from '@/components/AvatarPlacement'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Drawer } from '@/components/Drawer'
import { FilePreview } from '@/components/FilePreview'
import { Briefcase02Icon } from '@/components/icon/Briefcase02Icon'
import { CoinsHandIcon } from '@/components/icon/CoinsHandIcon'
import { FileSearch02Icon } from '@/components/icon/FileSearch02Icon'
import { Globe05Icon } from '@/components/icon/Globe05Icon'
import { Link03Icon } from '@/components/icon/Link03Icon'
import { Mail02Icon } from '@/components/icon/Mail02Icon'
import { PackageCheckIcon } from '@/components/icon/PackageCheckIcon'
import { Repeat03Icon } from '@/components/icon/Repeat03Icon'
import { Users03Icon } from '@/components/icon/Users03Icon'
import { CurrencyUnion } from '@/types/global'
import { VendorAnnonateType, VendorEnum } from '@/types/vendor'
import { downloadS3File, getEmployeeDetail } from '@/utils/apiRequestHelper'
import { formatCurrency, isValidUrl, slugify, titleCase, vendorBadgeColor } from '@/utils/globalHelper'
import ScrollTrigger from 'gsap/dist/ScrollTrigger'
import gsap from 'gsap/dist/gsap'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Employee, VendorDto, VendorPackage } from 'sdk/api'
import { useSWRConfig } from 'swr'
import useSWRImmutable from 'swr/immutable'

type InformationProps = {
  vendorDetail: VendorDto
}

export const VendorInformation = ({ vendorDetail }: InformationProps) => {
  const scrollsypControllerRef = useRef(null)

  const [recruitmentData, setRecruitmentData] = useState<boolean>(false)

  const { mutate } = useSWRConfig()
  const { data: employeeDetailData, error: employeeDetailError } = useSWRImmutable<Employee, Error>(
    vendorDetail ? vendorDetail?.vendor_information['recommended_by'] : null,
    getEmployeeDetail,
  )

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
        initialActive = document.querySelector("[data-tabs-id='vendor-type']")
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
    mutate(vendorDetail?.vendor_information['recommended_by'])
  }, [vendorDetail?.vendor_information['recommended_by']])

  if (employeeDetailError) {
    return <pre>Error: {JSON.stringify(employeeDetailError, null, 2)}</pre>
  }

  return (
    <>
      <div
        ref={scrollsypControllerRef}
        className="flex flex-col items-start gap-6 sm:gap-8 md:flex-row lg:gap-12 2xl:gap-16"
      >
        <div className="top-0 block w-full shrink-0 md:sticky md:w-52">
          <ul className="vertical-tabs md:mt-5">
            <li className="vertical-tabs-item" data-tabs-id="vendor-type">
              <a href="#vendor-type">Vendor Type</a>
            </li>
            <li className="vertical-tabs-item" data-tabs-id="about-vendor">
              <a href="#about-vendor">About Vendor</a>
            </li>
            <li className="vertical-tabs-item" data-tabs-id="contact">
              <a href="#contact">Contact</a>
            </li>
            <li className="vertical-tabs-item" data-tabs-id="documents">
              <a href="#documents">Documents</a>
            </li>
            <li className="vertical-tabs-item" data-tabs-id="package">
              <a href="#package">Package</a>
            </li>
          </ul>
        </div>
        <div className="mb-28 flex flex-col">
          <div className="column-items" id="vendor-type">
            <div className="flex items-center justify-between border-b border-b-gray-200 px-0 py-5 xxs:px-5 xs:px-6">
              <h6 className="text-base font-semibold text-gray-900 xxs:text-lg">Vendor Type</h6>
            </div>
            <table className="w-full table-fixed">
              <tbody className="table-striped">
                <tr className="flex flex-col xxs:table-row xxs:flex-row">
                  <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-72 xs:px-6 xs:py-5">
                    Type of Vendor
                  </td>
                  <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                    <label className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full border-[6px] border-primary-50 bg-primary-100 mix-blend-multiply">
                        {vendorDetail?.vendor_categories[0]?.vendor_category_info.vendor_type.name.toLowerCase() ===
                          VendorEnum.GOODS && <PackageCheckIcon className="h-4 w-4 stroke-primary-600" />}
                        {vendorDetail?.vendor_categories[0]?.vendor_category_info.vendor_type.name.toLowerCase() ===
                          VendorEnum.SUBSCRIPTIONS && <Repeat03Icon className="h-4 w-4 stroke-primary-600" />}
                        {vendorDetail?.vendor_categories[0]?.vendor_category_info.vendor_type.name.toLowerCase() ===
                          VendorEnum.MISC && <Briefcase02Icon className="h-4 w-4 stroke-primary-600" />}
                        {vendorDetail?.vendor_categories[0]?.vendor_category_info.vendor_type.name.toLowerCase() ===
                          VendorEnum.SERVICES && <CoinsHandIcon className="h-4 w-4 stroke-primary-600" />}
                        {vendorDetail?.vendor_categories[0]?.vendor_category_info.vendor_type.name.toLowerCase() ===
                          VendorEnum.TRAVEL && <Globe05Icon className="h-4 w-4 stroke-primary-600" />}
                        {vendorDetail?.vendor_categories[0]?.vendor_category_info.vendor_type.name.toLowerCase() ===
                          VendorEnum.EVENT && <Globe05Icon className="h-4 w-4 stroke-primary-600" />}
                        {vendorDetail?.vendor_categories[0]?.vendor_category_info.vendor_type.name.toLowerCase() ===
                          VendorEnum.CONSULTANT && <Users03Icon className="h-4 w-4 stroke-primary-600" />}
                      </div>
                      <p className="text-sm font-medium capitalize text-gray-900 duration-300">
                        {vendorDetail?.vendor_categories[0]?.vendor_category_info.vendor_type.name}
                      </p>
                    </label>
                  </td>
                </tr>
                <tr className="flex flex-col xxs:table-row xxs:flex-row">
                  <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-72 xs:px-6 xs:py-5">
                    Categories
                  </td>
                  <td className="px-0 py-3 text-sm capitalize text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                    <div className="inline-flex gap-1">
                      {vendorDetail?.vendor_categories.map((item) => (
                        <Badge
                          key={item.vendor_category_info_id}
                          size="sm"
                          color={vendorBadgeColor(
                            slugify(item.vendor_category_info.name) as unknown as VendorAnnonateType,
                          )}
                          icon="none"
                        >
                          {item.vendor_category_info.name}
                        </Badge>
                      ))}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="column-items" id="about-vendor">
            <div className="flex items-center justify-between border-b border-b-gray-200 px-0 py-5 xxs:px-5 xs:px-6">
              <h6 className="text-base font-semibold text-gray-900 xxs:text-lg">About Vendor</h6>
            </div>
            <table className="w-full table-fixed">
              <tbody className="table-striped">
                <tr className="flex flex-col xxs:table-row xxs:flex-row">
                  <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-72 xs:px-6 xs:py-5">
                    Name
                  </td>
                  <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                    {vendorDetail?.vendor_information['name']}
                  </td>
                </tr>
                {vendorDetail?.vendor_information['organization_type'] ? (
                  <tr className="flex flex-col xxs:table-row xxs:flex-row">
                    <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-72 xs:px-6 xs:py-5">
                      Type of Organization
                    </td>
                    <td className="px-0 py-3 text-sm capitalize text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                      {vendorDetail?.vendor_information['organization_type']}
                    </td>
                  </tr>
                ) : null}
                {vendorDetail?.vendor_information['nationality'] ? (
                  <tr className="flex flex-col xxs:table-row xxs:flex-row">
                    <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-72 xs:px-6 xs:py-5">
                      Nationality
                    </td>
                    <td className="px-0 py-3 text-sm capitalize text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                      {titleCase(vendorDetail?.vendor_information['nationality'])}
                    </td>
                  </tr>
                ) : null}

                <tr className="flex flex-col xxs:table-row xxs:flex-row">
                  <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-72 xs:px-6 xs:py-5">
                    Description / Scope of Work
                  </td>
                  <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                    {vendorDetail?.vendor_information['description']}
                  </td>
                </tr>
                {vendorDetail?.vendor_type.toLowerCase() !== 'subscription' &&
                  vendorDetail?.vendor_type.toLowerCase() !== 'subscriptions' && (
                    <tr className="flex flex-col xxs:table-row xxs:flex-row">
                      <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-72 xs:px-6 xs:py-5">
                        Location
                      </td>
                      <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                        {vendorDetail?.vendor_information['location']}
                      </td>
                    </tr>
                  )}
                <tr className="flex flex-col xxs:table-row xxs:flex-row">
                  <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-72 xs:px-6 xs:py-5">
                    Recommended by
                  </td>
                  <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                    <div className="inline-flex items-center gap-3">
                      <AvatarPlacement
                        size="sm"
                        image={employeeDetailData?.pass_photo_path?.[0]}
                        text={employeeDetailData?.full_name}
                      />
                      <p className="text-sm text-gray-600">{employeeDetailData?.full_name}</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="column-items" id="contact">
            <div className="flex items-center justify-between border-b border-b-gray-200 px-0 py-5 xxs:px-5 xs:px-6">
              <h6 className="text-base font-semibold text-gray-900 xxs:text-lg">Contact</h6>
            </div>
            <table className="w-full table-fixed">
              <tbody className="table-striped">
                {vendorDetail?.vendor_information['pic'] ? (
                  <tr className="flex flex-col xxs:table-row xxs:flex-row">
                    <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-72 xs:px-6 xs:py-5">
                      Person in Charge
                    </td>
                    <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                      {vendorDetail?.vendor_information['pic']}
                    </td>
                  </tr>
                ) : null}
                {vendorDetail?.vendor_information['pic'] ? (
                  <tr className="flex flex-col xxs:table-row xxs:flex-row">
                    <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-72 xs:px-6 xs:py-5">
                      Phone Number
                    </td>
                    <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                      {vendorDetail?.vendor_information['phone_number']?.replace('_', ' ')}
                    </td>
                  </tr>
                ) : null}
                {vendorDetail?.vendor_information['website'] ? (
                  <tr className="flex flex-col xxs:table-row xxs:flex-row">
                    <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-72 xs:px-6 xs:py-5">
                      Website
                    </td>
                    <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                      {vendorDetail?.vendor_information['website']}
                    </td>
                  </tr>
                ) : null}
                <tr className="flex flex-col xxs:table-row xxs:flex-row">
                  <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-72 xs:px-6 xs:py-5">
                    Email
                  </td>
                  <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                    {vendorDetail?.vendor_information['email']}
                  </td>
                  <td className="flex justify-end px-0 py-3 text-right xxs:px-5 xs:px-6">
                    {vendorDetail?.vendor_information['email'] ? (
                      <Link
                        href={`mailto:${vendorDetail?.vendor_information['email']}`}
                        className="flex whitespace-nowrap"
                      >
                        <Button btnType="div" size="sm" variant="secondary-gray" btnFormat="rectangle">
                          Send Email
                          <Mail02Icon className="h-5 w-5 stroke-gray-700" />
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        type="button"
                        btnType="normal"
                        size="sm"
                        variant="secondary-gray"
                        btnFormat="rectangle"
                        disabled
                      >
                        Send Email
                        <Mail02Icon className="h-5 w-5 stroke-gray-700" />
                      </Button>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="column-items" id="documents">
            <div className="flex items-center justify-between border-b border-b-gray-200 px-0 py-5 xxs:px-5 xs:px-6">
              <h6 className="text-base font-semibold text-gray-900 xxs:text-lg">Documents</h6>
            </div>
            <table className="w-full table-fixed">
              <tbody className="table-striped">
                {vendorDetail?.vendor_information['identity_path'] ? (
                  <tr className="flex flex-col xxs:table-row xxs:flex-row">
                    <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-72 xs:px-6 xs:py-5">
                      National Identity Card
                    </td>
                    <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5"></td>
                    {vendorDetail?.vendor_information['identity_path'][0] && (
                      <td className="flex justify-end px-0 py-3 text-right xxs:px-5 xs:px-6">
                        {isValidUrl(
                          vendorDetail?.vendor_information['identity_path'] &&
                            vendorDetail?.vendor_information['identity_path'][0],
                        ) ? (
                          <Link
                            href={vendorDetail?.vendor_information['identity_path'][0]}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
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
                              downloadS3File(vendorDetail?.vendor_information['identity_path'][0])
                            }}
                          >
                            <FileSearch02Icon className="h-5 w-5 stroke-gray-700" />
                            View
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ) : null}
                {vendorDetail?.vendor_information['npwp_path'] ? (
                  <tr className="flex flex-col xxs:table-row xxs:flex-row">
                    <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-72 xs:px-6 xs:py-5">
                      NPWP
                    </td>
                    <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5"></td>
                    {vendorDetail?.vendor_information['npwp_path'][0] && (
                      <td className="flex justify-end px-0 py-3 text-right xxs:px-5 xs:px-6">
                        {isValidUrl(
                          vendorDetail?.vendor_information['npwp_path'] &&
                            vendorDetail?.vendor_information['npwp_path'][0],
                        ) ? (
                          <Link
                            href={vendorDetail?.vendor_information['npwp_path'][0]}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
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
                              downloadS3File(vendorDetail?.vendor_information['npwp_path'][0])
                            }}
                          >
                            <FileSearch02Icon className="h-5 w-5 stroke-gray-700" />
                            View
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ) : null}
                {vendorDetail?.vendor_information['cv_path'] ? (
                  <tr className="flex flex-col xxs:table-row xxs:flex-row">
                    <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-72 xs:px-6 xs:py-5">
                      Curriculum Vitae (CV)
                    </td>
                    <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5"></td>
                    {vendorDetail?.vendor_information['cv_path'][0] && (
                      <td className="flex justify-end px-0 py-3 text-right xxs:px-5 xs:px-6">
                        {isValidUrl(
                          vendorDetail?.vendor_information['cv_path'] && vendorDetail?.vendor_information['cv_path'][0],
                        ) ? (
                          <Link
                            href={vendorDetail?.vendor_information['cv_path'][0]}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
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
                              downloadS3File(vendorDetail?.vendor_information['cv_path'][0])
                            }}
                          >
                            <FileSearch02Icon className="h-5 w-5 stroke-gray-700" />
                            View
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ) : null}
                {vendorDetail?.vendor_information['cod_path'] ? (
                  <tr className="flex flex-col xxs:table-row xxs:flex-row">
                    <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-72 xs:px-6 xs:py-5">
                      Certificate of Domicile (CoD)
                    </td>
                    <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5"></td>
                    {vendorDetail?.vendor_information['cod_path'][0] && (
                      <td className="flex justify-end px-0 py-3 text-right xxs:px-5 xs:px-6">
                        {isValidUrl(
                          vendorDetail?.vendor_information['cod_path'] &&
                            vendorDetail?.vendor_information['cod_path'][0],
                        ) ? (
                          <Link
                            href={vendorDetail?.vendor_information['cod_path'][0]}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
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
                              downloadS3File(vendorDetail?.vendor_information['cod_path'][0])
                            }}
                          >
                            <FileSearch02Icon className="h-5 w-5 stroke-gray-700" />
                            View
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ) : null}
                {vendorDetail?.vendor_information['driving_license_path'] ? (
                  <tr className="flex flex-col xxs:table-row xxs:flex-row">
                    <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-72 xs:px-6 xs:py-5">
                      Surat Izin Mengemudi (SIM)
                    </td>
                    <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5"></td>
                    {vendorDetail?.vendor_information['driving_license_path'][0] && (
                      <td className="flex justify-end px-0 py-3 text-right xxs:px-5 xs:px-6">
                        {isValidUrl(
                          vendorDetail?.vendor_information['driving_license_path'] &&
                            vendorDetail?.vendor_information['driving_license_path'][0],
                        ) ? (
                          <Link
                            href={vendorDetail?.vendor_information['driving_license_path'][0]}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
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
                              downloadS3File(vendorDetail?.vendor_information['driving_license_path'][0])
                            }}
                          >
                            <FileSearch02Icon className="h-5 w-5 stroke-gray-700" />
                            View
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ) : null}
                {vendorDetail?.vendor_information['vechile_registration_path'] ? (
                  <tr className="flex flex-col xxs:table-row xxs:flex-row">
                    <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-72 xs:px-6 xs:py-5">
                      Surat Tanda Nomor Kendaraan (STNK)
                    </td>
                    <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5"></td>
                    {vendorDetail?.vendor_information['vechile_registration_path'][0] && (
                      <td className="flex justify-end px-0 py-3 text-right xxs:px-5 xs:px-6">
                        {isValidUrl(
                          vendorDetail?.vendor_information['vechile_registration_path'] &&
                            vendorDetail?.vendor_information['vechile_registration_path'][0],
                        ) ? (
                          <Link
                            href={vendorDetail?.vendor_information['vechile_registration_path'][0]}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
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
                              downloadS3File(vendorDetail?.vendor_information['vechile_registration_path'][0])
                            }}
                          >
                            <FileSearch02Icon className="h-5 w-5 stroke-gray-700" />
                            View
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ) : null}
                <tr className="flex flex-col xxs:table-row xxs:flex-row">
                  <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-72 xs:px-6 xs:py-5">
                    Supporting Documents
                  </td>
                  <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5"></td>
                  <td className="flex justify-end px-0 py-3 text-right xxs:px-5 xs:px-6">
                    <Button
                      type="button"
                      btnType="normal"
                      size="md"
                      variant="secondary-gray"
                      onClick={openRecruitmentDataDrawer}
                      disabled={vendorDetail?.vendor_packages.length ? false : true}
                    >
                      <FileSearch02Icon className="h-5 w-5 stroke-gray-700" />
                      View All
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="column-items" id="package">
            <div className="flex items-center justify-between border-b border-b-gray-200 px-0 py-5 xxs:px-5 xs:px-6">
              <h6 className="text-base font-semibold text-gray-900 xxs:text-lg">Package</h6>
            </div>
            <table className="w-full table-fixed">
              <tbody className="table-striped">
                {vendorDetail?.vendor_packages.map((item: VendorPackage, index: number) => (
                  <tr key={index} className="flex flex-col xxs:table-row xxs:flex-row">
                    <td className="w-24 px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                      {index < 9 ? `0${++index}` : ++index}
                    </td>
                    <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">{item.name}</td>
                    <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">/{item.unit}</td>
                    <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                      {formatCurrency(item.currency as CurrencyUnion, Number(item.price))}{' '}
                      {item.currency !== 'IDR' ? `(${item.currency})` : null}
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
        title="Supporting Documents"
        description={vendorDetail?.vendor_information['name']}
        icon={<FileSearch02Icon className="h-5 w-5 stroke-primary-600" />}
      >
        <div>
          <label className="input-label">Documents</label>
          <div className="flex flex-col gap-6">
            {vendorDetail?.vendor_information?.['other_path']?.map((file: any, index: number) => (
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
