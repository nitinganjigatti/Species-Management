import { useTheme } from '@emotion/react'
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Grid,
  InputAdornment,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import CustomAvatar from 'src/@core/components/mui/avatar'
import { Box } from '@mui/system'
import { format, subMonths } from 'date-fns'
import { debounce } from 'lodash'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useState } from 'react'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import { getDispenseReport } from 'src/lib/api/pharmacy/reports'
import Utility from 'src/utility'
import RenderUtility from 'src/utility/render'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import Icon from 'src/@core/components/icon'
import DispenseReportFilterDrawer from 'src/views/pages/pharmacy/reports/DispenseReportFilterDrawer'
import { getStoreList } from 'src/lib/api/pharmacy/getStoreList'
import { getUserList } from 'src/lib/api/pharmacy/dispenseProduct'
import { readAsync } from 'src/lib/windows/utils'
import { ExportButton, FilterButton } from 'src/views/utility/render-snippets'
import PharmacyProductCard from 'src/views/utility/PharmacyProductCard'

const DispenseReport = () => {
  const router = useRouter()
  const theme = useTheme()

  const { selectedPharmacy } = usePharmacyContext()

  const updateUrlParams = params => {
    const query = { ...router.query, ...params }
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true })
  }

  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [sort, setSort] = useState(router.query.sort || 'desc')
  const [sortColumn, setSortColumn] = useState(router.query.column || 'dispense_id')
  const [searchValue, setSearchValue] = useState(router.query.q || '')
  const [exportLoading, setExportLoading] = useState(false)
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false)
  const [pharmacyList, setPharmacyList] = useState([])
  const [users, setUsers] = useState([])
  const [selectAllPharmacy, setSelectAllPharmacy] = useState(false)
  const [selectAllUser, setSelectAllUser] = useState(false)

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page) || 0,
    pageSize: parseInt(router.query.limit) || 50
  })

  const [filterDates, setFilterDates] = useState({
    startDate: router.query.startDate || Utility.formatDate(format(subMonths(new Date(), 1), 'dd MMM, yyyy')),
    endDate: router.query.endDate || Utility.formatDate(format(new Date(), 'dd MMM, yyyy'))
  })

  const [filteredData, setFilteredData] = useState({
    user: []
  })

  const [selectedOptions, setSelectedOptions] = useState({
    User: [],
    'Drug Type': 'all'
  })

  useEffect(() => {
    setSelectedOptions({
      User: [],
      'Drug Type': 'all'
    })

    setFilteredData({
      user: []
    })
  }, [selectedPharmacy?.id])

  useEffect(() => {
    const getUserLists = async () => {
      try {
        const userDetails = await readAsync('userDetails')
        if (userDetails?.user?.zoos.length > 0) {
          let zoo_id = userDetails?.user?.zoos[0].zoo_id
          await getUserList({ zoo_id }).then(res => {
            if (res?.data?.length > 0) {
              setUsers(
                res?.data?.map(item => ({
                  name: item?.user_name,
                  id: item?.user_id
                }))
              )
            }
          })
        }
      } catch (error) {
        console.log('user error', error)
      }
    }
    getUserLists()
  }, [])

  const handleSelectAllUser = () => {
    setSelectAllUser(!selectAllUser)
    if (!selectAllUser) {
      setSelectedOptions({
        ...selectedOptions,
        User: users.map(u => u.id)
      })
    } else {
      setSelectedOptions({
        ...selectedOptions,
        User: []
      })
    }
  }

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
          ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
          ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate }),
          ...(filteredData &&
            filteredData.user &&
            filteredData.user.length > 0 && { user_id: filteredData.user.join(',') }),
          ...(filteredData && filteredData.controlled && { controlled: filteredData.controlled }),
          ...(filteredData && filteredData.prescription && { prescription: filteredData.prescription })
        }
        await getDispenseReport({ params: params }).then(res => {
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
    [paginationModel, filterDates, filteredData]
  )

  useEffect(() => {
    fetchTableData({
      sort: sort,
      q: searchValue,
      column: sortColumn,
      page: paginationModel?.page,
      limit: paginationModel?.pageSize

      // filteredData: filteredData
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
  }, [paginationModel.page, paginationModel.pageSize, sort, sortColumn, filterDates, selectedPharmacy?.id])

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
      headerName: 'SL.NO',

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
      width: 180,
      field: 'dispense_id',
      headerName: 'DISPENSE NUMBER',
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
          {params.row.dispense_number}
        </Typography>
      )
    },
    {
      width: 260,
      minWidth: 20,
      field: 'stock_name',
      align: 'left',
      sortable: true,
      headerName: 'PRODUCT NAME',

      renderCell: params => (
        <Box>
          <PharmacyProductCard
            title={params?.row?.stock_name}
            subTitle={params?.row?.generic_name ? params?.row?.generic_name : 'NA'}
            icon={params?.row?.image}
            controlSubstance={params?.row?.controlled_substance === '1' && true}
            prescriptionRequired={params?.row?.prescription_required === '1' && true}
          />
        </Box>
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
      width: 170,
      field: 'dispense_qty',
      headerName: 'DISPENSE QUANTITY',
      sortable: true,
      align: 'center',
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
          {params.row.dispense_qty ? Utility.formatNumber(params.row.dispense_qty) : 0}
        </Typography>
      )
    },
    {
      minWidth: 20,
      width: 170,
      field: 'net_unit_price',
      headerName: 'NET UNIT PRICE',
      sortable: true,
      align: 'right',
      headerAlign: 'right',
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
          {Utility.formatAmountToReadableDigit(params.row.net_unit_price)}
        </Typography>
      )
    },
    {
      minWidth: 20,
      width: 190,
      field: 'total_consumption_cost',
      headerName: 'DISPENSE VALUE',
      sortable: true,
      align: 'right',
      headerAlign: 'right',
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
          {Utility.formatAmountToReadableDigit(params.row.dispense_value)}
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
      width: 160,
      field: 'from_store',
      sortable: true,
      headerName: 'FROM STORE',
      renderCell: params => (
        <Tooltip title={params.row.from_store}>
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
            <span alt={params.row.from_store}> {params.row.from_store}</span>
          </Typography>
        </Tooltip>
      )
    },
    {
      minWidth: 200,
      field: 'dispense_to_user_name',
      sortable: true,
      headerName: 'DISPENSE TO ',
      renderCell: params => (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {params?.row?.dispense_to_user_profile_pic ? (
              <CustomAvatar
                src={params?.row?.dispense_to_user_profile_pic}
                sx={{ mr: '16px', width: '40px', height: '40px' }}
              />
            ) : (
              <CustomAvatar sx={{ mr: '16px', width: '40px', height: '40px', fontSize: '.8rem' }}></CustomAvatar>
            )}
            <Tooltip title={params.row.dispense_to_user_name}>
              <Typography
                variant='subtitle2'
                sx={{
                  color: 'text.primary',
                  fontSize: '14px',
                  fontWeight: 400,
                  fontFamily: 'Inter',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  maxWidth: 200
                }}
              >
                {params?.row?.dispense_to_user_name ? (
                  <span alt={params.row.dispense_to_user_name}> {params.row.dispense_to_user_name}</span>
                ) : (
                  'NA'
                )}
              </Typography>
            </Tooltip>
          </Box>
        </>
      )
    },
    {
      minWidth: 200,
      field: 'dispense_date',
      sortable: true,
      headerName: 'DISPENSE BY',
      renderCell: params => (
        <>
          {RenderUtility?.renderUserAvatarDetails(
            params?.row?.user_created_profile_pic,
            params?.row?.dispense_created_by_user_name,
            params?.row?.dispense_date
          )}
        </>
      )
    }
  ]

  const handleDateRangeChange = (startDate, endDate) => {
    if (startDate && endDate) {
      const formattedStartDate = Utility.formatDate(startDate)
      const formattedEndDate = Utility.formatDate(endDate)
      setFilterDates({
        startDate: formattedStartDate,
        endDate: formattedEndDate
      })

      updateUrlParams({
        startDate: formattedStartDate,
        endDate: formattedEndDate
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

      // fetchTableData({
      //   sort: newModel[0].sort,
      //   q: searchValue,
      //   column: newModel[0].field,
      //   page: paginationModel?.page,
      //   limit: paginationModel?.pageSize,
      //   filteredData: filteredData
      // })
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
    debounce(async (sort, q, column, page, limit) => {
      setSearchValue(q)

      try {
        await fetchTableData({
          sort: sort,
          q: q,
          column: column,
          page: page,
          limit: limit,
          filteredData: filteredData
        })

        updateUrlParams({
          sort: sort,
          q: q,
          column: column,
          page: page,
          limit: limit,

          startDate: filterDates?.startDate,
          endDate: filterDates?.endDate
        })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    [filterDates, filteredData]
  )

  const handleSearch = value => {
    setSearchValue(value)
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

      const params = {
        sort: sort,
        q: searchValue,
        column: sortColumn,
        page: 1,
        limit: total,
        response_type: 'csv',
        ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
        ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate }),
        ...(filteredData &&
          filteredData.user &&
          filteredData.user.length > 0 && { user_id: filteredData.user.join(',') }),
        ...(filteredData && filteredData.controlled && { controlled: filteredData.controlled }),
        ...(filteredData && filteredData.prescription && { prescription: filteredData.prescription })
      }

      const response = await getDispenseReport({ params })
      if (response?.success && response?.data) {
        Utility.downloadFileFromURL(response.data, `Dispense_Report ${timestamp}`)
      }
    } catch (e) {
      console.error(`Error Downloading Excel`, e)
    } finally {
      setExportLoading(false)
    }
  }

  const handleFilter = async filterList => {
    setFilteredData(filterList)
    await fetchTableData({
      sort: sort,
      q: searchValue,
      column: sortColumn,
      page: paginationModel?.page,
      limit: paginationModel?.pageSize,
      filteredData: filterList
    })
  }

  const calculateAppliedFiltersCount = () => {
    let count = 0

    if (filteredData && filteredData.user && filteredData.user.length > 0) {
      count++
    }

    if (filteredData && (filteredData.controlled || filteredData.prescription)) {
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
          title={RenderUtility.pageTitle('Dispense Report')}
        />
        <CardContent>
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
              <Grid item size={{ xs: 12, sm: 5, md: 5 }}>
                <CommonDateRangePickers onChange={handleDateRangeChange} filterDates={filterDates} />
              </Grid>

              <Grid item size={{ xs: 12, sm: 7 }}>
                <Grid container spacing={2} justifyContent={{ xs: 'flex-end' }}>
                  <Grid item size={{ xs: 12, sm: 8 }} sx={{ flex: 1 }}>
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
                      justifyContent: { sm: 'flex-end', xs: 'flex-end' }
                    }}
                  >
                    <ExportButton loading={loading || exportLoading} onClick={handleExport} />
                    <FilterButton onClick={() => setOpenFilterDrawer(true)} appliedFiltersCount={appliedFiltersCount} />
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
        <DispenseReportFilterDrawer
          setOpenFilterDrawer={setOpenFilterDrawer}
          openFilterDrawer={openFilterDrawer}
          onApplyFilter={handleFilter}
          selectedOptions={selectedOptions}
          setSelectedOptions={setSelectedOptions}
          users={users}
          handleSelectAllUser={handleSelectAllUser}
        />
      )}
    </>
  )
}

export default DispenseReport
