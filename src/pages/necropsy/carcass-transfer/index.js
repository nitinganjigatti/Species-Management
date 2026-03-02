import React, { useContext, useState, useMemo } from 'react'
import { Box, useTheme } from '@mui/material'
import { useRouter } from 'next/router'
import NecropsyAnalytics from 'src/views/pages/necropsy/NecropsyAnalytics'
import CarcassTransferCard from 'src/components/necropsy/CarcassTransferCard'
import { NecropsyProvider } from 'src/context/NecropsyContext'
import { AuthContext } from 'src/context/AuthContext'
import enforceModuleAccess from 'src/components/ProtectedRoute'

const CarcassTransferPage = () => {
  const theme = useTheme()
  const router = useRouter()
  const authData = useContext(AuthContext)
  const allowCarcassCollection = authData?.userData?.roles?.settings?.allow_carcass_collection
  const enableAddNecropsyReport = authData?.userData?.roles?.settings?.enable_add_necropsy_report

  const [filterDate, setFilterDate] = useState({})

  // Get the backTo URL from query params
  const backToUrl = useMemo(() => {
    const backTo = router.query.backTo
    if (!backTo) return null

    // Validate the URL is a safe internal path (starts with /necropsy)
    if (typeof backTo === 'string' && backTo.startsWith('/necropsy')) {
      return backTo
    }

    return null
  }, [router.query.backTo])

  // Show back button only if there's a valid backTo URL and user has necropsy report permission
  const showBackButton = !!backToUrl && enableAddNecropsyReport

  const handleBack = () => {
    if (backToUrl) {
      router.push(backToUrl)
    } else {
      // Fallback to main listing page
      router.push('/necropsy/necropsy')
    }
  }

  return (
    <NecropsyProvider>
      <Box>
        <NecropsyAnalytics
          filterDate={filterDate}
          setFilterDate={setFilterDate}
          badgeCount={0}
          allowCarcassCollection={allowCarcassCollection}
          showCarcassTransferButton={false}
          showBackButton={showBackButton}
          onBack={handleBack}
          title="Carcass Transfer"
        />

        <Box sx={{ mt: 6 }}>
          <CarcassTransferCard filterDate={filterDate} />
        </Box>
      </Box>
    </NecropsyProvider>
  )
}

export default enforceModuleAccess(CarcassTransferPage, 'allow_carcass_collection')
