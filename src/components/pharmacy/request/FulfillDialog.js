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
  const [rowErrors, setRowErrors] = useState({})

  const [openSnackbar, setOpenSnackbar] = useState({
    open: false,
    severity: '',
    message: ''
  })

  const checkForPositiveInteger = number => {
    const regex = /^\d+$/
    const test = regex.test(number)

    return test
  }

  // const handleQuantityChange = (enteredQuantity, row, index) => {
  //   if (checkForPositiveInteger(enteredQuantity) && checkNumber(enteredQuantity) <= checkNumber(row.qty)) {
  //     // No error, the entered quantity is valid
  //     const tempState = rowErrors
  //     tempState[index] = false
  //     setRowErrors(tempState)
  //   } else if (enteredQuantity === '') {
  //     const tempState = rowErrors
  //     tempState[index] = false
  //     setRowErrors(tempState)
  //   } else {
  //     debugger
  //     const tempState = rowErrors
  //     tempState[index] = true
  //     setRowErrors(tempState)
  //   }

  //   console.log('rowErrors', rowErrors)
  //   onQuantityChange(row, enteredQuantity)
  // }

  const handleQuantityChange = (enteredQuantity, row, text_id) => {
    const tempRowErrors = { ...rowErrors }
    if (checkForPositiveInteger(enteredQuantity) && checkNumber(enteredQuantity) <= checkNumber(row.qty)) {
      tempRowErrors[text_id] = { status: false }
    } else if (enteredQuantity === '') {
      tempRowErrors[text_id] = { status: false }
    } else {
      tempRowErrors[text_id] = { status: true }
    }

    setRowErrors(tempRowErrors)

    console.log('tempRowErrors', tempRowErrors)

    console.log('rowErrors', rowErrors)
    onQuantityChange(row, enteredQuantity)
  }

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

          tempFulfilStockItems.push(medicineRow)

          // setFulfilStockItems(localStockItems)
          // setTotalMedicine(getMedicineTotal(localStockItems))
        }
      } else {
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
    console.log('fulfilStockItems', fulfilStockItems)
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

    console.log(total)

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

      const response = await addDispatch(payload)
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

  const StyledErrorText = styled('span')({
    textDecoration: 'none',
    color: theme.palette.error.main,
    marginBottom: theme.spacing(2),
    cursor: 'pointer',
    display: 'inline-block'
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
                  {batchItems?.map((row, index) => (
                    <TableRow
                      key={`batch_central_${index}`}
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
                          name={`batch_central_${index}`}
                          error={rowErrors[`batch_central_${index}`]?.status}
                          onChange={e => {
                            console.log(e.target.value)
                            handleQuantityChange(e.target.value, row, `batch_central_${index}`)
                          }}
                        />
                        {/* {rowErrors[`batch_central_${index}`]?.status && (
                          <div>
                            <span className='error'>Invalid input</span>
                          </div>
                        )} */}
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
              <StyledText onClick={toggleLocalTable}>Show stock in other stores</StyledText>
            </div>
          </CardContent>
          {isLocalTableVisible ? (
            <>
              {localBatchItems.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table sx={{ minWidth: 650 }} aria-label='simple table'>
                    <TableHead>
                      <TableRow>
                        <TableCell>Store</TableCell>
                        <TableCell>Batch</TableCell>
                        <TableCell align='center'>Expiring</TableCell>
                        <TableCell align='center'>Quantity Available</TableCell>
                        <TableCell align='center'>Enter Quantity</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {localBatchItems?.map((row, index) => (
                        <TableRow
                          key={`batch_local_${index}`}
                          sx={{
                            '&:last-of-type td, &:last-of-type th': {
                              border: 0
                            }
                          }}
                        >
                          <TableCell component='th' scope='row'>
                            {row.store_name}
                          </TableCell>
                          <TableCell component='th' scope='row'>
                            {row.batch_no}
                          </TableCell>
                          <TableCell align='center'>{row.expiry_date}</TableCell>
                          <TableCell align='center'>{row.qty}</TableCell>
                          <TableCell align='center'>
                            <TextField
                              size='small'
                              name={`batch_local_${index}`}
                              error={rowErrors[`batch_local_${index}`]?.status}
                              onChange={e => {
                                console.log(e.target.value)
                                handleQuantityChange(e.target.value, row, `batch_local_${index}`)
                              }}
                            />
                            {/* {rowErrors[`batch_local_${index}`]?.status && <span className='error'>Invalid input</span>} */}
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
            {totalMedicine >
            checkNumber(fulfillMedicine?.requested_qty) - checkNumber(fulfillMedicine?.dispatch_qty) ? (
              <div style={{ color: `${theme.palette.warning}` }}>
                <StyledErrorText>Total quantity should be lesser than Quantity Remaining</StyledErrorText>
              </div>
            ) : null}
            <Grid item xs={12}>
              <LoadingButton
                size='large'
                variant='contained'
                loading={submitLoader}
                onClick={() => {
                  const count = Object.values(rowErrors).filter(item => item.status).length
                  if (
                    count <= 0 &&
                    totalMedicine <=
                      checkNumber(fulfillMedicine?.requested_qty) - checkNumber(fulfillMedicine?.dispatch_qty)
                  )
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
