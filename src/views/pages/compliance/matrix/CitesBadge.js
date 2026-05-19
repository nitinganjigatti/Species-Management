import { Box, Tooltip } from '@mui/material'

const CITES_META = {
  I: { label: 'CITES Appendix I — strictest', bg: 'customColors.Tertiary', fg: 'common.white' },
  II: { label: 'CITES Appendix II', bg: 'warning.main', fg: 'common.white' },
  III: { label: 'CITES Appendix III', bg: 'customColors.BgTeritary', fg: 'customColors.Tertiary' },
  NL: { label: 'Not listed in CITES', bg: 'customColors.Surface', fg: 'customColors.neutralSecondary' }
}

const normalize = code => {
  if (!code) return null
  const upper = String(code).toUpperCase().replace(/\s+/g, '')

  // Multi-list values like "I/II" or "I,II,III" — treat as the strictest (I)
  if (upper.includes('I')) {
    if (upper === 'III') return 'III'
    if (upper === 'II') return 'II'
    return 'I'
  }

  if (upper === 'NL' || upper === 'NONE') return 'NL'

  return null
}

const CitesBadge = ({ code }) => {
  const normalized = normalize(code)
  if (!normalized) return null
  const meta = CITES_META[normalized]

  return (
    <Tooltip title={meta.label}>
      <Box
        component='span'
        sx={{
          display: 'inline-block',
          px: 0.75,
          py: 0.125,
          ml: 0.5,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.04em',
          borderRadius: 0.5,
          lineHeight: 1.4,
          border: 1,
          borderColor: 'transparent',
          bgcolor: meta.bg,
          color: meta.fg
        }}
      >
        {`CITES ${normalized}`}
      </Box>
    </Tooltip>
  )
}

export default CitesBadge
