import { Box } from '@mui/system'
import React from 'react'
import AnimalCard from 'src/views/utility/AnimalCard'
import SiteSectionEnclosureCard from 'src/views/utility/SiteSectionEnclosureCard'

const ReportAnimalView = ({ data }) => {
  return (
    <Box sx={{ py: '8px' }}>
      {data?.ref_type === 'animal' && (
        <AnimalCard
          data={{
            default_icon: data?.default_icon,
            sex: data.sex,

            // animal_id: data.animal_id,
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
      {data?.ref_type === 'site' && <SiteSectionEnclosureCard siteName={data.site} sectionName={data.section} />}
      {data?.ref_type === 'section' && <SiteSectionEnclosureCard siteName={data.site} sectionName={data.section} />}
      {data?.ref_type === 'enclosure' && (
        <SiteSectionEnclosureCard enclosureName={data.enclosure} siteName={data.site} sectionName={data.section} />
      )}
    </Box>
  )
}

export default ReportAnimalView
