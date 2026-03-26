// ** React Imports
import { useEffect } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import { LoadingButton } from '@mui/lab'

// ** Form Validation
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'

// ** Icons
import Icon from 'src/@core/components/icon'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'

// Validation Schema
const schema = yup.object().shape({
  treatment_name: yup.string().required('Treatment Name is Required')
})

// Default Form Values
const defaultValues = {
  treatment_name: ''
}

const AddTreatmentMastersDrawer = ({
  addEventSidebarOpen,
  handleSidebarClose,
  handleSubmitData,
  resetForm,
  submitLoader,
  editParams
}) => {
  const {
    reset,
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    mode: 'onBlur'
  })

  const onSubmit = async values => {
    const payload = {
      treatment_master_id: editParams?.id || null,
      treatment_name: values.treatment_name
    }

    await handleSubmitData(payload)
  }

  useEffect(() => {
    if (resetForm) {
      reset(defaultValues)
    }

    if (editParams?.id) {
      reset({
        treatment_name: editParams?.treatment_name || ''
      })
    }
  }, [resetForm, editParams, reset])

  return (
    <Drawer
      anchor='right'
      open={addEventSidebarOpen}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: ['100%', 400] } }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          p: 4
        }}
      >
        <Typography variant='h6'>{editParams?.id ? 'Edit' : 'Add'} Treatment</Typography>

        <IconButton size='small' onClick={handleSidebarClose}>
          <Icon icon='mdi:close' fontSize={20} />
        </IconButton>
      </Box>

      <Box sx={{ p: 6 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ControlledTextField
            sx={{ mb: 6 }}
            name='treatment_name'
            control={control}
            placeholder='Treatment Name'
            label='Treatment Name'
            error={Boolean(errors.treatment_name)}
          />
          <LoadingButton fullWidth size='large' type='submit' variant='contained' loading={submitLoader}>
            Submit
          </LoadingButton>
        </form>
      </Box>
    </Drawer>
  )
}

export default AddTreatmentMastersDrawer
