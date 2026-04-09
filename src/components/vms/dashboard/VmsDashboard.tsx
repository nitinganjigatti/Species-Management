'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import CircularProgress from '@mui/material/CircularProgress'
import Icon from 'src/@core/components/icon'
import { VMS_STATUS_OPTIONS } from 'src/constants/vms'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import Utility from 'src/utility'
import { useReportSummary } from 'src/hooks/vms/useVmsReports'

const ReactApexcharts = dynamic(() => import('react-apexcharts'), { ssr: false })

// ─── Chart options ────────────────────────────────────────────────────────────

const FONT = 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
const GRID_COLOR = '#E8EDE9'
const LABEL_COLOR = '#7A8684'

const peakHourLabels = [
  '6 AM', '7 AM', '8 AM', '9 AM', '10 AM', '11 AM',
  '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM',
  '6 PM', '7 PM', '8 PM', '9 PM', '10 PM',
]

const dailyChartBaseOptions = {
  chart: { type: 'bar', toolbar: { show: false }, fontFamily: FONT, background: 'transparent' },
  colors: ['#37BD69'],
  plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } },
  xaxis: {
    categories: [],
    tickAmount: 6,
    labels: { style: { fontSize: '11px', colors: LABEL_COLOR }, rotate: -30, rotateAlways: false },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: { labels: { style: { fontSize: '11px', colors: LABEL_COLOR } }, min: 0 },
  grid: { borderColor: GRID_COLOR, strokeDashArray: 4, xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
  dataLabels: { enabled: false },
  tooltip: { theme: 'light', style: { fontFamily: FONT, fontSize: '12px' }, y: { title: { formatter: () => 'Visitors:' } } },
  states: { hover: { filter: { type: 'darken', value: 0.85 } } },
}

const peakChartOptions = {
  chart: { type: 'bar', toolbar: { show: false }, fontFamily: FONT, background: 'transparent' },
  colors: ['#00AEA4'],
  plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } },
  xaxis: {
    categories: peakHourLabels,
    labels: { style: { fontSize: '11px', colors: LABEL_COLOR }, rotate: -30 },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: { labels: { style: { fontSize: '11px', colors: LABEL_COLOR } }, min: 0 },
  grid: { borderColor: GRID_COLOR, strokeDashArray: 4, xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
  dataLabels: { enabled: false },
  tooltip: { theme: 'light', style: { fontFamily: FONT, fontSize: '12px' }, y: { title: { formatter: () => 'Visitors:' } } },
  states: { hover: { filter: { type: 'darken', value: 0.88 } } },
}

const sitesChartOptions = {
  chart: { type: 'bar', toolbar: { show: false }, fontFamily: FONT, background: 'transparent' },
  colors: ['#37BD69'],
  fill: {
    type: 'gradient',
    gradient: {
      shade: 'light',
      type: 'horizontal',
      shadeIntensity: 0.25,
      gradientToColors: ['#006D35'],
      inverseColors: false,
      opacityFrom: 1,
      opacityTo: 0.85,
      stops: [0, 100],
    },
  },
  plotOptions: { bar: { borderRadius: 4, horizontal: true, barHeight: '55%', dataLabels: { position: 'top' } } },
  xaxis: {
    labels: { style: { fontSize: '11px', colors: LABEL_COLOR } },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: { labels: { style: { fontSize: '12px', colors: '#44544A' } } },
  grid: {
    borderColor: GRID_COLOR,
    strokeDashArray: 4,
    xaxis: { lines: { show: true } },
    yaxis: { lines: { show: false } },
    padding: { top: 0, right: 20, bottom: 0, left: 0 },
  },
  dataLabels: {
    enabled: true,
    offsetX: 6,
    style: { fontSize: '12px', fontFamily: FONT, colors: ['#44544A'], fontWeight: '500' },
    formatter: (val: number) => String(val),
  },
  tooltip: { theme: 'light', style: { fontFamily: FONT, fontSize: '12px' }, y: { title: { formatter: () => 'Visitors:' } } },
  states: { hover: { filter: { type: 'darken', value: 0.88 } } },
}

// ─── Component ────────────────────────────────────────────────────────────────

const VmsDashboard = () => {
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' })
  const [statusFilter, setStatusFilter] = useState('')
  const [siteFilter, setSiteFilter] = useState('')

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    if (startDate && endDate) {
      setDateRange({ startDate: Utility.formatDate(startDate), endDate: Utility.formatDate(endDate) })
    } else {
      setDateRange({ startDate: '', endDate: '' })
    }
  }

  const reportParams = {
    ...(dateRange.startDate && { start_date: dateRange.startDate }),
    ...(dateRange.endDate && { end_date: dateRange.endDate }),
    ...(statusFilter && { status: statusFilter }),
    ...(siteFilter && { site_id: Number(siteFilter) }),
  }
  const { data: summaryResponse, isLoading } = useReportSummary(reportParams)
  const summary = summaryResponse?.data

  const getStatusCount = (status: string) => {
    const found = summary?.by_status?.find((s: any) => s.status === status)

    return found ? Number(found.count) : 0
  }

  const KPI_ITEMS = [
    { icon: 'mdi:account-group-outline', label: 'Total Visitors', value: summary?.total_visitors ?? 0, color: '#006D35' },
    { icon: 'mdi:clock-outline', label: 'Active', value: getStatusCount('active'), color: '#1976D2' },
    { icon: 'mdi:login', label: 'Checked In', value: getStatusCount('checked_in'), color: '#37BD69' },
    { icon: 'mdi:logout', label: 'Checked Out', value: getStatusCount('checked_out'), color: '#616161' },
    { icon: 'mdi:timer-off-outline', label: 'Expired', value: getStatusCount('expired'), color: '#E65100' },
  ]

  const byDay = summary?.by_day ?? []
  const dailyData = byDay.map((d: any) => d.count)
  const dailyCategories = byDay.map((d: any) => {
    const date = new Date(d.date)

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  })

  const rawPeakHours = summary?.peak_hours ?? []
  const peakSeries = Array.isArray(rawPeakHours) ? rawPeakHours.map((h: any) => (typeof h === 'object' ? h.count : h)) : []
  const peakCategories = Array.isArray(rawPeakHours) && rawPeakHours.length > 0 && typeof rawPeakHours[0] === 'object'
    ? rawPeakHours.map((h: any) => h.hour ?? '')
    : peakHourLabels.slice(0, peakSeries.length)

  const topSites = summary?.top_sites ?? []

  const hasFilters = dateRange.startDate || dateRange.endDate || statusFilter || siteFilter

  return (
    <Box>
      <Card
        sx={{
          borderRadius: '10px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
          overflow: 'hidden',
          bgcolor: 'background.paper',
        }}
      >
        {/* ── Card Header: Title + Filters ──────────────────────────────────── */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 6,
            py: 5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            flexWrap: 'wrap',
            gap: 3,
          }}
        >
          <Typography
            variant='h6'
            sx={{
              fontSize: '18px',
              fontWeight: 600,
              color: 'text.primary',
              lineHeight: 1.4,
            }}
          >
            Dashboard
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <Box sx={{ maxWidth: 280 }}>
              <CommonDateRangePickers onChange={handleDateRangeChange} filterDates={dateRange} />
            </Box>

            <FormControl size='small'>
              <Select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                displayEmpty
                sx={{
                  fontSize: '13px',
                  color: 'text.secondary',
                  minWidth: 130,
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'customColors.OutlineVariant',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                  },
                }}
              >
                {VMS_STATUS_OPTIONS.map(opt => (
                  <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '13px' }}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size='small'>
              <Select
                value={siteFilter}
                onChange={e => setSiteFilter(e.target.value)}
                displayEmpty
                sx={{
                  fontSize: '13px',
                  color: 'text.secondary',
                  minWidth: 130,
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'customColors.OutlineVariant',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                  },
                }}
              >
                <MenuItem value='' sx={{ fontSize: '13px' }}>All Sites</MenuItem>
                {topSites.map((s: any) => (
                  <MenuItem key={s.site_name} value={s.site_name} sx={{ fontSize: '13px' }}>
                    {s.site_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {hasFilters && (
              <Button
                size='small'
                onClick={() => {
                  setDateRange({ startDate: '', endDate: '' })
                  setStatusFilter('')
                  setSiteFilter('')
                }}
                startIcon={<Icon icon='mdi:filter-off-outline' fontSize={16} />}
                sx={{
                  textTransform: 'none',
                  color: 'customColors.neutralSecondary',
                  fontSize: '13px',
                }}
              >
                Clear
              </Button>
            )}
          </Box>
        </Box>

        {/* ── KPI Grid (5 columns, border separators) ───────────────────────── */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          {KPI_ITEMS.map((kpi, i) => (
            <Box
              key={kpi.label}
              sx={{
                px: 6,
                py: 5,
                borderRight: i < KPI_ITEMS.length - 1 ? '1px solid' : 'none',
                borderColor: 'divider',
              }}
            >
              {/* Icon circle 24×24 */}
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  bgcolor: kpi.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 3,
                  flexShrink: 0,
                }}
              >
                <Icon icon={kpi.icon} fontSize={13} color='#FFFFFF' />
              </Box>

              {/* Number */}
              <Typography
                sx={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: 'text.primary',
                  lineHeight: 1.1,
                  mb: 1,
                }}
              >
                {kpi.value}
              </Typography>

              {/* Label */}
              <Typography
                sx={{
                  fontSize: '12px',
                  color: 'customColors.neutralSecondary',
                  fontWeight: 400,
                }}
              >
                {kpi.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* ── Charts Body ───────────────────────────────────────────────────── */}
        <Box
          sx={{
            px: 6,
            py: 5,
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
          }}
        >
          {/* Two-column: Daily Trend + Peak Hours */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 5,
            }}
          >
            {/* Daily Visitor Trend */}
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '10px',
                p: 5,
                overflow: 'hidden',
                bgcolor: 'background.paper',
              }}
            >
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'text.primary',
                  mb: 4,
                }}
              >
                Daily Visitor Trend
              </Typography>
              {isLoading && !summary ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 230 }}>
                  <CircularProgress size={32} />
                </Box>
              ) : (
                <ReactApexcharts
                  type='bar'
                  height={230}
                  series={[{ name: 'Visitors', data: dailyData }]}
                  options={{ ...dailyChartBaseOptions, xaxis: { ...dailyChartBaseOptions.xaxis, categories: dailyCategories } }}
                />
              )}
            </Box>

            {/* Peak Hours */}
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '10px',
                p: 5,
                overflow: 'hidden',
                bgcolor: 'background.paper',
              }}
            >
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'text.primary',
                  mb: 4,
                }}
              >
                Peak Hours
              </Typography>
              {isLoading && !summary ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 230 }}>
                  <CircularProgress size={32} />
                </Box>
              ) : (
                <ReactApexcharts
                  type='bar'
                  height={230}
                  series={[{ name: 'Visitors', data: peakSeries }]}
                  options={{ ...peakChartOptions, xaxis: { ...peakChartOptions.xaxis, categories: peakCategories } }}
                />
              )}
            </Box>
          </Box>

          {/* Full-width: Top 10 Sites */}
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '10px',
              p: 5,
              overflow: 'hidden',
              bgcolor: 'background.paper',
            }}
          >
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'text.primary',
                mb: 4,
              }}
            >
              Top 10 Sites
            </Typography>
            {isLoading && !summary ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 320 }}>
                <CircularProgress size={32} />
              </Box>
            ) : (
              <ReactApexcharts
                type='bar'
                height={320}
                series={[{
                  name: 'Visitors',
                  data: [...topSites].reverse().map((s: any) => s.count),
                }]}
                options={{
                  ...sitesChartOptions,
                  xaxis: {
                    ...sitesChartOptions.xaxis,
                    categories: [...topSites].reverse().map((s: any) => s.site_name),
                  },
                }}
              />
            )}
          </Box>
        </Box>
      </Card>
    </Box>
  )
}

export default VmsDashboard
