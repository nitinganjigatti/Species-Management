import { Box, Breadcrumbs, useTheme, Card, CardHeader, Grid, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import { NecropsyProvider } from 'src/context/NecropsyContext'
import NecropsyAnalytics from 'src/views/pages/necropsy/NecropsyAnalytics'
import RenderUtility from 'src/utility/render'
import Search from 'src/views/utility/Search'
import CommonTable from 'src/views/table/data-grid/CommonTable'

const Necropsy = () => {
  const theme = useTheme()
  const router = useRouter()
  const [filterDate, setFilterDate] = useState({})
  const [searchValue, setSearchValue] = useState('')

  return (
    <NecropsyProvider>
      <Box>
        <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
          <Typography sx={{ cursor: 'pointer', color: 'inherit' }}>Necropsy</Typography>
          <Typography sx={{ cursor: 'pointer', color: 'text.primary' }}>Dashboard</Typography>
        </Breadcrumbs>
        
        <NecropsyAnalytics disabled filterDate={filterDate} setFilterDate={setFilterDate} />
      </Box>
    </NecropsyProvider>
  )
}

export default Necropsy
