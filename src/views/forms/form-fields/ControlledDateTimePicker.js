import React from 'react'
import { Controller } from 'react-hook-form'
import MUIDateTimePicker from './MUIDateTimePicker'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import { useTheme } from '@mui/material/styles'

const locale = 'en'

const ControlledDateTimePicker = ({
  name,
  control,
  label = dayjs(),
  required = false,
  minDateTime,
  maxDateTime,
  ampm = false,
  format = 'DD MMM YYYY · hh:mm A',
  size = 'medium',
  onChangeOverride = () => {},
  disabled,
  defaultValue = null,
  sx = {},
  slotPropSx = {},
  slotPropTextfieldSx = {}
}) => {
  const theme = useTheme()
  return (
    <>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={locale}>
        <Controller
          name={name}
          control={control}
          defaultValue={defaultValue}
          rules={{ required: required ? 'This field is required' : false }}
          render={({ field, fieldState: { error } }) => (
            <MUIDateTimePicker
              {...field}
              value={field.value ? dayjs(field.value) : null}
              onChange={newValue => {
                const value = newValue ?? dayjs()
                field.onChange(value)
                onChangeOverride?.(value)
              }}
              label={label}
              minDateTime={minDateTime}
              maxDateTime={maxDateTime}
              ampm={ampm}
              disabled={disabled}
              format={format}
              slotProps={{
                textField: {
                  fullWidth: true,
                  label,
                  size,
                  placeholder: dayjs().format('DD MMM YYYY · hh:mm A'),
                  ...slotPropTextfieldSx
                },
                ...slotPropSx
              }}
              sx={{
                '& .MuiInputBase-input': {
                  color: error ? theme.palette.error.main : theme.palette.customColors.OnSurfaceVariant,
                  '&::placeholder': {
                    color: error ? theme.palette.error.main : theme.palette.text.disabled,
                    opacity: 1
                  }
                },
                '& .MuiInputLabel-root': {
                  color: error ? theme.palette.error.main : theme.palette.customColors.Outline
                },
                ...sx
              }}
              error={!!error}
              helperText={error?.message}
            />
          )}
        />
      </LocalizationProvider>
    </>
  )
}

export default React.memo(ControlledDateTimePicker)
