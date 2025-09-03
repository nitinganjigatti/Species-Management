import React from 'react'
import { Controller, useFormState } from 'react-hook-form'
import {
  FormControl,
  InputLabel,
  OutlinedInput,
  Select,
  MenuItem,
  FormHelperText,
  Tooltip,
  Typography
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import get from 'lodash/get'

function ControlledSelectWithTextField({
  name = {},
  label,
  control,
  textFieldName = name.text,
  selectFieldName = name.select,
  options = [],
  disabled = false,
  getOptionLabel = option => option,
  getOptionValue = option => option,
  isOptionDisabled = () => false,
  fullWidth = true,
  placeholder = '',
  type = 'text',
  readOnly = false,
  onChangeOverride,
  inputProps = {},
  onKeyDown,
  onPaste,
  onInput,
  size = 'large',
  sx = {},
  required = false
}) {
  const theme = useTheme()
  const { errors } = useFormState({ control })
  const textError = get(errors, textFieldName)?.message
  const selectError = get(errors, selectFieldName)?.message

  return (
    <FormControl size={size} fullWidth={fullWidth} error={Boolean(textError || selectError)} sx={sx}>
      <InputLabel htmlFor={`${textFieldName || 'text'}-input`} id={`${textFieldName || 'text'}-label`}>
        {label}
      </InputLabel>
      <Controller
        required={required}
        name={textFieldName}
        control={control}
        render={({ field: textField }) => (
          <OutlinedInput
            {...textField}
            id={`${textFieldName || 'text'}-input`}
            label={label}
            type={type}
            placeholder={placeholder}
            disabled={disabled}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            onInput={onInput}
            error={Boolean(textError || selectError)}
            inputProps={{
              readOnly,
              ...inputProps
            }}
            endAdornment={
              <Controller
                name={selectFieldName}
                control={control}
                render={({ field: selectField }) => (
                  <Select
                    {...selectField}
                    variant='standard'
                    disableUnderline
                    displayEmpty
                    disabled={disabled}
                    error={Boolean(selectError)}
                    sx={{ minWidth: 60, maxWidth: 120, textAlign: 'center', ml: 1 }}
                  >
                    <MenuItem value='' disabled>
                      Select
                    </MenuItem>
                    {options.map((option, index) => (
                      <MenuItem key={index} value={getOptionValue(option)} disabled={isOptionDisabled(option)}>
                        <Tooltip title={getOptionLabel(option)} arrow placement='top'>
                          <Typography
                            sx={{
                              color: theme.palette.customColors?.OnSurfaceVarient || 'text.primary',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {getOptionLabel(option)}
                          </Typography>
                        </Tooltip>
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
            }
            sx={{ flex: 1 }}
          />
        )}
      />
      {/* Error messages */}
      {(textError || selectError) && <FormHelperText>{textError || selectError}</FormHelperText>}
    </FormControl>
  )
}

export default React.memo(ControlledSelectWithTextField)
