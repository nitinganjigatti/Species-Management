import React, { FC } from 'react'
import { Box, Breadcrumbs, Typography, Link as MuiLink } from '@mui/material'
import { useRouter, NextRouter } from 'next/router'
import NextLink from 'next/link'
import NecropsyReportForm from 'src/views/pages/necropsy/NecropsyReportForm'
import { NecropsyProvider } from 'src/context/NecropsyContext'
import enforceModuleAccess from 'src/components/ProtectedRoute'
import { NextPage } from 'next'
import { ParsedUrlQuery } from 'querystring'

// ==================== Types & Interfaces ====================

interface NecropsyReportQuery extends ParsedUrlQuery {
  id?: string
  necropsy_id?: string
  status?: string
}

type NecropsyReportStatus = 'PENDING' | 'DRAFT' | 'COMPLETED' | 'UNSUITABLE'

// ==================== Main Component ====================

const NecropsyReport: NextPage = () => {
  const router: NextRouter = useRouter()
  const { id, necropsy_id, status } = router.query as NecropsyReportQuery

  if (!id) return null

  const effectiveStatus: string = status || (necropsy_id ? 'DRAFT' : 'PENDING')

  const getStatusLabel = (): string => {
    const normalizedStatus = effectiveStatus?.toUpperCase() as NecropsyReportStatus
    switch (normalizedStatus) {
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
