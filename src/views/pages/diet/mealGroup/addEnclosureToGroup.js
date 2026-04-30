import {
  Autocomplete,
  Box,
  Card,
  CircularProgress,
  Drawer,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Typography
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@emotion/react'
import { useContext, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { getMealGroupList, AddEnclosureToExistng } from 'src/lib/api/diet/mealgroup'
import { AuthContext } from 'src/context/AuthContext'
import { LoadingButton } from '@mui/lab'
import { useTranslation } from 'react-i18next'

const AddEnclosureToGroup = ({
  addEnclosureDrawer,
  setAddEnclosureDrawer,
  selectedItems,
  setSelectedItems,
  selectedOption,
  loader,
  checkedRows,
  setCheckedRows,
  fetchSiteStats,
  siteStats,
  setStatus,
  fetchEnclosure
}) => {
  const theme = useTheme()
  const { t } = useTranslation()
  const authData = useContext(AuthContext)
  const [groupList, setGroupList] = useState([])
  const [groupId, setGroupId] = useState('')
  const [selectedEnclosureIds, setSelectedEnclosureIds] = useState([])
  const [mealGroupError, setMealGroupError] = useState(false)
  const [loading, setLoading] = useState(false)
  const toastLock = useRef(false)

  const dietModule = authData?.userData?.roles?.settings?.diet_module

  useEffect(() => {
    if (checkedRows) {
      setSelectedEnclosureIds(checkedRows)
      fetchGroupList()
    }
  }, [addEnclosureDrawer, checkedRows])

  const fetchGroupList = async () => {
    const params = { site_id: selectedOption }
    try {
      const res = await getMealGroupList(params)
      if (res.success) setGroupList(res.data.result)
      else console.error('Error:', res.message)
    } catch (err) {
      console.error(err)
    }
  }

  const handleGroupChange = event => {
    setGroupId(event.target.value)
  }

  const handleRemove = index => {
    const itemToRemove = selectedItems[index]

    const updatedItems = selectedItems.filter((_, i) => i !== index)

    const updatedIds = updatedItems.map(item => item.enclosure_id)

    const updatedChecked = updatedItems

    setSelectedItems(updatedItems)

    // setSelectedEnclosureIds(updatedIds) // update just the IDs for checking checkboxes
    setCheckedRows(updatedIds)
  }

  const handleCheckboxChange = id => {
    setSelectedEnclosureIds(prev => (prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]))
  }

  const showToast = (message, type = 'error') => {
    if (toastLock.current) return

    toastLock.current = true
    toast[type](message)

    setTimeout(() => {
      toastLock.current = false
    }, 3000)
  }

  const handleAdd = async () => {
    if (!groupId) return setMealGroupError(true)
    setMealGroupError(false)

    if (!selectedItems || selectedItems.length === 0) {
      showToast('Please select an enclosure')
      return
    }

    if (loading) return
    setLoading(true)

    const params = {
      site_id: selectedOption,
      enclosure_ids: JSON.stringify(selectedEnclosureIds),
      meal_group_id: groupId
    }

    try {
      const res = await AddEnclosureToExistng(params)
      if (res.success) {
        toast.success('Enclosure(s) added successfully')
        setStatus('mealgroup')
        setLoading(false)
        setAddEnclosureDrawer(false)
        setCheckedRows([])
        setSelectedItems([])
        fetchSiteStats()
        fetchEnclosure()
      } else {
        setLoading(true)
        toast.error('Something went wrong')
      }
    } catch (err) {
      console.error(err)
      setLoading(true)
      toast.error('Unexpected error occurred')
    }
  }

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
          onClick={handleAdd}
          fullWidth
          disabled={loading}
          //   disabled={loader || watch('nursery_name') === '' || watch('site_id') === ''}
          variant='contained'
          type='submit'
          size='large'

          //   loading={loading}
        >
          Add
        </LoadingButton>
      </Box>
    )
  }

  const totalSpecies = selectedItems?.reduce((acc, item) => acc + Number(item?.species_count || 0), 0) || 0
  const totalAnimals = selectedItems?.reduce((acc, item) => acc + Number(item?.animal_count || 0), 0) || 0

  return dietModule ? (
    <>
      <Drawer
        anchor='right'
        open={addEnclosureDrawer}
        ModalProps={{ keepMounted: true }}
        //onClose={() => setAddEnclosureDrawer(false)}
        sx={{ '& .MuiDrawer-paper': { width: '100%', maxWidth: '562px' } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 3, bgcolor: '#EEF5F1' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <img src='/icons/Activity.svg' alt='Icon' width='35' />
            <Typography sx={{ fontWeight: 600, fontSize: '20px' }}>Add Enclosure to Meal Group</Typography>
          </Box>
          <IconButton onClick={() => setAddEnclosureDrawer(false)}>
            <Icon icon='mdi:close' fontSize={25} />
          </IconButton>
        </Box>

        <Box sx={{ p: 3, bgcolor: '#EEF5F1', height: 'calc(100dvh - 106px)', overflowY: 'auto' }}>
          <Box
            sx={{
              backgroundColor: theme.palette.background.paper,
              p: 3,
              borderRadius: '10px',
              mb: 4,
              height: mealGroupError ? 135 : 120
            }}
          >
            <Typography
              sx={{
                fontWeight: 500,
                fontSize: '20px',
                mb: 3,
                color: theme.palette.customColors.onSurfaceVariant,
                fontFamily: 'Inter'
              }}
            >
              {t('diet_module.select_group_name')}
            </Typography>
            {/* 
            <Select
              value={groupId}
              onChange={handleGroupChange}
              displayEmpty
              error={mealGroupError}
              fullWidth
              size='small'
              sx={{
                bgcolor: 'white',
                borderRadius: '8px',
                height: '48px',
                fontSize: '14px',
                px: 2,
                '& .MuiSelect-select': {
                  display: 'flex',
                  alignItems: 'center'
                }
              }}
              renderValue={selected =>
                !selected ? (
                  <Typography color='textSecondary'>Select</Typography>
                ) : (
                  groupList.find(g => g.id === selected)?.group_name
                )
              }
            >
              <MenuItem value=''>
                <Typography color='textSecondary'>Select Meal Group</Typography>
              </MenuItem>
              {groupList.map(item => (
                <MenuItem key={item.id} value={item.id}>
                  {item.group_name}
                </MenuItem>
              ))}
            </Select> */}
            <Autocomplete
              options={groupList}
              getOptionLabel={option => option.group_name || ''}
              value={groupList.find(g => g.id === groupId) || null}
              onChange={(event, newValue) => {
                setGroupId(newValue ? newValue.id : '')
                setMealGroupError(false)
              }}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={params => (
                <TextField
                  {...params}
                  label='Select'
                  placeholder='Search...'
                  error={mealGroupError}
                  helperText={mealGroupError ? 'Please select Group name' : ''}
                  size='small'
                  sx={{
                    bgcolor: 'white',
                    borderRadius: '8px',
                    '& .MuiInputBase-root': {
                      height: '48px',
                      fontSize: '14px',
                      p: 4
                    }
                  }}
                />
              )}
              sx={{
                mb: 4,
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </Box>

          <Typography
            sx={{
              fontFamily: 'Inter',
              fontSize: '20px',
              fontWeight: 500,
              color: theme.palette.customColors.OnSurfaceVariant,
              ml: 2

              //   mb: mealType.type === 'view' && 4
            }}
          >
            {t('diet_module.selected_enclosures')}
          </Typography>

          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              width: '100%',
              height: '44px',
              borderRadius: '8px',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#DAE7DF',
              px: 4,
              py: 1.5,
              gap: 2,
              mt: 2
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
                  color: '#006D35'
                }}
              >
                {selectedItems?.length}
                {/* {siteStats?.total_enclosures} */}
              </Box>
              <Box
                component='span'
                sx={{
                  fontWeight: 500,
                  fontSize: '14px',
                  fontFamily: 'Inter',
                  color: '#006D35'
                }}
              >
                {selectedItems?.length === 1 ? 'Enclosure' : 'Enclosures'}
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
                  color: '#006D35'
                }}
              >
                {totalSpecies}
                {/* {siteStats?.total_species} */}
              </Box>
              <Box
                component='span'
                sx={{
                  fontWeight: 500,
                  fontSize: '14px',
                  fontFamily: 'Inter',
                  color: '#006D35'
                }}
              >
                {t('navigation.species')}
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
                  color: '#006D35'
                }}
              >
                {totalAnimals}
                {/* {siteStats?.total_animals} */}
              </Box>
              <Box
                component='span'
                sx={{
                  fontWeight: 500,
                  fontSize: '14px',
                  fontFamily: 'Inter',
                  color: '#006D35'
                }}
              >
                {totalAnimals === 1 ? 'Animal' : 'Animals'}
              </Box>
            </Typography>
          </Box>

          <Box>
            {loader ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
              </Box>
            ) : selectedItems && selectedItems?.length > 0 ? (
              selectedItems.map((item, index) => (
                <Box key={item?.id ?? index} sx={{ mt: 3 }}>
                  <Card
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 4,

                      //   mb: 2,
                      boxShadow: 'none',
                      bgcolor: 'white',
                      borderRadius: '8px',
                      border: `1px solid ${theme.palette.customColors.OutlineVariant}`
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 500, ml: 3 }}>{item.user_enclosure_name}</Typography>
                      <Typography sx={{ fontSize: '14px', ml: 3 }}>{item.section_name}</Typography>
                    </Box>
                    <Box sx={{ ml: 'auto', mr: 2 }}>
                      <Typography sx={{ fontSize: '14px' }}>
                        {t('navigation.species')}: {item.species_count}
                      </Typography>
                      <Typography sx={{ fontSize: '14px' }}>
                        {t('navigation.animals')}: {item.animal_count}
                      </Typography>
                    </Box>
                    {/* <Checkbox
                    checked={selectedEnclosureIds.includes(item.enclosure_id)}
                    onChange={() => handleCheckboxChange(item.enclosure_id)}
                  /> */}
                    <IconButton size='medium' sx={{ color: 'text.primary', ml: 4 }} onClick={() => handleRemove(index)}>
                      <Icon icon='mdi:close' sx={{ fontSize: '24px' }} />
                    </IconButton>
                  </Card>
                </Box>
              ))
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Typography sx={{ fontSize: '16px', fontWeight: 500, color: '#888', mt: 30 }}>
                  {t('diet_module.no_data_found')}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        <RenderSidebarFooter />
      </Drawer>
    </>
  ) : null
}

export default AddEnclosureToGroup
