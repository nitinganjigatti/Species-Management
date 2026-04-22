import {
  Box,
  Typography,
  useTheme,
  Theme,
  ToggleButton,
  ToggleButtonGroup,
  Card,
  CircularProgress
} from '@mui/material'
import useSafeRouter from 'src/hooks/useSafeRouter'
import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { getFoodWastage, FoodWastageData, FoodWastageListItem, FoodWastageGraphItem } from 'src/lib/api/housing'
import Icon from 'src/@core/components/icon'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { GridCellParams } from '@mui/x-data-grid'
import { format, parse } from 'date-fns'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import ReactApexcharts from 'src/@core/components/react-apexcharts'
import FoodWastageDetailsDrawer from './FoodWastageDetailsDrawer'
import { useTranslation } from 'react-i18next'

interface IndexedFoodWastageItem extends FoodWastageListItem {
  id: number | string
  sl_no: number
}

interface FoodWastageListingProps {
  selectedTab?: string
  setSelectedTab?: (tab: string) => void
  refType?: 'site' | 'section' | 'enclosure'
}

// State for details drawer
interface DetailsDrawerState {
  open: boolean
  wastageDate: string
  totalWastage: string | number
  unit: string
}

const FoodWastageListing: React.FC<FoodWastageListingProps> = ({ refType = 'site' }) => {
  const { t } = useTranslation()
  const theme = useTheme() as Theme
  const router = useSafeRouter()
  const { id } = router.query

  const [loading, setLoading] = useState<boolean>(false)
  const [foodWastageData, setFoodWastageData] = useState<FoodWastageData>({})
  const [foodWastageList, setFoodWastageList] = useState<FoodWastageListItem[]>([])
  const [graphList, setGraphList] = useState<FoodWastageGraphItem[]>([])
  const [totalCount, setTotalCount] = useState<number>(0)
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)

  // View toggle: List or Graph
  const [viewMode, setViewMode] = useState<'List' | 'Graph'>('List')

  // Sort filter: ASC or DESC (High to Low / Low to High)
  const [sortOrder, setSortOrder] = useState<'DESC' | 'ASC'>('DESC')

  // Date range filter using CommonDateRangePickers
  const [filterDates, setFilterDates] = useState<{ startDate: Date | null; endDate: Date | null }>({
    startDate: null,
    endDate: null
  })

  // Details drawer state (for enclosure level)
  const [detailsDrawer, setDetailsDrawer] = useState<DetailsDrawerState>({
    open: false,
    wastageDate: '',
    totalWastage: 0,
    unit: 'Kg'
  })

  // Handle date range change from CommonDateRangePickers
  const handleDateRangeChange = (startDate: Date | string, endDate: Date | string): void => {
    if (startDate && endDate) {
      const start = startDate instanceof Date ? startDate : new Date(startDate)
      const end = endDate instanceof Date ? endDate : new Date(endDate)
      setFilterDates({ startDate: start, endDate: end })
    } else {
      // All time - clear dates
      setFilterDates({ startDate: null, endDate: null })
    }
    setPage(1)
  }

  // Fetch data when dependencies change
  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      if (!id) return

      setLoading(true)
      try {
        // Format dates for API (YYYY-MM-DD)
        const fromDate = filterDates.startDate ? format(filterDates.startDate, 'yyyy-MM-dd') : ''
        const toDate = filterDates.endDate ? format(filterDates.endDate, 'yyyy-MM-dd') : ''

        // Build params based on refType
        const getIdParam = () => {
          switch (refType) {
            case 'site':
              return { site_id: id as string }
            case 'section':
              return { section_id: id as string }
            case 'enclosure':
              return { enclosure_id: id as string }
            default:
              return { site_id: id as string }
          }
        }

        const params = {
          ...getIdParam(),
          from_date: fromDate,
          to_date: toDate,
          limit: viewMode === 'List' ? pageSize : 50,
          filter: sortOrder,
          is_graph: (viewMode === 'List' ? 0 : 1) as 0 | 1,
          page_no: page
        }

        const response = await getFoodWastage(refType, params)

        if (response?.success) {
          setFoodWastageData(response?.data || {})
          setFoodWastageList(response?.data?.list || [])
          setGraphList(response?.data?.graphlist || [])
          setTotalCount(response?.data?.total_count || response?.data?.list?.length || 0)
        } else {
          setFoodWastageData({})
          setFoodWastageList([])
          setGraphList([])
          setTotalCount(0)
        }
      } catch {
        setFoodWastageData({})
        setFoodWastageList([])
        setGraphList([])
        setTotalCount(0)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, refType, filterDates.startDate, filterDates.endDate, viewMode, sortOrder, page, pageSize])

  const handleViewModeChange = (_event: React.MouseEvent<HTMLElement>, newMode: 'List' | 'Graph' | null): void => {
    if (newMode !== null) {
      setViewMode(newMode)
      setPage(1)
    }
  }

  const handleSortToggle = (): void => {
    const newSortOrder = sortOrder === 'DESC' ? 'ASC' : 'DESC'
    setSortOrder(newSortOrder)
    setPage(1)
  }

  const handlePaginationChange = (model: { page: number; pageSize: number }): void => {
    setPage(model.page + 1)
    setPageSize(model.pageSize)
  }

  const handleRowClick = (params: { row: IndexedFoodWastageItem }): void => {
    if (refType === 'site') {
      // Navigate to section details with food wastage tab
      const sectionId = params.row.section_id
      if (sectionId) {
        router.push(`/housing/sections/${sectionId}?tab=foodWastage`)
      }
    } else if (refType === 'enclosure') {
      // Open details drawer for enclosure
      const row = params.row
      if (row.wastage_date) {
        setDetailsDrawer({
          open: true,
          wastageDate: row.wastage_date,
          totalWastage: row.total_wastage || 0,
          unit: row.unit || 'Kg'
        })
      }
    }
    // For section view, enclosure navigation can be added if needed
  }

  const handleCloseDetailsDrawer = (): void => {
    setDetailsDrawer(prev => ({ ...prev, open: false }))
  }

  const indexedRows: IndexedFoodWastageItem[] = foodWastageList.map((row, index) => {
    let rowId: number | string = index
    if (refType === 'site') {
      rowId = row.section_id || index
    } else if (refType === 'section') {
      rowId = row.enclosure_id || index
    } else if (refType === 'enclosure') {
      // For enclosure, use wastage_date as unique identifier
      rowId = row.wastage_date || index
    }

    return {
      ...row,
      id: rowId,
      sl_no: (page - 1) * pageSize + index + 1
    }
  })

  // Process graph data for chart
  const chartData = useMemo(() => {
    if (!graphList || graphList.length === 0) return { series: [], categories: [] }

    // Sort by date
    const sortedData = [...graphList].sort((a, b) => {
      const dateA = a.wastage_date ? new Date(a.wastage_date).getTime() : 0
      const dateB = b.wastage_date ? new Date(b.wastage_date).getTime() : 0

      return dateA - dateB
    })

    const categories = sortedData.map(item => {
      if (!item.wastage_date) return ''
      try {
        const date = parse(item.wastage_date, 'yyyy-MM-dd', new Date())

        return format(date, 'dd/MM')
      } catch {
        return item.wastage_date
      }
    })

    const values = sortedData.map(item => {
      const val = parseFloat(String(item.total_wastage || 0))

      return isNaN(val) ? 0 : val
    })

    return {
      series: [{ name: t('housing_module.total_wastage'), data: values }],
      categories
    }
  }, [graphList])

  // Calculate Y-axis max value
  const yAxisMax = useMemo(() => {
    if (chartData.series.length === 0 || chartData.series[0].data.length === 0) {
      return 100
    }

    const maxValue = Math.max(...chartData.series[0].data)
    const numberOfSections = 4
    const step = Math.ceil(maxValue / numberOfSections) || 1

    return step * numberOfSections
  }, [chartData])

  // Chart options
  const chartOptions = useMemo(
    () => ({
      chart: {
        toolbar: { show: false },
        zoom: { enabled: false },
        parentHeightOffset: 0
      },
      stroke: {
        width: 3,
        curve: 'smooth'
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 0.1,
          stops: [0, 90, 100]
        }
      },
      colors: [theme.palette.customColors.Tertiary],
      dataLabels: {
        enabled: false
      },
      grid: {
        show: true,
        borderColor: theme.palette.divider,
        padding: {
          left: 10,
          right: 10
        }
      },
      xaxis: {
        categories: chartData.categories,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          style: {
            colors: theme.palette.text.secondary,
            fontSize: '12px'
          },
          rotate: -45,
          rotateAlways: chartData.categories.length > 10
        }
      },
      yaxis: {
        max: yAxisMax,
        min: 0,
        tickAmount: 4,
        labels: {
          style: {
            colors: theme.palette.text.secondary,
            fontSize: '12px'
          },
          formatter: (val: number) => `${val}kg`
        }
      },
      tooltip: {
        shared: true,
        intersect: false,
        y: {
          formatter: (val: number) => `${val} ${foodWastageData?.unit || 'Kg'}`
        },
        theme: theme.palette.mode
      },
      markers: {
        size: 4,
        colors: [theme.palette.customColors?.OnPrimary],
        strokeColors: theme.palette.customColors.Tertiary,
        strokeWidth: 2,
        hover: {
          size: 6
        }
      }
    }),
    [chartData, yAxisMax, theme, foodWastageData?.unit]
  )

  // Dynamic labels based on refType
  // Site shows Sections, Section shows Enclosures, Enclosure shows daily entries
  const getEntityLabels = () => {
    switch (refType) {
      case 'site':
        return { singular: t('housing_module.section'), plural: t('sections') }
      case 'section':
        return { singular: t('housing_module.enclosure'), plural: t('enclosures') }
      case 'enclosure':
        return { singular: t('date'), plural: t('housing_module.daily_entries') }
      default:
        return { singular: t('housing_module.section'), plural: t('sections') }
    }
  }
  const { singular: entityLabel, plural: entityLabelPlural } = getEntityLabels()

  // Columns for site and section (showing sub-entities)
  const entityColumns = [
    {
      minWidth: 20,
      width: 80,
      field: 'sl_no',
      headerName: t('s_no'),
      align: 'left' as const,
      headerAlign: 'left' as const,
      sortable: false,
      renderCell: (params: GridCellParams) => (
        <Typography
          sx={{
            color: theme.palette.customColors.onPrimaryContainer,
            fontSize: '14px',
            fontWeight: 500,
            pl: 2
          }}
        >
          {(params.row as IndexedFoodWastageItem).sl_no}.
        </Typography>
      )
    },
    {
      minWidth: 200,
      flex: 1,
      field: refType === 'site' ? 'section_name' : 'user_enclosure_name',
      headerName: entityLabel,
      align: 'left' as const,
      headerAlign: 'left' as const,
      sortable: false,
      renderCell: (params: GridCellParams) => {
        const row = params.row as IndexedFoodWastageItem
        const name = refType === 'site' ? row.section_name : row.user_enclosure_name

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {row.file_name ? (
              <Box
                component='img'
                src={row.file_name}
                alt={name}
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '8px',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '8px',
                  backgroundColor: theme.palette.grey[200],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Icon
                  icon={refType === 'site' ? 'mdi:folder-outline' : 'mdi:home-outline'}
                  fontSize={24}
                  color={theme.palette.grey[500]}
                />
              </Box>
            )}
            <Typography
              sx={{
                color: theme.palette.customColors.onPrimaryContainer,
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              {name || '-'}
            </Typography>
          </Box>
        )
      }
    },
    {
      flex: 1,
      minWidth: 200,
      field: 'total_wastage',
      headerName: t('housing_module.total_wastage'),
      align: 'right' as const,
      headerAlign: 'right' as const,
      sortable: false,
      renderCell: (params: GridCellParams) => {
        const row = params.row as IndexedFoodWastageItem

        return (
          <Typography
            sx={{
              color: theme.palette.customColors.Tertiary,
              fontSize: '18px',
              fontWeight: 600,
              pr: 2
            }}
          >
            {row.total_wastage || 0}
            <Typography
              component='span'
              sx={{
                color: theme.palette.customColors.Tertiary,
                fontSize: '14px',
                fontWeight: 500,
                ml: 0.5
              }}
            >
              {row.unit || 'Kg'}
            </Typography>
          </Typography>
        )
      }
    }
  ]

  // Columns for enclosure (showing daily entries)
  const enclosureColumns = [
    {
      minWidth: 20,
      width: 80,
      field: 'sl_no',
      headerName: t('s_no'),
      align: 'left' as const,
      headerAlign: 'left' as const,
      sortable: false,
      renderCell: (params: GridCellParams) => (
        <Typography
          sx={{
            color: theme.palette.customColors.onPrimaryContainer,
            fontSize: '14px',
            fontWeight: 500,
            pl: 2
          }}
        >
          {(params.row as IndexedFoodWastageItem).sl_no}.
        </Typography>
      )
    },
    {
      minWidth: 200,
      flex: 1,
      field: 'wastage_date',
      headerName: t('date'),
      align: 'left' as const,
      headerAlign: 'left' as const,
      sortable: false,
      renderCell: (params: GridCellParams) => {
        const row = params.row as IndexedFoodWastageItem
        let formattedDate = row.wastage_date || '-'
        try {
          if (row.wastage_date) {
            const date = parse(row.wastage_date, 'yyyy-MM-dd', new Date())
            formattedDate = format(date, 'dd MMM yyyy')
          }
        } catch {
          // Keep original date string
        }

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '8px',
                backgroundColor: theme.palette.grey[100],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Icon icon='mdi:calendar' fontSize={24} color={theme.palette.customColors.Tertiary} />
            </Box>
            <Typography
              sx={{
                color: theme.palette.customColors.onPrimaryContainer,
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              {formattedDate}
            </Typography>
          </Box>
        )
      }
    },
    {
      minWidth: 100,
      width: 120,
      field: 'total_entry',
      headerName: t('housing_module.entries'),
      align: 'center' as const,
      headerAlign: 'center' as const,
      sortable: false,
      renderCell: (params: GridCellParams) => {
        const row = params.row as IndexedFoodWastageItem

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <Icon icon='mdi:clipboard-list-outline' fontSize={18} color={theme.palette.text.secondary} />
            <Typography
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              {row.total_entry || 0}
            </Typography>
          </Box>
        )
      }
    },
    {
      flex: 1,
      minWidth: 200,
      field: 'total_wastage',
      headerName: t('housing_module.total_wastage'),
      align: 'right' as const,
      headerAlign: 'right' as const,
      sortable: false,
      renderCell: (params: GridCellParams) => {
        const row = params.row as IndexedFoodWastageItem

        return (
          <Typography
            sx={{
              color: theme.palette.customColors.Tertiary,
              fontSize: '18px',
              fontWeight: 600,
              pr: 2
            }}
          >
            {row.total_wastage || 0}
            <Typography
              component='span'
              sx={{
                color: theme.palette.customColors.Tertiary,
                fontSize: '14px',
                fontWeight: 500,
                ml: 0.5
              }}
            >
              {row.unit || 'Kg'}
            </Typography>
          </Typography>
        )
      }
    }
  ]

  // Use appropriate columns based on refType
  const columns = refType === 'enclosure' ? enclosureColumns : entityColumns

  return (
    <Box sx={{ mt: 4 }}>
      {/* Header with title and view toggle */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3
        }}
      >
        <Typography variant='h6' sx={{ fontWeight: 600 }}>
          {t('housing_module.food_wastage')}
        </Typography>

        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewModeChange}
          size='small'
          sx={{
            '& .MuiToggleButton-root': {
              px: 2,
              py: 0.5
            }
          }}
        >
          <ToggleButton value='List'>
            <Icon icon='mdi:format-list-bulleted' fontSize={18} />
          </ToggleButton>
          <ToggleButton value='Graph'>
            <Icon icon='mdi:chart-bar' fontSize={18} />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Date Range Filter */}
      <Box sx={{ mb: 3, maxWidth: 400 }}>
        <CommonDateRangePickers
          onChange={handleDateRangeChange}
          filterDates={filterDates}
          showFutureDates={false}
          showAllTime={true}
        />
      </Box>

      {/* Summary Card - Only show in List view when data is available */}
      {/* For site/section: show highest wastage info. For enclosure: show total and daily average */}
      {viewMode === 'List' && (foodWastageData?.total_wastage || foodWastageData?.highest_wastage) && (
        <Card
          sx={{
            mb: 4,
            p: 3,
            backgroundColor: theme.palette.customColors.OnBackground,
            borderRadius: '8px',
            boxShadow: 'none'
          }}
        >
          <Box sx={{ mb: 2 }}>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                color: theme.palette.customColors.OnPrimaryContainer
              }}
            >
              {t('housing_module.total_wastage')}
            </Typography>
            <Typography
              sx={{
                fontSize: '32px',
                fontWeight: 700,
                color: theme.palette.customColors.Tertiary
              }}
            >
              {foodWastageData?.total_wastage || 0}
              <Typography
                component='span'
                sx={{
                  fontSize: '24px',
                  fontWeight: 600,
                  color: theme.palette.customColors.Tertiary,
                  ml: 1
                }}
              >
                {foodWastageData?.unit || 'Kg'}
              </Typography>
            </Typography>
          </Box>

          {/* Show highest wastage info for site/section, daily average for enclosure */}
          {refType !== 'enclosure' && foodWastageData?.highest_wastage && (
            <Box
              sx={{
                p: 2.5,
                backgroundColor: theme.palette.customColors?.OnPrimary,
                borderRadius: 1,
                border: `1px solid ${theme.palette.customColors.OutlineVariant}`
              }}
            >
              <Typography
                sx={{
                  fontSize: '14px',
                  color: theme.palette.customColors.OnSurfaceVariant,
                  lineHeight: 1.7
                }}
              >
                {t('housing_module.highest_wastage_string', {
                  entity: entityLabel,
                  name: refType === 'site'
                    ? foodWastageData?.highest_wastage?.section_name
                    : foodWastageData?.highest_wastage?.user_enclosure_name,
                  weight: `${foodWastageData?.highest_wastage?.total_wastage} ${foodWastageData?.highest_wastage?.unit || 'Kg'}`,
                  refType: refType,
                  percentage: `${foodWastageData?.highest_wastage?.wastage_per}%`
                })}
              </Typography>
            </Box>
          )}

          {/* Show daily average for enclosure */}
          {refType === 'enclosure' && foodWastageData?.daily_average && (
            <Box
              sx={{
                p: 2.5,
                backgroundColor: theme.palette.customColors?.OnPrimary,
                borderRadius: 1,
                border: `1px solid ${theme.palette.customColors.OutlineVariant}`
              }}
            >
              <Typography
                sx={{
                  fontSize: '14px',
                  color: theme.palette.customColors.OnSurfaceVariant,
                  lineHeight: 1.7
                }}
              >
                {t('housing_module.daily_average')}{' '}
                <Typography component='span' sx={{ fontWeight: 700, color: theme.palette.customColors.Tertiary }}>
                  {foodWastageData?.daily_average} {foodWastageData?.unit || 'Kg'}
                </Typography>
              </Typography>
            </Box>
          )}
        </Card>
      )}

      {/* Graph View */}
      {viewMode === 'Graph' && (
        <Box>
          {loading ? (
            <Card sx={{ mb: 4, p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                <CircularProgress />
              </Box>
            </Card>
          ) : graphList.length > 0 ? (
            <>
              {/* Summary Card - Matching mobile design */}
              <Card
                sx={{
                  mb: 4,
                  p: 3,
                  backgroundColor: theme.palette.customColors.OnBackground,
                  borderRadius: '8px',
                  boxShadow: 'none'
                }}
              >
                {/* Stats Row */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 3
                  }}
                >
                  {/* Total Wastage */}
                  <Box sx={{ textAlign: 'center', flex: 1 }}>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: theme.palette.customColors.OnPrimaryContainer,
                        mb: 1
                      }}
                    >
                      {t('housing_module.total_wastage')}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '28px',
                        fontWeight: 700,
                        color: theme.palette.customColors.Tertiary
                      }}
                    >
                      {foodWastageData?.total_wastage || 0}
                      <Typography
                        component='span'
                        sx={{
                          fontSize: '18px',
                          fontWeight: 600,
                          color: theme.palette.customColors.Tertiary,
                          ml: 0.5
                        }}
                      >
                        {foodWastageData?.unit || 'Kg'}
                      </Typography>
                    </Typography>
                  </Box>

                  {/* Daily Average */}
                  <Box sx={{ textAlign: 'center', flex: 1 }}>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: theme.palette.customColors.OnPrimaryContainer,
                        mb: 1
                      }}
                    >
                      {t('housing_module.daily_average')}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '28px',
                        fontWeight: 700,
                        color: theme.palette.customColors.Tertiary
                      }}
                    >
                      {foodWastageData?.daily_average || 0}
                      <Typography
                        component='span'
                        sx={{
                          fontSize: '18px',
                          fontWeight: 600,
                          color: theme.palette.customColors.Tertiary,
                          ml: 0.5
                        }}
                      >
                        {foodWastageData?.unit || 'Kg'}
                      </Typography>
                    </Typography>
                  </Box>
                </Box>

                {/* Average Description Card - Different text based on refType matching mobile */}
                {/* Site level: Show section_average */}
                {refType === 'site' && foodWastageData?.section_average && (
                  <Box
                    sx={{
                      p: 2.5,
                      backgroundColor: theme.palette.customColors?.OnPrimary,
                      borderRadius: 1,
                      border: `1px solid ${theme.palette.customColors.Tertiary}`,
                      bgcolor: `${theme.palette.customColors.Tertiary}08`
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '14px',
                        color: theme.palette.customColors.OnSurfaceVariant,
                        lineHeight: 1.7
                      }}
                    >
                      {t('housing_module.site_graph_average_string', {
                        weight: `${foodWastageData?.section_average} ${foodWastageData?.unit || 'Kg'}`
                      })}
                    </Typography>
                  </Box>
                )}

                {/* Section level: Show site_percentage and total_site_wastage */}
                {refType === 'section' && (foodWastageData?.site_percentage || foodWastageData?.total_site_wastage) && (
                  <Box
                    sx={{
                      p: 2.5,
                      backgroundColor: theme.palette.customColors?.OnPrimary,
                      borderRadius: 1,
                      border: `1px solid ${theme.palette.customColors.Tertiary}`,
                      bgcolor: `${theme.palette.customColors.Tertiary}08`
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '14px',
                        color: theme.palette.customColors.OnSurfaceVariant,
                        lineHeight: 1.7
                      }}
                    >
                      {t('housing_module.section_graph_average_string', {
                        percentage: `${foodWastageData?.site_percentage || 0}%`,
                        weight: `${foodWastageData?.total_site_wastage || 0} ${foodWastageData?.unit || 'Kg'}`
                      })}
                    </Typography>
                  </Box>
                )}

                {/* Enclosure level: Show section_percentage and total_section_wastage */}
                {refType === 'enclosure' &&
                  (foodWastageData?.section_percentage || foodWastageData?.total_section_wastage) && (
                    <Box
                      sx={{
                        p: 2.5,
                        backgroundColor: theme.palette.customColors?.OnPrimary,
                        borderRadius: 1,
                        border: `1px solid ${theme.palette.customColors.Tertiary}`,
                        bgcolor: `${theme.palette.customColors.Tertiary}08`
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '14px',
                          color: theme.palette.customColors.OnSurfaceVariant,
                          lineHeight: 1.7
                        }}
                      >
                        {t('housing_module.enclosure_graph_average_string', {
                          percentage: `${foodWastageData?.section_percentage || 0}%`,
                          weight: `${foodWastageData?.total_section_wastage || 0} ${foodWastageData?.unit || 'Kg'}`
                        })}
                      </Typography>
                    </Box>
                  )}
              </Card>

              {/* Area Chart */}
              <Card sx={{ p: 3 }}>
                <ReactApexcharts type='area' height={350} options={chartOptions} series={chartData.series} />
              </Card>
            </>
          ) : (
            <Card sx={{ mb: 4, p: 4 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6 }}>
                <Icon icon='mdi:chart-line-variant' fontSize={64} color={theme.palette.text.disabled} />
                <Typography sx={{ mt: 2, color: theme.palette.text.secondary }}>
                  {t('housing_module.no_data_for_period')}
                </Typography>
              </Box>
            </Card>
          )}
        </Box>
      )}

      {/* List View */}
      {viewMode === 'List' && (
        <Box>
          {/* Header with sort toggle - matching mobile design */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 3,
              mt: 2
            }}
          >
            <Typography
              sx={{
                fontSize: '16px',
                fontWeight: 600,
                color: theme.palette.customColors.OnPrimaryContainer
              }}
            >
              {entityLabelPlural}
            </Typography>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                '&:hover': {
                  opacity: 0.8
                }
              }}
              onClick={handleSortToggle}
            >
              <Icon icon='mdi:sort-variant' fontSize={18} color={theme.palette.customColors.OnPrimaryContainer} />
              <Typography
                sx={{ fontSize: '14px', fontWeight: 500, color: theme.palette.customColors.OnPrimaryContainer }}
              >
                {sortOrder === 'DESC' ? t('high_to_low') : t('low_to_high')}
              </Typography>
            </Box>
          </Box>

          {/* Data Table */}
          <CommonTable
            columns={columns}
            indexedRows={indexedRows}
            loading={loading}
            total={totalCount}
            paginationModel={{ page: page - 1, pageSize }}
            setPaginationModel={handlePaginationChange}
            onRowClick={handleRowClick}
            getRowHeight={() => 'auto'}
            externalTableStyle={{
              '& .MuiDataGrid-cell': {
                padding: '12px 8px'
              },
              '& .MuiDataGrid-row:hover': {
                cursor: 'pointer'
              }
            }}
          />
        </Box>
      )}

      {/* Food Wastage Details Drawer - for enclosure level */}
      {refType === 'enclosure' && (
        <FoodWastageDetailsDrawer
          open={detailsDrawer.open}
          onClose={handleCloseDetailsDrawer}
          enclosureId={id as string}
          wastageDate={detailsDrawer.wastageDate}
          totalWastage={detailsDrawer.totalWastage}
          unit={detailsDrawer.unit}
        />
      )}
    </Box>
  )
}

export default FoodWastageListing
