'use client'

import { useParams } from 'next/navigation'
import Box from '@mui/material/Box'
import PassDetail from 'src/components/vms/passes/PassDetail'

const PassDetailPage = () => {
  const params = useParams()
  const id = params?.id as string

  if (!id) return null

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <PassDetail passId={id} />
    </Box>
  )
}

export default PassDetailPage
