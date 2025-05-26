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
import { getVariantById } from 'src/lib/api/pharmacy/variant'

// ** Styled Components

const schema = yup.object().shape({
  // description: yup.string().required('Description is required'),
  active: yup.string().nullable(),
  unit_multiplier: yup
    .number()
    .typeError('Unit Multiplier must be a valid number')
    .positive('Unit Multiplier must be greater than zero')
    .integer('Unit Multiplier must be an integer')
    .required('Unit Multiplier is required')
})

const defaultValues = {
  unit_multiplier: '',
  description: '',
  active: '1'
}

const AddVariant = props => {
  // ** Props
  const { addEventSidebarOpen, handleSidebarClose, handleSubmitData, resetForm, submitLoader, editParams } = props

  const {
    reset,
    control,
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
    const { unit_multiplier, description, active } = { ...params }

    const payload = {
      unit_multiplier: unit_multiplier ? unit_multiplier : null,
      description: description ? description : null,
      active
    }
    await handleSubmitData(payload)
  }

  const getSpecificVariant = useCallback(
    async id => {
      const response = await getVariantById(id)
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
      getSpecificVariant(editParams?.id)
    }
  }, [reset, editParams])

  const RenderSidebarFooter = () => {
    return (
      <Fragment>
        <LoadingButton size='large' type='submit' variant='contained' loading={submitLoader}>
          {editParams?.id ? 'Update' : 'Add'}
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
        <Typography variant='h6'>{editParams?.id !== null ? 'Edit Variant' : 'Add Variant'}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton size='small' onClick={handleSidebarClose} sx={{ color: 'text.primary' }}>
            <Icon icon='mdi:close' fontSize={20} />
          </IconButton>
        </Box>
      </Box>
      <Box className='sidebar-body' sx={{ p: theme => theme.spacing(5, 6) }}>
        <form autoComplete='off' onSubmit={!submitLoader ? handleSubmit(onSubmit) : null}>
          <FormControl fullWidth sx={{ mb: 6 }}>
            <Controller
              name='unit_multiplier'
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <TextField
                  label='Unit Multiplier*'
                  type='number'
                  value={value}
                  onChange={e => {
                    const newValue = e.target.value

                    // Allow only positive numbers
                    if (!isNaN(newValue) && Number(newValue) >= 0) {
                      onChange(newValue)
                    } else {
                      onChange('') // Clear field if invalid
                    }
                  }}
                  onKeyPress={e => {
                    if (e.key === '-' || e.key === '+' || isNaN(Number(e.key))) {
                      e.preventDefault()
                    }
                  }}
                  placeholder='Unit Multiplier'
                  error={Boolean(errors.unit_multiplier)}
                  name='unit_multiplier'
                  inputProps={{ min: 0 }} // Prevents entering negative values using native HTML validation
                />
              )}
            />
            {errors.unit_multiplier && (
              <FormHelperText sx={{ color: 'error.main' }}>{errors.unit_multiplier.message}</FormHelperText>
            )}
          </FormControl>

          <FormControl fullWidth sx={{ mb: 6 }}>
            <Controller
              name='description'
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <TextField
                  label='Description'
                  value={value}
                  multiline
                  rows={4}
                  onChange={onChange}
                  placeholder='Description'
                  error={Boolean(errors.description)}
                  name='description'
                />
              )}
            />
            {errors.description && (
              <FormHelperText sx={{ color: 'error.main' }}>{errors.description.message}</FormHelperText>
            )}
          </FormControl>

          <FormControl fullWidth sx={{ mb: 6 }} error={Boolean(errors.radio)}>
            <FormLabel>Status</FormLabel>
            <Controller
              name='active'
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <RadioGroup row {...field} aria-label='gender' name='validation-basic-radio'>
                  <FormControlLabel
                    value='1'
                    label='Active'
                    sx={errors.active ? { color: 'error.main' } : null}
                    control={<Radio sx={errors.active ? { color: 'error.main' } : null} />}
                  />
                  <FormControlLabel
                    value='0'
                    label='Inactive'
                    sx={errors.active ? { color: 'error.main' } : null}
                    control={<Radio sx={errors.active ? { color: 'error.main' } : null} />}
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
          {/* ) : null} */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <RenderSidebarFooter />
          </Box>
        </form>
      </Box>
    </Drawer>
  )
}

export default AddVariant
