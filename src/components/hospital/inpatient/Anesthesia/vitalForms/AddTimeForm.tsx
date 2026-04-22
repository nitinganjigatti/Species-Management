'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { LocalizationProvider, TimePicker } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'

import VitalFormDialog from './VitalFormDialog'

dayjs.extend(customParseFormat)

const SUBMIT_BUTTON_STYLES = {
  height: '42px',
  borderRadius: '8px',
  boxShadow: '0px 4px 8px -4px #4C4E646B'
}

const parseInitialValue = (initialValue: any) => {
  if (initialValue) {
    const parsed = dayjs(initialValue, 'hh:mm A', true)
    if (parsed.isValid()) {
      return parsed
    }
  }

  return dayjs()
}

interface AddTimeFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  initialValue?: string
}

export default function AddTimeForm({ open, onClose, onSubmit, initialValue = '' }: AddTimeFormProps) {
  const { t } = useTranslation()
  const theme: any = useTheme()
  const [timeValue, setTimeValue] = useState<any>(() => parseInitialValue(initialValue))
  const timeInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (open) {
      setTimeValue(parseInitialValue(initialValue))
      setTimeout(() => {
        timeInputRef.current?.focus()
      }, 0)
    }
  }, [open, initialValue])

  const handleSubmit = () => {
    if (!timeValue || !timeValue.isValid()) {
      return
    }

    onSubmit({ timeLabel: timeValue.format('hh:mm A') })
  }

  const disableSubmit = useMemo(() => !timeValue || !timeValue.isValid(), [timeValue])

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    handleSubmit()
  }

  const timePickerTextFieldStyles = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '8px',
      height: '56px',
      backgroundColor: theme.palette.primary.contrastText,
      '& fieldset': {
        borderColor: theme.palette.customColors?.OutlineVariant || theme.palette.divider
      },
      '&:hover fieldset': {
        borderColor: theme.palette.primary.main
      },
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.primary.main
      }
    },
    '& .MuiOutlinedInput-input': {
      fontFamily: 'Inter',
      fontWeight: 500,
      fontSize: '18px',
      letterSpacing: 0,
      color: theme.palette.customColors?.customHeadingTextColor || theme.palette.text.primary
    },
    '& .MuiInputAdornment-root': {
      color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.secondary
    }
  }

  const labelStyles = {
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: '16px',
    letterSpacing: 0,
    color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
  }

  return (
    <VitalFormDialog
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={initialValue ? t('hospital_module.update_time') || "" : t('hospital_module.add_time') || ""}
      hideCancel
      title={initialValue ? t('edit') || "" : t('hospital_module.add_time') || ""}
      disableSubmit={disableSubmit}
      headerSx={{
        height: '52px',
        padding: '16px',
        backgroundColor: theme.palette.customColors?.displaybgPrimary || theme.palette.background.default,
        gap: '10px'
      }}
      titleTypographySx={{
        fontWeight: 500,
        fontSize: '16px',
        color: theme.palette.customColors?.neutralPrimary || theme.palette.text.primary
      }}
      closeButtonSx={{
        width: '20px',
        height: '20px',
        padding: '4.17px',
        border: 'none',
        color: theme.palette.customColors?.Outline || theme.palette.text.secondary,
        marginRight: '0px'
      }}
      contentSx={{
        flex: 1,
        paddingTop: '12px !important',
        paddingRight: '16px',
        paddingBottom: '24px',
        paddingLeft: '16px',
        gap: '20px',
        backgroundColor: theme.palette.primary.contrastText,
        display: 'flex',
        flexDirection: 'column'
      }}
      actionsSx={{
        backgroundColor: theme.palette.primary.contrastText,
        justifyContent: 'center',
        padding: '0 16px 16px',
        width: '100%'
      }}
      submitButtonSx={{
        ...SUBMIT_BUTTON_STYLES,
        width: '100%'
      }}
      paperSx={{
        width: '293px',
        maxWidth: '293px',
        minWidth: '293px',
        height: '233px',
        borderWidth: '1px'
      }}
      maxWidth='xs'
    >
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box
          component='form'
          onSubmit={handleFormSubmit}
          sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <Typography sx={labelStyles}>{t('hospital_module.recorded_time')}</Typography>

          <TimePicker
            value={timeValue}
            onChange={(newValue: any) => setTimeValue(newValue)}
            format='hh:mm A'
            slotProps={{
              textField: {
                fullWidth: true,
                placeholder: t('hospital_module.select_time'),
                sx: timePickerTextFieldStyles,
                inputRef: timeInputRef,
                inputProps: {
                  placeholder: t('hospital_module.select_time')
                }
              },
              openPickerButton: {
                sx: {
                  color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.secondary
                }
              }
            } as any}
          />
        </Box>
      </LocalizationProvider>
    </VitalFormDialog>
  )
}
