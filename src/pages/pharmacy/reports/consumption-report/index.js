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
import { debounce } from 'lodash'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import { getConsumptionReport } from 'src/lib/api/pharmacy/reports'
import Utility from 'src/utility'
import Icon from 'src/@core/components/icon'
import RenderUtility from 'src/utility/render'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { getStoreList } from 'src/lib/api/pharmacy/getStoreList'
import ConsumptionReportDrawer from 'src/views/pages/pharmacy/reports/ConsumptionReportDrawer'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import { format, subMonths } from 'date-fns'
import { ExportButton, FilterButton } from 'src/views/utility/render-snippets'
import PharmacyProductCard from 'src/views/utility/PharmacyProductCard'

const productTypes = [
  { id: 'allopathy', name: 'Allopathy' },
  { id: 'ayurveda', name: 'Ayurveda' },
  { id: 'unani', name: 'Unani' },
  { id: 'homeopathy', name: 'Homeopathy' },
  { id: 'non_medical', name: 'Non Medical' }
]

const ConsumptionReport = () => {
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
  const [sort, setSort] = useState(router.query.sort || 'asc')
  const [sortColumn, setSortColumn] = useState(router.query.column || 'stock_name')
  const [searchValue, setSearchValue] = useState(router.query.q || '')
  const [exportLoading, setExportLoading] = useState(false)
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false)
  const [selectAllPharmacy, setSelectAllPharmacy] = useState(false)
  const [selectAllProductTypes, setSelectAllProductTypes] = useState(false)

  const [filteredData, setFilteredData] = useState({
    pharmacy: []
  })
  const [pharmacyList, setPharmacyList] = useState([])

  const [selectedOptions, setSelectedOptions] = useState({
    Pharmacy: [],
    'Product Type': [],
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

  useEffect(() => {
    setFilteredData({
      pharmacy: []
    })

    setSelectedOptions({
      Pharmacy: [],
      'Product Type': [],
      'Drug Type': 'all'
    })
  }, [selectedPharmacy?.id])

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
  }, [selectedPharmacy?.id])

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

  const handleSelectAllProductTypes = () => {
    setSelectAllProductTypes(!selectAllProductTypes)
    if (!selectAllProductTypes) {
      setSelectedOptions({
        ...selectedOptions,
        'Product Type': productTypes.map(pr => pr.id)
      })
    } else {
      setSelectedOptions({
        ...selectedOptions,
        'Product Type': []
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
          include_dispatch: true,
          ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
          ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate }),
          ...(filteredData &&
            filteredData.pharmacy &&
            filteredData.pharmacy.length > 0 && { store_id: filteredData.pharmacy.join(',') }),
          ...(filteredData &&
            filteredData.productType &&
            filteredData.productType.length > 0 && { product_type: filteredData.productType.join(',') }),
          ...(filteredData && filteredData.controlled && { controlled: filteredData.controlled }),
          ...(filteredData && filteredData.prescription && { prescription: filteredData.prescription })
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
    [paginationModel, filterDates, filteredData]
  )

  useEffect(() => {
    fetchTableData({
      sort: sort,
      q: searchValue,
      column: sortColumn,
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
      width: 340,
      field: 'stock_name',
      headerName: 'PRODUCT NAME',
      sortable: true,
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
      width: 200,
      field: 'generic_name',
      sortable: true,
      headerName: 'GENERIC NAME',
      renderCell: params => {
        const genericName = params.row.generic_name

        return (
          <Tooltip title={genericName || '-'}>
            {genericName ? (
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
                {genericName}
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
      minWidth: 20,
      width: 160,
      field: 'total_consumption_quantity',
      headerName: '',
      sortable: true,
      align: 'center',
      renderHeader: () => (
        <div
          style={{
            whiteSpace: 'normal',
            lineHeight: '1.3',
            textAlign: 'center',
            fontSize: '12px',
            fontWeight: 450
          }}
        >
          CONSUMPTION
          <br />
          QUANTITY
        </div>
      ),
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
          {params.row.total_consumption_quantity ? Utility.formatNumber(params.row.total_consumption_quantity) : 0}
        </Typography>
      )
    },
    {
      minWidth: 20,
      width: 160,
      field: 'total_consumption_cost',
      headerName: '',
      sortable: true,
      align: 'right',
      headerAlign: 'right',
      renderHeader: () => (
        <div
          style={{
            whiteSpace: 'normal',
            lineHeight: '1.3',
            textAlign: 'center',
            fontSize: '12px',
            fontWeight: 450
          }}
        >
          CONSUMPTION
          <br />
          VALUE
        </div>
      ),
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
          {Utility.formatAmountToReadableDigit(params.row.total_consumption_cost)}
        </Typography>
      )
    },
    {
      minWidth: 20,
      width: 190,
      field: 'available_qty',
      headerName: '',
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      renderHeader: () => (
        <div
          style={{
            whiteSpace: 'normal',
            lineHeight: '1.3',
            textAlign: 'center',
            fontSize: '12px',
            fontWeight: 450
          }}
        >
          CURRENT STOCK
          <br />
          AVAILABLE
        </div>
      ),
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
          {params.row.available_qty ? Utility.formatNumber(params.row.available_qty) : 0}
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
        include_dispatch: true,
        ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
        ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate }),
        ...(filteredData &&
          filteredData.pharmacy &&
          filteredData.pharmacy.length > 0 && { store_id: filteredData.pharmacy.join(',') }),
        ...(filteredData &&
          filteredData.productType &&
          filteredData.productType.length > 0 && { product_type: filteredData.productType.join(',') }),
        ...(filteredData && filteredData.controlled && { controlled: filteredData.controlled }),
        ...(filteredData && filteredData.prescription && { prescription: filteredData.prescription }),
        response_type: 'csv'
      }
      const response = await getConsumptionReport({ params })
      if (response?.success && response?.data) {
        Utility.downloadFileFromURL(response.data, `Consumption_Report ${timestamp}`)
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

    if (filteredData && filteredData.pharmacy && filteredData.pharmacy.length > 0) {
      count++
    }

    if (filteredData && filteredData.productType && filteredData.productType.length > 0) {
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
          title={RenderUtility.pageTitle('Consumption Report')}
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
        </CardContent>
      </Card>
      {openFilterDrawer && (
        <ConsumptionReportDrawer
          setOpenFilterDrawer={setOpenFilterDrawer}
          openFilterDrawer={openFilterDrawer}
          onApplyFilter={handleFilter}
          selectedOptions={selectedOptions}
          setSelectedOptions={setSelectedOptions}
          pharmacyList={pharmacyList}
          productTypes={productTypes}
          handleSelectAllPharmacy={handleSelectAllPharmacy}
          handleSelectAllProductTypes={handleSelectAllProductTypes}
        />
      )}
    </>
  )
}

export default ConsumptionReport
