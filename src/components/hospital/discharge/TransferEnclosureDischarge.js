import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react'
import { debounce } from 'lodash'
import Toaster from 'src/components/Toaster'
import { useRouter } from 'next/router'
import { getHospitalBedStats } from 'src/lib/api/hospital/hospitalAnalytics'
import { useHospital } from 'src/context/HospitalContext'
import { addInpatientDischarge } from 'src/lib/api/hospital/inpatientDischarge'
import { getZooWiseSiteLists } from 'src/lib/api/hospital/inpatient'
import { getEnclosureListSectionWise } from 'src/lib/api/housing'
import { getSectionList } from 'src/lib/api/egg/egg/createAnimal'
import { AuthContext } from 'src/context/AuthContext'

function useTransferEnclosureDischarge() {
  const authData = useContext(AuthContext)
  const zoo_id = authData?.userData?.user?.zoos[0]?.zoo_id || null

  const [sites, setSites] = useState([])
  const [sections, setSections] = useState([])
  const [enclosures, setEnclosures] = useState([])

  const [loading, setLoading] = useState({
    sites: false,
    sections: false,
    enclosures: false,
    submit: false
  })

  const { selectedHospital, updateHospitalStats } = useHospital()

  const setLoader = (key, value) => setLoading(prev => ({ ...prev, [key]: value }))

  // Fetch and refresh hospital bed stats in context after successful discharge
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

  const fetchSites = useCallback(async (q = '') => {
    try {
      setLoader('sites', true)
      const params = { q, limit: 10, page_no: 1 }
      const res = await getZooWiseSiteLists(params)
      if (res?.success) {
        const formatted = res?.data?.result?.map(item => ({
          value: item?.site_id,
          label: item?.site_name
        }))
        setSites(formatted)
      } else {
        setSites([])
      }
    } catch (error) {
      console.error('Error fetchSites:', error?.message)
    } finally {
      setLoader('sites', false)
    }
  }, [])

  const fetchSections = useCallback(
    async (siteId, q = '') => {
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

        const res = await getSectionList(params)
        if (res?.success) {
          const formatted = res?.sections?.[0]?.map(item => ({
            value: item?.section_id,
            label: item?.section_name
          }))
          setSections(formatted)
        } else {
          setSections([])
        }
      } catch (error) {
        console.error('Error fetchSections:', error?.message)
      } finally {
        setLoader('sections', false)
      }
    },
    [zoo_id]
  )

  const fetchEnclosures = useCallback(async (sectionId, q = '') => {
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
      const res = await getEnclosureListSectionWise(params)
      if (res?.success) {
        const formatted = res?.data?.list_items?.map(item => ({
          value: item?.enclosure_id,
          label: item?.user_enclosure_name
        }))
        setEnclosures(formatted)
      } else {
        setEnclosures([])
      }
    } catch (error) {
      console.error('Error fetchEnclosures:', error?.message)
    } finally {
      setLoader('enclosures', false)
    }
  }, [])

  // Debounce search
  const debouncedFetchSites = useMemo(() => debounce(q => fetchSites(q), 500), [fetchSites])
  const debouncedFetchSections = useMemo(() => debounce((siteId, q) => fetchSections(siteId, q), 500), [fetchSections])

  const debouncedFetchEnclosures = useMemo(
    () => debounce((sectionId, q) => fetchEnclosures(sectionId, q), 500),
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
  const handleSiteSearch = text => debouncedFetchSites(text || '')
  const handleSectionSearch = (siteId, text) => debouncedFetchSections(siteId, text || '')
  const handleEnclosureSearch = (sectionId, text) => debouncedFetchEnclosures(sectionId, text || '')

  // Clear functions to reset sections and enclosures options when site or section changes
  const clearSections = () => {
    setSections([])
  }

  const clearEnclosures = () => {
    setEnclosures([])
  }

  // Handle transfer to enclosure form submission
  const handleSubmitData = async payload => {
    setLoader('submit', true)

    try {
      const response = await addInpatientDischarge(payload)

      if (response?.success) {
        Toaster({
          type: 'success',
          message: response?.message || 'Transfer to enclosure submitted successfully'
        })

        fetchAndUpdateHospitalStats(selectedHospital?.id)

        return true
      }

      Toaster({
        type: 'error',
        message: response?.message || 'Failed to submit transfer to enclosure'
      })

      return false
    } catch (error) {
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
