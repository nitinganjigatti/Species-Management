import { useTheme } from '@emotion/react'
import {
  Button,
  CardContent,
  Checkbox,
  CircularProgress,
  Drawer,
  IconButton,
  InputAdornment,
  ListItem,
  ListItemText,
  TextField,
  Typography
} from '@mui/material'
import { Box } from '@mui/system'
import React, { useCallback, useEffect, useState } from 'react'
import Icon from 'src/@core/components/icon'
import SearchIcon from '@mui/icons-material/Search'
import { debounce } from 'lodash'
import { getShelvesList } from 'src/lib/api/pharmacy/getStockItem'

const SelectShelfListDrawer = ({
  open,
  onClose,
  rackId,
  onSelectShelves,
  shelvesData,
  setShelvesData,
  tempSelectedItems,
  selectedShelves,
  setSelectedShelves,
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
      fetchShelves(searchValue)
    }, 500),
    [rackId]
  )

  const handleSearchChange = e => {
    const value = e.target.value
    setSearchTerm(value)
    debouncedSearch(value)
  }

  const handleShelfCheckboxChange = rackId => {
    setSelectedShelves(prev => (prev.includes(rackId) ? prev.filter(id => id !== rackId) : [...prev, rackId]))
  }

  const handleSelectAllShelves = () => {
    if (selectedShelves.length === shelvesData.length) {
      setSelectedShelves([])
    } else {
      setSelectedShelves(shelvesData.map(s => s.shelf_id))
    }
  }

  useEffect(() => {
    if (open && rackId) {
      fetchShelves()
    }
    if (!open && rackId && openFilterDrawer) {
      fetchShelves()
    }
  }, [open, rackId, openFilterDrawer, pageNo])

  useEffect(() => {
    if (open && tempSelectedItems?.Shelves) {
      setSelectedShelves(tempSelectedItems.Shelves)
    }
  }, [open])

  const fetchShelves = async (searchQuery = searchTerm) => {
    if (!rackId) return
    setLoading(true)
    try {
      const params = {
        q: searchQuery,
        page: pageNo,
        limit: 10
      }

      const response = await getShelvesList({ id: rackId, params })
      console.log(response)
      const newShelves = response.data?.list_items || []
      setTotalCount(response.data?.total_count || 0)

      setShelvesData(prev => (pageNo === 1 ? newShelves : [...prev, ...newShelves]))
      setHasMore(newShelves.length > 0)
    } catch (error) {
      console.error('Error fetching shelves:', error)
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
      shelvesData.length < totalCount
    ) {
      setPageNo(prev => prev + 1)
    }
  }

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
          sx={{
            bgcolor: '#FFF',
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
              <Typography variant='h6' fontWeight='500' sx={{ color: '#1F515B' }}>
                Choose Shelves
              </Typography>
              <Typography variant='body2' sx={{ color: '#44544A' }}>
                Select a Shelf from the list below
              </Typography>
            </Box>
            <IconButton size='small' sx={{ color: 'text.primary' }} onClick={onClose}>
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
                      <SearchIcon sx={{ color: '#1F515B' }} />
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
                  style: { background: '#EFF5F2', borderRadius: '4px', padding: '4px 8px', color: '#1F515B' }
                }
              }}
            />
          </Box>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant='body2' sx={{ color: '#44544A' }}>
              {loading ? '' : `Selected ${selectedShelves.length}/${shelvesData.length}`}
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
                    selectedShelves.length === shelvesData.length && shelvesData.length > 0
                      ? theme.palette.primary.main
                      : '#44544A',
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'none',
                  p: 0
                }}
                onClick={handleSelectAllShelves}
              >
                Select all
              </Button>

              <Checkbox
                checked={selectedShelves.length === shelvesData.length && shelvesData.length > 0}
                indeterminate={selectedShelves.length > 0 && selectedShelves.length < shelvesData.length}
                onChange={handleSelectAllShelves}
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
                      selectedShelves.length === shelvesData.length && shelvesData.length > 0
                        ? theme.palette.primary.main
                        : '#44544A',
                    color:
                      selectedShelves.length === shelvesData.length && shelvesData.length > 0
                        ? theme.palette.primary.main
                        : '#44544A'
                  },
                  mr: 1
                }}
              />
            </Box>
          </Box>
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
              shelvesData.length > 0 ? (
                shelvesData?.map(shelf => (
                  <ListItem
                    key={shelf.id}
                    sx={{
                      pr: 1.5,
                      pl: 3,
                      mb: 4,
                      height: '70px',
                      border: '1px solid',
                      borderColor: selectedShelves.includes(shelf.id) ? '#80E0A3' : '#C3CEC7',
                      borderRadius: '8px',
                      bgcolor: selectedShelves.includes(shelf.id) ? '#E1F9ED' : 'transparent'
                    }}
                  >
                    <ListItemText
                      primary={shelf.name}
                      slotProps={{
                        primary: { fontWeight: 'bold', color: '#1F515B' },
                        secondary: { color: '#44544A' }
                      }} />
                    <Checkbox
                      checked={selectedShelves.includes(shelf.id)}
                      onChange={() => handleShelfCheckboxChange(shelf.id)}
                    />
                  </ListItem>
                ))
              ) : (
                <Typography sx={{ textAlign: 'center', mt: 15 }}>No Shelves found</Typography>
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
              background: '#FFF',
              zIndex: 1
            }}
          >
            <Button
              variant='contained'
              fullWidth
              sx={{ bgcolor: '#28A745', color: '#FFF', p: 2, borderRadius: '8px', '&:hover': { bgcolor: '#218838' } }}
              onClick={() => onSelectShelves(selectedShelves)}
              disabled={selectedShelves.length <= 0}
            >
              CONTINUE
            </Button>
          </Box>
        </Box>
      </Drawer>
    </>
  );
}

export default SelectShelfListDrawer
