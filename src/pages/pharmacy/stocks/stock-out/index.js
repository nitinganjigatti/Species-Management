import React, { useState, useEffect } from 'react'

import { getStockOutItems } from 'src/lib/api/getStocksReportById'
import TableWithFilter from 'src/components/TableWithFilter'
import Button from '@mui/material/Button'
import FallbackSpinner from 'src/@core/components/spinner'

// ** MUI Imports
import IconButton from '@mui/material/IconButton'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box } from '@mui/material'

import Router from 'next/router'

const StockOut = () => {
  const [stockoutItems, setStockoutItems] = useState([])
  const [loading, setLoading] = useState(false)

  const getStockOutItemsList = async () => {
    setLoading(true)
    const response = await getStockOutItems()
    if (response?.length > 0) {
      let data = response
      data?.map((obj, i) => (obj['id'] = i + 1))
      console.log(data)
      debugger
      setStockoutItems(data)
      setLoading(false)
    } else {
      setLoading(false)
    }
  }

  useEffect(() => {
    getStockOutItemsList()
  }, [])

  const columns = [
    {
      flex: 0.05,
      Width: 40,
      alignItems: 'right',
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
      field: 'stock_item_name',
      headerName: 'Medicine Name',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.stock_item_name}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'generic_name',
      headerName: 'GENERIC NAME',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.generic_name}
        </Typography>
      )
    }
  ]

  const handleHeaderAction = () => {
    console.log('Handle Header Action')
  }
  if (loading) {
    return <FallbackSpinner />
  }

  // if (isError) {
  //   return <h1>{error.message}</h1>
  // }

  return (
    <>
      <TableWithFilter TableTitle='Stock Out' columns={columns} rows={stockoutItems} />
    </>
  )
}

export default StockOut
