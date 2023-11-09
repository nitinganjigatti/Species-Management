import React, { forwardRef, useState, useEffect } from 'react'

import TableWithFilter from 'src/components/TableWithFilter'
import Button from '@mui/material/Button'
import FallbackSpinner from 'src/@core/components/spinner/index'
import TableBasic from 'src/views/table/data-grid/TableBasic'
import DataGrid from 'src/@core/theme/overrides/dataGrid'
import Dialog from '@mui/material/Dialog'
import CustomChip from 'src/@core/components/mui/chip'

// ** MUI Imports
import IconButton from '@mui/material/IconButton'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableRow from '@mui/material/TableRow'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import Fade from '@mui/material/Fade'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box, CardContent, CardHeader } from '@mui/material'
import { useRouter } from 'next/router'

import Router from 'next/router'
import { column } from 'stylis'

import FulfillDialog from 'src/components/pharmacy/request/FulfillDialog'
import ShipRequest from 'src/components/pharmacy/request/ShipRequestForm'

const Transition = forwardRef(function Transition(props, ref) {
  return <Fade ref={ref} {...props} />
})
function OrderReceiveForm() {
  return (
    <Card>
      <CardHeader title={`Order received`} />
      <CardHeader title={`Shipping Id`} />
      <CardContent>
        {/* Request Basic Info */}
        <Grid container spacing={2} sx={{ flexGrow: 1 }}>
          <Grid item xs={3}>
            <h5 style={{ marginBottom: '0px' }}>Shipping id</h5>
            <p>{requestItems?.from_store}</p>
          </Grid>
          <Grid item xs={3}>
            <h5 style={{ marginBottom: '0px' }}>Store name </h5>
            <p>{requestItems?.to_store}</p>
          </Grid>
          <Grid item xs={3}>
            <h5 style={{ marginBottom: '0px' }}>Shipped Date</h5>
            <p>{requestItems?.request_date}</p>
          </Grid>
          <Grid item xs={3}>
            <h5 style={{ marginBottom: '0px' }}>Vehicle Number</h5>
            <p>{requestItems?.request_number}</p>
          </Grid>
          <Grid item xs={3}>
            <h5 style={{ marginBottom: '0px' }}>Driver details</h5>
            <p>{requestItems?.request_number}</p>
          </Grid>
        </Grid>
        {/* Medicine Listing */}
      </CardContent>
      {requestItems?.request_item_details?.length > 0 ? (
        <TableBasic columns={columns} rows={requestItems?.request_item_details}></TableBasic>
      ) : null}
      {/* Dispatch list */}
      {dispatchedItems?.dispatch_items?.length > 0 ? (
        <>
          <CardContent>
            <Grid container spacing={2} sx={{ flexGrow: 1 }}>
              <Grid item xs={6}>
                <h5 style={{ marginBottom: '0px' }}>Fulfillment</h5>
              </Grid>
              <Grid item xs={6} style={{ display: 'flex', justifyContent: 'right' }}>
                <Button
                  size='big'
                  variant='contained'
                  onClick={() => {
                    openShipDialog()
                  }}
                >
                  Ship
                </Button>
              </Grid>
            </Grid>
          </CardContent>
          {/* <TableBasic columns={fulfillColumns} rows={dispatchedItems?.dispatch_items}></TableBasic> */}
        </>
      ) : null}
    </Card>
  )
}

export default OrderReceiveForm
