import React, { createContext, useContext, useState } from 'react'

const HospitalContext = createContext()

export const HospitalProvider = ({ children }) => {
  const [selectedHospital, setSelectedHospital] = useState(null)
  const [hospitals, setHospitals] = useState([])
  const [hospitalStats, setHospitalStats] = useState(null)
  const [isHospitalStatsLoading, setHospitalStatsLoading] = useState(false)

  const updateSelectedHospital = (hospital) => {
    setSelectedHospital(hospital)
  }

  const updateHospitals = (newHospitals, append = false) => {
    if (append) {
      setHospitals(prev => [...prev, ...newHospitals])
    } else {
      setHospitals(newHospitals)
    }
  }

  const updateHospitalStats = (stats) => {
    setHospitalStats(stats)
  }

  const clearHospitalData = () => {
    setSelectedHospital(null)
    setHospitals([])
    setHospitalStats(null)
  }

  const value = {
    selectedHospital,
    hospitals,
    hospitalStats,
    updateSelectedHospital,
    updateHospitals,
    updateHospitalStats,
    clearHospitalData,
    isHospitalStatsLoading,
    setHospitalStatsLoading
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