import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getZooSettings, getZooReportTypes, saveZooSettings } from 'src/lib/api/zoo-settings'
import ZooSettingsView from 'src/views/pages/zoo-configuration/ZooSettingsView'

const ZooSettings = () => {
  const [generalValues, setGeneralValues] = useState({
    timezone: '',
    currency: ''
  })

  const [reportRecipients, setReportRecipients] = useState({})

  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['zoo-settings'],
    queryFn: getZooSettings
  })

  const { data: reportTypesData, isLoading: reportTypesLoading } = useQuery({
    queryKey: ['zoo-report-types'],
    queryFn: getZooReportTypes
  })

  // Prefill state from API response
  useEffect(() => {
    if (settingsData?.data) {
      const { timezone, currency, report_recipients } = settingsData.data
      if (timezone) setGeneralValues(prev => ({ ...prev, timezone }))
      if (currency) setGeneralValues(prev => ({ ...prev, currency }))
      if (report_recipients) setReportRecipients(report_recipients)
    }
  }, [settingsData])

  // Initialize empty recipients for report types that don't have saved data
  useEffect(() => {
    if (reportTypesData?.data?.length) {
      setReportRecipients(prev => {
        const updated = { ...prev }
        reportTypesData.data.forEach(rt => {
          if (!updated[rt.key]) {
            updated[rt.key] = { to: [], cc: [] }
          }
        })

        return updated
      })
    }
  }, [reportTypesData])

  const handleGeneralChange = (field, value) => {
    setGeneralValues(prev => ({ ...prev, [field]: value }))
  }

  const handleUpdateRecipients = (reportKey, field, users) => {
    setReportRecipients(prev => ({
      ...prev,
      [reportKey]: { ...prev[reportKey], [field]: users }
    }))
  }

  const handleSaveGeneral = async () => {
    try {
      const res = await saveZooSettings({
        section: 'general',
        ...generalValues
      })
      toast.success(res?.message || 'General settings saved')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save general settings')
      throw err
    }
  }

  const handleSaveReports = async () => {
    try {
      // Backend expects user IDs only, not full user objects
      const payload = {}
      Object.keys(reportRecipients).forEach(key => {
        payload[key] = {
          to: reportRecipients[key].to.map(u => u.user_id),
          cc: reportRecipients[key].cc.map(u => u.user_id)
        }
      })
      const res = await saveZooSettings({
        section: 'report_recipients',
        report_recipients: payload
      })
      toast.success(res?.message || 'Report recipients saved')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save report recipients')
      throw err
    }
  }

  return (
    <ZooSettingsView
      isLoading={settingsLoading || reportTypesLoading}
      generalValues={generalValues}
      onGeneralChange={handleGeneralChange}
      onSaveGeneral={handleSaveGeneral}
      reportTypes={reportTypesData?.data || []}
      reportRecipients={reportRecipients}
      onUpdateRecipients={handleUpdateRecipients}
      onSaveReports={handleSaveReports}
    />
  )
}

export default ZooSettings
