import { useEffect, useMemo, useState } from 'react'

import {
  Box,
  Button,
  Drawer,
  IconButton,
  InputAdornment,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Radio,
  TextField,
  Typography
} from '@mui/material'
import { useTheme } from '@mui/material/styles'

import Icon from 'src/@core/components/icon'
import FallbackAvatar from 'src/views/utility/FallbackAvatar'

interface SiteOption {
  id: string | number
  name: string
  description?: string
  image?: string
}

interface SiteDrawerProps {
  open: boolean
  onClose: () => void
  sites?: SiteOption[]
  selectedSiteId?: string | number | null
  onSelect?: (site: SiteOption) => void
}

const SiteDrawer = ({ open, onClose, sites = [], selectedSiteId, onSelect }: SiteDrawerProps) => {
  const theme = useTheme()
  const [searchValue, setSearchValue] = useState<string>('')
  const [internalSelection, setInternalSelection] = useState<string | number | null>(selectedSiteId ?? null)

  useEffect(() => {
    if (open) {
      setSearchValue('')
      setInternalSelection(selectedSiteId ?? null)
    }
  }, [open, selectedSiteId])

  const filteredSites = useMemo(() => {
    const needle = searchValue.trim().toLowerCase()
    if (!needle) return sites

    return sites.filter(site => site.name.toLowerCase().includes(needle))
  }, [sites, searchValue])

  const handleConfirmSelection = () => {
    const site = sites.find(item => item.id === internalSelection)
    if (site) {
      onSelect?.(site)
    }
    onClose?.()
  }

  const handleSelect = (siteId: string | number) => {
    setInternalSelection(siteId)
  }

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        '& .MuiDrawer-paper': {
          width: ['100%', '562px'],
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: theme.palette.customColors.bodyBg
        }
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: '24px',
            // py: 4,
            backgroundColor: theme.palette.primary.contrastText
            // borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`
          }}
        >
          <Typography
            sx={{
              fontSize: '24px',
              fontWeight: 500,
              letterSpacing: 0,
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            Select Site
          </Typography>
          <IconButton onClick={onClose} size='small'>
            <Icon icon='mdi:close' fontSize={24} />
          </IconButton>
        </Box>
        <Box sx={{ p: '0px 24px 24px 24px', backgroundColor: theme.palette.primary.contrastText }}>
          <TextField
            fullWidth
            value={searchValue}
            onChange={event => setSearchValue(event.target.value)}
            placeholder='Search'
            variant='outlined'
            size='small'
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <Icon icon='mdi:magnify' fontSize={20} color={theme.palette.customColors.onSurfaceVariant} />
                </InputAdornment>
              ),
              endAdornment:
                searchValue.length > 0 ? (
                  <InputAdornment position='end'>
                    <IconButton size='small' onClick={() => setSearchValue('')}>
                      <Icon icon='mdi:close' fontSize={20} />
                    </IconButton>
                  </InputAdornment>
                ) : null
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px'
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.customColors.OutlineVariant
              }
            }}
          />
        </Box>

        <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', mt: 4 }}>
          <Typography
            sx={{
              px: '24px',
              fontWeight: 500,
              letterSpacing: 0,
              color: theme.palette.customColors.onSurfaceVariant,
              fontSize: '20px',
              mb: 2
            }}
          >
            All sites ({sites.length})
          </Typography>
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              px: '24px',
              pb: '16px',
              overflowX: 'hidden',
              '&::-webkit-scrollbar': { width: 6 },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: theme.palette.grey[300],
                borderRadius: 3
              }
            }}
          >
            <List disablePadding>
              {filteredSites.map(site => {
                const selected = internalSelection === site.id
                return (
                  <ListItemButton
                    key={site.id}
                    onClick={() => handleSelect(site.id)}
                    sx={{
                      mb: '16px',
                      borderRadius: '8px',
                      border: `1px solid ${
                        selected ? theme.palette.primary.main : theme.palette.customColors.OutlineVariant
                      }`,
                      backgroundColor: selected
                        ? theme.palette.customColors.Surface
                        : theme.palette.primary.contrastText
                    }}
                  >
                    <ListItemAvatar>
                      <FallbackAvatar
                        src={site.image}
                        fallback='/images/housing/site-icon-colored.svg'
                        alt={site.name}
                        sx={{ width: 48, height: 48, borderRadius: '12px' }}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={site.name}
                      secondary={site.description}
                      primaryTypographyProps={{
                        fontSize: '16px',
                        fontWeight: 500,
                        letterSpacing: 0,
                        color: theme.palette.customColors.OnSurfaceVariant
                      }}
                      secondaryTypographyProps={{
                        fontSize: '14px',
                        color: theme.palette.customColors.onSurfaceVariant
                      }}
                    />
                    <Radio edge='end' checked={selected} onChange={() => handleSelect(site.id)} value={site.id} />
                  </ListItemButton>
                )
              })}
              {filteredSites.length === 0 && (
                <Typography sx={{ textAlign: 'center', py: 10, color: theme.palette.customColors.onSurfaceVariant }}>
                  No sites found
                </Typography>
              )}
            </List>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            p: '24px',
            height: '106px',
            backgroundColor: theme.palette.primary.contrastText,
            boxShadow: '0px 4px 21px 0px #00000040'
          }}
        >
          <Button
            variant='contained'
            fullWidth
            disabled={!internalSelection}
            onClick={handleConfirmSelection}
            sx={{ borderRadius: '8px', height: '58px' }}
          >
            SELECT SITE
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

export default SiteDrawer
