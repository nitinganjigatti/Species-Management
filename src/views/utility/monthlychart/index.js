import Card from '@mui/material/Card'
import { useTheme } from '@mui/material/styles'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import { useState } from 'react'
import { Checkbox, FormControlLabel, Box } from '@mui/material'
import ReactApexcharts from 'src/@core/components/react-apexcharts'
import Router from 'next/router'

const MonthlyChart = ({ title, data, barColor, lineColor, barName, lineName, viewMorePath }) => {
  const theme = useTheme()
  const [showBar, setShowBar] = useState(true)
  const [showLine, setShowLine] = useState(true)

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

  const monthsFromApi = data[barName.toLowerCase().replace(' ', '_')]?.[0]
    ? Object.keys(data[barName.toLowerCase().replace(' ', '_')][0])
    : // .sort((a, b) => {
      //     const parseMonthYear = monthYear => {
      //       const [month, year] = monthYear.split(" '")
      //       const monthIndex = monthToIndex[month]
      //       const fullYear = parseInt(year, 10) + 2000

      //       return new Date(fullYear, monthIndex)
      //     }

      //     return parseMonthYear(a) - parseMonthYear(b)
      //   })
      []

  const barData = monthsFromApi?.map(
    month => parseFloat(data[barName?.toLowerCase()?.replace(' ', '_')][0][month]) / 100000 || 0
  )
  const lineData = monthsFromApi?.map(month => parseInt(data[lineName?.toLowerCase().replace(' ', '_')][0][month]) || 0)

  const shortMonths = monthsFromApi?.map(month => {
    const [monthName, year] = month?.split(' ')

    return `${monthMapping[monthName] || monthName} ${year?.slice(-2)}`
  })

  const series = []
  if (showBar) {
    series.push({
      name: barName,
      type: 'bar',
      data: barData,
      color: barColor
    })
  }
  if (showLine) {
    series.push({
      name: lineName,
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
    stroke: {
      width: series.map(s => (s.type === 'line' ? 3 : 0)),
      curve: 'smooth',
      colors: [barColor, lineColor]
    },
    grid: {
      show: true,
      padding: {
        left: 24,
        top: -4,
        right: 4
      }
    },
    markers: {
      size: 4,
      colors: ['#FFFFFF'],
      strokeColors: lineColor,
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
    },

    tooltip: {
      y: {
        formatter: (value, { seriesIndex }) => {
          if (series[seriesIndex]?.name === lineName) {
            return value.toFixed(0)
          }

          return `₹${value.toFixed(2)} lac`
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    xaxis: { categories: shortMonths, labels: { rotate: -45, show: true } },
    yaxis: [
      showBar ? { title: { text: `${barName} (₹)` }, labels: { formatter: val => `₹${val.toFixed(2)} lac` } } : null,
      showLine ? { title: { text: lineName }, labels: { formatter: val => val.toFixed(0) }, opposite: true } : null
    ].filter(Boolean)
  }

  const handleClick = () => Router.push(viewMorePath)

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
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={showBar}
                onChange={() => setShowBar(!showBar)}
                color='primary'
                sx={{
                  transform: 'scale(0.8)',
                  '&.Mui-checked': {
                    color: barColor
                  }
                }}
              />
            }
            label={<span style={{ fontSize: '12px' }}>Show {barName}</span>}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={showLine}
                onChange={() => setShowLine(!showLine)}
                color='primary'
                sx={{
                  transform: 'scale(0.8)',
                  '&.Mui-checked': {
                    color: lineColor
                  }
                }}
              />
            }
            label={<span style={{ fontSize: '12px' }}>Show {lineName}</span>}
          />
        </Box>
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

export default MonthlyChart
