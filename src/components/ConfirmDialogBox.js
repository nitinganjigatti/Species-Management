// ** React Imports
import { Fragment, useState } from 'react'

// ** MUI Imports
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import Icon from 'src/@core/components/icon'
import DialogContent from '@mui/material/DialogContent'

const ConfirmDialogBox = ({ closeDialog, open, action, content }) => {
  return (
    <Fragment>
      <Dialog
        open={open}
        disableEscapeKeyDown
        onClose={(event, reason) => {
          if (reason !== 'backdropClick') {
            closeDialog()
          }
        }}
      >
        <DialogTitle id='customized-dialog-title' sx={{ p: 4, mb: 2 }}>
          <IconButton
            aria-label='close'
            onClick={action}
            sx={{ top: 10, right: 10, position: 'absolute', color: 'grey.500' }}
          >
            <Icon icon='mdi:close' />
          </IconButton>
        </DialogTitle>
        <DialogContent>{content}</DialogContent>
      </Dialog>
    </Fragment>
  )
}

export default ConfirmDialogBox
