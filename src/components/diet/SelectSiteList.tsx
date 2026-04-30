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
  Avatar,
  InputAdornment,
  IconButton,
  Radio
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import React, { useState, useEffect } from 'react'
import Icon from 'src/@core/components/icon'
import FallbackAvatar from 'src/views/utility/FallbackAvatar'
import { useTranslation } from 'react-i18next'

interface SelectSiteListProps {
  openSiteListDrawer: boolean
  setSiteListDrawer: (open: boolean) => void
  items: any
  setSearchTerm: (term: string) => void
  searchTerm: string
  tempSelectedItems: any
  setTempSelectedItems: (items: any) => void
  setSelectionType: (type: string) => void
  selectionType: string
  onSingleSelectClose?: (siteId: any) => void
  setCheckForSite: (val: string) => void
  setTempSelectedSpecies: (species: any[]) => void
  setspeciesview: (view: string) => void
  checkForSite: string
}

const SelectSiteList: React.FC<SelectSiteListProps> = ({
  openSiteListDrawer,
  setSiteListDrawer,
  items,
  setSearchTerm,
  searchTerm,
  tempSelectedItems,
  setTempSelectedItems,
  setSelectionType,
  selectionType,
  onSingleSelectClose,
  setCheckForSite,
  setTempSelectedSpecies,
  setspeciesview,
  checkForSite
}) => {
  const theme = useTheme()
  const { t } = useTranslation()
  const [pendingSelections, setPendingSelections] = useState<{ Site: any[] }>({ Site: [] })

  const handleCloseDrawer = () => {
    if (selectionType === 'site_species') {
      const selectedSiteId = pendingSelections?.Site[0]
      onSingleSelectClose?.(selectedSiteId)
      setSelectionType('species')
      setCheckForSite('site_species')
    } else {
      setSiteListDrawer(false)
      setTempSelectedItems(pendingSelections)
      setCheckForSite('')
    }

    setSearchTerm('')
  }

  const handleCloseDrawericon = () => {
    if (checkForSite === 'site_species') {
      setspeciesview('')
    }
    setSiteListDrawer(false)
    setSearchTerm('')
  }

  // const handleSiteCheckboxChange = site => {
  //   if (selectionType == 'site_species') {
  //     setPendingSelections({
  //       ...pendingSelections,
  //       Site: [site.site_id]
  //     })
  //     setTempSelectedSpecies([])
  //   } else {
  //     const isSelected = pendingSelections?.Site?.includes(site.site_id)

  //     const updatedSelection = isSelected
  //       ? pendingSelections?.Site?.filter(id => id !== site.site_id)
  //       : [...pendingSelections.Site, site.site_id]

  //     setPendingSelections({
  //       ...pendingSelections,
  //       Site: updatedSelection
  //     })
  //   }
  // }

  const handleSiteCheckboxChange = (site: any) => {
    setPendingSelections(prev => {
      const currentSites = prev?.Site || []

      if (selectionType === 'site_species') {
        setTempSelectedSpecies([])
        return {
          ...prev,
          Site: [site.site_id]
        }
      }

      const isSelected = currentSites.includes(site.site_id)

      return {
        ...prev,
        Site: isSelected ? currentSites.filter(id => id !== site.site_id) : [...currentSites, site.site_id]
      }
    })
  }

  useEffect(() => {
    if (openSiteListDrawer) {
      setPendingSelections(tempSelectedItems)
    }
  }, [openSiteListDrawer])

  const handleSelectAllSites = () => {
    const sitesToSelect = searchTerm ? filteredSites.map(site => site.site_id) : items.Site.map((site: any) => site.site_id)

    const isAllSelected = searchTerm
      ? filteredSites.every((site: any) => pendingSelections.Site.includes(site.site_id))
      : pendingSelections.Site.length === sitesToSelect.length

    let updatedSelection

    if (isAllSelected) {
      updatedSelection = pendingSelections.Site.filter(id => !sitesToSelect.includes(id))
    } else {
      updatedSelection = [...new Set([...pendingSelections.Site, ...sitesToSelect])]
    }

    setPendingSelections({
      ...pendingSelections,
      Site: updatedSelection
    })
  }

  const filteredSites = items.Site.filter((site: any) => site.site_name.toLowerCase().includes(searchTerm.toLowerCase()))

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
          bgcolor: theme.palette.common.white,
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
        {/* Header */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography
              variant='h6'
              sx={{
                fontWeight: '500',
                color: theme.palette.customColors.OnPrimaryContainer
              }}
            >
              {t('diet_module.choose_site')}
            </Typography>
            <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
              {t('diet_module.select_site_from_list')}
            </Typography>
          </Box>
          <IconButton size='small' sx={{ color: 'text.primary' }} onClick={handleCloseDrawericon}>
            <Icon icon='mdi:close' fontSize={24} />
          </IconButton>
        </Box>

        {/* Search */}
        <Box sx={{ p: 2, borderBottom: selectionType !== 'site_species' ? '1px solid #E0E0E0' : 'none' }}>
          <TextField
            fullWidth
            placeholder='Search'
            variant='outlined'
            size='small'
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
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

                        //fetchSections('')
                      }}
                    >
                      <Icon icon='mdi:close' fontSize={20} />
                    </IconButton>
                  </InputAdornment>
                ),
                style: {
                  background: theme.palette.customColors.bodyBg,
                  borderRadius: '4px',
                  padding: '4px 8px',
                  color: theme.palette.customColors.OnPrimaryContainer
                }
              }
            }}
          />
        </Box>

        {selectionType !== 'site_species' && (
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
              Selected {pendingSelections?.Site?.length} / {items?.Site?.length}
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
                  color:
                    pendingSelections?.Site?.length === items?.Site?.length
                      ? theme.palette.primary.main
                      : theme.palette.customColors.OnSurfaceVariant,
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'none',
                  p: 0
                }}
                onClick={handleSelectAllSites}
              >
                {t('diet_module.select_all')}
              </Button>

              <Checkbox
                checked={
                  searchTerm
                    ? filteredSites.length > 0 &&
                      filteredSites.every((site: any) => pendingSelections.Site.includes(site.site_id))
                    : pendingSelections.Site?.length === items?.Site?.length
                }
                onChange={handleSelectAllSites}
                slotProps={{
                  root: { 'aria-label': 'Select all species' }
                }}
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
        )}

        {/* Sites List */}
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
          {filteredSites?.length > 0 ? (
            filteredSites.map((site: any) => {
              const isChecked =
                selectionType === 'site_species'
                  ? pendingSelections?.Site?.[0] === site.site_id
                  : pendingSelections?.Site?.includes(site.site_id)

              return (
                <ListItem
                  key={site.site_id}
                  sx={{
                    pr: 1.5,
                    pl: 3,
                    mb: 4,
                    border: '1px solid',
                    borderColor: pendingSelections?.Site?.includes(site.site_id)
                      ? '#80E0A3'
                      : theme.palette.customColors.OutlineVariant,
                    borderRadius: '8px',
                    bgcolor: pendingSelections?.Site?.includes(site.site_id)
                      ? theme.palette.customColors.OnBackground
                      : 'transparent',
                    height: '70px'
                  }}
                >
                  <ListItemAvatar>
                    {/* <Avatar src={site?.site_image || '/icons/antz.svg'} variant='rounded' /> */}
                    <FallbackAvatar
                      src={site?.site_image}
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
                    primary={site?.site_name}
                    //secondary={site.location || '-'}
                    slotProps={{
                      secondary: {
                        sx: {
                          color: theme.palette.customColors.OnSurfaceVariant
                        }
                      },
                      primary: {
                        sx: {
                          fontWeight: 'bold',
                          color: theme.palette.customColors.OnPrimaryContainer
                        }
                      }
                    }}
                  />
                  {selectionType === 'site_species' ? (
                    <Radio checked={isChecked} onChange={() => handleSiteCheckboxChange(site)} />
                  ) : (
                    <Checkbox checked={isChecked} onChange={() => handleSiteCheckboxChange(site)} />
                  )}
                </ListItem>
              )
            })
          ) : (
            <Typography sx={{ textAlign: 'center', mt: 15 }}>{t('diet_module.no_site_found')}</Typography>
          )}
        </Box>

        {/* Footer Button */}
        <Box
          sx={{
            p: 2,
            pt: 4,
            position: 'sticky',
            bottom: 0,
            background: theme.palette.common.white,
            zIndex: 1,
            pb: 4
          }}
        >
          <Button
            variant='contained'
            fullWidth
            sx={{
              bgcolor: '#28A745',
              color: theme.palette.common.white,
              p: 2,
              borderRadius: '8px',
              '&:hover': { bgcolor: '#218838' }
            }}
            onClick={handleCloseDrawer}
            disabled={
              !pendingSelections || Object.keys(pendingSelections).length === 0 || pendingSelections?.Site?.length === 0
            }
          >
            {t('continue')}
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

export default SelectSiteList
