/* eslint-disable react-hooks/exhaustive-deps */
import React, { forwardRef, useState, useEffect } from 'react'

import {
  getRequestItemsListById,
  getDispatchItemsByBatchId,
  getShippedItemsByRequestId,
  deleteFulfillItem
} from 'src/lib/api/pharmacy/getRequestItemsList'
import Button from '@mui/material/Button'
import FallbackSpinner from 'src/@core/components/spinner/index'
import TableBasic from 'src/views/table/data-grid/TableBasic'
import Dialog from '@mui/material/Dialog'
import CustomChip from 'src/@core/components/mui/chip'
import { getDisputeItemList, getDispenseItemList } from 'src/lib/api/pharmacy/getShipmentList'

// ** MUI Imports
import IconButton from '@mui/material/IconButton'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Fade from '@mui/material/Fade'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import toast from 'react-hot-toast'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box, CardContent, CardHeader, Tooltip } from '@mui/material'
import { useRouter } from 'next/router'

import Router from 'next/router'

import FulfillDialog from 'src/components/pharmacy/request/FulfillDialog'
import ShipRequest from 'src/components/pharmacy/request/ShipRequestForm'
import CommonDialogBox from 'src/components/CommonDialogBox'
import OrderReceiveForm from 'src/components/pharmacy/request/OrderReceiveForm'
import DisputeItemView from 'src/components/pharmacy/request/DisputeItemView'
import DispenseItemView from 'src/components/pharmacy/request/DispenseItemView'

import ProductNotAvailable from 'src/components/pharmacy/request/ProductNotAvailable'
import ConfirmDialogBox from 'src/components/ConfirmDialogBox'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import Utility from 'src/utility'
import MenuWithDots from 'src/components/MenuWithDots'
import AlternativeMedicine from 'src/components/pharmacy/request/AlternativeMedicine'
import RejectRequestItem from 'src/components/pharmacy/request/RejectRequestItem'
import { object } from 'yup'
import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import Chip from '@mui/material/Chip'
import { styled } from '@mui/material/styles'
import MuiTabList from '@mui/lab/TabList'
import TableContainer from '@mui/material/TableContainer'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import Table from '@mui/material/Table'
import { color, fontSize, height, margin, width } from '@mui/system'

const Transition = forwardRef(function Transition(props, ref) {
  return <Fade ref={ref} {...props} />
})

