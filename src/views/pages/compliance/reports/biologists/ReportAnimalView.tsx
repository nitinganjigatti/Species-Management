import { Box } from '@mui/system'
import React from 'react'
import AnimalCard from 'src/views/utility/AnimalCard'
import SiteSectionEnclosureCard from 'src/views/utility/SiteSectionEnclosureCard'

interface ReportAnimalData {
  ref_type: 'animal' | 'site' | 'section' | 'enclosure' | string
  default_icon?: string
  sex?: string
  local_identifier_name?: string
  local_identifier_value?: string
  animal_id?: string | number
  common_name?: string
  scientific_name?: string
  enclosure?: string
  section?: string
  site?: string
}

interface ReportAnimalViewProps {
  data?: ReportAnimalData
}

const ReportAnimalView = ({ data }: ReportAnimalViewProps) => {
  return (
    <Box sx={{ py: '16px' }}>
      {data?.ref_type === 'animal' && (
        <AnimalCard
          data={{
            sex: data.sex,
            local_identifier_name: data.local_identifier_name,
            local_identifier_value: data.local_identifier_value,
            animal_id: data.animal_id,
            common_name: data.common_name,
            scientific_name: data.scientific_name,
            user_enclosure_name: data.enclosure,
            section_name: data.section,
            site_name: data.site,
            default_icon: data.default_icon || '/images/branding/antz/Antz_logomark_h_color.svg'
          }}
          sx={{
            border: 'none',
            width: '100%',
            '&:hover': {
              backgroundColor: 'inherit' // Default hover color for table rows
            }
          }}
        />
      )}
      {data?.ref_type === 'site' && <SiteSectionEnclosureCard enclosureName={undefined} siteName={data.site} sectionName={data.section} />}
      {data?.ref_type === 'section' && <SiteSectionEnclosureCard enclosureName={undefined} siteName={data.site} sectionName={data.section} />}
      {data?.ref_type === 'enclosure' && (
        <SiteSectionEnclosureCard enclosureName={data.enclosure} siteName={data.site} sectionName={data.section} />
      )}
    </Box>
  )
}

export default ReportAnimalView
