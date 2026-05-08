'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { read, write } from 'src/lib/windows/utils'
import type { Hospital, HospitalAnalytics, HospitalContextValue } from 'src/types/hospital'

const HospitalContext = createContext<HospitalContextValue | undefined>(undefined)

interface HospitalProviderProps {
  children: ReactNode
}

export const HospitalProvider = ({ children }: HospitalProviderProps) => {
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null)
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [hospitalStats, setHospitalStats] = useState<HospitalAnalytics | null>(null)
  const [isHospitalStatsLoading, setHospitalStatsLoading] = useState<boolean>(false)
  const [hasFetchedStatsForCurrentHospital, setHasFetchedStatsForCurrentHospital] = useState<boolean>(false)
  const [isHospitalAccessChecked, setIsHospitalAccessChecked] = useState<boolean>(false)
  const [hasNoHospitalsOnInitialFetch, setHasNoHospitalsOnInitialFetch] = useState<boolean>(false)
  const [hasCompletedInitialFetch, setHasCompletedInitialFetch] = useState<boolean>(false)

  const updateSelectedHospital = (hospital: Hospital | null) => {
    setSelectedHospital(hospital)
    write('selectedHospital', hospital)
    setHasFetchedStatsForCurrentHospital(false)
  }

  useEffect(() => {
    if (!selectedHospital) {
      const stored = read('selectedHospital') as Hospital | undefined

      if (stored) {
        setSelectedHospital(stored)
      }
    }
  }, [])

  const updateHospitals = (newHospitals: Hospital[], append = false) => {
    if (append) {
      setHospitals(prev => [...prev, ...newHospitals])
    } else {
      setHospitals(newHospitals)
    }
  }

  const updateHospitalStats = (stats: HospitalAnalytics | null) => {
    setHospitalStats(stats)
  }

  const markStatsAsFetched = () => {
    setHasFetchedStatsForCurrentHospital(true)
  }

  const markInitialFetchComplete = (hospitalsCount: number) => {
    if (!hasCompletedInitialFetch) {
      setHasCompletedInitialFetch(true)
      setHasNoHospitalsOnInitialFetch(hospitalsCount === 0)
    }
  }

  const clearHospitalData = () => {
    setSelectedHospital(null)
    setHospitals([])
    setHospitalStats(null)
    setHasFetchedStatsForCurrentHospital(false)
    setHasNoHospitalsOnInitialFetch(false)
    setHasCompletedInitialFetch(false)
  }

  const value: HospitalContextValue = {
    selectedHospital,
    hospitals,
    hospitalStats,
    updateSelectedHospital,
    updateHospitals,
    updateHospitalStats,
    markStatsAsFetched,
    clearHospitalData,
    isHospitalStatsLoading,
    setHospitalStatsLoading,
    hasFetchedStatsForCurrentHospital,
    isHospitalAccessChecked,
    setIsHospitalAccessChecked,
    hasNoHospitalsOnInitialFetch,
    hasCompletedInitialFetch,
    markInitialFetchComplete
  }

  return <HospitalContext.Provider value={value}>{children}</HospitalContext.Provider>
}

export const useHospital = (): HospitalContextValue => {
  const context = useContext(HospitalContext)
  if (!context) {
    throw new Error('useHospital must be used within a HospitalProvider')
  }

  return context
}

export default HospitalContext
