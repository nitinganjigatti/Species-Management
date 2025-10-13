import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Divider,
  Drawer,
  Grid,
  IconButton,
  Typography,
  FormControlLabel,
  Radio,
  RadioGroup
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { LoadingButton } from '@mui/lab'
import dayjs from 'dayjs'

import Icon from 'src/@core/components/icon'
import SelectSectionList from 'src/components/diet/SelectSectionList'
import SelectSites from 'src/components/report/SelectSite'

const reportTypeArray = [
  { name: 'Individual Animal-wise', key: 'individual' },
  { name: 'Species-wise', key: 'species' }
]

const SiteDrawer = ({
  searchTerm,
  setSearchTerm,

  ///////////////
  openFilterDrawer,
  setOpenFilterDrawer,
  tabsForfilter,
  activeTab,
  setActiveTab,
  setFilterCount,
  openSiteListDrawer,
  setSiteListDrawer,
  selectedSections,
  setSelectedSections,
  siteData,
  selectedItems,
  setSelectedItems,
  tempSelectedItems,
  setTempSelectedItems,
  sectionsData,
  setSectionsData
}) => {
  const theme = useTheme()

  const [collapsed, setCollapsed] = useState(true)

  const [openSectionListDrawer, setOpenSectionListDrawer] = useState(false)

  // Site and Report Type are mandatory for generating report
  const canGenerate = (tempSelectedItems?.Site?.length || 0) > 0 && Boolean(tempSelectedItems?.reportType)

  const handleApplyFilter = () => {
    setSelectedItems({ ...tempSelectedItems })
    calculateFilterCount()
    setOpenFilterDrawer(false)
  }

  const calculateFilterCount = () => {
    let count = 0

    Object.entries(tempSelectedItems).forEach(([key, value]) => {
      if (key === 'accession_start' || key === 'accession_end') {
        // skip individual counting here
        return
      }

      if (Array.isArray(value)) {
        count += value.length
      } else if (typeof value === 'string' && value.trim() !== '') {
        count += 1
      }
    })

    if (
      (tempSelectedItems.accession_start && tempSelectedItems.accession_start.trim() !== '') ||
      (tempSelectedItems.accession_end && tempSelectedItems.accession_end.trim() !== '')
    ) {
      count += 1
    }

    setFilterCount(count)
  }

  const handleRemove = siteId => {
    setTempSelectedItems(prev => ({
      ...prev,
      Site: prev.Site.filter(id => id !== siteId)
    }))
  }

  const handleRemoveSection = sectionId => {
    setTempSelectedItems(prev => ({
      ...prev,
      Section: prev.Section.filter(id => id !== sectionId)
    }))

    setSectionsData(prev => prev.filter(section => section.section_id !== sectionId.toString()))

    // Also update selectedSections state
    if (setSelectedSections) {
      setSelectedSections(prev => prev.filter(id => id !== sectionId))
    }
  }

  const handleReportTypeChange = event => {
    if (activeTab === 'Report Type') {
      setTempSelectedItems(prev => ({
        ...prev,
        reportType: event.target.value
      }))
    }
  }

  const handleCancelAll = () => {
    setTempSelectedItems({
      Site: [],
      Section: [],
      reportType: ''
    })
    setSelectedItems({
      Site: [],
      Section: [],
      reportType: ''
    })
    setFilterCount(0)
    setOpenFilterDrawer(false)
  }

  const handleCloseDrawer = () => {
    setTempSelectedItems({
      Site: [],
      Section: [],
      reportType: ''
    })
    setOpenFilterDrawer(false)
  }

  useEffect(() => {
    setActiveTab('Site')
    setTempSelectedItems(selectedItems)
  }, [openFilterDrawer, selectedItems, setActiveTab, setTempSelectedItems])

  return (
    <Drawer
      anchor='right'
      open={openFilterDrawer}
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
          p: theme => theme.spacing(3, 3.255, 3, 5.255)
        }}
      >
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
          <Icon icon='mage:filter' fontSize={30} />
          <Typography sx={{ fontSize: '24px', fontWeight: 500 }}>Filter</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <IconButton size='small' sx={{ color: 'text.primary' }} onClick={() => handleCloseDrawer()}>
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
          <Grid item size={{ md: 4, sm: 4, xs: 4 }}>
            {tabsForfilter.map(menu => {
              let count = 0

              if (menu === 'Site') {
                count = (tempSelectedItems?.Site?.length || 0) + (tempSelectedItems?.Section?.length || 0)
              } else if (menu === 'Report Type') {
                count = tempSelectedItems?.reportType ? 1 : 0
              } else if (menu === 'Accession Date') {
                if (
                  (tempSelectedItems?.accession_start && tempSelectedItems?.accession_start.trim() !== '') ||
                  (tempSelectedItems?.accession_end && tempSelectedItems?.accession_end.trim() !== '')
                ) {
                  count = 1
                }
              }

              return (
                <Box
                  key={menu}
                  sx={{
                    width: '190px',
                    bgcolor: activeTab === menu ? 'white' : 'transparent',
                    cursor: 'pointer',
                    p: 4,
                    borderTopLeftRadius: '8px',
                    borderBottomLeftRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onClick={() => {
                    setActiveTab(menu)
                  }}
                >
                  <Typography sx={{ color: theme.palette.primary.dark, fontSize: '16px', fontWeight: 400 }}>
                    {menu}
                  </Typography>

                  {count > 0 && (
                    <Box
                      sx={{
                        backgroundColor: theme.palette.primary.main,
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 500,
                        borderRadius: '12px',
                        minWidth: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 2,
                        px: 2
                      }}
                    >
                      {count}
                    </Box>
                  )}
                </Box>
              )
            })}
          </Grid>

          <Grid item size={{ xs: 8, sm: 8, md: 8 }}>
            <Box
              sx={{
                bgcolor: theme.palette.primary.contrastText,
                p: '16px',
                borderRadius: '8px',
                width: '345px',
                height: 'calc(100vh - 185px)',
                overflowY: 'auto',
                '&::-webkit-scrollbar': {
                  width: 0,
                  height: 0
                },
                '-ms-overflow-style': 'none',
                scrollbarWidth: 'none'
              }}
            >
              {activeTab === 'Site' && (
                <>
                  <Card sx={{ border: `1px solid ${theme.palette.customColors.OutlineVariant}`, boxShadow: 'none' }}>
                    <CardHeader
                      title='Select Site'
                      onClick={() => {
                        setSiteListDrawer(true)
                      }}
                      sx={{
                        background: theme.palette.customColors.tableHeaderBg,
                        p: 2,
                        pl: 4,
                        pr: 2,
                        '.MuiCardHeader-title': {
                          fontWeight: '500',
                          fontSize: '16px',
                          color: theme.palette.primary.light,
                          cursor: 'pointer'
                        }
                      }}
                      action={
                        <IconButton
                          size='small'
                          aria-label='collapse'
                          sx={{
                            color: theme.palette.customColors.OnSurfaceVariant
                          }}
                          onClick={e => {
                            // e.stopPropagation()
                            setCollapsed(false)
                          }}
                        >
                          <Icon fontSize={20} icon={collapsed ? 'mdi:chevron-down' : 'mdi:chevron-up'} />
                        </IconButton>
                      }
                    />
                    {tempSelectedItems?.Site?.length > 0 && (
                      <CardContent sx={{ pl: 4, pr: 4, pt: 2, pb: '4px !important' }}>
                        {siteData
                          ?.filter(site => tempSelectedItems?.Site?.includes(site.site_id))
                          .map(site => (
                            <Box
                              key={site.site_id}
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 2
                              }}
                            >
                              <Typography variant='body2' sx={{ color: theme.palette.customColors.deepDark }}>
                                {site.site_name}
                              </Typography>
                              <IconButton
                                edge='end'
                                onClick={() => handleRemove(site.site_id)}
                                sx={{ color: theme.palette.error.dark }}
                              >
                                <Icon icon='carbon:close-outline' fontSize={20} />
                              </IconButton>
                            </Box>
                          ))}
                      </CardContent>
                    )}
                  </Card>

                  {tempSelectedItems?.Site?.length === 1 && (
                    <Card
                      sx={{
                        border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                        boxShadow: 'none',
                        mt: '6%'
                      }}
                    >
                      <CardHeader
                        title='Select Sections'
                        onClick={() => {
                          setOpenSectionListDrawer(true)
                        }}
                        sx={{
                          background: theme.palette.customColors.tableHeaderBg,
                          p: 2,
                          pl: 4,
                          pr: 2,
                          '.MuiCardHeader-title': {
                            fontWeight: '500',
                            fontSize: '16px',
                            color: theme.palette.primary.light,
                            cursor: 'pointer'
                          }
                        }}
                        action={
                          <IconButton
                            size='small'
                            aria-label='collapse'
                            sx={{ color: theme.palette.customColors.OnSurfaceVariant }}
                          >
                            <Icon fontSize={20} icon={collapsed ? 'mdi:chevron-down' : 'mdi:chevron-up'} />
                          </IconButton>
                        }
                      />
                      {tempSelectedItems?.Section?.length > 0 &&
                        sectionsData?.filter(section => tempSelectedItems?.Section?.includes(section.section_id))
                          ?.length > 0 && (
                          <CardContent sx={{ pl: 4, pr: 4, pt: 2, pb: '4px !important' }}>
                            {sectionsData
                              .filter(section => tempSelectedItems?.Section?.includes(section.section_id))
                              .map(section => (
                                <Box
                                  key={section.section_id}
                                  sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    mb: 2
                                  }}
                                >
                                  <Typography variant='body2' sx={{ color: theme.palette.customColors.deepDark }}>
                                    {section.section_name}
                                  </Typography>
                                  <IconButton
                                    edge='end'
                                    onClick={() => handleRemoveSection(section.section_id)}
                                    sx={{ color: theme.palette.error.dark }}
                                  >
                                    <Icon icon='carbon:close-outline' fontSize={20} />
                                  </IconButton>
                                </Box>
                              ))}
                          </CardContent>
                        )}
                    </Card>
                  )}
                </>
              )}

              {/* Display Report Type Options */}
              {activeTab === 'Report Type' && (
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <RadioGroup
                    value={tempSelectedItems.reportType || ''}
                    onChange={handleReportTypeChange}
                    sx={{ gap: 2 }}
                  >
                    {reportTypeArray.map((option, index) => (
                      <FormControlLabel
                        key={index}
                        value={option.key}
                        control={<Radio />}
                        label={
                          <Typography
                            sx={{
                              fontSize: '16px',
                              fontWeight: 400,
                              color: theme.palette.customColors.Outline,
                              mt: '9px'
                            }}
                          >
                            {option.name}
                          </Typography>
                        }
                        sx={{
                          alignItems: 'flex-start',
                          '& .MuiFormControlLabel-label': {
                            marginLeft: 1
                          }
                        }}
                      />
                    ))}
                  </RadioGroup>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* bottom buttons */}
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
        {/* <Box sx={{ flex: 1 }}>
          <Typography sx={{ width: '100%', textAlign: 'start' }}>12 result</Typography>
        </Box> */}
        <LoadingButton
          sx={{ flex: 1 }}
          // fullWidth
          variant='outlined'
          size='large'
          onClick={() => {
            handleCancelAll()
          }}
        >
          CANCEL ALL
        </LoadingButton>
        <LoadingButton
          sx={{ flex: 1 }}
          variant='contained'
          size='large'
          onClick={handleApplyFilter}
          disabled={!canGenerate}
        >
          generate
        </LoadingButton>
      </Box>

      <SelectSites
        openSiteListDrawer={openSiteListDrawer}
        setSiteListDrawer={setSiteListDrawer}
        siteData={siteData}
        setSearchTerm={setSearchTerm}
        searchTerm={searchTerm}
        tempSelectedItems={tempSelectedItems}
        setTempSelectedItems={setTempSelectedItems}
      />
      <SelectSectionList
        open={openSectionListDrawer}
        onClose={() => setOpenSectionListDrawer(false)}
        siteId={tempSelectedItems?.Site?.[0]} // Pass the single selected site
        onSelectSections={selectedSections => {
          setTempSelectedItems(prev => ({
            ...prev,
            Section: selectedSections
          }))
          setOpenSectionListDrawer(false)
        }}
        setSectionsData={setSectionsData}
        sectionsData={sectionsData}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        setSelectedSections={setSelectedSections}
        selectedSections={selectedSections}
        tempSelectedItems={tempSelectedItems}
        openFilterDrawer={openFilterDrawer}
      />
    </Drawer>
  )
}

export default SiteDrawer
