'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import CircularProgress from '@mui/material/CircularProgress'
import { useTheme } from '@mui/material/styles'
import { Grid } from '@mui/system'
import Icon from 'src/@core/components/icon'
import { VMS_STATUS_OPTIONS } from 'src/constants/vms'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import Utility from 'src/utility'
import { useReportSummary } from 'src/hooks/vms/useVmsReports'

const ReactApexcharts = dynamic(() => import('react-apexcharts'), { ssr: false })

// ─── Chart helpers ───────────────────────────────────────────────────────────

const FONT = 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'

const peakHourLabels = [
  '6 AM', '7 AM', '8 AM', '9 AM', '10 AM', '11 AM',
  '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM',
  '6 PM', '7 PM', '8 PM', '9 PM', '10 PM',
]

// ─── Component ────────────────────────────────────────────────────────────────

const VmsDashboard = () => {
  const theme = useTheme()

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
    { icon: 'mdi:account-group-outline', label: 'Total Visitors', value: summary?.total_visitors ?? 0, color: theme.palette.primary.dark },
    { icon: 'mdi:clock-outline', label: 'Active', value: getStatusCount('active'), color: theme.palette.secondary.main },
    { icon: 'mdi:login', label: 'Checked In', value: getStatusCount('checked_in'), color: theme.palette.primary.main },
    { icon: 'mdi:logout', label: 'Checked Out', value: getStatusCount('checked_out'), color: theme.palette.customColors.Outline },
    { icon: 'mdi:timer-off-outline', label: 'Expired', value: getStatusCount('expired'), color: theme.palette.customColors.Tertiary },
  ]

  const byDay = summary?.by_day ?? []
  const dailyData = byDay.map((d: any) => d.count)
  const dailyCategories = byDay.map((d: any) => {
    const date = new Date(d.date)

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  })

  const rawPeakHours = summary?.peak_hours ?? []
  const peakSeries = Array.isArray(rawPeakHours) ? rawPeakHours.map((h: any) => (typeof h === 'object' ? h.count : h)) : []
  const peakCategories =
    Array.isArray(rawPeakHours) && rawPeakHours.length > 0 && typeof rawPeakHours[0] === 'object'
      ? rawPeakHours.map((h: any) => h.hour ?? '')
      : peakHourLabels.slice(0, peakSeries.length)

  const topSites = summary?.top_sites ?? []
  const hasFilters = dateRange.startDate || dateRange.endDate || statusFilter || siteFilter

  // ── Theme-aware chart colors ───────────────────────────────────────────────
  const gridColor = theme.palette.customColors.OutlineVariant
  const labelColor = theme.palette.customColors.neutralSecondary
  const textColor = theme.palette.customColors.OnSurfaceVariant

  const dailyChartOptions: any = {
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: FONT, background: 'transparent' },
    colors: [theme.palette.primary.main],
    plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } },
    xaxis: {
      categories: dailyCategories,
      tickAmount: 6,
      labels: { style: { fontSize: '11px', colors: labelColor }, rotate: -30, rotateAlways: false },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { labels: { style: { fontSize: '11px', colors: labelColor } }, min: 0 },
    grid: { borderColor: gridColor, strokeDashArray: 4, xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
    dataLabels: { enabled: false },
    tooltip: { theme: 'light', style: { fontFamily: FONT, fontSize: '12px' }, y: { title: { formatter: () => 'Visitors:' } } },
    states: { hover: { filter: { type: 'darken', value: 0.85 } } },
  }

  const peakChartOptions: any = {
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: FONT, background: 'transparent' },
    colors: [theme.palette.secondary.main],
    plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } },
    xaxis: {
      categories: peakCategories,
      labels: { style: { fontSize: '11px', colors: labelColor }, rotate: -30 },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { labels: { style: { fontSize: '11px', colors: labelColor } }, min: 0 },
    grid: { borderColor: gridColor, strokeDashArray: 4, xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
    dataLabels: { enabled: false },
    tooltip: { theme: 'light', style: { fontFamily: FONT, fontSize: '12px' }, y: { title: { formatter: () => 'Visitors:' } } },
    states: { hover: { filter: { type: 'darken', value: 0.88 } } },
  }

  const sitesChartOptions: any = {
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: FONT, background: 'transparent' },
    colors: [theme.palette.primary.main],
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'horizontal',
        shadeIntensity: 0.25,
        gradientToColors: [theme.palette.primary.dark],
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 0.85,
        stops: [0, 100],
      },
    },
    plotOptions: { bar: { borderRadius: 4, horizontal: true, barHeight: '55%', dataLabels: { position: 'top' } } },
    xaxis: {
      labels: { style: { fontSize: '11px', colors: labelColor } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { labels: { style: { fontSize: '12px', colors: textColor } } },
    grid: {
      borderColor: gridColor,
      strokeDashArray: 4,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: false } },
      padding: { top: 0, right: 20, bottom: 0, left: 0 },
    },
    dataLabels: {
      enabled: true,
      offsetX: 6,
      style: { fontSize: '12px', fontFamily: FONT, colors: [textColor], fontWeight: '500' },
      formatter: (val: number) => String(val),
    },
    tooltip: { theme: 'light', style: { fontFamily: FONT, fontSize: '12px' }, y: { title: { formatter: () => 'Visitors:' } } },
    states: { hover: { filter: { type: 'darken', value: 0.88 } } },
  }

  return (
    <Box>
      {/* ── Filters Row ──────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
        <Typography variant='h5' sx={{ fontWeight: 500, mr: 'auto' }}>
          Dashboard
        </Typography>

        <Box sx={{ maxWidth: 300, minWidth: 280 }}>
          <CommonDateRangePickers onChange={handleDateRangeChange} filterDates={dateRange} />
        </Box>

        <TextField
          select
          size='small'
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          sx={{ minWidth: 140 }}
          label='Status'
        >
          {VMS_STATUS_OPTIONS.map(opt => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size='small'
          value={siteFilter}
          onChange={e => setSiteFilter(e.target.value)}
          sx={{ minWidth: 140 }}
          label='Site'
          slotProps={{ select: { displayEmpty: true } }}
        >
          <MenuItem value=''>All Sites</MenuItem>
          {siteFilter && !topSites.some((s: any) => s.site_name === siteFilter) && (
            <MenuItem value={siteFilter}>{siteFilter}</MenuItem>
          )}
          {topSites.map((s: any, idx: number) => (
            <MenuItem key={`${s.site_name}-${idx}`} value={s.site_name}>
              {s.site_name}
            </MenuItem>
          ))}
        </TextField>

        {hasFilters && (
          <Button
            size='small'
            onClick={() => {
              setDateRange({ startDate: '', endDate: '' })
              setStatusFilter('')
              setSiteFilter('')
            }}
            startIcon={<Icon icon='mdi:filter-off-outline' fontSize={16} />}
            sx={{ textTransform: 'none', color: theme.palette.customColors.neutralSecondary }}
          >
            Clear
          </Button>
        )}
      </Box>

      {/* ── KPI Cards Row ────────────────────────────────────────────────── */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        {KPI_ITEMS.map(kpi => (
          <Grid key={kpi.label} size={{ xs: 6, sm: 4, md: 12 / 5 }}>
            <Card sx={{ borderRadius: '10px', p: 4 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '10px',
                  bgcolor: `${kpi.color}1A`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 3,
                }}
              >
                <Icon icon={kpi.icon} fontSize={20} color={kpi.color} />
              </Box>

              <Typography variant='h5' sx={{ fontWeight: 700, color: theme.palette.customColors.OnSurfaceVariant, mb: 0.5 }}>
                {kpi.value}
              </Typography>

              <Typography variant='caption' sx={{ color: theme.palette.customColors.neutralSecondary }}>
                {kpi.label}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── Charts Row: Daily Trend + Peak Hours ─────────────────────────── */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: '10px', p: 5 }}>
            <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 3 }}>
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
                options={dailyChartOptions}
              />
            )}
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: '10px', p: 5 }}>
            <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 3 }}>
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
                options={peakChartOptions}
              />
            )}
          </Card>
        </Grid>
      </Grid>

      {/* ── Top 10 Sites ─────────────────────────────────────────────────── */}
      <Card sx={{ borderRadius: '10px', p: 5 }}>
        <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 3 }}>
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
      </Card>
    </Box>
  )
}

export default VmsDashboard
