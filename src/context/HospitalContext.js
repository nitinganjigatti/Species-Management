import React, { createContext, useContext, useEffect, useState } from 'react'
import { read, write } from 'src/lib/windows/utils'

const HospitalContext = createContext()

export const HospitalProvider = ({ children }) => {
  const [selectedHospital, setSelectedHospital] = useState(null)
  const [hospitals, setHospitals] = useState([])
  const [hospitalStats, setHospitalStats] = useState(null)
  const [isHospitalStatsLoading, setHospitalStatsLoading] = useState(false)
  const [hasFetchedStatsForCurrentHospital, setHasFetchedStatsForCurrentHospital] = useState(false)

  const updateSelectedHospital = hospital => {
    setSelectedHospital(hospital)
    write('selectedHospital', hospital)

    // Reset the fetched stats flag when hospital changes
    setHasFetchedStatsForCurrentHospital(false)
  }

  useEffect(() => {
    if (!selectedHospital && read('selectedHospital')) {
      setSelectedHospital(read('selectedHospital'))
    }
  }, [])

  const updateHospitals = (newHospitals, append = false) => {
    if (append) {
      setHospitals(prev => [...prev, ...newHospitals])
    } else {
      setHospitals(newHospitals)
    }
  }

  const updateHospitalStats = stats => {
    setHospitalStats(stats)
  }

  const markStatsAsFetched = () => {
    setHasFetchedStatsForCurrentHospital(true)
  }

  const clearHospitalData = () => {
    setSelectedHospital(null)
    setHospitals([])
    setHospitalStats(null)
    setHasFetchedStatsForCurrentHospital(false)
  }

  const value = {
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
    hasFetchedStatsForCurrentHospital
  }

  return <HospitalContext.Provider value={value}>{children}</HospitalContext.Provider>
}

export const useHospital = () => {
  const context = useContext(HospitalContext)
  if (!context) {
    throw new Error('useHospital must be used within a HospitalProvider')
  }

  return context
}

export default HospitalContext
