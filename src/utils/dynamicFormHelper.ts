export const splitKey = (key) => {
  const parts = key.split('.')
  return {
    parent: parts[0],
    child: parts[2],
    original: key,
  }
}

export const groupByParent = (keys) => {
  return keys.reduce((groups, key) => {
    const { parent } = splitKey(key)
    if (!groups[parent]) {
      groups[parent] = []
    }
    groups[parent].push(key)
    return groups
  }, {})
}

export const sortKeys = (groups) => {
  const sortedKeys = []
  const parents = Object.keys(groups).sort()
  parents.forEach((parent) => {
    const children = groups[parent]
    children.sort((a, b) => {
      const aChild = splitKey(a).child
      const bChild = splitKey(b).child
      return aChild - bChild
    })
    sortedKeys.push(...children)
  })
  return sortedKeys
}

export const createSortedObject = (TIMELINE, sortedKeys) => {
  return sortedKeys.reduce((newObj, key) => {
    newObj[key] = TIMELINE[key]
    return newObj
  }, {})
}

export const orderTimeline = (TIMELINE) => {
  const keys = Object.keys(TIMELINE)
  const grouped = groupByParent(keys)
  const sortedKeys = sortKeys(grouped)
  const sortedObj = createSortedObject(TIMELINE, sortedKeys)
  return sortedObj
}

export const transformRHFInputToSequence = (timeline, keyIdentifier) => {
  const sequence = {}
  let currentParentIndex = null
  let currentChildIndex = 0

  for (const key in timeline) {
    const parentIndex = key.split('.').map(Number)[0]
    let childIndex = key.split('.').map(Number)[1]

    if (parentIndex !== currentParentIndex) {
      currentParentIndex = parentIndex
      currentChildIndex = 0
    }

    let value = timeline[key]

    while (value === null || value === undefined) {
      childIndex++
      value = timeline[`${parentIndex}.activities.${childIndex}.${keyIdentifier}`]
    }

    const newKey = `${parentIndex}.activities.${currentChildIndex}.${keyIdentifier}`
    sequence[newKey] = value
    currentChildIndex++
  }

  return sequence
}

export const mergeDataOnPath = (target, path, value) => {
  const pathArray = path.split('.')
  let current = target

  for (let i = 0; i < pathArray.length; i++) {
    const key = pathArray[i]

    if (i === pathArray.length - 1) {
      current[key] = value
    } else {
      if (!current[key]) {
        // Create an empty object if it doesn't exist
        current[key] = {}
      }
      current = current[key]
    }
  }
}

export const checkSingleValueIsEmpty = (dataSubmit) => {
  const result = dataSubmit.projects.map((program) => {
    const { code, description, ordering_seq, activities } = program
    if (code && description && ordering_seq) {
      return activities.map((activity) => {
        const { ordering_seq, code, description, notes, timeline, proposed_milestone, due_date } = activity

        if (ordering_seq && code && description && notes && timeline && proposed_milestone && due_date) {
          return true
        } else {
          return false
        }
      })
    } else {
      return false
    }
  })

  const flatten = [].concat(...result)
  const hasFalse = flatten.some((element) => element === false)

  return hasFalse
}

export const checkBudgets = (budgetNeeds) => {
  const totalBudgets = budgetNeeds?.projects.reduce((total, project) => {
    const projectBudgets = project.activities.reduce((projectTotal, activity) => {
      return activity.budgets.length > 0 ? projectTotal + activity.budgets.length : projectTotal
    }, 0)
    return total + projectBudgets
  }, 0)
  return totalBudgets
}
