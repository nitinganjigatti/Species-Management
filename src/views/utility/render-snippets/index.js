import { Badge, Box, CircularProgress, Tooltip, Typography } from '@mui/material'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@emotion/react'
import { bgcolor } from '@mui/system'

export const ExportButton = ({
  loading = false,
  onClick,
  tooltip = 'Download',
  icon = 'ic:round-download',
  iconSize = 20,
  disabled = false,
  bgcolor
}) => {
  const theme = useTheme()

  return (
    <Tooltip placement='bottom' title={tooltip}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          width: '40px',
          height: '40px',
          borderRadius: '4px',
          bgcolor: bgcolor ? bgcolor : theme?.palette.customColors?.lightBg,
          alignItems: 'center',
          cursor: disabled ? '' : 'pointer',
          opacity: disabled ? 0.5 : 1
        }}
        onClick={disabled ? undefined : onClick}
      >
        {loading ? <CircularProgress color='success' size={30} /> : <Icon icon={icon} fontSize={iconSize} />}
      </Box>
    </Tooltip>
  )
}

export const ImportButton = ({
  loading = false,
  onClick,
  tooltip = 'Upload File',
  icon = 'ic:round-upload',
  iconSize = 20,
  disabled = false
}) => {
  const theme = useTheme()

  return (
    <Tooltip placement='bottom' title={tooltip}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          width: '40px',
          height: '40px',
          borderRadius: '4px',
          bgcolor: theme?.palette.customColors?.lightBg,
          alignItems: 'center',
          cursor: disabled ? '' : 'pointer',
          opacity: disabled ? 0.5 : 1
        }}
        onClick={disabled ? undefined : onClick}
      >
        {loading ? <CircularProgress color='success' size={30} /> : <Icon icon={icon} fontSize={iconSize} />}
      </Box>
    </Tooltip>
  )
}

export const FilterButton = ({
  tooltip = 'Filter',
  onClick,
  appliedFiltersCount,
  iconSize = 24,
  icon = 'mage:filter',
  placement = 'bottom'
}) => {
  const theme = useTheme()

  return (
    <Tooltip placement={placement} title={tooltip}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          width: '40px',
          height: '40px',
          borderRadius: '4px',
          bgcolor: theme?.palette.customColors?.lightBg,
          alignItems: 'center',
          cursor: 'pointer'
        }}
        onClick={onClick}
      >
        <Badge badgeContent={appliedFiltersCount} color='primary'>
          <Icon icon={icon} fontSize={iconSize} />
        </Badge>
      </Box>
    </Tooltip>
  )
}

export const VisitType = ({ title }) => {
  const theme = useTheme()

  const typeStyles = {
    'Check up': { background: theme.palette.customColors.antzInfoLight, color: theme.palette.customColors.addPrimary },
    INPATIENT: { background: theme.palette.customColors.OnBackground, color: theme.palette.primary.main },
    'Follow-up': { background: theme.palette.customColors.OnBackground, color: theme.palette.primary.OnSurface },
    Emergency: { background: theme.palette.customColors.Tertiary30, color: theme.palette.customColors.Tertiary },
    Planned: { background: '#FFD3D366', color: theme.palette.customColors.Error }
  }

  const allowedTitles = Object.keys(typeStyles)
  if (!allowedTitles.includes(title)) return null
  const { background, color } = typeStyles[title]
  const isAllUpperCase = title === title.toUpperCase()
  const textTransform = isAllUpperCase ? 'uppercase' : 'none'

  return (
    <>
      <Box
        sx={{
          px: 2,
          py: 1,
          borderRadius: 0.5,
          background,
          display: 'inline-block',
          height: 24,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Typography
          sx={{
            color,
            fontWeight: 500,
            fontSize: '0.88rem',
            letterSpacing: 1,
            textTransform
          }}
        >
          {title}
        </Typography>
      </Box>
    </>
  )
}
