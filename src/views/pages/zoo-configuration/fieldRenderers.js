import { useState } from 'react'
import toast from 'react-hot-toast'
import moment from 'moment-timezone'
import dayjs from 'dayjs'
import {
  Autocomplete, Box, Chip, Avatar, FormControlLabel,
  Radio, RadioGroup, Switch, TextField, Typography
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import MUITimePicker from 'src/views/forms/form-fields/MUITimePicker'
import MultiUserDrawer from 'src/components/zoo-configuration/MultiUserDrawer'

// ── Shared constants ──────────────────────────────────────────────

const TIMEZONES = moment.tz.names().map(tz => ({
  value: tz,
  label: `${tz} (UTC${moment.tz(tz).format('Z')})`
}))

const CURRENCY_NAMES = new Intl.DisplayNames(['en'], { type: 'currency' })

const CURRENCIES = (() => {
  try {
    return Intl.supportedValuesOf('currency').map(code => {
      let name = code
      try { name = CURRENCY_NAMES.of(code) } catch (_) {}

      return { value: code, label: `${code} — ${name}` }
    })
  } catch (_) {
    return [
      { value: 'INR', label: 'INR — Indian Rupee' },
      { value: 'USD', label: 'USD — US Dollar' },
      { value: 'EUR', label: 'EUR — Euro' },
      { value: 'GBP', label: 'GBP — British Pound Sterling' },
      { value: 'AED', label: 'AED — UAE Dirham' },
      { value: 'AUD', label: 'AUD — Australian Dollar' },
      { value: 'CAD', label: 'CAD — Canadian Dollar' },
      { value: 'CHF', label: 'CHF — Swiss Franc' },
      { value: 'CNY', label: 'CNY — Chinese Yuan' },
      { value: 'JPY', label: 'JPY — Japanese Yen' },
      { value: 'SGD', label: 'SGD — Singapore Dollar' },
      { value: 'ZAR', label: 'ZAR — South African Rand' }
    ]
  }
})()

const AUTOCOMPLETE_SX = {
  width: '100%',
  '& input': { minWidth: '0 !important' },
  '& .MuiAutocomplete-listbox': { maxHeight: 260, fontSize: '13px' }
}

// ── Renderers ─────────────────────────────────────────────────────
// Each renderer receives: { field, value, onChange }
// onChange(newValue) — parent handles state update

const TimezonePicker = ({ field, value, onChange }) => (
  <Autocomplete
    fullWidth
    sx={AUTOCOMPLETE_SX}
    options={TIMEZONES}
    value={TIMEZONES.find(tz => tz.value === value) || null}
    onChange={(_, option) => onChange(option?.value || null)}
    getOptionLabel={option => option.label}
    isOptionEqualToValue={(opt, val) => opt.value === val.value}
    slotProps={{ listbox: { style: { maxHeight: 260, fontSize: '13px' } } }}
    renderInput={params => (
      <TextField {...params} fullWidth label={field.label} size='small' />
    )}
  />
)

const CurrencyPicker = ({ field, value, onChange }) => (
  <Autocomplete
    fullWidth
    sx={AUTOCOMPLETE_SX}
    options={CURRENCIES}
    value={CURRENCIES.find(c => c.value === value) || null}
    onChange={(_, option) => onChange(option?.value || null)}
    getOptionLabel={option => option.label}
    isOptionEqualToValue={(opt, val) => opt.value === val.value}
    slotProps={{ listbox: { style: { maxHeight: 260, fontSize: '13px' } } }}
    renderInput={params => (
      <TextField {...params} fullWidth label={field.label} size='small' />
    )}
  />
)

const ToggleField = ({ field, value, onChange }) => (
  <FormControlLabel
    control={
      <Switch
        checked={value === 1 || value === true}
        onChange={e => onChange(e.target.checked ? 1 : 0)}
      />
    }
    label={field.label}
    sx={{ ml: 0 }}
  />
)

const RadioField = ({ field, value, onChange }) => (
  <Box>
    <Typography variant='body2' sx={{ mb: 1, fontWeight: 500 }}>
      {field.label}
    </Typography>
    <RadioGroup
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
    >
      {(field.options || []).map(opt => (
        <FormControlLabel
          key={opt.value}
          value={opt.value}
          control={<Radio size='small' />}
          label={opt.label}
        />
      ))}
    </RadioGroup>
  </Box>
)

const DropdownField = ({ field, value, onChange }) => {
  const options = field.options || []

  return (
    <Autocomplete
      fullWidth
      sx={AUTOCOMPLETE_SX}
      options={options}
      value={options.find(o => o.value === value) || null}
      onChange={(_, option) => onChange(option?.value || null)}
      getOptionLabel={option => option.label}
      isOptionEqualToValue={(opt, val) => opt.value === val.value}
      slotProps={{ listbox: { style: { maxHeight: 260, fontSize: '13px' } } }}
      renderInput={params => (
        <TextField {...params} fullWidth label={field.label} size='small' />
      )}
    />
  )
}

const NumberField = ({ field, value, onChange }) => (
  <TextField
    fullWidth
    type='number'
    size='small'
    label={field.label}
    value={value ?? ''}
    onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))}
    inputProps={{
      ...(field.min != null && { min: field.min }),
      ...(field.max != null && { max: field.max })
    }}
  />
)

