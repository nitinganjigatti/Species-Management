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
import { Box } from '@mui/system'
import { format, subMonths } from 'date-fns'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useState } from 'react'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import { getReturnToSupplier } from 'src/lib/api/pharmacy/reports'
import Utility from 'src/utility'
import RenderUtility from 'src/utility/render'
import Icon from 'src/@core/components/icon'
import { debounce } from 'lodash'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import ReturnToSupplierFilter from 'src/views/pages/pharmacy/reports/ReturnToSupplierFilter'
import StyleWithIconCardComponent from 'src/views/utility/style-with-icon-card'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import Error404 from 'src/pages/404'
import { getSuppliers } from 'src/lib/api/pharmacy/getSupplierList'
import { readAsync } from 'src/lib/windows/utils'
import { getUserList } from 'src/lib/api/pharmacy/dispenseProduct'
import { ExportButton, FilterButton } from 'src/views/utility/render-snippets'
import PharmacyProductCard from 'src/views/utility/PharmacyProductCard'

const ReturnSupplier = () => {
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
  const [sortColumn, setSortColumn] = useState(router.query.column || 'discarded_date')
  const [searchValue, setSearchValue] = useState(router.query.q || '')
  const [exportLoading, setExportLoading] = useState(false)
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false)
  const [supplierData, setSupplierData] = useState([])
  const [selectAllSupplier, setSelectAllSupplier] = useState(false)
  const [users, setUsers] = useState([])
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
    suppliersName: []
  })

  const [selectedOptions, setSelectedOptions] = useState({
    'Supplier Name': [],
    'Discarded By': [],
    'Drug Type': 'all'
  })

  useEffect(() => {
    const supplierList = async () => {
      try {
        const response = await getSuppliers()
        const result = response?.data

        if (result?.success) {
          const suppliers = result?.data?.list_items.map(({ id, company_name }) => ({ id, company_name })) || []
          setSupplierData(suppliers)
        }
      } catch (error) {
        console.log(error)
      }
    }

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

    supplierList()
    getUserLists()
  }, [])

  const handleSelectAllSuppliers = () => {
    setSelectAllSupplier(!selectAllSupplier)
    if (!selectAllSupplier) {
      setSelectedOptions({
        ...selectedOptions,
        'Supplier Name': supplierData.map(s => s.id)
      })
    } else {
      setSelectedOptions({
        ...selectedOptions,
        'Supplier Name': []
      })
    }
  }

  const handleSelectAllUser = () => {
    setSelectAllUser(!selectAllUser)
    if (!selectAllUser) {
      setSelectedOptions({
        ...selectedOptions,
        'Discarded By': users.map(u => u.id)
      })
    } else {
      setSelectedOptions({
        ...selectedOptions,
        'Discarded By': []
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
            filteredData.suppliersName &&
            filteredData.suppliersName.length > 0 && {
              supplier_id: filteredData.suppliersName.join(',')
            }),
          ...(filteredData && filteredData.controlled && { controlled: filteredData.controlled }),
          ...(filteredData && filteredData.prescription && { prescription: filteredData.prescription }),
          ...(filteredData &&
            filteredData.discardedBy &&
            filteredData.discardedBy.length > 0 && {
              user_id: filteredData.discardedBy.join(',')
            })
        }
        await getReturnToSupplier({ params }).then(res => {
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
  }, [paginationModel.page, paginationModel.pageSize, sort, sortColumn, filterDates])

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
      align: 'center',
      headerAlign: 'center',
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
      width: 180,
      field: 'discard_id',
      headerName: 'RETURN REQUEST NUMBER',
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
          {params.row.discard_number}
        </Typography>
      )
    },
    {
      minWidth: 20,
      width: 160,
      field: 'discarded_date',
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
          {Utility.formatDisplayDate(params.row.discarded_date)}
        </Typography>
      )
    },
    {
      width: 340,
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
            rowWidth={320}
          />
        </Box>
      )
    },
    {
      minWidth: 20,
      width: 160,
      field: 'batch_no',
      sortable: true,
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
      width: 160,
      field: 'unit_price',
      headerName: 'NET UNIT PRICE',
      sortable: true,
      headerAlign: 'right',
      align: 'right',
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
          {Utility.formatAmountToReadableDigit(params.row.unit_price)}
        </Typography>
      )
    },
    {
      minWidth: 20,
      width: 160,
      field: 'discarded_value',
      headerName: 'TOTAL VALUE',
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
          {Utility.formatAmountToReadableDigit(params.row.discarded_value)}
        </Typography>
      )
    },
    {
      minWidth: 20,
      width: 180,
      field: 'discarded_quantity',
      headerName: 'DISCARDED QUANTITY',
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
          {params.row?.discarded_quantity ? Utility.formatNumber(params.row.discarded_quantity) : 0}
        </Typography>
      )
    },
    {
      minWidth: 20,
      width: 200,
      field: 'supplier_name',
      sortable: true,
      headerName: 'SUPPLIER NAME',
      renderCell: params => (
        <Tooltip title={params.row.supplier_name}>
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
            <span alt={params.row.supplier_name}> {params.row.supplier_name}</span>
          </Typography>
        </Tooltip>
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
      width: 260,
      field: 'manufacturer_name',
      sortable: true,
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
              maxWidth: 240
            }}
          >
            <span alt={params.row.manufacturer_name}> {params.row.manufacturer_name}</span>
          </Typography>
        </Tooltip>
      )
    },
    {
      minWidth: 20,
      width: 200,
      field: 'comments',
      sortable: false,
      headerName: 'COMMENTS',
      renderCell: params => {
        const comment = params.row.comments

        return (
          <Tooltip title={comment || '-'}>
            {comment ? (
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
                {comment}
              </Typography>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                  width: '100%',
                  fontSize: '14px',
                  color: theme.palette.text.secondary,
                  fontFamily: 'Inter',
                  fontWeight: 400
                }}
              >
                -
              </Box>
            )}
          </Tooltip>
        )
      }
    },
    {
      minWidth: 200,
      field: 'discard_created_at',
      sortable: true,
      headerName: 'DISCARDED BY',
      renderCell: params => (
        <>
          {RenderUtility?.renderUserAvatarDetails(
            params?.row?.user_created_profile_pic,
            params?.row?.discard_created_by_user_name,
            params?.row?.discard_created_at
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
        ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
        ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate }),
        ...(filteredData &&
          filteredData.suppliersName &&
          filteredData.suppliersName.length > 0 && {
            supplier_id: filteredData.suppliersName.join(',')
          }),
        ...(filteredData && filteredData.controlled && { controlled: filteredData.controlled }),
        ...(filteredData && filteredData.prescription && { prescription: filteredData.prescription }),
        ...(filteredData &&
          filteredData.discardedBy &&
          filteredData.discardedBy.length > 0 && {
            user_id: filteredData.discardedBy.join(',')
          }),
        response_type: 'csv'
      }
      const response = await getReturnToSupplier({ params })
      if (response?.success && response?.data) {
        Utility.downloadFileFromURL(response.data, `Return_To_Supplier_Report ${timestamp}`)
      }
    } catch (error) {
      console.error('Error downloading Excel:', error)
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

    if (filteredData.suppliersName && filteredData.suppliersName.length > 0) {
      count++
    }

    if (filteredData && (filteredData.controlled || filteredData.prescription)) {
      count++
    }

    if (filteredData.discardedBy && filteredData.discardedBy.length > 0) {
      count++
    }

    return count
  }

  const appliedFiltersCount = calculateAppliedFiltersCount()

  console.log(filteredData)

  return (
    <>
      {selectedPharmacy.type === 'central' ? (
        <>
          <Card>
            <CardHeader
              sx={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2,
                [theme.breakpoints.down('sm')]: {
                  flexDirection: 'row',
                  justifyContent: 'space-between'
                }
              }}
              title={RenderUtility.pageTitle('Return To Supplier Report')}
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
                <Grid
                  container
                  spacing={4}
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
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
                                <Icon
                                  icon='mi:search'
                                  fontSize={24}
                                  color={theme.palette.customColors.neutralSecondary}
                                />
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
                        <FilterButton
                          onClick={() => setOpenFilterDrawer(true)}
                          appliedFiltersCount={appliedFiltersCount}
                        />
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
            <ReturnToSupplierFilter
              setOpenFilterDrawer={setOpenFilterDrawer}
              openFilterDrawer={openFilterDrawer}
              onApplyFilter={handleFilter}
              selectedOptions={selectedOptions}
              setSelectedOptions={setSelectedOptions}
              supplierData={supplierData}
              handleSelectAllSuppliers={handleSelectAllSuppliers}
              users={users}
              handleSelectAllUser={handleSelectAllUser}
            />
          )}
        </>
      ) : (
        <>
          <Error404 />
        </>
      )}
    </>
  )
}

export default ReturnSupplier
