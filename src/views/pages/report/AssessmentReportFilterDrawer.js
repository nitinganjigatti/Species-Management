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
  Typography
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { LoadingButton } from '@mui/lab'
import dayjs from 'dayjs'

import Icon from 'src/@core/components/icon'
import SelectSectionList from 'src/components/diet/SelectSectionList'
import SelectEnclosureList from 'src/components/diet/SelectEnclosureList'
import SelectSites from 'src/components/report/SelectSite'

const genderArray = [
  { name: 'Male', key: 'male' },
  { name: 'Female', key: 'female' },
  { name: 'Undetermined', key: 'undetermined' },
  { name: 'Indeterminate', key: 'indeterminate' }
]

const accessionDateOptions = [
  { label: 'Today', getRange: () => ({ start: dayjs(), end: dayjs() }) },
  {
    label: 'Yesterday',
    getRange: () => {
      const yesterday = dayjs().subtract(1, 'day')

      return { start: yesterday, end: yesterday }
    }
  },
  { label: 'Last 7 Days', getRange: () => ({ start: dayjs().subtract(6, 'day'), end: dayjs() }) },
  { label: 'Last 1 Month', getRange: () => ({ start: dayjs().subtract(1, 'month').startOf('day'), end: dayjs() }) },
  { label: 'Last 6 Months', getRange: () => ({ start: dayjs().subtract(6, 'month').startOf('day'), end: dayjs() }) },
  { label: 'All Time Data', getRange: () => ({ start: '', end: '' }) }
]

