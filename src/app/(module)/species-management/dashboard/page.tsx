'use client'

import Box from '@mui/material/Box'
import DashboardContainer from 'src/components/species-management/DashboardContainer'

const SpeciesDashboardPage = () => (
  <Box sx={{ minHeight: '100vh', p: { xs: 2, md: 3 } }}>
    <DashboardContainer />
  </Box>
)

export default SpeciesDashboardPage
