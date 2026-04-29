import React from 'react'
import { Avatar, Box, Card, Drawer, IconButton, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { LoadingButton } from '@mui/lab'
import Icon from 'src/@core/components/icon'
import Toaster from 'src/components/Toaster'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'
import ControlledFileUpload from 'src/views/forms/form-fields/ControlledFileUpload'

interface DietUploadDrawerProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  speciesName?: string
  scientificName?: string
  speciesImage?: string
}

const schema = yup.object().shape({
  preparedBy: yup.string().required('Diet prepared by is required'),
  notes: yup.string(),
  dietFile: yup.mixed().required('Please upload a diet file')
})

const defaultValues = {
  preparedBy: '',
  notes: '',
  dietFile: null as any
}

// TODO: Replace with real API data
const preparedByOptions = [
  { value: 'dr_petra', label: 'Dr. Petra' },
  { value: 'dr_smith', label: 'Dr. Smith' },
  { value: 'jordan', label: 'Jordan Stevenson' }
]

const DietUploadDrawer: React.FC<DietUploadDrawerProps> = ({
  open,
  onClose,
  onSuccess,
  speciesName = 'Rainbow Lorikeet',
  scientificName = 'Trichoglossus moluccanus',
  speciesImage = ''
}) => {
  const theme = useTheme() as any

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema) as any,
    mode: 'onChange'
  })

  const onSubmit = async (values: any) => {
    try {
      // TODO: API call to upload diet
      Toaster({ type: 'success', message: 'Diet uploaded successfully' })
      handleClose()
      onSuccess?.()
    } catch {
      Toaster({ type: 'error', message: 'Failed to upload diet' })
    }
  }

  const handleClose = () => {
    reset(defaultValues)
    onClose()
  }

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={handleClose}
      slotProps={{
        paper: {
          sx: { width: { xs: '100%', sm: 560 }, backgroundColor: theme.palette.customColors.Background }
        }
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header — Species Info */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 4, px: 5, flexShrink: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar src={speciesImage} sx={{ width: 40, height: 40, bgcolor: theme.palette.customColors.Surface }}>
              <Icon icon='mdi:paw' fontSize={20} />
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}>
                {speciesName}
              </Typography>
              <Typography variant='body2' sx={{ fontStyle: 'italic', color: theme.palette.customColors.neutralSecondary }}>
                {scientificName}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleClose}>
            <Icon icon='mdi:close' />
          </IconButton>
        </Box>

        {/* Form */}
        <Box sx={{ flex: 1, overflowY: 'auto', px: 5 }}>
          <form id='diet-upload-form' onSubmit={handleSubmit(onSubmit)}>
            <Card sx={{ p: 4 }}>
              {/* Diet prepared by — using ControlledSelect */}
              <Box sx={{ mb: 4 }}>
                <ControlledSelect
                  name='preparedBy'
                  control={control}
                  errors={errors}
                  options={preparedByOptions}
                  label='Diet prepared by'
                  required
                  getOptionLabel={(opt: any) => opt.label}
                  getOptionValue={(opt: any) => opt.value}
                />
              </Box>

              {/* Notes — using ControlledTextArea */}
              <Box sx={{ mb: 4 }}>
                <ControlledTextArea
                  name='notes'
                  control={control}
                  errors={errors}
                  placeholder='Lorem ipsum doalr sit amet'
                  rows={4}
                  label='Enter notes'
                />
              </Box>

              {/* Upload diet — using ControlledFileUpload */}
              <Typography sx={{ fontWeight: 600, mb: 2, color: theme.palette.customColors.OnSurfaceVariant }}>
                Upload diet
              </Typography>
              <ControlledFileUpload
                name='dietFile'
                control={control}
                errors={errors}
                label='Drop your file here'
                acceptFileTypes='.pdf,.doc,.docx'
              />
            </Card>
          </form>
        </Box>

        {/* Submit */}
        <Box sx={{ p: 5, flexShrink: 0 }}>
          <LoadingButton
            fullWidth
            variant='contained'
            size='large'
            loading={isSubmitting}
            type='submit'
            form='diet-upload-form'
            disabled={!isValid}
            sx={{ borderRadius: '8px', textTransform: 'uppercase' }}
          >
            Submit
          </LoadingButton>
        </Box>
      </Box>
    </Drawer>
  )
}

export default DietUploadDrawer
