'use client'

import { useParams } from 'next/navigation'
import Box from '@mui/material/Box'
import PassForm from 'src/components/vms/passes/PassForm'

const EditPassPage = () => {
  const params = useParams()
  const id = params?.id as string

  if (!id) return null

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <PassForm passId={id} />
    </Box>
  )
}

export default EditPassPage
