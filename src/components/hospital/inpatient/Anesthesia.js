import {
  Button,
  Tooltip,
  Typography,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material'
import { Box, Grid } from '@mui/system'
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useTheme } from '@mui/material/styles'
import MediaCard from 'src/views/utility/MediaCard'
import { useRouter } from 'next/router'
import { alpha } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import { useInfiniteQuery } from '@tanstack/react-query'
import PrescriptionMonitoringGrid from '../prescriptionMonitoring/PrescriptionMonitoringGrid'
import VitalMonitoring from './Anesthesia/VitalMonitoring'
import VitalMonitoringDetail from './Anesthesia/vitalForms/VitalMonitoringDetail'
import { getAnesthesiaList } from 'src/lib/api/hospital/anesthesia'
import Utility from 'src/utility'

const anesthesiaDetails = {
  fluids: 'Sample Fluid - 10 ml/hr',
  catheterSetUp: 'IV',
  syringePump: '100 ml/hr',
  etIntubation: '2mm, 4mm, 6mm',
  nasalIntubation: 'Sample Fluid - 10 ml/hr',
  ventilation: 'Yes'
}

const preanesthesiaDetails = {
  temperature: '38 oC',
  humidity: '68 %'
}

const recoveryDetails = {
  recoveryType: 'Normal',
  recovery1stEffect: '12:20 AM',
  recoveryFullEffect: '12:45 AM'
}

const recoveryDetailsProblem = {
  recoveryType: 'Problem',
  recovery1stEffect: '12:20 AM',
  recoveryFullEffect: '12:45 AM'
}

const anaesthesiaRatings = {
  induction: 'Normal',
  tolerance: '--',
  recovery: '--',
  overall: 'Good'
}

const anesthesiaExamDetails = {
  physicalHealthStatus: 'Class I Normal Health',
  bodyCondition: 'Obese/fat',
  activity: 'Calm',
  fastingTime: '8 hours',
  previousEndotrachealTubeSize: '2 mm',
  weight: '1045.88 kg',
  codeStatus: 'R (Resuscitate)'
}

const careInstructions = {
  dietInstructions:
    "The surgery was executed flawlessly, with no complications reported during the procedure. The patient remained stable throughout the operation, and a smooth recovery is anticipated. Follow-up evaluations are set for 14 stable throughout the operation, and a smooth recovery is anticipated. Follow-up evaluations are set for 14 stable throughout the operation, and a smooth recovery is anticipated. Follow-up evaluations are set for 14 stable throughout the operation, and a smooth recovery is anticipated. Follow-up evaluations are set for 14 stable throughout the operation, and a smooth recovery is anticipated. Follow-up evaluations are set for 14 August 2024, ensuring ongoing monitoring of the patient's progress.",
  restrictions:
    "The surgery was executed flawlessly, with no complications reported during the procedure. The patient remained stable throughout the operation, and a smooth recovery is anticipated. Follow-up evaluations are set for 14 August 2024, ensuring ongoing monitoring of the patient's progress.",
  additionalNotes:
    "The surgery was executed flawlessly, with no complications reported during the procedure. The patient remained stable throughout the operation, and a smooth recovery is anticipated. Follow-up evaluations are set for 14 August 2024, ensuring ongoing monitoring of the patient's progress."
}

// ✅ Data as variable
const surgeryNotes = {
  paragraph:
    "The surgery was executed flawlessly, with no complications reported during the procedure. The patient remained stable throughout the operation, and a smooth recovery is anticipated. Follow-up evaluations are set for 14 August 2024, ensuring ongoing monitoring of the patient's progress.",
  findings: 'Intestinal foreign body lodged in jejunum',
  procedurePerformed: [
    'Enterotomy performed',
    'Foreign body removed',
    'Intestine lavaged and sutured using absorbable suture material (Vicryl 3-0)'
  ],
  hemostasis: 'Achieve',
  closure: 'Three-layer closure with absorbable sutures for internal layers, nylon for skin'
}

// ✅ Sample data (JSON-like JS object)
const mediaItems = [
  {
    id: 'm1',
    file_original_name: 'Antz Yelahanka Site Visit - Photos.jpg',
    file: 'https://example.com/media/site-visit-photo.jpg',
    type: 'image',
    created_at: '2025-08-12T12:23:00Z'
  },
  {
    id: 'm2',
    file_original_name: 'Antz Yelahanka Site Visit - Report.pdf',
    file: 'https://example.com/media/site-visit-report.pdf',
    type: 'document',
    created_at: '2025-08-12T12:23:00Z'
  },
  {
    id: 'm3',
    file_original_name: 'Antz Yelahanka Site Visit - Walkthrough.mp4',
    file: 'https://example.com/media/walkthrough.mp4',
    type: 'video',
    created_at: '2025-08-12T12:23:00Z'
  },
  {
    id: 'm4',
    file_original_name: 'Antz Yelahanka Site Visit - Sheet.xlsx',
    file: 'https://example.com/media/visit-sheet.xlsx',
    type: 'document',
    created_at: '2025-08-12T12:23:00Z'
  },
  {
    id: 'm5',
    file_original_name: 'Enclosure Reference Image.png',
    file: 'https://example.com/media/enclosure.png',
    type: 'image',
    created_at: '2025-08-12T12:23:00Z'
  },
  {
    id: 'm6',
    file_original_name: 'Site Voice Note.m4a',
    file: 'https://example.com/media/voice-note.m4a',
    type: 'audio',
    created_at: '2025-08-12T12:23:00Z'
  }
]

