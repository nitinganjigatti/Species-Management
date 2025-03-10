import { useTheme } from '@emotion/react'
import {
  Card,
  CardHeader,
  CircularProgress,
  debounce,
  Grid,
  InputAdornment,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { Box } from '@mui/system'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useState } from 'react'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import { getReturnReport } from 'src/lib/api/pharmacy/getReturnReport'
import Utility from 'src/utility'
import RenderUtility from 'src/utility/render'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import StyleWithIconCardComponent from 'src/views/utility/style-with-icon-card'
import Icon from 'src/@core/components/icon'
import ReturnReportDrawer from 'src/views/pages/pharmacy/return-report/ReturnReportDrawer'

const ReturnReport = () => {
  const router = useRouter()
  const theme = useTheme()

  const updateUrlParams = params => {
    const query = { ...router.query, ...params }
    router.push({ pathname: router.pathname, query }, undefined, { shallow: true })
  }

  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [sort, setSort] = useState(router.query.sort || 'asc')
  const [sortColumn, setSortColumn] = useState(router.query.column || 'stock_name')
  const [searchValue, setSearchValue] = useState(router.query.q || '')
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false)
  const [filteredData, setFilteredData] = useState({})
  const [exportLoading, setExportLoading] = useState(false)

  const [selectedOptions, setSelectedOptions] = useState({
    'Batch Number': [],
    pharmacy: [],
    Medicine: []
  })

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page) || 0,
    pageSize: parseInt(router.query.limit) || 10
  })

  const [filterDates, setFilterDates] = useState({
    startDate: router.query.startDate || '',
    endDate: router.query.endDate || ''
  })

  function loadServerRows(currentPage, data) {
    return data
  }

  const fetchReturnReport = useCallback(
    async ({ sort, q, column, filteredData }) => {
      try {
        setLoading(true)

        const params = {
          page: paginationModel?.page + 1,
          limit: paginationModel?.pageSize,
          sort: sort,
          q: q,
          column: column,
          ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
          ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate }),
          ...(filteredData?.Medicine && {
            controlled: filteredData.Medicine.controlled,
            prescription: filteredData.Medicine.prescription
          })
        }
        await getReturnReport({ params }).then(res => {
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
    fetchReturnReport({ sort: sort, q: searchValue, column: sortColumn, filteredData: filteredData })
    updateUrlParams({
      sort,
      q: searchValue,
      column: sortColumn,
      page: paginationModel?.page,
      limit: paginationModel?.pageSize
    })
  }, [paginationModel.page, paginationModel.pageSize, filterDates, filteredData])

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
      width: 250,
      minWidth: 20,
      field: 'stock_name',
      align: 'left',
      sortable: true,
      headerName: 'PRODUCT NAME',

      renderCell: params => (
        <Box>
          <StyleWithIconCardComponent
            value={params.row.stock_name}
            description={params.row.generic_name}
            icon={params.row.image ? `${params.row.image}` : '/images/Medicine_Icon.png'}
            showIcon={false}
            customCss={{
              p: '0px',
              width: '100%',
              height: '100%',
              fontSize: '14px',
              avtBorderRadius: '10px',
              iconWidth: '44px',
              iconHeight: '44px'
            }}
          />
        </Box>
      )
    },
    {
      minWidth: 20,
      width: 200,
      field: 'package',
      headerName: 'PACKAGE',
      sortable: false,
      renderCell: params => (
        <Tooltip
          title={`${params.row.package} of ${Utility.formatNumber(params.row.package_qty)}
              ${params.row.package_uom_label} ${params.row.product_form_label}`}
        >
          <Typography
            variant='body2'
            sx={{
              color: theme.palette.customColors.customHeadingTextColor,
              fontSize: '14px',
              fontWeight: 400,
              fontFamily: 'Inter',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              maxWidth: 240
            }}
          >
            {`${params.row.package} of ${Utility.formatNumber(params.row.package_qty)}
              ${params.row.package_uom_label} ${params.row.product_form_label}`}
          </Typography>
        </Tooltip>
      )
    },
    {
      minWidth: 20,
      width: 180,
      field: 'expiry_date',
      headerName: 'EXPIRY DATE',
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
          {Utility.formatDisplayDate(params.row.expiry_date)}
        </Typography>
      )
    },
    {
      minWidth: 20,
      width: 200,
      field: 'return_number',
      headerName: 'RETURN NUMBER',
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
          {params.row.return_number}
        </Typography>
      )
    },
    {
      minWidth: 20,
      width: 180,
      field: 'return_date',
      headerName: 'RETURN DATE',
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
          {Utility.formatDisplayDate(params.row.return_date)}
        </Typography>
      )
    },

    {
      minWidth: 20,
      width: 160,
      field: 'batch_no',
      sortable: false,
      headerName: 'BATCH NUMBER',
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
          {params.row.batch_no}
        </Typography>
      )
    },
    {
      minWidth: 20,
      width: 160,
      field: 'from_store',
      sortable: true,
      headerName: 'FROM STORE',
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
          {params.row.from_store}
        </Typography>
      )
    },
    {
      minWidth: 20,
      width: 250,
      field: 'manufacturer_name',
      sortable: false,
      headerName: 'MANUFACTURER NAME',
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
          {params.row.manufacturer_name}
        </Typography>
      )
    },
    {
      minWidth: 20,
      width: 180,
      field: 'return_qty',
      headerName: 'TOTAL RETURN QUANTITY',
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
          {Utility.formatNumber(params.row.total_return_qty)}
        </Typography>
      )
    },
    {
      minWidth: 20,
      width: 180,
      field: 'return_value',
      headerName: 'TOTAL RETURN VALUE',
      sortable: false,
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
          {Utility.formatNumber(params.row.return_value)}
        </Typography>
      )
    },
    {
      minWidth: 200,
      field: 'return_created_at',
      sortable: true,
      headerName: 'Created by ',
      renderCell: params => (
        <>
          {RenderUtility?.renderUserAvatarDetails(
            params?.row?.user_created_profile_pic,
            params?.row?.return_created_by_user_name,
            params?.row?.return_created_at
          )}
        </>
      )
    },
    {
      minWidth: 250,
      field: 'return_updated_at',

      sortable: true,
      headerName: 'Updated by',
      renderCell: params => (
        <>
          {RenderUtility?.renderUserAvatarDetails(
            params?.row?.user_updated_profile_pic,
            params?.row?.return_updated_by_user_name,
            params?.row?.return_updated_at
          )}
        </>
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
      fetchReturnReport({ sort: newModel[0].sort, q: searchValue, column: newModel[0].field })
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
    debounce(async (sort, q, column) => {
      setSearchValue(q)
      setPaginationModel({ page: 0, pageSize: 10 })
      try {
        await fetchReturnReport({ sort, q, column })
        updateUrlParams({
          sort: newModel[0].sort,
          q: q,
          column: newModel[0].field,
          page: paginationModel?.page,
          limit: paginationModel?.pageSize
        })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, sortColumn)
  }

  const handleExport = async () => {
    try {
      setExportLoading(true)

      const params = {
        sort: sort,
        q: searchValue,
        column: sortColumn,
        page: 1, // Fetch all pages
        limit: total, // Set limit to total number of items
        ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
        ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate }),
        ...(filteredData?.Medicine && {
          controlled: filteredData.Medicine.controlled,
          prescription: filteredData.Medicine.prescription
        })
      }

      const res = await getReturnReport({ params })

      if (res?.success === true && res?.data?.list_items?.length > 0) {
        const ListData = res?.data?.list_items

        const tableData = ListData.map((item, index) => {
          return {
            'SL NO': index + 1,
            'PRODUCT NAME': item.stock_name || '',
            'GENERIC NAME': item.generic_name || '',
            PACKAGE:
              `${item.package} of ${Utility.formatNumber(item.package_qty)} ${item.package_uom_label} ${
                item.product_form_label
              }` || '',
            'EXPIRY DATE': Utility.formatDisplayDate(item.expiry_date) || '',
            'RETURN NUMBER': item.return_number || '',
            'RETURN DATE': Utility.formatDisplayDate(item.return_date) || '',
            'BATCH NUMBER': item.batch_no || '',
            'FROM STORE': item.from_store || '',
            'MANUFACTURER NAME': item.manufacturer_name || '',
            'TOTAL RETURN QUANTITY': Utility.formatNumber(item.total_return_qty) || '',
            'TOTAL RETURN VALUE': Utility.formatNumber(item.return_value) || '',
            'CREATED BY': item.return_created_by_user_name || '',
            'UPDATED BY': item.return_updated_by_user_name || ''
          }
        })

        Utility.exportToCSV(tableData, 'Return Report')
      } else {
        console.warn('No data to export.')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setExportLoading(false)
    }
  }

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
          title={RenderUtility.pageTitle('Return Report')}
        />
        <Box sx={{ marginLeft: 4, marginRight: 4 }}>
          <Grid container spacing={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Grid item xs={12} md='auto'>
              <CommonDateRangePickers onChange={handleDateRangeChange} filterDates={filterDates} />
            </Grid>
            <Grid item sx={12} md='auto'>
              <Grid container spacing={2} alignItems='center' justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                <Grid item xs={12} sm={6} md='auto'>
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
                <Grid item>
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
                </Grid>
                <Grid item>
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
                      <Icon icon='mage:filter' fontSize={24} />
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
        <ReturnReportDrawer
          setOpenFilterDrawer={setOpenFilterDrawer}
          openFilterDrawer={openFilterDrawer}
          onApplyFilter={filterList => setFilteredData(filterList)}
          selectedOptions={selectedOptions}
          setSelectedOptions={setSelectedOptions}
        />
      )}
    </>
  )
}

export default ReturnReport
