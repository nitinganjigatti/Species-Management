import { useCallback, useEffect, useState } from 'react'
import { Box, Button, CircularProgress, Drawer, Grid, IconButton, Typography, useTheme } from '@mui/material'
import Icon from 'src/@core/components/icon'
import { FilterButton } from 'src/views/utility/render-snippets'
import Search from 'src/views/utility/Search'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import { debounce } from 'lodash'
import { getHospitalStaff } from 'src/lib/api/hospital/staff'
import { useForm } from 'react-hook-form'
const DoctorsDrawer = ({ open, setOpen, onSelectDoctor, hospitalId}) => {
  const theme = useTheme()
  const { setValue } = useForm()
  const [searchValue, setSearchValue] = useState('')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [doctors, setDoctors] = useState([])

  const getUserLists = async (query = '') => {
    setLoading(true)
    try {
      const params = {}
      if (query.trim() !== '') {
        params.q = query
      }
      await getHospitalStaff({ params: { hospital_id: hospitalId, is_hospital_chief_doctor: '1',...params } }).then(res => {
        console.log(res)
        if (res?.success === true) {

          setDoctors(
             res?.data?.records.map(item => ({
              name: item?.user_full_name,
              id: item?.user_id,
              default_icon: item?.user_profile_pic,
              role_name: item?.role_name,
            }))
          )
        } else {
          setDoctors([])
        }
      })
    } catch (error) {
      console.log('user error', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    getUserLists()
  }, [])

  const debouncedSearch = useCallback(
    debounce(query => {
      getUserLists(query)
    }, 1000),
    []
  )

  const handleSearchChange = value => {
    setSearchValue(value)
    debouncedSearch(value)
  }

  const handleClearSearch = () => {
    setSearchValue('')
    getUserLists()
  }

  const onSave = () => {
    if (selected) {
      onSelectDoctor(selected)
      setOpen(false)
      
    }
  }
  
  useEffect(() => {
  if (doctors.length === 1) {
    const singleDoctor = doctors[0]
    setSelected(singleDoctor)
    
    setValue('doctors', singleDoctor)
  }
}, [doctors])

  return (
    <>
      <Drawer
        anchor='right'
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', sm: '80%', md: 560 },

              // height: '100vh',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'customColors.Background',
              p: 0
            }
          }
        }}
      >
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 1,
            backgroundColor: 'customColors.Background',
            pb: 0
          }}
        >
          <Box
            sx={{
              px: 4,
              pt: 4,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'customColors.Background'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <img src='/icons/Activity.svg' alt='Activity' />
              <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
                Select Chief Veterinarian
              </Typography>
            </Box>
            <IconButton onClick={() => setOpen(false)}>
              <Icon icon='mdi:close' />
            </IconButton>
          </Box>
          <Grid container spacing={2} alignItems='center' sx={{ pt: 4, pb: 4, px: 4 }}>
            <Grid item size={{ xs: 12, sm: 12 }}>
              <Search
                width='100%'
                placeholder='Search by name'
                value={searchValue}
                onChange={e => handleSearchChange(e.target.value)}
                onClear={handleClearSearch}
                inputStyle={{ py: '18px', px: '12px' }}
                sx={{ backgroundColor: theme.palette.customColors.OnPrimary }}
              />
            </Grid>
            <Grid
              item
              size={{ xs: 12, sm: 1.5 }}
              sx={{
                display: 'none',
                justifyContent: { xs: 'flex-end', sm: 'center' },
                mt: { xs: 2, sm: 0 }
              }}
            >
              <FilterButton />
            </Grid>
          </Grid>
        </Box>

        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            background: theme.palette.customColors.bodyBg,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            minHeight: 0,
            py: 1,
            px: 4
          }}
        >
          {loading ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress />
              </Box>
            </>
          ) : (
            <>
              {doctors?.map(doctor => (
                <Box
                  key={doctor?.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 3,
                    background: theme.palette.customColors.OnPrimary,
                    borderRadius: 1,
                    cursor: 'pointer',
                    border: selected=== doctor ? `2px solid ${theme.palette.primary.main}` : `2px solid transparent`,
                    transition: 'border-color 0.2s'
                  }}
                  onClick={() => setSelected(doctor)}
                >
                  <UserAvatarDetails user_name={doctor?.name} profile_image={doctor?.default_icon} size='large' />
                  {selected?.id === doctor?.id && (
                    <Icon icon='mdi:check-circle' color={theme.palette.primary.main} style={{ fontSize: 20 }} />
                  )}
                </Box>
              ))}
            </>
          )}
        </Box>
        <Box
          sx={{
            position: 'sticky',
            bottom: 0,
            left: 0,
            width: '100%',
            p: 5,
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            zIndex: 1,
            boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.06)',
            flexShrink: 0
          }}
        >
          <Button
            variant='contained'
            fullWidth
            color='primary'
            onClick={onSave}
            sx={{ p: 3, fontWeight: 600 }}
            disabled={selected=== null}
          >
            ADD
          </Button>
        </Box>
      </Drawer>
    </>
  )
}

export default DoctorsDrawer
