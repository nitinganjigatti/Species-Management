import React, { useState, useEffect } from 'react'
import Card from '@mui/material/Card'
import { useTheme } from '@mui/material/styles'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import { Button, Checkbox, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Box, Grid } from '@mui/material'
import ReactApexcharts from 'src/@core/components/react-apexcharts'
import Router from 'next/router'

const ProductsChart = ({
  data,
  title,
  locations,
  frequencies,
  barColor,
  lineColor,
  yAxisTitle,
  yAxisOppositeTitle,
  seriesBarName,
  seriesLineName,
  countLabel,
  valueLabel
}) => {
  const theme = useTheme()
  const [showDispatchCount, setShowDispatchCount] = useState(true)
  const [showDispatchValue, setShowDispatchValue] = useState(true)
  const [location, setLocation] = useState(locations?.[0] || 'Central Pharmacy')
  const [frequency, setFrequency] = useState(frequencies?.[0] || 'Monthly')

  // Create a mapping for full month names to short month names
  const monthMapping = {
    January: 'Jan',
    February: 'Feb',
    March: 'Mar',
    April: 'Apr',
    May: 'May',
    June: 'Jun',
    July: 'Jul',
    August: 'Aug',
    September: 'Sep',
    October: 'Oct',
    November: 'Nov',
    December: 'Dec'
  }

  // Extract months from data
  const monthsFromApi = data?.dispatch_count[0] ? Object.keys(data.dispatch_count[0]) : []
  const purchaseCounts = monthsFromApi.map(month => parseInt(data?.dispatch_count[0]?.[month]) || 0)
  const purchaseValues = monthsFromApi.map(month => parseFloat(data?.dispatch_value[0]?.[month] || 0) / 100000)

  // Convert full month names to short month names for the x-axis labels
  const shortMonths = monthsFromApi.map(month => monthMapping[month] || month)

  // Conditionally add series based on checkbox selections
  const series = []
  if (showDispatchCount) {
    series.push({
      name: seriesBarName,
      type: 'bar',
      data: purchaseCounts,
      color: barColor
    })
  }
  if (showDispatchValue) {
    series.push({
      name: seriesLineName,
      type: 'line',
      data: purchaseValues,
      color: lineColor
    })
  }

  const options = {
    chart: {
      offsetY: 1,
      parentHeightOffset: 0,
      toolbar: { show: false }
    },
    tooltip: {
      enabled: true,
      y: {
        formatter: (value, { seriesIndex }) => {
          if (series[0].name === 'Dispatch Value' || seriesIndex === 1) {
            return `₹${value.toFixed(2)} lac`
          }
          return value.toFixed(0)
        }
      }
    },
    dataLabels: { enabled: false },
    stroke: {
      width: [0, 3],
      curve: 'smooth',
      colors: [barColor, lineColor]
    },
    grid: {
      show: true,
      padding: { left: 24, top: -4, right: 4 }
    },
    fill: {
      type: 'solid',
      colors: ['#FA6140']
    },
    xaxis: {
      categories: shortMonths,
      labels: { show: true },
      axisTicks: { show: true },
      axisBorder: { show: true }
    },
    yaxis: [
      {
        title: { text: yAxisTitle },
        labels: { formatter: val => val.toFixed(0) }
      },
      {
        opposite: true,
        title: { text: yAxisOppositeTitle },
        labels: { formatter: val => `₹${val.toFixed(2)} lac` }
      }
    ],
    markers: {
      size: 4,
      colors: ['#FFFFFF'],
      strokeColors: lineColor,
      strokeWidth: 2,
      hover: { size: 7 }
    },
    plotOptions: {
      bar: {
        columnWidth: '35%',
        borderRadius: 10,
        borderRadiusApplication: 'end',
        distributed: false
      }
    }
  }

  const handleClick = () => {
    // Router.push({
    //   pathname: '/pharmacy/reports/month-wise-dispatch'
    // })
  }

  return (
    <Card>
      <CardHeader
        title={title}
        action={
          <Typography
            onClick={handleClick}
            sx={{ color: theme.palette.primary.main, cursor: 'pointer', fontWeight: 500 }}
          >
            View More
          </Typography>
        }
      />

      <CardContent>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {/* Conditionally render Location dropdown */}
          {locations && locations.length > 0 && (
            <Grid item xs={6}>
              <FormControl fullWidth size='small'>
                <InputLabel>Location</InputLabel>
                <Select value={location} onChange={e => setLocation(e.target.value)} label='Location'>
                  {locations.map(loc => (
                    <MenuItem key={loc} value={loc}>
                      {loc}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
          {frequencies && frequencies.length > 0 && (
            <Grid item xs={6}>
              <FormControl fullWidth size='small'>
                <InputLabel>Frequency</InputLabel>
                <Select value={frequency} onChange={e => setFrequency(e.target.value)} label='Frequency'>
                  {frequencies.map(freq => (
                    <MenuItem key={freq} value={freq}>
                      {freq}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={showDispatchCount}
                onChange={() => setShowDispatchCount(prev => !prev)}
                color='primary'
                sx={{
                  transform: 'scale(0.8)',
                  '&.Mui-checked': { color: barColor }
                }}
              />
            }
            label={<span style={{ fontSize: '12px' }}>{countLabel}</span>}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={showDispatchValue}
                onChange={() => setShowDispatchValue(prev => !prev)}
                color='primary'
                sx={{
                  transform: 'scale(0.8)',
                  '&.Mui-checked': { color: lineColor }
                }}
              />
            }
            label={<span style={{ fontSize: '12px' }}>{valueLabel}</span>}
          />
        </Box>
        <ReactApexcharts type='line' height={300} options={options} series={series} />
      </CardContent>
    </Card>
  )
}

export default ProductsChart
