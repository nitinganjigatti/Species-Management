/* eslint-disable lines-around-comment */
import React, { forwardRef, useState, useEffect, useRef } from 'react'
import TableBasic from 'src/views/table/data-grid/TableBasic'

import {
  Grid,
  FormControl,
  Select,
  MenuItem,
  TextField,
  Divider,
  Box,
  Button,
  IconButton,
  CardContent,
  CardHeader,
  Tooltip,
  InputAdornment,
  FormGroup,
  FormControlLabel,
  Checkbox,
  alpha,
  Alert,
  AlertTitle
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import FormHelperText from '@mui/material/FormHelperText'
import Icon from 'src/@core/components/icon'
import CircularProgress from '@mui/material/CircularProgress'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import FallbackSpinner from 'src/@core/components/spinner'

import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'
// ** MUI Imports

import Typography from '@mui/material/Typography'
import Fade from '@mui/material/Fade'
import toast from 'react-hot-toast'

import {
  getShipmentOrderDetails,
  getShipmentStatusList,
  resolveDisputeItems,
  getCommentsList,
  getShipmentOrderDetailsOfRequests
} from 'src/lib/api/pharmacy/getShipmentList'

import { updateShipmentRequest } from 'src/lib/api/pharmacy/getRequestItemsList'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import Utility from 'src/utility'
import ConfirmDialogBox from 'src/components/ConfirmDialogBox'
import { useRouter } from 'next/router'
import { useTheme } from '@emotion/react'
import ShipmentPrintComponent from 'src/components/ShipmentPrintComponent'
import { getShipmentDetailOfOrder } from 'src/lib/api/pharmacy/storeWiseRequest'

const Transition = forwardRef(function Transition(props, ref) {
  return <Fade ref={ref} {...props} />
})

const LabelValues = ({ label, value }) => {
  return (
    <Grid item md={2} sm={3} xs={6} sx={{ pt: 6 }}>
      <p style={{ margin: '0px' }}> {label}</p>
      <h4 style={{ marginBottom: '0px', marginTop: '10px' }}>{value}</h4>
    </Grid>
  )
}

const DisputeItemDetails = React.forwardRef((props, ref) => {
  const {
    disputeItemDetails,
    orderData,
    selectedPharmacy,
    checked,
    handleChange,
    setDisputeItemDetails,
    columns,
    getBulkStatusUpdateRadioButton
  } = props

  return (
    <div ref={ref}>
      {disputeItemDetails?.item_details?.length > 0 ? (
        <Grid container xs={12} sx={{ mx: 'auto' }}>
          <Grid item xs={12}>
            <Grid
              container
              xs={12}
              className='printable-container'
              sx={{ backgroundColor: 'customColors.bodyBg', pb: 6, px: 6, borderRadius: '10px' }}
            >
              {orderData?.request_number ? (
                <LabelValues label={'Reference No:'} value={orderData?.request_number} />
              ) : null}
              {orderData?.from_store_name ? (
                <LabelValues label={'Shipped From:'} value={orderData?.from_store_name} />
              ) : null}
              {orderData?.to_store_name ? <LabelValues label={'Shipped To:'} value={orderData?.to_store_name} /> : null}
              {/* {orderData?.shipment_id ? <LabelValues label={'Shipping id:'} value={orderData.shipment_id} /> : null} */}

              {orderData?.shipment_date ? (
                <LabelValues label={'Shipped Date:'} value={Utility.formatDisplayDate(orderData.shipment_date)} />
              ) : null}
              {orderData?.vehicle_no ? <LabelValues label={'Vehicle Number:'} value={orderData.vehicle_no} /> : null}
              {/* {orderData?.to_store_name ? (
                <Grid item md={2} sm={3} xs={6}>
                  <p style={{ margin: '0px' }}>To Store: </p>
                  <h4 style={{ marginBottom: '0px', marginTop: '10px' }}>{orderData.to_store_name}</h4>
                </Grid>
              ) : null} */}

              {orderData?.person_shipping ? (
                <LabelValues label={'Driver Name:'} value={orderData.person_shipping} />
              ) : // <Grid item md={2} sm={3} xs={6}>
              //   <p style={{ margin: '0px' }}>Driver Name:</p>
              //   <h4 style={{ marginBottom: '0px', marginTop: '10px' }}>{orderData.person_shipping}</h4>
              // </Grid>
              null}
              {orderData?.person_shipping ? <LabelValues label={'Mobile No:'} value={orderData?.phone_number} /> : null}
              {orderData?.carton_box ? <LabelValues label={'Carton Boxes:'} value={orderData?.carton_box} /> : null}
            </Grid>

            {disputeItemDetails?.item_details?.length > 0 ? (
              <>
                <Box
                  sx={{
                    mt: theme => `${theme.spacing(5)} !important`,
                    mb: theme => `${theme.spacing(3)} !important`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 1
                  }}
                >
                  <Typography variant='h6'>{`Items Shipped - ${disputeItemDetails?.item_details?.length}`}</Typography>
                  {/* {disputeItemDetails?.delivery_status !== 'Delivered' &&
                  selectedPharmacy?.type === 'local' &&
                  selectedPharmacy?.id == orderData?.to_store_id ? (
                    <>
                      {disputeItemDetails?.dispute_status !== 'Dispute Pending' && (
                        <FormGroup row>
                          <FormControlLabel
                            label='Mark all as Received'
                            control={
                              <Checkbox
                                checked={checked}
                                onChange={handleChange}
                                name=' mark_all_as_received'
                                disabled={checked}
                              />
                            }
                          />
                        </FormGroup>
                      )}
                    </>
                  ) : null} */}
                  {console.log('getBulkStatusUpdateRadioButton', getBulkStatusUpdateRadioButton())}
                  {getBulkStatusUpdateRadioButton() && (
                    <FormGroup row>
                      <FormControlLabel
                        label='Mark all as Received'
                        control={
                          <Checkbox
                            checked={checked}
                            onChange={handleChange}
                            name=' mark_all_as_received'
                            disabled={checked}
                          />
                        }
                      />
                    </FormGroup>
                  )}
                </Box>
                <Grid md={12} sm={12} xs={12} sx={{ my: 2 }}>
                  <Box>
                    <TableBasic
                      columns={columns}
                      rows={disputeItemDetails?.item_details}
                      backgroundColor={'customColors.customTableHeaderBg'}
                    ></TableBasic>
                  </Box>
                </Grid>
              </>
            ) : null}

            {/* <Grid container items id={'comments'}>
              <Grid item md={12} sm={12} xs={12} sx={{ my: 6 }}>
                <FormControl fullWidth>
                  <TextField
                    // disabled={disableButton()}
                    disabled={
                      selectedPharmacy.type === 'central'
                        ? 'disabled'
                        : disputeItemDetails?.delivery_status === 'Delivered'
                        ? 'disabled'
                        : null
                    }
                    multiline
                    rows={1}
                    type='text'
                    // label='Comment'
                    value={disputeItemDetails?.comments}
                    onChange={e => {
                      setDisputeItemDetails({ ...disputeItemDetails, comments: e.target.value })
                    }}
                    placeholder='Add Comment if any'
                    name='comments'
                    InputProps={{
                      sx: {
                        backgroundColor: 'customColors.Notes' // Setting the background color here
                      },
                      startAdornment: (
                        <InputAdornment position='start'>
                          <Icon icon='material-symbols-light:description-outline' size={1} />
                        </InputAdornment>
                      )
                    }}
                  />
                </FormControl>
              </Grid>
            </Grid> */}
          </Grid>
        </Grid>
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      )}
    </div>
  )
})

function OrderReceiveForm({ orderId, requestId, requestedFrom }) {
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
  const [wrongCountErr, setWrongCountErr] = useState({})
  const [markReceived, setMarkReceived] = useState([])

  const [orderData, setOrderData] = useState([])
  const [showSpinner, setShowSpinner] = useState(false)

  const { selectedPharmacy } = usePharmacyContext()
  const theme = useTheme()
  const router = useRouter()
  const { id } = router.query

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
    // console.log('updatedData', updatedData)
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

  const getOrderDetails = async (orderId, requestId) => {
    try {
      // const response = await getShipmentOrderDetails(orderId)
      // api updated for normal request api
      let response
      setShowSpinner(true)
      if (requestedFrom === 'requestByAllStores') {
        // this function for all stores shipment request store details
        response = await getShipmentDetailOfOrder(orderId)
      } else {
        response = await getShipmentOrderDetailsOfRequests(orderId, requestId)
      }

      if (response?.success === true && response?.data !== '') {
        disputeLineItems = response?.data?.shipment_item_details?.map((el, index) => {
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
            shipment_id: el?.shipment_id,
            total_deny_comments: el?.total_deny_comments
          }

          return data
        })
        setOrderData({
          ...orderData,

          shipping_id: orderId,
          shipment_id: response?.data?.shipment_id,
          shipment_date: response?.data?.shipment_date,
          person_shipping: response?.data?.person_shipping
            ? response?.data?.person_shipping
            : response?.data?.receiver_name,
          shipment_status: response?.data?.shipment_status,
          vehicle_no: response?.data?.vehicle_no,
          item_details: disputeLineItems,
          phone_number: response?.data?.phone_number,
          from_store_name: response?.data?.from_store_name,
          to_store_name: response?.data?.to_store_name,
          request_number: response?.data?.request_number,
          carton_box: response?.data?.carton_box,
          from_store_id: response?.data?.from_store_id,
          to_store_id: response?.data?.to_store_id
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
        setShowSpinner(false)
      } else {
        setShowSpinner(false)
      }
    } catch (error) {
      setShowSpinner(false)

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
      getOrderDetails(orderId, requestId)
    }
    getStatusList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPharmacy])

  const bulkStatusUpdate = async () => {
    const updatedItemDetails = disputeItemDetails.item_details.map(item => {
      return {
        ...item,
        status: 'Received'
      }
    })

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
        type: 'Shortage',
        action: 'accept',
        request_id: requestId,
        request_item_id: payload.request_item_id
      }
    }

    try {
      setResolveLoader(true)
      const resolved = await resolveDisputeItems(itemsToResolve)
      if (resolved?.success) {
        setResolveLoader(false)
        toast.success(resolved?.data)
        getOrderDetails(orderId, requestId)
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
        getOrderDetails(orderId, requestId)
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
        // openCommentDialog()
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

  async function markAsReceived(itemId) {
    if (!itemId) {
      console.error('Invalid item ID.')

      return
    }
    // Update the status of the specific item to "Received"
    disputeItemDetails.item_details = disputeItemDetails.item_details.map(item =>
      item.id === itemId ? { ...item, status: 'Received' } : item
    )
    // Call updateStatus to handle the rest of the logic
    await updateStatus()
    closeCommentDialog()
  }

  // Usage in button click

  const commentDialogBox = () => {
    return (
      <ConfirmDialogBox
        open={commentDialog}
        closeDialog={() => {
          closeCommentDialog()
        }}
        action={closeCommentDialog}
        title={'Comments'}
        content={
          <>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: 2 }}>
              {/* Medicine Name */}
              <Box sx={{ bgcolor: 'customColors.Background', px: 2, py: 2, borderRadius: '8px' }}>
                <Typography variant='h6'>{markReceived?.stock_name}</Typography>
              </Box>

              <Box>
                {listComments?.data?.length > 0 ? (
                  listComments.data.map((el, index) => (
                    <Box key={index}>
                      {/* Comment Header */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontWeight: 'bold' }}>{selectedPharmacy?.name}</Typography>
                          <Typography sx={{ color: 'error.main' }}>
                            • {markReceived?.wrong_count_type} ({markReceived?.wrong_count_number})
                          </Typography>
                        </Box>
                        <Typography sx={{ color: 'customColors.neutralSecondary' }}>
                          {Utility.formatDisplayDate(el?.created_at)}
                        </Typography>
                      </Box>

                      {/* Comment Card */}
                      <Box
                        sx={{
                          mb: 2,
                          bgcolor: 'customColors.OnPrimarycontainer10',
                          border: `1px solid ${theme.palette.customColors.neutral05}`,
                          borderRadius: '8px'
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography
                                sx={{ fontWeight: '600', color: 'customColors.customDropdownColor', fontSize: '12px' }}
                              >
                                {el?.from_store}
                              </Typography>
                              <Typography sx={{ fontSize: '12px', color: 'customColors.neutralSecondary' }}>
                                • {Utility.formatDisplayDate(el?.created_at)}
                              </Typography>
                            </Box>
                          </Box>
                          <Typography
                            sx={{ fontSize: '14px', fontWeight: 400, color: 'customColors.customHeadingTextColor' }}
                          >
                            {el?.comment}
                          </Typography>
                        </CardContent>
                      </Box>
                    </Box>
                  ))
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <CircularProgress />
                  </Box>
                )}
              </Box>

              {/* Mark as Received Button */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 2 }}>
                <Button type='button' variant='contained' onClick={() => markAsReceived(markReceived?.id)}>
                  Mark as Received
                </Button>
              </Box>
            </Box>
          </>
        }
      />
    )
  }

  const isLocalDispatch = requestedFrom === 'localDispatch'
  const isReturn = requestedFrom === 'return'
  const isRequest = ['request', 'directDispatch', 'requestByAllStores'].includes(requestedFrom)
  const isDelivered = disputeItemDetails?.delivery_status === 'Delivered'
  const isDisputePending = disputeItemDetails?.dispute_status === 'Dispute Pending'
  const isLocalPharmacy = selectedPharmacy?.type === 'local'
  const isCentralPharmacy = selectedPharmacy?.type === 'central'

  const getColumnByRequestFrom = () => {
    if (isLocalDispatch) return selectedPharmacy.id !== orderData.to_store_id
    if (isReturn) return isLocalPharmacy
    if (isRequest) return isCentralPharmacy
  }

  const submitButton = () => (
    <LoadingButton
      size='large'
      disabled={disableButton() || submitLoader}
      variant='contained'
      onClick={() => !submitLoader && updateStatus()}
      loading={submitLoader}
    >
      Save
    </LoadingButton>
  )

  const showSubmitButton = () => {
    if (!isDelivered) {
      if ((isLocalDispatch && isLocalPharmacy) || (isReturn && isCentralPharmacy) || (isRequest && isLocalPharmacy)) {
        return submitButton()
      }
    }
  }

  const isStoreMatch = () => {
    if (isLocalDispatch) {
      return (
        isLocalPharmacy &&
        disputeItemDetails?.item_details?.some(item => [item.to_store, item.from_store].includes(selectedPharmacy?.id))
      )
    }
    if (isReturn || isRequest) {
      return disputeItemDetails?.item_details?.some(item =>
        [item.to_store, item.from_store].includes(selectedPharmacy?.id)
      )
    }

    return isReturn || requestedFrom === 'requestByAllStores'
  }

  const getBulkStatusUpdateRadioButton = () => {
    if (isDelivered || isDisputePending) return false

    if (
      (isReturn && isCentralPharmacy) ||
      (isLocalDispatch && isLocalPharmacy && selectedPharmacy?.id === orderData?.to_store_id) ||
      (isRequest && isLocalPharmacy) ||
      (requestedFrom === 'requestByAllStores' && isLocalPharmacy)
    ) {
      return true
    }
  }

  const columns = [
    {
      Width: 40,
      field: 'uid`',
      headerName: 'SL.NO',
      renderCell: params => {
        return (
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {params.row.uid + '.'}
          </Typography>
        )
      }
    },
    {
      flex: 0.5,
      Width: 100,
      field: 'stock_name',
      headerName: 'Product Name',
      renderCell: (params, rowId) => (
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
      align: 'center',
      headerAlign: 'center',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.count}
        </Typography>
      )
    },

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'from_store_name',
    //   headerName: selectedPharmacy?.type === 'central' ? 'Shipped To' : 'Shipped From',
    //   renderCell: params => (
    //     <div>
    //       <Tooltip
    //         title={selectedPharmacy?.type === 'central' ? params.row.to_store_name : params.row.from_store_name}
    //         placement='top'
    //       >
    //         <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //           {selectedPharmacy?.type === 'central' ? params.row.to_store_name : params.row.from_store_name}
    //         </Typography>
    //       </Tooltip>
    //     </div>
    //   )
    // },

    {
      width: 300,
      minWidth: 300,
      field: 'status',
      // headerName: 'Status',
      headerName: selectedPharmacy?.id == orderData.to_store_id ? 'Actions' : 'Status',
      renderCell: params => {
        return (
          <>
            {getColumnByRequestFrom() ? (
              <>
                <Grid
                  sx={{
                    display: 'flex',
                    gap: 2,
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textTransform: 'capitalize'
                    // backgroundColor: 'red'
                  }}
                >
                  <Typography variant='p' sx={{ mx: 2 }}>
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
                    {/* : params.row.status} */}
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
                          sx={{ padding: 0, color: 'primary.main' }}
                          // color='success'
                        >
                          <Icon icon='ion:checkmark-circle' sx={{ width: '40px', height: '40px' }} />
                        </IconButton>
                      )}

                      <IconButton
                        aria-label='Deny'
                        onClick={() => {
                          rejectItems(params.row)
                        }}
                        sx={{ padding: 0, color: 'error.main' }}
                        size='large'
                        // color='error'
                      >
                        <Icon icon='ion:close-circle' />
                      </IconButton>
                      <ConfirmDialogBox
                        open={disputeDialog}
                        closeDialog={() => {
                          closeDisputeDialog()
                        }}
                        action={closeDisputeDialog}
                        title={'Reason to deny'}
                        content={
                          <Box sx={{ m: 0 }}>
                            <>
                              <DialogContent>
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
                                    sx={{
                                      // backgroundColor: 'customColors.Notes'
                                      backgroundColor: theme => alpha(theme.palette.customColors.Notes, 0.2)
                                    }}
                                  />

                                  <FormHelperText sx={{ color: 'error.main' }} id='validation-basic-first-name'>
                                    {rejectItemsError}
                                  </FormHelperText>
                                </FormControl>
                              </DialogContent>
                              <DialogActions className='dialog-actions-dense'>
                                <Button
                                  variant='outlined'
                                  // color='error'
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
                  <Grid
                    container
                    spacing={2}
                    //  sx={{ py: 4 }}
                    sx={{
                      py: 4,
                      backgroundColor: 'customColors.neutral05',
                      borderRadius: '8px',
                      padding: 0,
                      m: 0,
                      '& .MuiGrid-item': {
                        padding: '3px 4px !important'
                      }
                    }}
                  >
                    <Grid
                      item
                      xs={5}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
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
                        sx={{ minWidth: 0, p: 1, m: 1, color: 'customColors.neutralSecondary' }}
                        onClick={event => {
                          clearStatus(params.row.id, event)
                          setWrongCountErr(prevErrors => {
                            const newErrors = { ...prevErrors }
                            delete newErrors[params.row.uid]

                            return newErrors
                          })
                        }}
                      >
                        <Icon icon='material-symbols-light:close' />
                      </Button>
                    </Grid>
                    {wrongCountErr[params.row.uid] && (
                      <FormHelperText sx={{ mx: 4, mt: '-6px' }} error>
                        {wrongCountErr[params.row.uid]}
                      </FormHelperText>
                    )}
                  </Grid>
                ) : (
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
                          <Grid container spacing={2} sx={{ py: 4 }}>
                            <Grid
                              item
                              xs={5}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              {!params?.row?.wrong_count_type === 'shortage' ? (
                                <FormControl size='small' style={{ width: '100%' }}>
                                  <Select
                                    label=''
                                    // disabled={getDisableStatus(params.row.id)}

                                    name='wrong_count_type'
                                    size='small'
                                    style={{ fontSize: '12px' }}
                                    value={params?.row?.wrong_count_type}
                                    error={Boolean(
                                      params?.row?.wrong_count_type === '' ? `This field is required` : ''
                                    )}
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
                              ) : (
                                <Typography>
                                  {params?.row?.wrong_count_type
                                    ? params.row.wrong_count_type.charAt(0).toUpperCase() +
                                      params.row.wrong_count_type.slice(1)
                                    : ''}
                                  {params?.row?.wrong_count_number ? ` (${params.row.wrong_count_number})` : ''} -
                                </Typography>
                              )}
                            </Grid>
                            <Grid
                              item
                              xs={5}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}
                            >
                              {!params?.row?.wrong_count_type === 'shortage' ? (
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
                              ) : (
                                <Typography sx={{ color: 'error.main' }}> Denied</Typography>
                              )}
                            </Grid>
                            <Grid
                              item
                              xs={2}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Button
                                sx={{ width: 1, maxWidth: 1, minWidth: 0, p: 0.5 }}
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
                                <Icon icon='material-symbols-light:close' />
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
                              displayEmpty
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
                              sx={{
                                backgroundColor: 'customColors.displaybgPrimary' // Apply the background color to the Select component
                              }}
                            >
                              <MenuItem value='' disabled>
                                <span style={{ color: 'customColors.neutral_50' }}>Select Received Status</span>
                              </MenuItem>
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
                        {/* in dispute wrong count case after denied end */}

                        {params.row.status === 'Wrong Count - Deny Closed' ||
                        params?.row?.status === 'Missing - Deny Closed' ||
                        params?.row?.status === 'Missing - Deny Open' ||
                        params.row.status === 'Wrong Count - Deny Open' ? (
                          <Button
                            variant='text'
                            onClick={e => {
                              e.preventDefault()
                              setMarkReceived(params.row)
                              openCommentDialog()
                            }}
                            sx={{ p: 0, m: 0 }}
                          >
                            <Chip
                              label={params.row.total_deny_comments}
                              avatar={<Avatar variant='square' alt='' src={'/images/sms.png'}></Avatar>}
                              onClick={() => {
                                getRejectedCommentsList(params?.row?.dispatch_item_id)
                              }}
                              sx={{ padding: 0, mx: 0, alignSelf: 'center', borderRadius: '8px' }}
                            />
                          </Button>
                        ) : null}
                      </Grid>
                    ) : (
                      <Typography variant='p' sx={{ mx: 2 }}>
                        {/* {params.row.status} */}
                        {params.row.status === 'Wrong Count' ||
                        params.row.status === 'Shortage - Accepted' ||
                        params.row.status === 'Excess - Accepted'
                          ? `${params?.row?.wrong_count_type} (${params?.row?.wrong_count_number}) ${
                              params?.row?.dispute_status === 'Dispute Resolved'
                                ? '- Accepted'
                                : params?.row?.status === 'Wrong Count - Deny Closed'
                                ? '- Denied'
                                : ''
                            }`
                          : params.row.status === 'Missing - Deny Closed'
                          ? `${
                              params?.row?.dispute_status === 'Dispute Resolved'
                                ? 'Missing - Accepted'
                                : 'Missing - Denied'
                            }`
                          : params?.row?.status}
                      </Typography>
                    )}
                  </Grid>
                )}
              </>
            )}
          </>
        )
      }
    }
  ]

  async function updateStatus() {
    if (Object.keys(wrongCountErr).length > 0) {
      console.error('Cannot submit form due to errors.')

      return
    }
    const isStatusEmpty = disputeItemDetails?.item_details?.some(item => item.status.trim() === '')

    if (isStatusEmpty) {
      console.error('Please fill in all status fields.')

      return
    }
    const receivedItems = disputeItemDetails?.item_details

    if (receivedItems?.length > 0) {
      const finalReceivedItems = receivedItems.map((item, index) => {
        return {
          ...item,
          from_store_id: item?.from_store,
          to_store_id: item?.to_store,
          shipment_item_id: item?.id,
          shipment_date: orderData?.shipment_date,
          person_shipping: orderData?.person_shipping,
          status: orderData?.shipment_status,
          vehicle_no: orderData?.vehicle_no,
          picked_up: orderData?.picked_up,
          request_id: requestId,
          comments: disputeItemDetails?.comments,
          item_status: item?.status,
          phone_number: orderData?.phone_number
        }
      })

      const verifyCount = finalReceivedItems.some(el => {
        if (el.item_status === 'Wrong Count') {
          if (el.wrong_count_number === '' || el.wrong_count_type === '') {
            return false
          }
        }

        return true
      })
      if (verifyCount) {
        setSubmitLoader(true)

        try {
          const result = await updateShipmentRequest(orderId, finalReceivedItems)

          if (result?.success) {
            toast.success(result?.msg)

            setSubmitLoader(false)
            location.reload()
            // closeOrderFormDialog()
          } else {
            toast.error(result?.msg)
            setSubmitLoader(false)
          }
        } catch (error) {
          setSubmitLoader(false)
          if (markedId) {
            closeCommentDialog()
          }

          toast.error(error?.msg)
        }
      }
    }
  }

  const [checked, setChecked] = useState(false)

  const handleChange = async event => {
    const isChecked = event.target.checked
    setChecked(isChecked)

    if (isChecked) {
      setSubmitLoader(true) // Disable checkbox during submission
      try {
        await bulkStatusUpdate() // Ensure this completes before moving forward
        await getOrderDetails(orderId, requestId) // Refresh the data only after updating status
      } catch (error) {
        console.error('Error in bulk status update: ', error)
      } finally {
        setSubmitLoader(false) // Re-enable checkbox after submission
      }
    }
  }

  const printRef = React.useRef()

  // const handlePrint = () => {
  //   const printWindow = window.open('', '_blank')
  //   const printContents = printRef.current.innerHTML

  //   const styles = Array.from(document.styleSheets)
  //     .map(sheet => {
  //       try {
  //         return Array.from(sheet.cssRules)
  //           .map(rule => rule.cssText)
  //           .join('\n')
  //       } catch (e) {
  //         console.warn('Error accessing stylesheet:', e)

  //         return ''
  //       }
  //     })
  //     .join('\n')

  //   printWindow.document.write(`
  //     <html>
  //       <head>
  //         <title>${`Shipment Details - ${orderData?.shipment_id || ''}`}</title>
  //         <style>
  //           /* Include global styles */
  //           ${styles}
  //           /* You can add specific print styles here */
  //           @media print {
  //             body {
  //               margin: 0;
  //               padding: 0;
  //             }
  //               .printable-container {
  //             background-color: ${theme.palette.customColors.lightBg};
  //             padding: 16px;
  //             border-radius: 8px;
  //             border: 1px solid ${theme.palette.customColors.neutral05};
  //             margin-top: 16px;

  //           }
  //             .MuiDataGrid-footerContainer{
  //             display:none!important;
  //             opacity: 0;
  //           }
  //              .print-title {
  //             position: absolute;
  //             top: 20px;
  //             left: 50%;
  //             transform: translateX(-50%);
  //             font-size: 24px;
  //             font-weight: bold;
  //             margin-top: 10px;
  //           }
  //        .footer {
  //           text-align: center;
  //           font-size: 16px;
  //           position: absolute;
  //           bottom: 16px;
  //           width: calc(100%);
  //         }
  //             /* Add more print-specific styles if needed */
  //           }
  //         </style>
  //       </head>
  //       <body>
  //           <div>
  //         ${printContents}
  //            </div>
  //             <div class="footer">Antz Systems</div> <!-- Add footer with "Antz System" -->
  //       </body>
  //     </html>
  //   `)

  //   printWindow.document.close()
  //   printWindow.focus()

  //   printWindow.onload = () => {
  //     printWindow.print()
  //     printWindow.onafterprint = () => {
  //       printWindow.close()
  //     }
  //   }

  //   const interval = setInterval(() => {
  //     if (printWindow.closed) {
  //       clearInterval(interval)
  //     } else {
  //       printWindow.close()
  //       clearInterval(interval)
  //     }
  //   }, 500)
  // }

  const shipmentPrintRef = React.useRef(null)

  const handlePrint = () => {
    // Call the handlePrint method exposed by the ShipmentPrintFormat component
    if (shipmentPrintRef.current) {
      shipmentPrintRef.current.handlePrint()
    }
  }

  return (
    <>
      {showSpinner ? (
        <FallbackSpinner />
      ) : (
        <>
          {isStoreMatch() ? (
            <div>
              <Box sx={{ pb: 6 }}>
                <Grid container justifyContent='space-between'>
                  <Grid item xs={12} sm='auto'>
                    <CardHeader
                      sx={{ padding: 0 }}
                      avatar={
                        <Icon
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            router.back()
                          }}
                          icon='ep:back'
                        />
                      }
                      title={`Shipment Details - ${orderData?.shipment_id || ''}`}
                    />
                  </Grid>

                  <Grid container item xs={12} sm='auto' spacing={2}>
                    <Grid item>
                      <Button
                        size='large'
                        variant='outlined'
                        fullWidth
                        target='_blank'
                        sx={{ mb: 3.5 }}
                        startIcon={<Icon icon='material-symbols:print' />}
                        onClick={handlePrint}
                      >
                        print
                      </Button>
                    </Grid>
                    {/* <Grid item>
                {disputeItemDetails?.delivery_status !== 'Delivered' && selectedPharmacy.type === 'central' ? (
                  <LoadingButton
                    size='large'
                    disabled={disableButton() || submitLoader}
                    variant='contained'
                    onClick={() => {
                      if (!submitLoader) {
                        updateStatus()
                      }
                    }}
                    loading={submitLoader}
                  >
                    Save
                  </LoadingButton>
                ) : null}
              </Grid> */}
                    <Grid item>
                      {/* {disputeItemDetails?.delivery_status !== 'Delivered' && selectedPharmacy?.type === 'local' && (
                        <LoadingButton
                          size='large'
                          disabled={disableButton() || submitLoader}
                          variant='contained'
                          onClick={() => {
                            if (!submitLoader) {
                              updateStatus()
                            }
                          }}
                          loading={submitLoader}
                        >
                          Save
                        </LoadingButton>
                      )} */}
                      {showSubmitButton()}
                    </Grid>
                  </Grid>
                </Grid>
              </Box>
              <DisputeItemDetails
                ref={printRef}
                disputeItemDetails={disputeItemDetails}
                orderData={orderData}
                selectedPharmacy={selectedPharmacy}
                checked={checked}
                handleChange={handleChange}
                setDisputeItemDetails={setDisputeItemDetails}
                columns={columns}
                getBulkStatusUpdateRadioButton={getBulkStatusUpdateRadioButton}
              />

              {commentDialog && commentDialogBox()}
            </div>
          ) : (
            <Alert severity='warning'>
              <AlertTitle>Warning</AlertTitle>
              You don't have an access to view this request
              <Button
                onClick={() => {
                  router.push('/pharmacy/local-dispatch/local-dispatch-list/')
                }}
                variant='contained'
                size='small'
                sx={{ mx: 4 }}
              >
                Back to list
              </Button>
            </Alert>
          )}
        </>
      )}
      {orderData &&
        ((Array.isArray(orderData) && orderData.length > 0) ||
          (typeof orderData === 'object' && orderData !== null && Object.keys(orderData).length > 0)) && (
          <div style={{ display: 'none' }}>
            <ShipmentPrintComponent
              ref={shipmentPrintRef}
              data={orderData} // Pass your shipment data here
            />
          </div>
        )}
    </>
  )
}

export default OrderReceiveForm
