import { useState, useEffect, useCallback } from 'react'
import { addInpatientDischarge } from 'src/lib/api/hospital/inpatientDischarge'
import Toaster from 'src/components/Toaster'
import debounce from 'lodash/debounce'
import { getHospitalMaster } from 'src/lib/api/hospital/hospitalMaster'

const templates = ['Avian summary', 'Feline summary', 'Reptilian summary']

function TransferEnclosureDischarge() {
  const [hospital, setHospital] = useState([])
  const [submitLoader, setSubmitLoader] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [resetForm, setResetForm] = useState(false)
  const [activeTemplate, setActiveTemplate] = useState(templates[0])

  // Fetch functions
  const fetchHospital = async (q = '') => {
    setFetchLoading(true)
    try {
      const params = { q, limit: 5, page: 1 }
      const res = await getHospitalMaster({ params })

      if (res?.success) {
        const formattedData = res.data?.hospitals?.map(item => ({
          value: item?.id,
          label: item?.hospital_name
        }))
        setHospital(formattedData)
      }
    } catch (error) {
      console.error('Cannot fetch Hospital:', error?.message)
    }
  }

  // Debounced versions
  const debouncedFetchHospital = useCallback(
    debounce(q => {
      fetchHospital(q)
    }, 500),
    []
  )

  // Initial fetch on mount
  useEffect(() => {
    const initFetch = async () => {
      setFetchLoading(true)
      try {
        await fetchHospital('')
      } catch (err) {
        console.error('Initial fetch error:', err)
      } finally {
        setFetchLoading(false)
      }
    }

    initFetch()
  }, [])

  // Functions to be called when user types in each autocomplete
  //   const handleHospitalSearch = text => {
  //     debouncedFetchHospital(text || '')
  //   }

  const handleHospitalSearch = text => {
    if (!text) {
      fetchHospital('') // fetch immediately when cleared
    } else {
      debouncedFetchHospital(text)
    }
  }

  const handleSubmitData = async payload => {
    setSubmitLoader(true)
    try {
      const response = await addInpatientDischarge(payload)

      if (response?.success) {
        setResetForm(true)
        Toaster({
          type: 'success',
          message: response?.message || 'Transfer to another hospital submitted successfully'
        })
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to submit Transfer to another hospital' })
      }
    } catch (error) {
      console.error('Transfer to another hospital submission error:', error)
      Toaster({ type: 'error', message: error.message || 'An unexpected error occurred' })
    } finally {
      setSubmitLoader(false)
    }
  }

  return {
    submitLoader,
    fetchLoading,
    handleSubmitData,
    resetForm,
    activeTemplate,
    setActiveTemplate,
    templates
  }
}

export default TransferEnclosureDischarge
