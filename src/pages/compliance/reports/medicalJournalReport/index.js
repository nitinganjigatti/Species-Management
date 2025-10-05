import { useTheme } from '@emotion/react'
import { Box, Card, CardHeader, CircularProgress, Grid, IconButton, Tooltip, Typography } from '@mui/material'
import { format, subMonths } from 'date-fns'
import { debounce } from 'lodash'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Icon from 'src/@core/components/icon'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import { getAnimalDetailsOverview } from 'src/lib/api/housing'
import Utility from 'src/utility'
import AnimalDrawer from 'src/views/pages/compliance/reports/medicalJournalReport/AnimalDrawer'
import { DownloadReport } from 'src/views/pages/compliance/utility'
import ReportCard from 'src/views/pages/report/ReportCard'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import AnimalCard from 'src/views/utility/AnimalCard'
import ObservationCard from 'src/views/utility/ObservationCard'
import Search from 'src/views/utility/Search'

const STATIC_MEDICAL_JOURNAL_ROWS = (() => {
  const baseDate = new Date()
  const dayInMs = 24 * 60 * 60 * 1000
  const makeDate = offsetDays => new Date(baseDate.getTime() - offsetDays * dayInMs).toISOString()

  return [
    {
      id: 'mj-001',
      medical_id: 'MED-1234556',
      date_time: makeDate(5),
      notes: 'Leopard was observed with reduced mobility and swollen forelimb, suspected fracture due to fall.',
      symptoms: [
        {
          symptom_name: 'Influenza',
          status: 'Active',
          severity: 'Mild',
          duration: '10',
          duration_unit: 'days',
          description: ''
        }
      ],
      prescriptions: [
        {
          medicine_name: 'Dolo 650',
          frequency: 'Everyday',
          duration: '13',
          duration_unit: 'days',
          interval: '450 mg every 10 hours',
          notes: 'Administer orally with food to avoid gastric irritation.'
        }
      ],
      lab_tests: [
        {
          test_name: 'Lab Test',
          parameters: [{ name: 'Skin Scraping' }, { name: 'Hormone assays' }, { name: 'Heartworm Antigen' }]
        }
      ]
    },
    {
      id: 'mj-002',
      medical_id: 'MED-1234557',
      date_time: makeDate(4),
      notes: 'N/A',
      advices: [
        {
          description:
            'Provide a bland, easily digestible diet. Avoid red meat or any raw feed until further notice. Offer fresh water at all times.'
        }
      ],
      prescriptions: [
        {
          medicine_name: 'Dolo 650',
          frequency: 'Everyday',
          duration: '13',
          duration_unit: 'days',
          interval: '450 mg every 10 hours'
        }
      ]
    },
    {
      id: 'mj-003',
      medical_id: 'MED-1234558',
      date_time: makeDate(3),
      notes: 'Leopard was observed with reduced mobility and swollen forelimb, suspected fracture due to fall.',
      prescriptions: [
        {
          medicine_name: 'Dolo 650',
          frequency: 'Everyday',
          duration: '13',
          duration_unit: 'days',
          interval: '450 mg every 10 hours'
        }
      ],
      symptoms: [
        {
          symptom_name: 'Influenza',
          status: 'Active',
          severity: 'Mild',
          duration: '10',
          duration_unit: 'days',
          description: '',
          is_edited: true
        }
      ]
    },
    {
      id: 'mj-004',
      medical_id: 'MED-1234559',
      date_time: makeDate(2),
      notes: 'N/A',
      advices: [
        {
          description:
            'Provide a bland, easily digestible diet. Avoid red meat or any raw feed until further notice. Offer fresh water at all times.'
        }
      ],
      prescriptions: [
        {
          medicine_name: 'Dolo 650',
          frequency: 'Everyday',
          duration: '13',
          duration_unit: 'days',
          interval: '450 mg every 10 hours',
          is_edited: true
        }
      ],
      lab_tests: [
        {
          test_name: 'Lab Test',
          parameters: [{ name: 'Skin Scraping' }, { name: 'Hormone assays' }, { name: 'Heartworm Antigen' }]
        }
      ]
    },
    {
      id: 'mj-005',
      medical_id: 'MED-1234560',
      date_time: makeDate(1),
      notes: 'Leopard was observed with reduced mobility and swollen forelimb, suspected fracture due to fall.',
      prescriptions: [
        {
          medicine_name: 'Dolo 650',
          frequency: 'Everyday',
          duration: '13',
          duration_unit: 'days',
          interval: '450 mg every 10 hours',
          is_edited: true
        }
      ],
      lab_tests: [
        {
          test_name: 'Lab Test',
          parameters: [{ name: 'Skin Scraping' }, { name: 'Hormone assays' }, { name: 'Heartworm Antigen' }]
        }
      ]
    },
    {
      id: 'mj-006',
      medical_id: 'MED-1234561',
      date_time: makeDate(0),
      notes: 'Leopard was observed with reduced mobility and swollen forelimb, suspected fracture due to fall.',
      symptoms: [
        {
          symptom_name: 'Influenza',
          status: 'Active',
          severity: 'Mild',
          duration: '10',
          duration_unit: 'days',
          description: '',
          is_edited: true
        }
      ]
    },
    {
      id: 'mj-007',
      medical_id: 'MED-1234562',
      date_time: makeDate(-1),
      notes: 'N/A',
      advices: [
        {
          description:
            'Provide a bland, easily digestible diet. Avoid red meat or any raw feed until further notice. Offer fresh water at all times.'
        }
      ]
    },
    {
      id: 'mj-008',
      medical_id: 'MED-1234563',
      date_time: makeDate(-2),
      notes: 'Leopard was observed with reduced mobility and swollen forelimb, suspected fracture due to fall.',
      prescriptions: [
        {
          medicine_name: 'Dolo 650',
          frequency: 'Everyday',
          duration: '13',
          duration_unit: 'days',
          interval: '450 mg every 10 hours',
          is_edited: true
        }
      ]
    },
    {
      id: 'mj-009',
      medical_id: 'MED-1234564',
      date_time: makeDate(-3),
      notes: 'Leopard was observed with reduced mobility and swollen forelimb, suspected fracture due to fall.',
      clinical_assessments: [
        {
          assessment_name: 'Influenza',
          status: 'Active',
          diagnosis: 'Diagnosis',
          chronicity: 'Not chronic',
          severity: 'Grave'
        }
      ]
    },
    {
      id: 'mj-010',
      medical_id: 'MED-1234565',
      date_time: makeDate(-4),
      notes: 'Leopard was observed with reduced mobility and swollen forelimb, suspected fracture due to fall.',
      clinical_assessments: [
        {
          assessment_name: 'Influenza',
          status: 'Active',
          diagnosis: 'Diagnosis',
          chronicity: 'Not chronic',
          severity: 'Grave'
        }
      ],
      lab_tests: [
        {
          test_name: 'Lab Test',
          parameters: [{ name: 'Skin Scraping' }, { name: 'Hormone assays' }, { name: 'Heartworm Antigen' }]
        }
      ]
    }
  ]
})()

