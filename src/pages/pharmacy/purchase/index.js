import React, { useState, useEffect, useCallback } from 'react'

import { getPurchaseList } from 'src/lib/api/pharmacy/getPurchaseList'
import FallbackSpinner from 'src/@core/components/spinner/index'
import { DataGrid } from '@mui/x-data-grid'
import { debounce } from 'lodash'
import Icon from 'src/@core/components/icon'

// ** MUI Imports
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'
import { Card, CardHeader, Typography, Grid, TextField, CardContent, InputAdornment, Tooltip } from '@mui/material'

// ** Icon Imports
import { Box } from '@mui/material'
import { format, subDays, subMonths } from 'date-fns'

import Router from 'next/router'
import Error404 from 'src/pages/404'
import { useTheme } from '@emotion/react'
import { useRouter } from 'next/router'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import { AddButton, ExcelExportButton } from 'src/components/Buttons'
import Utility from 'src/utility'

import { useForm, Controller } from 'react-hook-form'
import { uploadPurchaseFile } from 'src/lib/api/pharmacy/getPurchaseList'
import TableWithFilter from 'src/components/TableWithFilter'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { AddButtonContained } from 'src/components/ButtonContained'
import RenderUtility from 'src/utility/render'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import { ExportButton } from 'src/views/utility/render-snippets'

