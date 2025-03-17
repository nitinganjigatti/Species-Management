import { useTheme } from '@emotion/react'
import {
  Badge,
  Card,
  CardHeader,
  CircularProgress,
  Grid,
  InputAdornment,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { Box } from '@mui/system'
import { debounce } from 'lodash'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useState } from 'react'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import { getConsumptionReport } from 'src/lib/api/pharmacy/reports'
import Utility from 'src/utility'
import Icon from 'src/@core/components/icon'
import RenderUtility from 'src/utility/render'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { getStoreList } from 'src/lib/api/pharmacy/getStoreList'
import ConsumptionReportDrawer from 'src/views/pages/pharmacy/reports/consumptionReportDrawer'
import { usePharmacyContext } from 'src/context/PharmacyContext'

const ConsumptionReport = () => {
  const router = useRouter()
  const theme = useTheme()

  const { selectedPharmacy } = usePharmacyContext()

  const updateUrlParams = params => {
    const query = { ...router.query, ...params }
    router.push({ pathname: router.pathname, query }, undefined, { shallow: true })
  }

  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [sort, setSort] = useState(router.query.sort || 'asc')
  const [sortColumn, setSortColumn] = useState(router.query.column || 'total_consumption_cost')
  const [searchValue, setSearchValue] = useState(router.query.q || '')
  const [exportLoading, setExportLoading] = useState(false)
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false)

  const [filteredData, setFilteredData] = useState({
    pharmacy: []
  })
  const [pharmacyList, setPharmacyList] = useState([])

  const [selectedOptions, setSelectedOptions] = useState({
    Pharmacy: []
  })

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page) || 0,
    pageSize: parseInt(router.query.limit) || 10
  })

  const [filterDates, setFilterDates] = useState({
    startDate: router.query.startDate || '',
    endDate: router.query.endDate || ''
  })

  useEffect(() => {
    const pharmacyList = async () => {
      try {
        const params = {
          type: 'local'
        }
        const response = await getStoreList({ params })
        const result = response?.data

        if (response?.success) {
          let pharmacies = result?.list_items.map(({ id, name }) => ({ id, name })) || []

          pharmacies = pharmacies.filter(pharmacy => pharmacy.id !== selectedPharmacy.id)
          setPharmacyList(pharmacies)
        }
      } catch (error) {
        console.log(error)
      }
    }
    pharmacyList()
  }, [])

  function loadServerRows(currentPage, data) {
    return data
  }

  const fetchTableData = useCallback(
    async ({ sort, q, column, page, limit, filteredData }) => {
      try {
        setLoading(true)

        const params = {
          page: page + 1,
          limit: limit,
          sort: sort,
          q: q,
          column: column,
          include_dispatch: true,
          ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
          ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate }),
          ...(filteredData &&
            filteredData.pharmacy &&
            filteredData.pharmacy.length > 0 && { store_id: filteredData.pharmacy.join(',') })
        }

        await getConsumptionReport({ params: params }).then(res => {
          if (res?.success === true && res?.data?.list_items?.length > 0) {
            setTotal(parseInt(res?.data?.total_count))
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
    [paginationModel, filterDates]
  )

  useEffect(() => {
    fetchTableData({
      sort: sort,
      q: searchValue,
      column: sortColumn,
      page: paginationModel?.page,
      limit: paginationModel?.pageSize,
      filteredData: filteredData
    })
    updateUrlParams({
      sort,
      q: searchValue,
      column: sortColumn,
      page: paginationModel?.page,
      limit: paginationModel?.pageSize
    })
  }, [paginationModel.page, paginationModel.pageSize, sort, sortColumn, filterDates, filteredData, selectedPharmacy.id])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: getSlNo(index)
  }))

  const columns = [
    {
      width: 100,
      minWidth: 20,
      field: 'id',
      sortable: false,
      headerName: 'SL NO',

      renderCell: params => (
        <Box sx={{ minWidth: 40 }}>
          <Typography sx={{ color: 'text.primary', fontSize: '14px', fontWeight: '400px' }}>
            {params.row.id + '.'}
          </Typography>
        </Box>
      )
    },
    {
      minWidth: 20,
      width: 200,
      field: 'stock_name',
      headerName: 'PRODUCT NAME',
      sortable: true,
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {params.row.stock_name}
        </Typography>
      )
    },
    {
      minWidth: 20,
      width: 200,
      field: 'generic_name',
      headerName: 'GENERIC NAME',
      sortable: true,
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {params.row.generic_name}
        </Typography>
      )
    },
    {
      minWidth: 20,
      width: 190,
      field: 'total_consumption_quantity',
      headerName: 'CONSUMPTION QUANTITY',
      sortable: true,
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {Utility.formatNumber(params.row.total_consumption_quantity)}
        </Typography>
      )
    },
    {
      minWidth: 20,
      width: 190,
      field: 'total_consumption_cost',
      headerName: 'CONSUMPTION COST',
      sortable: true,
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {Utility.formatNumber(params.row.total_consumption_cost)}
        </Typography>
      )
    },
    {
      minWidth: 20,
      width: 190,
      field: 'available_qty',
      headerName: 'AVAILABLE QUANTITY',
      sortable: true,
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {Utility.formatNumber(params.row.available_qty)}
        </Typography>
      )
    },
    {
      minWidth: 20,
      width: 250,
      field: 'manufacturer_name',
      headerName: 'MANUFACTURER NAME',
      sortable: true,
      renderCell: params => (
        <Tooltip title={params.row?.manufacturer_name}>
          <Typography
            variant='body2'
            sx={{
              color: theme.palette.customColors.customHeadingTextColor,
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: 'Inter'
            }}
          >
            {params.row.manufacturer_name}
          </Typography>
        </Tooltip>
      )
    }
  ]

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
    } else {
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

        console.log(q)

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
    console.log(value)

    searchTableData(sort, value, sortColumn, paginationModel?.page, paginationModel?.pageSize)
  }

  const handleExport = async () => {
    try {
      setExportLoading(true)

      const now = new Date()

      const timestamp = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(
        2,
        '0'
      )}/${now.getFullYear()}(${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')})`
      console.log(timestamp)

      const params = {
        sort: sort,
        q: searchValue,
        column: sortColumn,
        page: 1,
        limit: total,
        include_dispatch: true,
        ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
        ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate }),
        ...(filteredData &&
          filteredData.pharmacy &&
          filteredData.pharmacy.length > 0 && { store_id: filteredData.pharmacy.join(',') })
      }

      const res = await getConsumptionReport({ params })

      if (res?.success === true && res?.data?.list_items?.length > 0) {
        const ListData = res?.data?.list_items

        const tableData = ListData.map((item, index) => {
          return {
            'SL NO': index + 1,
            'PRODUCT NAME': item?.stock_name || '',
            'GENERIC NAME': item?.generic_name || '',
            'TOTAL CONSUMPTION QUANTITY': Utility.formatNumber(item?.total_consumption_quantity) || '',
            'TOTAL CONSUMPTION COST': Utility.formatNumber(item?.total_consumption_cost) || '',
            'AVAILABLE QUANTITY': Utility.formatNumber(item?.available_qty) || '',
            'MANUFACTURER NAME': item?.manufacturer_name || ''
          }
        })

        Utility.exportToCSV(tableData, `Consumption_Report ${timestamp}`)
      } else {
        console.warn('No data to export.')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setExportLoading(false)
    }
  }

  const calculateAppliedFiltersCount = () => {
    let count = 0

    if (filteredData && filteredData.pharmacy && filteredData.pharmacy.length > 0) {
      count++
    }

    return count
  }

  const appliedFiltersCount = calculateAppliedFiltersCount()

  return (
    <>
      <Card>
        <CardHeader
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            gap: { xs: 3, sm: 2 },
            '& .MuiCardHeader-action': {
              width: { xs: '100% ', sm: 'auto' }
            },
            mx: { xs: -1, sm: 0 }
          }}
          title={RenderUtility.pageTitle('Consumption Report')}
        />
        <Box sx={{ marginLeft: 4, marginRight: 4 }}>
          <Grid container spacing={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Grid item xs={12} sm={6} md='auto'>
              <CommonDateRangePickers onChange={handleDateRangeChange} filterDates={filterDates} />
            </Grid>
            <Grid item xs={12} md='auto'>
              <Grid container spacing={2} alignItems='center' justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                <Grid item xs={12} sm={8} md='auto'>
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
                  xs={12}
                  sm={4}
                  md='auto'
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    justifyContent: { sm: 'flex-end', xs: 'flex-end' }
                  }}
                >
                  <Tooltip title='Export'>
                    <>
                      {loading || exportLoading ? (
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            width: '40px',
                            height: '40px',
                            borderRadius: '4px',
                            bgcolor: theme?.palette.customColors?.lightBg,
                            alignItems: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <CircularProgress color='success' size={30} />
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            width: '40px',
                            height: '40px',
                            borderRadius: '4px',
                            bgcolor: theme?.palette.customColors?.lightBg,
                            alignItems: 'center',
                            cursor: 'pointer'
                          }}
                          onClick={handleExport}
                        >
                          <Icon icon='ic:round-download' fontSize={20} />
                        </Box>
                      )}
                    </>
                  </Tooltip>
                  <Tooltip title='Filters'>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        width: '40px',
                        height: '40px',
                        borderRadius: '4px',
                        bgcolor: theme?.palette.customColors?.lightBg,
                        alignItems: 'center',
                        cursor: 'pointer'
                      }}
                      onClick={() => setOpenFilterDrawer(true)}
                    >
                      <Badge badgeContent={appliedFiltersCount} color='primary'>
                        <Icon icon='mage:filter' fontSize={24} />
                      </Badge>
                    </Box>
                  </Tooltip>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Box>
        <Grid sx={{ mx: { xs: 3, sm: 4 } }}>
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
      </Card>
      {openFilterDrawer && (
        <ConsumptionReportDrawer
          setOpenFilterDrawer={setOpenFilterDrawer}
          openFilterDrawer={openFilterDrawer}
          onApplyFilter={filterList => setFilteredData(filterList)}
          selectedOptions={selectedOptions}
          setSelectedOptions={setSelectedOptions}
          pharmacyList={pharmacyList}
        />
      )}
    </>
  )
}

export default ConsumptionReport
