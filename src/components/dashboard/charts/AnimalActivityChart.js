// ** i18n
import { useModuleTranslation } from 'src/hooks/useModuleTranslation'

// ** MUI Imports
import Box from '@mui/material/Box'
import { useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Custom Components Imports
import ReactApexcharts from 'src/@core/components/react-apexcharts'

// ** Util Import
import { hexToRGBA } from 'src/@core/utils/hex-to-rgba'

const AnimalActivityChart = ({ animalActivityData }) => {
  // ** Hooks
  const theme = useTheme()
  const { t } = useModuleTranslation('dashboard')

  const seriesData = animalActivityData.map(item => item.value)
  const labels = animalActivityData.map(item => item.label)
  const opacityLevels = [1, 0.8, 0.6, 0.4, 0.2]

  const options = {
    chart: {
      sparkline: { enabled: true }
    },
    colors: [
      theme.palette.primary.OnSurface,
      hexToRGBA(theme.palette.primary.OnSurface, 0.8),
      hexToRGBA(theme.palette.primary.OnSurface, 0.6),
      hexToRGBA(theme.palette.primary.OnSurface, 0.4),
      hexToRGBA(theme.palette.primary.OnSurface, 0.2)
    ],
    legend: { show: false },
    tooltip: { enabled: false },
    dataLabels: { enabled: false },
    stroke: { width: 3, lineCap: 'round', colors: [theme.palette.background.paper] },
    labels: labels,
    states: {
      hover: {
        filter: { type: 'none' }
      },
      active: {
        filter: { type: 'none' }
      }
    },
    plotOptions: {
      pie: {
        endAngle: 130,
        startAngle: -130,
        customScale: 0.9,
        donut: {
          size: '83%',
          labels: {
            show: true,
            name: {
              offsetY: 25,
              fontSize: '1rem',
              color: theme.palette.text.secondary
            },
            value: {
              offsetY: -15,
              fontWeight: 500,
              fontSize: '2.125rem',
              formatter: value => `${value}`,
              color: theme.palette.text.primary
            },
            total: {
              show: true,
              label: t('today'),
              fontSize: '1rem',
              color: theme.palette.text.secondary,
              formatter: value => `${value.globals.seriesTotals.reduce((total, num) => total + num)}`
            }
          }
        }
      }
    },
    responsive: [
      {
        breakpoint: 1709,
        options: {
          chart: { height: 270 }
        }
      }
    ]
  }

  return (
    <>
      <ReactApexcharts type='donut' height={280} options={options} series={seriesData} />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', mb: 4 }}>
        {animalActivityData.map((status, index) => (
          <Box
            key={status.label}
            sx={{
              mx: 3,
              display: 'flex',
              alignItems: 'center',
              '& svg': { mr: 1.25, color: hexToRGBA(theme.palette.primary.OnSurface, opacityLevels[index]) }
            }}
          >
            <Icon icon='mdi:circle' fontSize='0.75rem' />
            <Typography variant='body2' sx={{ fontWeight: 400, fontSize: '14px', color: '#44544A' }}>
              {status.label}{' '}
              <Typography component='span' variant='body2' sx={{ fontWeight: 600, fontSize: '14px', color: '#44544A' }}>
                - {status.value}
              </Typography>
            </Typography>
          </Box>
        ))}
      </Box>
    </>
  )
}

export default AnimalActivityChart
