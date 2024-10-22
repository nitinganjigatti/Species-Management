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

const ReceivedMedicines = () => {
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
      console.error('Error fetching received data:', error)
    }
  }

  useEffect(() => {
    getMonthlyPurchases()
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
  const monthsFromApi = purchaseList?.purchase_count[0] ? Object.keys(purchaseList.purchase_count[0]) : []

  // Map the purchase count and value based on the dynamic month order from API
  const purchaseCounts = monthsFromApi.map(month => parseInt(purchaseList?.purchase_count[0]?.[month]) || 0)
  const purchaseValues = monthsFromApi.map(month => parseFloat(purchaseList?.purchase_value[0]?.[month] || 0) / 100000)

  // Convert full month names to short month names for the x-axis labels
  const shortMonths = monthsFromApi.map(month => monthMapping[month] || month)

  // Conditionally add series based on checkbox selections
  const series = []
  if (showPurchaseCount) {
    series.push({
      name: 'Received Count',
      type: 'bar',
      data: purchaseCounts,
      color: '#FA6140'
    })
  }
  if (showPurchaseValue) {
    series.push({
      name: 'Received Value',
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
          if (seriesIndex === 1 || series[0]?.name === 'Received Value') {
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
      categories: shortMonths, // Use short month names for x-axis labels
      labels: { show: true },
      axisTicks: { show: true },
      axisBorder: { show: true }
    },
    yaxis: [
      {
        title: { text: 'Received Count' },
        labels: { formatter: val => val.toFixed(0) }
      },
      {
        opposite: true,
        title: { text: 'Received Value (₹)' },
        labels: { formatter: val => `₹${val.toFixed(2)} lac` }
      }
    ],
    markers: {
      size: 4,
      colors: ['#FFFFFF'],
      strokeColors: '#fa6140',
      strokeWidth: 2,
      hover: { size: 7 }
    },
    plotOptions: {
      bar: {
        columnWidth: '15%',
        borderRadius: 10,
        borderRadiusApplication: 'end',
        distributed: false
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
            label={<span style={{ fontSize: '12px' }}>Show Received Count</span>}
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
            label={<span style={{ fontSize: '12px' }}>Show Received Value</span>}
          />
        </Box>

        {/* Chart */}
        <ReactApexcharts type='line' height={300} options={options} series={series} />
      </CardContent>
    </Card>
  )
}

export default ReceivedMedicines
