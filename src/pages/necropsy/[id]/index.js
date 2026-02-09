import React from 'react'
import { Box, Breadcrumbs, Typography, Link as MuiLink } from '@mui/material'
import { useRouter } from 'next/router'
import NextLink from 'next/link'
import NecropsyDetailContent from 'src/views/pages/necropsy/NecropsyDetailContent'
import NecropsySpeciesListContent from 'src/views/pages/necropsy/NecropsySpeciesListContent'
import { NecropsyProvider } from 'src/context/NecropsyContext'
import enforceModuleAccess from 'src/components/ProtectedRoute'

const NecropsyDetails = () => {
  const router = useRouter()
  const { id, status = 'PENDING', view, taxonomy_id, species_name } = router.query

  if (!router.isReady || !id) return null

  const isSpeciesView = view === 'species'

  const effectiveTaxonomyId = isSpeciesView ? taxonomy_id || id : null

  return (
    <NecropsyProvider>
      <Box sx={{ p: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Breadcrumbs>
            <MuiLink
              component={NextLink}
              href={isSpeciesView ? `/necropsy?status=${status}&tab=species` : `/necropsy?status=${status}`}
              underline='hover'
              color='inherit'
            >
              Necropsy
            </MuiLink>
            {isSpeciesView ? (
              <Typography color='text.primary' sx={{ fontWeight: 500 }}>
                {species_name ? decodeURIComponent(species_name) : 'Species'}
              </Typography>
            ) : (
              <Typography color='text.primary' sx={{ fontWeight: 500 }}>
                {status === 'COMPLETED' || status === 'UNSUITABLE' ? 'Summary' : 'Details'}
              </Typography>
            )}
          </Breadcrumbs>
        </Box>

        {isSpeciesView ? (
          <NecropsySpeciesListContent
            taxonomyId={effectiveTaxonomyId}
            speciesName={species_name ? decodeURIComponent(species_name) : ''}
            status={status?.toUpperCase()}
          />
        ) : (
          <NecropsyDetailContent mortalityId={id} status={status?.toUpperCase()} />
        )}
      </Box>
    </NecropsyProvider>
  )
}

export default enforceModuleAccess(NecropsyDetails, 'enable_add_necropsy_report')
