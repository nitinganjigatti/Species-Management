import React, { useState, useEffect, useCallback } from 'react'

import { getPurchaseList } from 'src/lib/api/pharmacy/getPurchaseList'
import FallbackSpinner from 'src/@core/components/spinner/index'
import { DataGrid } from '@mui/x-data-grid'
import { debounce } from 'lodash'
import Icon from 'src/@core/components/icon'

// ** MUI Imports
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'
import { Card, CardHeader, Typography, Grid, TextField } from '@mui/material'

// ** Icon Imports
import { Box } from '@mui/material'

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
    startDate: router.query.startDate || '',
    endDate: router.query.endDate || ''
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
    async ({ sort, q, column }) => {
      try {
        setLoading(true)

        const params = {
          sort,
          q,
          column,
          ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
          ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate }),
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize
        }

        await getPurchaseList({ params: params }).then(res => {
          if (res?.success === true && res?.data?.length > 0) {
            console.log('RESPONSE >>', res?.data)
            setTotal(parseInt(res?.count))
            setRows(loadServerRows(paginationModel.page, res?.data))
            updateUrlParams({
              sort,
              q: q,
              column: column,
              page: paginationModel?.page,
              limit: paginationModel?.pageSize
            })
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
    fetchTableData({ sort: sort, q: searchValue, column: sortColumn })
    updateUrlParams({
      sort,
      q: searchValue,
      column: sortColumn,
      page: paginationModel?.page,
      limit: paginationModel?.pageSize
    })

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
      fetchTableData({ sort: newModel[0].sort, q: searchValue, column: newModel[0].field })
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
        await fetchTableData({ sort, q, column })
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

  const handleEdit = id => {
    Router.push({
      pathname: '/pharmacy/purchase/add-purchase/',
      query: { id: id, action: 'edit' }
    })
  }

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, sortColumn)
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
      field: 'sl',
      headerName: 'SL NO',
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
      headerName: 'Purchase Amount',
      type: 'number',
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
          {Number(params?.row?.net_amount).toFixed(2)}
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
      const response = await getPurchaseList({ sort, q: searchValue, column: sortColumn, filterDates })
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

        Utility.exportToCSV(data, 'Inventory_List')
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
          <ExcelExportButton
            disabled={total === 0}
            action={() => {
              getInventoryDataToExport()
            }}
            loader={excelLoader}
            title='Download'
            fullWidth='fullWidth'
          />
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
                  width: { xs: '100%', sm: 'auto' }, // Full width for small screens
                  mt: { xs: 1, sm: 0 } // Add spacing between title and buttons in xs
                }
              }}
              title={RenderUtility.pageTitle('Inventory List')}
              action={headerAction}
            />

            {/* <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' }, // Column for small screens, row for larger screens
                justifyContent: 'space-between',
                gap: { xs: 2, sm: 0 } // Adds spacing between elements on small screens
              }}
            >
              {/* Left Box (Search Field) */}

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
              {/* Left Box (Search Field) */}
              <Grid
                item
                xs={12}
                sm={8}
                md={6}
                lg={4}
                sx={{
                  mx: { xs: 3, sm: 4 },
                  width: { xs: '91%', sm: 'auto' } // Full width on small screens
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                    borderRadius: '8px',
                    padding: '0 8px',
                    width: '100%', // Ensure full width for input container
                    height: '40px',
                    mx: 1
                  }}
                >
                  <Icon icon='mi:search' fontSize={20} color={theme.palette.customColors.neutralSecondary} />
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
              </Grid>

              {/* Right Box (Date Range Picker) */}
              <Grid
                item
                xs={12}
                sm='auto'
                sx={{
                  mx: { xs: 3, sm: 4 },
                  mt: { xs: 2, sm: 2 },
                  width: { xs: '92%', sm: 'auto' } // Full width on small screens
                }}
              >
                <CommonDateRangePickers onChange={handleDateRangeChange} filterDates={filterDates} />
              </Grid>
            </Box>

            <Grid
              sx={{
                // px: { xs: 2, sm: 4 },
                // py: { xs: 2, sm: 4 },
                mx: { xs: 3, sm: 4 }
              }}
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
          </Card>
        )
      ) : null}
    </>
  )
}

export default ListOfPurchase
