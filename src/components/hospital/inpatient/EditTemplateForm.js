import React from 'react'
import { Dialog, DialogContent, IconButton, Box, Typography, FormControl, FormHelperText } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import Icon from 'src/@core/components/icon'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import { LoadingButton } from '@mui/lab'
import RichTextEditor from 'src/components/RichTextEditor'

// Validation schema
const schema = yup.object().shape({
  name: yup.string().required('Template name is required'),
  description: yup.string().required('Description is required')
})

const EditTemplateForm = ({ open, onClose, template, onUpdate, onDelete, loading = false }) => {
  const theme = useTheme()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      description: ''
    }
  })

  // Reset form when template changes
  React.useEffect(() => {
    if (template) {
      reset({
        name: template.name || template.title || '',
        description: template.description || ''
      })
    }
  }, [template, reset])

  const onSubmit = formData => {
    onUpdate(formData)
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
          backgroundColor: '#fff'
        }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px',
          height: '77px',
          borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`
        }}
      >
        <Typography
          sx={{
            fontFamily: 'Inter',
            fontWeight: 500,
            fontStyle: 'Medium',
            fontSize: '24px',
            fontWeight: 500,
            letterSpacing: '0%',
            color: theme.palette.customColors.onSurfaceVariant
          }}
        >
          Edit Template
        </Typography>
        <IconButton
          onClick={handleClose}
          sx={{
            color: theme.palette.primary.light,
            '&:hover': {
              backgroundColor: 'rgba(131, 157, 141, 0.1)'
            }
          }}
        >
          <Icon icon='mdi:close' fontSize={24} />
        </IconButton>
      </Box>

      <Box component='form' onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ p: '24px' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Template Name Field */}
            <ControlledTextField
              name='name'
              control={control}
              errors={errors}
              label={'Template Name'}
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
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value || ''}
                    onChange={value => field.onChange(value?.html || '')}
                    label='Description'
                    placeholder='Enter description...'
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
            boxShadow: '0px -1px 30px rgba(0, 0, 0, 0.1)'
          }}
        >
          <LoadingButton
            variant='outlined'
            size='large'
            onClick={handleDelete}
            sx={{
              flex: 1,
              height: '56px',
              borderColor: theme.palette.customColors.OutlineVariant,
              color: theme.palette.customColors.neutralSecondary,
              '&:hover': {
                borderColor: theme.palette.customColors.neutralSecondary,
                backgroundColor: theme.palette.customColors.mdAntzNeutral
              }
            }}
          >
            Close
          </LoadingButton>
          <LoadingButton
            type='submit'
            variant='contained'
            disabled={loading}
            sx={{
              flex: 1,
              height: '56px',
              backgroundColor: theme.palette.primary.light,
              color: theme.palette.primary.contrastText
            }}
          >
            UPDATE
          </LoadingButton>
        </Box>
      </Box>
    </Dialog>
  )
}

export default EditTemplateForm
