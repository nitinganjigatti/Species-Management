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

const CommonDrawerBox = ({
  title,
  imageUrl,
  totalStores,
  totalQuantity,
  drawerStatus,
  close,
  contentComponent,
  style,
  width
}) => {
  return (
    <Drawer
      anchor='right'
      open={drawerStatus}
      onClose={() => close()}
      PaperProps={{
        sx: {
          width: width ? width : 560,
          backgroundColor: style ? style : 'customColors.Background',
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
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

        {totalStores || totalQuantity ? (
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
            <Typography sx={{ fontSize: '14px' }}>
              Total Stores: <strong>{totalStores}</strong>
            </Typography>
            <Typography sx={{ fontSize: '14px' }}>
              Total Quantity: <strong>{totalQuantity}</strong>
            </Typography>
          </Box>
        ) : null}
      </Box>

      {/* Content Section */}
      <Box sx={{ p: 4, overflowY: 'auto', flexGrow: 1 }}>{contentComponent ? contentComponent : null}</Box>
    </Drawer>
  )
}

export default CommonDrawerBox
