/* eslint-disable lines-around-comment */
import React, { forwardRef, useState, useEffect } from 'react'
import TableBasic from 'src/views/table/data-grid/TableBasic'

import {
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Divider,
  Box,
  Button,
  IconButton,
  CircularProgress,
  CardContent,
  CardHeader,
  Tooltip
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import FormHelperText from '@mui/material/FormHelperText'
import Icon from 'src/@core/components/icon'
import DialogTitle from '@mui/material/DialogTitle'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'

// ** MUI Imports

import Typography from '@mui/material/Typography'
import Fade from '@mui/material/Fade'
import toast from 'react-hot-toast'

import {
  getShipmentOrderDetails,
  addDisputeItems,
  addDispenseItems,
  getDisputeItemById,
  getShipmentStatusList,
  resolveDisputeItems,
  getCommentsList
} from 'src/lib/api/pharmacy/getShipmentList'

import { updateShipmentRequest } from 'src/lib/api/pharmacy/getRequestItemsList'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import Utility from 'src/utility'
import ConfirmDialogBox from 'src/components/ConfirmDialogBox'

const Transition = forwardRef(function Transition(props, ref) {
  return <Fade ref={ref} {...props} />
})

function OrderReceiveForm({ orderId, requestId, closeOrderFormDialog }) {
  const defaultValues = {
    shipment_id: '',
    // dispatch_id: '',
    request_id: requestId,
    comments: '',
    store_id: '',
    item_details: [
      {
        dispatch_id: '',
        uid: '',
        id: '',
        stock_id: '',
        stock_name: '',
        count: '',
        batch_no: '',
        from_store: '',
        to_store: '',
        from_store_name: '',
        to_store_name: '',
        status: '',
        wrong_count_type: '',
        wrong_count_number: ''
      }
    ]
  }

  const initialRejectPayload = {
    from_store: '',
    to_store: '',
    batch_no: '',
    stock_id: '',
    status: '',
    dispatch_item_id: '',
    request_id: '',
    // request_item_id: '',
    type: '',
    action: '',
    comment: '',
    dispute_id: ''
  }

  const [disputeItemDetails, setDisputeItemDetails] = useState({})
  const [tempDisputeItemDetails, setTempDisputeItemDetails] = useState([])
  const [submitLoader, setSubmitLoader] = useState(false)
  const [statusOptions, setStatusOptions] = useState([])
  const [resolveLoader, setResolveLoader] = useState(false)
  const [disputeDialog, setDisputeDialog] = useState(false)

  const [commentDialog, setCommentDialog] = useState(false)
  const [rejectItemsPayload, setRejectItemsPayload] = useState(initialRejectPayload)
  const [rejectItemsError, setRejectItemsError] = useState(null)
  const [listComments, setListComments] = useState([])
  const [orderData, setOrderData] = useState([])
  const [wrongCountErr, setWrongCountErr] = useState({})

  const { selectedPharmacy } = usePharmacyContext()

  const closeDisputeDialog = () => {
    setDisputeDialog(false)
    setRejectItemsPayload(initialRejectPayload)
    setRejectItemsError(null)
  }

  const openDisputeDialog = () => {
    setDisputeDialog(true)
  }

  const closeCommentDialog = () => {
    setCommentDialog(false)
    setListComments([])
  }

  const openCommentDialog = () => {
    setCommentDialog(true)
  }

  const handleStatusChange = (itemId, event) => {
    const { name, value } = event.target

    const updatedData = {
      ...disputeItemDetails,
      item_details: disputeItemDetails.item_details.map(item =>
        // item.id === itemId ? { ...item, status: event.target.value } : item
        item.id === itemId ? { ...item, [name]: value } : item
      )
    }

    setDisputeItemDetails(updatedData)
  }

  const clearStatus = (itemId, event) => {
    const updatedData = {
      ...disputeItemDetails,
      item_details: disputeItemDetails.item_details.map(item =>
        item.id === itemId ? { ...item, status: '', wrong_count_type: '', wrong_count_number: '' } : item
      )
    }

    setDisputeItemDetails(updatedData)
  }

  // const options = ['Received', 'Broken', 'Missing', 'Wrong count', 'Expired']

  const getStatusList = async () => {
    try {
      const status = await getShipmentStatusList()
      if (status?.success) {
        setStatusOptions(status?.data)
      }
    } catch (error) {
      console.log('error', error)
    }
  }

  const getOrderDetails = async orderId => {
    try {
      const response = await getShipmentOrderDetails(orderId)
      if (response?.success === true && response?.data !== '') {
        const disputeLineItems = response?.data?.shipment_item_details?.map((el, index) => {
          const data = {
            uid: index + 1,
            id: el?.id,
            stock_id: el?.stock_id,
            batch_no: el?.batch,
            count: el?.quantity,
            from_store: el?.from_store,
            to_store: el?.to_store,
            stock_name: el?.stock_name,
            from_store_name: el?.from_store_name,
            to_store_name: el?.to_store_name,
            status: el.status ? el.status : '',
            dispatch_id: el?.dispatch_id,
            dispatch_item_id: el?.dispatch_item_id,
            wrong_count_type: el?.wrong_count_type ? el?.wrong_count_type : '',
            wrong_count_number: el?.wrong_count_number ? el?.wrong_count_number : '',
            dispute_status: el?.dispute_status ? el?.dispute_status : '',
            request_item_id: el?.request_item_id ? el?.request_item_id : '',
            dispute_id: el?.dispute_id,
            total_deny_comments: el?.total_deny_comments
          }

          return data
        })
        setOrderData({
          ...orderData,

          shipping_id: orderId,
          shipment_id: response?.data?.shipment_id,
          shipment_date: response?.data?.shipment_date,
          shipment_status: response?.data?.shipment_status,
          vehicle_no: response?.data?.vehicle_no,
          item_details: disputeLineItems,
          person_shipping: response?.data?.person_shipping
            ? response?.data?.person_shipping
            : response?.data?.receiver_name,
          phone_number: response?.data?.phone_number
        })

        const disputesData = {
          shipment_id: orderId,
          store_id: response?.data?.shipment_item_details[0]?.from_store,
          // dispatch_id: response?.data?.dispatch_id,
          request_id: requestId,
          item_details: disputeLineItems,
          comments: response?.data?.comments,
          delivery_status: response?.data?.delivery_status,
          dispute_status: response?.data?.dispute_status
        }

        setDisputeItemDetails(disputesData)
        setTempDisputeItemDetails(disputesData)
      }
    } catch (error) {
      console.log('error', error)
    }
  }

  function getDisableStatus(id) {
    if (!Array.isArray(orderData.item_details)) {
      return
    }
    const foundItem = orderData.item_details?.find(item => item.id == id)
    if (foundItem.status !== '') {
      return true
    } else {
      return false
    }
  }
  function disableButton() {
    if (disputeItemDetails?.item_details) {
      const allReceived = disputeItemDetails?.item_details.every(item => item.status === '')

      return allReceived
    }
  }
  useEffect(() => {
    if (orderId) {
      getOrderDetails(orderId)
    }
    getStatusList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const bulkStatusUpdate = async () => {
    const updatedItemDetails = disputeItemDetails.item_details.map(item => {
      // if (item.status === '' || item.status === 'Expired' || item.status === 'Broken') {
      return {
        ...item,
        status: 'Received'
      }
      // } else {
      //   return item
      // }
    })

    // setDisputeItemDetails(prevState => ({
    //   ...prevState,
    //   item_details: updatedItemDetails
    // }))
    const items = disputeItemDetails
    items['item_details'] = updatedItemDetails
    setDisputeItemDetails({ ...disputeItemDetails, items })
    updateStatus()
  }

  const resolveItems = async payload => {
    var itemsToResolve
    if (payload?.status === 'Missing') {
      itemsToResolve = {
        from_store: payload.from_store,
        to_store: payload.to_store,
        batch_no: payload.batch_no,
        stock_id: payload.stock_id,
        status: payload.status,
        dispatch_item_id: payload.dispatch_item_id,
        request_id: requestId,
        request_item_id: payload.request_item_id,
        type: 'resolve',
        action: 'accept'
      }
    }
    if (payload?.status === 'Wrong Count' && payload.wrong_count_type === 'excess') {
      itemsToResolve = {
        from_store: payload.from_store,
        to_store: payload.to_store,
        batch_no: payload.batch_no,
        stock_id: payload.stock_id,
        status: payload.status,
        dispatch_item_id: payload.dispatch_item_id,
        excess_count: payload.wrong_count_number,
        request_id: requestId,
        request_item_id: payload.request_item_id,
        type: 'Excess',
        action: 'accept'
      }
    }

    if (payload?.status === 'Wrong Count' && payload.wrong_count_type === 'shortage') {
      itemsToResolve = {
        from_store: payload.from_store,
        to_store: payload.to_store,
        batch_no: payload.batch_no,
        stock_id: payload.stock_id,
        status: payload.status,
        dispatch_item_id: payload.dispatch_item_id,
        shortage_count: payload.wrong_count_number,
        request_id: requestId,
        request_item_id: payload.request_item_id,
        type: 'Shortage',
        action: 'accept'
      }
    }

    try {
      setResolveLoader(true)

      const resolved = await resolveDisputeItems(itemsToResolve)
      if (resolved?.success) {
        setResolveLoader(false)
        toast.success(resolved?.data)
        getOrderDetails(orderId)
      } else {
        setResolveLoader(false)
      }
    } catch (error) {
      setResolveLoader(false)

      console.log('error', error)
    }
  }

  const rejectItems = async payload => {
    if (payload?.status === 'Missing') {
      setRejectItemsPayload({
        ...rejectItemsPayload,
        from_store: payload?.from_store,
        to_store: payload?.to_store,
        batch_no: payload?.batch_no,
        stock_id: payload?.stock_id,
        status: payload?.status,
        dispatch_item_id: payload?.dispatch_item_id,
        request_id: requestId,
        // request_item_id: payload?.request_item_id,
        dispute_id: payload?.dispute_id,
        type: 'resolve',
        action: 'deny'
      })
    }
    if (payload?.status === 'Wrong Count' && payload.wrong_count_type === 'excess') {
      setRejectItemsPayload({
        ...rejectItemsPayload,
        from_store: payload?.from_store,
        to_store: payload?.to_store,
        batch_no: payload?.batch_no,
        stock_id: payload?.stock_id,
        status: payload?.status,
        dispatch_item_id: payload?.dispatch_item_id,
        request_id: requestId,
        excess_count: payload.wrong_count_number,
        // request_item_id: payload?.request_item_id,
        dispute_id: payload?.dispute_id,
        type: 'Excess',
        action: 'deny'
      })
    }

    if (payload?.status === 'Wrong Count' && payload.wrong_count_type === 'shortage') {
      setRejectItemsPayload({
        ...rejectItemsPayload,
        from_store: payload?.from_store,
        to_store: payload?.to_store,
        batch_no: payload?.batch_no,
        stock_id: payload?.stock_id,
        status: payload?.status,
        dispatch_item_id: payload?.dispatch_item_id,
        request_id: requestId,
        shortage_count: payload.wrong_count_number,
        // request_item_id: payload?.request_item_id,
        dispute_id: payload?.dispute_id,
        type: 'Shortage',
        action: 'deny'
      })
    }

    openDisputeDialog()
  }

  const submitRejectItems = async () => {
    for (let key in rejectItemsPayload) {
      if (rejectItemsPayload[key] === '' || rejectItemsPayload[key] === null || rejectItemsPayload[key] === undefined) {
        setRejectItemsError(`The key '${key}' has an empty value.`)

        return
      }
    }
    try {
      setResolveLoader(true)
      const resolved = await resolveDisputeItems(rejectItemsPayload)
      if (resolved?.success) {
        setResolveLoader(false)
        toast.success(resolved?.data)
        getOrderDetails(orderId)
        closeDisputeDialog()
      } else {
        setResolveLoader(false)
      }
    } catch (error) {
      setResolveLoader(false)

      console.log('error', error)
    }
  }

  const getRejectedCommentsList = async id => {
    try {
      const comments = await getCommentsList(id)
      // setListComments()
      if (comments.data.length > 0 && comments.success === true) {
        setListComments(comments)
        openCommentDialog()
      }
    } catch (error) {
      console.log('comments error', error)
    }
  }

  const verifyStatusInTemp = id => {
    const verified = disputeItemDetails?.item_details?.find(el => el.id === id)
    const verifyInTempData = tempDisputeItemDetails?.item_details?.find(el => el.id === verified?.id)

    const result = verified?.status === verifyInTempData?.status

    return result
  }

  const commentDialogBox = () => {
    return (
      <ConfirmDialogBox
        open={commentDialog}
        closeDialog={() => {
          closeCommentDialog()
        }}
        action={closeCommentDialog}
        content={
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: 2, my: 2 }}>
            <Box>
              {listComments?.data?.length > 0 ? (
                listComments?.data?.map((el, index) => {
                  return (
                    <Card key={index} sx={{ mx: 2, mb: 2 }}>
                      <CardContent>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography style={{ fontWeight: 'bold' }}>{el?.from_store}</Typography>
                          </Grid>
                          <Grid item xs={6} sx={{ alignItems: 'flex-end', display: 'flex', flexDirection: 'column' }}>
                            <Typography style={{ fontSize: '12px' }}>
                              {Utility.formatDisplayDate(el?.created_at)}
                            </Typography>
                          </Grid>
                          <Grid item>
                            <Typography>{el?.comment}</Typography>
                          </Grid>
                        </Grid>
                        {/* <strong>Shipped From:</strong> */}
                      </CardContent>
                      {/* <CardContent>{el?.comment}</CardContent> */}
                    </Card>
                  )
                })
              ) : (
                <DialogTitle id='alert-dialog-title'>No comments found for this request</DialogTitle>
              )}
            </Box>
            {/* <DialogActions className='dialog-actions-dense'>
              <Button
                variant='contained'
                color='error'
                size='small'
                onClick={() => {
                  closeCommentDialog()
                }}
              >
                Cancel
              </Button>
            </DialogActions> */}
          </Box>
        }
      />
    )
  }

  const columns = [
    {
      flex: 0.2,
      Width: 40,
      field: 'stock_name',
      headerName: 'Product Name',
      renderCell: (params, rowId) => (
        <div>
          {/* <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {params.row.stock_name}
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
      field: 'count',
      headerName: 'qty',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.count}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'from_store_name',
      headerName: selectedPharmacy?.type === 'local' ? 'Shipped To' : 'Shipped From',
      renderCell: params => (
        // <Typography variant='body2' sx={{ color: 'text.primary' }}>
        //   {selectedPharmacy?.type === 'local' ? params.row.to_store_name : params.row.from_store_name}
        // </Typography>
        <div>
          <Tooltip
            title={selectedPharmacy?.type === 'local' ? params.row.to_store_name : params.row.from_store_name}
            placement='top'
          >
            <Typography variant='body2' sx={{ color: 'text.primary' }}>
              {selectedPharmacy?.type === 'local' ? params.row.to_store_name : params.row.from_store_name}
            </Typography>
          </Tooltip>
        </div>
      )
    },
    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'to_store_name',
    //   headerName: 'Shipped To',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {params.row.to_store_name}
    //     </Typography>
    //   )
    // },

    {
      flex: 0.4,
      minWidth: 200,
      field: 'status',
      // headerName: 'Status',
      headerName: selectedPharmacy?.type === 'central' ? 'Actions' : 'Status',
      renderCell: params => (
        <>
          {selectedPharmacy.type === 'local' ? (
            <>
              <Grid sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant='p' sx={{ mx: 2, textTransform: 'capitalize' }}>
                  {/* {params.row.status === 'Wrong Count'
                    ? `${params?.row?.wrong_count_type}  ${params?.row?.wrong_count_number}`
                    : params.row.status} */}

                  {params.row.status === 'Wrong Count' ||
                  params.row.status === 'Shortage - Accepted' ||
                  params.row.status === 'Excess - Accepted' ||
                  params?.row?.status === 'Wrong Count - Deny Closed'
                    ? `${params?.row?.wrong_count_type} (${params?.row?.wrong_count_number}) ${
                        params?.row?.dispute_status === 'Dispute Resolved'
                          ? '- Accepted'
                          : params?.row?.status === 'Wrong Count - Deny Closed'
                          ? '- Denied'
                          : ''
                      }`
                    : params.row.status === 'Missing - Deny Closed'
                    ? `${
                        params?.row?.dispute_status === 'Dispute Resolved' ? 'Missing - Accepted' : 'Missing - Denied'
                      }`
                    : params?.row?.status}
                </Typography>
                {((params?.row?.dispute_status === 'Not Resolved' ||
                  params?.row?.dispute_status === 'Dispute Pending') &&
                  params?.row?.status !== 'Wrong Count - Deny Closed' &&
                  params?.row?.status !== 'Missing - Deny Closed') ||
                params?.row?.status === 'Wrong Count - Deny Open' ? (
                  <>
                    {resolveLoader ? (
                      <CircularProgress size={40} />
                    ) : (
                      <IconButton
                        size='large'
                        aria-label='Accept'
                        onClick={() => {
                          resolveItems(params.row)
                        }}
                        sx={{ padding: 0 }}
                        color='success'
                      >
                        <Icon icon='ion:checkmark-circle' sx={{ width: '40px', height: '40px' }} />
                      </IconButton>
                    )}

                    <IconButton
                      aria-label='Deny'
                      onClick={() => {
                        rejectItems(params.row)
                      }}
                      sx={{ padding: 0 }}
                      size='large'
                      color='error'
                    >
                      <Icon icon='ion:close-circle' />
                    </IconButton>
                    <ConfirmDialogBox
                      open={disputeDialog}
                      closeDialog={() => {
                        closeDisputeDialog()
                      }}
                      action={closeDisputeDialog}
                      content={
                        <Box sx={{ m: 0 }}>
                          {/* <DialogTitle id='alert-dialog-title'>Hello</DialogTitle> */}
                          {/* {rejectItemsPayload.length > 0 ? ( */}
                          <>
                            <DialogContent>
                              <DialogContentText sx={{ mb: 3 }}>Please enter your comment here.</DialogContentText>
                              <FormControl fullWidth>
                                <TextField
                                  id='name'
                                  autoFocus
                                  fullWidth
                                  value={rejectItemsPayload?.comment}
                                  type='text'
                                  error={Boolean(rejectItemsError ? rejectItemsError : null)}
                                  onChange={e => {
                                    setRejectItemsPayload({
                                      ...rejectItemsPayload,
                                      comment: e.target.value
                                    })
                                    setRejectItemsError(null)
                                  }}
                                  label='Comment'
                                />

                                <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                                  {rejectItemsError}
                                </FormHelperText>
                              </FormControl>
                            </DialogContent>
                            <DialogActions className='dialog-actions-dense'>
                              <Button
                                variant='contained'
                                color='error'
                                size='small'
                                onClick={() => {
                                  closeDisputeDialog()
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                size='small'
                                variant='contained'
                                color='primary'
                                onClick={() => {
                                  submitRejectItems()
                                }}
                              >
                                Save
                              </Button>
                            </DialogActions>
                          </>
                          {/* ) : null} */}
                        </Box>
                      }
                    />
                  </>
                ) : null}
              </Grid>
            </>
          ) : (
            <>
              {params.row.status === 'Wrong Count' &&
              (params.row.status === 'Wrong Count - Deny Closed' ||
                params?.row?.dispute_status === '' ||
                params?.row?.dispute_status === undefined ||
                params?.row?.dispute_status === 'Not Resolved' ||
                params?.row?.dispute_status === 'Dispute Pending') ? (
                <Grid container spacing={2}>
                  <Grid item xs={5} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FormControl size='small' style={{ width: '100%' }}>
                      <Select
                        label=''
                        // disabled={getDisableStatus(params.row.id)}
                        name='wrong_count_type'
                        size='small'
                        style={{ fontSize: '12px' }}
                        value={params?.row?.wrong_count_type}
                        error={Boolean(params?.row?.wrong_count_type === '' ? `This field is required` : '')}
                        onChange={event => handleStatusChange(params.row.id, event)}
                      >
                        <MenuItem value='shortage' style={{ fontSize: '12px' }}>
                          Shortage
                        </MenuItem>
                        <MenuItem value='excess' style={{ fontSize: '12px' }}>
                          Excess
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid
                    item
                    xs={5}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}
                  >
                    <TextField
                      // disabled={getDisableStatus(params.row.id)}
                      id='outlined-size-small'
                      name='wrong_count_number'
                      value={params?.row?.wrong_count_number}
                      error={Boolean(
                        params?.row?.wrong_count_number === '' || parseInt(params.row.wrong_count_number, 10) < 0
                      )}
                      size='small'
                      onChange={event => {
                        handleStatusChange(params.row.id, event)

                        const inputValue = event.target.value
                        const countValue = Number(params?.row?.count)
                        const inputValueNumber = Number(inputValue)

                        if (inputValue.trim() === '') {
                          setWrongCountErr(prevErrors => ({
                            ...prevErrors,
                            [params.row.uid]: 'This field is required'
                          }))
                        } else if (inputValueNumber <= 0) {
                          setWrongCountErr(prevErrors => ({
                            ...prevErrors,
                            [params.row.uid]: 'Number must be positive'
                          }))
                        } else if (params?.row?.wrong_count_type === 'shortage' && inputValueNumber > countValue) {
                          setWrongCountErr(prevErrors => ({
                            ...prevErrors,
                            [params.row.uid]: 'Qty exceeds shipped count.'
                          }))
                        } else {
                          setWrongCountErr(prevErrors => {
                            const newErrors = { ...prevErrors }
                            delete newErrors[params.row.uid]

                            return newErrors
                          })
                        }
                      }}
                      inputProps={{ style: { fontSize: 12 } }}
                    />
                  </Grid>
                  <Grid item xs={2} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Button
                      sx={{ width: 2, maxWidth: 2 }}
                      // disabled={disableButton()}
                      onClick={event => {
                        clearStatus(params.row.id, event)
                        setWrongCountErr(prevErrors => {
                          const newErrors = { ...prevErrors }
                          delete newErrors[params.row.uid]

                          return newErrors
                        })
                      }}
                    >
                      <Icon
                        // type='button'
                        // disabled={disableButton()}
                        // onClick={event => {
                        //   clearStatus(params.row.id, event)
                        // }}
                        icon='material-symbols-light:close'
                      />
                    </Button>
                  </Grid>
                  {wrongCountErr[params.row.uid] && (
                    <FormHelperText sx={{ mx: 4 }} error>
                      {wrongCountErr[params.row.uid]}
                    </FormHelperText>
                  )}
                </Grid>
              ) : (
                // : (
                //   <Grid container>
                //     <Grid xs={12} sm={12}>
                //       <FormControl fullWidth size='small'>
                //         {console.log('line item', params?.row?.status)}
                //         <Select
                //           // disabled={getDisableStatus(params.row.id)}
                //           fullWidth
                //           placeholder='Status'
                //           name='status'
                //           size='small'
                //           error={Boolean(params?.row?.status === '' ? `This field is required` : '')}
                //           value={params?.row?.status}
                //           onChange={event => handleStatusChange(params.row.id, event)}
                //         >
                //           {statusOptions?.map((item, index) => (
                //             <MenuItem key={index} value={item?.label}>
                //               {item?.label}
                //             </MenuItem>
                //           ))}
                //         </Select>
                //       </FormControl>
                //     </Grid>
                //   </Grid>
                // )
                <Grid container>
                  {(params.row.status === 'Missing' ||
                    params.row.status === 'Wrong Count' ||
                    params.row.status === 'Wrong Count - Deny Closed' ||
                    params?.row?.status === 'Missing - Deny Closed' ||
                    verifyStatusInTemp(params.row.id) === false ||
                    params.row.status === '') &&
                  (params?.row?.dispute_status === 'Not Resolved' ||
                    params?.row?.dispute_status === '' ||
                    params?.row?.dispute_status === undefined ||
                    params?.row?.dispute_status === 'Dispute Pending') ? (
                    <Grid xs={12} sm={12} sx={{ display: 'flex', justifyContent: 'center' }}>
                      {/* in dispute wrong count case after denied */}
                      {params?.row?.status === 'Wrong Count - Deny Closed' ? (
                        <Grid container spacing={2}>
                          <Grid item xs={5} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FormControl size='small' style={{ width: '100%' }}>
                              <Select
                                label=''
                                // disabled={getDisableStatus(params.row.id)}
                                name='wrong_count_type'
                                size='small'
                                style={{ fontSize: '12px' }}
                                value={params?.row?.wrong_count_type}
                                error={Boolean(params?.row?.wrong_count_type === '' ? `This field is required` : '')}
                                onChange={event => handleStatusChange(params.row.id, event)}
                              >
                                <MenuItem value='shortage' style={{ fontSize: '12px' }}>
                                  Shortage
                                </MenuItem>
                                <MenuItem value='excess' style={{ fontSize: '12px' }}>
                                  Excess
                                </MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid
                            item
                            xs={5}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}
                          >
                            <TextField
                              // disabled={getDisableStatus(params.row.id)}
                              id='outlined-size-small'
                              name='wrong_count_number'
                              value={params?.row?.wrong_count_number}
                              error={Boolean(
                                params?.row?.wrong_count_number === '' ||
                                  parseInt(params.row.wrong_count_number, 10) < 0
                              )}
                              size='small'
                              onChange={event => {
                                handleStatusChange(params.row.id, event)

                                const inputValue = event.target.value
                                const countValue = Number(params?.row?.count)
                                const inputValueNumber = Number(inputValue)

                                if (inputValue.trim() === '') {
                                  setWrongCountErr(prevErrors => ({
                                    ...prevErrors,
                                    [params.row.uid]: 'This field is required'
                                  }))
                                } else if (inputValueNumber <= 0) {
                                  setWrongCountErr(prevErrors => ({
                                    ...prevErrors,
                                    [params.row.uid]: 'Number must be positive'
                                  }))
                                } else if (
                                  params?.row?.wrong_count_type === 'shortage' &&
                                  inputValueNumber > countValue
                                ) {
                                  setWrongCountErr(prevErrors => ({
                                    ...prevErrors,
                                    [params.row.uid]: 'Qty exceeds shipped count.'
                                  }))
                                } else {
                                  setWrongCountErr(prevErrors => {
                                    const newErrors = { ...prevErrors }
                                    delete newErrors[params.row.uid]

                                    return newErrors
                                  })
                                }
                              }}
                              inputProps={{ style: { fontSize: 12 } }}
                            />
                          </Grid>
                          <Grid item xs={2} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Button
                              sx={{ width: 2, maxWidth: 2 }}
                              // disabled={disableButton()}
                              onClick={event => {
                                clearStatus(params.row.id, event)
                                setWrongCountErr(prevErrors => {
                                  const newErrors = { ...prevErrors }
                                  delete newErrors[params.row.uid]

                                  return newErrors
                                })
                              }}
                            >
                              <Icon
                                // type='button'
                                // disabled={disableButton()}
                                // onClick={event => {
                                //   clearStatus(params.row.id, event)
                                // }}
                                icon='material-symbols-light:close'
                              />
                            </Button>
                          </Grid>
                          {wrongCountErr[params.row.uid] && (
                            <FormHelperText sx={{ mx: 4 }} error>
                              {wrongCountErr[params.row.uid]}
                            </FormHelperText>
                          )}
                        </Grid>
                      ) : (
                        <FormControl fullWidth size='small'>
                          <Select
                            // disabled={getDisableStatus(params.row.id)}
                            fullWidth
                            placeholder='Status'
                            name='status'
                            size='small'
                            error={Boolean(params?.row?.status === '' ? `This field is required` : '')}
                            // value={params?.row?.status}
                            value={
                              params?.row?.status === 'Wrong Count - Deny Closed' &&
                              params?.row?.dispute_status === 'Dispute Pending'
                                ? 'Wrong Count'
                                : params?.row?.status === 'Missing - Deny Closed' &&
                                  params?.row?.dispute_status === 'Dispute Pending'
                                ? 'Missing'
                                : params?.row?.status
                            }
                            onChange={event => handleStatusChange(params.row.id, event)}
                          >
                            {statusOptions?.map((item, index) => (
                              <MenuItem key={index} value={item?.label}>
                                {item?.label === 'Broken' || item?.label === 'Expired'
                                  ? `Received (${item?.label})`
                                  : item?.label === 'Missing'
                                  ? `Dispute (${item?.label})`
                                  : item?.label === 'Wrong Count'
                                  ? `Dispute (Wrong Qty)`
                                  : item?.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                      {params.row.status === 'Wrong Count - Deny Closed' ||
                      params?.row?.status === 'Missing - Deny Closed' ||
                      params?.row?.status === 'Missing - Deny Open' ||
                      params.row.status === 'Wrong Count - Deny Open' ? (
                        <>
                          <Chip
                            label={params.row.total_deny_comments}
                            avatar={
                              <Avatar>
                                <Icon icon='iconamoon:comment' />
                              </Avatar>
                            }
                            onClick={() => {
                              getRejectedCommentsList(params?.row?.dispatch_item_id)
                            }}
                            sx={{ padding: 0, mx: 2, alignSelf: 'center' }}
                          />
                          {/* <IconButton
                            aria-label=''
                            onClick={() => {
                              getRejectedCommentsList(params?.row?.dispatch_item_id)
                            }}
                            sx={{ padding: 0, mx: 2 }}
                            size='large'
                            color=''
                          >
                            <Icon icon='iconamoon:comment' />
                          </IconButton> */}
                          {commentDialogBox()}
                        </>
                      ) : null}
                      {/* {listComments?.count} */}
                    </Grid>
                  ) : (
                    <Typography variant='p' sx={{ mx: 2, textTransform: 'capitalize' }}>
                      {/* {params.row.status} */}
                      {params.row.status === 'Wrong Count' ||
                      params.row.status === 'Shortage - Accepted' ||
                      params.row.status === 'Excess - Accepted'
                        ? // ||params.row.status === 'Wrong Count - Deny Closed'
                          `${params?.row?.wrong_count_type} (${params?.row?.wrong_count_number}) ${
                            params?.row?.dispute_status === 'Dispute Resolved' ? '- Accepted' : ''
                          }`
                        : params.row.status}
                    </Typography>
                  )}
                </Grid>
              )}
            </>
          )}
        </>
      )
    }
  ]

  async function updateStatus() {
    if (Object.keys(wrongCountErr).length > 0) {
      console.error('Cannot submit form due to errors.')

      return
    }
    const isStatusEmpty = disputeItemDetails.item_details.some(item => item.status.trim() === '')

    if (isStatusEmpty) {
      console.error('Please fill in all status fields.')

      return
    }
    const receivedItems = disputeItemDetails?.item_details
    // const notReceivedItems = disputeItemDetails?.item_details

    // const receivedItems = disputeItemDetails?.item_details?.filter(item => item.status === 'Received')
    // const notReceivedItems = disputeItemDetails?.item_details?.filter(item => item.status !== 'Received')

    if (receivedItems.length > 0) {
      const finalReceivedItems = receivedItems.map((item, index) => {
        return {
          ...item,
          from_store_id: item.from_store,
          to_store_id: item.to_store,
          shipment_item_id: item.id,
          shipment_date: orderData.shipment_date,
          person_shipping: orderData.person_shipping,
          status: orderData.shipment_status,
          vehicle_no: orderData.vehicle_no,
          picked_up: orderData.picked_up,
          request_id: requestId,
          comments: disputeItemDetails.comments,
          item_status: item.status,
          phone_number: orderData?.phone_number
        }
        // "shipment_item_id": "108",
        // "shipment_date": "2023-12-07",
        // "person_shipping": "Test",
        // "status": "Shipped",
        // "vehicle_no": "KA01AB1234",
        // "picked_up": "",
        // "dispatch_id": "129",
        // "dispatch_item_id": "153",
        // "from_store_id": "14",
        // "to_store_id": "16",
        // "item_status": "Wrong Count",
        // "request_id": "130",
        // "comments": "test"
      })

      // const finalData = { ...disputeItemDetails, item_details: receivedItems }
      const verifyCount = finalReceivedItems.some(el => {
        if (el.item_status === 'Wrong Count') {
          if (el.wrong_count_number === '' || el.wrong_count_type === '') {
            console.log('hello', el.to_store_name)

            return false
          }
        }

        return true
      })

      if (verifyCount) {
        try {
          setSubmitLoader(true)
          const result = await updateShipmentRequest(orderId, finalReceivedItems)

          if (result?.success) {
            toast.success(result?.msg)
            setSubmitLoader(false)
            closeOrderFormDialog()
          }
        } catch (error) {
          setSubmitLoader(false)

          toast.error(error?.msg)
        }
      }
    }
    // if (notReceivedItems.length > 0) {
    //   setSubmitLoader(true)

    //   const finalData = { ...disputeItemDetails, item_details: notReceivedItems }
    //   try {
    //     const result = await addDisputeItems(finalData)
    //     if (result?.success) {
    //       toast.success(result?.message)
    //       setSubmitLoader(false)
    //     }
    //   } catch (error) {
    //     setSubmitLoader(false)

    //     toast.error(error?.message)
    //     console.log('Add dispute error', error)
    //   }
    // }
    // closeOrderFormDialog()
  }

  return (
    <>
      <Grid container xs={12} sx={{ mx: 'auto' }}>
        <Grid item xs={12}>
          <Grid container xs={12}>
            {orderData?.shipment_id ? (
              <Grid item md={3} sm={3} xs={6}>
                <h5 style={{ marginBottom: '0px' }}>Shipping id</h5>
                <p>{orderData.shipment_id}</p>
              </Grid>
            ) : null}
            {orderData?.from_store_name ? (
              <Grid item md={3} sm={3} xs={6}>
                <h5 style={{ marginBottom: '0px' }}>From Store </h5>
                <p>{orderData.from_store_name}</p>
              </Grid>
            ) : null}
            {orderData?.shipment_date ? (
              <Grid item md={3} sm={3} xs={6}>
                <h5 style={{ marginBottom: '0px' }}>Shipped Date</h5>
                <p>{Utility.formatDisplayDate(orderData.shipment_date)}</p>
              </Grid>
            ) : null}
            {orderData?.vehicle_no ? (
              <Grid item md={3} sm={3} xs={6}>
                <h5 style={{ marginBottom: '0px' }}>Vehicle Number</h5>
                <p>{orderData.vehicle_no}</p>
              </Grid>
            ) : null}
            {orderData?.to_store_name ? (
              <Grid item md={3} sm={3} xs={6}>
                <h5 style={{ marginBottom: '0px' }}>To Store </h5>
                <p>{orderData.to_store_name}</p>
              </Grid>
            ) : null}

            {orderData?.person_shipping ? (
              <Grid item md={3} sm={3} xs={6}>
                <h5 style={{ marginBottom: '0px' }}>Driver Name</h5>
                <p>{orderData.person_shipping}</p>
              </Grid>
            ) : null}
          </Grid>

          {disputeItemDetails?.item_details?.length > 0 ? (
            <>
              <Divider
                sx={{ mt: theme => `${theme.spacing(5)} !important`, mb: theme => `${theme.spacing(3)} !important` }}
              />
              <Grid md={12} sm={12} xs={12} sx={{ my: 2 }}>
                <TableBasic columns={columns} rows={disputeItemDetails?.item_details}></TableBasic>
              </Grid>
            </>
          ) : null}

          {disputeItemDetails?.item_details?.length > 0 ? (
            <Grid container items>
              <Grid item md={12} sm={12} xs={12} sx={{ my: 6 }}>
                <FormControl fullWidth>
                  <TextField
                    value={disputeItemDetails?.comments}
                    label='Comment'
                    name='comments'
                    onChange={e => {
                      setDisputeItemDetails({ ...disputeItemDetails, comments: e.target.value })
                    }}
                    placeholder=''
                    multiline
                    rows={3}
                    disabled={
                      selectedPharmacy.type === 'local'
                        ? 'disabled'
                        : disputeItemDetails?.delivery_status === 'Delivered'
                        ? 'disabled'
                        : null
                    }
                  />
                </FormControl>
              </Grid>
            </Grid>
          ) : null}
          {selectedPharmacy.type === 'central' && (
            <Divider
              sx={{ mt: theme => `${theme.spacing(5)} !important`, mb: theme => `${theme.spacing(3)} !important` }}
            />
          )}
          {disputeItemDetails?.item_details?.length > 0 ? (
            <>
              {disputeItemDetails?.delivery_status !== 'Delivered'
                ? selectedPharmacy.type === 'central' && (
                    <>
                      <LoadingButton
                        sx={{ float: 'right', my: 4, mx: 2 }}
                        size='large'
                        disabled={disableButton()}
                        variant='contained'
                        onClick={() => {
                          updateStatus()
                        }}
                        loading={submitLoader}
                      >
                        Save
                      </LoadingButton>
                      {disputeItemDetails?.dispute_status !== 'Dispute Pending' && (
                        <LoadingButton
                          sx={{ float: 'right', my: 4, mx: 6 }}
                          size='large'
                          // disabled={disableButton()}
                          variant='contained'
                          onClick={() => {
                            bulkStatusUpdate()
                          }}
                          loading={submitLoader}
                        >
                          Mark all as Received & Save
                        </LoadingButton>
                      )}
                    </>
                  )
                : null}{' '}
            </>
          ) : null}
        </Grid>
      </Grid>
    </>
  )
}

export default OrderReceiveForm
