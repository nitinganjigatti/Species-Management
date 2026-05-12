'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import type { EggContextType } from 'src/types/egg'

const EggContext = createContext<EggContextType | undefined>(undefined)

export const EggProvider = ({ children }: { children: ReactNode }) => {
  const [selectedEggTab, setSelectedEggTab] = useState<string>('')
  const [subTab, setSubTab] = useState<string>('')

  return (
    <EggContext.Provider value={{ selectedEggTab, setSelectedEggTab, subTab, setSubTab }}>
      {children}
    </EggContext.Provider>
  )
}

export const useEggContext = (): EggContextType => {
  const context = useContext(EggContext)
  if (!context) {
    throw new Error('useEggContext must be used within EggProvider')
  }
  return context
}
