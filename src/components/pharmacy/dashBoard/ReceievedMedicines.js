import Card from '@mui/material/Card'
import { useTheme } from '@mui/material/styles'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import { useEffect, useState } from 'react'
import ReactApexcharts from 'src/@core/components/react-apexcharts'
import { Button, Checkbox, FormControlLabel, Box } from '@mui/material'
import Router from 'next/router'
import { getReceivedMedicineschart } from 'src/lib/api/pharmacy/dashboard'

const ReceievedMedicines = () => {
  const theme = useTheme()

  const [purchaseList, setPurchaseList] = useState({ purchase_count: [], purchase_value: [] })
  const [showPurchaseCount, setShowPurchaseCount] = useState(true) // Toggle for Purchase Count
  const [showPurchaseValue, setShowPurchaseValue] = useState(true) // Toggle for Purchase Value

  const getMonthlyPurchases = async () => {
    try {
      const result = await getReceivedMedicineschart()
      if (result?.success === true && result?.data) {
        setPurchaseList(result?.data)
      }
    } catch (error) {
      console.error('Error fetching purchase data:', error)
    }
  }

  useEffect(() => {
    getMonthlyPurchases()
  }, [])

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ]

  const purchaseCounts = months.map(month => parseInt(purchaseList?.purchase_count[0]?.[month]) || 0)
  const purchaseValues = months.map(month => parseFloat(purchaseList?.purchase_value[0]?.[month] || 0) / 100000)

  // Conditionally add series based on checkbox selections
  const series = []
  if (showPurchaseCount) {
    series.push({
      name: 'Purchase Count',
      type: 'bar',
      data: purchaseCounts,
      color: '#FA6140'
    })
  }
  if (showPurchaseValue) {
    series.push({
      name: 'Purchase Value',
      type: 'line',
      data: purchaseValues,
      color: '#fa614059'
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
          if (seriesIndex === 1 || series[0]?.name === 'Purchase Value') {
            return `₹${value.toFixed(2)} lac`
          }
          return value.toFixed(0)
        }
      }
    },
    dataLabels: { enabled: false },
    stroke: {
      width: [0, 5],
      curve: 'smooth',
      colors: ['#fa614059']
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
      categories: months,
      labels: {
        show: true
      },
      axisTicks: { show: true },
      axisBorder: { show: true }
    },
    yaxis: [
      {
        title: {
          text: 'Purchase Count'
        },
        labels: {
          formatter: val => val.toFixed(0)
        }
      },
      {
        opposite: true,
        title: {
          text: 'Purchase Value (₹)'
        },
        labels: {
          formatter: val => `₹${val.toFixed(2)} lac`
        }
      }
    ],
    markers: {
      size: 4,
      colors: ['#FFFFFF'],
      strokeColors: '#fa6140', // Red outline for markers
      strokeWidth: 2,
      hover: {
        size: 7
      }
    },
    plotOptions: {
      bar: {
        columnWidth: '15%', // Slim bar width
        borderRadius: 10, // Curve the top and bottom of the bars
        borderRadiusApplication: 'end' // Ensures the top of the bars are curved
      }
    }
  }

  const handleClick = () => {
    Router.push({
      pathname: '/pharmacy/reports/received-medicines-report'
    })
  }

  return (
    <Card>
      <CardHeader
        title='Received Medicines'
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
                checked={showPurchaseCount}
                onChange={() => setShowPurchaseCount(prev => !prev)}
                color='primary'
                sx={{
                  transform: 'scale(0.8)',
                  '&.Mui-checked': {
                    color: '#FA6140'
                  }
                }}
              />
            }
            label={<span style={{ fontSize: '12px' }}>Show Purchase Count</span>}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={showPurchaseValue}
                onChange={() => setShowPurchaseValue(prev => !prev)}
                color='primary'
                sx={{
                  transform: 'scale(0.8)',
                  '&.Mui-checked': {
                    color: '#fa614059'
                  }
                }}
              />
            }
            label={<span style={{ fontSize: '12px' }}>Show Purchase Value</span>}
          />
        </Box>

        {/* Chart */}
        <ReactApexcharts type='line' height={262} options={options} series={series} />
      </CardContent>
    </Card>
  )
}

export default ReceievedMedicines
