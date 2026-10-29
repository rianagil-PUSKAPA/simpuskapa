import { AvatarLabelGroup } from '@/components/AvatarLabelGroup'
import { Button } from '@/components/Button'
import { Drawer } from '@/components/Drawer'
import { FilePreview } from '@/components/FilePreview'
import { FileSearch02Icon } from '@/components/icon/FileSearch02Icon'

import { useDashboardContext } from '@/providers/DashboardProvider'
import { CurrencyUnion } from '@/types/global'
import { getProgramDetail } from '@/utils/apiRequestHelper'
import { formatCurrency, getMonthDuration, monthNumberToString } from '@/utils/globalHelper'
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import ScrollTrigger from 'gsap/dist/ScrollTrigger'
import gsap from 'gsap/dist/gsap'
import { useEffect, useRef, useState } from 'react'
import useSWRMutation from 'swr/mutation'

dayjs.extend(isBetween)

type Props = {
  slugIdentifier: string[]
}

export const ProgramInformation = ({ slugIdentifier }: Props) => {
  const { isInternal } = useDashboardContext()
  const scrollsypControllerRef = useRef(null)

  const [recruitmentData, setRecruitmentData] = useState<boolean>(false)

  const {
    data: programDetailData,
    error: programDetailError,
    trigger: programDetailTrigger,
  } = useSWRMutation(`project/${slugIdentifier[0]}`, getProgramDetail)

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
        initialActive = document.querySelector("[data-tabs-id='about-partner']")
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
  }, [programDetailData])

  useEffect(() => {
    programDetailTrigger()
  }, [])

  if (programDetailError) {
    return <pre>Error: {JSON.stringify(programDetailError, null, 2)}</pre>
  }

  if (!programDetailData) {
    return <></>
  }

  return (
    <>
      <div
        ref={scrollsypControllerRef}
        className="sim-pd-information-layout flex flex-col items-start gap-6 sm:gap-8 md:flex-row lg:gap-12 2xl:gap-16"
      >
        <div className="sim-pd-info-navigation top-0 block w-full shrink-0 md:sticky md:w-52">
          <ul className="vertical-tabs md:mt-5">
            <li className="vertical-tabs-item" data-tabs-id="about-partner">
              <a href="#about-partner">About Partner</a>
            </li>
            <li className="vertical-tabs-item" data-tabs-id="about-project">
              <a href="#about-project">About Project</a>
            </li>
            <li className="vertical-tabs-item" data-tabs-id="people">
              <a href="#people">People</a>
            </li>
            <li className="vertical-tabs-item" data-tabs-id="timeline">
              <a href="#timeline">Timeline</a>
            </li>
            <li className="vertical-tabs-item" data-tabs-id="contract">
              <a href="#contract">Contract</a>
            </li>
          </ul>
        </div>
        <div className="sim-pd-information-cards mb-28 flex flex-col">
          <div className="sim-pd-info-column">
          <div className="column-items" id="about-partner">
            <div className="flex items-center justify-between border-b border-b-gray-200 px-0 py-5 xxs:px-5 xs:px-6">
              <h6 className="text-base font-semibold text-gray-900 xxs:text-lg">About Partner</h6>
            </div>
            <table className="w-full table-fixed">
              <tbody className="table-striped">
                <tr className="flex flex-col xxs:table-row xxs:flex-row">
                  <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-60 xs:px-6 xs:py-5">
                    Partner Code
                  </td>
                  <td className="px-0 py-3 text-sm uppercase text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                    {programDetailData?.partner.code}
                  </td>
                </tr>
                <tr className="flex flex-col xxs:table-row xxs:flex-row">
                  <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-60 xs:px-6 xs:py-5">
                    Partner Name
                  </td>
                  <td className="px-0 py-3 text-sm capitalize text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                    {programDetailData?.partner.name}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="column-items" id="about-project">
            <div className="flex items-center justify-between border-b border-b-gray-200 px-0 py-5 xxs:px-5 xs:px-6">
              <h6 className="text-base font-semibold text-gray-900 xxs:text-lg">About Project</h6>
            </div>
            <table className="w-full table-fixed">
              <tbody className="table-striped">
                <tr className="flex flex-col xxs:table-row xxs:flex-row">
                  <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-60 xs:px-6 xs:py-5">
                    Name
                  </td>
                  <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                    {programDetailData?.program_name}
                  </td>
                </tr>
                <tr className="flex flex-col xxs:table-row xxs:flex-row">
                  <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-60 xs:px-6 xs:py-5">
                    Description / Scope of Work
                  </td>
                  <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                    {programDetailData?.program_description}
                  </td>
                </tr>
                <tr className="flex flex-col xxs:table-row xxs:flex-row">
                  <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-60 xs:px-6 xs:py-5">
                    Estimated Budget
                  </td>
                  <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                    {formatCurrency(
                      programDetailData?.estimated_budget.split('_')[0] as unknown as CurrencyUnion,
                      Number(programDetailData?.estimated_budget.split('_')[1]),
                    )}{' '}
                    {programDetailData?.estimated_budget.split('_')[0] !== 'IDR'
                      ? `(${programDetailData?.estimated_budget.split('_')[0]})`
                      : null}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          </div>
          <div className="sim-pd-info-column">
          <div className="column-items" id="people">
            <div className="flex items-center justify-between border-b border-b-gray-200 px-0 py-5 xxs:px-5 xs:px-6">
              <h6 className="text-base font-semibold text-gray-900 xxs:text-lg">People</h6>
            </div>
            <table className="w-full table-fixed">
              <tbody className="table-striped">
                {!isInternal ? (
                  <>
                    <tr className="flex flex-col xxs:table-row xxs:flex-row">
                      <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-60 xs:px-6 xs:py-5">
                        Grant Manager
                      </td>
                      <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                        <AvatarLabelGroup
                          size={'sm'}
                          image={
                            programDetailData?.grant_manager.pass_photo_path?.[0] ||
                            programDetailData?.grant_manager.avatar[0]
                          }
                          text={programDetailData?.grant_manager.full_name}
                          statusIcon={false}
                        />
                      </td>
                    </tr>
                    <tr className="flex flex-col xxs:table-row xxs:flex-row">
                      <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-60 xs:px-6 xs:py-5">
                        Project Manager
                      </td>
                      <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                        <AvatarLabelGroup
                          size={'sm'}
                          image={
                            programDetailData?.program_manager.pass_photo_path?.[0] ||
                            programDetailData?.program_manager.pass_photo_path?.[0]
                          }
                          text={programDetailData?.program_manager.full_name}
                          statusIcon={false}
                        />
                      </td>
                    </tr>
                    <tr className="flex flex-col xxs:table-row xxs:flex-row">
                      <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-60 xs:px-6 xs:py-5">
                        Project Officer
                      </td>
                      <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                        <AvatarLabelGroup
                          size={'sm'}
                          image={
                            programDetailData?.program_officer.pass_photo_path?.[0] ||
                            programDetailData?.program_officer.avatar[0]
                          }
                          text={programDetailData?.program_officer.full_name}
                          statusIcon={false}
                        />
                      </td>
                    </tr>
                  </>
                ) : (
                  <>
                    <tr className="flex flex-col xxs:table-row xxs:flex-row">
                      <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-60 xs:px-6 xs:py-5">
                        General Manager
                      </td>
                      <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                        <AvatarLabelGroup
                          size={'sm'}
                          image={programDetailData?.head_operation?.employee_pass_photo}
                          text={programDetailData?.head_operation?.name}
                          statusIcon={false}
                        />
                      </td>
                    </tr>
                    <tr className="flex flex-col xxs:table-row xxs:flex-row">
                      <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-60 xs:px-6 xs:py-5">
                        Requested By
                      </td>
                      <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                        <AvatarLabelGroup
                          size={'sm'}
                          image={programDetailData?.created_by.employee_pass_photo}
                          text={programDetailData?.created_by.name}
                          statusIcon={false}
                        />
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
          <div className="column-items" id="timeline">
            <div className="flex items-center justify-between border-b border-b-gray-200 px-0 py-5 xxs:px-5 xs:px-6">
              <h6 className="text-base font-semibold text-gray-900 xxs:text-lg">Timeline</h6>
            </div>
            <table className="w-full table-fixed">
              <tbody className="table-striped">
                <tr className="flex flex-col xxs:table-row xxs:flex-row">
                  <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-60 xs:px-6 xs:py-5">
                    Time Span
                  </td>
                  <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                    {getMonthDuration(
                      new Date(
                        `${programDetailData?.timeline.start_date.year}-${programDetailData?.timeline.start_date.month}-01`,
                      ),
                      new Date(
                        `${programDetailData?.timeline.end_date.year}-${programDetailData?.timeline.end_date.month}-01`,
                      ),
                    )}{' '}
                    {Number(
                      getMonthDuration(
                        new Date(
                          `${programDetailData?.timeline.start_date.year}-${programDetailData?.timeline.start_date.month}-01`,
                        ),
                        new Date(
                          `${programDetailData?.timeline.end_date.year}-${programDetailData?.timeline.end_date.month}-01`,
                        ),
                      ),
                    ) > 1
                      ? 'Months'
                      : 'Month'}
                  </td>
                </tr>
                <tr className="flex flex-col xxs:table-row xxs:flex-row">
                  <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-60 xs:px-6 xs:py-5">
                    Project Start
                  </td>
                  <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                    {monthNumberToString(programDetailData?.timeline.start_date.month)}{' '}
                    {programDetailData?.timeline.start_date.year}
                  </td>
                </tr>
                <tr className="flex flex-col xxs:table-row xxs:flex-row">
                  <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-60 xs:px-6 xs:py-5">
                    Project End
                  </td>
                  <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5">
                    {monthNumberToString(programDetailData?.timeline.end_date.month)}{' '}
                    {programDetailData?.timeline.end_date.year}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="column-items" id="contract">
            <div className="flex items-center justify-between border-b border-b-gray-200 px-0 py-5 xxs:px-5 xs:px-6">
              <h6 className="text-base font-semibold text-gray-900 xxs:text-lg">Contract</h6>
            </div>
            <table className="w-full table-fixed">
              <tbody className="table-striped">
                <tr className="flex flex-col xxs:table-row xxs:flex-row">
                  <td className="w-full px-0 pb-0 pt-4 text-xs font-medium text-gray-600 xxs:w-44 xxs:px-5 xxs:py-4 xs:w-60 xs:px-6 xs:py-5">
                    Documents
                  </td>
                  <td className="px-0 py-3 text-sm text-gray-600 xxs:px-5 xxs:py-4 xs:px-6 xs:py-5"></td>
                  <td className="flex justify-end px-0 py-3 text-right xxs:px-5 xs:px-6">
                    <Button
                      type="button"
                      btnType="normal"
                      size="md"
                      variant="secondary-gray"
                      onClick={openRecruitmentDataDrawer}
                      disabled={programDetailData?.contract.contract_path.length ? false : true}
                    >
                      <FileSearch02Icon className="h-5 w-5 stroke-gray-700" />
                      View All
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          </div>
        </div>
      </div>

      {/* Recruitment Data*/}
      <Drawer
        isOpen={recruitmentData}
        setIsOpen={setRecruitmentData}
        title="Contracts"
        description={programDetailData?.partner.name}
        icon={<FileSearch02Icon className="h-5 w-5 stroke-primary-600" />}
        drawerWidth="w-[28rem]"
        usingFooter={false}
      >
        <div className="flex flex-col gap-6">
          <div>
            <label className="input-label">Documents</label>
            <div className="flex flex-col gap-4">
              {programDetailData?.contract.contract_path.map((file: any, index: number) => (
                <div key={index}>
                  <FilePreview fileName={file} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Drawer>
    </>
  )
}
