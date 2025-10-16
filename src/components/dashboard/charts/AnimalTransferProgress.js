// ** MUI Imports
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Custom Components Importss

const data = [
  {
    progress: 75,
    title: 'Inter-site transfer out',
    color: '#1F415B !important',
    amount: '24'
  },
  {
    progress: 59,
    color: '#1F415B',
    title: 'Inter-site transfer in',
    amount: '12'
  },
  {
    progress: 20,
    title: 'External transfer',
    color: '#1F415B',
    amount: '4'
  }
]

const AnimalTransferProgress = ({ animalTransfer }) => {
  return (
    <>
      <Box sx={{ mb: 6, display: 'flex', alignItems: 'center' }}>
        <Typography variant='h4' sx={{ mr: 2, fontWeight: 600, fontSize: '3rem', lineHeight: 1.1, color: '#1F515B' }}>
          {animalTransfer?.totalTransfers}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: '#1F515B',
            '& svg': { mr: 0.5 }
          }}
        >
          <Icon icon={animalTransfer.transferPercentage > 0 ? 'mdi:menu-up' : 'mdi:menu-down'} fontSize='1.875rem' />
          <Typography variant='body2' sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#1F515B' }}>
            {animalTransfer?.transferPercentage} %
          </Typography>
        </Box>
      </Box>

      {animalTransfer?.transferProgress.map((item, index) => {
        return (
          <Box key={item.title} sx={{ mb: index !== animalTransfer?.transferProgress.length - 1 ? 6.5 : undefined }}>
            <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography sx={{ mr: 2, fontWeight: 500, fontSize: '16px', color: '#44544A' }}>{item.title}</Typography>
              <Typography sx={{ fontWeight: 600, fontSize: '24px', color: '#44544A' }}>{item.value}</Typography>
            </Box>
            <LinearProgress
              value={item.progressPercentage}
              variant='determinate'
              sx={{
                bgcolor: '#AFEFEB80',
                '& .MuiLinearProgress-bar': {
                  bgcolor: '#1F415B'
                }
              }}
            />
          </Box>
        )
      })}
      {/* </CardContent> */}
    </>
  )
}

export default AnimalTransferProgress

// import { Box, Typography, LinearProgress } from '@mui/material'

// const TransferProgress = ({ label, value, total = 100 }) => {
//   return (
//     <Box sx={{ mb: 5 }}>
//       <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
//         <Typography variant='body2' sx={{ fontSize: '0.875rem' }}>
//           {label}
//         </Typography>
//         <Typography variant='body2' sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
//           {value}
//         </Typography>
//       </Box>
//       <LinearProgress
//         variant='determinate'
//         value={(value / total) * 100}
//         sx={{
//           height: 10,
//           borderRadius: 5,
//           bgcolor: '#AFEFEB80',
//           '& .MuiLinearProgress-bar': {
//             bgcolor: '#1F415B',
//             borderRadius: 5
//           }
//         }}
//       />
//     </Box>
//   )
// }

// const AnimalTransferProgress = ({ transferData }) => {
//   return (
//     <>
//       <Box sx={{ display: 'flex', alignItems: 'flex-end', mb: 3 }}>
//         <Typography sx={{ fontWeight: 600, fontSize: '3rem', lineHeight: 1.1, color: '#1F515B' }}>
//           {transferData.totalTransfers}
//         </Typography>
//         <Box sx={{ ml: 5, mb: 3 }}>
//           <Typography variant='caption' sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1F515B' }}>
//             ▲ {transferData.percentageChange}%
//           </Typography>
//         </Box>
//       </Box>

//       {transferData.transfers.map((transfer, index) => (
//         <TransferProgress key={index} label={transfer.label} value={transfer.value} total={transfer.total} />
//       ))}
//     </>
//   )
// }
// export default AnimalTransferProgress

// transferData={{
//     totalTransfers: 212,
//     percentageChange: 22,
//     transfers: [
//       { label: 'Inter-site transfer out', value: 18, total: 100 },
//       { label: 'Inter-site transfer in', value: 21, total: 100 },
//       { label: 'External transfer', value: 172, total: 300 }
//     ]
//   }}
