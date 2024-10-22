import Card from '@mui/material/Card'
import { useTheme } from '@mui/material/styles'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import { useEffect, useState } from 'react'
import MenuItem from '@mui/material/MenuItem'
import Router from 'next/router'
// ** Custom Components Imports
import ReactApexcharts from 'src/@core/components/react-apexcharts'
import { getMonthWiseDispatchList } from 'src/lib/api/pharmacy/dashboard'
import { Button, Checkbox, FormControlLabel, Box } from '@mui/material'

const MonthlyDispatchChart = () => {
  const theme = useTheme()
  const [purchaseList, setPurchaseList] = useState({ dispatch_count: [], dispatch_value: [] })
  const [showDispatchCount, setShowDispatchCount] = useState(true)
  const [showDispatchValue, setShowDispatchValue] = useState(true)

  const getMonthlyDispatches = async () => {
    try {
      const result = await getMonthWiseDispatchList()

      if (result?.success === true && result?.data) {
        setPurchaseList(result?.data)
      }
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    getMonthlyDispatches()
  }, [])

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

  // Dynamically get the months from the API response
  const monthsFromApi = purchaseList?.dispatch_count[0] ? Object.keys(purchaseList.dispatch_count[0]) : []

  // Map the dispatch count and value based on the dynamic month order from API
  const purchaseCounts = monthsFromApi.map(month => parseInt(purchaseList?.dispatch_count[0]?.[month]) || 0)
  const purchaseValues = monthsFromApi.map(month => parseFloat(purchaseList?.dispatch_value[0]?.[month] || 0) / 100000)

  // Convert full month names to short month names for the x-axis labels
  const shortMonths = monthsFromApi.map(month => monthMapping[month] || month)

  // Conditionally add series based on checkbox selections
  const series = []
  if (showDispatchCount) {
    series.push({
      name: 'Dispatch Count',
      type: 'bar',
      data: purchaseCounts,
      color: '#006D35'
    })
  }
  if (showDispatchValue) {
    series.push({
      name: 'Dispatch Value',
      type: 'line',
      data: purchaseValues,
      color: '#37BD69'
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
          console.log(series, 'seriesIndex')
          if (series[0].name === 'Dispatch Value' || seriesIndex === 1) {
            return `₹${value.toFixed(2)} lac`
          }
          return value.toFixed(0)
        }
      }
    },
    dataLabels: { enabled: false },
    stroke: {
      width: [0, 3], // Adjust the thickness of the bar and line
      curve: 'smooth',
      colors: ['#006D35', '#37BD69']
    },
    grid: {
      show: true,
      padding: {
        left: 24,
        top: -4,
        right: 4
      }
    },
    fill: {
      type: 'solid',
      colors: ['#FA6140']
    },
    xaxis: {
      // Use short month names from the API for x-axis labels
      categories: shortMonths,
      labels: {
        show: true
      },
      axisTicks: { show: true },
      axisBorder: { show: true }
    },
    yaxis: [
      {
        title: {
          text: 'Dispatch Count'
        },
        labels: {
          formatter: val => val.toFixed(0)
        }
      },
      {
        opposite: true,
        title: {
          text: 'Dispatch Value (₹)'
        },
        labels: {
          formatter: val => `₹${val.toFixed(2)} lac`
        }
      }
    ],
    markers: {
      size: 4,
      colors: ['#FFFFFF'],
      strokeColors: '#37BD69',
      strokeWidth: 2,
      hover: {
        size: 7
      }
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
    Router.push({
      pathname: '/pharmacy/reports/month-wise-dispatch'
    })
  }

  return (
    <Card>
      <CardHeader
        title='Month wise dispatch'
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
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={showDispatchCount}
                onChange={() => setShowDispatchCount(prev => !prev)}
                color='primary'
                sx={{
                  transform: 'scale(0.8)',
                  '&.Mui-checked': {
                    color: '#006D35'
                  }
                }}
              />
            }
            label={<span style={{ fontSize: '12px' }}>Show Dispatch Count</span>}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={showDispatchValue}
                onChange={() => setShowDispatchValue(prev => !prev)}
                color='primary'
                sx={{
                  transform: 'scale(0.8)',
                  '&.Mui-checked': {
                    color: '#37BD69'
                  }
                }}
              />
            }
            label={<span style={{ fontSize: '12px' }}>Show Dispatch Value</span>}
          />
        </Box>
        {/* Chart */}
        <ReactApexcharts type='line' height={300} options={options} series={series} />
      </CardContent>
    </Card>
  )
}

export default MonthlyDispatchChart
