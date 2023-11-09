import { useState } from 'react'
import { useSettings } from 'src/@core/hooks/useSettings'

import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Snackbar from '@mui/material/Snackbar'

const UserSnackbar = ({ status, severity, message }) => {
  const [open, setOpen] = useState(status)

  const { settings } = useSettings()
  const { skin } = settings

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return
    }
    setOpen(false)
  }

  return (
    <Snackbar
      open={open}
      onClose={handleClose}
      autoHideDuration={3000}
      key={'bottomright'}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert variant='filled' elevation={skin === 'bordered' ? 0 : 3} onClose={handleClose} severity={severity}>
        {message}
      </Alert>
    </Snackbar>
  )
}

export default UserSnackbar
