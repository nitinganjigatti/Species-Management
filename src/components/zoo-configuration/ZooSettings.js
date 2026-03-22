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
    key: 'report_email',
    label: 'Report Email',
    order: 6,
    type: 'report_email',
    description: 'Configure recipients, schedule, and frequency for each report type',
    fields: [
      { key: 'enabled', label: 'Enable', type: 'toggle', default: false },
      {
        key: 'frequency', label: 'Frequency', type: 'radio', default: 'daily',
        options: [{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }]
      },
      {
        key: 'days', label: 'Days', type: 'checkbox_group',
        visible_when: { frequency: 'weekly' },
        options: [
          { value: 'monday', label: 'Mon' }, { value: 'tuesday', label: 'Tue' },
          { value: 'wednesday', label: 'Wed' }, { value: 'thursday', label: 'Thu' },
          { value: 'friday', label: 'Fri' }, { value: 'saturday', label: 'Sat' },
          { value: 'sunday', label: 'Sun' }
        ],
        default: []
      },
      { key: 'send_times', label: 'Send Times', type: 'time_picker_list', max_items: 3, min_items: 1, format: 'HH:mm', default: [] }
    ]
  }
]

const ZooSettings = () => {
  const [sectionValues, setSectionValues] = useState({})
  const [reportEmailValues, setReportEmailValues] = useState({})
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
      if (section.type === 'report_email') return // handled separately
      if (!section.fields) return

      const sectionData = data[section.key]
      const values = {}

      section.fields.forEach(field => {
        if (sectionData != null && typeof sectionData === 'object') {
          values[field.key] = sectionData[field.key] ?? field.default ?? null
        } else {
          values[field.key] = data[field.key] ?? field.default ?? null
        }
      })

      newSectionValues[section.key] = values
    })

    setSectionValues(newSectionValues)

    // Report email (combined recipients + schedule)
    if (data.report_email) {
      setReportEmailValues(data.report_email)
    }
  }, [settingsData, schemaData])

  // Initialize defaults for report types without saved data
  useEffect(() => {
    if (reportTypesData?.data?.length) {
      setReportEmailValues(prev => {
        const updated = { ...prev }
        reportTypesData.data.forEach(rt => {
          if (!updated[rt.key]) {
            updated[rt.key] = {
              enabled: false,
              to: [],
              cc: [],
              frequency: 'daily',
              days: [],
              send_times: [rt.default_send_time || '08:00']
            }
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

  // Report email handlers (combined recipients + schedule)
  const handleReportEmailChange = (reportKey, updatedData) => {
    setReportEmailValues(prev => ({ ...prev, [reportKey]: updatedData }))
  }

  const handleSaveReportEmail = async () => {
    try {
      // Build payload: convert hydrated user objects to IDs
      const payload = {}
      Object.entries(reportEmailValues).forEach(([key, val]) => {
        payload[key] = {
          ...val,
          to: (val.to || []).map(u => typeof u === 'object' ? u.user_id : u),
          cc: (val.cc || []).map(u => typeof u === 'object' ? u.user_id : u)
        }
      })

      const res = await saveZooSettings({
        section: 'report_email',
        report_email: payload
      })
      toast.success(res?.message || 'Report email settings saved')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save report email settings')
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
        reportEmailValues={reportEmailValues}
        onReportEmailChange={handleReportEmailChange}
        onSaveReportEmail={handleSaveReportEmail}
        timezone={sectionValues.general?.timezone || settingsData?.data?.timezone || null}
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
