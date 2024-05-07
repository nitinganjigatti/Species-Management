/* eslint-disable lines-around-comment */
import React, { forwardRef, useState, useEffect } from 'react'
import TableBasic from 'src/views/table/data-grid/TableBasic'

import { Grid, Tooltip } from '@mui/material'

// ** MUI Imports

import Typography from '@mui/material/Typography'
import Fade from '@mui/material/Fade'

import { getDisputeItemById } from 'src/lib/api/pharmacy/getShipmentList'

const Transition = forwardRef(function Transition(props, ref) {
  return <Fade ref={ref} {...props} />
})

function DisputeItemView({ disputeId }) {
  const [disputedItem, setDisputedItem] = useState([])

  const viewSingleDisputeItem = async disputeId => {
    try {
      const result = await getDisputeItemById(disputeId)
      const responseData = result

      const mappedWithUid = result?.dispute_item_details?.map((item, index) => ({
        ...item,
        uid: index + 1
      }))
      responseData['dispute_item_details'] = mappedWithUid
      // setDisputedItem(result)
      setDisputedItem(responseData)
    } catch (error) {
      console.log('error', error)
    }
  }
  useEffect(() => {
    if (disputeId) {
      viewSingleDisputeItem(disputeId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const disputedItemsColumns = [
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
      field: 'from_store_name',
      headerName: 'From store',
      renderCell: (params, rowId) => (
        <div>
          {/* <Typography variant='body2' sx={{ color: 'text.primary' }}>
            <div>{params.row.from_store_name}</div>
          </Typography> */}
          <Tooltip title={params.row.from_store_name} placement='top'>
            <Typography variant='body2' sx={{ color: 'text.primary' }}>
              {params.row.from_store_name}
            </Typography>
          </Tooltip>
        </div>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'to_store_name',
      headerName: 'To store ',
      renderCell: params => (
        // <Typography variant='body2' sx={{ color: 'text.primary' }}>
        //   {params.row.to_store_name}
        // </Typography>
        <div>
          <Tooltip title={params.row.to_store_name} placement='top'>
            <Typography variant='body2' sx={{ color: 'text.primary' }}>
              {params.row.to_store_name}
            </Typography>
          </Tooltip>
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
      {disputedItem?.dispute_item_details?.length > 0 ? (
        <Grid md={12} sm={12} xs={12} sx={{ my: 2 }}>
          <TableBasic columns={disputedItemsColumns} rows={disputedItem?.dispute_item_details}></TableBasic>
        </Grid>
      ) : null}
      {disputedItem?.dispute_comments ? (
        <Grid item>
          <h5 style={{ marginBottom: '0px' }}>Comments</h5>
          <p>{disputedItem?.dispute_comments}</p>
        </Grid>
      ) : null}
    </Grid>
  )
}

export default DisputeItemView
