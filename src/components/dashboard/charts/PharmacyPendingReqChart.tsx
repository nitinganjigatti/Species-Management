import { useTheme } from '@mui/material/styles'
import ReactApexcharts from 'src/@core/components/react-apexcharts'
import type { PharmacyPendingReqChartProps } from 'src/types/dashboard/components'

const donutColors = {
  series1: '#01B0D7',
  series2: '#FFE86E',
  series3: '#FA6140'
}

const PharmacyPendingReqChart: React.FC<PharmacyPendingReqChartProps> = ({ pendingRequests }) => {
  const theme = useTheme()

  const labels = pendingRequests?.priority_stats?.map(item => item.label)
  const values = pendingRequests?.priority_stats?.map(item => item.value)

  const options = {
    stroke: { width: 0 },
    labels,
    colors: [donutColors.series1, donutColors.series2, donutColors.series3],
    dataLabels: {
      enabled: false,
      formatter: (val: number) => `${parseInt(String(val), 10)}`
    },
    legend: {
      position: 'bottom' as const,
      markers: { offsetX: -3 },
      labels: { colors: theme.palette.text.secondary },
      itemMargin: { vertical: 8, horizontal: 7 }
    },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            name: { show: false },
            value: {
              fontSize: '1.5rem',
              color: theme.palette.text.secondary,
              formatter: (val: number) => `${parseInt(String(val), 10)}`
            },
            total: {
              show: true,
              fontSize: '1.2rem',
              formatter: (w: { globals: { seriesTotals: number[] } }) => {
                const total = w.globals.seriesTotals.reduce((a, b) => a + b, 0)
                return `${total}`
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
          chart: { height: 380 },
          legend: { position: 'bottom' }
        }
      },
      {
        breakpoint: 576,
        options: {
          chart: { height: 320 },
          plotOptions: {
            pie: {
              donut: {
                labels: {
                  show: true,
                  name: { fontSize: '1rem' },
                  value: { fontSize: '1rem' },
                  total: { fontSize: '1rem' }
                }
              }
            }
          }
        }
      }
    ]
  }

  return <ReactApexcharts type='donut' height={260} options={options} series={values} />
}

export default PharmacyPendingReqChart
