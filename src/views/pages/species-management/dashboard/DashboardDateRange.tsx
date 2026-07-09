'use client'

import { forwardRef } from 'react'
import Box from '@mui/material/Box'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import { useTheme } from '@mui/material/styles'
import DatePicker from 'react-datepicker'
import DatePickerWrapper from 'src/@core/styles/libs/react-datepicker'

export type RangePreset =
  | 'today'
  | 'last_week'
  | 'this_month'
  | 'last_30'
  | 'last_6m'
  | 'last_1y'
  | 'last_2y'
  | 'last_3y'
  | 'all'
  | 'custom'

export interface RangeSelection {
  preset: RangePreset
  start: Date | null
  end: Date | null
}

export const PRESETS: { key: RangePreset; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'last_week', label: 'Last week' },
  { key: 'this_month', label: 'This month' },
  { key: 'last_30', label: 'Last 30 days' },
  { key: 'last_6m', label: 'Last 6 months' },
  { key: 'last_1y', label: 'Last 1 year' },
  { key: 'last_2y', label: 'Last 2 years' },
  { key: 'last_3y', label: 'Last 3 years' },
  { key: 'all', label: 'All time' },
  { key: 'custom', label: 'Custom range' }
]

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const addDays = (d: Date, n: number) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)

  return x
}

/** Resolve a selection to a concrete [from, to] window. `from === null` means open-start (all time). */
export function resolveRange(sel: RangeSelection, now: Date): { from: Date | null; to: Date } {
  const to = now
  switch (sel.preset) {
    case 'today':
      return { from: startOfDay(now), to }
    case 'last_week':
      return { from: addDays(now, -7), to }
    case 'this_month':
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to }
    case 'last_30':
      return { from: addDays(now, -30), to }
    case 'last_6m':
      return { from: new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()), to }
    case 'last_1y':
      return { from: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()), to }
    case 'last_2y':
      return { from: new Date(now.getFullYear() - 2, now.getMonth(), now.getDate()), to }
    case 'last_3y':
      return { from: new Date(now.getFullYear() - 3, now.getMonth(), now.getDate()), to }
    case 'all':
      return { from: null, to }
    case 'custom':
      return { from: sel.start ? startOfDay(sel.start) : null, to: sel.end || to }
    default:
      return { from: null, to }
  }
}

/** "YYYY-MM" month key for a date (used to filter the monthly trend series). */
export const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

const fmt = (d: Date) =>
  `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`

export default function DashboardDateRange({
  value,
  onChange
}: {
  value: RangeSelection
  onChange: (sel: RangeSelection) => void
}) {
  const theme = useTheme() as any
  const cc = theme.palette.customColors

  const CustomInput = forwardRef((props: any, ref) => {
    const s = props.start ? fmt(props.start) : ''
    const e = props.end ? ` – ${fmt(props.end)}` : ''

    return <TextField size='small' inputRef={ref} {...props} value={`${s}${e}`} sx={{ width: 220 }} />
  })

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
      <Select
        size='small'
        value={value.preset}
        onChange={e => onChange({ preset: e.target.value as RangePreset, start: value.start, end: value.end })}
        sx={{ minWidth: 160, bgcolor: 'background.paper', '& .MuiOutlinedInput-notchedOutline': { borderColor: cc.SurfaceVariant } }}
      >
        {PRESETS.map(p => (
          <MenuItem key={p.key} value={p.key}>
            {p.label}
          </MenuItem>
        ))}
      </Select>

      {value.preset === 'custom' && (
        <DatePickerWrapper>
          <DatePicker
            selectsRange
            startDate={value.start}
            endDate={value.end}
            selected={value.start}
            shouldCloseOnSelect={false}
            onChange={(dates: [Date | null, Date | null]) => {
              const [start, end] = dates
              onChange({ preset: 'custom', start, end })
            }}
            customInput={<CustomInput start={value.start} end={value.end} />}
          />
        </DatePickerWrapper>
      )}
    </Box>
  )
}
