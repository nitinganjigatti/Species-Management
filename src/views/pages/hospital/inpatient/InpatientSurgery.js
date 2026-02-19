import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'

import { Button, Tooltip, Typography, Skeleton } from '@mui/material'
import { Box, Grid } from '@mui/system'
import { alpha, useTheme } from '@mui/material/styles'
import dayjs from 'dayjs'

import Toaster from 'src/components/Toaster'
import Utility from 'src/utility'
import DeleteConfirmationDialog from 'src/views/utility/DeleteConfirmationDialog'
import NoMedicalData from 'src/views/utility/NoMedicalData'
import FilePreviewCard from 'src/views/utility/NewMediaCard'

import { deleteSurgeryRecord, getPatientSurgeryList } from 'src/lib/api/hospital/surgeryMaster'

const FieldTooltip = ({ title = '', placement = 'top-start', children }) => {
  if (!title) {
    return children
  }

  return (
    <Tooltip
      title={title}
      placement={placement}
      arrow
      PopperProps={{
        modifiers: [
          {
            name: 'offset',
            options: { offset: [0, 6] }
          }
        ]
      }}
    >
      {children}
    </Tooltip>
  )
}

const TabSkeletons = () => (
  <>
    {Array.from({ length: 5 }).map((_, index) => (
      <Skeleton key={`surgery-tab-skeleton-${index}`} variant='rounded' width={110 + (index % 3) * 12} height={48} />
    ))}
  </>
)

