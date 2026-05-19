import { Stack, Chip } from '@mui/material'

const ClassChipBar = ({ options = [], value, onChange }) => {
  const items = [{ id: '', label: 'All classes' }, ...options]

  return (
    <Stack
      direction='row'
      spacing={1}
      sx={{
        flexWrap: 'wrap',
        gap: 1,
        mb: 2,
        pb: 2,
        borderBottom: 1,
        borderColor: 'customColors.SurfaceVariant'
      }}
    >
      {items.map(opt => {
        const active = (value || '') === (opt.id || '')
        return (
          <Chip
            key={opt.id || 'all'}
            label={opt.label}
            onClick={() => onChange(opt.id || '')}
            size='small'
            sx={{
              borderRadius: 999,
              fontWeight: active ? 600 : 500,
              fontSize: 12,
              bgcolor: active ? 'primary.main' : 'background.paper',
              color: active ? 'common.white' : 'customColors.OnSurfaceVariant',
              border: 1,
              borderColor: active ? 'primary.main' : 'customColors.SurfaceVariant',
              '&:hover': {
                bgcolor: active ? 'primary.dark' : 'customColors.Surface',
                borderColor: 'primary.main'
              }
            }}
          />
        )
      })}
    </Stack>
  )
}

export default ClassChipBar