const monitoring = [
  'Pulse ox',
  'Probe, rectal',
  'Tongue',
  'Thermometer',
  'Heated Table',
  'Bair hugger',
  'Doppler',
  'Stethoscope',
  'ECG',
  'BP',
  'Capnography',
  'Pediatric',
  'Adult'
]

const PAGE_SIZE = 10
const SCROLL_FETCH_THRESHOLD = 140

const resolveValue = value => (Array.isArray(value) ? value[0] : value)

const resolveHospitalCaseId = (propValue, query) => {
  if (propValue !== undefined && propValue !== null && propValue !== '') {
    const resolved = resolveValue(propValue)

    if (resolved !== undefined && resolved !== null && resolved !== '') {
      return resolved
    }
  }

  const possibleKeys = ['hospital_case_id', 'hospitalCaseId', 'case_id', 'caseId', 'id']

  for (const key of possibleKeys) {
    if (query?.[key] !== undefined) {
      const resolved = resolveValue(query[key])

      if (resolved !== undefined && resolved !== null && resolved !== '') {
        return resolved
      }
    }
  }

  return undefined
}

const resolveMedicalRecordId = (patientData, query) => {
  const medicalRecordFromPatient = resolveValue(patientData?.medical_record_id)

  if (medicalRecordFromPatient) {
    return medicalRecordFromPatient
  }

  const possibleKeys = [
    'medical_record_id',
    'medicalRecordId',
    'medicalRecordID',
    'medical_recordId',
    'med_id',
    'medical_id'
  ]

  for (const key of possibleKeys) {
    if (query?.[key] !== undefined) {
      const resolved = resolveValue(query[key])

      if (resolved !== undefined && resolved !== null && resolved !== '') {
        return resolved
      }
    }
  }

  return undefined
}

const getRecordIdentifier = record => {
  if (!record || typeof record !== 'object') return ''

  if (record.anaesthesia_id) return String(record.anaesthesia_id)
  if (record.id) return String(record.id)
  if (record.code) return String(record.code)

  return ''
}

const getStableRecordId = (record, index = 0) => {
  const identifier = getRecordIdentifier(record)

  if (identifier) return identifier
  if (record?.code) return String(record.code)

  return `record-${index}`
}

const formatDateTime = value => {
  if (!value) return '--'

  const formatted = Utility.convertUTCToLocalDateTime(value)

  return formatted && formatted !== 'Invalid date' ? formatted : String(value)
}

const formatStaffNames = list => {
  if (!Array.isArray(list) || !list.length) return '--'

  const names = list
    .map(item => item?.full_name || item?.name)
    .filter(Boolean)
    .join(', ')

  return names || '--'
}

const MediaScroller = () => {
  return (
    <Box
      sx={{
        // container that takes full width, allows horizontal scroll
        width: '100%',
        overflowX: 'auto',
        py: 2,

        // (optional) slim scrollbar — will work when OS shows classic scrollbars
        '&::-webkit-scrollbar': { height: '2px !important' },
        '&::-webkit-scrollbar-track': { background: 'transparent' },
        '&::-webkit-scrollbar-thumb': { background: '#BDBDBD', borderRadius: '6px' },
        scrollbarWidth: 'thin',
        scrollbarColor: '#BDBDBD transparent'
      }}
    >
      <Box
        sx={{
          display: 'inline-flex',
          gap: 2, // space between cards
          px: 2
        }}
      >
        {mediaItems.map(item => (
          <Box
            key={item.id}
            sx={{
              width: 240,
              flexShrink: 0
            }}
          >
            <MediaCard media={item} isBorderedCard />
          </Box>
        ))}
      </Box>
    </Box>
  )
}

