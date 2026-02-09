import React, { useState, useEffect } from 'react'
import { Box, Typography, Skeleton, Collapse, CircularProgress } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { ExpandMore, ExpandLess, CheckCircle, AccessTime, FiberManualRecord } from '@mui/icons-material'
import Utility from 'src/utility'
import { MedicalIdChip } from 'src/views/pages/hospital/utility/hospitalSnippets'
import { getLabRequestsByAnimal } from 'src/lib/api/necropsy/medicalHistory'

const SUB_TABS = ['Pending', 'Completed', 'All']

const LabRequestsList = ({ animalId }) => {
  const theme = useTheme()
  const [activeSubTab, setActiveSubTab] = useState('Pending')
  const [data, setData] = useState([])
  const [pageNo, setPageNo] = useState(1)
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [expandedItems, setExpandedItems] = useState({})

  const getTypeParam = tab => {
    switch (tab) {
      case 'Pending':
        return 'pending'
      case 'Completed':
        return 'completed'
      case 'All':
        return 'all'
      default:
        return 'pending'
    }
  }

  const fetchData = async (tab, page, append = false) => {
    try {
      if (page === 1) setLoading(true)
      else setLoadingMore(true)

      const res = await getLabRequestsByAnimal({
        animal_id: animalId,
        type: getTypeParam(tab),
        page_no: page
      })

      if (res?.success) {
        const records = res.data?.result || res.data || []
        if (append) {
          setData(prev => [...prev, ...records])
        } else {
          setData(Array.isArray(records) ? records : [])
        }
        setHasMore(Array.isArray(records) && records.length >= 10)
      }
    } catch (error) {
      console.error('Error fetching lab requests:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    setPageNo(1)
    setData([])
    setExpandedItems({})
    fetchData(activeSubTab, 1)
  }, [activeSubTab, animalId])

  const handleLoadMore = () => {
    const nextPage = pageNo + 1
    setPageNo(nextPage)
    fetchData(activeSubTab, nextPage, true)
  }

  const toggleExpand = id => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const getStatusIcon = status => {
    const s = (status || '').toLowerCase()
    if (s === 'completed') {
      return <CheckCircle sx={{ fontSize: 16, color: theme.palette.success.main }} />
    }
    if (s === 'inprogress' || s === 'in_progress') {
      return <AccessTime sx={{ fontSize: 16, color: theme.palette.warning.main }} />
    }

    return <FiberManualRecord sx={{ fontSize: 10, color: theme.palette.info.main }} />
  }

  const getStatusColor = status => {
    const s = (status || '').toLowerCase()
    if (s === 'completed') return theme.palette.success.main
    if (s === 'inprogress' || s === 'in_progress') return theme.palette.warning.main

    return theme.palette.info.main
  }

  const renderShimmer = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <Box
          key={i}
          sx={{
            border: `1px solid ${theme.palette.customColors.OnPrimary}`,
            borderRadius: '8px',
            padding: { xs: '16px', sm: '20px', md: '24px' }
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 2fr', md: '1fr 2fr 1fr' },
              gap: 2
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Skeleton variant='rounded' width={130} height={22} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Skeleton variant='rounded' width={80} height={22} />
                <Skeleton variant='text' width={60} height={18} />
              </Box>
            </Box>
            <Box>
              <Skeleton variant='text' width='50%' height={16} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Skeleton variant='circular' width={24} height={24} />
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            flex: '1 1 auto',
            minWidth: 0,
            overflowX: 'auto',
            scrollbarColor: 'transparent transparent',
            columnGap: 4
          }}
        >
          <Box sx={{ display: 'inline-flex', gap: 3, pr: 1, alignItems: 'center' }}>
            {SUB_TABS.map(tab => (
              <Box
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                sx={{
                  flexShrink: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  px: '16px',
                  py: '8px',
                  borderRadius: '8px',
                  backgroundColor:
                    activeSubTab === tab ? theme.palette.secondary.dark : theme.palette.customColors.mdAntzNeutral,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
              >
                <Typography
                  sx={{
                    color:
                      activeSubTab === tab
                        ? theme.palette.primary.contrastText
                        : theme.palette.customColors.neutralPrimary,
                    whiteSpace: 'nowrap',
                    fontSize: { xs: '13px', sm: '14px' },
                    fontWeight: 500
                  }}
                >
                  {tab}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {loading ? (
        renderShimmer()
      ) : data.length === 0 ? (
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            py: 10
          }}
        >
          <Typography
            sx={{
              fontSize: '0.875rem',
              color: theme.palette.customColors.neutralSecondary,
              fontWeight: 400
            }}
          >
            No Lab Requests Recorded
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {data.map((group, index) => {
            const groupId = group.id || group.lab_test_request_id || index
            const isExpanded = expandedItems[groupId] || false
            const tests = group.lab_tests || group.tests || []
            const isCompleted = group.status?.toLowerCase() === 'completed'

            return (
              <Box
                key={groupId}
                sx={{
                  border: `1px solid ${theme.palette.customColors.OnPrimary}`,
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: isCompleted
                    ? alpha(theme.palette.customColors.neutralSecondary, 0.05)
                    : 'transparent'
                }}
              >
                <Box
                  onClick={() => tests.length > 0 && toggleExpand(groupId)}
                  sx={{
                    padding: { xs: '16px', sm: '20px', md: '24px' },
                    cursor: tests.length > 0 ? 'pointer' : 'default'
                  }}
                >
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 2fr', md: '1fr 2fr 1fr' },
                      gap: { xs: 1.5, sm: 2 },
                      alignItems: { xs: 'flex-start', sm: 'center' }
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <MedicalIdChip
                        leftImage
                        medId={group.medical_record_code}
                        textColor={theme.palette.customColors.OnSurface}
                      />
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                        {group.status && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <FiberManualRecord
                              sx={{
                                fontSize: 8,
                                color: isCompleted ? theme.palette.success.main : theme.palette.warning.main
                              }}
                            />
                            <Typography
                              sx={{
                                fontSize: '0.8125rem',
                                fontWeight: 500,
                                textTransform: 'capitalize',
                                color: isCompleted ? theme.palette.success.main : theme.palette.warning.main
                              }}
                            >
                              {group.status}
                            </Typography>
                          </Box>
                        )}
                        {tests.length > 0 && (
                          <Box
                            component='span'
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              fontSize: '0.875rem',
                              fontWeight: 500,
                              color: theme.palette.customColors.OnSurfaceVariant || theme.palette.text.secondary,
                              '&:before': { content: '"\\2022"', marginRight: '4px', fontSize: '1rem' }
                            }}
                          >
                            {tests.length} test{tests.length > 1 ? 's' : ''}
                          </Box>
                        )}
                      </Box>
                    </Box>

                    <Box sx={{ gridColumn: { xs: '1', sm: '2', md: '2' } }}>
                      <Typography sx={{ fontSize: '0.75rem', color: theme.palette.customColors.neutralSecondary }}>
                        {group.created_at && (
                          <>
                            {Utility.convertUtcToLocalReadableDate(group.created_at)}
                            <span style={{ margin: '0 6px', color: theme.palette.customColors.neutralSecondary }}>
                              &bull;
                            </span>
                            {Utility.convertUTCToLocaltime(group.created_at)}
                          </>
                        )}
                      </Typography>
                    </Box>

                    {tests.length > 0 && (
                      <Box
                        sx={{
                          gridColumn: { xs: '1', sm: '1 / span 2', md: '3' },
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: { xs: 'flex-start', md: 'flex-end' },
                          color: theme.palette.customColors.neutralSecondary
                        }}
                      >
                        <Typography sx={{ fontSize: '0.8125rem', mr: 0.5 }}>
                          {isExpanded ? 'Hide' : 'View'} Tests
                        </Typography>
                        {isExpanded ? <ExpandLess fontSize='small' /> : <ExpandMore fontSize='small' />}
                      </Box>
                    )}
                  </Box>
                </Box>

                {tests.length > 0 && (
                  <Collapse in={isExpanded}>
                    <Box
                      sx={{
                        borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        px: { xs: '16px', md: '24px' },
                        pb: 2
                      }}
                    >
                      {tests.map((test, tIndex) => (
                        <Box
                          key={test.id || test.lab_test_id || tIndex}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2.5,
                            py: 2.5,
                            borderBottom:
                              tIndex < tests.length - 1 ? `1px solid ${alpha(theme.palette.divider, 0.06)}` : 'none'
                          }}
                        >
                          {getStatusIcon(test.status)}

                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              sx={{
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                color: theme.palette.customColors.OnSurfaceVarient
                              }}
                            >
                              {test.test_name || test.name || `Test #${test.lab_test_id || tIndex + 1}`}
                            </Typography>
                            {test.created_at && (
                              <Typography
                                sx={{
                                  fontSize: '0.75rem',
                                  color: theme.palette.customColors.neutralSecondary,
                                  mt: 0.25
                                }}
                              >
                                {Utility.convertUtcToLocalReadableDate(test.created_at)}
                              </Typography>
                            )}
                          </Box>

                          <Typography
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              textTransform: 'capitalize',
                              color: getStatusColor(test.status),
                              flexShrink: 0
                            }}
                          >
                            {test.status || 'Pending'}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Collapse>
                )}
              </Box>
            )
          })}

          {hasMore && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
              {loadingMore ? (
                <CircularProgress size={24} />
              ) : (
                <Typography
                  onClick={handleLoadMore}
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary,
                    cursor: 'pointer',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  Load More
                </Typography>
              )}
            </Box>
          )}

          {!hasMore && data.length > 10 && (
            <Typography sx={{ textAlign: 'center', mt: 2, color: theme.palette.text.disabled, fontSize: '0.875rem' }}>
              No more lab requests to load
            </Typography>
          )}
        </Box>
      )}
    </Box>
  )
}

export default LabRequestsList
