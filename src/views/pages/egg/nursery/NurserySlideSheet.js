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
  Card
} from '@mui/material'
import { Fragment, useContext, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import * as yup from 'yup'

import Icon from 'src/@core/components/icon'
import { AuthContext } from 'src/context/AuthContext'
import { AddNursery, UpdateNursery } from 'src/lib/api/egg/nursery'
import toast from 'react-hot-toast'
import { useTheme } from '@mui/material/styles'

const schema = yup.object().shape({
  nursery_name: yup.string().required('Nursery Name is required').trim().strict(true).min(1, 'Add Nursery Name'),

  site_id: yup.string().required('Select Site')
})

const NurserySlider = ({
  openDrawer,
  setOpenDrawer,
  loading,
  editNurseryId,
  editName,
  editSite,
  callApi,
  fetchTableData
}) => {
  const authData = useContext(AuthContext)
  const theme = useTheme()

  const defaultValues = {
    nursery_name: '',
    site_id: ''
  }

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
          display: 'flex'
        }}
      >
        <LoadingButton fullWidth variant='contained' type='submit' size='large' loading={loading}>
          {editNurseryId ? 'Update Nursery' : 'Add Nursery'}
        </LoadingButton>
      </Box>
    )
  }

  console.log('GetValues >>', getValues())

  useEffect(() => {
    setValue('nursery_name', editName), setValue('site_id', editSite)
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
          toast.success('Nursery updated Successfully')
          setOpenDrawer(false)
          fetchTableData()
          if (callApi) {
            callApi()
          }
        } else {
          toast.error('Unable to update Nursery')
        }
      } else {
        const payload = {
          nursery_name: values?.nursery_name,
          site_id: values?.site_id
        }

        const response = await AddNursery(payload)

        if (response.success) {
          toast.success('Nursery added Successfully')
          setOpenDrawer(false)
          fetchTableData()
          if (callApi) {
            callApi()
          }
        } else {
          toast.error('Unable to add Nursery')
        }
      }
    } catch (error) {
      console.error('Error while adding/updating nursery:', error)
      toast.error('An error occurred while adding/updating nursery')
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
        <Box sx={{ bgcolor: theme.palette.customColors.lightBg, width: '100%', height: '100%' }}>
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
            <Card sx={{ m: 5, px: 3, py: 3, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <FormControl fullWidth sx={{ mt: 4 }}>
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
                <FormControl fullWidth sx={{ mt: 4 }}>
                  <InputLabel error={Boolean(errors?.site_id)} id='site_id'>
                    Site
                  </InputLabel>
                  <Controller
                    name='site_id'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <Select
                        name='site_id'
                        value={value}
                        label='Site *'
                        onChange={onChange}
                        error={Boolean(errors?.site_id)}
                        labelId='site_id'
                      >
                        {authData?.userData?.user?.zoos[0].sites?.map((item, index) => {
                          return (
                            <MenuItem key={index} value={item?.site_id ? item?.site_id : editSite}>
                              {item?.site_name}
                            </MenuItem>
                          )
                        })}
                      </Select>
                    )}
                  />
                  {errors && <FormHelperText sx={{ color: 'error.main' }}>{errors?.site_id?.message}</FormHelperText>}
                </FormControl>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <RenderSidebarFooter />
              </Box>
            </Card>
          </form>
        </Box>
      </Drawer>
    </>
  )
}

export default NurserySlider
