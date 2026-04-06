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
        return 'Incoming'
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
            <MuiLink component={NextLink} href='/necropsy/necropsy' underline='hover' color='inherit'>
              Necropsy
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
                {species_name ? decodeURIComponent(species_name as string) : 'Species'}
              </Typography>
            ) : (
              <Typography color='text.primary' sx={{ fontWeight: 500 }}>
                Details
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
