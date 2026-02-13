/* eslint-disable lines-around-comment */
import { Button } from '@mui/material'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import { LoadingButton } from '@mui/lab'

function AddButtonContained({ action, title, disabled, styles, fullWidth }) {
  return (
    <Button
      // sx={{(title === "request")? ml:2: ""}}

      disabled={disabled || false}
      onClick={action ? action : null}
      size='large'
      variant='contained'
      startIcon={<Icon icon='material-symbols-light:add' />}
      sx={{ mr: 1 , ...styles}}

      fullWidth={fullWidth ? fullWidth : null}

      // style={{ ...styles }}
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

function RequestCancelButton({ action, title }) {
  return (
    <Button
      onClick={action ? action : null}
      color='primary'
      size='large'
      sx={{
        mx: 2,
        backgroundColor: 'grey.600',
        borderColor: 'grey.500',
        color: 'common.white',
        '&:hover': { borderColor: 'grey.700', color: 'grey.700', backgroundColor: 'common.white' }
      }}
      variant='outlined'
    >
      {title ? title : null}
    </Button>
  )
}
function ExcelExportButton({ action, title, loader, disabled }) {
  return (
    <LoadingButton
      disabled={disabled}
      loading={loader}
      onClick={action ? action : null}
      size='large'
      variant='outlined'
      startIcon={<Icon icon='vscode-icons:file-type-excel' />}
    >
      {title ? title : null}
    </LoadingButton>
  )
}

export { AddButtonContained, BackButton, SwitchButton, RequestCancelButton, ExcelExportButton }
