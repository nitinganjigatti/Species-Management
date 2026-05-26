import React, { createContext, useContext, useState, ReactNode, FC } from 'react'

interface EggContextType {
  selectedEggTab: string
  setSelectedEggTab: (tab: string) => void
  subTab: string
  setSubTab: (tab: string) => void
}

const EggContext = createContext<EggContextType | undefined>(undefined)

interface EggProviderProps {
  children: ReactNode
}

export const EggProvider: FC<EggProviderProps> = ({ children }) => {
  const [selectedEggTab, setSelectedEggTab] = useState<string>('')
  const [subTab, setSubTab] = useState<string>('')

  const value: EggContextType = {
    selectedEggTab,
    setSelectedEggTab,
    subTab,
    setSubTab
  }

  return <EggContext.Provider value={value}>{children}</EggContext.Provider>
}

export const useEggContext = (): EggContextType => {
  const context = useContext(EggContext)
  if (!context) {
    throw new Error('useEggContext must be used within an EggProvider')
  }
  return context
}
