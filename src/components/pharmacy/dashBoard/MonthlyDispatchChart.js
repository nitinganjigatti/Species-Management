import Card from '@mui/material/Card'
import { useTheme } from '@mui/material/styles'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import { useEffect, useState } from 'react'
import MenuItem from '@mui/material/MenuItem'

// ** Custom Components Imports
import OptionsMenu from 'src/@core/components/option-menu'
import ReactApexcharts from 'src/@core/components/react-apexcharts'
import { getMonthWiseDispatchList } from 'src/lib/api/pharmacy/dashboard'
import { Button } from '@mui/material'

const MonthlyDispatchChart = () => {
  // ** Hook
  const theme = useTheme()
  const [dispatchList, setDispatchList] = useState([])

  const getMonthlyDispatches = async () => {
    try {
      const result = await getMonthWiseDispatchList()

      if (result?.success === true && result?.data) {
        setDispatchList(result?.data)
      }
    } catch (error) {}
  }

  useEffect(() => {
    getMonthlyDispatches()
  }, [])
  const transactionDates = dispatchList.map(item => (item.month ? item.month : ''))
  const dailyCounts = dispatchList.map(item => (item.daily_count ? parseInt(item.daily_count) : ''))

  // const options = {
  //   chart: {
  //     offsetY: -8,
  //     parentHeightOffset: 0,
  //     toolbar: { show: false }
  //   },
  //   tooltip: { enabled: true },
  //   dataLabels: { enabled: false },
  //   stroke: {
  //     width: 5,
  //     curve: 'smooth'
  //   },
  //   grid: {
  //     show: true,
  //     padding: {
  //       left: 10,
  //       top: -24,
  //       right: 12
  //     }
  //   },
  //   fill: {
  //     type: 'gradient',
  //     gradient: {
  //       opacityTo: 0.7,
  //       opacityFrom: 0.5,
  //       shadeIntensity: 1,
  //       stops: [0, 90, 100],
  //       colorStops: [
  //         [
  //           {
  //             offset: 0,
  //             opacity: 0.6,
  //             color: theme.palette.success.main
  //           },
  //           {
  //             offset: 100,
  //             opacity: 0.1,
  //             color: theme.palette.background.paper
  //           }
  //         ]
  //       ]
  //     }
  //   },
  //   theme: {
  //     monochrome: {
  //       enabled: true,
  //       shadeTo: 'light',
  //       shadeIntensity: 1,
  //       color: theme.palette.success.main
  //     }
  //   },
  //   xaxis: {
  //     type: 'numeric',
  //     labels: { show: true },
  //     axisTicks: { show: true },
  //     axisBorder: { show: true }
  //   },
  //   yaxis: { show: true },
  //   markers: {
  //     size: 1,
  //     offsetY: 1,
  //     offsetX: -5,
  //     strokeWidth: 4,
  //     strokeOpacity: 1,
  //     colors: ['transparent'],
  //     strokeColors: 'transparent',
  //     discrete: [
  //       {
  //         size: 7,
  //         seriesIndex: 0,
  //         dataPointIndex: 7,
  //         strokeColor: theme.palette.success.main,
  //         fillColor: theme.palette.background.paper
  //       }
  //     ]
  //   }
  // }
  const options = {
    chart: {
      offsetY: -8,
      parentHeightOffset: 0,
      toolbar: { show: false }
    },
    tooltip: { enabled: true },
    dataLabels: { enabled: false },
    stroke: {
      width: 5,
      curve: 'smooth'
    },
    grid: {
      show: true,
      padding: {
        left: 22,
        top: -4,
        right: 12
      }
    },
    fill: {
      type: 'gradient',
      gradient: {
        opacityTo: 0.7,
        opacityFrom: 0.5,
        shadeIntensity: 1,
        stops: [0, 90, 100],
        colorStops: [
          [
            {
              offset: 0,
              opacity: 0.6,
              color: theme.palette.success.main
            },
            {
              offset: 100,
              opacity: 0.1,
              color: theme.palette.background.paper
            }
          ]
        ]
      }
    },
    theme: {
      monochrome: {
        enabled: true,
        shadeTo: 'light',
        shadeIntensity: 1,
        color: theme.palette.success.main
      }
    },
    xaxis: {
      categories: transactionDates,
      labels: { show: true },
      axisTicks: { show: true },
      axisBorder: { show: true }
    },
    yaxis: { show: true },
    markers: {
      size: 1,
      offsetY: 1,
      offsetX: -5,
      strokeWidth: 4,
      strokeOpacity: 1,
      colors: ['transparent'],
      strokeColors: 'transparent',
      discrete: [
        {
          size: 7,
          seriesIndex: 0,
          dataPointIndex: 7,
          strokeColor: theme.palette.success.main,
          fillColor: theme.palette.background.paper
        }
      ]
    }
  }

  return (
    <Card>
      <CardHeader
        title='Month wise dispatch'
        action={
          <OptionsMenu options={['Refresh']} iconButtonProps={{ size: 'small', className: 'card-more-options' }} />
        }
      />
      <CardContent>
        <ReactApexcharts
          type='area'
          height={300}
          options={options}
          series={[{ name: 'Product dispatched', data: dailyCounts }]}
        />
      </CardContent>
    </Card>
  )
}

export default MonthlyDispatchChart
