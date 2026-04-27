'use client'

import Box from '@mui/material/Box'
import VmsDashboard from 'src/components/vms/dashboard/VmsDashboard'

const DashboardPage = () => {
  return (
    <Box sx={{ minHeight: '100vh' }}>
      <VmsDashboard />
    </Box>
  )
}

export default DashboardPage
