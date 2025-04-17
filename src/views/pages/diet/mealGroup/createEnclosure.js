import {
  Box,
  Button,
  Card,
  Checkbox,
  CircularProgress,
  Drawer,
  IconButton,
  InputAdornment,
  TextField,
  Typography
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@emotion/react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { AddEnclosureToExistng } from 'src/lib/api/diet/mealgroup'

const CreateEnclosure = ({
  enclosureDrawer,
  selectedItems,
  setEnclosureDrawer,
  selectedOption,
  Loader,
  groupId,
  fetchEnclosure
}) => {
  console.log('selected Items >>', selectedItems)
  const [selectedEnclosureIds, setSelectedEnclosureIds] = useState([])

  const theme = useTheme()

  const handleAddEnclosure = async () => {
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
        setEnclosureDrawer(false)
        fetchEnclosure()
      } else {
        toast.error('Something went wrong')
      }
    } catch (error) {
      console.error('Error adding enclosures:', error)
      toast.error('An unexpected error occurred')
    }
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
          height: '122px',
          bgcolor: 'white',
          px: 4,
          py: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 1300
          //   borderTop: '1px solid #eee'
        }}
      >
        {/* Left: 3 Selected Dropdown */}
        <Box display='flex' alignItems='center'>
          <Typography sx={{ ml: 2, color: '#37BD69', fontWeight: 600, fontSize: '16px', fontFamily: 'Inter' }}>
            {selectedEnclosureIds.length} Selected
          </Typography>
          <IconButton size='small' sx={{ color: '#37BD69', ml: 1 }}>
            <Icon icon='mdi:chevron-down' />
          </IconButton>
        </Box>

        {/* Right: Cancel + Add */}
        <Box display='flex' gap={2}>
          <Button
            onClick={() => setEnclosureDrawer(false)}
            variant='outlined'
            sx={{
              height: '58px',
              width: '140px',
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
            sx={{
              height: '58px',
              width: '140px',
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
    debugger
    setSelectedEnclosureIds(prev => (prev.includes(id) ? prev.filter(eId => eId !== id) : [...prev, id]))
  }

  console.log('selected Enclosures >', selectedEnclosureIds)

  return (
    <>
      <Drawer
        anchor='right'
        open={enclosureDrawer}
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
              <Typography
                sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '24px', fontWeight: 500 }}
              >
                Add enclosures to group
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                size='small'
                onClick={() => setEnclosureDrawer(false)}
                sx={{ color: theme.palette.primary.light }}
              >
                <Icon icon='mdi:close' fontSize={25} />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ p: 3, backgroundColor: '#EEF5F1', borderRadius: '8px' }}>
            <Box display='flex' gap={1} mt={2}>
              <TextField
                placeholder='Search...'
                variant='outlined'
                size='small'
                onChange={''}
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

            <Box>
              <Card
                sx={{
                  p: 5,
                  mt: 4,
                  width: '520px',
                  height: '900px',
                  ml: 2,
                  borderRadius: '8px',
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
                    gap: 4,
                    alignItems: 'center', // center the loader horizontally
                    justifyContent: 'center', // center vertically if needed
                    minHeight: '100px' // ensures height while loading
                  }}
                >
                  {Loader ? (
                    <CircularProgress sx={{ width: 20, height: 20, mb: 7 }} />
                  ) : (
                    selectedItems.map((item, index) => (
                      // console.log('item>>', item)
                      <Card
                        sx={{
                          p: 7,
                          width: '482px',
                          height: '80px',
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
                          alignItems: 'center',
                          mb: 4
                        }}
                      >
                        <Box>
                          <Typography sx={{ fontWeight: 500, fontSize: '16px', fontFamily: 'Inter', color: '#44544A' }}>
                            {item.user_enclosure_name}
                          </Typography>
                          <Typography
                            sx={{
                              fontWeight: 400,
                              fontSize: '14px',
                              fontFamily: 'Inter',
                              color: '#44544A',
                              maxWidth: '100px', // adjust as needed
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
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
                          <Typography
                            sx={{
                              fontFamily: 'Inter',
                              fontSize: '14px',
                              fontWeight: 400,
                              color: '#44544A'
                            }}
                          >
                            Species : {item.species_count}
                          </Typography>
                          <Typography
                            sx={{
                              fontFamily: 'Inter',
                              fontSize: '14px',
                              fontWeight: 400,
                              color: '#44544A'
                            }}
                          >
                            Animals : {item.animal_count}
                          </Typography>
                        </Box>

                        <Checkbox
                          checked={selectedEnclosureIds.includes(item.enclosure_id)}
                          onChange={() => handleCheckboxChange(item?.enclosure_id)}
                        />
                      </Card>
                    ))
                  )}
                </Box>
              </Card>
            </Box>
          </Box>
        </Box>
        <RenderSidebarFooter />
      </Drawer>
    </>
  )
}
export default CreateEnclosure
