import { useTheme } from '@emotion/react'
import { Grid, Tooltip, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useState } from 'react'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import { getReturnReport } from 'src/lib/api/pharmacy/reports'
import Utility from 'src/utility'
import CommonTable from 'src/views/table/data-grid/CommonTable'

import { getStoreList } from 'src/lib/api/pharmacy/getStoreList'
import { debounce } from 'lodash'
import ReturnReportDrawer from 'src/views/pages/pharmacy/reports/ReturnReportDrawer'
import { format, subMonths } from 'date-fns'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import { ExportButton, FilterButton } from 'src/views/utility/render-snippets'
import PharmacyProductCard from 'src/views/utility/PharmacyProductCard'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import MUISearch from 'src/views/forms/form-fields/MUISearch'
import MUISwitch from 'src/views/forms/form-fields/MUISwitch'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
import ReportsPageSkeleton from 'src/views/utility/SkeletonLoading/ReportsPageSkeleton'

const ReturnReport = () => {
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
  const [sortColumn, setSortColumn] = useState(router.query.column || 'return_date')
  const [searchValue, setSearchValue] = useState(router.query.q || '')
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false)

  const [filteredData, setFilteredData] = useState({
    pharmacy: []
  })
  const [exportLoading, setExportLoading] = useState(false)
  const [expired, setExpired] = useState(false)
  const [pharmacyList, setPharmacyList] = useState([])
  const [selectAllPharmacy, setSelectAllPharmacy] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

  const [selectedOptions, setSelectedOptions] = useState({
    Pharmacy: [],
    'Expiry Date': [],
    'Near Expiry': [],
    'Drug Type': 'all'
  })

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page) || 0,
    pageSize: parseInt(router.query.limit) || 50
  })

  const [filterDates, setFilterDates] = useState({
    startDate: router.query.startDate || Utility.formatDate(format(subMonths(new Date(), 1), 'dd MMM, yyyy')),
    endDate: router.query.endDate || Utility.formatDate(format(new Date(), 'dd MMM, yyyy'))
  })

  const [expiryFilterDates, setExpiryFilterDates] = useState({
    startDate: '',
    endDate: ''
  })

  const [nearExpiryFilterDates, setNearExpiryFilterDates] = useState({
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    setSelectedOptions({
      Pharmacy: [],
      'Expiry Date': [],
      'Near Expiry': [],
      'Drug Type': 'all'
    })
    setFilteredData({
      pharmacy: []
    })
  }, [selectedPharmacy.id])

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
          pharmacies = pharmacies.filter(pharmacy => pharmacy.id !== selectedPharmacy?.id)
          setPharmacyList(pharmacies)
        }
      } catch (error) {
        console.log(error)
      }
    }
    pharmacyList()
  }, [selectedPharmacy])

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
          ...(filteredData && filteredData.controlled && { controlled: filteredData.controlled }),
          ...(filteredData && filteredData.prescription && { prescription: filteredData.prescription }),
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
        setPageLoading
      } catch (e) {
        console.log(e)
        setLoading(false)
        setPageLoading
      } finally {
        setPageLoading(false)
      }
    },
    [paginationModel, filterDates, filteredData]
  )

  useEffect(() => {
    fetchReturnReport({
      sort: sort,
      q: searchValue,
      column: sortColumn,
      expired: expired,
      page: paginationModel?.page,
      limit: paginationModel?.pageSize

      // filteredData: filteredData,
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
  }, [paginationModel.page, paginationModel.pageSize, filterDates, expired, selectedPharmacy?.id])

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
      width: 170,
      field: 'return_number',
      headerName: 'RETURN NUMBER',
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
          {params.row.return_number}
        </Typography>
      )
    },
    {
      minWidth: 20,
      width: 170,
      field: 'shipment_id',
      headerName: 'SHIPMENT NUMBER',
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
          {params.row.shipment_id}
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
      sortable: false,
      headerName: 'BATCH NUMBER',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500
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
            fontWeight: 500
          }}
        >
          {Utility.formatDisplayDate(params.row.expiry_date)}
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
            fontWeight: 500
          }}
        >
          {Utility.formatDisplayDate(params.row.return_date)}
        </Typography>
      )
    },
    {
      minWidth: 20,
      width: 200,
      field: 'return_qty',
      headerName: 'TOTAL RETURN QUANTITY',
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
          {params.row?.return_qty ? Utility.formatNumber(params.row.return_qty) : 0}
        </Typography>
      )
    },
    {
      minWidth: 20,
      width: 160,
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
            fontWeight: 500
          }}
        >
          {Utility.formatAmountToReadableDigit(params.row.net_unit_price)}
        </Typography>
      )
    },
    {
      minWidth: 20,
      width: 180,
      field: 'return_value',
      headerName: 'TOTAL RETURN VALUE',
      align: 'right',
      headerAlign: 'right',
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
          {Utility.formatAmountToReadableDigit(params.row.return_value)}
        </Typography>
      )
    },
    {
      minWidth: 20,
      width: 160,
      field: `${selectedPharmacy?.type === 'central' ? 'from_store' : 'to_store'}`,
      sortable: true,
      headerName: `${selectedPharmacy?.type === 'central' ? 'FROM STORE' : 'TO STORE'}`,
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.customHeadingTextColor,
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          {selectedPharmacy?.type === 'central' ? params.row.from_store : params.row.to_store}
        </Typography>
      )
    },
    {
      minWidth: 20,
      width: 200,
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
      minWidth: 200,
      field: 'return_created_at',
      sortable: true,
      headerName: 'Created by ',
      renderCell: params => (
        <>
          <UserAvatarDetails
            profile_image={params?.row?.user_created_profile_pic}
            user_name={params?.row?.return_created_by_user_name}
            date={params?.row?.return_created_at}
          />
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
          <UserAvatarDetails
            profile_image={params?.row?.user_updated_profile_pic}
            user_name={params?.row?.return_updated_by_user_name}
            date={params?.row?.return_updated_at}
          />
        </>
      )
    }
  ]

  console.log(indexedRows)

  const handleSwitchChange = event => {
    setExpired(event.target.checked)
  }

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

      fetchReturnReport({
        sort: newModel[0].sort,
        q: searchValue,
        column: newModel[0].field,
        filteredData: filteredData,
        expired: expired,
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
          filteredData,
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
    [filterDates, filteredData]
  )

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, sortColumn, expired, paginationModel.page, paginationModel.pageSize)
  }

  const headerAction = (
    <MUISwitch
      label='Expired'
      labelPlacement='start'
      defaultChecked={expired}
      onChange={handleSwitchChange}
      formControlStyle={{
        margin: 0
      }}
    />
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
        ...(filteredData && filteredData.controlled && { controlled: filteredData.controlled }),
        ...(filteredData && filteredData.prescription && { prescription: filteredData.prescription }),
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

  const handleFilter = async filterList => {
    setFilteredData(filterList)
    await fetchReturnReport({
      sort: sort,
      q: searchValue,
      column: sortColumn,
      expired: expired,
      page: paginationModel?.page,
      limit: paginationModel?.pageSize,
      filteredData: filterList
    })
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

    if (filteredData && (filteredData.controlled || filteredData.prescription)) {
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
      {pageLoading ? (
        <ReportsPageSkeleton ReturnReportPage />
      ) : (
        <PageCardLayout title={'Return Report'} action={headerAction}>
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
                <Grid
                  container
                  spacing={2}
                  sx={{
                    justifyContent: { xs: 'flex-end' }
                  }}
                >
                  <Grid item size={{ xs: 12, sm: 8 }} sx={{ flex: 1 }}>
                    <MUISearch
                      placeholder='Search...'
                      value={searchValue}
                      onChange={e => handleSearch(e.target.value)}
                      onClear={() => handleSearch('')}
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
                    <ExportButton
                      loading={loading || exportLoading}
                      onClick={handleExport}
                      disabled={total === 0 ? true : false}
                    />
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
        </PageCardLayout>
      )}
      {openFilterDrawer && (
        <ReturnReportDrawer
          setOpenFilterDrawer={setOpenFilterDrawer}
          openFilterDrawer={openFilterDrawer}
          onApplyFilter={handleFilter}
          selectedOptions={selectedOptions}
          setSelectedOptions={setSelectedOptions}
          expiryFilterDates={expiryFilterDates}
          setExpiryFilterDates={setExpiryFilterDates}
          nearExpiryFilterDates={nearExpiryFilterDates}
          setNearExpiryFilterDates={setNearExpiryFilterDates}
          pharmacyList={pharmacyList}
          handleSelectAllPharmacy={handleSelectAllPharmacy}
          selectedPharmacy={selectedPharmacy}
        />
      )}
    </>
  )
}

export default ReturnReport
