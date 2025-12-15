import { useTheme } from '@emotion/react'
import { Grid, Tooltip, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { format, subMonths } from 'date-fns'
import { debounce } from 'lodash'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useState } from 'react'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import { getStoreList } from 'src/lib/api/pharmacy/getStoreList'
import { getAllRequestedItemsReport } from 'src/lib/api/pharmacy/reports'
import Error404 from 'src/pages/404'
import Utility from 'src/utility'
import RenderUtility from 'src/utility/render'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { readAsync } from 'src/lib/windows/utils'
import { getUserList } from 'src/lib/api/pharmacy/dispenseProduct'
import { ExportButton, FilterButton } from 'src/views/utility/render-snippets'
import PharmacyProductCard from 'src/views/utility/PharmacyProductCard'
import AllRequestedItemFilterDrawer from 'src/views/pages/pharmacy/reports/AllRequestedItemFilterDrawer'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import MUISearch from 'src/views/forms/form-fields/MUISearch'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'

const AllRequestedItemsReport = () => {
  const router = useRouter()
  const theme = useTheme()
  const { selectedPharmacy } = usePharmacyContext()

  const updateUrlParams = params => {
    const query = { ...router.query, ...params }
    router.push({ pathname: router.pathname, query }, undefined, { shallow: true })
  }

  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState([])
  const [sort, setSort] = useState(router.query.sort || 'desc')
  const [sortColumn, setSortColumn] = useState(router.query.column || 'request_ID')
  const [searchValue, setSearchValue] = useState(router.query.q || '')
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false)
  const [filteredData, setFilteredData] = useState({ Pharmacy: [] })
  const [exportLoading, setExportLoading] = useState(false)
  const [pharmacyList, setPharmacyList] = useState([])
  const [users, setUsers] = useState([])
  const [selectAllPharmacy, setSelectAllPharmacy] = useState(false)
  const [selectAllUser, setSelectAllUser] = useState(false)

  const [selectedOptions, setSelectedOptions] = useState({
    Pharmacy: [],
    User: [],
    'Drug Type': 'all',
    Priority: 'all'
  })

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page) || 0,
    pageSize: parseInt(router.query.limit) || 50
  })

  const [filterDates, setFilterDates] = useState({
    startDate: router.query.startDate || Utility.formatDate(format(subMonths(new Date(), 1), 'dd MMM, yyyy')),
    endDate: router.query.endDate || Utility.formatDate(format(new Date(), 'dd MMM, yyyy'))
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
          setPharmacyList(pharmacies)
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
    pharmacyList()
    getUserLists()
  }, [])

  const handleSelectAllPharmacy = () => {
    setSelectAllPharmacy(!selectAllPharmacy)
    if (!selectAllPharmacy) {
      setSelectedOptions({
        ...selectedOptions,
        Pharmacy: pharmacyList.map(p => p.id)
      })
    } else {
      setSelectedOptions({
        ...selectedOptions,
        Pharmacy: []
      })
    }
  }

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
            filteredData.Pharmacy &&
            filteredData.Pharmacy.length > 0 && { store_id: filteredData.Pharmacy.join(',') }),
          ...(filteredData &&
            filteredData.User &&
            filteredData.User.length > 0 && { user_id: filteredData.User.join(',') }),
          ...(filteredData && filteredData.controlled && { controlled: filteredData.controlled }),
          ...(filteredData && filteredData.prescription && { prescription: filteredData.prescription }),
          ...(filteredData && filteredData.Priority && { priority: filteredData.Priority })
        }
        await getAllRequestedItemsReport({ params: params }).then(res => {
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
      limit: paginationModel?.pageSize,
      startDate: filterDates?.startDate,
      endDate: filterDates?.endDate
    })
  }, [paginationModel.page, paginationModel.pageSize, filterDates, sort, sortColumn, filteredData])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: getSlNo(index)
  }))

  const columns = [
    {
      width: 80,
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
          {RenderUtility?.getPriorityIcons(params?.row?.priority)}
        </Box>
      )
    },
    {
      minWidth: 20,
      width: 180,
      field: 'request_ID',
      headerName: 'REQUEST NUMBER',
      sortable: true,
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {params.row.request_ID}
        </Typography>
      )
    },
    {
      width: 340,
      minWidth: 20,
      field: 'product_name',
      align: 'left',
      sortable: true,
      headerName: 'PRODUCT NAME',

      renderCell: params => (
        <Box>
          <PharmacyProductCard
            title={params?.row?.product_name}
            subTitle={params?.row?.generic_name ? params?.row?.generic_name : 'NA'}
            icon={params?.row?.product_image}
            controlSubstance={params?.row?.controlled_substance === '1' && true}
            prescriptionRequired={params?.row?.prescription_required === '1' && true}
            rowWidth={320}
          />
        </Box>
      )
    },
    {
      minWidth: 20,
      width: 190,
      field: 'requested_quantity',
      headerName: 'REQUESTED QUANTITY',
      sortable: true,
      align: 'center',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {params.row.requested_quantity ? Utility.formatNumber(params.row.requested_quantity) : 0}
        </Typography>
      )
    },
    {
      minWidth: 20,
      width: 190,
      field: 'pending_quantity',
      headerName: 'PENDING QUANTITY',
      sortable: true,
      align: 'center',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {params.row.pending_quantity ? Utility.formatNumber(params.row.pending_quantity) : 0}
        </Typography>
      )
    },
    {
      minWidth: 20,
      width: 220,
      field: 'manufacturer_name',
      headerName: 'MANUFACTURER NAME',
      sortable: true,
      renderCell: params => (
        <Tooltip title={params.row.manufacturer_name}>
          <Typography
            variant='body2'
            sx={{
              color: theme.palette.customColors.customHeadingTextColor,
              fontSize: '14px',
              fontWeight: 400,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              maxWidth: 220
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
      field: 'request_from',
      headerName: 'REQUESTED FROM',
      sortable: true,
      renderCell: params => (
        <Tooltip title={params.row.request_from}>
          <Typography
            variant='body2'
            sx={{
              color: theme.palette.customColors.customHeadingTextColor,
              fontSize: '14px',
              fontWeight: 400,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              maxWidth: 180
            }}
          >
            <span alt={params.row.request_from}> {params.row.request_from}</span>
          </Typography>
        </Tooltip>
      )
    },
    {
      minWidth: 200,
      field: 'requested_date',
      sortable: true,
      headerName: 'REQUESTED BY ',
      renderCell: params => (
        <>
          <UserAvatarDetails
            profile_image={params?.row?.requested_by_profile_pic}
            user_name={params?.row?.requested_by}
            date={params?.row?.requested_date}
          />
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

  const searchTableData = useCallback(
    debounce(async (sort, q, column, page, limit) => {
      setSearchValue(q)

      try {
        await fetchTableData({ sort, q, column, page, limit, filteredData })
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
          filteredData.Pharmacy &&
          filteredData.Pharmacy.length > 0 && { store_id: filteredData.Pharmacy.join(',') }),
        ...(filteredData && filteredData.controlled && { controlled: filteredData.controlled }),
        ...(filteredData && filteredData.prescription && { prescription: filteredData.prescription }),
        ...(filteredData && filteredData.Priority && { priority: filteredData.Priority })
      }
      const response = await getAllRequestedItemsReport({ params })
      if (response?.success && response?.data) {
        Utility.downloadFileFromURL(response.data, `All_Requested_Items_Report ${timestamp}`)
      }
    } catch (error) {
      console.error('Error downloading Excel:', error)
    } finally {
      setExportLoading(false)
    }
  }

  const calculateAppliedFiltersCount = () => {
    let count = 0

    if (filteredData && filteredData.Pharmacy && filteredData.Pharmacy.length > 0) {
      count++
    }

    if (filteredData && filteredData.User && filteredData.User.length > 0) {
      count++
    }

    if (filteredData && (filteredData.controlled || filteredData.prescription)) {
      count++
    }

    if (filteredData && filteredData.Priority) {
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
          <PageCardLayout title={'All Requested Items Report'}>
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
                <Grid item size={{ xs: 12, sm: 5, md: 5 }}>
                  <CommonDateRangePickers onChange={handleDateRangeChange} filterDates={filterDates} />
                </Grid>

                <Grid item size={{ xs: 12, sm: 7 }}>
                  <Grid
                    container
                    spacing={2}
                    sx={{
                      justifyContent: { xs: 'flex-end' }
                    }}
                  >
                    <Grid item size={{ xs: 12, sm: 8 }} sx={{ flex: 1 }}>
                      <MUISearch
                        onChange={e => handleSearch(e.target.value)}
                        onClear={() => handleSearch('')}
                        value={searchValue}
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
                      <ExportButton
                        loading={loading || exportLoading}
                        onClick={handleExport}
                        disabled={total === 0 ? true : false}
                      />
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
          </PageCardLayout>
          {openFilterDrawer && (
            <AllRequestedItemFilterDrawer
              setOpenFilterDrawer={setOpenFilterDrawer}
              openFilterDrawer={openFilterDrawer}
              onApplyFilter={filterList => setFilteredData(filterList)}
              selectedOptions={selectedOptions}
              setSelectedOptions={setSelectedOptions}
              pharmacyList={pharmacyList}
              users={users}
              handleSelectAllPharmacy={handleSelectAllPharmacy}
              handleSelectAllUser={handleSelectAllUser}
            />
          )}
        </>
      ) : (
        <Error404 />
      )}
    </>
  )
}

export default AllRequestedItemsReport
