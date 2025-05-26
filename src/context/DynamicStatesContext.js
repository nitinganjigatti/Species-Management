import { createContext, useContext, useState } from 'react'

const DynamicStatesContext = createContext()

// Provider Component to Manage Multiple States Dynamically
export const DynamicStatesProvider = ({ children }) => {
  const [data, setData] = useState({})

  // Function to update a specific state dynamically
  const updateState = (key, value) => {
    setData(prevState => ({
      ...prevState,
      [key]: value
    }))
  }

  // Function to update multiple states at once
  const updateMultipleStates = newStates => {
    setData(prevState => ({
      ...prevState,
      ...newStates
    }))
  }

  // Function to reset a specific state
  const resetState = key => {
    setData(prevState => {
      const newState = { ...prevState }
      delete newState[key] // Remove the specific key

      return newState
    })
  }

  // Function to reset all states
  const resetAllStates = () => {
    setData({})
  }

  return (
    <DynamicStatesContext.Provider value={{ data, updateState, updateMultipleStates, resetState, resetAllStates }}>
      {children}
    </DynamicStatesContext.Provider>
  )
}

export const useDynamicStateContext = () => {
  const context = useContext(DynamicStatesContext)
  if (!context) {
    throw new Error('useDynamicStateContext must be used within a DynamicStatesProvider')
  }

  return context
}
