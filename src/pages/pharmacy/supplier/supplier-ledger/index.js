import React, { useState, useEffect } from 'react'

import { getSuppliers } from 'src/lib/api/getSupplierList'
import { getSupplierLedger } from 'src/lib/api/getSupplierLedger'
import TableWithFilter from 'src/components/TableWithFilter'
import Button from '@mui/material/Button'
import FallbackSpinner from 'src/@core/components/spinner'
import SingleDatePicker from 'src/components/SingleDatePicker'

// ** MUI Imports
import IconButton from '@mui/material/IconButton'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box } from '@mui/material'
import { useCallback } from 'react'

const SupplierLedger = () => {
  // ** States

  const [supplierList, setSupplierList] = useState([])
  const [ledgerData, setLedgerData] = useState([])
  const [ledgerBalance, setLedgerBalance] = useState([])
  const [error, setError] = useState('')
  const [loader, setLoader] = useState(false)

  const [supplierDetails, setSuppliersDetails] = useState({
    id: '',
    startDate: new Date(),
    endDate: new Date()
  })

  const convertDate = dateString => {
    if (dateString) {
      const dateObject = new Date(dateString)
      const year = dateObject.getFullYear()
      const month = String(dateObject.getMonth() + 1).padStart(2, '0')
      const day = String(dateObject.getDate()).padStart(2, '0')

      return `${year}-${month}-${day}`
    }
  }

  const getSupplierList = async () => {
    setLoader(true)
    const response = await getSuppliers()
    if (response?.length > 0) {
      console.log('list', response)
      response.sort((a, b) => a.id - b.id)
      setSupplierList(response)
      setLoader(false)
    } else {
      setLoader(false)
    }
  }

  const getSupplierLedgerData = async () => {
    if (supplierDetails.id === '') {
      setError('Please select supplier')

      return
    } else {
      setError('')
      let id = supplierDetails.id
      let start = convertDate(supplierDetails.startDate)
      let end = convertDate(supplierDetails.endDate)
      const result = await getSupplierLedger(id, start, end)
      setLedgerBalance(result)
      setLedgerData(result.ledgers)
    }
  }

  useEffect(() => {
    getSupplierList()
  }, [])

  const columns = [
    {
      flex: 0.05,
      Width: 40,
      field: 'id',
      headerName: 'SL',
      renderCell: (params, index) => {
        console.log('index', params)

        return (
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {params.row.id}
          </Typography>
        )
      }
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'date',
      headerName: 'DATE',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.date}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'description',
      headerName: 'DESCRIPTION',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.description}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'amount',
      headerName: 'AMOUNT',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.amount}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'type',
      headerName: 'TYPE',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.type}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'balance',
      headerName: 'BALANCE',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.balance}
        </Typography>
      )
    }

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'Action',
    //   headerName: 'Action',
    //   renderCell: params => (
    //     <Box sx={{ display: 'flex', alignItems: 'center' }}>
    //       <IconButton size='small' sx={{ mr: 0.5 }}>
    //         <Icon icon='mdi:eye-outline' />
    //       </IconButton>
    //       <IconButton size='small' sx={{ mr: 0.5 }}>
    //         <Icon icon='mdi:pencil-outline' />
    //       </IconButton>
    //       <IconButton size='small' sx={{ mr: 0.5 }}>
    //         <Icon icon='mdi:delete-outline' />
    //       </IconButton>
    //     </Box>
    //   )
    // }
  ]

  // sl,Date,amount,description,type,balance
  const createForm = () => {
    return (
      <Grid
        container
        gap={3}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyItems: 'center',
          mx: 6
        }}
      >
        <Grid item lg={2}>
          <FormControl sx={{ width: '100%' }}>
            <InputLabel id='controlled-select-label'>Suppliers</InputLabel>
            <Select
              onChange={e => {
                console.log(e)
                setSuppliersDetails({ ...supplierDetails, id: e.target.value })
              }}
              label='Suppliers'
              defaultValue=''
              id='controlled-select'
              labelId='controlled-select-label'
              sx={{ width: '100%' }}
            >
              <MenuItem value=''>
                <em>None</em>
              </MenuItem>
              {supplierList.length > 0
                ? supplierList.map(el => {
                    return (
                      <MenuItem key={el.id} value={el.id}>
                        {el.name}
                      </MenuItem>
                    )
                  })
                : null}
            </Select>
            <FormHelperText sx={{ color: 'red' }}>{error}</FormHelperText>
          </FormControl>
        </Grid>
        <Grid item lg={2}>
          <SingleDatePicker
            name={'Start'}
            date={supplierDetails.startDate}
            onChangeHandler={date => {
              console.log(date)
              setSuppliersDetails({ ...supplierDetails, startDate: date })
            }}
          />
        </Grid>
        <Grid item lg={2}>
          <SingleDatePicker
            name={'end'}
            date={supplierDetails.endDate}
            onChangeHandler={date => {
              setSuppliersDetails({ ...supplierDetails, endDate: date })
            }}
          />
        </Grid>

        <Grid item lg={2}>
          <Button size='large' sx={{ py: 3 }} variant='contained' onClick={getSupplierLedgerData}>
            Find
          </Button>
        </Grid>
        <Grid item lg={12} sx={{ display: 'flex' }}>
          <Typography sx={{ mb: 2, mr: 4 }}>
            Opening Balance : <strong>{ledgerBalance.opening_balance}</strong>
          </Typography>
          <Typography sx={{ mb: 2 }}>
            Closing Balance : <strong> {ledgerBalance.closing_balance}</strong>
          </Typography>
        </Grid>
      </Grid>
    )
  }

  return (
    <Grid>
      {loader ? (
        <FallbackSpinner />
      ) : supplierList?.length > 0 ? (
        <TableWithFilter TableTitle={'Supplier Ledger'} inpFields={createForm()} columns={columns} rows={ledgerData} />
      ) : (
        <Typography sx={{ mb: 2 }}>Supplier Ledger list is empty</Typography>
      )}
    </Grid>
  )
}

export default SupplierLedger
