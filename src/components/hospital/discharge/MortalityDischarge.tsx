'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import debounce from 'lodash/debounce'
import { getMannerOfDeath, getCarcassCondition, getCarcassDeposition } from 'src/lib/api/housing'
import { addInpatientDischarge, getNecropsyCenter } from 'src/lib/api/hospital/inpatientDischarge'
import Toaster from 'src/components/Toaster'
import { useHospital } from 'src/context/HospitalContext'
import { getHospitalBedStats } from 'src/lib/api/hospital/hospitalAnalytics'

function useMortalityDischarge() {
  const { t } = useTranslation()
  const [causeOfDeath, setCauseOfDeath] = useState<any[]>([])
  const [carcassCondition, setCarcassCondition] = useState<any[]>([])
  const [carcassDeposition, setCarcassDeposition] = useState<any[]>([])
  const [necropsyCenter, setNecropsyCenter] = useState<any[]>([])

  const [loading, setLoading] = useState<any>({
    manner: false,
    condition: false,
    disposition: false,
    necropsy: false,
    submit: false
  })

  const { selectedHospital, updateHospitalStats } = useHospital()

  const setLoader = (key: string, value: boolean) => setLoading((prev: any) => ({ ...prev, [key]: value }))

  // Fetch and refresh hospital bed stats in context after successful discharge
  const fetchAndUpdateHospitalStats = async (hospitalId: any) => {
    if (!hospitalId) return

    try {
      const statsResponse: any = await (getHospitalBedStats as any)(hospitalId)
      if (statsResponse?.success) {
        updateHospitalStats(statsResponse.data)
      }
    } catch (error: any) {
      console.error('Error fetching hospital stats:', error?.message || error)
    }
  }

  const fetchManner = useCallback(async (q = '') => {
    try {
      setLoader('manner', true)
      const params = { q, limit: 10, page: 1 }
      const res: any = await (getMannerOfDeath as any)(params)

      if (res?.is_success) {
        const formatted = res?.data?.map((item: any) => ({
          value: item?.id,
          label: item?.name
        }))

        setCauseOfDeath(formatted)
      } else {
        setCauseOfDeath([])
      }
    } catch (error: any) {
      console.error('Error fetchManner:', error?.message)
    } finally {
      setLoader('manner', false)
    }
  }, [])

  const fetchCondition = useCallback(async (q = '') => {
    try {
      setLoader('condition', true)
      const params = { q, limit: 10, page: 1 }
      const res: any = await (getCarcassCondition as any)(params)

      if (res?.is_success) {
        const formatted = res?.data?.map((item: any) => ({
          value: item?.id,
          label: item?.name
        }))
        setCarcassCondition(formatted)
      } else {
        setCarcassCondition([])
      }
    } catch (error: any) {
      console.error('Error fetchCondition:', error?.message)
    } finally {
      setLoader('condition', false)
    }
  }, [])

  const fetchDisposition = useCallback(async (q = '') => {
    try {
      setLoader('disposition', true)
      const params = { q, limit: 10, page: 1 }
      const res: any = await (getCarcassDeposition as any)(params)

      if (res?.is_success) {
        const formatted = res?.data?.map((item: any) => ({
          value: item?.id,
          label: item?.name
        }))
        setCarcassDeposition(formatted)
      } else {
        setCarcassDeposition([])
      }
    } catch (error: any) {
      console.error('Error fetchDisposition:', error?.message)
    } finally {
      setLoader('disposition', false)
    }
  }, [])

  const fetchNecropsyCenter = useCallback(async (q = '') => {
    try {
      setLoader('necropsy', true)
      const params = { q, limit: 10, page: 1 }

      const res: any = await getNecropsyCenter(params)

      if (res?.status) {
        const formatted = res?.data?.list?.map((item: any) => ({
          value: item?.id,
          label: item?.name
        }))
        setNecropsyCenter(formatted)
      } else {
        setNecropsyCenter([])
      }
    } catch (error: any) {
      console.error('Error fetchNecropsyCenter:', error?.message)
    } finally {
      setLoader('necropsy', false)
    }
  }, [])

  // Debounce search
  const debouncedFetchManner = useMemo(() => debounce((q: string) => fetchManner(q), 500), [fetchManner])
  const debouncedFetchCondition = useMemo(() => debounce((q: string) => fetchCondition(q), 500), [fetchCondition])
  const debouncedFetchDisposition = useMemo(() => debounce((q: string) => fetchDisposition(q), 500), [fetchDisposition])
  const debouncedFetchNecropsyCenter = useMemo(
    () => debounce((q: string) => fetchNecropsyCenter(q), 500),
    [fetchNecropsyCenter]
  )

  // Cancel debounced calls on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      debouncedFetchManner.cancel()
      debouncedFetchCondition.cancel()
      debouncedFetchDisposition.cancel()
      debouncedFetchNecropsyCenter.cancel()
    }
  }, [debouncedFetchManner, debouncedFetchCondition, debouncedFetchDisposition, debouncedFetchNecropsyCenter])

  // Dropdown handler to trigger debounced search based on user input
  const handleMannerSearch = (text: string) => debouncedFetchManner(text || '')
  const handleConditionSearch = (text: string) => debouncedFetchCondition(text || '')
  const handleDispositionSearch = (text: string) => debouncedFetchDisposition(text || '')
  const handleNecropsyCenterSearch = (text: string) => debouncedFetchNecropsyCenter(text || '')

  // Handle mortality form submission
  const handleSubmitData = async (payload: any) => {
    setLoader('submit', true)

    try {
      const response: any = await addInpatientDischarge(payload)

      if (response?.success) {
        Toaster({
          type: 'success',
          message: response?.message || t('hospital_module.mortality_discharge_submitted_successfully')
        })

        fetchAndUpdateHospitalStats(selectedHospital?.id)

        return true
      }

      Toaster({
        type: 'error',
        message: response?.message || t('hospital_module.failed_to_submit_mortality_discharge')
      })

      return false
    } catch (error: any) {
      console.error('Mortality submission error:', error?.message)

      return false
    } finally {
      setLoader('submit', false)
    }
  }

  return {
    causeOfDeath,
    carcassCondition,
    carcassDeposition,
    necropsyCenter,
    mannerLoading: loading.manner,
    conditionLoading: loading.condition,
    dispositionLoading: loading.disposition,
    necropsyLoading: loading.necropsy,
    submitLoader: loading.submit,
    fetchManner,
    fetchCondition,
    fetchDisposition,
    fetchNecropsyCenter,
    handleMannerSearch,
    handleConditionSearch,
    handleDispositionSearch,
    handleNecropsyCenterSearch,
    handleSubmitData
  }
}

export default useMortalityDischarge
