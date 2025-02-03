import React, { useState, useEffect, useCallback } from 'react'
import { Box, Tooltip, Grid, Card, Button, Typography, FormControl, MenuItem, Select, InputLabel } from '@mui/material'
import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import { useTheme } from '@emotion/react'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import { styled } from '@mui/material/styles'
import MuiTabList from '@mui/lab/TabList'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { useRouter } from 'next/router'
import { debounce } from 'lodash'
import Utility from 'src/utility'
import RenderUtility from 'src/utility/render'
import { getAllShipmentsSelectedStore } from 'src/lib/api/pharmacy/storeWiseRequest'
import { alpha } from '@mui/material'
import ShippedItems from './ShippedItems'
import CommonDialogBox from 'src/components/CommonDialogBox'
import ShipRequest from 'src/components/pharmacy/request/ShipRequestForm'

export default function ShipmentRequests({ updateUrlParams }) {
  // Styled TabList component
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

  // const updateUrlParams = params => {
  //   const query = { ...router.query, ...params }
  //   router.replace({ pathname: router.pathname, query }, undefined, { shallow: true })
  // }
  const [shipmentTab, setShipmentTab] = useState(router.query.subTab || 'Ready To Ship')
  const { selectedPharmacy } = usePharmacyContext()

  // /***** Serverside pagination */

  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState(router.query.sort || 'asc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState(router.query.q || '')
  const [sortColumn, setSortColumn] = useState(router.query.column || '')
  const [loading, setLoading] = useState(false)

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page) || 0,
    pageSize: parseInt(router.query.limit) || 10
  })
  const [priority, setPriority] = useState(router.query.priority || 'all')

  function loadServerRows(currentPage, data) {
    return data
  }
  const [selectedRows, setSelectedRows] = useState([])
  const [shippingDialog, setShippingDialog] = useState(false)

  const [totalShippedCounts, setTotalShippedCounts] = useState(0)

  const closeShippingDialog = () => {
    setShippingDialog(false)
  }

  const openShippingDialog = () => {
    setShippingDialog(true)
  }
  useEffect(() => {
    updateUrlParams({
      subTab: shipmentTab
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipmentTab])

  const columns = [
    {
      width: 80,
      field: 'id',
      headerName: 'Sl No',
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
      width: 5,
      field: 'priority',
      headerName: '',
      headerAlign: 'left',
      textAlign: 'center',
      renderCell: params => <Box>{RenderUtility.getPriorityIcons(params.row?.priority)}</Box>
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
              {RenderUtility?.renderControlLabel(
                !isNaN(params.row?.prescription_required) && parseInt(params.row?.prescription_required) === 1,
                'PR'
              )}
              {params.row?.medicin_name}
            </Typography>
          </Tooltip>
          <Tooltip
            title={
              params?.row?.package &&
              params?.row?.package_qty &&
              params?.row?.package_uom_label &&
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
              {params?.row?.package &&
              params?.row?.package_qty &&
              params?.row?.package_uom_label &&
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
      field: 'ro_no',
      headerName: 'Request Id',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {params.row.ro_no}
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
            fontWeight: 500,
            fontFamily: 'Inter'
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
            fontWeight: 500,
            fontFamily: 'Inter'
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
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {params.row.dispatch_qty}
        </Typography>
      )
    },

    {
      width: 200,
      field: 'requested_date',
      headerName: 'Packed Date',
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

  const fetchTableData = useCallback(
    async ({ sort, q, column }) => {
      try {
        setLoading(true)

        let params = {
          limit: paginationModel?.pageSize,
          page: paginationModel?.page + 1,
          q,
          sort,
          column,
          ...(priority !== 'all' && { priority: priority })
        }

        await getAllShipmentsSelectedStore({ params: params }, id).then(res => {
          console.log('result', res)

          if (res?.success === true && res?.data?.dispatch_items?.length > 0) {
            setTotal(parseInt(res?.data?.total))

            // adding dispatch_item_id as id here to get unique row
            // setRows(loadServerRows(paginationModel?.page, res?.data?.dispatch_items))
            const updatedRows = res?.data?.dispatch_items?.map((item, index) => ({
              ...item,
              id: item?.dispatch_item_id
            }))
            setRows(loadServerRows(paginationModel?.page, updatedRows))
          } else {
            setTotal(0)
            setRows([])
          }
        })
        setLoading(false)
      } catch (e) {
        console.log(e)
        setLoading(false)
      }
    },
    [paginationModel, priority]
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

  const getSlNo = index => (paginationModel?.page + 1 - 1) * paginationModel?.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  useEffect(() => {
    fetchTableData({ sort, q: searchValue, column: sortColumn })
    updateUrlParams({
      sort,
      q: searchValue,
      column: sortColumn,
      page: paginationModel?.page,
      limit: paginationModel?.pageSize,
      subTab: shipmentTab === 'Ready To Ship' ? 'Ready To Ship' : 'Shipped'
    })
  }, [fetchTableData])

  return (
    <TabContext value={shipmentTab}>
      <TabLists
        onChange={(event, newValue) => {
          setShipmentTab(newValue)
          updateUrlParams({
            subTab: newValue
          })
        }}
        sx={{
          // width: '100%',
          height: 'auto',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },

          // justifyContent: 'center',
          alignItems: 'center',
          justifyContent: 'space-between',

          // py: 2,
          mt: 6
        }}
      >
        {console.log('total', total)}
        <Tab value='Ready To Ship' label={`Ready To Ship - ${total}`} />
        <Tab value='Shipped' label={`Shipped - ${totalShippedCounts} `} />

        <Grid
          container
          sx={{
            display: 'flex',
            flexDirection: { xs: 'row', md: 'row' },
            width: '100%',
            justifyContent: { xs: 'space-between', md: 'flex-end' },
            gap: { xs: 2, md: 3 },
            py: 1
          }}
        >
          {shipmentTab === 'Ready To Ship' && (
            <Grid item xs={5.5} md={2.5} lg={2.5}>
              <FormControl fullWidth size='small'>
                <InputLabel sx={{ py: '2px' }}>Priority</InputLabel>
                <Select
                  value={priority}
                  label='Priority'
                  onChange={e => {
                    setPriority(e.target.value)
                    setPaginationModel({ page: parseInt(0), pageSize: parseInt(10) })
                  }}
                >
                  <MenuItem value='all'>All</MenuItem>
                  <MenuItem value='high'>High</MenuItem>
                  <MenuItem value='emergency'>Emergency</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}
          {(shipmentTab === 'Ready To Ship' && indexedRows.length > 0 && selectedPharmacy?.permission.key === 'ADD') ||
          selectedPharmacy?.permission.key === 'allow_full_access' ? (
            <Grid item xs={5.5} md={2.5} lg={2.5}>
              <Button
                fullWidth
                size='big'
                variant='contained'
                onClick={() => {
                  openShippingDialog()
                }}
              >
                Ship All Items
              </Button>
            </Grid>
          ) : null}
        </Grid>
      </TabLists>

      <TabPanel
        value='Ready To Ship'
        sx={{
          padding: '0px !important'
        }}
      >
        <Card
          sx={{
            minWidth: '100%',
            ml: -2,
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
                alignItems: 'center'
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
            setPaginationModel={setPaginationModel}
            loading={loading}
            searchValue={searchValue}
            checkBoxOption={true}
            onRowSelectionModelChange={newSelection => {
              console.log('RowSelectionModel', newSelection.row)
              const selectedData = indexedRows.filter(row => newSelection.includes(row?.id))
              console.log('selectedData', selectedData)

              setSelectedRows(selectedData)
            }}
          />
        </Card>
      </TabPanel>
      <TabPanel
        value='Shipped'
        sx={{
          padding: '0px !important'
        }}
      >
        <Card sx={{ mb: 6, minWidth: '100%', ml: -2, boxShadow: 'none !important' }}>
          <ShippedItems updateUrlParams={updateUrlParams} setTotalShippedCounts={setTotalShippedCounts} />
        </Card>
      </TabPanel>
      <Grid container sx>
        <CommonDialogBox
          noWidth={'noWidth'}
          title={'Add Alternative Supply'}
          dialogBoxStatus={shippingDialog}
          formComponent={
            <ShipRequest
              dispatchedItems={selectedRows?.length > 0 ? selectedRows : indexedRows}
              storeDetails={selectedRows?.length > 0 ? selectedRows : indexedRows}
              resetForm={() => {
                closeShippingDialog(), fetchTableData({ sort, q: searchValue, column: sortColumn })
              }}
              close={false}
              permissionView={true}
            />
          }
          close={closeShippingDialog}
          show={openShippingDialog}
        />
      </Grid>
    </TabContext>
  )
}
