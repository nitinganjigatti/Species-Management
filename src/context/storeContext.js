import React, { createContext, useContext, useState } from 'react'

const DropdownContext = createContext()

export const DropdownProvider = ({ children }) => {
  const [selectedValue, setSelectedValue] = useState('initial context values')

  return <DropdownContext.Provider value={{ selectedValue, setSelectedValue }}>{children}</DropdownContext.Provider>
}

export const useDropdownContext = () => useContext(DropdownContext)
