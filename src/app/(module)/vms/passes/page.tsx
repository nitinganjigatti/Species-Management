'use client'

import Box from '@mui/material/Box'
import PassList from 'src/components/vms/passes/PassList'

const PassListPage = () => {
  return (
    <Box sx={{ minHeight: '100vh' }}>
      <PassList />
    </Box>
  )
}

export default PassListPage
