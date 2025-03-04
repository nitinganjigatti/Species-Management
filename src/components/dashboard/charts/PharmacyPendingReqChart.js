// ** MUI Imports
import Card from '@mui/material/Card'
import { useTheme } from '@mui/material/styles'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'

// ** Component Import
import ReactApexcharts from 'src/@core/components/react-apexcharts'

const donutColors = {
  series1: '#01B0D7',
  series2: '#FFE86E',
  series3: '#FA6140'
}

const PharmacyPendingReqChart = ({ pendingRequests }) => {
  // ** Hook
  const theme = useTheme()

  const labels = pendingRequests?.priority_stats?.map(item => item.label)
  const values = pendingRequests?.priority_stats?.map(item => item.value)

  const options = {
    stroke: { width: 0 },
    labels: labels,
    colors: [donutColors.series1, donutColors.series2, donutColors.series3],
    dataLabels: {
      enabled: false,
      formatter: val => `${parseInt(val, 10)}`
    },
    legend: {
      position: 'bottom',
      markers: { offsetX: -3 },
      labels: { colors: theme.palette.text.secondary },
      itemMargin: {
        vertical: 8,
        horizontal: 7
      }
    },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            name: {
              show: false

              //   fontSize: '0.5rem'
            },
            value: {
              fontSize: '1.5rem',
              color: theme.palette.text.secondary,
              formatter: val => `${parseInt(val, 10)}`
            },
            total: {
              show: true,
              fontSize: '1.2rem',
              formatter: w => {
                const total = w.globals.seriesTotals.reduce((a, b) => a + b, 0)

                return `${total}` // Dynamically calculated total
              },
              color: theme.palette.text.primary
            }
          }
        }
      }
    },
    responsive: [
      {
        breakpoint: 992,
        options: {
          chart: {
            height: 380
          },
          legend: {
            position: 'bottom'
          }
        }
      },
      {
        breakpoint: 576,
        options: {
          chart: {
            height: 320
          },
          plotOptions: {
            pie: {
              donut: {
                labels: {
                  show: true,
                  name: {
                    fontSize: '1rem'
                  },
                  value: {
                    fontSize: '1rem'
                  },
                  total: {
                    fontSize: '1rem'
                  }
                }
              }
            }
          }
        }
      }
    ]
  }

  return (
    <>
      {/* <CardHeader
        title='Expense Ratio'
        subheader='Spending on various categories'
        subheaderTypographyProps={{ sx: { color: theme => `${theme.palette.text.disabled} !important` } }}
      /> */}
      {/* <CardContent> */}
      <ReactApexcharts type='donut' height={260} options={options} series={values} />
      {/* </CardContent> */}
    </>
  )
}

export default PharmacyPendingReqChart
