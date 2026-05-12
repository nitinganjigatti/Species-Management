import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
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

import Icon from 'src/@core/components/icon'
import SingleSelectSectionList from './SingleSelectSectionList'
// import SingleSelectEnclosureList from './SingleSelectEnclosureList'
import SelectEnclosureList from 'src/components/diet/SelectEnclosureList'
import SelectSites from 'src/components/report/SelectSite'
import { useTranslation } from 'react-i18next'

interface SiteRecord {
  site_id: string | number
  site_name: string
  [key: string]: unknown
}

interface SectionRecord {
  section_id: string | number
  section_name: string
  [key: string]: unknown
}

interface EnclosureRecord {
  enclosure_id: string | number
  user_enclosure_name?: string
  [key: string]: unknown
}

interface TempSelectedItems {
  Site: (string | number)[]
  Section: (string | number)[]
  Enclosure: (string | number)[]
  reportType?: string
  accession_start?: string
  accession_end?: string
  [key: string]: unknown
}

interface SiteDrawerProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  openFilterDrawer: boolean
  setOpenFilterDrawer: (open: boolean) => void
  tabsForfilter: string[]
  activeTab: string
  setActiveTab: (tab: string) => void
  setFilterCount: (count: number) => void
  openSiteListDrawer: boolean
  setSiteListDrawer: (open: boolean) => void
  selectedSections: (string | number)[]
  setSelectedSections: (sections: (string | number)[] | ((prev: (string | number)[]) => (string | number)[])) => void
  siteData: SiteRecord[]
  selectedItems: TempSelectedItems
  setSelectedItems: (items: TempSelectedItems) => void
  tempSelectedItems: TempSelectedItems
  setTempSelectedItems: (items: TempSelectedItems | ((prev: TempSelectedItems) => TempSelectedItems)) => void
  sectionsData: SectionRecord[]
  setSectionsData: (data: SectionRecord[] | ((prev: SectionRecord[]) => SectionRecord[])) => void
  selectedEnclosures: (string | number)[]
  setSelectedEnclosures: (
    enclosures: (string | number)[] | ((prev: (string | number)[]) => (string | number)[])
  ) => void
  enclosuresData: EnclosureRecord[]
  setEnclosuresData: (data: EnclosureRecord[] | ((prev: EnclosureRecord[]) => EnclosureRecord[])) => void
}

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
  setSectionsData,
  selectedEnclosures,
  setSelectedEnclosures,
  enclosuresData,
  setEnclosuresData
}: SiteDrawerProps) => {
  const { t } = useTranslation()
  const theme = useTheme()

  const reportTypeArray = [
    { name: t('compliance_module.individual_animal_wise'), key: 'individual' },
    { name: t('compliance_module.species_wise'), key: 'species' }
  ]

  const [collapsed, setCollapsed] = useState<boolean>(true)

  const [openSectionListDrawer, setOpenSectionListDrawer] = useState<boolean>(false)
  const [openEnclosureListDrawer, setOpenEnclosureListDrawer] = useState<boolean>(false)

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

  const handleRemove = (siteId: string | number) => {
    setTempSelectedItems((prev: TempSelectedItems) => {
      const updatedSites = prev.Site.filter(id => id !== siteId)
      return {
        ...prev,
        Site: updatedSites,
        Section: [],
        Enclosure: []
      }
    })

    setSectionsData([])
    if (setSelectedSections) {
      setSelectedSections([])
    }
    if (setSelectedEnclosures) {
      setSelectedEnclosures([])
    }
    if (setEnclosuresData) {
      setEnclosuresData([])
    }
  }

  const handleRemoveSection = (sectionId: string | number) => {
    setTempSelectedItems((prev: TempSelectedItems) => {
      const filteredSections = prev.Section.filter(id => id !== sectionId)
      return {
        ...prev,
        Section: filteredSections,
        Enclosure: []
      }
    })

    setSectionsData(prev => prev.filter(section => section.section_id !== sectionId.toString()))

    // Also update selectedSections state
    if (setSelectedSections) {
      setSelectedSections(prev => prev.filter(id => id !== sectionId))
    }

    if (setSelectedEnclosures) {
      setSelectedEnclosures([])
    }
    if (setEnclosuresData) {
      setEnclosuresData([])
    }
  }

  const handleRemoveEnclosure = (enclosureId: string | number) => {
    setTempSelectedItems((prev: TempSelectedItems) => ({
      ...prev,
      Enclosure: (prev.Enclosure || []).filter(id => id !== enclosureId)
    }))

    if (setSelectedEnclosures) {
      setSelectedEnclosures(prev => prev.filter(id => id !== enclosureId))
    }
  }

  const handleReportTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (activeTab === 'Report Type') {
      setTempSelectedItems((prev: TempSelectedItems) => ({
        ...prev,
        reportType: event.target.value
      }))
    }
  }

  const handleCancelAll = () => {
    setTempSelectedItems({
      Site: [],
      Section: [],
      Enclosure: [],
      reportType: ''
    })
    setSelectedItems({
      Site: [],
      Section: [],
      Enclosure: [],
      reportType: ''
    })
    setFilterCount(0)
    setOpenFilterDrawer(false)
    if (setSelectedEnclosures) {
      setSelectedEnclosures([])
    }
    if (setEnclosuresData) {
      setEnclosuresData([])
    }
  }

  const handleCloseDrawer = () => {
    setTempSelectedItems({
      Site: [],
      Section: [],
      Enclosure: [],
      reportType: ''
    })
    setOpenFilterDrawer(false)
  }

  useEffect(() => {
    setActiveTab('Site')
    setTempSelectedItems(selectedItems)
  }, [openFilterDrawer, selectedItems, setActiveTab, setTempSelectedItems])

  useEffect(() => {
    if (openFilterDrawer) {
      setSelectedEnclosures(tempSelectedItems?.Enclosure || [])
    }
  }, [openFilterDrawer, tempSelectedItems?.Enclosure, setSelectedEnclosures])

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
          p: (theme: import('@mui/material').Theme) => theme.spacing(3, 3.255, 3, 5.255)
        }}
      >
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
          <Icon icon='mage:filter' fontSize={30} />
          <Typography sx={{ fontSize: '24px', fontWeight: 500 }}>{t('filter')}</Typography>
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
          <Grid size={{ md: 4, sm: 4, xs: 4 }}>
            {tabsForfilter.map(menu => {
              let count = 0

              if (menu === 'Site') {
                count =
                  (tempSelectedItems?.Site?.length || 0) +
                  (tempSelectedItems?.Section?.length || 0) +
                  (tempSelectedItems?.Enclosure?.length || 0)
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

          <Grid size={{ xs: 8, sm: 8, md: 8 }}>
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
                      title={t('compliance_module.select_site')}
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
                        title={t('compliance_module.select_sections')}
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

                  {tempSelectedItems?.Section?.length === 1 && (
                    <Card
                      sx={{
                        border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                        boxShadow: 'none',
                        mt: '6%'
                      }}
                    >
                      <CardHeader
                        title={t('compliance_module.select_enclosures')}
                        onClick={() => {
                          setOpenEnclosureListDrawer(true)
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
                      {tempSelectedItems?.Enclosure?.length > 0 && (
                        <CardContent sx={{ pl: 4, pr: 4, pt: 2, pb: '4px !important' }}>
                          {tempSelectedItems.Enclosure.map(enclosureId => {
                            const enclosure = enclosuresData.find(
                              item => String(item.enclosure_id) === String(enclosureId)
                            )

                            return (
                              <Box
                                key={enclosureId}
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  mb: 2
                                }}
                              >
                                <Typography variant='body2' sx={{ color: theme.palette.customColors.deepDark }}>
                                  {enclosure?.user_enclosure_name || 'Enclosure'}
                                </Typography>
                                <IconButton
                                  edge='end'
                                  onClick={() => handleRemoveEnclosure(enclosureId)}
                                  sx={{ color: theme.palette.error.dark }}
                                >
                                  <Icon icon='carbon:close-outline' fontSize={20} />
                                </IconButton>
                              </Box>
                            )
                          })}
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
          {t('cancel_all')}
        </LoadingButton>
        <LoadingButton
          sx={{ flex: 1 }}
          variant='contained'
          size='large'
          onClick={handleApplyFilter}
          disabled={!canGenerate}
        >
          {t('compliance_module.generate')}
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
      <SingleSelectSectionList
        open={openSectionListDrawer}
        onClose={() => setOpenSectionListDrawer(false)}
        siteId={tempSelectedItems?.Site?.[0]} // Pass the single selected site
        onSelectSections={selectedSections => {
          setTempSelectedItems((prev: TempSelectedItems) => ({
            ...prev,
            Section: selectedSections,
            Enclosure: []
          }))
          setOpenSectionListDrawer(false)
          if (setSelectedEnclosures) {
            setSelectedEnclosures([])
          }
          if (setEnclosuresData) {
            setEnclosuresData([])
          }
        }}
        setSectionsData={setSectionsData}
        sectionsData={sectionsData}
        setSelectedSections={setSelectedSections}
        selectedSections={selectedSections}
        tempSelectedItems={tempSelectedItems}
        openFilterDrawer={openFilterDrawer}
      />
      {/* <SingleSelectEnclosureList */}
      <SelectEnclosureList
        tempSelectedItems={tempSelectedItems}
        enclosuresData={enclosuresData}
        open={openEnclosureListDrawer}
        onClose={() => setOpenEnclosureListDrawer(false)}
        sectionId={tempSelectedItems?.Section?.[0]}
        onSelectEnclosures={(selectedEnclosuresList: (string | number)[]) => {
          setTempSelectedItems((prev: TempSelectedItems) => ({
            ...prev,
            Enclosure: selectedEnclosuresList
          }))
          setOpenEnclosureListDrawer(false)
        }}
        setEnclosuresData={setEnclosuresData}
        selectedEnclosures={selectedEnclosures}
        setSelectedEnclosures={setSelectedEnclosures}
        openFilterDrawer={openFilterDrawer}
      />
    </Drawer>
  )
}

export default SiteDrawer
