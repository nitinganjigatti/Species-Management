// ** React Imports
import { useEffect, FC } from 'react'

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
import { Theme, useTheme } from '@mui/material'

// Types and Interfaces
interface EditParams {
  id: number | string | null
  treatment_name?: string | null
}

interface Payload {
  treatment_master_id?: number | string | null
  treatment_name?: string | null
}

interface FormValues {
  treatment_name: string
}

interface AddTreatmentMastersDrawerProps {
  addEventSidebarOpen: boolean
  handleSidebarClose: () => void
  handleSubmitData: (payload: Payload) => Promise<void>
  resetForm: boolean
  submitLoader: boolean
  editParams: EditParams
  drawerWidth?: number | string
}

// Validation Schema
const schema = yup.object().shape({
  treatment_name: yup.string().required('Treatment Name is Required')
})

// Default Form Values
const defaultValues: FormValues = {
  treatment_name: ''
}

const AddTreatmentMastersDrawer: FC<AddTreatmentMastersDrawerProps> = ({
  addEventSidebarOpen,
  handleSidebarClose,
  handleSubmitData,
  resetForm,
  submitLoader,
  editParams,
  drawerWidth = 400
}) => {
  const theme: Theme = useTheme()

  const {
    reset,
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues,
    resolver: yupResolver(schema),
    mode: 'onBlur'
  })

  const onSubmit = async (values: FormValues): Promise<void> => {
    const payload: Payload = {
      treatment_name: values.treatment_name
    }

    if (editParams?.id) {
      payload.treatment_master_id = editParams.id
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
      sx={{ '& .MuiDrawer-paper': { width: ['100%', drawerWidth] } }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          p: '12px 24px',
          backgroundColor: theme.palette.customColors.displaybgPrimary
        }}
      >
        <Typography variant='h6'>{editParams?.id ? 'Edit' : 'Add'} Treatment</Typography>

        <IconButton size='small' onClick={handleSidebarClose}>
          <Icon icon='mdi:close' fontSize={20} />
        </IconButton>
      </Box>

      {/* Body */}
      <Box sx={{ p: 6 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ControlledTextField
            sx={{ mb: 6 }}
            name='treatment_name'
            control={control}
            label='Treatment Name'
            placeholder='Enter Treatment Name'
            error={Boolean(errors.treatment_name)}
            helperText={errors.treatment_name?.message}
            fullWidth
          />
          <LoadingButton fullWidth size='large' type='submit' variant='contained' loading={submitLoader}>
            {editParams?.id ? 'Edit' : 'Add'} Treatment
          </LoadingButton>
        </form>
      </Box>
    </Drawer>
  )
}

export default AddTreatmentMastersDrawer
