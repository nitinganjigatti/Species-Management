'use client'

import { Box } from '@mui/material'
import { useParams } from 'next/navigation'
import BatchDetailContent from 'src/components/parivesh/home/BatchDetailContent'

const BatchDetailPage = () => {
  const params = useParams<{ id: string }>()
  const batchId = params?.id

  if (!batchId) return null

  return (
    <Box>
      <BatchDetailContent batchId={batchId} />
    </Box>
  )
}

export default BatchDetailPage
