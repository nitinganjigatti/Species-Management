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
import { useTranslation } from 'react-i18next'

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

interface Props {
  addEventSidebarOpen: boolean
  handleSidebarClose: (...args: any[]) => void
  handleSubmitData: (...args: any[]) => void
  resetForm: any
  submitLoader: boolean
  editParams: any
}

const AddEditDropPoint = (props: Props) => {
  const { addEventSidebarOpen, handleSidebarClose, handleSubmitData, resetForm, submitLoader, editParams } = props
  const { t } = useTranslation()
  const authData = useContext(AuthContext)
  const allSites = authData?.userData?.user?.zoos?.[0]?.sites || []
  const sites = React.useMemo(() => {
    return Array.from(new Map(allSites.map((site: any) => [site.site_id, site])).values())
  }, [allSites])

  const {
    reset,
    control,
    watch,
    handleSubmit,
    formState: { errors }
  } = useForm<any>({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  const onSubmit = async (params: any) => {
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
      const matchingSite = (sites as any[]).find(site => String(site.site_id) === String(editParams.site_id))
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
          p: (theme: any) => theme.spacing(3, 3.255, 3, 5.255)
        }}
      >
        <Typography variant='h6'>
          {editParams?.id ? t('update') : t('add')} {t('diet_module.drop_point')}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton size='small' onClick={handleSidebarClose} sx={{ color: 'text.primary' }}>
            <Icon icon='mdi:close' fontSize={20} />
          </IconButton>
        </Box>
      </Box>

      <Box className='sidebar-body' sx={{ p: (theme: any) => theme.spacing(5, 6) }}>
        <form autoComplete='off' onSubmit={!submitLoader ? handleSubmit(onSubmit) : undefined}>
          <FormControl fullWidth sx={{ mb: 6 }} error={Boolean(errors.site_id)}>
            <Controller
              name='site_id'
              control={control}
              render={({ field: { value, onChange } }: any) => (
                <Autocomplete
                  options={sites as any[]}
                  disabled={editParams?.meal_group_count > 0}
                  getOptionLabel={(option: any) => option?.site_name || ''}
                  value={(sites as any[]).find(site => String(site.site_id) === String(value)) || null}
                  onChange={(_: any, newValue: any) => {
                    onChange(newValue?.site_id || '')
                  }}
                  isOptionEqualToValue={(option: any, val: any) => String(option.site_id) === String(val.site_id)}
                  renderOption={(props: any, option: any) => (
                    <li {...props} key={option.site_id}>
                      {option.site_name}
                    </li>
                  )}
                  renderInput={(params: any) => (
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
                      placeholder={t('diet_module.select_site')}
                    />
                  )}
                />
              )}
            />
          </FormControl>

          <ControlledTextField
            name='drop_point_name'
            label={t('diet_module.drop_point_name')}
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