const TextFieldRenderer = ({ field, value, onChange }) => (
  <TextField
    fullWidth
    size='small'
    label={field.label}
    value={value ?? ''}
    onChange={e => onChange(e.target.value)}
    inputProps={{
      ...(field.maxLength != null && { maxLength: field.maxLength })
    }}
  />
)

const UserPickerField = ({ field, value, onChange }) => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const users = Array.isArray(value) ? value : []

  const handleRemove = userId => {
    onChange(users.filter(u => String(u.user_id) !== String(userId)))
  }

  return (
    <Box>
      <Typography variant='body2' sx={{ mb: 1, fontWeight: 500 }}>
        {field.label}
      </Typography>
      <Box
        onClick={() => setDrawerOpen(true)}
        sx={{
          minHeight: 40,
          border: '1px solid', borderColor: 'customColors.OutlineVariant',
          borderRadius: '8px', px: 2, py: '6px',
          display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center',
          cursor: 'pointer', bgcolor: 'background.paper',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          '&:hover': {
            borderColor: 'primary.main',
            boxShadow: theme => `0 0 0 3px ${theme.palette.primary.main}1A`
          }
        }}
      >
        {users.length === 0 ? (
          <Typography variant='caption' sx={{ color: 'text.disabled' }}>
            Click to add users...
          </Typography>
        ) : (
          users.map(u => (
            <Chip
              key={u.user_id}
              size='small'
              label={u.user_name}
              onDelete={e => { e.stopPropagation(); handleRemove(u.user_id) }}
              avatar={
                <Avatar
                  alt={u.user_name}
                  src={u.user_profile_pic || '/default-avatar.png'}
                  sx={{ width: 20, height: 20 }}
                />
              }
              sx={{
                bgcolor: 'customColors.Surface', color: 'customColors.OnSurfaceVariant',
                border: '1px solid', borderColor: 'customColors.SurfaceVariant', fontWeight: 500, fontSize: '12px',
                '& .MuiChip-avatar': { width: 20, height: 20 },
                '& .MuiChip-deleteIcon': { color: 'customColors.Outline', fontSize: 16, '&:hover': { color: 'customColors.Tertiary' } }
              }}
            />
          ))
        )}
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', color: 'text.disabled' }}>
          <Icon icon='mdi:pencil-outline' fontSize={14} />
        </Box>
      </Box>

      <MultiUserDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onConfirm={selected => onChange(selected)}
        selectedUsers={users}
        headerText={`Select ${field.label}`}
        placeholder='Search by name'
        queryKey={`zoo-settings-${field.key}`}
        confirmText='Confirm'
      />
    </Box>
  )
}

