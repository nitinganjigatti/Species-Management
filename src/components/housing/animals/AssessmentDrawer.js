import React, { useEffect, useState, useMemo, useRef } from 'react'
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Tabs,
  Tab,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import StickyNote2Icon from '@mui/icons-material/StickyNote2'
import SegmentIcon from '@mui/icons-material/Segment'
import { useTheme } from '@mui/material/styles'
import { useInView } from 'react-intersection-observer'
import moment from 'moment'
import AnimalParentCard from 'src/views/utility/animalParentCard'
import ReactApexcharts from 'src/@core/components/react-apexcharts'
import { getAssessmentTypes, getAssessmentData } from 'src/lib/api/necropsy/medicalHistory'
import { getMeasurementUnits } from 'src/lib/api/necropsy'

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
  const [weightSubTab, setWeightSubTab] = useState(0)
  const [selectedUnit, setSelectedUnit] = useState(null)
  const latestRequestRef = useRef(0)

  const { ref: loaderRef, inView } = useInView({ threshold: 0 })

  const selectedType = useMemo(() => assessmentTypes[selectedTypeIndex], [assessmentTypes, selectedTypeIndex])
  const isNumericType = selectedType?.response_type === 'numeric_value'
  const sourceUnitId = assessmentData[0]?.assessment_unit_id

  // Get the measurement type for current assessment based on the first record's unit
  const getCurrentMeasurementType = () => {
    if (assessmentData.length === 0) return null
    const firstRecord = assessmentData[0]
    const unit = measurementUnits.find(u => u?.id == firstRecord?.assessment_unit_id)
    return unit?.measurement_type?.toLowerCase() || null
  }

  const currentMeasurementType = getCurrentMeasurementType()

  // Fetch assessment types when drawer opens
  useEffect(() => {
    if (open && animalData?.animal_id) {
      fetchAssessmentTypes()
      fetchMeasurementUnits()
    }
  }, [open, animalData?.animal_id])

  // Fetch assessment data when drawer opens or type changes
  useEffect(() => {
    if (open && selectedType?.assessment_type_id) {
      latestRequestRef.current += 1
      setAssessmentData([])
      setPage(1)
      setHasMore(true)
      setSelectedUnit(null)
      fetchAssessmentData(1, true)
    }
  }, [open, selectedType?.assessment_type_id])

  // Load more on scroll
  useEffect(() => {
    if (inView && hasMore && !loading && !loadingMore && assessmentData.length > 0) {
      setLoadingMore(true)
      fetchAssessmentData(page + 1, false)
    }
  }, [inView])

  // Reset unit selection when assessment type changes
  useEffect(() => {
    setSelectedUnit(null)
  }, [selectedType?.assessment_type_id])

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
        // console.log('All Measurement Units:', response.data)
        const weightUnits = response.data.filter(u => u?.measurement_type?.toLowerCase() === 'weight')
        // console.log('Weight Units Only:', weightUnits)
        const baseUnit = weightUnits.find(u => u?.base_uom_name == 'gram')
        // console.log('Base Unit:', baseUnit)
      }
    } catch (error) {
      console.error('Error fetching measurement units:', error)
    }
  }

  const fetchAssessmentData = async (pageNo, reset = false) => {
    if (loading && reset) return
    if (reset) setLoading(true)
    const requestId = latestRequestRef.current
    const requestedAssessmentTypeId = selectedType?.assessment_type_id

    try {
      const params = {
        assessment_type_id: requestedAssessmentTypeId,
        page_no: pageNo,
        ref_type: 'animal'
      }

      const response = await getAssessmentData(animalData?.animal_id, params)
      const isStaleRequest =
        requestId !== latestRequestRef.current || String(requestedAssessmentTypeId) !== String(selectedType?.assessment_type_id)

      if (isStaleRequest) {
        return
      }

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
      const isStaleRequest =
        requestId !== latestRequestRef.current || String(requestedAssessmentTypeId) !== String(selectedType?.assessment_type_id)

      if (!isStaleRequest) {
        setLoading(false)
        setLoadingMore(false)
      }
    }
  }

  const handleTabChange = (event, newValue) => {
    setSelectedTypeIndex(newValue)
    setExpandedNotes({})
    setWeightSubTab(0)
    setSelectedUnit(null) // Reset unit selection when switching assessment types
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
    setSelectedUnit(null) // Reset unit selection when switching assessment types
    handleMenuClose()
  }

  const handleWeightSubTabChange = (event, newValue) => {
    setWeightSubTab(newValue)
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

  const getUnitById = unitId => {
    if (!unitId) return null

    return measurementUnits.find(unit => String(unit?.id) === String(unitId)) || null
  }

  const getRootBaseUnit = unitId => {
    if (!unitId) return null

    let currentUnit = getUnitById(unitId)
    const visited = new Set()

    while (currentUnit && currentUnit?.base_uom_id && String(currentUnit?.base_uom_id) !== String(currentUnit?.id)) {
      if (visited.has(String(currentUnit?.id))) break
      visited.add(String(currentUnit?.id))
      currentUnit = getUnitById(currentUnit?.base_uom_id)
    }

    return currentUnit || getUnitById(unitId)
  }

  const getBaseUnit = unitId => getRootBaseUnit(unitId)

  const getCompatibleUnits = unitId => {
    const sourceUnit = getUnitById(unitId)
    if (!sourceUnit) return []

    const sourceMeasurementType = sourceUnit?.measurement_type?.toLowerCase()
    const sourceRootBaseUnit = getRootBaseUnit(unitId)

    return measurementUnits.filter(unit => {
      if (unit?.measurement_type?.toLowerCase() !== sourceMeasurementType) return false

      const unitRootBaseUnit = getRootBaseUnit(unit?.id)

      return String(unitRootBaseUnit?.id || '') === String(sourceRootBaseUnit?.id || '')
    })
  }

  const compatibleUnits = useMemo(() => getCompatibleUnits(sourceUnitId), [measurementUnits, sourceUnitId])

  // Ensure the active parameter always gets a valid default unit after its data loads.
  useEffect(() => {
    if (!isNumericType || assessmentData.length === 0 || compatibleUnits.length === 0) return

    const hasValidSelectedUnit = compatibleUnits.some(unit => String(unit?.id) === String(selectedUnit))
    if (hasValidSelectedUnit) return

    const baseUnit = getBaseUnit(sourceUnitId)
    const defaultUnit = compatibleUnits.find(unit => String(unit?.id) === String(baseUnit?.id)) || compatibleUnits[0]

    if (defaultUnit) {
      setSelectedUnit(defaultUnit.id)
    }
  }, [isNumericType, assessmentData, compatibleUnits, selectedUnit, sourceUnitId])

  const convertValueToBase = (value, fromUnitId) => {
    const numericValue = parseFloat(value)
    if (Number.isNaN(numericValue) || !fromUnitId) return numericValue

    const fromUnit = getUnitById(fromUnitId)
    if (!fromUnit) return numericValue

    if (!fromUnit?.base_uom_id || String(fromUnit?.base_uom_id) === String(fromUnit?.id)) {
      return numericValue
    }

    const conversionFactor = parseFloat(fromUnit?.conversion_factor || 1)
    const directBaseValue =
      fromUnit?.measurement_type?.toLowerCase() === 'temperature'
        ? numericValue + conversionFactor
        : numericValue * conversionFactor

    return convertValueToBase(directBaseValue, fromUnit?.base_uom_id)
  }

  const convertFromBaseTo = (valueInBase, toUnitId) => {
    const numericValue = parseFloat(valueInBase)
    if (Number.isNaN(numericValue) || !toUnitId) return numericValue

    const toUnit = getUnitById(toUnitId)
    if (!toUnit) return numericValue

    if (!toUnit?.base_uom_id || String(toUnit?.base_uom_id) === String(toUnit?.id)) {
      return numericValue
    }

    const parentValue = convertFromBaseTo(numericValue, toUnit?.base_uom_id)
    const conversionFactor = parseFloat(toUnit?.conversion_factor || 1)
    const targetValue =
      toUnit?.measurement_type?.toLowerCase() === 'temperature'
        ? parentValue - conversionFactor
        : parentValue / conversionFactor

    return targetValue
  }

  const convertToUnit = (value, fromUnitId, toUnitId) => {
    if (String(fromUnitId) === String(toUnitId)) return parseFloat(value)

    const fromUnit = getUnitById(fromUnitId)
    const toUnit = getUnitById(toUnitId)

    if (!fromUnit || !toUnit) return parseFloat(value)

    if (fromUnit?.measurement_type?.toLowerCase() !== toUnit?.measurement_type?.toLowerCase()) {
      return parseFloat(value)
    }

    const fromRootBaseUnit = getRootBaseUnit(fromUnitId)
    const toRootBaseUnit = getRootBaseUnit(toUnitId)

    if (String(fromRootBaseUnit?.id || '') !== String(toRootBaseUnit?.id || '')) {
      return parseFloat(value)
    }

    const valueInBase = convertValueToBase(value, fromUnitId)
    return convertFromBaseTo(valueInBase, toUnitId)
  }

  const formatDateTime = dateTimeStr => {
    if (!dateTimeStr) return { date: '', time: '' }
    const stillUtc = moment.utc(dateTimeStr).toDate()
    const dateObj = moment(stillUtc).local(true)
    return {
      date: dateObj.format('DD MMM YYYY'),
      time: dateObj.format('hh:mm A')
    }
  }

  const renderAssessmentItem = (item, index) => {
    const { date, time } = formatDateTime(item?.recorded_date_time)
    const isEven = index % 2 === 0

    // Convert value to selected unit if weight type
    let displayValue = item?.assessment_value
    let displayUnit = getUnitAbbr(item?.assessment_unit_id)

    if (isNumericType && selectedUnit && String(item?.assessment_unit_id) !== String(selectedUnit)) {
      const convertedValue = convertToUnit(item?.assessment_value, item?.assessment_unit_id, selectedUnit)
      displayValue = parseFloat(convertedValue).toFixed(2)
      displayUnit = getUnitAbbr(selectedUnit)
    }

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
            backgroundColor: isEven
              ? theme.palette.customColors.Background
              : theme.palette.customColors.displaybgPrimary,
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
                    {displayValue}
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
                    {displayUnit}
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
                <AnimalParentCard data={animalData} backgroundColor={theme.palette.common.white} />
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
              <Box
                sx={{
                  px: 2,
                  py: 1,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap'
                }}
              >
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
                    backgroundColor: selectedTypeIndex === index ? theme.palette.action.selected : 'transparent'
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
            {/* Internal tabs for numeric type */}
            {isNumericType && (
              <>
                <Box
                  sx={{
                    display: 'flex',
                    borderBottom: `1px solid ${theme.palette.customColors.outline}`,
                    mb: 3
                  }}
                >
                  <Tabs
                    value={weightSubTab}
                    onChange={handleWeightSubTabChange}
                    sx={{
                      '& .MuiTab-root': {
                        textTransform: 'none',
                        fontSize: '13px',
                        fontWeight: 400,
                        color: theme.palette.customColors.OnSurfaceVariant,
                        minHeight: 40
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
                    <Tab label='Records' />
                    <Tab label='Trend Graph' />
                  </Tabs>
                </Box>

                {/* Unit Selector */}
                {(weightSubTab === 0 || weightSubTab === 1) && measurementUnits.length > 0 && currentMeasurementType && (
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel id='unit-select-label'>Unit of Measurement</InputLabel>
                    <Select
                      labelId='unit-select-label'
                      id='unit-select'
                      value={selectedUnit || ''}
                      label='Unit of Measurement'
                      onChange={e => setSelectedUnit(e.target.value)}
                    >
                      {getCompatibleUnits(sourceUnitId)
                        .map(unit => (
                          <MenuItem key={unit?.id} value={unit?.id}>
                            {unit?.unit_name} ({unit?.uom_abbr})
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                )}
              </>
            )}

            {/* Records Tab Content */}
            {!isNumericType || weightSubTab === 0 ? (
              loading && assessmentData.length === 0 ? (
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
              )
            ) : /* Trend Graph Tab Content */
            assessmentData.length === 0 ? (
              <Typography sx={{ textAlign: 'center', py: 4, color: theme.palette.text.secondary }}>
                No data found
              </Typography>
            ) : (
              <Box key={`chart-${selectedUnit}`}>
                <ReactApexcharts
                  key={`apex-${selectedUnit}`}
                  type='line'
                  height={280}
                  options={{
                    chart: {
                      offsetY: 1,
                      parentHeightOffset: 0,
                      toolbar: { show: false }
                    },
                    stroke: {
                      width: 3,
                      curve: 'smooth',
                      colors: [theme.palette.customColors.moderateSecondary]
                    },
                    grid: {
                      show: true,
                      padding: {
                        left: 24,
                        top: -4,
                        right: 4
                      }
                    },
                    markers: {
                      size: 4,
                      colors: [theme.palette.customColors.OnPrimary],
                      strokeColors: theme.palette.customColors.moderateSecondary,
                      strokeWidth: 2,
                      hover: {
                        size: 7
                      }
                    },
                    dataLabels: {
                      enabled: false
                    },
                    xaxis: {
                      categories: [...assessmentData]
                        .reverse()
                        .map(item => moment(item.recorded_date_time).format('DD MMM YY')),
                      labels: { rotate: -45, show: true }
                    },
                    yaxis: {
                      title: {
                        text: `${selectedType?.assessment_name || 'Value'} (${
                          selectedUnit
                            ? getUnitAbbr(selectedUnit)
                            : getUnitAbbr(assessmentData[0]?.assessment_unit_id)
                        })`
                      }
                    },
                    tooltip: {
                      custom: ({ dataPointIndex }) => {
                        if (dataPointIndex >= 0 && dataPointIndex < assessmentData.length) {
                          const reversedData = [...assessmentData].reverse()
                          const item = reversedData[dataPointIndex]
                          const { date, time } = formatDateTime(item.recorded_date_time)

                          let value = parseFloat(item.assessment_value).toFixed(2)
                          let unit = getUnitAbbr(item.assessment_unit_id)

                          if (selectedUnit && String(item?.assessment_unit_id) !== String(selectedUnit)) {
                            value = parseFloat(
                              convertToUnit(item?.assessment_value, item?.assessment_unit_id, selectedUnit)
                            ).toFixed(2)
                            unit = getUnitAbbr(selectedUnit)
                          }

                          return `
                              <div style="padding: 8px; background: ${theme.palette.customColors.onPrimary}; border: 1px solid ${theme.palette.divider}; border-radius: 4px;">
                                <div style="font-size: 12px; color: ${theme.palette.text.secondary}; margin-bottom: 4px;">${date} | ${time}</div>
                                <div style="font-size: 14px; font-weight: 500; color: ${theme.palette.customColors.onPrimary};"><strong>${value} ${unit}</strong></div>
                              </div>
                            `
                        }
                        return ''
                      }
                    }
                  }}
                  series={[
                    {
                      name: selectedType?.assessment_name || 'Value',
                      data: [...assessmentData].reverse().map(item => {
                        const value = parseFloat(item?.assessment_value)
                        if (selectedUnit && String(item?.assessment_unit_id) !== String(selectedUnit)) {
                          return parseFloat(convertToUnit(value, item?.assessment_unit_id, selectedUnit))
                        }
                        return value
                      })
                    }
                  ]}
                />
              </Box>
            )}
          </Box>
        </Box>
      </Drawer>
    </>
  )
}

export default React.memo(AssessmentDrawer)
