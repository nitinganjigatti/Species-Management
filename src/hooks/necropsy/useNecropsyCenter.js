import { useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchNecropsieCenters,
  setSelectedCenter,
  loadSelectedCenterFromStorage,
  clearNecropsyData,
  selectSelectedCenter,
  selectCenters,
  selectCentersLoading
} from 'src/store/slices/necropsy/necropsySlice'

/**
 * Custom hook for managing necropsy center selection with Redux
 * Handles persistence to localStorage and initial load
 */
export const useNecropsyCenter = (userId, autoFetch = true) => {
  const dispatch = useDispatch()

  // Selectors
  const selectedCenter = useSelector(selectSelectedCenter)
  const centers = useSelector(selectCenters)
  const centersLoading = useSelector(selectCentersLoading)

  // Load selected center from localStorage on mount
  useEffect(() => {
    dispatch(loadSelectedCenterFromStorage())
  }, [dispatch])

  // Fetch centers
  const fetchCenters = useCallback(
    (searchQuery = '') => {
      if (!userId) return
      dispatch(fetchNecropsieCenters({ userId, searchQuery }))
    },
    [dispatch, userId]
  )

  // Auto-fetch centers on mount
  useEffect(() => {
    if (autoFetch && userId && centers.length === 0) {
      fetchCenters()
    }
  }, [autoFetch, userId, centers.length, fetchCenters])

  // Update selected center
  const updateSelectedCenter = useCallback(
    center => {
      dispatch(setSelectedCenter(center))
    },
    [dispatch]
  )

  // Clear all necropsy data (for logout)
  const clearData = useCallback(() => {
    dispatch(clearNecropsyData())
  }, [dispatch])

  return {
    selectedCenter,
    centers,
    centersLoading,
    fetchCenters,
    updateSelectedCenter,
    clearData
  }
}

export default useNecropsyCenter
