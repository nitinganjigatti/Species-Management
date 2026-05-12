import { Box, Typography } from '@mui/material'

const RankRow = ({ name, value, subtext, percent, onClick }) => (
  <Box
    onClick={onClick}
    sx={{
      px: 5,
      py: 3,
      borderBottom: 1,
      borderColor: 'customColors.SurfaceVariant',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'background 0.1s',
      '&:hover': onClick ? { background: 'customColors.Surface' } : undefined,
      '&:last-of-type': { borderBottom: 'none' }
    }}
  >
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1.5 }}>
      <Typography variant='body2' sx={{ fontWeight: 500, color: 'customColors.OnSurfaceVariant' }}>
        {name}
      </Typography>
      <Typography variant='body2' sx={{ fontWeight: 500 }}>
        {value}
        {subtext ? (
          <Box component='span' sx={{ color: 'customColors.neutralSecondary', fontWeight: 400, ml: 1 }}>
            · {subtext}
          </Box>
        ) : null}
      </Typography>
    </Box>
    <Box sx={{ height: 6, bgcolor: 'customColors.SurfaceVariant', borderRadius: 1.5, overflow: 'hidden' }}>
      <Box sx={{ height: '100%', width: `${Math.max(0, Math.min(100, percent))}%`, bgcolor: 'primary.main', borderRadius: 1.5 }} />
    </Box>
  </Box>
)

export default RankRow
