import React, { useState, useEffect, useCallback, forwardRef } from 'react'

import {
  Box,
  CardHeader,
  Tooltip,
  Grid,
  TextField,
  Typography,
  InputAdornment,
  FormControl,
  MenuItem,
  Select,
  InputLabel
} from '@mui/material'

import Icon from 'src/@core/components/icon'
import { useTheme } from '@emotion/react'
import { usePharmacyContext } from 'src/context/PharmacyContext'

import CommonTable from 'src/views/table/data-grid/CommonTable'
import { useRouter } from 'next/router'
import { debounce } from 'lodash'
import Utility from 'src/utility'
import RenderUtility from 'src/utility/render'
import { getAllRequestsOfSelectedStore, getAllRequestsOfSelectedProduct } from 'src/lib/api/pharmacy/storeWiseRequest'
import RequestedProductDetails from 'src/views/pages/pharmacy/requests-by-stores/product-details'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import FulfillDialog from 'src/components/pharmacy/request/FulfillDialog'
import Dialog from '@mui/material/Dialog'
import Fade from '@mui/material/Fade'
import IconButton from '@mui/material/IconButton'
import CommonDialogBox from 'src/components/CommonDialogBox'
import AlternativeMedicine from 'src/components/pharmacy/request/AlternativeMedicine'
import RejectRequestItem from 'src/components/pharmacy/request/RejectRequestItem'
import ProductNotAvailable from 'src/components/pharmacy/request/ProductNotAvailable'
import { styled } from '@mui/material/styles'
import MuiTabList from '@mui/lab/TabList'
import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import { alpha } from '@mui/material'
import { ExportButton } from 'src/views/utility/render-snippets'

// import Drawer from '@mui/material/Drawer'
const Transition = forwardRef(function Transition(props, ref) {
  return <Fade ref={ref} {...props} />
})

