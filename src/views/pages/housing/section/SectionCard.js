import { Avatar, Box, Typography, Chip } from '@mui/material'
import LandscapeIcon from '@mui/icons-material/Landscape'

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

const SectionCard = ({ section }) => {
  const imageUrl = section.image

  return (
    <Box p={2} mb={2} sx={{ bgcolor: '#fff', borderRadius: 2 }}>
      <Box display='flex' alignItems='center' gap={2} mb={1}>
        {imageUrl ? (
          <Box component='img' src={imageUrl} alt={section.name} sx={{ width: 40, height: 40, borderRadius: 1 }} />
        ) : (
          <Avatar variant='square' sx={{ width: 40, height: 40 }}>
            <LandscapeIcon />
          </Avatar>
        )}
        <Box>
          <Typography fontWeight={600}>{section.name}</Typography>
          <Typography variant='body2'>{section.incharge}</Typography>
        </Box>
      </Box>

      <Box display='flex' flexWrap='wrap'>
        <Stat label='Species' value={section.species_count} />
        <Stat label='Animals' value={section.animals_count} />
        <Stat label='Enclosures' value={section.enclosure_count} />
        <Stat label='Sub enclosures' value={section.sub_enclosure_count} />
      </Box>
    </Box>
  )
}

export default SectionCard
