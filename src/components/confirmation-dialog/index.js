import { Avatar, Button, CircularProgress, Dialog, IconButton, Typography } from '@mui/material'
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
  additionalDescription,
  dialogBoxStatus,
  onClose = () => {},
  formComponent,
  ConfirmationText,
  confirmAction = () => {},
  cancelText,
  confirmBtnStyle,
  cancelBtnStyle,
  imgStyle,
  imgHeight = '70px',
  imgWidth = '70px',
  allowCancel = true,
  // Optional top-right X close icon. Defaults to false so existing
  // callers (hospital / lab / diet / etc.) keep the original layout
  // with no visual change. Opt-in per dialog by passing `showCloseIcon`.
  showCloseIcon = false,
  // Optional action callback for the cancel button. When provided, the
  // cancel button runs this action INSTEAD of just calling onClose,
  // which lets the dialog host two distinct actions side-by-side
  // (e.g. "Exit" / "Exit & Delete for me"). The X close icon (when
  // shown) still calls onClose, so the user keeps a pure-cancel path.
  // Defaults to undefined → cancel button keeps the original
  // close-only behavior for every caller that doesn't pass it.
  cancelAction
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
      // onClose={onClose}
      sx={{
        '& .MuiDialog-paper': {
          backgroundColor: '#fff',
          padding: 8,
          textAlign: 'center'
        }
      }}
      onClose={(event, reason) => {
        if (reason === 'backdropClick') return
        onClose()
      }}
    >
      {/* Optional top-right X close — opt-in via `showCloseIcon`.
          Absolutely positioned so the existing centered icon/title/body
          layout below is byte-identical for all callers that don't pass
          the prop (no displacement, no visual shift). */}
      {showCloseIcon ? (
        <IconButton
          aria-label='Close'
          onClick={() => onClose()}
          disabled={loading}
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            color: 'text.secondary',
            '&:hover': { color: 'text.primary' }
          }}
        >
          <Icon icon='mdi:close' fontSize='1.25rem' />
        </IconButton>
      ) : null}
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
            <Icon width={imgWidth} height={imgHeight} color={iconColor ? iconColor : null} icon={icon} />
          </Box>
        ) : null}
        {image ? (
          <Box
            sx={{
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: theme.palette.customColors.mdAntzNeutral,
              ...imgStyle
            }}
          >
            <Avatar
              sx={{
                '& > img': {
                  objectFit: 'contain'
                },
                width: imgWidth,
                height: imgHeight
              }}
              variant='rounded'
              alt={image}
              src={image}
            />
          </Box>
        ) : null}
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: 24, textAlign: 'center' }}>{title ? title : null}</Typography>
          <Typography sx={{ fontWeight: 400, fontSize: 14, textAlign: 'center' }}>
            {description ? description : null}
          </Typography>
          {additionalDescription ? (
            <Typography sx={{ fontWeight: 400, fontSize: 14, textAlign: 'center' }}>{additionalDescription}</Typography>
          ) : null}
        </Box>
        {formComponent ? <Box sx={{ width: '100%' }}>{formComponent} </Box> : null}
        <Box sx={{ display: 'flex', justifyContent: allowCancel ? 'space-between' : 'center', width: '100%', gap: 5 }}>
          {allowCancel && (
            <Button
              disabled={loading}
              // If a cancelAction was provided, run it; otherwise fall back
              // to onClose (the original behavior every other caller relies
              // on). This lets a single dialog host two side-by-side actions
              // while keeping every other consumer unchanged.
              onClick={() => (cancelAction ? cancelAction() : onClose())}
              variant='outlined'
              sx={{
                color: 'gray',
                width: '45%',
                ...cancelBtnStyle
              }}
            >
              {cancelText ? cancelText : 'Cancel'}
            </Button>
          )}
          <Button
            sx={{
              width: '45%',
              ...confirmBtnStyle
            }}
            disabled={loading}
            variant='contained'
            onClick={confirmAction}
          >
            {loading ? <CircularProgress size={16} /> : <>{ConfirmationText ? ConfirmationText : 'Yes'}</>}
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}

export default ConfirmationDialog
