import { useState, useEffect, useMemo } from 'react'
import debounce from 'lodash/debounce'
import { getMannerOfDeath, getCarcassCondition, getCarcassDeposition } from 'src/lib/api/housing'
import { addInpatientDischarge, getNecropsyCenter } from 'src/lib/api/hospital/inpatientDischarge'
import Toaster from 'src/components/Toaster'
import { useHospital } from 'src/context/HospitalContext'
import { getHospitalBedStats } from 'src/lib/api/hospital/hospitalAnalytics'

function MortalityDischarge() {
  const [causeOfDeath, setCauseOfDeath] = useState([])
  const [carcassCondition, setCarcassCondition] = useState([])
  const [carcassDeposition, setCarcassDeposition] = useState([])
  const [necropsyCenter, setNecropsyCenter] = useState([])

  const [fetchLoading, setFetchLoading] = useState(true)
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
      console.error('Error fetching hospital stats:', error?.message || error)
    }
  }

  //  Fetch cause of death list
  const fetchManner = async (q = '') => {
    try {
      const params = { q, limit: 10, page: 1 }
      const res = await getMannerOfDeath(params)

      if (res?.is_success) {
        const formatted = res?.data?.map(item => ({
          value: item?.id,
          label: item?.name
        }))

        setCauseOfDeath(formatted)
      } else {
        setCauseOfDeath([])
      }
    } catch (error) {
      console.error('Error fetchManner:', error?.response?.data?.message || error?.message)
    }
  }

  //  Fetch carcass condition list
  const fetchCondition = async (q = '') => {
    try {
      const params = { q, limit: 10, page: 1 }
      const res = await getCarcassCondition(params)

      if (res?.is_success) {
        const formatted = res?.data?.map(item => ({
          value: item?.id,
          label: item?.name
        }))
        setCarcassCondition(formatted)
      } else {
        setCarcassCondition([])
      }
    } catch (error) {
      console.error('Error fetchCondition:', error?.response?.data?.message || error?.message)
    }
  }

  //  Fetch carcass Disposition list
  const fetchDisposition = async (q = '') => {
    try {
      const params = { q, limit: 10, page: 1 }
      const res = await getCarcassDeposition(params)

      if (res?.is_success) {
        const formatted = res?.data?.map(item => ({
          value: item?.id,
          label: item?.name
        }))
        setCarcassDeposition(formatted)
      } else {
        setCarcassDeposition([])
      }
    } catch (error) {
      console.error('Error fetchDisposition:', error?.response?.data?.message || error?.message)
    }
  }

  const fetchNecropsyCenter = async (q = '') => {
    try {
      const params = { q, limit: 10, page: 1 }

      const res = await getNecropsyCenter(params)

      if (res?.status) {
        const formatted = res?.data?.list?.map(item => ({
          value: item?.id,
          label: item?.name
        }))
        setNecropsyCenter(formatted)
      } else {
        setNecropsyCenter([])
      }
    } catch (error) {
      console.error('Error fetchNecropsyCenter:', error?.response?.data?.message || error?.message)
    }
  }

  // Debounced versions
  const debouncedFetchManner = useMemo(() => debounce(q => fetchManner(q), 500), [])

  const debouncedFetchCondition = useMemo(() => debounce(q => fetchCondition(q), 500), [])

  const debouncedFetchDisposition = useMemo(() => debounce(q => fetchDisposition(q), 500), [])

  const debouncedFetchNecropsyCenter = useMemo(() => debounce(q => fetchNecropsyCenter(q), 500), [])

  // Initial fetch on mount
  useEffect(() => {
    let isMounted = true

    const load = async () => {
      try {
        setFetchLoading(true)

        await Promise.all([fetchManner(''), fetchCondition(''), fetchDisposition(''), fetchNecropsyCenter('')])
      } catch (error) {
        console.error('Initial fetch failed:', error)
      } finally {
        if (isMounted) {
          setFetchLoading(false)
        }
      }
    }

    load()

    return () => {
      isMounted = false

      debouncedFetchManner.cancel()
      debouncedFetchCondition.cancel()
      debouncedFetchDisposition.cancel()
      debouncedFetchNecropsyCenter.cancel()
    }
  }, [])

  // Functions to be called when user types in each autocomplete
  const handleMannerSearch = text => debouncedFetchManner(text || '')
  const handleConditionSearch = text => debouncedFetchCondition(text || '')
  const handleDispositionSearch = text => debouncedFetchDisposition(text || '')
  const handleNecropsyCenterSearch = text => debouncedFetchNecropsyCenter(text || '')

  // Handle mortality form submission
  const handleSubmitData = async payload => {
    setSubmitLoader(true)

    try {
      const response = await addInpatientDischarge(payload)

      if (response?.success) {
        Toaster({
          type: 'success',
          message: response?.message || 'Mortality discharge submitted successfully'
        })

        fetchAndUpdateHospitalStats(selectedHospital?.id)

        return true
      }

      Toaster({
        type: 'error',
        message: response?.message || 'Failed to submit mortality discharge'
      })

      return false
    } catch (error) {
      console.error('Mortality submission error:', error?.response?.data?.message || error?.message)

      return false
    } finally {
      setSubmitLoader(false)
    }
  }

  return {
    causeOfDeath,
    carcassCondition,
    carcassDeposition,
    necropsyCenter,
    fetchLoading,

    handleMannerSearch,
    handleConditionSearch,
    handleDispositionSearch,
    handleNecropsyCenterSearch,

    submitLoader,
    handleSubmitData
  }
}

export default MortalityDischarge
