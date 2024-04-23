import { Avatar, Button, CircularProgress, Dialog, Typography } from '@mui/material'
import React from 'react'
import { Box } from '@mui/system'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'

const ConfirmationDialog = ({
  image,
  icon,
  iconColor,
  title,
  loading = false,
  description,
  dialogBoxStatus,
  onClose,
  formComponent,
  ConfirmationText,
  confirmAction
}) => {
  const theme = useTheme()

  return (
    <Dialog
      open={dialogBoxStatus}
      maxWidth='sm'
      height='auto'
      scroll='body'
      disableEscapeKeyDown
      aria-labelledby='alert-dialog-title'
      aria-describedby='alert-dialog-description'
      onClose={() => onClose()}
      onBackdropClick={() => onClose()}
      sx={{
        '& .MuiDialog-paper': {
          backgroundColor: '#fff',
          padding: 8,
          textAlign: 'center'
        }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '32px',

          // padding: '40px',
          alignItems: 'center'
        }}
      >
        {icon ? (
          <Box
            sx={{
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: theme.palette.customColors.mdAntzNeutral
            }}
          >
            <Icon width='70px' height='70px' color={iconColor ? iconColor : null} icon={icon} />
          </Box>
        ) : null}
        {image ? (
          <Box
            sx={{
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: theme.palette.customColors.mdAntzNeutral
            }}
          >
            <Avatar
              sx={{
                '& > img': {
                  objectFit: 'contain'
                },
                width: '70px',
                height: '70px'
              }}
              variant='rounded'
              alt={image}
              src={image}
            />
          </Box>
        ) : null}
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: 24, textAlign: 'center', mb: '12px' }}>
            {title ? title : null}
          </Typography>
          <Typography sx={{ fontWeight: 400, fontSize: 14, textAlign: 'center' }}>
            {description ? description : null}
          </Typography>
        </Box>
        {formComponent ? <Box>{formComponent} </Box> : null}
        <Box sx={{ display: 'flex', justifyContent: 'space-evenly', width: '100%' }}>
          <Button
            disabled={loading}
            onClick={() => onClose()}
            variant='outlined'
            sx={{
              color: 'gray',
              width: '45%'
            }}
          >
            Cancel
          </Button>
          <Button
            sx={{
              width: '45%'
            }}
            disabled={loading}
            variant='contained'
            onClick={() => confirmAction()}
          >
            {loading ? <CircularProgress size={16} /> : <>{ConfirmationText ? ConfirmationText : 'Yes'}</>}
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}

export default ConfirmationDialog
