import { Fragment } from 'react'
import { Dialog, DialogTitle, DialogActions, IconButton, DialogContent, Typography } from '@mui/material'
import Icon from 'src/@core/components/icon' // Assuming you're using this custom icon component

const ConfirmDialogBox = ({ closeDialog, open, action, content, title, dialogActions }) => {
  return (
    <Fragment>
      <Dialog
        open={open}
        fullWidth // Make the dialog take full width
        disableEscapeKeyDown
        onClose={(event, reason) => {
          if (reason !== 'backdropClick') {
            closeDialog()
          }
        }}
      >
        <DialogTitle sx={{ p: 4, mb: 2 }}>
          {/* Dialog Title */}
          <Typography variant='h6' component='div'>
            {title ? title : null}
          </Typography>

          {/* Close Button */}
          <IconButton
            aria-label='close'
            onClick={action ? action : null}
            sx={{ top: 10, right: 10, position: 'absolute', color: 'grey.500' }}
          >
            <Icon icon='mdi:close' />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {/* The content is passed here */}
          {content ? content : null}
        </DialogContent>

        <DialogActions>
          {/* Add footer buttons here if needed */}
          {dialogActions ? dialogActions : null}
        </DialogActions>
      </Dialog>
    </Fragment>
  )
}

export default ConfirmDialogBox
