import Card from '@mui/material/Card'
import { useTheme } from '@mui/material/styles'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import { useEffect, useState } from 'react'
import { Button, Checkbox, FormControlLabel, Box } from '@mui/material'
import ReactApexcharts from 'src/@core/components/react-apexcharts'
import Router from 'next/router'
import { getMonthWisePurchaseList } from 'src/lib/api/pharmacy/dashboard'

const MonthlyPurchaseChart = () => {
  const theme = useTheme()
  const [purchaseList, setPurchaseList] = useState({ purchase_count: [], purchase_value: [] })

  const [showPurchaseCount, setShowPurchaseCount] = useState(true)
  const [showPurchaseValue, setShowPurchaseValue] = useState(true)

  const getMonthlyPurchases = async () => {
    try {
      const result = await getMonthWisePurchaseList()
      if (result?.success === true && result?.data) {
        setPurchaseList(result?.data)
      }
    } catch (error) {
      console.error(error)
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

  // Extract and dynamically sort months
  const monthsFromApi = purchaseList?.purchase_count[0]
    ? Object.keys(purchaseList.purchase_count[0]).sort((a, b) => new Date(`1 ${a}`) - new Date(`1 ${b}`)) // Sort by date
    : []

  // Map the purchase count and value based on the dynamic month order from API
  const purchaseCounts = monthsFromApi.map(month => parseInt(purchaseList?.purchase_count[0]?.[month]) || 0)

  const purchaseValues = monthsFromApi.map(month => parseFloat(purchaseList?.purchase_value[0]?.[month] || 0) / 100000)

  // Convert to formatted short month and year (e.g., "Jan '24")
  const shortMonths = monthsFromApi.map(month => {
    const [monthName, year] = month.split(' ')
    return `${monthMapping[monthName] || monthName} ${year.slice(-2)}`
  })

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
      color: '#FFBDA8'
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
          if (seriesIndex === 1 || series[0].name === 'Purchase Value') {
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
      colors: ['#FA6140', '#FFBDA8']
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
      categories: shortMonths,
      labels: {
        show: true,
        rotateAlways: true, // Force rotation
        rotate: -45, // Rotate labels by -45 degrees
        hideOverlappingLabels: false, // Show all labels
        style: {
          fontSize: '12px'
        }
      },
      axisTicks: { show: true },
      axisBorder: { show: true }
    },

    yaxis: [
      {
        title: { text: 'Purchase Count' },
        labels: { formatter: val => val.toFixed(0) }
      },
      {
        opposite: true,
        title: { text: 'Purchase Value (₹)' },
        labels: { formatter: val => `₹${val.toFixed(2)} lac` }
      }
    ],
    markers: {
      size: 4,
      colors: ['#FFFFFF'],
      strokeColors: '#FFBDA8',
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
    Router.push({
      pathname: '/pharmacy/reports/month-wise-purchase'
    })
  }

  return (
    <Card>
      <CardHeader
        title='Month wise purchase'
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
                    color: '#FFBDA8'
                  }
                }}
              />
            }
            label={<span style={{ fontSize: '12px' }}>Show Purchase Value</span>}
          />
        </Box>

        {/* Chart */}
        <ReactApexcharts type='line' height={300} options={options} series={series} />
      </CardContent>
    </Card>
  )
}

export default MonthlyPurchaseChart
