// ** React Imports
import { useState, useEffect, useCallback } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { LoadingButton } from '@mui/lab'

// ** Third Party Imports
import { useForm } from 'react-hook-form'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { getProductCategoryById } from 'src/lib/api/pharmacy/getCategories'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'
import ControlledRadioGroup from 'src/views/forms/form-fields/ControlledRadioGroup'

const schema = yup.object().shape({
  name: yup
    .string()
    .transform(value => (value ? value.trim() : value))
    .required('Category Name is Required'),
  description: yup.string().nullable(),
  active: yup.string().required('Status is Required')
})

const defaultValues = {
  name: '',
  description: '',
  active: '1'
}

const AddProductCategory = props => {
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
    const { name, description, active } = { ...params }

    const payload =
      editParams?.id !== null
        ? {
            name: name.trim(),
            description: description ? description.trim() : '',
            active: parseInt(active)
          }
        : {
            name: name.trim(),
            description: description ? description.trim() : ''
          }
    await handleSubmitData(payload)
  }

  const getProductCategory = useCallback(
    async id => {
      const response = await getProductCategoryById(id)

      if (response?.success) {
        reset({
          name: response.data.name ?? response.data.category_name ?? '',
          description: response.data.description || '',
          active: String(response.data.active ?? '1'),
          id: response.data.id
        })
      }
    },
    [reset]
  )

  useEffect(() => {
    if (resetForm) {
      reset(defaultValues)
    }

    if (editParams?.id !== null) {
      getProductCategory(editParams?.id)
    }
  }, [resetForm, editParams, reset, getProductCategory])

  const RenderSidebarFooter = () => {
    return (
      <>
        <LoadingButton size='large' type='submit' variant='contained' loading={submitLoader}>
          Submit
        </LoadingButton>
      </>
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
        <Typography variant='h6'>{editParams?.id !== null ? 'Edit' : 'Add'} Product Category</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton size='small' onClick={handleSidebarClose} sx={{ color: 'text.primary' }}>
            <Icon icon='mdi:close' fontSize={20} />
          </IconButton>
        </Box>
      </Box>
      <Box className='sidebar-body' sx={{ p: theme => theme.spacing(5, 6) }}>
        <form autoComplete='off' onSubmit={!submitLoader ? handleSubmit(onSubmit) : null}>
          <ControlledTextField
            name='name'
            control={control}
            label='Category Name*'
            required
            placeholder='Category Name'
            error={Boolean(errors.name)}
            fullWidth
            sx={{ mb: 6 }}
          />
          <ControlledTextArea
            name='description'
            control={control}
            errors={errors}
            label='Description'
            placeholder='Description'
            rows={4}
            sx={{ mb: 6 }}
          />
          {editParams?.id !== null ? (
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
          ) : null}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <RenderSidebarFooter />
          </Box>
        </form>
      </Box>
    </Drawer>
  )
}

export default AddProductCategory
