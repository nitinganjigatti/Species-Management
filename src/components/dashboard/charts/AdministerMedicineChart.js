// ** MUI Imports
import Card from '@mui/material/Card'
import { useTheme } from '@mui/material/styles'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'

// ** Component Import
import ReactApexcharts from 'src/@core/components/react-apexcharts'

// ** Util Import
import { hexToRGBA } from 'src/@core/utils/hex-to-rgba'

const radialBarColors = {
  series1: '#37BD69',
  series2: '#FFE600',
  series3: '#E93353'
}

const AdministerMedicineChart = () => {
  // ** Hook
  const theme = useTheme()

  const options = {
    stroke: { lineCap: 'round' },
    labels: ['Administered', 'Skipped', 'Pending'],
    legend: {
      show: true,
      position: 'bottom',
      labels: {
        colors: theme.palette.text.secondary
      },
      markers: {
        offsetX: -3
      },
      itemMargin: {
        vertical: 5,
        horizontal: 10
      }
    },
    colors: [radialBarColors.series1, radialBarColors.series2, radialBarColors.series3],
    plotOptions: {
      radialBar: {
        hollow: { size: '15%' },
        track: {
          margin: 12,
          background: hexToRGBA(theme.palette.customColors.trackBg, 1)
        },
        dataLabels: {
          name: {
            // fontSize: '2rem'
            show: false
          },
          value: {
            // show: false,
            show: true,
            fontSize: '1.2rem',
            color: theme.palette.text.secondary,
            formatter: function (val) {
              return Math.round(val)
            },
            offsetY: 5
          },
          total: {
            show: false,

            // show: true,
            fontWeight: 400,
            fontSize: '1.125rem',
            color: theme.palette.text.primary,
            formatter: function (w) {
              const totalValue = w.globals.seriesTotals.reduce((a, b) => a + b, 0)
              
return totalValue
            }
          }
        }
      }
    },
    grid: {
      padding: {
        top: -25,
        bottom: -30
      }
    },
    tooltip: {
      enabled: true,
      y: {
        formatter: function (val) {
          return val
        }
      }
    }
  }

  return (
    <>
      {/* <CardHeader title='Statistics' /> */}
      {/* <CardContent> */}
      <ReactApexcharts type='radialBar' height={240} options={options} series={[80, 50, 35]} />
      {/* </CardContent> */}
    </>
  )
}

export default AdministerMedicineChart
