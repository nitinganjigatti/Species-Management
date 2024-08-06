import React, { useState, useEffect } from 'react'

import TableWithFilter from 'src/components/TableWithFilter'
import FallbackSpinner from 'src/@core/components/spinner/index'

// ** MUI Imports
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// import DeleteIcon from '@mui/icons-material/Delete'

import { Box, Button } from '@mui/material'

import { deleteNonExistingProduct, getNonExistingProductList } from 'src/lib/api/pharmacy/newMedicine'
import { useRouter } from 'next/router'
import { AddButton } from 'src/components/Buttons'
import Utility from 'src/utility'

export default function NewProductList() {
  const router = useRouter()
  const [loader, setLoader] = useState(false)
  const [rows, setRows] = useState([])

  const getProductList = async () => {
    const response = await getNonExistingProductList()
    if (response) {
      setRows(response?.data)
      setLoader(false)
    } else {
      setLoader(true)
    }
  }

  useEffect(() => {
    getProductList()
  }, [])

  const handleEdit = id => {
    router.push({
      pathname: '/pharmacy/new-product-request/request-product/',
      query: { id: id }
    })
  }

  const handleDelete = async id => {
    const response = await deleteNonExistingProduct(id)
      .then(res => {
        console.log('deleted Successfully', res)
      })
      .catch(err => console.log('err', err))

    return response
  }

  const columns = [
    {
      flex: 0.2,
      Width: 20,
      field: 'from_store_name',
      headerName: 'Store Name',
      renderCell: (params, rowId) => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.from_store_name}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'priority',
      headerName: 'priority',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.priority}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'requested_by',
      headerName: 'Requested By User',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.requested_user_name}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'status',
      headerName: 'status',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.status}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'created_at',
      headerName: 'Created DateTime',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {Utility.formatDisplayDate(params.row.created_at)}
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
          <IconButton size='small' sx={{ mr: 0.5 }} onClick={() => handleEdit(params.row.id)}>
            <Icon icon='mdi:pencil-outline' />
          </IconButton>
          <IconButton
            size='small'
            sx={{ mr: 0.5 }}
            onClick={() => {
              handleDelete(params.row.id)
            }}
          >
            {/* <DeleteIcon /> */}
          </IconButton>
        </Box>
      )
    }
  ]

  // const handleHeaderAction = () => {
  //   console.log('Handle Header Action')
  // }

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <>
          <TableWithFilter
            TableTitle={'New Product Request '}
            headerActions={
              <div>
                <AddButton
                  title='Add Product'
                  action={() => router.push('/pharmacy/new-product-request/request-product/')}
                />
              </div>
            }
            columns={columns}
            rows={rows}
          />
        </>
      )}
    </>
  )
}
