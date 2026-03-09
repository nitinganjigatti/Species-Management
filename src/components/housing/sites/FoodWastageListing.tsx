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
import { useRouter } from 'next/router'
import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { getSiteFoodWastage, FoodWastageData, FoodWastageListItem, FoodWastageGraphItem } from 'src/lib/api/housing'
import Icon from 'src/@core/components/icon'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { GridCellParams } from '@mui/x-data-grid'
import { format, parse } from 'date-fns'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import ReactApexcharts from 'src/@core/components/react-apexcharts'

interface IndexedFoodWastageItem extends FoodWastageListItem {
  id: number | string
  sl_no: number
}

interface FoodWastageListingProps {
  selectedTab?: string
  setSelectedTab?: (tab: string) => void
}

const FoodWastageListing: React.FC<FoodWastageListingProps> = () => {
  const theme = useTheme() as Theme
  const router = useRouter()
  const { id: siteId } = router.query

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

  const fetchFoodWastageData = useCallback(async (): Promise<void> => {
    if (!siteId) return

    setLoading(true)
    try {
      // Format dates for API (YYYY-MM-DD)
      const fromDate = filterDates.startDate ? format(filterDates.startDate, 'yyyy-MM-dd') : ''
      const toDate = filterDates.endDate ? format(filterDates.endDate, 'yyyy-MM-dd') : ''

      const params = {
        site_id: siteId as string,
        from_date: fromDate,
        to_date: toDate,
        limit: viewMode === 'List' ? pageSize : 50,
        filter: sortOrder,
        is_graph: viewMode === 'List' ? 0 : 1,
        page_no: page
      } as const

      const response = await getSiteFoodWastage(params)

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
  }, [siteId, filterDates, viewMode, sortOrder, page, pageSize])

  useEffect(() => {
    fetchFoodWastageData()
  }, [fetchFoodWastageData])

  const handleViewModeChange = (_event: React.MouseEvent<HTMLElement>, newMode: 'List' | 'Graph' | null): void => {
    if (newMode !== null) {
      setViewMode(newMode)
      setPage(1)
    }
  }

  const handleSortToggle = (): void => {
    setSortOrder(prev => (prev === 'DESC' ? 'ASC' : 'DESC'))
    setPage(1)
  }

  const handlePaginationChange = (model: { page: number; pageSize: number }): void => {
    setPage(model.page + 1)
    setPageSize(model.pageSize)
  }

  const handleRowClick = (params: { row: IndexedFoodWastageItem }): void => {
    // Navigate to section details with food wastage tab
    const sectionId = params.row.section_id
    if (sectionId) {
      router.push(`/housing/section/${sectionId}?tab=foodWastage`)
    }
  }

  const indexedRows: IndexedFoodWastageItem[] = foodWastageList.map((row, index) => ({
    ...row,
    id: row.section_id || index,
    sl_no: (page - 1) * pageSize + index + 1
  }))

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
      series: [{ name: 'Wastage', data: values }],
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
        colors: [theme.palette.common.white],
        strokeColors: theme.palette.customColors.Tertiary,
        strokeWidth: 2,
        hover: {
          size: 6
        }
      }
    }),
    [chartData, yAxisMax, theme, foodWastageData?.unit]
  )

  const columns = [
    {
      minWidth: 20,
      width: 80,
      field: 'sl_no',
      headerName: 'SL.NO',
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
      field: 'section_name',
      headerName: 'Section',
      align: 'left' as const,
      headerAlign: 'left' as const,
      sortable: false,
      renderCell: (params: GridCellParams) => {
        const row = params.row as IndexedFoodWastageItem

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {row.file_name ? (
              <Box
                component='img'
                src={row.file_name}
                alt={row.section_name}
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
                <Icon icon='mdi:folder-outline' fontSize={24} color={theme.palette.grey[500]} />
              </Box>
            )}
            <Typography
              sx={{
                color: theme.palette.customColors.onPrimaryContainer,
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              {row.section_name || '-'}
            </Typography>
          </Box>
        )
      }
    },
    {
      minWidth: 150,
      width: 200,
      field: 'total_wastage',
      headerName: 'Total Wastage',
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
          Food Wastage
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
      {viewMode === 'List' && foodWastageData?.highest_wastage && (
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
              Total Wastage
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

          <Box
            sx={{
              p: 2.5,
              backgroundColor: theme.palette.common.white,
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
              Section{' '}
              <Typography
                component='span'
                sx={{ fontWeight: 700, color: theme.palette.customColors.OnPrimaryContainer }}
              >
                {foodWastageData?.highest_wastage?.section_name}
              </Typography>{' '}
              with{' '}
              <Typography component='span' sx={{ fontWeight: 700, color: theme.palette.customColors.Tertiary }}>
                {foodWastageData?.highest_wastage?.total_wastage} {foodWastageData?.highest_wastage?.unit || 'Kg'}
              </Typography>{' '}
              recorded the highest wastage in this site, accounting for{' '}
              <Typography component='span' sx={{ fontWeight: 700, color: theme.palette.customColors.Tertiary }}>
                {foodWastageData?.highest_wastage?.wastage_per}%
              </Typography>{' '}
              of the total.
            </Typography>
          </Box>
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
                      Total Wastage
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
                      Daily Average
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

                {/* Section Average Description Card */}
                {foodWastageData?.section_average && (
                  <Box
                    sx={{
                      p: 2.5,
                      backgroundColor: theme.palette.common.white,
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
                      The site has an average food wastage of{' '}
                      <Typography component='span' sx={{ fontWeight: 700, color: theme.palette.customColors.Tertiary }}>
                        {foodWastageData?.section_average} {foodWastageData?.unit || 'Kg'}
                      </Typography>{' '}
                      per section
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
                  No data available for the selected period
                </Typography>
              </Box>
            </Card>
          )}
        </Box>
      )}

      {/* List View */}
      {viewMode === 'List' && (
        <Box>
          {/* Section header with sort toggle - matching mobile design */}
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
              Sections
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
                {sortOrder === 'DESC' ? 'High To Low' : 'Low To High'}
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
            // onRowClick={handleRowClick}
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
    </Box>
  )
}

export default FoodWastageListing
