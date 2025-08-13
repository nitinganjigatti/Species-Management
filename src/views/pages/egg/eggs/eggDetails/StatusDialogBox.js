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
  toggleHatcheryStatus
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
        <Box sx={{ bgcolor: theme.palette.customColors.TertiaryLight, p: '16px', borderRadius: '12px', mt: 10 }}>
          <Icon icon='tdesign:error-triangle' fontSize={'48px'} color={theme.palette.customColors.Error} />
        </Box>
        <Box>
          <Typography
            sx={{
              px: 3,
              textAlign: 'center',
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '24px',
              fontWeight: 600
            }}
          >
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
          <Button
            disabled={statusLoading}
            variant='outlined'
            fullWidth
            sx={{ p: 4 }}
            onClick={() => setOpenStatusDialog(false)}
          >
            CANCEL
          </Button>

          <LoadingButton
            variant='contained'
            fullWidth
            sx={{ p: 4 }}
            disabled={elements > 0}
            loading={statusLoading}
            onClick={toggleHatcheryStatus}
          >
            {active ? 'deactivate' : 'activate'}
          </LoadingButton>
        </Box>
      </Card>
    </Dialog>
  )
}

export default StatusDialogBox
