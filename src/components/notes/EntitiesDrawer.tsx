'use client'

import { useTranslation } from 'react-i18next'
import { Drawer, Box, Typography, IconButton } from '@mui/material'
import { useRouter } from 'next/navigation'
import { Close as CloseIcon } from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'
import LocationInfoCard from 'src/views/utility/LocationInfoCard'
import AnimalCard from 'src/views/utility/AnimalCard'

interface EntitiesDrawerProps {
  open: boolean
  onClose: () => void
  entityData: any
}

const EntitiesDrawer: React.FC<EntitiesDrawerProps> = ({ open, onClose, entityData }) => {
  const { t } = useTranslation()
  const theme = useTheme() as any
  const router = useRouter()

  const sites = entityData?.filter((item: any) => item.ref_type === 'site')
  const sections = entityData?.filter((item: any) => item.ref_type === 'section')
  const enclosures = entityData?.filter((item: any) => item.ref_type === 'enclosure')
  const animals = entityData?.filter((item: any) => item.ref_type === 'animal')

  const handleNavigation = (item: any) => {
    if (item.ref_type === 'animal') {
      router.push(`/housing/animals/${item.animalData.animal_id}`)
    } else if (item.ref_type === 'site') {
      router.push(`/housing/sites/${item.siteData.site_id}`)
    } else if (item.ref_type === 'section') {
      router.push(`/housing/sections/${item.sectionData.section_id}`)
    } else if (item.ref_type === 'enclosure') {
      router.push(`/housing/enclosure/${item.enclosureData.enclosure_id}`)
    }
  }

  const renderBlock = (title: string, data: any[], type: string) => {
    if (!data?.length) return null

    return (
      <Box
        sx={{
          borderRadius: '8px',
          border: `1px solid ${theme.palette.customColors?.OutlineVariant}`,
          overflow: 'hidden',
          mb: 3
        }}
      >
        <Box
          sx={{
            bgcolor: theme.palette.customColors?.Background,
            px: 3,
            py: 2,
            borderBottom: `1px solid ${theme.palette.customColors?.OutlineVariant}`
          }}
        >
          <Typography
            sx={{
              color: theme.palette.customColors?.OnSurfaceVariant,
              fontWeight: 600,
              fontSize: '1rem'
            }}
          >
            {data.length} {title} 
          </Typography>
        </Box>

        {data?.map((item: any, index: number) => (
          <Box
            key={index}
            onClick={() => handleNavigation(item)}
            sx={{
              px: 3,
              py: 2,
              borderBottom: index < data.length - 1 ? `1px solid ${theme.palette.customColors?.OutlineVariant}` : 'none',
              cursor: 'pointer'
            }}
          >
            {type === 'animal' && item?.animalData && <AnimalCard data={item.animalData} />}

            {(type === 'site' || type === 'section' || type === 'enclosure') && (
              <LocationInfoCard data={[item]} variant='single' />
            )}
          </Box>
        ))}
      </Box>
    )
  }

  return (
    <Drawer
      anchor='right'
      open={open}
      ModalProps={{ keepMounted: true }}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 560 },
            height: 'auto',
            maxHeight: '70vh',
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed',
            bottom: 0,
            right: 0,
            top: 'auto',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            backgroundColor: theme.palette.background.paper
          }
        },
        backdrop: {
          sx: {
            backgroundColor: theme.palette.customColors.neutralTeritary
          }
        }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 4,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Typography sx={{ fontWeight: 600, fontSize: '1rem' }}>
          {t('total_selected')} - {entityData?.length}
        </Typography>
        <IconButton size='small' onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          minHeight: 0,
          p: 3
        }}
      >
        {renderBlock(t('sites'), sites, 'site')}
        {renderBlock(t('sections'), sections, 'section')}
        {renderBlock(t('enclosures'), enclosures, 'enclosure')}
        {renderBlock(t('animals'), animals, 'animal')}
      </Box>
    </Drawer>
  )
}
export default EntitiesDrawer
