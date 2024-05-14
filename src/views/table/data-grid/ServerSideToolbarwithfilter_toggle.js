// ** MUI Imports
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import { GridToolbarFilterButton } from '@mui/x-data-grid'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

const ServerSideToolbarWithFilterAndToggle = props => {
  const handleSwitchChange = event => {
    const { checked } = event.target
    props.onSwitchChange(checked)
  }

  return (
    <Box
      sx={{
        gap: 2,
        display: 'flex',

        //float: 'left',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: theme => theme.spacing(2, 5, 4, 5)
      }}
    >
      <GridToolbarFilterButton />
      <Box sx={{ my: 4, height: '40px', width: '64%', float: 'right', textAlign: 'right' }}>
        <FormControlLabel control={<Switch defaultChecked onChange={handleSwitchChange} />} label='Active' />
      </Box>
      <TextField
        size='small'
        value={props.value}
        onChange={props.onChange}
        placeholder='Search…'
        InputProps={{
          startAdornment: (
            <Box sx={{ mr: 2, display: 'flex' }}>
              <Icon icon='mdi:magnify' fontSize={20} />
            </Box>
          ),
          endAdornment: (
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
          },
          float: 'right'
        }}
      />
    </Box>
  )
}

export default ServerSideToolbarWithFilterAndToggle
