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

const AnimalActivityChart = () => {
  // ** Hook
  const theme = useTheme()

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
    labels: ['Newly added', 'Transferred', 'Deleted', 'Missing/Escaped', 'Sick'],
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
              formatter: value => `${value}k`,
              color: theme.palette.text.primary
            },
            total: {
              show: true,
              label: 'Today',
              fontSize: '1rem',
              color: theme.palette.text.secondary,
              formatter: value => `${value.globals.seriesTotals.reduce((total, num) => total + num)}k`
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
      <ReactApexcharts type='donut' height={290} options={options} series={[13, 18, 18, 24, 16]} />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', mb: 4 }}>
        <Box sx={{ mx: 3, display: 'flex', alignItems: 'center', '& svg': { mr: 1.25, color: 'primary.OnSurface' } }}>
          <Icon icon='mdi:circle' fontSize='0.75rem' />
          <Typography variant='body2' color={'#44544A'}>
            Newly added - 100
          </Typography>
        </Box>
        <Box
          sx={{
            mx: 3,
            display: 'flex',
            alignItems: 'center',
            '& svg': { mr: 1.25, color: hexToRGBA(theme.palette.primary.OnSurface, 0.8) }
          }}
        >
          <Icon icon='mdi:circle' fontSize='0.75rem' />
          <Typography variant='body2' color={'#44544A'}>
            Transferred
          </Typography>
        </Box>
        <Box
          sx={{
            mx: 3,
            display: 'flex',
            alignItems: 'center',
            '& svg': { mr: 1.25, color: hexToRGBA(theme.palette.primary.OnSurface, 0.6) }
          }}
        >
          <Icon icon='mdi:circle' fontSize='0.75rem' />
          <Typography variant='body2' color={'#44544A'}>
            Deleted
          </Typography>
        </Box>
        <Box
          sx={{
            mx: 3,
            display: 'flex',
            alignItems: 'center',
            '& svg': { mr: 1.25, color: hexToRGBA(theme.palette.primary.OnSurface, 0.4) }
          }}
        >
          <Icon icon='mdi:circle' fontSize='0.75rem' />
          <Typography variant='body2' color={'#44544A'}>
            Missing/Escaped
          </Typography>
        </Box>
        <Box
          sx={{
            mx: 3,
            display: 'flex',
            alignItems: 'center',
            '& svg': { mr: 1.25, color: hexToRGBA(theme.palette.primary.OnSurface, 0.2) }
          }}
        >
          <Icon icon='mdi:circle' fontSize='0.75rem' />
          <Typography variant='body2' color={'#44544A'}>
            Sick
          </Typography>
        </Box>
      </Box>
    </>
  )
}

export default AnimalActivityChart
