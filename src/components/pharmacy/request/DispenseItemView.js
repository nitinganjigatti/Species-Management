/* eslint-disable lines-around-comment */
import React, { forwardRef, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import TableBasic from 'src/views/table/data-grid/TableBasic'

import { Grid, Tooltip } from '@mui/material'

// ** MUI Imports
import Typography from '@mui/material/Typography'
import Fade from '@mui/material/Fade'

import { getDispenseItemById } from 'src/lib/api/pharmacy/getShipmentList'

const Transition = forwardRef(function Transition(props, ref) {
  return <Fade ref={ref} {...props} />
})

function DispenseItemView({ dispenseId }) {
  const [dispenseItem, setDispenseItem] = useState([])
  const [mounted, setMounted] = useState(false)

  const viewSingleDispenseItem = async dispenseId => {
    try {
      const result = await getDispenseItemById(dispenseId)

      const responseData = result.data

      const mappedWithUid = result?.data[0]?.dispense_item_details?.map((item, index) => ({
        ...item,
        uid: index + 1
      }))

      responseData['dispense_item_details'] = mappedWithUid
      setDispenseItem(responseData)
    } catch (error) {
      console.log('error', error)
    }
  }

  useEffect(() => {
    setMounted(true)
    if (dispenseId) {
      viewSingleDispenseItem(dispenseId)
    }
  }, [dispenseId])

  const dispenseItemsColumns = [
    {
      flex: 0.05,
      Width: 40,
      field: 'uid',
      headerName: 'SL',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.uid}
        </Typography>
      )
    },
    {
      flex: 0.2,
      Width: 40,
      field: 'stock_name',
      headerName: 'Medicine Name',
      renderCell: params => (
        <div>
          <Tooltip title={params.row.stock_name} placement='top'>
            <Typography variant='body2' sx={{ color: 'text.primary' }}>
              {params.row.stock_name}
            </Typography>
          </Tooltip>
        </div>
      )
    },
    {
      flex: 0.2,
      Width: 40,
      field: 'given_count',
      headerName: 'Quantity',
      renderCell: params => (
        <div>
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {params.row.given_count}
          </Typography>
        </div>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'batch_no',
      headerName: 'Batch ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.batch_no}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'status',
      headerName: 'Status',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.status}
        </Typography>
      )
    }
  ]

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null
  }

  return (
    <Grid container>
      {dispenseItem?.dispense_item_details?.length > 0 ? (
        <Grid item xs={12} sm={12} md={12} sx={{ my: 2 }}>
          <TableBasic columns={dispenseItemsColumns} rows={dispenseItem?.dispense_item_details} />
        </Grid>
      ) : null}
      {dispenseItem[0]?.comments ? (
        <Grid item xs={12}>
          <Typography variant='h6' sx={{ mb: 1 }}>
            Comments
          </Typography>
          <Typography variant='body1'>{dispenseItem[0]?.comments}</Typography>
        </Grid>
      ) : null}
    </Grid>
  )
}

// Export with no SSR to prevent hydration issues
export default dynamic(() => Promise.resolve(DispenseItemView), { ssr: false })
