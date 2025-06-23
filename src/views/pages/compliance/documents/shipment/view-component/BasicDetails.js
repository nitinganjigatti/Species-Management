import React, { useState } from 'react'
import { Box, Typography, TextField, Button, Grid } from '@mui/material'
import IconButton from '@mui/material/IconButton'

const BasicDetails = ({ airwaybillvalue }) => {
  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1px',
          background: '#EFF5F266',
          borderRadius: '10px',
          border: '1px solid #C3CEC7',
          p: 8
        }}
      >
        <Grid container spacing={2}>
          {/* Shipment ID */}
          <Grid item xs={6} md={4}>
            <Typography fontWeight='400' color='#7A8684' fontSize='16px'>
              Shipment ID
            </Typography>
            <Typography color={'#44544A'} sx={{ pt: 1 }}>
              123-12345678
            </Typography>
          </Grid>

          {/* Date Of Issue */}
          <Grid item xs={6} md={4}>
            <Typography fontWeight='400' color='#7A8684' fontSize='16px'>
              Date Of Issue
            </Typography>
            <Typography color='#44544A' sx={{ pt: 1 }}>
              24/01/24
            </Typography>
          </Grid>
        </Grid>

        {/* File Section */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 12px',
            border: '1px solid #E0E0E0',
            borderRadius: '10px',
            backgroundColor: '#FFF',
            minWidth: '280px'
          }}
        >
          <img
            src='/icons/pdf_icon2.svg'
            alt='PDF Icon'
            width='18%'
            style={{ marginRight: '8px', background: '#FFBDA84D', borderRadius: '6px', padding: '10px' }}
          />
          <Typography
            sx={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100px',
              height: '40px',
              pt: 2
            }}
          >
            AWB_1231244....pdf
          </Typography>
          <IconButton size='small'>{/* <MoreVertIcon /> */}</IconButton>
        </Box>
      </Box>
    </>
  )
}

export default BasicDetails
