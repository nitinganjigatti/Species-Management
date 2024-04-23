/* eslint-disable lines-around-comment */
import React, { forwardRef, useState, useEffect } from 'react'
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

  const viewSingleDispenseItem = async dispenseId => {
    try {
      const result = await getDispenseItemById(dispenseId)

      const responseData = result.data

      const mappedWithUid = result?.data[0]?.dispense_item_details?.map((item, index) => ({
        ...item,
        uid: index + 1
      }))

      responseData['dispense_item_details'] = mappedWithUid
      // setDispenseItem(result.data)
      setDispenseItem(responseData)
    } catch (error) {
      console.log('error', error)
    }
  }
  useEffect(() => {
    if (dispenseId) {
      viewSingleDispenseItem(dispenseId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const dispenseItemsColumns = [
    {
      flex: 0.05,
      Width: 40,
      field: 'uid',
      headerName: 'SL',
      renderCell: (params, rowId) => (
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
      renderCell: (params, rowId) => (
        <div>
          {/* <Typography variant='body2' sx={{ color: 'text.primary' }}>
            <div>{params.row.stock_name}</div>
          </Typography> */}
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
      renderCell: (params, rowId) => (
        <div>
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            <div>{params.row.given_count}</div>
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

  return (
    <Grid xs={12}>
      {dispenseItem?.dispense_item_details?.length > 0 ? (
        <Grid md={12} sm={12} xs={12} sx={{ my: 2 }}>
          <TableBasic columns={dispenseItemsColumns} rows={dispenseItem?.dispense_item_details}></TableBasic>
        </Grid>
      ) : null}
      {dispenseItem[0]?.comments ? (
        <Grid item>
          <h5 style={{ marginBottom: '0px' }}>Comments</h5>
          <p>{dispenseItem[0]?.comments}</p>
        </Grid>
      ) : null}
    </Grid>
  )
}

export default DispenseItemView
