import React, { useState, useEffect } from 'react'

import { getSuppliers } from '../../../lib/api/getSupplierList'
import TableWithFilter from '../../../components/TableWithFilter'
import Button from '@mui/material/Button'
import FallbackSpinner from '../../../@core/components/spinner/index'

// ** MUI Imports
import IconButton from '@mui/material/IconButton'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box } from '@mui/material'

import Router from 'next/router'
import { options } from '@fullcalendar/core/preact'

const Supplier = () => {
  const [supplierList, setSupplierList] = useState([])
  const [loader, setLoader] = useState(false)

  const getSupplierList = async () => {
    setLoader(true)
    const response = await getSuppliers()
    if (response?.length > 0) {
      console.log('list ', response)
      console.log(' status', response.status)
      response ? response.sort((a, b) => a.id - b.id) : '', setSupplierList(response)
      setLoader(false)
    } else {
      setLoader(false)
    }
  }

  const handleEdit = id => {
    Router.push({
      pathname: '/pharmacy/supplier/add-supplier',
      query: { id: id, action: 'edit' }
    })
  }

  useEffect(() => {
    getSupplierList()
  }, [])

  const columns = [
    {
      flex: 0.05,
      Width: 40,
      alignItems: 'right',
      field: 'id',
      headerName: 'SL ',
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
        <Box sx={{ display: 'flex', alignItems: 'right', textAlign: 'right' }}>
          {/* <IconButton size='small' sx={{ mr: 0.5 }}>
            <Icon icon='mdi:eye-outline' />
          </IconButton> */}
          <IconButton size='small' sx={{ mr: 0.5 }} onClick={() => handleEdit(params.row.id)} aria-label='Edit'>
            <Icon icon='mdi:pencil-outline' />
          </IconButton>
          {/* <IconButton size='small' sx={{ mr: 0.5 }}>
            <Icon icon='mdi:delete-outline' />
          </IconButton> */}
        </Box>
      )
    }
  ]

  const handleHeaderAction = () => {
    console.log('Handle Header Action')
  }

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <TableWithFilter
          TableTitle={supplierList.length > 0 ? 'Supplier List' : 'Supplier list is empty add supplier'}
          headerActions={
            <div>
              <Button
                size='big'
                variant='contained'
                onClick={() => {
                  Router.push('/pharmacy/supplier/add-supplier')
                }}
              >
                Add Supplier
              </Button>
            </div>
          }
          columns={columns}
          rows={supplierList}
        />
      )}
    </>
  )
}

export default Supplier