const ListOfPurchase = () => {
  const router = useRouter()
  const theme = useTheme()

  const updateUrlParams = params => {
    const query = { ...router.query, ...params }
    router.push({ pathname: router.pathname, query }, undefined, { shallow: true })
  }

  /***** Server side pagination */

  const [loader, setLoader] = useState(false)

  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState(router.query.sort || 'desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState(router.query.q || '')
  const [sortColumn, setSortColumn] = useState(router.query.column || 'po_date')

  const [filterDates, setFilterDates] = useState({
    startDate:
      router.query.from_date === ''
        ? ''
        : router.query.from_date || Utility.formatDate(format(subMonths(new Date(), 1), 'dd MMM, yyyy')),
    endDate:
      router.query.to_date === '' ? '' : router.query.to_date || Utility.formatDate(format(new Date(), 'dd MMM, yyyy'))
  })

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page) || 0,
    pageSize: parseInt(router.query.limit) || 10
  })
  const [loading, setLoading] = useState(false)
  const [excelLoader, setExcelLoader] = useState(false)

  function loadServerRows(currentPage, data) {
    return data
  }

  const { selectedPharmacy } = usePharmacyContext()

  const fetchTableData = useCallback(
    async ({ sort, q, column, filterDates }) => {
      try {
        setLoading(true)

        const isEmptyDates = filterDates?.startDate === '' && filterDates?.endDate === ''

        const params = {
          sort,
          q,
          column,
          ...(isEmptyDates
            ? { from_date: '', to_date: '' } // Explicitly send empty values
            : filterDates?.startDate && filterDates?.endDate
            ? { from_date: filterDates.startDate, to_date: filterDates.endDate }
            : {}),
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize
        }

        await getPurchaseList({ params }).then(res => {
          if (res?.success === true && res?.data?.length > 0) {
            console.log('RESPONSE >>', res?.data)
            setTotal(parseInt(res?.count))
            setRows(loadServerRows(paginationModel.page, res?.data))

            const urlParams = {
              sort,
              q,
              column,
              page: paginationModel?.page,
              limit: paginationModel?.pageSize
            }

            if (isEmptyDates) {
              urlParams.from_date = ''
              urlParams.to_date = ''
            } else if (filterDates?.startDate && filterDates?.endDate) {
              urlParams.from_date = filterDates.startDate
              urlParams.to_date = filterDates.endDate
            }

            updateUrlParams(urlParams)
          } else {
            setTotal(0)
            setRows([])
          }
        })

        setLoading(false)
      } catch (error) {
        console.log('error', error)
        setLoading(false)
        setTotal(0)
        setRows([])
      }
    },
    [paginationModel, filterDates]
  )
  useEffect(() => {
    if (filterDates?.startDate !== undefined && filterDates?.endDate !== undefined) {
      fetchTableData({ sort, q: searchValue, column: sortColumn, filterDates })

      updateUrlParams({
        sort,
        q: searchValue,
        column: sortColumn,
        page: paginationModel?.page,
        limit: paginationModel?.pageSize,
        from_date: filterDates?.startDate || '',
        to_date: filterDates?.endDate || ''
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPharmacy.id, paginationModel.page, paginationModel.pageSize, filterDates])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl: getSlNo(index)
  }))

  const handleSortModel = newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
      fetchTableData({ sort: newModel[0].sort, q: searchValue, column: newModel[0].field, filterDates })
      updateUrlParams({
        sort: newModel[0].sort,
        q: searchValue,
        column: newModel[0].field,
        page: paginationModel?.page,
        limit: paginationModel?.pageSize,
        ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
        ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate })
      })
    } else {
    }
  }

  const searchTableData = useCallback(
    debounce(async (sort, q, column, filterDates) => {
      setSearchValue(q)
      setPaginationModel({ page: 0, pageSize: 10 })
      try {
        await fetchTableData({ sort, q, column, filterDates })
        updateUrlParams({
          sort: newModel[0].sort,
          q: q,
          column: newModel[0].field,
          page: paginationModel?.page,
          limit: paginationModel?.pageSize,
          ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
          ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate })
        })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleEdit = id => {
    Router.push({
      pathname: '/pharmacy/purchase/add-purchase/',
      query: { id: id, action: 'edit' }
    })
  }

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, sortColumn, filterDates)
  }

  const handleDateRangeChange = (startDate, endDate) => {
    setPaginationModel({ page: 0, pageSize: 10 })
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

  const columns = [
    {
      width: 80,
      headerName: 'SL.NO',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.sl + '.'}
        </Typography>
      )
    },
    {
      minWidth: 140,
      field: 'po_date',
      headerName: 'Purchase Date',
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
          {Utility.formatDisplayDate(params.row.po_date)}
        </Typography>
      )
    },

    {
      width: 120,
      field: 'po_no',
      headerName: 'Invoice NO',
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
          {params.row.po_no}
        </Typography>
      )
    },
    {
      minWidth: 200,
      field: 'supplier_name',
      headerName: 'SUPPLIER NAME',
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
          {params.row.supplier_name}
        </Typography>
      )
    },
    {
      minWidth: 120,
      field: 'created_at',
      headerName: 'Entry Date',
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
          {Utility.formatDisplayDate(params.row.created_at)}
        </Typography>
      )
    },
    {
      minWidth: 180,
      field: 'net_amount',
      headerName: 'Purchase Amount(₹)',
      type: 'number',
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
          {Utility.formatAmountToReadableDigit(params?.row?.net_amount)}
        </Typography>
      )
    },
    {
      minWidth: 200,
      field: 'created_by',
      headerName: 'Created by ',
      renderCell: params => (
        <>
          {RenderUtility?.renderUserAvatarDetails(
            params?.row?.user_created_profile_pic,
            params?.row?.created_by_user_name,
            params?.row?.created_at
          )}
        </>

        // <Box sx={{ display: 'flex', alignItems: 'center' }}>
        //   {Utility.renderUserAvatar(params.row.user_created_profile_pic)}
        //   <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        //     <Typography variant='subtitle2' sx={{ color: 'text.primary' }}>
        //       {params?.row?.created_by_user_name ? params?.row?.created_by_user_name : 'NA'}
        //     </Typography>
        //     <Typography variant='caption' sx={{ lineHeight: 1.6667 }}>
        //       {/* {Utility.formatDisplayDate(params.row.adjusted_at)} */}
        //       {Utility.formatDisplayDate(params.row.created_at)}
        //     </Typography>
        //   </Box>
        // </Box>
      )
    },
    {
      minWidth: 250,
      field: 'updated_by',
      headerName: 'Updated by',
      renderCell: params => (
        <>
          {RenderUtility?.renderUserAvatarDetails(
            params?.row?.user_updated_profile_pic,
            params?.row?.updated_by_user_name,
            params?.row?.updated_at
          )}
        </>

        // <Box sx={{ display: 'flex', alignItems: 'center' }}>
        //   {Utility.renderUserAvatar(params.row.user_updated_profile_pic)}
        //   <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        //     <Typography variant='subtitle2' sx={{ color: 'text.primary' }}>
        //       {params?.row?.updated_by_user_name ? params?.row?.updated_by_user_name : 'NA'}
        //     </Typography>
        //     <Typography variant='caption' sx={{ lineHeight: 1.6667 }}>
        //       {/* {Utility.formatDisplayDate(params.row.adjusted_at)} */}
        //       {params?.row?.updated_at ? Utility.formatDisplayDate(params.row.updated_at) : 'NA'}
        //     </Typography>
        //   </Box>
        // </Box>
      )
    }
  ]

  const handleHeaderAction = () => {
    console.log('Handle Header Action')
  }

  const getInventoryDataToExport = async () => {
    try {
      setExcelLoader(true)

      const now = new Date()

      const timestamp = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(
        2,
        '0'
      )}-${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`

      const params = {
        sort: sort,
        q: searchValue,
        column: sortColumn,
        ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
        ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate })
      }
      const response = await getPurchaseList({ params })
      console.log('Response inventory>', response)
      setExcelLoader(false)

      if (response?.success === true && response?.data?.length > 0) {
        const data = response.data.map(el => ({
          ['Invoice No']: el?.po_no,
          ['Purchase Date']: el?.po_date,
          ['Supplier Name']: el?.supplier_name,
          ['Entry Date']: Utility.formatDisplayDate(el?.created_at) ? Utility.formatDisplayDate(el?.created_at) : 'NA',
          ['Purchase Amount']: Number(el?.net_amount),
          ['Created By']: el?.created_by_user_name ? el?.created_by_user_name : 'NA',
          ['Updated By']: el?.updated_by_user_name ? el?.updated_by_user_name : 'NA',
          ['Created At']: Utility.formatDisplayDate(el?.created_at) ? Utility.formatDisplayDate(el?.created_at) : 'NA',
          ['Updated At']: Utility.formatDisplayDate(el?.updated_at) ? Utility.formatDisplayDate(el?.updated_at) : 'NA'
        }))

        Utility.exportToCSV(data, `Purchase_list ${timestamp}`)
      } else {
        console.log('No data available for export.')
      }
    } catch (error) {
      console.log('Error >', error)
      setExcelLoader(false)
    }
  }

  const headerAction = (
    <>
      {(selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') && (
        <Box
          sx={{
            display: 'flex',
            gap: 4,
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: { xs: 'center', sm: 'flex-start' },
            whiteSpace: 'nowrap'
          }}
        >
          {/* <ExcelExportButton
            disabled={total === 0}
            action={() => {
              getInventoryDataToExport()
            }}
            loader={excelLoader}
            title='Download'
            fullWidth='fullWidth'
          /> */}
          <ExcelExportButton
            disabled={total === 0}
            action={() => {
              Router.push({
                pathname: '/pharmacy/purchase/import-purchases/'
              })
            }}
            title='Import Inventory'
            fullWidth='fullWidth'
          />
          <AddButtonContained
            title='Add Inventory'
            action={() => Router.push({ pathname: '/pharmacy/purchase/add-purchase/' })}
            fullWidth='fullWidth'
          />
        </Box>
      )}
    </>
  )

  const onRowClick = params => {
    console.log('Params >', params)
    if (
      selectedPharmacy.type === 'central' &&
      (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD')
    ) {
      handleEdit(params.row.id)
    }
  }

  return (
    <>
      {selectedPharmacy.type === 'central' ? (
        loader ? (
          <FallbackSpinner />
        ) : (
          <Card>
            {/* <CardHeader
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'column' }, // Stack items in sm screens
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
                gap: { xs: 3, sm: 1 },
                mx: { xs: -1, sm: 1 },
                width: '100%', // Ensure the header takes full width
                '& .MuiCardHeader-content': {
                  flexGrow: 1, // Allows the title to take full width
                  width: '100%'
                },

                '& .MuiCardHeader-action': {
                  width: { xs: '100% ', sm: 'auto' },
                  justifyContent: 'flex-end',
                },
                mx: { xs: -1, sm: 1 }
              }}
              title={RenderUtility.pageTitle('Inventory List')}
              action={headerAction}
            /> */}
            <CardHeader
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' }, // Stack title and actions in xs, row in sm+
                justifyContent: 'space-between', // Push title left and actions right on larger screens
                alignItems: { xs: 'flex-start', sm: 'center' }, // Align items properly
                width: '100%',
                '& .MuiCardHeader-content': {
                  flexGrow: 1 // Allows title to take available space
                },
                '& .MuiCardHeader-action': {
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' }, // Stack buttons in xs, row in sm+
                  alignItems: 'stretch', // Ensures full width in column mode
                  justifyContent: { xs: 'flex-start', sm: 'flex-end' }, // Left align in xs, right align in sm+
                  gap: 1,
                  width: { xs: '100%', sm: 'auto' } // Full width for small screens
                  // mt: { xs: 1, sm: 0 } // Add spacing between title and buttons in xs
                }
              }}
              title={RenderUtility.pageTitle('Inventory List')}
              action={headerAction}
            />

            {/* Left Box (Search Field) */}
            <CardContent sx={{ paddingTop: '4px' }}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' }, // Stack on small screens, row on larger screens
                  justifyContent: 'space-between',
                  alignItems: { xs: 'stretch', sm: 'center' }, // Stretch items in column mode
                  gap: { xs: 2, sm: 0 }, // Add spacing for small screens
                  width: '100%' // Ensure full width
                }}
              >
                <Grid
                  container
                  spacing={4}
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Grid item size={{ xs: 12, sm: 6, md: 5 }}>
                    <CommonDateRangePickers onChange={handleDateRangeChange} filterDates={filterDates} />
                  </Grid>

                  <Grid item size={{ xs: 12, sm: 6 }}>
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
                        <ExportButton
                          loading={excelLoader}
                          onClick={getInventoryDataToExport}
                          disabled={total === 0 ? true : false}
                        />
                        {/* <Tooltip title='Export'>
                          <>
                            {excelLoader ? (
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
                                onClick={getInventoryDataToExport}
                              >
                                <Icon icon='ic:round-download' fontSize={20} />
                              </Box>
                            )}
                          </>
                        </Tooltip> */}
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
                {/* Left Box (Search Field) */}

                {/* Right Box (Date Range Picker) */}
              </Box>

              <Grid
                sx={
                  {
                    // px: { xs: 2, sm: 4 },
                    // py: { xs: 2, sm: 4 },
                    // mx: { xs: 3, sm: 4 }
                  }
                }
              >
                <CommonTable
                  onRowClick={onRowClick}
                  indexedRows={indexedRows}
                  total={total}
                  columns={columns}
                  paginationModel={paginationModel}
                  onPaginationModelChange={model => {
                    setPaginationModel(model) // Update page and pageSize in the state
                    router.replace({
                      pathname: router.pathname,
                      query: {
                        ...router.query,
                        page: model.page + 1, // API uses 1-indexed pages
                        pageSize: model.pageSize,
                        searchValue,
                        sort,
                        sortColumn
                      }
                    })
                  }}
                  handleSortModel={handleSortModel}
                  setPaginationModel={setPaginationModel}
                  loading={loading}
                  searchValue={searchValue}
                />
              </Grid>
            </CardContent>
          </Card>
        )
      ) : null}
    </>
  )
}

export default ListOfPurchase
