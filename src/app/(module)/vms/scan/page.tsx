'use client'

import Box from '@mui/material/Box'
import QrScanner from 'src/components/vms/scan/QrScanner'

const ScanPage = () => {
  return (
    <Box sx={{ minHeight: '100vh' }}>
      <QrScanner />
    </Box>
  )
}

export default ScanPage
