import { useState } from 'react'
import { addInpatientDischarge } from 'src/lib/api/hospital/inpatientDischarge'
import Toaster from 'src/components/Toaster'
import { useRouter } from 'next/router'

function TransferEnclosureDischarge() {
  const router = useRouter()
  const { id } = router.query
  const [submitLoader, setSubmitLoader] = useState(false)

  const handleSubmitData = async payload => {
    setSubmitLoader(true)

    try {
      const response = await addInpatientDischarge(payload)

      if (response?.success) {
        Toaster({
          type: 'success',
          message: response?.message || 'Transfer to enclosure submitted successfully'
        })

        router.push(`/hospital/inpatient/${id}?tab=overview`)

        // setTimeout(() => {
        //   router.push(`/hospital/inpatient/${id}?tab=overview`).then(() => {
        //     router.reload()
        //   })
        // }, 0)

        return true
      }

      Toaster({
        type: 'error',
        message: response?.message || 'Failed to submit transfer to enclosure'
      })

      return false
    } catch (error) {
      console.error('Transfer enclosure error:', error?.response?.data?.message || error?.message)

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
    handleSubmitData
  }
}

export default TransferEnclosureDischarge
