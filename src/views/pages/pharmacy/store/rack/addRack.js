// ** React Imports
import { useState, useEffect, useCallback, Fragment } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import Grid from '@mui/material/Grid'

import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'

import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { LoadingButton } from '@mui/lab'
import { useRouter } from 'next/router'
import { RadioGroup, FormLabel, FormControlLabel, Radio, TextareaAutosize } from '@mui/material'

// ** Third Party Imports
import { useForm, Controller } from 'react-hook-form'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { getStoreList } from 'src/lib/api/pharmacy/getStoreList'
import { getRackListById } from 'src/lib/api/pharmacy/getRackList'

// ** Styled Components

const schema = yup.object().shape({
  name: yup.string().required('Rack name is required'),
  position: yup.string().required('Position is required'),
  store_id: yup.string().required('Store is required'),
  shelf: yup.string().required('Shelf is required'),
  status: yup.string().nullable()
})

const defaultValues = {
  name: ' ',
  position: ' ',
  store_id: ' ',
  shelf: '',
  status: 'active'
}

const AddRack = props => {
  // ** Props
  const { addEventSidebarOpen, handleSidebarClose, handleSubmitData, resetForm, submitLoader, editParams } = props
  console.log('props', props)

  // ** States
  const [values, setValues] = useState(defaultValues)
  const [stores, setStores] = useState([])

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
    const { name, position, store_id, shelf, status } = { ...params }

    const payload = {
      name,
      position,
      store_id,
      shelf,
      status
    }
    await handleSubmitData(payload)
  }

  const getRacks = useCallback(
    async id => {
      const response = await getRackListById(id)
      if (response?.success) {
        const data = {
          name: response.data?.name,
          store_id: response.data?.store_id,
          position: response.data?.position,
          shelf: response.data?.shelfs,
          status: response.data?.status
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
      console.log()

      getRacks(editParams?.id)
    }
  }, [resetForm, editParams, reset, getRacks])

  // list the stores
  const getStoresLists = async () => {
    const response = await getStoreList({})
    if (response?.data?.list_items.length > 0) {
      // console.log('list', response)
      // response.sort((a, b) => a.id - b.id)
      setStores(response?.data?.list_items)
    }

    // else {
    //   setLoader(false)
    // }
  }

  useEffect(() => {
    getStoresLists()
  }, [])

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
        <Typography variant='h6'>{editParams?.id !== null ? 'Edit' : 'Add'} Rack</Typography>
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
          {/* <FormControl fullWidth sx={{ mb: 6 }}>
            <InputLabel error={Boolean(errors?.state_id)} id='store_id'>
              Store
            </InputLabel>
            <Controller
              name='store_id'
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <Select
                  name='store_id'
                  value={value}
                  label='Select'
                  onChange={onChange}
                  error={Boolean(errors?.store_id)}

                  // labelId='store_id'
                >
                  {stores?.map((item, index) => (
                    <MenuItem key={index} disabled={item?.status === 'inactive'} value={item?.id}>
                      {item?.name}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
            {errors?.state_id && (
              <FormHelperText sx={{ color: 'error.main' }}>{errors?.state_id?.message}</FormHelperText>
            )}
          </FormControl> */}
          <FormControl fullWidth sx={{ mb: 6 }}>
            <Controller
              name='name'
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <TextField
                  label='Rack Name'
                  value={value}
                  onChange={onChange}
                  placeholder='Rack Name'
                  error={Boolean(errors.name)}
                  name='name'
                />
              )}
            />
            {errors.name && <FormHelperText sx={{ color: 'error.main' }}>{errors.name.message}</FormHelperText>}
          </FormControl>

          <FormControl fullWidth sx={{ mb: 6 }}>
            <Controller
              name='position'
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <TextField
                  label='Position'
                  value={value}
                  onChange={onChange}
                  placeholder='Position'
                  error={Boolean(errors.position)}
                  name='position'
                />
              )}
            />
            {errors.position && <FormHelperText sx={{ color: 'error.main' }}>{errors.position.message}</FormHelperText>}
          </FormControl>
          {/* <FormControl fullWidth sx={{ mb: 6 }}>
            <Controller
              name='shelf'
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <TextField
                  label='shelf'
                  value={value}
                  onChange={onChange}
                  placeholder='shelf'
                  error={Boolean(errors.shelf)}
                  name='shelf'
                />
              )}
            />
            {errors.shelf && <FormHelperText sx={{ color: 'error.main' }}>{errors.shelf.message}</FormHelperText>}
          </FormControl> */}
          {console.log('shelf', editParams.shelf)}
          <FormControl fullWidth sx={{ mb: 6 }}>
            <Controller
              name='shelf'
              multiline
              rows={4}
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <TextField
                  rows={4}
                  multiline
                  label='shelf'
                  value={value}
                  onChange={onChange}
                  placeholder='shelf'
                  error={Boolean(errors.shelf)}
                  name='shelf'
                />
              )}
            />
            {errors.shelf && <FormHelperText sx={{ color: 'error.main' }}>{errors.shelf.message}</FormHelperText>}
          </FormControl>

          {editParams?.id !== null ? (
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

export default AddRack
