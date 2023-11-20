import { useState } from 'react'
import { useSettings } from 'src/@core/hooks/useSettings'

import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Snackbar from '@mui/material/Snackbar'

const UserSnackbar = ({ status, severity, message, handleClose }) => {
  const { settings } = useSettings()
  const { skin } = settings

  return (
    <Snackbar
      open={status}
      onClose={handleClose}
      autoHideDuration={3000}
      key={'bottomright'}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      message={message}
    >
      <Alert variant='filled' elevation={skin === 'bordered' ? 0 : 3} onClose={handleClose} severity={severity}>
        {message}
      </Alert>
    </Snackbar>
  )
}

export default UserSnackbar
