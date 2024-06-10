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
  Typography
} from '@mui/material'
import { Fragment, useContext, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import Icon from 'src/@core/components/icon'
import { AuthContext } from 'src/context/AuthContext'
import { AddNursery, UpdateNursery } from 'src/lib/api/egg/nursery'
import toast from 'react-hot-toast'

const schema = yup.object().shape({
  nursery_name: yup.string().required('Nursery Name is required'),
  site_id: yup.string().required('Select Site')
})

const NurserySlider = ({ setOpenDrawer, loading, editNurseryId, editName, editSite, fetchTableData }) => {
  const authData = useContext(AuthContext)

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
      <Fragment>
        <LoadingButton variant='contained' type='submit' loading={loading}>
          {editNurseryId ? 'Update Nursery' : 'Add Nursery'}
        </LoadingButton>
      </Fragment>
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
      <Drawer anchor='right' open={open} sx={{ '& .MuiDrawer-paper': { width: ['100%', 400] } }}>
        <div>
          <Box
            className='sidebar-header'
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              backgroundColor: 'background.default',
              p: theme => theme.spacing(3, 3.255, 3, 5.255)
            }}
          >
            <Typography variant='h6'>{editNurseryId ? 'Edit Nursery' : 'Add Nursery'}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton size='small' sx={{ color: 'text.primary' }}>
                <Icon icon='mdi:close' fontSize={20} onClick={() => setOpenDrawer(false)} />
              </IconButton>
            </Box>
          </Box>

          {/* drower */}
          <Box className='sidebar-body' sx={{ p: theme => theme.spacing(5, 6) }}>
            <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
              <FormControl fullWidth sx={{ mb: 6 }}>
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
                <FormControl fullWidth sx={{ mb: 6 }}>
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
            </form>
          </Box>
        </div>
      </Drawer>
    </>
  )
}

export default NurserySlider
