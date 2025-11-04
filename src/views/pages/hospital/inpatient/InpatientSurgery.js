import { Button, Tooltip, Typography } from '@mui/material'
import { Box, Grid } from '@mui/system'
import React, { useEffect, useMemo, useState } from 'react'
import { useTheme } from '@mui/material/styles'
import MediaCard from 'src/views/utility/MediaCard'
import { useRouter } from 'next/router'
import dayjs from 'dayjs'
import { getPatientSurgeryList } from 'src/lib/api/hospital/surgeryMaster'

const htmlToPlainText = value => {
  if (!value) return ''
  if (typeof value !== 'string') return String(value)

  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const formatDateValue = value => {
  if (!value) return '--'
  const parsed = dayjs(value)

  if (!parsed.isValid()) return String(value)

  return parsed.format('DD MMM YYYY')
}

const formatTimeValue = value => {
  if (!value) return '--'
  const candidate = typeof value === 'string' && !value.includes('T') ? `1970-01-01T${value}` : value
  const parsed = dayjs(candidate)

  if (!parsed.isValid()) return String(value)

  return parsed.format('hh:mm A')
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

const resolveValue = value => (Array.isArray(value) ? value[0] : value)

const resolveHospitalCaseId = (propValue, query) => {
  if (propValue !== undefined && propValue !== null && propValue !== '') return resolveValue(propValue)

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
        '&::-webkit-scrollbar-thumb': { background: '#BDBDBD', borderRadius: '6px' },
        scrollbarWidth: 'thin',
        scrollbarColor: '#BDBDBD transparent'
      }}
    >
      <Box
        sx={{
          display: 'inline-flex',
          gap: 2,
          px: 2
        }}
      >
        {items.map((item, index) => {
          const key = item?.id ?? `${item?.file || item?.file_original_name || 'attachment'}-${index}`

          return (
            <Box
              key={key}
              sx={{
                width: 240,
                flexShrink: 0
              }}
            >
              <MediaCard media={item} isBorderedCard />
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

function InpatientSurgery({ hospitalCaseId }) {
  const theme = useTheme()
  const router = useRouter()
  const [surgeryRecords, setSurgeryRecords] = useState([])
  const [activeSurgeryId, setActiveSurgeryId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const resolvedHospitalCaseId = useMemo(
    () => resolveHospitalCaseId(hospitalCaseId, router?.query),
    [hospitalCaseId, router?.query]
  )

  useEffect(() => {
    let isMounted = true

    const fetchSurgeryRecords = async () => {
      if (!resolvedHospitalCaseId) {
        if (isMounted) {
          setSurgeryRecords([])
          setActiveSurgeryId('')
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
    const resolvedCaseId = resolveHospitalCaseId(hospitalCaseId, router?.query)
    const href = resolvedCaseId
      ? { pathname: '/hospital/inpatient/AddSurgeryRecord', query: { hospital_case_id: resolvedCaseId } }
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

  const activeDetail = activeRecord?.detail ?? null

  const surgeryCode = getRecordCode(activeRecord)

  const basicDetails = useMemo(() => {
    const detail = activeDetail || {}

    return [
      { label: 'Date', value: formatDateValue(detail.surgery_date) },
      { label: 'Surgery Duration', value: getDurationLabel(detail) },
      { label: 'Start Time', value: formatTimeValue(detail.start_time) },
      { label: 'End Time', value: formatTimeValue(detail.end_time) }
    ]
  }, [activeDetail])

  const surgeryDetailItems = useMemo(() => {
    const detail = activeDetail || {}

    return [
      { label: 'Procedure Name', value: detail.surgery_name || '--' },
      { label: 'Surgical Approach', value: detail.surgical_approach || '--' },
      { label: 'Type Of Surgery', value: detail.type_of_surgery || '--' }
    ]
  }, [activeDetail])

  const surgeryNotesText = useMemo(() => htmlToPlainText(activeDetail?.surgery_notes) || '--', [activeDetail])
  const findingsText = useMemo(() => htmlToPlainText(activeDetail?.findings), [activeDetail])
  const hemostasisText = useMemo(() => htmlToPlainText(activeDetail?.hemostasis), [activeDetail])
  const closureText = useMemo(() => htmlToPlainText(activeDetail?.closure), [activeDetail])
  const complicationText = useMemo(() => htmlToPlainText(activeDetail?.complications) || '--', [activeDetail])

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

  const renderTabContent = () => {
    if (loading) {
      return (
        <Typography
          sx={{
            color: theme.palette.customColors.neutralSecondary,
            whiteSpace: 'nowrap'
          }}
        >
          Loading surgery records...
        </Typography>
      )
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

    if (!surgeryRecords.length) {
      return (
        <Typography
          sx={{
            color: theme.palette.customColors.neutralSecondary,
            whiteSpace: 'nowrap'
          }}
        >
          No surgery records found.
        </Typography>
      )
    }

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

  const shouldShowDetails = Boolean(activeRecord)

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

        <Button
          onClick={handleAddSurgeryRecord}
          variant='contained'
          sx={{ flex: '0 0 auto', whiteSpace: 'nowrap', height: '48px' }}
        >
          Add SURGERY RECORD
        </Button>
      </Box>

      {!shouldShowDetails ? (
        <Box
          sx={{
            py: 6,
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <Typography
            sx={{
              color: error ? theme.palette.error.main : theme.palette.customColors.neutralSecondary
            }}
          >
            {error || (loading ? 'Fetching surgery records...' : 'No surgery record selected.')}
          </Typography>
        </Box>
      ) : (
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
            {/* <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <Icon color={theme.palette.primary.dark} icon='mdi:pencil-outline' fontSize={20} />
            <Typography sx={{ fontWeight: 500, fontSize: '16px', letterSpacing: 0, color: theme.palette.primary.dark }}>
              Edit
            </Typography>
          </Box> */}
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <DetailsHeader text={'Basic details'} />
            <Grid sx={{ px: '8px' }} container spacing={4}>
              {basicDetails.map(detail => (
                <Grid item size={{ xs: 6, md: 3 }} key={detail.label}>
                  <Tooltip title={detail.label}>
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
                  </Tooltip>
                  <Tooltip title={detail.value}>
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
                  </Tooltip>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <DetailsHeader text={'Surgery details'} />
            <Box sx={{ px: '8px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <Grid container spacing={4}>
                {surgeryDetailItems.map(item => (
                  <Grid item size={{ xs: 12, sm: 6, md: 4 }} key={item.label}>
                    <Tooltip title={item.label}>
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
                    </Tooltip>
                    <Tooltip title={item.value}>
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
                    </Tooltip>
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
                <Tooltip title={surgeryNotesText}>
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
                      WebkitLineClamp: 5,
                      WebkitBoxOrient: 'vertical'
                    }}
                  >
                    {surgeryNotesText}
                  </Typography>
                </Tooltip>

                {findingsText && (
                  <Tooltip title={`Findings: ${findingsText}`}>
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
                  </Tooltip>
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
                          <Tooltip title={item}>
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
                          </Tooltip>
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
                <Tooltip title={complicationText}>
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
                </Tooltip>
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <DetailsHeader text={'Care instructions'} />
            <Box sx={{ px: '8px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {careInstructionItems.map(item => (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }} key={item.label}>
                  <Tooltip title={item.label}>
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
                  </Tooltip>
                  <Tooltip title={item.value}>
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
                  </Tooltip>
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
  )
}

export default InpatientSurgery