function Anesthesia({ hospitalCaseId, patientData }) {
  const theme = useTheme()
  const router = useRouter()
  const scrollContainerRef = useRef(null)

  const resolvedHospitalCaseId = useMemo(
    () => resolveHospitalCaseId(hospitalCaseId, router?.query),
    [hospitalCaseId, router?.query]
  )

  const resolvedMedicalRecordId = useMemo(
    () => resolveMedicalRecordId(patientData, router?.query),
    [patientData, router?.query]
  )

  const shouldFetchRecords = Boolean(resolvedHospitalCaseId && resolvedMedicalRecordId)

  const {
    data: anesthesiaPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isAnesthesiaLoading,
    error: anesthesiaError,
    isFetching: isFetchingRecords
  } = useInfiniteQuery({
    queryKey: ['anesthesiaRecords', resolvedHospitalCaseId, resolvedMedicalRecordId],
    queryFn: ({ pageParam = 1 }) =>
      getAnesthesiaList({
        params: {
          hospital_case_id: resolvedHospitalCaseId,
          medical_record_id: resolvedMedicalRecordId,
          limit: PAGE_SIZE,
          page_no: pageParam
        }
      }),
    getNextPageParam: lastPage => {
      const pagination = lastPage?.data

      if (!pagination) return undefined

      const currentPage = Number(pagination.page_no) || 0
      const totalPages = Number(pagination.total_pages) || 0

      return currentPage < totalPages ? currentPage + 1 : undefined
    },
    enabled: shouldFetchRecords
  })

  const anesthesiaRecords = useMemo(() => {
    if (!anesthesiaPages?.pages?.length) return []

    return anesthesiaPages.pages.flatMap(page => (Array.isArray(page?.data?.records) ? page.data.records : []))
  }, [anesthesiaPages])

  const [activeRecordId, setActiveRecordId] = useState('')

  useEffect(() => {
    if (!anesthesiaRecords.length) {
      setActiveRecordId('')

      return
    }

    setActiveRecordId(prev => {
      if (prev && anesthesiaRecords.some((record, index) => getStableRecordId(record, index) === prev)) {
        return prev
      }

      return getStableRecordId(anesthesiaRecords[0], 0)
    })
  }, [anesthesiaRecords])

  const activeRecord = useMemo(() => {
    if (!anesthesiaRecords.length) return null

    if (activeRecordId) {
      const found = anesthesiaRecords.find((record, index) => getStableRecordId(record, index) === activeRecordId)

      if (found) return found
    }

    return anesthesiaRecords[0]
  }, [anesthesiaRecords, activeRecordId])

  const recordCode = activeRecord?.code || '--'
  const lastUpdatedValue = formatDateTime(activeRecord?.updated_at || activeRecord?.created_at)

  const basicDetails = useMemo(() => {
    const estimatedTime = activeRecord?.estimated_time_required
      ? `${activeRecord.estimated_time_required} ${activeRecord.estimated_time_unit || ''}`.trim()
      : '--'

    return {
      location: activeRecord?.location || '--',
      dateAndTimeOfAnesthesia: formatDateTime(activeRecord?.anaesthesia_datetime),
      estimatedTimeRequired: estimatedTime || '--',
      Veterinarian: formatStaffNames(activeRecord?.veterinarians),
      Anesthetists: formatStaffNames(activeRecord?.anesthetists)
    }
  }, [activeRecord])

  const purposeItems = useMemo(() => {
    if (!Array.isArray(activeRecord?.purpose)) return []

    return activeRecord.purpose
      .map(item => item?.name)
      .filter(name => typeof name === 'string' && name.trim() !== '')
  }, [activeRecord])

  const notesText = activeRecord?.notes?.trim() ? activeRecord.notes : '--'

  const isRecordsLoading = isAnesthesiaLoading || (isFetchingRecords && !anesthesiaRecords.length)

  const handleScrollFetch = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return

    const node = scrollContainerRef.current

    if (!node) return

    const { scrollLeft, scrollWidth, clientWidth } = node

    if (scrollWidth - (scrollLeft + clientWidth) < SCROLL_FETCH_THRESHOLD) {
      fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  useEffect(() => {
    const node = scrollContainerRef.current

    if (!node) return

    const onScroll = () => {
      handleScrollFetch()
    }

    node.addEventListener('scroll', onScroll)

    return () => {
      node.removeEventListener('scroll', onScroll)
    }
  }, [handleScrollFetch])

  useEffect(() => {
    if (!shouldFetchRecords) return

    handleScrollFetch()
  }, [handleScrollFetch, shouldFetchRecords, anesthesiaRecords.length])

  const renderRecordTabs = () => {
    if (!shouldFetchRecords) {
      return (
        <Typography
          sx={{ color: theme.palette.customColors.neutralSecondary, whiteSpace: 'nowrap' }}
        >
          Provide hospital case & medical record IDs to view anesthesia records.
        </Typography>
      )
    }

    if (isRecordsLoading) {
      return (
        <Typography sx={{ color: theme.palette.customColors.neutralSecondary, whiteSpace: 'nowrap' }}>
          Loading anesthesia records...
        </Typography>
      )
    }

    if (anesthesiaError) {
      const message =
        anesthesiaError?.response?.data?.message || anesthesiaError?.message || 'Failed to load anesthesia records.'

      return (
        <Typography color='error' sx={{ whiteSpace: 'nowrap' }}>
          {message}
        </Typography>
      )
    }

    if (!anesthesiaRecords.length) {
      return (
        <Typography sx={{ color: theme.palette.customColors.neutralSecondary, whiteSpace: 'nowrap' }}>
          No anesthesia records found.
        </Typography>
      )
    }

    return anesthesiaRecords.map((record, index) => {
      const label = record?.code || `Record ${index + 1}`
      const selectionId = getStableRecordId(record, index)
      const isActive = selectionId === activeRecordId

      return (
        <Box
          key={selectionId}
          onClick={() => setActiveRecordId(selectionId)}
          sx={{
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            px: '16px',
            height: '48px',
            borderRadius: '8px',
            backgroundColor: isActive
              ? theme.palette.secondary.dark
              : theme.palette.customColors.mdAntzNeutral,
            cursor: 'pointer'
          }}
        >
          <Typography
            sx={{
              color: isActive ? theme.palette.primary.contrastText : theme.palette.customColors.neutralPrimary,
              whiteSpace: 'nowrap'
            }}
          >
            {label}
          </Typography>
        </Box>
      )
    })
  }

  const medicationData = [
    {
      drug: 'Ketamine 100 MG Tablet',
      purpose: 'Induction',
      amount: '10 mg',
      route: 'Intramuscular',
      deliveryTime: '12:00 AM',
      deliveryStatus: 'Completed',
      maxEffect: '12:00 AM',
      notes: 'Time taken for effect looks normal'
    },
    {
      drug: 'Propofol 200 MG Tablet',
      purpose: 'Pre Med',
      amount: '10 mg',
      route: 'Subcutaneous',
      deliveryTime: '12:20 AM',
      deliveryStatus: 'Partial',
      maxEffect: '12:20 AM',
      notes: '-'
    },
    {
      drug: 'Fentanyl 50 MCG Tablet',
      purpose: 'Intra Operative',
      amount: '10 mg',
      route: 'Subcutaneous',
      deliveryTime: '12:20 AM',
      deliveryStatus: 'Partial',
      maxEffect: '12:20 AM',
      notes: '-'
    }
  ]

  const gasData = [
    {
      gas: 'Halothane',
      o2: '100 mg',
      concentration: '3',
      route: 'Subcutaneous',
      startTime: '5:00 AM',
      endTime: '6:00 AM'
    },
    {
      gas: 'Desflurane',
      o2: '50 mg',
      concentration: '2',
      route: 'Subcutaneous',
      startTime: '3:00 AM',
      endTime: '4:00 AM'
    },
    {
      gas: 'Sevoflurane',
      o2: '20 mg',
      concentration: '2',
      route: 'Intramuscular',
      startTime: '1:00 AM',
      endTime: '2:00 AM'
    }
  ]

  const reversalDrugData = [
    {
      drug: 'Ketamine 100 MG Tablet',
      amount: '10 mg',
      route: 'Intramuscular',
      deliveryTime: '12:00 AM',
      deliveryStatus: 'Completed',
      maxEffect: '12:00 AM'
    },
    {
      drug: 'Propofol 200 MG Tablet',
      amount: '10 mg',
      route: 'Subcutaneous',
      deliveryTime: '12:20 AM',
      deliveryStatus: 'Partial',
      maxEffect: '12:20 AM'
    },
    {
      drug: 'Fentanyl 50 MCG Tablet',
      amount: '10 mg',
      route: 'Subcutaneous',
      deliveryTime: '12:20 AM',
      deliveryStatus: 'Partial',
      maxEffect: '12:20 AM'
    }
  ]

  const tableStyles = {
    '& tr': {
      height: '55px'
    },
    '& th': {
      fontWeight: 600,
      fontSize: '12px',
      color: theme.palette.customColors.OnSurfaceVariant,
      backgroundColor: theme.palette.customColors.displaybgSecondary,
      textTransform: 'uppercase'
    },
    '& td': {
      fontSize: '14px',
      fontWeight: 500,
      color: theme.palette.customColors.OnSurfaceVariant,
      borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`,
      maxWidth: 180,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },
    '& tr:last-child td': {
      borderBottom: 'none'
    }
  }

  // Helper to render each cell with tooltip
  const renderCell = text => (
    <Tooltip title={text || '-'} placement='bottom-start' arrow>
      <Box
        sx={{
          maxWidth: 180,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        {text || '-'}
      </Box>
    </Tooltip>
  )

  const handleAddSurgeryRecord = () => {
    const resolvedCaseId = resolvedHospitalCaseId
    const animalId = resolveValue(router?.query?.animal_id)

    const href = resolvedCaseId
      ? {
          pathname: `/hospital/inpatient/AddAnesthesiaRecord/`,
          query: {
            hospital_case_id: resolvedCaseId,
            medical_record_id: patientData?.medical_record_id,
            hospital_id: patientData?.hospital_id,
            animal_id: animalId
          }
        }
      : '/hospital/inpatient/AddAnesthesiaRecord'

    router.push(href)
  }

  const DetailsHeader = ({ text }) => (
    <Box sx={{ backgroundColor: '#E8F4F299', padding: '8px', borderRadius: '4px' }}>
      <Typography
        sx={{
          fontWeight: 500,
          fontSize: '20px',
          letterSpacing: 0,
          color: theme.palette.customColors.OnPrimaryContainer
        }}
      >
        {text}
      </Typography>
    </Box>
  )

  return (
    <Box sx={{ mt: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },

          gap: '24px'
        }}
      >
        <Box
          ref={scrollContainerRef}
          sx={{
            flex: '1 1 auto',
            minWidth: 0,
            overflowX: 'auto',
            scrollbarColor: 'transparent transparent'
          }}
        >
          <Box sx={{ display: 'inline-flex', gap: '10px', pr: 1, alignItems: 'center' }}>
            {renderRecordTabs()}
            {isFetchingNextPage && anesthesiaRecords.length ? (
              <Typography sx={{ color: theme.palette.customColors.neutralSecondary, whiteSpace: 'nowrap' }}>
                Loading more...
              </Typography>
            ) : null}
          </Box>
        </Box>

        <Button
          onClick={handleAddSurgeryRecord}
          variant='contained'
          sx={{ flex: '0 0 auto', whiteSpace: 'nowrap', height: '48px' }}
        >
          Add Anesthesia
        </Button>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: '24px',
              letterSpacing: 0,
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            Anesthesia Details
          </Typography>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: '14px',
                  color: theme.palette.customColors.OnPrimaryContainer
                }}
              >
                {recordCode}
              </Typography>

              <Typography
                sx={{
                  fontWeight: 400,
                  fontSize: '12px',
                  color: theme.palette.customColors.OnSurfaceVariant
                }}
              >
                Last updated : {lastUpdatedValue}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer' }}>
              <Icon color={theme.palette.primary.dark} icon='mdi:pencil-outline' fontSize={20} />
              <Icon color={theme.palette.primary.dark} icon='mdi:delete-outline' fontSize={20} />
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <DetailsHeader text={'Basic details'} />
          <Grid sx={{ px: '8px' }} container spacing={4}>
            {Object.entries(basicDetails).map(([label, value]) => (
              <Grid item size={{ xs: 6, md: 4 }} key={label}>
                <Tooltip title={label.replace(/([A-Z])/g, ' $1')} placement='bottom-start' arrow>
                  <Typography
                    sx={{
                      mb: '4px',
                      fontWeight: 400,
                      fontSize: '14px',
                      letterSpacing: 0,
                      color: theme.palette.customColors.neutralSecondary,
                      textTransform: 'capitalize',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {label.replace(/([A-Z])/g, ' $1')}
                  </Typography>
                </Tooltip>
                <Tooltip title={value} placement='bottom-start' arrow>
                  <Typography
                    sx={{
                      fontWeight: 400,
                      fontSize: '16px',
                      letterSpacing: 0,
                      color: theme.palette.customColors.OnSurfaceVariant,
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {value}
                  </Typography>
                </Tooltip>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '16px', fontWeight: 600 }}>
            Purpose of Anaesthesia
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {purposeItems.length ? (
              purposeItems.map((item, index) => (
                <Chip
                  key={`${item}-${index}`}
                  label={item}
                  sx={{
                    backgroundColor: alpha(theme.palette.customColors.SecondaryContainer, 0.5),
                    color: theme.palette.customColors.OnPrimaryContainer,
                    fontWeight: 500,
                    fontSize: '14px',
                    border: `1px solid ${theme.palette.customColors.SecondaryContainer}`,
                    borderRadius: '6px',
                    '& .MuiChip-label': { px: 2, py: 0.5 }
                  }}
                />
              ))
            ) : (
              <Typography sx={{ color: theme.palette.customColors.neutralSecondary }}>No purpose added.</Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          <Typography sx={{ color: theme.palette.customColors.secondaryBg, fontSize: '14px', fontWeight: 400 }}>
            Notes
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '16px', fontWeight: 500 }}>
              {notesText}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <DetailsHeader text={'Anesthesia Set Up'} />
          <Grid sx={{ px: '8px' }} container spacing={4}>
            {Object.entries(anesthesiaDetails).map(([label, value]) => (
              <Grid item size={{ xs: 12, sm: 6, md: 4 }} key={label}>
                <Tooltip title={label.replace(/([A-Z])/g, ' $1')} placement='bottom-start' arrow>
                  <Typography
                    sx={{
                      mb: '4px',
                      fontWeight: 400,
                      fontSize: '14px',
                      letterSpacing: 0,
                      color: theme.palette.customColors.neutralSecondary,
                      textTransform: 'capitalize',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {label.replace(/([A-Z])/g, ' $1')}
                  </Typography>
                </Tooltip>
                <Tooltip title={value} placement='bottom-start' arrow>
                  <Typography
                    sx={{
                      fontWeight: 500,
                      fontSize: '16px',
                      letterSpacing: 0,
                      color: theme.palette.customColors.OnSurfaceVariant,
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {value}
                  </Typography>
                </Tooltip>
              </Grid>
            ))}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Typography
                sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '16px', fontWeight: 600 }}
              >
                Monitoring
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {monitoring.map((item, index) => (
                  <Chip
                    key={index}
                    label={item}
                    sx={{
                      backgroundColor: alpha(theme.palette.customColors.SecondaryContainer, 0.5),
                      color: theme.palette.customColors.OnPrimaryContainer,
                      fontWeight: 500,
                      fontSize: '14px',
                      border: `1px solid ${theme.palette.customColors.SecondaryContainer}`,
                      borderRadius: '6px',
                      '& .MuiChip-label': { px: 2, py: 0.5 }
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Grid>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <DetailsHeader text={'Pre Anesthesia'} />

          <Box
            sx={{
              px: '8px',
              //height: '20px',
              display: 'flex',
              flexWrap: 'wrap',
              columnGap: '4px',
              rowGap: '10px',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <Typography
                sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '16px', fontWeight: 600 }}
              >
                Environmental Condition
              </Typography>
            </Box>
            <Grid sx={{ px: '0px' }} container spacing={4}>
              {Object.entries(preanesthesiaDetails).map(([label, value]) => (
                <Grid item size={{ xs: 12, sm: 6, md: 4 }} key={label}>
                  <Tooltip title={label.replace(/([A-Z])/g, ' $1')} placement='bottom-start' arrow>
                    <Typography
                      sx={{
                        mb: '4px',
                        fontWeight: 400,
                        fontSize: '14px',
                        letterSpacing: 0,
                        color: theme.palette.customColors.neutralSecondary,
                        textTransform: 'capitalize',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {label.replace(/([A-Z])/g, ' $1')}
                    </Typography>
                  </Tooltip>
                  <Tooltip title={value} placement='bottom-start' arrow>
                    <Typography
                      sx={{
                        fontWeight: 500,
                        fontSize: '16px',
                        letterSpacing: 0,
                        color: theme.palette.customColors.OnSurfaceVariant,
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {value}
                    </Typography>
                  </Tooltip>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Divider />

          <Box
            sx={{
              px: '8px',
              //height: '20px',
              display: 'flex',
              flexWrap: 'wrap',
              columnGap: '4px',
              rowGap: '10px',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <Typography
                sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '16px', fontWeight: 600 }}
              >
                Pre Anesthetic Examination
              </Typography>
            </Box>
            <Grid sx={{ px: '0px' }} container spacing={4}>
              {Object.entries(anesthesiaExamDetails).map(([label, value]) => (
                <Grid item size={{ xs: 12, sm: 6, md: 4 }} key={label}>
                  <Tooltip title={label.replace(/([A-Z])/g, ' $1')} placement='bottom-start' arrow>
                    <Typography
                      sx={{
                        mb: '4px',
                        fontWeight: 400,
                        fontSize: '14px',
                        letterSpacing: 0,
                        color: theme.palette.customColors.neutralSecondary,
                        textTransform: 'capitalize',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {label.replace(/([A-Z])/g, ' $1')}
                    </Typography>
                  </Tooltip>
                  <Tooltip title={value} placement='bottom-start' arrow>
                    <Typography
                      sx={{
                        fontWeight: 500,
                        fontSize: '16px',
                        letterSpacing: 0,
                        color: theme.palette.customColors.OnSurfaceVariant,
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {value}
                    </Typography>
                  </Tooltip>
                </Grid>
              ))}
            </Grid>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mt: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <Typography
                  sx={{
                    mb: '4px',
                    fontWeight: 400,
                    fontSize: '14px',
                    letterSpacing: 0,
                    color: theme.palette.customColors.neutralSecondary,
                    textTransform: 'capitalize',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Risk of Concern
                </Typography>
                <Tooltip title={'None'} placement='bottom-start' arrow>
                  <Typography
                    sx={{
                      fontWeight: 400,
                      fontSize: '16px',
                      letterSpacing: 0,
                      color: theme.palette.customColors.OnSurfaceVariant,
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    None
                  </Typography>
                </Tooltip>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <Typography
                  sx={{
                    mb: '4px',
                    fontWeight: 400,
                    fontSize: '14px',
                    letterSpacing: 0,
                    color: theme.palette.customColors.neutralSecondary,
                    textTransform: 'capitalize',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Clin Path
                </Typography>
                <Tooltip title={'None'} placement='bottom-start' arrow>
                  <Typography
                    sx={{
                      fontWeight: 400,
                      fontSize: '16px',
                      letterSpacing: 0,
                      color: theme.palette.customColors.OnSurfaceVariant,
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    CBC, QUADS, Other( Liver function , Kidney Function)
                  </Typography>
                </Tooltip>
              </Box>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <DetailsHeader text={'Medication & Gas'} />
          <Box sx={{ mb: 4 }}>
            <Typography
              variant='subtitle1'
              sx={{
                fontWeight: 600,
                mb: 1,
                color: theme.palette.text.primary
              }}
            >
              Medication - 3
            </Typography>

            <TableContainer
              component={Paper}
              variant='outlined'
              sx={{
                borderRadius: '8px!important',
                overflow: 'hidden',
                boxShadow: 'none',
                border: `1px solid ${theme.palette.customColors.OutlineVariant}`
              }}
            >
              <Table size='small' sx={tableStyles}>
                <TableHead>
                  <TableRow>
                    <TableCell>Drug</TableCell>
                    <TableCell>Purpose/Stage</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Route</TableCell>
                    <TableCell>Delivery Time</TableCell>
                    <TableCell>Delivery Status</TableCell>
                    <TableCell>Max Effect</TableCell>
                    <TableCell>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {medicationData.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{renderCell(row.drug)}</TableCell>
                      <TableCell>{renderCell(row.purpose)}</TableCell>
                      <TableCell>{renderCell(row.amount)}</TableCell>
                      <TableCell>{renderCell(row.route)}</TableCell>
                      <TableCell>{renderCell(row.deliveryTime)}</TableCell>
                      <TableCell>{renderCell(row.deliveryStatus)}</TableCell>
                      <TableCell>{renderCell(row.maxEffect)}</TableCell>
                      <TableCell>{renderCell(row.notes)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Box>
            <Typography
              variant='subtitle1'
              sx={{
                fontWeight: 600,
                mb: 1,
                color: theme.palette.text.primary
              }}
            >
              Gas - 3
            </Typography>

            <TableContainer
              component={Paper}
              variant='outlined'
              sx={{
                borderRadius: '8px!important',
                overflow: 'hidden',
                boxShadow: 'none',
                border: `1px solid ${theme.palette.customColors.OutlineVariant}`
              }}
            >
              <Table size='small' sx={tableStyles}>
                <TableHead>
                  <TableRow sx={{ height: '55px' }}>
                    <TableCell>Gas</TableCell>
                    <TableCell>O2 L/Min</TableCell>
                    <TableCell>Concentration %</TableCell>
                    <TableCell>Route</TableCell>
                    <TableCell>Start Time</TableCell>
                    <TableCell>End Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {gasData.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{renderCell(row.gas)}</TableCell>
                      <TableCell>{renderCell(row.o2)}</TableCell>
                      <TableCell>{renderCell(row.concentration)}</TableCell>
                      <TableCell>{renderCell(row.route)}</TableCell>
                      <TableCell>{renderCell(row.startTime)}</TableCell>
                      <TableCell>{renderCell(row.endTime)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>

        <Grid xs={12}>
          {/* <PrescriptionMonitoringGrid
          // onOpenPrescriptionCard={handleOpenPrescriptionCard}
          // medications={medicationData}
          // isLoading={isPrescriptionListLoading}
          // // medications={medication}
          // dates={dates}
          // selectedDate={selectedDate}
          // handleDateChange={handleDateChange}
          /> */}
          <VitalMonitoringDetail />
        </Grid>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <DetailsHeader text={'Recovery & Reversal'} />
          <Box sx={{ mb: 4 }}>
            <Typography
              variant='subtitle1'
              sx={{
                fontWeight: 600,
                mb: 1,
                color: theme.palette.text.primary
              }}
            >
              Reversal drug - 2
            </Typography>

            <TableContainer
              component={Paper}
              variant='outlined'
              sx={{
                borderRadius: '8px!important',
                overflow: 'hidden',
                boxShadow: 'none',
                border: `1px solid ${theme.palette.customColors.OutlineVariant}`
              }}
            >
              <Table size='small' sx={tableStyles}>
                <TableHead>
                  <TableRow>
                    <TableCell>Drug Name</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Route</TableCell>
                    <TableCell>Delivery Time</TableCell>
                    <TableCell>Delivery </TableCell>
                    <TableCell>Max Effect</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reversalDrugData.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{renderCell(row.drug)}</TableCell>
                      <TableCell>{renderCell(row.amount)}</TableCell>
                      <TableCell>{renderCell(row.route)}</TableCell>
                      <TableCell>{renderCell(row.deliveryTime)}</TableCell>
                      <TableCell>{renderCell(row.deliveryStatus)}</TableCell>
                      <TableCell>{renderCell(row.maxEffect)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Box
              sx={{
                px: '8px',
                //height: '20px',
                display: 'flex',
                flexWrap: 'wrap',
                columnGap: '4px',
                rowGap: '10px',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <Typography
                  sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '16px', fontWeight: 600 }}
                >
                  Recovery Details
                </Typography>
              </Box>
              <Grid sx={{ px: '0px' }} container spacing={4}>
                {Object.entries(recoveryDetails).map(([label, value]) => (
                  <Grid item size={{ xs: 12, sm: 6, md: 4 }} key={label}>
                    <Tooltip title={label.replace(/([A-Z])/g, ' $1')} placement='bottom-start' arrow>
                      <Typography
                        sx={{
                          mb: '4px',
                          fontWeight: 400,
                          fontSize: '14px',
                          letterSpacing: 0,
                          color: theme.palette.customColors.neutralSecondary,
                          textTransform: 'capitalize',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {label.replace(/([A-Z])/g, ' $1')}
                      </Typography>
                    </Tooltip>
                    <Tooltip title={value} placement='bottom-start' arrow>
                      <Typography
                        sx={{
                          fontWeight: 500,
                          fontSize: '16px',
                          letterSpacing: 0,
                          color: theme.palette.customColors.OnSurfaceVariant,
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {value}
                      </Typography>
                    </Tooltip>
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Divider />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Box
              sx={{
                px: '8px',
                display: 'flex',
                flexWrap: 'wrap',
                columnGap: '4px',
                rowGap: '10px',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <Typography
                  sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '16px', fontWeight: 600 }}
                >
                  Recovery Details
                </Typography>
              </Box>
              <Grid sx={{ px: '0px' }} container spacing={4}>
                {Object.entries(recoveryDetailsProblem).map(([label, value]) => (
                  <Grid item size={{ xs: 12, sm: 6, md: 4 }} key={label}>
                    <Tooltip title={label.replace(/([A-Z])/g, ' $1')} placement='bottom-start' arrow>
                      <Typography
                        sx={{
                          mb: '4px',
                          fontWeight: 400,
                          fontSize: '14px',
                          letterSpacing: 0,
                          color: theme.palette.customColors.neutralSecondary,
                          textTransform: 'capitalize',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {label.replace(/([A-Z])/g, ' $1')}
                      </Typography>
                    </Tooltip>
                    <Tooltip title={value} placement='bottom-start' arrow>
                      <Typography
                        sx={{
                          fontWeight: 500,
                          fontSize: '16px',
                          letterSpacing: 0,
                          color: theme.palette.customColors.OnSurfaceVariant,
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {value}
                      </Typography>
                    </Tooltip>
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Box
              sx={{
                px: '8px',
                //height: '20px',
                display: 'flex',
                flexWrap: 'wrap',
                columnGap: '4px',
                rowGap: '10px',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mt: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  <Typography
                    sx={{
                      mb: '4px',
                      fontWeight: 400,
                      fontSize: '14px',
                      letterSpacing: 0,
                      color: theme.palette.customColors.neutralSecondary,
                      textTransform: 'capitalize',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Describe the Problem
                  </Typography>
                  <Tooltip title={'None'} placement='bottom-start' arrow>
                    <Typography
                      sx={{
                        fontWeight: 400,
                        fontSize: '16px',
                        letterSpacing: 0,
                        color: theme.palette.customColors.OnSurfaceVariant,
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Lorem ipsum
                    </Typography>
                  </Tooltip>
                </Box>
              </Box>
              <Box sx={{ gap: '3px', background: '#FCF4AE', width: '100%', px: 4, py: 2, borderRadius: '8px' }}>
                <Typography
                  sx={{
                    mb: '4px',
                    fontWeight: 400,
                    fontSize: '14px',
                    letterSpacing: 0,
                    color: theme.palette.customColors.neutralSecondary,
                    textTransform: 'capitalize',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Notes
                </Typography>
                <Tooltip title={'None'} placement='bottom-start' arrow>
                  <Typography
                    sx={{
                      fontWeight: 500,
                      fontSize: '16px',
                      letterSpacing: 0,
                      color: theme.palette.customColors.OnSurfaceVariant,
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Calm and responsive, BAR within 15 minutes
                  </Typography>
                </Tooltip>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Box
                sx={{
                  px: '8px',
                  mt: 3,
                  display: 'flex',
                  flexWrap: 'wrap',
                  columnGap: '4px',
                  rowGap: '10px',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <Typography
                    sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '16px', fontWeight: 600 }}
                  >
                    Anesthesia Ratings
                  </Typography>
                </Box>
                <Grid sx={{ px: '0px' }} container spacing={4}>
                  {Object.entries(anaesthesiaRatings).map(([label, value]) => (
                    <Grid item size={{ xs: 12, sm: 6, md: 3 }} key={label}>
                      <Tooltip title={label.replace(/([A-Z])/g, ' $1')} placement='bottom-start' arrow>
                        <Typography
                          sx={{
                            mb: '4px',
                            fontWeight: 400,
                            fontSize: '14px',
                            letterSpacing: 0,
                            color: theme.palette.customColors.neutralSecondary,
                            textTransform: 'capitalize',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {label.replace(/([A-Z])/g, ' $1')}
                        </Typography>
                      </Tooltip>
                      <Tooltip title={value} placement='bottom-start' arrow>
                        <Typography
                          sx={{
                            fontWeight: 500,
                            fontSize: '16px',
                            letterSpacing: 0,
                            color: theme.palette.customColors.OnSurfaceVariant,
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {value}
                        </Typography>
                      </Tooltip>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <DetailsHeader text={'ATTACHMENTS'} />
          <MediaScroller />
        </Box>
      </Box>
    </Box>
  )
}

export default Anesthesia
