import React, { useState } from 'react'
import { Box, Card, FormControl, MenuItem, Select, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import dynamic from 'next/dynamic'

const ReactApexcharts = dynamic(() => import('src/@core/components/react-apexcharts'), { ssr: false })

// TODO: Replace with real API data
const hardcodedWeightData = [
  { month: 'June', date: '10 Jun 2024', weight: 300, change: '-15%' },
  { month: 'May', date: '12 May 2024', weight: 285, change: '-15%' },
  { month: 'April', date: '20 Apr 2024', weight: 284, change: '-0.5%' },
  { month: 'March', date: '14 Mar 2024', weight: 245, change: '-15%' },
  { month: 'February', date: '05 Feb 2024', weight: 235, change: '-8%' },
  { month: 'January', date: '20 Jan 2024', weight: 235, change: '-8%' },
  { month: 'January', date: '10 Jan 2024', weight: 235, change: '-8%' }
]

const AnimalWeightCard: React.FC = () => {
  const theme = useTheme() as any
  const [period, setPeriod] = useState('monthly')

  const chartOptions = {
    chart: {
      type: 'area' as const,
      toolbar: { show: false },
      zoom: { enabled: false },
      background: 'transparent'
    },
    stroke: { curve: 'smooth' as const, width: 2 },
    colors: [theme.palette.primary.main],
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.05, stops: [0, 90, 100] }
    },
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      labels: { style: { colors: theme.palette.customColors.neutralSecondary, fontSize: '12px' } },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: {
        formatter: (val: number) => `${val}kg`,
        style: { colors: theme.palette.customColors.neutralSecondary, fontSize: '12px' }
      },
      min: 0,
      max: 300
    },
    grid: { borderColor: theme.palette.customColors.neutral05, strokeDashArray: 4 },
    dataLabels: { enabled: false },
    tooltip: {
      custom: ({ series, seriesIndex, dataPointIndex }: any) => {
        const weight = series[seriesIndex][dataPointIndex]
        return `<div style="background: white; padding: 8px 12px; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); font-size: 13px;">
          <strong>${weight} kg</strong> - 22 Mar 2025<br/><span style="color: #7A8684">07:23 PM</span>
        </div>`
      }
    },
    markers: { size: 4, colors: [theme.palette.primary.main], strokeColors: '#fff', strokeWidth: 2, hover: { size: 6 } }
  }

  const chartSeries = [{ name: 'Actual Weight', data: [100, 120, 240, 260, 270, 265, 0, 0, 0, 0, 0, 0] }]

  return (
    <Card sx={{ p: { xs: 3, sm: 5 }, mt: 5 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography sx={{ fontWeight: 600, fontSize: '1.1rem', color: theme.palette.customColors.OnSurfaceVariant }}>
          Animal Weight
        </Typography>
        <FormControl size='small' sx={{ minWidth: 120 }}>
          <Select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            sx={{
              borderRadius: '4px',
              fontSize: '0.875rem',
              color: theme.palette.customColors.OnSurfaceVariant,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.customColors.OutlineVariant }
            }}
          >
            <MenuItem value='monthly'>Monthly</MenuItem>
            <MenuItem value='weekly'>Weekly</MenuItem>
            <MenuItem value='yearly'>Yearly</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Chart */}
        <Box
          sx={{
            flex: 1,
            backgroundColor: theme.palette.customColors.antzSecondaryBg,
            borderRadius: 1,
            p: 3
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography sx={{ fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}>Weight</Typography>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Typography variant='caption' sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: theme.palette.primary.main }} />{' '}
                Actual Weight
              </Typography>
              <Typography variant='caption' sx={{ color: theme.palette.customColors.neutralSecondary }}>
                X - Record No
              </Typography>
              <Typography variant='caption' sx={{ color: theme.palette.customColors.neutralSecondary }}>
                Y - Weight (kg)
              </Typography>
            </Box>
          </Box>
          <ReactApexcharts type='area' height={250} options={chartOptions} series={chartSeries} />
        </Box>

        {/* Weight Table */}
        <Box sx={{ minWidth: { xs: '100%', md: 320 } }}>
          {/* Table Header */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              py: 1.5,
              px: 2,
              backgroundColor: theme.palette.customColors.antzSecondaryBg,
              borderRadius: 1
            }}
          >
            <Typography variant='caption' sx={{ fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}>
              MONTH
            </Typography>
            <Typography variant='caption' sx={{ fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}>
              DATE
            </Typography>
            <Typography
              variant='caption'
              sx={{ fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant, textAlign: 'right' }}
            >
              WEIGHT
            </Typography>
          </Box>

          {/* Table Rows */}
          {hardcodedWeightData.map((row, idx) => (
            <Box
              key={idx}
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                py: 2,
                px: 2,
                borderBottom: `1px solid ${theme.palette.customColors.neutral05}`,
                alignItems: 'center'
              }}
            >
              <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
                {row.month}
              </Typography>
              <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
                {row.date}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1.5 }}>
                <Typography
                  variant='body2'
                  sx={{ fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  {row.weight}g
                </Typography>
                <Typography
                  variant='caption'
                  sx={{
                    fontWeight: 600,
                    color: row.change.startsWith('-') ? theme.palette.customColors.Tertiary : theme.palette.primary.main
                  }}
                >
                  {row.change}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Card>
  )
}

export default AnimalWeightCard
