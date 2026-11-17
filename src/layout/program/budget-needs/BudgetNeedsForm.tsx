/* eslint-disable tailwindcss/no-custom-classname */
import { Button } from '@/components/Button'
import { Drawer } from '@/components/Drawer'
import { Input } from '@/components/Input'
import { Loader } from '@/components/Loader'
import { StrictModeDroppable } from '@/components/StrictModeDroppable'
import { RequisitionFormRemainingBudget } from '@/components/calculations/RequisitionFormRemainingBudget'
import { AlertTriangleIcon } from '@/components/icon/AlertTriangleIcon'
import { ChevronDownIcon } from '@/components/icon/ChevronDownIcon'
import { FileSearch02Icon } from '@/components/icon/FileSearch02Icon'
import { ParagraphSpacingIcon } from '@/components/icon/ParagraphSpacingIcon'
import { PlusIcon } from '@/components/icon/PlusIcon'
import { Trash01Icon } from '@/components/icon/Trash01Icon'
import { ComboboxRadix } from '@/components/radix/ComboboxRadix'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { cn } from '@/lib/utils'
import ProgramRoleAccessControlProvider, { accessActionType, programTasks } from '@/providers/ProgramRoleAccessControl'
import { ComboboxType, CurrencyUnion } from '@/types/global'
import {
  getBudgetNeeds,
  getCategories,
  getPerdiemSetting,
  getProjectActivity,
  getVendorTypes,
  programApi,
} from '@/utils/apiRequestHelper'
import { APP_ENV } from '@/utils/constant'
import {
  calculateUnitCostPerActivity,
  calculateUnitCostPerProject,
  capitalizeOfString,
  convertStringCurrency,
  formatCurrency,
  formatTimeLeft,
} from '@/utils/globalHelper'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import { ThumbsUpIcon } from 'lucide-react'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'
import { DragDropContext, Draggable, resetServerContext } from 'react-beautiful-dnd'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import TextareaAutosize from 'react-textarea-autosize'
import { toast } from 'react-toastify'
import { ActivityBudgetList, ProgramDetail, ProgramPerdiemSettings, ProjectActivity } from 'sdk/api'
import useSWRMutation from 'swr/mutation'
import { v4 as uuidv4 } from 'uuid'

dayjs.extend(duration)

resetServerContext()

// Constants
const PERDIEM_CATEGORIES = {
  NORMAL: 'normal perdiem',
  OVERSEAS: 'overseas perdiem',
  REMOTE_AREA: 'remote area perdiem',
} as const

type PerdiemCategory = (typeof PERDIEM_CATEGORIES)[keyof typeof PERDIEM_CATEGORIES]

const PERDIEM_DEFAULT_UNITS = {
  UNIT: 'orang',
  PKG_UNIT: 'malam',
} as const

const countdownDuration = APP_ENV !== 'production' ? 60 * 0.5 : 60 * 1 // Countdown duration in seconds

type BudgetNeedProps = {
  submitRef: React.RefObject<HTMLButtonElement>
  slugIdentifier: string[]
  programDetail: ProgramDetail
  handleLoadingButton: (action: string, statement: boolean) => void
}

type ActivityBudgetListModified = ActivityBudgetList & {
  is_checked: boolean
  type_controller: string
  category_controller: ComboboxType[]
  existing_item?: boolean
  remaining?: number
  pending_requested?: number
  paid_total?: number
}

type ProjectActivityModified = ProjectActivity & {
  budgets: ActivityBudgetListModified[]
}

type ProjectBudgetsImproved = {
  code: string
  description: string
  id: string
  ordering_seq: number
  activities: ProjectActivityModified[]
}

type ChangeEvent = React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
type DragResult = {
  destination?: { index: number }
  source: { index: number }
  draggableId: string
}
type DndProvided = {
  innerRef: React.Ref<HTMLDivElement>
  draggableProps: Record<string, unknown>
  dragHandleProps: Record<string, unknown>
  droppableProps: Record<string, unknown>
  placeholder: React.ReactNode
}
type DndSnapshot = {
  isDragging: boolean
  isDraggingOver: boolean
}

// Helper Functions
const isPerdiemCategory = (category: string): category is PerdiemCategory => {
  const lowerCategory = category.toLowerCase()
  return Object.values(PERDIEM_CATEGORIES).includes(lowerCategory as PerdiemCategory)
}

const getPerdiemBaseValue = (category: string, perdiemSettings?: ProgramPerdiemSettings): number => {
  const lowerCategory = category.toLowerCase()
  switch (lowerCategory) {
    case PERDIEM_CATEGORIES.NORMAL:
      return perdiemSettings?.base_value_normal ?? 0
    case PERDIEM_CATEGORIES.OVERSEAS:
      return perdiemSettings?.base_value_overseas ?? 0
    case PERDIEM_CATEGORIES.REMOTE_AREA:
      return perdiemSettings?.base_value_remote_area ?? 0
    default:
      return 0
  }
}

const validateBudgetCosts = (projectBudgets: ProjectBudgetsImproved[]): string | null => {
  for (const project of projectBudgets) {
    for (const activity of project.activities) {
      for (const budget of activity.budgets) {
        const totalCost = budget.qty * budget.pkg_qty * budget.unit_cost_value
        const pendingAndPaid = (budget.pending_requested ?? 0) + (budget.paid_total ?? 0)

        if (totalCost < pendingAndPaid) {
          return `Total cost budget of "${budget.description}" is lower than the sum of pending requested and total payment`
        }
      }
    }
  }
  return null
}

const calculateTotalBudget = (projectBudgets: ProjectBudgetsImproved[]): number => {
  let total = 0
  projectBudgets.forEach((project) => {
    project.activities.forEach((activity) => {
      activity.budgets.forEach((budget) => {
        total += budget.qty * budget.pkg_qty * budget.unit_cost_value
      })
    })
  })
  return total
}

const validateBudgetTotal = (
  adjustmentTotal: number,
  existingTotal: number,
  benchmarkingTotal: number,
  hasBudgetRevision: boolean,
): string | null => {
  if (!hasBudgetRevision) return null

  if (benchmarkingTotal === 0) {
    if (adjustmentTotal < existingTotal) {
      return `Total project requested (${formatCurrency(
        'IDR',
        adjustmentTotal,
      )}) is lower than total projects amount (${formatCurrency('IDR', existingTotal)}), should be exactly same total`
    }
    if (adjustmentTotal > existingTotal) {
      return `Total project requested (${formatCurrency(
        'IDR',
        adjustmentTotal,
      )}) is more than total projects amount (${formatCurrency('IDR', existingTotal)}), should be exactly same total`
    }
  } else {
    if (adjustmentTotal < benchmarkingTotal) {
      return `Total project requested (${formatCurrency(
        'IDR',
        adjustmentTotal,
      )}) is lower than amount defined at revise budget (${formatCurrency(
        'IDR',
        benchmarkingTotal,
      )}), should be exactly same total`
    }
    if (adjustmentTotal > benchmarkingTotal) {
      return `Total project requested (${formatCurrency(
        'IDR',
        adjustmentTotal,
      )}) is more than amount defined at revise budget (${formatCurrency(
        'IDR',
        benchmarkingTotal,
      )}), should be exactly same total`
    }
  }
  return null
}

