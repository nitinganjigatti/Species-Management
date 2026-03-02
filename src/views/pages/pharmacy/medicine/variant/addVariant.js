// addState
// ** React Imports
import { useEffect, useCallback, Fragment } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { LoadingButton } from '@mui/lab'

import { useForm } from 'react-hook-form'

import Icon from 'src/@core/components/icon'
import { getVariantById } from 'src/lib/api/pharmacy/variant'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'
import ControlledRadioGroup from 'src/views/forms/form-fields/ControlledRadioGroup'

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
    const result = await handleSubmitData(payload)
    if (result?.success) {
      reset(defaultValues)
    }
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
          <IconButton
            size='small'
            onClick={() => {
              handleSidebarClose()
              reset(defaultValues)
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
            name='unit_multiplier'
            control={control}
            required
            type='number'
            label='Unit Multiplier*'
            placeholder='Unit Multiplier'
            error={Boolean(errors.unit_multiplier)}
            fullWidth
            sx={{ mb: 6 }}
          />

          <ControlledTextArea
            control={control}
            name={'description'}
            label='Description'
            errors={errors}
            placeholder={'Description'}
            disabled={submitLoader}
            required
            sx={{ mb: 6 }}
          />
          <ControlledRadioGroup
            name='active'
            control={control}
            errors={errors}
            label='Status'
            required
            options={[
              { label: 'Active', value: '1' },
              { label: 'Inactive', value: '0' }
            ]}
            row
            gap={4}
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

export default AddVariant
