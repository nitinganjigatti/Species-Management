import React, { createContext, useContext, useState } from 'react'

const PharmacyContext = createContext()

export const PharmacyProvider = ({ children }) => {
  const [selectedPharmacy, setSelectedPharmacy] = useState('')

  return (
    <PharmacyContext.Provider value={{ selectedPharmacy, setSelectedPharmacy }}>{children}</PharmacyContext.Provider>
  )
}

export const usePharmacyContext = () => useContext(PharmacyContext)
