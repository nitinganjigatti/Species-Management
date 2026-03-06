import React, { useState, useEffect, useCallback } from 'react'
import { Box, Tooltip, Grid, Card, Button, Typography } from '@mui/material'
import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import { useTheme } from '@emotion/react'
import { styled } from '@mui/material/styles'
import MuiTabList from '@mui/lab/TabList'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { useRouter } from 'next/router'
import { debounce } from 'lodash'
import Utility from 'src/utility'
import RenderUtility from 'src/utility/render'
import { alpha } from '@mui/material'
import ShippedItems from './ShippedItems'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchShipments,
  setShipmentParams,
  setSelectedRows,
  setDispatchedItems
} from 'src/store/slices/pharmacy/request/shipmentSlice'
import Icon from 'src/@core/components/icon'
import ConfirmDialogBox from 'src/components/ConfirmDialogBox'
import { deleteFulfillItem } from 'src/lib/api/pharmacy/getRequestItemsList'
import toast from 'react-hot-toast'
import { LoadingButton } from '@mui/lab'
import MUISelect from 'src/views/forms/form-fields/MUISelect'

export default function ShipmentRequests({ updateUrlParams }) {
  const { selectedPharmacy } = usePharmacyContext()
  const dispatch = useDispatch()

  const { list, total, loading, page, pageSize, search, sort, sortColumn, priority, selectedRows, dispatchedItems } =
    useSelector(state => state.shipment)

  const paginationModel = { page, pageSize }

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

      // paddingTop: theme.spacing(2),
      // paddingBottom: theme.spacing(2)
      // paddingTop: 0,
      // paddingBottom: 0
    },
    '& .Mui-selected': {
      backgroundColor: theme.palette.customColors.OnSecondaryContainer,
      color: theme.palette.common.white,
      maxHeight: '40px !important',
      minHeight: '40px !important'
    }
  }))
  const theme = useTheme()
  const router = useRouter()
  const { id } = router.query

  const [shipmentTab, setShipmentTab] = useState(router.query.subTab || 'Ready To Ship')
  const [totalShippedCounts, setTotalShippedCounts] = useState()
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [deleteFullFillId, setDeleteFullFillId] = useState(null)
  const [deleteItemLoader, setDeleteItemLoader] = useState(false)
  const [handleExport, setHandleExport] = useState(null)

  const currentStoreId = selectedPharmacy.type === 'local' ? selectedPharmacy.id : id
  const isViewOnlyPermission = selectedPharmacy?.permission?.key === 'VIEW'

  // Hydrate Redux state from URL query params on mount
  useEffect(() => {
    const queryParams = {}
    if (router.query.sort) queryParams.sort = router.query.sort
    if (router.query.q) queryParams.search = router.query.q
    if (router.query.column) queryParams.sortColumn = router.query.column
    if (router.query.page) queryParams.page = parseInt(router.query.page) || 0
    if (router.query.limit) queryParams.pageSize = parseInt(router.query.limit) || 50
    if (router.query.priority) queryParams.priority = router.query.priority
    if (Object.keys(queryParams).length > 0) {
      dispatch(setShipmentParams(queryParams))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const shipItems = () => {
    dispatch(setDispatchedItems(selectedRows?.length > 0 ? selectedRows : []))
    router.push(`/pharmacy/requests-by-store/${currentStoreId}/ship-all-items`)
  }

  const closeDeleteDialog = () => {
    setDeleteDialog(false)
    setDeleteFullFillId(null)
  }

  const openDeleteDialog = () => {
    setDeleteDialog(true)
  }

  useEffect(() => {
    updateUrlParams({
      subTab: shipmentTab
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipmentTab])

  const actionColumn = {
    minWidth: 20,
    headerName: 'Action',
    renderCell: params => (
      <Typography variant='body2' sx={{ color: 'text.primary', display: 'flex', alignItems: 'center' }}>
        <Box sx={{ mr: 2 }}>
          <Icon
            onClick={() => {
              setDeleteDialog(true)
              setDeleteFullFillId(params?.row?.dispatch_item_id)
            }}
            icon='mdi:delete-outline'
          />
        </Box>
      </Typography>
    )
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
            fontWeight: 500
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
      align: 'center',
      renderCell: params => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%'
          }}
        >
          {RenderUtility.getPriorityIcons(params?.row?.priority)}
        </Box>
      )
    },
    {
      width: 300,
      field: 'medicin_name',
      headerName: 'PRODUCT NAME',
      renderCell: params => (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <Tooltip title={params.row?.medicin_name} placement='top'>
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
              {params.row?.medicin_name}
            </Typography>
          </Tooltip>
          <Tooltip
            title={
              (params?.row?.package ||
                params?.row?.package_qty ||
                params?.row?.package_uom_label ||
                params?.row?.product_form_label) &&
              `${params?.row?.package} of ${Utility.formatNumber(params?.row?.package_qty)} ${
                params?.row?.package_uom_label
              } ${params?.row?.product_form_label}`
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
              {(params?.row?.package ||
                params?.row?.package_qty ||
                params?.row?.package_uom_label ||
                params?.row?.product_form_label) &&
                `${params?.row?.package} of ${Utility.formatNumber(params?.row?.package_qty)} ${
                  params?.row?.package_uom_label
                } ${params?.row?.product_form_label}`}
            </Typography>
          </Tooltip>
        </Box>
      )
    },
    {
      width: 150,
      field: 'ro_no',
      headerName: 'Request Id',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {params?.row?.ro_no}
        </Typography>
      )
    },
    {
      width: 150,
      field: 'batch_no',
      headerName: 'Batch No',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {params.row.batch_no}
        </Typography>
      )
    },
    {
      width: 200,
      field: 'expiry_date',
      headerName: 'Expiry Date',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {Utility?.formatDisplayDate(params.row.expiry_date)}
        </Typography>
      )
    },
    {
      width: 200,
      field: 'dispatch_qty',
      headerName: 'Packed Quantity',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {params.row.dispatch_qty}
        </Typography>
      )
    },

    {
      width: 200,
      field: 'created_at',
      headerName: 'Packed Date',
      sortable: false,
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {Utility?.formatDisplayDate(params.row.created_at)}
        </Typography>
      )
    },
    ...(isViewOnlyPermission ? [] : [actionColumn])
  ]

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFetch = useCallback(
    debounce(storeId => {
      dispatch(fetchShipments({ storeId }))
    }, 1000),
    [dispatch]
  )

  const handleSearch = value => {
    dispatch(setShipmentParams({ search: value, page: 0 }))
    debouncedFetch(currentStoreId)
  }

  const handleSortModel = async newModel => {
    if (newModel.length > 0) {
      dispatch(
        setShipmentParams({
          sort: newModel[0].sort,
          sortColumn: newModel[0].field
        })
      )
    }
  }

  const getSlNo = index => (page + 1 - 1) * pageSize + index + 1

  const indexedRows = list?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const deleteFullFillItem = async dispatchedItemId => {
    if (dispatchedItemId) {
      try {
        setDeleteItemLoader(true)
        const result = await deleteFulfillItem(dispatchedItemId)
        if (result?.success === true) {
          toast.success(result.data)
          closeDeleteDialog()
          dispatch(fetchShipments({ storeId: currentStoreId }))
          setDeleteItemLoader(false)
        } else {
          closeDeleteDialog()
          toast.error(result.data)
          setDeleteItemLoader(false)
        }
      } catch (error) {
        toast.error(error.data)
        setDeleteItemLoader(false)

        console.log('error', error)
      }
    }
  }

  // Fetch data when pagination, sort, or priority changes
  useEffect(() => {
    dispatch(fetchShipments({ storeId: currentStoreId }))
    updateUrlParams({
      sort,
      q: search,
      column: sortColumn,
      page,
      limit: pageSize,
      subTab: shipmentTab === 'Ready To Ship' ? 'Ready To Ship' : 'Shipped'
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, sort, sortColumn, priority])

  // Restore selections from dispatchedItems when list loads
  useEffect(() => {
    if (dispatchedItems?.length > 0 && list?.length > 0) {
      dispatch(setSelectedRows(dispatchedItems))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list])

  useEffect(() => {
    if (selectedPharmacy.type === 'local') {
      setShipmentTab('Shipped')
      updateUrlParams({
        subTab: 'Shipped'
      })
    }
  }, [selectedPharmacy.type === 'local'])

  return (
    <TabContext value={shipmentTab}>
      <Grid
        container
        spacing={3}
        sx={{
          mt: 4
        }}
      >
        <Grid item size={{ xs: 12, sm: 'auto' }}>
          <TabLists
            allowScrollButtonsMobile
            onChange={(event, newValue) => {
              setShipmentTab(newValue)
              updateUrlParams({
                subTab: newValue
              })
            }}
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center'
            }}
          >
            {selectedPharmacy.type === 'local' ? null : (
              <Tab value='Ready To Ship' label={`Ready To Ship - ${total}`} />
            )}
            <Tab value='Shipped' label={totalShippedCounts ? `Shipped-${totalShippedCounts}` : 'Shipped'} />
          </TabLists>
        </Grid>
        <Grid
          item
          size={{
            xs: 12,
            sm: 12
          }}
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row', md: 'row' },
            width: '100%',
            justifyContent: { xs: 'space-between' },
            gap: { xs: 2, md: 3, sm: 1 },
            py: 1,
            alignItems: 'center'
          }}
        >
          {shipmentTab === 'Ready To Ship' && (
            <Grid item size={{ xs: 12, sm: 6 }}>
              <MUISelect
                sx={{ width: { xs: '100%', sm: '250px' } }}
                value={priority}
                label='Priority'
                options={[
                  { id: 'all', name: 'All' },
                  { id: 'high', name: 'High' },
                  { id: 'emergency', name: 'Emergency' }
                ]}
                onChange={e => {
                  dispatch(setShipmentParams({ priority: e.target.value, page: 0 }))
                }}
              />
            </Grid>
          )}
          {shipmentTab === 'Ready To Ship' &&
          (indexedRows?.length > 0 || selectedRows?.length > 0) &&
          (selectedPharmacy?.permission.key === 'ADD' || selectedPharmacy?.permission.key === 'allow_full_access') ? (
            <Grid item size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', justifyContent: 'end' }}>
              <Button
                sx={{ width: { xs: '100%', sm: '250px' } }}
                fullWidth
                disabled={selectedRows?.length === 0}
                size='big'
                variant='contained'
                onClick={() => {
                  shipItems()
                }}
              >
                Ship Selected Items
              </Button>
            </Grid>
          ) : null}
        </Grid>
      </Grid>
      <TabPanel
        value='Ready To Ship'
        sx={{
          padding: '0px !important'
        }}
      >
        <Card
          sx={{
            minWidth: '100%',

            boxShadow: 'none !important'
          }}
        >
          {selectedRows?.length > 0 && (
            <Box
              sx={{
                height: '56px',
                padding: '12px 16px 12px 16px',
                mt: 3,
                backgroundColor: alpha(theme.palette.customColors.neutral05, 0.05),
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'center',
                borderRadius: '6px'
              }}
            >
              {selectedRows?.length} Items Selected
            </Box>
          )}

          <CommonTable
            // eslint-disable-next-line lines-around-comment
            // onRowClick={handleRowClick}
            indexedRows={indexedRows}
            total={total}
            columns={columns}
            paginationModel={paginationModel}
            handleSortModel={handleSortModel}
            setPaginationModel={model => {
              dispatch(setShipmentParams({ page: model.page, pageSize: model.pageSize }))
            }}
            loading={loading}
            searchValue={search}
            handleSearch={handleSearch}
            checkBoxOption={true}
            onRowSelectionModelChange={newSelection => {
              const selectedData = indexedRows?.filter(row => newSelection?.includes(row?.id))
              dispatch(setSelectedRows(selectedData))
            }}
            selectedRows={selectedRows}
          />
        </Card>

        <ConfirmDialogBox
          open={deleteDialog}
          closeDialog={() => {
            closeDeleteDialog()
          }}
          action={() => {
            closeDeleteDialog()
          }}
          content={
            <Typography
              sx={{
                fontWeight: 400,
                fontSize: '16px',
                margin: '0px',
                padding: '0px'
              }}
            >
              'Are you sure you want to delete this item?'
            </Typography>
          }
          dialogActions={
            <>
              <Button
                variant='contained'
                size='small'
                color='primary'
                onClick={() => {
                  closeDeleteDialog()
                }}
              >
                Cancel
              </Button>
              <LoadingButton
                loading={deleteItemLoader}
                size='small'
                variant='contained'
                color='error'
                onClick={() => {
                  deleteFullFillItem(deleteFullFillId)
                }}
              >
                Confirm
              </LoadingButton>
            </>
          }
        />
      </TabPanel>
      <TabPanel
        value='Shipped'
        sx={{
          padding: '0px !important'
        }}
      >
        <Card
          sx={{
            mb: 6,
            minWidth: '100%',

            boxShadow: 'none !important'
          }}
        >
          <ShippedItems updateUrlParams={updateUrlParams} setTotalShippedCounts={setTotalShippedCounts} />
        </Card>
      </TabPanel>
    </TabContext>
  )
}
