// addState
// ** React Imports
import { useEffect, useCallback, Fragment } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import FormControlLabel from '@mui/material/FormControlLabel'
import { RadioGroup, FormLabel, Radio } from '@mui/material'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { LoadingButton } from '@mui/lab'

// ** Third Party Imports
import { useForm, Controller } from 'react-hook-form'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { getPreparationTypeById } from 'src/lib/api/diet/settings/preparationTypes'

// ** Styled Components

const schema = yup.object().shape({
  label: yup
    .string()
    .transform(value => (value ? value.trim() : value))
    .required('Preparation Type Name is Required'),
  status: yup.string().nullable()
})

const defaultValues = {
  label: '',
  status: '1'
}

const AddPreparationType = props => {
  // ** Props
  const { addEventSidebarOpen, handleSidebarClose, handleSubmitData, resetForm, submitLoader, editParams } = props

  console.log(editParams)

  const {
    reset,
    control,
    setValue,
    watch,
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
    const { label, status } = { ...params }
    console.log(params)

    const payload = {
      preparation_type_name: label.trim(),
      status: status
    }
    await handleSubmitData(payload)
  }

  const getPreparationType = useCallback(
    async id => {
      const response = await getPreparationTypeById(id)
      console.log('add state comp', response)
      if (response?.success) {
        console.log(response.data)
        reset({ label: response.data.label, status: response.data.status === 'active' ? 1 : 0 })
      } else {
      }
    },
    [reset]
  )

  useEffect(() => {
    reset()
    if (resetForm) {
      reset(defaultValues)
    }

    if (editParams?.id !== null) {
      getPreparationType(editParams?.id)
    }
  }, [resetForm, editParams, reset, getPreparationType])

  const RenderSidebarFooter = () => {
    return (
      <Fragment>
        <LoadingButton
          disabled={watch('label') === ''}
          size='large'
          type='submit'
          variant='contained'
          loading={submitLoader}
        >
          {editParams?.id !== null ? 'Update' : 'Add'}
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
        <Typography variant='h6'>{editParams?.id !== null ? 'Update' : 'Add'} Preparation Type</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton size='small' onClick={() => handleSidebarClose()} sx={{ color: 'text.primary' }}>
            <Icon icon='mdi:close' fontSize={20} />
          </IconButton>
        </Box>
      </Box>
      <Box className='sidebar-body' sx={{ p: theme => theme.spacing(5, 6) }}>
        <form autoComplete='off' onSubmit={!submitLoader ? handleSubmit(onSubmit) : null}>
          <FormControl fullWidth sx={{ mb: 6 }}>
            <Controller
              name='label'
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <TextField
                  label='Preparation Type Name'
                  value={value}
                  onChange={onChange}
                  focused={value !== ''}
                  placeholder='Preparation Type Name'
                  error={Boolean(errors.label)}
                  name='label'
                />
              )}
            />
            {errors.label && <FormHelperText sx={{ color: 'error.main' }}>{errors.label.message}</FormHelperText>}
          </FormControl>

          {editParams?.id !== null ? (
            <FormControl fullWidth sx={{ mb: 6 }} error={Boolean(errors.radio)}>
              <FormLabel>Status</FormLabel>
              <Controller
                name='status'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <RadioGroup row {...field} name='validation-basic-radio'>
                    <FormControlLabel
                      value='1'
                      label='Active'
                      sx={errors.status ? { color: 'error.main' } : null}
                      control={<Radio sx={errors.status ? { color: 'error.main' } : null} />}
                    />
                    <FormControlLabel
                      value='0'
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

export default AddPreparationType
