import { useTheme } from '@mui/material/styles'
import ReactApexcharts from 'src/@core/components/react-apexcharts'
import { hexToRGBA } from 'src/@core/utils/hex-to-rgba'
import type { EggChartProps } from 'src/types/dashboard/components'

const EggChart: React.FC<EggChartProps> = ({ eggAnalytics, height }) => {
  const theme = useTheme()

  const labels = eggAnalytics.map(item => item.label)
  const values = eggAnalytics.map(item => item.value)

  const options = {
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        borderRadius: 8,
        barHeight: '60%',
        horizontal: true,
        distributed: true,
        startingShape: 'rounded'
      }
    },
    dataLabels: {
      offsetY: 8,
      style: {
        fontWeight: 500,
        fontSize: '0.875rem'
      }
    },
    grid: {
      strokeDashArray: 8,
      borderColor: theme.palette.divider,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: false } },
      padding: { top: -18, left: 21, right: 33, bottom: 10 }
    },
    colors: [
      hexToRGBA('#1F515B', 1),
      hexToRGBA('#E4B819', 1),
      hexToRGBA('#00D6C9', 1),
      hexToRGBA('#37BD69', 1),
      hexToRGBA('#FD4666', 1)
    ],
    legend: { show: false },
    states: {
      hover: { filter: { type: 'none' } },
      active: { filter: { type: 'none' } }
    },
    xaxis: {
      axisTicks: { show: false },
      axisBorder: { show: false },
      categories: labels,
      labels: {
        formatter: (val: string) => `${Number(val) / 1000}k`,
        style: {
          fontSize: '0.875rem',
          colors: theme.palette.text.disabled
        }
      }
    },
    yaxis: {
      labels: {
        align: theme.direction === 'rtl' ? 'right' : ('left' as 'right' | 'left'),
        style: {
          fontWeight: 600,
          fontSize: '0.875rem',
          colors: theme.palette.text.primary
        }
      }
    }
  }

  return <ReactApexcharts type='bar' height={height} series={[{ data: values, name: '' }]} options={options} />
}

export default EggChart
