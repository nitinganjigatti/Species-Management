import { yupResolver } from '@hookform/resolvers/yup'
import { LoadingButton } from '@mui/lab'
import {
  Box,
  Drawer,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Card,
  Autocomplete
} from '@mui/material'
import { Fragment, useContext, useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import * as yup from 'yup'

import Icon from 'src/@core/components/icon'
import { AuthContext } from 'src/context/AuthContext'
import { AddNursery, UpdateNursery } from 'src/lib/api/egg/nursery'
import toast from 'react-hot-toast'
import { useTheme } from '@mui/material/styles'
import Toaster from 'src/components/Toaster'

const NurserySlider = ({
  openDrawer,
  setOpenDrawer,
  loading,
  editNurseryId,
  editName,
  editSite,
  editSiteName,
  callApi,
  fetchTableData
}) => {
  const [defaultSite, setDefaultSite] = useState(null)
  const authData = useContext(AuthContext)
  const theme = useTheme()

  const defaultValues = {
    nursery_name: '',
    site_id: ''
  }

  const schema = yup.object().shape({
    nursery_name: yup.string().trim().required('Nursery Name is required'),

    site_id: yup.string().required('Site is required')
  })

  const {
    control,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

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
          bgcolor: 'white',
          alignItems: 'center',
          justifyContent: 'center',
          display: 'flex',
          zIndex: 1234
        }}
      >
        <LoadingButton fullWidth variant='contained' type='submit' size='large' loading={loading}>
          {editNurseryId ? 'Update Nursery' : 'Add Nursery'}
        </LoadingButton>
      </Box>
    )
  }

  // console.log('GetValues >>', getValues())

  useEffect(() => {
    setValue('nursery_name', editName), setValue('site_id', editSite)
    if (editSite && editSiteName) {
      setDefaultSite({ site_name: editSiteName, site_id: editSite })
    }
  }, [editNurseryId])

  const onSubmit = async values => {
    try {
      if (editNurseryId) {
        const payload = {
          nursery_name: values?.nursery_name,
          site_id: values?.site_id
        }
        const response = await UpdateNursery(editNurseryId, payload)
        if (response.success) {
          // toast.success('Nursery updated Successfully')
          setOpenDrawer(false)
          if (fetchTableData) {
            fetchTableData()
          }

          if (callApi) {
            callApi()
          }
          Toaster({ type: 'success', message: response.message })
        } else {
          Toaster({ type: 'error', message: response.message })
        }
      } else {
        const payload = {
          nursery_name: values?.nursery_name,
          site_id: values?.site_id
        }

        const response = await AddNursery(payload)

        if (response.success) {
          setOpenDrawer(false)
          if (fetchTableData) {
            fetchTableData()
          }

          if (callApi) {
            callApi()
          }
          Toaster({ type: 'success', message: response.message })
        } else {
          Toaster({ type: 'error', message: response.message })
        }
      }
    } catch (error) {
      console.error('Error while adding/updating nursery:', error)
      Toaster({ type: 'error', message: 'An error occurred while adding/updating nursery' })
    }
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

              bgcolor: theme.palette.customColors.lightBg
            }}
          >
            <Box sx={{ gap: 2, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              <Icon
                style={{ marginLeft: -8 }}
                icon='material-symbols-light:add-notes-outline-rounded'
                fontSize={'32px'}
              />
              <Typography variant='h6'>{editNurseryId ? 'Edit Nursery' : 'Add Nursery'}</Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton size='small' onClick={() => setOpenDrawer(false)} sx={{ color: 'text.primary' }}>
                <Icon icon='mdi:close' fontSize={20} onClick={() => setOpenDrawer(false)} />
              </IconButton>
            </Box>
          </Box>

          {/* drower */}

          <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
            <Box
              sx={{
                m: 5,
                px: '16px',
                // py: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                backgroundColor: '#fff',
                borderRadius: '5px',
                boxShadow: 'none',
                border: '1px solid #C3CEC7'
              }}
            >
              <FormControl fullWidth sx={{ mt: 6, borderRadius: '5px' }}>
                <Controller
                  name='nursery_name'
                  control={control}
                  rules={{ required: !editNurseryId }}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      label='Nursery Name*'
                      value={value}
                      onChange={onChange}
                      focused={value !== ''}
                      placeholder='Nursery Name'
                      error={Boolean(errors.nursery_name)}
                      name='nursery_name'
                    />
                  )}
                />
                {errors?.nursery_name && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.nursery_name?.message}</FormHelperText>
                )}
              </FormControl>

              {authData?.userData?.user?.zoos[0]?.sites.length > 0 && (
                <FormControl fullWidth sx={{ borderRadius: '5px' }}>
                  {/* <InputLabel error={Boolean(errors?.site_id)} id='site_id'>
                    Site
                  </InputLabel> */}
                  <Controller
                    name='site_id'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      // <Select
                      //   name='site_id'
                      //   value={value}
                      //   label='Site *'
                      //   onChange={onChange}
                      //   error={Boolean(errors?.site_id)}
                      //   labelId='site_id'
                      // >
                      //   {authData?.userData?.user?.zoos[0].sites?.map((item, index) => {
                      //     return (
                      //       <MenuItem key={index} value={item?.site_id ? item?.site_id : editSite}>
                      //         {item?.site_name}
                      //       </MenuItem>
                      //     )
                      //   })}
                      // </Select>
                      <Autocomplete
                        name='site_id'
                        value={defaultSite}
                        disablePortal
                        id='site_id'
                        options={authData?.userData?.user?.zoos[0].sites}
                        getOptionLabel={option => option.site_name}
                        isOptionEqualToValue={(option, value) => option?.site_id === value?.site_id}
                        onChange={(e, val) => {
                          if (val === null) {
                            setDefaultSite(null)

                            return onChange('')
                          } else {
                            setDefaultSite(val)

                            // console.log('val', val)
                            setValue('site_id', '')

                            return onChange(val.site_id)
                          }
                        }}
                        renderInput={params => (
                          <TextField
                            // onChange={e => {
                            //   searchRoom(defaultNursery.nursery_id, e.target.value)
                            // }}
                            {...params}
                            label='Site *'
                            placeholder='Search & Select'
                            error={Boolean(errors.site_id)}
                          />
                        )}
                      />
                    )}
                  />
                  {errors && <FormHelperText sx={{ color: 'error.main' }}>{errors?.site_id?.message}</FormHelperText>}
                </FormControl>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <RenderSidebarFooter />
              </Box>
            </Box>
          </form>
        </Box>
      </Drawer>
    </>
  )
}

export default NurserySlider
