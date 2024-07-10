import { Box } from '@mui/system'
import React from 'react'
import Icon from 'src/@core/components/icon'
import toast from 'react-hot-toast'
import { IconButton, Divider, Typography } from '@mui/material'

const Toaster = ({ type = 'success', message }) => {
  function toSentenceCase(str) {
    if (!str) return str
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  }

  return toast(
    t => (
      <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
              marginRight: '20px',
              fontSize: 50,
              color: type === 'success' ? '#37BD69' : type === 'warning' ? 'orange' : type === 'error' ? 'red' : ''
            }}
          />
          <div>
            <Typography sx={{ fontWeight: 500 }} variant='h5'>
              {type === 'success' ? 'Success' : type === 'warning' ? 'Warning' : type === 'error' ? 'Error' : ''}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography sx={{ fontWeight: 500 }} variant='body2'>
              {toSentenceCase(message)}
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
      style: {
        minWidth: '450px',
        minHeight: '130px'
      }
    }
  )
}

export default Toaster
