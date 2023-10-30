// ** React Imports
import { forwardRef, useEffect, useState } from 'react'
import TextField from '@mui/material/TextField'
import TableBasic from 'src/views/table/mui/TableBasic'

// ** MUI Imports

import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Dialog from '@mui/material/Dialog'
import IconButton from '@mui/material/IconButton'
import Fade from '@mui/material/Fade'
import DialogContent from '@mui/material/DialogContent'
import { CardContent } from '@mui/material'
import Typography from '@mui/material/Typography'

import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableRow from '@mui/material/TableRow'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { CardHeader } from '@mui/material'

import { getAvailableMedicineByMedicineId } from 'src/lib/api/getRequestItemsList'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

// import TableBasic from 'src/views/table/data-grid/TableBasic'

const Transition = forwardRef(function Transition(props, ref) {
  return <Fade ref={ref} {...props} />
})

const FulfillDialog = ({ title, dialogBoxStatus, close, fulfillMedicine }) => {
  const [loader, setLoader] = useState(true)
  const [batchItems, setBatchItems] = useState([])

  const onQuantityChange = data => {
    console.log(data)
  }

  const getMedicineByMedicineId = async id => {
    setLoader(true)
    const data = { stock_item_id: id }
    const response = await getAvailableMedicineByMedicineId(id, data)

    if (response.success) {
      setBatchItems(response.data)
      console.log(response.data)
      setLoader(false)
    } else {
      setLoader(false)
    }
  }

  useEffect(() => {
    if (fulfillMedicine?.stock_item_id !== undefined && fulfillMedicine?.stock_item_id !== null) {
      getMedicineByMedicineId(fulfillMedicine?.stock_item_id)
    }
  }, [fulfillMedicine])

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
                {fulfillMedicine?.stock_name}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant='body2' sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                QTY Requested
              </Typography>
              <Typography variant='body2' sx={{ color: 'text.primary' }}>
                {fulfillMedicine?.requested_qty}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
        {/* <TableBasic columns={columns} rows={rows}></TableBasic> */}
        {/* <TableBasic /> */}
        {loader ? (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          </CardContent>
        ) : (
          <>
            <CardContent>
              <Typography variant='body2' sx={{ color: 'text.primary' }}>
                {fulfillMedicine?.store_name}
              </Typography>
            </CardContent>
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label='simple table'>
                <TableHead>
                  <TableRow>
                    <TableCell>Batch</TableCell>
                    <TableCell align='center'>Expiring</TableCell>
                    <TableCell align='center'>Quantity Available</TableCell>
                    <TableCell align='center'>Enter Quantity</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {batchItems?.map(row => (
                    <TableRow
                      key={row.id}
                      sx={{
                        '&:last-of-type td, &:last-of-type th': {
                          border: 0
                        }
                      }}
                    >
                      <TableCell component='th' scope='row'>
                        {row.batch_no}
                      </TableCell>
                      <TableCell align='center'>{row.expiry_date}</TableCell>
                      <TableCell align='center'>{row.qty}</TableCell>
                      <TableCell align='center'>
                        <TextField
                          size='small'
                          type='number'
                          onChange={e => {
                            console.log(row)
                            console.log(e.target.value)
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

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
          </>
        )}
      </Dialog>
    </Card>
  )
}

export default FulfillDialog
