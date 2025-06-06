/* eslint-disable react-hooks/exhaustive-deps */
import React, { forwardRef, useState, useEffect, useCallback } from 'react'

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
import { Box, CardContent, CardHeader, Divider, Tooltip, Paper, Drawer, Avatar } from '@mui/material'
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
import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import Chip from '@mui/material/Chip'
import { styled } from '@mui/material/styles'
import MuiTabList from '@mui/lab/TabList'

import DetailsTable from 'src/components/pharmacy/request/DetailsTable'
import CloseIcon from '@mui/icons-material/Close'
import RenderUtility from 'src/utility/render'
import { useTheme } from '@emotion/react'
import { width } from '@mui/system'

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
  const router = useRouter()

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

  const { selectedPharmacy } = usePharmacyContext()

  const { id, request_number } = router.query
  const [expandedText, setExpandedText] = useState('')
  const [notesDialog, setNotesDialog] = useState(false)
  const [showAlternativeMedicineDialog, setShowAlternativeMedicineDialog] = useState(false)
  const [rejectRequestMedicineDialog, setRejectRequestMedicineDialog] = useState(false)
  const [shipmentDetailsDialog, setShipmentDetailsDialog] = useState(false)

  const [medicineParentId, setMedicineParentId] = useState({
    parentEndPointId: '',
    parent_id: '',
    request_item_id: '',
    qty_requested: '',
    product: ''
  })
  const [status, setStatus] = useState('Pending')
  const [detailsTab, setDetailsTab] = useState(router?.query?.detailsTab || 'Pending')
  const [shipmentTab, setShipmentTab] = useState(router?.query?.shipmentTab || 'Ready To Ship')

  const theme = useTheme()

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

  const updateUrlParams = useCallback(
    params => {
      const newQuery = { ...router.query, ...params }
      router.replace({ pathname: router.pathname, query: newQuery }, undefined)
    },
    [router, detailsTab, shipmentTab]
  )

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
    if (response?.success) {
      const responseData = response?.data

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

  // useEffect(() => {
  //   if (router?.query?.detailsTab === 'Shipped') {
  //     getDispatchedItems(id)
  //   }
  // }, [router?.query?.detailsTab, getDispatchedItems, id])

  // useEffect(() => {
  //   if (router?.query?.shipmentTab === 'Shipped') {
  //     getShippedItems(id)
  //   }
  // }, [router?.query?.shipmentTab, getShippedItems, id])

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
            <Icon style={{ fontSize: '20px', color: 'customColors.neutral_50' }} icon='material-symbols:attachment' />
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

  const strikeOutTextStyle = request_status => {
    return request_status === 'Not Available'
      ? { opacity: 0.5, pointerEvents: 'none', textDecoration: 'line-through' }
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
        <Box sx={{ width: '100%', ...strikeOutTextStyle(params.row.request_status) }}>
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
            ...strikeOutTextStyle(params.row.request_status)
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
            ...strikeOutTextStyle(params.row.request_status)
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
            ...strikeOutTextStyle(params.row.request_status)
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
              sx={{ ...strikeOutTextStyle(params.row.request_status) }}
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
        <Box sx={{ ...strikeOutTextStyle(params.row.request_status) }}>{renderAttachmentIcons(params.row)}</Box>
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
              ...strikeOutTextStyle(params.row.request_status)
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

              // ...strikeOutTextStyle(params.row.request_status)
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
              <Box sx={{ ...strikeOutTextStyle(params.row.request_status) }}>
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
      flex: 1,
      minWidth: 200,
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
      width: 120,
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
    },
    {
      minWidth: 20,
      headerName: 'Action',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', display: 'flex', alignItems: 'center' }}>
          {/* <Box sx={{ mr: 2 }}> */}
          <Button
            sx={{
              mr: 2,
              padding: 2,
              minWidth: 'auto',
              borderRadius: '50%',
              backgroundColor: 'transparent',
              color: 'customColors.neutralSecondary',
              '&:hover': {
                backgroundColor: 'transparent'
              }
            }}
            onClick={() => {
              setDeleteDialog(true)
              setDeleteFullFillId(params.row.dispatch_item_id)
            }}
            disabled={selectedPharmacy?.permission.key === 'VIEW'}
          >
            <Icon icon='mdi:delete-outline' />
          </Button>
          {/* </Box> */}
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
          {params.row.sl_no}
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
            <div>{params.row.shipment_id}</div>
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
      width: 200,
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

  console.log(shippedItems, 'shippedItems')

  const hasNotFulfilledItems = requestItems?.request_item_details?.some(
    el =>
      el?.dispatch_status === 'Not Fulfilled' &&
      el?.request_status !== 'Rejected' &&
      el?.request_status !== 'Not Available'
  )

  useEffect(() => {
    if (hasNotFulfilledItems) {
      setStatus('Pending')
    } else if (requestItems?.request_item_details?.length > 0) {
      setStatus('All')
    }
  }, [hasNotFulfilledItems, requestItems?.request_item_details?.length > 0])

  useEffect(() => {
    if (dispatchedItems?.length > 0) {
      setShipmentTab('Ready To Ship')
    } else if (shippedItems?.length > 0) {
      setShipmentTab('Shipped')
    }
  }, [dispatchedItems?.length > 0, shippedItems?.length > 0])

  const allShippedLineItems =
    shippedItems.length > 0 &&
    shippedItems?.flatMap(shipment => shipment?.shipment_item_details?.map(item => ({ ...item })))

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
                        if (
                          selectedPharmacy?.type === 'local' &&
                          requestItems?.status === 'request' &&
                          requestItems?.is_modified !== '1'
                        ) {
                          Router.push('/pharmacy/request')
                        } else {
                          Router.back()
                        }
                      }}
                      icon='ep:back'
                    />
                  }
                  title={`Request - ${requestItems?.request_number}`}
                  action={
                    selectedPharmacy?.type === 'local' &&
                    requestItems?.status === 'request' &&
                    requestItems?.is_modified !== '1' &&
                    Number(requestItems?.shipped_product_count) === 0 && (
                      <Button
                        size='big'
                        variant='contained'
                        onClick={() => {
                          handleRequestEdit()
                        }}
                      >
                        Edit
                      </Button>
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
                        size={{ xs: 12, sm: 6, md: 6, lg: 3 }}
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
                          Requested By :
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
                            {RenderUtility?.getToolTipForText(requestItems?.to_store)}
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
                        size={{ xs: 12, sm: 6, md: 6, lg: 3 }}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          height: '46px',
                          gap: '10px',

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
                        {requestItems?.product_count && (
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
                              {requestItems?.product_count}
                            </Box>
                          </Typography>
                        )}
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            marginLeft: { xs: 0, md: 0, sm: '47px' }

                            // overflow: 'hidden' // optional, if you want to clip long content
                          }}
                        >
                          <Typography
                            component='span'
                            sx={{
                              fontSize: '14px',
                              fontWeight: '400',
                              lineHeight: '16.94px',
                              color: 'customColors.neutralSecondary',
                              whiteSpace: 'nowrap' // optional if this label might wrap
                              // ml: { xs: 0, sm: 0 }
                            }}
                          >
                            Total Requested Value:
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
                        size={{ xs: 12, sm: 6, md: 6, lg: 3 }}
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
                          onClick={() => setShipmentDetailsDialog(true)}
                          sx={{
                            fontSize: '14px',
                            fontWeight: '400',
                            lineHeight: '16.94px',
                            color: 'primary.OnSurface',
                            cursor: 'pointer'
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

                      <Grid item size={{ xs: 12, md: 6, sm: 6, lg: 3 }}>
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

                              // height: '36px',
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
                      sx={{ borderBottom: `1px solid ${theme.palette.customColors.neutral05} !important` }}
                      onChange={(event, newValue) => {
                        setDetailsTab(newValue)
                        updateUrlParams({
                          detailsTab: newValue
                        })
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
                            {requestItems?.request_item_details?.length > 0 && (
                              <DetailsTable
                                requestItems={requestItems}
                                items={requestItems?.request_item_details || []}
                                renderAttachmentIcons={renderAttachmentIcons}
                                getCellBgColor={getCellBgColor}
                                strikeOutTextStyle={strikeOutTextStyle}
                                setFulfillMedicine={setFulfillMedicine}
                                showDialog={showDialog}
                                generateOptions={generateOptions}
                                selectedPharmacy={selectedPharmacy}
                              />
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
                                      Router.push({
                                        pathname: `/pharmacy/request/${id}/shipment-details`,
                                        query: { orderId: e.id, requestId: id }
                                      })
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
                                      <DetailsTable
                                        requestItems={requestItems}
                                        items={
                                          requestItems?.request_item_details?.length > 0
                                            ? requestItems?.request_item_details?.filter(
                                                el => el?.dispatch_status === 'Not Fulfilled'
                                              )
                                            : []
                                        }
                                        renderAttachmentIcons={renderAttachmentIcons}
                                        getCellBgColor={getCellBgColor}
                                        strikeOutTextStyle={strikeOutTextStyle}
                                        setFulfillMedicine={setFulfillMedicine}
                                        showDialog={showDialog}
                                        generateOptions={generateOptions}
                                        selectedPharmacy={selectedPharmacy}
                                      />
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
                                  <DetailsTable
                                    requestItems={requestItems}
                                    items={requestItems?.request_item_details || []}
                                    renderAttachmentIcons={renderAttachmentIcons}
                                    getCellBgColor={getCellBgColor}
                                    strikeOutTextStyle={strikeOutTextStyle}
                                    setFulfillMedicine={setFulfillMedicine}
                                    showDialog={showDialog}
                                    generateOptions={generateOptions}
                                    selectedPharmacy={selectedPharmacy}
                                  />
                                )}
                              </TabPanel>
                            </TabContext>
                          </Grid>
                        </TabPanel>
                        <TabPanel
                          value='Shipped'
                          sx={{
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
                                  updateUrlParams({
                                    shipmentTab: newValue
                                  })
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
                                          <Grid
                                            item
                                            size={{ xs: 6 }}
                                            style={{ display: 'flex', justifyContent: 'right' }}
                                          >
                                            <Button
                                              size='big'
                                              variant='contained'
                                              onClick={() => {
                                                // openShipDialog()
                                                Router.push({
                                                  pathname: `/pharmacy/request/${id}/ship-all-items`,
                                                  query: {
                                                    // orderId: e.id,
                                                  }
                                                })
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
                                      <TableBasic
                                        columns={shippedColumns}
                                        rows={shippedItems}
                                        onRowClick={e => {
                                          setOrderId(e.id)
                                          Router.push({
                                            pathname: `/pharmacy/request/${id}/shipment-details`,
                                            query: { orderId: e.id, requestId: id }
                                          })
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

              <Drawer
                anchor='right'
                open={shipmentDetailsDialog}
                onClose={() => setShipmentDetailsDialog(false)}
                sx={{
                  '& .MuiDrawer-paper': {
                    width: 500,
                    backgroundColor: 'customColors.bodyBg'
                  }
                }}
              >
                <Box sx={{ p: 4, height: '100%', overflow: 'auto' }}>
                  <Box
                    sx={{
                      position: 'sticky',
                      zIndex: 1
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography
                        sx={{ color: 'customColors.customHeadingTextColor', fontSize: '20px', fontWeight: 500 }}
                      >
                        Shipped Items
                      </Typography>
                      <IconButton onClick={() => setShipmentDetailsDialog(false)}>
                        <CloseIcon />
                      </IconButton>
                    </Box>

                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        backgroundColor: 'customColors.neutral05',
                        padding: 2,
                        borderRadius: '4px',
                        mb: 3
                      }}
                    >
                      <Typography variant='body1'>
                        <Box
                          component='strong'
                          sx={{
                            color: 'customColors.customHeadingTextColor',
                            fontSize: '14px',
                            fontWeight: 400
                          }}
                        >
                          Shipped Items:
                        </Box>{' '}
                        <Box
                          component='span'
                          sx={{
                            color: 'customColors.customHeadingTextColor',
                            fontSize: '16px',
                            fontWeight: 500
                          }}
                        >
                          {shippedItems[0]?.shipment_item_details.length || '0'}
                        </Box>
                      </Typography>

                      <Typography variant='body1'>
                        <Box
                          component='strong'
                          sx={{
                            color: 'customColors.neutralSecondary',
                            fontSize: '14px',
                            fontWeight: 400
                          }}
                        >
                          Shipped Value:
                        </Box>{' '}
                        <Box
                          component='span'
                          sx={{
                            color: 'primary.light',
                            fontSize: '14px',
                            fontWeight: 500
                          }}
                        >
                          {/* {shippedItems[0]?.shipment_item_details?.value || '0'}
                           */}
                          {requestItems?.shipped_amount}
                        </Box>
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ mb: 3 }} />

                  <Box
                    sx={{
                      height: 'calc(100% - 120px)', // Adjust this value based on your layout
                      overflowY: 'auto',
                      paddingTop: 3
                    }}
                  >
                    {shippedItems?.length ? (
                      allShippedLineItems?.map((ship, index) => (
                        <Card
                          key={index}
                          sx={{
                            mb: 2,
                            borderRadius: '8px',
                            boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.1)'
                          }}
                        >
                          <CardContent>
                            <Typography
                              sx={{ color: 'customColors.customHeadingTextColor', fontSize: '16px', fontWeight: 500 }}
                              gutterBottom
                            >
                              {ship?.stock_name}
                            </Typography>

                            {/* Shipped Quantity and Value */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant='body1'>
                                <Box
                                  component='span'
                                  sx={{
                                    color: 'customColors.customHeadingTextColor',
                                    fontSize: '14px',
                                    fontWeight: 400
                                  }}
                                >
                                  Shipped Quantity:
                                </Box>
                                <Box
                                  component='span'
                                  sx={{
                                    color: 'customColors.customHeadingTextColor',
                                    fontSize: '16px',
                                    fontWeight: 500
                                  }}
                                >
                                  {ship?.quantity}
                                </Box>
                              </Typography>
                              {/* <Typography variant='body1'>
                                <Box
                                  component='span'
                                  sx={{
                                    color: 'customColors.neutralSecondary',
                                    fontSize: '14px',
                                    fontWeight: 400
                                  }}
                                >
                                  Shipped Value:
                                </Box>
                                <Box
                                  component='span'
                                  sx={{
                                    color: 'primary.light',
                                    fontSize: '14px',
                                    fontWeight: 500
                                  }}
                                >
                                  ₹{requestItems?.shipped_amount || '0'}
                                </Box>
                              </Typography> */}
                            </Box>

                            <Paper
                              elevation={0}
                              sx={{
                                backgroundColor: 'customColors.tableHeaderBg',
                                p: 2,
                                borderRadius: '8px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                gap: 2
                              }}
                            >
                              <Box>
                                <Typography
                                  variant='body2'
                                  color='customColors.neutralSecondary'
                                  sx={{ fontSize: '12px', fontWeight: 400 }}
                                >
                                  Shipping ID:
                                </Typography>
                                <Typography
                                  variant='body1'
                                  sx={{
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    color: 'customColors.customHeadingTextColor'
                                  }}
                                >
                                  {ship?.shipment_id}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography
                                  variant='body2'
                                  color='customColors.neutralSecondary'
                                  sx={{ fontSize: '12px', fontWeight: 400 }}
                                >
                                  Batch No:
                                </Typography>
                                <Typography
                                  variant='body1'
                                  sx={{
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    color: 'customColors.customHeadingTextColor'
                                  }}
                                >
                                  {ship?.batch}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography
                                  variant='body2'
                                  color='customColors.neutralSecondary'
                                  sx={{ fontSize: '12px', fontWeight: 400 }}
                                >
                                  Shipped Quantity:
                                </Typography>
                                <Typography
                                  variant='body1'
                                  sx={{
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    color: 'customColors.customHeadingTextColor'
                                  }}
                                >
                                  {ship?.quantity}
                                </Typography>
                              </Box>
                            </Paper>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '300px',
                          textAlign: 'center'
                        }}
                      >
                        <Avatar
                          variant='square'
                          alt=''
                          src={'/images/Empty-Box.png'}
                          sx={{
                            width: '120px',
                            height: '120px',
                            mb: 2
                          }}
                        />
                        <Typography
                          variant='body1'
                          sx={{
                            fontSize: '14px',
                            fontWeight: 400,
                            color: 'primary.light'
                          }}
                        >
                          No Shipped Items
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Drawer>
              {/* <CommonDialogBox
                title={`Shipped Items (${shippedItems[0]?.shipment_item_details.length || '0'})`}
                dialogBoxStatus={shipmentDetailsDialog}
                close={setShipmentDetailsDialog}
                noWidth={'noWidth'}
                style={'#EFF5F2'}
                formComponent={
                  <>
                    {console.log('shippedItems', shippedItems)}

                    {shippedItems[0]?.shipment_item_details?.map((ship, index) => {
                      console.log(ship, 'loggss')

                      return (
                        <Card key={index} sx={{ width: 500, m: 2 }}>
                          <CardContent>
                            <Typography variant='h5' component='div' gutterBottom sx={{ color: '#333' }}>
                              {ship?.stock_name}
                            </Typography>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                              <Typography variant='body1' color='text.secondary'>
                                Shipped Quantity: {ship?.quantity}
                              </Typography>
                              <Typography variant='body1' color='text.secondary'>
                                Shipped Value:{''}
                              </Typography>
                            </Box>

                            <Paper
                              elevation={0}
                              sx={{
                                backgroundColor: '#E8F4F2',
                                p: 3,
                                display: 'flex',
                                justifyContent: 'space-between'
                              }}
                            >
                              <Box>
                                <Typography variant='body2' color='text.secondary'>
                                  Shipping ID:
                                </Typography>
                                <Typography variant='body1'>{ship?.shipment_id}</Typography>
                              </Box>

                              <Box>
                                <Typography variant='body2' color='text.secondary'>
                                  Batch No:
                                </Typography>
                                <Typography variant='body1'>{ship?.batch}</Typography>
                              </Box>

                              <Box>
                                <Typography variant='body2' color='text.secondary'>
                                  Shipped Quantity:
                                </Typography>
                                <Typography variant='body1'>{ship?.quantity}</Typography>
                              </Box>
                            </Paper>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </>
                }
              /> */}
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
                  router.push('/pharmacy/request')
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

export default React.memo(IndividualRequest)
