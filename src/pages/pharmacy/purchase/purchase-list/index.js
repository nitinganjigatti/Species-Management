import React, { useState, useEffect, useCallback } from 'react'

import { getPurchaseList } from 'src/lib/api/pharmacy/getPurchaseList'
import FallbackSpinner from 'src/@core/components/spinner/index'
import { DataGrid } from '@mui/x-data-grid'
import { debounce } from 'lodash'

// ** MUI Imports
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'
import {
  Card,
  CardHeader,
  Typography,
  CardContent,
  Grid,
  FormHelperText,
  FormControl,
  TextField,
  Button
} from '@mui/material'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
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

const ListOfPurchase = () => {
  const router = useRouter()
  const theme = useTheme()

  /***** Server side pagination */

  const [loader, setLoader] = useState(false)

  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState(router.query.sort || 'desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState(router.query.searchValue || '')
  const [sortColumn, setSortColumn] = useState(router.query.sortColumn || 'label')
  // const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page, 10) - 1 || 0,
    pageSize: parseInt(router.query.pageSize, 10) || 10 
  })
  const [loading, setLoading] = useState(false)

  function loadServerRows(currentPage, data) {
    return data
  }

  const { selectedPharmacy } = usePharmacyContext()

  // const fetchTableData = useCallback(
  //   async (sort, q, column) => {
  //     try {
  //       setLoading(true)

  //       const params = {
  //         sort,
  //         q,
  //         column,
  //         page: paginationModel.page + 1,
  //         limit: paginationModel.pageSize
  //       }

  //       await getPurchaseList({ params: params }).then(res => {
  //         // console.log('getPurchaseList', res)
  //         if (res?.success === true && res?.data?.length > 0) {
  //           setTotal(parseInt(res?.count))
  //           setRows(loadServerRows(paginationModel.page, res?.data))
  //         }
  //       })
  //       setLoading(false)
  //     } catch (error) {
  //       console.log('error', error)
  //       setLoading(false)
  //     }
  //   },
  //   [paginationModel]
  // )
  const fetchTableData = useCallback(async (sortOrder, query, column, page, pageSize) => {
    setLoading(true)
    const params = {
      sort: sortOrder,
      q: query,
      column,
      page: page + 1,
      limit: pageSize
    }

    try {
      const res = await getPurchaseList({ params })
      if (res?.success && res?.data?.length > 0) {
        setTotal(parseInt(res.count, 10))
        setRows(loadServerRows(page, res.data))
      } else {
        setTotal(0)
        setRows([])
      }
    } catch (error) {
      console.log('error', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    console.log('Fetching data with updated parameters...')
    fetchTableData(sort, searchValue, sortColumn, paginationModel.page, paginationModel.pageSize)
  }, [paginationModel.page, paginationModel.pageSize, searchValue, sort, sortColumn, fetchTableData])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl: getSlNo(index)
  }))

  // const handleSortModel = newModel => {
  //   if (newModel.length) {
  //     setSort(newModel[0].sort)
  //     setSortColumn(newModel[0].field)
  //     fetchTableData(newModel[0].sort, searchValue, newModel[0].field)
  //   } else {
  //   }
  // }

  const handleSortModel = newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
    }
  }
  // useEffect(() => {
  //   // Update the URL with the current page whenever paginationModel.page changes
  //   router.push({
  //     pathname: router.pathname,
  //     query: { ...router.query, page: paginationModel.page + 1 } // Add 1 to match expected 1-indexed page
  //   })
  // }, [paginationModel.page])

  useEffect(() => {
    console.log('Api caleed 2111>>')
    router.replace({
      pathname: router.pathname,
      query: {
        ...router.query,
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize, 
        searchValue,
        sort,
        sortColumn
      }
    })
  }, [paginationModel.page,  paginationModel.pageSize, searchValue, sort, sortColumn])

  const searchTableData = useCallback(
    debounce(async (sort, q, column) => {
      setSearchValue(q)
      try {
        await fetchTableData(sort, q, column)
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

  // const handleSearch = value => {
  //   setSearchValue(value)
  //   searchTableData(sort, value, sortColumn)
  // }

  const handleSearch = useCallback(
    debounce((value) => {
      setSearchValue(value);
  
      // Reset the page to the first page (page 0 in your `paginationModel`)
      setPaginationModel((prevModel) => ({
        ...prevModel,
        page: 0,
      }));
  
      // Update the URL query parameters
      router.replace({
        pathname: router.pathname,
        query: {
          ...router.query,
          searchValue: value,
          page: 1, // Update to 1-indexed for the URL
        },
      });
    }, 500),
    [router]
  );
  

  // Handle page or query param change in URL to update paginationModel state
  useEffect(() => {
    console.log('Api caleed >>')
    if (router.query.page) {
      setPaginationModel(prevModel => ({
        ...prevModel,
        page: parseInt(router.query.page, 10) - 1 // 0-indexed
      }))
    }
  }, [router.query.page])

  const columns = [
    {
      flex: 0.1,
      Width: 40,
      field: 'sl',
      headerName: 'SL NO',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.sl + '.'}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
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
      flex: 0.2,
      minWidth: 20,
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
      flex: 0.2,
      minWidth: 20,
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
      flex: 0.2,
      minWidth: 20,
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
      flex: 0.2,
      minWidth: 20,
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
          {params?.row?.net_amount}
        </Typography>
      )
    }
  ]

  const handleHeaderAction = () => {
    console.log('Handle Header Action')
  }

  const headerAction = (
    <Grid sx={{ display: 'flex', gap: 2 }}>
      <ExcelExportButton
        disabled={total === 0 ? true : false}
        action={() => {
          Router.push({
            pathname: '/pharmacy/purchase/import-purchases/'

            // pathname: '/pharmacy/purchase/import-purchases/v2'
          })
        }}
        title='Import Inventory'
      />
      <AddButtonContained
        title='Add Inventory'
        action={() => Router.push({ pathname: '/pharmacy/purchase/add-purchase/' })}
      />
    </Grid>
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

  const title = (
    <>
      <Typography sx={{ fontSize: '24px', fontFamily: 'Inter', fontWeight: 500, ml: 1 }}>Inventory List</Typography>
    </>
  )

  return (
    <>
      {selectedPharmacy.type === 'central' ? (
        loader ? (
          <FallbackSpinner />
        ) : (
          <>
            <Card>
              <CardHeader title={title} action={headerAction} />
              <Box display='flex' justifyContent='space-between' alignItems='center'>
                {/* Left Box (Search Field) */}
                <Grid item xs={8}>
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
                </Grid>
              </Box>
              <Grid
                sx={{
                  mx: 4
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
              {/* <DataGrid
                sx={{
                  '.MuiDataGrid-cell:focus': {
                    outline: 'none'
                  },

                  '& .MuiDataGrid-row:hover': {
                    cursor: 'pointer'
                  }
                }}
                columnVisibilityModel={{
                  sl: false
                }}
                autoHeight
                pagination
                hideFooterSelectedRowCount
                disableColumnSelector={true}
                rows={indexedRows === undefined ? [] : indexedRows}
                rowCount={total}
                total
                columns={columns}
                sortingMode='server'
                paginationMode='server'
                pageSizeOptions={[7, 10, 25, 50]}
                paginationModel={paginationModel}
                onSortModelChange={handleSortModel}
                slots={{ toolbar: ServerSideToolbar }}
                onPaginationModelChange={setPaginationModel}
                loading={loading}
                disableColumnMenu
                slotProps={{
                  baseButton: {
                    variant: 'outlined'
                  },
                  toolbar: {
                    value: searchValue,
                    clearSearch: () => handleSearch(''),
                    onChange: event => handleSearch(event.target.value)
                  }
                }}
                onRowClick={onRowClick}
              /> */}
            </Card>
          </>
        )
      ) : (
        <Error404 />
      )}
    </>
  )
}

export default ListOfPurchase
