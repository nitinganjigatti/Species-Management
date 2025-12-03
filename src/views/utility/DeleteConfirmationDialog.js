import Dialog from '@mui/material/Dialog'
import Icon from 'src/@core/components/icon'
import { Box, Typography } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { useTheme } from '@mui/material/styles'

const DialogConfirmationDialog = ({
  loading = false,
  handleClose = () => {},
  open = false,
  message = 'Are you sure you want to delete?',
  action = () => {}
}) => {
  const theme = useTheme()

  return (
    <Dialog
      open={open}
      disableEscapeKeyDown
      aria-labelledby='alert-dialog-title'
      aria-describedby='alert-dialog-description'
      onClose={(event, reason) => {
        if (reason !== 'backdropClick') {
          handleClose()
        }
      }}
    >
      <Box sx={{ paddingY: '40px', paddingX: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <span
          style={{
            background: '#FFD3D399',
            marginLeft: 'auto',
            marginRight: 'auto',
            borderRadius: '10px',
            width: '84px',
            height: '84px',
            padding: '12px 10px 10px 10px'
          }}
        >
          <Icon icon='mdi:warning-outline' style={{ fontSize: '63px', color: '#E93353' }} />
        </span>

        <Typography sx={{ fontWeight: 600, fontSize: 24, letterSpacing: 0, px: 20, textAlign: 'center' }}>
          {message}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            gap: '24px'
          }}
        >
          <LoadingButton
            fullWidth
            variant='outlined'
            size='large'
            sx={{ height: '58px', color: theme.palette.customColors.OnSurfaceVariant }}
            onClick={handleClose}
            disabled={loading}
            // loading={loading}
          >
            No
          </LoadingButton>
          <LoadingButton
            fullWidth
            type='submit'
            variant='contained'
            size='large'
            sx={{
              height: '58px',
              backgroundColor: theme.palette.customColors.Error
            }}
            onClick={action}
            disabled={loading}
            loading={loading}
          >
            Yes
          </LoadingButton>
        </Box>
      </Box>
    </Dialog>
  )
}

export default DialogConfirmationDialog
