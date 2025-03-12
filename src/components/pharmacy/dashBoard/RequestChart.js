// ** React Imports
import React, { forwardRef, useEffect, useState } from 'react'

// ** MUI Imports
import Card from '@mui/material/Card'
import TextField from '@mui/material/TextField'
import { useTheme } from '@mui/material/styles'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import InputAdornment from '@mui/material/InputAdornment'
import { getRequestListChart } from 'src/lib/api/pharmacy/getAllReports'
import { Select, MenuItem, FormControl, InputLabel } from '@mui/material'

// ** Third Party Imports
import format from 'date-fns/format'
import subDays from 'date-fns/subDays'
import DatePicker from 'react-datepicker'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Component Import
import ReactApexcharts from 'src/@core/components/react-apexcharts'

const columnColors = {
  bg: '#1e415b54',
  series1: '#00AFD6',
  series2: '#1F415B'
}

const RequestChart = () => {
  // ** Hook
  const theme = useTheme()

  // ** States
  const [timeperiod, setTimeperiod] = useState(30)
  const [chartData, setChartData] = useState({ categories: [], series: [] })

  const fetchMedicineData = async () => {
    try {
      const end_time = format(new Date(), 'yyyy-MM-dd')
      const start_time = format(subDays(new Date(), timeperiod), 'yyyy-MM-dd')

      const params = { start_time, end_time }

      const searchResults = await getRequestListChart({ params: params })
      console.log('searchResults', searchResults)

      const stores = searchResults?.data.map(store => store.store_name) // X-axis: store names
      const completedRequests = searchResults?.data.map(store => Number(store.completed_request))
      const pendingRequests = searchResults?.data.map(store => Number(store.pending_request))

      // Update chart data
      setChartData({
        categories: stores,
        series: [
          { name: 'Completed requests', data: completedRequests },
          { name: 'Pending requests', data: pendingRequests }
        ]
      })
    } catch (e) {
      console.log('Error fetching data:', e)
    }
  }

  useEffect(() => {
    fetchMedicineData()
  }, [timeperiod])

  const options = {
    chart: {
      stacked: true,
      toolbar: { show: false }
    },
    fill: { opacity: 1 },
    dataLabels: { enabled: false },
    colors: [columnColors.series1, columnColors.series2],
    xaxis: {
      categories: chartData.categories,
      labels: {
        style: { colors: '#8e8da4' }
      }
    },
    yaxis: {
      labels: {
        style: { colors: '#8e8da4' }
      }
    },

    // legend: {
    //   show: true,
    //   position: 'top', // Moves the legend above the chart
    //   horizontalAlign: 'left', // Aligns legend items horizontally (can be 'left', 'center', 'right')
    //   offsetY: 10,
    //   markers: {
    //     radius: 12 // Make legend markers rounded
    //   }
    // },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: function (val) {
          return val > 1 ? val + ' requests' : val + ' request'
        }
      }
    },
    plotOptions: {
      bar: {
        columnWidth: '40%',
        borderRadius: 10,
        borderRadiusApplication: 'end',
        borderRadiusWhenStacked: true,
        dataLabels: {
          position: 'top'
        },
        hover: {
          // Customize the hover behavior
          fill: {
            opacity: 1
          }
        }
      }
    },
    grid: {
      borderColor: '#f1f1f1'
    },
    legend: {
      show: true,

      // position: 'top',
      //horizontalAlign: 'left',
      markers: {
        radius: 12 // Round the legend markers for consistency
      }
    }
  }

  const handlechange = e => {
    setTimeperiod(e.target.value)
  }

  const allZeroData = chartData.series.every(series => series.data.every(val => val === 0))

  return (
    <Card>
      <CardHeader
        title='Requests'
        sx={{
          flexDirection: ['column', 'row'],
          alignItems: ['flex-start', 'center'],
          '& .MuiCardHeader-action': { mb: 0 },
          '& .MuiCardHeader-content': { mb: [2, 0] }
        }}
        action={
          <FormControl variant='outlined' size='small'>
            <InputLabel id='demo-simple-select-label'>Time Period</InputLabel>
            <Select
              labelId='demo-simple-select-label'
              id='demo-simple-select'
              value={timeperiod}
              label='Time Period'
              onChange={handlechange}
              style={{ minWidth: 120 }}
            >
              <MenuItem value={7}>Last 7 days</MenuItem>
              <MenuItem value={30}>Last 30 days</MenuItem>
              <MenuItem value={60}>Last 60 days</MenuItem>
              <MenuItem value={90}>Last 90 days</MenuItem>
            </Select>
          </FormControl>
        }
      />
      <CardContent>
        {allZeroData ? (
          <p>No data to display</p>
        ) : (
          <ReactApexcharts type='bar' height={400} options={options} series={chartData.series} />
        )}
      </CardContent>
    </Card>
  )
}

export default RequestChart
