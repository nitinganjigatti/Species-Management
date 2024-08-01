// ** React Imports
import { forwardRef, useState, useEffect } from 'react'

// ** MUI Imports
import Card from '@mui/material/Card'
import TextField from '@mui/material/TextField'
import { useTheme } from '@mui/material/styles'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import InputAdornment from '@mui/material/InputAdornment'

// ** Third Party Imports
import format from 'date-fns/format'
import DatePicker from 'react-datepicker'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import OptionsMenu from 'src/@core/components/option-menu'

// ** Component Import
import ReactApexcharts from 'src/@core/components/react-apexcharts'
import { getStoreWisePendingList } from 'src/lib/api/pharmacy/dashboard'

const StoreWisePendingRequestsChart = () => {
  const [pendingList, setPendingList] = useState([])

  const getAllPendingRequestList = async () => {
    try {
      const result = await getStoreWisePendingList()

      if (result?.success === true && result?.data) {
        setPendingList(result?.data)
      }
    } catch (error) {}
  }

  useEffect(() => {
    getAllPendingRequestList()
  }, [])

  // const seriesData = pendingList.map(item => parseInt(item.pending_request))
  const seriesData = pendingList.map(item => {
    return `${item.total_request}/${item.pending_request}`
  })
  const categories = pendingList.map(item => (item.store_name ? item.store_name : ''))

  const theme = useTheme()

  const options = {
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: false }
    },
    colors: ['#00cfe8'],
    dataLabels: { enabled: false },
    plotOptions: {
      bar: {
        borderRadius: 8,
        barHeight: '30%',
        horizontal: true,
        startingShape: 'rounded'
      }
    },
    grid: {
      borderColor: theme.palette.divider,
      xaxis: {
        lines: { show: false }
      },
      padding: {
        top: -10
      }
    },
    yaxis: {
      labels: {
        style: { colors: theme.palette.text.disabled }
      }
    },
    xaxis: {
      axisBorder: { show: false },
      axisTicks: { color: theme.palette.divider },
      categories: categories,
      labels: {
        style: { colors: theme.palette.text.disabled }
      }
    }
  }

  return (
    <Card>
      <CardHeader
        title='Store wise pending requests'
        sx={{
          flexDirection: ['column', 'row'],
          alignItems: ['flex-start', 'center'],
          '& .MuiCardHeader-action': { mb: 0 },
          '& .MuiCardHeader-content': { mb: [2, 0] }
        }}
        action={
          <OptionsMenu
            iconProps={{ fontSize: 20 }}
            options={['Refresh']}
            iconButtonProps={{ size: 'small', className: 'card-more-options', sx: { color: 'text.secondary' } }}
          />
        }
      />
      <CardContent>
        <ReactApexcharts type='bar' height={400} options={options} series={[{ data: seriesData }]} />
      </CardContent>
    </Card>
  )
}

export default StoreWisePendingRequestsChart
