// ** MUI Imports
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import { GridToolbarFilterButton } from '@mui/x-data-grid'
import { useRef } from 'react'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

const ServerSideToolbarWithFilter = props => {
  const inputRef1 = useRef()

  const handleFocus = () => {
    inputRef1.current.focus()
  }

  return (
    <Box
      sx={{
        gap: 2,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'flex-end',
        p: theme => theme.spacing(2, 5, 4, 5)
      }}
    >
      {/* <GridToolbarFilterButton /> */}
      <TextField
        size='small'
        value={props.value}
        inputRef={inputRef1}
        onFocus={handleFocus}
        onChange={props.onChange}
        placeholder='Search…'
        InputProps={{
          startAdornment: (
            <Box sx={{ mr: 2, display: 'flex' }}>
              <Icon icon='mdi:magnify' fontSize={20} />
            </Box>
          ),
          endAdornment:
            props.value === '' ? (
              <IconButton
                size='small'
                sx={{ color: 'transparent', opacity: '-1', cursor: 'text' }}
                onClick={handleFocus}
              >
                <Icon icon='mdi:close' fontSize={20} sx={{ color: 'transparent' }} />
              </IconButton>
            ) : (
              <IconButton size='small' title='Clear' aria-label='Clear' onClick={props.clearSearch}>
                <Icon icon='mdi:close' fontSize={20} />
              </IconButton>
            )
        }}
        sx={{
          width: {
            xs: 1,
            sm: 'auto'
          },
          '& .MuiInputBase-root > svg': {
            mr: 2
          }
        }}
      />
    </Box>
  )
}

export default ServerSideToolbarWithFilter
