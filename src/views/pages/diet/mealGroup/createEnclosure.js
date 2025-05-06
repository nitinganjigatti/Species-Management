import {
  Box,
  Button,
  Card,
  Checkbox,
  CircularProgress,
  Drawer,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  TextField,
  Typography
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@emotion/react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { AddEnclosureToExistng, getMealGroupList } from 'src/lib/api/diet/mealgroup'
import SelectedEnclosure from './selectedEnclosure'

const CreateEnclosure = ({
  enclosureDrawer,
  selectedItems,
  setSelectedItems,
  setEnclosureDrawer,
  selectedOption,
  loader,
  groupId,
  setGroupId,
  selectedForDrawer,
  fetchEnclosure,
  checkedRows,
  setStatus,
  setCheckedRows,
  fetchSiteStats,
  setEditItems,
  searchValue,
  handleEnclosureSearch
}) => {
  console.log('selected Items >>', selectedItems, checkedRows)

  const [selectedEnclosureIds, setSelectedEnclosureIds] = useState([])
  const [groupList, setGroupList] = useState([])
  const [mealGroupError, setMealGroupError] = useState(false)
  const [selectedEnclosureDrawer, setSelectedEnclosureDrawer] = useState(false)

  useEffect(() => {
    if (checkedRows) {
      setSelectedEnclosureIds(checkedRows)

      const fetchMealGroupNames = async () => {
        const groupparams = {
          site_id: selectedOption
          // page_no: paginationModel.page + 1
        }
        try {
          const response = await getMealGroupList(groupparams)
          if (response.success) {
            setGroupList(response.data.result)
          } else {
            console.error('Failed to fetch group names', response?.message || 'Unknown error')
          }
        } catch (error) {
          console.log('Error', error)
        }
      }
      fetchMealGroupNames()
    }
  }, [enclosureDrawer])

  const theme = useTheme()

  const handleGroupChange = event => {
    const value = event.target.value
    setGroupId(value) // value is string
  }

  const handleAddEnclosure = async () => {
    if (!groupId.trim()) {
      setMealGroupError(true)
      return
    }

    setMealGroupError(false)

    try {
      console.log('Selected Enclosure <>', selectedEnclosureIds, selectedOption, groupId)

      const params = {
        site_id: selectedOption,
        enclosure_ids: JSON.stringify(selectedEnclosureIds),
        meal_group_id: groupId
      }

      const response = await AddEnclosureToExistng(params)

      if (response.success) {
        toast.success('Enclosure(s) added successfully')
        setStatus('mealgroup')
        setEnclosureDrawer(false)
        setCheckedRows([])
        fetchEnclosure()
        fetchSiteStats()
      } else {
        toast.error('Something went wrong')
      }
    } catch (error) {
      console.error('Error adding enclosures:', error)
      toast.error('An unexpected error occurred')
    }
  }

  const handleSelected = () => {
    setSelectedEnclosureDrawer(true)
  }

  const RenderSidebarFooter = () => {
    return (
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          right: 0,
          width: '100%',
          maxWidth: '562px',
          // width: { xs: '100%', sm: '73%', md: '562px' },
          height: '106px',
          bgcolor: 'white',
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 2, sm: 2, md: '22px' }, // match padding
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 1300,
          gap: { xs: 2, sm: 0 }
        }}
      >
        {/* Left: Selected Dropdown */}
        <Box
          display='flex'
          alignItems='center'
          sx={{ width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'center', sm: 'flex-start' } }}
        >
          <Typography
            sx={{
              ml: { xs: 0, sm: 2 },
              color: '#37BD69',
              fontWeight: 600,
              fontSize: '16px',
              fontFamily: 'Inter'
            }}
          >
            {selectedEnclosureIds.length} Selected
          </Typography>
          <IconButton size='small' sx={{ color: '#37BD69', ml: 1 }} onClick={handleSelected}>
            <Icon icon='mdi:chevron-down' />
          </IconButton>
        </Box>

        {/* Right: Cancel + Add Buttons */}
        <Box
          display='flex'
          gap={2}
          sx={{ width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'center', sm: 'flex-end' } }}
        >
          <Button
            onClick={() => setEnclosureDrawer(false)}
            variant='outlined'
            fullWidth
            sx={{
              height: { xs: '45px', sm: '58px' },
              width: { xs: '100%', sm: '140px' },
              borderColor: '#37BD6980',
              color: '#44544ADE',
              opacity: 0.8,
              fontWeight: 500
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddEnclosure}
            variant='contained'
            fullWidth
            sx={{
              height: { xs: '45px', sm: '58px' },
              width: { xs: '100%', sm: '140px' },
              bgcolor: '#37BD69',
              fontWeight: 500
            }}
          >
            Add
          </Button>
        </Box>
      </Box>
    )
  }

  const handleCheckboxChange = id => {
    setSelectedEnclosureIds(prev => (prev.includes(id) ? prev.filter(eId => eId !== id) : [...prev, id]))
  }

  return (
    <>
      <Drawer
        anchor='right'
        open={enclosureDrawer}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': { width: '100%', maxWidth: '562px' },
          // position: 'fixed',
          position: 'relative',
          top: 0,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: theme.palette.customColors.bodyBg,
          gap: '24px'
        }}
      >
        <Box
          sx={{
            bgcolor: theme.palette.customColors.bodyBg,
            zIndex: 10,
            height: 'calc(100dvh - 10px)'
          }}
        >
          {/* Header */}
          <Box
            className='sidebar-header'
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              px: 3,
              py: 2
            }}
          >
            <Box sx={{ gap: 2, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              <img src='/icons/Activity.svg' alt='Grocery Icon' width='35px' />
              <Typography
                sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '20px', fontWeight: 500 }}
              >
                Add enclosures to group
              </Typography>
            </Box>

            <IconButton
              size='small'
              onClick={() => {
                setEnclosureDrawer(false)
                setEditItems([])
                setSelectedItems([])
              }}
              sx={{ color: theme.palette.primary.light }}
            >
              <Icon icon='mdi:close' fontSize={25} />
            </IconButton>
          </Box>

          {/* Body */}
          <Box sx={{ overflowY: 'auto' }}>
            {' '}
            {/* Outer wrapper with padding from all sides */}
            <Box sx={{ p: 4, backgroundColor: '#EEF5F1', borderRadius: '8px', mt: 3 }}>
              {/* Search */}
              <Box display='flex' gap={1} mb={6}>
                <TextField
                  placeholder='Search...'
                  variant='outlined'
                  size='small'
                  value={searchValue}
                  fullWidth
                  onChange={e => handleEnclosureSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <Icon icon='mi:search' fontSize={24} color={theme.palette.customColors.neutralSecondary} />
                      </InputAdornment>
                    ),
                    sx: {
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      height: '48px',
                      input: { color: '#839D8D', padding: '10px 0' }
                    }
                  }}
                />
              </Box>

              {/* Group Dropdown */}
              {checkedRows.length > 0 && (
                <Select
                  value={groupId}
                  error={mealGroupError}
                  onChange={handleGroupChange}
                  displayEmpty
                  renderValue={selected => {
                    if (!selected || selected === '')
                      return <Typography color='textSecondary'>Select Meal Group</Typography>
                    const selectedItem = groupList.find(item => item.id === selected)
                    return selectedItem?.group_name || ''
                  }}
                  size='small'
                  sx={{
                    backgroundColor: 'white',
                    width: '100%',
                    // maxWidth: '200px',
                    borderRadius: '4px',
                    mb: 5
                  }}
                >
                  <MenuItem value=''>
                    <Typography color='textSecondary'>Select Meal Group</Typography>
                  </MenuItem>
                  {groupList.map(item => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.group_name}
                    </MenuItem>
                  ))}
                </Select>
              )}

              {/* Card List */}
              <Box sx={{}}>
                <Card
                  sx={{
                    borderRadius: '8px',
                    boxShadow: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '70vh',
                    width: '100%'
                  }}
                >
                  <Box sx={{ flex: 1, overflowY: 'auto', height: '60vh', px: 2, pt: 2 }}>
                    {loader ? (
                      <Box
                        sx={{
                          height: '100%',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}
                      >
                        <CircularProgress size={40} />
                      </Box>
                    ) : (
                      selectedItems.map((item, index) => (
                        <Box sx={{ m: 3 }}>
                          {' '}
                          {/* Adds margin around the Card */}
                          <Card
                            key={index}
                            sx={{
                              p: 2,
                              width: '100%',
                              height: '70px',
                              borderTop: selectedEnclosureIds.includes(item?.enclosure_id) && '1px solid #C3CEC7',
                              borderLeft: selectedEnclosureIds.includes(item?.enclosure_id) && '1px solid #C3CEC7',
                              borderRight: selectedEnclosureIds.includes(item?.enclosure_id) && '1px solid #C3CEC7',
                              borderTopLeftRadius: selectedEnclosureIds.includes(item?.enclosure_id) && '8px',
                              borderTopRightRadius: selectedEnclosureIds.includes(item?.enclosure_id) && '8px',
                              borderBottom: '1px solid #C3CEC7',
                              bgcolor: selectedEnclosureIds.includes(item?.enclosure_id) ? '#F2FFF8' : 'white',
                              borderRadius: selectedEnclosureIds.includes(item?.enclosure_id) ? '8px' : '2px',
                              display: 'flex',
                              boxShadow: 'none',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <Box>
                              <Typography sx={{ fontWeight: 500, fontSize: '16px', color: '#44544A' }}>
                                {item.user_enclosure_name}
                              </Typography>
                              <Typography
                                sx={{
                                  fontWeight: 400,
                                  fontSize: '14px',
                                  color: '#44544A',
                                  maxWidth: '100px',
                                  // overflow: 'hidden',
                                  // textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {item.section_name}
                              </Typography>
                            </Box>

                            <Box
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                width: '100px',
                                alignItems: 'flex-start',
                                ml: 'auto'
                              }}
                            >
                              <Typography sx={{ fontSize: '14px', color: '#44544A' }}>
                                Species: {item.species_count}
                              </Typography>
                              <Typography sx={{ fontSize: '14px', color: '#44544A' }}>
                                Animals: {item.animal_count}
                              </Typography>
                            </Box>

                            <Checkbox
                              checked={selectedEnclosureIds.includes(item.enclosure_id)}
                              onChange={() => handleCheckboxChange(item?.enclosure_id)}
                            />
                          </Card>
                        </Box>
                      ))
                    )}
                  </Box>
                </Card>
              </Box>
            </Box>
          </Box>
        </Box>
        <RenderSidebarFooter />
      </Drawer>
      {selectedEnclosureDrawer && (
        <SelectedEnclosure
          selectedEnclosureDrawer={selectedEnclosureDrawer}
          setSelectedEnclosureDrawer={setSelectedEnclosureDrawer}
          selectEnclosures={selectedItems.filter(item => selectedEnclosureIds.includes(item.enclosure_id))}
          selectedEnclosureIds={selectedEnclosureIds}
          setSelectedEnclosureIds={setSelectedEnclosureIds}
          selectedItems={selectedItems}
          checkedRows={checkedRows}
          setSelectedItems={setSelectedItems}
          setCheckedRows={setCheckedRows}
        />
      )}
    </>
  )
}
export default CreateEnclosure
