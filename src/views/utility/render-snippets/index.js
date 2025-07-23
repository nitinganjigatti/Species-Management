import { Badge, Box, CircularProgress, Tooltip } from '@mui/material'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@emotion/react'

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

export const FileDownloadButton = ({
  loading = false,
  onClick,
  tooltip = 'Download',
  icon = 'ic:round-download',
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
          width: '20px',
          height: '20px',
          alignItems: 'center',
          cursor: disabled ? '' : 'pointer',
          opacity: disabled ? 0.5 : 1
        }}
        onClick={disabled ? undefined : onClick}
      >
        {loading ? <CircularProgress color='success' size={20} /> : <Icon icon={icon} fontSize={iconSize} />}
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
