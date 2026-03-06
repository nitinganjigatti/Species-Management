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
import AddTreatmentDrawer from 'src/components/hospital/inpatient/OtherTreatments/AddTreatmentDrawer'

// Validation Schema
const schema = yup.object().shape({
  name: yup.string().required('Purpose is Required')
})

// Default Form Value
const defaultValues = {
  name: ''
}

const AddPurposeOfAnaesthesiaDrawer = ({
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
      id: editParams?.id || null,
      name: values.name,
      type: 'purpose'
    }

    console.log('FINAL API PAYLOAD:', payload)

    await handleSubmitData(payload)
  }

  useEffect(() => {
    if (resetForm) {
      reset(defaultValues)
    }

    if (editParams?.id) {
      reset({
        name: editParams?.name || ''
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
        <Typography variant='h6'>{editParams?.id ? 'Edit' : 'Add'} Purpose</Typography>

        <IconButton size='small' onClick={handleSidebarClose}>
          <Icon icon='mdi:close' fontSize={20} />
        </IconButton>
      </Box>
      <Box sx={{ p: 6 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ControlledTextField
            sx={{ mb: 6 }}
            name='name'
            control={control}
            placeholder='Purpose Of Anaesthesia '
            label='Purpose Of Anaesthesia '
            error={Boolean(errors.name)}
          />
          <LoadingButton fullWidth size='large' type='submit' variant='contained' loading={submitLoader}>
            SUBMIT
          </LoadingButton>
        </form>
      </Box>
    </Drawer>
  )
}

export default AddPurposeOfAnaesthesiaDrawer
