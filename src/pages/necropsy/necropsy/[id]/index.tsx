import React, { FC } from 'react'
import { Box, Breadcrumbs, Typography, Link as MuiLink } from '@mui/material'
import { useRouter, NextRouter } from 'next/router'
import NextLink from 'next/link'
import NecropsyDetailContent from 'src/views/pages/necropsy/NecropsyDetailContent'
import NecropsySpeciesListContent from 'src/views/pages/necropsy/NecropsySpeciesListContent'
import { NecropsyProvider } from 'src/context/NecropsyContext'
import enforceModuleAccess from 'src/components/ProtectedRoute'
import { NextPage } from 'next'
import { ParsedUrlQuery } from 'querystring'
import { useTranslation } from 'react-i18next'

// ==================== Types & Interfaces ====================

interface NecropsyDetailsQuery extends ParsedUrlQuery {
  id?: string
  status?: string
  view?: string
  taxonomy_id?: string
  species_name?: string
  scientific_name?: string
  species_image?: string
}

type NecropsyStatus = 'INCOMING' | 'PENDING' | 'DRAFT' | 'COMPLETED' | 'UNSUITABLE'

// ==================== Main Component ====================

const NecropsyDetails: NextPage = () => {
  const router: NextRouter = useRouter()
  const { t } = useTranslation()

  const {
    id,
    status = 'PENDING',
    view,
    taxonomy_id,
    species_name,
    scientific_name,
    species_image
  } = router.query as NecropsyDetailsQuery

  if (!router.isReady || !id) return null

  const isSpeciesView: boolean = view === 'species'

  const effectiveTaxonomyId: string | null = isSpeciesView ? taxonomy_id || id : null

  const getStatusLabel = (): string => {
    const normalizedStatus = (status as string)?.toUpperCase() as NecropsyStatus
    switch (normalizedStatus) {
      case 'INCOMING':
        return t('necropsy_module.incoming')
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
              href={
                isSpeciesView
                  ? `/necropsy/necropsy?status=${status}&tab=species`
                  : `/necropsy/necropsy?status=${status}`
              }
              underline='hover'
              color='inherit'
            >
              {getStatusLabel()}
            </MuiLink>
            {isSpeciesView ? (
              <Typography color='text.primary' sx={{ fontWeight: 500 }}>
                {species_name ? decodeURIComponent(species_name as string) : t('necropsy_module.species')}
              </Typography>
            ) : (
              <Typography color='text.primary' sx={{ fontWeight: 500 }}>
                {t('necropsy_module.details')}
              </Typography>
            )}
          </Breadcrumbs>
        </Box>

        {isSpeciesView ? (
          <NecropsySpeciesListContent
            taxonomyId={effectiveTaxonomyId || undefined}
            speciesName={species_name ? decodeURIComponent(species_name as string) : ''}
            scientificName={scientific_name ? decodeURIComponent(scientific_name as string) : ''}
            speciesImage={species_image ? decodeURIComponent(species_image as string) : ''}
            status={(status as string)?.toUpperCase() as 'INCOMING' | 'PENDING' | 'DRAFT' | 'COMPLETED' | undefined}
          />
        ) : (
          <NecropsyDetailContent mortalityId={id} status={(status as string)?.toUpperCase() as 'PENDING' | 'DRAFT' | 'COMPLETED' | 'UNSUITABLE' | undefined} />
        )}
      </Box>
    </NecropsyProvider>
  )
}

export default enforceModuleAccess(NecropsyDetails, 'enable_add_necropsy_report')
