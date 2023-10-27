import React, { useState, useEffect } from 'react'

import { getExpiredMedicine } from 'src/lib/api/getStocksReportById'
import TableWithFilter from 'src/components/TableWithFilter'
import FallbackSpinner from 'src/@core/components/spinner'

import Typography from '@mui/material/Typography'

const ExpiredMedicine = () => {
  const [stockoutItems, setStockoutItems] = useState([])
  const [loading, setLoading] = useState(false)

  const getStockOutItemsList = async () => {
    setLoading(true)
    const response = await getExpiredMedicine()
    if (response?.length > 0) {
      let data = response
      data?.map((obj, i) => (obj['id'] = i + 1))
      console.log(data)

      // debugger
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
      field: 'batch_no',
      headerName: 'Batch',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.batch_no}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'expiry_date',
      headerName: 'Expiry Date',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.expiry_date}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'stock_qty',
      headerName: 'Stock',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.stock_qty}
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
      <TableWithFilter TableTitle='Expired Medicine' columns={columns} rows={stockoutItems} />
    </>
  )
}

export default ExpiredMedicine
