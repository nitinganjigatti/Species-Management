import React, { useState, useEffect, useCallback } from 'react'

import FallbackSpinner from 'src/@core/components/spinner/index'
import { DataGrid } from '@mui/x-data-grid'
import { debounce } from 'lodash'
import CustomAvatar from 'src/@core/components/mui/avatar'

// ** MUI Imports
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'
import { Card, CardHeader, Typography, Grid, Tooltip } from '@mui/material'

// ** Icon Imports
import { Box } from '@mui/material'

import Router from 'next/router'
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
import Chip from '@mui/material/Chip'

const ListOfStockAdjusted = () => {
  /***** Server side pagination */

  const [loader, setLoader] = useState(false)

  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('label')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('Missing stock')
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchTableData, selectedPharmacy.id, status])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl: getSlNo(index)
  }))

  const handleSortModel = newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
      fetchTableData(newModel[0].sort, searchValue, newModel[0].field)
    } else {
    }
  }

  const searchTableData = useCallback(
    debounce(async (sort, q, column, status) => {
      setSearchValue(q)
      try {
        await fetchTableData(sort, q, column, status)
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
      flex: 0.05,
      Width: 40,
      field: 'sl',
      headerName: 'SL ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.sl}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 40,
      field: 'stock_name',
      headerName: 'Product Name',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.stock_name}
        </Typography>
      )
    },
    {
      flex: 0.2,
      Width: 40,
      field: 'batch_no',
      headerName: 'Batch number ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.batch_no}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      align: 'right',
      field: 'adjustment_quantity',
      headerName: 'Adjustment quantity',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
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
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
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
      flex: 0.2,
      minWidth: 20,
      field: 'expiry_date',
      headerName: 'Expiry  Date',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
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
      <AddButton
        title='Add Stock Adjustment'
        action={() => Router.push({ pathname: '/pharmacy/stocks-adjustments/add-stock-adjustment/' })}
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

  const tableData = () => {
    return (
      <Card>
        <CardHeader title='Stock Adjustment List' action={headerAction} />
        <DataGrid
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
        />
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
