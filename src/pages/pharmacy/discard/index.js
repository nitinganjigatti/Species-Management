import React, { useState, useEffect, useCallback } from 'react'

import FallbackSpinner from 'src/@core/components/spinner/index'
import { DataGrid } from '@mui/x-data-grid'
import { debounce } from 'lodash'
import { getDiscardList } from 'src/lib/api/pharmacy/discard'
import { format, subDays, subMonths } from 'date-fns'

// ** MUI Imports
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'
import { Card, CardHeader, Typography, Grid, TextField, InputAdornment, Tooltip } from '@mui/material'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box } from '@mui/material'

import Router, { useRouter } from 'next/router'
import Error404 from 'src/pages/404'

import { usePharmacyContext } from 'src/context/PharmacyContext'
import { AddButton, ExcelExportButton } from 'src/components/Buttons'
import Utility from 'src/utility'
import { useTheme } from '@emotion/react'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { AddButtonContained } from 'src/components/ButtonContained'
import RenderUtility from 'src/utility/render'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import { ExportButton } from 'src/views/utility/render-snippets'

const ListOfDiscardProducts = () => {
  const theme = useTheme()
  const router = useRouter()

  /***** Server side pagination */
  const updateUrlParams = params => {
    const query = { ...router.query, ...params }
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true })
  }

  const [loader, setLoader] = useState(false)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState(router.query.sort || 'desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState(router.query.q || '')
  const [sortColumn, setSortColumn] = useState(router.query.column || 'created_at')
  const [excelLoader, setExcelLoader] = useState(false)

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
    pageSize: parseInt(router.query.limit) || 50
  })
  const [loading, setLoading] = useState(false)

  function loadServerRows(currentPage, data) {
    return data
  }
  const { selectedPharmacy } = usePharmacyContext()

  const fetchTableData = useCallback(
    async ({ sort, q, column, page, limit, filterDates }) => {
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

        await getDiscardList({ params: params }).then(res => {
          if (res?.success === true && res?.data?.list_items?.length > 0) {
            setTotal(parseInt(res?.data?.total_count))
            setRows(loadServerRows(paginationModel.page, res?.data?.list_items))

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
      }
    },
    [paginationModel, filterDates]
  )

  useEffect(() => {
    fetchTableData({
      sort,
      q: searchValue,
      column: sortColumn,
      page: paginationModel.page,
      limit: paginationModel.pageSize,
      filterDates
    })

    updateUrlParams({
      sort,
      q: searchValue,
      column: sortColumn,
      page: paginationModel.page,
      limit: paginationModel.pageSize,
      from_date: filterDates?.startDate || '',
      to_date: filterDates?.endDate || ''
    })
  }, [paginationModel.page, paginationModel.pageSize, selectedPharmacy, filterDates])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl: getSlNo(index)
  }))

  const handleSortModel = newModel => {
    if (newModel.length) {
      const { sort, field } = newModel[0]
      setSort(sort)
      setSortColumn(field)

      fetchTableData({
        sort,
        q: searchValue,
        column: field,
        page: paginationModel.page,
        limit: paginationModel.pageSize,
        filterDates
      })
      updateUrlParams({
        sort,
        q: searchValue,
        column: sortColumn,
        page: paginationModel.page,
        limit: paginationModel.pageSize,
        ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
        ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate })
      })
    }
  }

  const searchTableData = useCallback(
    debounce(async (sort, q, column, filterDates) => {
      setSearchValue(q)
      setTotal(0)
      setPaginationModel({ page: 0, pageSize: 50 })

      try {
        await fetchTableData({
          sort,
          q,
          column,
          page: paginationModel.page,
          limit: paginationModel.pageSize,
          filterDates
        })
        updateUrlParams({
          sort,
          q: q,
          column: sortColumn,
          page: paginationModel.page,
          limit: paginationModel.pageSize,
          ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
          ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate })
        })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, sortColumn, filterDates)
  }

  const handleEdit = id => {
    Router.push({
      pathname: '/pharmacy/discard/add-discard/',
      query: { id: id, action: 'edit' }
    })
  }

  const columns = [
    {
      flex: 0.1,
      Width: 40,
      field: 'id',
      headerName: 'SL.NO',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {parseInt(params.row.sl) + '.'}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'req_no',
      headerName: 'Request Number',
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
          {params.row.req_no}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'supplier_name',
      headerName: 'Supplier Name',
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
      flex: 0.2,
      minWidth: 20,
      field: 'total_qty',
      headerName: 'Total Qty',
      type: 'number',
      headerAlign: 'left',
      align: 'left',
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
          {params.row.total_qty}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'discarded_date',
      headerName: 'Discarded Date',
      type: 'number',
      headerAlign: 'left',
      align: 'left',
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
          {Utility.formatDisplayDate(params.row.discarded_date) === 'Invalid date'
            ? 'NA'
            : Utility.formatDisplayDate(params.row.discarded_date)}
        </Typography>
      )
    },
    {
      flex: 0.2,
      Width: 20,
      field: 'created_at',
      headerName: 'Discarded by ',
      renderCell: params => (
        <>
          {RenderUtility?.renderUserAvatarDetails(
            params?.row?.user_profile_pic,
            params?.row?.created_by_user_name,
            params?.row?.created_at
          )}
        </>

        // <Box sx={{ display: 'flex', alignItems: 'center' }}>
        //   {Utility.renderUserAvatar(params.row.user_profile_pic)}
        //   <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        //     <Typography variant='subtitle2' sx={{ color: 'text.primary' }}>
        //       {params?.row?.created_by_user_name ? params?.row?.created_by_user_name : 'NA'}
        //     </Typography>
        //     <Typography variant='caption' sx={{ lineHeight: 1.6667 }}>
        //       {Utility.formatDisplayDate(params.row.created_at)}
        //     </Typography>
        //   </Box>
        // </Box>
      )
    }
  ]

  const getSupplierDataToExport = async () => {
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

      const response = await getDiscardList({ params })
      setExcelLoader(false)
      if (response?.success === true && response?.data?.list_items?.length > 0) {
        const data = response?.data?.list_items?.map(el => ({
          ['Request Number']: el?.req_no,
          ['Supplier Name']: el?.supplier_name,
          ['Quantity']: el?.total_qty,
          ['Discarded Date']: Utility.formatDisplayDate(el?.discarded_date)
            ? Utility.formatDisplayDate(el?.discarded_date)
            : 'NA',
          ['Discarded By']: el?.created_by_user_name ? el?.created_by_user_name : 'NA'
        }))

        Utility.exportToCSV(data, `Return_Supplier_List ${timestamp}`)
      } else {
        console.log('No data available for export.')
      }
    } catch (error) {
      console.log('Error >>', error)
    }
  }

  const handleHeaderAction = () => {
    console.log('Handle Header Action')
  }

  // const headerAction = (
  //   <Grid
  //     sx={{
  //       display: 'flex',
  //       flexDirection: 'row', // Ensure buttons stay inline
  //       alignItems: 'center', // Align buttons parallel to the title
  //       gap: 4,
  //       mt: { xs: 0 }
  //     }}
  //   >
  //     <ExcelExportButton
  //       disabled={total === 0}
  //       action={() => {
  //         getSupplierDataToExport()
  //       }}
  //       loader={excelLoader}
  //       title='download'
  //       sx={{
  //         minWidth: 120, // Set a minimum width for smaller buttons
  //         maxWidth: 160, // Limit button expansion
  //         padding: '6px 12px' // Adjust padding for better size
  //       }}
  //     />
  //     <AddButtonContained
  //       title='Return to Supplier'
  //       action={() => Router.push({ pathname: '/pharmacy/discard/add-discard' })}
  //       sx={{
  //         // minWidth: { xs: 100, sm: 0 },
  //         // maxWidth: { xs: 100, sm: 0 },
  //         // padding: '6px 12px'
  //       }}
  //     />
  //   </Grid>
  // )

  const headerAction = (
    <Grid
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' }, // Stack buttons vertically
        gap: 2, // Add spacing between buttons
        width: '100%' // Ensure full width
      }}
    >
      {/* <ExcelExportButton
        disabled={total === 0}
        action={() => {
          getSupplierDataToExport()
        }}
        loader={excelLoader}
        title='Download'
        sx={{
          width: '100%' // Make button full-width
        }}
      /> */}
      {selectedPharmacy.type === 'central' &&
      (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') ? (
        <AddButtonContained
          title='Return to Supplier'
          action={() => Router.push({ pathname: '/pharmacy/discard/add-discard' })}
          fullWidth='fullWidth'
        />
      ) : (
        <></>
      )}
    </Grid>
  )

  const onRowClick = params => {
    if (
      selectedPharmacy.type === 'central' &&
      (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD')
    ) {
      handleEdit(params.row.id)
    }
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
        from_date: formattedStartDate,
        to_date: formattedEndDate
      })
    } else {
      setFilterDates({
        startDate: '',
        endDate: ''
      })
      updateUrlParams({
        from_date: '',
        to_date: ''
      })
    }
  }

  return (
    <>
      {selectedPharmacy.type === 'central' ? (
        loader ? (
          <FallbackSpinner />
        ) : (
          <>
            <Card>
              <CardHeader
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  justifyContent: 'flex-start', // Align content to the left
                  alignItems: 'flex-start', // Align items to the top left
                  gap: { xs: 3, sm: 0 },
                  '& .MuiCardHeader-action': {
                    width: { xs: '100% ', sm: 'auto' }
                  },
                  mx: { xs: -1, sm: 1 },
                  mt: 1
                }}
                title={RenderUtility.pageTitle('Return to Supplier List')}
                action={headerAction}
              />
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' }, // Column for small screens, row for larger screens
                  justifyContent: 'space-between'
                }}
              >
                {/* Left Box (Search Field) */}
                {/* <Grid item xs={8}>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                border: '1px solid #C3CEC7',
                                borderRadius: '8px',
                                padding: '0 8px',
                                ml: 5,
                                height: '40px',
                                width: '250px' // Set a fixed width for all status
                              }}
                            >
                              <Icon icon='mi:search' fontSize={24} color={theme.palette.customColors.neutralSecondary} />
                              <TextField
                                variant='outlined'
                                placeholder='Search...'
                                value={searchValue}
                                onChange={e => handleSearch(e.target.value)}
                                fullWidth
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    border: 'none',
                                    padding: '0',
                                    '& fieldset': {
                                      border: 'none'
                                    }
                                  }
                                }}
                              />
                                 </Box>
                                 </Grid> */}

                {/* <Grid item xs={12} sm={7} md={7} sx={{ float: 'right', mr: 1 }}>
                             {status === 'all' || status === 'completed' ? (
                                <Box sx={{ float: 'right', mt: 1 }}>
                            <FormControlLabel
                              control={<Switch defaultChecked={filterSwitch} onChange={handleSwitchChange} />}
                              label='Completed'
                              labelPlacement='end'
                            />
                              </Box>
                               ) : null}
                                 </Grid> */}
              </Box>
              {/* <Grid
                          sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            justifyContent: 'flex-start', // Align content to the left
                            alignItems: 'flex-start' // Align items to the top left
                          }}
                        /> */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap', // Allow wrapping on small screens
                  mx: { xs: 3, md: 5 }
                }}
              >
                {/* Left Box (Search Field) */}
                <Grid
                  container
                  spacing={4}
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Grid item size={{ xs: 12, sm: 6, md: 5 }}>
                    <CommonDateRangePickers onChange={handleDateRangeChange} filterDates={filterDates} />
                  </Grid>

                  <Grid item size={{ xs: 12, sm: 6 }}>
                    <Grid
                      container
                      spacing={2}
                      sx={{
                        justifyContent: { xs: 'flex-end' }
                      }}
                    >
                      <Grid item size={{ xs: 12, sm: 8 }} sx={{ flex: 1 }}>
                        <TextField
                          variant='outlined'
                          size='small'
                          placeholder='Search...'
                          value={searchValue}
                          onChange={e => handleSearch(e.target.value)}
                          fullWidth
                          sx={{
                            borderRadius: '8px'
                          }}
                          slotProps={{
                            input: {
                              startAdornment: (
                                <InputAdornment position='start'>
                                  <Icon
                                    icon='mi:search'
                                    fontSize={24}
                                    color={theme.palette.customColors.neutralSecondary}
                                  />
                                </InputAdornment>
                              )
                            }
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
                          onClick={getSupplierDataToExport}
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
                                onClick={getSupplierDataToExport}
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
                {/* <Grid
                            item
                            xs={12}
                            sm='auto'
                            sx={{
                              mx: { xs: 0, sm: 1 },
                              mt: { xs: 3, sm: 2 },
                              width: { xs: '100%', sm: 'auto' } // Full width on small screens
                            }}
                          >
                            <CommonDateRangePickers onChange={handleDateRangeChange} filterDates={filterDates} />
                          </Grid> */}
              </Box>
              <Grid
                sx={{
                  mx: { xs: 3, md: 5 }
                }}
              >
                <CommonTable
                  onRowClick={onRowClick}
                  indexedRows={indexedRows}
                  total={total}
                  columns={columns}
                  paginationModel={paginationModel}
                  handleSortModel={handleSortModel}
                  setPaginationModel={setPaginationModel}
                  loading={loading}
                  searchValue={searchValue}
                />
              </Grid>
            </Card>
          </>
        )
      ) : (
        <Error404 />
      )}
    </>
  )
}

export default ListOfDiscardProducts
