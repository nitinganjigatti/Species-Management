'use client'

import React from 'react'
import { Box, Breadcrumbs, Typography, Link as MuiLink } from '@mui/material'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import NextLink from 'next/link'
import NecropsyDetailContent from 'src/views/pages/necropsy/NecropsyDetailContent'
import NecropsySpeciesListContent from 'src/views/pages/necropsy/NecropsySpeciesListContent'
import { NecropsyProvider } from 'src/context/NecropsyContext'
import { useTranslation } from 'react-i18next'

// ==================== Types & Interfaces ====================

type NecropsyStatus = 'INCOMING' | 'PENDING' | 'DRAFT' | 'COMPLETED' | 'UNSUITABLE'

// ==================== Main Component ====================

const NecropsyDetailsPage = () => {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { t } = useTranslation()

  const id = params?.id as string | undefined
  const status = searchParams?.get('status') || 'PENDING'
  const view = searchParams?.get('view')
  const taxonomy_id = searchParams?.get('taxonomy_id')
  const species_name = searchParams?.get('species_name')
  const scientific_name = searchParams?.get('scientific_name')
  const species_image = searchParams?.get('species_image')

  if (!id) return null

  const isSpeciesView: boolean = view === 'species'

  const effectiveTaxonomyId: string | null = isSpeciesView ? taxonomy_id || id : null

  const getStatusLabel = (): string => {
    const normalizedStatus = status?.toUpperCase() as NecropsyStatus
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
            status={status?.toUpperCase() as 'INCOMING' | 'PENDING' | 'DRAFT' | 'COMPLETED' | undefined}
          />
        ) : (
          <NecropsyDetailContent mortalityId={id} status={status?.toUpperCase() as 'PENDING' | 'DRAFT' | 'COMPLETED' | 'UNSUITABLE' | undefined} />
        )}
      </Box>
    </NecropsyProvider>
  )
}

export default NecropsyDetailsPage
