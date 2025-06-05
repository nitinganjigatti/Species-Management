import { Box, Chip } from '@mui/material'
import { CellInfo } from 'src/utility/render'
import { useTheme } from '@mui/material/styles'

const Stat = ({ label, value }) => (
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

const EnclosureCard = ({ enclosure }) => {
  const theme = useTheme()

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
        gap: 4
      }}
    >
      <CellInfo
        value={enclosure?.user_enclosure_name}
        imgUrl={enclosure?.images?.[0]?.file}
        inchagename={enclosure?.incharge_name || ''}
      />

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {enclosure.species_count && <Stat label='Species' value={enclosure.species_count} />}
        {enclosure.animals_count && <Stat label='Animals' value={enclosure.animals_count} />}
        {enclosure.sub_enclosure_count && <Stat label='Sub Enclosures' value={enclosure.sub_enclosure_count} />}
      </Box>
    </Box>
  )
}

export default EnclosureCard
