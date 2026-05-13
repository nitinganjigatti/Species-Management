'use client'

import { Suspense } from 'react'
import { Box } from '@mui/material'
import Spinner from 'src/@core/components/spinner'
import SpeciesListContent from 'src/components/parivesh/species/SpeciesListContent'

const PariveshSpeciesPage = () => (
  <Box>
    <SpeciesListContent />
  </Box>
)

const PariveshSpeciesPageWrapper = () => (
  <Suspense fallback={<Spinner sx={{}} />}>
    <PariveshSpeciesPage />
  </Suspense>
)

export default PariveshSpeciesPageWrapper
