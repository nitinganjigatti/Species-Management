import React, { useState, useEffect } from 'react'

import { getPurchaseList } from 'src/lib/api/getPurchaseList'
import TableWithFilter from 'src/components/TableWithFilter'
import Button from '@mui/material/Button'
import FallbackSpinner from 'src/@core/components/spinner/index'

// ** MUI Imports
import IconButton from '@mui/material/IconButton'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box } from '@mui/material'

import Router from 'next/router'

const ListOfPurchase = () => {
  const [purchaseList, setPurchaseList] = useState([])
  const [loader, setLoader] = useState(false)

  const getPurchaseLists = async () => {
    try {
      setLoader(true)
      const response = await getPurchaseList()
      if (response?.length > 0) {
        console.log('list', response)

        // response.sort((a, b) => a.id - b.id)
        let listWithId = response
          ? response.map((el, i) => {
              return { ...el, uid: i + 1 }
            })
          : []
        setPurchaseList(listWithId)
        setLoader(false)
      } else {
        setLoader(false)
      }
    } catch (error) {
      console.log('error', error)
      setLoader(false)
    }
  }

  const handleEdit = id => {
    Router.push({
      pathname: '/pharmacy/purchase/addPurchase/',
      query: { id: id, action: 'edit' }
    })
  }
  useEffect(() => {
    getPurchaseLists()
  }, [])

  const columns = [
    {
      flex: 0.05,
      Width: 40,
      field: 'uid',
      headerName: 'SL ',
      renderCell: (params, rowId) => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.uid}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'po_no',
      headerName: 'PURCHASE NO',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.po_no}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'supplier_name',
      headerName: 'SUPPLIER NAME',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.supplier_name}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'total_amount',
      headerName: 'TOTAL AMOUNT',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.total_amount}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'tax_amount',
      headerName: 'TAX AMOUNT',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.tax_amount}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'discount_amount',
      headerName: 'DISCOUNT AMOUNT',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.discount_amount}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'paid_amount',
      headerName: 'PAID AMOUNT',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.paid_amount}
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
          <IconButton
            size='small'
            sx={{ mr: 0.5 }}
            onClick={() => {
              handleEdit(params.row.id)
            }}
          >
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
          TableTitle={purchaseList.length > 0 ? 'Purchase List' : 'Purchase List is empty add Purchase List'}
          headerActions={
            <div>
              <Button
                size='big'
                variant='contained'
                onClick={() => {
                  Router.push('/pharmacy/purchase/addPurchase/')
                }}
              >
                Add Purchase
              </Button>
            </div>
          }
          columns={columns}
          rows={purchaseList}
        />
      )}
    </>
  )
}

export default ListOfPurchase
