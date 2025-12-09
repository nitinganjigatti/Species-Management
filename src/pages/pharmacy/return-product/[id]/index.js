/* eslint-disable react-hooks/exhaustive-deps */
import React, { forwardRef, useState, useEffect } from 'react'

import {
  getRequestItemsListById,
  getDispatchItemsByBatchId,
  getShippedItemsByRequestId
} from 'src/lib/api/pharmacy/getRequestItemsList'
import Button from '@mui/material/Button'
import FallbackSpinner from 'src/@core/components/spinner/index'
import TableBasic from 'src/views/table/data-grid/TableBasic'
import Dialog from '@mui/material/Dialog'
import CustomChip from 'src/@core/components/mui/chip'
import { getDisputeItemList, getDispenseItemList } from 'src/lib/api/pharmacy/getShipmentList'
import { usePharmacyContext } from 'src/context/PharmacyContext'

// ** MUI Imports
import IconButton from '@mui/material/IconButton'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Fade from '@mui/material/Fade'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box, CardContent, CardHeader, Tab, Tooltip, Chip } from '@mui/material'
import { useRouter } from 'next/router'

import Router from 'next/router'

import FulfillDialog from 'src/components/pharmacy/return/FulfillDialog'
import ShipRequest from 'src/components/pharmacy/return/ShipRequestForm'
import CommonDialogBox from 'src/components/CommonDialogBox'

import OrderReceiveForm from 'src/components/pharmacy/request/OrderReceiveForm'

import DisputeItemView from 'src/components/pharmacy/return/DisputeItemView'
import DispenseItemView from 'src/components/pharmacy/return/DispenseItemView'
import Utility from 'src/utility'

import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import RenderUtility from 'src/utility/render'
import { TabContext, TabList, TabPanel } from '@mui/lab'
import { styled } from '@mui/material/styles'
import MuiTabList from '@mui/lab/TabList'
import EmptyStateBox from 'src/components/EmptyStateBox'
import { useTheme } from '@emotion/react'
import CustomAvatar from 'src/@core/components/mui/avatar'

const Transition = forwardRef(function Transition(props, ref) {
  return <Fade ref={ref} {...props} />
})

const TabLists = styled(MuiTabList)(({ theme }) => ({
  '& .MuiTabs-indicator': {
    display: 'none'
  },
  '& .Mui-selected': {
    backgroundColor: theme.palette.customColors.OnSecondaryContainer,
    color: theme.palette.common.white
  },
  '& .MuiTab-root': {
    minHeight: 38,
    minWidth: 110,
    borderRadius: 8,
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2)
  }
}))

const TabBadge = ({ label, totalCount }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between' }}>
    {label}
    {totalCount ? (
      <Chip sx={{ ml: '6px', fontSize: '12px' }} size='small' label={totalCount} color='secondary' />
    ) : null}
  </div>
)

