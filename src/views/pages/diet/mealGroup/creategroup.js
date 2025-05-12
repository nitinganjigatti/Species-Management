import {
  Box,
  Button,
  Card,
  CircularProgress,
  Drawer,
  FormControl,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography
} from '@mui/material'
import { useTheme } from '@emotion/react'
import Icon from 'src/@core/components/icon'
import { LoadingButton } from '@mui/lab'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createMealGroup, getEnclosureListByGroup, updateMealGroup } from 'src/lib/api/diet/mealgroup'
import toast from 'react-hot-toast'
import { debounce } from 'lodash'
import { fontSize } from '@mui/system'
import { object } from 'yup'

const CreateMealGroup = ({
  openDrawer,
  handleCloseSideBar,
  selectedItems,
  setSelectedItems,
  checkedRows,
  setCheckedRows,
  selectedOption,
  editParam,
  editeditems,
  setEditItems,
  fetchEnclosure,
  siteStats,
  setStatus,
  editSearchValue,
  groupId,
  mealType,
  loader,
  mealId,
  handleEditSearch
}) => {
  console.log('editeditems >', editeditems, selectedItems, mealType)

  const [groupName, setGroupName] = useState(editParam?.group_name || '')
  const [groupNameError, setGroupNameError] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [removedEnclosures, setRemovedEnclosures] = useState([])

  const handleRemove = index => {
    const itemToRemove = selectedItems[index] // Get the item being removed
    const updatedItems = selectedItems.filter((_, i) => i !== index)
    const updatedChecked = checkedRows.filter(id => id !== itemToRemove.enclosure_id)

    setSelectedItems(updatedItems)
    setCheckedRows(updatedChecked) // or setSelectedCheckboxes(updatedChecked) if that's your setter
  }

  console.log('Group NMW >', groupName)

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setGroupNameError(true)
      return
    }

    setGroupNameError(false)

    try {
      const params = {
        site_id: selectedOption,
        enclosure_ids: JSON.stringify(checkedRows.map(Number)), 
        group_name: groupName
      }

      const response = await createMealGroup(params)

      if (response) {
        handleCloseSideBar()
        toast.success('Meal Group created Successfully')
        setStatus('mealgroup')
      } else {
        toast.error('Something went wrong')
      }
    } catch (error) {
      toast.error('Server error. Please try again.')
      console.error('Create Meal Group Error:', error)
    }
  }

  const debouncedSearch = useCallback(
    debounce(async q => {
      setSearchTerm(q)
      if (q.trim() === '') {
        // Search field is cleared — restore from unmapped list using checkedRows
        const data = [...selectedItems] // your original full unmapped list (store this when fetching the full list)
        const filteredData = data.filter(item => checkedRows.includes(item.id)) // adjust key if needed
        setSelectedItems(filteredData)
        return
      }

      // Perform API call for non-empty search
      try {
        const res = await getEnclosureListByGroup({
          q,
          type: 'unmapped',
          site_id: selectedOption
        })

        if (res) {
          setSelectedItems(res?.data?.result)
        }
      } catch (err) {
        console.log(err)
      }
    }, 1000),
    [selectedOption] // 👈 now includes these dependencies
  )

  const handleCreateSearch = value => {
    setSearchTerm(value)
    debouncedSearch(value)
  }

  const handleUpdateGroup = async () => {
    console.log('EditItems >', editeditems, removedEnclosures)
    const updatedEnclosure = editeditems?.map(item => item?.enclosure_id)
    if (!groupName.trim()) {
      setGroupNameError(true)
      return
    }

    try {
      const params = {
        site_id: selectedOption,
        meal_group_id: editParam?.id,
        group_name: groupName,
        add_enclosure_ids: JSON.stringify(updatedEnclosure),
        remove_enclosure_ids: JSON.stringify(removedEnclosures)
      }
      setGroupNameError(false)

      const response = await updateMealGroup(params)

      if (response) {
        handleCloseSideBar()
        fetchEnclosure()
        toast.success('Meal Group updated Successfully')
      } else {
        toast.error('Something went wrong')
      }
    } catch (error) {
      toast.error('Server error. Please try again.')
      console.error('Create Meal Group Error:', error)
    }
  }

  const handleEnclosureRemove = async index => {
    console.log('index >', index)

    const itemToRemove = editeditems[index] // Get the item being removed

    const updatedEditedEnclosures = editeditems.filter((_, i) => i !== index)
    const updatedChecked = checkedRows.filter(id => id !== itemToRemove.enclosure_id)

    // Add the removed item to removedEnclosures
    setRemovedEnclosures([...removedEnclosures, itemToRemove?.enclosure_id])

    setEditItems(updatedEditedEnclosures)
    setCheckedRows(updatedChecked) // or setSelectedCheckboxes
  }

  // const selectedObj = editeditems[index]
  // console.log('selected obj>', selectedObj)

  // try {
  //   const params = {
  //     site_id: selectedOption,
  //     meal_group_id: selectedObj?.group_id,
  //     group_name: selectedObj?.group_name,
  //     remove_enclosure_ids: JSON.stringify([selectedObj?.enclosure_id])
  //   }
  //   const response = await updateMealGroup(params)
  //   if (response) {
  //     handleCloseSideBar()
  //     fetchEnclosure()
  //     toast.success('Enclosure Removed from Group Successfully')
  //   } else {
  //     toast.error('Something went wrong')
  //   }
  // } catch (error) {
  //   toast.error('Server error. Please try again.')
  //   console.error('Create Meal Group Error:', error)
  // }
  // }

  const theme = useTheme()

  const RenderSidebarFooter = () => {
    return (
      <Box
        sx={{
          position: 'fixed',
          right: 0,
          height: '80px',
          width: '100%',
          maxWidth: '562px',
          position: 'fixed',
          bottom: 0,
          right: 0,
          px: { xs: 2, sm: 3, md: 4 },
          bgcolor: 'white',
          alignItems: 'center',
          justifyContent: 'center',
          display: 'flex',
          zIndex: 1300
        }}
      >
        <LoadingButton
          onClick={Object.keys(editParam).length > 0 ? handleUpdateGroup : handleCreateGroup}
          sx={{ height: '58px' }}
          fullWidth
          //   disabled={loader || watch('nursery_name') === '' || watch('site_id') === ''}
          variant='contained'
          type='submit'
          size='large'
          //   loading={loading}
        >
          {Object.keys(editParam).length > 0 ? 'Update' : 'Create'}
        </LoadingButton>
      </Box>
    )
  }

  return (
    <>
      <Drawer
        anchor='right'
        open={openDrawer}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': { width: ['100%', '562px'] },
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: theme.palette.customColors.bodyBg,
          gap: '24px'
        }}
      >
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            bgcolor: theme.palette.customColors.bodyBg,
            zIndex: 10,
            overflowY: 'scroll',

            // width: {
            //   xs: '100%', // full width on small screens
            //   sm: '74%',
            //   md: '500px',
            //   lg: '562px'
            // },
            maxHeight: '100vh'
            // overflow: 'auto'
          }}
        >
          <Box
            className='sidebar-header'
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              p: theme => theme.spacing(3, 3.255, 3, 5.255),
              px: '16px'
            }}
          >
            <Box sx={{ gap: 2, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              <img src='/icons/Activity.svg' alt='Grocery Icon' width='35px' />
              <Typography
                sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '24px', fontWeight: 500 }}
              >
                {mealType.type === 'view'
                  ? 'Meal Group'
                  : Object.keys(editParam).length > 0
                  ? 'Edit Meal Group'
                  : 'Create new group'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                size='small'
                onClick={() => {
                  handleCloseSideBar()
                  //   setSearchValue('')
                }}
                sx={{ color: theme.palette.primary.light }}
              >
                <Icon icon='mdi:close' fontSize={25} />
              </IconButton>
            </Box>
          </Box>
          <Box>
            <Card
              sx={{
                p: { xs: 2, sm: 5 },
                width: { xs: '95vw', sm: '514px', md: '524px' },
                height: Object.keys(editParam).length > 0 ? 'auto' : { xs: 'auto', sm: '190px' },
                boxShadow: 'none',

                m: { xs: 6, sm: 3, md: 5 },
                mt: 2,
                ml: { xs: 2, sm: 6 }
              }}
            >
              <Typography
                sx={{
                  fontWeight: 500,
                  color: theme.palette.customColors.OnSurfaceVariant,
                  mb: 1,
                  fontSize: '20px',
                  fontFamily: 'Inter'
                }}
              >
                Enter group name
              </Typography>

              <FormControl fullWidth>
                <TextField
                  fullWidth
                  disabled={mealType.type === 'view'}
                  placeholder='Enter name'
                  variant='outlined'
                  value={groupName}
                  error={groupNameError}
                  helperText={groupNameError ? 'Group name is required' : ''}
                  onChange={e => {
                    setGroupName(e.target.value)
                    setGroupNameError(false)
                  }}
                  sx={{
                    mb: 2,
                    backgroundColor: 'white',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '4px'
                    },
                    input: {
                      color: theme.palette.customColors.Outline
                    }
                  }}
                />
              </FormControl>

              {!Object.keys(editParam).length > 0 && (
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    width: '100%',
                    height: '44px',
                    borderRadius: '8px',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: theme.palette.customColors.OnBackground,
                    mt: groupNameError ? 1 : 2,
                    px: 2,
                    py: 1.5,
                    gap: 2
                  }}
                >
                  <Typography>
                    <Box
                      component='span'
                      sx={{
                        fontWeight: 600,
                        fontSize: '16px',
                        fontFamily: 'Inter',
                        mr: 1,
                        color: theme.palette.customColors.OnSurfaceVariant
                      }}
                    >
                      {siteStats?.total_enclosures}
                    </Box>
                    <Box
                      component='span'
                      sx={{
                        fontWeight: 500,
                        fontSize: '14px',
                        fontFamily: 'Inter',
                        color: theme.palette.customColors.OnSurfaceVariant
                      }}
                    >
                      Enclosures
                    </Box>
                  </Typography>

                  <Typography>
                    <Box
                      component='span'
                      sx={{
                        fontWeight: 600,
                        fontSize: '16px',
                        fontFamily: 'Inter',
                        mr: 1,
                        color: theme.palette.customColors.OnSurfaceVariant
                      }}
                    >
                      {siteStats?.total_species}
                    </Box>
                    <Box
                      component='span'
                      sx={{
                        fontWeight: 500,
                        fontSize: '14px',
                        fontFamily: 'Inter',
                        color: theme.palette.customColors.OnSurfaceVariant
                      }}
                    >
                      Species
                    </Box>
                  </Typography>

                  <Typography>
                    <Box
                      component='span'
                      sx={{
                        fontWeight: 600,
                        fontSize: '16px',
                        fontFamily: 'Inter',
                        mr: 1,
                        color: theme.palette.customColors.OnSurfaceVariant
                      }}
                    >
                      {siteStats?.total_animals}
                    </Box>
                    <Box
                      component='span'
                      sx={{
                        fontWeight: 500,
                        fontSize: '14px',
                        fontFamily: 'Inter',
                        color: theme.palette.customColors.OnSurfaceVariant
                      }}
                    >
                      Animals
                    </Box>
                  </Typography>
                </Box>
              )}
            </Card>
          </Box>

          <Box sx={{ p: 3, borderRadius: '8px' }}>
            <Typography
              sx={{
                fontFamily: 'Inter',
                fontSize: '20px',
                fontWeight: 500,
                color: theme.palette.customColors.OnSurfaceVariant,
                ml: 2,
                mb: mealType.type === 'view' && 4
              }}
            >
              Selected enclosures
            </Typography>
            {mealType.type !== 'view' && (
              <Box display='flex' gap={1} mt={2} flexDirection={{ xs: 'column', sm: 'row' }}>
                <TextField
                  placeholder='Search...'
                  value={Object.keys(editParam).length > 0 ? editSearchValue : searchTerm}
                  variant='outlined'
                  size='small'
                  onChange={e => {
                    if (Object.keys(editParam).length > 0) {
                      handleEditSearch(e.target.value, mealId)
                    } else {
                      handleCreateSearch(e.target.value)
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <Icon icon='mi:search' fontSize={24} color={theme.palette.customColors.neutralSecondary} />
                      </InputAdornment>
                    ),
                    sx: {
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      m: { md: 5 },
                      mt: { md: 0 },
                      ml: { xs: 0, sm: 2, md: 1 },
                      width: { xs: '96%', sm: '520px', md: '524px' },
                      height: '48px',
                      input: {
                        color: theme.palette.customColors.Outline,
                        padding: '10px 0'
                      }
                    }
                  }}
                />
              </Box>
            )}

            <Card
              sx={{
                p: { xs: 2, sm: 5 },
                // mt: 4,
                width: { xs: '93vw', sm: '514px', md: '524px' },
                //  width: '100%',
                height: { xs: '100vh ', sx: 'calc(100dvh - 200px)', md: 'calc(100dvh - 100px)' },
                // ml: 2,
                mb: 10,
                m: { xs: 2, sm: 3, md: 2 },
                mt: { xs: 3, sm: 4, md: 0 },
                ml: { xs: 0, sm: 2.5, md: 1 },
                // mr:{xs:3},
                boxShadow: 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start'
              }}
            >
              {/* Make this Box scrollable */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  pr: 1, // Optional: adds some padding to the right to prevent content cutoff
                  height: '80vh' // Makes sure the Box respects the Card height
                }}
              >
                {loader ? (
                  <Box
                    sx={{
                      height: '100%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    <CircularProgress size={40} sx={{ mb: 100 }} />
                  </Box>
                ) : (Object.keys(editParam).length > 0 ? editeditems : selectedItems).length > 0 ? (
                  (Object.keys(editParam).length > 0 ? editeditems : selectedItems).map((item, index) => (
                    <Card
                      key={index}
                      sx={{
                        p: 5,
                        width: { xs: '90vw', sm: '475px', md: '485px' },
                        height: '80px',
                        m: { xs: 0, sm: 0, md: 0 },
                        mt: { xs: 2, sm: 2, md: 0 },
                        ml: { xs: 0, sm: 0, md: 0 },
                        backgroundColor: theme.palette.customColors.displaybgPrimary,
                        borderRadius: '16px',
                        display: 'flex',
                        boxShadow: 'none',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Box>
                        <Typography
                          sx={{
                            fontWeight: 500,
                            fontSize: '16px',
                            fontFamily: 'Inter',
                            color: theme.palette.customColors.OnSurfaceVariant
                          }}
                        >
                          {item.user_enclosure_name}
                        </Typography>
                        <Typography
                          sx={{
                            fontWeight: 400,
                            fontSize: '14px',
                            fontFamily: 'Inter',
                            color: theme.palette.customColors.OnSurfaceVariant
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
                        <Typography
                          sx={{
                            fontFamily: 'Inter',
                            fontSize: '14px',
                            fontWeight: 400,
                            color: theme.palette.customColors.OnSurfaceVariant
                          }}
                        >
                          Species : {item.species_count}
                        </Typography>
                        <Typography
                          sx={{
                            fontFamily: 'Inter',
                            fontSize: '14px',
                            fontWeight: 400,
                            color: theme.palette.customColors.OnSurfaceVariant
                          }}
                        >
                          Animals : {item.animal_count}
                        </Typography>
                      </Box>

                      {mealType.type !== 'view' && (
                        <IconButton
                          size='medium'
                          sx={{ color: 'text.primary' }}
                          onClick={() =>
                            Object.keys(editParam).length > 0 ? handleEnclosureRemove(index) : handleRemove(index)
                          }
                        >
                          <Icon icon='mdi:close' sx={{ fontSize: '24px' }} />
                        </IconButton>
                      )}
                    </Card>
                  ))
                ) : (
                  <Box
                    sx={{
                      height: '50%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    <Typography sx={{ fontSize: '16px', fontWeight: 500, color: '#888' }}>No Data Found</Typography>
                  </Box>
                )}
              </Box>
            </Card>
          </Box>
        </Box>

        {mealType.type !== 'view' && <RenderSidebarFooter />}
      </Drawer>
    </>
  )
}
export default CreateMealGroup
