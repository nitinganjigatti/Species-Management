// ** React Imports
import { useState, useEffect, useCallback, Fragment } from 'react'
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
// ** Third Party Imports
import { useForm, Controller } from 'react-hook-form'
// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { getLabSampleListById, getLabTestListById } from 'src/lib/api/lab/master'

const schema = yup.object().shape({
  label: yup
    .string()
    .transform(value => (value ? value.trim() : value))
    .required('Label is Required'),
  description: yup
    .string()
    .transform(value => (value ? value.trim() : value))
    .required('Description is Required'),
  active: yup.string().nullable()
})

const defaultValues = {
  label: '',
  description: ''
}

const AddTest = props => {
  const router = useRouter()
  const { sample_id } = router.query
  // ** Props
  const { addEventSidebarOpen, handleSidebarClose, handleSubmitData, resetForm, submitLoader, editParams } = props

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
    const { label, description } = { ...params }

    const payload = {
      label: label.trim(),
      description: description.trim(),
      sample_id: sample_id
    }
    await handleSubmitData(payload)
  }

  const getLabSampleById = useCallback(
    async id => {
      const params = {
        id
      }
      const response = await getLabTestListById(params)
      console.log('add state comp', response)
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
      getLabSampleById(editParams?.id)
    }
  }, [resetForm, editParams, reset, getLabSampleById])

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
        <Typography variant='h6'>{editParams?.id !== null ? 'Edit' : 'Add'} Test</Typography>
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
              name='label'
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <TextField
                  label='Label*'
                  value={value}
                  onChange={onChange}
                  placeholder='Label'
                  error={Boolean(errors.label)}
                  name='label'
                />
              )}
            />
            {errors.label && <FormHelperText sx={{ color: 'error.main' }}>{errors.label.message}</FormHelperText>}
          </FormControl>

          <FormControl fullWidth sx={{ mb: 6 }}>
            <Controller
              name='description'
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <TextField
                  label='Description*'
                  value={value}
                  onChange={onChange}
                  placeholder='Description'
                  error={Boolean(errors.description)}
                  name='description'
                  multiline
                  rows={3}
                />
              )}
            />
            {errors.description && (
              <FormHelperText sx={{ color: 'error.main' }}>{errors.description.message}</FormHelperText>
            )}
          </FormControl>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <RenderSidebarFooter />
          </Box>
        </form>
      </Box>
    </Drawer>
  )
}

export default AddTest
