'use client'
 
import { Box } from '@mui/material'
import { useParams } from 'next/navigation'
import EnclosureDetailsPage from 'src/components/housing/pages/EnclosureDetailsPage'
 
const HousingEnclosureDetailsPage = () => {
  const params = useParams<{ id: string; sectionId: string; enclosureId: string }>()
  const enclosureId = params?.enclosureId
 
  if (!enclosureId) return null
 
  return (
    <Box sx={{ minHeight: '100vh' }}>
      <EnclosureDetailsPage id={enclosureId} siteId={params?.id} sectionId={params?.sectionId} />
    </Box>
  )
}
 
export default HousingEnclosureDetailsPage