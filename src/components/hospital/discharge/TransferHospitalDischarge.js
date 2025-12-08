// import { useState, useEffect, useCallback } from 'react'
// import { addInpatientDischarge } from 'src/lib/api/hospital/inpatientDischarge'
// import Toaster from 'src/components/Toaster'
// import debounce from 'lodash/debounce'
// import { getHospitalMaster } from 'src/lib/api/hospital/hospitalMaster'

// const templates = ['Avian summary', 'Feline summary', 'Reptilian summary']

// function TransferHospitalDischarge() {
//   const [hospitalData, setHospitalData] = useState([])
//   const [isLoadingHospital, setIsLoadingHospital] = useState(true)
//   const [submitLoader, setSubmitLoader] = useState(false)
//   const [activeTemplate, setActiveTemplate] = useState(templates[0])

//   // Fetch Hospital
//   const fetchHospital = async (q = '') => {
//     setIsLoadingHospital(true)
//     try {
//       const params = { q, limit: 5, page: 1 }
//       const res = await getHospitalMaster({ params })

//       if (res?.success) {
//         const formattedData = res.data?.hospitals?.map(item => ({
//           value: item?.id,
//           label: item?.hospital_name
//         }))
//         setHospitalData(formattedData)
//       }
//     } catch (error) {
//       console.error('Cannot fetch Hospital:', error?.response?.data?.message || error?.message)
//     }
//   }

//   // Debounced versions
//   const debouncedFetchHospital = useCallback(
//     debounce(q => {
//       fetchHospital(q)
//     }, 500),
//     []
//   )

//   // Initial fetch on mount
//   useEffect(() => {
//     const initFetch = async () => {
//       setIsLoadingHospital(true)
//       try {
//         await fetchHospital('')
//       } catch (error) {
//         console.error('Initial fetch error:', error?.response?.data?.message || error?.message)
//       } finally {
//         setIsLoadingHospital(false)
//       }
//     }

//     initFetch()
//   }, [])

//   //  search hospital
//   const handleHospitalSearch = text => {
//     if (!text) {
//       fetchHospital('')
//     } else {
//       debouncedFetchHospital(text)
//     }
//   }

//   // transfer hospital discharge submit
//   const handleSubmitData = async payload => {
//     setSubmitLoader(true)
//     try {
//       const response = await addInpatientDischarge(payload)

//       if (response?.success) {
//         Toaster({
//           type: 'success',
//           message: response?.message || 'Transfer to another hospital submitted successfully'
//         })

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
//     isLoadingHospital,
//     hospitalData,
//     handleHospitalSearch,
//     submitLoader,
//     handleSubmitData,
//     activeTemplate,
//     setActiveTemplate,
//     templates
//   }
// }

// export default TransferHospitalDischarge

import { useState, useEffect, useCallback, useMemo } from 'react'
import debounce from 'lodash/debounce'
import { getHospitalMaster } from 'src/lib/api/hospital/hospitalMaster'
import { addInpatientDischarge } from 'src/lib/api/hospital/inpatientDischarge'
import Toaster from 'src/components/Toaster'
import { useHospital } from 'src/context/HospitalContext'
import { getHospitalBedStats } from 'src/lib/api/hospital/hospitalAnalytics'

function TransferHospitalDischarge() {
  const [hospitalData, setHospitalData] = useState([])
  const [isLoadingHospital, setIsLoadingHospital] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)

  const { selectedHospital, updateHospitalStats } = useHospital()

  const fetchAndUpdateHospitalStats = async hospitalId => {
    if (!hospitalId) return

    try {
      const statsResponse = await getHospitalBedStats(hospitalId)
      if (statsResponse?.success) {
        updateHospitalStats(statsResponse.data)
      }
    } catch (error) {
      console.error('Error fetching hospital stats:', error)
    }
  }

  //  Fetch hospital list
  const fetchHospital = useCallback(async (query = '') => {
    setIsLoadingHospital(true)

    try {
      const params = { q: query, limit: 5, page: 1 }
      const res = await getHospitalMaster({ params })

      if (res?.success) {
        const formatted = res?.data?.hospitals?.map(item => ({
          value: item?.id,
          label: item?.hospital_name
        }))

        setHospitalData(formatted)
      }
    } catch (error) {
      console.error('Hospital fetch error:', error?.response?.data?.message || error?.message)
    } finally {
      setIsLoadingHospital(false)
    }
  }, [])

  // Debounced search
  const debouncedFetch = useMemo(
    () =>
      debounce(text => {
        fetchHospital(text)
      }, 500),
    [fetchHospital]
  )

  // Initial fetch on mount
  useEffect(() => {
    fetchHospital('')

    return () => debouncedFetch.cancel()
  }, [fetchHospital, debouncedFetch])

  const handleHospitalSearch = text => {
    if (!text) fetchHospital('')
    else debouncedFetch(text)
  }

  // Handle mortality form submission
  const handleSubmitData = async payload => {
    setSubmitLoader(true)

    try {
      const res = await addInpatientDischarge(payload)

      if (res?.success) {
        Toaster({ type: 'success', message: res?.message || 'Transfer to hospital Submitted successfully' })

        fetchAndUpdateHospitalStats(selectedHospital?.id)

        return true
      }

      Toaster({ type: 'error', message: res?.message || 'Failed to submit Transfer to hospital' })

      return false
    } catch (error) {
      Toaster({
        type: 'error',
        message: error?.response?.data?.message || error?.message || 'Unexpected error'
      })

      return false
    } finally {
      setSubmitLoader(false)
    }
  }

  return {
    isLoadingHospital,
    hospitalData,
    handleHospitalSearch,

    submitLoader,
    handleSubmitData
  }
}

export default TransferHospitalDischarge
