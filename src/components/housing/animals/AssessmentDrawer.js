import React, { useEffect, useState, useMemo } from 'react'
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Tabs,
  Tab,
  Menu,
  MenuItem
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import StickyNote2Icon from '@mui/icons-material/StickyNote2'
import SegmentIcon from '@mui/icons-material/Segment'
import { useTheme } from '@mui/material/styles'
import { useInView } from 'react-intersection-observer'
import moment from 'moment'
import AnimalParentCard from 'src/views/utility/animalParentCard'
import {
  getAssessmentTypes,
  getAssessmentData,
  getMeasurementUnits
} from 'src/lib/api/necropsy/medicalHistory'

const AssessmentDrawer = ({ open, onClose, animalData, initialTabName = 'Weight' }) => {
  const theme = useTheme()

  const [loading, setLoading] = useState(false)
  const [assessmentTypes, setAssessmentTypes] = useState([])
  const [selectedTypeIndex, setSelectedTypeIndex] = useState(0)
  const [assessmentData, setAssessmentData] = useState([])
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [measurementUnits, setMeasurementUnits] = useState([])
  const [menuAnchorEl, setMenuAnchorEl] = useState(null)
  const [expandedNotes, setExpandedNotes] = useState({})
  const [loadingMore, setLoadingMore] = useState(false)

  const { ref: loaderRef, inView } = useInView({ threshold: 0 })

  const selectedType = useMemo(() => assessmentTypes[selectedTypeIndex], [assessmentTypes, selectedTypeIndex])

  // Fetch assessment types when drawer opens
  useEffect(() => {
    if (open && animalData?.animal_id) {
      fetchAssessmentTypes()
      fetchMeasurementUnits()
    }
  }, [open, animalData?.animal_id])

  // Fetch assessment data when type changes
  useEffect(() => {
    if (open && selectedType?.assessment_type_id) {
      setAssessmentData([])
      setPage(1)
      setHasMore(true)
      fetchAssessmentData(1, true)
    }
  }, [selectedType?.assessment_type_id])

  // Load more on scroll
  useEffect(() => {
    if (inView && hasMore && !loading && !loadingMore && assessmentData.length > 0) {
      setLoadingMore(true)
      fetchAssessmentData(page + 1, false)
    }
  }, [inView])

  const fetchAssessmentTypes = async () => {
    setLoading(true)
    try {
      const response = await getAssessmentTypes(animalData?.animal_id)
      if (response?.success && response?.data) {
        setAssessmentTypes(response.data)

        // Find the initial tab by name (default to 'Weight')
        const initialIndex = response.data.findIndex(
          type => type?.assessment_name?.toLowerCase() === initialTabName?.toLowerCase()
        )
        setSelectedTypeIndex(initialIndex >= 0 ? initialIndex : 0)
      }
    } catch (error) {
      console.error('Error fetching assessment types:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMeasurementUnits = async () => {
    try {
      const response = await getMeasurementUnits()
      if (response?.success && response?.data) {
        setMeasurementUnits(response.data)
      }
    } catch (error) {
      console.error('Error fetching measurement units:', error)
    }
  }

  const fetchAssessmentData = async (pageNo, reset = false) => {
    if (loading && reset) return
    if (reset) setLoading(true)

    try {
      const params = {
        assessment_type_id: selectedType?.assessment_type_id,
        page_no: pageNo,
        ref_type: 'animal'
      }

      const response = await getAssessmentData(animalData?.animal_id, params)
      if (response?.success && response?.data) {
        const newData = response.data?.result || []
        setTotalCount(response.data?.total_count || 0)

        if (reset) {
          setAssessmentData(newData)
        } else {
          setAssessmentData(prev => [...prev, ...newData])
        }

        setPage(pageNo)
        setHasMore(newData.length >= 10)
      }
    } catch (error) {
      console.error('Error fetching assessment data:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handleTabChange = (event, newValue) => {
    setSelectedTypeIndex(newValue)
    setExpandedNotes({})
  }

  const handleMenuOpen = event => {
    setMenuAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setMenuAnchorEl(null)
  }

  const handleMenuItemClick = index => {
    setSelectedTypeIndex(index)
    setExpandedNotes({})
    handleMenuClose()
  }

  const toggleNotes = index => {
    setExpandedNotes(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  const getUnitAbbr = unitId => {
    const unit = measurementUnits.find(u => u?.id == unitId)
    return unit?.uom_abbr || ''
  }

  const formatDateTime = dateTimeStr => {
    if (!dateTimeStr) return { date: '', time: '' }
    const dateObj = moment(dateTimeStr)
    return {
      date: dateObj.format('DD MMM YYYY'),
      time: dateObj.format('hh:mm A')
    }
  }

  const renderAssessmentItem = (item, index) => {
    const { date, time } = formatDateTime(item?.recorded_date_time)
    const isEven = index % 2 === 0

    return (
      <Box
        key={item?.id || index}
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          alignItems: 'center',
          gap: 4,
          mb: 2
        }}
      >
        {/* Date/Time column */}
        <Box sx={{ minWidth: 80, maxWidth: 100, textAlign: 'right' }}>
          <Typography
            sx={{
              fontSize: '13px',
              fontWeight: 500,
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            {date}
          </Typography>
          <Typography
            sx={{
              fontSize: '12px',
              color: theme.palette.customColors.neutralSecondary
            }}
          >
            {time}
          </Typography>
        </Box>

        {/* Value column */}
        <Box
          sx={{
            flex: 1,
            backgroundColor: isEven ? theme.palette.customColors.Background : theme.palette.customColors.displaybgPrimary,
            borderRadius: '4px',
            py: 2,
            px: 4
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ flex: 1 }}>
              {selectedType?.response_type === 'numeric_value' ? (
                <Typography>
                  <Box
                    component='span'
                    sx={{
                      fontSize: '24px',
                      fontWeight: 500,
                      color: theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    {item?.assessment_value}
                  </Box>
                  <Box
                    component='span'
                    sx={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: theme.palette.customColors.outline,
                      ml: 1
                    }}
                  >
                    {getUnitAbbr(item?.assessment_unit_id)}
                  </Box>
                </Typography>
              ) : (
                <Typography
                  sx={{
                    fontSize: '20px',
                    // fontSize: '14px',
                    fontWeight: 500,
                    color: theme.palette.customColors.OnSecondaryContainer
                  }}
                >
                  {item?.default_value_label || item?.assessment_value}
                </Typography>
              )}
            </Box>

            {item?.comments && (
              <IconButton onClick={() => toggleNotes(index)} size='small'>
                <StickyNote2Icon
                  sx={{
                    fontSize: 20,
                    color: theme.palette.customColors.moderateSecondary
                  }}
                />
              </IconButton>
            )}
          </Box>

          {expandedNotes[index] && item?.comments && (
            <Typography
              sx={{
                mt: 1,
                fontSize: '14px',
                color: theme.palette.customColors.OnSecondaryContainer
              }}
            >
              {item.comments}
            </Typography>
          )}
        </Box>
      </Box>
    )
  }

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        anchor='right'
        variant='temporary'
        slotProps={{
          paper: {
            sx: {
              backgroundColor: theme.palette.customColors.Background
            }
          }
        }}
      >
        <Box
          sx={{
            width: 570,
            maxWidth: '100vw',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Header */}
          <Box sx={{ p: theme.spacing(4, 5), pb: 0 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton onClick={onClose}>
                  <ArrowBackIcon sx={{ color: theme.palette.customColors.OnSurfaceVariant }} />
                </IconButton>
                <Typography
                  sx={{ fontSize: '1.5rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  Assessment
                </Typography>
              </Box>
              <IconButton onClick={onClose}>
                <CloseIcon sx={{ color: theme.palette.customColors.OnSurfaceVariant }} />
              </IconButton>
            </Box>

            {/* Animal Card */}
            {animalData && (
              <Box sx={{ mt: 3 }}>
                <AnimalParentCard
                  data={animalData}
                  backgroundColor={theme.palette.common.white}
                />
              </Box>
            )}

            {/* Tabs */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mt: 3,
                borderBottom: `1px solid ${theme.palette.customColors.outline}`
              }}
            >
              <IconButton onClick={handleMenuOpen} sx={{ mr: 1 }}>
                <SegmentIcon sx={{ color: theme.palette.customColors.OnSurfaceVariant }} />
              </IconButton>
              <Tabs
                value={selectedTypeIndex}
                onChange={handleTabChange}
                variant='scrollable'
                scrollButtons='auto'
                sx={{
                  flex: 1,
                  minHeight: 48,
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontSize: '14px',
                    fontWeight: 400,
                    color: theme.palette.customColors.OnSurfaceVariant,
                    minHeight: 48
                  },
                  '& .Mui-selected': {
                    fontWeight: 500,
                    color: theme.palette.customColors.OnSurface
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: theme.palette.customColors.OnSurface,
                    height: 3,
                    borderRadius: '3px 3px 0 0'
                  }
                }}
              >
                {assessmentTypes.map((type, index) => (
                  <Tab key={type?.assessment_type_id || index} label={type?.assessment_name} />
                ))}
              </Tabs>
            </Box>

            {/* Menu for all types */}
            <Menu
              anchorEl={menuAnchorEl}
              open={Boolean(menuAnchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                sx: {
                  maxHeight: 300,
                  width: 250
                }
              }}
            >
              <Box sx={{ px: 2, py: 1, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <Typography sx={{ fontWeight: 500, color: theme.palette.customColors.OnPrimaryContainer }}>
                  Total assessment types
                </Typography>
                <Typography sx={{ fontWeight: 500, color: theme.palette.customColors.OnPrimaryContainer }}>
                  {assessmentTypes.length}
                </Typography>
              </Box>
              {assessmentTypes.map((type, index) => (
                <MenuItem
                  key={type?.assessment_type_id || index}
                  selected={selectedTypeIndex === index}
                  onClick={() => handleMenuItemClick(index)}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    backgroundColor:
                      selectedTypeIndex === index ? theme.palette.action.selected : 'transparent'
                  }}
                >
                  <Typography>{type?.assessment_name}</Typography>
                  {selectedTypeIndex === index && <Typography>✓</Typography>}
                </MenuItem>
              ))}
            </Menu>
          </Box>

          {/* Content */}
          <Box
            sx={{
              flex: 1,
              p: theme.spacing(4, 5),
              pt: 2,
              overflowY: 'auto',
              backgroundColor: theme.palette.common.white
            }}
          >
            {loading && assessmentData.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : assessmentData.length === 0 ? (
              <Typography sx={{ textAlign: 'center', py: 4, color: theme.palette.text.secondary }}>
                No data found
              </Typography>
            ) : (
              <>
                {assessmentData.map((item, index) => renderAssessmentItem(item, index))}

                {hasMore && (
                  <Box ref={loaderRef} sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                )}
              </>
            )}
          </Box>

        </Box>
      </Drawer>
    </>
  )
}

export default React.memo(AssessmentDrawer)
