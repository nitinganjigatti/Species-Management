'use client'

import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import * as skin from 'src/views/pages/species-management/ipad3/skin'

export interface SpeciesOption {
  id: number
  name: string
  scientific: string
}

/** Compact, searchable species picker styled to match the date-range Select. Empty = All species
 *  (dashboard stays in cross-species mode); picking one drops the dashboard into single-species mode. */
export default function DashboardSpeciesPicker({
  options,
  value,
  onChange
}: {
  options: SpeciesOption[]
  value: number | null
  onChange: (id: number | null) => void
}) {
  const theme = useTheme() as any
  const cc = theme.palette.customColors
  const selected = value != null ? options.find(o => o.id === value) ?? null : null

  return (
    <Autocomplete
      size='small'
      options={options}
      value={selected}
      onChange={(_e, opt) => onChange(opt ? opt.id : null)}
      getOptionLabel={o => o.name}
      isOptionEqualToValue={(o, v) => o.id === v.id}
      // 2,352 options — cap the rendered list so search stays snappy.
      filterOptions={(opts, state) => {
        const q = state.inputValue.trim().toLowerCase()
        if (!q) return opts.slice(0, 50)
        const hits = opts.filter(o => o.name.toLowerCase().includes(q) || o.scientific.toLowerCase().includes(q))

        return hits.slice(0, 50)
      }}
      sx={{ width: 260 }}
      popupIcon={<Icon icon='mdi:chevron-down' fontSize='1.25rem' color={skin.INK2} />}
      renderInput={params => (
        <TextField
          {...params}
          placeholder='All species'
          sx={{
            // The Gender-pill dropdown grammar (2026-09-01) — same as detailUi CategoryFilter.
            bgcolor: 'background.paper',
            borderRadius: '999px',
            '& .MuiInputBase-root': { borderRadius: '999px', fontSize: '15px', fontWeight: 500, color: skin.INK2 },
            '& .MuiInputBase-input::placeholder': { color: skin.INK2, opacity: 1 },
            '& .MuiAutocomplete-popupIndicator': { color: skin.INK2 },
            '& .MuiOutlinedInput-notchedOutline': { borderColor: skin.HAIR },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: skin.TRACK },
            '&:hover .MuiInputBase-root': { backgroundColor: skin.ROW_HOVER }
          }}
        />
      )}
      renderOption={(props, o) => (
        <Box component='li' {...props} key={o.id} sx={{ display: 'block !important' }}>
          <Typography variant='body2' sx={{ color: cc.OnSurfaceVariant, fontWeight: 500 }} noWrap>
            {o.name}
          </Typography>
          <Typography variant='caption' sx={{ color: cc.neutralSecondary, fontStyle: 'italic' }} noWrap>
            {o.scientific}
          </Typography>
        </Box>
      )}
    />
  )
}
