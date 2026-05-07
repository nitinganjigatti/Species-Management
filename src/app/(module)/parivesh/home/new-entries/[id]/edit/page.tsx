'use client'

import { Box } from '@mui/material'
import { useParams } from 'next/navigation'
import EntryForm from 'src/components/parivesh/home/EntryForm'

const EditEntryPage = () => {
  const params = useParams<{ id: string }>()
  const entryId = params?.id

  if (!entryId) return null

  return (
    <Box>
      <EntryForm entryId={entryId} isEditMode={true} />
    </Box>
  )
}

export default EditEntryPage
