'use client'

import { Suspense } from 'react'
import { Box } from '@mui/material'
import { useParams, useSearchParams } from 'next/navigation'
import Spinner from 'src/@core/components/spinner'
import SpeciesDetailContent from 'src/components/parivesh/species/SpeciesDetailContent'

const SpeciesDetailPage = () => {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()

  const tsnId = searchParams?.get('tsn_id') || params?.id
  const orgId = searchParams?.get('org_id') || ''
  const tsnRelation = searchParams?.get('tsn_relation') || ''

  if (!tsnId) return null

  return (
    <Box>
      <SpeciesDetailContent tsnId={tsnId} orgId={orgId} tsnRelation={tsnRelation} />
    </Box>
  )
}

const SpeciesDetailPageWrapper = () => (
  <Suspense fallback={<Spinner sx={{}} />}>
    <SpeciesDetailPage />
  </Suspense>
)

export default SpeciesDetailPageWrapper
