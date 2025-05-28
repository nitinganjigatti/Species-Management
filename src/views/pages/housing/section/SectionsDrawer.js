import CustomDrawer from '../utils/CustomDrawer'
import { Typography, Divider } from '@mui/material'
import SectionCard from './SectionCard'
import { useTheme } from '@mui/material/styles'
import { CellInfo } from 'src/utility/render'
import { Box, height, width } from '@mui/system'
import Search from 'src/views/utility/Search'

const SectionsDrawer = ({ open, onClose, data }) => {
  const theme = useTheme()

  return (
    <CustomDrawer
      open={open}
      onClose={onClose}
      title='Sections'
      icon='/images/housing/section-icon-colored.png'
      iconColor={theme.palette.primary.main}
    >
      <Box
        sx={{
          border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
          backgroundColor: theme.palette.common.white,
          paddingX: 4,
          paddingY: 3,
          marginY: 6,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          borderRadius: '8px'
        }}
      >
        <CellInfo value={data.cluster_name} subtitle={data.cluster_type} imgUrl={data.cluster_image} />
      </Box>

      <Typography sx={{ fontSize: '1.25rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
        Sections {data.sections?.length ? `(${data.sections?.length})` : ''}
      </Typography>
      <Box sx={{ mt: 2, mb: 3, backgroundColor: theme.palette.common.white }}>
        <Search
          sx={{ width: '100%' }}
          textFielsSX={{
            width: '100%',
            height: 52,
            borderRadius: '8px',
            backgroundColor: theme.palette.common.white
          }}
          placeholder='Search for a section'
        />
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {data.sections?.map(section => (
          <SectionCard key={section.id} section={section} />
        ))}
      </Box>
    </CustomDrawer>
  )
}

export default SectionsDrawer
