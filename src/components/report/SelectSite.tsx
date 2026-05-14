import { useEffect, useMemo, useState } from 'react'

import { useTheme } from '@mui/material/styles'
import {
  Box,
  Typography,
  TextField,
  Button,
  Drawer,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Checkbox,
  InputAdornment,
  IconButton
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import FallbackAvatar from 'src/views/utility/FallbackAvatar'
import Icon from 'src/@core/components/icon'
import { SelectSitesProps, SiteData } from 'src/types/report'

const SelectSites = <T extends { Site: (string | number)[] }>({
  openSiteListDrawer,
  setSiteListDrawer,
  siteData,
  setSearchTerm,
  searchTerm,
  tempSelectedItems,
  setTempSelectedItems
}: SelectSitesProps<T>) => {
  const theme = useTheme()
  const [pendingSelections, setPendingSelections] = useState<T>(tempSelectedItems)

  const handleCloseDrawer = () => {
    setSiteListDrawer(false)
    setTempSelectedItems(pendingSelections)
  }

  const handleCloseDrawericon = () => {
    setSiteListDrawer(false)
  }

  const handleSiteCheckboxChange = (site: SiteData) => {
    const siteList = Array.isArray(pendingSelections.Site) ? pendingSelections.Site : []

    const isSelected = siteList.includes(site?.site_id)
    const updatedSelection = isSelected ? siteList.filter(id => id !== site.site_id) : [...siteList, site.site_id]

    setPendingSelections({ ...pendingSelections, Site: updatedSelection } as T)
  }

  useEffect(() => {
    if (openSiteListDrawer) {
      setPendingSelections(tempSelectedItems)
    }
  }, [openSiteListDrawer])

  const filteredSites = useMemo(() => {
    const normalizedSiteData = Array.isArray(siteData) ? siteData : []
    const normalizedSearchTerm = (searchTerm || '').toLowerCase()

    return normalizedSiteData.filter(site => site.site_name?.toLowerCase().includes(normalizedSearchTerm))
  }, [siteData, searchTerm])

  const filteredSiteIds = useMemo(() => filteredSites.map(site => site.site_id), [filteredSites])
  const filteredSelectedCount = useMemo(
    () => filteredSiteIds.filter(id => pendingSelections?.Site?.includes(id)).length,
    [filteredSiteIds, pendingSelections?.Site]
  )
  const areAllFilteredSelected = filteredSiteIds.length > 0 && filteredSelectedCount === filteredSiteIds.length
  const isSomeFilteredSelected = filteredSelectedCount > 0 && !areAllFilteredSelected

  const handleSelectAllSites = () => {
    if (!filteredSiteIds.length) return

    setPendingSelections(prev => {
      const currentSelection = Array.isArray(prev?.Site) ? prev.Site : []
      const allSelected = filteredSiteIds.every(id => currentSelection.includes(id))

      if (allSelected) {
        return { ...prev, Site: currentSelection.filter(id => !filteredSiteIds.includes(id)) } as T
      }

      return { ...prev, Site: Array.from(new Set([...currentSelection, ...filteredSiteIds])) } as T
    })
  }

  return (
    <Drawer
      anchor='right'
      open={openSiteListDrawer}
      sx={{
        '& .MuiDrawer-paper': { width: ['100%', '562px'], height: '100%' },
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        backgroundColor: 'background.default'
      }}
    >
      {/* header */}
      <Box
        sx={{
          bgcolor: theme.palette.primary.contrastText,
          borderRadius: '8px',
          overflow: 'hidden',
          width: '100%',
          maxWidth: 522,
          margin: '15px 20px 0px 20px',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography
              variant='h6'
              sx={{
                fontWeight: '500',
                color: theme.palette.customColors.OnPrimaryContainer
              }}
            >
              Choose Site
            </Typography>
            <Typography variant='body2' sx={{ color: theme.palette.customColors.onSurfaceVariant }}>
              Select a site from the list below
            </Typography>
          </Box>
          <IconButton size='small' sx={{ color: 'text.primary' }} onClick={handleCloseDrawericon}>
            <Icon icon='mdi:close' fontSize={24} />
          </IconButton>
        </Box>

        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}` }}>
          <TextField
            fullWidth
            placeholder='Search'
            variant='outlined'
            size='small'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position='start'>
                    <SearchIcon sx={{ color: theme.palette.customColors.OnPrimaryContainer }} />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position='end'>
                    <IconButton
                      size='small'
                      onClick={() => {
                        setSearchTerm('')
                      }}
                    >
                      <Icon icon='mdi:close' fontSize={20} />
                    </IconButton>
                  </InputAdornment>
                ),
                style: {
                  background: theme.palette.customColors.lightBg,
                  borderRadius: '4px',
                  padding: '4px 8px',
                  color: theme.palette.customColors.OnPrimaryContainer
                }
              }
            }}
          />
        </Box>

        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant='body2' sx={{ color: theme.palette.customColors.onSurfaceVariant }}>
            Selected {filteredSelectedCount} / {filteredSites.length}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Button
              size='small'
              sx={{
                color: areAllFilteredSelected
                  ? theme.palette.primary.main
                  : theme.palette.customColors.onSurfaceVariant,
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'none',
                p: 0
              }}
              onClick={handleSelectAllSites}
            >
              Select all
            </Button>

            <Checkbox
              checked={areAllFilteredSelected}
              indeterminate={isSomeFilteredSelected}
              onChange={handleSelectAllSites}
              inputProps={{ 'aria-label': 'Select all species' }}
              sx={{
                '&.Mui-checked': {
                  color: theme.palette.primary.main
                },
                '& .MuiSvgIcon-root': {
                  width: '19px',
                  height: '19px',
                  border: '2px dotted'
                },
                mr: 1
              }}
            />
          </Box>
        </Box>

        <Box
          className=''
          sx={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            p: 2,
            '&::-webkit-scrollbar': {
              width: '4px'
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: theme.palette.grey[400],
              borderRadius: '2px'
            }
          }}
        >
          {filteredSites.length > 0 ? (
            [...filteredSites]
              .sort((a, b) => a.site_name.localeCompare(b.site_name))
              .map(site => {
                const isSelected = pendingSelections?.Site?.includes(site.site_id)

                const handleToggleSite = () => {
                  handleSiteCheckboxChange(site)
                }

                return (
                  <ListItem
                    key={site.site_id}
                    onClick={handleToggleSite}
                    onKeyDown={event => {
                      if (event.target !== event.currentTarget) return
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        handleToggleSite()
                      }
                    }}
                    tabIndex={0}
                    role='button'
                    sx={{
                      pr: 1.5,
                      pl: 3,
                      mb: 4,
                      border: '1px solid',
                      borderColor: isSelected ? theme.palette.primary.main : theme.palette.customColors.OutlineVariant,
                      borderRadius: '8px',
                      bgcolor: isSelected ? theme.palette.customColors.OnBackground : 'transparent',
                      height: '70px',
                      cursor: 'pointer'
                    }}
                  >
                    <ListItemAvatar>
                      <FallbackAvatar
                        src={site.site_image}
                        fallback='/images/housing/site-icon-colored.svg'
                        variant='rounded'
                        sx={{
                          backgroundColor: theme.palette.customColors.displaybgPrimary,
                          p: site?.site_image ? 0 : 2,
                          height: '40px',
                          width: '40px',
                          borderRadius: '8px'
                        }}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      sx={{ wordWrap: 'break-word' }}
                      primary={site.site_name}
                      slotProps={{
                        primary: {
                          fontWeight: 'bold',
                          color: theme.palette.customColors.OnPrimaryContainer
                        },
                        secondary: { color: theme.palette.customColors.onSurfaceVariant }
                      }}
                    />
                    <Checkbox
                      checked={isSelected}
                      onClick={event => {
                        event.stopPropagation()
                        handleToggleSite()
                      }}
                      inputProps={{ 'aria-label': 'Select site' }}
                    />
                  </ListItem>
                )
              })
          ) : (
            <Typography sx={{ textAlign: 'center', mt: 15 }}>No Site's found</Typography>
          )}
        </Box>

        <Box
          sx={{
            p: 2,
            pt: 4,
            position: 'sticky',
            bottom: 0,
            background: theme.palette.primary.contrastText,
            zIndex: 1,
            pb: 4
          }}
        >
          <Button
            variant='contained'
            fullWidth
            sx={{
              color: theme.palette.primary.contrastText,
              p: 2,
              borderRadius: '8px'
            }}
            onClick={handleCloseDrawer}
            disabled={pendingSelections?.Site?.length === 0}
          >
            CONTINUE
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

export default SelectSites
