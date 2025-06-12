// ** React Imports
import { forwardRef } from 'react'

// ** MUI Imports
import Drawer from '@mui/material/Drawer'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Divider } from '@mui/material'
import Utility from 'src/utility'

const CommonDrawerBox = ({
  title,
  imageUrl,
  totalStores,
  totalQuantity,
  drawerStatus,
  close,
  contentComponent,
  style,
  width,
  totalBatches,
  totalValue
}) => {
  return (
    <Drawer
      anchor='right'
      open={drawerStatus}
      onClose={() => close()}
      slotProps={{
        paper: {
          sx: {
            width: {
              xs: '100%',
              sm: '80%',
              md: width || 560
            },
            backgroundColor: style ? style : 'customColors.Background',
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          }
        }
      }}
    >
      {/* Header Section */}
      <Box
        sx={{
          p: 4,
          position: 'sticky',
          top: 0,
          backgroundColor: style ? style : 'customColors.Background',
          zIndex: 1,
          borderBottom: '1px solid #e0e0e0'
        }}
      >
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Box display='flex' alignItems='center' gap={2}>
            {imageUrl && (
              <Box component='img' src={imageUrl} alt='' sx={{ width: 40, height: 40, borderRadius: '8px' }} />
            )}
            {title && (
              <Typography variant='h6' fontWeight='bold'>
                {title}
              </Typography>
            )}
          </Box>
          <IconButton onClick={() => close()}>
            <Icon icon='mdi:close' />
          </IconButton>
        </Box>

        {(totalStores ||
          totalQuantity ||
          totalStores === 0 ||
          totalQuantity === 0 ||
          totalBatches ||
          totalValue ||
          totalBatches === 0 ||
          totalValue === 0) && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px',
              borderRadius: '8px',
              mt: 2,
              backgroundColor: 'customColors.neutral05'
            }}
          >
            {totalStores !== undefined && (
              <Typography sx={{ fontSize: '14px' }}>
                Total Stores: <strong>{totalStores}</strong>
              </Typography>
            )}
            {totalQuantity !== undefined && (
              <Typography sx={{ fontSize: '14px' }}>
                Total Quantity: <strong>{totalQuantity}</strong>
              </Typography>
            )}
            {totalBatches !== undefined && (
              <Typography sx={{ fontSize: '14px' }}>
                Total Batches: <strong>{totalBatches}</strong>
              </Typography>
            )}

            {totalValue !== undefined && (
              <Typography sx={{ fontSize: '14px' }}>
                {/* Total Value: <strong>₹ {totalValue}</strong> */}
                Total Value: <strong>{Utility.formatAmountToReadableDigit(totalValue)}</strong>
              </Typography>
            )}
          </Box>
        )}
      </Box>
      {/* Content Section */}
      <Box sx={{ p: 4, overflowY: 'auto', flexGrow: 1 }}>{contentComponent ? contentComponent : null}</Box>
    </Drawer>
  );
}

export default CommonDrawerBox
