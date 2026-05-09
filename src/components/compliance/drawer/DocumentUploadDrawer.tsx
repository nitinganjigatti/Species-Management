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
import { useRouter } from 'next/router'
import dayjs from 'dayjs'
import type { DocumentUploadDrawerProps } from 'src/types/compliance'

// Validation Schema
const documentSchema = yup.object().shape({
  issued_date: yup.date().required('Issued Date is required').typeError('Please enter a valid date'),
  reference_number: yup
    .string()
    .required('Reference Number is required')
    .max(50, 'Reference number must be less than 50 characters'),
  document_file: yup
    .mixed()
    .required('File is required')
    .test('fileRequired', 'File is required', function (value) {
      if (!this.parent.documentData && !value) return false

      return true
    })
    .test('fileType', 'Unsupported file format', value => {
      if (!value) return true
      const supportedFormats = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png']
      const extension = ((value as File).name.split('.').pop() || '').toLowerCase()

      return supportedFormats.includes(extension)
    })
})

interface DocumentUploadDrawerExtendedProps extends DocumentUploadDrawerProps {
  onAddEdit?: (formData: Record<string, unknown>) => void
  isLoading?: boolean
}

const DocumentUploadDrawer = ({ open, onClose, documentData, onAddEdit, isLoading }: DocumentUploadDrawerExtendedProps) => {
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
      reference_number: '',
      issued_date: dayjs(),
      document_file: null
    }
  })
  const router = useRouter()
  const id = router.query.id

  const theme = useTheme()
  const fileValue = watch('document_file')

  useEffect(() => {
    if (documentData?.file_original_name) {
      setValue('reference_number', documentData.reference_number || '')
      setValue('issued_date', dayjs(documentData?.issued_date))
      setValue(
        'document_file',
        documentData.file_path
          ? {
              name: documentData.file_original_name,
              url: documentData.file_path || null,
              file_path: documentData.file_path || null,
              type: documentData.file_type
            }
          : null
      )
    }
  }, [documentData, setValue])

  const onSubmit = (data: Record<string, unknown>) => {
    const formData = {
      file: data.document_file,
      issued_date: data.issued_date,
      reference_number: data.reference_number
    }
    onAddEdit?.(formData)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Drawer open={open} anchor='right'>
      <Box
        sx={{ px: 5, pt: 4, pb: 2, position: 'sticky', top: 0, backgroundColor: theme.palette.customColors.Background }}
      >
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 500 }}>{documentData?.name}</Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>
      <Box
        sx={{
          width: 570,
          maxWidth: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: theme.palette.customColors.Background,
          px: 5,
          pb: 3,
          pt: 5
        }}
      >
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
          <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 500, fontSize: '1.25rem' }}>
            Document Details
          </Typography>

          <ControlledDatePicker
            name='issued_date'
            label='Issued Date*'
            maxDate={dayjs(new Date())}
            control={control}
            errors={errors}
            required
          />
          <Box>
            <ControlledTextField
              name='reference_number'
              label='Reference Number*'
              control={control}
              errors={errors}
              fullWidth
            />
          </Box>

          <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 500, fontSize: '1.25rem' }}>
            Upload Document
          </Typography>
          <ControlledFileUpload
            name='document_file'
            label={(fileValue as { name?: string })?.name || 'Select File*'}
            control={control}
            errors={errors}
            color={theme.palette.customColors.OnSurface}
          />
        </Box>
      </Box>
      <Box
        sx={{
          px: 5,
          py: 4,
          backgroundColor: theme.palette.common.white,
          borderTop: `1px solid ${theme.palette.divider}`,
          boxShadow: `0px -4px 21px 0px ${
            theme.palette.mode === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'
          }`,
          position: 'sticky',
          bottom: 0
        }}
      >
        <Button type='submit' variant='contained' disabled={isLoading} fullWidth onClick={handleSubmit(onSubmit)}>
          {isLoading ? <CircularProgress size={24} /> : documentData?.file_path ? 'Update Document' : 'Add Document'}
        </Button>
      </Box>
    </Drawer>
  )
}

export default DocumentUploadDrawer
