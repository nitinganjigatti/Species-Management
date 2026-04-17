'use client'

import React from 'react'
import { Box, Breadcrumbs, Typography, Link as MuiLink } from '@mui/material'
import { useParams, useSearchParams } from 'next/navigation'
import NextLink from 'next/link'
import NecropsyReportForm from 'src/views/pages/necropsy/NecropsyReportForm'
import { NecropsyProvider } from 'src/context/NecropsyContext'
import { useTranslation } from 'react-i18next'

// ==================== Types & Interfaces ====================

type NecropsyReportStatus = 'PENDING' | 'DRAFT' | 'COMPLETED' | 'UNSUITABLE'

// ==================== Main Component ====================

const NecropsyReportPage = () => {
  const params = useParams()
  const searchParams = useSearchParams()
  const { t } = useTranslation()

  const id = params?.id as string | undefined
  const necropsy_id = searchParams?.get('necropsy_id')
  const status = searchParams?.get('status')

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
            <MuiLink component={NextLink} href='/necropsy/necropsy' underline='hover' color='inherit'>
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

export default NecropsyReportPage
