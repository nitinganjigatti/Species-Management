import React from 'react'
import { TextField, InputAdornment, IconButton, Box } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import { useTheme } from '@mui/material/styles'

const Search = ({ value, onChange, onClear, placeholder = 'Search...', width = 300, sx = {}, textFielsSX = {} }) => {
  const theme = useTheme()
  const iconColor = theme.palette.customColors.neutralSecondary

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        ...sx
      }}
    >
      <TextField
        variant='outlined'
        size='small'
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position='start'>
              <SearchIcon fontSize='small' color={iconColor} />
            </InputAdornment>
          ),
          endAdornment: value ? (
            <InputAdornment position='end'>
              <IconButton size='small' onClick={onClear} aria-label='clear search'>
                <ClearIcon fontSize='small' color={iconColor} />
              </IconButton>
            </InputAdornment>
          ) : null
        }}
        sx={{
          width: width,
          ...textFielsSX,
          '& .MuiInputBase-root': {
            backgroundColor: textFielsSX?.backgroundColor || 'transparent',
            borderRadius: textFielsSX?.borderRadius || '8px',
            height: textFielsSX?.height || 'auto', // allow height from parent
            minHeight: textFielsSX?.height || 'auto',
            paddingRight: '4px'
          },
          '& .MuiInputBase-input': {
            height: '100%',
            boxSizing: 'border-box',
            paddingTop: '0.5rem',
            paddingBottom: '0.5rem'
          }
        }}
      />
    </Box>
  )
}

export default React.memo(Search)