const MedicalJournalReport = () => {
  const theme = useTheme()
  const router = useRouter()

  const handleAnimalSelect = animal => {
    setSelectedAnimal({
      animal_id: animal?.animal_id,
      default_common_name: animal?.default_common_name,
      scientific_name: animal?.scientific_name ?? animal?.complete_name,
      user_enclosure_name: animal?.user_enclosure_name,
      section_name: animal?.section_name,
      site_name: animal?.site_name,
      type: animal?.type,
      sex: animal?.sex,
      default_icon: animal?.default_icon,
      total_animal: animal?.total_animal,
      local_identifier_name: animal?.local_identifier_name,
      local_identifier_value: animal?.local_identifier_value
    })
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, animal_id: animal?.animal_id }
      },
      undefined,
      { shallow: true }
    )
  }

  const [animalDrawer, setAnimalDrawer] = useState(false)
  const [selectedAnimal, setSelectedAnimal] = useState(null)
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searchValue, setSearchValue] = useState(router.query.q || '')
  const [isDownloading, setIsDownloading] = useState(false)
  const [animalLoader, setAnimalLoader] = useState(false)

  const [filterDates, setFilterDates] = useState({
    startDate: router.query.startDate || Utility.formatDate(format(subMonths(new Date(), 6), 'dd MMM, yyyy')),
    endDate: router.query.endDate || Utility.formatDate(format(new Date(), 'dd MMM, yyyy'))
  })

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page) || 0,
    pageSize: parseInt(router.query.limit) || 50
  })

  useEffect(() => {
    if (router.query.animal_id && !selectedAnimal) {
      const fetchAnimal = async () => {
        setAnimalLoader(true)
        try {
          const res = await getAnimalDetailsOverview({
            animal_id: router.query.animal_id
          })

          if (res?.success) {
            setSelectedAnimal({
              animal_id: res?.data?.animal_details?.animal_id,
              default_common_name: res?.data?.animal_details?.common_name,
              scientific_name: res?.data?.animal_details?.scientific_name ?? res?.data?.animal_details?.complete_name,
              user_enclosure_name: res?.data?.animal_details?.user_enclosure_name,
              section_name: res?.data?.animal_details?.section_name,
              site_name: res?.data?.animal_details?.site_name,
              type: res?.data?.animal_details?.type,
              sex: res?.data?.animal_details?.sex,
              default_icon: res?.data?.animal_details?.default_icon,
              total_animal: res?.data?.animal_details?.total_animal,
              local_identifier_name: res?.data?.animal_details?.local_identifier_name,
              local_identifier_value: res?.data?.animal_details?.local_identifier_value
            })
            setAnimalLoader(false)
          }
        } catch (err) {
          console.error('Error fetching user by id:', err)
        }
      }

      fetchAnimal()
    }
  }, [router.query.animal_id])

  const reportCardEventHandler = () => {
    setAnimalDrawer(!animalDrawer)
  }

  const title = (
    <Typography
      sx={{
        fontSize: '24px',
        fontWeight: 500,
        ml: '-12px',
        color: theme.palette.customColors.OnSurfaceVariant
      }}
    >
      Medical Journal Report
    </Typography>
  )

  const formatDateLabel = useCallback(value => {
    if (!value) return ''

    try {
      return Utility.formatDisplayDate(Utility.convertUTCToLocalDateTime(value))
    } catch (error) {
      try {
        return Utility.formatDisplayDate(value)
      } catch (err) {
        return `${value}`
      }
    }
  }, [])

  const parseFilterDate = value => {
    if (!value) return null

    const parsed = new Date(value)

    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  const compileSearchHaystack = useCallback(
    row => {
      const serialized = JSON.stringify(row || {}).toLowerCase()
      const formattedDate = formatDateLabel(row?.date_time || '')

      return `${serialized} ${formattedDate.toLowerCase()}`
    },
    [formatDateLabel]
  )

  const fetchObservationReport = useCallback(
    async (q = '') => {
      try {
        setLoading(true)

        const normalizedQuery = q.trim().toLowerCase()
        const startDate = parseFilterDate(filterDates.startDate)
        const endDate = parseFilterDate(filterDates.endDate)

        const filtered = STATIC_MEDICAL_JOURNAL_ROWS.filter(row => {
          const rowDate = row?.date_time ? new Date(row.date_time) : null

          if (startDate && rowDate && rowDate < startDate) return false
          if (endDate && rowDate && rowDate > endDate) return false

          if (!normalizedQuery) return true

          return compileSearchHaystack(row).includes(normalizedQuery)
        })

        const startIndex = paginationModel.page * paginationModel.pageSize
        const paginatedRows = filtered.slice(startIndex, startIndex + paginationModel.pageSize)

        setTotal(filtered.length)
        setRows(paginatedRows)
        setLoading(false)
      } catch (e) {
        console.log(e)
        setRows([])
        setTotal(0)
        setLoading(false)
      }
    },
    [filterDates, paginationModel.page, paginationModel.pageSize, compileSearchHaystack]
  )

  const debouncedGetObservationReport = useMemo(
    () =>
      debounce(search => {
        fetchObservationReport(search)
      }, 500),
    [fetchObservationReport]
  )

  useEffect(() => {
    if (selectedAnimal) {
      fetchObservationReport(searchValue)
    }
  }, [selectedAnimal, filterDates, paginationModel.page, paginationModel.pageSize, fetchObservationReport])

  useEffect(() => {
    return () => {
      debouncedGetObservationReport.cancel()
    }
  }, [debouncedGetObservationReport])

  const getSlNo = index => paginationModel.page * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: row.id || index,
    sl_no: getSlNo(index)
  }))

  const extractValue = (source, path) => {
    if (!source || !path) return undefined

    return path.split('.').reduce((acc, segment) => {
      if (acc === undefined || acc === null) return undefined

      return acc[segment]
    }, source)
  }

  const pickFirstValue = (source, paths) => {
    for (const path of paths) {
      const value = extractValue(source, path)
      if (value === undefined || value === null) continue
      if (typeof value === 'string' && value.trim() === '') continue

      return value
    }

    return undefined
  }

  const pickString = (source, paths) => {
    const value = pickFirstValue(source, paths)
    if (value === undefined || value === null) return ''
    if (typeof value === 'string') return value.trim()
    if (typeof value === 'number') return `${value}`
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'

    return ''
  }

  const pickBooleanLike = (source, paths) => {
    const value = pickFirstValue(source, paths)
    if (value === undefined || value === null) return false
    if (typeof value === 'boolean') return value
    if (typeof value === 'number') return value === 1
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase()

      return ['true', '1', 'yes', 'y', 'edited'].includes(normalized)
    }

    return false
  }

  const arrayify = value => {
    if (!value) return []
    if (Array.isArray(value)) return value.filter(item => item !== null && item !== undefined)
    if (typeof value === 'object') return [value]
    if (typeof value === 'string') {
      const tokens = value
        .split(',')
        .map(token => token.trim())
        .filter(Boolean)

      return tokens.map(name => ({ name }))
    }

    return []
  }

  const pickArray = (source, paths) => {
    for (const path of paths) {
      const value = extractValue(source, path)
      const collection = arrayify(value)
      if (collection.length) return collection
    }

    return []
  }

  const formatDurationText = (value, unit) => {
    if (!value) return ''

    return unit ? `${value} ${unit}` : `${value}`
  }

  const buildTreatmentSections = row => {
    const sections = []

    const symptoms = pickArray(row, [
      'symptoms',
      'symptoms_details',
      'symptom_details',
      'diagnosis_symptoms',
      'treatments.symptoms',
      'medical_details.symptoms'
    ])

    if (symptoms.length) {
      sections.push({
        key: 'symptoms',
        icon: '/icons/symptoms.svg',
        label: 'Symptoms',
        items: symptoms.map(item => {
          if (typeof item === 'string') {
            return { title: item }
          }

          const title = pickString(item, ['symptom_name', 'name', 'symptom', 'title']) || 'Not specified'
          const status = pickString(item, ['status', 'state'])
          const severity = pickString(item, ['severity', 'level'])
          const durationValue = pickString(item, ['duration', 'duration_value', 'time_period', 'days'])
          const durationUnit = pickString(item, ['duration_unit', 'durationType', 'time_period_unit'])
          const duration = formatDurationText(durationValue, durationUnit)
          const description = pickString(item, ['notes', 'note', 'description', 'details'])
          const badge = pickBooleanLike(item, ['is_edited', 'edited', 'isEdited']) ? 'Edited' : ''
          const metaParts = [status, severity, duration].filter(Boolean)

          return {
            title,
            meta: metaParts.join(' • '),
            metaColor: 'default',
            description,
            badge
          }
        })
      })
    }

    const prescriptions = pickArray(row, [
      'prescriptions',
      'prescription_details',
      'medications',
      'treatments.prescriptions',
      'medical_details.prescriptions'
    ])

    if (prescriptions.length) {
      sections.push({
        key: 'prescriptions',
        icon: '/icons/prescription.svg',
        label: 'Prescription',
        items: prescriptions.map(item => {
          if (typeof item === 'string') {
            return { title: item }
          }

          const title = pickString(item, ['medicine_name', 'drug_name', 'name', 'title']) || 'Prescription'
          const dosage = pickString(item, ['dosage', 'dose', 'quantity'])
          const frequency = pickString(item, ['frequency', 'dose_frequency', 'frequency_text'])
          const durationValue = pickString(item, ['duration', 'duration_value', 'days'])
          const durationUnit = pickString(item, ['duration_unit', 'durationType', 'time_period_unit'])
          const interval = pickString(item, ['interval', 'time_interval'])
          const instructions = pickString(item, ['notes', 'instructions', 'description', 'details'])
          const badge = pickBooleanLike(item, ['is_edited', 'edited', 'isEdited']) ? 'Edited' : ''

          const durationText = formatDurationText(durationValue, durationUnit)
          const scheduleParts = [frequency, durationText].filter(Boolean)
          const dosageText = [dosage, interval].filter(Boolean).join(' ')
          if (dosageText) scheduleParts.push(dosageText)

          return {
            title,
            meta: scheduleParts.join(', '),
            metaColor: 'deepDark',
            description: instructions,
            badge
          }
        })
      })
    }

    const labTests = pickArray(row, [
      'lab_tests',
      'lab_test_details',
      'tests',
      'treatments.lab_tests',
      'medical_details.lab_tests'
    ])

    if (labTests.length) {
      const labTestEntries = labTests.map(item => {
        if (typeof item === 'string') {
          return { title: item }
        }

        const title = pickString(item, ['test_name', 'name', 'title']) || 'Lab Test'
        const description = pickString(item, ['notes', 'description', 'details'])
        const status = pickString(item, ['status'])

        const tags = pickArray(item, ['parameters', 'sub_tests']).map(param =>
          pickString(param, ['name', 'parameter_name', 'title'])
        )

        return {
          title,
          description,
          meta: status,
          metaColor: 'default',
          tags: tags.filter(Boolean)
        }
      })

      sections.push({
        key: 'lab_tests',
        icon: '/icons/labtest.svg',
        label: 'Lab Test',
        items: labTestEntries
      })
    }

    const clinicalAssessments = pickArray(row, [
      'clinical_assessments',
      'clinical_assessment_details',
      'assessments',
      'treatments.clinical_assessments',
      'medical_details.clinical_assessments'
    ])

    if (clinicalAssessments.length) {
      sections.push({
        key: 'clinical_assessments',
        icon: '/icons/clinicalassessments.svg',
        label: 'Clinical Assessments',
        items: clinicalAssessments.map(item => {
          if (typeof item === 'string') {
            return { title: item }
          }

          const title = pickString(item, ['assessment_name', 'assessment', 'name', 'title']) || 'Clinical assessment'
          const status = pickString(item, ['status'])
          const diagnosis = pickString(item, ['diagnosis'])
          const chronicity = pickString(item, ['chronicity', 'chronic_status'])
          const severity = pickString(item, ['severity', 'grade'])
          const description = pickString(item, ['notes', 'description', 'details'])
          const badge = pickBooleanLike(item, ['is_edited', 'edited', 'isEdited']) ? 'Edited' : ''
          const metaParts = [status, diagnosis, chronicity, severity].filter(Boolean)

          return {
            title,
            meta: metaParts.join(' • '),
            metaColor: 'default',
            description,
            badge
          }
        })
      })
    }

    const advices = pickArray(row, [
      'advices',
      'advice_details',
      'dietary_advice',
      'treatments.advices',
      'medical_details.advices'
    ])

    if (advices.length) {
      sections.push({
        key: 'advice',
        icon: '/icons/advice.svg',
        label: 'Advice',
        items: advices.map(item => {
          if (typeof item === 'string') {
            return { description: item }
          }

          const title = pickString(item, ['title', 'category', 'name'])
          const description = pickString(item, ['notes', 'description', 'details', 'message', 'content'])
          const meta = pickString(item, ['author', 'given_by', 'recommended_by'])

          return {
            title,
            description,
            meta,
            metaColor: 'default'
          }
        })
      })
    }

    return sections
  }

  const renderTreatmentCell = row => {
    const sections = buildTreatmentSections(row)

    if (!sections.length) {
      const fallbackTitle = pickString(row, ['master_enrichment_type']) || 'Observation'
      const fallbackSubtitle = pickString(row, ['child_enrichment_type'])
      const fallbackDetails = pickString(row, ['details'])

      return (
        <Box sx={{ width: '100%', py: 2 }}>
          <ObservationCard
            title={fallbackTitle}
            description={fallbackSubtitle || fallbackDetails || 'Details not available'}
            containerStyle={{ my: 2 }}
          />
        </Box>
      )
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px', py: 2, width: '100%' }}>
        {sections.map(section => (
          <Box key={section.key} sx={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', pt: 0.5 }}>
              <Box
                component='img'
                src={section.icon}
                alt={`${section.label} icon`}
                sx={{ width: 20, height: 20, minWidth: 20, minHeight: 20 }}
              />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 400,
                  fontStyle: 'italic',
                  letterSpacing: 0,
                  color: theme.palette.customColors.OnSurfaceVariant
                }}
              >
                {section.label}
              </Typography>
              {section.items.map((item, idx) => (
                <Box
                  key={`${section.key}-${idx}`}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    mb: idx === section.items.length - 1 ? 0 : 1
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                    {item.title ? (
                      <Typography
                        sx={{
                          fontSize: '14px',
                          fontWeight: 600,
                          letterSpacing: 0,
                          color: theme.palette.customColors.OnSurfaceVariant
                        }}
                      >
                        {item.title}
                      </Typography>
                    ) : null}
                    {item.badge ? (
                      <Box
                        component='span'
                        sx={{
                          display: 'inline-flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          width: 46,
                          height: 19,
                          borderRadius: '2px',
                          background: '#00000080'
                        }}
                      >
                        <Typography
                          sx={{
                            fontWeight: 500,
                            fontSize: '12px',
                            letterSpacing: '2%',
                            color: '#FFFFFF'
                          }}
                        >
                          {item.badge}
                        </Typography>
                      </Box>
                    ) : null}
                  </Box>
                  {item.meta ? (
                    <Typography
                      sx={{
                        fontSize: '14px',
                        fontWeight: 400,
                        letterSpacing: 0,
                        color:
                          item.metaColor === 'deepDark'
                            ? theme.palette.customColors.deepDark
                            : theme.palette.customColors.OnSurfaceVariant
                      }}
                    >
                      {item.meta}
                    </Typography>
                  ) : null}
                  {item.description ? (
                    <Typography
                      sx={{
                        fontSize: '14px',
                        fontWeight: 400,
                        letterSpacing: 0,
                        color: theme.palette.customColors.OnSurfaceVariant
                      }}
                    >
                      {item.description}
                    </Typography>
                  ) : null}
                  {Array.isArray(item.tags) && item.tags.length ? (
                    <Typography
                      sx={{
                        fontSize: '14px',
                        fontWeight: 400,
                        letterSpacing: 0,
                        color: theme.palette.customColors.OnSurfaceVariant
                      }}
                    >
                      {item.tags.join(' • ')}
                    </Typography>
                  ) : null}
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    )
  }

  const renderMedicalIdCell = row => {
    const medicalId = pickString(row, [
      'medical_id',
      'medical_journal_id',
      'journal_id',
      'medical_reference',
      'reference_id',
      'visit_id',
      'id'
    ])
    const fallbackId = medicalId || `MED-${pickString(row, ['sl_no']) || 'N/A'}`
    const dateValue = pickFirstValue(row, ['date_time', 'created_at', 'updated_at', 'date'])

    const formattedDisplayDate =
      formatDateLabel(dateValue) || (dateValue ? format(new Date(dateValue), 'dd MMM yyyy') : '')

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 500,
            letterSpacing: '0.1px',
            color: theme.palette.customColors.OnSurfaceVariant
          }}
        >
          {fallbackId}
        </Typography>
        {formattedDisplayDate ? (
          <Typography
            sx={{
              fontSize: '12px',
              fontWeight: 400,
              letterSpacing: 0,
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            {formattedDisplayDate}
          </Typography>
        ) : null}
      </Box>
    )
  }

  const renderNotesCell = row => {
    const note = pickString(row, ['notes', 'note', 'medical_notes', 'additional_notes', 'remarks', 'details']) || 'N/A'

    return (
      <Tooltip title={note === 'N/A' ? '' : note} placement='bottom' arrow>
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 400,
            letterSpacing: 0,
            color:
              note === 'N/A' ? theme.palette.customColors.neutralTeritary : theme.palette.customColors.OnSurfaceVariant,
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'normal',
            lineHeight: '20px'
          }}
        >
          {note}
        </Typography>
      </Tooltip>
    )
  }

  const columns = [
    {
      width: 90,
      field: 'sl_no',
      headerName: 'S NO.',
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: params => (
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 400,
            letterSpacing: 0,
            color: theme.palette.customColors.OnSurfaceVariant
          }}
        >
          {String(params.row.sl_no || '').padStart(2, '0')}
        </Typography>
      )
    },
    {
      width: 200,
      field: 'medical_id',
      headerName: 'MEDICAL ID',
      sortable: false,
      renderCell: params => renderMedicalIdCell(params.row)
    },
    {
      flex: 1.2,
      minWidth: 420,
      field: 'treatments',
      headerName: 'TREATMENTS & OBSERVATIONS',
      sortable: false,
      renderCell: params => renderTreatmentCell(params.row)
    },
    {
      flex: 0.8,
      minWidth: 260,
      field: 'notes',
      headerName: 'NOTES',
      sortable: false,
      renderCell: params => renderNotesCell(params.row)
    }
  ]

  const handleDateRangeChange = (startDate, endDate) => {
    if (startDate && endDate) {
      const formattedStartDate = Utility.formatDate(startDate)
      const formattedEndDate = Utility.formatDate(endDate)
      setFilterDates({
        startDate: formattedStartDate,
        endDate: formattedEndDate
      })
    } else {
      setFilterDates({
        startDate: '',
        endDate: ''
      })
    }
  }

  const downloadObservationReport = async () => {
    try {
      setIsDownloading(true)
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.error('Error preparing report preview:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  const clearAnimalSelection = () => {
    setSelectedAnimal(null)

    const { animal_id, ...rest } = router.query
    router.push(
      {
        pathname: router.pathname,
        query: rest
      },
      undefined,
      { shallow: false }
    )
  }

  const headerAction = (
    <Box sx={{ display: 'flex', gap: '24px' }}>
      <DownloadReport isDownloading={isDownloading} handleDownloadReport={downloadObservationReport} />
      <Box
        sx={{
          backgroundColor: '#0000000D',
          height: '32px',
          width: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50px'
        }}
      >
        <IconButton onClick={clearAnimalSelection}>
          <Icon icon='mdi:close' color='red' fontSize={24} />
        </IconButton>
      </Box>
    </Box>
  )

  const handleSearchChange = e => {
    const value = e.target.value
    setSearchValue(value)

    if (paginationModel.page !== 0) {
      setPaginationModel(prev => ({ ...prev, page: 0 }))
    }

    debouncedGetObservationReport(value)
  }

  return (
    <>
      {selectedAnimal ? (
        <>
          <Card>
            <CardHeader title={title} action={headerAction} sx={{ pl: 8, pb: 0 }} />
            <Box sx={{ p: 5 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderRadius: '8px',
                  background: '#E8F4F2',
                  p: '16px'
                }}
              >
                <AnimalCard data={selectedAnimal} sx={{ border: 'none', background: 'none' }} animal={true} />
              </Box>
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexDirection: { sm: 'row', xs: 'column' },
                justifyContent: { sm: 'space-between', xs: 'flex-start' },
                alignItems: 'center',
                gap: 4
              }}
            >
              <Box sx={{ width: '100%', px: 6 }}>
                <Search
                  onChange={handleSearchChange}
                  borderRadius='4px'
                  placeholder='Search by date or observation type'
                  value={searchValue}
                  inputStyle={{ py: '10px', px: '12px' }}
                  width={{ xs: '100%', sm: '60%', md: '50%' }}
                  sx={{
                    '& .MuiInputBase-input::placeholder': {
                      fontSize: '14px',
                      fontWeight: 400
                    }
                  }}
                />
              </Box>

              <Box sx={{ px: 6, width: { xs: '100%', sm: '70%' } }}>
                <CommonDateRangePickers
                  filterDates={filterDates}
                  onChange={handleDateRangeChange}
                  useCustomText={true}
                  customText='Select a Date Range'
                />
              </Box>
            </Box>
            <Grid
              sx={{
                margin: '0px 1.375rem 0px 1.375rem'
              }}
            >
              <CommonTable
                columns={columns}
                indexedRows={indexedRows}
                loading={loading}
                total={total}
                getRowHeight={() => 'auto'}
                paginationModel={paginationModel}
                setPaginationModel={setPaginationModel}
                searchValue={searchValue}
                onPaginationModelChange={model => {
                  setPaginationModel(model)
                  router.replace({
                    pathname: router.pathname,
                    query: {
                      ...router.query,
                      page: model.page + 1,
                      pageSize: model.pageSize,
                      searchValue
                    }
                  })
                }}
              />
            </Grid>
          </Card>
        </>
      ) : animalLoader ? (
        <Box display='flex' justifyContent='center' alignItems='center'>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Card sx={{ p: 6 }}>
            <CardHeader title={title} sx={{ pt: 0, pb: 4 }} />
            <ReportCard
              subtitle='No animal selected'
              description='Select any animal to view its medical journal report'
              buttonText='SELECT ANIMAL'
              addHandler={reportCardEventHandler}
            />
          </Card>
        </>
      )}

      {animalDrawer && (
        <AnimalDrawer
          open={animalDrawer}
          onClose={() => setAnimalDrawer(false)}
          selectedAnimal={selectedAnimal}
          setSelectedAnimal={setSelectedAnimal}
          handleAnimalClick={handleAnimalSelect}
        />
      )}
    </>
  )
}

export default MedicalJournalReport
