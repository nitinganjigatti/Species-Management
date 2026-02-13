import React, { useState, useEffect, useCallback } from 'react'

import FallbackSpinner from 'src/@core/components/spinner/index'

import { debounce } from 'lodash'
import { getDiscardList } from 'src/lib/api/pharmacy/discard'

// ** MUI Imports

import { Box, Typography, Grid, TextField } from '@mui/material'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

import Router, { useRouter } from 'next/router'
import Error404 from 'src/pages/404'

import { usePharmacyContext } from 'src/context/PharmacyContext'

import { useTheme } from '@emotion/react'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { AddButtonContained } from 'src/components/ButtonContained'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'

const ListOfDiscardProducts = () => {
  const theme = useTheme()
  const router = useRouter()

  /***** Server side pagination */
  const updateUrlParams = params => {
    const query = { ...router.query, ...params }
    router.push({ pathname: router.pathname, query }, undefined, { shallow: true })
  }

  const [loader, setLoader] = useState(false)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState(router.query.sort || 'desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState(router.query.q || '')
  const [sortColumn, setSortColumn] = useState(router.query.column || 'created_at')

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
    async ({ sort, q, column, page, limit }) => {
      try {
        setLoading(true)

        const params = {
          sort,
          q,
          column,
          page: page + 1,
          limit
        }

        await getDiscardList({ params: params }).then(res => {
          if (res?.success === true && res?.data?.list_items?.length > 0) {
            setTotal(parseInt(res?.data?.total_count))
            setRows(loadServerRows(paginationModel.page, res?.data?.list_items))
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
    [paginationModel]
  )

  useEffect(() => {
    fetchTableData({
      sort,
      q: searchValue,
      column: sortColumn,
      page: paginationModel.page,
      limit: paginationModel.pageSize
    })

    updateUrlParams({
      sort,
      q: searchValue,
      column: sortColumn,
      page: paginationModel.page,
      limit: paginationModel.pageSize
    })
  }, [paginationModel.page, paginationModel.pageSize, selectedPharmacy])

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
        limit: paginationModel.pageSize
      })
      updateUrlParams({
        sort,
        q: searchValue,
        column: sortColumn,
        page: paginationModel.page,
        limit: paginationModel.pageSize
      })
    }
  }

  const searchTableData = useCallback(
    debounce(async (sort, q, column) => {
      setSearchValue(q)
      setTotal(0)
      setPaginationModel({ page: 0, pageSize: 10 })

      try {
        await fetchTableData({ sort, q, column, page: paginationModel.page, limit: paginationModel.pageSize })
        updateUrlParams({
          sort,
          q: q,
          column: sortColumn,
          page: paginationModel.page,
          limit: paginationModel.pageSize
        })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, sortColumn)
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
      headerName: 'S.NO',
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
            fontWeight: 500
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
            fontWeight: 500
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
            fontWeight: 500
          }}
        >
          {params.row.total_qty}
        </Typography>
      )
    },

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'discarded_date',
    //   headerName: 'Discarded Date',
    //   type: 'number',
    //   headerAlign: 'left',
    //   align: 'left',
    //   renderCell: params => (
    //     <Typography
    //       variant='body2'
    //       sx={{
    //         color: theme.palette.customColors.customHeadingTextColor,
    //         fontSize: '14px',
    //         fontWeight: 500,
    //         fontFamily: 'Inter'
    //       }}
    //     >
    //       {Utility.formatDisplayDate(params.row.discarded_date) === 'Invalid date'
    //         ? 'NA'
    //         : Utility.formatDisplayDate(params.row.discarded_date)}
    //     </Typography>
    //   )
    // },
    {
      flex: 0.2,
      Width: 20,
      field: 'created_at',
      headerName: 'Discarded by ',
      renderCell: params => (
        <>
          <UserAvatarDetails
            profile_image={params?.row?.user_profile_pic}
            user_name={params?.row?.created_by_user_name}
            date={params?.row?.created_at}
          />
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

  const handleHeaderAction = () => {
    console.log('Handle Header Action')
  }

  const headerAction = (
    <Grid sx={{ display: 'flex', gap: 2 }}>
      {/* <ExcelExportButton
        disabled={total === 0 ? true : false}
        action={() => {
          Router.push({
            pathname: '/pharmacy/purchase/import-purchases/'

            // pathname: '/pharmacy/purchase/import-purchases/v2'
          })
        }}
        title='Import Inventory'
      /> */}
      {selectedPharmacy.type === 'central' &&
      (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') ? (
        <AddButtonContained
          title='Return to Supplier'
          styles={{ margin: 0 }}
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

  return (
    <>
      {selectedPharmacy.type === 'central' ? (
        loader ? (
          <FallbackSpinner />
        ) : (
          <>
            <PageCardLayout title={'Return to Supplier List'} action={headerAction}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
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
              <Grid
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  justifyContent: 'flex-start',
                  alignItems: 'flex-start'
                }}
              />
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap'
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',

                    border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                    borderRadius: '8px',
                    padding: '0 8px',
                    width: { xs: '100%', sm: '250px' },
                    height: '40px'
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
              </Box>
              <Grid>
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
            </PageCardLayout>
          </>
        )
      ) : (
        <Error404 />
      )}
    </>
  )
}

export default ListOfDiscardProducts
