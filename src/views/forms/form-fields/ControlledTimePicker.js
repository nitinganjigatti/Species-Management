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

  // minTime,
  // maxTime,
  // disableIgnoringDatePart = false,
  sx = {},
  size = 'large'
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

          // minTime={minTime}
          // maxTime={maxTime}
          // disableIgnoringDatePart={disableIgnoringDatePart}
          minutesStep={minutesStep}
          error={!!error}
          size={size}
          helperText={error?.message}
          sx={sx}

          // shouldDisableTime={(timeValue, view) => {
          //   if (view === 'hours') {
          //     if (minTime && maxTime) {
          //       const hour = timeValue.hour()
          //       const minHour = minTime.getHours()
          //       const maxHour = maxTime.getHours()

          //       return hour < minHour || hour > maxHour
          //     }
          //   }
          //   if (view === 'minutes') {
          //     if (minTime && maxTime) {
          //       const hour = timeValue.hour()
          //       const minute = timeValue.minute()
          //       const minHour = minTime.getHours()
          //       const maxHour = maxTime.getHours()
          //       const minMinute = minTime.getMinutes()
          //       const maxMinute = maxTime.getMinutes()

          //       // If current hour is the min hour, disable minutes before min minute
          //       if (hour === minHour && minute < minMinute) return true

          //       // If current hour is the max hour, disable minutes after max minute
          //       if (hour === maxHour && minute > maxMinute) return true
          //     }
          //   }

          //   return false
          // }}
        />
      )}
    />
  )
}

export default ControlledTimePicker