import * as React from 'react'
import PropTypes from 'prop-types'
import Button from '@mui/material/Button'
import DialogTitle from '@mui/material/DialogTitle'
import Dialog from '@mui/material/Dialog'
import Typography from '@mui/material/Typography'
import { blue } from '@mui/material/colors'
import { DialogContent, DialogActions } from '@mui/material'
import { LoadingButton } from '@mui/lab'

export const ProductNotAvailable = props => {
  const { onClose, selectedValue, open, loading } = props

  const handleClose = value => {
    onClose(value, selectedValue)
  }

  return (
    <Dialog onClose={handleClose} open={open} maxWidth='sm'>
      <DialogTitle>
        <Typography fontWeight={'bold'} color={selectedValue?.available ? 'primary' : ''}>
          {selectedValue?.available ? `Confirm Medicine Availability` : `Medicine Unavailability Confirmation`}
        </Typography>
      </DialogTitle>
      <DialogContent>
        {selectedValue?.available
          ? `Please confirm that you acknowledge the availability of the requested medicine.`
          : `Please confirm that you acknowledge the unavailability of the requested medicine.`}
      </DialogContent>
      <DialogActions>
        <Button variant='outlined' color='secondary' onClick={() => handleClose(false)}>
          Close
        </Button>
        <LoadingButton
          variant='contained'
          color={selectedValue?.available ? 'primary' : 'error'}
          onClick={() => handleClose(true)}
          loading={loading}
        >
          {/* {selectedValue?.available ? `Available` : `Not available`} */}
          Confirm
        </LoadingButton>
      </DialogActions>
    </Dialog>
  )
}

ProductNotAvailable.propTypes = {
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  selectedValue: PropTypes.string.isRequired,
  loading: PropTypes.bool.isRequired
}
