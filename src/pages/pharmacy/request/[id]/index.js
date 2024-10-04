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
import CustomAvatar from 'src/@core/components/mui/avatar'

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
import { Box, CardContent, CardHeader, Divider, Tooltip } from '@mui/material'
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
import AddComment from 'src/components/pharmacy/request/AddComment'

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
    parentEndPointId: '',
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
      parentEndPointId: '',

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
      parentEndPointId: '',

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
    setMedicineParentId({
      parentEndPointId: '',

      parent_id: '',
      request_item_id: '',
      qty_requested: '',
      product: ''
    })
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
    if (el?.alt_parent.length === 0 && el?.dispatch_qty === el?.requested_qty) {
      return 'customColors.Surface'
    } else if (el?.alt_parent.length > 0) {
      return 'customColors.customTableCellBg'
    } else if (el?.request_status === 'Not Available' || el?.request_status === 'Rejected') {
      return 'customColors.neutral05'
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
          <Box
            onClick={() => {
              window.open(status.prescription_required_file, '_blank')
            }}
            sx={{ display: 'flex' }}
          >
            <Icon style={{ fontSize: '20px', color: '#00000066' }} icon='material-symbols:attachment' />
            <Typography
              variant='body2'
              sx={{
                color: 'text.primary',
                opacity: '0.5'
              }}
            >
              prescription
            </Typography>
          </Box>
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

  const generateOptions = (params, parentId) => {
    let options = []

    if (selectedPharmacy.type === 'central') {
      options.push({
        label: 'Add Alternate',
        action: () => {
          openAlternativeMedicineDialog()
          setMedicineParentId(prevState => ({
            ...prevState,
            parentEndPointId: params.request_item_id,
            parent_id: parentId,
            request_item_id: params?.id,
            qty_requested: params?.qty,
            product: params?.stock_name
          }))
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
          label: 'Supply Stopped',
          action: () => {
            setMedicineParentId(prevState => ({
              ...prevState,
              parentEndPointId: params.request_item_id,
              parent_id: parentId,
              request_item_id: params?.id,
              qty_requested: params?.qty,
              product: params?.stock_name
            }))
            openProductNotAvailableDialog()
          }
        },
        {
          label: 'Decline Request',
          action: () => {
            setMedicineParentId(prevState => ({
              ...prevState,
              parentEndPointId: params.request_item_id,
              parent_id: parentId,
              request_item_id: params?.id,
              qty_requested: params?.qty,
              product: params?.stock_name
            }))
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
              <Card sx={{ mb: 6, boxShadow: 'none !important' }}>
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
                          Requested By:
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
                            {requestItems?.to_store}
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
                          Request ID:
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
                            {requestItems?.request_number}
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
                          gap: '4px',
                          height: '46px',

                          textAlign: {
                            xs: 'left',
                            sm: 'right',
                            md: 'right',
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
                        <Typography
                          sx={{
                            fontSize: '14px',
                            fontWeight: '400',
                            lineHeight: '16.94px',
                            color: 'customColors.neutralSecondary'
                          }}
                        >
                          Requested Items:
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
                            {requestItems?.total_qty}
                          </Box>
                        </Typography>
                        <Typography
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
                              fontSize: '16px',
                              color: 'primary.OnSurface',
                              lineHeight: '19.36px',
                              mx: 2
                            }}
                          >
                            {requestItems?.shipped_qty}
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
                          gap: '4px',
                          height: '46px',
                          mb: {
                            xs: 5,
                            sm: 0,
                            md: 0,
                            lg: 0
                          }
                        }}
                      >
                        <Typography
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
                        </Typography>

                        <Typography
                          sx={{
                            fontSize: '14px',
                            fontWeight: '400',
                            lineHeight: '16.94px',
                            color: 'primary.OnSurface'
                          }}
                        >
                          Shipped Value:
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
                            ₹{requestItems?.shipped_amount}
                          </Box>
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
                              height: '36px',
                              gap: '4px'
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: '14px',
                                fontWeight: '500',
                                lineHeight: '16.94px',
                                color: 'customColors.OnSurfaceVariant'
                              }}
                            >
                              {requestItems?.created_by_user_name ? requestItems?.created_by_user_name : 'NA'}
                            </Typography>
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
                <Grid
                  spacing={2}
                  sx={{
                    px: 6,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    mb: 4
                  }}
                >
                  <TabContext value={detailsTab}>
                    <TabList
                      sx={{ borderBottom: '1px solid #0000000D' }}
                      onChange={(event, newValue) => {
                        setDetailsTab(newValue)
                      }}
                    >
                      <Tab
                        value='Pending'
                        label={<TabBadge label='Requested Items' totalCount={status === 'Pending' ? 0 : null} />}
                      />
                      <Tab
                        value='Shipped'
                        label={
                          <TabBadge
                            label={selectedPharmacy?.type === 'local' ? 'Shipped' : 'Shipment'}
                            totalCount={status === 'Shipped' ? 0 : null}
                          />
                        }
                      />
                    </TabList>
                    {selectedPharmacy?.type === 'local' ? (
                      <>
                        <TabPanel
                          value='Pending'
                          sx={{
                            padding: '0 !important'
                          }}
                        >
                          <Box sx={{ my: 5 }}>
                            {requestItems?.request_item_details.length > 0 && (
                              <Card
                                sx={{
                                  // ml: -3,
                                  minWidth: '100% !important',
                                  boxShadow: 'none !important'
                                }}
                              >
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
                                        <TableCell
                                          sx={{
                                            minWidth: 100
                                          }}
                                        >
                                          FULL FILL
                                        </TableCell>
                                        <TableCell>ACTION</TableCell>
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

                                                      minHeight: 104,
                                                      maxHeight: 104,
                                                      display: 'flex',
                                                      flexDirection: 'column',
                                                      justifyContent: 'center',
                                                      alignContent: 'top',
                                                      alignItems: 'center'
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

                                                        minHeight: 104,
                                                        maxHeight: 104,
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        justifyContent: 'center',
                                                        alignContent: 'top',
                                                        alignItems: 'center'
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

                                                  {el?.alt_parent?.length > 0
                                                    ? el.alt_parent.map((el, index) => {
                                                        return (
                                                          <Grid
                                                            key={index}
                                                            sx={{
                                                              minHeight: 104,
                                                              maxHeight: 104,
                                                              display: 'flex',
                                                              flexDirection: 'column',
                                                              justifyContent: 'center',
                                                              alignContent: 'top',
                                                              alignItems: 'center'
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
                                                                backgroundColor: 'customColors.neutralSecondary'
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

                                                    verticalAlign: 'top',

                                                    height: 'auto'
                                                  }}
                                                >
                                                  <Box
                                                    sx={{
                                                      minHeight: 104,
                                                      maxHeight: 104,
                                                      display: 'flex',
                                                      flexDirection: 'column',
                                                      justifyContent: 'center',
                                                      verticalAlign: 'top'
                                                    }}
                                                  >
                                                    <Typography variant='body1' sx={{ fontWeight: 600 }}>
                                                      <Tooltip title={el.stock_name} placement='top'>
                                                        <Typography
                                                          variant='body1'
                                                          sx={{
                                                            fontSize: '16px !important',

                                                            fontWeight: 600,
                                                            color: 'customColors.OnSecondaryContainer',

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
                                                      <Typography
                                                        variant='body1'
                                                        sx={{
                                                          color: 'text.primary',
                                                          display: { xs: 'none', md: 'none', lg: 'block' },
                                                          fontSize: '14px !important',

                                                          fontWeight: 400
                                                        }}
                                                      >
                                                        {`${el?.package} of ${el?.package_qty} ${el?.package_uom_label} ${el?.product_form_label}`}
                                                      </Typography>
                                                    </Tooltip>
                                                    <Tooltip title={el?.manufacturer} placement='top'>
                                                      <Typography
                                                        variant='body1'
                                                        sx={{
                                                          color: 'text.primary',
                                                          display: { xs: 'none', md: 'none', lg: 'block' },
                                                          fontSize: '14px !important',
                                                          fontWeight: 400
                                                        }}
                                                      >
                                                        {el?.manufacturer}
                                                      </Typography>
                                                    </Tooltip>

                                                    {el?.description || el?.alternate_comments ? (
                                                      <Grid
                                                        onClick={() => {
                                                          if (el?.description || el.alternate_comments) {
                                                            setExpandedText(el?.description || el?.alternate_comments)
                                                            openNotesDialog()
                                                          }
                                                        }}
                                                        sx={{
                                                          display: 'flex',
                                                          color: 'customColors.neutralSecondary',
                                                          width: '100%',

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
                                                          {el?.description || el?.alternate_comments}
                                                        </Typography>
                                                      </Grid>
                                                    ) : null}
                                                    {parseInt(el?.prescription_required) == 1 ? (
                                                      <Grid
                                                        sx={{
                                                          display: 'flex',
                                                          width: '100%',

                                                          cursor: 'pointer'
                                                        }}
                                                      >
                                                        <Box>{renderAttachmentIcons(el)}</Box>
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
                                                            sx={{
                                                              minHeight: 104,
                                                              maxHeight: 104,
                                                              display: 'flex',
                                                              flexDirection: 'column',
                                                              justifyContent: 'center',
                                                              flexWrap: 'nowrap',
                                                              my: 1
                                                            }}
                                                          >
                                                            <Box>
                                                              <Typography variant='body1' sx={{ fontWeight: 600 }}>
                                                                <Tooltip title={el.stock_name} placement='top'>
                                                                  <Typography
                                                                    variant='body1'
                                                                    sx={{
                                                                      fontSize: '16px !important',

                                                                      fontWeight: 600,
                                                                      color: 'customColors.OnSecondaryContainer',

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
                                                                  sx={{
                                                                    color: 'text.primary',
                                                                    display: { xs: 'none', md: 'none', lg: 'block' },
                                                                    fontSize: '14px !important',
                                                                    fontWeight: 400
                                                                  }}
                                                                >
                                                                  {`${el?.package} of ${el?.package_qty} ${el?.package_uom_label} ${el?.product_form_label}`}
                                                                </Typography>
                                                              </Tooltip>
                                                              <Tooltip title={el?.manufacturer} placement='top'>
                                                                <Typography
                                                                  variant='body1'
                                                                  sx={{
                                                                    color: 'text.primary',
                                                                    display: { xs: 'none', md: 'none', lg: 'block' },
                                                                    fontSize: '14px !important',
                                                                    fontWeight: 400
                                                                  }}
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

                                                                    cursor: 'pointer'
                                                                  }}
                                                                >
                                                                  <Box>{renderAttachmentIcons(el)}</Box>
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
                                                      minHeight: 104,
                                                      maxHeight: 104,
                                                      display: 'flex',
                                                      flexDirection: 'column',
                                                      justifyContent: 'center'
                                                    }}
                                                  >
                                                    <Typography
                                                      variant='body1'
                                                      sx={{
                                                        color: 'text.primary',
                                                        fontSize: '14px !important',
                                                        fontWeight: 400
                                                      }}
                                                    >
                                                      Requested:{el?.requested_qty}
                                                    </Typography>
                                                    <Typography
                                                      variant='body1'
                                                      sx={{
                                                        color: 'text.primary',
                                                        fontSize: '14px !important',
                                                        fontWeight: 400
                                                      }}
                                                    >
                                                      Fulfilled:{el?.dispatch_qty}
                                                    </Typography>{' '}
                                                    <Typography
                                                      variant='body1'
                                                      sx={{
                                                        color: 'text.primary',
                                                        fontSize: '14px !important',
                                                        fontWeight: 400
                                                      }}
                                                    >
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
                                                            sx={{
                                                              minHeight: 104,
                                                              maxHeight: 104,
                                                              display: 'flex',
                                                              flexDirection: 'column',
                                                              justifyContent: 'center'
                                                            }}
                                                          >
                                                            <Typography
                                                              variant='body1'
                                                              sx={{
                                                                color: 'text.primary',
                                                                fontSize: '14px !important',
                                                                fontWeight: 400
                                                              }}
                                                            >
                                                              Requested:{el?.requested_qty}
                                                            </Typography>
                                                            <Typography
                                                              variant='body1'
                                                              sx={{
                                                                color: 'text.primary',
                                                                fontSize: '14px !important',
                                                                fontWeight: 400
                                                              }}
                                                            >
                                                              Fulfilled:{el?.dispatch_qty}
                                                            </Typography>{' '}
                                                            <Typography
                                                              variant='body1'
                                                              sx={{
                                                                color: 'text.primary',
                                                                fontSize: '14px !important',
                                                                fontWeight: 400
                                                              }}
                                                            >
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
                                                          minHeight: 104,
                                                          maxHeight: 104,
                                                          display: 'flex',
                                                          flexDirection: 'column',
                                                          justifyContent: 'center'
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
                                                          Fulfill
                                                        </Button>
                                                      </Grid>
                                                    ) : (
                                                      <Grid
                                                        sx={{
                                                          verticalAlign: 'top',
                                                          minHeight: 104,
                                                          maxHeight: 104,
                                                          display: 'flex',
                                                          flexDirection: 'column',
                                                          textAlign: 'center',
                                                          justifyContent: 'center',
                                                          justifyItems: 'center',
                                                          mx: 'auto'
                                                        }}
                                                      >
                                                        {el.request_status === 'Not Available' && (
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
                                                            Fulfill
                                                          </Button>
                                                        )}
                                                        {el.request_status === 'Rejected' && (
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
                                                            Fulfill
                                                          </Button>
                                                        )}
                                                        {el.alt_parent.length === 0 &&
                                                          el?.dispatch_status === 'Fulfilled' &&
                                                          el?.request_status !== 'Not Available' &&
                                                          el?.request_status !== 'Rejected' && (
                                                            <Grid
                                                              sx={{
                                                                color: 'success.main',
                                                                minHeight: 104,
                                                                maxHeight: 104,
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                justifyContent: 'center',
                                                                mx: 'auto',
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
                                                      ? el.alt_parent.map((nesElm, index) => {
                                                          return (
                                                            <Grid
                                                              key={index}
                                                              direction='column'
                                                              sx={{
                                                                minHeight: 104,
                                                                maxHeight: 104,
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                justifyContent: 'center',
                                                                mx: 'auto',
                                                                textAlign: 'center'
                                                              }}
                                                            >
                                                              <Box>
                                                                {selectedPharmacy.type === 'central' &&
                                                                parseInt(nesElm.requested_qty) -
                                                                  parseInt(nesElm.dispatch_qty) >=
                                                                  1 &&
                                                                requestItems.status !== 'Cancelled' &&
                                                                nesElm.request_status !== 'Alternate' &&
                                                                nesElm.request_status !== 'Not Available' &&
                                                                nesElm.request_status !== 'Rejected' ? (
                                                                  <Button
                                                                    size='small'
                                                                    sx={{
                                                                      width: 100,
                                                                      mx: 'auto',
                                                                      ...boxStyles(nesElm.request_status)
                                                                    }}
                                                                    variant='contained'
                                                                    onClick={() => {
                                                                      setFulfillMedicine({
                                                                        ...nesElm
                                                                      })

                                                                      showDialog()
                                                                    }}
                                                                  >
                                                                    Fulfill
                                                                  </Button>
                                                                ) : null}
                                                              </Box>
                                                              {nesElm?.request_status === 'Not Available' && (
                                                                <Grid
                                                                  sx={{
                                                                    minHeight: 104,
                                                                    maxHeight: 104,
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    justifyContent: 'center',

                                                                    // mb: 4,
                                                                    verticalAlign: 'top'
                                                                  }}
                                                                >
                                                                  {/* <Typography
                                                        variant='body1'
                                                        sx={{
                                                          color: 'error.main',
                                                          fontSize: '14px !important',
                                                          fontWeight: 400
                                                        }}
                                                      >
                                                        This Product is not available
                                                      </Typography> */}
                                                                  <Button
                                                                    size='small'
                                                                    sx={{
                                                                      width: 100,
                                                                      mx: 'auto',
                                                                      ...boxStyles(nesElm?.request_status)
                                                                    }}
                                                                    disabled={
                                                                      parseInt(nesElm?.requested_qty) -
                                                                        parseInt(nesElm?.dispatch_qty) >=
                                                                        1 &&
                                                                      requestItems.status !== 'Cancelled' &&
                                                                      nesElm?.request_status !== 'Alternate' &&
                                                                      nesElm?.request_status !== 'Not Available' &&
                                                                      nesElm?.request_status !== 'Rejected'
                                                                        ? false
                                                                        : true
                                                                    }
                                                                    variant='contained'
                                                                    onClick={() => {
                                                                      setFulfillMedicine({
                                                                        ...nesElm
                                                                      })

                                                                      showDialog()
                                                                    }}
                                                                  >
                                                                    Fulfill
                                                                  </Button>
                                                                </Grid>
                                                              )}

                                                              {nesElm?.request_status === 'Rejected' && (
                                                                <Grid
                                                                  sx={{
                                                                    minHeight: 104,
                                                                    maxHeight: 104,
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    justifyContent: 'center',

                                                                    // mb: 4,
                                                                    verticalAlign: 'top'
                                                                  }}
                                                                >
                                                                  {/* <Typography
                                                        variant='body1'
                                                        sx={{
                                                          color: 'error.main',
                                                          fontSize: '14px !important',
                                                          fontWeight: 400
                                                        }}
                                                      >
                                                        This Product was rejected
                                                      </Typography> */}
                                                                  <Button
                                                                    size='small'
                                                                    sx={{
                                                                      width: 100,
                                                                      mx: 'auto',
                                                                      ...boxStyles(nesElm?.request_status)
                                                                    }}
                                                                    disabled={
                                                                      parseInt(nesElm?.requested_qty) -
                                                                        parseInt(nesElm?.dispatch_qty) >=
                                                                        1 &&
                                                                      requestItems.status !== 'Cancelled' &&
                                                                      nesElm?.request_status !== 'Alternate' &&
                                                                      nesElm?.request_status !== 'Not Available' &&
                                                                      nesElm?.request_status !== 'Rejected'
                                                                        ? false
                                                                        : true
                                                                    }
                                                                    variant='contained'
                                                                    onClick={() => {
                                                                      setFulfillMedicine({
                                                                        ...nesElm
                                                                      })

                                                                      showDialog()
                                                                    }}
                                                                  >
                                                                    Fulfill
                                                                  </Button>
                                                                </Grid>
                                                              )}
                                                              {nesElm?.dispatch_qty === nesElm?.requested_qty && (
                                                                <Box
                                                                  sx={{
                                                                    minHeight: 104,
                                                                    maxHeight: 104,
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    justifyContent: 'center',

                                                                    // mb: 4,
                                                                    verticalAlign: 'top',
                                                                    color: 'success.main',
                                                                    textAlign: 'center',
                                                                    mx: 'auto'
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
                                                  align='right'
                                                >
                                                  <>
                                                    {el?.alt_parent?.length > 0
                                                      ? el.alt_parent?.map((nestElm, index) => {
                                                          return (
                                                            <Grid
                                                              key={index}
                                                              container
                                                              direction='column'
                                                              sx={{
                                                                minHeight: 104,
                                                                maxHeight: 104,
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                justifyContent: 'center',

                                                                // mb: 4,
                                                                verticalAlign: 'top'
                                                              }}
                                                            >
                                                              <Typography
                                                                variant='body1'
                                                                sx={{
                                                                  color: 'customColors.moderateSecondary',
                                                                  textAlign: 'left',
                                                                  fontSize: '14px !important',
                                                                  fontWeight: 400
                                                                }}
                                                              >
                                                                Added Alternative
                                                              </Typography>

                                                              {nestElm?.alternate_comments !== '' && (
                                                                <Grid
                                                                  onClick={() => {
                                                                    if (nestElm?.alternate_comments) {
                                                                      setExpandedText(nestElm.alternate_comments)
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

                                                                      ...boxStyles(nestElm.request_status)
                                                                    }}
                                                                  >
                                                                    {nestElm?.alternate_comments}
                                                                  </Typography>
                                                                </Grid>
                                                              )}
                                                            </Grid>
                                                          )
                                                        })
                                                      : null}
                                                    {selectedPharmacy.type === 'central' && (
                                                      <>
                                                        {parseInt(el?.requested_qty) - parseInt(el?.dispatch_qty) >=
                                                          1 &&
                                                          el?.request_status !== 'Alternate' &&
                                                          el?.request_status !== 'Not Available' &&
                                                          el?.request_status !== 'Rejected' && (
                                                            <Grid
                                                              sx={{
                                                                textAlign: 'left',
                                                                minHeight: 104,
                                                                maxHeight: 104,
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                justifyContent: 'center',
                                                                alignContent: 'top',
                                                                alignItems: 'start',
                                                                ...boxStyles(el?.request_status)
                                                              }}
                                                            >
                                                              <MenuWithDots
                                                                options={generateOptions(el, requestItems?.id)}
                                                              />
                                                            </Grid>
                                                          )}
                                                      </>
                                                    )}
                                                    {el?.alt_parent?.length > 0
                                                      ? el.alt_parent
                                                          .filter(item => item.request_status === 'request')
                                                          .map((nestEl, index) => {
                                                            return (
                                                              <Grid
                                                                key={index}
                                                                container
                                                                direction='column'
                                                                sx={{
                                                                  minHeight: 104,
                                                                  maxHeight: 104,
                                                                  display: 'flex',
                                                                  flexDirection: 'column',
                                                                  justifyContent: 'center',
                                                                  alignContent: 'top',
                                                                  alignItems: 'start'
                                                                }}
                                                              >
                                                                {selectedPharmacy.type === 'central' && (
                                                                  <Box sx={{ ...boxStyles(nestEl?.request_status) }}>
                                                                    {parseInt(nestEl?.requested_qty) -
                                                                      parseInt(nestEl?.dispatch_qty) >=
                                                                      1 &&
                                                                      nestEl?.request_status !== 'Alternate' &&
                                                                      nestEl?.request_status !== 'Not Available' &&
                                                                      nestEl?.request_status !== 'Rejected' && (
                                                                        <MenuWithDots
                                                                          options={generateOptions(nestEl, nestEl?.id)}
                                                                        />
                                                                      )}
                                                                  </Box>
                                                                )}
                                                              </Grid>
                                                            )
                                                          })
                                                      : null}
                                                    {el?.alt_parent?.length > 0
                                                      ? el.alt_parent?.map(nestElt => {
                                                          return (
                                                            <>
                                                              {nestElt?.request_status === 'Not Available' && (
                                                                <Grid
                                                                  sx={{
                                                                    minHeight: 104,
                                                                    maxHeight: 104,
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    justifyContent: 'center'
                                                                  }}
                                                                >
                                                                  <Typography
                                                                    variant='body1'
                                                                    sx={{
                                                                      color: 'error.main',
                                                                      textAlign: 'left',
                                                                      fontSize: '14px !important',
                                                                      fontWeight: 400
                                                                    }}
                                                                  >
                                                                    {/* This Product is not available */}
                                                                    Stock Stopped
                                                                  </Typography>
                                                                  {nestElt?.alternate_comments && (
                                                                    <Grid
                                                                      onClick={() => {
                                                                        if (nestElt?.alternate_comments) {
                                                                          setExpandedText(nestElt.alternate_comments)
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

                                                                          ...boxStyles(nestElt.request_status)
                                                                        }}
                                                                      >
                                                                        {nestElt?.alternate_comments}
                                                                      </Typography>
                                                                    </Grid>
                                                                  )}
                                                                </Grid>
                                                              )}
                                                              {nestElt?.request_status === 'Rejected' && (
                                                                <Grid
                                                                  sx={{
                                                                    minHeight: 104,
                                                                    maxHeight: 104,
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    justifyContent: 'center'
                                                                  }}
                                                                >
                                                                  <Typography
                                                                    variant='body1'
                                                                    sx={{
                                                                      color: 'error.main',
                                                                      textAlign: 'left',
                                                                      fontSize: '14px !important',
                                                                      fontWeight: 400
                                                                    }}
                                                                  >
                                                                    {/* This Product was rejected */}
                                                                    Request Declined
                                                                  </Typography>
                                                                  {nestElt?.alternate_comments && (
                                                                    <Grid
                                                                      onClick={() => {
                                                                        if (nestElt?.alternate_comments) {
                                                                          setExpandedText(nestElt.alternate_comments)
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

                                                                          ...boxStyles(nestElt.request_status)
                                                                        }}
                                                                      >
                                                                        {nestElt?.alternate_comments}
                                                                      </Typography>
                                                                    </Grid>
                                                                  )}
                                                                </Grid>
                                                              )}
                                                            </>
                                                          )
                                                        })
                                                      : null}
                                                    {el?.request_status === 'Not Available' && (
                                                      <Grid
                                                        sx={{
                                                          minHeight: 104,
                                                          maxHeight: 104,
                                                          display: 'flex',
                                                          flexDirection: 'column',
                                                          justifyContent: 'center'
                                                        }}
                                                      >
                                                        <Typography
                                                          variant='body1'
                                                          sx={{
                                                            color: 'error.main',
                                                            textAlign: 'left',
                                                            fontSize: '14px !important',
                                                            fontWeight: 400
                                                          }}
                                                        >
                                                          {/* This Product is not available */}
                                                          Stock Stopped
                                                        </Typography>
                                                        {el?.description ||
                                                          (el?.alternate_comments && (
                                                            <Grid
                                                              onClick={() => {
                                                                if (el?.description || el?.alternate_comments) {
                                                                  setExpandedText(
                                                                    el?.description || el?.alternate_comments
                                                                  )
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
                                                                {el?.description || el?.alternate_comments}
                                                              </Typography>
                                                            </Grid>
                                                          ))}
                                                      </Grid>
                                                    )}
                                                    {el?.request_status === 'Rejected' && (
                                                      <Grid
                                                        sx={{
                                                          minHeight: 104,
                                                          maxHeight: 104,
                                                          display: 'flex',
                                                          flexDirection: 'column',
                                                          justifyContent: 'center'
                                                        }}
                                                      >
                                                        <Typography
                                                          variant='body1'
                                                          sx={{
                                                            color: 'error.main',
                                                            textAlign: 'left',
                                                            fontSize: '14px !important',
                                                            fontWeight: 400
                                                          }}
                                                        >
                                                          {/* This Product was rejected */}
                                                          Request Declined
                                                        </Typography>
                                                        {el?.description ||
                                                          (el?.alternate_comments && (
                                                            <Grid
                                                              onClick={() => {
                                                                if (el?.description || el?.alternate_comments) {
                                                                  setExpandedText(
                                                                    el?.description || el?.alternate_comments
                                                                  )
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
                                                                {el?.description || el?.alternate_comments}
                                                              </Typography>
                                                            </Grid>
                                                          ))}
                                                      </Grid>
                                                    )}
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
                            )}
                          </Box>
                        </TabPanel>
                        <TabPanel
                          value='Shipped'
                          sx={{
                            padding: '0 !important'
                          }}
                        >
                          <Box sx={{ my: 5 }}>
                            {shippedItems?.length > 0 ? (
                              <>
                                <Card sx={{ mb: 6, minWidth: '100%', ml: -2, boxShadow: 'none !important' }}>
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
                          </Box>
                        </TabPanel>
                      </>
                    ) : (
                      <>
                        <TabPanel
                          value='Pending'
                          sx={{
                            // display: 'flex',
                            // justifyContent: 'flex-start',
                            padding: '0 !important'
                          }}
                        >
                          <Grid
                            sx={{
                              width: '100%',
                              px: '0 !important'
                            }}
                          >
                            <TabContext value={status}>
                              <TabLists
                                onChange={(event, newValue) => {
                                  setStatus(newValue)
                                }}
                                sx={{ width: '100%', height: '56px', py: '8px', gap: '6px' }}
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
                              <TabPanel
                                value='Pending'
                                sx={{
                                  padding: '0px !important'
                                }}
                              >
                                {requestItems?.request_item_details?.length > 0
                                  ? requestItems?.request_item_details?.filter(
                                      el =>
                                        el?.dispatch_status === 'Not Fulfilled' &&
                                        (el?.request_status !== 'Rejected' || el?.request_status !== 'Not Available')
                                    )?.length > 0 && (
                                      <Card
                                        sx={{
                                          minWidth: '100% !important',
                                          boxShadow: 'none !important'
                                        }}
                                      >
                                        <TableContainer>
                                          <Table
                                            stickyHeader
                                            sx={{ minWidth: 650, maxWidth: '100%', overflowX: 'scroll' }}
                                            aria-label='simple table'
                                          >
                                            <TableHead sx={{ backgroundColor: 'customColors.customTableHeaderBg' }}>
                                              <TableRow sx={{ width: '100%' }}>
                                                <TableCell>S.NO</TableCell>
                                                <TableCell></TableCell>
                                                <TableCell>PRODUCT NAME</TableCell>

                                                <TableCell>QUANTITY</TableCell>
                                                <TableCell
                                                  sx={{
                                                    minWidth: 100
                                                  }}
                                                >
                                                  FULL FILL
                                                </TableCell>
                                                <TableCell>ACTION</TableCell>
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

                                                                minHeight: 104,
                                                                maxHeight: 104,
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                justifyContent: 'center',
                                                                alignContent: 'top',
                                                                alignItems: 'center'
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

                                                                  minHeight: 104,
                                                                  maxHeight: 104,
                                                                  display: 'flex',
                                                                  flexDirection: 'column',
                                                                  justifyContent: 'center',
                                                                  alignContent: 'top',
                                                                  alignItems: 'center'
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

                                                            {el?.alt_parent?.length > 0
                                                              ? el.alt_parent.map((el, index) => {
                                                                  return (
                                                                    <Grid
                                                                      key={index}
                                                                      sx={{
                                                                        minHeight: 104,
                                                                        maxHeight: 104,
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        justifyContent: 'center',
                                                                        alignContent: 'top',
                                                                        alignItems: 'center'
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
                                                                          backgroundColor:
                                                                            'customColors.neutralSecondary'
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

                                                              verticalAlign: 'top',

                                                              height: 'auto'
                                                            }}
                                                          >
                                                            <Box
                                                              sx={{
                                                                minHeight: 104,
                                                                maxHeight: 104,
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                justifyContent: 'center',
                                                                verticalAlign: 'top'
                                                              }}
                                                            >
                                                              <Typography variant='body1' sx={{ fontWeight: 600 }}>
                                                                <Tooltip title={el.stock_name} placement='top'>
                                                                  <Typography
                                                                    variant='body1'
                                                                    sx={{
                                                                      fontWeight: 600,
                                                                      color: 'customColors.OnSecondaryContainer',

                                                                      display: 'flex',
                                                                      alignItems: 'center',
                                                                      fontSize: '16px !important',
                                                                      fontWeight: 600
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
                                                                <Typography
                                                                  variant='body1'
                                                                  sx={{
                                                                    color: 'text.primary',
                                                                    display: { xs: 'none', md: 'none', lg: 'block' },
                                                                    fontSize: '14px !important',
                                                                    fontWeight: 400
                                                                  }}
                                                                >
                                                                  {`${el?.package} of ${el?.package_qty} ${el?.package_uom_label} ${el?.product_form_label}`}
                                                                </Typography>
                                                              </Tooltip>
                                                              <Tooltip title={el?.manufacturer} placement='top'>
                                                                <Typography
                                                                  variant='body1'
                                                                  sx={{
                                                                    color: 'text.primary',
                                                                    display: { xs: 'none', md: 'none', lg: 'block' },
                                                                    fontSize: '14px !important',
                                                                    fontWeight: 400
                                                                  }}
                                                                >
                                                                  {el?.manufacturer}
                                                                </Typography>
                                                              </Tooltip>

                                                              {el?.description || el.alternate_comments ? (
                                                                <Grid
                                                                  onClick={() => {
                                                                    if (el?.description || el.alternate_comments) {
                                                                      setExpandedText(
                                                                        el?.description || el.alternate_comments
                                                                      )
                                                                      openNotesDialog()
                                                                    }
                                                                  }}
                                                                  sx={{
                                                                    display: 'flex',
                                                                    color: 'customColors.neutralSecondary',
                                                                    width: '100%',

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
                                                                    {el?.description || el.alternate_comments}
                                                                  </Typography>
                                                                </Grid>
                                                              ) : null}
                                                              {parseInt(el?.prescription_required) == 1 ? (
                                                                <Grid
                                                                  sx={{
                                                                    display: 'flex',
                                                                    width: '100%',

                                                                    // my: 2,
                                                                    // gap: 1,
                                                                    cursor: 'pointer'
                                                                  }}
                                                                >
                                                                  <Box>{renderAttachmentIcons(el)}</Box>
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
                                                                      sx={{
                                                                        minHeight: 104,
                                                                        maxHeight: 104,
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        justifyContent: 'center',
                                                                        flexWrap: 'nowrap',
                                                                        my: 1

                                                                        // mb: 4,
                                                                      }}
                                                                    >
                                                                      <Box>
                                                                        <Typography
                                                                          variant='body1'
                                                                          sx={{ fontWeight: 600 }}
                                                                        >
                                                                          <Tooltip
                                                                            title={el.stock_name}
                                                                            placement='top'
                                                                          >
                                                                            <Typography
                                                                              variant='body1'
                                                                              sx={{
                                                                                fontWeight: 600,
                                                                                color:
                                                                                  'customColors.OnSecondaryContainer',

                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                fontSize: '16px !important',
                                                                                fontWeight: 600
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
                                                                              parseInt(el?.prescription_required) ==
                                                                                1 ? (
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
                                                                            sx={{
                                                                              color: 'text.primary',
                                                                              display: {
                                                                                xs: 'none',
                                                                                md: 'none',
                                                                                lg: 'block'
                                                                              },
                                                                              fontSize: '14px !important',
                                                                              fontWeight: 400
                                                                            }}
                                                                          >
                                                                            {`${el?.package} of ${el?.package_qty} ${el?.package_uom_label} ${el?.product_form_label}`}
                                                                          </Typography>
                                                                        </Tooltip>
                                                                        <Tooltip
                                                                          title={el?.manufacturer}
                                                                          placement='top'
                                                                        >
                                                                          <Typography
                                                                            variant='body1'
                                                                            sx={{
                                                                              color: 'text.primary',
                                                                              display: {
                                                                                xs: 'none',
                                                                                md: 'none',
                                                                                lg: 'block'
                                                                              },
                                                                              fontSize: '14px !important',
                                                                              fontWeight: 400
                                                                            }}
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

                                                                              cursor: 'pointer'
                                                                            }}
                                                                          >
                                                                            <Icon
                                                                              icon={
                                                                                'material-symbols:description-outline'
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
                                                                        ) : null}
                                                                        {parseInt(el?.prescription_required) == 1 ? (
                                                                          <Grid
                                                                            sx={{
                                                                              display: 'flex',

                                                                              width: '100%',

                                                                              // mb: 2,
                                                                              // gap: 1,
                                                                              cursor: 'pointer'
                                                                            }}
                                                                          >
                                                                            <Box>{renderAttachmentIcons(el)}</Box>
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
                                                                minHeight: 104,
                                                                maxHeight: 104,
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                justifyContent: 'center'

                                                                // mb: 4
                                                              }}
                                                            >
                                                              <Typography
                                                                variant='body1'
                                                                sx={{
                                                                  color: 'text.primary',
                                                                  fontSize: '14px !important',
                                                                  fontWeight: 400
                                                                }}
                                                              >
                                                                Requested:{el?.requested_qty}
                                                              </Typography>
                                                              <Typography
                                                                variant='body1'
                                                                sx={{
                                                                  color: 'text.primary',
                                                                  fontSize: '14px !important',
                                                                  fontWeight: 400
                                                                }}
                                                              >
                                                                Fullfilled:{el?.dispatch_qty}
                                                              </Typography>{' '}
                                                              <Typography
                                                                variant='body1'
                                                                sx={{
                                                                  color: 'text.primary',
                                                                  fontSize: '14px !important',
                                                                  fontWeight: 400
                                                                }}
                                                              >
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
                                                                      sx={{
                                                                        minHeight: 104,
                                                                        maxHeight: 104,
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        justifyContent: 'center'

                                                                        // mb: 4
                                                                      }}
                                                                    >
                                                                      <Typography
                                                                        variant='body1'
                                                                        sx={{
                                                                          color: 'text.primary',
                                                                          fontSize: '14px !important',
                                                                          fontWeight: 400
                                                                        }}
                                                                      >
                                                                        Requested:{el?.requested_qty}
                                                                      </Typography>
                                                                      <Typography
                                                                        variant='body1'
                                                                        sx={{
                                                                          color: 'text.primary',
                                                                          fontSize: '14px !important',
                                                                          fontWeight: 400
                                                                        }}
                                                                      >
                                                                        Fullfilled:{el?.dispatch_qty}
                                                                      </Typography>{' '}
                                                                      <Typography
                                                                        variant='body1'
                                                                        sx={{
                                                                          color: 'text.primary',
                                                                          fontSize: '14px !important',
                                                                          fontWeight: 400
                                                                        }}
                                                                      >
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
                                                              parseInt(el.requested_qty) - parseInt(el.dispatch_qty) >=
                                                                1 &&
                                                              requestItems.status !== 'Cancelled' &&
                                                              el.request_status !== 'Alternate' &&
                                                              el.request_status !== 'Not Available' &&
                                                              el.request_status !== 'Rejected' ? (
                                                                <Grid
                                                                  sx={{
                                                                    verticalAlign: 'top',
                                                                    minHeight: 104,
                                                                    maxHeight: 104,
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    justifyContent: 'center'
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
                                                                      parseInt(el.requested_qty) -
                                                                        parseInt(el.dispatch_qty) >=
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
                                                                    minHeight: 104,
                                                                    maxHeight: 104,
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    textAlign: 'center',
                                                                    justifyContent: 'center',
                                                                    justifyItems: 'center',
                                                                    mx: 'auto'
                                                                  }}
                                                                >
                                                                  {el.request_status === 'Not Available' && (
                                                                    <Typography
                                                                      variant='body1'
                                                                      sx={{
                                                                        color: 'error.main',
                                                                        fontSize: '14px !important',
                                                                        fontWeight: 400
                                                                      }}
                                                                    >
                                                                      This Product is not available
                                                                    </Typography>
                                                                  )}
                                                                  {el.request_status === 'Rejected' && (
                                                                    <Typography
                                                                      variant='body1'
                                                                      sx={{
                                                                        color: 'error.main',
                                                                        fontSize: '14px !important',
                                                                        fontWeight: 400
                                                                      }}
                                                                    >
                                                                      This Product was rejected
                                                                    </Typography>
                                                                  )}

                                                                  {el.alt_parent.length === 0 &&
                                                                    el?.dispatch_status === 'Fulfilled' &&
                                                                    el?.request_status !== 'Not Available' &&
                                                                    el?.request_status !== 'Rejected' && (
                                                                      <Grid
                                                                        sx={{
                                                                          color: 'success.main',
                                                                          minHeight: 104,
                                                                          maxHeight: 104,
                                                                          display: 'flex',
                                                                          flexDirection: 'column',
                                                                          justifyContent: 'center',
                                                                          mx: 'auto',
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
                                                                ? el.alt_parent.map((nestElm, index) => {
                                                                    return (
                                                                      <Grid
                                                                        key={index}
                                                                        direction='column'
                                                                        sx={{
                                                                          minHeight: 104,
                                                                          maxHeight: 104,
                                                                          display: 'flex',
                                                                          flexDirection: 'column',
                                                                          justifyContent: 'center',
                                                                          mx: 'auto',
                                                                          textAlign: 'center'
                                                                        }}
                                                                      >
                                                                        <Box>
                                                                          {selectedPharmacy.type === 'central' &&
                                                                          parseInt(nestElm.requested_qty) -
                                                                            parseInt(nestElm.dispatch_qty) >=
                                                                            1 &&
                                                                          requestItems.status !== 'Cancelled' &&
                                                                          nestElm.request_status !== 'Alternate' &&
                                                                          nestElm.request_status !== 'Not Available' &&
                                                                          nestElm.request_status !== 'Rejected' ? (
                                                                            <Button
                                                                              size='small'
                                                                              sx={{
                                                                                width: 100,
                                                                                mx: 'auto',
                                                                                ...boxStyles(nestElm.request_status)
                                                                              }}
                                                                              variant='contained'
                                                                              onClick={() => {
                                                                                setFulfillMedicine({
                                                                                  ...nestElm
                                                                                })

                                                                                showDialog()
                                                                              }}
                                                                            >
                                                                              Fullfill
                                                                            </Button>
                                                                          ) : null}
                                                                        </Box>
                                                                        {nestElm?.request_status ===
                                                                          'Not Available' && (
                                                                          <Grid
                                                                            sx={{
                                                                              minHeight: 104,
                                                                              maxHeight: 104,
                                                                              display: 'flex',
                                                                              flexDirection: 'column',
                                                                              justifyContent: 'center',

                                                                              // mb: 4,
                                                                              verticalAlign: 'top'
                                                                            }}
                                                                          >
                                                                            <Typography
                                                                              variant='body1'
                                                                              sx={{
                                                                                color: 'error.main',
                                                                                fontSize: '14px !important',
                                                                                fontWeight: 400
                                                                              }}
                                                                            >
                                                                              This Product is not available
                                                                            </Typography>
                                                                          </Grid>
                                                                        )}

                                                                        {nestElm?.request_status === 'Rejected' && (
                                                                          <Grid
                                                                            sx={{
                                                                              minHeight: 104,
                                                                              maxHeight: 104,
                                                                              display: 'flex',
                                                                              flexDirection: 'column',
                                                                              justifyContent: 'center',

                                                                              // mb: 4,
                                                                              verticalAlign: 'top'
                                                                            }}
                                                                          >
                                                                            <Typography
                                                                              variant='body1'
                                                                              sx={{
                                                                                color: 'error.main',
                                                                                fontSize: '14px !important',
                                                                                fontWeight: 400
                                                                              }}
                                                                            >
                                                                              This Product was rejected
                                                                            </Typography>
                                                                          </Grid>
                                                                        )}
                                                                        {nestElm?.dispatch_qty ===
                                                                          nestElm?.requested_qty && (
                                                                          <Box
                                                                            sx={{
                                                                              minHeight: 104,
                                                                              maxHeight: 104,
                                                                              display: 'flex',
                                                                              flexDirection: 'column',
                                                                              justifyContent: 'center',

                                                                              // mb: 4,
                                                                              verticalAlign: 'top',
                                                                              color: 'success.main',
                                                                              textAlign: 'center',
                                                                              border: '1px solid red'
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
                                                                          minHeight: 104,
                                                                          maxHeight: 104,
                                                                          display: 'flex',
                                                                          flexDirection: 'column',
                                                                          justifyContent: 'center',

                                                                          // mb: 4,
                                                                          verticalAlign: 'top'
                                                                        }}
                                                                      >
                                                                        <Typography
                                                                          variant='body1'
                                                                          sx={{
                                                                            color: 'text.primary',
                                                                            textAlign: 'left',
                                                                            fontSize: '14px !important',
                                                                            fontWeight: 400,
                                                                            color: 'customColors.moderateSecondary'
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
                                                                <>
                                                                  {parseInt(el?.requested_qty) -
                                                                    parseInt(el?.dispatch_qty) >=
                                                                    1 &&
                                                                    el?.request_status !== 'Alternate' &&
                                                                    el?.request_status !== 'Not Available' &&
                                                                    el?.request_status !== 'Rejected' && (
                                                                      <Grid
                                                                        sx={{
                                                                          textAlign: 'left',
                                                                          minHeight: 104,
                                                                          maxHeight: 104,
                                                                          display: 'flex',
                                                                          flexDirection: 'column',
                                                                          justifyContent: 'center',
                                                                          alignContent: 'top',
                                                                          alignItems: 'start',
                                                                          ...boxStyles(el?.request_status)
                                                                        }}
                                                                      >
                                                                        <MenuWithDots
                                                                          options={generateOptions(
                                                                            el,
                                                                            requestItems?.id
                                                                          )}
                                                                        />
                                                                      </Grid>
                                                                    )}
                                                                </>
                                                              )}
                                                              {el?.alt_parent?.length > 0
                                                                ? el.alt_parent
                                                                    .filter(item => item.request_status === 'request')
                                                                    .map((nesEl, index) => {
                                                                      return (
                                                                        <Grid
                                                                          key={index}
                                                                          container
                                                                          direction='column'
                                                                          sx={{
                                                                            minHeight: 104,
                                                                            maxHeight: 104,
                                                                            display: 'flex',
                                                                            flexDirection: 'column',
                                                                            justifyContent: 'center',
                                                                            alignContent: 'top',
                                                                            alignItems: 'start'
                                                                          }}
                                                                        >
                                                                          {selectedPharmacy.type === 'central' && (
                                                                            <Box
                                                                              sx={{
                                                                                ...boxStyles(nesEl?.request_status)
                                                                              }}
                                                                            >
                                                                              {parseInt(nesEl?.requested_qty) -
                                                                                parseInt(nesEl?.dispatch_qty) >=
                                                                                1 &&
                                                                                nesEl?.request_status !== 'Alternate' &&
                                                                                nesEl?.request_status !==
                                                                                  'Not Available' &&
                                                                                nesEl?.request_status !==
                                                                                  'Rejected' && (
                                                                                  <MenuWithDots
                                                                                    options={generateOptions(
                                                                                      nesEl,
                                                                                      nesEl?.id
                                                                                    )}
                                                                                  />
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
                                    )
                                  : null}
                              </TabPanel>
                              <TabPanel
                                value='All'
                                sx={{
                                  padding: '0px !important'
                                }}
                              >
                                {requestItems?.request_item_details.length > 0 && (
                                  <Card
                                    sx={{
                                      // ml: -3,
                                      minWidth: '100% !important',
                                      boxShadow: 'none !important'
                                    }}
                                  >
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
                                            <TableCell
                                              sx={{
                                                minWidth: 100
                                              }}
                                            >
                                              FULL FILL
                                            </TableCell>
                                            <TableCell>ACTION</TableCell>
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

                                                          minHeight: 104,
                                                          maxHeight: 104,
                                                          display: 'flex',
                                                          flexDirection: 'column',
                                                          justifyContent: 'center',
                                                          alignContent: 'top',
                                                          alignItems: 'center'
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

                                                            minHeight: 104,
                                                            maxHeight: 104,
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            justifyContent: 'center',
                                                            alignContent: 'top',
                                                            alignItems: 'center'
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

                                                      {el?.alt_parent?.length > 0
                                                        ? el.alt_parent.map((el, index) => {
                                                            return (
                                                              <Grid
                                                                key={index}
                                                                sx={{
                                                                  minHeight: 104,
                                                                  maxHeight: 104,
                                                                  display: 'flex',
                                                                  flexDirection: 'column',
                                                                  justifyContent: 'center',
                                                                  alignContent: 'top',
                                                                  alignItems: 'center'
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
                                                                    backgroundColor: 'customColors.neutralSecondary'
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

                                                        verticalAlign: 'top',

                                                        height: 'auto'
                                                      }}
                                                    >
                                                      <Box
                                                        sx={{
                                                          minHeight: 104,
                                                          maxHeight: 104,
                                                          display: 'flex',
                                                          flexDirection: 'column',
                                                          justifyContent: 'center',
                                                          verticalAlign: 'top'
                                                        }}
                                                      >
                                                        <Typography variant='body1' sx={{ fontWeight: 600 }}>
                                                          <Tooltip title={el.stock_name} placement='top'>
                                                            <Typography
                                                              variant='body1'
                                                              sx={{
                                                                fontSize: '16px !important',

                                                                fontWeight: 600,
                                                                color: 'customColors.OnSecondaryContainer',

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
                                                          <Typography
                                                            variant='body1'
                                                            sx={{
                                                              color: 'text.primary',
                                                              display: { xs: 'none', md: 'none', lg: 'block' },
                                                              fontSize: '14px !important',

                                                              fontWeight: 400
                                                            }}
                                                          >
                                                            {`${el?.package} of ${el?.package_qty} ${el?.package_uom_label} ${el?.product_form_label}`}
                                                          </Typography>
                                                        </Tooltip>
                                                        <Tooltip title={el?.manufacturer} placement='top'>
                                                          <Typography
                                                            variant='body1'
                                                            sx={{
                                                              color: 'text.primary',
                                                              display: { xs: 'none', md: 'none', lg: 'block' },
                                                              fontSize: '14px !important',
                                                              fontWeight: 400
                                                            }}
                                                          >
                                                            {el?.manufacturer}
                                                          </Typography>
                                                        </Tooltip>

                                                        {el?.description || el?.alternate_comments ? (
                                                          <Grid
                                                            onClick={() => {
                                                              if (el?.description || el.alternate_comments) {
                                                                setExpandedText(
                                                                  el?.description || el?.alternate_comments
                                                                )
                                                                openNotesDialog()
                                                              }
                                                            }}
                                                            sx={{
                                                              display: 'flex',
                                                              color: 'customColors.neutralSecondary',
                                                              width: '100%',

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
                                                              {el?.description || el?.alternate_comments}
                                                            </Typography>
                                                          </Grid>
                                                        ) : null}
                                                        {parseInt(el?.prescription_required) == 1 ? (
                                                          <Grid
                                                            sx={{
                                                              display: 'flex',
                                                              width: '100%',

                                                              // my: 2,
                                                              // gap: 1,
                                                              cursor: 'pointer'
                                                            }}
                                                          >
                                                            <Box>{renderAttachmentIcons(el)}</Box>
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
                                                                sx={{
                                                                  minHeight: 104,
                                                                  maxHeight: 104,
                                                                  display: 'flex',
                                                                  flexDirection: 'column',
                                                                  justifyContent: 'center',
                                                                  flexWrap: 'nowrap',
                                                                  my: 1

                                                                  // mb: 4,
                                                                }}
                                                              >
                                                                <Box>
                                                                  <Typography variant='body1' sx={{ fontWeight: 600 }}>
                                                                    <Tooltip title={el.stock_name} placement='top'>
                                                                      <Typography
                                                                        variant='body1'
                                                                        sx={{
                                                                          fontSize: '16px !important',

                                                                          fontWeight: 600,
                                                                          color: 'customColors.OnSecondaryContainer',

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
                                                                      sx={{
                                                                        color: 'text.primary',
                                                                        display: {
                                                                          xs: 'none',
                                                                          md: 'none',
                                                                          lg: 'block'
                                                                        },
                                                                        fontSize: '14px !important',
                                                                        fontWeight: 400
                                                                      }}
                                                                    >
                                                                      {`${el?.package} of ${el?.package_qty} ${el?.package_uom_label} ${el?.product_form_label}`}
                                                                    </Typography>
                                                                  </Tooltip>
                                                                  <Tooltip title={el?.manufacturer} placement='top'>
                                                                    <Typography
                                                                      variant='body1'
                                                                      sx={{
                                                                        color: 'text.primary',
                                                                        display: {
                                                                          xs: 'none',
                                                                          md: 'none',
                                                                          lg: 'block'
                                                                        },
                                                                        fontSize: '14px !important',
                                                                        fontWeight: 400
                                                                      }}
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

                                                                        // mb: 2,
                                                                        // gap: 1,
                                                                        cursor: 'pointer'
                                                                      }}
                                                                    >
                                                                      <Box>{renderAttachmentIcons(el)}</Box>
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
                                                          minHeight: 104,
                                                          maxHeight: 104,
                                                          display: 'flex',
                                                          flexDirection: 'column',
                                                          justifyContent: 'center'

                                                          // mb: 4
                                                        }}
                                                      >
                                                        <Typography
                                                          variant='body1'
                                                          sx={{
                                                            color: 'text.primary',
                                                            fontSize: '14px !important',
                                                            fontWeight: 400
                                                          }}
                                                        >
                                                          Requested:{el?.requested_qty}
                                                        </Typography>
                                                        <Typography
                                                          variant='body1'
                                                          sx={{
                                                            color: 'text.primary',
                                                            fontSize: '14px !important',
                                                            fontWeight: 400
                                                          }}
                                                        >
                                                          Fullfilled:{el?.dispatch_qty}
                                                        </Typography>{' '}
                                                        <Typography
                                                          variant='body1'
                                                          sx={{
                                                            color: 'text.primary',
                                                            fontSize: '14px !important',
                                                            fontWeight: 400
                                                          }}
                                                        >
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
                                                                sx={{
                                                                  minHeight: 104,
                                                                  maxHeight: 104,
                                                                  display: 'flex',
                                                                  flexDirection: 'column',
                                                                  justifyContent: 'center'

                                                                  // mb: 4
                                                                }}
                                                              >
                                                                <Typography
                                                                  variant='body1'
                                                                  sx={{
                                                                    color: 'text.primary',
                                                                    fontSize: '14px !important',
                                                                    fontWeight: 400
                                                                  }}
                                                                >
                                                                  Requested:{el?.requested_qty}
                                                                </Typography>
                                                                <Typography
                                                                  variant='body1'
                                                                  sx={{
                                                                    color: 'text.primary',
                                                                    fontSize: '14px !important',
                                                                    fontWeight: 400
                                                                  }}
                                                                >
                                                                  Fullfilled:{el?.dispatch_qty}
                                                                </Typography>{' '}
                                                                <Typography
                                                                  variant='body1'
                                                                  sx={{
                                                                    color: 'text.primary',
                                                                    fontSize: '14px !important',
                                                                    fontWeight: 400
                                                                  }}
                                                                >
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
                                                              minHeight: 104,
                                                              maxHeight: 104,
                                                              display: 'flex',
                                                              flexDirection: 'column',
                                                              justifyContent: 'center'
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
                                                                parseInt(el.requested_qty) -
                                                                  parseInt(el.dispatch_qty) >=
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
                                                              Fulfill
                                                            </Button>
                                                          </Grid>
                                                        ) : (
                                                          <Grid
                                                            sx={{
                                                              verticalAlign: 'top',
                                                              minHeight: 104,
                                                              maxHeight: 104,
                                                              display: 'flex',
                                                              flexDirection: 'column',
                                                              textAlign: 'center',
                                                              justifyContent: 'center',
                                                              justifyItems: 'center',
                                                              mx: 'auto'
                                                            }}
                                                          >
                                                            {el.request_status === 'Not Available' && (
                                                              <Button
                                                                size='small'
                                                                sx={{
                                                                  width: 100,
                                                                  mx: 'auto',
                                                                  ...boxStyles(el.request_status)
                                                                }}
                                                                disabled={
                                                                  parseInt(el.requested_qty) -
                                                                    parseInt(el.dispatch_qty) >=
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
                                                                Fulfill
                                                              </Button>
                                                            )}
                                                            {el.request_status === 'Rejected' && (
                                                              <Button
                                                                size='small'
                                                                sx={{
                                                                  width: 100,
                                                                  mx: 'auto',
                                                                  ...boxStyles(el.request_status)
                                                                }}
                                                                disabled={
                                                                  parseInt(el.requested_qty) -
                                                                    parseInt(el.dispatch_qty) >=
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
                                                                Fulfill
                                                              </Button>
                                                            )}
                                                            {el.alt_parent.length === 0 &&
                                                              el?.dispatch_status === 'Fulfilled' &&
                                                              el?.request_status !== 'Not Available' &&
                                                              el?.request_status !== 'Rejected' && (
                                                                <Grid
                                                                  sx={{
                                                                    color: 'success.main',
                                                                    minHeight: 104,
                                                                    maxHeight: 104,
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    justifyContent: 'center',
                                                                    mx: 'auto',
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
                                                          ? el.alt_parent.map((nesElm, index) => {
                                                              return (
                                                                <Grid
                                                                  key={index}
                                                                  direction='column'
                                                                  sx={{
                                                                    minHeight: 104,
                                                                    maxHeight: 104,
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    justifyContent: 'center',
                                                                    mx: 'auto',
                                                                    textAlign: 'center'
                                                                  }}
                                                                >
                                                                  <Box>
                                                                    {selectedPharmacy.type === 'central' &&
                                                                    parseInt(nesElm.requested_qty) -
                                                                      parseInt(nesElm.dispatch_qty) >=
                                                                      1 &&
                                                                    requestItems.status !== 'Cancelled' &&
                                                                    nesElm.request_status !== 'Alternate' &&
                                                                    nesElm.request_status !== 'Not Available' &&
                                                                    nesElm.request_status !== 'Rejected' ? (
                                                                      <Button
                                                                        size='small'
                                                                        sx={{
                                                                          width: 100,
                                                                          mx: 'auto',
                                                                          ...boxStyles(nesElm.request_status)
                                                                        }}
                                                                        variant='contained'
                                                                        onClick={() => {
                                                                          setFulfillMedicine({
                                                                            ...nesElm
                                                                          })

                                                                          showDialog()
                                                                        }}
                                                                      >
                                                                        Fulfill
                                                                      </Button>
                                                                    ) : null}
                                                                  </Box>
                                                                  {nesElm?.request_status === 'Not Available' && (
                                                                    <Grid
                                                                      sx={{
                                                                        minHeight: 104,
                                                                        maxHeight: 104,
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        justifyContent: 'center',

                                                                        // mb: 4,
                                                                        verticalAlign: 'top'
                                                                      }}
                                                                    >
                                                                      {/* <Typography
                                                    variant='body1'
                                                    sx={{
                                                      color: 'error.main',
                                                      fontSize: '14px !important',
                                                      fontWeight: 400
                                                    }}
                                                  >
                                                    This Product is not available
                                                  </Typography> */}
                                                                      <Button
                                                                        size='small'
                                                                        sx={{
                                                                          width: 100,
                                                                          mx: 'auto',
                                                                          ...boxStyles(nesElm?.request_status)
                                                                        }}
                                                                        disabled={
                                                                          parseInt(nesElm?.requested_qty) -
                                                                            parseInt(nesElm?.dispatch_qty) >=
                                                                            1 &&
                                                                          requestItems.status !== 'Cancelled' &&
                                                                          nesElm?.request_status !== 'Alternate' &&
                                                                          nesElm?.request_status !== 'Not Available' &&
                                                                          nesElm?.request_status !== 'Rejected'
                                                                            ? false
                                                                            : true
                                                                        }
                                                                        variant='contained'
                                                                        onClick={() => {
                                                                          setFulfillMedicine({
                                                                            ...nesElm
                                                                          })

                                                                          showDialog()
                                                                        }}
                                                                      >
                                                                        Fulfill
                                                                      </Button>
                                                                    </Grid>
                                                                  )}

                                                                  {nesElm?.request_status === 'Rejected' && (
                                                                    <Grid
                                                                      sx={{
                                                                        minHeight: 104,
                                                                        maxHeight: 104,
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        justifyContent: 'center',

                                                                        // mb: 4,
                                                                        verticalAlign: 'top'
                                                                      }}
                                                                    >
                                                                      {/* <Typography
                                                    variant='body1'
                                                    sx={{
                                                      color: 'error.main',
                                                      fontSize: '14px !important',
                                                      fontWeight: 400
                                                    }}
                                                  >
                                                    This Product was rejected
                                                  </Typography> */}
                                                                      <Button
                                                                        size='small'
                                                                        sx={{
                                                                          width: 100,
                                                                          mx: 'auto',
                                                                          ...boxStyles(nesElm?.request_status)
                                                                        }}
                                                                        disabled={
                                                                          parseInt(nesElm?.requested_qty) -
                                                                            parseInt(nesElm?.dispatch_qty) >=
                                                                            1 &&
                                                                          requestItems.status !== 'Cancelled' &&
                                                                          nesElm?.request_status !== 'Alternate' &&
                                                                          nesElm?.request_status !== 'Not Available' &&
                                                                          nesElm?.request_status !== 'Rejected'
                                                                            ? false
                                                                            : true
                                                                        }
                                                                        variant='contained'
                                                                        onClick={() => {
                                                                          setFulfillMedicine({
                                                                            ...nesElm
                                                                          })

                                                                          showDialog()
                                                                        }}
                                                                      >
                                                                        Fulfill
                                                                      </Button>
                                                                    </Grid>
                                                                  )}
                                                                  {nesElm?.dispatch_qty === nesElm?.requested_qty && (
                                                                    <Box
                                                                      sx={{
                                                                        minHeight: 104,
                                                                        maxHeight: 104,
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        justifyContent: 'center',

                                                                        // mb: 4,
                                                                        verticalAlign: 'top',
                                                                        color: 'success.main',
                                                                        textAlign: 'center',
                                                                        mx: 'auto'
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
                                                      align='right'
                                                    >
                                                      <>
                                                        {el?.alt_parent?.length > 0
                                                          ? el.alt_parent?.map((nestElm, index) => {
                                                              return (
                                                                <Grid
                                                                  key={index}
                                                                  container
                                                                  direction='column'
                                                                  sx={{
                                                                    minHeight: 104,
                                                                    maxHeight: 104,
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    justifyContent: 'center',

                                                                    // mb: 4,
                                                                    verticalAlign: 'top'
                                                                  }}
                                                                >
                                                                  <Typography
                                                                    variant='body1'
                                                                    sx={{
                                                                      color: 'customColors.moderateSecondary',
                                                                      textAlign: 'left',
                                                                      fontSize: '14px !important',
                                                                      fontWeight: 400
                                                                    }}
                                                                  >
                                                                    Added Alternative
                                                                  </Typography>

                                                                  {nestElm?.alternate_comments !== '' && (
                                                                    <Grid
                                                                      onClick={() => {
                                                                        if (nestElm?.alternate_comments) {
                                                                          setExpandedText(nestElm.alternate_comments)
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

                                                                          ...boxStyles(nestElm.request_status)
                                                                        }}
                                                                      >
                                                                        {nestElm?.alternate_comments}
                                                                      </Typography>
                                                                    </Grid>
                                                                  )}
                                                                </Grid>
                                                              )
                                                            })
                                                          : null}
                                                        {selectedPharmacy.type === 'central' && (
                                                          <>
                                                            {parseInt(el?.requested_qty) - parseInt(el?.dispatch_qty) >=
                                                              1 &&
                                                              el?.request_status !== 'Alternate' &&
                                                              el?.request_status !== 'Not Available' &&
                                                              el?.request_status !== 'Rejected' && (
                                                                <Grid
                                                                  sx={{
                                                                    textAlign: 'left',
                                                                    minHeight: 104,
                                                                    maxHeight: 104,
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    justifyContent: 'center',
                                                                    alignContent: 'top',
                                                                    alignItems: 'start',
                                                                    ...boxStyles(el?.request_status)
                                                                  }}
                                                                >
                                                                  <MenuWithDots
                                                                    options={generateOptions(el, requestItems?.id)}
                                                                  />
                                                                </Grid>
                                                              )}
                                                          </>
                                                        )}
                                                        {el?.alt_parent?.length > 0
                                                          ? el.alt_parent
                                                              .filter(item => item.request_status === 'request')
                                                              .map((nestEl, index) => {
                                                                return (
                                                                  <Grid
                                                                    key={index}
                                                                    container
                                                                    direction='column'
                                                                    sx={{
                                                                      minHeight: 104,
                                                                      maxHeight: 104,
                                                                      display: 'flex',
                                                                      flexDirection: 'column',
                                                                      justifyContent: 'center',
                                                                      alignContent: 'top',
                                                                      alignItems: 'start'
                                                                    }}
                                                                  >
                                                                    {selectedPharmacy.type === 'central' && (
                                                                      <Box
                                                                        sx={{ ...boxStyles(nestEl?.request_status) }}
                                                                      >
                                                                        {parseInt(nestEl?.requested_qty) -
                                                                          parseInt(nestEl?.dispatch_qty) >=
                                                                          1 &&
                                                                          nestEl?.request_status !== 'Alternate' &&
                                                                          nestEl?.request_status !== 'Not Available' &&
                                                                          nestEl?.request_status !== 'Rejected' && (
                                                                            <MenuWithDots
                                                                              options={generateOptions(
                                                                                nestEl,
                                                                                nestEl?.id
                                                                              )}
                                                                            />
                                                                          )}
                                                                      </Box>
                                                                    )}
                                                                  </Grid>
                                                                )
                                                              })
                                                          : null}
                                                        {el?.alt_parent?.length > 0
                                                          ? el.alt_parent?.map(nestElt => {
                                                              return (
                                                                <>
                                                                  {nestElt?.request_status === 'Not Available' && (
                                                                    <Grid
                                                                      sx={{
                                                                        minHeight: 104,
                                                                        maxHeight: 104,
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        justifyContent: 'center'
                                                                      }}
                                                                    >
                                                                      <Typography
                                                                        variant='body1'
                                                                        sx={{
                                                                          color: 'error.main',
                                                                          textAlign: 'left',
                                                                          fontSize: '14px !important',
                                                                          fontWeight: 400
                                                                        }}
                                                                      >
                                                                        {/* This Product is not available */}
                                                                        Stock Stopped
                                                                      </Typography>
                                                                      {nestElt?.alternate_comments && (
                                                                        <Grid
                                                                          onClick={() => {
                                                                            if (nestElt?.alternate_comments) {
                                                                              setExpandedText(
                                                                                nestElt.alternate_comments
                                                                              )
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

                                                                              ...boxStyles(nestElt.request_status)
                                                                            }}
                                                                          >
                                                                            {nestElt?.alternate_comments}
                                                                          </Typography>
                                                                        </Grid>
                                                                      )}
                                                                    </Grid>
                                                                  )}
                                                                  {nestElt?.request_status === 'Rejected' && (
                                                                    <Grid
                                                                      sx={{
                                                                        minHeight: 104,
                                                                        maxHeight: 104,
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        justifyContent: 'center'
                                                                      }}
                                                                    >
                                                                      <Typography
                                                                        variant='body1'
                                                                        sx={{
                                                                          color: 'error.main',
                                                                          textAlign: 'left',
                                                                          fontSize: '14px !important',
                                                                          fontWeight: 400
                                                                        }}
                                                                      >
                                                                        {/* This Product was rejected */}
                                                                        Request Declined
                                                                      </Typography>
                                                                      {nestElt?.alternate_comments && (
                                                                        <Grid
                                                                          onClick={() => {
                                                                            if (nestElt?.alternate_comments) {
                                                                              setExpandedText(
                                                                                nestElt.alternate_comments
                                                                              )
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

                                                                              ...boxStyles(nestElt.request_status)
                                                                            }}
                                                                          >
                                                                            {nestElt?.alternate_comments}
                                                                          </Typography>
                                                                        </Grid>
                                                                      )}
                                                                    </Grid>
                                                                  )}
                                                                </>
                                                              )
                                                            })
                                                          : null}
                                                        {el?.request_status === 'Not Available' && (
                                                          <Grid
                                                            sx={{
                                                              minHeight: 104,
                                                              maxHeight: 104,
                                                              display: 'flex',
                                                              flexDirection: 'column',
                                                              justifyContent: 'center'
                                                            }}
                                                          >
                                                            <Typography
                                                              variant='body1'
                                                              sx={{
                                                                color: 'error.main',
                                                                textAlign: 'left',
                                                                fontSize: '14px !important',
                                                                fontWeight: 400
                                                              }}
                                                            >
                                                              {/* This Product is not available */}
                                                              Stock Stopped
                                                            </Typography>
                                                            {el?.description ||
                                                              (el?.alternate_comments && (
                                                                <Grid
                                                                  onClick={() => {
                                                                    if (el?.description || el?.alternate_comments) {
                                                                      setExpandedText(
                                                                        el?.description || el?.alternate_comments
                                                                      )
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
                                                                    {el?.description || el?.alternate_comments}
                                                                  </Typography>
                                                                </Grid>
                                                              ))}
                                                          </Grid>
                                                        )}
                                                        {el?.request_status === 'Rejected' && (
                                                          <Grid
                                                            sx={{
                                                              minHeight: 104,
                                                              maxHeight: 104,
                                                              display: 'flex',
                                                              flexDirection: 'column',
                                                              justifyContent: 'center'
                                                            }}
                                                          >
                                                            <Typography
                                                              variant='body1'
                                                              sx={{
                                                                color: 'error.main',
                                                                textAlign: 'left',
                                                                fontSize: '14px !important',
                                                                fontWeight: 400
                                                              }}
                                                            >
                                                              {/* This Product was rejected */}
                                                              Request Declined
                                                            </Typography>
                                                            {el?.description ||
                                                              (el?.alternate_comments && (
                                                                <Grid
                                                                  onClick={() => {
                                                                    if (el?.description || el?.alternate_comments) {
                                                                      setExpandedText(
                                                                        el?.description || el?.alternate_comments
                                                                      )
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
                                                                    {el?.description || el?.alternate_comments}
                                                                  </Typography>
                                                                </Grid>
                                                              ))}
                                                          </Grid>
                                                        )}
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
                                )}
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
                            // display: 'flex',
                            // justifyContent: 'flex-start'
                            padding: '0 !important'
                          }}
                        >
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
                              <TabPanel
                                value='Ready To Ship'
                                sx={{
                                  padding: '0px !important'
                                }}
                              >
                                {dispatchedItems?.length > 0 && selectedPharmacy.type === 'central' && (
                                  <Card sx={{ minWidth: '100%', ml: -2, boxShadow: 'none !important' }}>
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
                                              Ship All Items
                                            </Button>
                                          </Grid>
                                        ) : null
                                      }
                                    ></CardHeader>
                                    <TableBasic
                                      rowHeight={90}
                                      columns={fulfillColumns}
                                      rows={dispatchedItems}
                                    ></TableBasic>
                                  </Card>
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
                                    <Card sx={{ mb: 6, minWidth: '100%', ml: -2, boxShadow: 'none !important' }}>
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
                      </>
                    )}
                  </TabContext>
                </Grid>

                <Grid container sx>
                  <CommonDialogBox
                    noWidth={'noWidth'}
                    title={'Add Alternative Supply'}
                    dialogBoxStatus={showAlternativeMedicineDialog}
                    formComponent={
                      <AlternativeMedicine
                        parentId={medicineParentId}
                        existingListItems={requestItems}
                        closeAlternativeMedicineDialog={closeAlternativeMedicineDialog}
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
                        closeRejectMedicineDialog={closeRejectMedicineDialog}
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
                        payload={medicineParentId}
                        closeProductNotAvailableDialog={closeProductNotAvailableDialog}
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
                sx={{
                  '& .MuiDialog-paper': {
                    backgroundColor: 'primary.contrastText'
                  }
                }}
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
            closeDialog={closeNotesDialog}
            action={closeNotesDialog} // This closes the dialog when the icon button is clicked
            title='Comment' // Add title here
            content={
              <Box>
                <AddComment expandedText={expandedText} handleClose={closeNotesDialog} />
              </Box>
            }
          />

          {/* <Grid container>
            <CommonDialogBox
              title={'Comments'}
              // noWidth={'noWidth'}
              dialogBoxStatus={notesDialog}
              formComponent={<AddComment expandedText={expandedText} />}
              close={closeNotesDialog}
              // maxWidth='sm' // Adjust width (e.g., "xs", "sm", "md", "lg", "xl")
            />
          </Grid> */}
        </>
      )}
    </>
  )
}

export default IndividualRequest
