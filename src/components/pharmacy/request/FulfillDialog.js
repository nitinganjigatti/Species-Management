// ** React Imports
import { forwardRef } from 'react'
import TextField from '@mui/material/TextField'

// ** MUI Imports

import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'

import Dialog from '@mui/material/Dialog'

import IconButton from '@mui/material/IconButton'

import Fade from '@mui/material/Fade'
import DialogContent from '@mui/material/DialogContent'
import { CardContent } from '@mui/material'
import Typography from '@mui/material/Typography'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { CardHeader } from '@mui/material'

import TableBasic from 'src/views/table/data-grid/TableBasic'

const CustomInput = forwardRef(({ ...props }, ref) => {
  return <TextField size='small' inputRef={ref} {...props} sx={{ width: '100%' }} />
})

const Transition = forwardRef(function Transition(props, ref) {
  return <Fade ref={ref} {...props} />
})

const rows = [
  {
    id: 1,
    batch: '1812',
    expiring: '22/02/2024',
    qty_available: 40
  },
  {
    id: 2,
    batch: '3214',
    expiring: '22/02/2024',
    qty_available: 60
  }
]

const columns = [
  {
    flex: 0.05,
    Width: 40,
    field: 'id',
    headerName: 'Id',
    renderCell: (params, rowId) => (
      <Typography variant='body2' sx={{ color: 'text.primary' }}>
        {params.row.id}
      </Typography>
    )
  },
  {
    flex: 0.2,
    Width: 40,
    field: 'batch',
    headerName: 'Batch',
    renderCell: (params, rowId) => (
      <Typography variant='body2' sx={{ color: 'text.primary' }}>
        {params.row.batch}
      </Typography>
    )
  },

  {
    flex: 0.2,
    minWidth: 20,
    field: 'expiring',
    headerName: 'Expiring',
    renderCell: params => (
      <Typography variant='body2' sx={{ color: 'text.primary' }}>
        {params.row.expiring}
      </Typography>
    )
  },
  {
    flex: 0.2,
    minWidth: 20,
    field: 'qty_available',
    headerName: 'QTY Available',
    renderCell: params => (
      <Typography variant='body2' sx={{ color: 'text.primary' }}>
        {params.row.expiring}
      </Typography>
    )
  },
  {
    flex: 0.2,
    minWidth: 20,
    field: '',
    headerName: 'Enter QTY',
    renderCell: params => <CustomInput />
  }
]

const FulfillDialog = ({ title, dialogBoxStatus, close }) => {
  return (
    <Card>
      <Dialog
        fullWidth
        open={dialogBoxStatus}
        maxWidth='md'
        scroll='body'
        onClose={() => close()}
        TransitionComponent={Transition}
        onBackdropClick={() => close()}
      >
        <Grid
          container
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <CardHeader title={title ? title : null} />
          <IconButton size='small' onClick={() => close()} sx={{ mx: 4 }}>
            <Icon icon='mdi:close' />
          </IconButton>
        </Grid>
        <CardContent>
          <Grid container spacing={2} sx={{ flexGrow: 1 }}>
            <Grid item xs={6}>
              <Typography variant='body2' sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                Medicine Name
              </Typography>

              <Typography variant='body2' sx={{ color: 'text.primary' }}>
                Crocin
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant='body2' sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                QTY Requested
              </Typography>
              <Typography variant='body2' sx={{ color: 'text.primary' }}>
                300
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
        <TableBasic columns={columns} rows={rows}></TableBasic>
        <CardContent>
          <Grid container spacing={2} sx={{ flexGrow: 1 }}>
            <Grid xs={9.5} style={{ textAlign: 'right', fontWeight: 'bold' }}>
              Total
            </Grid>
            <Grid xs={2.5} style={{ textAlign: 'right' }}>
              250
            </Grid>
          </Grid>
        </CardContent>
      </Dialog>
    </Card>
  )
}

export default FulfillDialog
