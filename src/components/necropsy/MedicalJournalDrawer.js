import React, { useState, useEffect } from 'react'
import { Drawer, Box, Typography, IconButton, Skeleton, CircularProgress, Avatar, Tooltip } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { Close as CloseIcon, Person as PersonIcon, CalendarToday as CalendarIcon } from '@mui/icons-material'
import { getMedicalJournalLogs } from 'src/lib/api/necropsy/medicalHistory'
import Utility from 'src/utility'

const MedicalJournalDrawer = ({ open, onClose, animalId, medicalRecordId }) => {
  const theme = useTheme()
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [journalData, setJournalData] = useState([])
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    if (open && animalId) {
      setPage(1)
      setJournalData([])
      fetchJournalData(1)
    }
  }, [open, animalId, medicalRecordId])

  const fetchJournalData = async pageNo => {
    try {
      if (pageNo === 1) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      const params = {
        animal_id: animalId,
        page: pageNo,
        limit: 10,
        ...(medicalRecordId && { medical_record_id: medicalRecordId })
      }

      const res = await getMedicalJournalLogs(params)

      if (res?.success) {
        const newData = res.data?.data || []
        setTotalCount(res.data?.total_count || 0)

        if (pageNo === 1) {
          setJournalData(newData)
        } else {
          setJournalData(prev => {
            const merged = [...prev]
            newData.forEach(newGroup => {
              const existingIndex = merged.findIndex(g => g.date === newGroup.date)
              if (existingIndex >= 0) {
                merged[existingIndex].entries = [...(merged[existingIndex].entries || []), ...(newGroup.entries || [])]
              } else {
                merged.push(newGroup)
              }
            })

            return merged
          })
        }

        setHasMore(newData.length === 10)
      }
    } catch (error) {
      console.error('Error fetching journal data:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchJournalData(nextPage)
    }
  }

  const renderShimmer = () => (
    <Box sx={{ p: 3 }}>
      {[1, 2, 3].map(i => (
        <Box key={i} sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, p: 2, bgcolor: theme.palette.grey[200] }}>
            <Skeleton variant='text' width={50} height={40} />
            <Box>
              <Skeleton variant='text' width={80} height={20} />
              <Skeleton variant='text' width={100} height={16} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, p: 2 }}>
            <Skeleton variant='circular' width={32} height={32} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant='text' width={100} height={16} />
              <Skeleton variant='text' width={150} height={20} />
              <Skeleton variant='rectangular' height={80} sx={{ mt: 1, borderRadius: 1 }} />
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  )

  const formatKey = key => {
    return key
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/^./, s => s.toUpperCase())
  }

  const formatDetailValue = (key, value) => {
    if (value === null || value === undefined || value === '' || value === 'null' || value === 'undefined') {
      return null
    }

    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : null
    }

    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
      return Utility.convertUTCToLocalDate(value)
    }

    return String(value)
  }

  return (
    <Drawer
      anchor='bottom'
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          height: '85vh',
          maxHeight: '85vh',
          width: { xs: '100%', sm: 480, md: 520 },
          maxWidth: '100%',
          position: 'absolute',
          right: 0,
          left: 'auto',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16
        }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 3,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.paper
        }}
      >
        <Typography sx={{ fontSize: '18px', fontWeight: 600, color: theme.palette.text.primary }}>
          Medical Journal
        </Typography>
        <IconButton onClick={onClose} size='small'>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', bgcolor: theme.palette.grey[50] }}>
        {loading ? (
          renderShimmer()
        ) : journalData.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color='text.secondary'>No journal entries found</Typography>
          </Box>
        ) : (
          <Box>
            {journalData.map((group, groupIndex) => (
              <Box key={groupIndex} sx={{ mb: 3 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 2,
                    bgcolor: theme.palette.grey[200]
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '32px',
                      fontWeight: 700,
                      color: theme.palette.text.primary,
                      lineHeight: 1,
                      minWidth: 50
                    }}
                  >
                    {group.date ? new Date(group.date).getDate().toString().padStart(2, '0') : '--'}
                  </Typography>
                  <Box>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: theme.palette.text.secondary
                      }}
                    >
                      {group.day ||
                        (group.date ? new Date(group.date).toLocaleDateString('en-US', { weekday: 'long' }) : '')}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '12px',
                        color: theme.palette.text.secondary
                      }}
                    >
                      {group.date
                        ? new Date(group.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                        : ''}
                    </Typography>
                  </Box>
                </Box>

                {group?.entries?.map((entry, entryIdx) => (
                  <JournalCard
                    key={entryIdx}
                    entry={entry}
                    theme={theme}
                    formatKey={formatKey}
                    formatDetailValue={formatDetailValue}
                    isLast={entryIdx === group.entries.length - 1}
                  />
                ))}
              </Box>
            ))}

            {hasMore && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                {loadingMore ? (
                  <CircularProgress size={24} />
                ) : (
                  <Typography
                    onClick={handleLoadMore}
                    sx={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: theme.palette.primary.main,
                      cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    Load More
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Drawer>
  )
}

const JournalCard = ({ entry, theme, formatKey, formatDetailValue, isLast }) => {
  const [imageError, setImageError] = useState(false)
  const type = entry.type || ''

  const category =
    entry.category
      ?.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') || ''
  const title = entry.title ? Utility.toPascalSentenceCase?.(entry.title) || entry.title.replace(/_/g, ' ') : ''
  const time = entry.time ? Utility.convertUTCToLocaltime(entry.time) : ''
  const details = entry.details || {}
  const code = entry.code || details?.medical_record_number || ''
  const createdBy = entry.createdBy || entry.created_by || null
  const userName = entry.user_full_name || createdBy?.name || ''

  return (
    <Box
      sx={{
        p: 2,
        bgcolor: theme.palette.background.paper,
        borderBottom: isLast ? 'none' : `1px solid ${theme.palette.divider}`
      }}
    >
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: theme.palette.grey[100]
            }}
          >
            {entry.incon && !imageError ? (
              <Box
                component='img'
                src={entry.incon}
                alt=''
                onError={() => setImageError(true)}
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <Box
                component='img'
                src='/icons/antz.svg'
                alt='Antz'
                sx={{ width: 20, height: 20, objectFit: 'contain' }}
              />
            )}
          </Avatar>
          {!isLast && (
            <Box
              sx={{
                width: 1,
                flexGrow: 1,
                mt: 1,
                backgroundImage: `repeating-linear-gradient(
                  to bottom,
                  ${theme.palette.divider},
                  ${theme.palette.divider} 4px,
                  transparent 4px,
                  transparent 8px
                )`
              }}
            />
          )}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {type && (
                <Typography
                  sx={{
                    fontSize: '12px',
                    color: theme.palette.text.secondary,
                    fontWeight: 400,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {type}
                </Typography>
              )}
              {category && (
                <Typography
                  sx={{
                    fontSize: '12px',
                    color: theme.palette.text.secondary,
                    fontWeight: 400,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {category}
                </Typography>
              )}
              {title && (
                <Tooltip title={title}>
                  <Typography
                    sx={{
                      fontSize: '16px',
                      fontWeight: 500,
                      color: theme.palette.text.primary,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {title}
                  </Typography>
                </Tooltip>
              )}
              {time && (
                <Typography
                  sx={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: theme.palette.text.secondary
                  }}
                >
                  {time}
                </Typography>
              )}
            </Box>
          </Box>

          {(Object.keys(details).length > 0 || code || userName) && (
            <Box
              sx={{
                p: 2,
                bgcolor: theme.palette.customColors?.lightBg || theme.palette.grey[100],
                borderRadius: 1,
                mt: 1
              }}
            >
              {code && (
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color:
                      type === 'Medical'
                        ? theme.palette.customColors?.Tertiary || theme.palette.info.main
                        : type === 'Vaccination'
                        ? theme.palette.primary.dark
                        : theme.palette.customColors?.addPrimary || theme.palette.success.main,
                    mb: 1
                  }}
                >
                  {code}
                </Typography>
              )}

              {Object.entries(details)
                .filter(
                  ([key, value]) =>
                    key !== 'medical_record_number' &&
                    value !== null &&
                    value !== undefined &&
                    !(Array.isArray(value) && value.length === 0) &&
                    !(typeof value === 'string' && value.trim() === '')
                )
                .map(([key, value], idx) => {
                  const formattedValue = formatDetailValue(key, value)
                  if (!formattedValue) return null

                  return (
                    <Tooltip key={idx} title={`${formatKey(key)}: ${formattedValue}`}>
                      <Typography
                        sx={{
                          fontSize: '14px',
                          fontWeight: 400,
                          color: theme.palette.text.secondary,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          mb: 0.5
                        }}
                      >
                        {formatKey(key)} :{' '}
                        <Box component='span' sx={{ fontWeight: 500, color: theme.palette.text.primary }}>
                          {formattedValue}
                        </Box>
                      </Typography>
                    </Tooltip>
                  )
                })}

              {(userName || createdBy) && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
                  <Avatar sx={{ width: 28, height: 28, bgcolor: theme.palette.grey[300] }}>
                    <PersonIcon sx={{ fontSize: 16 }} />
                  </Avatar>
                  <Box>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: theme.palette.text.primary
                      }}
                    >
                      {userName || createdBy?.name || 'Unknown'}
                    </Typography>
                    {createdBy?.timestamp && (
                      <Typography
                        sx={{
                          fontSize: '12px',
                          fontWeight: 400,
                          color: theme.palette.text.secondary
                        }}
                      >
                        {createdBy.timestamp}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default MedicalJournalDrawer
