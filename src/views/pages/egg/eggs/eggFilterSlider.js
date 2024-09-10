// const { Box } = require("@mui/system")

// const { Drawer, Box, Typography } = require("@mui/material")
import { Drawer, Typography, IconButton, Tab, Chip, Divider } from '@mui/material'
import { Box } from '@mui/system'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import { LoadingButton } from '@mui/lab'
import { useState, useEffect } from 'react'

const EggFilterSlider = ({ openFilterDrawer, setOpenFilterDrawer }) => {
  const items = [
    { name: 'Rainbow Lorikeet', id: 1 },
    { name: 'Rainbow Lorikeet', id: 2 },
    { name: 'Rainbow Lorikeet', id: 3 },
    { name: 'Rainbow Lorikeet', id: 4 },
    { name: 'Rainbow Lorikeet', id: 5 },
    { name: 'Rainbow Lorikeet', id: 6 },
    { name: 'Rainbow Lorikeet', id: 7 },
    { name: 'Rainbow Lorikeet', id: 8 },
    { name: 'Rainbow Lorikeet', id: 9 }
  ]

  const [selectedOption, setSelectedOption] = useState(null)
  const [selectedItems, setSelectedItems] = useState([]) // Array to track selected items
  const [selectAll, setSelectAll] = useState(false) // Track "Select All" checkbox

  const theme = useTheme()

  const handleOptionClick = option => {
    console.log('options >>', option)
    setSelectedOption(option) // Update the selected option
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([])
    } else {
      // Select all items
      setSelectedItems(items.map(item => item.id))
    }
    setSelectAll(!selectAll)
  }

  // Toggle individual checkbox
  const handleCheckboxChange = id => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(item => item !== id))
    } else {
      setSelectedItems([...selectedItems, id])
    }
  }

  // Sync the "Select All" checkbox with individual selections
  useEffect(() => {
    if (selectedItems.length === items.length) {
      setSelectAll(true)
    } else {
      setSelectAll(false)
    }
  }, [selectedItems])

  return (
    <Drawer
      anchor='right'
      open={openFilterDrawer}
      ModalProps={{ keepMounted: true }}
      sx={{
        '& .MuiDrawer-paper': { width: ['100%', '562px'] },
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}
    >
      <Box
        sx={{
          bgcolor: theme.palette.customColors.lightBg,
          width: '100%',
          height: '100%'
        }}
      >
        <Box
          className='sidebar-header'
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            p: theme => theme.spacing(3, 3.255, 3, 5.255),
            px: '24px',
            mt: 2,
            ml: 2,
            bgcolor: theme.palette.customColors.lightBg
          }}
        >
          <Box sx={{ gap: 2, display: 'flex', flexDirection: 'row', alignItems: 'center', ml: -2 }}>
            <img src='/icons/egg_dashboard/filter_icon.png' width='32' height='32' />
            <Typography sx={{ fontSize: 24, fontFamily: 'Inter', fontWeight: 500, color: '#44544A' }}>
              Filter - 3
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mr: 4 }}>
            <IconButton size='small' onClick={() => setOpenFilterDrawer(false)} sx={{ color: 'text.primary' }}>
              <Icon icon='mdi:close' fontSize={20} />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ width: '562px', height: '653px', bgcolor: theme.palette.customColors.lightBg }}>
          <Box sx={{ width: '514px', height: '653px', bgcolor: theme.palette.customColors.lightBg, display: 'flex' }}>
            <Box
              sx={{
                width: '190px',
                height: '336px',
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                cursor: 'pointer'
              }}
            >
              <Box
                sx={{
                  width: '190px',
                  height: '60px'
                }}
                onClick={() => handleOptionClick('species')}
              >
                <Typography
                  sx={{
                    fontSize: '16px',
                    fontFamily: 'Inter',
                    fontWeight: 400,
                    height: '60px',
                    // ml: selectedOption && 5,
                    borderRadius: '8px 0px 0px 8px',
                    color: '#006D35',
                    textAlign: 'center',
                    bgcolor: selectedOption === 'species' ? '#FFFF' : theme.palette.customColors.lightBg,
                    paddingTop: '20px', // Add padding to increase space at the top
                    paddingBottom: '30px', // Adjust as necessary
                    position: 'relative'
                    // top: -8 // Reset the top positioning
                  }}
                >
                  Species (1)
                </Typography>
              </Box>

              <Box sx={{ width: '190px', height: '56px' }} onClick={() => handleOptionClick('batch')}>
                <Typography
                  sx={{
                    fontSize: '16px',
                    fontFamily: 'Inter',
                    height: '50px',
                    fontWeight: 400,
                    bgcolor: selectedOption === 'batch' ? '#FFFF' : theme.palette.customColors.lightBg,
                    paddingTop: '10px', // Add padding to increase space at the top
                    // // paddingBottom: '10px', // Adjust as necessary
                    color: '#006D35',
                    textAlign: 'center',
                    position: 'relative'
                    // top: 8
                  }}
                >
                  Batch (2)
                </Typography>
              </Box>
              <Box sx={{ width: '190px', height: '56px' }} onClick={() => handleOptionClick('nursery')}>
                <Typography
                  sx={{
                    fontSize: '16px',
                    fontFamily: 'Inter',
                    height: '50px',
                    fontWeight: 400,
                    bgcolor: selectedOption === 'nursery' ? '#FFFF' : theme.palette.customColors.lightBg,
                    paddingTop: '10px', // Add padding to increase space at the top
                    // // paddingBottom: '10px', // Adjust as necessary
                    color: '#006D35',
                    textAlign: 'center',
                    position: 'relative'
                  }}
                >
                  Nursery
                </Typography>
              </Box>
              <Box sx={{ width: '190px', height: '56px' }} onClick={() => handleOptionClick('security')}>
                <Typography
                  sx={{
                    fontSize: '16px',
                    fontFamily: 'Inter',
                    height: '50px',
                    fontWeight: 400,
                    bgcolor: selectedOption === 'security' ? '#FFFF' : theme.palette.customColors.lightBg,
                    paddingTop: '10px', // Add padding to increase space at the top
                    // // paddingBottom: '10px', // Adjust as necessary
                    color: '#006D35',
                    textAlign: 'center',
                    position: 'relative'
                  }}
                >
                  Security status
                </Typography>
              </Box>
              <Box sx={{ width: '190px', height: '56px' }} onClick={() => handleOptionClick('condition')}>
                <Typography
                  sx={{
                    fontSize: '16px',
                    fontFamily: 'Inter',
                    height: '50px',
                    fontWeight: 400,
                    bgcolor: selectedOption === 'condition' ? '#FFFF' : theme.palette.customColors.lightBg,
                    paddingTop: '10px', // Add padding to increase space at the top
                    // // paddingBottom: '10px', // Adjust as necessary
                    color: '#006D35',
                    textAlign: 'center',
                    position: 'relative'
                  }}
                >
                  Condition
                </Typography>
              </Box>
              <Box sx={{ width: '190px', height: '56px' }} onClick={() => handleOptionClick('reason')}>
                <Typography
                  sx={{
                    fontSize: '16px',
                    fontFamily: 'Inter',
                    height: '50px',
                    fontWeight: 400,
                    bgcolor: selectedOption === 'reason' ? '#FFFF' : theme.palette.customColors.lightBg,
                    paddingTop: '10px', // Add padding to increase space at the top
                    // // paddingBottom: '10px', // Adjust as necessary
                    color: '#006D35',
                    textAlign: 'center',
                    position: 'relative'
                  }}
                >
                  Reason
                </Typography>
              </Box>
            </Box>
            <Box sx={{ width: '324px', width: '653px', bgcolor: '#FFFF', mt: 0, borderRadius: '0px 8px 0px 0px' }}>
              <Box
                sx={{
                  width: '294px',
                  height: '40px',
                  borderRadius: '4px',
                  border: '1px solid #C3CEC7',
                  mt: 5,
                  ml: 3,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <img src='/icons/egg_dashboard/search.png' width='20px' height='20px' style={{ marginLeft: 10 }} />
                <input
                  type='text'
                  placeholder='Search'
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    outline: 'none',
                    fontSize: '14px',
                    fontFamily: 'Inter',
                    paddingLeft: '10px',
                    borderRadius: '4px'
                  }}
                />
              </Box>

              <Box sx={{ width: '292px', height: '56px', borderBottom: '0.5px solid #C3CEC7', ml: 3 }}>
                {/* <Box sx={{ width: '256px', height: '56px', gap: 8, display: 'flex' }}>
                  <img src='/icons/egg_dashboard/checkbox.png' width='24px' height='24px' style={{ marginTop: 20 }} />
                  <Typography
                    sx={{ fontWeight: 400, fontSize: '16px', fontFamily: 'Inter', ml: -5, mt: 5, color: '#839D8D' }}
                  >
                    Select All
                  </Typography>
                </Box> */}
                {/* Select All Checkbox */}
                <Box sx={{ width: '292px', height: '56px', borderBottom: '0.5px solid #C3CEC7', ml: 3 }}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', height: '100%' }}>
                    <input
                      type='checkbox'
                      checked={selectAll}
                      onChange={handleSelectAll}
                      style={{ width: '18px', height: '18px', marginTop: '7px', position: 'relative', left: '2px' }}
                    />
                    <Typography
                      sx={{
                        fontWeight: 400,
                        fontSize: '16px',
                        fontFamily: 'Inter',
                        color: '#839D8D',
                        mr: '2px',
                        mt: 1
                      }}
                    >
                      Select All
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ width: '292px', height: '356px' }}>
                  {/* <Box sx={{ width: '292px', height: '56px', borderRadius: '8px', gap: 4, display: 'flex' }}>
                    <img
                      src='/icons/egg_dashboard/checkbox.png'
                      width='24px'
                      height='24px'
                      style={{ marginTop: '20px' }}
                    />
                    <img
                      src='/icons/egg_dashboard/discard_species.png'
                      width='36px'
                      height='36px'
                      style={{ marginTop: '15px', marginLeft: '1px' }}
                    />
                    <Typography
                      sx={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '16px', color: '#839D8D', mt: 5 }}
                    >
                      Rainbow Lorikeet
                    </Typography>
                  </Box> */}
                  <Box sx={{ ml: 3 }}>
                    {items.map(item => (
                      <Box key={item.id} sx={{ display: 'flex', gap: 2, alignItems: 'center', height: '56px', mb: 1 }}>
                        <input
                          type='checkbox'
                          checked={selectedItems.includes(item.id)}
                          onChange={() => handleCheckboxChange(item.id)}
                          style={{ width: '18px', height: '18px', marginTop: '20px' }}
                        />
                        <img
                          src='/icons/egg_dashboard/discard_species.png'
                          width='36px'
                          height='36px'
                          style={{ marginTop: '15px', marginLeft: '1px' }}
                        />
                        <Typography
                          sx={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '16px', color: '#839D8D', mt: 5 }}
                        >
                          {item.name}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  {/* <Box sx={{ width: '292px', height: '56px', borderRadius: '8px', gap: 4, display: 'flex' }}>
                    <img
                      src='/icons/egg_dashboard/checkbox.png'
                      width='24px'
                      height='24px'
                      style={{ marginTop: '20px' }}
                    />
                    <img
                      src='/icons/egg_dashboard/discard_species.png'
                      width='36px'
                      height='36px'
                      style={{ marginTop: '15px', marginLeft: '1px' }}
                    />
                    <Typography
                      sx={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '16px', color: '#839D8D', mt: 5 }}
                    >
                      Rainbow Lorikeet
                    </Typography>
                  </Box>

                  <Box sx={{ width: '292px', height: '56px', borderRadius: '8px', gap: 4, display: 'flex' }}>
                    <img
                      src='/icons/egg_dashboard/checkbox.png'
                      width='24px'
                      height='24px'
                      style={{ marginTop: '20px' }}
                    />
                    <img
                      src='/icons/egg_dashboard/discard_species.png'
                      width='36px'
                      height='36px'
                      style={{ marginTop: '15px', marginLeft: '1px' }}
                    />
                    <Typography
                      sx={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '16px', color: '#839D8D', mt: 5 }}
                    >
                      Rainbow Lorikeet
                    </Typography>
                  </Box>

                  <Box sx={{ width: '292px', height: '56px', borderRadius: '8px', gap: 4, display: 'flex' }}>
                    <img
                      src='/icons/egg_dashboard/checkbox.png'
                      width='24px'
                      height='24px'
                      style={{ marginTop: '20px' }}
                    />
                    <img
                      src='/icons/egg_dashboard/discard_species.png'
                      width='36px'
                      height='36px'
                      style={{ marginTop: '15px', marginLeft: '1px' }}
                    />
                    <Typography
                      sx={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '16px', color: '#839D8D', mt: 5 }}
                    >
                      Rainbow Lorikeet
                    </Typography>
                  </Box>

                  <Box sx={{ width: '292px', height: '56px', borderRadius: '8px', gap: 4, display: 'flex' }}>
                    <img
                      src='/icons/egg_dashboard/checkbox.png'
                      width='24px'
                      height='24px'
                      style={{ marginTop: '20px' }}
                    />
                    <img
                      src='/icons/egg_dashboard/discard_species.png'
                      width='36px'
                      height='36px'
                      style={{ marginTop: '15px', marginLeft: '1px' }}
                    />
                    <Typography
                      sx={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '16px', color: '#839D8D', mt: 5 }}
                    >
                      Rainbow Lorikeet
                    </Typography>
                  </Box>

                  <Box sx={{ width: '292px', height: '56px', borderRadius: '8px', gap: 4, display: 'flex' }}>
                    <img
                      src='/icons/egg_dashboard/checkbox.png'
                      width='24px'
                      height='24px'
                      style={{ marginTop: '20px' }}
                    />
                    <img
                      src='/icons/egg_dashboard/discard_species.png'
                      width='36px'
                      height='36px'
                      style={{ marginTop: '15px', marginLeft: '1px' }}
                    />
                    <Typography
                      sx={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '16px', color: '#839D8D', mt: 5 }}
                    >
                      Rainbow Lorikeet
                    </Typography>
                  </Box>

                  <Box sx={{ width: '292px', height: '56px', borderRadius: '8px', gap: 4, display: 'flex' }}>
                    <img
                      src='/icons/egg_dashboard/checkbox.png'
                      width='24px'
                      height='24px'
                      style={{ marginTop: '20px' }}
                    />
                    <img
                      src='/icons/egg_dashboard/discard_species.png'
                      width='36px'
                      height='36px'
                      style={{ marginTop: '15px', marginLeft: '1px' }}
                    />
                    <Typography
                      sx={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '16px', color: '#839D8D', mt: 5 }}
                    >
                      Rainbow Lorikeet
                    </Typography>
                  </Box>

                  <Box sx={{ width: '292px', height: '56px', borderRadius: '8px', gap: 4, display: 'flex' }}>
                    <img
                      src='/icons/egg_dashboard/checkbox.png'
                      width='24px'
                      height='24px'
                      style={{ marginTop: '20px' }}
                    />
                    <img
                      src='/icons/egg_dashboard/discard_species.png'
                      width='36px'
                      height='36px'
                      style={{ marginTop: '15px', marginLeft: '1px' }}
                    />
                    <Typography
                      sx={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '16px', color: '#839D8D', mt: 5 }}
                    >
                      Rainbow Lorikeet
                    </Typography>
                  </Box>

                  <Box sx={{ width: '292px', height: '56px', borderRadius: '8px', gap: 4, display: 'flex' }}>
                    <img
                      src='/icons/egg_dashboard/checkbox.png'
                      width='24px'
                      height='24px'
                      style={{ marginTop: '20px' }}
                    />
                    <img
                      src='/icons/egg_dashboard/discard_species.png'
                      width='36px'
                      height='36px'
                      style={{ marginTop: '15px', marginLeft: '1px' }}
                    />
                    <Typography
                      sx={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '16px', color: '#839D8D', mt: 5 }}
                    >
                      Rainbow Lorikeet
                    </Typography>
                  </Box> */}
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>{' '}
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
          zIndex: 1234
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <LoadingButton
            sx={{ height: '58px', fontWeight: 500, fontSize: '15px', fontFamily: 'Inter', width: '48%' }}
            variant='outlined'
            size='large'
            // disabled={loader}
            // loading={loading}
            // onClick={handleClearAll} // Add appropriate handler for 'Clear All'
          >
            Clear All
          </LoadingButton>
          <LoadingButton
            sx={{ height: '58px', fontWeight: 500, fontSize: '15px', fontFamily: 'Inter', width: '48%' }}
            variant='contained'
            type='submit'
            size='large'
            // disabled={loader}
            // loading={loading}
          >
            Apply Filter
          </LoadingButton>
        </Box>
      </Box>
      {/* drower */}
    </Drawer>
  )
}
export default EggFilterSlider
