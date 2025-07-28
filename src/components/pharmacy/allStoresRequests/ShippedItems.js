import React, { useState, useEffect, useCallback } from 'react'
import { Box, Typography, Grid } from '@mui/material'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { useRouter } from 'next/router'
import { debounce } from 'lodash'
import Utility from 'src/utility'
import { getAllShippedItemsOfSelectedStore } from 'src/lib/api/pharmacy/storeWiseRequest'
import Icon from 'src/@core/components/icon'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import { ExportButton } from 'src/views/utility/render-snippets'

export default function ShippedItems({ updateUrlParams, setTotalShippedCounts }) {
  const router = useRouter()
  const { selectedPharmacy } = usePharmacyContext()

  const { id } = router.query

  // /***** Serverside pagination */

  const [total, setTotal] = useState(0)

  const [sort, setSort] = useState(router.query.sort || 'asc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState(router.query.q || '')
  const [sortColumn, setSortColumn] = useState('')
  const [loading, setLoading] = useState(false)

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page) || 0,
    pageSize: parseInt(router.query.limit) || 50
  })
  const [exportLoading, setExportLoading] = useState(false)

  function loadServerRows(currentPage, data) {
    return data
  }

  const shippedColumns = [
    {
      width: 80,
      field: 'id',
      headerName: 'SL.NO',
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
      field: 'status',
      headerName: 'Status',
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

  const fetchTableData = useCallback(
    async ({ sort, q, column }) => {
      try {
        setLoading(true)

        let params = {
          limit: paginationModel?.pageSize,
          page: paginationModel?.page + 1,
          q,
          sort,
          column
        }

        const currentStoreId = selectedPharmacy.type === 'local' ? selectedPharmacy.id : id

        await getAllShippedItemsOfSelectedStore({ params: params }, currentStoreId).then(res => {
          if (res?.success === true && res?.data?.items?.length > 0) {
            setTotal(parseInt(res?.data?.total))
            setTotalShippedCounts(parseInt(res?.data?.total))
            setRows(loadServerRows(paginationModel?.page, res?.data?.items))
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
    [paginationModel]
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
      limit: paginationModel?.pageSize
    })
  }, [fetchTableData])

  const handleRowClick = params => {
    // console.log('paramsa.handleRowClick', params.row)

    router.push({
      pathname: `/pharmacy/requests-by-store/${params.row.id}/shipment-details`,

      query: { shipmentId: params.row.id }
    })
  }

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
        response_type: 'csv'
      }

      const response = await getAllShippedItemsOfSelectedStore({ params: params }, currentStoreId)
      if (response?.success && response?.data) {
        Utility.downloadFileFromURL(response.data, `Requested_by_store_shipped_items ${timestamp}`)
        setExportLoading(false)
      }
    } catch (error) {
      console.error('Problem downloading Excel File :', error)
      setExportLoading(false)
    }
  }

  return (
    <>
      <Grid
        item
        xs={12}
        md={6}
        sx={{
          display: 'flex',
          justifyContent: { xs: 'flex-end', sm: 'flex-end' },
          mr: 1
        }}
      >
        <ExportButton onClick={handleExport} loading={exportLoading} disabled={total === 0} />
      </Grid>
      <CommonTable
        // eslint-disable-next-line lines-around-comment
        onRowClick={handleRowClick}
        indexedRows={indexedRows}
        total={total}
        columns={shippedColumns}
        paginationModel={paginationModel}
        handleSortModel={handleSortModel}
        setPaginationModel={setPaginationModel}
        loading={loading}
        searchValue={searchValue}
      />
    </>
  )
}
