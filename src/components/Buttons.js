import { Button } from '@mui/material'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import Switch from '@mui/material/Switch'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'

function AddButton({ action, title }) {
  return (
    <Button
      onClick={action ? action : null}
      size='large'
      variant='outlined'
      startIcon={<Icon icon='material-symbols-light:add' />}
    >
      {title ? title : null}
    </Button>
  )
}
function BackButton({ action, title }) {
  return (
    <Button onClick={action ? action : null} size='large' variant='outlined' startIcon={<Icon icon='ep:back' />}>
      {title ? title : null}
    </Button>
  )
}

function SwitchButton({ action, status, title }) {
  return (
    <FormControlLabel
      onClick={action ? action : null}
      control={<Switch checked={status ? status : null} color='success' />}
      label={title ? title : null}
    />
  )
}

export { AddButton, BackButton, SwitchButton }
