import { Box } from '@mui/system'
import React from 'react'
import Icon from 'src/@core/components/icon'
import toast from 'react-hot-toast'
import { IconButton, Divider, Typography } from '@mui/material'

const Toaster = ({ type = 'success', message, ignoreCase = false }) => {
  function toSentenceCase(str) {
    if (!str?.trim()) return str
    return str?.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  }

  return toast(
    t => (
      <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography sx={{ fontWeight: 500, fontSize: '20px', color: '#000' }}>
              <Icon
                icon={
                  type === 'success'
                    ? 'ooui:success'
                    : type === 'warning'
                    ? 'ph:warning-fill'
                    : type === 'error'
                    ? 'material-symbols:error'
                    : ''
                }
                style={{
                  marginRight: '11px',
                  fontSize: 28,
                  color: type === 'success' ? '#37BD69' : type === 'warning' ? 'orange' : type === 'error' ? 'red' : '',
                  verticalAlign: 'middle'
                }}
              />
              {type === 'success' ? 'Success' : type === 'warning' ? 'Warning' : type === 'error' ? 'Error' : ''}
            </Typography>
            <Divider sx={{ my: 2, width: '360px' }} />
            <Typography sx={{ fontWeight: 400, color: '#44544A', fontSize: '14px' }}>
              {ignoreCase === true ? message : toSentenceCase(message)}
            </Typography>
          </div>
        </Box>
        <IconButton
          onClick={() => toast.dismiss(t.id)}
          style={{ position: 'absolute', top: 5, right: 5, float: 'right' }}
        >
          <Icon icon='mdi:close' fontSize={24} />
        </IconButton>
      </Box>
    ),
    {
      duration: 2000,
      style: {
        minWidth: '400px',
        minHeight: '100px'
      }
    }
  )
}

export default Toaster
