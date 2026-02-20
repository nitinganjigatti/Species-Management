import React, { useContext, useState } from 'react'
import { Box, Typography, useTheme } from '@mui/material'
import NecropsyAnalytics from 'src/views/pages/necropsy/NecropsyAnalytics'
import CarcassTransferCard from 'src/components/necropsy/CarcassTransferCard'
import { NecropsyProvider } from 'src/context/NecropsyContext'
import { AuthContext } from 'src/context/AuthContext'
import enforceModuleAccess from 'src/components/ProtectedRoute'

const CarcassTransferPage = () => {
  const theme = useTheme()
  const authData = useContext(AuthContext)
  const allowCarcassCollection = authData?.userData?.roles?.settings?.allow_carcass_collection

  const [filterDate, setFilterDate] = useState({})

  return (
    <NecropsyProvider>
      <Box>
        <Typography
          sx={{
            fontSize: '24px',
            fontWeight: 600,
            color: theme.palette.customColors?.OnSurfaceVariant,
            mb: 4
          }}
        >
          Carcass Transfer
        </Typography>

        <NecropsyAnalytics
          filterDate={filterDate}
          setFilterDate={setFilterDate}
          badgeCount={0}
          allowCarcassCollection={allowCarcassCollection}
          showCarcassTransferButton={false}
        />

        <Box sx={{ mt: 6 }}>
          <CarcassTransferCard filterDate={filterDate} />
        </Box>
      </Box>
    </NecropsyProvider>
  )
}

export default enforceModuleAccess(CarcassTransferPage, 'allow_carcass_collection')
