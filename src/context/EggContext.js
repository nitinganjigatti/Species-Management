import React, { createContext, useContext, useState } from 'react'

const EggContext = createContext()

export const EggProvider = ({ children }) => {
  const [selectedEggTab, setSelectedEggTab] = useState('')

  return <EggContext.Provider value={{ selectedEggTab, setSelectedEggTab }}>{children}</EggContext.Provider>
}

export const useEggContext = () => useContext(EggContext)
