import React, { useState } from 'react'
import { Box } from '@mui/material'
import NecropsyAnalytics from 'src/views/pages/necropsy/NecropsyAnalytics'
import { NecropsyProvider } from 'src/context/NecropsyContext'

const NecropsyDetails = () => {
  const [filterDate, setFilterDate] = useState({})

  return (
    <NecropsyProvider>
      <Box sx={{ p: 4 }}>
        <NecropsyAnalytics filterDate={filterDate} setFilterDate={setFilterDate} />
        <Box sx={{ mt: 4 }}>
          <div>NecropsyDetails Content</div>
        </Box>
      </Box>
    </NecropsyProvider>
  )
}

export default NecropsyDetails