export default function RequestedItems({ selectedStoreDetails, setSelectedStoreDetails, updateUrlParams }) {
  const theme = useTheme()
  const router = useRouter()
  const { id } = router.query

  const TabLists = styled(MuiTabList)(({ theme }) => ({
    '& .MuiTabs-indicator': {
      display: 'none'
    },

    '& .MuiTab-root': {
      minHeight: '40px !important',
      maxHeight: '40px !important',
      minWidth: 110,
      backgroundColor: alpha(theme.palette.customColors.neutral05, 0.05),
      borderRadius: 8,
      marginRight: theme.spacing(3)
    },
    '& .Mui-selected': {
      backgroundColor: theme.palette.customColors.OnSecondaryContainer,
      color: theme.palette.common.white,
      maxHeight: '40px !important',
      minHeight: '40px !important'
    }
  }))
  const { selectedPharmacy } = usePharmacyContext()
  const [total, setTotal] = useState(0)

  const [sort, setSort] = useState(router.query.sort || 'asc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState(router.query.q || '')

  const [sortColumn, setSortColumn] = useState(
    selectedPharmacy.type === 'local' ? 'priority' : router.query.column || 'priority'
  )
  const [controlledDrug, setControlledDrug] = useState(router.query.controlledDrug || 'all')
  const [priority, setPriority] = useState(router.query.priority || 'all')
  const [loading, setLoading] = useState(false)
  const [showDrawer, setShowDrawer] = useState(false)
  const [drawerLoader, setDrawerLoader] = useState(false)

  const [requestedProducts, setRequestedProducts] = useState([])

  const [filterDates, setFilterDates] = useState({
    startDate: router.query.startDate || '',
    endDate: router.query.endDate || ''
  })
  const [showAlternativeMedicineDialog, setShowAlternativeMedicineDialog] = useState(false)
  const [rejectRequestMedicineDialog, setRejectRequestMedicineDialog] = useState(false)
  const [productNotAvailableDialog, setProductNotAvailableDialog] = useState(false)

  const [sideDrawerItemDetails, setSideDrawerItemDetails] = useState({
    selectedStoreId: '',
    selectedItemId: ''
  })

  const [medicineParentId, setMedicineParentId] = useState({
    parentEndPointId: '',
    parent_id: '',
    request_item_id: '',
    qty_requested: '',
    product: ''
  })

  const [requestItems, setRequestItems] = useState([])
  const [fulfillMedicine, setFulfillMedicine] = useState(false)
  const [show, setShow] = useState(false)
  const [requestedItemsSubTab, setRequestedItemsSubTab] = useState(router.query.requestedItemsSubTab || 'Available')
  const [exportLoading, setExportLoading] = useState(false)

  const showDialog = () => {
    setShow(true)
  }

  const fullFillRequestItem = selectedLineItem => {
    setRequestItems(prevItems => ({
      ...prevItems,
      to_store_type: requestedProducts?.to_store_type,
      to_store_id: requestedProducts?.to_store_id,
      from_store_id: requestedProducts?.from_store_id,
      from_store_type: requestedProducts?.from_store_type,
      id: selectedLineItem?.request_item_id,
      to_store: selectedStoreDetails?.storeName
    }))
    setFulfillMedicine({
      ...selectedLineItem
    })

    showDialog()
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

  const openDrawer = () => {
    setShowDrawer(true)
  }

  const closeDrawer = () => {
    setShowDrawer(false)
    setRequestedProducts([])

    // setSideDrawerItemDetails({
    //   selectedStoreId: '',
    //   selectedItemId: ''
    // })
    setSideDrawerItemDetails(prev => ({
      ...prev,
      selectedItemId: ''
    }))
  }

  const handleRowClick = params => {
    setSideDrawerItemDetails(prev => ({
      ...prev,
      selectedStoreId: selectedStoreDetails?.storeId,
      selectedItemId: params?.row?.stock_item_id
    }))

    fetchRequestedItemsById(selectedStoreDetails?.storeId, params?.row?.stock_item_id)

    // openDrawer()
  }

  const handleDateRangeChange = (startDate, endDate) => {
    if (startDate && endDate) {
      setFilterDates({
        startDate: Utility.formatDate(startDate),
        endDate: Utility.formatDate(endDate)
      })

      console.log('Date range selected:', { startDate, endDate })
    } else {
      setFilterDates({
        startDate: '',
        endDate: ''
      })

      console.log('Empty date range selected,', { startDate, endDate })
    }
  }

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page) || 0,
    pageSize: parseInt(router.query.limit) || 25
  })
  function loadServerRows(currentPage, data) {
    return data
  }

  const columns = [
    {
      width: 80,
      field: 'id',
      headerName: 'SL.NO',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {parseInt(params.row.sl_no) + '.'}
        </Typography>
      )
    },
    {
      width: 100,
      field: 'priority',
      headerName: 'Priority',
      headerAlign: 'center',
      textAlign: 'center',
      renderCell: params => <Box>{RenderUtility.getPriorityIcons(params?.row?.priority)}</Box>
    },
    {
      width: 300,
      field: 'stock_name',
      headerName: 'PRODUCT NAME',
      renderCell: params => (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <Tooltip title={params.row?.stock_name} placement='top'>
            <Typography
              sx={{
                color: 'customColors.OnSecondaryContainer',
                display: 'flex',
                alignItems: 'center',
                fontWeight: 500,
                fontSize: '14px',
                ...RenderUtility?.getEllipsisStyleForText()
              }}
            >
              {RenderUtility?.renderControlLabel(
                !isNaN(params.row?.control_substance) && parseInt(params.row?.control_substance) === 1,
                'CS'
              )}
              {RenderUtility?.renderPrescriptionLabel(
                !isNaN(params.row?.prescription_required) && parseInt(params.row?.prescription_required) === 1,
                'PR'
              )}
              {params.row?.stock_name}
            </Typography>
          </Tooltip>
          <Tooltip
            title={
              params?.row?.package ||
              params?.row?.package_qty ||
              params?.row?.package_uom_label ||
              params?.row?.product_form_label
                ? `${params?.row?.package} of ${Utility.formatNumber(params?.row?.package_qty)} ${
                    params?.row?.package_uom_label
                  } ${params?.row?.product_form_label}`
                : 'NA'
            }
            placement='top'
          >
            <Typography
              sx={{
                color: 'customColors.neutralSecondary',
                alignItems: 'center',
                fontSize: '12px',
                fontWeight: 400,
                ...RenderUtility?.getEllipsisStyleForText()
              }}
            >
              {params?.row?.package ||
              params?.row?.package_qty ||
              params?.row?.package_uom_label ||
              params?.row?.product_form_label
                ? `${params?.row?.package} of ${Utility.formatNumber(params?.row?.package_qty)} ${
                    params?.row?.package_uom_label
                  } ${params?.row?.product_form_label}`
                : 'NA'}
            </Typography>
          </Tooltip>
        </Box>
      )
    },

    {
      width: 150,
      field: 'total_requests',
      headerName: 'Total Requests',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {params.row.total_requests}
        </Typography>
      )
    },
    {
      width: 200,

      field: 'pending_qty',
      headerName: 'Pending Quantity',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {params.row.pending_qty}
        </Typography>
      )
    },
    {
      width: 200,
      field: 'latest_requested_date',
      headerName: 'Recent requested date',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {Utility?.formatDisplayDate(params.row.latest_requested_date)}
        </Typography>
      )
    },
    {
      width: 200,
      field: 'requested_date',
      headerName: 'Earliest request date',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {Utility?.formatDisplayDate(params.row.requested_date)}
        </Typography>
      )
    }
  ]

  const labelKeyMapping = [
    { label: 'Requested', key: 'requested_qty' },
    { label: 'Fulfilled', key: 'dispatch_qty' },
    { label: 'Shipped', key: 'shipped_qty' },
    { label: 'Pending', key: 'pending_qty' }
  ]

  const generateQuantityStats = data =>
    labelKeyMapping.map(({ label, key }) => ({
      label,
      value: data[key] || '0'
    }))

  const fetchRequestedItemsById = async (storeId, itemId) => {
    try {
      setDrawerLoader(true)
      openDrawer()
      await getAllRequestsOfSelectedProduct(storeId, itemId).then(res => {
        console.log('getAllRequestsOfSelectedProduct', res)

        // if (res?.success === true && res?.data?.list_items?.length > 0) {
        //   setRequestedProducts(res?.data)
        //   setLoading(false)
        // }
        if (res?.success === true && res?.data?.list_items?.length > 0) {
          const updatedListItems = res?.data?.list_items.map(item => {
            const parentQuantityStatus = generateQuantityStats(item)

            const altParentStats =
              item?.alt_parent?.map(alt => ({
                ...alt,
                alternativeQuantityStatus: generateQuantityStats(alt)
              })) || []

            return {
              ...item,
              parentQuantityStatus,
              alt_parent: altParentStats
            }
          })

          setRequestedProducts({
            ...res.data,
            request_item_details: res?.data?.list_items || [],
            list_items: updatedListItems
          })
          setDrawerLoader(false)
        } else {
          setRequestedProducts([])
          setDrawerLoader(false)
          closeDrawer()
        }
      })
    } catch (e) {
      console.error(e)
      setDrawerLoader(false)
      closeDrawer()
    }
  }

  const fetchTableData = useCallback(
    async ({ sort, q, column }) => {
      try {
        setLoading(true)
        const currentStoreId = selectedPharmacy.type === 'local' ? selectedPharmacy.id : id

        let params = {
          limit: paginationModel?.pageSize,
          page: paginationModel?.page + 1,
          q,
          sort,
          column,
          ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
          ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate }),
          ...(controlledDrug !== 'all' && { controlled: controlledDrug }),
          ...(priority !== 'all' && { priority: priority }),
          ...(requestedItemsSubTab !== 'all' && { stock_status: requestedItemsSubTab })
        }

        await getAllRequestsOfSelectedStore({ params: params }, currentStoreId).then(res => {
          if (res?.success === true) {
            setSelectedStoreDetails({
              storeId: res?.data?.id,
              storeName: res?.data?.store_name
            })
            updateUrlParams({ selectedStoreName: res?.data?.store_name, requestedItemsSubTab: requestedItemsSubTab })
          }
          if (res?.success === true && res?.data?.list_items?.length > 0) {
            setTotal(parseInt(res?.data?.total_count))
            console.log('response', res?.data?.list_items)
            setRows(loadServerRows(paginationModel?.page, res?.data?.list_items))
          } else {
            setTotal(parseInt(res?.data?.total_count))
            setRows([])
          }
        })
        setLoading(false)
      } catch (e) {
        console.log(e)
        setLoading(false)
      }
    },
    [paginationModel, controlledDrug, priority, filterDates, selectedPharmacy?.id, requestedItemsSubTab]
  )

  const searchTableData = useCallback(
    debounce(async ({ sort, q, column }) => {
      setSearchValue(q)
      try {
        await fetchTableData({ sort, q, column })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    [fetchTableData]
  )

  const handleSortModel = async newModel => {
    if (newModel.length > 0) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
      await searchTableData({ sort: newModel[0].sort, q: searchValue, column: newModel[0].field })
      updateUrlParams({
        sort: newModel[0].sort,
        q: searchValue,
        column: newModel[0].field,
        page: paginationModel?.page,
        limit: paginationModel?.pageSize
      })
    } else {
    }
  }

  const handleSearch = async value => {
    setSearchValue(value)
    await searchTableData({ sort, q: value, column: sortColumn })
  }
  const getSlNo = index => (paginationModel?.page + 1 - 1) * paginationModel?.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index),
    id: getSlNo(index)
  }))

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
              parentEndPointId: params?.request_item_id,
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

  const closeFulfillDialog = () => {
    setShow(false)
    fetchTableData({ sort, q: searchValue, column: sortColumn })

    // closeDrawer()

    // fetchRequestedItemsById(selectedStoreDetails?.storeId, params?.row?.stock_item_id)
    setRequestItems([])
    setFulfillMedicine([])
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

    // fetchRequestedItemsById(selectedStoreDetails?.storeId, params?.row?.stock_item_id)
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

    // fetchRequestedItemsById(selectedStoreDetails?.storeId, params?.row?.stock_item_id)
  }
  useEffect(() => {
    fetchTableData({ sort, q: searchValue, column: sortColumn })
    updateUrlParams({
      sort,
      q: searchValue,
      column: sortColumn,
      page: paginationModel?.page,
      limit: paginationModel?.pageSize,
      requestedItemsSubTab: requestedItemsSubTab
    })
  }, [paginationModel, controlledDrug, priority, filterDates, selectedPharmacy.id, requestedItemsSubTab])

  useEffect(() => {
    updateUrlParams({
      requestedItemsSubTab: requestedItemsSubTab
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedItemsSubTab])

  const handleExport = async () => {
    try {
      setExportLoading(true)
      const currentStoreId = selectedPharmacy.type === 'local' ? selectedPharmacy.id : id
      const now = new Date()

      const timestamp = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(
        2,
        '0'
      )}/${now.getFullYear()}(${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')})`

      let params = {
        limit: total,
        page: 1,
        q: searchValue,
        sort: sort,
        column: sortColumn,
        ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
        ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate }),
        ...(controlledDrug !== 'all' && { controlled: controlledDrug }),
        ...(priority !== 'all' && { priority: priority }),
        ...(requestedItemsSubTab !== 'all' && { stock_status: requestedItemsSubTab }),
        response_type: 'csv'
      }

      const response = await getAllRequestsOfSelectedStore({ params: params }, currentStoreId)
      if (response?.success && response?.data) {
        Utility.downloadFileFromURL(
          response.data,
          `Requested_Items_${requestedItemsSubTab.replace(/\s+/g, '_').toLowerCase()} ${timestamp}`
        )
      }
    } catch (error) {
      console.log('Error Downloading Excel File :', error)
    } finally {
      setExportLoading(false)
    }
  }

  const pageContent = () => {
    return (
      <Box sx={{ mt: 6 }}>
        <Box>
          <Grid
            container
            spacing={2}
            sx={{
              display: 'flex',
              flexWrap: { xs: 'wrap', md: 'nowrap' },
              justifyContent: { xs: 'center', md: 'space-between' },
              alignItems: 'center',
              gap: { xs: 2, md: 0 }
            }}
          >
            <Grid item xs={12} sm={12} md='auto' lg='auto' xl='auto'>
              <CommonDateRangePickers onChange={handleDateRangeChange} filterDates={filterDates} />
            </Grid>
            <Grid item xs={12} md={2.5} lg={2.5}>
              <FormControl fullWidth size='small'>
                <InputLabel>Controlled</InputLabel>
                <Select
                  value={controlledDrug}
                  label='Controlled'
                  onChange={e => {
                    setControlledDrug(e.target.value)
                  }}
                >
                  <MenuItem value='all'>All</MenuItem>
                  <MenuItem value='1'>Controlled Substance</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2.5} lg={2.5}>
              <FormControl fullWidth size='small'>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={priority}
                  label='Priority'
                  onChange={e => {
                    setPriority(e.target.value)
                  }}
                >
                  <MenuItem value='all'>All</MenuItem>
                  <MenuItem value='high'>High</MenuItem>
                  <MenuItem value='emergency'>Emergency</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {/* <Grid item xs={8} sm={8} md={3} lg={3}>
              <TextField
                variant='outlined'
                size='small'
                placeholder='Search...'
                value={searchValue}
                onChange={e => handleSearch(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Icon icon='mi:search' fontSize={24} color={theme.palette.customColors.neutralSecondary} />
                    </InputAdornment>
                  )
                }}
                sx={{
                  borderRadius: '8px'
                }}
              />
            </Grid>
            <Grid
              item
              xs={4}
              sm={4}
              md='auto'
              lg='auto'

              // sx={{
              //   display: 'flex',
              //   justifyContent: { xs: 'flex-start', md: 'flex-end' },
              //   alignItems: 'center'
              // }}
            >
              <ExportButton />
            </Grid> */}
            <Grid item xs={12} md={3} lg={3}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'row', md: 'row' },
                  alignItems: 'center',
                  width: '100%',
                  gap: 2
                }}
              >
                <TextField
                  variant='outlined'
                  size='small'
                  placeholder='Search...'
                  value={searchValue}
                  onChange={e => handleSearch(e.target.value)}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <Icon icon='mi:search' fontSize={24} color={theme.palette.customColors.neutralSecondary} />
                      </InputAdornment>
                    )
                  }}
                  sx={{ borderRadius: '8px', flexGrow: 1 }}
                />
                <ExportButton loading={exportLoading} onClick={handleExport} disabled={total === 0 ? true : false} />
              </Box>
            </Grid>
          </Grid>
        </Box>
        <CommonTable
          // eslint-disable-next-line lines-around-comment
          onRowClick={handleRowClick}
          indexedRows={indexedRows}
          total={total}
          columns={columns}
          paginationModel={paginationModel}
          handleSortModel={handleSortModel}
          setPaginationModel={setPaginationModel}
          loading={loading}
          searchValue={searchValue}
        />
        <RequestedProductDetails
          addEventSidebarOpen={showDrawer}
          handleSidebarClose={closeDrawer}
          requestedProducts={requestedProducts}
          generateOptions={generateOptions}
          fullFillRequestItem={fullFillRequestItem}
          drawerLoader={drawerLoader}
        />
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
          onClose={() => closeFulfillDialog()}
          TransitionComponent={Transition}
          onBackdropClick={() => closeFulfillDialog()}
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
            <IconButton size='small' onClick={() => closeFulfillDialog()} sx={{ mx: 4 }}>
              <Icon icon='mdi:close' />
            </IconButton>
          </Grid>

          <FulfillDialog
            fulfillMedicine={fulfillMedicine}
            storeDetails={requestItems}
            close={() => {
              closeFulfillDialog()
              fetchRequestedItemsById(sideDrawerItemDetails?.selectedStoreId, sideDrawerItemDetails?.selectedItemId)
            }}
          />
        </Dialog>
        <Grid container>
          <CommonDialogBox
            noWidth={'noWidth'}
            title={'Add Alternative Supply'}
            dialogBoxStatus={showAlternativeMedicineDialog}
            formComponent={
              <AlternativeMedicine
                parentId={medicineParentId}
                existingListItems={requestedProducts}
                closeAlternativeMedicineDialog={closeAlternativeMedicineDialog}
                updateRequestItems={() => {
                  fetchTableData({ sort, q: searchValue, column: sortColumn })
                  closeAlternativeMedicineDialog()
                  fetchRequestedItemsById(sideDrawerItemDetails?.selectedStoreId, sideDrawerItemDetails?.selectedItemId)
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
            title={'Supply Stopped'}
            dialogBoxStatus={productNotAvailableDialog}
            formComponent={
              <ProductNotAvailable
                payload={medicineParentId}
                closeProductNotAvailableDialog={closeProductNotAvailableDialog}
                updateRequestItems={() => {
                  closeProductNotAvailableDialog()
                  fetchTableData({ sort, q: searchValue, column: sortColumn })
                  fetchRequestedItemsById(sideDrawerItemDetails?.selectedStoreId, sideDrawerItemDetails?.selectedItemId)
                }}
              />
            }
            close={closeProductNotAvailableDialog}
            show={openProductNotAvailableDialog}
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
                  fetchTableData({ sort, q: searchValue, column: sortColumn })
                  fetchRequestedItemsById(sideDrawerItemDetails?.selectedStoreId, sideDrawerItemDetails?.selectedItemId)
                }}
              />
            }
            close={closeRejectMedicineDialog}
            show={openRejectMedicineDialog}
          />
        </Grid>
      </Box>
    )
  }

  useEffect(() => {
    if (selectedPharmacy.type === 'local') {
      setRequestedItemsSubTab('all')
    }
  }, [selectedPharmacy.type === 'local'])

  return (
    <TabContext value={requestedItemsSubTab}>
      <TabLists
        variant='scrollable'
        allowScrollButtonsMobile
        container
        onChange={(event, newValue) => {
          setRequestedItemsSubTab(newValue)
          setPaginationModel({
            page: 0,
            pageSize: 25
          })

          updateUrlParams({
            requestedItemsSubTab: newValue,
            page: 0,
            limit: 25
          })
        }}
        sx={{
          height: 'auto',

          // display: 'flex',
          // flexDirection: { xs: 'column', md: 'row' },
          // alignItems: 'center',
          // justifyContent: 'space-between',
          mt: 5
        }}
      >
        {/* {selectedPharmacy?.type === 'central' && <Tab value='Available' label={'Available'} />}
        {selectedPharmacy?.type === 'central' && <Tab value='NotAvailable' label={'NotAvailable'} />} */}
        {selectedPharmacy.type === 'central' && <Tab value='Available' label={'Stock Available'} />}
        {selectedPharmacy.type === 'central' && <Tab value='NotAvailable' label={'Not Available'} />}
        <Tab value='all' label={'All'} />
      </TabLists>

      {selectedPharmacy.type === 'central' && (
        <TabPanel
          value='Available'
          sx={{
            padding: '0px !important'
          }}
        >
          {pageContent()}
        </TabPanel>
      )}
      {selectedPharmacy.type === 'central' && (
        <TabPanel
          value='NotAvailable'
          sx={{
            padding: '0px !important'
          }}
        >
          {pageContent()}
        </TabPanel>
      )}
      <TabPanel
        value='all'
        sx={{
          padding: '0px !important'
        }}
      >
        {pageContent()}
      </TabPanel>
    </TabContext>
  )
}
