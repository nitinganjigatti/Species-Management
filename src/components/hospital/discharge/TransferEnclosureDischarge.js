// import { useState } from 'react'
// import { addInpatientDischarge } from 'src/lib/api/hospital/inpatientDischarge'
// import Toaster from 'src/components/Toaster'

// const templates = ['Avian summary', 'Feline summary', 'Reptilian summary']

// // transfer enclosure discharge submit
// function TransferEnclosureDischarge() {
//   const [submitLoader, setSubmitLoader] = useState(false)
//   const [activeTemplate, setActiveTemplate] = useState(templates[0])

//   const handleSubmitData = async payload => {
//     setSubmitLoader(true)
//     try {
//       const response = await addInpatientDischarge(payload)

//       if (response?.success) {
//         Toaster({
//           type: 'success',
//           message: response?.message || 'Transfer to another hospital submitted successfully'
//         })

//         // ✅ Clear all persisted data after successful submit
//         localStorage.removeItem('medicines')
//         localStorage.removeItem('temp_medicines')
//         console.log('🧹 Cleared localStorage after success')

//         return true
//       } else {
//         Toaster({ type: 'error', message: response?.message || 'Failed to submit Transfer to another hospital' })
//       }
//     } catch (error) {
//       console.error('Transfer to another hospital submission error:', error?.response?.data?.message || error?.message)
//       Toaster({
//         type: 'error',
//         message: error?.response?.data?.message || error?.message || 'An unexpected error occurred'
//       })

//       return false
//     } finally {
//       setSubmitLoader(false)
//     }
//   }

//   return {
//     submitLoader,
//     handleSubmitData,
//     activeTemplate,
//     setActiveTemplate,
//     templates
//   }
// }

// export default TransferEnclosureDischarge
import { useState } from 'react'
import { addInpatientDischarge } from 'src/lib/api/hospital/inpatientDischarge'
import Toaster from 'src/components/Toaster'

const templates = ['Avian summary', 'Feline summary', 'Reptilian summary']

// Transfer Enclosure Discharge submit handler
function TransferEnclosureDischarge() {
  const [submitLoader, setSubmitLoader] = useState(false)
  const [activeTemplate, setActiveTemplate] = useState(templates[0])

  const handleSubmitData = async payload => {
    setSubmitLoader(true)

    try {
      const response = await addInpatientDischarge(payload)

      if (response?.success) {
        Toaster({
          type: 'success',
          message: response?.message || 'Transfer to enclosure submitted successfully'
        })

        return true
      } else {
        Toaster({
          type: 'error',
          message: response?.message || 'Failed to submit transfer to enclosure'
        })

        return false
      }
    } catch (error) {
      console.error('Transfer to enclosure submission error:', error?.response?.data?.message || error?.message)

      Toaster({
        type: 'error',
        message: error?.response?.data?.message || error?.message || 'An unexpected error occurred'
      })

      return false
    } finally {
      setSubmitLoader(false)
    }
  }

  return {
    submitLoader,
    handleSubmitData,
    activeTemplate,
    setActiveTemplate,
    templates
  }
}

export default TransferEnclosureDischarge