const AssessmentReportFilterDrawer = ({
  searchTerm,
  setSearchTerm,

  ///////////////
  openFilterDrawer,
  setOpenFilterDrawer,
  tabsforfilter,
  activeTab,
  setActiveTab,
  setFilterCount,
  openSiteListDrawer,
  setSiteListDrawer,
  selectedSections,
  setSelectedSections,
  selectedEnclosures,
  setSelectedEnclosures,
  siteData,
  selectedItems,
  setSelectedItems,
  tempSelectedItems,
  setTempSelectedItems,
  sectionsData,
  setSectionsData,
  enclosuresData,
  setEnclosuresData
}) => {
  const theme = useTheme()

  const [collapsed, setCollapsed] = useState(true)

  const [openSectionListDrawer, setOpenSectionListDrawer] = useState(false)
  const [openEnclosureListDrawer, setOpenEnclosureListDrawer] = useState(false)

  const handleApplyFilter = () => {
    // console.log('tempSelectedItems', tempSelectedItems)
    setSelectedItems({ ...tempSelectedItems })
    calculateFilterCount()
    setOpenFilterDrawer(false)
  }

  // const calculateFilterCount = () => {
  //   let count = 0

  //   Object.entries(tempSelectedItems).forEach(([key, value]) => {
  //     if (Array.isArray(value)) {
  //       count += value.length // For Site, Section, Enclosure, gender
  //     } else if (typeof value === 'string' && value.trim() !== '') {
  //       count += 1 // For accession_start and accession_end (non-empty strings)
  //       // it will increase count by 2 in selection of 1 because on onchange is handling 2 keys
  //     }
  //   })

  //   setFilterCount(count)
  // }
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

    // Accession Date: Count only once if either start or end is selected
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

  const handleRemoveEnclosure = enclosureId => {
    setTempSelectedItems(prev => ({
      ...prev,
      Enclosure: prev.Enclosure.filter(id => id !== enclosureId)
    }))

    setEnclosuresData(prev => prev.filter(enclosure => enclosure.enclosure_id !== enclosureId.toString()))

    // Also update selectedSections state
    if (setSelectedEnclosures) {
      setSelectedEnclosures(prev => prev.filter(id => id !== enclosureId))
    }
  }

  const handleGenderCheckboxChange = (key, name) => {
    if (activeTab === 'Gender') {
      setTempSelectedItems(prev => {
        const alreadySelected = prev.gender.includes(key)
        const updatedGender = alreadySelected ? prev.gender.filter(item => item !== key) : [...prev.gender, key]

        return { ...prev, gender: updatedGender }
      })
    }
  }
  const selectAllGender = genderArray.every(item => tempSelectedItems.gender.includes(item.key))

  const handleSelectAllGender = () => {
    if (activeTab === 'Gender') {
      setTempSelectedItems(prev => {
        const allKeys = genderArray.map(item => item.key)
        const isAllSelected = allKeys.every(key => prev.gender.includes(key))

        return {
          ...prev,
          gender: isAllSelected ? [] : allKeys
        }
      })
    }
  }

  // Clear all data in tempSelectedItems & selectedItems
  const handleCancelAll = () => {
    setTempSelectedItems({
      Site: [],
      Section: [],
      Enclosure: [],
      gender: [],
      accession_start: null,
      accession_end: null
    })
    setSelectedItems({ Site: [], Section: [], Enclosure: [], gender: [], accession_start: null, accession_end: null })
    setFilterCount(0)
    setOpenFilterDrawer(false)
  }

  const handleCloseDrawer = () => {
    setTempSelectedItems({
      Site: [],
      Section: [],
      Enclosure: [],
      gender: [],
      accession_start: null,
      accession_end: null
    })
    setOpenFilterDrawer(false)
  }

  useEffect(() => {
    setActiveTab('Site, Sec or Encl.')
    setTempSelectedItems(selectedItems)
  }, [openFilterDrawer])

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
          <Grid item md={4} sm={4} xs={4}>
            {tabsforfilter.map(menu => {
              let count = 0

              if (menu === 'Site, Sec or Encl.') {
                count =
                  (tempSelectedItems?.Site?.length || 0) +
                  (tempSelectedItems?.Section?.length || 0) +
                  (tempSelectedItems?.Enclosure?.length || 0)
              } else if (menu === 'Gender') {
                count = tempSelectedItems?.gender?.length || 0
              } else if (menu === 'Accession Date') {
                if (
                  (tempSelectedItems?.accession_start && tempSelectedItems?.accession_start.trim() !== '') ||
                  (tempSelectedItems?.accession_end && tempSelectedItems?.accession_end.trim() !== '')
                ) {
                  count = 1 // Show just "1" if date filter is applied
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
          <Grid item md={8} sm={8} xs={8}>
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
              {activeTab === 'Site, Sec or Encl.' && (
                <>
                  <Card sx={{ border: `1px solid ${theme.palette.customColors.OutlineVariant}`, boxShadow: 'none' }}>
                    <CardHeader
                      title='Select Site'
                      onClick={() => {
                        if (tempSelectedItems?.Section?.length === 0) {
                          setSiteListDrawer(true)
                        }
                      }}
                      disabled={tempSelectedItems?.Section?.length > 0}
                      sx={{
                        background:
                          tempSelectedItems?.Section?.length > 0
                            ? theme.palette.customColors.mdAntzNeutral
                            : theme.palette.customColors.tableHeaderBg,
                        p: 2,
                        pl: 4,
                        pr: 2,
                        '.MuiCardHeader-title': {
                          fontWeight: '500',
                          fontSize: '16px',
                          color:
                            tempSelectedItems?.Section?.length > 0
                              ? theme.palette.customColors.OnSurfaceVariant
                              : theme.palette.primary.light,
                          cursor: tempSelectedItems?.Section?.length > 0 ? '' : 'pointer'
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
                          disabled={tempSelectedItems?.Section?.length > 0}
                        >
                          <Icon
                            fontSize={20}
                            icon={
                              tempSelectedItems?.Section?.length
                                ? 'mdi:lock'
                                : collapsed
                                ? 'mdi:chevron-down'
                                : 'mdi:chevron-up'
                            }
                          />
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
                                disabled={tempSelectedItems?.Section?.length > 0}
                              >
                                <Icon
                                  icon={sectionsData?.length > 0 ? 'carbon:close-outline' : 'carbon:close-outline'}
                                  fontSize={20}
                                />
                              </IconButton>
                            </Box>
                          ))}
                      </CardContent>
                    )}
                  </Card>

                  {/* Display selected sections */}
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
                          if (tempSelectedItems?.Enclosure?.length === 0) {
                            setOpenSectionListDrawer(true)
                          }
                        }}
                        disabled={tempSelectedItems?.Enclosure?.length > 0}
                        sx={{
                          background:
                            tempSelectedItems?.Enclosure?.length > 0
                              ? theme.palette.customColors.mdAntzNeutral
                              : theme.palette.customColors.tableHeaderBg,
                          p: 2,
                          pl: 4,
                          pr: 2,
                          '.MuiCardHeader-title': {
                            fontWeight: '500',
                            fontSize: '16px',
                            color:
                              tempSelectedItems?.Enclosure?.length > 0
                                ? theme.palette.customColors.OnSurfaceVariant
                                : theme.palette.primary.light,
                            cursor: tempSelectedItems?.Enclosure?.length > 0 ? '' : 'pointer'
                          }
                        }}
                        action={
                          <IconButton
                            size='small'
                            aria-label='collapse'
                            sx={{ color: theme.palette.customColors.OnSurfaceVariant }}
                            disabled={tempSelectedItems?.Enclosure?.length > 0}
                          >
                            <Icon
                              fontSize={20}
                              icon={
                                tempSelectedItems?.Enclosure?.length
                                  ? 'mdi:lock'
                                  : collapsed
                                  ? 'mdi:chevron-down'
                                  : 'mdi:chevron-up'
                              }
                            />
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
                                    disabled={tempSelectedItems?.Enclosure?.length > 0}
                                  >
                                    <Icon
                                      icon={
                                        enclosuresData?.length > 0 ? 'carbon:close-outline' : 'carbon:close-outline'
                                      }
                                      fontSize={20}
                                    />
                                  </IconButton>
                                </Box>
                              ))}
                          </CardContent>
                        )}
                    </Card>
                  )}

                  {/* Display selected enclosures */}
                  {tempSelectedItems?.Section?.length === 1 && (
                    <Card
                      sx={{
                        border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                        boxShadow: 'none',
                        mt: '6%',
                        mb: 4
                      }}
                    >
                      <CardHeader
                        title='Select Enclosures'
                        onClick={() => setOpenEnclosureListDrawer(true)}
                        sx={{
                          background: theme.palette.customColors.tableHeaderBg,
                          p: 2,
                          pl: 4,
                          pr: 2,
                          '.MuiCardHeader-title': {
                            fontWeight: '500',
                            fontSize: '16px',
                            color:
                              tempSelectedItems?.Section?.length > 0
                                ? theme.palette.customColors.OnSurfaceVariant
                                : theme.palette.primary.light,
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
                      {tempSelectedItems?.Enclosure?.length > 0 &&
                        enclosuresData?.filter(enclosure =>
                          tempSelectedItems?.Enclosure?.includes(enclosure.enclosure_id)
                        )?.length > 0 && (
                          <CardContent sx={{ pl: 4, pr: 4, pt: 2, pb: '4px !important' }}>
                            {enclosuresData
                              .filter(enclosure => tempSelectedItems?.Enclosure?.includes(enclosure.enclosure_id))
                              .map(enclosure => (
                                <Box
                                  key={enclosure.enclosure_id}
                                  sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    mb: 2
                                  }}
                                >
                                  <Typography variant='body2' sx={{ color: theme.palette.customColors.deepDark }}>
                                    {enclosure.user_enclosure_name}
                                  </Typography>
                                  <IconButton
                                    edge='end'
                                    onClick={() => handleRemoveEnclosure(enclosure.enclosure_id)}
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

              {activeTab === 'Accession Date' && (
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  {accessionDateOptions.map(option => {
                    const isSelected =
                      option.label === 'All Time Data'
                        ? tempSelectedItems.accession_start === '' && tempSelectedItems.accession_end === ''
                        : dayjs(tempSelectedItems.accession_start).format('YYYY-MM-DD') ===
                            dayjs(option.getRange().start).format('YYYY-MM-DD') &&
                          dayjs(tempSelectedItems.accession_end).format('YYYY-MM-DD') ===
                            dayjs(option.getRange().end).format('YYYY-MM-DD')

                    return (
                      <Box
                        key={option.label}
                        sx={{ display: 'flex', alignItems: 'center', mb: 3 }}
                        onClick={() => {
                          const { start, end } = option.getRange()
                          setTempSelectedItems(prev => ({
                            ...prev,
                            accession_start: start ? dayjs(start).format('YYYY-MM-DD') : '',
                            accession_end: end ? dayjs(end).format('YYYY-MM-DD') : ''
                          }))
                        }}
                      >
                        <Checkbox
                          checked={isSelected}
                          onChange={() => {
                            const { start, end } = option.getRange()
                            setTempSelectedItems(prev => ({
                              ...prev,
                              accession_start: start ? dayjs(start).format('YYYY-MM-DD') : '',
                              accession_end: end ? dayjs(end).format('YYYY-MM-DD') : ''
                            }))
                          }}
                        />
                        <Box>
                          <Typography sx={{ fontSize: '16px', fontWeight: 500 }}>{option.label}</Typography>
                          {/* {option.label === 'All Time Data' ? (
                            <Typography sx={{ fontSize: '13px', color: '#77838f' }}>
                              Upto - {dayjs().format('DD MMM YYYY')}
                            </Typography>
                          ) : (
                            <Typography sx={{ fontSize: '13px', color: '#77838f' }}>
                              {option.getRange().start && option.getRange().end
                                ? `${dayjs(option.getRange().start).format('DD MMM YYYY')} - ${dayjs(
                                    option.getRange().end
                                  ).format('DD MMM YYYY')}`
                                : 'All time'}
                            </Typography>
                          )} */}
                        </Box>
                      </Box>
                    )
                  })}
                </Box>
              )}

              {/* Display Gender Options */}
              {activeTab === 'Gender' && (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Checkbox
                      checked={selectAllGender}
                      onChange={handleSelectAllGender}
                      inputProps={{ 'aria-label': 'controlled' }}
                    />
                    <Typography sx={{ fontSize: '16px', fontWeight: 400, color: theme.palette.customColors.Outline }}>
                      Select All
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 3 }} />

                  {genderArray.map((option, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Checkbox
                        checked={tempSelectedItems.gender.includes(option.key)}
                        onChange={() => handleGenderCheckboxChange(option.key, option.name)}
                        inputProps={{ 'aria-label': 'controlled' }}
                      />
                      <Typography sx={{ fontSize: '16px', fontWeight: 400, color: theme.palette.customColors.Outline }}>
                        {option.name}
                      </Typography>
                    </Box>
                  ))}
                </>
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
        <LoadingButton
          fullWidth
          variant='outlined'
          size='large'
          onClick={() => {
            handleCancelAll()
          }}
        >
          CANCEL ALL
        </LoadingButton>
        <LoadingButton fullWidth variant='contained' size='large' onClick={handleApplyFilter}>
          APPLY FILTER
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

      <SelectEnclosureList
        open={openEnclosureListDrawer}
        onClose={() => setOpenEnclosureListDrawer(false)}
        sectionId={tempSelectedItems?.Section?.[0]} // Pass the single selected section
        onSelectEnclosures={selectedEnclosures => {
          setTempSelectedItems(prev => ({
            ...prev,
            Enclosure: selectedEnclosures
          }))
          setOpenEnclosureListDrawer(false)
        }}
        enclosuresData={enclosuresData}
        setEnclosuresData={setEnclosuresData}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        setSelectedEnclosures={setSelectedEnclosures}
        selectedEnclosures={selectedEnclosures}
        tempSelectedItems={tempSelectedItems}
        openFilterDrawer={openFilterDrawer}
      />
    </Drawer>
  )
}

export default AssessmentReportFilterDrawer

// useEffect(() => {
//   if (authData?.userData?.user?.zoos[0]?.sites.length > 0) {
//     setSiteList(authData?.userData?.user?.zoos[0].sites)
//   }
// }, [])
// {
/* {activeTab === 'Taxonomy' && (
                <>
                  <>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                        borderRadius: '4px',
                        padding: '0 8px',
                        height: '40px',
                        mb: 4
                      }}
                    >
                      <Icon icon='mi:search' />
                      <TextField
                        variant='outlined'
                        placeholder='Search'
                        value={activeTab === 'Taxonomy' ? taxonomySearchQuery : searchQuery}
                        onChange={handleSearch}
                        InputProps={{
                          disableUnderline: false,
                          endAdornment: (activeTab === 'Taxonomy' ? taxonomySearchQuery : searchQuery) && (
                            <IconButton size='small' onClick={handlesearchClose} sx={{ left: '35px' }}>
                              <Icon icon='mdi:close' fontSize={20} />
                            </IconButton>
                          )
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            border: 'none',
                            padding: '0',
                            '& fieldset': {
                              border: 'none'
                            }
                          }
                        }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <div style={{ display: 'flex', alignItems: 'center', width: '100%', paddingBottom: '8px' }}>
                        {activeTab === 'Taxonomy' ? (
                          <Checkbox
                            checked={selectedTaxonomyIds.length === taxonomyList.length && taxonomyList.length > 0}
                            indeterminate={
                              selectedTaxonomyIds.length > 0 && selectedTaxonomyIds.length < taxonomyList.length
                            }
                            onChange={handleSelectAll}
                          />
                        ) : (
                          <Checkbox
                            checked={tempSelectedItems[activeTab].length === items[activeTab].length}
                            onChange={handleSelectAll}
                          />
                        )}
                        <span>Select All</span>
                      </div>
                    </Box>
                    <Divider sx={{ mb: 0 }} />
                  </>
                  <Box
                    sx={{
                      mt: 2,
                      width: '100%',
                      '& .MuiDrawer-paper': { width: ['100%', '562px'] },
                      overflowY: 'auto',
                      height: '100%'
                    }}
                    onScroll={handleScrollforTaxonomy}
                  >
                    <Box sx={{ mb: 3, width: '100%' }}>
                      <Box sx={{ maxHeight: 600, mt: 1, width: '100%' }}>
                        {filteredTaxonomyList?.length > 0 ? (
                          filteredTaxonomyList.map(item => {
                            const itemName = item.complete_name
                            const itemId = item.tsn_id
                            return (
                              <div
                                key={itemId}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  width: '100%',
                                  paddingBottom: '8px'
                                }}
                              >
                                <Checkbox
                                  checked={selectedTaxonomyIds.includes(itemId)}
                                  onChange={() => handleTaxonomyCheckboxChange(itemId)}
                                />
                                <span>{itemName}</span>
                              </div>
                            )
                          })
                        ) : (
                          <Typography sx={{ textAlign: 'center', mt: 10 }}>No Taxonomy found</Typography>
                        )}
                      </Box>
                      {taxonomyLoading && (
                        <Box sx={{ textAlign: 'center' }}>
                          {' '}
                          <CircularProgress />
                        </Box>
                      )}
                    </Box>
                  </Box>
                </>
              )} */
// }

// const handleSearch = event => {
//   const value = event.target.value

//   setSearchQuery(value)
//   debouncedSearch(value)
// }

// const handlesearchClose = () => {
//   setSearchQuery('')
//   // setPageNo(1)
//   // setspeciesData([])
//   refreshSpeciesData('')
//   // }
// }
