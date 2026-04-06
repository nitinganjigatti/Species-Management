import React from 'react'
import { Box, Chip } from '@mui/material'
import { CellInfo } from 'src/utility/render'
import { useTheme } from '@mui/material/styles'
import type { Section, SectionCardProps } from 'src/types/housing'

interface StatProps {
  label: string
  value: number | string
}

const Stat: React.FC<StatProps> = ({ label, value }) => {
  const theme = useTheme() as any

  return (
    <Chip
      label={`${label} ${value}`}
      sx={{
        bgcolor: theme.palette.customColors?.Background,
        fontWeight: 600,
        fontSize: 14,
        borderRadius: 2,
        mr: 1,
        mb: 1
      }}
    />
  )
}

interface SectionCardComponentProps {
  section: Section
}

const SectionCard: React.FC<SectionCardComponentProps> = ({ section }) => {
  const theme = useTheme() as any

  return (
    <Box
      sx={{
        border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
        backgroundColor: theme.palette.customColors?.OnPrimary,
        padding: 4,
        width: '100%',
        display: 'flex',
        borderRadius: '8px',
        flexDirection: 'column',
        gap: 4
      }}
    >
      <CellInfo
        value={section?.section_name}
        imgUrl={section?.images?.[0]?.file}
        defaultImage={'/images/housing/section-icon-colored.png'}
        defaultImageAlt={'section image'}
        inchagename={section?.incharge_name || ''}
        subtitle=""
        color=""
        subtitleColor=""
        avatarUrl=""
      />

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {section.species_count && <Stat label='Species' value={section.species_count} />}
        {section.animal_count && <Stat label='Animals' value={section.animal_count} />}
        {section.enclosure_count && <Stat label='Enclosures' value={section.enclosure_count} />}
        {/* <Stat label='Sub enclosures' value={section.sub_enclosure_count} /> */}
      </Box>
    </Box>
  )
}

export default SectionCard
