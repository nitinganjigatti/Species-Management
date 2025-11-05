import React from 'react'
import { Box, Typography, Button } from '@mui/material'

export default function AttachmentsSection() {
  return (
    <Box border='1px dashed #ccc' p={3} textAlign='center' borderRadius={2}>
      <Typography color='text.secondary'>Upload attachment</Typography>
      <Button variant='contained' sx={{ mt: 1 }}>
        Browse
      </Button>
    </Box>
  )
}
