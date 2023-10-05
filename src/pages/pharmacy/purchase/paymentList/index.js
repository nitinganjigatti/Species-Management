import React, { useState, useEffect } from 'react'

import { getPaymentList } from 'src/lib/api/getPaymentList'
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

const ListOfPayments = () => {
  const [paymentList, setPaymentList] = useState([])
  const [loader, setLoader] = useState(false)

  const getPaymentsLists = async () => {
    setLoader(true)
    const response = await getPaymentList()
    if (response?.length > 0) {
      console.log('list', response)

      let listWithId = response
        ? response.map((el, i) => {
            return { ...el, id: i + 1 }
          })
        : []

      // response.sort((a, b) => a.id - b.id)
      setPaymentList(listWithId)
      setLoader(false)
    } else {
      setLoader(false)
    }
  }

  useEffect(() => {
    getPaymentsLists()
  }, [])

  const columns = [
    {
      flex: 0.05,
      Width: 40,
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
      field: 'po_number',
      headerName: 'PO NO',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.po_number}
        </Typography>
      )
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
      field: 'amount',
      headerName: 'AMOUNT',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.amount}
        </Typography>
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
          TableTitle={paymentList.length > 0 ? 'Payment List' : 'Payment List is empty add Payment List'}
          headerActions={
            <div>
              <Button size='big' variant='contained'>
                Add Payment
              </Button>
            </div>
          }
          columns={columns}
          rows={paymentList}
        />
      )}
    </>
  )
}

export default ListOfPayments
