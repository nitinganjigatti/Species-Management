// ** React Imports
import { Fragment, useState } from 'react'

// ** MUI Imports
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogActions from '@mui/material/DialogActions'

const ConfirmDialogBox = ({ closeDialog, open, action }) => {
  return (
    <Fragment>
      <Dialog
        open={open}
        disableEscapeKeyDown
        aria-labelledby='alert-dialog-title'
        aria-describedby='alert-dialog-description'
        onClose={(event, reason) => {
          if (reason !== 'backdropClick') {
            closeDialog()
          }
        }}
      >
        {action ? action : null}
      </Dialog>
    </Fragment>
  )
}

export default ConfirmDialogBox
