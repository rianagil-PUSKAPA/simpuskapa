import { useReducer } from 'react'

type LoadingKey = 'submitBudgetNeeds' | 'approvalBudget' | 'declineBudget'

type LoadingState = Record<LoadingKey, boolean>

type LoadingAction = { type: 'SET_LOADING'; key: LoadingKey; value: boolean } | { type: 'RESET_ALL' }

const initialState: LoadingState = {
  submitBudgetNeeds: false,
  approvalBudget: false,
  declineBudget: false,
}

/**
 * Reducer function to manage loading states
 */
const loadingReducer = (state: LoadingState, action: LoadingAction): LoadingState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        [action.key]: action.value,
      }
    case 'RESET_ALL':
      return initialState
    default:
      return state
  }
}

type UseLoadingStateReturn = {
  loadingState: LoadingState
  setLoading: (key: LoadingKey, value: boolean) => void
  resetAll: () => void
}

/**
 * Custom hook to manage multiple loading states using useReducer
 * @returns Loading state object and helper functions
 */
export const useLoadingState = (): UseLoadingStateReturn => {
  const [loadingState, dispatch] = useReducer(loadingReducer, initialState)

  const setLoading = (key: LoadingKey, value: boolean) => {
    dispatch({ type: 'SET_LOADING', key, value })
  }

  const resetAll = () => {
    dispatch({ type: 'RESET_ALL' })
  }

  return {
    loadingState,
    setLoading,
    resetAll,
  }
}
