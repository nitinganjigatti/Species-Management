import { useTheme } from '@mui/material/styles'
import CardContent from '@mui/material/CardContent'
import ReactApexcharts from 'src/@core/components/react-apexcharts'
import { hexToRGBA } from 'src/@core/utils/hex-to-rgba'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

const DashboardNotes = ({ notesData }) => {
  const theme = useTheme()

  const categories = notesData.map(item => item.label)
  const values = notesData.map(item => item.value)

  //   const categories = ['All', 'Low', 'Moderate', 'High', 'Critical']
  //   const values = [38, 55, 48, 65, 80]
  const colors = [
    // hexToRGBA('#1F415B', 1),
    hexToRGBA('#00D6C9', 1),
    hexToRGBA('#E4B819', 1),
    hexToRGBA('#FA6140', 1),
    hexToRGBA('#E93353', 1)
  ]

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
    legend: { show: false }, // Hiding default legend
    dataLabels: { enabled: false },
    colors: colors,

    tooltip: {
      enabled: true,
      followCursor: true, // Ensures tooltip follows the cursor
      y: {
        formatter: (value, { dataPointIndex }) => `${categories[dataPointIndex]}: ${value}`
      }
    },

    xaxis: {
      axisTicks: { show: false },
      axisBorder: { show: false },
      categories: categories,
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
      {/* Custom Legend with Text & Values */}
      <Box display='flex' justifyContent='start' flexWrap='wrap' mb={4} sx={{ px: '16px' }}>
        {categories.map((label, index) => (
          <Box key={index} display='flex' alignItems='center' mx={1.2}>
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

// // ** MUI Imports
// import { useTheme } from '@mui/material/styles'
// import CardContent from '@mui/material/CardContent'

// // ** Icon Imports

// // ** Custom Components Imports
// import ReactApexcharts from 'src/@core/components/react-apexcharts'

// // ** Util Import
// import { hexToRGBA } from 'src/@core/utils/hex-to-rgba'

// const DashboardNotes = () => {
//   // ** Hook
//   const theme = useTheme()

//   //   const options = {
//   //     chart: {
//   //       parentHeightOffset: 0,
//   //       toolbar: { show: false }
//   //     },
//   //     plotOptions: {
//   //       bar: {
//   //         borderRadius: 8,
//   //         distributed: true,
//   //         columnWidth: '40%',
//   //         endingShape: 'rounded',
//   //         startingShape: 'rounded'
//   //       }
//   //     },
//   //     legend: { show: false },
//   //     dataLabels: { enabled: false },
//   //     colors: [
//   //       hexToRGBA('#1F415B', 1),
//   //       hexToRGBA('#00D6C9', 1),
//   //       hexToRGBA('#E4B819', 1),
//   //       hexToRGBA('#FA6140', 1),
//   //       hexToRGBA('#E93353', 1)
//   //     ],
//   //     states: {
//   //       hover: {
//   //         filter: { type: 'none' }
//   //       },
//   //       active: {
//   //         filter: { type: 'none' }
//   //       }
//   //     },
//   //     xaxis: {
//   //       axisTicks: { show: false },
//   //       axisBorder: { show: false },
//   //       categories: ['All', 'Low', 'Moderate', 'High', 'Critical'],
//   //       labels: {
//   //         style: { colors: theme.palette.text.disabled }
//   //       }
//   //     },
//   //     yaxis: { show: false },
//   //     grid: {
//   //       show: false,
//   //       padding: {
//   //         top: -30,
//   //         left: -7,
//   //         right: -4
//   //       }
//   //     }
//   //   }

//   const options = {
//     chart: {
//       parentHeightOffset: 0,
//       toolbar: { show: false }
//     },
//     plotOptions: {
//       bar: {
//         borderRadius: 8,
//         distributed: true,
//         columnWidth: '40%',
//         endingShape: 'rounded',
//         startingShape: 'rounded'
//       }
//     },
//     legend: {
//       show: true, // Enable legend
//       position: 'bottom', // Position the legend at the bottom
//       fontSize: '14px',
//       labels: {
//         colors: theme.palette.text.primary
//       }
//     },
//     dataLabels: { enabled: false },
//     colors: [
//       hexToRGBA('#1F415B', 1),
//       hexToRGBA('#00D6C9', 1),
//       hexToRGBA('#E4B819', 1),
//       hexToRGBA('#FA6140', 1),
//       hexToRGBA('#E93353', 1)
//     ],
//     states: {
//       hover: {
//         filter: { type: 'none' }
//       },
//       active: {
//         filter: { type: 'none' }
//       }
//     },
//     xaxis: {
//       axisTicks: { show: false },
//       axisBorder: { show: false },
//       categories: ['All', 'Low', 'Moderate', 'High', 'Critical'],
//       labels: {
//         style: { colors: theme.palette.text.disabled }
//       }
//     },
//     yaxis: { show: false },
//     grid: {
//       show: false,
//       padding: {
//         top: -30,
//         left: -7,
//         right: -4
//       }
//     }
//   }

//   return (
//     <>
//       <CardContent sx={{ pt: { xs: `${theme.spacing(6)} !important`, md: `${theme.spacing(0)} !important` } }}>
//         <ReactApexcharts type='bar' height={215} options={options} series={[{ data: [38, 55, 48, 65, 80] }]} />
//       </CardContent>
//     </>
//   )
// }

// export default DashboardNotes
