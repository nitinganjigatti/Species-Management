import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'
import Icon from 'src/@core/components/icon'
import type { AnimalTransferProgressProps } from 'src/types/dashboard/components'

const AnimalTransferProgress: React.FC<AnimalTransferProgressProps> = ({ animalTransfer }) => {
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

      {animalTransfer?.transferProgress.map((item, index) => (
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
      ))}
    </>
  )
}

export default AnimalTransferProgress
