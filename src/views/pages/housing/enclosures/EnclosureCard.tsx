import React from 'react'
import { Box, Chip } from '@mui/material'
import { CellInfo } from 'src/utility/render'
import { useTheme } from '@mui/material/styles'

interface StatProps {
  label: string
  value: number | string
}

const Stat: React.FC<StatProps> = ({ label, value }) => (
  <Chip
    label={`${label} ${value}`}
    sx={{
      bgcolor: '#f0f4f2',
      fontWeight: 600,
      fontSize: 14,
      borderRadius: 2,
      mr: 1,
      mb: 1
    }}
  />
)

interface EnclosureImage {
  file?: string
}

interface EnclosureData {
  user_enclosure_name?: string
  images?: EnclosureImage[]
  incharge_name?: string
  species_count?: number
  animals_count?: number
  sub_enclosure_count?: number
}

interface EnclosureCardProps {
  enclosure: EnclosureData
  onClick?: () => void
}

const EnclosureCard: React.FC<EnclosureCardProps> = ({ enclosure, onClick }) => {
  const theme = useTheme() as any
  const isClickable = Boolean(onClick)

  return (
    <Box
      sx={{
        border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
        backgroundColor: theme.palette.common.white,
        padding: 4,
        width: '100%',
        display: 'flex',
        borderRadius: '8px',
        flexDirection: 'column',
        gap: 4,
        ...(isClickable && {
          cursor: 'pointer',
          transition: 'box-shadow 0.2s ease',
          '&:hover': { boxShadow: theme.shadows[2] }
        })
      }}
      onClick={onClick}
    >
      <CellInfo
        value={enclosure?.user_enclosure_name}
        imgUrl={enclosure?.images?.[0]?.file}
        inchagename={enclosure?.incharge_name || ''}
        subtitle=""
        color=""
        subtitleColor=""
        avatarUrl=""
        defaultImage=""
        defaultImageAlt=""
      />

      {enclosure.species_count ||
        enclosure.animals_count ||
        (enclosure.sub_enclosure_count && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {enclosure.species_count && <Stat label='Species' value={enclosure.species_count} />}
            {enclosure.animals_count && <Stat label='Animals' value={enclosure.animals_count} />}
            {enclosure.sub_enclosure_count && <Stat label='Sub Enclosures' value={enclosure.sub_enclosure_count} />}
          </Box>
        ))}
    </Box>
  )
}

export default EnclosureCard
