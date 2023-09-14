import React, { useState, useEffect } from 'react'

import { getSuppliers } from '../../lib/api/getSupplierList'
import TableWithFilter from '../../components/TableWithFilter'
import Button from '@mui/material/Button'
import FallbackSpinner from '../../@core/components/spinner/index'

// ** MUI Imports
import IconButton from '@mui/material/IconButton'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box } from '@mui/material'

const Supplier = () => {
  const [supplierList, setSupplierList] = useState([])

  const getSupplierList = async () => {
    const response = await getSuppliers()
    console.log('list', response)
    response.sort((a, b) => a.id - b.id)
    setSupplierList(response)

    // setSupplierList(response);
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

  const handleHeaderAction = () => {
    console.log('Handle Header Action')
  }

  return (
    <>
      {supplierList.length > 0 ? (
        <TableWithFilter
          TableTitle={'Supplier List'}
          headerActions={
            <div>
              <Button size='big' variant='contained' onClick={handleHeaderAction}>
                Add Supplier
              </Button>
            </div>
          }
          columns={columns}
          rows={supplierList}
        />
      ) : (
        <FallbackSpinner />
      )}
    </>
  )
}

export default Supplier
