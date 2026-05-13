import { useTheme } from '@emotion/react'
import { LoadingButton } from '@mui/lab'
import { Drawer, Box, Typography, IconButton, Badge, Radio, RadioGroup, FormControlLabel } from '@mui/material'
import { Grid, styled } from '@mui/system'
import React, { useCallback, useState } from 'react'
import Icon from 'src/@core/components/icon'
import Search from 'src/views/utility/Search'
import { useTranslation } from 'react-i18next'

const leftMenu = [{ id: 1, name: 'Sites' }]

const StyledBadge = styled(Badge)(({ theme }: { theme: any }) => ({
  '& .MuiBadge-badge': {
    borderRadius: '20%'
  }
}))

interface MealGroupReportDrawerProps {
  open: boolean
  setOpen: (open: boolean) => void
  onApplyFilter: (siteId: any) => void
  sites: any[]
  selectedSiteId: any
  setSelectedSiteId: (siteId: any) => void
}

const MealGroupReportDrawer: React.FC<MealGroupReportDrawerProps> = ({ open, setOpen, onApplyFilter, sites, selectedSiteId, setSelectedSiteId }) => {
  const theme = useTheme()
  const { t } = useTranslation()
  const [selectedMenu, setSelectedMenu] = useState<any>(leftMenu[0])
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const handleCloseDrawer = () => {
    setOpen(false)
  }

  const handleMenuClick = (menu: any) => {
    setSelectedMenu(menu)
    setSearchQuery('')
  }

  const getMenuBadgeCount = (menuName: string) => (selectedSiteId ? 1 : 0)

  const handleClearAll = () => {
    setSelectedSiteId(null)
  }

  const handleSearch = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
  }, [])

  const handleSiteSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedSiteId(event.target.value)
  }

  const applyFilters = () => {
    onApplyFilter(selectedSiteId)
    setOpen(false)
  }

  const filteredSitesList = sites?.filter(site => site.site_name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <>
      <Drawer
        anchor='right'
        open={open}
        sx={{
          '& .MuiDrawer-paper': { width: ['100%', '562px'], height: '100vh' },
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          backgroundColor: 'background.default'
        }}
      >
        <Box
          className='sidebar-header'
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'background.default',
            p: (theme: any) => theme.spacing(3, 3.255, 3, 5.255)
          }}
        >
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
            <Icon icon='mage:filter' fontSize={30} />
            <Typography sx={{ fontSize: '24px', fontWeight: 500 }}>{t('filter')}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <IconButton size='small' sx={{ color: 'text.primary' }} onClick={handleCloseDrawer}>
              <Icon icon='mdi:close' fontSize={24} />
            </IconButton>
          </Box>
        </Box>
        <Box
          sx={{
            '& .MuiDrawer-paper': { width: ['100%', '562px'] },
            backgroundColor: 'background.default',
            height: '100%'
          }}
        >
          <Grid container sx={{ px: 5 }}>
            <Grid size={{ md: 4, sm: 4, xs: 4 }}>
              {leftMenu?.map(menu => (
                <Box
                  key={menu.id}
                  sx={{
                    width: '190px',
                    bgcolor: selectedMenu?.id === menu.id ? 'white' : 'transparent',
                    cursor: 'pointer',
                    p: 4,
                    borderTopLeftRadius: '8px',
                    borderBottomLeftRadius: '8px'
                  }}
                  onClick={() => handleMenuClick(menu)}
                >
                  <Typography component='div'
                    sx={{
                      color: (theme as any).palette.primary.dark,
                      fontSize: '16px',
                      fontWeight: 400,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    {menu.name}
                    <StyledBadge badgeContent={getMenuBadgeCount(menu.name)} color='primary' sx={{ ml: 2 }} />
                  </Typography>
                </Box>
              ))}
            </Grid>
            <Grid size={{ md: 8, sm: 8, xs: 8 }}>
              {selectedMenu.name === 'Sites' ? (
                <Box
                  sx={{
                    bgcolor: '#FFFFFF',
                    borderRadius: '8px',
                    width: '345px',
                    height: 'calc(100dvh - 190px)',
                    display: 'flex',
                    flexDirection: 'column',
                    p: 0,
                    overflow: 'hidden'
                  }}
                >
                  <Box sx={{ p: '16px', bgcolor: '#FFFFFF', zIndex: 1 }}>
                    <Search value={searchQuery} onChange={handleSearch} sx={{ mb: 0 }} width={'100%'} />
                  </Box>
                  <Box
                    sx={{
                      flex: 1,
                      overflowY: 'auto',
                      px: '16px',
                      py: '8px',
                      '&::-webkit-scrollbar': { width: 0 },
                      msOverflowStyle: 'none',
                      scrollbarWidth: 'none',
                      bgcolor: '#FFFFFF'
                    }}
                  >
                    <RadioGroup value={selectedSiteId ?? ''} onChange={handleSiteSelect}>
                      {filteredSitesList?.map(site => (
                        <FormControlLabel
                          key={site.site_id}
                          value={site.site_id}
                          control={<Radio />}
                          label={
                            <Typography sx={{ fontSize: '16px', fontWeight: 400, color: '#839D8D' }}>
                              {site.site_name}
                            </Typography>
                          }
                          sx={{
                            display: 'flex',
                            flexDirection: 'row-reverse',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginY: 1,
                            width: '100%'
                          }}
                          labelPlacement='start'
                        />
                      ))}
                    </RadioGroup>
                  </Box>
                </Box>
              ) : (
                ''
              )}
            </Grid>
          </Grid>
        </Box>
        <Box
          sx={{
            height: '122px',
            width: '100%',
            maxWidth: '562px',
            position: 'fixed',
            bottom: 0,
            px: 4,
            bgcolor: 'white',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            display: 'flex',
            boxShadow: '0px -4px 10px rgba(0, 0, 0, 0.2)',
            zIndex: 123
          }}
        >
          <LoadingButton fullWidth variant='outlined' size='large' onClick={handleClearAll}>
            {t('clear_all')}
          </LoadingButton>
          <LoadingButton fullWidth variant='contained' size='large' onClick={applyFilters} disabled={isSubmitting}>
            {t('apply_filter')}
          </LoadingButton>
        </Box>
      </Drawer>
    </>
  )
}

export default MealGroupReportDrawer
