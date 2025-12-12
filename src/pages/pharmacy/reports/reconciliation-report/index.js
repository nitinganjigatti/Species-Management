import { useTheme } from '@emotion/react'
import { Grid, Tooltip, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { debounce } from 'lodash'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useState } from 'react'
import Utility from 'src/utility'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import { ExportButton, FilterButton } from 'src/views/utility/render-snippets'
import PharmacyProductCard from 'src/views/utility/PharmacyProductCard'
import { getReconciliationReport } from 'src/lib/api/pharmacy/reports'
import MUIDatePicker from 'src/views/forms/form-fields/MUIDatePicker'
import dayjs from 'dayjs'
import MUISearch from 'src/views/forms/form-fields/MUISearch'
import MUISwitch from 'src/views/forms/form-fields/MUISwitch'
import MUISelect from 'src/views/forms/form-fields/MUISelect'
import { statusOptions } from 'src/constants/PharmacyConstants'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'

const ReconciliationReport = () => {
  const router = useRouter()
  const theme = useTheme()

  const { selectedPharmacy } = usePharmacyContext()

  const updateUrlParams = params => {
    const query = { ...router.query, ...params }
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true })
  }

  // const statusOptions = [
  //   { id: 'all', label: 'All' },
  //   { id: 'active', label: 'Active' },
  //   { id: 'inactive', label: 'Inactive' }
  // ]

  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [sort, setSort] = useState(router.query.sort || 'asc')
  const [sortColumn, setSortColumn] = useState(router.query.column || 'stock_name')
  const [searchValue, setSearchValue] = useState(router.query.q || '')
  const [monthAndYear, setMonthAndYear] = useState(router.query.monthAndYear || dayjs())
  const [exportLoading, setExportLoading] = useState(false)
  const [activeStatus, setActiveStatus] = useState('all')
  const [filterSwitch, setFilterSwitch] = useState(false)
  const [excelExportLoader, setExcelExportLoader] = useState(false)

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page) || 0,
    pageSize: parseInt(router.query.limit) || 50
  })

  function loadServerRows(currentPage, data) {
    return data
  }

  const fetchTableData = useCallback(
    async ({ sort, q, column, page, limit }) => {
      try {
        setLoading(true)

        const params = {
          page: page + 1,
          limit: limit,
          sort: sort,
          q: q,
          column: column,
          month: monthAndYear.month() + 1,
          year: monthAndYear.year(),
          group_by: filterSwitch ? 'batch' : 'stock',
          ...(activeStatus && activeStatus !== 'all' ? { active: activeStatus === 'active' ? '1' : '0' } : {})
        }
        await getReconciliationReport({ params: params }).then(res => {
          console.log(res)

          if (res?.success === true && res?.data?.length > 0) {
            setTotal(parseInt(res?.count))
            setRows(loadServerRows(paginationModel?.page, res?.data))
          } else {
            setTotal(parseInt(res?.count) || 0)
            setRows([])
          }
        })
        setLoading(false)
      } catch (e) {
        console.log(e)
        setTotal(parseInt(0))
        setLoading(false)
      }
    },
    [monthAndYear, filterSwitch, activeStatus, paginationModel?.page]
  )

  useEffect(() => {
    fetchTableData({
      sort: sort,
      q: searchValue,
      column: sortColumn,
      page: paginationModel?.page,
      limit: paginationModel?.pageSize

      // month: monthAndYear.month,
      // year: monthAndYear.year
    })
    updateUrlParams({
      sort,
      q: searchValue,
      column: sortColumn,
      page: paginationModel?.page,
      limit: paginationModel?.pageSize,
      monthAndYear: monthAndYear,
      filterSwitch: filterSwitch,
      activeStatus: activeStatus

      // month: monthAndYear.month(),
      // year: monthAndYear.year()
    })
  }, [
    paginationModel?.page,
    paginationModel?.pageSize,
    sort,
    sortColumn,
    selectedPharmacy.id,
    monthAndYear,
    filterSwitch,
    activeStatus,
    searchValue
  ])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: getSlNo(index)
  }))

  // Common style for column headers
  const columnHeaderStyle = {
    whiteSpace: 'normal',
    lineHeight: '1.3',
    textAlign: 'center',
    fontSize: '12px',
    fontWeight: 450
  }

  const columns = [
    {
      width: 100,
      minWidth: 20,
      field: 'id',
      sortable: false,
      headerName: 'SL.NO',
      align: 'center',
      headerAlign: 'center',
      renderHeader: () => <Typography sx={{ ...columnHeaderStyle }}>SL.NO</Typography>,

      renderCell: params => (
        <Box sx={{ minWidth: 40, textAlign: 'center' }}>
          <Typography sx={{ color: 'text.primary', fontSize: '14px', fontWeight: '400px' }}>
            {params.row.id + '.'}
          </Typography>
        </Box>
      )
    },
    {
      minWidth: 20,
      width: 340,
      field: 'stock_name',
      headerName: 'PRODUCT NAME',
      sortable: true,
      renderHeader: () => <Typography sx={{ ...columnHeaderStyle }}>PRODUCT NAME</Typography>,
      renderCell: params => (
        <>
          <PharmacyProductCard
            title={params?.row?.stock_name}
            icon={params?.row?.image}
            controlSubstance={params?.row?.controlled_substance === '1' && true}
            prescriptionRequired={params?.row?.prescription_required === '1' && true}
            rowWidth={320}
          />
        </>
      )
    },
    {
      minWidth: 20,
      width: 140,
      field: 'batch_no',
      headerName: 'BATCH NO',
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderHeader: () => <Typography sx={{ ...columnHeaderStyle }}>BATCH NO</Typography>,
      renderCell: params => (
        <Tooltip title={params?.row?.batch_no || ''}>
          <Typography
            variant='body2'
            sx={{
              color: theme.palette.customColors.customHeadingTextColor,
              fontSize: '14px',
              fontWeight: 400,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              maxWidth: 120
            }}
          >
            {params?.row?.batch_no || '-'}
          </Typography>
        </Tooltip>
      )
    },
    {
      minWidth: 20,
      width: 160,
      field: 'opening_balance',
      headerName: '',
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderHeader: () => (
        <Typography sx={{ ...columnHeaderStyle }}>
          OPENING
          <br />
          BALANCE
        </Typography>
      ),
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {params.row.opening_balance ? Utility.formatNumber(params.row.opening_balance) : 0}
        </Typography>
      )
    },
    {
      minWidth: 20,
      width: 180,
      field: 'current_balance',
      headerName: '',
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderHeader: () => (
        <Typography sx={{ ...columnHeaderStyle }}>
          CURRENT
          <br />
          BALANCE
        </Typography>
      ),
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {params.row.current_balance ? Utility.formatNumber(params.row.current_balance) : 0}
        </Typography>
      )
    },

    {
      minWidth: 20,
      width: 160,
      field: 'purchase_qty_curr',
      headerName: '',
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderHeader: () => (
        <Typography sx={{ ...columnHeaderStyle }}>
          PURCHASE
          <br />
          QTY
        </Typography>
      ),
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {params.row.purchase_qty_curr ? Utility.formatNumber(params.row.purchase_qty_curr) : 0}
        </Typography>
      )
    },

    {
      minWidth: 20,
      width: 160,
      field: 'request_qty_curr',
      headerName: '',
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderHeader: () => (
        <Typography sx={{ ...columnHeaderStyle }}>
          REQUEST
          <br />
          QTY
        </Typography>
      ),
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {params.row.request_qty_curr ? Utility.formatNumber(params.row.request_qty_curr) : 0}
        </Typography>
      )
    },

    {
      minWidth: 20,
      width: 160,
      field: 'dispatch_qty_curr',
      headerName: '',
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderHeader: () => (
        <Typography sx={{ ...columnHeaderStyle }}>
          DISPATCH
          <br />
          QTY
        </Typography>
      ),
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {params.row.dispatch_qty_curr ? Utility.formatNumber(params.row.dispatch_qty_curr) : 0}
        </Typography>
      )
    },

    {
      minWidth: 20,
      width: 180,
      field: 'dispatch_dispute_qty_curr',
      headerName: '',
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderHeader: () => (
        <Typography sx={{ ...columnHeaderStyle }}>
          DISPATCH DISPUTE
          <br />
          QTY
        </Typography>
      ),
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {params.row.dispatch_dispute_qty_curr ? Utility.formatNumber(params.row.dispatch_dispute_qty_curr) : 0}
        </Typography>
      )
    },

    {
      minWidth: 20,
      width: 160,
      field: 'return_qty_curr',
      headerName: '',
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderHeader: () => (
        <Typography sx={{ ...columnHeaderStyle }}>
          RETURN
          <br />
          QTY
        </Typography>
      ),
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {params.row.return_qty_curr ? Utility.formatNumber(params.row.return_qty_curr) : 0}
        </Typography>
      )
    },

    {
      minWidth: 20,
      width: 180,
      field: 'return_dispute_qty_curr',
      headerName: '',
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderHeader: () => (
        <Typography sx={{ ...columnHeaderStyle }}>
          RETURN DISPUTE
          <br />
          QTY
        </Typography>
      ),
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {params.row.return_dispute_qty_curr ? Utility.formatNumber(params.row.return_dispute_qty_curr) : 0}
        </Typography>
      )
    },

    {
      minWidth: 20,
      width: 200,
      field: 'dispatch_shipment_qty_curr',
      headerName: '',
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderHeader: () => (
        <Typography sx={{ ...columnHeaderStyle }}>
          DISPATCH SHIPMENT
          <br />
          QTY
        </Typography>
      ),
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {params.row.dispatch_shipment_qty_curr ? Utility.formatNumber(params.row.dispatch_shipment_qty_curr) : 0}
        </Typography>
      )
    },

    {
      minWidth: 20,
      width: 200,
      field: 'return_shipment_qty_curr',
      headerName: '',
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderHeader: () => (
        <Typography sx={{ ...columnHeaderStyle }}>
          RETURN SHIPMENT
          <br />
          QTY
        </Typography>
      ),
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {params.row.return_shipment_qty_curr ? Utility.formatNumber(params.row.return_shipment_qty_curr) : 0}
        </Typography>
      )
    },

    {
      minWidth: 20,
      width: 160,
      field: 'escrow_qty_curr',
      headerName: '',
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderHeader: () => (
        <Typography sx={{ ...columnHeaderStyle }}>
          ESCROW
          <br />
          QTY
        </Typography>
      ),
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {params.row.escrow_qty_curr ? Utility.formatNumber(params.row.escrow_qty_curr) : 0}
        </Typography>
      )
    },

    {
      minWidth: 20,
      width: 160,
      field: 'dispense_qty_curr',
      headerName: '',
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderHeader: () => (
        <Typography sx={{ ...columnHeaderStyle }}>
          DISPENSE
          <br />
          QTY
        </Typography>
      ),
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {params.row.dispense_qty_curr ? Utility.formatNumber(params.row.dispense_qty_curr) : 0}
        </Typography>
      )
    },

    {
      minWidth: 20,
      width: 160,
      field: 'adjustment_qty_curr',
      headerName: '',
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderHeader: () => (
        <Typography sx={{ ...columnHeaderStyle }}>
          ADJUSTMENT
          <br />
          QTY
        </Typography>
      ),
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {params.row.adjustment_qty_curr ? Utility.formatNumber(params.row.adjustment_qty_curr) : 0}
        </Typography>
      )
    },

    {
      minWidth: 20,
      width: 160,
      field: 'discard_qty_curr',
      headerName: '',
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderHeader: () => (
        <Typography sx={{ ...columnHeaderStyle }}>
          DISCARD
          <br />
          QTY
        </Typography>
      ),
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {params.row.discard_qty_curr ? Utility.formatNumber(params.row.discard_qty_curr) : 0}
        </Typography>
      )
    }

    // {
    //   minWidth: 20,
    //   width: 190,
    //   field: 'available_qty',
    //   headerName: '',
    //   sortable: false,
    //   align: 'center',
    //   headerAlign: 'center',
    //   renderHeader: () => (
    //     <Typography sx={{ ...columnHeaderStyle }}>
    //       CURRENT STOCK
    //       <br />
    //       AVAILABLE
    //     </Typography>
    //   ),
    //   renderCell: params => (
    //     <Typography
    //       variant='body2'
    //       sx={{
    //         color: theme.palette.customColors.customHeadingTextColor,
    //         fontSize: '14px',
    //         fontWeight: 500,
    //         fontFamily: 'Inter'
    //       }}
    //     >
    //       {params.row.available_qty ? Utility.formatNumber(params.row.available_qty) : 0}
    //     </Typography>
    //   )
    // }

    // Current Balance
  ]

  const handleSortModel = newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)

      fetchTableData({
        sort: newModel[0].sort,
        q: searchValue,
        column: newModel[0].field,
        page: paginationModel?.page,
        limit: paginationModel?.pageSize
      })
      updateUrlParams({
        sort: newModel[0].sort,
        q: searchValue,
        column: newModel[0].field,
        page: paginationModel?.page,
        limit: paginationModel?.pageSize
      })
    }
  }

  const searchTableData = useCallback(
    debounce(async (sort, q, column, page, limit) => {
      setSearchValue(q)

      try {
        await fetchTableData({
          sort: sort,
          q: q,
          column: column,
          page: page,
          limit: limit
        })

        updateUrlParams({
          sort: sort,
          q: q,
          column: column,
          page: page,
          limit: limit
        })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, sortColumn, paginationModel?.page, paginationModel?.pageSize)
  }

  const datePickerHandleChange = newValue => {
    // debounce(newValue => {
    if (!newValue || !newValue.isValid()) return
    setMonthAndYear(newValue)
  }

  // }, [])
  const handleSwitchChange = event => {
    setTotal(0)
    setSearchValue('')
    setPaginationModel({ page: 0, pageSize: 50 })
    setFilterSwitch(event.target.checked)

    // setFilterSwitch(event.target.checked)
    // updateUrlParams({
    //   sort,
    //   q: searchValue,
    //   column: sortColumn,

    //   // status: status,
    //   // startDate: filterDates.startDate,
    //   // endDate: filterDates.endDate,
    //   // store: filterByStoreId,
    //   page: 0,
    //   limit: 10

    //   // days: selectDays
    // })
  }

  const handleExport = async () => {
    try {
      setExcelExportLoader(true)

      const params = {
        page: 1,
        sort: sort,
        q: searchValue,
        column: sortColumn,
        month: monthAndYear.month() + 1,
        year: monthAndYear.year(),
        group_by: filterSwitch ? 'batch' : 'stock',
        ...(activeStatus && activeStatus !== 'all' ? { active: activeStatus === 'active' ? '1' : '0' } : {}),
        response_type: 'csv'
      }
      await getReconciliationReport({ params: params }).then(res => {
        debugger
        if (res?.success && res?.data) {
          Utility.downloadFileFromURL(res.data)
          setExcelExportLoader(false)
        }
      })
    } catch (e) {
      console.log(e)
      setExcelExportLoader(false)
    }
  }

  return (
    <PageCardLayout title={'Reconciliation Report'}>
      <Grid container spacing={4}>
        <Grid item size={{ xs: 12, sm: 3 }}>
          <MUIDatePicker
            size='small'
            format='MMM YYYY'
            name='year'
            label='Select Month And Year'
            views={['year', 'month']}
            value={monthAndYear}
            maxDate={dayjs()}
            onAccept={datePickerHandleChange}
          />
        </Grid>
        <Grid item size={{ xs: 12, sm: 3 }} sx={{ ml: 'auto' }}>
          <MUISearch
            size='medium'
            placeholder='Search...'
            value={searchValue}
            onChange={e => handleSearch(e.target.value)}
            onClear={() => {
              handleSearch('')
            }}
          />
        </Grid>
        <Grid item size={{ xs: 12, sm: 2.5, md: 2, lg: 2 }}>
          <MUISelect
            value={activeStatus}
            label='Filter by Status'
            onChange={e => {
              setTotal(0)
              setPaginationModel({ page: 0, pageSize: 50 })
              setActiveStatus(e.target.value)
              setSearchValue('')
            }}
            options={statusOptions}
          />
        </Grid>
        <Grid
          item
          size={{ xs: 6, sm: 2.5, md: 1.6, lg: 1.6 }}
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center'
          }}
        >
          <MUISwitch
            formControlStyle={{
              margin: 0
            }}
            label='Batch Wise'
            labelStyle={{
              color: theme.palette.customColors.customHeadingTextColor,
              fontSize: '14px',
              fontWeight: 400
            }}
            labelPlacement='end'
            value={filterSwitch}
            defaultChecked={filterSwitch}
            onChange={e => {
              console.log('switch checked', e.target.checked)
              handleSwitchChange(e)
            }}
          />
        </Grid>
        <Grid
          size={{ xs: 6, sm: 'auto', md: 'auto', lg: 'auto' }}
          sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-end'
          }}
        >
          <ExportButton sx={{ height: '35px' }} loading={excelExportLoader} onClick={() => handleExport()} />
        </Grid>
      </Grid>
      <Grid>
        <CommonTable
          columns={columns}
          indexedRows={indexedRows}
          total={total}
          paginationModel={paginationModel}
          loading={loading}
          setPaginationModel={setPaginationModel}
          searchValue={searchValue}
          onPaginationModelChange={model => {
            setPaginationModel(model)
            router.replace({
              pathname: router.pathname,
              query: {
                ...router.query,
                page: model.page + 1,
                pageSize: model.pageSize,
                searchValue,
                sort,
                sortColumn
              }
            })
          }}
          handleSortModel={handleSortModel}
        />
      </Grid>
    </PageCardLayout>
  )
}

export default ReconciliationReport
