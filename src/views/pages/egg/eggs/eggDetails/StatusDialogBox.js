import { Box, Button, Card, Dialog, Typography } from '@mui/material'
import React from 'react'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import { LoadingButton } from '@mui/lab'

const StatusDialogBox = ({
  refType,
  active,
  openStatusDialog,
  setOpenStatusDialog,
  elements,
  statusLoading,
  hatcheryStatusFunc
}) => {
  const theme = useTheme()

  return (
    <Dialog open={openStatusDialog} onClose={() => setOpenStatusDialog(false)}>
      <Card
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'column',
          width: '500px',
          gap: '24px'
        }}
      >
        <Box sx={{ bgcolor: '#ffe5e5', p: '16px', borderRadius: '12px', mt: 10 }}>
          <Icon icon='tdesign:error-triangle' fontSize={'48px'} color={'#E93353'} />
        </Box>
        <Box>
          <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '24px', fontWeight: 600 }}>
            {elements > 0
              ? `You can't Deactivate this ${refType}`
              : `Do you want to ${active ? 'deactivate' : 'activate'} this ${refType}?`}
          </Typography>
          {elements > 0 && (
            <Typography
              sx={{
                color: theme.palette.customColors.OnSurfaceVariant,
                fontSize: '16px',
                fontWeight: 400,
                mt: 2,
                textAlign: 'center'
              }}
            >
              {`This ${refType} has ${elements} ${
                refType === 'nursery' ? 'incubator' : refType === 'room' ? 'incubator' : 'egg'
              }${elements > 1 ? 's' : ''}`}
            </Typography>
          )}
        </Box>

        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', gap: 6, p: 4 }}>
          <Button variant='outlined' fullWidth sx={{ p: 4 }} onClick={() => setOpenStatusDialog(false)}>
            CANCEL
          </Button>

          <LoadingButton
            variant='contained'
            fullWidth
            sx={{ p: 4 }}
            disabled={elements > 0}
            loading={statusLoading}
            onClick={hatcheryStatusFunc}
          >
            {active ? 'deactivate' : 'activate'}
          </LoadingButton>
        </Box>
      </Card>
    </Dialog>
  )
}

export default StatusDialogBox
