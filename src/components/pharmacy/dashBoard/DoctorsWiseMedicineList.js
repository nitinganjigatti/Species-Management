import React from 'react'
import CircularProgress from '@mui/material/CircularProgress'
import { Avatar, Box, Card, Drawer, Grid, IconButton, TextField, Typography } from '@mui/material'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import moment from 'moment'
import Icon from 'src/@core/components/icon'

const DoctorsWiseMedicineList = ({
  openDoctorListDrawer,
  setOpenDoctorListDrawer,
  doctorsList,
  totalCount,
  totalMedicines,
  totalValue,
  loading,
  fromDate,
  toDate,
  statusFilter,
  handleSearchDoctors,
  searchbyDoctorname,
  setsearchbyDoctorname,
  handleDownloadExcel
}) => {
  const handleClose = () => {
    setOpenDoctorListDrawer(false), setsearchbyDoctorname('')
  }

  const capitalizeFirstLetter = string => {
    if (!string) return ''

    return string.charAt(0).toUpperCase() + string.slice(1)
  }

  return (
    <Drawer
      anchor='right'
      open={openDoctorListDrawer}
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
        className='sidebar-header'
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'background.default',
          p: theme => theme.spacing(3, 3.255, 3, 5.255)
        }}
      >
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
          <Icon icon='healthicons:doctor-male-outline' fontSize={30} />

          <Typography sx={{ fontSize: '24px', fontWeight: 500 }}>
            {doctorsList[0]?.doctor_name ? doctorsList[0]?.doctor_name : '-'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }} onClick={handleClose}>
          <IconButton size='small' sx={{ color: 'text.primary' }}>
            <Icon icon='mdi:close' fontSize={24} />
          </IconButton>
        </Box>
      </Box>
      <Box
        sx={{
          '& .MuiDrawer-paper': { width: ['100%', '562px'] },
          backgroundColor: 'background.default',
          height: '100%'
        }}
      >
        <Grid container sx={{ px: 5 }}>
          <Grid item size={{ xs: 8, sm: 8, md: 8 }}>
            <Box
              sx={{
                //bgcolor: '#FFFFFF',
                pt: '16px',
                borderRadius: '8px',
                width: '525px',
                height: '550px',
                overflowY: 'auto',
                '&::-webkit-scrollbar': {
                  width: 0,
                  height: 0
                },
                '-ms-overflow-style': 'none',
                scrollbarWidth: 'none'
              }}
            >
              <Box
                sx={{
                  backgroundColor: '#DAE7DF',
                  borderRadius: '4px',
                  border: '1px solid #c3cec724',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 2,
                  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
                  width: '100%',
                  maxWidth: '800px',
                  mb: 4,
                  height: '70px'
                }}
              >
                <Grid container alignItems='center'>
                  <Grid item>
                    <CalendarTodayIcon
                      sx={{ marginRight: 1, color: '#5F6D55', fontSize: '18px', position: 'relative', top: '-8px' }}
                    />
                  </Grid>
                  <Grid item>
                    <Typography variant='body1' sx={{ fontWeight: '400', color: '#5F6D55', fontSize: '14px' }}>
                      {capitalizeFirstLetter(statusFilter)}
                    </Typography>
                    <Typography variant='body2' sx={{ color: '#3A4736', fontSize: '16px', fontWeight: 500 }}>
                      {moment(fromDate).format('DD MMM YYYY')} - {moment(toDate).format('DD MMM YYYY')}
                    </Typography>
                  </Grid>
                </Grid>

                <IconButton
                  sx={{
                    backgroundColor: '#37BD69',
                    width: '13%',
                    color: '#FFFFFF',
                    '&:hover': { backgroundColor: '#58B06C' },
                    borderRadius: '4px'
                  }}
                  onClick={handleDownloadExcel}
                >
                  <Icon icon='material-symbols:download' />
                </IconButton>
              </Box>
              <>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid #C3CEC7',
                    borderRadius: '4px',
                    padding: '0 8px',
                    height: '50px',
                    mb: 4,
                    bgcolor: '#FFFFFF',
                    position: 'relative'
                  }}
                >
                  <Icon icon='mi:search' sx={{ marginRight: 1 }} />
                  <TextField
                    variant='outlined'
                    placeholder='Search by doctors'
                    value={searchbyDoctorname} // controlled input for search value
                    onChange={e => handleSearchDoctors(e.target.value)} // handle search change
                    InputProps={{
                      disableUnderline: false,
                      endAdornment: searchbyDoctorname && (
                        <IconButton
                          onClick={() => handleSearchDoctors('')} // Clear search value on cancel
                          sx={{ position: 'absolute', right: '-145%' }}
                        >
                          <Icon icon='mdi:close' />
                        </IconButton>
                      )
                    }}
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
              </>
              <Box
                className='sidebar-header'
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'background.default'

                  // p: theme => theme.spacing(3, 3.255, 3, 5.255)
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: '20px', fontWeight: 500 }}>
                    {totalMedicines === 1 ? '1 Medicine' : `${totalMedicines} Medicines`}
                  </Typography>
                </Box>

                <Typography sx={{ fontSize: '20px', fontWeight: 500 }}>
                  {`${totalCount} nos.`} {'( ₹' + totalValue + ' )'}
                </Typography>
              </Box>

              {!loading ? (
                doctorsList &&
                doctorsList.map((all, index) => {
                  return (
                    <Card
                      key={index}
                      sx={{
                        mt: 2,
                        boxShadow: 'none',
                        border: '1px solid #C3CEC7',
                        height: '70px',
                        pl: 5,
                        pr: 5,
                        borderRadius: '8px'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography sx={{ fontSize: '16px', fontWeight: 500, color: '#44544A' }}>
                            {all?.stock_name ? all?.stock_name : '-'}
                          </Typography>
                        </Box>

                        {/* Box to stack requested_count and requested_value vertically */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <Typography sx={{ fontSize: '16px', fontWeight: 500, color: '#44544A' }}>
                            {all?.requested_count + ' nos.'}
                          </Typography>
                          <Typography sx={{ fontSize: '16px', fontWeight: 500, color: '#44544A' }}>
                            {'₹' + (Number(all.requested_value) ? Number(all.requested_value).toFixed(2) : '0.00')}
                          </Typography>
                        </Box>
                      </Box>
                    </Card>
                  )
                })
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Drawer>
  )
}

export default DoctorsWiseMedicineList
