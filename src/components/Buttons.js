import { Button } from '@mui/material'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

//

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

export { AddButton, BackButton }
