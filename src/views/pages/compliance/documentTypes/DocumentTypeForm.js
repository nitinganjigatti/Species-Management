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

const schema = yup.object().shape({
  name: yup.string().required('Document Name is required').transform(val => val?.trim()),
  description: yup.string().transform(val => val?.trim()).nullable(),
  contexts: yup.array().min(1, 'Select at least one context'),
  status: yup.string().required('Status is required')
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
}) => (
  <Box component='form' autoComplete='off' onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <ControlledTextField
      name='name'
      label='Document Name'
      control={control}
      errors={errors}
      required
    />

    <ControlledTextField
      name='description'
      label='Description'
      control={control}
      errors={errors}
      fullWidth
      inputProps={{ multiline: true, rows: 3 }}
    />

    <FormControl fullWidth error={!!errors.contexts}>
      <FormLabel>Contexts</FormLabel>
      <Box>
        {contextLoading ? (
          <CircularProgress size={20} sx={{ my: 2 }} />
        ) : (
          <Controller
            name='contexts'
            control={control}
            render={({ field }) => (
              <>
                {tradeContextTypes.map(opt => (
                  <FormControlLabel
                    key={opt.id}
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
                      />
                    }
                    label={opt.label}
                  />
                ))}
              </>
            )}
          />
        )}
        {errors.contexts && <FormHelperText>{errors.contexts.message}</FormHelperText>}
      </Box>
    </FormControl>

    <FormControl fullWidth>
      <FormLabel>Status</FormLabel>
      <Controller
        name='status'
        control={control}
        render={({ field }) => (
          <RadioGroup row {...field}>
            <FormControlLabel value='active' control={<Radio />} label='Active' />
            <FormControlLabel value='inactive' control={<Radio />} label='Inactive' />
          </RadioGroup>
        )}
      />
      {errors.status && <FormHelperText error>{errors.status.message}</FormHelperText>}
    </FormControl>

    <LoadingButton type='submit' variant='contained' loading={submitLoader} fullWidth>
      {isEdit ? 'Update' : 'Add'}
    </LoadingButton>
  </Box>
)

export default DocumentTypeForm
