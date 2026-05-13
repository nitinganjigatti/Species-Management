import React, { useEffect, useMemo } from 'react'
import { Drawer, Box, Typography, Button, CircularProgress, IconButton } from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledDatePicker from 'src/views/forms/form-fields/ControlledDatePicker'
import { useTheme } from '@mui/material/styles'
import ControlledFileUpload from 'src/views/forms/form-fields/ControlledFileUpload'
import dayjs from 'dayjs'
import type { DocumentUploadDrawerProps } from 'src/types/compliance'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'

const getDocumentSchema = (t: TFunction) =>
  yup.object().shape({
    issued_date: yup
      .date()
      .required(t('compliance_module.issued_date_is_required'))
      .typeError(t('compliance_module.please_enter_a_valid_date')),
    reference_number: yup
      .string()
      .required(t('compliance_module.reference_number_is_required'))
      .max(50, t('compliance_module.reference_number_must_be_less_than_50_characters')),
    document_file: yup
      .mixed()
      .required(t('compliance_module.file_is_required'))
      .test('fileRequired', t('compliance_module.file_is_required'), function (value) {
        if (!this.parent.documentData && !value) return false

        return true
      })
      .test('fileType', t('compliance_module.unsupported_file_format'), value => {
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

const DocumentUploadDrawer = ({
  open,
  onClose,
  documentData,
  onAddEdit,
  isLoading
}: DocumentUploadDrawerExtendedProps) => {
  const { t } = useTranslation()
  const documentSchema = useMemo(() => getDocumentSchema(t), [t])

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
            {t('compliance_module.document_details')}
          </Typography>

          <ControlledDatePicker
            name='issued_date'
            label={`${t('compliance_module.issued_date')}*`}
            maxDate={dayjs(new Date())}
            control={control}
            errors={errors}
            required
          />
          <Box>
            <ControlledTextField
              name='reference_number'
              label={`${t('compliance_module.reference_number')}*`}
              control={control}
              errors={errors}
              fullWidth
            />
          </Box>

          <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 500, fontSize: '1.25rem' }}>
            {t('compliance_module.upload_document')}
          </Typography>
          <ControlledFileUpload
            name='document_file'
            label={(fileValue as { name?: string })?.name || `${t('compliance_module.select_file')}*`}
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
          {isLoading ? (
            <CircularProgress size={24} />
          ) : documentData?.file_path ? (
            `${t('compliance_module.update_document')}`
          ) : (
            `${t('compliance_module.add_document')}`
          )}
        </Button>
      </Box>
    </Drawer>
  )
}

export default DocumentUploadDrawer
