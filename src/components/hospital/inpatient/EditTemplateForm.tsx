'use client'
import React from 'react'
import { Dialog, DialogContent, IconButton, Box, Typography, FormControl, FormHelperText } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useTranslation } from 'react-i18next'
import Icon from 'src/@core/components/icon'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import { LoadingButton } from '@mui/lab'
import RichTextEditor from 'src/components/RichTextEditor'

// Helper to validate rich text as visible text
const stripHtmlToText = (value: any) => {
  if (!value) return ''

  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

interface FormValues {
  name: string
  description: string
}

interface EditTemplateFormProps {
  open: boolean
  onClose: () => void
  template?: any
  onUpdate: (data: FormValues) => Promise<void> | void
  onDelete: (id?: any) => void
  loading?: boolean
}

const EditTemplateForm = ({ open, onClose, template, onUpdate, onDelete, loading = false }: EditTemplateFormProps) => {
  const { t } = useTranslation()
  const theme: any = useTheme()

  // Validation schema (moved inside component to access t())
  const schema = yup.object().shape({
    name: yup.string().required(t('hospital_module.template_name_is_required') || ""),
    description: yup.string().test('rich-text-required', t('hospital_module.description_is_required') || "", (value: any) => {
      const text = stripHtmlToText(value || '')
      return text.length > 0
    })
  })

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      name: '',
      description: ''
    },
    mode: 'onSubmit'
  })

  // Reset form when template changes
  React.useEffect(() => {
    if (template) {
      reset(
        {
          name: template.name || template.title || '',
          description: template.description || ''
        },
        { keepDefaultValues: false }
      )
    }
  }, [template, reset])

  const onSubmit = async (formData: FormValues) => {
    await onUpdate(formData)
    handleClose()
  }

  const handleDelete = () => {
    onDelete(template?.id)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='md'
      fullWidth
      disableEscapeKeyDown
      sx={{
        '& .MuiDialog-paper': {
          width: '562px',
          borderRadius: '8px',
          backgroundColor: theme.palette.customColors.OnPrimary
        }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px',
          borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`
        }}
      >
        <Typography
          sx={{
            fontWeight: 500,
            fontStyle: 'Medium',
            fontSize: '24px',
            color: theme.palette.customColors.onSurfaceVariant
          }}
        >
          Edit Template
        </Typography>
        <IconButton onClick={handleClose} sx={{ color: theme.palette.primary.light }}>
          <Icon icon='mdi:close' fontSize={24} />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: '24px' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Template Name Field */}
          <ControlledTextField
            name='name'
            control={control}
            errors={errors}
            label={(t('hospital_module.template_name') as string)}
            sx={{
              '& .MuiOutlinedInput-root:not(.Mui-focused) .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.customColors.OutlineVariant,
                borderRadius: '4px'
              }
            }}
          />

          {/* Description Field */}
          <FormControl fullWidth error={Boolean(errors.description)}>
            <Controller
              name='description'
              control={control}
              render={({ field }: any) => (
                <RichTextEditor
                  key={template?.id} // Force re-render when template changes
                  value={field.value || ''}
                  onChange={(value: any) => field.onChange(value?.html || value || '')}
                  label={(t('hospital_module.description') as string)}
                  placeholder={(t('hospital_module.enter_description') as string)}
                  minHeight={160}
                />
              )}
            />
            {errors.description && (
              <FormHelperText sx={{ color: theme.palette.error.main }}>{errors.description.message}</FormHelperText>
            )}
          </FormControl>
        </Box>
      </DialogContent>

      <Box
        sx={{
          height: '88px',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
          boxShadow: `0px -2px 6px ${alpha(theme.palette.customColors.deepDark, 0.1)}`
        }}
      >
        <LoadingButton
          variant='outlined'
          size='large'
          onClick={handleDelete}
          disabled={loading}
          loading={loading}
          sx={{
            flex: 1,
            height: '56px',
            borderColor: theme.palette.customColors.Error,
            color: theme.palette.customColors.Error,
            '&:hover': {
              borderColor: theme.palette.customColors.Error,
              backgroundColor: theme.palette.customColors.ErrorContainer
            }
          }}
        >
          {t('delete')}
        </LoadingButton>
        <LoadingButton
          type='submit'
          variant='contained'
          disabled={loading}
          loading={loading}
          onClick={handleSubmit(onSubmit)}
          sx={{
            flex: 1,
            height: '56px',
            backgroundColor: theme.palette.primary.light,
            color: theme.palette.primary.contrastText
          }}
        >
          {t('update')}
        </LoadingButton>
      </Box>
    </Dialog>
  )
}

export default EditTemplateForm
