import React, { useState, useEffect, useContext, useMemo } from 'react'
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

function TransferEnclosureDischarge(initialData) {
  const router = useRouter()
  const { id } = router.query
  const authData = useContext(AuthContext)
  const zoo_id = authData?.userData?.user?.zoos[0]?.zoo_id

  const [sites, setSites] = useState([])
  const [sections, setSections] = useState([])
  const [enclosures, setEnclosures] = useState([])

  const [fetchLoading, setFetchLoading] = useState(false)
  const [sectionLoading, setSectionLoading] = useState(false)
  const [enclosureLoading, setEnclosureLoading] = useState(false)
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

  const fetchSites = async (q = '') => {
    try {
      setFetchLoading(true)
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
      console.error('Error fetchSites:', error?.response?.data?.message || error?.message)
    } finally {
      setFetchLoading(false)
    }
  }

  const fetchSections = async (siteId, q = '') => {
    if (!siteId) return
    try {
      setSectionLoading(true)

      const params = {
        zoo_id: zoo_id.toString(),
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
      console.error('Error fetchSections:', error?.response?.data?.message || error?.message)
    } finally {
      setSectionLoading(false)
    }
  }

  const fetchEnclosures = async (sectionId, q = '') => {
    if (!sectionId) return
    try {
      setEnclosureLoading(true)

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
      console.error('Error fetchEnclosures:', error?.response?.data?.message || error?.message)
    } finally {
      setEnclosureLoading(false)
    }
  }

  const debouncedFetchSites = useMemo(() => debounce(q => fetchSites(q), 500), [])

  const debouncedFetchSections = useMemo(() => debounce((siteId, q) => fetchSections(siteId, q), 500), [])

  const debouncedFetchEnclosures = useMemo(() => debounce((sectionId, q) => fetchEnclosures(sectionId, q), 500), [])

  useEffect(() => {
    const saved = sessionStorage.getItem('transfer_enclosure_form')

    let siteId = null
    let siteLabel = ''

    let sectionId = null
    let sectionLabel = ''

    let enclosureId = null
    let enclosureLabel = ''

    if (saved) {
      const parsed = JSON.parse(saved)

      siteId = parsed?.site_name?.value || null
      siteLabel = parsed?.site_name?.label || ''

      sectionId = parsed?.section_name?.value || null
      sectionLabel = parsed?.section_name?.label || ''

      enclosureId = parsed?.user_enclosure_name?.value || null
      enclosureLabel = parsed?.user_enclosure_name?.label || ''
    } else if (initialData) {
      siteId = initialData?.site_id || null
      siteLabel = initialData?.site_name || ''

      sectionId = initialData?.section_id || null
      sectionLabel = initialData?.section_name || ''

      enclosureId = initialData?.user_enclosure_id || null
      enclosureLabel = initialData?.user_enclosure_name || ''
    }

    if (!siteId) {
      fetchSites('')

      return
    }

    fetchSites(siteLabel)
    fetchSections(siteId, sectionLabel || '')

    if (sectionId) {
      fetchEnclosures(sectionId, enclosureLabel || '')
    }

    return () => {
      debouncedFetchSites.cancel()
      debouncedFetchSections.cancel()
      debouncedFetchEnclosures.cancel()
    }
  }, [initialData])

  const clearSections = () => {
    setSections([])
  }

  const clearEnclosures = () => {
    setEnclosures([])
  }

  const handleSubmitData = async payload => {
    setSubmitLoader(true)

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
      console.error('Transfer enclosure error:', error?.response?.data?.message || error?.message)

      return false
    } finally {
      setSubmitLoader(false)
    }
  }

  return {
    submitLoader,
    handleSubmitData,
    sites,
    fetchLoading,
    handleSiteSearch: debouncedFetchSites,
    sections,
    sectionLoading,
    handleSectionSearch: debouncedFetchSections,
    enclosures,
    enclosureLoading,
    handleEnclosureSearch: debouncedFetchEnclosures,
    fetchSections,
    fetchEnclosures,
    clearSections,
    clearEnclosures
  }
}

export default TransferEnclosureDischarge
