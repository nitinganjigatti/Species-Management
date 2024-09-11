import {
  Drawer,
  Typography,
  IconButton,
  Tab,
  Chip,
  Divider,
  Stack,
  TextField,
  Tooltip,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import { Box } from '@mui/system'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import { LoadingButton, TabContext, TabList, TabPanel } from '@mui/lab'
import { useState } from 'react'
import DashboardFilter from './dashboardFilter'

const DiscardEggSlider = ({ openDiscard, setOpenDiscard }) => {
  const theme = useTheme()
  const [tabStatus, setTabStatus] = useState('site_wise')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const [selectedDropDown, setSelectedDropDown] = useState('Last 3 days')

  const handleDropDownChange = event => {
    setSelectedDropDown(event.target.value)
  }

  const handleTabChange = (event, value) => {
    console.log('value :>> ', value)
    setTabStatus(value)
  }

  const TabBadge = ({ label, totalCount }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between' }}>
      {label}
      {totalCount ? (
        <Chip sx={{ ml: '6px', fontSize: '12px' }} size='small' label={totalCount} color='secondary' />
      ) : null}
    </div>
  )

  const TabHeader = () => {
    return (
      <Box sx={{ bgcolor: '#fff' }}>
        <Stack
          direction='row'
          sx={{
            width: '562px',
            height: '60px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: '16px'
          }}
        >
          <Box>
            <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#44544A' }}>Discarded eggs (Count)</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: '12px' }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                width: '34px',
                height: '36px',
                border: 1,
                borderRadius: '6px',
                borderColor: '#c3cec7',

                bgcolor: isSearchOpen ? theme?.palette.primary.dark : null,

                alignItems: 'center',
                cursor: 'pointer'
              }}
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Icon icon='bitcoin-icons:search-filled' fontSize={18} color={isSearchOpen ? '#fff' : 'Black'} />
            </Box>
            <FormControl variant='outlined' sx={{ height: '36px' }}>
              <Select
                labelId='dropdown-label'
                id='dropdown'
                value={selectedDropDown}
                onChange={handleDropDownChange}
                sx={{ height: '36px' }}
              >
                <MenuItem value='Last 3 days'>Last 3 days</MenuItem>
                <MenuItem value='Last 7 days'>Last 7 days</MenuItem>
                <MenuItem value='Last 30 days'>Last 30 days</MenuItem>
              </Select>
            </FormControl>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                width: '34px',
                height: '36px',
                border: 1,
                borderRadius: '6px',
                borderColor: '#c3cec7',

                bgcolor: isFilterOpen ? theme?.palette.primary.dark : null,
                alignItems: 'center',
                cursor: 'pointer'
              }}
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <Icon icon='mynaui:filter' fontSize={18} color={isFilterOpen ? '#fff' : 'Black'} />
            </Box>
          </Box>
        </Stack>
        {(isFilterOpen || isSearchOpen) && (
          <Box sx={{ px: '16px' }}>
            {isSearchOpen && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid #C3CEC7',

                  borderRadius: '4px',
                  bgcolor: '#f2fff8',
                  padding: '0 8px',
                  height: '56px',
                  mb: 3
                }}
              >
                <Icon icon='mi:search' fontSize={20} />
                <TextField
                  variant='outlined'
                  placeholder='Search'
                  // value={searchQuery}
                  InputProps={{
                    disableUnderline: true
                  }}
                  // onChange={e => {
                  //   setSearchQuery(e.target.value)
                  //   handleSearch(e.target.value)

                  //   router.push({ query: { ...router.query, search_value: e.target.value } }, undefined, { shallow: true })
                  // }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      border: 'none',
                      padding: '0',

                      '& fieldset': {
                        border: 'none'
                      }
                    }
                  }}
                />
              </Box>
            )}

            {isFilterOpen && (
              <Box sx={{ mt: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', gap: '12px', mb: 2, overflowX: 'auto', scrollbarWidth: 'none' }}>
                  {filterList?.length > 0 &&
                    filterList?.map((item, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: '6px',
                          p: '8px',
                          py: '12px',
                          bgcolor: '#dae7df',
                          borderRadius: '8px',
                          height: '35px'
                        }}
                      >
                        <Typography
                          sx={{ fontSize: '14px', fontWeight: 'bold', color: '#000000', textTransform: 'capitalize' }}
                        >
                          {item?.name}

                          {/* asdfgh */}
                        </Typography>{' '}
                        {/* <IconButton onClick={() => handleRemoveFilter(item)}> */}
                        <Icon icon='mdi:close' fontSize={18} color={'#1F515B'} />
                        {/* </IconButton> */}
                      </Box>
                    ))}
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Box>
    )
  }

  const Card = () => {
    return (
      <Box
        sx={{
          m: '16px',
          mt: 3,
          bgcolor: 'white',
          px: '20px',
          py: '16px',
          borderRadius: '8px',
          border: '1px solid #C3CEC7'
        }}
      >
        <Box sx={{ display: 'flex', gap: 4, mb: 4, mb: 4, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <Avatar
              variant='rounded'
              alt='Medicine Image'
              sx={{
                width: 35,
                height: 35,
                mr: 4,
                borderRadius: '50%',
                background: '#E8F4F2',
                overflow: 'hidden'
              }}
            >
              {/* {params.row.default_icon ? ( */}
              {/* <img
                  style={{ width: '100%', height: '100%' }}
                  src={params.row.default_icon}
                  alt='Profile'
                />
              ) : ( */}
              <Icon icon='mdi:user' />
              {/* )} */}
            </Avatar>

            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Box sx={{ display: 'flex', width: 250, gap: 4 }}>
                <Typography
                  sx={{
                    color: '#000000',
                    fontSize: '16px',
                    fontWeight: '500',
                    lineHeight: '19.36px',
                    overflow: 'hidden',

                    // textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    boxSizing: 'border-box'
                  }}
                >
                  {/* {params.row.complete_name ? Utility?.toPascalSentenceCase(params.row.complete_name) : '-'} */}{' '}
                  0000
                </Typography>

                <Box
                  sx={{
                    borderRadius: '4px',
                    px: 3,

                    // width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#FFD3D3'

                    // backgroundColor:
                    //   egg_status === 'Rotten'
                    //     ? '#FFD3D3'
                    //     : egg_status === 'Cracked'
                    //     ? '#fdfad7'
                    //     : egg_status === 'Discard'
                    //     ? '#FFD3D3'
                    //     : egg_status === 'Thin-Shelled'
                    //     ? '#E8F4F2'
                    //     : egg_status === 'Fertile'
                    //     ? '#E8F4F2'
                    //     : '#E1F9ED'
                  }}
                >
                  <Typography
                    sx={{
                      // color:
                      //   egg_status === 'Fresh'
                      //     ? '#006D35'
                      //     : egg_status === 'Rotten'
                      //     ? '#FA6140'
                      //     : egg_status === 'Cracked'
                      //     ? '#E4B819'
                      //     : egg_status === 'Discard'
                      //     ? '#fa6140'
                      //     : egg_status === 'Hatched'
                      //     ? '#32bfdd'
                      //     : egg_status === 'Thin-Shelled'
                      //     ? '#1F515B'
                      //     : '#006D35',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Rotten
                  </Typography>
                </Box>
              </Box>

              <Tooltip

              // title={
              //   params.row?.default_common_name
              //     ? Utility?.toPascalSentenceCase(params.row.default_common_name)
              //     : '-'
              // }
              >
                <Typography
                  sx={{
                    color: '#1F415B',
                    fontSize: '16px',
                    fontWeight: 500,
                    lineHeight: '16.94px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    width: '240px'
                  }}
                >
                  {/* {params.row?.default_common_name
                    ? Utility?.toPascalSentenceCase(params.row.default_common_name)
                    : '-'} */}
                  asdfghjk
                </Typography>
              </Tooltip>
            </Box>
          </Box>
          <Box>
            <Typography>checked</Typography>
          </Box>
        </Box>
        <Divider />
        <Stack sx={{ mt: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography sx={{ width: 120, fontWeight: 400, fontSize: '14px', color: '#1F415B' }}>
              Discarded On
            </Typography>
            <Typography sx={{ fontWeight: 400, fontSize: '14px', color: '#1F415B' }}>
              : &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Date
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography sx={{ width: 120, fontWeight: 400, fontSize: '14px', color: '#1F415B' }}>Batch</Typography>
            <Typography sx={{ fontWeight: 400, fontSize: '14px', color: '#1F415B' }}>
              : &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; -
            </Typography>
          </Box>{' '}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography sx={{ width: 120, fontWeight: 400, fontSize: '14px', color: '#1F415B' }}>AID</Typography>
            <Typography sx={{ fontWeight: 400, fontSize: '14px', color: '#1F415B' }}>
              : &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; -
            </Typography>
          </Box>{' '}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography sx={{ width: 120, fontWeight: 400, fontSize: '14px', color: '#1F415B' }}>EID</Typography>
            <Typography sx={{ fontWeight: 400, fontSize: '14px', color: '#1F415B' }}>
              : &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; -
            </Typography>
          </Box>{' '}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography sx={{ width: 120, fontWeight: 400, fontSize: '14px', color: '#1F415B' }}>
              {tabStatus === 'site_wise' ? 'Site' : 'Nursery'}
            </Typography>
            <Typography sx={{ fontWeight: 400, fontSize: '14px', color: '#1F415B' }}>
              : &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; -
            </Typography>
          </Box>{' '}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography sx={{ width: 120, fontWeight: 400, fontSize: '14px', color: '#1F415B' }}>Reason</Typography>
            <Typography sx={{ fontWeight: 400, fontSize: '14px', color: '#1F415B' }}>
              : &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; -
            </Typography>
          </Box>
        </Stack>
      </Box>
    )
  }

  const handelOnclose = () => {
    setOpenDiscard(false)
  }

  return (
    <>
      <Drawer
        anchor='right'
        open={openDiscard}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': { width: ['100%', '562px'] },
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '8px',

          gap: '24px'
        }}
      >
        {/* Header  */}
        <Box
          className='sidebar-header'
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#EFF5F2',
            height: '80px',
            p: theme => theme.spacing(3, 3.255, 3, 5.255)
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
            <img src='/icons/egg_dashboard/discard.png' alt='icon' width='32' height='32' />

            <Typography variant='h6'>Discard Details</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <IconButton size='small' sx={{ color: 'text.primary' }}>
              <Icon icon='mdi:close' fontSize={20} onClick={() => handelOnclose()} />
            </IconButton>
          </Box>
        </Box>

        {/* Tabs */}
        <Box sx={{ backgroundColor: '#FFFF' }}>
          <TabContext value={tabStatus}>
            <TabList onChange={handleTabChange}>
              <Tab
                sx={{ width: '280px', fontWeight: 600, fontSize: '14px' }}
                value='site_wise'
                label={<TabBadge label='SITE WISE (count)' />}
              />
              <Tab
                sx={{ width: '280px', fontWeight: 600, fontSize: '14px' }}
                value='nursery_wise'
                label={<TabBadge label='NURSERY WISE (count)' />}
              />
            </TabList>
            <TabPanel value='site_wise' sx={{ p: 0 }}>
              {' '}
              <Divider />
              {TabHeader()}
              <Box sx={{ bgcolor: '#eff5f2', py: 1, height: 420 }}>
                <Card />
              </Box>
            </TabPanel>
            <TabPanel value='nursery_wise' sx={{ p: 0 }}>
              {' '}
              <Divider />
              {TabHeader()}
              <Box sx={{ bgcolor: '#eff5f2', py: 1, height: 420 }}>
                <Card />
              </Box>
            </TabPanel>
          </TabContext>
        </Box>

        {/* bottom buttons */}
        <Box
          sx={{
            height: '122px',
            width: '100%',
            maxWidth: '562px',
            position: 'fixed',
            bottom: 0,
            px: 4,
            bgcolor: 'white',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            display: 'flex',

            boxShadow: '0px -4px 10px rgba(0, 0, 0, 0.1)',
            zIndex: 123
          }}
        >
          <LoadingButton
            fullWidth
            variant='contained'
            size='large'
            sx={{ height: '58px' }}

            // onClick={handleApplyFilter}
          >
            VIEW DETAILS
          </LoadingButton>
        </Box>
      </Drawer>
      {isFilterOpen && <DashboardFilter isFilterOpen={isFilterOpen} setIsFilterOpen={setIsFilterOpen} />}
    </>
  )
}

export default DiscardEggSlider

const filterList = [
  { name: 'asdfgaaaaaaaaaaaaaaaaaa' },
  { name: 'werrrrr' },
  { name: 'asdfgh' },
  { name: 'asdfgn' },
  { name: 'sdfgn' },
  { name: 'wert' },
  { name: 'asdfg' },
  { name: 'asdfg' },
  { name: 'werrrrr' },
  { name: 'asdfgh' },
  { name: 'asdfgn' },
  { name: 'sdfgn' },
  { name: 'wert' },
  { name: 'asdfg' }
]
