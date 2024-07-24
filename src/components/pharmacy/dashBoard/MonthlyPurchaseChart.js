import Card from '@mui/material/Card'
import { useTheme } from '@mui/material/styles'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import { useEffect, useState } from 'react'

// ** Custom Components Imports
import OptionsMenu from 'src/@core/components/option-menu'
import ReactApexcharts from 'src/@core/components/react-apexcharts'
import { getMonthWisePurchaseList } from 'src/lib/api/pharmacy/dashboard'

const MonthlyPurchaseChart = () => {
  // ** Hook
  const theme = useTheme()
  const [purchaseList, setPurchaseList] = useState([])

  const getMonthlyPurchases = async () => {
    try {
      const result = await getMonthWisePurchaseList()

      if (result?.success === true && result?.data) {
        setPurchaseList(result?.data)
      }
    } catch (error) {}
  }

  useEffect(() => {
    getMonthlyPurchases()
  }, [])
  const transactionDates = purchaseList.map(item => (item?.month ? item?.month : ''))
  const dailyCounts = purchaseList.map(item => (item?.daily_count ? parseInt(item?.daily_count) : ''))

  // const options = {
  //   chart: {
  //     offsetY: -8,
  //     parentHeightOffset: 0,
  //     toolbar: { show: false }
  //   },
  //   tooltip: { enabled: false },
  //   dataLabels: { enabled: false },
  //   stroke: {
  //     width: 5,
  //     curve: 'smooth'
  //   },
  //   grid: {
  //     show: false,
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
  //             color: theme.palette.error.main
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
  //       color: theme.palette.error.main
  //     }
  //   },
  //   xaxis: {
  //     type: 'numeric',
  //     labels: { show: false },
  //     axisTicks: { show: false },
  //     axisBorder: { show: false }
  //   },
  //   yaxis: { show: false },
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
  //         strokeColor: theme.palette.error.main,
  //         fillColor: theme.palette.background.paper
  //       }
  //     ]
  //   }
  // }
  const options = {
    chart: {
      offsetY: 1,
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
        left: 24,
        top: -4,
        right: 4
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
              color: theme.palette.error.main
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
        color: theme.palette.error.main
      }
    },
    xaxis: {
      categories: transactionDates,
      labels: {
        show: true
      },
      axisTicks: { show: true },
      axisBorder: { show: true }
    },
    yaxis: { show: true },
    markers: {
      size: 1,
      offsetY: 1,
      offsetX: 1,
      strokeWidth: 4,
      strokeOpacity: 1,
      colors: ['transparent'],
      strokeColors: 'transparent',
      discrete: [
        {
          size: 7,
          seriesIndex: 0,
          dataPointIndex: 7,
          strokeColor: theme.palette.error.main,
          fillColor: theme.palette.background.paper
        }
      ]
    }
  }

  return (
    <Card>
      <CardHeader
        title='Month wise purchase'
        action={
          <OptionsMenu options={['Refresh']} iconButtonProps={{ size: 'small', className: 'card-more-options' }} />
        }
      />
      <CardContent>
        <ReactApexcharts
          type='area'
          height={262}
          options={options}
          series={[{ name: 'Product purchased', data: dailyCounts }]}
        />
      </CardContent>
    </Card>
  )
}

export default MonthlyPurchaseChart
