import React, { createContext, useContext, useState } from 'react'

const PharmacyContext = createContext()

export const PharmacyProvider = ({ children }) => {
  const [selectedValue, setSelectedValue] = useState('initial context values')

  return <PharmacyContext.Provider value={{ selectedValue, setSelectedValue }}>{children}</PharmacyContext.Provider>
}

export const usePharmacyContext = () => useContext(PharmacyContext)
