import { createContext, useContext, useState, useEffect } from 'react'

const ForgotPasswordContext = createContext()

export const ForgotPasswordProvider = ({ children }) => {
  const [forgotPasswordData, setForgotPasswordData] = useState(null)
  const [verifyOtpData, setVerifyOtpData] = useState(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedForgotPasswordData = localStorage.getItem('forgotPasswordData')
      const storedVerifyOtpData = localStorage.getItem('verifyOtpData')

      if (storedForgotPasswordData) setForgotPasswordData(JSON.parse(storedForgotPasswordData))
      if (storedVerifyOtpData) setVerifyOtpData(JSON.parse(storedVerifyOtpData))
    }
  }, [])

  // Save data
  useEffect(() => {
    if (typeof window !== 'undefined' && forgotPasswordData) {
      localStorage.setItem('forgotPasswordData', JSON.stringify(forgotPasswordData))
    }
  }, [forgotPasswordData])

  useEffect(() => {
    if (typeof window !== 'undefined' && verifyOtpData) {
      localStorage.setItem('verifyOtpData', JSON.stringify(verifyOtpData))
    }
  }, [verifyOtpData])

  // Clear data
  const clearForgotPasswordData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('forgotPasswordData')
      localStorage.removeItem('verifyOtpData')
    }
    setForgotPasswordData(null)
    setVerifyOtpData(null)
  }

  return (
    <ForgotPasswordContext.Provider
      value={{ forgotPasswordData, setForgotPasswordData, verifyOtpData, setVerifyOtpData, clearForgotPasswordData }}
    >
      {children}
    </ForgotPasswordContext.Provider>
  )
}

export const useForgotPassword = () => {
  return useContext(ForgotPasswordContext)
}
