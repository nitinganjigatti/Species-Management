import React from 'react'
import { Box, TextField, Typography } from '@mui/material'

export default function BasicDetails() {
  return (
    <Box display='grid' gap={2} gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)' }}>
      {/* <TextField label='Location' size='small' />
      <TextField
        label='Date & Time of Anesthesia'
        size='small'
        type='datetime-local'
        InputLabelProps={{ shrink: true }}
      />
      <TextField label='Veterinarian' select SelectProps={{ native: true }} size='small'>
        <option>Select</option>
        <option>Dr. A</option>
        <option>Dr. B</option>
      </TextField>
      <TextField label='Anesthetist' select SelectProps={{ native: true }} size='small'>
        <option>Select</option>
        <option>Dr. X</option>
        <option>Dr. Y</option>
      </TextField>

      <Box gridColumn='1 / -1'>
        <TextField label='Notes' size='small' fullWidth multiline rows={3} placeholder='Enter notes' />
      </Box> */}
      <Typography>Basic detail ui will come here</Typography>
    </Box>
  )
}
