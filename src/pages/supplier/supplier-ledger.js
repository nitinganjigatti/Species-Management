// supplierLedger

import React, { useState, useEffect } from 'react'

import { getSuppliers } from '../../lib/api/getSupplierList'
import TableWithFilter from '../../components/TableWithFilter'
import Button from '@mui/material/Button'
import FallbackSpinner from '../../@core/components/spinner/index'
import SingleDatePicker from '../../components/SingleDatePicker'

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

const SupplierLedger = () => {
  // ** States

  const [supplierList, setSupplierList] = useState([])

  const [supplierDetails, setSuppliersDetails] = useState({
    name: '',
    startDate: new Date(),
    endDate: new Date()
  })

  const getSupplierList = async () => {
    const response = await getSuppliers()
    console.log('list', response)
    response.sort((a, b) => a.id - b.id)
    setSupplierList(response)
  }

  const handleHeaderAction = () => {
    console.log('Handle Header Action')
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
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.id}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'company_name',
      headerName: 'SUPPLIER NAME',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.name}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'mobile',
      headerName: 'MOBILE NUMBER',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.mobile}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'name',
      headerName: 'CONTACT PERSON',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.company_name}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'state_name',
      headerName: 'STATE',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.state_name}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'opening_balance',
      headerName: 'OPENING BALANCE',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.opening_balance}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'Action',
      headerName: 'Action',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton size='small' sx={{ mr: 0.5 }}>
            <Icon icon='mdi:eye-outline' />
          </IconButton>
          <IconButton size='small' sx={{ mr: 0.5 }}>
            <Icon icon='mdi:pencil-outline' />
          </IconButton>
          <IconButton size='small' sx={{ mr: 0.5 }}>
            <Icon icon='mdi:delete-outline' />
          </IconButton>
        </Box>
      )
    }
  ]

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
                setSuppliersDetails({ ...supplierDetails, name: e.target.value })
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
              <MenuItem value='20'>Ten</MenuItem>
              <MenuItem value={20}>Twentys</MenuItem>
              <MenuItem value={30}>Thirty</MenuItem>
            </Select>
            <FormHelperText></FormHelperText>
          </FormControl>
        </Grid>
        <Grid item lg={2}>
          <SingleDatePicker
            date={supplierDetails.startDate}
            onChangeHandler={date => {
              setSuppliersDetails({ ...supplierDetails, startDate: date })
            }}
          />
        </Grid>
        <Grid item lg={2}>
          <SingleDatePicker
            date={supplierDetails.endDate}
            onChangeHandler={date => {
              setSuppliersDetails({ ...supplierDetails, endDate: date })
            }}
          />
        </Grid>

        <Grid item lg={2}>
          <Button size='large' sx={{ py: 3 }} variant='contained' onClick={handleHeaderAction}>
            Find
          </Button>
        </Grid>
        <Grid item lg={12}>
          <Typography sx={{ mb: 2 }}>Opening Balance : 0</Typography>
          <Typography sx={{ mb: 2 }}>Closing Balance : 0</Typography>
        </Grid>

        {/* {console.log(supplierDetails)} */}
      </Grid>
    )
  }

  return (
    <Grid>
      {supplierList.length > 0 ? (
        <TableWithFilter
          TableTitle={'Supplier Ledger'}
          inpFields={createForm()}
          columns={columns}
          rows={supplierList}
        />
      ) : (
        <Grid

        // sx={{ display: 'flex', height: '100%', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }}
        >
          <FallbackSpinner />
        </Grid>
      )}
    </Grid>
  )
}

export default SupplierLedger
