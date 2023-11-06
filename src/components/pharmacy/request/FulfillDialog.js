// ** React Imports
import { forwardRef, useEffect, useState } from 'react'
import TextField from '@mui/material/TextField'
import TableBasic from 'src/views/table/mui/TableBasic'
import { styled, createTheme } from '@mui/material/styles'
import Link from 'next/link'

// ** MUI Imports

import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Dialog from '@mui/material/Dialog'
import IconButton from '@mui/material/IconButton'

import DialogContent from '@mui/material/DialogContent'
import { CardContent } from '@mui/material'
import Typography from '@mui/material/Typography'
import { Button } from '@mui/material'
import { LoadingButton } from '@mui/lab'

import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableRow from '@mui/material/TableRow'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import UserSnackbar from 'src/components/utility/snackbar'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { CardHeader } from '@mui/material'

import { getAvailableMedicineByMedicineId } from 'src/lib/api/getRequestItemsList'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { addDispatch } from 'src/lib/api/getRequestItemsList'
import Utility from 'src/utility'
import { stringify } from 'stylis'

const FulfillDialog = ({ title, dialogBoxStatus, close, fulfillMedicine, storeDetails }) => {
  const [loader, setLoader] = useState(true)
  const [batchItems, setBatchItems] = useState([])
  const [localBatchItems, setLocalBatchItems] = useState([])
  const [fulfilStockItems, setFulfilStockItems] = useState([])
  const [totalMedicine, setTotalMedicine] = useState(0)
  const [error, setError] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [errors, setErrors] = useState({})
  const [isLocalTableVisible, setIsLocalTableVisible] = useState(false)

  const [openSnackbar, setOpenSnackbar] = useState({
    open: false,
    severity: '',
    message: ''
  })

  console.log('fulfilStockItems', fulfilStockItems)
  debugger

  const onQuantityChange = (row, qty) => {
    if (fulfilStockItems.length > 0) {
      const tempFulfilStockItems = fulfilStockItems.slice()
      let itemExists = false

      tempFulfilStockItems.forEach(item => {
        if (item.request_item_batch_no === row.batch_no) {
          itemExists = true
          item['request_item_dispatch_qty'] = qty
        }
      })

      if (!itemExists) {
        if (!isNaN(parseInt(qty)) && parseInt(qty) > 0) {
          const medicineRow = {
            from_store_type: row.type,
            from_store_id: row.store_id,
            to_store_type: storeDetails.from_store_type,
            to_store_id: storeDetails.from_store_id,
            dispatch_date: Utility.formatDate(Date()),

            request_item_dispatch_qty: qty,
            request_item_stock_item_id: row.stock_item_id,
            request_item_batch_no: row.batch_no,
            request_item_expiry_date: row.expiry_date,
            description: ''
          }
          setFulfilStockItems([medicineRow])
          setTotalMedicine(getMedicineTotal([medicineRow]))
        }
      } else {
        if (itemExists) {
        }
      }

      if (isNaN(parseInt(qty)) || parseInt(qty) <= 0) {
        const index = tempFulfilStockItems.findIndex(item => {
          console.log('item.batch_no', item.batch_no)
          console.log('row.batch_no', row.batch_no)

          return item.request_item_batch_no === row.batch_no
        })
        if (index !== -1) {
          tempFulfilStockItems.splice(index, 1)
        }
      }

      console.log('tempFulfilStockItems', tempFulfilStockItems)

      // }

      setFulfilStockItems(tempFulfilStockItems)
      setTotalMedicine(getMedicineTotal(tempFulfilStockItems))
    } else {
      if (!isNaN(parseInt(qty)) && parseInt(qty) > 0) {
        const medicineRow = {
          from_store_type: row.type,
          from_store_id: row.store_id,
          to_store_type: storeDetails.from_store_type,
          to_store_id: storeDetails.from_store_id,
          dispatch_date: Utility.formatDate(Date()),

          request_item_dispatch_qty: qty,
          request_item_stock_item_id: row.stock_item_id,
          request_item_batch_no: row.batch_no,
          request_item_expiry_date: row.expiry_date,
          description: ''
        }
        setFulfilStockItems([medicineRow])
        setTotalMedicine(getMedicineTotal([medicineRow]))
      }
    }
  }

  const getMedicineTotal = data => {
    let total = 0
    if (data.length > 0) {
      data?.map(item => {
        if (
          !isNaN(item.request_item_dispatch_qty) &&
          item.request_item_dispatch_qty !== '' &&
          item.request_item_dispatch_qty !== ''
        ) {
          total = total + parseInt(item.request_item_dispatch_qty)
        }
      })
    }

    return total
  }

  const getMedicineByMedicineId = async id => {
    setLoader(true)
    const data = { stock_item_id: id }
    const response = await getAvailableMedicineByMedicineId(id, data, 'central')

    if (response.success) {
      setBatchItems(response.data)
      console.log(response.data)
      setLoader(false)
    } else {
      setLoader(false)
    }
  }

  const getMedicineByMedicineIdLocalStore = async id => {
    setLoader(true)
    const data = { stock_item_id: id }
    const response = await getAvailableMedicineByMedicineId(id, data, 'local')

    if (response.success) {
      setLocalBatchItems(response.data)
      console.log(response.data)
      setLoader(false)
    } else {
      setLoader(false)
    }
  }

  const dispatchRequest = async data => {
    const payload = {
      dispatch_date: Utility.formatDate(Date()),
      dispatch_items: fulfilStockItems,
      request_number: storeDetails.id
    }

    console.log('payload', JSON.stringify(payload))

    try {
      setError(false)
      setSubmitLoader(true)

      response = await addDispatch(payload)
      debugger
      if (response?.success) {
        setOpenSnackbar({ ...openSnackbar, open: true, message: response?.data, severity: 'success' })
        setSubmitLoader(false)
        setResetForm(true)
        setOpenDrawer(false)
      } else {
        setSubmitLoader(false)
        setOpenSnackbar({ ...openSnackbar, open: true, message: response?.message?.name, severity: 'error' })
      }
    } catch (e) {
      console.log(e)
      setSubmitLoader(false)
      setOpenSnackbar({ ...openSnackbar, open: true, message: 'Error', severity: 'error' })
    }
  }

  useEffect(() => {
    if (fulfillMedicine?.stock_item_id !== undefined && fulfillMedicine?.stock_item_id !== null) {
      console.log(fulfillMedicine)
      console.log(storeDetails)

      getMedicineByMedicineId(fulfillMedicine?.stock_item_id)
      getMedicineByMedicineIdLocalStore(fulfillMedicine?.stock_item_id)
    }
  }, [fulfillMedicine, storeDetails])

  const checkNumber = number => {
    return !isNaN(number) ? parseInt(number) : 0
  }

  const toggleLocalTable = () => {
    setIsLocalTableVisible(!isLocalTableVisible)
  }
  const theme = createTheme()

  const StyledText = styled('span')({
    textDecoration: 'none',
    color: theme.palette.primary.main,
    cursor: 'pointer'
  })

  return (
    <>
      <CardContent>
        <Grid container spacing={2} sx={{ flexGrow: 1 }}>
          <Grid item xs={4}>
            <Typography variant='body2' sx={{ color: 'text.primary', fontWeight: 'bold' }}>
              Medicine Name
            </Typography>

            <Typography variant='body2' sx={{ color: 'text.primary' }}>
              {fulfillMedicine?.stock_name}
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant='body2' sx={{ color: 'text.primary', fontWeight: 'bold' }}>
              QTY Requested
            </Typography>
            <Typography variant='body2' sx={{ color: 'text.primary' }}>
              {fulfillMedicine?.requested_qty}
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant='body2' sx={{ color: 'text.primary', fontWeight: 'bold' }}>
              QTY Remaining
            </Typography>
            <Typography variant='body2' sx={{ color: 'text.primary' }}>
              {checkNumber(fulfillMedicine?.requested_qty) - checkNumber(fulfillMedicine?.dispatch_qty)}
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
          <CardContent style={{ marginBottom: '0px', paddingBottom: '0px' }}>
            <Typography variant='body2' style={{ fontWeight: 'bold' }} sx={{ color: 'text.primary' }}>
              {storeDetails?.to_store}
            </Typography>
          </CardContent>
          {batchItems.length > 0 ? (
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
                            if (parseInt(e.target.value) < parseInt(row.qty)) {
                              setErrors(prevErrors => ({
                                ...prevErrors,
                                [row.batch_no]: 'Quantity should be lesser than available quantity'
                              }))
                            } else {
                              setErrors(prevErrors => ({
                                ...prevErrors,
                                [row.batch_no]: '' // Clear the error message
                              }))
                            }
                            console.log(errors)
                            onQuantityChange(row, e.target.value, 'central')
                          }}
                        />
                        {errors[row.batch_no] && <div style={{ color: 'red' }}>{errors[row.id]}</div>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <CardContent>Medicine Not Available in central store.</CardContent>
          )}
          <CardContent>
            <div>
              <StyledText onClick={toggleLocalTable}>Show/hide other stores</StyledText>
            </div>
          </CardContent>
          {isLocalTableVisible ? (
            <>
              {localBatchItems.length > 0 ? (
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
                      {localBatchItems?.map(row => (
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
                                // onQuantityChange(row, e.target.value)
                                const newValue = e.target.value
                                const availableQuantity = row.qty // The available quantity from the row
                                if (newValue > availableQuantity) {
                                  // You can display an error message or handle the validation as needed
                                  // For example, you can set an error state and display an error message.
                                  setError(`Quantity should be less than or equal to ${availableQuantity}`)
                                } else {
                                  // If the entered quantity is valid, you can clear the error state.
                                  setError('')

                                  // Call your onQuantityChange function with the valid value
                                  onQuantityChange(row, newValue)
                                }
                              }}
                            />
                            {errors[row.id] && <div style={{ color: 'red' }}>{errors[row.id]}</div>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <CardContent>Medicine Not Available in other stores.</CardContent>
              )}
            </>
          ) : null}

          {fulfilStockItems.length > 0 ? (
            <CardContent>
              <Grid container spacing={2} sx={{ flexGrow: 1 }}>
                <Grid xs={9.5} style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  Total
                </Grid>
                <Grid xs={2.5} style={{ textAlign: 'right' }}>
                  {totalMedicine}
                </Grid>
              </Grid>
            </CardContent>
          ) : null}

          <CardContent>
            <Grid item xs={12}>
              <LoadingButton
                size='large'
                variant='contained'
                loading={submitLoader}
                onClick={() => {
                  dispatchRequest()
                }}
              >
                Submit
              </LoadingButton>
              {openSnackbar.open ? (
                <UserSnackbar severity={openSnackbar?.severity} status={true} message={openSnackbar?.message} />
              ) : null}
            </Grid>
          </CardContent>
        </>
      )}
    </>
  )
}

export default FulfillDialog
