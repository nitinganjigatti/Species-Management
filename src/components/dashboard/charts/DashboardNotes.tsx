import { useTheme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ReactApexcharts from 'src/@core/components/react-apexcharts'
import { hexToRGBA } from 'src/@core/utils/hex-to-rgba'
import type { DashboardNotesProps } from 'src/types/dashboard/components'

const DashboardNotes: React.FC<DashboardNotesProps> = ({ notesData }) => {
  const theme = useTheme()

  const categories = notesData.map(item => item.label)
  const values = notesData.map(item => item.value)

  const colors = [hexToRGBA('#00D6C9', 1), hexToRGBA('#E4B819', 1), hexToRGBA('#FA6140', 1), hexToRGBA('#E93353', 1)]

  const options = {
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        borderRadius: 8,
        distributed: true,
        columnWidth: '36%',
        endingShape: 'rounded',
        startingShape: 'rounded'
      }
    },
    legend: { show: false },
    dataLabels: { enabled: false },
    colors,
    tooltip: {
      enabled: true,
      followCursor: true,
      y: {
        formatter: (value: number, { dataPointIndex }: { dataPointIndex: number }) =>
          `${categories[dataPointIndex]}: ${value}`
      }
    },
    xaxis: {
      axisTicks: { show: false },
      axisBorder: { show: false },
      categories,
      labels: {
        style: { colors: theme.palette.text.disabled }
      }
    },
    yaxis: { show: false },
    grid: { show: false }
  }

  return (
    <>
      <ReactApexcharts type='bar' height={200} options={options} series={[{ data: values }]} />
      <Box sx={{ display: 'flex', justifyContent: 'start', flexWrap: 'wrap', mb: 4, px: '16px' }}>
        {categories.map((label, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: '6px', mx: 1.2 }}>
            <Box sx={{ width: 11, height: 11, borderRadius: '50%', backgroundColor: colors[index], mr: 0.5 }} />
            <Typography variant='body2' sx={{ color: '#44544A', fontSize: '13px', fontWeight: 400 }}>
              {label} -{' '}
              <Typography component='span' sx={{ color: '#44544A', fontSize: '13px', fontWeight: 600 }}>
                {values[index]}
              </Typography>
            </Typography>
          </Box>
        ))}
      </Box>
    </>
  )
}

export default DashboardNotes
