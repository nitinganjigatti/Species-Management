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
  Radio,
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

const SingleSelectSectionList = ({
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
  const [loading, setLoading] = useState(false)
  const [pageNo, setPageNo] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const selectedSectionId = selectedSections?.[0] || null

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(searchValue => {
      setPageNo(1)
      fetchSections(searchValue)
    }, 500),
    [siteId]
  )

  const handleSearchChange = e => {
    const value = e.target.value
    setSearchTerm(value)
    debouncedSearch(value)
  }

  const handleSectionRadioChange = sectionId => {
    if (setSelectedSections) {
      setSelectedSections([sectionId])
    }
  }

  // Fetch only when the Section drawer is opened, and when pagination advances while open
  useEffect(() => {
    if (open && siteId) {
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
    if (open && tempSelectedItems?.Section?.length) {
      const firstSelected = tempSelectedItems.Section[0]
      if (setSelectedSections) {
        setSelectedSections([firstSelected])
      }
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

  const handleScroll = e => {
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
      sx={{
        '& .MuiDrawer-paper': { width: ['100%', '562px'], height: '100%' },
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        backgroundColor: 'background.default'
      }}
    >
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
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography
              variant='h6'
              sx={{
                fontWeight: '500',
                color: theme.palette.customColors.OnPrimaryContainer
              }}
            >
              Choose Section
            </Typography>
            <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
              Select a section from the list below
            </Typography>
          </Box>
          <IconButton
            size='small'
            sx={{ color: 'text.primary' }}
            onClick={() => {
              onClose?.()
              setSearchTerm('')
            }}
          >
            <Icon icon='mdi:close' fontSize={24} />
          </IconButton>
        </Box>

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

        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
            {/* {loading ? '' : `Selected ${selectedSectionId ? 1 : 0}/${sectionsData?.length}`} */}
            {loading
              ? ''
              : `${sectionsData?.length > 1 ? 'Total Sections' : 'Total Section'} : ${sectionsData?.length}`}
          </Typography>
        </Box>

        <Box
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
                .map(section => {
                  const isSelected = selectedSectionId === section.section_id
                  return (
                    <ListItem
                      key={section.section_id}
                      sx={{
                        pr: 1.5,
                        pl: 3,
                        mb: 4,
                        height: '70px',
                        border: '1px solid',
                        borderColor: isSelected ? '#80E0A3' : theme.palette.customColors.OutlineVariant,
                        borderRadius: '8px',
                        bgcolor: isSelected ? theme.palette.customColors.OnBackground : 'transparent',
                        transition: theme.transitions.create(['border-color', 'background-color'], {
                          duration: theme.transitions.duration.shortest
                        })
                      }}
                      onClick={() => handleSectionRadioChange(section.section_id)}
                    >
                      <ListItemAvatar>
                        <FallbackAvatar
                          src={section.default_icon}
                          fallback='/images/housing/site-icon-colored.svg'
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
                      />
                      <Radio
                        checked={isSelected}
                        onChange={() => handleSectionRadioChange(section.section_id)}
                        value={section.section_id}
                        sx={{
                          color: theme.palette.customColors.OnSurfaceVariant,
                          '&.Mui-checked': {
                            color: theme.palette.primary.main
                          }
                        }}
                      />
                    </ListItem>
                  )
                })
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
              onSelectSections(selectedSectionId ? [selectedSectionId] : [])
              setSearchTerm('')
              onClose?.()
            }}
            disabled={!selectedSectionId}
          >
            CONTINUE
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

export default SingleSelectSectionList
