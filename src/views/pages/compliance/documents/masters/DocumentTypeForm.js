import React from 'react'
import {
  Box,
  FormControl,
  FormHelperText,
  FormControlLabel,
  FormLabel,
  Checkbox,
  RadioGroup,
  Radio,
  CircularProgress
} from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { LoadingButton } from '@mui/lab'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import { useTheme, alpha } from '@mui/material/styles'

const schema = yup.object().shape({
  name: yup
    .string()
    .required('Document Name is required')
    .transform(val => val?.trim()),
  description: yup
    .string()
    .transform(val => val?.trim())
    .nullable(),
  contexts: yup.array().min(1, 'Select at least one context'),
  active: yup.string().required('Status is required')
})

export const useDocumentTypeForm = defaultValues =>
  useForm({
    defaultValues,
    resolver: yupResolver(schema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    shouldUnregister: false
  })

const DocumentTypeForm = ({
  control,
  errors = {},
  handleSubmit,
  onSubmit,
  submitLoader,
  isEdit,
  tradeContextTypes = [],
  contextLoading = false
}) => {
  const theme = useTheme()

  return (
    <Box
      component='form'
      autoComplete='off'
      onSubmit={handleSubmit(onSubmit)}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative'
      }}
    >
    
      <Box sx={{ flex: 1, overflowY: 'auto', p: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Box
          sx={{
            border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
            p: 4,
            borderRadius: '8px',
            bgcolor: theme.palette.common.white
          }}
        >
          <ControlledTextField name='name' label='Document Name*' control={control} errors={errors} required />
        </Box>

        {/* <ControlledTextField
          name='description'
          label='Description*'
          control={control}
          errors={errors}
          fullWidth
          inputProps={{ multiline: true, rows: 3 }}
        /> */}

        <FormControl fullWidth error={!!errors.contexts}>
          <FormLabel
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontWeight: 500,
              fontSize: '20px',
              mb: 2,
              '&.Mui-focused': {
                color: theme.palette.customColors.OnSurfaceVariant
              },
              '&.Mui-error': {
                color: theme.palette.customColors.OnSurfaceVariant
              }
            }}
          >
            Select Form Type
          </FormLabel>
          {contextLoading ? (
            <Box
              sx={{
                border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                borderRadius: '8px',
                bgcolor: theme.palette.common.white,
                mt: 5,
                width: '100%',
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <CircularProgress size={20} sx={{ my: 2, display: 'flex', justifyContent: 'center', width: '100%' }} />
            </Box>
          ) : (
            <Box
              sx={{
                border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                p: 2,
                pt: 4,
                pb: 4,
                borderRadius: '8px',
                bgcolor: theme.palette.common.white,
                mt: 2
              }}
            >
              <Controller
                name='contexts'
                control={control}
                render={({ field }) => (
                  <>
                    {tradeContextTypes.map(opt => (
                      <FormControlLabel
                        key={opt.id}
                        labelPlacement='start'
                        control={
                          <Checkbox
                            value={opt.id}
                            checked={field.value?.includes(opt.id) || false}
                            onChange={e => {
                              const newVal = e.target.checked
                                ? [...(field.value || []), opt.id]
                                : (field.value || []).filter(v => v !== opt.id)
                              field.onChange(newVal)
                            }}
                            sx={{
                              ml: 13,
                              p: 1,
                              '&.MuiCheckbox-root': {
                                color: theme.palette.customColors.Antz_Minor_Medium
                              },
                              '& .MuiSvgIcon-root': {
                                borderRadius: '4px',
                                backgroundColor: 'transparent'
                              }
                            }}
                          />
                        }
                        label={
                          <Box
                            component='span'
                            sx={{
                              color: theme.palette.customColors.Antz_Minor_Medium,
                              fontWeight: 500,
                              fontSize: '14px'
                            }}
                          >
                            {opt.label}
                          </Box>
                        }
                        sx={{
                          border: `1px solid ${field.value?.includes(opt.id) ? theme.palette.primary.main : '#D0D5DD'}`,
                          m: 1.7,
                          borderRadius: '4px',
                          p: 2,
                          bgcolor: `${
                            field.value?.includes(opt.id)
                              ? theme.palette.customColors.Surface
                              : theme.palette.common.white
                          }`,
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                      />
                    ))}
                  </>
                )}
              />
            </Box>
          )}
          {errors.contexts && <FormHelperText>{errors.contexts.message}</FormHelperText>}
        </FormControl>

        {/* <FormControl fullWidth>
          <FormLabel>Status</FormLabel>
          <Controller
            name='active'
            control={control}
            render={({ field }) => (
              <RadioGroup row {...field}>
                <FormControlLabel value='1' control={<Radio />} label='Active' />
                <FormControlLabel value='0' control={<Radio />} label='Inactive' />
              </RadioGroup>
            )}
          />
          {errors.active && <FormHelperText error>{errors.active.message}</FormHelperText>}
        </FormControl> */}
      </Box>

      {/* Sticky Submit Button */}
      <Box
        sx={{
          position: 'sticky',
          bottom: 0,
          bgcolor: theme.palette.common.white,
          boxShadow: `0px -4px 21px 0px ${alpha(theme.palette.grey[900], 0.25)}`,
          px: 5,
          py: 6,
          zIndex: 10
        }}
      >
        <LoadingButton type='submit' variant='contained' loading={submitLoader} sx={{ py: 3 }} fullWidth>
          {isEdit ? 'Update Document' : 'Add Document'}
        </LoadingButton>
      </Box>
    </Box>
  )
}

export default DocumentTypeForm
