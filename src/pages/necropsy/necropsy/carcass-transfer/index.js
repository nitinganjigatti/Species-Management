import React, { useContext, useState } from 'react'
import { Box, Breadcrumbs, Typography, Link as MuiLink } from '@mui/material'
import NextLink from 'next/link'
import NecropsyAnalytics from 'src/views/pages/necropsy/NecropsyAnalytics'
import CarcassTransferCard from 'src/components/necropsy/CarcassTransferCard'
import { NecropsyProvider } from 'src/context/NecropsyContext'
import { AuthContext } from 'src/context/AuthContext'
import enforceModuleAccess from 'src/components/ProtectedRoute'

const CarcassTransferPage = () => {
  const authData = useContext(AuthContext)
  const allowCarcassCollection = authData?.userData?.roles?.settings?.allow_carcass_collection

  const [filterDate, setFilterDate] = useState({})

  return (
    <NecropsyProvider>
      <Box sx={{ p: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Breadcrumbs>
            <MuiLink component={NextLink} href='/necropsy/necropsy' underline='hover' color='inherit'>
              Necropsy
            </MuiLink>
            <Typography color='text.primary' sx={{ fontWeight: 500 }}>
              Carcass Transfer
            </Typography>
          </Breadcrumbs>
        </Box>

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
