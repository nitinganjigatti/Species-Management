import React, { useState } from 'react'
import { Box, Typography, TextField, Button, Grid, CircularProgress, CardContent } from '@mui/material'
import IconButton from '@mui/material/IconButton'
import moment from 'moment'

const BasicDetails = ({ airwaybillvalue, selectedId, startDate, uploadedFile, loader }) => {
  const rawValue = airwaybillvalue || ''
  const removeSpaceValue = rawValue.replace(/\s+/g, '') // remove all spaces
  const formattedValue =
    removeSpaceValue.length > 3 ? `${removeSpaceValue.slice(0, 3)} - ${removeSpaceValue.slice(3)}` : removeSpaceValue
  return (
    <>
      {!loader ? (
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
            <Grid size={{ xs: 6, md: 4 }}>
              <Typography fontWeight='400' color='#7A8684' fontSize='16px'>
                Shipment ID
              </Typography>
              <Typography color={'#44544A'} sx={{ pt: 1 }}>
                {formattedValue}
              </Typography>
            </Grid>

            <Grid size={{ xs: 6, md: 4 }}>
              <Typography fontWeight='400' color='#7A8684' fontSize='16px'>
                Date Of Issue
              </Typography>
              <Typography color='#44544A' sx={{ pt: 1 }}>
                {moment(startDate).format('DD/MM/yyyy')}
              </Typography>
            </Grid>
          </Grid>

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
                maxWidth: '180px',
                height: '40px',
                pt: 2
              }}
            >
              {uploadedFile?.file_original_name}
            </Typography>
            <IconButton size='small'>{/* <MoreVertIcon /> */}</IconButton>
          </Box>
        </Box>
      ) : (
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      )}
    </>
  )
}

export default BasicDetails
