import React, { useState } from 'react'

// import { getSuppliers } from 'src/lib/api/pharmacy/getSupplierList'
// import { getSupplierLedger } from 'src/lib/api/pharmacy/getSupplierLedger'
// import TableWithFilter from 'src/components/TableWithFilter'
// import Button from '@mui/material/Button'
// import FallbackSpinner from 'src/@core/components/spinner'
// import SingleDatePicker from 'src/components/SingleDatePicker'

// ** MUI Imports

import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

// ** Icon Imports
// import Icon from 'src/@core/components/icon'
// import { Box } from '@mui/material'
// import Select from '@mui/material/Select'
// import MenuItem from '@mui/material/MenuItem'
// import InputLabel from '@mui/material/InputLabel'
// import FormControl from '@mui/material/FormControl'
// import FormHelperText from '@mui/material/FormHelperText'
// import IconButton from '@mui/material/IconButton'
// import Card from '@mui/material/Card'
// import CardHeader from '@mui/material/CardHeader'

// import { useQuery, useQueryClient } from '@tanstack/react-query'

const SupplierLedger = () => {
  // ** States
  // const queryClient = useQueryClient()

  // const [supplierList, setSupplierList] = useState([])
  // const [ledgerData, setLedgerData] = useState([])
  // const [ledgerBalance, setLedgerBalance] = useState([])
  // const [errors, setErrors] = useState('')

  // const [supplierDetails, setSuppliersDetails] = useState({
  //   id: '',
  //   startDate: new Date(),
  //   endDate: new Date()
  // })

  // const getSupplierList = async () => {
  //   const response = await getSuppliers()

  //   return response
  // }

  // const {
  //   supplierData,
  //   isLoading: supplierLoading,
  //   isError: supplierIsError,
  //   error: supplierError
  // } = useQuery(['suppliers'], getSupplierList, {
  //   onSuccess: supplierData => {
  //     const sorted = supplierData.data.data ? supplierData.data.data.sort((a, b) => a.id - b.id) : []
  //     setSupplierList(sorted)
  //   }
  // })

  // const convertDate = dateString => {
  //   if (dateString) {
  //     const dateObject = new Date(dateString)
  //     const year = dateObject.getFullYear()
  //     const month = String(dateObject.getMonth() + 1).padStart(2, '0')
  //     const day = String(dateObject.getDate()).padStart(2, '0')

  //     return `${year}-${month}-${day}`
  //   }
  // }

  // const getSupplierLedgerData = async () => {
  //   if (supplierDetails.id === '') {
  //     setErrors('Please select supplier')

  //     return
  //   } else {
  //     setErrors('')
  //     let id = supplierDetails.id
  //     let start = convertDate(supplierDetails.startDate)
  //     let end = convertDate(supplierDetails.endDate)
  //     const result = await getSupplierLedger(id, start, end)

  //     return result
  //   }
  // }

  // const {
  //   supplierLedgerData,
  //   isLoading: ledgerLoading,
  //   isError: ledgerIsError,
  //   error: ledgerError,
  //   refetch
  // } = useQuery(['supplierLedger'], getSupplierLedgerData, {
  //   onSuccess: supplierLedgerData => {
  //     console.log('in query', supplierLedgerData)

  //     // const sorted = supplierLedgerData.data.data
  //     //   ? supplierLedgerData.data.data.ledgers.sort((a, b) => a.id - b.id)
  //     //   : []
  //     let listWithId = supplierLedgerData.data.data
  //       ? supplierLedgerData.data.data.ledgers.map((el, i) => {
  //           return { ...el, uid: i + 1 }
  //         })
  //       : []
  //     setLedgerBalance(supplierLedgerData.data.data)
  //     setLedgerData(listWithId)
  //   },
  //   enabled: false
  // })

  // if (supplierLoading) {
  //   return <FallbackSpinner />
  // }
  // if (supplierIsError) {
  //   return <h1>{supplierError.message}</h1>
  // }

  // const columns = [
  //   {
  //     flex: 0.05,
  //     Width: 40,
  //     field: 'uid',
  //     headerName: 'SL',
  //     renderCell: (params, index) => {
  //       console.log('index', params)

  //       return (
  //         <Typography variant='body2' sx={{ color: 'text.primary' }}>
  //           {params.row.uid}
  //         </Typography>
  //       )
  //     }
  //   },
  //   {
  //     flex: 0.2,
  //     minWidth: 20,
  //     field: 'date',
  //     headerName: 'DATE',
  //     renderCell: params => (
  //       <Typography variant='body2' sx={{ color: 'text.primary' }}>
  //         {params.row.date}
  //       </Typography>
  //     )
  //   },

  //   {
  //     flex: 0.2,
  //     minWidth: 20,
  //     field: 'description',
  //     headerName: 'DESCRIPTION',
  //     renderCell: params => (
  //       <Typography variant='body2' sx={{ color: 'text.primary' }}>
  //         {params.row.description}
  //       </Typography>
  //     )
  //   },
  //   {
  //     flex: 0.2,
  //     minWidth: 20,
  //     field: 'amount',
  //     headerName: 'AMOUNT',
  //     renderCell: params => (
  //       <Typography variant='body2' sx={{ color: 'text.primary' }}>
  //         {params.row.amount}
  //       </Typography>
  //     )
  //   },
  //   {
  //     flex: 0.2,
  //     minWidth: 20,
  //     field: 'type',
  //     headerName: 'TYPE',
  //     renderCell: params => (
  //       <Typography variant='body2' sx={{ color: 'text.primary' }}>
  //         {params.row.type}
  //       </Typography>
  //     )
  //   },
  //   {
  //     flex: 0.2,
  //     minWidth: 20,
  //     field: 'balance',
  //     headerName: 'BALANCE',
  //     renderCell: params => (
  //       <Typography variant='body2' sx={{ color: 'text.primary' }}>
  //         {params.row.balance}
  //       </Typography>
  //     )
  //   }
  // ]

  // sl,Date,amount,description,type,balance
  // const createForm = () => {
  //   return (
  //     <Grid
  //       container
  //       gap={3}
  //       sx={{
  //         display: 'flex',
  //         alignItems: 'center',
  //         justifyItems: 'center',
  //         mx: 6
  //       }}
  //     >
  //       <Grid item lg={2}>
  //         <FormControl sx={{ width: '100%' }}>
  //           <InputLabel id='controlled-select-label'>Suppliers</InputLabel>
  //           <Select
  //             onChange={e => {
  //               console.log(e)
  //               setSuppliersDetails({ ...supplierDetails, id: e.target.value })
  //             }}
  //             label='Suppliers'
  //             defaultValue=''
  //             id='controlled-select'
  //             labelId='controlled-select-label'
  //             sx={{ width: '100%' }}
  //           >
  //             <MenuItem value=''>
  //               <em>None</em>
  //             </MenuItem>
  //             {supplierList.length > 0
  //               ? supplierList.map(el => {
  //                   return (
  //                     <MenuItem key={el.id} value={el.id}>
  //                       {el.name}
  //                     </MenuItem>
  //                   )
  //                 })
  //               : null}
  //           </Select>
  //           <FormHelperText sx={{ color: 'red' }}>{errors}</FormHelperText>
  //         </FormControl>
  //       </Grid>
  //       <Grid item lg={2}>
  //         <SingleDatePicker
  //           name={'Start'}
  //           date={supplierDetails.startDate}
  //           onChangeHandler={date => {
  //             console.log(date)
  //             setSuppliersDetails({ ...supplierDetails, startDate: date })
  //           }}
  //         />
  //       </Grid>
  //       <Grid item lg={2}>
  //         <SingleDatePicker
  //           name={'end'}
  //           date={supplierDetails.endDate}
  //           onChangeHandler={date => {
  //             setSuppliersDetails({ ...supplierDetails, endDate: date })
  //           }}
  //         />
  //       </Grid>

  //       <Grid item lg={2}>
  //         <Button
  //           size='large'
  //           sx={{ py: 3 }}
  //           variant='contained'
  //           onClick={() => {
  //             refetch()

  //             // getSupplierLedgerData
  //           }}
  //         >
  //           Find
  //         </Button>
  //       </Grid>
  //       <Grid item lg={12} sx={{ display: 'flex' }}>
  //         <Typography sx={{ mb: 2, mr: 4 }}>
  //           Opening Balance : <strong>{ledgerBalance.opening_balance}</strong>
  //         </Typography>
  //         <Typography sx={{ mb: 2 }}>
  //           Closing Balance : <strong> {ledgerBalance.closing_balance}</strong>
  //         </Typography>
  //       </Grid>
  //     </Grid>
  //   )
  // }

  return (
    <Grid>
      {/* {supplierList?.length > 0 ? (
        <TableWithFilter TableTitle={'Supplier Ledger'} inpFields={createForm()} columns={columns} rows={ledgerData} />
      ) : ( */}
      <Typography sx={{ mb: 2 }}>Supplier Ledger list is empty</Typography>
      {/* )} */}
    </Grid>
  )
}

export default SupplierLedger