const prepareSubmitValues = (projectBudgets: ProjectBudgetsImproved[]) => {
  return projectBudgets.map((project) => ({
    id: project.id,
    activities: project.activities.map((activity) => ({
      id: activity.id,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      budgets: activity.budgets?.map(({ is_checked, ...rest }) => {
        const vendorCategoryId = rest.category_controller.find((category) => {
          if (rest.vendor_category_id) {
            return category.name.toLowerCase() === rest.vendor_category_id.toLowerCase()
          }
          return category.name.toLowerCase() === rest.vendor_category_information.name.toLowerCase()
        })?.id

        return {
          ...rest,
          qty: Number(rest.qty),
          pkg_qty: Number(rest.pkg_qty),
          unit_cost_value: convertStringCurrency(rest.unit_cost_value),
          unit_cost: `IDR_${convertStringCurrency(rest.unit_cost_value)}`,
          vendor_category_id: vendorCategoryId || '',
        }
      }),
    })),
  }))
}

export const BudgetNeedsForm = ({ submitRef, slugIdentifier, programDetail, handleLoadingButton }: BudgetNeedProps) => {
  const router = useRouter()

  const [perdiemSettingDrawer, setPerdiemSettingDrawer] = useState<boolean>(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [timeLeft, setTimeLeft] = useState(countdownDuration)
  const [endTime, setEndTime] = useState(dayjs().add(countdownDuration, 'second'))
  const [loadingButtonStatement, setLoadingButtonStatement] = useState<{
    perdiemSetting: boolean
  }>({
    perdiemSetting: false,
  })

  const { data: projectActivityDetailData, trigger: projectActivityDetailTrigger } = useSWRMutation(
    `projects/${slugIdentifier[0]}`,
    getProjectActivity,
  )

  const { data: budgetNeedsData, trigger: budgetNeedsTrigger } = useSWRMutation(
    `budget-needs/${slugIdentifier[0]}`,
    getBudgetNeeds,
  )

  const {
    data: perdiemSettingData,
    trigger: perdiemSettingTrigger,
    isMutating: perdiemSettingIsMutating,
  } = useSWRMutation(`${slugIdentifier[0]}`, getPerdiemSetting)

  const { data: vendorTypesData, trigger: vendorTypesTrigger } = useSWRMutation('vendor-types', getVendorTypes)

  const [projectBudgets, setProjectBudgets] = useState<ProjectBudgetsImproved[]>([])
  const [renderForm, setRenderForm] = useState<boolean>(false)
  const [renderFormShadow, setRenderFormShadow] = useState<boolean>(false)
  const [totalTargetBudgetNeeds, setTotalTargetBudgetNeeds] = useState(0)
  const [totalAdjustableBudgetNeeds, setTotalAdjustableBudgetNeeds] = useState(0)
  const [perdiemInputsDisabled, setPerdiemInputsDisabled] = useState<
    Record<string, { unitCost: boolean; unit: boolean; pkgUnit: boolean }>
  >({})

  const { handleSubmit } = useForm<ProjectBudgetsImproved[]>({
    defaultValues: projectBudgets,
  })
  const {
    register,
    handleSubmit: handleSubmitPerdiemSetting,
    control,
    setValue: setValuePerdiemSetting,
    formState: { errors },
  } = useForm<ProgramPerdiemSettings>()

  const openPerdiemSettingDrawer = () => {
    setPerdiemSettingDrawer(true)
  }

  const closePerdiemSettingDrawer = useCallback(() => {
    setPerdiemSettingDrawer(false)
    perdiemSettingTrigger()
  }, [perdiemSettingTrigger])

  const submitPerdimeSetting: SubmitHandler<ProgramPerdiemSettings> = async (formInput) => {
    setLoadingButtonStatement((prev) => ({ ...prev, perdiemSetting: true }))

    const base_value_normal = Number(formInput.base_value_normal)
    const base_value_overseas = Number(formInput.base_value_overseas)
    const base_value_remote_area = Number(formInput.base_value_remote_area)
    const breakfast = Number(formInput.travel_expense_percentages.breakfast)
    const lunch = Number(formInput.travel_expense_percentages.lunch)
    const dinner = Number(formInput.travel_expense_percentages.dinner)
    const non_overnight = Number(formInput.travel_expense_percentages.non_overnight)
    const travel_days = Number(formInput.travel_expense_percentages.travel_days)

    const submitValuesUpdateBudgetNeedsPerdiem = projectBudgets.map((project) => {
      return {
        id: project.id,
        activities: project.activities.map((activity) => {
          return {
            id: activity.id,
            budgets: activity.budgets.map(
              ({
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                is_checked,
                ...budget
              }) => {
                if (budget.vendor_category_id.toLowerCase() === 'normal perdiem') {
                  budget.unit_cost_value = formInput.base_value_normal
                  budget.unit_cost = `IDR_${formInput.base_value_normal}`
                }
                if (budget.vendor_category_id.toLowerCase() === 'overseas perdiem') {
                  budget.unit_cost_value = formInput.base_value_overseas
                  budget.unit_cost = `IDR_${formInput.base_value_overseas}`
                }
                if (budget.vendor_category_id.toLowerCase() === 'remote area perdiem') {
                  budget.unit_cost_value = formInput.base_value_remote_area
                  budget.unit_cost = `IDR_${formInput.base_value_remote_area}`
                }

                const vendorCategoryId = budget.category_controller.find((category) => {
                  if (budget.vendor_category_id) {
                    return category.name.toLowerCase() === budget.vendor_category_id.toLowerCase()
                  } else {
                    return category.name.toLowerCase() === budget.vendor_category_information.name.toLowerCase()
                  }
                })?.id

                return {
                  ...budget,
                  qty: Number(budget.qty),
                  pkg_qty: Number(budget.pkg_qty),
                  unit_cost_value: convertStringCurrency(budget.unit_cost_value),
                  unit_cost: `IDR_${convertStringCurrency(budget.unit_cost_value)}`,
                  vendor_category_id: vendorCategoryId || '',
                }
              },
            ),
          }
        }),
      }
    })

    const finalizeProgramBudgets = {
      revise_approval_doc: [],
      projects: submitValuesUpdateBudgetNeedsPerdiem,
    }

    await programApi.programControllerSetProgramBudget(
      slugIdentifier[0],
      finalizeProgramBudgets as unknown as any, // infer to any because i want to ignore vendor_category_information
    )

    const programPerdiemSetting = programApi.programControllerSetProgramPerdiemSettings(slugIdentifier[0], {
      base_value_normal,
      base_value_overseas,
      base_value_remote_area,
      activity_perdiem: 0,
      travel_perdiem: 0,
      note: formInput.note,
      travel_expense_percentages: {
        breakfast,
        lunch,
        dinner,
        non_overnight,
        travel_days,
      },
    })

    toast.promise(programPerdiemSetting, {
      pending: 'Saving project perdiem setting',
      success: 'Perdiem setting saved successfully',
      error: 'Perdiem setting save failed',
    })

    programPerdiemSetting.finally(() => {
      perdiemSettingTrigger()
      closePerdiemSettingDrawer()

      projectActivityDetailTrigger()
      budgetNeedsTrigger()
      vendorTypesTrigger()

      setLoadingButtonStatement((prev) => ({ ...prev, perdiemSetting: false }))
    })
  }

  const handle3CategoryPerdiem = useCallback(
    (
      value: PerdiemCategory | '',
      projectActivityIndex: number,
      activityIndex: number,
      budgetIndex: number,
      projectActivityId: string,
      activityId: string,
      budgetId: string,
    ) => {
      const key = `${projectActivityIndex}-${activityIndex}-${budgetIndex}`
      const isPerdiem = value && isPerdiemCategory(value)

      setPerdiemInputsDisabled((prev) => ({
        ...prev,
        [key]: {
          unitCost: isPerdiem,
          unit: isPerdiem,
          pkgUnit: isPerdiem,
        },
      }))

      if (isPerdiem) {
        handleInputChange(projectActivityId, activityId, budgetId, {
          target: { name: 'unit', value: PERDIEM_DEFAULT_UNITS.UNIT },
        } as ChangeEvent)
        handleInputChange(projectActivityId, activityId, budgetId, {
          target: { name: 'pkg_unit', value: PERDIEM_DEFAULT_UNITS.PKG_UNIT },
        } as ChangeEvent)
      }

      const baseValue = getPerdiemBaseValue(value, perdiemSettingData)
      if (baseValue > 0) {
        handleInputChange(projectActivityId, activityId, budgetId, {
          target: { name: 'unit_cost_value', value: baseValue },
        })
      }
    },
    [perdiemSettingData],
  )

  // Auto save
  const triggerAutoUpdate = useCallback(async () => {
    const costError = validateBudgetCosts(projectBudgets)
    if (costError) {
      toast.warning(costError, {
        autoClose: false,
        icon: <AlertTriangleIcon className="h-5 w-5 stroke-warning-500" />,
      })
      handleLoadingButton('budgetNeeds', false)
      return false
    }

    if (!budgetNeedsData) return

    const submitValues = prepareSubmitValues(projectBudgets)
    const adjustmentTotal = calculateTotalBudget(projectBudgets)
    const existingTotal = calculateTotalBudget(budgetNeedsData.projects as unknown as ProjectBudgetsImproved[])
    const benchmarkingTotal = programDetail.revise_amount

    const validationError = validateBudgetTotal(
      adjustmentTotal,
      existingTotal,
      benchmarkingTotal,
      programDetail.budget_revision_note !== null,
    )

    if (validationError) {
      toast.warning(validationError, {
        autoClose: false,
        icon: <AlertTriangleIcon className="h-5 w-5 stroke-warning-500" />,
      })
      handleLoadingButton('budgetNeeds', false)
      return false
    }

    const finalizeProgramBudgets = {
      revise_approval_doc: [],
      projects: submitValues,
    }

    const submitProjectBudget = programApi.programControllerSetProgramBudget(
      slugIdentifier[0],
      finalizeProgramBudgets as unknown as any,
    )

    toast.promise(submitProjectBudget, {
      success: 'Project budgets saved in auto save',
      error: 'Project budgets save failed',
    })
  }, [projectBudgets, budgetNeedsData, programDetail, handleLoadingButton, slugIdentifier])

  const submitBudgetNeeds: SubmitHandler<ProjectBudgetsImproved[]> = async () => {
    handleLoadingButton('budgetNeeds', true)

    const costError = validateBudgetCosts(projectBudgets)
    if (costError) {
      toast.warning(costError, {
        autoClose: 5000,
        icon: <AlertTriangleIcon className="h-5 w-5 stroke-warning-500" />,
      })
      handleLoadingButton('budgetNeeds', false)
      return false
    }

    const submitValues = prepareSubmitValues(projectBudgets)
    const adjustmentTotal = calculateTotalBudget(projectBudgets)
    const existingTotal = calculateTotalBudget(budgetNeedsData.projects as unknown as ProjectBudgetsImproved[])
    const benchmarkingTotal = programDetail.revise_amount

    const validationError = validateBudgetTotal(
      adjustmentTotal,
      existingTotal,
      benchmarkingTotal,
      programDetail.budget_revision_note !== null,
    )

    if (validationError) {
      toast.warning(validationError, {
        autoClose: 10000,
        icon: <AlertTriangleIcon className="h-5 w-5 stroke-warning-500" />,
      })
      handleLoadingButton('budgetNeeds', false)
      return false
    }

    const finalizeProgramBudgets = {
      revise_approval_doc: [],
      projects: submitValues,
    }

    const submitProjectBudget = programApi
      .programControllerSetProgramBudget(slugIdentifier[0], finalizeProgramBudgets as unknown as any)
      .then((res) => {
        if (res['code'] === 'ERR_BAD_REQUEST') throw new Error('Please try again, bad request')
        return res
      })

    toast.promise(submitProjectBudget, {
      pending: 'Updating project budgets',
      success: 'Project budgets updated',
      error: {
        render({ data }) {
          return `${data}`
        },
      },
    })

    submitProjectBudget.then(() => {
      handleLoadingButton('budgetNeeds', false)
    })
  }

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const parentDiv = e.target.closest('div')
    if (parentDiv) {
      if (e.target.checked) {
        parentDiv.classList.add('selected')
      } else {
        parentDiv.classList.remove('selected')
      }
    }
  }, [])

  const addNewBudgetEntry = useCallback(
    (project: ProjectBudgetsImproved, activity: ProjectActivityModified) => {
      const projectId = project.id
      const activityId = activity.id

      const budgetItem = {
        id: uuidv4(),
        ordering_seq: activity.budgets.length + 1,
        code: `${activity.code}.${activity.budgets.length < 9 ? '0' : ''}${activity.budgets.length + 1}`,
        description: '',
        vendor_category_information: {
          id: '',
          name: '',
          action_by: '',
          vendor_type: {
            id: '',
            name: '',
          },
        },
        vendor_category_id: '',
        type_controller: '',
        category_controller: [],
        qty: 0,
        unit: '',
        pkg_qty: 0,
        pkg_unit: '',
        unit_cost_value: 0,
        unit_cost: '',
        is_checked: false,
        recommended_vendor: '',
        additional_data: '',
        action_by: '',
        advance_payment_total: 0,
        tax_amount: 0,
        existing_item: false,
      }

      const resultprojectBudgets = projectBudgets.map((project: ProjectBudgetsImproved) => {
        if (project.id === projectId) {
          return {
            ...project,
            activities: project.activities.map((activity) => {
              if (activity.id === activityId) {
                return {
                  ...activity,
                  budgets: [...activity.budgets, budgetItem],
                }
              }
              return activity
            }),
          }
        }
        return project
      })

      setProjectBudgets(resultprojectBudgets)
    },
    [projectBudgets],
  )

  const handleInputChange = useCallback(
    (
      projectId: string,
      activityId: string,
      budgetId: string,
      event: ChangeEvent | { target: { name: string; value: string | number } },
    ) => {
      const { name, value } = event.target

      setProjectBudgets((prevBudgets) => {
        return prevBudgets.map((project) => {
          if (project.id === projectId) {
            if (activityId) {
              return {
                ...project,
                activities: project.activities.map((activity) => {
                  if (activity.id === activityId) {
                    if (budgetId) {
                      // Update budget
                      return {
                        ...activity,
                        budgets: activity.budgets.map((budget) => {
                          if (budget.id === budgetId) {
                            return { ...budget, [name]: value }
                          }
                          return budget
                        }),
                      }
                    }
                    // Update activity
                    return { ...activity, [name]: value }
                  }
                  return activity
                }),
              }
            }
            // Update project
            return { ...project, [name]: value }
          }
          return project
        })
      })
    },
    [],
  )

  const onDragEnd = useCallback(
    (result: DragResult) => {
      if (!result.destination) return

      const [projectId, activityId] = result.draggableId.split('_')
      const project = projectBudgets.find((item) => item.id === projectId)
      if (!project) return

      const choosenActivity = project.activities.find((activity) => activity.id === activityId)
      if (!choosenActivity) return

      const budgets = [...choosenActivity.budgets]
      const [movedItem] = budgets.splice(result.source.index, 1)
      budgets.splice(result.destination.index, 0, movedItem)

      const activitiesBudgetAdjustment = {
        ...choosenActivity,
        budgets,
      }

      const newtProjectWithBudgetsAdjustment = projectBudgets.map((project) => {
        return {
          ...project,
          activities: project.activities.map((activity) => {
            if (activity.id === activitiesBudgetAdjustment.id) {
              return activitiesBudgetAdjustment
            }
            return activity
          }),
        }
      })

      const cleanData: ProjectBudgetsImproved[] = Object.values(
        [...newtProjectWithBudgetsAdjustment].reduce((acc, cur) => Object.assign(acc, { [cur.id]: cur }), {}),
      )

      const reArrangeDraggableData = cleanData.map((item) => {
        return {
          ...item,
          activities: item.activities.map((activity) => {
            return {
              ...activity,
              budgets: activity.budgets?.map((budget, budgetIndex) => {
                const budgetIndexAccumulation = ++budgetIndex

                return {
                  ...budget,
                  ordering_seq: budgetIndexAccumulation,
                  code: `${activity.code}.${budgetIndexAccumulation < 9 ? '0' : ''}${budgetIndexAccumulation}`,
                }
              }),
            }
          }),
        }
      })

      setProjectBudgets(reArrangeDraggableData)
    },
    [projectBudgets],
  )

  const handleBudgetChecklist = useCallback(
    (projectId: string, activityId: string, budgetId: string) => {
      const updatedData = projectBudgets.map((project) => {
        if (project.id === projectId) {
          return {
            ...project,
            activities: project.activities.map((activity) => {
              if (activity.id === activityId) {
                return {
                  ...activity,
                  budgets: activity.budgets?.map((budget) => {
                    if (budget.id === budgetId) {
                      return {
                        ...budget,
                        is_checked: !budget.is_checked,
                      }
                    }
                    return budget
                  }),
                }
              }
              return activity
            }),
          }
        }
        return project
      })

      setProjectBudgets(updatedData)
    },
    [projectBudgets],
  )

  const deleteSelectedItems = useCallback(() => {
    const filteredNonChecked = projectBudgets.map((project) => {
      const newActivities = project.activities.map((activity) => {
        const newBudgets = activity.budgets.filter((budget) => budget.is_checked !== true)
        return {
          ...activity,
          budgets: newBudgets,
        }
      })

      return {
        ...project,
        activities: newActivities,
      }
    })

    const reArrangeDraggableData = filteredNonChecked.map((item) => {
      return {
        ...item,
        activities: item.activities.map((activity) => {
          return {
            ...activity,
            budgets: activity.budgets?.map((budget, budgetIndex) => {
              const budgetIndexAccumulation = ++budgetIndex

              return {
                ...budget,
                ordering_seq: budgetIndexAccumulation,
                code: `${activity.code}.${budgetIndexAccumulation < 9 ? '0' : ''}${budgetIndexAccumulation}`,
              }
            }),
          }
        }),
      }
    })

    setProjectBudgets(reArrangeDraggableData)
  }, [projectBudgets])

  const handleTypeChange = useCallback(
    async (choosenTypeId: string, choosenType: string, projectId: string, activityId: string, budgetId: string) => {
      const categoriesRes = await getCategories(choosenTypeId)

      setProjectBudgets((prevProjects) =>
        prevProjects?.map((innerProject: ProjectBudgetsImproved) => {
          if (innerProject.id === projectId) {
            return {
              ...innerProject,
              activities: innerProject.activities.map((innerActivity) => {
                if (innerActivity.id === activityId) {
                  return {
                    ...innerActivity,
                    budgets: innerActivity.budgets.map((innerBudget) => {
                      if (innerBudget.id === budgetId) {
                        return {
                          ...innerBudget,
                          type_controller: choosenType,
                          // vendor_category_id: choosenTypeId,
                          category_controller: categoriesRes.map((category) => ({
                            id: category.id,
                            name: category.name,
                          })),
                        }
                      }
                      return innerBudget
                    }),
                  }
                }
                return innerActivity
              }),
            }
          }
          return innerProject
        }),
      )
    },
    [],
  )

  const preprocessTotalData = useCallback(
    async (projects: ProjectBudgetsImproved[]) => {
      if (projects == undefined) return

      const dispatchers = []
      for (const project of projects) {
        for (const activity of project.activities) {
          for (const budget of activity.budgets) {
            const dispatcher = new Promise(async (resolve) => {
              const remaining = await RequisitionFormRemainingBudget.getRemainingBudget(budget.id)

              budget.remaining = remaining || 0

              const pendingRequested = await RequisitionFormRemainingBudget.getPendingRequested(
                budget.id,
                budget.description,
              )
              budget.pending_requested = pendingRequested || 0

              const paidTotal = await RequisitionFormRemainingBudget.getPaidBudget(budget.id, budget.description)
              budget.paid_total = paidTotal || 0
              resolve(budget)
            })
            dispatchers.push(dispatcher)
          }
        }
      }

      const awaiter = await Promise.all(dispatchers)

      if (programDetail.budget_revision_note !== null) {
        if (awaiter.length > 0) {
          projects.map((project) => {
            project.activities.map((activity) => {
              activity.budgets.map((budget) => {
                handleTypeChange(
                  budget.vendor_category_information.vendor_type.id,
                  budget.vendor_category_information.vendor_type.name,
                  project.id,
                  activity.id,
                  budget.id,
                )
              })
            })
          })

          setProjectBudgets(projects)
          setRenderFormShadow(true)
        }
      } else {
        projects.map((project) => {
          project.activities.map((activity) => {
            activity.budgets.map((budget) => {
              handleTypeChange(
                budget.vendor_category_information.vendor_type.id,
                budget.vendor_category_information.vendor_type.name,
                project.id,
                activity.id,
                budget.id,
              )
            })
          })
        })

        setProjectBudgets(projects)
        setRenderFormShadow(true)
      }
    },
    [handleTypeChange, programDetail.budget_revision_note],
  )

  useEffect(() => {
    const initialProjectBudgets = projectActivityDetailData?.map((project, projectIndex) => ({
      ...project,
      activities: project.activities.map((activity, activityIndex) => ({
        ...activity,
        budgets: budgetNeedsData
          ? budgetNeedsData.projects[projectIndex].activities[activityIndex]?.budgets?.map((budget) => {
              if (programDetail.budget_revision_note !== null) {
                return {
                  ...budget,
                  is_checked: false,
                  existing_item: true,
                  type_controller: '',
                  vendor_category_id: budget.vendor_category_information.name?.toLowerCase(),
                  category_controller: [],
                }
              }
              return {
                ...budget,
                is_checked: false,
                existing_item: false,
                type_controller: '',
                vendor_category_id: budget.vendor_category_information.name?.toLowerCase(),
                category_controller: [],
              }
            })
          : [],
      })),
    }))

    preprocessTotalData(initialProjectBudgets)
  }, [projectActivityDetailData, budgetNeedsData, programDetail.budget_revision_note])

  useEffect(() => {
    if (renderFormShadow) {
      setTimeout(() => {
        setRenderForm(true)
      }, 2000)
    }
  }, [renderFormShadow])

  useEffect(() => {
    if (!projectBudgets || projectBudgets.length === 0) return

    const newDisabledState: Record<string, { unitCost: boolean; unit: boolean; pkgUnit: boolean }> = {}

    projectBudgets.forEach((project, projectIndex) => {
      project.activities?.forEach((activity, activityIndex) => {
        activity.budgets?.forEach((budget, budgetIndex) => {
          const key = `${projectIndex}-${activityIndex}-${budgetIndex}`
          const isPerdiem = isPerdiemCategory(budget.vendor_category_id || '')

          newDisabledState[key] = {
            unitCost: isPerdiem,
            unit: isPerdiem,
            pkgUnit: isPerdiem,
          }
        })
      })
    })

    setPerdiemInputsDisabled(newDisabledState)
  }, [projectBudgets])

  useEffect(() => {
    const tableContainers = document.querySelectorAll('.table-container')

    tableContainers.forEach((container) => {
      const topScrollbar = container.querySelector('.top-scrollbar')
      const tableWrapper = container.querySelector('.table-wrapper')

      if (!topScrollbar && !tableWrapper) return

      // Create a dummy div to simulate scrollbar content
      const timeoutTopBar = setTimeout(() => {
        const scrollbarContent = document.createElement('div')
        scrollbarContent.style.width = `${tableWrapper.scrollWidth}px`
        scrollbarContent.style.height = '1px'
        topScrollbar.appendChild(scrollbarContent)
      }, 100)

      // Synchronize scroll positions
      const handleTopScroll = () => {
        tableWrapper.scrollLeft = topScrollbar.scrollLeft
      }
      const handleTableScroll = () => {
        topScrollbar.scrollLeft = tableWrapper.scrollLeft
      }

      topScrollbar.addEventListener('scroll', handleTopScroll)
      tableWrapper.addEventListener('scroll', handleTableScroll)

      // Cleanup event listeners on unmount
      return () => {
        topScrollbar.removeEventListener('scroll', handleTopScroll)
        tableWrapper.removeEventListener('scroll', handleTableScroll)
        clearTimeout(timeoutTopBar)
      }
    })
  }, [projectBudgets])

  useEffect(() => {
    projectActivityDetailTrigger()
    budgetNeedsTrigger()
    vendorTypesTrigger()
    perdiemSettingTrigger()
  }, [])

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
    const updateRemainingTime = () => {
      const now = dayjs()
      const secondsLeft = Math.max(endTime.diff(now, 'second'), 0) // Ensure non-negative
      setTimeLeft(secondsLeft)

      if (secondsLeft === 0) {
        handleCountdownEnd()
      }
    }

    // Call updateRemainingTime every second
    const timer = setInterval(updateRemainingTime, 10000)

    // Call immediately in case of a delay in setInterval
    updateRemainingTime()

    return () => clearInterval(timer)
  }, [endTime, budgetNeedsData, projectBudgets])

  const handleCountdownEnd = () => {
    triggerAutoUpdate()

    // Restart the countdown
    const newEndTime = dayjs().add(countdownDuration, 'second')
    setEndTime(newEndTime)
    setTimeLeft(countdownDuration)
  }

  useEffect(() => {
    if (!budgetNeedsData) return
    if (!projectBudgets) return

    let existingTotal = 0
    let adjustmentTotal = 0
    const benchmarkingTotal = programDetail.revise_amount

    budgetNeedsData.projects.forEach((project) => {
      project.activities.forEach((activity) => {
        activity.budgets.forEach((budget) => {
          existingTotal += budget.qty * budget.pkg_qty * budget.unit_cost_value
        })
      })
    })

    projectBudgets.map((project) => {
      project.activities.map((activity) => {
        activity.budgets.map((budget) => {
          adjustmentTotal += budget.qty * budget.pkg_qty * budget.unit_cost_value
        })
      })
    })

    if (benchmarkingTotal === 0) {
      setTotalTargetBudgetNeeds(existingTotal)
    } else {
      setTotalTargetBudgetNeeds(benchmarkingTotal)
    }

    setTotalAdjustableBudgetNeeds(adjustmentTotal)
  }, [budgetNeedsData, programDetail, projectBudgets])

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const confirmationMessage = 'Are you sure you want to leave this page?'
      event.preventDefault()
      event.returnValue = confirmationMessage
      return confirmationMessage
    }

    const handleRouteChange = () => {
      if (!window.confirm('Are you sure you want to leave this page?')) {
        router.events.emit('routeChangeError')
        throw new Error('Route Change Cancelled')
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    router.events?.on('routeChangeStart', handleRouteChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      router.events?.off('routeChangeStart', handleRouteChange)
    }
  }, [router])

  if (!budgetNeedsData || !projectActivityDetailData || !vendorTypesData || perdiemSettingIsMutating) {
    return <></>
  }

  if (programDetail.budget_revision_note !== null && projectBudgets?.length === 0) {
    return <></>
  }

  if (!renderForm) {
    return (
      <div className="flex h-[calc(100vh-4.8rem)] w-full items-center justify-center">
        <Loader customText="Loading budget needs form..." />
      </div>
    )
  }

  return (
    <>
      <div className="mb-5 grid grid-cols-4 border-b border-b-gray-200 pb-3">
        {programDetail.budget_revision_note !== null ? (
          <div>
            <p className="mb-2 text-xs font-bold text-gray-500">Total Budget Needs (Target)</p>
            <div className="inline-flex items-center gap-2">
              <p className="text-xl font-semibold text-gray-900">{formatCurrency('IDR', totalTargetBudgetNeeds)}</p>
            </div>
          </div>
        ) : null}
        <div>
          <p className="mb-2 text-xs font-bold text-gray-500">Total Budget Need (as Edited)</p>
          <div className="inline-flex items-center gap-2">
            <p className="text-xl font-semibold text-gray-900">{formatCurrency('IDR', totalAdjustableBudgetNeeds)}</p>
          </div>
        </div>
        <div
          className={cn(
            'flex items-center justify-end',
            programDetail.budget_revision_note !== null ? 'col-span-2' : 'col-span-3',
          )}
        >
          <div>
            <p className="mb-2 text-right text-xs font-bold text-gray-500">Auto save in</p>
            <p className="text-2xl font-bold">{formatTimeLeft(timeLeft)}</p>
          </div>
        </div>
      </div>
      {perdiemSettingData === undefined ? (
        <div className="mb-5 flex items-center gap-4 rounded-xl border-2 border-gray-200 bg-gray-50 px-6 py-[1.4rem]">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-[6px] border-primary-50 bg-primary-100">
            <AlertTriangleIcon className="h-6 w-6 stroke-primary-600" />
          </div>
          <div>
            <h6 className="mb-1 font-semibold text-gray-900">
              Remember to Setup the Perdiem first before add the Perdiem Category
            </h6>
            <p className="text-sm text-gray-600">
              This project hasn’t setup the Perdiem Setting. Please setup it first.
            </p>
          </div>
          <div className="ml-auto">
            <ProgramRoleAccessControlProvider
              programId={slugIdentifier[0]}
              task={programTasks.ADD_BUDGET_NEED}
              action={accessActionType.CREATE}
              replaceWith={
                <Button type="button" btnType="normal" size="md" variant="secondary-gray" disabled>
                  Perdiem Setting
                </Button>
              }
            >
              <Button
                type="button"
                btnType="normal"
                size="md"
                variant="secondary-gray"
                onClick={openPerdiemSettingDrawer}
              >
                Perdiem Setting
              </Button>
            </ProgramRoleAccessControlProvider>
          </div>
        </div>
      ) : (
        <div className="mb-5 flex items-center gap-4 rounded-xl border-2 border-gray-200 bg-gray-50 px-6 py-[22px]">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-[6px] border-primary-50 bg-primary-100">
            <ThumbsUpIcon className="h-6 w-6 stroke-primary-600" />
          </div>
          <div>
            <h6 className="mb-1 font-semibold text-gray-900">You are good to go! The perdiem already set-up.</h6>
            <p className="text-sm text-gray-600">You can check and edit the perdiem before submit the budget need.</p>
          </div>
          <div className="ml-auto">
            <ProgramRoleAccessControlProvider
              programId={slugIdentifier[0]}
              task={programTasks.ADD_BUDGET_NEED}
              action={accessActionType.CREATE}
              replaceWith={
                <Button type="button" btnType="normal" size="md" variant="secondary-gray" disabled>
                  Perdiem Setting
                </Button>
              }
            >
              <Button
                type="button"
                btnType="normal"
                size="md"
                variant="secondary-gray"
                onClick={openPerdiemSettingDrawer}
              >
                Perdiem Setting
              </Button>
            </ProgramRoleAccessControlProvider>
          </div>
        </div>
      )}
      <form
        onSubmit={handleSubmit(submitBudgetNeeds)}
        className={cn('flex flex-col gap-9', perdiemSettingData === undefined ? 'overlay-blur' : '')}
      >
        {projectBudgets?.map((projectActivity, projectActivityIndex) => (
          <div key={projectActivity.id}>
            <div className="flex items-center justify-between border-b border-b-gray-200 py-3">
              <div className="flex flex-col gap-1">
                <span className="inline-block text-xs font-bold text-gray-500">Activity ({projectActivity.code})</span>
                <p className="text-xl font-semibold capitalize text-gray-900">{projectActivity.description}</p>
              </div>
              <div className="inline-flex items-center gap-6">
                <p>Total</p>
                <div className="w-56">
                  <p className="text-end text-2xl font-extrabold text-gray-600">
                    {formatCurrency('IDR', calculateUnitCostPerProject(projectActivity))}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6 border-l-4 border-l-primary-300 pb-3 pl-10 pt-4">
              <Accordion
                type="multiple"
                className="flex w-full flex-col"
                defaultValue={[...projectActivity.activities.map((activity) => activity.id)]}
              >
                {projectActivity.activities.map((activity, activityIndex) => (
                  <AccordionItem key={activity.id} value={activity.id} className="border-b border-b-gray-200 py-0">
                    <div className="flex w-full items-center gap-4 py-6">
                      <span className="rounded bg-gray-100 px-8 py-0.5 font-semibold leading-6 text-gray-900">
                        {activity.code}
                      </span>
                      <div className="flex grow flex-wrap">
                        <p className="text-left font-semibold text-gray-900">{activity.description}</p>
                      </div>
                      <div
                        className={cn(
                          'inline-flex w-60 items-center justify-between gap-3 pl-3 pr-6',
                          programDetail.currency !== 'IDR' ? '' : '',
                        )}
                      >
                        <p className="font-extrabold text-gray-600">Rp</p>
                        <div className="w-40 text-right">
                          <p className="font-extrabold text-gray-600">
                            {formatCurrency(
                              programDetail.currency.toUpperCase() as unknown as CurrencyUnion,
                              calculateUnitCostPerActivity(activity),
                              true,
                            )}
                          </p>
                        </div>
                      </div>
                      <AccordionTrigger>
                        <Button btnType="div" size="sm" variant="secondary-gray" btnFormat="square">
                          <div className="transition-transform duration-200 group-data-[state=open]:rotate-180">
                            <ChevronDownIcon className="h-5 w-5 stroke-gray-700" />
                          </div>
                        </Button>
                      </AccordionTrigger>
                    </div>
                    <AccordionContent>
                      <>
                        <div className="table-container">
                          <div className="top-scrollbar h-3 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-track-gray-50 scrollbar-thumb-gray-300/50"></div>
                          <div className="table-wrapper overflow-x-auto py-0 scrollbar-thin scrollbar-track-gray-50 scrollbar-thumb-gray-300/50">
                            {activity?.budgets?.length > 0 && (
                              <div className="table-selection w-full min-w-fit table-fixed">
                                <div className="border-y border-y-gray-200 bg-gray-50">
                                  <div className="flex">
                                    <div className="w-14 px-2 py-3"></div>
                                    <div className="w-36 px-2 py-3 text-left text-xs font-medium text-gray-600">No</div>
                                    <div className="w-72 px-2 py-3 text-left text-xs font-medium text-gray-600">
                                      Description
                                    </div>
                                    <div className="w-60 px-2 py-3 text-left text-xs font-medium text-gray-600">
                                      Type
                                    </div>
                                    <div className="w-60 px-2 py-3 text-left text-xs font-medium text-gray-600">
                                      Category
                                    </div>
                                    <div className="w-24 px-2 py-3 text-left text-xs font-medium text-gray-600">
                                      Qty
                                    </div>
                                    <div className="w-28 px-2 py-3 text-left text-xs font-medium text-gray-600">
                                      Unit
                                    </div>
                                    <div className="w-24 px-2 py-3 text-left text-xs font-medium text-gray-600">
                                      Pckg Qty
                                    </div>
                                    <div className="w-28 px-2 py-3 text-left text-xs font-medium text-gray-600">
                                      Pckg Unit
                                    </div>
                                    <div className="w-52 px-2 py-3 text-left text-xs font-medium text-gray-600">
                                      Unit Cost
                                    </div>
                                    <div className="w-52 px-2 py-3 text-left text-xs font-medium text-gray-600">
                                      Total Cost
                                    </div>
                                    <div className="w-52 px-2 py-3 text-left text-xs font-medium text-gray-600">
                                      Remaining Budget
                                    </div>
                                    <div className="w-52 px-2 py-3 text-left text-xs font-medium text-gray-600">
                                      Pending Requested
                                    </div>
                                    <div className="w-52 px-2 py-3 text-left text-xs font-medium text-gray-600">
                                      Total Payment
                                    </div>
                                  </div>
                                </div>
                                <DragDropContext onDragEnd={onDragEnd}>
                                  <StrictModeDroppable key={activity.id} droppableId={`activity_${activity.id}`}>
                                    {(provided: DndProvided, snapshot: DndSnapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={cn(
                                          'divide-y divide-gray-200',
                                          snapshot.isDraggingOver ? 'bg-primary-50' : 'bg-white',
                                        )}
                                      >
                                        {activity.budgets?.map((budget, budgetIndex) => (
                                          <Draggable
                                            draggableId={`${projectActivity.id}_${activity.id}_${budget.id}`}
                                            index={budgetIndex}
                                            key={`${projectActivity.id}_${activity.id}_${budget.id}`}
                                          >
                                            {(provided: DndProvided, snapshot: DndSnapshot) => (
                                              <div
                                                {...provided.draggableProps}
                                                ref={provided.innerRef}
                                                className={cn(
                                                  'row-selection flex',
                                                  budget.is_checked && 'selected',
                                                  snapshot.isDragging ? 'bg-gray-200' : 'bg-white',
                                                )}
                                              >
                                                <div className="relative w-14">
                                                  {budget?.existing_item ? (
                                                    <span className="absolute inset-0 z-50 bg-white"></span>
                                                  ) : null}
                                                  <div
                                                    {...provided.dragHandleProps}
                                                    className={cn(
                                                      'flex h-full items-center justify-center',
                                                      budget?.existing_item ? 'opacity-0' : '',
                                                    )}
                                                  >
                                                    <ParagraphSpacingIcon className="h-5 w-5 stroke-gray-600" />
                                                  </div>
                                                </div>
                                                <div className="w-36 px-2 py-2.5 text-center">
                                                  <div className="inline-flex items-center gap-2">
                                                    <div className="relative">
                                                      {budget?.existing_item ? (
                                                        <span className="absolute inset-0 z-50 bg-white"></span>
                                                      ) : null}
                                                      <input
                                                        type="checkbox"
                                                        id={`${budget.code}`}
                                                        checked={budget?.is_checked}
                                                        className={cn(
                                                          'input-checkbox',
                                                          budget?.existing_item ? 'opacity-0' : '',
                                                        )}
                                                        onChange={(e) => {
                                                          handleChange(e)
                                                          handleBudgetChecklist(
                                                            projectActivity.id,
                                                            activity.id,
                                                            budget.id,
                                                          )
                                                        }}
                                                      />
                                                    </div>
                                                    <div>
                                                      <input
                                                        type="text"
                                                        value={`${activity.code}.${budgetIndex < 9 ? 0 : ''}${
                                                          budgetIndex + 1
                                                        }`}
                                                        className="form-input w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-xs placeholder:text-gray-500 focus:border-primary-300 focus:ring-4 focus:ring-primary-100 disabled:border-gray-300 disabled:bg-gray-50 disabled:text-gray-500"
                                                        disabled
                                                        readOnly
                                                      />
                                                    </div>
                                                  </div>
                                                </div>
                                                <div className="w-72 px-2 py-2.5">
                                                  <TextareaAutosize
                                                    data-testid={`budget-description-${projectActivityIndex}-${activityIndex}-${budgetIndex}`}
                                                    name="description"
                                                    onChange={(e) =>
                                                      handleInputChange(projectActivity.id, activity.id, budget.id, e)
                                                    }
                                                    value={budget.description || ''}
                                                    placeholder="↳ Needs Description"
                                                    className="form-textarea w-full resize-none rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 shadow-xs placeholder:text-gray-500 focus:border-primary-300 focus:ring-4 focus:ring-primary-100 disabled:border-gray-300 disabled:bg-gray-50"
                                                  />
                                                </div>
                                                {/* Type */}
                                                <div className="w-60 px-2 py-2.5">
                                                  <ComboboxRadix
                                                    id={`budget-type-${projectActivityIndex}-${activityIndex}-${budgetIndex}`}
                                                    widthControllerStyles="w-56"
                                                    placeholder="Type"
                                                    value={budget.type_controller?.toLowerCase() || ''}
                                                    listData={vendorTypesData?.map((type) => ({
                                                      id: type.id,
                                                      name: capitalizeOfString(type.name),
                                                    }))}
                                                    handleChange={(choosenType) => {
                                                      if (choosenType) {
                                                        handleTypeChange(
                                                          vendorTypesData.find(
                                                            (type) =>
                                                              type.name.toLowerCase() === choosenType.toLowerCase(),
                                                          )?.id,
                                                          choosenType,
                                                          projectActivity.id,
                                                          activity.id,
                                                          budget.id,
                                                        )

                                                        handle3CategoryPerdiem(
                                                          '',
                                                          projectActivityIndex,
                                                          activityIndex,
                                                          budgetIndex,
                                                          projectActivity.id,
                                                          activity.id,
                                                          budget.id,
                                                        )
                                                      }
                                                    }}
                                                  />
                                                </div>
                                                {/* Category */}
                                                <div className="w-60 px-2 py-2.5">
                                                  <ComboboxRadix
                                                    id={`budget-category-${projectActivityIndex}-${activityIndex}-${budgetIndex}`}
                                                    widthControllerStyles="w-56"
                                                    placeholder="Category"
                                                    value={
                                                      budget.vendor_category_id ||
                                                      budget.vendor_category_information.name?.toLowerCase() ||
                                                      ''
                                                    }
                                                    listData={budget.category_controller || []}
                                                    emptyMessage="Choose type first"
                                                    handleChange={(category) => {
                                                      if (category) {
                                                        handleInputChange(projectActivity.id, activity.id, budget.id, {
                                                          target: {
                                                            name: 'vendor_category_id',
                                                            value: category,
                                                          },
                                                        })
                                                        handle3CategoryPerdiem(
                                                          category,
                                                          projectActivityIndex,
                                                          activityIndex,
                                                          budgetIndex,
                                                          projectActivity.id,
                                                          activity.id,
                                                          budget.id,
                                                        )
                                                      }
                                                    }}
                                                  />
                                                </div>
                                                <div className="w-24 px-2 py-2.5">
                                                  <Input
                                                    id={`budget-qty-${projectActivityIndex}-${activityIndex}-${budgetIndex}`}
                                                    name="qty"
                                                    type="number"
                                                    value={budget.qty || ''}
                                                    placeholder="Qty"
                                                    onChange={(e) =>
                                                      handleInputChange(projectActivity.id, activity.id, budget.id, e)
                                                    }
                                                    size="sm"
                                                  />
                                                </div>
                                                <div className="w-28 px-2 py-2.5">
                                                  <TextareaAutosize
                                                    id={`budget-unit-${projectActivityIndex}-${activityIndex}-${budgetIndex}`}
                                                    data-testid={`budget-unit-${projectActivityIndex}-${activityIndex}-${budgetIndex}`}
                                                    name="unit"
                                                    onChange={(e) =>
                                                      handleInputChange(projectActivity.id, activity.id, budget.id, e)
                                                    }
                                                    value={budget.unit || ''}
                                                    placeholder="Unit"
                                                    disabled={
                                                      perdiemInputsDisabled[
                                                        `${projectActivityIndex}-${activityIndex}-${budgetIndex}`
                                                      ]?.unit
                                                    }
                                                    className="form-textarea w-full resize-none rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 shadow-xs placeholder:text-gray-500 focus:border-primary-300 focus:ring-4 focus:ring-primary-100 disabled:border-gray-300 disabled:bg-gray-50"
                                                  />
                                                </div>
                                                <div className="w-24 px-2 py-2.5">
                                                  <Input
                                                    type="number"
                                                    id={`budget-pkg_qty-${projectActivityIndex}-${activityIndex}-${budgetIndex}`}
                                                    name="pkg_qty"
                                                    onChange={(e) =>
                                                      handleInputChange(projectActivity.id, activity.id, budget.id, e)
                                                    }
                                                    value={budget.pkg_qty || ''}
                                                    placeholder="Qty"
                                                    size="sm"
                                                  />
                                                </div>
                                                <div className="w-28 px-2 py-2.5">
                                                  <TextareaAutosize
                                                    id={`budget-pkg_unit-${projectActivityIndex}-${activityIndex}-${budgetIndex}`}
                                                    data-testid={`budget-pkg_unit-${projectActivityIndex}-${activityIndex}-${budgetIndex}`}
                                                    name="pkg_unit"
                                                    onChange={(e) =>
                                                      handleInputChange(projectActivity.id, activity.id, budget.id, e)
                                                    }
                                                    value={budget.pkg_unit || ''}
                                                    placeholder="Unit"
                                                    disabled={
                                                      perdiemInputsDisabled[
                                                        `${projectActivityIndex}-${activityIndex}-${budgetIndex}`
                                                      ]?.pkgUnit
                                                    }
                                                    className="form-textarea w-full resize-none rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 shadow-xs placeholder:text-gray-500 focus:border-primary-300 focus:ring-4 focus:ring-primary-100 disabled:border-gray-300 disabled:bg-gray-50"
                                                  />
                                                </div>
                                                <div className="w-52 px-2 py-2.5">
                                                  <div className="flex items-center gap-3">
                                                    <p className="text-gray-500">Rp</p>
                                                    <div>
                                                      <Input
                                                        type="number"
                                                        id={`budget-unit_cost_value-${projectActivityIndex}-${activityIndex}-${budgetIndex}`}
                                                        align="end"
                                                        placeholder="0"
                                                        value={budget.unit_cost_value || ''}
                                                        name="unit_cost_value"
                                                        isCurrency={true}
                                                        inputSelectionInit="IDR"
                                                        disabled={
                                                          perdiemInputsDisabled[
                                                            `${projectActivityIndex}-${activityIndex}-${budgetIndex}`
                                                          ]?.unitCost
                                                        }
                                                        onChange={(e) =>
                                                          handleInputChange(
                                                            projectActivity.id,
                                                            activity.id,
                                                            budget.id,
                                                            {
                                                              target: {
                                                                name: 'unit_cost_value',
                                                                value: e,
                                                              },
                                                            },
                                                          )
                                                        }
                                                      />
                                                    </div>
                                                  </div>
                                                </div>
                                                <div className="w-52 px-2 py-2.5">
                                                  <div className="flex items-center gap-3">
                                                    <p className="text-gray-500">Rp</p>
                                                    <div>
                                                      <Input
                                                        type="text"
                                                        align="end"
                                                        id={`budget-total_cost-${projectActivityIndex}-${activityIndex}-${budgetIndex}`}
                                                        placeholder="0"
                                                        value={formatCurrency(
                                                          'IDR',
                                                          Number(budget.qty) *
                                                            Number(budget.pkg_qty) *
                                                            Number(budget.unit_cost_value),
                                                          true,
                                                        )}
                                                        disabled
                                                      />
                                                    </div>
                                                  </div>
                                                </div>
                                                <div className="w-52 px-2 py-2.5">
                                                  <div className="flex items-center gap-3">
                                                    <p className="text-gray-500">Rp</p>
                                                    <div>
                                                      <Input
                                                        type="text"
                                                        align="end"
                                                        id={`budget-remaining-${projectActivityIndex}-${activityIndex}-${budgetIndex}`}
                                                        placeholder="0"
                                                        value={formatCurrency('IDR', budget.remaining || 0, true)}
                                                        disabled
                                                      />
                                                    </div>
                                                  </div>
                                                </div>
                                                <div className="w-52 px-2 py-2.5">
                                                  <div className="flex items-center gap-3">
                                                    <p className="text-gray-500">Rp</p>
                                                    <div>
                                                      <Input
                                                        type="text"
                                                        align="end"
                                                        id={`budget-pending_requested-${projectActivityIndex}-${activityIndex}-${budgetIndex}`}
                                                        placeholder="0"
                                                        value={formatCurrency(
                                                          'IDR',
                                                          budget.pending_requested || 0,
                                                          true,
                                                        )}
                                                        disabled
                                                      />
                                                    </div>
                                                  </div>
                                                </div>
                                                <div className="w-52 px-2 py-2.5">
                                                  <div className="flex items-center gap-3">
                                                    <p className="text-gray-500">Rp</p>
                                                    <div>
                                                      <Input
                                                        type="text"
                                                        align="end"
                                                        id={`budget-paid_total-${projectActivityIndex}-${activityIndex}-${budgetIndex}`}
                                                        placeholder="0"
                                                        value={formatCurrency('IDR', budget.paid_total || 0, true)}
                                                        disabled
                                                      />
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            )}
                                          </Draggable>
                                        ))}
                                        {provided.placeholder}
                                      </div>
                                    )}
                                  </StrictModeDroppable>
                                </DragDropContext>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="border-t border-t-gray-200 px-6 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="inline-flex items-center gap-3">
                              <Button
                                id={`add-need-entry-${projectActivityIndex}-${activityIndex}`}
                                type="button"
                                btnType="normal"
                                size="md"
                                variant="secondary-gray"
                                onClick={() => addNewBudgetEntry(projectActivity, activity)}
                              >
                                <PlusIcon className="h-5 w-5 stroke-gray-700" />
                                Add Need Entry
                              </Button>
                              <Button
                                id={`delete-selected-${projectActivityIndex}-${activityIndex}`}
                                type="button"
                                btnType="normal"
                                size="md"
                                variant="secondary-gray"
                                onClick={deleteSelectedItems}
                              >
                                <Trash01Icon className="h-5 w-5 stroke-gray-700" />
                                Delete Selected
                              </Button>
                            </div>
                          </div>
                        </div>
                      </>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        ))}
        <button type="submit" className="hidden" ref={submitRef}></button>
      </form>
      <form onSubmit={handleSubmitPerdiemSetting(submitPerdimeSetting)}>
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
            <>
              <Button
                type="submit"
                btnType="normal"
                variant="primary"
                size="md"
                isLoading={loadingButtonStatement.perdiemSetting}
              >
                Save
              </Button>
            </>,
          ]}
        >
          <div className="flex flex-col gap-6">
            <div>
              <label className="input-label">Perdiem Base Value</label>
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
                  control={control}
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
                  control={control}
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
                  control={control}
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
              <label htmlFor="base_value" className="input-label !mb-1">
                Percentage Calculation
              </label>
              <p className="text-xs text-gray-700">This setup relate to Travel Expenses</p>
            </div>
            <div>
              <Controller
                control={control}
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
              {errors?.travel_expense_percentages?.breakfast && (
                <span className="input-hint-text error !-mt-1 ml-2">
                  {errors.travel_expense_percentages.breakfast?.message}
                </span>
              )}
            </div>
            <div>
              <Controller
                control={control}
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
              {errors?.travel_expense_percentages?.lunch && (
                <span className="input-hint-text error !-mt-1 ml-2">
                  {errors.travel_expense_percentages.lunch?.message}
                </span>
              )}
            </div>
            <div>
              <Controller
                control={control}
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
              {errors?.travel_expense_percentages?.dinner && (
                <span className="input-hint-text error !-mt-1 ml-2">
                  {errors.travel_expense_percentages.dinner?.message}
                </span>
              )}
            </div>
            <div>
              <Controller
                control={control}
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
              {errors?.travel_expense_percentages?.non_overnight && (
                <span className="input-hint-text error !-mt-1 ml-2">
                  {errors.travel_expense_percentages?.non_overnight?.message}
                </span>
              )}
            </div>
            <div>
              <Controller
                control={control}
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
              {errors?.travel_expense_percentages?.travel_days && (
                <span className="input-hint-text error !-mt-1 ml-2">
                  {errors.travel_expense_percentages?.travel_days?.message}
                </span>
              )}
            </div>
            <div className="h-px w-full bg-gray-200"></div>
            <div>
              <label htmlFor="note" className="input-label">
                Notes (Optional)
              </label>
              <textarea
                {...register('note')}
                id="note"
                className="textarea-input resize-none"
                rows={5}
                placeholder="Write notes about this perdiem setting"
              ></textarea>
            </div>
          </div>
        </Drawer>
      </form>
    </>
  )
}
