import { Box } from '@mui/system'
import React from 'react'
import toast from 'react-hot-toast'
import { IconButton, Divider, Typography } from '@mui/material'
import {
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Close as CloseIcon
} from '@mui/icons-material'

const Toaster = ({ type = 'success', message, ignoreCase = false }) => {
  function toSentenceCase(str) {
    // Enhanced type checking
    if (typeof str !== 'string') {
      if (str === null || str === undefined) return ''

      // Convert non-string values to string
      return String(str)
    }

    const trimmedStr = str.trim()
    if (!trimmedStr) return str

    return trimmedStr.charAt(0).toUpperCase() + trimmedStr.slice(1).toLowerCase()
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <SuccessIcon sx={{ fontSize: 28, color: '#37BD69', verticalAlign: 'middle' }} />
      case 'warning':
        return <WarningIcon sx={{ fontSize: 28, color: 'orange', verticalAlign: 'middle' }} />
      case 'error':
        return <ErrorIcon sx={{ fontSize: 28, color: 'red', verticalAlign: 'middle' }} />
      default:
        return null
    }
  }

  const getTypeLabel = () => {
    switch (type) {
      case 'success':
        return 'Success'
      case 'warning':
        return 'Warning'
      case 'error':
        return 'Error'
      default:
        return ''
    }
  }

  // Safe message handling
  const displayMessage =
    ignoreCase === true ? (typeof message === 'string' ? message : String(message || '')) : toSentenceCase(message)

  return toast(
    t => (
      <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography
              sx={{
                fontWeight: 500,
                fontSize: '20px',
                color: '#000',
                display: 'flex',
                alignItems: 'center',
                gap: '11px'
              }}
            >
              {getIcon()}
              {getTypeLabel()}
            </Typography>
            <Divider sx={{ my: 2, width: '360px' }} />
            <Typography sx={{ fontWeight: 400, color: '#44544A', fontSize: '14px' }}>{displayMessage}</Typography>
          </div>
        </Box>
        <IconButton
          onClick={() => toast.dismiss(t.id)}
          style={{ position: 'absolute', top: 5, right: 5, float: 'right' }}
        >
          <CloseIcon sx={{ fontSize: 24 }} />
        </IconButton>
      </Box>
    ),
    {
      duration: 5000,
      style: {
        minWidth: '400px',
        minHeight: '100px'
      }
    }
  )
}

export default Toaster
