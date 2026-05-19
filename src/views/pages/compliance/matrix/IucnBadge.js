import { Box, Tooltip } from '@mui/material'

const IUCN_META = {
  LC: { label: 'Least Concern', bg: 'success.main', fg: 'common.white' },
  NT: { label: 'Near Threatened', bg: 'success.light', fg: 'common.white' },
  VU: { label: 'Vulnerable', bg: 'warning.main', fg: 'common.white' },
  EN: { label: 'Endangered', bg: 'warning.dark', fg: 'common.white' },
  CR: { label: 'Critically Endangered', bg: 'customColors.Tertiary', fg: 'common.white' },
  EW: { label: 'Extinct in Wild', bg: 'error.dark', fg: 'common.white' },
  EX: { label: 'Extinct', bg: 'grey.900', fg: 'common.white' },
  DD: { label: 'Data Deficient', bg: 'grey.500', fg: 'common.white' },
  NE: { label: 'Not Evaluated', bg: 'customColors.SurfaceVariant', fg: 'customColors.OnSurfaceVariant' }
}

const IucnBadge = ({ code }) => {
  if (!code) return null
  const meta = IUCN_META[code.toUpperCase()]
  if (!meta) return null

  return (
    <Tooltip title={`IUCN · ${meta.label}`}>
      <Box
        component='span'
        sx={{
          display: 'inline-block',
          px: 0.75,
          py: 0.125,
          ml: 0.75,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.04em',
          borderRadius: 0.5,
          lineHeight: 1.4,
          bgcolor: meta.bg,
          color: meta.fg
        }}
      >
        {code.toUpperCase()}
      </Box>
    </Tooltip>
  )
}

export default IucnBadge
