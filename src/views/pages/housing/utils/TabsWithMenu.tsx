import React, { useState } from 'react'
import { Box, IconButton, Menu, MenuItem, Tabs, Tab, Typography, useMediaQuery } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import { useTheme } from '@emotion/react'
import { useTranslation } from 'react-i18next'

interface TabItem {
  labelKey: string
  value: string
}

interface TabsWithMenuProps {
  tabs: TabItem[]
  selectedTab: string
  onTabChange: (event: React.SyntheticEvent, newValue: string) => void
}

const TabsWithMenu: React.FC<TabsWithMenuProps> = ({ tabs, selectedTab, onTabChange }) => {
  const theme = useTheme() as any
  const { t } = useTranslation()

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const openMenu = Boolean(anchorEl)
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>): void => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = (): void => {
    setAnchorEl(null)
  }

  const handleMenuItemClick = (value: string): void => {
    onTabChange({} as React.SyntheticEvent, value)
    handleMenuClose()
  }

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <IconButton size='medium' color='inherit' aria-label='menu' onClick={handleMenuOpen} sx={{ ml: 1 }}>
          <MenuIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={openMenu}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          slotProps={{
            paper: {
              sx: {
                maxHeight: '60vh',
                overflowY: 'auto',
                maxWidth: { xs: '60vw', sm: '30vw', md: '30vw', lg: '15vw' },
                width: { xs: '60vw', sm: '30vw', md: '30vw', lg: '15vw' }
              }
            }
          }}
        >
          {isSmallScreen && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                p: 1,
                borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                position: 'sticky',
                top: 0,
                backgroundColor: 'background.paper',
                zIndex: 1
              }}
            >
              <IconButton onClick={handleMenuClose}>
                <CloseIcon />
              </IconButton>
            </Box>
          )}
          {tabs.map(tab => (
            <MenuItem
              key={tab.value}
              onClick={() => handleMenuItemClick(tab.value)}
              selected={selectedTab === tab.value}
            >
              <Typography
                sx={{
                  color: selectedTab === tab.value
                    ? theme.palette.primary.main
                    : theme.palette.customColors.OnSurfaceVariant,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                  fontWeight: selectedTab === tab.value ? 'bold' : 'normal'
                }}
              >
                {t(tab.labelKey)}
              </Typography>
            </MenuItem>
          ))}
        </Menu>
        <Tabs value={selectedTab} onChange={onTabChange} variant='scrollable' scrollButtons='auto'>
          {tabs.map(tab => (
            <Tab key={tab.value} label={t(tab.labelKey)} value={tab.value} />
          ))}
        </Tabs>
      </Box>
    </Box>
  )
}

export default TabsWithMenu
