'use client'

import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'

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
      renderInput={params => (
        <TextField
          {...params}
          placeholder='All species'
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <Box sx={{ display: 'flex', alignItems: 'center', pl: 0.5, color: cc.Outline }}>
                <Icon icon='mdi:paw-outline' fontSize='1.15rem' />
              </Box>
            )
          }}
          sx={{
            bgcolor: 'background.paper',
            borderRadius: '8px',
            '& .MuiOutlinedInput-notchedOutline': { borderColor: cc.SurfaceVariant }
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
