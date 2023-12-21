import React, { useState, useEffect } from 'react'

import { getPaymentList, addPaymentList } from 'src/lib/api/pharmacy/getPaymentList'
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
import AddPayment from 'src/views/pages/pharmacy/purchase/payment/addPayment'
import toast from 'react-hot-toast'

const ListOfPayments = () => {
  const [paymentList, setPaymentList] = useState([])
  const [loader, setLoader] = useState(false)

  /*** Drawer ****/
  const editParamsInitialState = {
    id: null,
    supplier_id: null,

    // date: new Date().toISOString().slice(0, 10),
    date: '',
    total_due_amount: 0,
    amount: null,
    payment_mode: 'cash',
    txn_no: null,
    type: 'dr'
  }
  const [openDrawer, setOpenDrawer] = useState(false)
  const [resetForm, setResetForm] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [editParams, setEditParams] = useState(editParamsInitialState)

  const [openSnackbar, setOpenSnackbar] = useState({
    open: false,
    severity: '',
    message: ''
  })

  const addEventSidebarOpen = () => {
    console.log('event clicked')
    setEditParams({
      id: null,
      supplier_id: null,

      // date: new Date().toISOString().slice(0, 10),
      date: '',
      total_due_amount: 0,
      amount: null,
      payment_mode: 'cash',
      txn_no: null,
      type: 'dr'
    })
    setResetForm(true)
    console.log(editParams)
    setOpenDrawer(true)
  }

  const handleSidebarClose = () => {
    console.log('close event clicked')
    setOpenDrawer(false)
  }

  const handleSubmitData = async payload => {
    console.log('payload', payload)
    setSubmitLoader(true)
    const response = await addPaymentList(payload)
    if (response?.success) {
      toast.success(response.message)
      setOpenSnackbar({ ...openSnackbar, open: true, message: response?.message, severity: 'success' })
      setSubmitLoader(false)
      setResetForm(true)
      setOpenDrawer(false)

      await getPaymentsLists()
    } else {
      setSubmitLoader(false)
      console.log('test')
      toast.error(response.message)
      setOpenSnackbar({ ...openSnackbar, open: true, message: response?.message?.name, severity: 'error' })
    }

    // try {
    //   setSubmitLoader(true)

    //   const response = await addPaymentList(payload)
    //   console.log('after add payment', response)

    //   if (response?.success) {
    //     setOpenSnackbar({ ...openSnackbar, open: true, message: response?.message, severity: 'success' })
    //     setSubmitLoader(false)
    //     setResetForm(true)
    //     setOpenDrawer(false)

    //     await getPaymentsLists()
    //   } else {
    //     setSubmitLoader(false)
    //     console.log('test')
    //     setOpenSnackbar({ ...openSnackbar, open: true, message: response?.message?.name, severity: 'error' })
    //   }
    // } catch (e) {
    //   console.log(e)
    //   setSubmitLoader(false)
    //   setOpenSnackbar({ ...openSnackbar, open: true, message: 'Error', severity: 'error' })
    // }
  }

  /***** Drawer  */
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
        <>
          <TableWithFilter
            TableTitle={paymentList.length > 0 ? 'Payment List' : 'Payment List is empty add Payment List'}
            headerActions={
              <div>
                <Button onClick={() => addEventSidebarOpen()} size='big' variant='contained'>
                  Add Payment
                </Button>
              </div>
            }
            columns={columns}
            rows={paymentList}
          />
          <AddPayment
            drawerWidth={400}
            addEventSidebarOpen={openDrawer}
            handleSidebarClose={handleSidebarClose}
            handleSubmitData={handleSubmitData}
            resetForm={resetForm}
            submitLoader={submitLoader}
            editParams={editParams}
          />
        </>
      )}
    </>
  )
}

export default ListOfPayments
