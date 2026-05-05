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
    key: 'geofencing',
    label: 'Geofencing',
    order: 5,
    icon: 'mdi:map-marker-radius-outline',
    description: 'Restrict access to users physically present at the zoo or its sites',
    fields: [
      { key: 'geofence_enabled', label: 'Enable Geofencing', type: 'toggle', default: 0 },
      {
        key: 'geofence_scope',
        label: 'Scope',
        type: 'radio',
        default: 'zoo_geofence',
        visible_when: { geofence_enabled: 1 },
        options: [
          { value: 'zoo_geofence', label: 'Zoo (single circle around the zoo center)' },
          { value: 'per_site', label: 'Per-site (user must be within one of their mapped sites)' }
        ]
      },
      {
        key: 'zoo_coordinates',
        label: 'Zoo Center Coordinates',
        type: 'geo_coordinates',
        lat_key: 'zoo_latitude',
        lng_key: 'zoo_longitude',
        radius_key: 'geofence_default_radius_m',
        lat_label: 'Latitude',
        lng_label: 'Longitude',
        visible_when: { geofence_enabled: 1, geofence_scope: 'zoo_geofence' }
      },
      {
        key: 'geofence_default_radius_m',
        label: 'Default Radius (meters)',
        type: 'number',
        min: 1,
        default: 5000,
        visible_when: { geofence_enabled: 1 }
      },
      {
        key: 'geofence_max_accuracy_m',
        label: 'Max GPS Accuracy (meters)',
        type: 'number',
        min: 1,
        default: 100,
        visible_when: { geofence_enabled: 1 }
      }
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
        key: 'frequency',
        label: 'Frequency',
        type: 'radio',
        default: 'daily',
        options: [
          { value: 'daily', label: 'Daily' },
          { value: 'weekly', label: 'Weekly' }
        ]
      },
      {
        key: 'days',
        label: 'Days',
        type: 'checkbox_group',
        visible_when: { frequency: 'weekly' },
        options: [
          { value: 'monday', label: 'Mon' },
          { value: 'tuesday', label: 'Tue' },
          { value: 'wednesday', label: 'Wed' },
          { value: 'thursday', label: 'Thu' },
          { value: 'friday', label: 'Fri' },
          { value: 'saturday', label: 'Sat' },
          { value: 'sunday', label: 'Sun' }
        ],
        default: []
      },
      {
        key: 'send_times',
        label: 'Send Times',
        type: 'time_picker_list',
        max_items: 3,
        min_items: 1,
        format: 'HH:mm',
        default: []
      }
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

  // Collapse zoo_latitude + zoo_longitude pair into a single geo_coordinates field
  // so the GeoCoordinatesField renderer (with map + "use my location") is used.
  // This applies whether the schema came from the backend or from the fallback.
  const normalizeGeofencingSection = section => {
    if (section?.key !== 'geofencing' || !Array.isArray(section.fields)) return section
    if (section.fields.some(f => f.type === 'geo_coordinates')) return section

    const latIdx = section.fields.findIndex(f => f.key === 'zoo_latitude')
    const lngIdx = section.fields.findIndex(f => f.key === 'zoo_longitude')
    if (latIdx === -1 || lngIdx === -1) return section

    const latField = section.fields[latIdx]
    const fields = section.fields.filter(f => f.key !== 'zoo_latitude' && f.key !== 'zoo_longitude')
    const insertAt = Math.min(latIdx, lngIdx)
    fields.splice(insertAt, 0, {
      key: 'zoo_coordinates',
      label: 'Zoo Center Coordinates',
      type: 'geo_coordinates',
      lat_key: 'zoo_latitude',
      lng_key: 'zoo_longitude',
      radius_key: 'geofence_default_radius_m',
      lat_label: 'Latitude',
      lng_label: 'Longitude',
      visible_when: latField.visible_when || { geofence_enabled: 1, geofence_scope: 'zoo_geofence' }
    })

    return { ...section, fields }
  }

  const rawSchema = schemaData?.data || FALLBACK_SCHEMA
  const schema = Array.isArray(rawSchema) ? rawSchema.map(normalizeGeofencingSection) : rawSchema

  // Prefill state from API response using schema
  useEffect(() => {
    if (!settingsData?.data) return

    const data = settingsData.data
    const newSectionValues = {}

    schema.forEach(section => {
      if (section.type === 'report_email') return // handled separately
      if (!section.fields) return

      const sectionData = data[section.key]
      const source = sectionData != null && typeof sectionData === 'object' ? sectionData : data
      const values = {}

      section.fields.forEach(field => {
        if (field.type === 'geo_coordinates') {
          if (field.lat_key) values[field.lat_key] = source[field.lat_key] ?? null
          if (field.lng_key) values[field.lng_key] = source[field.lng_key] ?? null

          return
        }
        values[field.key] = source[field.key] ?? field.default ?? null
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
        if (field.type === 'geo_coordinates') {
          if (field.lat_key) payload[field.lat_key] = values[field.lat_key] ?? null
          if (field.lng_key) payload[field.lng_key] = values[field.lng_key] ?? null

          return
        }
        const val = values[field.key]
        if (field.type === 'user_picker' && Array.isArray(val)) {
          payload[field.key] = val.map(u => u.user_id)
        } else {
          payload[field.key] = val
        }
      })

      // Cross-field validation: zoo_geofence scope requires lat/lng
      if (sectionKey === 'geofencing' && Number(values.geofence_enabled) === 1 && values.geofence_scope === 'zoo_geofence') {
        const lat = values.zoo_latitude
        const lng = values.zoo_longitude
        const isEmpty = v => v === null || v === undefined || v === ''
        if (isEmpty(lat) || isEmpty(lng)) {
          toast.error('Latitude and longitude are required when scope is Zoo')

          return
        }
      }

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
          to: (val.to || []).map(u => (typeof u === 'object' ? u.user_id : u)),
          cc: (val.cc || []).map(u => (typeof u === 'object' ? u.user_id : u))
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
      <ZooSettingsHistoryDrawer open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </>
  )
}

export default ZooSettings
