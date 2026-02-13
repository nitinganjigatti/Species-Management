import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { read, write } from 'src/lib/windows/utils'
import { getNecropsyListing } from 'src/lib/api/necropsy'

const NecropsyContext = createContext()

export const NecropsyProvider = ({ children }) => {
  const [selectedNecropsy, setSelectedNecropsy] = useState(null)
  const [necropsies, setNecropsies] = useState([])
  const [isNecropsyAccessChecked, setIsNecropsyAccessChecked] = useState(false)

  const [isLoadingNecropsies, setIsLoadingNecropsies] = useState(false)
  const [hasNoNecropsiesOnInitialFetch, setHasNoNecropsiesOnInitialFetch] = useState(false)
  const [hasCompletedInitialFetch, setHasCompletedInitialFetch] = useState(false)

  const updateSelectedNecropsy = necropsy => {
    setSelectedNecropsy(necropsy)
    write('selectedNecropsy', necropsy)
  }

  const fetchNecropsies = useCallback(
    async (userId, searchQuery = '') => {
      setIsLoadingNecropsies(true)
      try {
        const params = {
          q: searchQuery?.trim(),
          has_permission: 1
        }
        const response = await getNecropsyListing(params, userId)

        if (response?.status) {
          const necropsiesList = response.data.list || []
          setNecropsies(necropsiesList)

          // Mark initial fetch complete only with empty search
          if (!hasCompletedInitialFetch && !searchQuery?.trim()) {
            setHasCompletedInitialFetch(true)
            setHasNoNecropsiesOnInitialFetch(necropsiesList.length === 0)
          }

          return necropsiesList
        } else {
          throw new Error(response?.message || 'Failed to fetch necropsies')
        }
      } catch (error) {
        console.error('Error in fetchNecropsies:', error)
      } finally {
        setIsLoadingNecropsies(false)
      }
    },
    [hasCompletedInitialFetch]
  )

  useEffect(() => {
    if (!selectedNecropsy && read('selectedNecropsy')) {
      setSelectedNecropsy(read('selectedNecropsy'))
    }
  }, [])

  const updateNecropsies = (newNecropsies, append = false) => {
    if (append) {
      setNecropsies(prev => [...prev, ...newNecropsies])
    } else {
      setNecropsies(newNecropsies)
    }
  }

  // Function to mark initial fetch completion and check if no necropsies
  const markInitialFetchComplete = necropsiesCount => {
    if (!hasCompletedInitialFetch) {
      setHasCompletedInitialFetch(true)
      setHasNoNecropsiesOnInitialFetch(necropsiesCount === 0)
    }
  }

  const clearNecropsyData = () => {
    setSelectedNecropsy(null)
    setNecropsies([])
    setHasNoNecropsiesOnInitialFetch(false)
    setHasCompletedInitialFetch(false)
  }

  const value = {
    selectedNecropsy,
    necropsies,
    isLoadingNecropsies,
    fetchNecropsies,
    updateSelectedNecropsy,
    updateNecropsies,
    clearNecropsyData,
    isNecropsyAccessChecked,
    setIsNecropsyAccessChecked,
    hasNoNecropsiesOnInitialFetch,
    hasCompletedInitialFetch,
    markInitialFetchComplete
  }

  return <NecropsyContext.Provider value={value}>{children}</NecropsyContext.Provider>
}

export const useNecropsy = () => {
  const context = useContext(NecropsyContext)
  if (!context) {
    throw new Error('useNecropsy must be used within a NecropsyProvider')
  }

  return context
}

export default NecropsyContext
