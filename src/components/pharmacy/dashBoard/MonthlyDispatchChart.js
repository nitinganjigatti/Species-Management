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

  const monthToIndex = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11
  }

  const monthsFromApi = purchaseList?.dispatch_count[0]
    ? Object.keys(purchaseList.dispatch_count[0]).sort((a, b) => {
        const parseMonthYear = monthYear => {
          const [month, year] = monthYear.split(" '")
          const monthIndex = monthToIndex[month]
          const fullYear = parseInt(year, 10) + 2000
          return new Date(fullYear, monthIndex)
        }

        const dateA = parseMonthYear(a)
        const dateB = parseMonthYear(b)

        return dateA - dateB
      })
    : []

  const purchaseCounts = monthsFromApi.map(month => parseInt(purchaseList.dispatch_count[0][month]) || 0)
  const purchaseValues = monthsFromApi.map(month => parseFloat(purchaseList.dispatch_value[0][month]) / 100000 || 0)

  const shortMonths = monthsFromApi.map(month => {
    const [monthName, year] = month.split(' ')
    return `${monthMapping[monthName] || monthName} ${year.slice(-2)}`
  })

  const series = []
  if (showDispatchValue) {
    series.push({
      name: 'Dispatch Value',
      type: 'bar',
      data: purchaseValues,
      color: '#006D35'
    })
  }
  if (showDispatchCount) {
    series.push({
      name: 'Dispatch Count',
      type: 'line',
      data: purchaseCounts,
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
          if (series[seriesIndex]?.name === 'Dispatch Count') {
            return value?.toFixed(0)
          }
          return `₹${value?.toFixed(2)} lac`
        }
      }
    },
    dataLabels: { enabled: false },
    stroke: {
      width: [0, 3],
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
      showDispatchValue
        ? {
            title: {
              text: 'Dispatch Value (₹)'
            },
            labels: {
              formatter: val => `₹${val.toFixed(2)} lac`
            },
            opposite: false
          }
        : null,
      showDispatchCount
        ? {
            title: {
              text: 'Dispatch Count'
            },
            labels: {
              formatter: val => val.toFixed(0)
            },
            opposite: true
          }
        : null
    ].filter(Boolean),
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
                checked={showDispatchValue}
                onChange={() => setShowDispatchValue(prev => !prev)}
                color='primary'
                sx={{
                  transform: 'scale(0.8)',
                  '&.Mui-checked': {
                    color: ' #006D35 '
                  }
                }}
              />
            }
            label={<span style={{ fontSize: '12px' }}>Show Dispatch Value</span>}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={showDispatchCount}
                onChange={() => setShowDispatchCount(prev => !prev)}
                color='primary'
                sx={{
                  transform: 'scale(0.8)',
                  '&.Mui-checked': {
                    color: '#37BD69'
                  }
                }}
              />
            }
            label={<span style={{ fontSize: '12px' }}>Show Dispatch Count</span>}
          />
        </Box>

        {showDispatchValue || showDispatchCount ? (
          <ReactApexcharts type='line' height={300} options={options} series={series} />
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
            <Typography variant='body2' color='textSecondary'>
              No data to show
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default MonthlyDispatchChart
