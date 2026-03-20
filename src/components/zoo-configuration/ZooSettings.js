import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getZooSettings, getZooSettingsSchema, getZooReportTypes, saveZooSettings } from 'src/lib/api/zoo-settings'
import ZooSettingsView from 'src/views/pages/zoo-configuration/ZooSettingsView'
import ZooSettingsHistoryDrawer from './ZooSettingsHistoryDrawer'

// Fallback schema if the schema endpoint isn't deployed yet
const FALLBACK_SCHEMA = [
  {
    key: 'general',
    label: 'General Settings',
    order: 1,
    icon: 'mdi:earth',
    description: 'Timezone and currency preferences',
    fields: [
      { key: 'timezone', label: 'Timezone', type: 'timezone_picker', required: true },
      { key: 'currency', label: 'Currency', type: 'currency_picker', required: true }
    ]
  },
  {
    key: 'report_recipients',
    label: 'Report Distribution',
    order: 99,
    type: 'report_recipients'
  }
]

const ZooSettings = () => {
  const [sectionValues, setSectionValues] = useState({})
  const [reportRecipients, setReportRecipients] = useState({})
  const [historyOpen, setHistoryOpen] = useState(false)

  const { data: schemaData, isLoading: schemaLoading } = useQuery({
    queryKey: ['zoo-settings-schema'],
    queryFn: getZooSettingsSchema,
    retry: false,
    onError: () => {}
  })

  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['zoo-settings'],
    queryFn: getZooSettings,
    retry: false,
    onError: () => {}
  })

  const { data: reportTypesData, isLoading: reportTypesLoading } = useQuery({
    queryKey: ['zoo-report-types'],
    queryFn: getZooReportTypes,
    retry: false,
    onError: () => {}
  })

  const schema = schemaData?.data || FALLBACK_SCHEMA

  // Prefill state from API response using schema
  useEffect(() => {
    if (!settingsData?.data) return

    const data = settingsData.data
    const newSectionValues = {}

    schema.forEach(section => {
      if (section.type === 'report_recipients') return // handled separately
      if (!section.fields) return

      const sectionData = data[section.key]
      const values = {}

      section.fields.forEach(field => {
        if (sectionData != null && typeof sectionData === 'object') {
          // Nested: e.g. cluster_management.enable_cluster_management
          values[field.key] = sectionData[field.key] ?? field.default ?? null
        } else {
          // Top-level fallback: e.g. timezone, currency (if backend hasn't normalized yet)
          values[field.key] = data[field.key] ?? field.default ?? null
        }
      })

      newSectionValues[section.key] = values
    })

    setSectionValues(newSectionValues)

    // Report recipients
    if (data.report_recipients) {
      setReportRecipients(data.report_recipients)
    }
  }, [settingsData, schemaData])

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

  // Generic section field change handler
  const handleSectionFieldChange = (sectionKey, fieldKey, value) => {
    setSectionValues(prev => ({
      ...prev,
      [sectionKey]: { ...prev[sectionKey], [fieldKey]: value }
    }))
  }

  // Generic section save handler
  const handleSaveSection = async sectionKey => {
    try {
      const values = sectionValues[sectionKey] || {}
      const sectionSchema = schema.find(s => s.key === sectionKey)
      const payload = { section: sectionKey }

      // Build flat payload, extracting user IDs for user_picker fields
      ;(sectionSchema?.fields || []).forEach(field => {
        const val = values[field.key]
        if (field.type === 'user_picker' && Array.isArray(val)) {
          payload[field.key] = val.map(u => u.user_id)
        } else {
          payload[field.key] = val
        }
      })

      const res = await saveZooSettings(payload)
      toast.success(res?.message || 'Settings saved')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save settings')
      throw err
    }
  }

  // Report recipients handlers (unchanged)
  const handleUpdateRecipients = (reportKey, field, users) => {
    setReportRecipients(prev => ({
      ...prev,
      [reportKey]: { ...prev[reportKey], [field]: users }
    }))
  }

  const handleSaveReports = async () => {
    try {
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
    <>
      <ZooSettingsView
        isLoading={settingsLoading || reportTypesLoading || schemaLoading}
        schema={schema}
        sectionValues={sectionValues}
        onSectionFieldChange={handleSectionFieldChange}
        onSaveSection={handleSaveSection}
        reportTypes={reportTypesData?.data || []}
        reportRecipients={reportRecipients}
        onUpdateRecipients={handleUpdateRecipients}
        onSaveReports={handleSaveReports}
        onOpenHistory={() => setHistoryOpen(true)}
      />
      <ZooSettingsHistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />
    </>
  )
}

export default ZooSettings
