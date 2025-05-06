import React from 'react'
import { TextField, InputAdornment, IconButton, Box } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import { useTheme } from '@mui/material/styles'

const Search = ({
  value,
  onChange,
  onClear,
  placeholder = 'Search...',
  sx = {}
}) => {
  const theme = useTheme()
  const iconColor = theme.palette.customColors.neutralSecondary

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        ...sx
      }}
    >
      <TextField
        variant="outlined"
        size="small"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" color={iconColor} />
            </InputAdornment>
          ),
          endAdornment: value ? (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={onClear}
                aria-label="clear search"
              >
                <ClearIcon fontSize="small" color={iconColor} />
              </IconButton>
            </InputAdornment>
          ) : null
        }}
        sx={{
          width: 300,
        }}
      />
    </Box>
  )
}

export default React.memo(Search)