const IndividualRequest = () => {
  // Styled TabList component
  const TabLists = styled(MuiTabList)(({ theme }) => ({
    '& .MuiTabs-indicator': {
      display: 'none'
    },
    '& .Mui-selected': {
      backgroundColor: theme.palette.customColors.customTabBg,
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
  const [requestItems, setRequestItems] = useState([])
  const [loader, setLoader] = useState(false)
  const [show, setShow] = useState(false)
  const [orderFormDialog, setOrderFormDialog] = useState(false)
  const [disputeItemDialog, setDisputeItemDialog] = useState(false)
  const [fulfillMedicine, setFulfillMedicine] = useState(false)
  const [showShipDialog, setShowShipDialog] = useState(false)
  const [dispenseDialog, setDispenseDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [deleteFullFillId, setDeleteFullFillId] = useState(null)

  const [productNotAvailableDialog, setProductNotAvailableDialog] = useState(false)

  const [dispatchedItems, setDispatchedItems] = useState([])
  const [shippedItems, setShippedItems] = useState([])
  const [disputedItems, setDisputedItemsItems] = useState([])
  const [dispenseItems, setDispenseItems] = useState([])

  const [orderId, setOrderId] = useState('')
  const [disputeId, setDisputeId] = useState('')
  const [dispenseId, setDispenseId] = useState('')

  const [notAvailableItemId, setNotAvailableItemId] = useState({})
  const [productNotAvailableLoading, setProductNotAvailableLoading] = useState(false)
  const [permissionView, setPermissionView] = useState(false)

  const router = useRouter()
  const { selectedPharmacy } = usePharmacyContext()

  const { id, request_number } = router.query
  const [expandedText, setExpandedText] = useState('')
  const [notesDialog, setNotesDialog] = useState(false)
  const [showAlternativeMedicineDialog, setShowAlternativeMedicineDialog] = useState(false)
  const [rejectRequestMedicineDialog, setRejectRequestMedicineDialog] = useState(false)

  const [medicineParentId, setMedicineParentId] = useState({
    parent_id: '',
    request_item_id: '',
    qty_requested: '',
    product: ''
  })
  const [status, setStatus] = useState('Pending')
  const [detailsTab, setDetailsTab] = useState('Pending')
  const [shipmentTab, setShipmentTab] = useState('Ready To Ship')

  const TabBadge = ({ label, totalCount }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between' }}>
      {label}
      {totalCount ? (
        <Chip sx={{ ml: '6px', fontSize: '12px' }} size='small' label={totalCount} color='secondary' />
      ) : null}
    </div>
  )

  const closeNotesDialog = () => {
    setNotesDialog(false)
    setExpandedText('')
  }

  const openNotesDialog = () => {
    setNotesDialog(true)
  }

  const closeAlternativeMedicineDialog = () => {
    setShowAlternativeMedicineDialog(false)
    setMedicineParentId({
      parent_id: '',
      request_item_id: '',
      qty_requested: '',
      product: ''
    })
  }

  const openAlternativeMedicineDialog = () => {
    setShowAlternativeMedicineDialog(true)
  }

  const closeRejectMedicineDialog = () => {
    setRejectRequestMedicineDialog(false)
    setMedicineParentId({
      parent_id: '',
      request_item_id: '',
      qty_requested: '',
      product: ''
    })
  }

  const openRejectMedicineDialog = () => {
    setRejectRequestMedicineDialog(true)
  }

  const closeProductNotAvailableDialog = () => {
    setProductNotAvailableDialog(false)
    setNotAvailableItemId([])
  }

  const openProductNotAvailableDialog = () => {
    setProductNotAvailableDialog(true)
  }

  // const base_url = `${process.env.NEXT_PUBLIC_BASE_URL}`
  // const base_image_url = '/uploads/control_substance/'

  const getRequestItemLists = async id => {
    setLoader(true)
    const response = await getRequestItemsListById(id)
    if (response.success) {
      // console.log('Request', response.data)
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
  }

  const getDispatchedItems = async id => {
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
      setLoader(false)
    }
  }

  const deleteFullFillItem = async dispatchedItemId => {
    if (dispatchedItemId) {
      try {
        const result = await deleteFulfillItem(dispatchedItemId)
        if (result?.success === true) {
          toast.success(result.data)
          getDispatchedItems(id)
          getRequestItemLists(id)

          setDeleteDialog(false)
          setDeleteFullFillId(null)
        } else {
          setDeleteDialog(false)
          setDeleteFullFillId(null)
          toast.error(result.data)
        }
      } catch (error) {
        toast.error(error.data)
        console.log('error', error)
      }
    }
  }

  // const getDisputeItems = async id => {
  //   try {
  //     const response = await getDisputeItemList(id)
  //     response?.data?.sort((a, b) => a.id - b.id)

  //     if (response?.success) {
  //       const mappedWithUid = response?.data?.map((item, index) => ({
  //         ...item,
  //         uid: index + 1
  //       }))

  //       setDisputedItemsItems(mappedWithUid)
  //     }
  //   } catch (e) {
  //     console.log(e)
  //   }
  // }

  // const getDispenseItems = async id => {
  //   try {
  //     const response = await getDispenseItemList(id)

  //     if (response.success) {
  //       const mappedWithUid = response?.data?.map((item, index) => ({
  //         ...item,
  //         uid: index + 1
  //       }))

  //       setDispenseItems(mappedWithUid)
  //     } else {
  //     }
  //   } catch (e) {
  //     console.log(e)
  //   }
  // }

  const handleEdit = id => {
    Router.push({
      pathname: '/pharmacy/request/add-request/',
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

  useEffect(() => {
    // if (id !== undefined && orderFormDialog === false) {
    //   getDisputeItems(id)
    //   // getDispenseItems(id)
    // }
  }, [orderFormDialog])

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

  const getCellBgColor = el => {
    if (el?.alt_parent.length > 0 && el?.dispatch_status === 'Fulfilled') {
      return 'customColors.customBg'
    } else if (el?.alt_parent.length > 0 && el?.dispatch_status === 'Not Fulfilled') {
      return 'customColors.customTableCellBg'
    } else if (el?.alt_parent.length === 0 && el?.dispatch_status === 'Fulfilled') {
      return 'customColors.customBg'
    } else if (el?.request_status === 'Not Available' || el?.request_status === 'Rejected') {
      return 'customColors.customTableCellBg1'
    } else {
      return 'white'
    }
  }

  const renderAttachmentIcons = status => {
    const hasControlSubstance = status.control_substance === '1'
    const hasPrescriptionRequired = status.prescription_required === '1'

    return (
      <>
        {/* {hasControlSubstance && (
          <IconButton
            size='small'
            onClick={() => {
              window.open(status.control_substance_file, '_blank')
            }}
            aria-label='Control Substance Attachment'
          >
            <Icon icon='material-symbols:attachment' />
          </IconButton>
        )} */}
        {hasPrescriptionRequired && (
          <Icon
            onClick={() => {
              window.open(status.prescription_required_file, '_blank')
            }}
            style={{ fontSize: '20px', color: '#00000066' }}
            icon='material-symbols:attachment'
          />
        )}
        {!(hasControlSubstance || hasPrescriptionRequired) && 'NA'}
      </>
    )
  }

  const boxStyles = request_status => {
    return request_status === 'Alternate' || request_status === 'Not Available' || request_status === 'Rejected'
      ? { opacity: 0.5, pointerEvents: 'none' }
      : {}
  }

  const generateOptions = params => {
    let options = []

    if (selectedPharmacy.type === 'central') {
      options.push({
        label: 'ALTERNATIVE PRODUCT',
        action: () => {
          openAlternativeMedicineDialog()
          setMedicineParentId({
            ...medicineParentId,
            parent_id: requestItems?.id,
            request_item_id: params?.id,
            qty_requested: params?.qty,
            product: params?.stock_name
          })
        }
      })
    }

    if (
      (selectedPharmacy.type === 'central' &&
        parseInt(params?.requested_qty) - parseInt(params?.dispatch_qty) > 0 &&
        params?.request_status !== 'Alternate') ||
      params?.request_status !== 'Not Available' ||
      params?.request_status !== 'Rejected'
    ) {
      options.push(
        {
          label: 'MAKE IT NOT AVAILABLE',
          action: () => {
            setNotAvailableItemId({
              parent_id: requestItems?.id,
              request_item_id: params?.id,
              qty_requested: params?.qty,
              product: params?.stock_name
            })
            openProductNotAvailableDialog()
          }
        },
        {
          label: 'REJECT PRODUCT',
          action: () => {
            setMedicineParentId({
              ...medicineParentId,
              parent_id: requestItems?.id,
              request_item_id: params?.id,
              qty_requested: params?.qty,
              product: params?.stock_name
            })
            openRejectMedicineDialog()
          }
        }
      )
    }

    return options
  }

  const columns = [
    {
      flex: 0.05,
      Width: 40,
      field: 'sl_no',
      headerName: 'Sl',
      renderCell: (params, rowId) => (
        <Typography
          variant='body2'
          sx={{
            color: 'text.primary',
            textDecoration: params.row.request_status === 'Not Available' ? 'line-through' : 'none'
          }}
        >
          {params.row.sl_no}
        </Typography>
      )
    },
    {
      flex: 0.6,
      Width: 40,
      field: 'stock_name',
      headerName: 'Product Name',
      renderCell: (params, rowId) => (
        <Box sx={{ width: '100%', ...boxStyles(params.row.request_status) }}>
          <Typography
            variant='body2'
            sx={{
              color: 'text.primary',
              textDecoration: params.row.request_status === 'Not Available' ? 'line-through' : 'none'
            }}
          >
            <Tooltip title={params.row.stock_name} placement='top'>
              <Typography variant='subtitle2' sx={{ color: 'text.primary' }}>
                {params.row.stock_name}
              </Typography>
            </Tooltip>
          </Typography>
          {!isNaN(params?.row?.control_substance) && parseInt(params?.row?.control_substance) == 1 ? (
            <CustomChip label='CS' skin='light' color='success' size='small' />
          ) : null}
          {!isNaN(params?.row?.prescription_required) && parseInt(params?.row?.prescription_required) == 1 ? (
            <CustomChip sx={{ mx: 2 }} label='PR' skin='light' color='success' size='small' />
          ) : null}
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
          {params?.row?.request_status === 'Rejected' && (
            <Typography variant='body2' sx={{ color: 'error.main' }}>
              This Product was rejected
            </Typography>
          )}
          {params?.row?.request_status === 'Not Available' && (
            <Typography variant='body2' sx={{ color: 'error.main' }}>
              This Product is not available
            </Typography>
          )}
          {params?.row?.request_status === 'Alternate' && (
            <Typography variant='body2' sx={{ color: 'error.main' }}>
              This product has an alternative product
            </Typography>
          )}
          {params?.row?.alt_parent && params?.row?.alt_parent.stock_item_name && (
            <Typography variant='body2' sx={{ color: 'success.main' }}>
              This Alternate product for <br />
              {params?.row?.alt_parent.stock_item_name}
            </Typography>
          )}
        </Box>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'requested_qty',
      headerName: 'Requested QTY',
      type: 'number',
      align: 'right',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: 'text.primary',
            textDecoration: params.row.request_status === 'Not Available' ? 'line-through' : 'none',
            ...boxStyles(params.row.request_status)
          }}
        >
          {params.row.requested_qty}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'dispatch_qty',
      headerName: 'Fulfilled',
      type: 'number',
      align: 'right',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: 'text.primary',
            textDecoration: params.row.request_status === 'Not Available' ? 'line-through' : 'none',
            ...boxStyles(params.row.request_status)
          }}
        >
          {params.row.dispatch_qty}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'remaining',
      headerName: selectedPharmacy.type === 'local' ? 'Shipped Qty' : 'Remaining',
      type: 'number',
      align: 'right',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: 'text.primary',
            textDecoration: params.row.request_status === 'Not Available' ? 'line-through' : 'none',
            ...boxStyles(params.row.request_status)
          }}
        >
          {selectedPharmacy.type === 'local'
            ? params.row.shipped_qty
            : parseInt(params.row.requested_qty) - parseInt(params.row.dispatch_qty)}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: '',
      headerName: 'Action',
      renderCell: params => (
        <>
          {selectedPharmacy.type === 'central' && (
            <Button
              size='small'
              sx={{ ...boxStyles(params.row.request_status) }}
              disabled={
                parseInt(params.row.requested_qty) - parseInt(params.row.dispatch_qty) >= 1 &&
                requestItems.status !== 'Cancelled' &&
                params.row.request_status !== 'Alternate' &&
                params.row.request_status !== 'Not Available' &&
                params.row.request_status !== 'Rejected'
                  ? false
                  : true
              }
              variant='contained'
              onClick={() => {
                setFulfillMedicine({
                  ...params.row
                })

                showDialog()
              }}
            >
              Fulfill
            </Button>
          )}

          {selectedPharmacy.type === 'local' && (
            <Typography
              variant='body2'
              sx={{
                color: 'text.primary'
              }}
            >
              NA
            </Typography>
          )}
        </>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'attachment',
      headerName: 'Attachment',
      renderCell: params => (
        <Box sx={{ ...boxStyles(params.row.request_status) }}>{renderAttachmentIcons(params.row)}</Box>
      )

      // !isNaN(params?.row?.control_substance) && parseInt(params?.row?.control_substance) === 1 ? (
      //   <>
      //     <IconButton
      //       size='small'
      //       onClick={() => {
      //         window.open(params?.row?.control_substance_file, '_blank')
      //       }}
      //       aria-label='Attachment'
      //     >
      //       <Icon icon='mdi:link' />
      //     </IconButton>
      //   </>
      // ) : !isNaN(params?.row?.prescription_required) && parseInt(params?.row?.prescription_required) === 1 ? (
      //   <>
      //     <IconButton
      //       size='small'
      //       onClick={() => {
      //         window.open(params?.row?.prescription_required_file, '_blank')
      //       }}
      //       aria-label='Attachment'
      //     >
      //       <Icon icon='mdi:link' />
      //     </IconButton>
      //   </>
      // ) : (
      //   'NA'
      // )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'description',
      headerName: 'Notes',
      align: 'left',

      renderCell: params => (
        <Tooltip sx={{ cursor: 'pointer' }} title={params.row?.description}>
          <Typography
            sx={{
              minWidth: 30,
              maxWidth: 80,
              cursor: 'pointer',
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              WebkitLineClamp: 6,
              whiteSpace: 'nowrap',
              ...boxStyles(params.row.request_status)
            }}
            onClick={() => {
              if (params.row?.description) {
                setExpandedText(params.row.description)
                openNotesDialog()
              }
            }}
          >
            {params.row?.description || 'NA'}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'comments',
      headerName: 'Comments',
      align: 'left',

      renderCell: params => (
        <Tooltip sx={{ cursor: 'pointer' }} title={params.row?.alternate_comments}>
          {/* <Icon icon='uil:comments' style={{ color: 'primary.error' }} /> */}
          <Typography
            sx={{
              minWidth: 30,
              maxWidth: 80,
              cursor: 'pointer',
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              WebkitLineClamp: 6,
              whiteSpace: 'nowrap'

              // ...boxStyles(params.row.request_status)
            }}
            onClick={() => {
              if (params.row?.alternate_comments) {
                setExpandedText(params.row.alternate_comments)
                openNotesDialog()
              }
            }}
          >
            {params.row?.alternate_comments || 'NA'}
          </Typography>
        </Tooltip>
      )
    },

    {
      flex: 0.3,
      minWidth: 20,
      field: 'priority',
      headerName: 'Availability',
      renderCell: params => {
        let options = []

        if (selectedPharmacy.type === 'central') {
          options.push({
            label: 'ALTERNATIVE PRODUCT',
            action: () => {
              openAlternativeMedicineDialog()
              setMedicineParentId({
                ...medicineParentId,
                parent_id: requestItems?.id,
                request_item_id: params.row.id,
                qty_requested: params.row.qty,
                product: params.row.stock_name
              })
            }
          })
        }
        if (
          (selectedPharmacy.type === 'central' &&
            parseInt(params.row.requested_qty) - parseInt(params.row.dispatch_qty) > 0 &&
            params.row.request_status !== 'Alternate') ||
          params.row.request_status !== 'Not Available' ||
          params.row.request_status !== 'Rejected'
        ) {
          options.push(
            {
              label: 'MAKE IT NOT AVAILABLE',
              action: () => {
                setNotAvailableItemId({
                  parent_id: requestItems?.id,
                  request_item_id: params.row.id,
                  qty_requested: params.row.qty,
                  product: params.row.stock_name
                })
                openProductNotAvailableDialog()
              }
            },
            {
              label: 'REJECT PRODUCT',
              action: () => {
                setMedicineParentId({
                  ...medicineParentId,
                  parent_id: requestItems?.id,
                  request_item_id: params.row.id,
                  qty_requested: params.row.qty,
                  product: params.row.stock_name
                })
                openRejectMedicineDialog()
              }
            }
          )
        }

        return (
          <>
            {params.row.request_status === 'Not Available' && (
              <Typography
                variant='body2'
                sx={{
                  color: 'text.primary'
                }}
              >
                <Box sx={{ color: 'error.main', mr: 2 }}>
                  <Icon icon='fluent-emoji:prohibited' style={{ color: 'primary.error' }} />
                </Box>
              </Typography>
            )}

            {selectedPharmacy.type === 'local' && params.row.request_status === 'Not Available' && (
              <Typography
                variant='body2'
                sx={{
                  color: 'text.primary'
                }}
              >
                Not Available
              </Typography>
            )}

            {selectedPharmacy.type === 'central' && (
              <Box sx={{ ...boxStyles(params.row.request_status) }}>
                {parseInt(params.row.requested_qty) - parseInt(params.row.dispatch_qty) >= 1 &&
                  params.row.request_status !== 'Alternate' &&
                  params.row.request_status !== 'Not Available' &&
                  params.row.request_status !== 'Rejected' && <MenuWithDots options={options} />}
              </Box>
            )}
          </>
        )
      }
    }
  ]

  const fulfillColumns = [
    {
      flex: 0.05,
      Width: 40,
      field: 'sl_no',
      headerName: 'SL',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.sl_no}
        </Typography>
      )
    },

    {
      flex: 0.5,
      Width: 40,
      field: 'medicin_name',
      headerName: 'Product Name',
      renderCell: (params, rowId) => (
        <div>
          <Tooltip title={params.row.medicin_name} placement='top'>
            <Typography variant='subtitle2' sx={{ color: 'text.primary' }}>
              {params.row.medicin_name}
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
        </div>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'batch_no',
      headerName: 'Batch No',
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
          {Utility.formatDisplayDate(params.row.expiry_date) === 'Invalid date'
            ? 'NA'
            : Utility.formatDisplayDate(params.row.expiry_date)}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'fulfilledDate',
      headerName: 'Packed Date',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {Utility.formatDisplayDate(dispatchedItems.dispatch_date)}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'dispatch_qty',
      headerName: 'Packed QTY',
      type: 'number',
      align: 'right',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.dispatch_qty}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      headerName: 'Action',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', display: 'flex', alignItems: 'center' }}>
          <Box sx={{ mr: 2 }}>
            <Icon
              onClick={() => {
                setDeleteDialog(true)
                setDeleteFullFillId(params.row.dispatch_item_id)
              }}
              icon='mdi:delete-outline'
            />
          </Box>
        </Typography>
      )
    }
  ]

  const shippedColumns = [
    {
      flex: 0.05,
      Width: 40,
      field: 'sl_no',
      headerName: 'Sl',
      renderCell: (params, rowId) => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.sl_no}
        </Typography>
      )
    },
    {
      flex: 0.2,
      Width: 40,
      field: 'shipment_id',
      headerName: 'Shipment Id',
      renderCell: (params, rowId) => (
        <div>
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            <div>{params.row.shipment_id}</div>
          </Typography>
        </div>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'shipment_date',
      headerName: 'Date',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {Utility.formatDisplayDate(params.row.shipment_date)}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'vehicle_no',
      headerName: 'Vehicle No',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.vehicle_no ? params.row.vehicle_no : 'NA'}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'person_shipping',
      headerName: 'Driver Name',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.person_shipping ? params.row.person_shipping : params.row.receiver_name}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'phone_number',
      headerName: 'Driver Number',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.phone_number ? params.row.phone_number : 'NA'}
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
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {params?.row?.dispute_status === 'Dispute Pending' && (
              <Box sx={{ color: 'error.main', mr: 2 }}>
                <Icon icon='fluent:warning-20-filled' style={{ color: 'primary.error' }} />
              </Box>
            )}

            {params?.row?.dispute_status === 'Dispute Resolved' && (
              <Box sx={{ color: 'success.main', mr: 2 }}>
                <Icon icon='fluent:warning-20-filled' style={{ color: 'primary.error' }} />
              </Box>
            )}
            {params?.row?.delivery_status === 'Delivered' && (
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
      flex: 0.3,
      Width: 40,
      field: 'created_by_user_name',
      headerName: 'Shipped by ',
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

  // const disputedItemsColumns = [
  //   {
  //     flex: 0.05,
  //     Width: 40,
  //     field: 'uid',
  //     headerName: 'SL',
  //     renderCell: (params, rowId) => (
  //       <Typography variant='body2' sx={{ color: 'text.primary' }}>
  //         {params.row.uid}
  //       </Typography>
  //     )
  //   },
  //   {
  //     flex: 0.2,
  //     Width: 40,
  //     field: 'person_shipping',
  //     headerName: 'Driver Name',
  //     renderCell: (params, rowId) => (
  //       <div>
  //         <Typography variant='body2' sx={{ color: 'text.primary' }}>
  //           <div>{params.row.person_shipping ? params.row.person_shipping : params.row.receiver_name}</div>
  //         </Typography>
  //       </div>
  //     )
  //   },

  //   {
  //     flex: 0.2,
  //     Width: 40,
  //     field: 'shipment_date',
  //     headerName: 'Shipment Date',
  //     renderCell: (params, rowId) => (
  //       <div>
  //         <Typography variant='body2' sx={{ color: 'text.primary' }}>
  //           <div>{params.row.shipment_date}</div>
  //         </Typography>
  //       </div>
  //     )
  //   },

  //   {
  //     flex: 0.2,
  //     minWidth: 20,
  //     field: 'shipment_id',
  //     headerName: 'Shipment Id ',
  //     renderCell: params => (
  //       <Typography variant='body2' sx={{ color: 'text.primary' }}>
  //         {params.row.shipment_id}
  //       </Typography>
  //     )
  //   },

  //   {
  //     flex: 0.2,
  //     minWidth: 20,
  //     field: 'shipment_status',
  //     headerName: 'Shipment Status ',
  //     renderCell: params => (
  //       <Typography variant='body2' sx={{ color: 'text.primary' }}>
  //         {params.row.shipment_status}
  //       </Typography>
  //     )
  //   },

  //   {
  //     flex: 0.2,
  //     minWidth: 20,
  //     field: 'Action',
  //     headerName: 'Action',

  //     renderCell: params => (
  //       <Box sx={{ marginLeft: -6 }}>
  //         <IconButton
  //           size='small'
  //           onClick={() => {
  //             setDisputeId(params.row.shipping_id)

  //             showDisputeDialog()
  //           }}
  //           aria-label='Edit'
  //         >
  //           <Icon icon='mdi:pencil-outline' />
  //         </IconButton>
  //       </Box>
  //     )
  //   }
  // ]

  const dispenseItemsColumns = [
    {
      flex: 0.05,
      Width: 40,
      field: 'sl_no',
      headerName: 'SL',
      renderCell: (params, rowId) => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.sl_no}
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

  const handleRequestEdit = () => {
    Router.push({
      pathname: '/pharmacy/request/add-request/',
      query: { id: id, action: 'edit' }
    })
  }

  // const handleProductNotAvailableAction = (id, available) => {
  //
  //   setNotAvailableItemId({
  //     id: id,
  //     available: available
  //   })
  //   setProductNotAvailableDialog(true)
  // }

  // const handleProductNotAvailable = async (status, selectedObject) => {
  //   if (status) {
  //     try {
  //       setProductNotAvailableLoading(true)

  //       const payload = {
  //         request_item_id: selectedObject.id
  //       }

  //       const response = selectedObject?.available
  //         ? await markItemAvailable(payload)
  //         : await markItemNotAvailable(payload)
  //       if (response?.success) {
  //         setProductNotAvailableLoading(true)
  //         setProductNotAvailableDialog(false)
  //         Router.reload()
  //       } else {
  //         setProductNotAvailableLoading(true)
  //       }
  //     } catch (e) {
  //       setProductNotAvailableLoading(true)
  //     }
  //   } else {
  //     setProductNotAvailableDialog(false)
  //   }
  // }

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <>
          {permissionView ? (
            <>
              <CommonDialogBox
                title={'Order received'}
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
              <Card sx={{ mb: 6 }}>
                <CardHeader
                  avatar={
                    <Icon
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        Router.back()
                      }}
                      icon='ep:back'
                    />
                  }
                  title={`Request - ${requestItems?.request_number}`}
                  action={
                    selectedPharmacy?.type === 'local' &&
                    requestItems?.status === 'request' &&
                    requestItems?.is_modified !== '1' ? (
                      <Button
                        size='big'
                        variant='contained'
                        onClick={() => {
                          handleRequestEdit()
                        }}
                      >
                        Edit
                      </Button>
                    ) : (
                      <></>
                    )
                  }
                />

                <CardContent>
                  {/* Request Basic Info */}
                  <Card
                    sx={{
                      backgroundColor: 'customColors.lightBg'
                    }}
                  >
                    <Grid container spacing={2} sx={{ flexGrow: 1, py: 6, px: 4 }}>
                      <Grid
                        item
                        xs={3}
                        sm={12 / 4}
                        lg={12 / 4}
                        sx={{ display: 'flex', flexDirection: 'column', height: '40px', maxHeight: '40px', gap: '8px' }}
                      >
                        <Typography>
                          Requested By:<strong> {requestItems?.to_store} </strong>
                        </Typography>
                        <Typography>
                          Request ID:<strong> {requestItems?.request_number} </strong>
                        </Typography>
                      </Grid>
                      <Grid
                        item
                        xs={3}
                        sm={12 / 4}
                        lg={12 / 4}
                        sx={{ display: 'flex', flexDirection: 'column', height: '40px', maxHeight: '40px', gap: '8px' }}
                      >
                        <Typography>
                          Requested Items:<strong> {requestItems?.total_qty} </strong>
                        </Typography>
                        <Typography sx={{ color: 'primary.main' }}>
                          Shipped Items:<strong> {requestItems?.shipped_qty} </strong>
                        </Typography>
                      </Grid>
                      <Grid
                        item
                        xs={3}
                        sm={12 / 4}
                        lg={12 / 4}
                        sx={{ display: 'flex', flexDirection: 'column', height: '40px', maxHeight: '40px', gap: '8px' }}
                      >
                        <Typography>
                          Total Requested Value:<strong> ₹{requestItems?.requested_amount} </strong>
                        </Typography>
                        <Typography sx={{ color: 'primary.main' }}>
                          Shipped Value:<strong> ₹{requestItems?.shipped_amount} </strong>
                        </Typography>
                      </Grid>

                      <Grid item xs={3} sm={12 / 4} lg={12 / 4}>
                        <Box sx={{ display: 'flex', alignItems: 'center', height: '40px', maxHeight: '40px', my: 4 }}>
                          <Box sx={{}}>{Utility.renderUserAvatar(requestItems?.user_created_profile_pic)}</Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant='subtitle2' sx={{ color: 'text.primary' }}>
                              <strong>
                                {requestItems?.created_by_user_name ? requestItems?.created_by_user_name : 'NA'}
                              </strong>
                            </Typography>
                            <Typography variant='caption' sx={{ lineHeight: 1.6667 }}>
                              {Utility.formatDisplayDate(requestItems?.created_at)}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                  </Card>
                  {/* Medicine Listing */}
                </CardContent>
                <Grid sx={{ mx: 4 }}>
                  <TabContext value={detailsTab}>
                    <TabList
                      sx={{ borderBottom: '1px solid #0000000D' }}
                      onChange={(event, newValue) => {
                        setDetailsTab(newValue)
                      }}
                    >
                      <Tab
                        value='Pending'
                        label={<TabBadge label='Pending' totalCount={status === 'Pending' ? 0 : null} />}
                      />
                      <Tab
                        value='Shipped'
                        label={<TabBadge label='Shipped' totalCount={status === 'Shipped' ? 0 : null} />}
                      />
                    </TabList>
                    <TabPanel
                      value='Pending'
                      sx={{
                        display: 'flex',
                        justifyContent: 'flex-start'
                      }}
                    >
                      <Grid sx={{ ml: -2, width: '100%' }}>
                        <TabContext value={status}>
                          <TabLists
                            onChange={(event, newValue) => {
                              setStatus(newValue)
                            }}
                          >
                            <Tab
                              value='Pending'
                              label={<TabBadge label='Pending' totalCount={status === 'Pending' ? 0 : null} />}
                            />
                            <Tab
                              value='All'
                              label={<TabBadge label='All' totalCount={status === 'All' ? 0 : null} />}
                            />
                          </TabLists>
                          <TabPanel value='Pending'>
                            <Card sx={{ ml: -3 }}>
                              <TableContainer>
                                <Table
                                  stickyHeader
                                  sx={{ minWidth: 650, maxWidth: '100%', overflowX: 'scroll' }}
                                  aria-label='simple table'
                                >
                                  <TableHead sx={{ backgroundColor: 'customColors.customTableHeaderBg' }}>
                                    <TableRow>
                                      <TableCell>S.NO</TableCell>
                                      <TableCell></TableCell>
                                      <TableCell>PRODUCT NAME</TableCell>

                                      <TableCell>QUANTITY</TableCell>
                                      <TableCell>FULL FILL</TableCell>
                                      <TableCell sx={{ minWidth: 200 }}>ACTION</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {requestItems?.request_item_details.length > 0
                                      ? requestItems?.request_item_details
                                          .filter(el => el.dispatch_status === 'Not Fulfilled')
                                          .map((el, index) => {
                                            return (
                                              <TableRow key={index} sx={{ overflowX: 'scroll' }}>
                                                <TableCell
                                                  sx={{
                                                    backgroundColor: getCellBgColor(el),
                                                    verticalAlign: 'top'
                                                  }}
                                                  className='match-height'
                                                >
                                                  <Typography
                                                    variant='subtitle2'
                                                    sx={{
                                                      color: 'text.primary',
                                                      minHeight: '100%'
                                                    }}
                                                  >
                                                    {el.sl_no}.
                                                  </Typography>
                                                </TableCell>
                                                <TableCell
                                                  sx={{
                                                    backgroundColor: getCellBgColor(el),
                                                    verticalAlign: 'top'
                                                  }}
                                                  className='match-height'
                                                >
                                                  {el.priority == 'high' ? (
                                                    <Box
                                                      sx={{
                                                        color: 'error.main',
                                                        float: 'left',
                                                        minHeight: '8px',
                                                        maxHeight: '8px',
                                                        width: '8px'
                                                      }}
                                                    >
                                                      <Icon
                                                        icon='material-symbols-light:circle'
                                                        style={{
                                                          color: 'primary.error',
                                                          minHeight: '8px',
                                                          maxHeight: '8px'
                                                        }}
                                                      ></Icon>
                                                    </Box>
                                                  ) : null}
                                                  {el?.request_status === 'Alternate' && (
                                                    <Grid
                                                      sx={{
                                                        minHeight: 124,
                                                        alignContent: 'top',
                                                        alignItems: 'center',
                                                        mb: 4
                                                      }}
                                                    ></Grid>
                                                  )}
                                                  {el?.alt_parent?.length > 0
                                                    ? el.alt_parent.map((el, index) => {
                                                        return (
                                                          <Grid
                                                            key={index}
                                                            sx={{
                                                              minHeight: 124,
                                                              maxHeight: 124,

                                                              alignContent: 'top',
                                                              alignItems: 'center',
                                                              mb: 4,
                                                              py: 1
                                                            }}
                                                          >
                                                            <Box
                                                              sx={{
                                                                minHeight: '43px',
                                                                width: '30px',
                                                                border: '1px solid ',
                                                                color: 'white',
                                                                padding: '4px',
                                                                fontSize: '12px',
                                                                borderRadius: '4px',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                alignContent: 'center',
                                                                backgroundColor: 'customColors.customDarkBg'
                                                              }}
                                                            >
                                                              Alt
                                                              <Box
                                                                sx={{
                                                                  color: 'white',
                                                                  height: '16px',
                                                                  width: '16px',
                                                                  mx: 'auto'
                                                                }}
                                                              >
                                                                <Icon
                                                                  icon='ic:outline-subdirectory-arrow-right'
                                                                  style={{
                                                                    color: 'white',
                                                                    height: '16px',
                                                                    width: '16px',
                                                                    mx: 'auto'
                                                                  }}
                                                                />
                                                              </Box>
                                                            </Box>
                                                          </Grid>
                                                        )
                                                      })
                                                    : null}
                                                </TableCell>
                                                <TableCell
                                                  sx={{
                                                    backgroundColor: getCellBgColor(el),

                                                    verticalAlign: 'top'
                                                  }}
                                                >
                                                  <Box
                                                    sx={{
                                                      minHeight: 124,
                                                      maxHeight: 124,
                                                      mb: 4,
                                                      verticalAlign: 'top'
                                                    }}
                                                  >
                                                    <Typography variant='body1' sx={{ fontWeight: 600 }}>
                                                      <Tooltip title={el.stock_name} placement='top'>
                                                        <Typography
                                                          variant='body1'
                                                          sx={{
                                                            fontWeight: 600,
                                                            display: 'flex',
                                                            alignItems: 'center'
                                                          }}
                                                        >
                                                          {!isNaN(el?.control_substance) &&
                                                          parseInt(el?.control_substance) == 1 ? (
                                                            <Typography
                                                              sx={{
                                                                height: '16px',
                                                                width: '18px',
                                                                backgroundColor: 'error.main',
                                                                fontWeight: 'bold',
                                                                fontSize: '10px',
                                                                color: 'white',
                                                                padding: '2px',
                                                                borderRadius: '2px',
                                                                lineHeight: '12px',
                                                                textAlign: 'center',
                                                                mr: 1
                                                              }}
                                                            >
                                                              CS
                                                            </Typography>
                                                          ) : null}
                                                          {!isNaN(el?.prescription_required) &&
                                                          parseInt(el?.prescription_required) == 1 ? (
                                                            <Typography
                                                              sx={{
                                                                height: '16px',
                                                                width: '18px',
                                                                backgroundColor: 'error.main',
                                                                fontWeight: 'bold',
                                                                fontSize: '10px',
                                                                color: 'white',
                                                                padding: '2px',
                                                                borderRadius: '2px',
                                                                lineHeight: '12px',
                                                                textAlign: 'center',
                                                                mr: 1
                                                              }}
                                                            >
                                                              PR
                                                            </Typography>
                                                          ) : null}{' '}
                                                          {el.stock_name}
                                                        </Typography>
                                                      </Tooltip>
                                                    </Typography>
                                                    <Tooltip
                                                      title={`${el?.package} of ${el?.package_qty} ${el?.package_uom_label} ${el?.product_form_label}`}
                                                      placement='top'
                                                    >
                                                      <Typography variant='body1' sx={{ color: 'text.primary' }}>
                                                        {`${el?.package} of ${el?.package_qty} ${el?.package_uom_label} ${el?.product_form_label}`}
                                                      </Typography>
                                                    </Tooltip>
                                                    <Tooltip title={el?.manufacturer} placement='top'>
                                                      <Typography variant='body1' sx={{ color: 'text.primary' }}>
                                                        {el?.manufacturer}
                                                      </Typography>
                                                    </Tooltip>

                                                    {el?.description ? (
                                                      <Grid
                                                        onClick={() => {
                                                          if (el?.description) {
                                                            setExpandedText(el.description)
                                                            openNotesDialog()
                                                          }
                                                        }}
                                                        sx={{
                                                          display: 'flex',
                                                          color: 'customColors.customIconBg',
                                                          width: '100%',
                                                          my: 2,
                                                          gap: 1,
                                                          cursor: 'pointer'
                                                        }}
                                                      >
                                                        <Icon
                                                          icon={'material-symbols:description-outline'}
                                                          style={{
                                                            fontSize: '20px',
                                                            color: '#00000066'
                                                          }}
                                                        ></Icon>
                                                        <Typography
                                                          variant='body2'
                                                          sx={{
                                                            color: 'text.primary',
                                                            minWidth: 30,
                                                            maxWidth: 80,
                                                            cursor: 'pointer',
                                                            WebkitBoxOrient: 'vertical',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            WebkitLineClamp: 6,
                                                            whiteSpace: 'nowrap',
                                                            ...boxStyles(el.request_status)
                                                          }}
                                                        >
                                                          {el?.description}
                                                        </Typography>
                                                      </Grid>
                                                    ) : null}
                                                    {parseInt(el?.prescription_required) == 1 ? (
                                                      <Grid
                                                        sx={{
                                                          display: 'flex',
                                                          width: '100%',
                                                          my: 2,
                                                          gap: 1,
                                                          cursor: 'pointer'
                                                        }}
                                                      >
                                                        <Box>{renderAttachmentIcons(el)}</Box>
                                                        <Typography
                                                          variant='body2'
                                                          sx={{ color: 'text.primary', opacity: 0.5 }}
                                                        >
                                                          prescription
                                                        </Typography>
                                                      </Grid>
                                                    ) : null}
                                                  </Box>
                                                  {el?.alt_parent?.length > 0
                                                    ? el.alt_parent?.map((el, index) => {
                                                        return (
                                                          <Grid
                                                            key={index}
                                                            container
                                                            direction='column'
                                                            sx={{ minHeight: 124, maxHeight: 124, mb: 4 }}
                                                          >
                                                            <Box>
                                                              <Typography variant='body1' sx={{ fontWeight: 600 }}>
                                                                <Tooltip title={el.stock_name} placement='top'>
                                                                  <Typography
                                                                    variant='body1'
                                                                    sx={{
                                                                      fontWeight: 600,
                                                                      display: 'flex',
                                                                      alignItems: 'center'
                                                                    }}
                                                                  >
                                                                    {!isNaN(el?.control_substance) &&
                                                                    parseInt(el?.control_substance) == 1 ? (
                                                                      <Typography
                                                                        sx={{
                                                                          height: '16px',
                                                                          width: '18px',
                                                                          backgroundColor: 'error.main',
                                                                          fontWeight: 'bold',
                                                                          fontSize: '10px',
                                                                          color: 'white',
                                                                          padding: '2px',
                                                                          borderRadius: '2px',
                                                                          lineHeight: '12px',
                                                                          textAlign: 'center',
                                                                          mr: 1
                                                                        }}
                                                                      >
                                                                        CS
                                                                      </Typography>
                                                                    ) : null}
                                                                    {!isNaN(el?.prescription_required) &&
                                                                    parseInt(el?.prescription_required) == 1 ? (
                                                                      <Typography
                                                                        sx={{
                                                                          height: '16px',
                                                                          width: '18px',
                                                                          backgroundColor: 'error.main',
                                                                          fontWeight: 'bold',
                                                                          fontSize: '10px',
                                                                          color: 'white',
                                                                          padding: '2px',
                                                                          borderRadius: '2px',
                                                                          lineHeight: '12px',
                                                                          textAlign: 'center',
                                                                          mr: 1
                                                                        }}
                                                                      >
                                                                        PR
                                                                      </Typography>
                                                                    ) : null}
                                                                    {el.stock_name}
                                                                  </Typography>
                                                                </Tooltip>
                                                              </Typography>
                                                              <Tooltip
                                                                title={`${el?.package} of ${el?.package_qty} ${el?.package_uom_label} ${el?.product_form_label}`}
                                                                placement='top'
                                                              >
                                                                <Typography
                                                                  variant='body1'
                                                                  sx={{ color: 'text.primary' }}
                                                                >
                                                                  {`${el?.package} of ${el?.package_qty} ${el?.package_uom_label} ${el?.product_form_label}`}
                                                                </Typography>
                                                              </Tooltip>
                                                              <Tooltip title={el?.manufacturer} placement='top'>
                                                                <Typography
                                                                  variant='body1'
                                                                  sx={{ color: 'text.primary' }}
                                                                >
                                                                  {el?.manufacturer}
                                                                </Typography>
                                                              </Tooltip>

                                                              {el?.alternate_comments ? (
                                                                <Grid
                                                                  onClick={() => {
                                                                    if (el?.alternate_comments) {
                                                                      setExpandedText(el.alternate_comments)
                                                                      openNotesDialog()
                                                                    }
                                                                  }}
                                                                  sx={{
                                                                    display: 'flex',
                                                                    width: '100%',
                                                                    mb: 2,
                                                                    gap: 1,
                                                                    cursor: 'pointer'
                                                                  }}
                                                                >
                                                                  <Icon
                                                                    icon={'material-symbols:description-outline'}
                                                                    style={{
                                                                      fontSize: '20px',
                                                                      color: '#00000066'
                                                                    }}
                                                                  ></Icon>
                                                                  <Typography
                                                                    variant='body2'
                                                                    sx={{
                                                                      color: 'text.primary',
                                                                      minWidth: 30,
                                                                      maxWidth: 80,
                                                                      cursor: 'pointer',
                                                                      WebkitBoxOrient: 'vertical',
                                                                      overflow: 'hidden',
                                                                      textOverflow: 'ellipsis',
                                                                      WebkitLineClamp: 6,
                                                                      whiteSpace: 'nowrap',
                                                                      opacity: '0.5',
                                                                      ...boxStyles(el.request_status)
                                                                    }}
                                                                  >
                                                                    {el?.alternate_comments}
                                                                  </Typography>
                                                                </Grid>
                                                              ) : null}
                                                              {parseInt(el?.prescription_required) == 1 ? (
                                                                <Grid
                                                                  sx={{
                                                                    display: 'flex',

                                                                    width: '100%',
                                                                    mb: 2,
                                                                    gap: 1,
                                                                    cursor: 'pointer'
                                                                  }}
                                                                >
                                                                  <Box>{renderAttachmentIcons(el)}</Box>
                                                                  <Typography
                                                                    variant='body2'
                                                                    sx={{ color: 'text.primary', opacity: '0.5' }}
                                                                  >
                                                                    prescription
                                                                  </Typography>
                                                                </Grid>
                                                              ) : null}
                                                            </Box>
                                                          </Grid>
                                                        )
                                                      })
                                                    : null}
                                                </TableCell>
                                                <TableCell
                                                  sx={{
                                                    backgroundColor: getCellBgColor(el),
                                                    verticalAlign: 'top'
                                                  }}
                                                  className='match-height'
                                                >
                                                  <Box
                                                    sx={{
                                                      minHeight: 124,
                                                      maxHeight: 124,
                                                      mb: 4
                                                    }}
                                                  >
                                                    <Typography variant='body1' sx={{ color: 'text.primary' }}>
                                                      Requested:{el?.requested_qty}
                                                    </Typography>
                                                    <Typography variant='body1' sx={{ color: 'text.primary' }}>
                                                      Fullfilled:{el?.dispatch_qty}
                                                    </Typography>{' '}
                                                    <Typography variant='body1' sx={{ color: 'text.primary' }}>
                                                      Shipped:{el?.shipped_qty}
                                                    </Typography>
                                                  </Box>
                                                  {el.alt_parent.length > 0
                                                    ? el.alt_parent.map((el, index) => {
                                                        return (
                                                          <Box
                                                            key={index}
                                                            container
                                                            direction='column'
                                                            sx={{ minHeight: 124, maxHeight: 124, mb: 4 }}
                                                          >
                                                            <Typography variant='body1' sx={{ color: 'text.primary' }}>
                                                              Requested:{el?.requested_qty}
                                                            </Typography>
                                                            <Typography variant='body1' sx={{ color: 'text.primary' }}>
                                                              Fullfilled:{el?.dispatch_qty}
                                                            </Typography>{' '}
                                                            <Typography variant='body1' sx={{ color: 'text.primary' }}>
                                                              Shipped:{el?.shipped_qty}
                                                            </Typography>
                                                          </Box>
                                                        )
                                                      })
                                                    : null}
                                                </TableCell>
                                                <TableCell
                                                  sx={{
                                                    backgroundColor: getCellBgColor(el),
                                                    verticalAlign: 'top'
                                                  }}
                                                  className='match-height'
                                                >
                                                  <>
                                                    {selectedPharmacy.type === 'central' &&
                                                    parseInt(el.requested_qty) - parseInt(el.dispatch_qty) >= 1 &&
                                                    requestItems.status !== 'Cancelled' &&
                                                    el.request_status !== 'Alternate' &&
                                                    el.request_status !== 'Not Available' &&
                                                    el.request_status !== 'Rejected' ? (
                                                      <Grid
                                                        sx={{
                                                          verticalAlign: 'top',
                                                          minHeight: 124,
                                                          maxHeight: 124,
                                                          mb: 4,
                                                          mx: 'auto',
                                                          textAlign: 'center'
                                                        }}
                                                      >
                                                        <Button
                                                          size='small'
                                                          sx={{
                                                            width: 100,
                                                            mx: 'auto',
                                                            ...boxStyles(el.request_status)
                                                          }}
                                                          disabled={
                                                            parseInt(el.requested_qty) - parseInt(el.dispatch_qty) >=
                                                              1 &&
                                                            requestItems.status !== 'Cancelled' &&
                                                            el.request_status !== 'Alternate' &&
                                                            el.request_status !== 'Not Available' &&
                                                            el.request_status !== 'Rejected'
                                                              ? false
                                                              : true
                                                          }
                                                          variant='contained'
                                                          onClick={() => {
                                                            setFulfillMedicine({
                                                              ...el
                                                            })

                                                            showDialog()
                                                          }}
                                                        >
                                                          Fullfill
                                                        </Button>
                                                      </Grid>
                                                    ) : (
                                                      <Grid
                                                        sx={{
                                                          verticalAlign: 'top',
                                                          minHeight: 124,
                                                          maxHeight: 124,
                                                          mb: 4
                                                        }}
                                                      >
                                                        {el.request_status === 'Not Available' && (
                                                          <Typography variant='body1' sx={{ color: 'error.main' }}>
                                                            This Product is not available
                                                          </Typography>
                                                        )}
                                                        {el.request_status === 'Rejected' && (
                                                          <Typography variant='body1' sx={{ color: 'error.main' }}>
                                                            This Product was rejected
                                                          </Typography>
                                                        )}
                                                        {el.alt_parent.length === 0 &&
                                                          el?.dispatch_status === 'Fulfilled' && (
                                                            <Grid
                                                              sx={{
                                                                color: 'success.main',
                                                                minHeight: 124,
                                                                maxHeight: 124,
                                                                mb: 4,
                                                                verticalAlign: 'top',
                                                                textAlign: 'center'
                                                              }}
                                                            >
                                                              <Icon
                                                                icon='ion:checkmark-circle'
                                                                style={{ color: 'primary.success' }}
                                                              />
                                                            </Grid>
                                                          )}
                                                      </Grid>
                                                    )}

                                                    {el.alt_parent.length > 0
                                                      ? el.alt_parent.map((elm, index) => {
                                                          return (
                                                            <Grid
                                                              key={index}
                                                              direction='column'
                                                              sx={{
                                                                minHeight: 124,
                                                                maxHeight: 124,
                                                                mb: 4,
                                                                mx: 'auto',
                                                                textAlign: 'center'
                                                              }}
                                                            >
                                                              <Box>
                                                                {selectedPharmacy.type === 'central' &&
                                                                parseInt(elm.requested_qty) -
                                                                  parseInt(elm.dispatch_qty) >=
                                                                  1 &&
                                                                requestItems.status !== 'Cancelled' &&
                                                                elm.request_status !== 'Alternate' &&
                                                                elm.request_status !== 'Not Available' &&
                                                                elm.request_status !== 'Rejected' ? (
                                                                  <Button
                                                                    size='small'
                                                                    sx={{
                                                                      width: 100,
                                                                      mx: 'auto',
                                                                      ...boxStyles(elm.request_status)
                                                                    }}
                                                                    variant='contained'
                                                                    onClick={() => {
                                                                      setFulfillMedicine({
                                                                        ...elm
                                                                      })

                                                                      showDialog()
                                                                    }}
                                                                  >
                                                                    Fullfill
                                                                  </Button>
                                                                ) : null}
                                                              </Box>
                                                              {elm?.request_status === 'Not Available' && (
                                                                <Grid
                                                                  sx={{
                                                                    minHeight: 124,
                                                                    maxHeight: 124,
                                                                    mb: 4,
                                                                    verticalAlign: 'top'
                                                                  }}
                                                                >
                                                                  <Typography
                                                                    variant='body1'
                                                                    sx={{ color: 'error.main' }}
                                                                  >
                                                                    This Product is not available
                                                                  </Typography>
                                                                </Grid>
                                                              )}

                                                              {elm?.request_status === 'Rejected' && (
                                                                <Grid
                                                                  sx={{
                                                                    minHeight: 124,
                                                                    maxHeight: 124,
                                                                    mb: 4,
                                                                    verticalAlign: 'top'
                                                                  }}
                                                                >
                                                                  <Typography
                                                                    variant='body1'
                                                                    sx={{ color: 'error.main' }}
                                                                  >
                                                                    This Product was rejected
                                                                  </Typography>
                                                                </Grid>
                                                              )}
                                                              {elm?.dispatch_qty === elm?.requested_qty && (
                                                                <Box
                                                                  sx={{
                                                                    minHeight: 124,
                                                                    maxHeight: 124,
                                                                    mb: 4,
                                                                    verticalAlign: 'top',
                                                                    color: 'success.main',
                                                                    textAlign: 'center'
                                                                  }}
                                                                >
                                                                  <Icon
                                                                    icon='ion:checkmark-circle'
                                                                    style={{ color: 'primary.success' }}
                                                                  />
                                                                </Box>
                                                              )}
                                                            </Grid>
                                                          )
                                                        })
                                                      : null}
                                                  </>
                                                </TableCell>

                                                <TableCell
                                                  sx={{
                                                    backgroundColor: getCellBgColor(el),
                                                    verticalAlign: 'top'
                                                  }}
                                                  className='match-height'
                                                  align='right'
                                                >
                                                  <>
                                                    {el?.alt_parent?.length > 0
                                                      ? el.alt_parent?.map((el, index) => {
                                                          return (
                                                            <Grid
                                                              key={index}
                                                              container
                                                              direction='column'
                                                              sx={{
                                                                minHeight: 124,
                                                                maxHeight: 124,
                                                                mb: 4,
                                                                verticalAlign: 'top'
                                                              }}
                                                            >
                                                              <Typography
                                                                variant='body1'
                                                                sx={{
                                                                  color: 'text.primary',
                                                                  textAlign: 'left',

                                                                  color: '#E4B819'
                                                                }}
                                                              >
                                                                Added Alternative
                                                              </Typography>
                                                              {el?.alternate_comments !== '' && (
                                                                <Grid
                                                                  onClick={() => {
                                                                    if (el?.alternate_comments) {
                                                                      setExpandedText(el.alternate_comments)
                                                                      openNotesDialog()
                                                                    }
                                                                  }}
                                                                  sx={{
                                                                    display: 'flex',
                                                                    width: '100%',
                                                                    cursor: 'pointer'
                                                                  }}
                                                                >
                                                                  <Icon
                                                                    icon={
                                                                      'material-symbols:sticky-note-2-outline-sharp'
                                                                    }
                                                                    style={{
                                                                      fontSize: '20px',
                                                                      color: '#00000066'
                                                                    }}
                                                                  ></Icon>
                                                                  <Typography
                                                                    variant='body2'
                                                                    sx={{
                                                                      color: 'text.primary',
                                                                      minWidth: 30,
                                                                      maxWidth: 80,
                                                                      cursor: 'pointer',
                                                                      WebkitBoxOrient: 'vertical',
                                                                      overflow: 'hidden',
                                                                      textOverflow: 'ellipsis',
                                                                      WebkitLineClamp: 6,
                                                                      whiteSpace: 'nowrap',
                                                                      opacity: '0.5',
                                                                      ...boxStyles(el.request_status)
                                                                    }}
                                                                  >
                                                                    {el?.alternate_comments}
                                                                  </Typography>
                                                                </Grid>
                                                              )}
                                                            </Grid>
                                                          )
                                                        })
                                                      : null}
                                                    {selectedPharmacy.type === 'central' && (
                                                      <Box
                                                        sx={{
                                                          textAlign: 'left',

                                                          ...boxStyles(el?.request_status)
                                                        }}
                                                      >
                                                        {parseInt(el?.requested_qty) - parseInt(el?.dispatch_qty) >=
                                                          1 &&
                                                          el?.request_status !== 'Alternate' &&
                                                          el?.request_status !== 'Not Available' &&
                                                          el?.request_status !== 'Rejected' && (
                                                            <MenuWithDots options={generateOptions(el)} />
                                                          )}
                                                      </Box>
                                                    )}
                                                    {el?.alt_parent?.length > 0
                                                      ? el.alt_parent
                                                          .filter(item => item.request_status === 'request')
                                                          .map((el, index) => {
                                                            return (
                                                              <Grid
                                                                key={index}
                                                                container
                                                                direction='column'
                                                                sx={{ minHeight: 80 }}
                                                              >
                                                                {selectedPharmacy.type === 'central' && (
                                                                  <Box sx={{ ...boxStyles(el?.request_status) }}>
                                                                    {parseInt(el?.requested_qty) -
                                                                      parseInt(el?.dispatch_qty) >=
                                                                      1 &&
                                                                      el?.request_status !== 'Alternate' &&
                                                                      el?.request_status !== 'Not Available' &&
                                                                      el?.request_status !== 'Rejected' && (
                                                                        <MenuWithDots options={generateOptions(el)} />
                                                                      )}
                                                                  </Box>
                                                                )}
                                                              </Grid>
                                                            )
                                                          })
                                                      : null}
                                                  </>
                                                </TableCell>
                                              </TableRow>
                                            )
                                          })
                                      : null}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </Card>
                          </TabPanel>
                          <TabPanel value='All'>
                            <Card sx={{ ml: -3, minWidth: '100%' }}>
                              <TableContainer>
                                <Table
                                  stickyHeader
                                  sx={{ minWidth: 650, overflowX: 'scroll' }}
                                  aria-label='simple table'
                                >
                                  <TableHead sx={{ backgroundColor: 'customColors.customTableHeaderBg' }}>
                                    <TableRow>
                                      <TableCell>S.NO</TableCell>
                                      <TableCell></TableCell>
                                      <TableCell>PRODUCT NAME</TableCell>

                                      <TableCell>QUANTITY</TableCell>
                                      <TableCell>FULL FILL</TableCell>
                                      <TableCell sx={{ minWidth: 200 }}>ACTION</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {requestItems?.request_item_details.length > 0
                                      ? requestItems?.request_item_details.map((el, index) => {
                                          return (
                                            <TableRow key={index} sx={{ overflowX: 'scroll' }}>
                                              <TableCell
                                                sx={{
                                                  backgroundColor: getCellBgColor(el),
                                                  verticalAlign: 'top'
                                                }}
                                                className='match-height'
                                              >
                                                <Typography
                                                  variant='subtitle2'
                                                  sx={{
                                                    color: 'text.primary',
                                                    minHeight: '100%'
                                                  }}
                                                >
                                                  {el.sl_no}.
                                                </Typography>
                                              </TableCell>
                                              <TableCell
                                                sx={{
                                                  backgroundColor: getCellBgColor(el),
                                                  verticalAlign: 'top'
                                                }}
                                                className='match-height'
                                              >
                                                {el.priority == 'high' ? (
                                                  <Box
                                                    sx={{
                                                      color: 'error.main',
                                                      float: 'left',
                                                      minHeight: '8px',
                                                      maxHeight: '8px',
                                                      width: '8px'
                                                    }}
                                                  >
                                                    <Icon
                                                      icon='material-symbols-light:circle'
                                                      style={{
                                                        color: 'primary.error',
                                                        minHeight: '8px',
                                                        maxHeight: '8px'
                                                      }}
                                                    ></Icon>
                                                  </Box>
                                                ) : null}
                                                {el?.request_status === 'Alternate' && (
                                                  <Grid
                                                    sx={{
                                                      minHeight: 124,
                                                      alignContent: 'top',
                                                      alignItems: 'center',
                                                      mb: 4
                                                    }}
                                                  ></Grid>
                                                )}
                                                {el?.alt_parent?.length > 0
                                                  ? el.alt_parent.map((el, index) => {
                                                      return (
                                                        <Grid
                                                          key={index}
                                                          sx={{
                                                            minHeight: 124,
                                                            maxHeight: 124,

                                                            alignContent: 'top',
                                                            alignItems: 'center',
                                                            mb: 4,
                                                            py: 1
                                                          }}
                                                        >
                                                          <Box
                                                            sx={{
                                                              minHeight: '43px',
                                                              width: '30px',
                                                              border: '1px solid ',
                                                              color: 'white',
                                                              padding: '4px',
                                                              fontSize: '12px',
                                                              borderRadius: '4px',
                                                              display: 'flex',
                                                              flexDirection: 'column',
                                                              alignContent: 'center',
                                                              backgroundColor: 'customColors.customDarkBg'
                                                            }}
                                                          >
                                                            Alt
                                                            <Box
                                                              sx={{
                                                                color: 'white',
                                                                height: '16px',
                                                                width: '16px',
                                                                mx: 'auto'
                                                              }}
                                                            >
                                                              <Icon
                                                                icon='ic:outline-subdirectory-arrow-right'
                                                                style={{
                                                                  color: 'white',
                                                                  height: '16px',
                                                                  width: '16px',
                                                                  mx: 'auto'
                                                                }}
                                                              />
                                                            </Box>
                                                          </Box>
                                                        </Grid>
                                                      )
                                                    })
                                                  : null}
                                              </TableCell>
                                              <TableCell
                                                sx={{
                                                  backgroundColor: getCellBgColor(el),

                                                  verticalAlign: 'top'
                                                }}
                                              >
                                                <Box
                                                  sx={{
                                                    minHeight: 124,
                                                    maxHeight: 124,
                                                    mb: 4,
                                                    verticalAlign: 'top'
                                                  }}
                                                >
                                                  <Typography variant='body1' sx={{ fontWeight: 600 }}>
                                                    <Tooltip title={el.stock_name} placement='top'>
                                                      <Typography
                                                        variant='body1'
                                                        sx={{
                                                          fontWeight: 600,
                                                          display: 'flex',
                                                          alignItems: 'center'
                                                        }}
                                                      >
                                                        {!isNaN(el?.control_substance) &&
                                                        parseInt(el?.control_substance) == 1 ? (
                                                          <Typography
                                                            sx={{
                                                              height: '16px',
                                                              width: '18px',
                                                              backgroundColor: 'error.main',
                                                              fontWeight: 'bold',
                                                              fontSize: '10px',
                                                              color: 'white',
                                                              padding: '2px',
                                                              borderRadius: '2px',
                                                              lineHeight: '12px',
                                                              textAlign: 'center',
                                                              mr: 1
                                                            }}
                                                          >
                                                            CS
                                                          </Typography>
                                                        ) : null}
                                                        {!isNaN(el?.prescription_required) &&
                                                        parseInt(el?.prescription_required) == 1 ? (
                                                          <Typography
                                                            sx={{
                                                              height: '16px',
                                                              width: '18px',
                                                              backgroundColor: 'error.main',
                                                              fontWeight: 'bold',
                                                              fontSize: '10px',
                                                              color: 'white',
                                                              padding: '2px',
                                                              borderRadius: '2px',
                                                              lineHeight: '12px',
                                                              textAlign: 'center',
                                                              mr: 1
                                                            }}
                                                          >
                                                            PR
                                                          </Typography>
                                                        ) : null}{' '}
                                                        {el.stock_name}
                                                      </Typography>
                                                    </Tooltip>
                                                  </Typography>
                                                  <Tooltip
                                                    title={`${el?.package} of ${el?.package_qty} ${el?.package_uom_label} ${el?.product_form_label}`}
                                                    placement='top'
                                                  >
                                                    <Typography variant='body1' sx={{ color: 'text.primary' }}>
                                                      {`${el?.package} of ${el?.package_qty} ${el?.package_uom_label} ${el?.product_form_label}`}
                                                    </Typography>
                                                  </Tooltip>
                                                  <Tooltip title={el?.manufacturer} placement='top'>
                                                    <Typography variant='body1' sx={{ color: 'text.primary' }}>
                                                      {el?.manufacturer}
                                                    </Typography>
                                                  </Tooltip>

                                                  {el?.description ? (
                                                    <Grid
                                                      onClick={() => {
                                                        if (el?.description) {
                                                          setExpandedText(el.description)
                                                          openNotesDialog()
                                                        }
                                                      }}
                                                      sx={{
                                                        display: 'flex',
                                                        color: 'customColors.customIconBg',
                                                        width: '100%',
                                                        my: 2,
                                                        gap: 1,
                                                        cursor: 'pointer'
                                                      }}
                                                    >
                                                      <Icon
                                                        icon={'material-symbols:description-outline'}
                                                        style={{
                                                          fontSize: '20px',
                                                          color: '#00000066'
                                                        }}
                                                      ></Icon>
                                                      <Typography
                                                        variant='body2'
                                                        sx={{
                                                          color: 'text.primary',
                                                          minWidth: 30,
                                                          maxWidth: 80,
                                                          cursor: 'pointer',
                                                          WebkitBoxOrient: 'vertical',
                                                          overflow: 'hidden',
                                                          textOverflow: 'ellipsis',
                                                          WebkitLineClamp: 6,
                                                          whiteSpace: 'nowrap',
                                                          ...boxStyles(el.request_status)
                                                        }}
                                                      >
                                                        {el?.description}
                                                      </Typography>
                                                    </Grid>
                                                  ) : null}
                                                  {parseInt(el?.prescription_required) == 1 ? (
                                                    <Grid
                                                      sx={{
                                                        display: 'flex',
                                                        width: '100%',
                                                        my: 2,
                                                        gap: 1,
                                                        cursor: 'pointer'
                                                      }}
                                                    >
                                                      <Box>{renderAttachmentIcons(el)}</Box>
                                                      <Typography
                                                        variant='body2'
                                                        sx={{ color: 'text.primary', opacity: '0.5' }}
                                                      >
                                                        prescription
                                                      </Typography>
                                                    </Grid>
                                                  ) : null}
                                                </Box>
                                                {el?.alt_parent?.length > 0
                                                  ? el.alt_parent?.map((el, index) => {
                                                      return (
                                                        <Grid
                                                          key={index}
                                                          container
                                                          direction='column'
                                                          sx={{ minHeight: 124, maxHeight: 124, mb: 4 }}
                                                        >
                                                          <Box>
                                                            <Typography variant='body1' sx={{ fontWeight: 600 }}>
                                                              <Tooltip title={el.stock_name} placement='top'>
                                                                <Typography
                                                                  variant='body1'
                                                                  sx={{
                                                                    fontWeight: 600,
                                                                    display: 'flex',
                                                                    alignItems: 'center'
                                                                  }}
                                                                >
                                                                  {!isNaN(el?.control_substance) &&
                                                                  parseInt(el?.control_substance) == 1 ? (
                                                                    <Typography
                                                                      sx={{
                                                                        height: '16px',
                                                                        width: '18px',
                                                                        backgroundColor: 'error.main',
                                                                        fontWeight: 'bold',
                                                                        fontSize: '10px',
                                                                        color: 'white',
                                                                        padding: '2px',
                                                                        borderRadius: '2px',
                                                                        lineHeight: '12px',
                                                                        textAlign: 'center',
                                                                        mr: 1
                                                                      }}
                                                                    >
                                                                      CS
                                                                    </Typography>
                                                                  ) : null}
                                                                  {!isNaN(el?.prescription_required) &&
                                                                  parseInt(el?.prescription_required) == 1 ? (
                                                                    <Typography
                                                                      sx={{
                                                                        height: '16px',
                                                                        width: '18px',
                                                                        backgroundColor: 'error.main',
                                                                        fontWeight: 'bold',
                                                                        fontSize: '10px',
                                                                        color: 'white',
                                                                        padding: '2px',
                                                                        borderRadius: '2px',
                                                                        lineHeight: '12px',
                                                                        textAlign: 'center',
                                                                        mr: 1
                                                                      }}
                                                                    >
                                                                      PR
                                                                    </Typography>
                                                                  ) : null}
                                                                  {el.stock_name}
                                                                </Typography>
                                                              </Tooltip>
                                                            </Typography>
                                                            <Tooltip
                                                              title={`${el?.package} of ${el?.package_qty} ${el?.package_uom_label} ${el?.product_form_label}`}
                                                              placement='top'
                                                            >
                                                              <Typography
                                                                variant='body1'
                                                                sx={{ color: 'text.primary' }}
                                                              >
                                                                {`${el?.package} of ${el?.package_qty} ${el?.package_uom_label} ${el?.product_form_label}`}
                                                              </Typography>
                                                            </Tooltip>
                                                            <Tooltip title={el?.manufacturer} placement='top'>
                                                              <Typography
                                                                variant='body1'
                                                                sx={{ color: 'text.primary' }}
                                                              >
                                                                {el?.manufacturer}
                                                              </Typography>
                                                            </Tooltip>

                                                            {el?.alternate_comments ? (
                                                              <Grid
                                                                onClick={() => {
                                                                  if (el?.alternate_comments) {
                                                                    setExpandedText(el.alternate_comments)
                                                                    openNotesDialog()
                                                                  }
                                                                }}
                                                                sx={{
                                                                  display: 'flex',
                                                                  width: '100%',
                                                                  mb: 2,
                                                                  gap: 1,
                                                                  cursor: 'pointer'
                                                                }}
                                                              >
                                                                <Icon
                                                                  icon={'material-symbols:description-outline'}
                                                                  style={{
                                                                    fontSize: '20px',
                                                                    color: '#00000066'
                                                                  }}
                                                                ></Icon>
                                                                <Typography
                                                                  variant='body2'
                                                                  sx={{
                                                                    color: 'text.primary',
                                                                    minWidth: 30,
                                                                    maxWidth: 80,
                                                                    cursor: 'pointer',
                                                                    WebkitBoxOrient: 'vertical',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    WebkitLineClamp: 6,
                                                                    whiteSpace: 'nowrap',
                                                                    opacity: '0.5',

                                                                    ...boxStyles(el.request_status)
                                                                  }}
                                                                >
                                                                  {el?.alternate_comments}
                                                                </Typography>
                                                              </Grid>
                                                            ) : null}
                                                            {parseInt(el?.prescription_required) == 1 ? (
                                                              <Grid
                                                                sx={{
                                                                  display: 'flex',

                                                                  width: '100%',
                                                                  mb: 2,
                                                                  gap: 1,
                                                                  cursor: 'pointer'
                                                                }}
                                                              >
                                                                <Box>{renderAttachmentIcons(el)}</Box>
                                                                <Typography
                                                                  variant='body2'
                                                                  sx={{ color: 'text.primary', opacity: '0.5' }}
                                                                >
                                                                  prescription
                                                                </Typography>
                                                              </Grid>
                                                            ) : null}
                                                          </Box>
                                                        </Grid>
                                                      )
                                                    })
                                                  : null}
                                              </TableCell>
                                              <TableCell
                                                sx={{
                                                  backgroundColor: getCellBgColor(el),
                                                  verticalAlign: 'top'
                                                }}
                                                className='match-height'
                                              >
                                                <Box
                                                  sx={{
                                                    minHeight: 124,
                                                    maxHeight: 124,
                                                    mb: 4
                                                  }}
                                                >
                                                  <Typography variant='body1' sx={{ color: 'text.primary' }}>
                                                    Requested:{el?.requested_qty}
                                                  </Typography>
                                                  <Typography variant='body1' sx={{ color: 'text.primary' }}>
                                                    Fullfilled:{el?.dispatch_qty}
                                                  </Typography>{' '}
                                                  <Typography variant='body1' sx={{ color: 'text.primary' }}>
                                                    Shipped:{el?.shipped_qty}
                                                  </Typography>
                                                </Box>
                                                {el.alt_parent.length > 0
                                                  ? el.alt_parent.map((el, index) => {
                                                      return (
                                                        <Box
                                                          key={index}
                                                          container
                                                          direction='column'
                                                          sx={{ minHeight: 124, maxHeight: 124, mb: 4 }}
                                                        >
                                                          <Typography variant='body1' sx={{ color: 'text.primary' }}>
                                                            Requested:{el?.requested_qty}
                                                          </Typography>
                                                          <Typography variant='body1' sx={{ color: 'text.primary' }}>
                                                            Fullfilled:{el?.dispatch_qty}
                                                          </Typography>{' '}
                                                          <Typography variant='body1' sx={{ color: 'text.primary' }}>
                                                            Shipped:{el?.shipped_qty}
                                                          </Typography>
                                                        </Box>
                                                      )
                                                    })
                                                  : null}
                                              </TableCell>
                                              <TableCell
                                                sx={{
                                                  backgroundColor: getCellBgColor(el),
                                                  verticalAlign: 'top'
                                                }}
                                                className='match-height'
                                              >
                                                <>
                                                  {selectedPharmacy.type === 'central' &&
                                                  parseInt(el.requested_qty) - parseInt(el.dispatch_qty) >= 1 &&
                                                  requestItems.status !== 'Cancelled' &&
                                                  el.request_status !== 'Alternate' &&
                                                  el.request_status !== 'Not Available' &&
                                                  el.request_status !== 'Rejected' ? (
                                                    <Grid
                                                      sx={{
                                                        verticalAlign: 'top',
                                                        minHeight: 124,
                                                        maxHeight: 124,
                                                        mb: 4
                                                      }}
                                                    >
                                                      <Button
                                                        size='small'
                                                        sx={{
                                                          width: 100,
                                                          mx: 'auto',
                                                          ...boxStyles(el.request_status)
                                                        }}
                                                        disabled={
                                                          parseInt(el.requested_qty) - parseInt(el.dispatch_qty) >= 1 &&
                                                          requestItems.status !== 'Cancelled' &&
                                                          el.request_status !== 'Alternate' &&
                                                          el.request_status !== 'Not Available' &&
                                                          el.request_status !== 'Rejected'
                                                            ? false
                                                            : true
                                                        }
                                                        variant='contained'
                                                        onClick={() => {
                                                          setFulfillMedicine({
                                                            ...el
                                                          })

                                                          showDialog()
                                                        }}
                                                      >
                                                        Fullfill
                                                      </Button>
                                                    </Grid>
                                                  ) : (
                                                    <Grid
                                                      sx={{
                                                        verticalAlign: 'top',
                                                        minHeight: 124,
                                                        maxHeight: 124,
                                                        mb: 4
                                                      }}
                                                    >
                                                      {el.request_status === 'Not Available' && (
                                                        <Typography variant='body1' sx={{ color: 'error.main' }}>
                                                          This Product is not available
                                                        </Typography>
                                                      )}
                                                      {el.request_status === 'Rejected' && (
                                                        <Typography variant='body1' sx={{ color: 'error.main' }}>
                                                          This Product was rejected
                                                        </Typography>
                                                      )}
                                                      {el.alt_parent.length === 0 &&
                                                        el?.dispatch_status === 'Fulfilled' && (
                                                          <Grid
                                                            sx={{
                                                              color: 'success.main',
                                                              minHeight: 124,
                                                              maxHeight: 124,
                                                              mb: 4,
                                                              verticalAlign: 'top',
                                                              textAlign: 'center'
                                                            }}
                                                          >
                                                            <Icon
                                                              icon='ion:checkmark-circle'
                                                              style={{ color: 'primary.success' }}
                                                            />
                                                          </Grid>
                                                        )}
                                                    </Grid>
                                                  )}

                                                  {el.alt_parent.length > 0
                                                    ? el.alt_parent.map((elm, index) => {
                                                        return (
                                                          <Grid
                                                            key={index}
                                                            direction='column'
                                                            sx={{
                                                              minHeight: 124,
                                                              maxHeight: 124,
                                                              mb: 4
                                                            }}
                                                          >
                                                            <Box>
                                                              {selectedPharmacy.type === 'central' &&
                                                              parseInt(elm.requested_qty) -
                                                                parseInt(elm.dispatch_qty) >=
                                                                1 &&
                                                              requestItems.status !== 'Cancelled' &&
                                                              elm.request_status !== 'Alternate' &&
                                                              elm.request_status !== 'Not Available' &&
                                                              elm.request_status !== 'Rejected' ? (
                                                                <Button
                                                                  size='small'
                                                                  sx={{
                                                                    width: 100,
                                                                    mx: 'auto',
                                                                    ...boxStyles(elm.request_status)
                                                                  }}
                                                                  variant='contained'
                                                                  onClick={() => {
                                                                    setFulfillMedicine({
                                                                      ...elm
                                                                    })

                                                                    showDialog()
                                                                  }}
                                                                >
                                                                  Fullfill
                                                                </Button>
                                                              ) : null}
                                                            </Box>
                                                            {elm?.request_status === 'Not Available' && (
                                                              <Grid
                                                                sx={{
                                                                  minHeight: 124,
                                                                  maxHeight: 124,
                                                                  mb: 4,
                                                                  verticalAlign: 'top'
                                                                }}
                                                              >
                                                                <Typography
                                                                  variant='body1'
                                                                  sx={{ color: 'error.main' }}
                                                                >
                                                                  This Product is not available
                                                                </Typography>
                                                              </Grid>
                                                            )}

                                                            {elm?.request_status === 'Rejected' && (
                                                              <Grid
                                                                sx={{
                                                                  minHeight: 124,
                                                                  maxHeight: 124,
                                                                  mb: 4,
                                                                  verticalAlign: 'top'
                                                                }}
                                                              >
                                                                <Typography
                                                                  variant='body1'
                                                                  sx={{ color: 'error.main' }}
                                                                >
                                                                  This Product was rejected
                                                                </Typography>
                                                              </Grid>
                                                            )}
                                                            {elm?.dispatch_qty === elm?.requested_qty && (
                                                              <Box
                                                                sx={{
                                                                  minHeight: 124,
                                                                  maxHeight: 124,
                                                                  mb: 4,
                                                                  verticalAlign: 'top',
                                                                  color: 'success.main',
                                                                  textAlign: 'center'
                                                                }}
                                                              >
                                                                <Icon
                                                                  icon='ion:checkmark-circle'
                                                                  style={{ color: 'primary.success' }}
                                                                />
                                                              </Box>
                                                            )}
                                                          </Grid>
                                                        )
                                                      })
                                                    : null}
                                                </>
                                              </TableCell>

                                              <TableCell
                                                sx={{
                                                  backgroundColor: getCellBgColor(el),
                                                  verticalAlign: 'top'
                                                }}
                                                className='match-height'
                                                align='right'
                                              >
                                                <>
                                                  {el?.alt_parent?.length > 0
                                                    ? el.alt_parent?.map((el, index) => {
                                                        return (
                                                          <Grid
                                                            key={index}
                                                            container
                                                            direction='column'
                                                            sx={{
                                                              minHeight: 124,
                                                              maxHeight: 124,
                                                              mb: 4,
                                                              verticalAlign: 'top'
                                                            }}
                                                          >
                                                            <Typography
                                                              variant='body1'
                                                              sx={{
                                                                color: 'text.primary',
                                                                textAlign: 'left',

                                                                color: '#E4B819'
                                                              }}
                                                            >
                                                              Added Alternative
                                                            </Typography>

                                                            {el?.alternate_comments !== '' && (
                                                              <Grid
                                                                onClick={() => {
                                                                  if (el?.alternate_comments) {
                                                                    setExpandedText(el.alternate_comments)
                                                                    openNotesDialog()
                                                                  }
                                                                }}
                                                                sx={{
                                                                  display: 'flex',
                                                                  width: '100%',
                                                                  cursor: 'pointer'
                                                                }}
                                                              >
                                                                <Icon
                                                                  icon={'material-symbols:sticky-note-2-outline-sharp'}
                                                                  style={{
                                                                    fontSize: '20px',
                                                                    color: '#00000066'
                                                                  }}
                                                                ></Icon>
                                                                <Typography
                                                                  variant='body2'
                                                                  sx={{
                                                                    color: 'text.primary',
                                                                    minWidth: 30,
                                                                    maxWidth: 80,
                                                                    cursor: 'pointer',
                                                                    WebkitBoxOrient: 'vertical',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    WebkitLineClamp: 6,
                                                                    whiteSpace: 'nowrap',
                                                                    opacity: '0.5',

                                                                    ...boxStyles(el.request_status)
                                                                  }}
                                                                >
                                                                  {el?.alternate_comments}
                                                                </Typography>
                                                              </Grid>
                                                            )}
                                                          </Grid>
                                                        )
                                                      })
                                                    : null}
                                                  {selectedPharmacy.type === 'central' && (
                                                    <Box
                                                      sx={{
                                                        textAlign: 'left',

                                                        ...boxStyles(el?.request_status)
                                                      }}
                                                    >
                                                      {parseInt(el?.requested_qty) - parseInt(el?.dispatch_qty) >= 1 &&
                                                        el?.request_status !== 'Alternate' &&
                                                        el?.request_status !== 'Not Available' &&
                                                        el?.request_status !== 'Rejected' && (
                                                          <MenuWithDots options={generateOptions(el)} />
                                                        )}
                                                    </Box>
                                                  )}
                                                  {el?.alt_parent?.length > 0
                                                    ? el.alt_parent
                                                        .filter(item => item.request_status === 'request')
                                                        .map((el, index) => {
                                                          return (
                                                            <Grid
                                                              key={index}
                                                              container
                                                              direction='column'
                                                              sx={{ minHeight: 80 }}
                                                            >
                                                              {selectedPharmacy.type === 'central' && (
                                                                <Box sx={{ ...boxStyles(el?.request_status) }}>
                                                                  {parseInt(el?.requested_qty) -
                                                                    parseInt(el?.dispatch_qty) >=
                                                                    1 &&
                                                                    el?.request_status !== 'Alternate' &&
                                                                    el?.request_status !== 'Not Available' &&
                                                                    el?.request_status !== 'Rejected' && (
                                                                      <MenuWithDots options={generateOptions(el)} />
                                                                    )}
                                                                </Box>
                                                              )}
                                                            </Grid>
                                                          )
                                                        })
                                                    : null}
                                                </>
                                              </TableCell>
                                            </TableRow>
                                          )
                                        })
                                      : null}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </Card>
                            {/* <TableBasic
                              rowHeight={126}
                              columns={columns}
                              rows={requestItems?.request_item_details}
                            ></TableBasic> */}
                          </TabPanel>
                        </TabContext>
                      </Grid>
                    </TabPanel>
                    <TabPanel
                      value='Shipped'
                      sx={{
                        display: 'flex',
                        justifyContent: 'flex-start'
                      }}
                    >
                      <Grid sx={{ width: '100%', ml: -2, mt: -6 }}>
                        <TabContext value={shipmentTab}>
                          <TabLists
                            onChange={(event, newValue) => {
                              setShipmentTab(newValue)
                            }}
                          >
                            <Tab
                              value='Ready To Ship'
                              label={
                                <TabBadge
                                  label='Ready To Ship'
                                  totalCount={shipmentTab === 'Ready To Ship' ? 0 : null}
                                />
                              }
                            />
                            <Tab
                              value='Shipped'
                              label={<TabBadge label='Shipped' totalCount={shipmentTab === 'Shipped' ? 0 : null} />}
                            />
                          </TabLists>
                          <TabPanel value='Ready To Ship'>
                            {dispatchedItems?.length > 0 && selectedPharmacy.type === 'central' && (
                              <Card sx={{ minWidth: '100%', ml: -2 }}>
                                <CardHeader
                                  title={``}
                                  action={
                                    (selectedPharmacy.permission.key === 'ADD' ||
                                      selectedPharmacy.permission.key === 'allow_full_access') &&
                                    requestItems.status !== 'Cancelled' ? (
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
                                    ) : null
                                  }
                                ></CardHeader>
                                <TableBasic rowHeight={90} columns={fulfillColumns} rows={dispatchedItems}></TableBasic>
                              </Card>
                            )}
                          </TabPanel>
                          <TabPanel value='Shipped'>
                            {shippedItems?.length > 0 ? (
                              <>
                                <Card sx={{ mb: 6, minWidth: '100%', ml: -2 }}>
                                  {/* <CardHeader title={`Shipments`}></CardHeader> */}
                                  <TableBasic
                                    columns={shippedColumns}
                                    rows={shippedItems}
                                    onRowClick={e => {
                                      setOrderId(e.id)
                                      showOrderFormDialog()
                                    }}
                                  ></TableBasic>
                                </Card>
                              </>
                            ) : null}
                          </TabPanel>
                        </TabContext>
                      </Grid>
                    </TabPanel>
                  </TabContext>
                </Grid>

                <Grid container>
                  <CommonDialogBox
                    noWidth={'noWidth'}
                    title={'Add Alternative Supply'}
                    dialogBoxStatus={showAlternativeMedicineDialog}
                    formComponent={
                      <AlternativeMedicine
                        parentId={medicineParentId}
                        updateRequestItems={() => {
                          getRequestItemLists(id)
                          closeAlternativeMedicineDialog()
                        }}
                      />
                    }
                    close={closeAlternativeMedicineDialog}
                    show={openAlternativeMedicineDialog}
                  />
                </Grid>
                <Grid container>
                  <CommonDialogBox
                    noWidth={'noWidth'}
                    title={'Decline Request'}
                    dialogBoxStatus={rejectRequestMedicineDialog}
                    formComponent={
                      <RejectRequestItem
                        parentId={medicineParentId}
                        updateRequestItems={() => {
                          closeRejectMedicineDialog()
                          getRequestItemLists(id)
                        }}
                      />
                    }
                    close={closeRejectMedicineDialog}
                    show={openRejectMedicineDialog}
                  />
                </Grid>
                <Grid container>
                  <CommonDialogBox
                    noWidth={'noWidth'}
                    title={'Supply Stopped'}
                    dialogBoxStatus={productNotAvailableDialog}
                    formComponent={
                      <ProductNotAvailable
                        payload={notAvailableItemId}
                        updateRequestItems={() => {
                          closeProductNotAvailableDialog()
                          getRequestItemLists(id)
                        }}
                      />
                    }
                    close={closeProductNotAvailableDialog}
                    show={openProductNotAvailableDialog}
                  />
                </Grid>
              </Card>
              {/* Dispatch list */}
              {dispatchedItems?.length > 0 && selectedPharmacy.type === 'central' && (
                <>
                  {/* <Card sx={{ mb: 6 }}>
                    <CardHeader
                      title={`Fulfillment`}
                      action={
                        (selectedPharmacy.permission.key === 'ADD' ||
                          selectedPharmacy.permission.key === 'allow_full_access') &&
                        requestItems.status !== 'Cancelled' ? (
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
                        ) : null
                      }
                    ></CardHeader>
                    <TableBasic rowHeight={90} columns={fulfillColumns} rows={dispatchedItems}></TableBasic>
                  </Card> */}
                  <ConfirmDialogBox
                    open={deleteDialog}
                    closeDialog={() => {
                      setDeleteDialog(false)
                      setDeleteFullFillId(null)
                    }}
                    action={() => {
                      setDeleteDialog(false)
                      setDeleteFullFillId(null)
                    }}
                    content={
                      <Box>
                        <>
                          <DialogContent>
                            <DialogContentText sx={{ mb: 1 }}>
                              Are you sure you want to delete this item?
                            </DialogContentText>
                          </DialogContent>
                          <DialogActions className='dialog-actions-dense'>
                            <Button
                              variant='contained'
                              size='small'
                              color='primary'
                              onClick={() => {
                                setDeleteDialog(false)
                                setDeleteFullFillId(null)
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              size='small'
                              variant='contained'
                              color='error'
                              onClick={() => {
                                deleteFullFillItem(deleteFullFillId)
                              }}
                            >
                              Confirm
                            </Button>
                          </DialogActions>
                        </>
                      </Box>
                    }
                  />
                </>
              )}
              {/* Shipped list        */}

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
            ) : null} */}
              {/* {dispenseItems?.length > 0 ? (
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
                onBackdropClick={() => closeDialog()}
              >
                <Grid
                  container
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <CardHeader title={`Fulfillment`} />
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
                onBackdropClick={() => closeShipDialog()}
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
              {/* <ProductNotAvailable
                open={productNotAvailableDialog}
                onClose={handleProductNotAvailable}
                selectedValue={notAvailableItemId}
                loading={productNotAvailableLoading}
              />{' '} */}
            </>
          ) : (
            <Alert severity='warning'>
              <AlertTitle>Warning</AlertTitle>
              You don't have an access to view this request
              <Button
                onClick={() => {
                  router.push('/pharmacy/request/request-list/')
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
          <ConfirmDialogBox
            open={notesDialog}
            closeDialog={() => {
              closeNotesDialog()
            }}
            action={() => {
              closeNotesDialog()
            }}
            content={
              <Box>
                <>
                  <DialogContent>
                    <DialogContentText sx={{ mb: 1 }}>{expandedText ? expandedText : null}</DialogContentText>
                  </DialogContent>
                </>
              </Box>
            }
          />
        </>
      )}
    </>
  )
}

export default IndividualRequest
