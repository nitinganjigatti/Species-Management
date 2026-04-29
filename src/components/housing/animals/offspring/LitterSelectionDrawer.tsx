import React from 'react'
import { LoadingButton } from '@mui/lab'
import { alpha, styled } from '@mui/material/styles'
import { Box, Card, CircularProgress, Drawer, IconButton, Radio, Typography, useTheme } from '@mui/material'
import { useTranslation } from 'react-i18next'

import Icon from 'src/@core/components/icon'
import Utility from 'src/utility'
import NoDataFound from 'src/views/utility/NoDataFound'
import Search from 'src/views/utility/Search'
import { ClutchItem, LitterItem, StyledTypographyProps } from 'src/types/housing/animalsOffspring'

type ReferenceType = 'litter' | 'clutch'
type ReferenceItem = LitterItem | ClutchItem

interface LitterSelectionDrawerProps {
  open: boolean
  type: ReferenceType
  searchInput: string
  isLoading: boolean
  items: ReferenceItem[]
  selectedItem: ReferenceItem | null
  onClose: () => void
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSearchClear: () => void
  onSelectItem: (item: ReferenceItem) => void
  onSubmit: () => void
}

const LitterSelectionDrawer = ({
  open,
  type,
  searchInput,
  isLoading,
  items,
  selectedItem,
  onClose,
  onSearchChange,
  onSearchClear,
  onSelectItem,
  onSubmit
}: LitterSelectionDrawerProps) => {
  const theme = useTheme() as any
  const { t } = useTranslation()
  const isClutch = type === 'clutch'

  const getItemId = (item: ReferenceItem | null) =>
    item ? (isClutch ? (item as ClutchItem).clutch_id : (item as LitterItem).litter_id) : ''
  const getItemLabel = (item: ReferenceItem) =>
    isClutch ? (item as ClutchItem).clutch_no || (item as ClutchItem).clutch_id : (item as LitterItem).litter_no || (item as LitterItem).litter_id
  const getItemCount = (item: ReferenceItem) =>
    isClutch ? (item as ClutchItem).total_egg_count : (item as LitterItem).total_animal_count

  return open ? (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: ['100%', 562] } }}
    >
      <Box
        className='sidebar-header'
        sx={{
          display: 'flex',
          position: 'sticky',
          top: 0,
          flexDirection: 'column',
          backgroundColor: theme.palette.customColors.OnPrimary,
          zIndex: 10
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 4 }}>
          <Typography
            sx={{
              fontSize: '1.5rem',
              fontWeight: 500,
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            {t(isClutch ? 'animals_module.select_clutch' : 'animals_module.select_litter')}
          </Typography>

          <IconButton size='small' onClick={onClose} sx={{ color: theme.palette.text.primary }}>
            <Icon icon='mdi:close' fontSize={24} />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ px: 4, pb: 4 }}>
        <Search
          width='100%'
          placeholder={t('search') as string}
          value={searchInput}
          onChange={onSearchChange}
          onClear={onSearchClear}
          inputStyle={{ py: '12px', px: '12px' }}
        />
      </Box>

      <Box
        sx={{
          backgroundColor: theme.palette.background.default,
          p: 4,
          flexGrow: 1,
          pb: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}
      >
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : items?.length > 0 ? (
          items.map((item, index) => (
            <Card
              key={getItemId(item) || index}
              sx={{
                p: 4,
                boxShadow: 0,
                border: `2px solid ${theme.palette.customColors.SurfaceVariant}`,
                cursor: 'pointer'
              }}
              onClick={() => onSelectItem(item)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Radio
                    checked={getItemId(selectedItem) === getItemId(item)}
                    onChange={() => onSelectItem(item)}
                    value={getItemId(item)}
                    name='radio-buttons'
                  />

                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography
                      sx={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: theme.palette.customColors.OnPrimaryContainer
                      }}
                    >
                      {t(isClutch ? 'animals_module.clutch' : 'animals_module.litter')} {getItemLabel(item)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Icon icon='uil:calender' fontSize={24} />
                      <StyledTypography fontSize='14px'>
                        {Utility.convertUtcToLocalReadableDate(item?.start_date)}
                      </StyledTypography>
                    </Box>
                  </Box>
                </Box>
                <StyledTypography fontSize='24px' fontWeight={600}>
                  {getItemCount(item)}
                </StyledTypography>
              </Box>
            </Card>
          ))
        ) : (
          <NoDataFound height={200} width={250} />
        )}
      </Box>

      <Box
        sx={{
          p: 4,
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          display: 'flex',
          justifyContent: 'center',
          gap: 2,
          boxShadow: `0px -2px 6px ${alpha(theme.palette.customColors.deepDark, 0.1)}`,
          bottom: 0,
          position: 'sticky',
          zIndex: 1
        }}
      >
        <LoadingButton
          variant='contained'
          onClick={onSubmit}
          sx={{ flex: 1, py: 4 }}
          disabled={!selectedItem || !getItemId(selectedItem)}
        >
          {t('select')}
        </LoadingButton>
      </Box>
    </Drawer>
  ) : null
}
export default React.memo(LitterSelectionDrawer)

const StyledTypography = styled(Typography)<StyledTypographyProps>(({ theme, fontWeight, fontSize, color, sx }) => ({
  fontWeight,
  fontSize,
  color: color || theme.palette.customColors.OnPrimaryContainer,
  ...sx
}))