const CheckboxGroupField = ({ field, value, onChange }) => {
  const selected = Array.isArray(value) ? value : []

  const toggle = optValue => {
    if (selected.includes(optValue)) {
      onChange(selected.filter(v => v !== optValue))
    } else {
      onChange([...selected, optValue])
    }
  }

  return (
    <Box>
      <Typography variant='body2' sx={{ mb: 1, fontWeight: 500 }}>
        {field.label}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {(field.options || []).map(opt => {
          const isSelected = selected.includes(opt.value)

          return (
            <Chip
              key={opt.value}
              label={opt.label}
              size='small'
              onClick={() => toggle(opt.value)}
              sx={{
                fontWeight: 500, fontSize: '12.5px', cursor: 'pointer',
                transition: 'all 0.15s',
                ...(isSelected
                  ? {
                      bgcolor: 'primary.main', color: 'primary.contrastText',
                      border: '1px solid', borderColor: 'primary.main',
                      '&:hover': { bgcolor: 'primary.dark' }
                    }
                  : {
                      bgcolor: 'background.paper', color: 'customColors.OnSurfaceVariant',
                      border: '1px solid', borderColor: 'customColors.SurfaceVariant',
                      '&:hover': { borderColor: 'primary.main', bgcolor: 'customColors.Surface' }
                    })
              }}
            />
          )
        })}
      </Box>
    </Box>
  )
}

const TimePickerListField = ({ field, value, onChange }) => {
  const times = Array.isArray(value) ? value : []
  const maxItems = field.max_items || 3

  const handleAdd = () => {
    if (times.length >= maxItems) return
    onChange([...times, '08:00'])
  }

  const handleRemove = idx => {
    const updated = times.filter((_, i) => i !== idx)
    onChange(updated)
  }

  const toMinutes = t => {
    const [h, m] = t.split(':').map(Number)

    return h * 60 + m
  }

  const handleChange = (idx, newVal) => {
    if (!newVal || !newVal.isValid()) return
    const formatted = newVal.format('HH:mm')
    const newMins = toMinutes(formatted)

    // Enforce 30-min gap from other times
    const tooClose = times.some((t, i) => {
      if (i === idx || !t) return false
      const diff = Math.abs(newMins - toMinutes(t))
      const wrappedDiff = Math.min(diff, 1440 - diff)

      return wrappedDiff < 30
    })

    if (tooClose) {
      toast.error('Send times must be at least 30 minutes apart')

      return
    }

    const updated = [...times]
    updated[idx] = formatted
    onChange(updated)
  }

  return (
    <Box>
      <Typography variant='body2' sx={{ mb: 0.5, fontWeight: 500 }}>
        {field.label}
      </Typography>
      <Typography variant='caption' sx={{ mb: 1, color: 'text.disabled', display: 'block' }}>
        Reports are dispatched within a 15-minute window of the selected time
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
        {times.map((t, idx) => (
          <Box
            key={idx}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, maxWidth: 180 }}
          >
            <MUITimePicker
              value={t ? dayjs(`2000-01-01 ${t}`) : null}
              onChange={val => handleChange(idx, val)}
              label=''
              format='hh:mm A'
              size='small'
              ampm
              sx={{ '& .MuiInputBase-input': { fontSize: '13px', py: '8px' } }}
            />
            <Box
              onClick={() => handleRemove(idx)}
              sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 24, height: 24, borderRadius: '50%', cursor: 'pointer', flexShrink: 0,
                color: 'customColors.Outline', transition: 'all 0.15s',
                '&:hover': { color: 'customColors.Tertiary', bgcolor: 'customColors.BgTeritary' }
              }}
            >
              <Icon icon='mdi:close' fontSize={16} />
            </Box>
          </Box>
        ))}
        {times.length < maxItems && (
          <Box
            onClick={handleAdd}
            sx={{
              display: 'inline-flex', alignItems: 'center', gap: 0.5,
              border: '1px dashed', borderColor: 'customColors.OutlineVariant',
              borderRadius: '6px', px: 1.5, py: '7px',
              cursor: 'pointer', color: 'primary.main', fontSize: '12.5px', fontWeight: 500,
              transition: 'all 0.15s',
              '&:hover': { borderColor: 'primary.main', bgcolor: 'customColors.Surface' }
            }}
          >
            <Icon icon='mdi:plus' fontSize={14} />
            Add time
          </Box>
        )}
      </Box>
    </Box>
  )
}

// ── Registry ──────────────────────────────────────────────────────

const FIELD_RENDERERS = {
  timezone_picker: TimezonePicker,
  currency_picker: CurrencyPicker,
  toggle: ToggleField,
  radio: RadioField,
  dropdown: DropdownField,
  number: NumberField,
  text: TextFieldRenderer,
  user_picker: UserPickerField,
  checkbox_group: CheckboxGroupField,
  time_picker_list: TimePickerListField
}

export const getFieldRenderer = type => FIELD_RENDERERS[type] || TextFieldRenderer
