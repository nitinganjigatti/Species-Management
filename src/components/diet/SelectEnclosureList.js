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
  debounce,
  CardContent,
  CircularProgress
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import React, { useState, useEffect, useCallback } from 'react'
import Icon from 'src/@core/components/icon'
import { getEnclosureList } from 'src/lib/api/diet/dietList'

const SelectEnclosureList = ({
  tempSelectedItems,
  enclosuresData,
  open,
  onClose,
  sectionId,
  onSelectEnclosures,
  setEnclosuresData,
  selectedEnclosures,
  setSelectedEnclosures,
  openFilterDrawer
}) => {
  const theme = useTheme()
  const [loading, setLoading] = useState(false)
  const [pageNo, setPageNo] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(searchValue => {
      setPageNo(1)
      fetchEnclosures(searchValue)
    }, 500),
    [sectionId]
  )

  const handleSearchChange = e => {
    const value = e.target.value
    setSearchTerm(value)
    debouncedSearch(value)
  }

  useEffect(() => {
    if (open && sectionId) {
      fetchEnclosures()
    }
    if (!open && sectionId && openFilterDrawer) {
      fetchEnclosures()
    }
  }, [open, sectionId, openFilterDrawer, pageNo])

  const handleSiteCheckboxChange = enclosureId => {
    setSelectedEnclosures(prev =>
      prev.includes(enclosureId) ? prev.filter(id => id !== enclosureId) : [...prev, enclosureId]
    )
  }

  useEffect(() => {
    if (open && tempSelectedItems?.Enclosure) {
      setSelectedEnclosures(tempSelectedItems.Enclosure)
    }
  }, [open])

  const fetchEnclosures = async (searchQuery = searchTerm) => {
    if (!sectionId) return
    setLoading(true)
    try {
      const params = {
        section_id: sectionId,
        page_no: pageNo,
        limit: 15,
        q: searchQuery
      }
      const response = await getEnclosureList(params)
      const newEnclosures = response.data?.result || []
      setTotalCount(response.data?.total_count || 0)

      setEnclosuresData(prev => (pageNo === 1 ? newEnclosures : [...prev, ...newEnclosures]))
      setHasMore(newEnclosures.length > 0)
    } catch (error) {
      console.error('Error fetching enclosures:', error)
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
      enclosuresData.length < totalCount
    ) {
      setPageNo(prev => prev + 1)
    }
  }

  const handleSelectAllSites = () => {
    if (selectedEnclosures.length === enclosuresData.length) {
      setSelectedEnclosures([])
    } else {
      setSelectedEnclosures(enclosuresData.map(e => e.enclosure_id))
    }
  }

  return (
    <Drawer
      anchor='right'
      open={open}
      //onClose={onClose}
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
              Choose Enclosure
            </Typography>
            <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
              Select a enclosure from the list below
            </Typography>
          </Box>
          <IconButton size='small' sx={{ color: 'text.primary' }} onClick={onClose}>
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
                        fetchEnclosures('')
                      }}
                    >
                      <Icon icon='mdi:close' fontSize={20} />
                    </IconButton>
                  </InputAdornment>
                ),
                style: {
                  background: theme.palette.customColors.Background,
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
            {loading ? '' : `Selected ${selectedEnclosures.length}/${enclosuresData.length}`}
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
                  selectedEnclosures.length === enclosuresData.length && enclosuresData.length > 0
                    ? theme.palette.primary.main
                    : theme.palette.customColors.OnSurfaceVariant,
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
              checked={selectedEnclosures.length === enclosuresData.length && enclosuresData.length > 0}
              indeterminate={selectedEnclosures.length > 0 && selectedEnclosures.length < enclosuresData.length}
              onChange={handleSelectAllSites}
              inputProps={{ 'aria-label': 'Select all species' }}
              sx={{
                '&.Mui-checked': {
                  color: theme.palette.primary.main
                },
                '& .MuiSvgIcon-root': {
                  width: '19px',
                  height: '19px',
                  border: '2px dotted',
                  borderColor:
                    selectedEnclosures.length === enclosuresData.length && enclosuresData.length > 0
                      ? theme.palette.primary.main
                      : theme.palette.customColors.OnSurfaceVariant,
                  color:
                    selectedEnclosures.length === enclosuresData.length && enclosuresData.length > 0
                      ? theme.palette.primary.main
                      : theme.palette.customColors.OnSurfaceVariant
                },
                mr: 1
              }}
            />
          </Box>
        </Box>

        {/* Enclosures List */}
        <Box
          className=''
          sx={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',

            //height: '60%',
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
            enclosuresData.length > 0 ? (
              enclosuresData.map(enclosure => (
                <ListItem
                  key={enclosure.enclosure_id}
                  sx={{
                    pr: 1.5,
                    pl: 3,
                    mb: 4,
                    height: '70px',
                    border: '1px solid',
                    borderColor: selectedEnclosures?.includes(enclosure.enclosure_id)
                      ? '#80E0A3'
                      : theme.palette.customColors.OutlineVariant,
                    borderRadius: '8px',
                    bgcolor: selectedEnclosures?.includes(enclosure.enclosure_id)
                      ? theme.palette.customColors.OnBackground
                      : 'transparent'
                  }}
                >
                  <ListItemAvatar>
                    <Avatar src={enclosure.image || '/default-site.jpg'} variant='rounded' />
                  </ListItemAvatar>
                  <ListItemText
                    primary={enclosure.user_enclosure_name}
                    //secondary={enclosure.location || '-'}
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
                    checked={selectedEnclosures?.includes(enclosure.enclosure_id)}
                    onChange={() => handleSiteCheckboxChange(enclosure.enclosure_id)}
                  />
                </ListItem>
              ))
            ) : (
              <Typography sx={{ textAlign: 'center', mt: 15 }}>No Enclosure's found</Typography>
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
            onClick={() => onSelectEnclosures(selectedEnclosures)}
            disabled={selectedEnclosures.length <= 0}
          >
            CONTINUE
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

export default SelectEnclosureList