const htmlToPlainText = value => {
  if (!value) return ''
  if (typeof value !== 'string') return String(value)

  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const getRichTextHtmlValue = value => {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (value?.html) return value.html
  if (value?.text) return value.text
  if (value?.delta?.ops) {
    try {
      const text = value.delta.ops.map(op => (typeof op.insert === 'string' ? op.insert : '')).join('')

      return text
    } catch {
      return ''
    }
  }

  return ''
}

const formatDateValue = value => {
  if (!value) return '--'

  try {
    const converted = Utility.convertUtcToLocalReadableDate(value)

    if (converted && converted !== 'Invalid date') {
      return converted
    }

    const fallback = Utility.convertUTCToLocalDate(value)

    return fallback && fallback !== 'Invalid date' ? fallback : String(value)
  } catch {
    return String(value)
  }
}

const formatTimeValue = (time, date) => {
  if (!time) return '--'

  const source = date ? `${date} ${time}` : time

  try {
    const converted = Utility.convertUTCToLocaltime(source)

    return converted && converted !== 'Invalid date' ? converted : String(time)
  } catch {
    return String(time)
  }
}

const getDurationLabel = detail => {
  if (!detail) return '--'
  if (detail.duration) return String(detail.duration)

  const { start_time: startTime, end_time: endTime } = detail

  if (!startTime || !endTime) return '--'

  const start = dayjs(`1970-01-01T${startTime}`)
  const end = dayjs(`1970-01-01T${endTime}`)

  if (!start.isValid() || !end.isValid()) return '--'

  const diffMinutes = end.diff(start, 'minute')

  if (diffMinutes <= 0) return '--'

  const hours = Math.floor(diffMinutes / 60)
  const minutes = diffMinutes % 60

  if (hours && minutes) return `${hours}h ${minutes}m`
  if (hours) return `${hours}h`

  return `${minutes}m`
}

const parseProcedurePerformed = value => {
  if (!value) return []
  if (Array.isArray(value)) return value.map(String).filter(item => item.trim() !== '')

  const text = htmlToPlainText(value)

  if (!text) return []

  return text
    .split(/[\r\n]+|•/g)
    .map(item => item.replace(/^[•\-\s]+/, '').trim())
    .filter(Boolean)
}

const getRecordIdentifier = record => {
  if (!record || typeof record !== 'object') return ''
  if (record.id !== undefined && record.id !== null) return String(record.id)
  if (record.detail?.id !== undefined && record.detail?.id !== null) return String(record.detail.id)
  if (record.code !== undefined && record.code !== null) return String(record.code)

  return ''
}

const getRecordCode = record => {
  if (!record || typeof record !== 'object') return ''

  return record.code || record.detail?.code || ''
}

const MediaScroller = ({ items = [] }) => {
  const theme = useTheme()
  const scrollbarThumbColor = theme.palette.customColors.neutralSecondary

  if (!Array.isArray(items) || items.length === 0) {
    return (
      <Typography
        sx={{
          color: 'text.secondary',
          px: 2
        }}
      >
        No attachments available.
      </Typography>
    )
  }

  return (
    <Box
      sx={{
        width: '100%',
        overflowX: 'auto',
        py: 2,
        '&::-webkit-scrollbar': { height: '2px !important' },
        '&::-webkit-scrollbar-track': { background: 'transparent' },
        '&::-webkit-scrollbar-thumb': { background: scrollbarThumbColor, borderRadius: '6px' },
        scrollbarWidth: 'thin',
        scrollbarColor: `${scrollbarThumbColor} transparent`
      }}
    >
      <Box
        sx={{
          display: 'flex',
          gap: 4,
          px: 2
        }}
      >
        {items.map((item, index) => {
          const key = item?.id ?? `${item?.file || item?.file_original_name || 'attachment'}-${index}`

          return (
            <FilePreviewCard
              key={key}
              width={'240px'}
              fileUrl={item?.file}
              fileName={item?.file_original_name}
              fileType={item?.file_type}
              user={{
                created_at: item?.created_at,
                modified_at: item?.modified_at,
                user_profile: {
                  user_full_name: item?.user_full_name,
                  user_profile_pic: item?.user_profile_pic
                }
              }}
              showTitle={true}
            />
          )
        })}
      </Box>
    </Box>
  )
}

function InpatientSurgery({ hospitalCaseId, medicalRecordId, patientDischarged = false }) {
  const theme = useTheme()
  const scrollbarThumbColor = theme.palette.customColors.neutralSecondary
  const router = useRouter()
  const headerBackground = alpha(theme.palette.customColors.displaybgPrimary, 153 / 255)
  const [surgeryRecords, setSurgeryRecords] = useState([])
  const [activeSurgeryId, setActiveSurgeryId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const resolvedHospitalCaseId = hospitalCaseId || ''

  useEffect(() => {
    let isMounted = true

    const fetchSurgeryRecords = async () => {
      if (!resolvedHospitalCaseId) {
        if (isMounted) {
          setSurgeryRecords([])
          setActiveSurgeryId('')
          setError('')
          setLoading(false)
        }

        return
      }

      setLoading(true)
      setError('')

      try {
        const response = await getPatientSurgeryList({ params: { hospital_case_id: resolvedHospitalCaseId } })
        const records = Array.isArray(response?.data?.surgery_records) ? response.data.surgery_records : []

        if (!isMounted) return

        setSurgeryRecords(records)
        setActiveSurgeryId(prevActive => {
          if (prevActive && records.some(record => getRecordIdentifier(record) === prevActive)) {
            return prevActive
          }

          const firstRecord = records[0]

          return firstRecord ? getRecordIdentifier(firstRecord) : ''
        })
      } catch (fetchError) {
        console.error('Failed to load surgery records', fetchError)
        if (!isMounted) return
        const message = fetchError?.response?.data?.message || fetchError?.message || 'Failed to load surgery records.'

        setError(message)
        setSurgeryRecords([])
        setActiveSurgeryId('')
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchSurgeryRecords()

    return () => {
      isMounted = false
    }
  }, [resolvedHospitalCaseId])

  const handleAddSurgeryRecord = () => {
    const query = {}

    if (resolvedHospitalCaseId) {
      query.hospital_case_id = resolvedHospitalCaseId
    }

    if (medicalRecordId) {
      query.medical_record_id = medicalRecordId
    }

    const href =
      Object.keys(query).length > 0
        ? { pathname: '/hospital/inpatient/AddSurgeryRecord', query }
        : '/hospital/inpatient/AddSurgeryRecord'

    router.push(href)
  }

  const activeRecord = useMemo(() => {
    if (!surgeryRecords.length) return null
    if (activeSurgeryId) {
      const found = surgeryRecords.find(record => getRecordIdentifier(record) === activeSurgeryId)
      if (found) return found
    }

    return surgeryRecords[0] ?? null
  }, [surgeryRecords, activeSurgeryId])

  const activeSurgeryRecordId = useMemo(() => {
    if (activeRecord?.id !== undefined && activeRecord?.id !== null) return String(activeRecord.id)
    if (activeRecord?.detail?.id !== undefined && activeRecord?.detail?.id !== null)
      return String(activeRecord.detail.id)

    return activeSurgeryId || ''
  }, [activeRecord, activeSurgeryId])

  const deleteDisabled = deleteLoading || loading || !activeSurgeryRecordId

  const handleDeleteClick = useCallback(() => {
    if (!activeSurgeryRecordId || deleteLoading) return

    setDeleteDialogOpen(true)
  }, [activeSurgeryRecordId, deleteLoading])

  const handleDeleteDialogClose = useCallback(() => {
    if (deleteLoading) return

    setDeleteDialogOpen(false)
  }, [deleteLoading])

  const handleDeleteConfirm = useCallback(async () => {
    if (!activeSurgeryRecordId) return

    try {
      setDeleteLoading(true)
      const response = await deleteSurgeryRecord(activeSurgeryRecordId)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || 'Surgery record deleted successfully.' })
        setSurgeryRecords(prevRecords => {
          const updatedRecords = prevRecords.filter(record => getRecordIdentifier(record) !== activeSurgeryRecordId)
          const hasActive = updatedRecords.some(record => getRecordIdentifier(record) === activeSurgeryId)
          if (!hasActive) {
            const nextRecord = updatedRecords[0]
            setActiveSurgeryId(nextRecord ? getRecordIdentifier(nextRecord) : '')
          }

          return updatedRecords
        })
      } else {
        const message =
          response?.message || response?.reason || response?.data?.message || 'Unable to delete surgery record.'
        Toaster({ type: 'error', message })
      }
    } catch (deleteError) {
      const message = deleteError?.response?.data?.message || deleteError?.message || 'Failed to delete surgery record.'
      Toaster({ type: 'error', message })
    } finally {
      setDeleteLoading(false)
      setDeleteDialogOpen(false)
    }
  }, [activeSurgeryId, activeSurgeryRecordId, deleteSurgeryRecord])

  const activeDetail = activeRecord?.detail ?? null

  const surgeryCode = getRecordCode(activeRecord)

  const handleViewAnesthesiaDetails = useCallback(() => {
    if (!resolvedHospitalCaseId) return

    const query = { tab: 'anesthesia' }
    if (medicalRecordId) {
      query.medical_record_id = medicalRecordId
    }
    if (activeDetail?.anaesthesia_id) {
      query.anaesthesia_id = activeDetail.anaesthesia_id
    }

    router.push({ pathname: `/hospital/inpatient/${resolvedHospitalCaseId}`, query })
  }, [activeDetail?.anaesthesia_id, medicalRecordId, resolvedHospitalCaseId, router])

  const canViewAnesthesia = Boolean(resolvedHospitalCaseId)

  const basicDetails = useMemo(() => {
    const detail = activeDetail || {}

    return [
      { label: 'Date', value: formatDateValue(detail.surgery_date) },
      { label: 'Surgery Duration', value: getDurationLabel(detail) },
      { label: 'Start Time', value: formatTimeValue(detail.start_time, detail.surgery_date) },
      { label: 'End Time', value: formatTimeValue(detail.end_time, detail.surgery_date) }
    ]
  }, [activeDetail])

  const surgeryDetailItems = useMemo(() => {
    const detail = activeDetail || {}

    return [
      { label: 'Procedure Name', value: detail.surgery_name || '--' },
      { label: 'Surgical Approach', value: detail.surgical_approach || '--' },
      { label: 'Type Of Surgery', value: detail.type_of_surgery || '--' },
      { label: 'Name Of Surgeon', value: detail.name_of_surgeon || '--' }
    ]
  }, [activeDetail])

  const findingsText = useMemo(() => htmlToPlainText(activeDetail?.findings), [activeDetail])
  const hemostasisText = useMemo(() => htmlToPlainText(activeDetail?.hemostasis), [activeDetail])
  const closureText = useMemo(() => htmlToPlainText(activeDetail?.closure), [activeDetail])
  const complicationText = useMemo(() => htmlToPlainText(activeDetail?.complications) || '--', [activeDetail])

  const surgeryNotesContent = useMemo(() => {
    const html = getRichTextHtmlValue(activeDetail?.surgery_notes)
    const text = html ? htmlToPlainText(html) : ''

    return {
      html,
      text: text || '--'
    }
  }, [activeDetail])

  const procedurePerformedList = useMemo(
    () => parseProcedurePerformed(activeDetail?.procedure_performed),
    [activeDetail]
  )

  const careInstructionItems = useMemo(() => {
    const detail = activeDetail || {}

    return [
      { label: 'Diet Instructions', value: htmlToPlainText(detail.care_diet_instructions) || '--' },
      { label: 'Restrictions', value: htmlToPlainText(detail.care_activity_restrictions) || '--' },
      { label: 'Additional Notes', value: htmlToPlainText(detail.additional_notes) || '--' }
    ]
  }, [activeDetail])

  const attachments = useMemo(
    () => (Array.isArray(activeDetail?.attachments) ? activeDetail.attachments : []),
    [activeDetail]
  )

  const anesthesiaInfo = useMemo(() => {
    const detail = activeDetail?.anaesthesia_detail || {}

    return {
      code: detail?.code || '--',
      datetime: formatDateValue(detail?.anaesthesia_datetime)
    }
  }, [activeDetail])

  const renderTabContent = () => {
    if (loading) {
      return <TabSkeletons />
    }

    if (error) {
      return (
        <Typography
          sx={{
            color: theme.palette.error.main,
            whiteSpace: 'nowrap'
          }}
        >
          {error}
        </Typography>
      )
    }

    // if (!surgeryRecords.length) {
    //   return (
    //     <Typography
    //       sx={{
    //         color: theme.palette.customColors.neutralSecondary,
    //         whiteSpace: 'nowrap'
    //       }}
    //     >
    //       No surgery records found.
    //     </Typography>
    //   )
    // }
    if (!surgeryRecords.length) return null

    return surgeryRecords.map((record, index) => {
      const recordId = getRecordIdentifier(record)
      const code = record?.code || record?.detail?.code || `Record ${index + 1}`
      const isActive = recordId === activeSurgeryId

      return (
        <Box
          key={recordId || `${code}-${index}`}
          onClick={() => setActiveSurgeryId(recordId)}
          sx={{
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            px: '16px',
            height: '48px',
            borderRadius: '8px',
            backgroundColor: isActive ? theme.palette.secondary.dark : theme.palette.customColors.mdAntzNeutral,
            cursor: 'pointer'
          }}
        >
          <Typography
            sx={{
              color: isActive ? theme.palette.primary.contrastText : theme.palette.customColors.neutralPrimary,
              whiteSpace: 'nowrap'
            }}
          >
            {code}
          </Typography>
        </Box>
      )
    })
  }

  const DetailsHeader = ({ text }) => (
    <Box sx={{ backgroundColor: headerBackground, padding: '8px', borderRadius: '4px' }}>
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

  const renderSkeletonLayout = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <Skeleton variant='text' width={220} height={32} />
        <Skeleton variant='text' width={140} height={20} />
      </Box>

      <Typography
        sx={{
          fontWeight: 400,
          fontSize: '16px',
          color: theme.palette.customColors.neutralSecondary,
          textAlign: 'center'
        }}
      >
        Fetching surgery records...
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Box sx={{ backgroundColor: headerBackground, padding: '8px', borderRadius: '4px' }}>
          <Skeleton variant='text' width={160} height={24} />
        </Box>
        <Grid sx={{ px: '8px' }} container spacing={4}>
          {Array.from({ length: 4 }).map((_, idx) => (
            <Grid item size={{ xs: 6, md: 3 }} key={`basic-skeleton-${idx}`}>
              <Skeleton variant='text' width='60%' height={16} />
              <Skeleton variant='text' width='80%' height={22} />
            </Grid>
          ))}
        </Grid>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Box sx={{ backgroundColor: headerBackground, padding: '8px', borderRadius: '4px' }}>
          <Skeleton variant='text' width={180} height={24} />
        </Box>
        <Box sx={{ px: '8px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Grid container spacing={4}>
            {Array.from({ length: 3 }).map((_, idx) => (
              <Grid item size={{ xs: 12, sm: 6, md: 4 }} key={`surgery-skeleton-${idx}`}>
                <Skeleton variant='text' width='50%' height={16} />
                <Skeleton variant='text' width='70%' height={24} />
              </Grid>
            ))}
          </Grid>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Array.from({ length: 3 }).map((_, idx) => (
              <Skeleton key={`notes-skeleton-${idx}`} variant='text' height={20} />
            ))}
            <Skeleton variant='text' width='40%' height={20} />
          </Box>
          <Skeleton variant='text' width='35%' height={20} />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Box sx={{ backgroundColor: headerBackground, padding: '8px', borderRadius: '4px' }}>
          <Skeleton variant='text' width={200} height={24} />
        </Box>
        <Box sx={{ px: '8px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {Array.from({ length: 3 }).map((_, idx) => (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }} key={`care-skeleton-${idx}`}>
              <Skeleton variant='text' width='30%' height={18} />
              <Skeleton variant='text' height={60} />
            </Box>
          ))}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Box sx={{ backgroundColor: headerBackground, padding: '8px', borderRadius: '4px' }}>
          <Skeleton variant='text' width={180} height={24} />
        </Box>
        <Box
          sx={{
            width: '100%',
            overflowX: 'auto',
            py: 2,
            '&::-webkit-scrollbar': { height: '2px !important' },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': { background: scrollbarThumbColor, borderRadius: '6px' },
            scrollbarWidth: 'thin',
            scrollbarColor: `${scrollbarThumbColor} transparent`
          }}
        >
          <Box sx={{ display: 'inline-flex', gap: 2, px: 2 }}>
            {Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={`attachment-skeleton-${idx}`} variant='rounded' width={240} height={200} />
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  )

  const shouldShowDetails = Boolean(activeRecord)
  const shouldShowEmptyState = !shouldShowDetails && !loading && !error

  return (
    <>
      <Box sx={{ mt: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: '24px'
          }}
        >
          <Box
            sx={{
              flex: '1 1 auto',
              minWidth: 0,
              overflowX: 'auto',
              scrollbarColor: 'transparent transparent'
            }}
          >
            <Box sx={{ display: 'inline-flex', gap: '10px', pr: 1, alignItems: 'center', minHeight: '48px' }}>
              {renderTabContent()}
            </Box>
          </Box>

          {loading ||
            (!patientDischarged && !shouldShowEmptyState && (
              <Button
                onClick={handleAddSurgeryRecord}
                variant='contained'
                sx={{ flex: '0 0 auto', whiteSpace: 'nowrap', height: '48px' }}
              >
                Add SURGERY RECORD
              </Button>
            ))}
        </Box>

        {!shouldShowDetails ? (
          loading ? (
            renderSkeletonLayout()
          ) : (
            <Box
              sx={{
                py: 6,
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              {error ? (
                <Typography sx={{ color: theme.palette.error.main }}>{error}</Typography>
              ) : (
                <Box
                  sx={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <NoMedicalData
                    btnText={'ADD NEW SURGERY RECORD'}
                    text={'All Added Surgery Records Will Appear here'}
                    isDischarged={patientDischarged}
                    btnAction={handleAddSurgeryRecord}
                  />
                </Box>
                // <NoDataFound variant='Seal' height={300} width={300} />
              )}
            </Box>
          )
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <Typography
                  sx={{
                    fontWeight: 500,
                    fontSize: '24px',
                    letterSpacing: 0,
                    color: theme.palette.customColors.OnSurfaceVariant
                  }}
                >
                  Surgery Details
                </Typography>
                {surgeryCode && (
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: '14px',
                      letterSpacing: 0,
                      color: theme.palette.customColors.OnPrimaryContainer
                    }}
                  >
                    {surgeryCode}
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {!patientDischarged && (
                  <Box
                    component='img'
                    src='/icons/pencil_outlined.svg'
                    alt='Edit'
                    sx={{ width: 24, height: 24, cursor: 'pointer' }}
                    onClick={() => {
                      if (!activeSurgeryRecordId) return

                      const query = {}
                      if (resolvedHospitalCaseId) query.hospital_case_id = resolvedHospitalCaseId
                      if (medicalRecordId) query.medical_record_id = medicalRecordId
                      query.id = activeSurgeryRecordId

                      router.push({ pathname: '/hospital/inpatient/AddSurgeryRecord', query })
                    }}
                  />
                )}
                {!patientDischarged && (
                  <Box
                    component='img'
                    src='/icons/delete_outlined.svg'
                    alt='Delete'
                    sx={{
                      width: 24,
                      height: 24,
                      cursor: deleteDisabled ? 'not-allowed' : 'pointer',
                      opacity: deleteDisabled ? 0.4 : 1
                    }}
                    onClick={deleteDisabled ? undefined : handleDeleteClick}
                  />
                )}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <DetailsHeader text={'Basic details'} />
              <Grid sx={{ px: '8px' }} container spacing={4}>
                {basicDetails.map(detail => (
                  <Grid item size={{ xs: 12, sm: 6, md: 3 }} key={detail.label}>
                    <FieldTooltip title={detail.label}>
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
                        {detail.label}
                      </Typography>
                    </FieldTooltip>
                    <FieldTooltip title={detail.value}>
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
                        {detail.value}
                      </Typography>
                    </FieldTooltip>
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <DetailsHeader text={'Anaesthesia details'} />
              <Box
                sx={{
                  px: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 400,
                    fontSize: '14px',
                    color: theme.palette.customColors.neutralSecondary,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span>Anaesthesia Id</span>
                  <Typography
                    component='span'
                    sx={{
                      fontWeight: 500,
                      fontSize: '16px',
                      color: theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    {anesthesiaInfo.code}
                  </Typography>
                  <Typography
                    component='span'
                    sx={{
                      fontWeight: 500,
                      fontSize: '16px',
                      color: theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    |
                  </Typography>
                  <Typography
                    component='span'
                    sx={{
                      fontWeight: 500,
                      fontSize: '16px',
                      color: theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    {anesthesiaInfo.datetime}
                  </Typography>
                </Typography>
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: '16px',
                    color: theme.palette.primary.OnSurface || theme.palette.primary.main,
                    cursor: canViewAnesthesia ? 'pointer' : 'not-allowed',
                    opacity: canViewAnesthesia ? 1 : 0.6
                  }}
                  onClick={canViewAnesthesia ? handleViewAnesthesiaDetails : undefined}
                >
                  View details
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <DetailsHeader text={'Surgery details'} />
              <Box sx={{ px: '8px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <Grid container spacing={4}>
                  {surgeryDetailItems.map(item => (
                    <Grid item size={{ xs: 12, sm: 6, md: 4 }} key={item.label}>
                      <FieldTooltip title={item.label}>
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
                          {item.label}
                        </Typography>
                      </FieldTooltip>
                      <FieldTooltip title={item.value}>
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
                          {item.value}
                        </Typography>
                      </FieldTooltip>
                    </Grid>
                  ))}
                </Grid>
                <Box sx={{ mt: 2 }}>
                  <Typography
                    sx={{
                      mb: '4px',
                      fontWeight: 400,
                      fontSize: '14px',
                      letterSpacing: 0,
                      color: theme.palette.customColors.neutralSecondary
                    }}
                  >
                    Surgery notes
                  </Typography>
                  {/* <FieldTooltip title={surgeryNotesContent.text}> */}
                  <FieldTooltip>
                    <Box
                      sx={{
                        fontWeight: 400,
                        fontSize: '16px',
                        letterSpacing: 0,
                        color: theme.palette.customColors.OnSurfaceVariant,
                        mb: 1.5,
                        lineHeight: 1.5,
                        '& p': { margin: 0 },
                        '& ul': { paddingLeft: '1.5rem', margin: '8px 0' },
                        '& ol': { paddingLeft: '1.5rem', margin: '8px 0' }
                      }}
                      dangerouslySetInnerHTML={{
                        __html: surgeryNotesContent.html || '<span>--</span>'
                      }}
                    />
                  </FieldTooltip>

                  {findingsText && (
                    <FieldTooltip title={`Findings: ${findingsText}`}>
                      <Typography
                        sx={{
                          fontWeight: 400,
                          fontSize: '16px',
                          letterSpacing: 0,
                          color: theme.palette.customColors.OnSurfaceVariant,
                          mb: 1.5,
                          display: '-webkit-box',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        <strong>Findings:</strong> {findingsText}
                      </Typography>
                    </FieldTooltip>
                  )}

                  {procedurePerformedList.length > 0 && (
                    <>
                      <Typography
                        sx={{
                          fontWeight: 400,
                          fontSize: '16px',
                          letterSpacing: 0,
                          color: theme.palette.customColors.OnSurfaceVariant,
                          mb: 1
                        }}
                      >
                        Procedure Performed:
                      </Typography>
                      <Box component='ul' sx={{ ml: '-8px', mt: 0, mb: 1 }}>
                        {procedurePerformedList.map((item, idx) => (
                          <li key={`${item}-${idx}`}>
                            <FieldTooltip title={item}>
                              <Typography
                                component='span'
                                sx={{
                                  fontWeight: 400,
                                  fontSize: '16px',
                                  letterSpacing: 0,
                                  color: theme.palette.customColors.OnSurfaceVariant,
                                  display: '-webkit-box',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical'
                                }}
                              >
                                {item}
                              </Typography>
                            </FieldTooltip>
                          </li>
                        ))}
                      </Box>
                    </>
                  )}

                  {hemostasisText && (
                    <Typography
                      sx={{
                        fontWeight: 400,
                        fontSize: '16px',
                        letterSpacing: 0,
                        color: theme.palette.customColors.OnSurfaceVariant,
                        mb: 0.5
                      }}
                    >
                      <strong>Hemostasis:</strong> {hemostasisText}
                    </Typography>
                  )}

                  {closureText && (
                    <Typography
                      sx={{
                        fontWeight: 400,
                        fontSize: '16px',
                        letterSpacing: 0,
                        color: theme.palette.customColors.OnSurfaceVariant
                      }}
                    >
                      <strong>Closure:</strong> {closureText}
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Typography
                    sx={{
                      // mb: '4px',
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
                    Complication
                  </Typography>
                  <FieldTooltip title={complicationText}>
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
                      {complicationText}
                    </Typography>
                  </FieldTooltip>
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <DetailsHeader text={'Care instructions'} />
              <Box sx={{ px: '8px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {careInstructionItems.map(item => (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }} key={item.label}>
                    <FieldTooltip title={item.label}>
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
                        {item.label}
                      </Typography>
                    </FieldTooltip>
                    <FieldTooltip title={item.value}>
                      <Typography
                        sx={{
                          fontWeight: 400,
                          fontSize: '16px',
                          letterSpacing: 0,
                          color: theme.palette.customColors.OnSurfaceVariant,
                          textTransform: 'capitalize',
                          display: '-webkit-box',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {item.value}
                      </Typography>
                    </FieldTooltip>
                  </Box>
                ))}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <DetailsHeader text={'ATTACHMENTS'} />
              <MediaScroller items={attachments} />
            </Box>
          </Box>
        )}
      </Box>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        loading={deleteLoading}
        handleClose={handleDeleteDialogClose}
        action={handleDeleteConfirm}
        message='Are you sure you want to delete this surgery record?'
      />
    </>
  )
}

export default InpatientSurgery
