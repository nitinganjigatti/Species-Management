// ** React Imports
import { useEffect, FC } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Drawer from '@mui/material/Drawer'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import { LoadingButton } from '@mui/lab'
import { alpha, Theme, useTheme } from '@mui/material'

// ** Form Validation
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'

// ** Icons
import Icon from 'src/@core/components/icon'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'

// Types and Interfaces
interface EditParams {
  id: number | string | null
  name: string | null
}

interface Payload {
  id?: number | string | null
  name?: string | null
  type: string
}

interface FormValues {
  name: string
}

interface AddClinicalPathDrawerProps {
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
  name: yup.string().required('Clin Path Name is Required')
})

// Default Form Values
const defaultValues: FormValues = {
  name: ''
}

const AddClinicalPathDrawer: FC<AddClinicalPathDrawerProps> = ({
  addEventSidebarOpen,
  handleSidebarClose,
  handleSubmitData,
  resetForm,
  submitLoader,
  editParams,
  drawerWidth = 562
}) => {
  const theme: Theme = useTheme()

  const {
    reset,
    control,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<FormValues>({
    defaultValues,
    resolver: yupResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  const onSubmit = async (values: FormValues): Promise<void> => {
    const payload: Payload = {
      name: values.name,
      type: 'clin_path'
    }

    if (editParams?.id) {
      payload.id = editParams.id
    }

    await handleSubmitData(payload)
  }

  const handleClose = () => {
    reset(defaultValues)
    handleSidebarClose()
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

  const title = editParams?.id ? 'Edit Clin Path' : 'Add Clin Path'

  return (
    <Drawer
      anchor='right'
      open={addEventSidebarOpen}
      onClose={handleClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: ['100%', drawerWidth] } }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          position: 'sticky',
          top: 0,
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 6,
          borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`,
          backgroundColor: theme.palette.customColors.OnPrimary,
          zIndex: 10
        }}
      >
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          <img src='/icons/activity_icon.png' style={{ width: '30px', height: '30px' }} alt='Clin Path Icon' />
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
            {title}
          </Typography>
        </Box>

        <IconButton size='small' onClick={handleClose} sx={{ color: theme.palette.text.primary }}>
          <Icon icon='mdi:close' fontSize={24} />
        </IconButton>
      </Box>

      {/* Body */}
      <Box
        sx={{
          backgroundColor: theme.palette.background.default,
          p: 6,
          flexGrow: 1,
          pb: 16
        }}
      >
        <form autoComplete='off'>
          <Card sx={{ padding: 6, boxShadow: 0, border: `2px solid ${theme.palette.customColors.SurfaceVariant}` }}>
            <Grid container spacing={6}>
              <Grid size={{ xs: 12 }}>
                <ControlledTextField
                  control={control}
                  errors={errors}
                  label='Clin Path Name*'
                  name='name'
                  placeholder='Enter Clin Path Name'
                  fullWidth
                />
              </Grid>
            </Grid>
          </Card>
        </form>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          p: 4,
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          display: 'flex',
          justifyContent: 'center',
          gap: 2,
          boxShadow: `0px -2px 6px ${alpha(theme.palette.customColors.deepDark as string, 0.1)}`,
          bottom: 0,
          position: 'sticky',
          zIndex: 1
        }}
      >
        <LoadingButton
          variant='contained'
          onClick={handleSubmit(onSubmit)}
          loading={submitLoader}
          sx={{ flex: 1, py: 4 }}
          disabled={!isValid || submitLoader}
        >
          {title}
        </LoadingButton>
      </Box>
    </Drawer>
  )
}

export default AddClinicalPathDrawer
