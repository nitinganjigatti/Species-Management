import React, { useState, useEffect, useCallback } from 'react'

import FallbackSpinner from 'src/@core/components/spinner/index'
import { DataGrid } from '@mui/x-data-grid'
import { debounce } from 'lodash'
import CustomAvatar from 'src/@core/components/mui/avatar'

// ** MUI Imports
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'
import { Card, CardHeader, Typography, Grid, Tooltip, TextField } from '@mui/material'

// ** Icon Imports
import { Box } from '@mui/material'

import { useRouter } from 'next/router'
import Error404 from 'src/pages/404'
import { stocksAdjustedList } from 'src/lib/api/pharmacy/stockAdjustment'
import ConfirmDialogBox from 'src/components/ConfirmDialogBox'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import { AddButton, ExcelExportButton } from 'src/components/Buttons'
import Utility from 'src/utility'
import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import { styled } from '@mui/material/styles'
import MuiTabList from '@mui/lab/TabList'
import TabList from '@mui/lab/TabList'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@emotion/react'

import Chip from '@mui/material/Chip'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { AddButtonContained } from 'src/components/ButtonContained'

const ListOfStockAdjusted = () => {
  const theme = useTheme()
  const router = useRouter()

  /***** Server side pagination */
  const updateUrlParams = params => {
    const query = { ...router.query, ...params }
    router.push({ pathname: router.pathname, query }, undefined, { shallow: true })
  }

  console.log(router.query)

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
  const [status, setStatus] = useState(router.query.reason || 'Missing stock')
  const [expandedText, setExpandedText] = useState('')
  const [notesDialog, setNotesDialog] = useState(false)

  const closeNotesDialog = () => {
    setNotesDialog(false)
    setExpandedText('')
  }

  const openNotesDialog = () => {
    setNotesDialog(true)
  }

  const handleChange = (event, newValue) => {
    setTotal(0)
    setSearchValue('')

    // Update status state and URL query
    setStatus(newValue)
  }

  function loadServerRows(currentPage, data) {
    return data
  }

  const { selectedPharmacy } = usePharmacyContext()

  const fetchTableData = useCallback(
    async (sort, q, column, status) => {
      try {
        setLoading(true)

        const params = {
          sort,
          q,
          column,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          reason: status
        }

        await stocksAdjustedList({ params: params }).then(res => {
          // console.log('stocksAdjustedList', res)
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
        setTotal(0)
        setRows([])
      }
    },
    [paginationModel]
  )
  useEffect(() => {
    fetchTableData(sort, searchValue, sortColumn, status)
    updateUrlParams({
      sort,
      q: searchValue,
      column: sortColumn,
      page: paginationModel.page,
      limit: paginationModel.pageSize,
      reason: status
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPharmacy.id, status, paginationModel.page, paginationModel.pageSize])

  // useEffect(() => {
  //   if (router.query.status) {
  //     setStatus(router.query.status)
  //   }
  // }, [router.query.status])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl: getSlNo(index)
  }))

  const handleSortModel = newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
      fetchTableData(newModel[0].sort, searchValue, newModel[0].field, status)
      updateUrlParams({
        sort: newModel[0].sort,
        q: searchValue,
        column: newModel[0].field,
        page: paginationModel.page,
        limit: paginationModel.pageSize,
        reason: status
      })
    } else {
    }
  }

  const searchTableData = useCallback(
    debounce(async (sort, q, column, status) => {
      setSearchValue(q)
      setPaginationModel({ page: 0, pageSize: 10 })

      try {
        await fetchTableData(sort, q, column, status)
        updateUrlParams({
          sort,
          q: q,
          column: sortColumn,
          page: paginationModel.page,
          limit: paginationModel.pageSize,
          reason: status
        })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  // const handleEdit = id => {
  //   Router.push({
  //     pathname: '/pharmacy/purchase/add-purchase/',
  //     query: { id: id, action: 'edit' }
  //   })
  // }

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, sortColumn, status)
  }

  const renderUserAvatar = row => {
    if (row.user_profile_pic) {
      return <CustomAvatar src={row?.user_profile_pic} sx={{ mr: 3, width: 34, height: 34 }} />
    } else {
      return <CustomAvatar sx={{ mr: 3, width: 34, height: 34, fontSize: '.8rem' }}></CustomAvatar>
    }
  }

  const columns = [
    {
      flex: 0.2,
      Width: 40,
      field: 'sl',
      headerName: 'S.NO ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.sl + '.'}
        </Typography>
      )
    },

    {
      flex: 0.25,
      minWidth: 40,
      field: 'stock_name',
      headerName: 'Product Name',
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
          {params.row.stock_name}
        </Typography>
      )
    },
    {
      flex: 0.25,
      Width: 40,
      field: 'batch_no',
      headerName: 'Batch number ',
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
      flex: 0.35,
      minWidth: 20,
      align: 'left',
      field: 'adjustment_quantity',
      headerName: 'Adjustment quantity',
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
          {params.row.adjustment_quantity}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'reason_name',
      headerName: 'Reason',
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
          {params.row.reason_name}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'comments',
      headerName: 'Comments',
      renderCell: params => (
        <Tooltip sx={{ cursor: 'pointer' }} title={params.row?.comments}>
          <Typography
            sx={{
              minWidth: 30,
              maxWidth: 80,
              cursor: 'pointer',
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              WebkitLineClamp: 6,
              whiteSpace: 'nowrap'
            }}
            onClick={() => {
              if (params.row?.comments) {
                setExpandedText(params.row.comments)
                openNotesDialog()
              }
            }}
          >
            {params.row?.comments || 'NA'}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 0.25,
      minWidth: 20,
      field: 'expiry_date',
      headerName: 'Expiry  Date',
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
          {params.row.expiry_date ? Utility.formatDisplayDate(params.row.expiry_date) : 'NA'}
        </Typography>
      )
    },

    {
      flex: 0.3,
      Width: 40,
      field: 'created_by_user_name',
      headerName: 'Requested by ',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {Utility.renderUserAvatar(params.row.user_profile_pic)}
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant='subtitle2' sx={{ color: 'text.primary' }}>
              {params?.row?.created_by_user_name ? params?.row?.created_by_user_name : 'NA'}
            </Typography>
            <Typography variant='caption' sx={{ lineHeight: 1.6667 }}>
              {params.row.adjusted_at ? Utility.formatDisplayDate(params.row.adjusted_at) : 'NA'}
            </Typography>
          </Box>
        </Box>
      )
    }

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'created_by_user_name',
    //   headerName: 'Adjusted By',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {params?.row?.created_by_user_name ? params?.row?.created_by_user_name : 'NA'}
    //     </Typography>
    //   )
    // },

    //   {
    //     flex: 0.2,
    //     minWidth: 20,
    //     field: 'adjusted_at',
    //     headerName: 'Date of Adjustment',
    //     renderCell: params => (
    //       <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //         {Utility.formatDisplayDate(params.row.adjusted_at)}
    //       </Typography>
    //     )
    //   }
  ]

  const headerAction = (
    <Grid sx={{ display: 'flex', gap: 2 }}>
      <AddButtonContained
        title='Add Stock Adjustment'
        action={() => router.push({ pathname: '/pharmacy/stocks-adjustments/add-stock-adjustment/' })}
      />
    </Grid>
  )

  const TabBadge = ({ label, totalCount }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between' }}>
      {label}
      {totalCount ? (
        <Chip sx={{ ml: '6px', fontSize: '12px' }} size='small' label={totalCount} color='secondary' />
      ) : null}
    </div>
  )

  const title = (
    <>
      <Typography sx={{ fontSize: '24px', fontFamily: 'Inter', fontWeight: 500, ml: 1 }}>
        Stock Adjustment List
      </Typography>
    </>
  )

  const tableData = () => {
    return (
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
                value={searchValue}
                placeholder='Search...'
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
            mx: 4
          }}
        >
          <CommonTable
            onRowClick={''}
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
        /> */}
      </Card>
    )
  }

  return (
    <Grid>
      {selectedPharmacy.permission.key === 'allow_full_access' ||
      selectedPharmacy.permission.stock_adjustment === 1 ||
      selectedPharmacy.permission.stock_adjustment === '1' ? (
        loader ? (
          <FallbackSpinner />
        ) : (
          <>
            <TabContext value={status}>
              <TabList onChange={handleChange}>
                <Tab
                  sx={{ ml: 3 }}
                  value='Missing stock'
                  label={<TabBadge label='Missing' totalCount={status === 'Missing stock' ? total : null} />}
                />

                <Tab
                  value='Expiry'
                  label={<TabBadge label='Expiry' totalCount={status === 'Expiry' ? total : null} />}
                />

                <Tab
                  value='Broken at pharmacy'
                  label={<TabBadge label='Broken' totalCount={status === 'Broken at pharmacy' ? total : null} />}
                />
              </TabList>
              <TabPanel value='Missing stock'>{tableData()}</TabPanel>
              <TabPanel value='Expiry'>{tableData()}</TabPanel>

              <TabPanel value='Broken at pharmacy'>{tableData()}</TabPanel>
            </TabContext>
            <ConfirmDialogBox
              open={notesDialog}
              closeDialog={() => {
                closeNotesDialog()
              }}
              action={() => {
                closeNotesDialog()
              }}
              content={
                <Box>
                  <>
                    <DialogContent>
                      <DialogContentText sx={{ mb: 1 }}>{expandedText ? expandedText : null}</DialogContentText>
                    </DialogContent>
                  </>
                </Box>
              }
            />
          </>
        )
      ) : (
        <Error404 />
      )}
    </Grid>
  )
}

export default ListOfStockAdjusted