const IndividualReturnRequest = () => {
  const [requestItems, setRequestItems] = useState([])
  const [loader, setLoader] = useState(false)
  const [show, setShow] = useState(false)
  const [orderFormDialog, setOrderFormDialog] = useState(false)
  const [disputeItemDialog, setDisputeItemDialog] = useState(false)
  const [fulfillMedicine, setFulfillMedicine] = useState(false)
  const [showShipDialog, setShowShipDialog] = useState(false)
  const [dispenseDialog, setDispenseDialog] = useState(false)

  const [dispatchedItems, setDispatchedItems] = useState([])
  const [shippedItems, setShippedItems] = useState([])
  const [disputedItems, setDisputedItemsItems] = useState([])
  const [dispenseItems, setDispenseItems] = useState([])

  const [orderId, setOrderId] = useState('')
  const [disputeId, setDisputeId] = useState('')
  const [dispenseId, setDispenseId] = useState('')

  const [permissionView, setPermissionView] = useState(false)

  const router = useRouter()

  // const { id, request_number } = router.query
  const { id, request_number } = router.query

  const base_url = `${process.env.NEXT_PUBLIC_BASE_URL}`
  const base_image_url = '/uploads/control_substance/'

  const { selectedPharmacy } = usePharmacyContext()
  const theme = useTheme()

  const getRequestItemLists = async id => {
    try {
      setLoader(true)
      const response = await getRequestItemsListById(id)
      if (response.success) {
        const responseData = response.data

        const mappedWithUid = response?.data?.request_item_details?.map((item, index) => ({
          ...item,
          sl_no: index + 1
        }))

        responseData['request_item_details'] = mappedWithUid

        // setRequestItems(response.data)
        setRequestItems(responseData)
        setLoader(false)
        setPermissionView(true)
      } else {
        setLoader(false)
        setPermissionView(false)
      }
    } catch (e) {
      console.log(e)
      setLoader(false)
      setPermissionView(false)
    }
  }

  const getDispatchedItems = async id => {
    try {
      setLoader(true)
      const response = await getDispatchItemsByBatchId(id)
      if (response.success) {
        var responseData = response?.data

        const data = responseData?.dispatch_items?.map((el, index) => {
          const items = {
            sl_no: index + 1,
            id: index + 1,
            dispatch_id: el.dispatch_id,
            dispatch_item_id: el.dispatch_item_id,
            stock_item_id: el.stock_item_id,
            request_number: el.request_number,
            medicin_name: el.medicin_name,
            unit_price: el.unit_price,
            mrp_price: el.mrp_price,
            purchase_price: el.purchase_price,
            batch_no: el.batch_no,
            expiry_date: el.expiry_date,
            dispatch_qty: el.dispatch_qty,
            dispatch_box_qty: el.dispatch_box_qty,
            unit_id: el.unit_id,
            leaf_id: el.leaf_id,
            leaf_name: el.leaf_name,
            net_amount: el.net_amount,
            dispatch_status: el.dispatch_status,
            description: el.description,
            stock_qty: el.stock_qty,
            from_store_name: el.from_store_name,
            to_store_name: el.to_store_name,
            total_requested_qty: el.total_requested_qty,
            total_dispatch_qty: el.total_dispatch_qty,
            package: `${el?.package} of ${el?.package_qty} ${el?.package_uom_label} ${el?.product_form_label}`,
            manufacture: el?.manufacturer
          }

          return items
        })
        var dispatches = data?.filter(item => item.dispatch_status !== 'Shipped' && item.dispatch_status !== 'PickedUp')
        responseData['dispatch_items'] = dispatches
        setDispatchedItems(responseData.dispatch_items)
        setLoader(false)
      } else {
        setLoader(false)
      }
    } catch (e) {
      console.log(e)
      setLoader(false)
    }
  }

  const getShippedItems = async id => {
    try {
      setLoader(true)
      const response = await getShippedItemsByRequestId(id)

      if (response.success) {
        const mappedWithUid = response?.data?.map((item, index) => ({
          ...item,
          sl_no: index + 1
        }))

        setShippedItems(mappedWithUid)
        setLoader(false)
      } else {
        setLoader(false)
      }
    } catch (e) {
      console.log('error', e)
      setLoader(false)
    }
  }

  const getDisputeItems = async id => {
    try {
      const response = await getDisputeItemList(id)
      response?.data?.sort((a, b) => a.id - b.id)

      if (response?.success) {
        const mappedWithUid = response?.data?.map((item, index) => ({
          ...item,
          sl_no: index + 1
        }))

        setDisputedItemsItems(mappedWithUid)
      }
    } catch (e) {
      console.log(e)
    }
  }

  const getDispenseItems = async id => {
    try {
      const response = await getDispenseItemList(id)

      if (response.success) {
        const mappedWithUid = response?.data?.map((item, index) => ({
          ...item,
          sl_no: index + 1
        }))

        setDispenseItems(mappedWithUid)
      } else {
      }
    } catch (e) {
      console.log(e)
    }
  }

  const handleEdit = id => {
    Router.push({
      pathname: '/pharmacy/return-product/add-request',
      query: { id: id, action: 'edit' }
    })
  }

  const onRowClick = data => {}

  const init = async id => {
    if (id !== undefined) {
      await getRequestItemLists(id)
      await getDispatchedItems(id)
      await getShippedItems(id)
    }
  }

  useEffect(() => {
    if (id !== undefined) {
      init(id)
    }
  }, [id, selectedPharmacy.id])

  // useEffect(() => {
  //   if (id !== undefined && orderFormDialog === false) {
  //     getDisputeItems(id)
  //     getDispenseItems(id)
  //   }
  // }, [orderFormDialog])

  const closeOrderFormDialog = () => {
    setOrderFormDialog(false)
    init(id)
  }

  const showOrderFormDialog = () => {
    setOrderFormDialog(true)
  }

  const closeDisputeDialog = () => {
    setDisputeId('')
    setDisputeItemDialog(false)
  }

  const showDisputeDialog = () => {
    setDisputeItemDialog(true)
  }

  const closeDialog = () => {
    setOrderId('')
    setShow(false)
  }

  const showDialog = () => {
    setShow(true)
  }

  const closeDispenseDialog = () => {
    setDispenseId('')

    setDispenseDialog(false)
  }

  const showDispenseDialog = () => {
    setDispenseDialog(true)
  }

  const openShipDialog = () => {
    setShowShipDialog(true)
  }

  const closeShipDialog = () => {
    setShowShipDialog(false)
  }

  const closeShipmentDialog = () => {
    setShowShipDialog(false)
    init(id)
  }

  const closeFulfillDialog = () => {
    setShow(false)
    init(id)
  }

  const columns = [
    {
      width: 40,
      field: 'sl_no',
      headerName: 'Sl.No',
      renderCell: (params, rowId) => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.uid}
        </Typography>
      )
    },
    {
      width: 200,
      field: 'stock_name',
      headerName: 'Product Name',
      renderCell: (params, rowId) => (
        <Box>
          {console.log(params, 'params')}
          <Tooltip title={params.row.stock_name} placement='top'>
            <Typography variant='subtitle2' sx={{ color: 'text.primary' }}>
              {RenderUtility?.renderControlLabel(parseInt(params?.row?.control_substance) === 1, 'CS')}
              {RenderUtility?.renderControlLabel(parseInt(params?.row?.prescription_required) === 1, 'PR')}

              {params.row.stock_name}
            </Typography>
          </Tooltip>

          {/* {!isNaN(params.row.control_substance) && parseInt(params.row.control_substance) == 1 ? (
            <CustomChip label='CS' skin='light' color='success' size='small' />
          ) : null} */}
          <Tooltip
            title={`${params?.row?.package} of ${params?.row?.package_qty} ${params?.row?.package_uom_label} ${params?.row?.product_form_label}`}
            placement='top'
          >
            <Typography variant='body2' sx={{ color: 'text.primary' }}>
              {`${params?.row?.package} of ${params?.row?.package_qty} ${params?.row?.package_uom_label} ${params?.row?.product_form_label}`}
            </Typography>
          </Tooltip>
          <Tooltip title={params?.row?.manufacturer} placement='top'>
            <Typography variant='body2' sx={{ color: 'text.primary' }}>
              {params?.row?.manufacturer}
            </Typography>
          </Tooltip>
        </Box>
      )
    },

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'priority',
    //   headerName: 'Priority',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {params.row.priority}
    //     </Typography>
    //   )
    // },

    {
      width: 150,
      minWidth: 150,
      field: 'batch_no',
      headerName: 'Batch No',
      align: 'center',
      headerAlign: 'center',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.batch_no}
        </Typography>
      )
    },

    {
      width: 120,
      field: 'expiry_date',
      headerName: 'Expiry Date',
      align: 'center',
      headerAlign: 'center',

      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {Utility.formatDisplayDate(params?.row?.expiry_date)}
        </Typography>
      )
    },
    {
      width: 200,
      minWidth: 200,
      field: 'unit_price',
      headerName: 'Unit price(₹)',
      type: 'number',
      align: 'right',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {Utility.formatAmountToReadableDigit(params.row.unit_price)}
        </Typography>
      )
    },
    {
      width: 150,
      minWidth: 150,
      field: 'qty',
      headerName: 'total value(₹)',
      type: 'number',
      headerAlign: 'right',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {Utility.formatAmountToReadableDigit(params.row.unit_price * params.row.qty)}
        </Typography>
      )
    },
    {
      width: 150,
      minWidth: 150,
      field: 'requested_qty',
      headerName: 'return QTY',
      type: 'number',
      align: 'right',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.requested_qty}
        </Typography>
      )
    }

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'dispatch_qty',
    //   headerName: 'Fulfilled',
    //   type: 'number',
    //   align: 'right',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {params.row.dispatch_qty}
    //     </Typography>
    //   )
    // }

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'remaining',
    //   headerName: 'Remaining',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {parseInt(params.row.requested_qty) - parseInt(params.row.dispatch_qty)}
    //     </Typography>
    //   )
    // },
    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: '',
    //   headerName: 'Action',
    //   renderCell: params => (
    //     <>
    //       {selectedPharmacy.type === 'local' && (
    //         <Button
    //           size='small'
    //           disabled={parseInt(params.row.requested_qty) - parseInt(params.row.dispatch_qty) >= 1 ? false : true}
    //           variant='contained'
    //           onClick={() => {
    //             setFulfillMedicine({
    //               ...params.row
    //             })
    //             showDialog()
    //           }}
    //         >
    //           Fulfill
    //         </Button>
    //       )}
    //     </>
    //   )
    // }

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'attachment',
    //   headerName: 'Attachment',
    //   renderCell: params =>
    //     !isNaN(params?.row?.control_substance) && parseInt(params?.row?.control_substance) === 1 ? (
    //       <img
    //         src={`${base_url}${base_image_url}${params?.row?.control_substance_file}`}
    //         alt='Medicine Image'
    //         style={{ width: '60px', height: '60px' }}
    //       />
    //     ) : null
    // }
  ]

  const fulfillColumns = [
    {
      Width: 40,
      field: 'sl_no',
      headerName: 'Id',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.id}
        </Typography>
      )
    },
    {
      flex: 1,
      minWidth: 200,
      field: 'medicin_name',
      headerName: 'Product Name',
      renderCell: (params, rowId) => (
        <Box>
          <Tooltip title={params?.row?.medicin_name} placement='top'>
            <Typography variant='subtitle2' sx={{ color: 'text.primary' }}>
              {params?.row?.medicin_name}
            </Typography>
          </Tooltip>
          <Tooltip title={params?.row?.package} placement='top'>
            <Typography variant='body2' sx={{ color: 'text.primary' }}>
              {params?.row?.package}
            </Typography>
          </Tooltip>
          <Tooltip title={params?.row?.manufacture} placement='top'>
            <Typography variant='body2' sx={{ color: 'text.primary' }}>
              {params?.row?.manufacture}
            </Typography>
          </Tooltip>
        </Box>
      )
    },

    {
      width: 160,
      field: 'batch_no',
      headerName: 'Batch No',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.batch_no}
        </Typography>
      )
    },
    {
      width: 120,
      field: 'expiry_date',
      headerName: 'Expiry Date',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {Utility.formatDisplayDate(params.row.expiry_date) === 'Invalid date'
            ? 'NA'
            : Utility.formatDisplayDate(params.row.expiry_date)}
        </Typography>
      )
    },
    {
      width: 140,
      field: 'fulfilledDate',
      headerName: 'Packed Date',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {Utility.formatDisplayDate(dispatchedItems.dispatch_date)}
        </Typography>
      )
    },

    {
      width: 140,
      field: 'dispatch_qty',
      headerName: 'Packed QTY',
      type: 'number',
      align: 'right',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.dispatch_qty}
        </Typography>
      )
    }
  ]

  const shippedColumns = [
    {
      width: 40,
      field: 'sl_no',
      headerName: 'Sl',
      renderCell: (params, rowId) => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.uid}
        </Typography>
      )
    },
    {
      width: 200,
      field: 'shipment_id',
      headerName: 'Shipment Id',
      renderCell: (params, rowId) => (
        <div>
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {params.row.shipment_id}
          </Typography>
        </div>
      )
    },

    {
      width: 120,
      field: 'shipment_date',
      headerName: 'Date',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {Utility.formatDisplayDate(params.row.shipment_date)}
        </Typography>
      )
    },
    {
      width: 120,
      field: 'vehicle_no',
      headerName: 'Vehicle No',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.vehicle_no ? params.row.vehicle_no : 'NA'}
        </Typography>
      )
    },
    {
      width: 140,
      field: 'person_shipping',
      headerName: 'Driver Name',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.person_shipping ? params.row.person_shipping : params.row.receiver_name}
        </Typography>
      )
    },
    {
      width: 160,
      field: 'phone_number',
      headerName: 'Driver Number',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.phone_number ? params.row.phone_number : 'NA'}
        </Typography>
      )
    },
    {
      width: 160,
      field: 'shipment_status',
      headerName: 'Status',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {params.row.dispute_status === 'Dispute Pending' && (
              <Box sx={{ color: 'error.main', mr: 2 }}>
                <Icon icon='fluent:warning-20-filled' style={{ color: 'primary.error' }} />
              </Box>
            )}
            {params.row.dispute_status === 'Dispute Resolved' && (
              <Box sx={{ color: 'success.main', mr: 2 }}>
                <Icon icon='fluent:warning-20-filled' style={{ color: 'primary.error' }} />
              </Box>
            )}
            {params.row.delivery_status === 'Delivered' && (
              <Box sx={{ color: 'success.main', mr: 2 }}>
                <Icon icon='ion:checkmark-circle' style={{ color: 'primary.success' }} />
              </Box>
            )}
            {/* /* This will show after shipping before receiving the request */}
            {params?.row?.delivery_status === 'Not Delivered' &&
              params?.row?.request_status === '' &&
              (params?.row?.shipment_status === 'Shipped' || params?.row?.shipment_status === 'PickedUp') && (
                <Box sx={{ color: 'warning.main', mr: 2 }}>
                  <Icon icon={'ion:checkmark-circle'} style={{ color: 'primary.warning' }}></Icon>
                </Box>
              )}
          </div>
        </Typography>
      )
    },
    {
      width: 200,
      field: 'created_by_user_name',
      headerName: 'Shipped by',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {Utility.renderUserAvatar(params.row.user_created_profile_pic)}
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant='subtitle2' sx={{ color: 'text.primary' }}>
              {params?.row?.created_by_user_name ? params?.row?.created_by_user_name : 'NA'}
            </Typography>
            <Typography variant='caption' sx={{ lineHeight: 1.6667 }}>
              {Utility.formatDisplayDate(params.row.created_at)}
            </Typography>
          </Box>
        </Box>
      )
    }

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'Action',
    //   headerName: 'Action',

    //   renderCell: params => (
    //     <Box sx={{ marginLeft: -6 }}>
    //       <IconButton
    //         size='small'
    //         onClick={() => {
    //           setOrderId(params.row.id)

    //           showOrderFormDialog()
    //         }}
    //         aria-label='Edit'
    //       >
    //         <Icon icon='mdi:pencil-outline' />
    //       </IconButton>
    //     </Box>
    //   )
    // }
  ]

  const disputedItemsColumns = [
    {
      flex: 0.05,
      Width: 40,
      field: 'sl_no',
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
      field: 'person_shipping',
      headerName: 'Driver Name',
      renderCell: (params, rowId) => (
        <div>
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            <div>{params.row.person_shipping ? params.row.person_shipping : params.row.receiver_name}</div>
          </Typography>
        </div>
      )
    },

    {
      flex: 0.2,
      Width: 40,
      field: 'shipment_date',
      headerName: 'Shipment Date',
      renderCell: (params, rowId) => (
        <div>
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            <div>{Utility.formatDisplayDate(params.row.shipment_date)}</div>
          </Typography>
        </div>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'shipment_id',
      headerName: 'Shipment Id ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.shipment_id}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'shipment_status',
      headerName: 'Shipment Status ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.shipment_status}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'Action',
      headerName: 'Action',

      renderCell: params => (
        <Box sx={{ marginLeft: -6 }}>
          <IconButton
            size='small'
            onClick={() => {
              setDisputeId(params.row.shipping_id)

              showDisputeDialog()
            }}
            aria-label='Edit'
          >
            <Icon icon='mdi:pencil-outline' />
          </IconButton>
        </Box>
      )
    }
  ]

  const dispenseItemsColumns = [
    {
      flex: 0.05,
      Width: 40,
      field: 'sl_no',
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
      field: 'from_store',
      headerName: 'FROM STORE',
      renderCell: (params, rowId) => (
        <div>
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            <div>{params.row.from_store}</div>
          </Typography>
        </div>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'shipping_id',
      headerName: 'Shipping Id ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.shipping_id}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'shipment_status',
      headerName: 'Status ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.shipment_status}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'Action',
      headerName: 'Action',

      renderCell: params => (
        <Box sx={{ marginLeft: -6 }}>
          <IconButton
            size='small'
            onClick={() => {
              setDispenseId(params.row.shipment_id)

              showDispenseDialog()
            }}
            aria-label='Edit'
          >
            <Icon icon='mdi:pencil-outline' />
          </IconButton>
        </Box>
      )
    }
  ]

  const [value, setValue] = useState('returnItems')
  const [shipmentTab, setShipmentTab] = useState('readyToShip')

  const handleChange = (event, newValue) => {
    setValue(newValue)

    router.replace(
      {
        pathname: router.pathname,
        query: { ...router.query, tab: newValue }
      },
      undefined,
      { shallow: true }
    )
  }

  useEffect(() => {
    const initialTab = router.query.tab || 'returnItems'
    setValue(initialTab)
  }, [router.query.tab])

  const handleNavigate = () => {
    router.push({
      pathname: `/pharmacy/return-product/${id}/ship-all-items`,
      query: { tab: value }
    })
  }

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <>
          {permissionView ? (
            <>
              <CommonDialogBox
                title={'Shipment Details'}
                dialogBoxStatus={orderFormDialog}
                formComponent={
                  <OrderReceiveForm
                    orderId={orderId}
                    requestId={id}
                    disputeId={disputeId}
                    closeOrderFormDialog={closeOrderFormDialog}
                  />
                }
                close={closeOrderFormDialog}
                show={showOrderFormDialog}
              />

              <Card sx={{ p: 2 }}>
                <CardHeader
                  title='Product Returns '
                  avatar={
                    <Icon
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        Router.back()
                      }}
                      icon='ep:back'
                    />
                  }
                />
                <CardContent>
                  <Card
                    sx={{
                      backgroundColor: 'customColors.lightBg',
                      boxShadow: 'none !important',
                      minHeight: '84px',
                      display: 'flex',
                      padding: '16px',
                      borderRadius: '8px',
                      alignItems: 'center',

                      justifyContent: 'space-between'
                    }}
                  >
                    <Grid
                      container
                      sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',

                        justifyContent: 'space-between'
                      }}
                    >
                      <Grid
                        item
                        xs={12}
                        sm={6}
                        md={6}
                        lg={3}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          height: '46px',
                          gap: '10px',
                          mb: {
                            xs: 5,
                            sm: 5,
                            md: 5,
                            lg: 0
                          }
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: '14px',
                            fontWeight: '400',
                            lineHeight: '16.94px',
                            gpa: '4px',
                            color: 'customColors.neutralSecondary'
                          }}
                        >
                          Returned From :
                          <Box
                            component='span'
                            sx={{
                              fontWeight: '500',
                              fontSize: '16px',
                              color: 'customColors.OnSurfaceVariant',
                              lineHeight: '19.36px',
                              mx: 2,
                              [theme.breakpoints.up('lg')]: {
                                ...RenderUtility?.getEllipsisStyleForText('140')
                              }
                            }}
                          >
                            {RenderUtility?.getToolTipForText(requestItems?.from_store)}
                          </Box>
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: '14px',
                            fontWeight: '400',
                            lineHeight: '16.94px',
                            color: 'customColors.neutralSecondary'
                          }}
                        >
                          Reference ID:
                          <Box
                            component='span'
                            sx={{
                              fontWeight: '500',
                              fontSize: '16px',
                              color: 'customColors.OnSurfaceVariant',
                              lineHeight: '19.36px',
                              mx: 2,
                              [theme.breakpoints.up('lg')]: {
                                ...RenderUtility?.getEllipsisStyleForText('140')
                              }
                            }}
                          >
                            {RenderUtility?.getToolTipForText(requestItems?.request_number)}
                          </Box>
                        </Typography>
                      </Grid>

                      <Grid
                        item
                        xs={12}
                        sm={6}
                        md={6}
                        lg={3}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          height: '46px',
                          gap: '10px',

                          textAlign: {
                            xs: 'left',
                            sm: 'left',
                            md: 'left',
                            lg: 'left'
                          },
                          mb: {
                            xs: 5,
                            sm: 5,
                            md: 5,
                            lg: 0
                          }
                        }}
                      >
                        {requestItems?.product_count && (
                          <Typography
                            sx={{
                              fontSize: '14px',
                              fontWeight: '400',
                              lineHeight: '16.94px',
                              color: 'customColors.neutralSecondary'
                            }}
                          >
                            Total Items:
                            <Box
                              component='span'
                              sx={{
                                fontWeight: '500',
                                fontSize: '16px',
                                color: 'customColors.OnSurfaceVariant',
                                lineHeight: '19.36px',
                                mx: 2
                              }}
                            >
                              {requestItems?.product_count}
                            </Box>
                          </Typography>
                        )}
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <Typography
                            component='span'
                            sx={{
                              fontSize: '14px',
                              fontWeight: '400',
                              lineHeight: '16.94px',
                              color: 'customColors.neutralSecondary',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Total Items Value:
                          </Typography>

                          <Tooltip title={Utility.formatAmountToReadableDigit(requestItems?.requested_amount)}>
                            <Box
                              component='span'
                              sx={{
                                fontWeight: '500',
                                fontSize: '16px',
                                color: 'primary.light',
                                lineHeight: '19.36px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {Utility.formatAmountToReadableDigit(requestItems?.requested_amount)}
                            </Box>
                          </Tooltip>
                        </Box>

                        {/* <Typography
                          sx={{
                            fontSize: '14px',
                            fontWeight: '400',
                            lineHeight: '16.94px',
                            color: 'primary.OnSurface'
                          }}
                        >
                          Shipped Items:
                          <Box
                            component='span'
                            sx={{
                              fontWeight: '500',
                          >
                              fontSize: '16px',
                              color: 'primary.OnSurface',
                              lineHeight: '19.36px',
                              mx: 2
                            }}
                            {requestItems?.shipped_qty}
                          </Box>
                        </Typography> */}
                      </Grid>

                      <Grid
                        item
                        xs={12}
                        sm={6}
                        md={6}
                        lg={3}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          height: '46px',
                          gap: '10px',

                          mb: {
                            xs: 5,
                            sm: 0,
                            md: 0,
                            lg: 0
                          }
                        }}
                      >
                        {/* <Typography
                          sx={{
                            fontSize: '14px',
                            fontWeight: '400',
                            lineHeight: '16.94px',
                            color: 'customColors.neutralSecondary'
                          }}
                        >
                          Total Requested Value:
                          <Box
                            component='span'
                            sx={{
                              fontWeight: '500',
                              fontSize: '16px',
                              color: 'primary.light',
                              lineHeight: '19.36px',
                              mx: 2
                            }}
                          >
                            ₹{requestItems?.requested_amount}
                          </Box>
                        </Typography> */}

                        <Typography
                          sx={{
                            fontSize: '14px',
                            fontWeight: '400',
                            lineHeight: '16.94px',
                            color: 'primary.OnSurface'
                          }}
                        >
                          Shipped Value:
                          <Tooltip title={`₹${Utility.formatNumberToDisplay(requestItems?.shipped_amount)}`}>
                            <Box
                              component='span'
                              sx={{
                                fontWeight: '500',
                                fontSize: '16px',
                                color: 'primary.main',
                                lineHeight: '19.36px',
                                mx: 2
                              }}
                            >
                              ₹{Utility.formatNumberToDisplay(requestItems?.shipped_amount)}
                            </Box>
                          </Tooltip>
                        </Typography>
                      </Grid>

                      <Grid item xs={12} sm={6} md={6} lg={3}>
                        <Box
                          sx={{
                            display: 'flex',
                            height: '46px',

                            justifyContent: {
                              xs: 'start',
                              sm: 'flex-end',
                              md: 'flex-end',
                              lg: 'start'
                            }
                          }}
                        >
                          <Box sx={{ width: '56px' }}>
                            <CustomAvatar
                              src={requestItems?.user_created_profile_pic}
                              sx={{ radius: '64px', width: '40px', height: '40px' }}
                            />
                          </Box>
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '10px'
                            }}
                          >
                            <Tooltip
                              title={requestItems?.created_by_user_name ? requestItems?.created_by_user_name : 'NA'}
                              placement='top'
                              arrow
                            >
                              <Typography
                                sx={{
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  lineHeight: '16.94px',
                                  color: 'customColors.OnSurfaceVariant',

                                  ...RenderUtility?.getEllipsisStyleForText(200)
                                }}
                              >
                                {requestItems?.created_by_user_name ? requestItems?.created_by_user_name : 'NA'}
                              </Typography>
                            </Tooltip>

                            <Typography
                              sx={{
                                fontSize: '12px',
                                fontWeight: '400',
                                lineHeight: '14.52px',
                                color: 'customColors.OnSurfaceVariant'
                              }}
                            >
                              {Utility.formatDisplayDate(requestItems?.created_at)}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                  </Card>
                  {/* Medicine Listing */}
                </CardContent>

                <TabContext value={value}>
                  <TabList
                    onChange={handleChange}
                    sx={{
                      p: 4,
                      '& .MuiTabs-flexContainer': {
                        borderBottom: '1px solid',
                        borderColor: 'customColors.neutral05'
                      }
                    }}
                  >
                    <Tab value='returnItems' label='Return Items' />
                    <Tab value='shipment' label='shipment' />
                  </TabList>
                  <TabPanel value='returnItems'>
                    <CardHeader
                      sx={{
                        p: 0,
                        mb: 6,
                        color: 'customColors.customTextColorGray2',
                        fontSize: '16px',
                        fontWeight: 500
                      }}
                      title={`Return Items`}
                      action={
                        selectedPharmacy.type === 'local' &&
                        (selectedPharmacy.permission.key === 'allow_full_access' ||
                          selectedPharmacy.permission.key === 'ADD') &&
                        shippedItems.length === 0 &&
                        requestItems.status !== 'Cancelled' ? (
                          <Button
                            size='large'
                            variant='contained'
                            onClick={() => {
                              handleEdit(id)
                            }}
                          >
                            Edit
                          </Button>
                        ) : (
                          <></>
                        )
                      }
                    />

                    {requestItems?.request_item_details?.length > 0 ? (
                      <TableBasic
                        rowHeight={90}
                        columns={columns}
                        rows={requestItems?.request_item_details}
                        backgroundColor={'customColors.customTableHeaderBg'}
                      ></TableBasic>
                    ) : (
                      <EmptyStateBox imageSrc='/images/out-of-stock.png' text='No Return items' />
                    )}
                  </TabPanel>
                  <TabPanel value='shipment'>
                    <Grid
                      sx={{
                        width: '100%',
                        px: '0 !important'
                      }}
                    >
                      <TabContext value={shipmentTab}>
                        <TabLists
                          onChange={(event, newValue) => {
                            setShipmentTab(newValue)
                          }}
                          sx={{ width: '100%', height: '56px', py: '8px', gap: '6px' }}
                        >
                          <Tab
                            value='readyToShip'
                            label={
                              <TabBadge
                                label='Items Ready to Ship'
                                totalCount={shipmentTab === 'Ready To Ship' ? 0 : null}
                              />
                            }
                          />
                          <Tab
                            value='Shipped'
                            label={<TabBadge label='Shipped' totalCount={shipmentTab === 'Shipped' ? 0 : null} />}
                          />
                        </TabLists>
                        <TabPanel
                          value='readyToShip'
                          sx={{
                            padding: '0px !important'
                          }}
                        >
                          {dispatchedItems?.length > 0 && selectedPharmacy.type === 'local' ? (
                            <>
                              <CardHeader
                                sx={{ p: 0, mb: 6 }}
                                title=''
                                action={
                                  selectedPharmacy.type === 'local' &&
                                  requestItems.status !== 'Cancelled' &&
                                  (selectedPharmacy.permission.key === 'ADD' ||
                                    selectedPharmacy.permission.key === 'allow_full_access') && (
                                    <Grid item size={{ xs: 6 }} style={{ display: 'flex', justifyContent: 'right' }}>
                                      <Button size='big' variant='contained' onClick={handleNavigate}>
                                        Ship all items
                                      </Button>
                                    </Grid>
                                  )
                                }
                              ></CardHeader>
                              <TableBasic
                                rowHeight={90}
                                columns={fulfillColumns}
                                rows={dispatchedItems}
                                backgroundColor={'customColors.customTableHeaderBg'}
                              ></TableBasic>
                            </>
                          ) : (
                            <EmptyStateBox imageSrc='/images/out-of-stock.png' text=' No ship items' />
                          )}
                        </TabPanel>
                        <TabPanel
                          value='Shipped'
                          sx={{
                            padding: '0px !important'
                          }}
                        >
                          {shippedItems?.length > 0 ? (
                            <>
                              {/* <CardHeader title='Shipment'></CardHeader> */}

                              <TableBasic
                                columns={shippedColumns}
                                rows={shippedItems}
                                backgroundColor={'customColors.customTableHeaderBg'}
                                onRowClick={e => {
                                  setOrderId(e.id)

                                  // showOrderFormDialog()
                                  Router.push({
                                    pathname: `/pharmacy/return-product/${id}/shipment-details`,

                                    // query: { orderId: e.id }
                                    query: { orderId: e.id, requestId: id }
                                  })
                                }}
                              ></TableBasic>
                            </>
                          ) : (
                            <EmptyStateBox imageSrc='/images/out-of-stock.png' text=' No shipped items' />
                          )}
                        </TabPanel>
                      </TabContext>
                    </Grid>
                  </TabPanel>
                </TabContext>
              </Card>

              {/* {shippedItems?.length > 0 ? (
                <>
                  <CardHeader title='Shipment'></CardHeader>

                  <TableBasic
                    columns={shippedColumns}
                    rows={shippedItems}
                    onRowClick={e => {
                      setOrderId(e.id)
                      showOrderFormDialog()
                    }}
                  ></TableBasic>
                </>
              ) : null} */}
              {/* {disputedItems?.length > 0 ? (
              <>
                <CardContent>
                  <Grid container spacing={2} sx={{ flexGrow: 1 }}>
                    <Grid item xs={6}>
                      <h5 style={{ marginBottom: '0px' }}>Disputed Items</h5>
                    </Grid>
                  </Grid>
                </CardContent>
                <TableBasic columns={disputedItemsColumns} rows={disputedItems}></TableBasic>

                <CommonDialogBox
                  title={'Dispute Items'}
                  dialogBoxStatus={disputeItemDialog}
                  formComponent={<DisputeItemView disputeId={disputeId} />}
                  close={closeDisputeDialog}
                  show={showDisputeDialog}
                />
              </>
            ) : null}
            {dispenseItems?.length > 0 ? (
              <>
                <CardContent>
                  <Grid container spacing={2} sx={{ flexGrow: 1 }}>
                    <Grid item xs={6}>
                      <h5 style={{ marginBottom: '0px' }}>Dispense Items</h5>
                    </Grid>
                  </Grid>
                </CardContent>
                <TableBasic columns={dispenseItemsColumns} rows={dispenseItems}></TableBasic>

                <CommonDialogBox
                  title={'Dispense Items'}
                  dialogBoxStatus={dispenseDialog}
                  formComponent={<DispenseItemView dispenseId={dispenseId} />}
                  close={closeDispenseDialog}
                  show={showDispenseDialog}
                />
              </>
            ) : null} */}
              {/* Fulfill Request Dialog */}

              <Dialog
                fullWidth
                open={show}
                maxWidth='md'
                scroll='body'
                onClose={() => closeDialog()}
                TransitionComponent={Transition}
              >
                <Grid
                  container
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <CardHeader title={`Fulfill - ${fulfillMedicine.id}`} />
                  <IconButton size='small' onClick={() => closeDialog()} sx={{ mx: 4 }}>
                    <Icon icon='mdi:close' />
                  </IconButton>
                </Grid>

                <FulfillDialog
                  fulfillMedicine={fulfillMedicine}
                  storeDetails={requestItems}
                  close={closeFulfillDialog}
                />
              </Dialog>

              {/* Ship Request Dialog */}

              <Dialog
                fullWidth
                open={showShipDialog}
                maxWidth='md'
                scroll='body'
                onClose={() => closeShipDialog()}
                TransitionComponent={Transition}
              >
                <Grid
                  container
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <CardHeader title={`Shipment`} />
                  <IconButton size='small' onClick={() => closeShipDialog()} sx={{ mx: 4 }}>
                    <Icon icon='mdi:close' />
                  </IconButton>
                </Grid>

                <ShipRequest
                  dispatchedItems={dispatchedItems}
                  storeDetails={requestItems}
                  close={closeShipmentDialog}
                />
              </Dialog>
            </>
          ) : (
            <Alert severity='warning'>
              <AlertTitle>Warning</AlertTitle>
              You don't have an access to view this request
              <Button
                onClick={() => {
                  router.push('/pharmacy/return-product')
                }}
                variant='contained'
                size='small'
                sx={{ mx: 4 }}
              >
                Back to list
              </Button>
              {/* <strong>check it out!</strong> */}
            </Alert>
          )}
        </>
      )}
    </>
  )
}

export default IndividualReturnRequest
