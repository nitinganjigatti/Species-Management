import { useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchFormOptions,
  selectMannerOfDeathOptions,
  selectDisposalOptions,
  selectWeightUnitOptions,
  selectFormOptionsLoading,
  selectFormOptionsLoaded,
  selectFormOptionsError,
  selectIsCacheStale
} from 'src/store/slices/necropsy/necropsyFormOptionsSlice'

/**
 * Custom hook for managing necropsy form dropdown options with caching
 * Options are fetched once and cached in Redux store for 5 minutes
 */
export const useNecropsyFormOptions = (autoFetch = true) => {
  const dispatch = useDispatch()

  // Selectors
  const mannerOfDeathOptions = useSelector(selectMannerOfDeathOptions)
  const disposalOptions = useSelector(selectDisposalOptions)
  const weightUnitOptions = useSelector(selectWeightUnitOptions)
  const loading = useSelector(selectFormOptionsLoading)
  const isLoaded = useSelector(selectFormOptionsLoaded)
  const error = useSelector(selectFormOptionsError)
  const isCacheStale = useSelector(selectIsCacheStale)

  // Fetch options
  const fetchOptions = useCallback(() => {
    dispatch(fetchFormOptions())
  }, [dispatch])

  // Auto-fetch on mount if enabled and cache is stale or not loaded
  useEffect(() => {
    if (autoFetch && (!isLoaded || isCacheStale)) {
      fetchOptions()
    }
  }, [autoFetch, isLoaded, isCacheStale, fetchOptions])

  // Find manner of death option by ID or name
  const findMannerOfDeathOption = useCallback(
    idOrName => {
      if (!idOrName) return null

      // Try to find by ID first
      let option = mannerOfDeathOptions.find(opt => String(opt.value) === String(idOrName))

      // Try by name/key
      if (!option) {
        option = mannerOfDeathOptions.find(
          opt =>
            opt.key === idOrName ||
            String(opt.key)?.toLowerCase() === String(idOrName)?.toLowerCase() ||
            opt.label?.toLowerCase() === String(idOrName)?.toLowerCase()
        )
      }

      return option
    },
    [mannerOfDeathOptions]
  )

  // Find disposal option by ID or name
  const findDisposalOption = useCallback(
    idOrName => {
      if (!idOrName) return null

      // Try to find by ID first
      let option = disposalOptions.find(opt => String(opt.value) === String(idOrName))

      // Try by name/key
      if (!option) {
        option = disposalOptions.find(
          opt =>
            opt.key === idOrName ||
            String(opt.key)?.toLowerCase() === String(idOrName)?.toLowerCase() ||
            opt.label?.toLowerCase() === String(idOrName)?.toLowerCase()
        )
      }

      return option
    },
    [disposalOptions]
  )

  // Find weight unit option by ID or abbreviation
  const findWeightUnitOption = useCallback(
    idOrAbbr => {
      if (!idOrAbbr) return null

      // Try to find by ID first
      if (!isNaN(Number(idOrAbbr))) {
        const option = weightUnitOptions.find(u => u.id === Number(idOrAbbr))
        if (option) return option
      }

      // Try by abbreviation
      const abbrLower = String(idOrAbbr).toLowerCase()

      let option = weightUnitOptions.find(u => u.value?.toLowerCase() === abbrLower)

      if (!option) {
        option = weightUnitOptions.find(
          u => abbrLower.includes(u.value?.toLowerCase()) || u.value?.toLowerCase()?.includes(abbrLower)
        )
      }

      return option
    },
    [weightUnitOptions]
  )

  return {
    // Options data
    mannerOfDeathOptions,
    disposalOptions,
    weightUnitOptions,

    // Loading state
    loading,
    isLoaded,
    error,

    // Actions
    fetchOptions,

    // Helpers
    findMannerOfDeathOption,
    findDisposalOption,
    findWeightUnitOption
  }
}

export default useNecropsyFormOptions
