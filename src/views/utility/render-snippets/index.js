import { Box, CircularProgress, Tooltip } from '@mui/material'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@emotion/react'

export const ExportButton = ({
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
