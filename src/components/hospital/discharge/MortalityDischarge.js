import { useState, useEffect, useCallback } from 'react'
import { addInpatientDischarge } from 'src/lib/api/hospital/inpatientDischarge'
import { getMannerOfDeath, getCarcassCondition, getCarcassDeposition } from 'src/lib/api/housing'
import Toaster from 'src/components/Toaster'
import debounce from 'lodash/debounce'

const templates = ['Avian summary', 'Feline summary', 'Reptilian summary']

function MortalityDischarge() {
  const [causeOfDeath, setCauseOfDeath] = useState([])
  const [carcassCondition, setCarcassCondition] = useState([])
  const [carcassDeposition, setCarcassDeposition] = useState([])
  const [submitLoader, setSubmitLoader] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState(null)
  const [resetForm, setResetForm] = useState(false)
  const [activeTemplate, setActiveTemplate] = useState(templates[0])

  // Fetch functions
  const fetchManner = async (q = '') => {
    try {
      const params = {
        q,
        limit: 5,
        page: 1
      }

      const res = await getMannerOfDeath(params)

      if (res?.is_success) {
        const formatted = res.data.map(item => ({
          value: item.id,
          label: item.name
        }))
        console.log('formatted', formatted)

        setCauseOfDeath(formatted)
      } else {
        setCauseOfDeath([])
      }
    } catch (err) {
      console.error('Error fetchManner:', err)
      setError('Failed to load manner of death data')
    }
  }

  const fetchCondition = async (q = '') => {
    try {
      const params = { q, limit: 5, page: 1 }
      const res = await getCarcassCondition(params)
      console.log('res', res)

      if (res?.is_success) {
        const formatted = res.data.map(item => ({
          value: item.id,
          label: item.name
        }))
        setCarcassCondition(formatted)
      } else {
        setCarcassCondition([])
      }
    } catch (err) {
      console.error('Error fetchCondition:', err)
      setError('Failed to load carcass condition data')
    }
  }

  const fetchDisposition = async (q = '') => {
    try {
      const params = { q, limit: 5, page: 1 }
      const res = await getCarcassDeposition(params)
      if (res?.is_success) {
        const formatted = res.data.map(item => ({
          value: item.id,
          label: item.name
        }))
        setCarcassDeposition(formatted)
      } else {
        setCarcassDeposition([])
      }
    } catch (err) {
      console.error('Error fetchDisposition:', err)
      setError('Failed to load carcass disposition data')
    }
  }

  // Debounced versions
  const debouncedFetchManner = useCallback(
    debounce(q => {
      fetchManner(q)
    }, 500),
    []
  )

  const debouncedFetchCondition = useCallback(
    debounce(q => {
      fetchCondition(q)
    }, 500),
    []
  )

  const debouncedFetchDisposition = useCallback(
    debounce(q => {
      fetchDisposition(q)
    }, 500),
    []
  )

  // Initial fetch on mount
  useEffect(() => {
    setFetchLoading(true)
    Promise.all([fetchManner(''), fetchCondition(''), fetchDisposition('')])
      .catch(err => {
        console.error('Initial fetch error:', err)
      })
      .finally(() => {
        setFetchLoading(false)
      })
  }, [])

  // Functions to be called when user types in each autocomplete
  const handleMannerSearch = text => {
    debouncedFetchManner(text || '')
  }

  const handleConditionSearch = text => {
    debouncedFetchCondition(text || '')
  }

  const handleDispositionSearch = text => {
    debouncedFetchDisposition(text || '')
  }

  const handleSubmitData = async payload => {
    setSubmitLoader(true)
    console.log('payload11', payload)

    try {
      const response = await addInpatientDischarge(payload)

      if (response?.success) {
        setResetForm(true)
        Toaster({ type: 'success', message: response?.message || 'Mortality discharge submitted successfully' })
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to submit mortality discharge' })
      }
    } catch (error) {
      console.error('Mortality submission error:', error)
      Toaster({ type: 'error', message: error.message || 'An unexpected error occurred' })
    } finally {
      setSubmitLoader(false)
    }
  }

  return {
    causeOfDeath,
    carcassCondition,
    carcassDeposition,
    submitLoader,
    fetchLoading,
    error,
    handleSubmitData,
    resetForm,
    handleMannerSearch,
    handleConditionSearch,
    handleDispositionSearch,
    activeTemplate,
    setActiveTemplate,
    templates
  }
}

export default MortalityDischarge

// import { useState, useEffect } from 'react'
// import { addInpatientDischarge } from 'src/lib/api/hospital/inpatientDischarge'
// import { getMannerOfDeath, getCarcassCondition, getCarcassDeposition } from 'src/lib/api/housing'
// import Toaster from 'src/components/Toaster'

// function MortalityDischarge() {
//   const [causeOfDeath, setCauseOfDeath] = useState([])
//   const [carcassCondition, setCarcassCondition] = useState([])
//   const [carcassDeposition, setCarcassDeposition] = useState([])
//   const [submitLoader, setSubmitLoader] = useState(false)
//   const [fetchLoading, setFetchLoading] = useState(true)
//   const [error, setError] = useState(null)
//   const [resetForm, setResetForm] = useState(false)

//   // Fetch all master data
//   const fetchMasterData = async () => {
//     setFetchLoading(true)
//     setError(null)

//     try {
//       const [deathRes, conditionRes, depositionRes] = await Promise.all([
//         getMannerOfDeath({}),
//         getCarcassCondition({}),
//         getCarcassDeposition({})
//       ])

//       if (deathRes?.is_success) {
//         const formattedData = deathRes.data.map(item => ({
//           value: item?.id,
//           label: item?.name
//         }))
//         setCauseOfDeath(formattedData)
//       }

//       if (conditionRes?.is_success) {
//         const formattedData = conditionRes.data.map(item => ({
//           value: item?.id,
//           label: item?.name
//         }))
//         setCarcassCondition(formattedData)
//       }

//       if (depositionRes?.is_success) {
//         const formattedData = depositionRes.data.map(item => ({
//           value: item?.id,
//           label: item?.name
//         }))
//         setCarcassDeposition(formattedData)
//       }
//     } catch (error) {
//       console.error('Error fetching mortality master data:', error?.message)
//       setError('Failed to load master data. Please try again.')
//     } finally {
//       setFetchLoading(false)
//     }
//   }

//   useEffect(() => {
//     fetchMasterData()
//   }, [])

//   // Handle mortality form submission
//   const handleSubmitData = async payload => {
//     setSubmitLoader(true)
//     console.log('payload11', payload)

//     try {
//       const response = await addInpatientDischarge(payload)

//       if (response?.success) {
//         setResetForm(true)
//         Toaster({ type: 'success', message: response?.message || 'Mortality discharge submitted successfully' })
//       } else {
//         Toaster({ type: 'error', message: response?.message || 'Failed to submit mortality discharge' })
//       }
//     } catch (error) {
//       console.error('Mortality submission error:', error)
//       Toaster({ type: 'error', message: error.message || 'An unexpected error occurred' })
//     } finally {
//       setSubmitLoader(false)
//     }
//   }

//   return {
//     causeOfDeath,
//     carcassCondition,
//     carcassDeposition,
//     submitLoader,
//     fetchLoading,
//     error,
//     handleSubmitData,
//     resetForm
//   }
// }

// export default MortalityDischarge
