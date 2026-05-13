'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import debounce from 'lodash/debounce'
import { getHospitalMaster } from 'src/lib/api/hospital/hospitalMaster'
import { addInpatientDischarge } from 'src/lib/api/hospital/inpatientDischarge'
import Toaster from 'src/components/Toaster'
import { useHospital } from 'src/context/HospitalContext'
import { getHospitalBedStats } from 'src/lib/api/hospital/hospitalAnalytics'
import { useTranslation } from 'react-i18next'

function TransferHospitalDischarge() {
  const { t } = useTranslation()
  const [hospitalData, setHospitalData] = useState<any[]>([])
  const [isLoadingHospital, setIsLoadingHospital] = useState<boolean>(false)
  const [submitLoader, setSubmitLoader] = useState<boolean>(false)

  const { selectedHospital, updateHospitalStats } = useHospital()

  const fetchAndUpdateHospitalStats = async (hospitalId: any) => {
    if (!hospitalId) return

    try {
      const statsResponse: any = await (getHospitalBedStats as any)(hospitalId)
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
      const res: any = await getHospitalMaster({ params } as any)

      if (res?.success) {
        const formatted = res?.data?.hospitals?.map((item: any) => ({
          value: item?.id,
          label: item?.hospital_name
        }))

        setHospitalData(formatted)
      }
    } catch (error: any) {
      console.error('Hospital fetch error:', error?.response?.data?.message || error?.message)
    } finally {
      setIsLoadingHospital(false)
    }
  }, [])

  // Debounced search
  const debouncedFetch = useMemo(
    () =>
      debounce((text: string) => {
        fetchHospital(text)
      }, 500),
    [fetchHospital]
  )

  // Initial fetch on mount
  useEffect(() => {
    fetchHospital('')

    return () => debouncedFetch.cancel()
  }, [fetchHospital, debouncedFetch])

  const handleHospitalSearch = (text: string) => {
    if (!text) fetchHospital('')
    else debouncedFetch(text)
  }

  // Handle mortality form submission
  const handleSubmitData = async (payload: any) => {
    setSubmitLoader(true)

    try {
      const res: any = await addInpatientDischarge(payload)

      if (res?.success) {
        Toaster({ type: 'success', message: res?.message || t('hospital_module.transfer_hospital_submitted_successfully') })

        fetchAndUpdateHospitalStats(selectedHospital?.id)

        return true
      }

      Toaster({ type: 'error', message: res?.message || t('hospital_module.failed_submit_transfer_hospital') })

      return false
    } catch (error: any) {
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
