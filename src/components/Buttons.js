import { Button } from '@mui/material'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import Switch from '@mui/material/Switch'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'

function AddButton({ action, title, disabled, styles }) {
  return (
    <Button
      disabled={disabled || false}
      onClick={action ? action : null}
      size='large'
      variant='outlined'
      startIcon={<Icon icon='material-symbols-light:add' />}
      style={{ ...styles }}
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

function SwitchButton({ action, status, title, style }) {
  return (
    <FormControlLabel
      sx={style ? style : null}
      onClick={action ? action : null}
      control={<Switch defaultChecked={status ? status : false} color='primary' />}
      label={title ? title : null}
    />
  )
}

export { AddButton, BackButton, SwitchButton }
