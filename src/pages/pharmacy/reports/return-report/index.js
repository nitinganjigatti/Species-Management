import { useTheme } from '@emotion/react'
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  FormControlLabel,
  Grid,
  InputAdornment,
  Switch,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { Box, width } from '@mui/system'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useState } from 'react'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import { getReturnReport } from 'src/lib/api/pharmacy/reports'
import Utility from 'src/utility'
import RenderUtility from 'src/utility/render'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import StyleWithIconCardComponent from 'src/views/utility/style-with-icon-card'
import Icon from 'src/@core/components/icon'
import { getStoreList } from 'src/lib/api/pharmacy/getStoreList'
import { debounce } from 'lodash'
import ReturnReportDrawer from 'src/views/pages/pharmacy/reports/ReturnReportDrawer'

const ReturnReport = () => {
  const router = useRouter()
  const theme = useTheme()

  const updateUrlParams = params => {
    const query = { ...router.query, ...params }
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true })
  }

  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [sort, setSort] = useState(router.query.sort || 'asc')
  const [sortColumn, setSortColumn] = useState(router.query.column || 'stock_name')
  const [searchValue, setSearchValue] = useState(router.query.q || '')
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false)
  const [filteredData, setFilteredData] = useState({ pharmacy: [] })
  const [exportLoading, setExportLoading] = useState(false)
  const [expired, setExpired] = useState(false)
  const [pharmacyList, setPharmacyList] = useState([])

  const [selectedOptions, setSelectedOptions] = useState({
    Pharmacy: [],
    'Expiry Date': [],
    'Near Expiry': [],
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

  const [expiryFilterDates, setExpiryFilterDates] = useState({
    startDate: router.query.startDate || '',
    endDate: router.query.endDate || ''
  })

  const [nearExpiryFilterDates, setNearExpiryFilterDates] = useState({
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
          const pharmacies = result?.list_items.map(({ id, name }) => ({ id, name })) || []
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

  const fetchReturnReport = useCallback(
    async ({ sort, q, column, filteredData, expired, page, limit }) => {
      try {
        setLoading(true)

        const params = {
          page: page + 1,
          limit: limit,
          sort: sort,
          q: q,
          column: column,
          ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
          ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate }),
          ...(filteredData?.Medicine && {
            controlled: filteredData.Medicine.controlled,
            prescription: filteredData.Medicine.prescription
          }),
          ...(filteredData?.expiryDate && {
            expired_from_date: filteredData.expiryDate.startDate,
            expired_to_date: filteredData.expiryDate.endDate
          }),

          ...(filteredData?.nearExpiryDate && {
            near_expiry_from_date: filteredData.nearExpiryDate.startDate,
            near_expiry_to_date: filteredData.nearExpiryDate.endDate
          }),
          ...(filteredData &&
            filteredData.pharmacy &&
            filteredData.pharmacy.length > 0 && { store_id: filteredData.pharmacy.join(',') }),
          expired: expired ? 1 : 0
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
    fetchReturnReport({
      sort: sort,
      q: searchValue,
      column: sortColumn,
      filteredData: filteredData,
      expired: expired,
      page: paginationModel?.page,
      limit: paginationModel?.pageSize
    })
    updateUrlParams({
      sort,
      q: searchValue,
      column: sortColumn,
      page: paginationModel?.page,
      limit: paginationModel?.pageSize,
      startDate: filterDates?.startDate,
      endDate: filterDates?.endDate
    })
  }, [paginationModel.page, paginationModel.pageSize, filterDates, filteredData, expired])

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
      width: 5,
      field: 'label',
      headerName: '',
      sortable: false,
      renderCell: params => (
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
            !isNaN(params.row?.controlled_substance) && parseInt(params.row?.controlled_substance) === 1,
            'CS'
          )}
          {RenderUtility?.renderControlLabel(
            !isNaN(params.row?.prescription_required) && parseInt(params.row?.prescription_required) === 1,
            'PR'
          )}
        </Typography>
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
        <Tooltip title={params.row.manufacturer_name}>
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
              maxWidth: 200
            }}
          >
            <span alt={params.row.manufacturer_name}> {params.row.manufacturer_name}</span>
          </Typography>
        </Tooltip>
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
          {params.row?.total_return_qty ? Utility.formatNumber(params.row.total_return_qty) : 0}
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
          {Utility.formatAmountToReadableDigit(params.row.return_value)}
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

  const handleSwitchChange = event => {
    setExpired(event.target.checked)
  }

  const handleDateRangeChange = (startDate, endDate) => {
    if (startDate && endDate) {
      setFilterDates({
        startDate: Utility.formatDate(startDate),
        endDate: Utility.formatDate(endDate)
      })

      updateUrlParams({
        startDate: filterDates?.startDate,
        endDate: filterDates?.endDate
      })

      console.log('Date range selected:', { startDate, endDate })
    } else {
      setFilterDates({
        startDate: '',
        endDate: ''
      })

      updateUrlParams({
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
      fetchReturnReport({
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
        limit: paginationModel?.pageSize,
        startDate: filterDates?.startDate,
        endDate: filterDates?.endDate
      })
    } else {
    }
  }

  const searchTableData = useCallback(
    debounce(async (sort, q, column, expired, page, limit) => {
      setSearchValue(q)
      try {
        await fetchReturnReport({
          sort,
          q,
          column,
          expired,
          page,
          limit
        })

        updateUrlParams({
          sort: sort,
          q: q,
          column: column,
          page,
          limit,
          startDate: filterDates?.startDate,
          endDate: filterDates?.endDate
        })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, sortColumn, expired, paginationModel.page, paginationModel.pageSize)
  }

  const headerAction = (
    <div>
      <Grid item>
        <FormControlLabel
          control={
            <Switch sx={{ mr: { sm: 5 }, mt: { xs: 1, sm: 1 } }} checked={expired} onChange={handleSwitchChange} />
          }
          labelPlacement='start'
          label='Expired'
        />
      </Grid>
    </div>
  )

  const handleExport = async () => {
    try {
      setExportLoading(true)
      const now = new Date()

      const timestamp = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(
        2,
        '0'
      )}/${now.getFullYear()}(${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')})`

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
        }),
        ...(filteredData?.expiryDate && {
          expired_from_date: filteredData.expiryDate.startDate,
          expired_to_date: filteredData.expiryDate.endDate
        }),

        ...(filteredData?.nearExpiryDate && {
          near_expiry_from_date: filteredData.nearExpiryDate.startDate,
          near_expiry_to_date: filteredData.nearExpiryDate.endDate
        }),
        ...(filteredData &&
          filteredData.pharmacy &&
          filteredData.pharmacy.length > 0 && { store_id: filteredData.pharmacy.join(',') }),
        expired: expired ? 1 : 0,
        response_type: 'csv'
      }

      const response = await getReturnReport({ params })
      if (response?.success && response?.data) {
        Utility.downloadFileFromURL(response.data, `Return_Report ${timestamp}`)
      }
    } catch (error) {
      console.error('Error downloading Excel:', error)
    } finally {
      setExportLoading(false)
    }
  }

  const calculateAppliedFiltersCount = () => {
    let count = 0

    if (filteredData['expiryDate'] && filteredData['expiryDate'].startDate && filteredData['expiryDate'].endDate) {
      count++
    }

    if (
      filteredData['nearExpiryDate'] &&
      filteredData['nearExpiryDate'].startDate &&
      filteredData['nearExpiryDate'].endDate
    ) {
      count++
    }

    if (filteredData?.Medicine?.controlled || filteredData?.Medicine?.prescription) {
      count++
    }

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
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap', // Add flexWrap to handle small screens
            gap: 2, // Add a gap for better spacing when wrapping
            [theme.breakpoints.down('sm')]: {
              flexDirection: 'row', // Keep items in a row
              justifyContent: 'space-between' // Maintain space between
            }
          }}
          title={RenderUtility.pageTitle('Return Report')}
          action={headerAction}
        />
        <CardContent sx={{ paddingTop: '4px' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'stretch', sm: 'center' },
              gap: { xs: 2, sm: 0 },
              width: '100%'
            }}
          >
            <Grid container spacing={4} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Grid item xs={12} sm={5} md={5}>
                <CommonDateRangePickers onChange={handleDateRangeChange} filterDates={filterDates} />
              </Grid>

              <Grid item sm={7} xs={12}>
                <Grid container spacing={2} justifyContent={{ xs: 'flex-end' }}>
                  <Grid item xs={12} sm={8} sx={{ flex: 1 }}>
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
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      justifyContent: 'flex-end'
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
        </CardContent>
      </Card>
      {openFilterDrawer && (
        <ReturnReportDrawer
          setOpenFilterDrawer={setOpenFilterDrawer}
          openFilterDrawer={openFilterDrawer}
          onApplyFilter={filterList => setFilteredData(filterList)}
          selectedOptions={selectedOptions}
          setSelectedOptions={setSelectedOptions}
          expiryFilterDates={expiryFilterDates}
          setExpiryFilterDates={setExpiryFilterDates}
          nearExpiryFilterDates={nearExpiryFilterDates}
          setNearExpiryFilterDates={setNearExpiryFilterDates}
          pharmacyList={pharmacyList}
        />
      )}
    </>
  )
}

export default ReturnReport
