import React, { useEffect, useContext, Fragment } from 'react'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { LoadingButton } from '@mui/lab'
import { useForm, Controller } from 'react-hook-form'
import Icon from 'src/@core/components/icon'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import { Autocomplete, TextField } from '@mui/material'
import { AuthContext } from 'src/context/AuthContext'

const schema = yup.object().shape({
  drop_point_name: yup
    .string()
    .transform(value => (value ? value.trim() : value))
    .required('Drop Point Name is required'),
  site_id: yup.string().required('Site is required')
})

const defaultValues = {
  drop_point_name: '',
  site_id: ''
}

const AddEditDropPoint = props => {
  const { addEventSidebarOpen, handleSidebarClose, handleSubmitData, resetForm, submitLoader, editParams } = props

  const authData = useContext(AuthContext)
  const sites = authData?.userData?.user?.zoos?.[0]?.sites || []

  const {
    reset,
    control,
    watch,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  const onSubmit = async params => {
    const { drop_point_name, site_id } = params

    const formData = new FormData()
    formData.append('drop_point_name', drop_point_name.trim())
    formData.append('site_id', site_id)

    if (editParams?.id) {
      formData.append('drop_point_id', editParams.id)
      console.log('Edit mode - drop_point_id:', editParams.id)
    }

    // Debug: Log all FormData entries
    console.log('FormData contents:')
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ' + pair[1])
    }

    await handleSubmitData(formData)
  }

  useEffect(() => {
    reset()
    if (resetForm) {
      reset(defaultValues)
    }
    if (editParams?.id) {
      console.log('Resetting form with editParams:', editParams)
      console.log('Available sites:', sites)
      const matchingSite = sites.find(site => String(site.site_id) === String(editParams.site_id))
      console.log('Matching site found:', matchingSite)
      reset({
        drop_point_name: editParams.drop_point_name || '',
        site_id: editParams.site_id || ''
      })
    }
  }, [resetForm, editParams, reset, sites])

  const RenderSidebarFooter = () => {
    return (
      <Fragment>
        <LoadingButton
          disabled={!watch('drop_point_name') || !watch('site_id')}
          size='large'
          type='submit'
          variant='contained'
          loading={submitLoader}
        >
          {editParams?.id ? 'Update' : 'Add'}
        </LoadingButton>
      </Fragment>
    )
  }

  return (
    <Drawer
      anchor='right'
      open={addEventSidebarOpen}
      onClose={handleSidebarClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: ['100%', 400] } }}
    >
      <Box
        className='sidebar-header'
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          backgroundColor: 'background.default',
          p: theme => theme.spacing(3, 3.255, 3, 5.255)
        }}
      >
        <Typography variant='h6'>{editParams?.id ? 'Update' : 'Add'} Drop Point</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton size='small' onClick={handleSidebarClose} sx={{ color: 'text.primary' }}>
            <Icon icon='mdi:close' fontSize={20} />
          </IconButton>
        </Box>
      </Box>

      <Box className='sidebar-body' sx={{ p: theme => theme.spacing(5, 6) }}>
        <form autoComplete='off' onSubmit={!submitLoader ? handleSubmit(onSubmit) : null}>
          <FormControl fullWidth sx={{ mb: 6 }} error={Boolean(errors.site_id)}>
            <Controller
              name='site_id'
              control={control}
              render={({ field: { value, onChange } }) => (
                <Autocomplete
                  options={sites}
                  disabled={editParams?.meal_group_count > 0}
                  getOptionLabel={option => option?.site_name || ''}
                  value={sites.find(site => String(site.site_id) === String(value)) || null}
                  onChange={(_, newValue) => {
                    onChange(newValue?.site_id || '')
                  }}
                  isOptionEqualToValue={(option, val) => String(option.site_id) === String(val.site_id)}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label='Site'
                      required
                      error={Boolean(errors.site_id)}
                      helperText={
                        editParams?.meal_group_count > 0
                          ? 'Site cannot be changed as meal groups are assigned'
                          : errors.site_id?.message
                      }
                      placeholder='Select Site'
                    />
                  )}
                />
              )}
            />
          </FormControl>

          <ControlledTextField
            name='drop_point_name'
            label='Drop Point Name'
            control={control}
            errors={errors}
            required={true}
            inputProps={{ placeholder: 'Enter Drop Point Name' }}
            sx={{ mb: 6 }}
          />

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <RenderSidebarFooter />
          </Box>
        </form>
      </Box>
    </Drawer>
  )
}

export default React.memo(AddEditDropPoint)
