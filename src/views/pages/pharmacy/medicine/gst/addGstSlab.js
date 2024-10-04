// ** React Imports
import { useState, useEffect, forwardRef, useCallback, Fragment } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import Select from '@mui/material/Select'
import Switch from '@mui/material/Switch'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import FormControlLabel from '@mui/material/FormControlLabel'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { LoadingButton } from '@mui/lab'
import { useRouter } from 'next/router'
import { RadioGroup, FormLabel, Radio } from '@mui/material'
import { getTaxById } from 'src/lib/api/pharmacy/getGstList'

// ** Third Party Imports
import { useForm, Controller } from 'react-hook-form'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Styled Components

const schema = yup.object().shape({
  name: yup.string().required('Tax Slab Name is Required'),
  tax_value: yup.number().typeError('Tax should be a number').required('Tax is required'),
  active: yup.string().nullable()
})

const defaultValues = {
  name: '',
  tax_value: '',
  active: '1'
}

const AddGstSlabs = props => {
  // ** Props
  const { addEventSidebarOpen, handleSidebarClose, handleSubmitData, resetForm, submitLoader, editParams } = props

  // ** States
  const [values, setValues] = useState(defaultValues)

  const router = useRouter()
  const { id, action } = router.query

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
    const { name, tax_value, active } = { ...params }

    const payload = {
      name,
      tax_value,
      active
    }
    console.log(payload)

    await handleSubmitData(payload)
  }

  const getTax = useCallback(
    async id => {
      try {
        const response = await getTaxById(id)

        if (response?.success) {
          reset({
            id: response.data.id,
            name: response.data.label,
            tax_value: response.data.tax_value,
            active: response.data.active
          })
        } else {
        }
      } catch (e) {
        console.log(e)
      }
    },
    [reset]
  )

  useEffect(() => {
    if (resetForm) {
      reset(defaultValues)
    }

    if (editParams?.id !== null) {
      getTax(editParams?.id)
    }
  }, [resetForm, editParams, reset, getTax])

  // useEffect(() => {
  //   if (resetForm) {
  //     reset(defaultValues)
  //   }
  // }, [addEventSidebarOpen, resetForm, reset, submitLoader])

  const RenderSidebarFooter = () => {
    return (
      <Fragment>
        <LoadingButton size='large' type='submit' variant='contained' loading={submitLoader}>
          Add
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
        <Typography variant='h6'>Add GST</Typography>
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
              name='name'
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <TextField
                  label='GST Name'
                  value={value}
                  onChange={onChange}
                  placeholder='GST Name'
                  error={Boolean(errors.name)}
                  name='name'
                />
              )}
            />
            {errors.title && <FormHelperText sx={{ color: 'error.main' }}>{error.name.message}</FormHelperText>}
          </FormControl>

          <FormControl fullWidth sx={{ mb: 6 }}>
            <Controller
              name='tax_value'
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <TextField label='Tax' value={value} onChange={onChange} name='tax' error={Boolean(errors.tax_value)} />
              )}
            />
            {errors.tax_value && (
              <FormHelperText sx={{ color: 'error.main' }}>{errors.tax_value.message}</FormHelperText>
            )}
          </FormControl>
          {editParams?.id !== null ? (
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
          ) : null}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <RenderSidebarFooter />
          </Box>
        </form>
      </Box>
    </Drawer>
  )
}

export default AddGstSlabs
