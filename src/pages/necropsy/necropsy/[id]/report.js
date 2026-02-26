import React from 'react'
import { Box, Breadcrumbs, Typography, Link as MuiLink } from '@mui/material'
import { useRouter } from 'next/router'
import NextLink from 'next/link'
import NecropsyReportForm from 'src/views/pages/necropsy/NecropsyReportForm'
import { NecropsyProvider } from 'src/context/NecropsyContext'
import enforceModuleAccess from 'src/components/ProtectedRoute'

const NecropsyReport = () => {
  const router = useRouter()
  const { id, necropsy_id, status } = router.query

  if (!id) return null

  const effectiveStatus = status || (necropsy_id ? 'DRAFT' : 'PENDING')

  const getStatusLabel = () => {
    switch (effectiveStatus?.toUpperCase()) {
      case 'PENDING':
        return 'Pending'
      case 'DRAFT':
        return 'Draft'
      case 'COMPLETED':
      case 'UNSUITABLE':
        return 'Completed'
      default:
        return 'Pending'
    }
  }

  return (
    <NecropsyProvider>
      <Box sx={{ p: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Breadcrumbs>
            <MuiLink
              component={NextLink}
              href='/necropsy/necropsy'
              underline='hover'
              color='inherit'
            >
              Necropsy
            </MuiLink>
            <MuiLink
              component={NextLink}
              href={`/necropsy/necropsy?status=${effectiveStatus}`}
              underline='hover'
              color='inherit'
            >
              {getStatusLabel()}
            </MuiLink>
            <MuiLink
              component={NextLink}
              href={`/necropsy/necropsy/${id}?status=${effectiveStatus}`}
              underline='hover'
              color='inherit'
            >
              Details
            </MuiLink>
            <Typography color='text.primary' sx={{ fontWeight: 500 }}>
              {necropsy_id ? 'Edit Report' : 'New Report'}
            </Typography>
          </Breadcrumbs>
        </Box>

        <NecropsyReportForm mortalityId={id} necropsyId={necropsy_id || null} status={status} />
      </Box>
    </NecropsyProvider>
  )
}

export default enforceModuleAccess(NecropsyReport, 'enable_add_necropsy_report')
