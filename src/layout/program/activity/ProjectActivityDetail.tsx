import { Button } from '@/components/Button'
import { ChevronDownIcon } from '@/components/icon/ChevronDownIcon'
import { PlusIcon } from '@/components/icon/PlusIcon'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { cn } from '@/lib/utils'
import ProgramRoleAccessControlProvider, { accessActionType, programTasks } from '@/providers/ProgramRoleAccessControl'
import { getProgramDetail, getProjectActivity } from '@/utils/apiRequestHelper'
import dayjs from 'dayjs'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect } from 'react'
import useSWRMutation from 'swr/mutation'

type Props = {
  slugIdentifier: string[]
}

export const ProjectActivityDetail = ({ slugIdentifier }: Props) => {
  const {
    data: projectActivityDetailData,
    error: projectActivityDetailError,
    trigger: projectActivityDetailTrigger,
  } = useSWRMutation(`projects/${slugIdentifier[0]}`, getProjectActivity)

  const { data: programData, trigger: programTrigger } = useSWRMutation(
    `project/${slugIdentifier[0]}`,
    getProgramDetail,
  )

  useEffect(() => {
    projectActivityDetailTrigger()
    programTrigger()
  }, [projectActivityDetailTrigger, programTrigger])

  if (projectActivityDetailError) {
    return <pre>Error: {JSON.stringify(projectActivityDetailError, null, 2)}</pre>
  }

  if (!programData || !projectActivityDetailData) {
    return <></>
  }

  return (
    <>
      <div
        className={cn(
          'flex items-center justify-between border-b border-b-gray-200 pb-6',
          projectActivityDetailData?.length ? 'mb-10' : 'mb-6',
        )}
      >
        <h2 className="text-lg font-semibold text-gray-900">Activity</h2>
        {programData.approval === null || programData.approval === 'rejected' || programData.approval === 'revision' ? (
          <>
            {projectActivityDetailData?.length ? (
              <ProgramRoleAccessControlProvider
                programId={slugIdentifier[0]}
                task={programTasks.EDIT_PROJECT_ACTIVITY}
                action={accessActionType.UPDATE}
                replaceWith={
                  <Button type="button" btnType="normal" size="md" variant="primary" disabled>
                    Edit Activity
                  </Button>
                }
              >
                <Link href={`/dashboard/project/${slugIdentifier[0]}/activity`}>
                  <Button btnType="div" size="md" variant="primary">
                    Edit Activity
                  </Button>
                </Link>
              </ProgramRoleAccessControlProvider>
            ) : (
              <ProgramRoleAccessControlProvider
                programId={slugIdentifier[0]}
                task={programTasks.CREATE_PROJECT_ACTIVITY}
                action={accessActionType.CREATE}
                replaceWith={
                  <Button type="button" btnType="normal" size="md" variant="primary" disabled>
                    Add Activity
                  </Button>
                }
              >
                <Link href={`/dashboard/project/${slugIdentifier[0]}/activity`}>
                  <Button btnType="div" size="md" variant="primary">
                    Add Activity
                  </Button>
                </Link>
              </ProgramRoleAccessControlProvider>
            )}
          </>
        ) : null}
      </div>

      {/* This component is to handle empt state at project & activity tab */}
      {projectActivityDetailData?.length === 0 ? (
        <div className="rounded-xl border-2 border-gray-200 bg-gray-50 p-10 text-center">
          <Image
            src={`${process.env.NEXT_PUBLIC_ASSETS}/svg/cloud-illustration.svg`}
            width={152}
            height={118}
            alt={`${process.env.NEXT_PUBLIC_ASSETS}/svg/cloud-illustration.svg`}
            className="mx-auto mb-4"
          />
          <h6 className="mb-1 font-semibold text-gray-900">No Activity found</h6>
          <p className="mb-6 text-sm text-gray-600">This project hasn’t have activity listed</p>
          <ProgramRoleAccessControlProvider
            programId={slugIdentifier[0]}
            task={programTasks.CREATE_PROJECT_ACTIVITY}
            action={accessActionType.CREATE}
            replaceWith={
              <Button disabled type="button" btnType="normal" size="md" variant="primary" className="mx-auto">
                <PlusIcon className="h-5 w-5 stroke-white" />
                New activity & sub-activity
              </Button>
            }
          >
            <Link href={`/dashboard/project/${slugIdentifier[0]}/activity`} className="inline-block">
              <Button btnType="div" size="md" variant="primary">
                <PlusIcon className="h-5 w-5 stroke-white" />
                New activity & sub-activity
              </Button>
            </Link>
          </ProgramRoleAccessControlProvider>
        </div>
      ) : (
        <div className="flex flex-col">
          {projectActivityDetailData?.map((projectActivityDetail) => (
            <div
              key={projectActivityDetail.id}
              className="flex items-start gap-5 border-b border-gray-200 py-10 first:pt-0"
            >
              <div className="flex w-64 shrink-0 flex-col gap-1 2xl:w-80">
                <span className="inline-block text-xs font-bold text-gray-500">
                  Activity ({projectActivityDetail.code})
                </span>
                <p className="text-xl font-semibold capitalize text-gray-900">{projectActivityDetail.description}</p>
              </div>
              <div className="shrink grow">
                <Accordion
                  type="multiple"
                  defaultValue={[...projectActivityDetail.activities.map((activity) => activity.id)]}
                  className="flex flex-col gap-5"
                >
                  {projectActivityDetail.activities.map((activity) => (
                    <AccordionItem
                      key={activity.id}
                      value={activity.id}
                      className="rounded-lg border border-gray-200 py-4 pe-4 ps-6"
                    >
                      <AccordionTrigger>
                        <div className="flex w-full items-center gap-4">
                          <span className="rounded bg-gray-100 px-8 py-0.5 font-semibold leading-6 text-gray-900">
                            {activity.code}
                          </span>
                          <div className="flex grow flex-wrap">
                            <p className="text-left font-semibold text-gray-900">{activity.description}</p>
                          </div>
                          <Button btnType="div" size="sm" variant="secondary-gray" btnFormat="square">
                            <div className="transition-transform duration-200 group-data-[state=open]:rotate-180">
                              <ChevronDownIcon className="h-5 w-5 stroke-gray-700" />
                            </div>
                          </Button>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="">
                        <div className="mt-4 flex justify-between gap-5 p-4">
                          <div className="w-32">
                            <span className="mb-2 inline-block text-sm font-bold text-gray-500">Timeline</span>
                            <p className="text-sm text-gray-900">
                              {activity.timeline.start && activity.timeline.end ? (
                                <>
                                  {dayjs(activity.timeline.start).format('DD MMM')} -{' '}
                                  {dayjs(activity.timeline.end).format('DD MMM')}
                                </>
                              ) : (
                                '-'
                              )}
                            </p>
                          </div>
                          <div className="w-48">
                            <span className="mb-2 inline-block text-sm font-bold text-gray-500">Notes</span>
                            <p className="me-5 text-sm text-gray-900">{activity.notes || '-'}</p>
                          </div>
                          <div className="w-48">
                            <span className="mb-2 inline-block text-sm font-bold text-gray-500">Milestone</span>
                            <p className="text-sm text-gray-900">{activity.proposed_milestone || '-'}</p>
                          </div>
                          <div className="w-32">
                            <span className="mb-2 inline-block text-sm font-bold text-gray-500">Deadline</span>
                            <p className="text-sm text-gray-900">
                              {activity.due_date ? dayjs(activity.due_date).format('DD MMM YYYY') : '-'}
                            </p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
