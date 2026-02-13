import React, { useState, useEffect } from 'react'
import { Box, Typography, Skeleton, Collapse, CircularProgress, Chip } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import {
  ExpandMore,
  ExpandLess,
  CheckCircle,
  AccessTime,
  Science,
  CalendarToday,
  KeyboardArrowRight
} from '@mui/icons-material'
import Utility from 'src/utility'
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

  const getStatusConfig = status => {
    const s = (status || '').toLowerCase()
    if (s === 'completed') {
      return {
        icon: <CheckCircle sx={{ fontSize: 14 }} />,
        color: theme.palette.success.main,
        bgColor: alpha(theme.palette.success.main, 0.1),
        label: 'Completed'
      }
    }
    if (s === 'inprogress' || s === 'in_progress') {
      return {
        icon: <AccessTime sx={{ fontSize: 14 }} />,
        color: theme.palette.warning.main,
        bgColor: alpha(theme.palette.warning.main, 0.1),
        label: 'In Progress'
      }
    }

    return {
      icon: <AccessTime sx={{ fontSize: 14 }} />,
      color: theme.palette.info.main,
      bgColor: alpha(theme.palette.info.main, 0.1),
      label: 'Pending'
    }
  }

  const renderShimmer = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <Box
          key={i}
          sx={{
            backgroundColor: theme.palette.background.paper,
            borderRadius: '12px',
            padding: 3,
            boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.08)}`
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Skeleton variant='rounded' width={140} height={28} sx={{ borderRadius: '6px' }} />
              <Skeleton variant='rounded' width={80} height={24} sx={{ borderRadius: '12px' }} />
            </Box>
            <Skeleton variant='rounded' width={100} height={20} />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton variant='rounded' width={60} height={24} sx={{ borderRadius: '12px' }} />
            <Skeleton variant='rounded' width={90} height={20} />
          </Box>
        </Box>
      ))}
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Sub Tabs */}
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
          <Box sx={{ display: 'inline-flex', gap: 2, pr: 1, alignItems: 'center' }}>
            {SUB_TABS.map(tab => (
              <Box
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                sx={{
                  flexShrink: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  px: 3,
                  py: 1,
                  borderRadius: '8px',
                  backgroundColor:
                    activeSubTab === tab ? theme.palette.secondary.dark : theme.palette.customColors.mdAntzNeutral,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor:
                      activeSubTab === tab
                        ? theme.palette.secondary.dark
                        : alpha(theme.palette.customColors.mdAntzNeutral, 0.7)
                  }
                }}
              >
                <Typography
                  sx={{
                    color:
                      activeSubTab === tab
                        ? theme.palette.primary.contrastText
                        : theme.palette.customColors.neutralPrimary,
                    whiteSpace: 'nowrap',
                    fontSize: '14px',
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

      {/* Content */}
      {loading ? (
        renderShimmer()
      ) : data.length === 0 ? (
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            py: 8,
            gap: 2
          }}
        >
          <Science sx={{ fontSize: 48, color: alpha(theme.palette.text.secondary, 0.3) }} />
          <Typography
            sx={{
              fontSize: '0.875rem',
              color: theme.palette.customColors.neutralSecondary,
              fontWeight: 400
            }}
          >
            No Lab Requests Found
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {data.map((group, index) => {
            const groupId = group.id || group.lab_test_request_id || index
            const isExpanded = expandedItems[groupId] || false
            const tests = group.lab_tests || group.tests || []
            const statusConfig = getStatusConfig(group.status)

            return (
              <Box
                key={groupId}
                sx={{
                  backgroundColor: theme.palette.background.paper,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.08)}`,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.1)}`
                  }
                }}
              >
                {/* Card Header */}
                <Box
                  onClick={() => tests.length > 0 && toggleExpand(groupId)}
                  sx={{
                    padding: 3,
                    cursor: tests.length > 0 ? 'pointer' : 'default'
                  }}
                >
                  {/* Top Row - Request ID and Date */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 2
                    }}
                  >
                    {/* Request ID */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                        px: 1.5,
                        py: 0.75,
                        borderRadius: '6px'
                      }}
                    >
                      <Science sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                      <Typography
                        sx={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: theme.palette.primary.main,
                          letterSpacing: '0.3px'
                        }}
                      >
                        {group.medical_record_code || `REQ-${groupId}`}
                      </Typography>
                    </Box>

                    {/* Date & Time */}
                    {group.created_at && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarToday sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                        <Typography
                          sx={{
                            fontSize: '0.75rem',
                            color: theme.palette.text.secondary,
                            fontWeight: 500
                          }}
                        >
                          {Utility.convertUtcToLocalReadableDate(group.created_at)} &bull;{' '}
                          {Utility.convertUTCToLocaltime(group.created_at)}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Bottom Row - Status and Tests */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    {/* Status and Test Count */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      {/* Status Chip */}
                      <Chip
                        icon={statusConfig.icon}
                        label={statusConfig.label}
                        size='small'
                        sx={{
                          backgroundColor: statusConfig.bgColor,
                          color: statusConfig.color,
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          height: 26,
                          '& .MuiChip-icon': {
                            color: statusConfig.color
                          }
                        }}
                      />

                      {/* Test Count */}
                      {tests.length > 0 && (
                        <Chip
                          label={`${tests.length} Test${tests.length > 1 ? 's' : ''}`}
                          size='small'
                          sx={{
                            backgroundColor: alpha(theme.palette.text.primary, 0.06),
                            color: theme.palette.text.secondary,
                            fontWeight: 500,
                            fontSize: '0.75rem',
                            height: 26
                          }}
                        />
                      )}
                    </Box>

                    {/* View Tests Button */}
                    {tests.length > 0 && (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          color: theme.palette.primary.main,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            gap: 1
                          }
                        }}
                      >
                        <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                          {isExpanded ? 'Hide' : 'View'} Tests
                        </Typography>
                        {isExpanded ? <ExpandLess fontSize='small' /> : <KeyboardArrowRight fontSize='small' />}
                      </Box>
                    )}
                  </Box>
                </Box>

                {/* Expanded Tests List */}
                {tests.length > 0 && (
                  <Collapse in={isExpanded}>
                    <Box
                      sx={{
                        borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        backgroundColor: alpha(theme.palette.background.default, 0.5)
                      }}
                    >
                      {tests.map((test, tIndex) => {
                        const testStatusConfig = getStatusConfig(test.status)

                        return (
                          <Box
                            key={test.id || test.lab_test_id || tIndex}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              px: 3,
                              py: 2,
                              borderBottom:
                                tIndex < tests.length - 1 ? `1px solid ${alpha(theme.palette.divider, 0.08)}` : 'none',
                              transition: 'background-color 0.2s ease',
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.02)
                              }
                            }}
                          >
                            {/* Test Info */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
                              <Box
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: '8px',
                                  backgroundColor: testStatusConfig.bgColor,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}
                              >
                                {testStatusConfig.icon}
                              </Box>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography
                                  sx={{
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    color: theme.palette.text.primary,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {test.test_name || test.name || `Test #${test.lab_test_id || tIndex + 1}`}
                                </Typography>
                                {test.created_at && (
                                  <Typography
                                    sx={{
                                      fontSize: '0.75rem',
                                      color: theme.palette.text.secondary
                                    }}
                                  >
                                    {Utility.convertUtcToLocalReadableDate(test.created_at)}
                                  </Typography>
                                )}
                              </Box>
                            </Box>

                            {/* Test Status */}
                            <Typography
                              sx={{
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: testStatusConfig.color,
                                flexShrink: 0,
                                ml: 2
                              }}
                            >
                              {testStatusConfig.label}
                            </Typography>
                          </Box>
                        )
                      })}
                    </Box>
                  </Collapse>
                )}
              </Box>
            )
          })}

          {/* Load More */}
          {hasMore && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              {loadingMore ? (
                <CircularProgress size={24} />
              ) : (
                <Box
                  onClick={handleLoadMore}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 3,
                    py: 1,
                    borderRadius: '8px',
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    color: theme.palette.primary.main,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.15)
                    }
                  }}
                >
                  <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>Load More</Typography>
                  <ExpandMore fontSize='small' />
                </Box>
              )}
            </Box>
          )}

          {!hasMore && data.length > 10 && (
            <Typography sx={{ textAlign: 'center', color: theme.palette.text.disabled, fontSize: '0.8125rem' }}>
              All lab requests loaded
            </Typography>
          )}
        </Box>
      )}
    </Box>
  )
}

export default LabRequestsList
