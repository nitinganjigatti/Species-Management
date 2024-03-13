// ** React Imports
import { Fragment, useState } from 'react'

// ** MUI Imports
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogActions from '@mui/material/DialogActions'
import Icon from 'src/@core/components/icon'
import { auto } from '@popperjs/core'

const DeleteDialogConfirmation = ({ handleClosenew, open, message, action }) => {
  const handleNoClick = () => {
    handleClosenew()
  }
  return (
    <Fragment>
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
        sx={{
          '& .MuiDialog-paper': {
            backgroundColor: '#fff',
            padding: 8,
            textAlign: 'center'
          }
        }}
      >
        <span
          style={{
            background: '#0000000f',
            marginLeft: 'auto',
            marginRight: 'auto',
            textAlign: 'center',
            borderRadius: '10px',
            padding: '10px',
            width: '100px',
            height: '100px',
            padding: '12px 10px 10px 10px',
            marginTop: '20px',
            marginBottom: '15px'
          }}
        >
          <Icon
            icon='material-symbols:delete-outline'
            style={{ cursor: 'pointer', fontSize: '74px', color: '#E93353' }}
          />
        </span>
        <DialogTitle id='alert-dialog-title'>{message}</DialogTitle>

        <DialogActions
          className='dialog-actions-dense'
          sx={{ justifyContent: 'flex-start', marginLeft: auto, marginRight: auto, marginTop: 2 }}
        >
          <Button
            size='large'
            variant='contained'
            sx={{ width: 200, mr: 3 }}
            onClick={() => {
              action()
            }}
          >
            Yes
          </Button>
          <Button size='large' variant='outlined' sx={{ width: 200 }} onClick={handleNoClick}>
            No
          </Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  )
}

export default DeleteDialogConfirmation
