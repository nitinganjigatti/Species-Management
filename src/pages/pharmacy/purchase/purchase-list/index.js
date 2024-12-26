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
  const [sortColumn, setSortColumn] = useState(router.query.column || 'label')

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page) || 0,
    pageSize: parseInt(router.query.limit) || 10
  })
  const [loading, setLoading] = useState(false)

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
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize
        }

        await getPurchaseList({ params: params }).then(res => {
          if (res?.success === true && res?.data?.length > 0) {
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
    [paginationModel]
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
  }, [selectedPharmacy.id, paginationModel.page, paginationModel.pageSize])

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
    },
    {
      flex: 0.3,
      Width: 40,
      field: 'created_by',
      headerName: 'Created by ',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {Utility.renderUserAvatar(params.row.user_created_profile_pic)}
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant='subtitle2' sx={{ color: 'text.primary' }}>
              {params?.row?.created_by_user_name ? params?.row?.created_by_user_name : 'NA'}
            </Typography>
            <Typography variant='caption' sx={{ lineHeight: 1.6667 }}>
              {/* {Utility.formatDisplayDate(params.row.adjusted_at)} */}
              {Utility.formatDisplayDate(params.row.created_at)}
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      flex: 0.3,
      Width: 40,
      field: 'updated_by',
      headerName: 'Updated by ',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {Utility.renderUserAvatar(params.row.user_updated_profile_pic)}
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant='subtitle2' sx={{ color: 'text.primary' }}>
              {params?.row?.updated_by_user_name ? params?.row?.updated_by_user_name : 'NA'}
            </Typography>
            <Typography variant='caption' sx={{ lineHeight: 1.6667 }}>
              {/* {Utility.formatDisplayDate(params.row.adjusted_at)} */}
              {params?.row?.updated_at ? Utility.formatDisplayDate(params.row.updated_at) : 'NA'}
            </Typography>
          </Box>
        </Box>
      )
    }
  ]

  const handleHeaderAction = () => {
    console.log('Handle Header Action')
  }

  const headerAction = (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        // alignItems: 'center',
        justifyContent: 'flex-start', // Ensure buttons align to the right
        // flexWrap: 'wrap',
        fontSize: { xs: '18px', sm: '10px', md: '14px' },
        mt: { xs: 2, sm: 0 } // Add margin on small screens
      }}
    >
      <ExcelExportButton
        disabled={total === 0}
        action={() => {
          Router.push({
            pathname: '/pharmacy/purchase/import-purchases/'
          })
        }}
        title='Import Inventory'
      />
      <AddButtonContained
        title='Add Inventory'
        action={() => Router.push({ pathname: '/pharmacy/purchase/add-purchase/' })}
      />
    </Box>
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

  // const title = (
  //   <Typography
  //     sx={{
  //       fontSize: { xs: '18px', sm: '20px', md: '24px' },
  //       fontFamily: 'Inter',
  //       fontWeight: 500
  //       // ml: { xs: 0, sm: 1 },
  //       // textAlign: { xs: 'center', sm: 'left' }
  //     }}
  //   >
  //     Inventory List
  //   </Typography>
  // )

  // return (
  //   <>
  //     {selectedPharmacy.type === 'central' ? (
  //       loader ? (
  //         <FallbackSpinner />
  //       ) : (
  //         <Card>
  //           <CardHeader
  //             title={title}
  //             action={headerAction}
  //             sx={{
  //               display: 'flex',
  //               justifyContent: 'space-between', // Space between title and action
  //               flexWrap: 'wrap' // Allow wrapping on smaller screens
  //               // alignItems: 'center'
  //             }}
  //           />
  //           <Box
  //             sx={{
  //               display: 'flex',
  //               justifyContent: 'space-between',
  //               // alignItems: 'center',
  //               flexWrap: 'wrap',
  //               px: { xs: 2, sm: 4 },
  //               py: 2
  //             }}
  //           >
  //             {/* Left Box (Search Field) */}
  //             <Grid item xs={12} sm={8} md={6} lg={4}>
  //               <Box
  //                 sx={{
  //                   display: 'flex',
  //                   alignItems: 'center',
  //                   border: '1px solid #C3CEC7',
  //                   borderRadius: '8px',
  //                   padding: '0 8px',

  //                   height: "40px",
  //                   ml: 2
  //                 }}
  //               >
  //                 <Icon icon='mi:search' fontSize={20} color={theme.palette.customColors.neutralSecondary} />
  //                 <TextField
  //                   variant='outlined'
  //                   placeholder='Search...'
  //                   value={searchValue}
  //                   onChange={e => handleSearch(e.target.value)}
  //                   fullWidth
  //                   sx={{
  //                     '& .MuiOutlinedInput-root': {
  //                       border: 'none',
  //                       padding: '0',
  //                       '& fieldset': {
  //                         border: 'none'
  //                       }
  //                     }
  //                   }}
  //                 />
  //               </Box>
  //             </Grid>
  //           </Box>
  //           <Grid
  //             sx={{
  //               px: { xs: 2, sm: 4 },
  //               py: { xs: 2, sm: 4 },
  //               mx: { xs: 0, sm: 2 }
  //             }}
  //           >
  //             <CommonTable
  //               onRowClick={onRowClick}
  //               indexedRows={indexedRows}
  //               total={total}
  //               columns={columns}
  //               paginationModel={paginationModel}
  //               onPaginationModelChange={model => {
  //                 setPaginationModel(model) // Update page and pageSize in the state
  //                 router.replace({
  //                   pathname: router.pathname,
  //                   query: {
  //                     ...router.query,
  //                     page: model.page + 1, // API uses 1-indexed pages
  //                     pageSize: model.pageSize,
  //                     searchValue,
  //                     sort,
  //                     sortColumn
  //                   }
  //                 })
  //               }}
  //               handleSortModel={handleSortModel}
  //               setPaginationModel={setPaginationModel}
  //               loading={loading}
  //               searchValue={searchValue}
  //             />
  //           </Grid>
  //         </Card>
  //       )
  //     ) : (
  //       <Error404 />
  //     )}
  //   </>
  // )
  const title = (
    <Typography
      sx={{
        fontSize: { xs: '18px', sm: '20px', md: '24px' },
        fontFamily: 'Inter',
        fontWeight: 500,
        flex: 1, // Make the title take full space
        textAlign: { xs: 'left', sm: 'left' } // Align left on all screens
      }}
    >
      Inventory List
    </Typography>
  )

  return (
    <>
      {selectedPharmacy.type === 'central' ? (
        loader ? (
          <FallbackSpinner />
        ) : (
          <Card>
            <CardHeader
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' }, // Column on small screens
                alignItems: { xs: 'flex-start', sm: 'center' }, // Align to left on small screens
                gap: { xs: 2, sm: 0 }, // Add space between title and buttons on small screens
                px: { xs: 2, sm: 4 }
              }}
              title={title}
              action={
                <Box
                  sx={{
                    display: 'flex',
                    gap: 2,
                    flexDirection: { xs: 'row', sm: 'row' }, // Keep buttons in a row
                    justifyContent: { xs: 'flex-start', sm: 'flex-end' }, // Align buttons to the left
                    width: { xs: '100%', sm: 'auto' } // Take full width on small screens
                  }}
                >
                  {headerAction}
                </Box>
              }
            />
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap', // Allow wrapping
                px: { xs: 2, sm: 4 },
                py: 2
              }}
            >
              {/* Left Box (Search Field) */}
              <Grid item xs={12} sm={8} md={6} lg={4} sx={{ width: { xs: '100%', sm: '292px' } }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid #C3CEC7',
                    borderRadius: '8px',

                    // padding: '0 8px',
                    height: '40px',
                    ml: { xs: 0, sm: 2 } // Remove margin on small screens
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
            </Box>
            <Grid
              sx={{
                px: { xs: 2, sm: 4 },
                py: { xs: 2, sm: 4 },
                mx: { xs: 0, sm: 2 }
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
