import React, { useState, useEffect, useCallback } from 'react'

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
  debounce,
  CardContent,
  CircularProgress
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import Icon from 'src/@core/components/icon'
import FallbackAvatar from 'src/views/utility/FallbackAvatar'
import { getSectionsList } from 'src/lib/api/diet/dietList'
import { useTranslation } from 'react-i18next'

interface SelectSectionListProps {
  open: boolean
  onClose: () => void
  siteId: any
  onSelectSections: (selected: any[]) => void
  setSectionsData: React.Dispatch<React.SetStateAction<any[]>>
  sectionsData: any[]
  setSelectedSections: React.Dispatch<React.SetStateAction<any[]>>
  selectedSections: any[]
  tempSelectedItems: any
  openFilterDrawer: boolean
}

const SelectSectionList: React.FC<SelectSectionListProps> = ({
  open,
  onClose,
  siteId,
  onSelectSections,
  setSectionsData,
  sectionsData,
  setSelectedSections,
  selectedSections,
  tempSelectedItems,
  openFilterDrawer
}) => {
  const theme = useTheme()
  const { t } = useTranslation()
  const [loading, setLoading] = useState<boolean>(false)
  const [pageNo, setPageNo] = useState<number>(1)
  const [totalCount, setTotalCount] = useState<number>(0)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchValue: string) => {
      setPageNo(1)
      fetchSections(searchValue)
    }, 500),
    [siteId]
  )

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    debouncedSearch(value)
  }

  const handleSiteCheckboxChange = (sectionId: any) => {
    setSelectedSections(prev => (prev.includes(sectionId) ? prev.filter(id => id !== sectionId) : [...prev, sectionId]))
  }

  const handleSelectAllSites = () => {
    if (selectedSections.length === sectionsData.length) {
      setSelectedSections([])
    } else {
      setSelectedSections(sectionsData.map(s => s.section_id))
    }
  }

  // useEffect(() => {
  //   if (open && siteId) {
  //     fetchSections()
  //   }
  //   if (!open && siteId && openFilterDrawer) {
  //     fetchSections()
  //   }
  // }, [open, siteId, openFilterDrawer, pageNo])

  // Fetch only when the Section drawer is opened, and when pagination advances while open
  useEffect(() => {
    if (open && siteId) {
      // Reset pagination and list when opening or site changes
      setPageNo(1)
      setSectionsData([])
      fetchSections()
    }
  }, [open, siteId])

  useEffect(() => {
    if (open && siteId && pageNo > 1) {
      fetchSections()
    }
  }, [pageNo])

  useEffect(() => {
    if (open && tempSelectedItems?.Section) {
      setSelectedSections(tempSelectedItems.Section)
    }
  }, [open])

  const fetchSections = async (searchQuery = searchTerm) => {
    if (!siteId) return
    setLoading(true)
    try {
      const params = {
        site_id: siteId,
        page_no: pageNo,
        limit: 15,
        q: searchQuery
      }
      const response = await getSectionsList(params)
      const newSections = response.data?.result || []
      setTotalCount(response.data?.total_count || 0)

      setSectionsData(prev => (pageNo === 1 ? newSections : [...prev, ...newSections]))
      setHasMore(newSections.length > 0)
    } catch (error) {
      console.error('Error fetching sections:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget
    const threshold = 50

    if (
      scrollHeight - (scrollTop + clientHeight) < threshold &&
      !loading &&
      hasMore &&
      sectionsData.length < totalCount
    ) {
      setPageNo(prev => prev + 1)
    }
  }

  return (
    <Drawer
      anchor='right'
      open={open}
      // onClose={onClose}
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
              {t('diet_module.choose_section')}
            </Typography>
            <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
              {t('diet_module.select_section_from_list')}
            </Typography>
          </Box>
          <IconButton
            size='small'
            sx={{ color: 'text.primary' }}
            onClick={() => {
              onClose()
              setSearchTerm('')
            }}
          >
            <Icon icon='mdi:close' fontSize={24} />
          </IconButton>
        </Box>

        {/* Search */}
        <Box sx={{ p: 2, borderBottom: '1px solid #E0E0E0' }}>
          <TextField
            fullWidth
            placeholder='Search'
            variant='outlined'
            size='small'
            value={searchTerm}
            onChange={handleSearchChange}
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
                        fetchSections('')
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

        {/* Selected Count */}
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
            {loading ? '' : `Selected ${selectedSections?.length}/${sectionsData?.length}`}
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
                  selectedSections?.length === sectionsData?.length && sectionsData?.length > 0
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
              checked={selectedSections?.length === sectionsData?.length && sectionsData?.length > 0}
              indeterminate={selectedSections?.length > 0 && selectedSections?.length < sectionsData?.length}
              onChange={handleSelectAllSites}
              slotProps={{
                root: { 'aria-label': 'Select all sections' }
              }}
              sx={{
                '&.Mui-checked': {
                  color: theme.palette.primary.main
                },
                '& .MuiSvgIcon-root': {
                  width: '19px',
                  height: '19px',
                  border: '2px dotted',
                  borderColor:
                    selectedSections?.length === sectionsData?.length && sectionsData?.length > 0
                      ? theme.palette.primary.main
                      : theme.palette.customColors.OnSurfaceVariant,
                  color:
                    selectedSections?.length === sectionsData?.length && sectionsData?.length > 0
                      ? theme.palette.primary.main
                      : theme.palette.customColors.OnSurfaceVariant
                },
                mr: 1
              }}
            />
          </Box>
        </Box>

        {/* Sections List */}
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
          onScroll={handleScroll}
        >
          {!loading ? (
            sectionsData.length > 0 ? (
              [...sectionsData]
                .sort((a, b) => a.section_name.localeCompare(b.section_name))
                .map(section => (
                  <ListItem
                    key={section.section_id}
                    sx={{
                      pr: 1.5,
                      pl: 3,
                      mb: 4,
                      height: '70px',
                      border: '1px solid',
                      borderColor: selectedSections?.includes(section.section_id)
                        ? '#80E0A3'
                        : theme.palette.customColors.OutlineVariant,
                      borderRadius: '8px',
                      bgcolor: selectedSections?.includes(section.section_id)
                        ? theme.palette.customColors.OnBackground
                        : 'transparent'
                    }}
                  >
                    <ListItemAvatar>
                      {/* <Avatar sx={{ backgroundColor: theme.palette.customColors.displaybgPrimary, p: section?.default_icon ? 0 : 2 }} src={section.default_icon || '/images/housing/site-icon-colored.svg'} variant='rounded' /> */}
                      <FallbackAvatar
                        src={section.default_icon}
                        fallback='/images/housing/section-icon-colored.png'
                        variant='rounded'
                        sx={{
                          backgroundColor: theme.palette.customColors.displaybgPrimary,
                          p: section?.default_icon ? 0 : 2,
                          height: '40px',
                          width: '40px',
                          borderRadius: '8px'
                        }}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={section?.section_name}
                      // secondary={section.location || '-'}
                      slotProps={{
                        primary: {
                          sx: {
                            fontWeight: 'bold',
                            color: theme.palette.customColors.OnPrimaryContainer
                          }
                        },
                        secondary: {
                          sx: {
                            color: theme.palette.customColors.OnSurfaceVariant
                          }
                        }
                      }}

                      // primaryTypographyProps={{
                      //   fontWeight: 'bold',
                      //   color: theme.palette.customColors.OnPrimaryContainer
                      // }}
                      // secondaryTypographyProps={{ color: theme.palette.customColors.OnSurfaceVariant }}
                    />
                    <Checkbox
                      checked={selectedSections?.includes(section.section_id)}
                      onChange={() => handleSiteCheckboxChange(section.section_id)}
                    />
                  </ListItem>
                ))
            ) : (
              <Typography sx={{ textAlign: 'center', mt: 15 }}>No Section's found</Typography>
            )
          ) : (
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 20 }}>
                <CircularProgress />
              </Box>
            </CardContent>
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
            onClick={() => {
              onSelectSections(selectedSections)
              setSearchTerm('')
              onClose?.()
            }}
            disabled={selectedSections?.length <= 0}
          >
            {t('continue')}
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

export default SelectSectionList
