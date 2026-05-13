'use client'

import { useState, useEffect, useContext, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { debounce } from 'lodash'
import Toaster from 'src/components/Toaster'
import { getHospitalBedStats } from 'src/lib/api/hospital/hospitalAnalytics'
import { useHospital } from 'src/context/HospitalContext'
import { addInpatientDischarge } from 'src/lib/api/hospital/inpatientDischarge'
import { getZooWiseSiteLists } from 'src/lib/api/hospital/inpatient'
import { getEnclosureListSectionWise } from 'src/lib/api/housing'
import { getSectionList } from 'src/lib/api/egg/egg/createAnimal'
import { AuthContext } from 'src/context/AuthContext'

function useTransferEnclosureDischarge() {
  const { t } = useTranslation()
  const authData: any = useContext(AuthContext)
  const zoo_id = authData?.userData?.user?.zoos[0]?.zoo_id || null

  const [sites, setSites] = useState<any[]>([])
  const [sections, setSections] = useState<any[]>([])
  const [enclosures, setEnclosures] = useState<any[]>([])

  const [loading, setLoading] = useState<any>({
    sites: false,
    sections: false,
    enclosures: false,
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

  const fetchSites = useCallback(async (q = '') => {
    try {
      setLoader('sites', true)
      const params = { q, limit: 10, page_no: 1 }
      const res: any = await getZooWiseSiteLists(params)
      if (res?.success) {
        const formatted = res?.data?.result?.map((item: any) => ({
          value: item?.site_id,
          label: item?.site_name
        }))
        setSites(formatted)
      } else {
        setSites([])
      }
    } catch (error: any) {
      console.error('Error fetchSites:', error?.message)
    } finally {
      setLoader('sites', false)
    }
  }, [])

  const fetchSections = useCallback(
    async (siteId: any, q = '') => {
      if (!siteId) return

      try {
        setLoader('sections', true)

        const params = {
          zoo_id: zoo_id?.toString(),
          page: 1,
          offset: 10,
          selected_site_id: siteId,
          q,
          filter_empty_enclosures: 1, // used for exclude section with empty enclosures
          module_name: 'transfer',
          exclude_user_section_permission: 1, // remove permission based filter
          ignore_sys_gen: 1 // remove system generated
        }

        const res: any = await getSectionList(params)
        if (res?.success) {
          const formatted = res?.sections?.[0]?.map((item: any) => ({
            value: item?.section_id,
            label: item?.section_name
          }))
          setSections(formatted)
        } else {
          setSections([])
        }
      } catch (error: any) {
        console.error('Error fetchSections:', error?.message)
      } finally {
        setLoader('sections', false)
      }
    },
    [zoo_id]
  )

  const fetchEnclosures = useCallback(async (sectionId: any, q = '') => {
    if (!sectionId) return

    try {
      setLoader('enclosures', true)

      const params = {
        section_id: sectionId,
        q,
        limit: 10,
        page_no: 1,
        filter_user_enclosure: 0, // to remove permission filter
        include_sub_enclosure: 1 // include sub enclosures
      }
      const res: any = await getEnclosureListSectionWise(params)
      if (res?.success) {
        const formatted = res?.data?.list_items?.map((item: any) => ({
          value: item?.enclosure_id,
          label: item?.user_enclosure_name
        }))
        setEnclosures(formatted)
      } else {
        setEnclosures([])
      }
    } catch (error: any) {
      console.error('Error fetchEnclosures:', error?.message)
    } finally {
      setLoader('enclosures', false)
    }
  }, [])

  // Debounce search
  const debouncedFetchSites = useMemo(() => debounce((q: string) => fetchSites(q), 500), [fetchSites])
  const debouncedFetchSections = useMemo(
    () => debounce((siteId: any, q: string) => fetchSections(siteId, q), 500),
    [fetchSections]
  )

  const debouncedFetchEnclosures = useMemo(
    () => debounce((sectionId: any, q: string) => fetchEnclosures(sectionId, q), 500),
    [fetchEnclosures]
  )

  // Cancel debounced calls on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      debouncedFetchSites.cancel()
      debouncedFetchSections.cancel()
      debouncedFetchEnclosures.cancel()
    }
  }, [debouncedFetchSites, debouncedFetchSections, debouncedFetchEnclosures])

  // Dropdown handler to trigger debounced search based on user input
  const handleSiteSearch = (text: string) => debouncedFetchSites(text || '')
  const handleSectionSearch = (siteId: any, text: string) => debouncedFetchSections(siteId, text || '')
  const handleEnclosureSearch = (sectionId: any, text: string) => debouncedFetchEnclosures(sectionId, text || '')

  // Clear functions to reset sections and enclosures options when site or section changes
  const clearSections = () => {
    setSections([])
  }

  const clearEnclosures = () => {
    setEnclosures([])
  }

  // Handle transfer to enclosure form submission
  const handleSubmitData = async (payload: any) => {
    setLoader('submit', true)

    try {
      const response: any = await addInpatientDischarge(payload)

      if (response?.success) {
        Toaster({
          type: 'success',
          message: response?.message || t('hospital_module.transfer_to_enclosure_submitted_successfully')
        })

        fetchAndUpdateHospitalStats(selectedHospital?.id)

        return true
      }

      Toaster({
        type: 'error',
        message: response?.message || t('hospital_module.failed_to_submit_transfer_to_enclosure')
      })

      return false
    } catch (error: any) {
      console.error('Transfer enclosure error:', error?.message)

      return false
    } finally {
      setLoader('submit', false)
    }
  }

  return {
    sites,
    sections,
    enclosures,
    siteLoading: loading.sites,
    sectionLoading: loading.sections,
    enclosureLoading: loading.enclosures,
    submitLoader: loading.submit,
    handleSiteSearch,
    handleSectionSearch,
    handleEnclosureSearch,
    fetchSites,
    fetchSections,
    fetchEnclosures,
    clearSections,
    clearEnclosures,
    handleSubmitData
  }
}

export default useTransferEnclosureDischarge
