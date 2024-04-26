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
import { RadioGroup, FormLabel, FormControlLabel, Radio, InputLabel, Select, MenuItem } from '@mui/material'

// ** Third Party Imports
import { useForm, Controller } from 'react-hook-form'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { getStoreById } from 'src/lib/api/pharmacy/getStoreList'

// ** auth context

import { AuthContext } from 'src/context/AuthContext'

// ** Styled Components

const schema = yup.object().shape({
  name: yup
    .string()
    .transform(value => (value ? value.trim() : value))
    .min(3, 'Pharmacy name must contain at least 3 characters')
    .required('Pharmacy Name is Required'),

  // type: yup.string().required('Type is Required'),
  site_id: yup.string().nullable(),
  status: yup.string().required('Status is Required')
})

const defaultValues = {
  name: '',
  type: '',
  site_id: '',
  latitude: '',
  logitude: '',
  status: 'active'
}

const AddStore = props => {
  // ** Props
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

  // ** States
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
      site_id,
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
        reset(response.data)
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
          <FormControl fullWidth sx={{ mb: 6 }}>
            <Controller
              name='name'
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <TextField
                  label='Pharmacy Name*'
                  value={value}
                  onChange={onChange}
                  placeholder='Pharmacy Name'
                  error={Boolean(errors.name)}
                  name='name'
                />
              )}
            />
            {errors.name && <FormHelperText sx={{ color: 'error.main' }}>{errors.name.message}</FormHelperText>}
          </FormControl>
          {/* <FormControl fullWidth sx={{ mb: 6 }} error={Boolean(errors.type)}>
            <FormLabel>Type</FormLabel>
            <Controller
              name='type'
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <RadioGroup row {...field} aria-label='type' name='validation-basic-type'>
                  <FormControlLabel
                    value='local'
                    label='Local'
                    sx={errors.type ? { color: 'error.main' } : null}
                    control={<Radio sx={errors.type ? { color: 'error.main' } : null} />}
                  />
                  <FormControlLabel
                    value='central'
                    label='Central'
                    sx={errors.type ? { color: 'error.main' } : null}
                    control={<Radio sx={errors.type ? { color: 'error.main' } : null} />}
                  />
                </RadioGroup>
              )}
            />
            {errors.type && (
              <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-type'>
                {errors?.type?.message}
              </FormHelperText>
            )}
          </FormControl> */}

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
                    label='Site'
                    onChange={onChange}
                    error={Boolean(errors?.gst_slab)}
                    labelId='site_id'
                  >
                    {authData?.userData?.user?.zoos[0].sites?.map((item, index) => {
                      return (
                        <MenuItem key={index} value={item?.site_id}>
                          {item?.site_name}
                        </MenuItem>
                      )
                    })}
                  </Select>
                )}
              />
              {errors?.site_id && (
                <FormHelperText sx={{ color: 'error.main' }}>{errors?.site_id?.message}</FormHelperText>
              )}
            </FormControl>
          )}
          <FormControl fullWidth sx={{ mb: 6 }}>
            <Controller
              name='latitude'
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <TextField
                  label='Latitude'
                  value={value}
                  onChange={onChange}
                  placeholder='Latitude'
                  error={Boolean(errors.latitude)}
                  name='latitude'
                />
              )}
            />
          </FormControl>
          <FormControl fullWidth sx={{ mb: 6 }}>
            <Controller
              name='logitude'
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <TextField
                  label='Longitude'
                  value={value}
                  onChange={onChange}
                  placeholder='Longitude'
                  error={Boolean(errors.logitude)}
                  name='logitude'
                />
              )}
            />
          </FormControl>

          {/* {editParams?.id !== null ? (
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
          ) : null} */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <RenderSidebarFooter />
          </Box>
        </form>
      </Box>
    </Drawer>
  )
}

export default AddStore
