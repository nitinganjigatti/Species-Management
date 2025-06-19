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
  seriesBarName,
  seriesLineName,
  barLabel,
  lineLabel
}) => {
  const theme = useTheme()

  const [showBar, setShowBar] = useState(true)
  const [showLine, setShowLine] = useState(true)

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
  const monthsFromApi = data?.[seriesBarName.toLowerCase().replace(' ', '_')]?.[0]
    ? Object.keys(data[seriesBarName.toLowerCase().replace(' ', '_')][0])
    : []

  const barData = monthsFromApi?.map(
    month => parseFloat(data?.[seriesBarName?.toLowerCase()?.replace(' ', '_')][0][month]) / 100000 || 0
  )

  const lineData = monthsFromApi?.map(
    month => parseInt(data?.[seriesLineName?.toLowerCase().replace(' ', '_')][0][month]) || 0
  )

  // Convert full month names to short month names for the x-axis labels
  const shortMonths = monthsFromApi?.map(month => {
    const [monthName, year] = month?.split(' ')

    return `${monthMapping[monthName] || monthName} ${year?.slice(-2)}`
  })

  // Conditionally add series based on checkbox selections
  const series = []

  if (showBar) {
    series.push({
      name: seriesBarName,
      type: 'bar',
      data: barData,
      color: barColor
    })
  }
  if (showLine) {
    series.push({
      name: seriesLineName,
      type: 'line',
      data: lineData,
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
      y: {
        formatter: (value, { seriesIndex }) => {
          if (series[seriesIndex]?.name === seriesLineName) {
            return value.toFixed(0)
          }

          return `₹${value.toFixed(2)} lac`
        }
      }
    },

    // dataLabels: { enabled: false },
    stroke: {
      // width: [0, 3],
      width: series.map(s => (s.type === 'line' ? 3 : 0)),
      curve: 'smooth',
      colors: [barColor, lineColor]
    },
    grid: {
      show: true,
      padding: { left: 24, top: -4, right: 4 }
    },

    // fill: {
    //   type: 'solid',
    //   colors: ['#FA6140']
    // },
    dataLabels: {
      enabled: false
    },
    xaxis: { categories: shortMonths, labels: { rotate: -45, show: true } },
    yaxis: [
      showBar
        ? { title: { text: `${seriesBarName} (₹)` }, labels: { formatter: val => `₹${val.toFixed(2)} lac` } }
        : null,
      showLine
        ? { title: { text: seriesLineName }, labels: { formatter: val => val.toFixed(0) }, opposite: true }
        : null
    ].filter(Boolean),
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
        title={
          <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '16px', fontWeight: 500 }}>
            {title}
          </Typography>
        }
        action={
          <Typography
            onClick={handleClick}
            sx={{
              color: theme.palette.primary.main,
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 500,
              display: 'none'
            }}
          >
            View More
          </Typography>
        }
      />

      <CardContent>
        <Grid container spacing={2} sx={{ mb: 2, display: 'none' }}>
          {/* Conditionally render Location dropdown */}
          {locations && locations.length > 0 && (
            <Grid item size={{ xs: 6 }}>
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
            <Grid item size={{ xs: 6 }}>
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
                checked={showBar}
                onChange={() => setShowBar(!showBar)}
                color='primary'
                sx={{
                  transform: 'scale(0.8)',
                  '&.Mui-checked': { color: barColor }
                }}
              />
            }
            label={<span style={{ fontSize: '12px' }}>{barLabel}</span>}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={showLine}
                onChange={() => setShowLine(!showLine)}
                color='primary'
                sx={{
                  transform: 'scale(0.8)',
                  '&.Mui-checked': { color: lineColor }
                }}
              />
            }
            label={<span style={{ fontSize: '12px' }}>{lineLabel}</span>}
          />
        </Box>
        {/* <ReactApexcharts
          type={showLine ? 'line' : showBar ? 'bar' : 'bar'}
          height={300}
          options={options}
          series={series}
        /> */}
        {showBar || showLine ? (
          <ReactApexcharts
            type={showLine ? 'line' : showBar ? 'bar' : 'bar'}
            height={300}
            options={options}
            series={series}
          />
        ) : (
          <Box
            sx={{
              height: 300,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: theme.palette.background.default,
              border: `1px dashed ${theme.palette.divider}`,
              borderRadius: 2
            }}
          >
            <Typography variant='body2'>No data to show</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default ProductsChart
