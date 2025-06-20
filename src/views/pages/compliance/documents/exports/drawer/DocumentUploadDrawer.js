import React, { useEffect } from 'react'
import { Drawer, Box, Typography, Button, CircularProgress, IconButton } from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledDatePicker from 'src/views/forms/form-fields/ControlledDatePicker'
import { useTheme } from '@mui/material/styles'
import ControlledFileUpload from 'src/views/forms/form-fields/ControlledFileUpload'

// Validation Schema
const documentSchema = yup.object().shape({
  issued_date: yup.date().required('Issued Date is required').typeError('Please enter a valid date'),
  reference_number: yup
    .string()
    .required('Reference Number is required')
    .max(50, 'Reference number must be less than 50 characters'),
  document_file: yup
    .mixed()
    .test('fileRequired', 'File is required', function (value) {
      if (!this.parent.documentData && !value) return false

      return true
    })
    .test('fileType', 'Unsupported file format', value => {
      if (!value) return true
      const supportedFormats = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png']
      const extension = value.name.split('.').pop().toLowerCase()

      return supportedFormats.includes(extension)
    })
})

const DocumentUploadDrawer = ({ open, onClose, documentType, documentData, onUpload, onEdit, isLoading }) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm({
    resolver: yupResolver(documentSchema),
    defaultValues: {
      reference_number: documentData?.reference_number || '',
      issued_date: documentData?.issued_date || null,
      document_file: null
    }
  })

  const theme = useTheme()
  const fileValue = watch('document_file')

  useEffect(() => {
    if (documentData) {
      setValue('reference_number', documentData.reference_number || '')
      setValue('issued_date', documentData.issued_date || null)
    }
  }, [documentData, setValue])

  const onSubmit = data => {
    const formData = {
      file: data.document_file,
      issued_date: data.issued_date,
      reference_number: data.reference_number
    }

    if (documentData) {
      onEdit(documentType.id, formData)
    } else {
      onUpload(documentType.id, formData)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Drawer open={open} onClose={handleClose} anchor='right'>
      <Box
        sx={{
          width: 570,
          maxWidth: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: theme.palette.customColors.Background
        }}
      >
        {/* Header */}
        <Box sx={{ px: 5, pt: 4, pb: 2 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center'>
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 500 }}>{documentType?.name}</Typography>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Scrollable Content */}
        <Box sx={{ flex: 1, overflowY: 'auto', px: 5, pb: 3 }}>
          <Box
            component='form'
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            sx={{
              border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
              borderRadius: 2,
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              backgroundColor: theme.palette.common.white
            }}
          >
            <Typography
              sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 500, fontSize: '1.25rem' }}
            >
              Document Details
            </Typography>

            <ControlledDatePicker name='issued_date' label='Issued Date*' control={control} errors={errors} required />

            <ControlledTextField
              name='reference_number'
              label='Reference Number'
              control={control}
              errors={errors}
              fullWidth
            />

            <Typography
              sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 500, fontSize: '1.25rem' }}
            >
              Upload Document
            </Typography>
            <ControlledFileUpload
              name='document_file'
              label={fileValue?.name || 'Select File'}
              control={control}
              errors={errors}
              color={theme.palette.primary.OnSurface}
            />
          </Box>
        </Box>

        {/* Sticky Footer */}
        <Box
          sx={{
            px: 5,
            py: 4,
            backgroundColor: theme.palette.common.white,
            borderTop: `1px solid ${theme.palette.divider}`,
            boxShadow: `0px -4px 21px 0px ${
              theme.palette.mode === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'
            }`
          }}
        >
          <Button type='submit' variant='contained' disabled={isLoading} fullWidth onClick={handleSubmit(onSubmit)}>
            {isLoading ? <CircularProgress size={24} /> : documentData ? 'Update Document' : 'Upload Document'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

export default DocumentUploadDrawer
