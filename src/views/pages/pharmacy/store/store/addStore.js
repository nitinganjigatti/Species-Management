// ** React Imports
import { useState, useEffect, useCallback, Fragment, useContext } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'

import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { LoadingButton } from '@mui/lab'
import { useRouter } from 'next/router'
import { RadioGroup, FormLabel, FormControlLabel, Radio, InputLabel, Select, MenuItem, Button } from '@mui/material'

import { useForm, Controller } from 'react-hook-form'

import Icon from 'src/@core/components/icon'
import { getStoreById } from 'src/lib/api/pharmacy/getStoreList'

import { AuthContext } from 'src/context/AuthContext'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'

const schema = yup.object().shape({
  name: yup
    .string()
    .transform(value => (value ? value.trim() : value))
    .min(3, 'Pharmacy name must contain at least 3 characters')
    .required('Pharmacy Name is Required'),

  // type: yup.string().required('Type is Required'),
  site_id: yup.array(),
  status: yup.string().required('Status is Required')
})

const defaultValues = {
  name: '',
  type: '',
  site_id: [],
  latitude: '',
  logitude: '',
  status: 'active'
}

const AddStore = props => {
  const {
    addEventSidebarOpen,
    handleSidebarClose,
    handleSubmitData,
    resetForm,
    submitLoader,
    editParams,
    pharmacyList,
    totalStores
  } = props

  const [values, setValues] = useState(defaultValues)

  const authData = useContext(AuthContext)

  // const router = useRouter()
  // const { id, action } = router.query

  // const handleSidebarClose = () => {
  //   setOpenSidebar(false)
  // }

  const {
    reset,
    control,
    setValue,
    clearErrors,
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
    const { name, type, site_id, latitude, logitude, status } = { ...params }

    const payload = {
      name,
      type,
      site_id: site_id?.map(item => item?.value),
      latitude,
      logitude,
      status
    }
    await handleSubmitData(payload)
  }

  const getStore = useCallback(
    async id => {
      const response = await getStoreById(id)
      if (response?.success) {
        const data = {
          ...response?.data,
          site_id: response?.data?.site_ids?.map(site => ({ label: site?.label, value: site?.value }))
        }
        reset(data)
      } else {
      }
    },
    [reset]
  )

  useEffect(() => {
    if (resetForm) {
      reset(defaultValues)
    }
    if (editParams?.id !== null) {
      getStore(editParams?.id)
    }
  }, [resetForm, editParams, reset, getStore])

  const RenderSidebarFooter = () => {
    return (
      <Fragment>
        <LoadingButton size='large' type='submit' variant='contained' loading={submitLoader}>
          Submit
        </LoadingButton>
      </Fragment>
    )
  }

  const siteOptions = authData?.userData?.user?.zoos[0].sites.map(site => ({
    label: site.site_name,
    value: site.site_id
  }))

  return (
    <Drawer
      anchor='right'
      open={addEventSidebarOpen}
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
        <Typography variant='h6'>{editParams?.id !== null ? 'Edit' : 'Add'} Pharmacy</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            size='small'
            onClick={() => {
              reset(defaultValues)
              handleSidebarClose()
            }}
            sx={{ color: 'text.primary' }}
          >
            <Icon icon='mdi:close' fontSize={20} />
          </IconButton>
        </Box>
      </Box>
      <Box className='sidebar-body' sx={{ p: theme => theme.spacing(5, 6) }}>
        <form autoComplete='off' onSubmit={!submitLoader ? handleSubmit(onSubmit) : null}>
          <ControlledTextField
            name='name'
            control={control}
            label='Pharmacy Name'
            placeholder='Pharmacy Name'
            errors={errors}
            required
            sx={{ mb: 6 }}
          />

          {authData?.userData?.user?.zoos[0]?.sites.length > 0 && (
            <ControlledAutocomplete
              sx={{ mb: 6 }}
              name='site_id'
              label='Select sites'
              control={control}
              errors={errors}
              options={siteOptions}
              multiple
              getOptionLabel={option => option.label}
              isOptionEqualToValue={(option, value) => option.value === value?.value}
            />
          )}

          <ControlledTextField
            name='latitude'
            control={control}
            label='Latitude'
            placeholder='Latitude'
            errors={errors}
            required
            sx={{ mb: 6 }}
          />
          <ControlledTextField
            name='logitude'
            control={control}
            label='Longitude'
            placeholder='Longitude'
            errors={errors}
            required
            sx={{ mb: 6 }}
          />

          {editParams?.id !== null && watch('type') === 'local' ? (
            <FormControl fullWidth sx={{ mb: 6 }} error={Boolean(errors.radio)}>
              <FormLabel>Status</FormLabel>
              <Controller
                name='status'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <RadioGroup row {...field} aria-label='gender' name='validation-basic-radio'>
                    <FormControlLabel
                      value='active'
                      label='Active'
                      sx={errors.status ? { color: 'error.main' } : null}
                      control={<Radio sx={errors.status ? { color: 'error.main' } : null} />}
                    />
                    <FormControlLabel
                      value='inactive'
                      label='Inactive'
                      sx={errors.status ? { color: 'error.main' } : null}
                      control={<Radio sx={errors.status ? { color: 'error.main' } : null} />}
                    />
                  </RadioGroup>
                )}
              />
              {errors.radio && (
                <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-radio'>
                  This field is required
                </FormHelperText>
              )}
            </FormControl>
          ) : null}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <RenderSidebarFooter />
          </Box>
        </form>
      </Box>
    </Drawer>
  )
}

export default AddStore
