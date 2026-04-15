import React, { FC } from 'react'
import { Box, Breadcrumbs, Typography, Link as MuiLink } from '@mui/material'
import { useRouter, NextRouter } from 'next/router'
import NextLink from 'next/link'
import NecropsyReportForm from 'src/views/pages/necropsy/NecropsyReportForm'
import { NecropsyProvider } from 'src/context/NecropsyContext'
import enforceModuleAccess from 'src/components/ProtectedRoute'
import { NextPage } from 'next'
import { ParsedUrlQuery } from 'querystring'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()
  const { id, necropsy_id, status } = router.query as NecropsyReportQuery

  if (!id) return null

  const effectiveStatus: string = status || (necropsy_id ? 'DRAFT' : 'PENDING')

  const getStatusLabel = (): string => {
    const normalizedStatus = effectiveStatus?.toUpperCase() as NecropsyReportStatus
    switch (normalizedStatus) {
      case 'PENDING':
        return t('necropsy_module.pending')
      case 'DRAFT':
        return t('necropsy_module.draft')
      case 'COMPLETED':
      case 'UNSUITABLE':
        return t('necropsy_module.completed_label')
      default:
        return t('necropsy_module.pending')
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
              {t('necropsy_module.necropsy')}
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
              {t('necropsy_module.details')}
            </MuiLink>
            <Typography color='text.primary' sx={{ fontWeight: 500 }}>
              {necropsy_id ? t('necropsy_module.edit_report') : t('necropsy_module.new_report')}
            </Typography>
          </Breadcrumbs>
        </Box>

        <NecropsyReportForm mortalityId={id} necropsyId={necropsy_id || null} status={status} />
      </Box>
    </NecropsyProvider>
  )
}

export default enforceModuleAccess(NecropsyReport, 'enable_add_necropsy_report')
