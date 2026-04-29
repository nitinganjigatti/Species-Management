import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Box, Grid, styled, Tab, alpha, Typography } from '@mui/material'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@emotion/react'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { useRouter } from 'next/router'
import { debounce } from 'lodash'
import MuiTabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import { getIncomingAndOutgoingShipments } from 'src/lib/api/pharmacy/allShipments'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import { useForm } from 'react-hook-form'
import Search from 'src/views/utility/Search'
import { getStoreList } from 'src/lib/api/pharmacy/getStoreList'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'

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
    color: `${theme.palette.common.white}!important`,
    maxHeight: '40px !important',
    minHeight: '40px !important'
  }
}))

function InComingAndOutGoingShipments({ type }) {
  const theme = useTheme()
  const router = useRouter()
  const { id } = router.query
  const { selectedPharmacy } = usePharmacyContext()

  const updateUrlParams = params => {
    const query = { ...router.query, ...params }
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true })
  }

  const { control, watch, setValue } = useForm({
    defaultValues: {
      selectedStore: null,
      selectedRequest: null
    }
  })

  const selectedStore = selectedPharmacy.type === 'central' && watch('selectedStore')
  const selectedRequest = selectedPharmacy.type === 'central' && watch('selectedRequest')

  const [total, setTotal] = useState(0)

  const [sort, setSort] = useState(router.query.sort || 'asc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState(router.query.q || '')
  const [loading, setLoading] = useState(false)

  const [sortColumn, setSortColumn] = useState('label')
  const [shipmentTab, setShipmentTab] = useState(router.query.shipmentTab || 'pending')

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page) || 0,
    pageSize: parseInt(router.query.limit) || 50
  })
  function loadServerRows(currentPage, data) {
    return data
  }
  const [storeOptions, setStoreOptions] = useState([])

  const shippedColumns = [
    {
      minWidth: 120,
      field: 'sl_no',
      headerName: 'Sl.No',
      align: 'left',
      headerAlign: 'left',

      renderCell: (params, rowId) => <Typography sx={{ color: 'text.primary' }}>{params?.row?.sl_no}</Typography>
    },
    {
      width: 130,
      field: 'shipment_id',
      headerName: 'Shipment Id',
      align: 'left',
      headerAlign: 'left',
      renderCell: (params, rowId) => (
        <div>
          <Typography sx={{ color: 'customColors.OnSurfaceVariant', fontWeight: 500, fontSize: '14px' }}>
            {params?.row?.shipment_id}
          </Typography>
        </div>
      )
    },
    {
      width: 120,
      field: 'ro_no',
      headerName: type === 'outing' && selectedPharmacy.type === 'central' ? 'Type' : 'Belongs To',
      align: 'left',
      headerAlign: 'left',

      renderCell: params => (
        <Typography sx={{ color: 'primary.OnSurface', fontWeight: 500, fontSize: '14px' }}>
          {Number(params?.row?.request_count) > 1 ? '-' : params?.row?.ro_no}
        </Typography>
      )
    },

    {
      flex: 1,
      minWidth: 200,
      field: 'from_store',
      headerName: type === 'outing' ? 'Shipped To' : 'Shipped From',
      align: 'left',
      headerAlign: 'left',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {type === 'outing' ? params?.row?.to_store_name : params?.row?.from_store_name}
        </Typography>
      )
    },

    {
      width: 120,
      field: 'vehicle_no',
      headerName: 'Vehicle No',
      align: 'left',
      headerAlign: 'left',
      renderCell: params => (
        <Typography sx={{ color: 'customColors.neutralSecondary', fontWeight: 500, fontSize: '14px' }}>
          {params?.row?.vehicle_no ? params?.row?.vehicle_no : 'NA'}
        </Typography>
      )
    },
    {
      width: 140,
      field: 'person_shipping',
      headerName: 'Driver Name',
      align: 'left',
      headerAlign: 'left',
      renderCell: params => (
        <Box sx={{ py: 2 }}>
          <Typography sx={{ color: 'customColors.OnSurfaceVariant', fontWeight: 400, fontSize: '14px' }}>
            {params?.row?.person_shipping ? params?.row?.person_shipping : params?.row?.receiver_name}
          </Typography>
          <Typography sx={{ color: 'customColors.neutralSecondary', fontWeight: 400, fontSize: '12px' }}>
            {params?.row?.phone_number ? params?.row?.phone_number : 'NA'}
          </Typography>
        </Box>
      )
    },

    {
      width: 160,
      field: 'status',
      headerName: 'Status',
      align: 'left',
      headerAlign: 'left',
      renderCell: params => (
        <Typography component='div' variant='body2' sx={{ color: 'text.primary' }}>
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
      align: 'left',
      headerAlign: 'left',
      renderCell: params => (
        <>
          <UserAvatarDetails
            profile_image={params?.row?.user_created_profile_pic}
            user_name={params?.row?.created_by_user_name}
            date={params?.row?.created_at}
          />
        </>
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
          type: type,
          status: shipmentTab,
          ...(selectedRequest && { request_id: selectedRequest.id }),
          ...(selectedStore && selectedPharmacy?.type === 'central' && { search_store_id: selectedStore.id })
        }

        await getIncomingAndOutgoingShipments({ params }).then(res => {
          console.log('result', res)
          if (res?.success === true && res?.data?.items?.length > 0) {
            setTotal(parseInt(res?.data?.total))
            setRows(loadServerRows(paginationModel?.page, res?.data?.items))
            updateUrlParams({
              sort,
              q: searchValue,
              column: column,
              shipmentTab: shipmentTab,
              page: paginationModel?.page,
              limit: paginationModel?.pageSize
            })
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
    [paginationModel, selectedStore]
  )

  const searchTableData = useCallback(
    debounce(async ({ sort, q, column }) => {
      setTotal(0)
      setPaginationModel({ page: 0, pageSize: 50 })
      try {
        await fetchTableData({ sort, q, column })
        updateUrlParams({
          sort,
          q: q,
          page: paginationModel.page,
          limit: paginationModel.pageSize
        })
        setSearchValue(q)
      } catch (error) {
        console.error(error)
      }
    }, 500),
    [fetchTableData]
  )

  const handleSortModel = async newModel => {
    if (newModel.length > 0) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
      await searchTableData({ sort: newModel[0].sort, q: searchValue, column: newModel[0].field })
    } else {
    }
  }

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData({ sort, q: value, column: sortColumn })
  }

  const getSlNo = index => (paginationModel?.page + 1 - 1) * paginationModel?.pageSize + index + 1

  const indexedRows = useMemo(
    () =>
      rows?.map((row, index) => ({
        ...row,
        sl_no: getSlNo(index)
      })) || [],

    [rows, paginationModel?.page, paginationModel?.pageSize]
  )

  const fetchStoreList = async () => {
    try {
      const response = await getStoreList({ params: { type: 'local', sort: 'asc' } })
      if (response?.data?.list_items?.length > 0) {
        response?.data?.list_items?.sort((a, b) => a.id - b.id)
        setStoreOptions(response?.data?.list_items)
      } else {
      }
    } catch (error) {
      console.log('error', error)
    }
  }

  const onRowClick = params => {
    const { ro_no, request_id, id, request_count } = params?.row || {}
    const isIncoming = type === 'incoming'

    if (!ro_no) return

    let subPath = ''
    let requestedFrom = ''
    if (ro_no?.startsWith('RES')) {
      subPath = isIncoming ? 'incoming-shipments' : 'outgoing-shipments'
      requestedFrom = request_count > 1 ? 'requestByAllStores' : 'request'
    } else if (ro_no?.startsWith('RET')) {
      subPath = isIncoming ? 'incoming-shipments' : 'outgoing-shipments'
      requestedFrom = request_count > 1 ? 'requestByAllStores' : 'return'
    } else if (ro_no?.startsWith('DD')) {
      subPath = isIncoming ? 'incoming-shipments' : 'outgoing-shipments'
      requestedFrom = request_count > 1 ? 'requestByAllStores' : 'directDispatch'
    } else if (ro_no?.startsWith('DL')) {
      subPath = isIncoming ? 'incoming-shipments' : 'outgoing-shipments'
      requestedFrom = request_count > 1 ? 'requestByAllStores' : 'localDispatch'
    } else {
      return
    }

    router.push({
      pathname: `/pharmacy/shipments/${subPath}/${request_id}`,
      query: {
        orderId: id,
        requestId: request_id,
        requestedFrom
      }
    })
  }
  useEffect(() => {
    fetchTableData({ sort, q: searchValue, column: sortColumn })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPharmacy.id, selectedStore, selectedRequest, shipmentTab, paginationModel.page, paginationModel.pageSize])

  useEffect(() => {
    fetchStoreList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pageContent = () => {
    return (
      <CommonTable
        // eslint-disable-next-line lines-around-comment
        onRowClick={onRowClick}
        indexedRows={indexedRows}
        total={total}
        columns={shippedColumns}
        paginationModel={paginationModel}
        handleSortModel={handleSortModel}
        setPaginationModel={setPaginationModel}
        loading={loading}
        searchValue={searchValue}
        externalTableStyle={{
          '& .MuiDataGrid-cell': {
            paddingLeft: '16px',
            paddingRight: '16px',
            display: 'flex',
            alignItems: 'center',
            lineHeight: 'normal'
          }
        }}
      />
    )
  }

  return (
    <PageCardLayout title={type === 'incoming' ? 'Incoming shipments' : 'Outgoing shipments'}>
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
        <Grid item size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
          <Search
            width={{ xs: '100%', sm: '250px' }}
            placeholder='Search...'
            value={searchValue}
            onChange={e => handleSearch(e.target.value)}
            onClear={() => handleSearch('')}
          />
        </Grid>
        <Grid item size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
          {selectedPharmacy?.type === 'central' && (
            <ControlledAutocomplete
              name='selectedStore'
              label='Filter By Store'
              control={control}
              errors={{}}
              options={storeOptions}
              onChangeOverride={value => {
                console.log('value', value)
                if (value) setValue('selectedStore', value)
                else setValue('selectedStore', null)
              }}
              getOptionLabel={o => o.name}
              isOptionEqualToValue={(o, v) => o.id === v?.id}
              textFieldProps={{
                size: 'small',
                InputProps: {
                  sx: { fontSize: '0.875rem', height: 40 }
                },
                InputLabelProps: {
                  sx: { fontSize: '0.875rem' }
                }
              }}
            />
          )}
        </Grid>
      </Grid>
      <TabContext value={shipmentTab}>
        <TabLists
          variant='scrollable'
          allowScrollButtonsMobile
          container
          onChange={(event, newValue) => {
            setShipmentTab(newValue)
            setPaginationModel({
              page: 0,
              pageSize: 50
            })
          }}
          sx={{
            height: 'auto',
            mt: 5
          }}
        >
          <Tab value='pending' label='Pending' />
          <Tab value='dispute' label='Dispute' />
          <Tab value='all' label='All' />
        </TabLists>

        <TabPanel
          value='pending'
          sx={{
            padding: '0px !important'
          }}
        >
          {pageContent()}
        </TabPanel>
        <TabPanel
          value='dispute'
          sx={{
            padding: '0px !important'
          }}
        >
          {pageContent()}
        </TabPanel>
        <TabPanel
          value='all'
          sx={{
            padding: '0px !important'
          }}
        >
          {pageContent()}
        </TabPanel>
      </TabContext>
    </PageCardLayout>
  )
}

export default React.memo(InComingAndOutGoingShipments)
