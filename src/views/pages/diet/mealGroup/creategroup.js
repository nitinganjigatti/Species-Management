import {
  Box,
  Button,
  Card,
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
import { useEffect, useRef, useState } from 'react'
import { createMealGroup, updateMealGroup } from 'src/lib/api/diet/mealgroup'
import toast from 'react-hot-toast'

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
  fetchEnclosure,
  siteStats
}) => {
  console.log('editeditems >', editeditems)

  const [groupName, setGroupName] = useState(editParam?.group_name || '')
  const [groupNameError, setGroupNameError] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  const handleRemove = index => {
    const itemToRemove = selectedItems[index] // Get the item being removed
    const updatedItems = selectedItems.filter((_, i) => i !== index)
    const updatedChecked = checkedRows.filter(id => id !== itemToRemove.enclosure_id)

    setSelectedItems(updatedItems)
    setCheckedRows(updatedChecked) // or setSelectedCheckboxes(updatedChecked) if that's your setter
  }

  // useEffect(() => {

  // }, [editParam])
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
      } else {
        toast.error('Something went wrong')
      }
    } catch (error) {
      toast.error('Server error. Please try again.')
      console.error('Create Meal Group Error:', error)
    }
  }

  const handleUpdateGroup = async () => {
    if (!groupName.trim()) {
      setGroupNameError(true)
      return
    }

    try {
      const params = {
        site_id: selectedOption,
        meal_group_id: editParam?.id,
        group_name: groupName
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
    debugger
    console.log('index >', index)
    const selectedObj = editeditems[index]
    console.log('selected obj>', selectedObj)

    try {
      const params = {
        site_id: selectedOption,
        meal_group_id: selectedObj?.group_id,
        group_name: selectedObj?.group_name,
        remove_enclosure_ids: JSON.stringify([selectedObj?.enclosure_id])
      }
      const response = await updateMealGroup(params)
      if (response) {
        handleCloseSideBar()
        fetchEnclosure()
        toast.success('Enclosure Removed from Group Successfully')
      } else {
        toast.error('Something went wrong')
      }
    } catch (error) {
      toast.error('Server error. Please try again.')
      console.error('Create Meal Group Error:', error)
    }
  }

  const handleSearch = (e)=>{
     setSearchValue(e.target.value)
     
  }

  const theme = useTheme()

  const RenderSidebarFooter = () => {
    return (
      <Box
        sx={{
          position: 'relative',
          right: 0,
          height: '122px',
          width: '100%',
          maxWidth: '562px',
          position: 'fixed',
          bottom: 0,
          px: 4,
          py: '24px',
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
        <Box sx={{ position: 'fixed', top: 0, bgcolor: theme.palette.customColors.bodyBg, zIndex: 10, width: '562px' }}>
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
              {Object.keys(editParam).length > 0 ? (
                <Typography
                  sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '24px', fontWeight: 500 }}
                >
                  Edit Meal Group
                </Typography>
              ) : (
                <Typography
                  sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '24px', fontWeight: 500 }}
                >
                  Create new group
                </Typography>
              )}
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
                p: 5,
                width: '514px',
                height: Object.keys(editParam).length > 0 ? '130px' : '190px',
                boxShadow: 'none',
                m: 3,
                mt: 2,
                ml: 6
              }}
            >
              <Typography sx={{ fontWeight: 500, color: '#44544A', mb: 1, fontSize: '20px', fontFamily: 'Inter' }}>
                Enter group name
              </Typography>

              <FormControl fullWidth>
                <TextField
                  fullWidth
                  placeholder='Enter name'
                  variant='outlined'
                  value={groupName}
                  error={groupNameError}
                  helperText={groupNameError ? 'Group name is required' : ''}
                  onChange={e => {
                    setGroupName(e.target.value)
                    setGroupNameError(false) // clear error on typing
                  }}
                  sx={{
                    mb: 2,
                    backgroundColor: 'white',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '4px'
                    },
                    input: {
                      color: '#839D8D'
                    }
                  }}
                />
              </FormControl>

              {!Object.keys(editParam).length > 0 && (
                <Box
                  sx={{
                    display: 'flex',
                    width: '474px',
                    height: '44px',
                    borderRadius: '8px',
                    justifyContent: 'space-between',
                    backgroundColor: '#E1F9ED',
                    mt: groupNameError ? 1 : 2,
                    p: 3
                  }}
                >
                  <Typography>
                    <Box
                      component='span'
                      sx={{ fontWeight: 600, fontSize: '16px', fontFamily: 'Inter', mr: 1, color: '#44544A' }}
                    >
                      {siteStats?.total_enclosures}
                    </Box>
                    <Box
                      component='span'
                      sx={{ fontWeight: 500, fontSize: '14px', fontFamily: 'Inter', color: '#44544A' }}
                    >
                      Enclosures
                    </Box>
                  </Typography>
                  <Typography>
                    <Box
                      component='span'
                      sx={{ fontWeight: 600, fontSize: '16px', fontFamily: 'Inter', color: '#44544A' }}
                    >
                      {siteStats?.total_species}
                    </Box>{' '}
                    <Box
                      component='span'
                      sx={{ fontWeight: 500, fontSize: '14px', fontFamily: 'Inter', color: '#44544A' }}
                    >
                      Species
                    </Box>
                  </Typography>
                  <Typography>
                    <Box
                      component='span'
                      sx={{ fontWeight: 600, fontSize: '16px', fontFamily: 'Inter', color: '#44544A' }}
                    >
                      {siteStats?.total_animals}
                    </Box>{' '}
                    <Box
                      component='span'
                      sx={{ fontWeight: 500, fontSize: '14px', fontFamily: 'Inter', color: '#44544A' }}
                    >
                      Animals
                    </Box>
                  </Typography>
                </Box>
              )}
            </Card>
          </Box>
          <Box sx={{ p: 3, backgroundColor: '#EEF5F1', borderRadius: '8px' }}>
            <Typography sx={{ fontFamily: 'Inter', fontSize: '20px', fontWeight: 500, color: '#44544A', ml: 3 }}>
              Selected enclosures
            </Typography>

            <Box display='flex' gap={1} mt={2}>
              <TextField
                placeholder='Search...'
                value={searchValue}
                variant='outlined'
                size='small'
                onChange={e => handleSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Icon icon='mi:search' fontSize={24} color={theme.palette.customColors.neutralSecondary} />
                    </InputAdornment>
                  ),
                  sx: {
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    ml: 2,
                    width: '520px',
                    height: '48px',
                    input: { color: '#839D8D', padding: '10px 0' }
                  }
                }}
              />
            </Box>
            <Card
              sx={{
                p: 5,
                mt: 4,
                width: '520px',
                height: '700px',
                ml: 2,
                boxShadow: 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start' // 👈 brings children to the top
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4 // 👈 adds space between the inner cards
                }}
              >
                {Object.keys(editParam).length > 0
                  ? // Render edited items here
                    editeditems.map((item, index) => (
                      <Card
                        key={index}
                        sx={{
                          p: 5,
                          width: '482px',
                          height: '80px',
                          backgroundColor: '#E8F3EE',
                          borderRadius: '12px',
                          display: 'flex',
                          boxShadow: 'none',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <Box>
                          <Typography sx={{ fontWeight: 500, fontSize: '16px', fontFamily: 'Inter', color: '#44544A' }}>
                            {item.user_enclosure_name}
                          </Typography>
                          <Typography sx={{ fontWeight: 400, fontSize: '14px', fontFamily: 'Inter', color: '#44544A' }}>
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
                          <Typography sx={{ fontFamily: 'Inter', fontSize: '14px', fontWeight: 400, color: '#44544A' }}>
                            Species : {item.species_count}
                          </Typography>
                          <Typography sx={{ fontFamily: 'Inter', fontSize: '14px', fontWeight: 400, color: '#44544A' }}>
                            Animals : {item.animal_count}
                          </Typography>
                        </Box>

                        <IconButton
                          size='medium'
                          sx={{ color: 'text.primary' }}
                          onClick={() =>
                            Object.keys(editParam).length > 0 ? handleEnclosureRemove(index) : handleRemove(index)
                          }
                        >
                          <Icon icon='mdi:close' fontSize={30} />
                        </IconButton>
                      </Card>
                    ))
                  : selectedItems.map((item, index) => (
                      <Card
                        key={index}
                        sx={{
                          p: 5,
                          width: '482px',
                          height: '80px',
                          backgroundColor: '#E8F3EE',
                          borderRadius: '12px',
                          display: 'flex',
                          boxShadow: 'none',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <Box>
                          <Typography sx={{ fontWeight: 500, fontSize: '16px', fontFamily: 'Inter', color: '#44544A' }}>
                            {item.user_enclosure_name}
                          </Typography>
                          <Typography sx={{ fontWeight: 400, fontSize: '14px', fontFamily: 'Inter', color: '#44544A' }}>
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
                          <Typography sx={{ fontFamily: 'Inter', fontSize: '14px', fontWeight: 400, color: '#44544A' }}>
                            Species : {item.species_count}
                          </Typography>
                          <Typography sx={{ fontFamily: 'Inter', fontSize: '14px', fontWeight: 400, color: '#44544A' }}>
                            Animals : {item.animal_count}
                          </Typography>
                        </Box>

                        <IconButton size='medium' sx={{ color: 'text.primary' }} onClick={() => handleRemove(index)}>
                          <Icon icon='mdi:close' fontSize={30} />
                        </IconButton>
                      </Card>
                    ))}
              </Box>
            </Card>
          </Box>
        </Box>

        <RenderSidebarFooter />
      </Drawer>
    </>
  )
}
export default CreateMealGroup
