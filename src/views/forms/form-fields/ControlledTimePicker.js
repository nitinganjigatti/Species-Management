// components/form-fields/ControlledTimePicker.js
import React from 'react'
import { Controller } from 'react-hook-form'
import MUITimePicker from './MUITimePicker'

const ControlledTimePicker = ({
    name,
    control,
    label = 'Select Time',
    required = false,
    format = 'hh:mm A',
    views = ['hours', 'minutes'],
    disabled = false,
    ampm = true,
    minutesStep = 1,
    sx = {}
}) => {
    return (
        <Controller
            name={name}
            control={control}
            rules={{ required: required ? 'This field is required' : false }}
            render={({ field, fieldState: { error } }) => (
                <MUITimePicker
                    value={field.value || null}
                    onChange={field.onChange}
                    label={label}
                    format={format}
                    views={views}
                    disabled={disabled}
                    ampm={ampm}
                    minutesStep={minutesStep}
                    error={!!error}
                    helperText={error?.message}
                    sx={sx}
                />
            )}
        />
    )
}

export default ControlledTimePicker