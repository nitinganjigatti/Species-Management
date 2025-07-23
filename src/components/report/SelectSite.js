import React, { useState, useEffect } from 'react'

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
  IconButton,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import FallbackAvatar from 'src/views/utility/FallbackAvatar'
import Icon from 'src/@core/components/icon'

const SelectSites = ({
  openSiteListDrawer,
  setSiteListDrawer,
  siteData,
  setSearchTerm,
  searchTerm,
  tempSelectedItems,
  setTempSelectedItems
}) => {
  const theme = useTheme()
  const [pendingSelections, setPendingSelections] = useState({ Site: [] })

  const handleCloseDrawer = () => {
    setSiteListDrawer(false)
    setTempSelectedItems(pendingSelections)
  }

  const handleCloseDrawericon = () => {
    setSiteListDrawer(false)
  }

  const handleSiteCheckboxChange = site => {
    const siteList = Array.isArray(pendingSelections.Site) ? pendingSelections.Site : []

    const isSelected = siteList.includes(site?.site_id)
    const updatedSelection = isSelected ? siteList.filter(id => id !== site.site_id) : [...siteList, site.site_id]

    setPendingSelections({
      ...pendingSelections,
      Site: updatedSelection
    })
  }

  useEffect(() => {
    if (openSiteListDrawer) {
      setPendingSelections(tempSelectedItems)
    }
  }, [openSiteListDrawer])

  const handleSelectAllSites = () => {
    const allSiteIds = siteData.map(site => site.site_id)
    setPendingSelections({
      ...pendingSelections,
      Site: pendingSelections?.Site?.length === allSiteIds?.length ? [] : allSiteIds
    })
  }

  const filteredSites = siteData.filter(site => site.site_name.toLowerCase().includes(searchTerm.toLowerCase()))

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

        {/* Search */}
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

        {/* Selected Count */}
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant='body2' sx={{ color: theme.palette.customColors.onSurfaceVariant }}>
            Selected {pendingSelections?.Site?.length} / {siteData?.length}
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
                  pendingSelections?.Site?.length === siteData?.length
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
              checked={pendingSelections?.Site?.length === siteData?.length}
              onChange={handleSelectAllSites}
              slotProps={{
                'aria-label': 'Select all species'
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
          {filteredSites.length > 0 ? (
            filteredSites.map(site => {
              return (
                <ListItem
                  key={site.site_id}
                  sx={{
                    pr: 1.5,
                    pl: 3,
                    mb: 4,
                    border: '1px solid',
                    borderColor: pendingSelections?.Site?.includes(site.site_id)
                      ? theme.palette.primary.main
                      : theme.palette.customColors.OutlineVariant,
                    borderRadius: '8px',
                    bgcolor: pendingSelections?.Site?.includes(site.site_id)
                      ? theme.palette.customColors.OnBackground
                      : 'transparent',
                    height: '70px'
                  }}
                >
                  <ListItemAvatar>
                    {/* <Avatar sx={{ backgroundColor: theme.palette.customColors.displaybgPrimary, p: site?.site_image ? 0 : 2 }} fallback='/images/housing/site-icon-colored.svg' src={site.site_image} variant='rounded' /> */}
                    <FallbackAvatar
                      src={site.site_image}
                      fallback='/images/housing/site-icon-colored.svg'
                      variant='rounded'
                      sx={{
                        backgroundColor: theme.palette.customColors.displaybgPrimary,
                        p: site?.site_image ? 0 : 2
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
                    checked={pendingSelections?.Site?.includes(site.site_id)}
                    onChange={() => handleSiteCheckboxChange(site)}
                  />
                </ListItem>
              )
            })
          ) : (
            <Typography sx={{ textAlign: 'center', mt: 15 }}>No Site's found</Typography>
          )}
        </Box>

        {/* Footer Button */}
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

              // height: '58px' // to be this value according to figma but using continue 3 component from 2 place and there has different value, need to be samea at all the places
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
