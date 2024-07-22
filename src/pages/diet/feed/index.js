import {
  Avatar,
  Button,
  Card,
  Typography,
  debounce,
  CardHeader,
  Grid,
  Tab,
  Chip,
  IconButton,
  Divider
} from '@mui/material'
import { Box } from '@mui/system'
import Icon from 'src/@core/components/icon'
import React, { useCallback, useEffect, useState, useContext } from 'react'
import Router from 'next/router'
import { getFeedTypeList } from 'src/lib/api/diet/feedType'
import { DataGrid } from '@mui/x-data-grid'
import CustomChip from 'src/@core/components/mui/chip'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import { TabContext, TabList, TabPanel } from '@mui/lab'
import toast from 'react-hot-toast'
import Tooltip from '@mui/material/Tooltip'

import Error404 from 'src/pages/404'

import { AuthContext } from 'src/context/AuthContext'
import Toaster from 'src/components/Toaster'

const FeedTypes = () => {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [sortColumning, setsortColumning] = useState('feed_type_name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [searchValue, setSearchValue] = useState('')

  const authData = useContext(AuthContext)

  const dietModule = authData?.userData?.roles?.settings?.diet_module
  const dietModuleAccess = authData?.userData?.roles?.settings?.diet_module_access

  function loadServerRows(currentPage, data) {
    return data
  }

  const handleChange = (event, newValue) => {
    setTotal(0)
    setPaginationModel({ page: 0, pageSize: 10 })
    setStatus(newValue)
  }

  const fetchTableData = useCallback(
    async (sort, q, sortColumn, status) => {
      try {
        setLoading(true)

        const params = {
          sort,
          q,
          sortColumn,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          status
        }

        await getFeedTypeList(params).then(res => {
          if (res?.success) {
            const startingIndex = paginationModel.page * paginationModel.pageSize
            let listWithId = res.data.result.map((el, i) => {
              return { ...el, uid: startingIndex + i + 1 }
            })
            setTotal(parseInt(res?.data?.total_count))
            setRows(loadServerRows(paginationModel.page, listWithId))
          } else {
            Toaster({ type: 'success', message: res?.message })
          }
        })
        setLoading(false)
      } catch (e) {
        setLoading(false)
      }
    },
    [paginationModel]
  )
  useEffect(() => {
    if (dietModule) {
      fetchTableData(sort, searchValue, sortColumning, status)
    }
  }, [fetchTableData, status])

  const columns = [
    {
      flex: 0.05,
      minWidth: 30,
      field: 'id',
      headerName: 'SL',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', pl: 3 }}>
          {params.row.uid}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 30,
      field: 'feed_type_name',
      headerName: 'FEEDS',
      renderCell: params => (
        <>
          <Avatar variant='square' src={params?.row?.image} alt={params.row.id} />
          <Tooltip title={params.row.feed_type_name} placement='right'>
            <Typography
              variant='body2'
              sx={{ ml: 2, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {' '}
              {params.row.feed_type_name}
            </Typography>
          </Tooltip>
        </>
      )
    },
    {
      flex: 0.7,
      minWidth: 10,
      field: 'desc',
      headerName: 'DESCRIPTION',
      renderCell: params => (
        <Tooltip title={params.row.desc} placement='bottom'>
          <Typography variant='body2' sx={{ color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {params.row.desc}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 0.2,
      minWidth: 10,
      field: 'active',
      headerName: 'STATUS',
      renderCell: params => (
        <CustomChip
          skin='light'
          size='small'
          label={params.row?.active === '1' ? 'Active' : 'InActive'}
          color={params.row?.active === '1' ? 'success' : 'error'}
          sx={{
            height: 20,
            fontWeight: 600,
            borderRadius: '5px',
            fontSize: '0.875rem',
            textTransform: 'capitalize',
            '& .MuiChip-label': { mt: -0.25 }
          }}
        />
      )
    }
  ]

  const onCellClick = params => {
    // Router.push({ pathname: `/diet/feed/${id}`, query: { id: params?.id } })
    Router.push({ pathname: `/diet/feed/${params?.id}` })
  }

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const handleSortModel = newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setsortColumning(newModel[0].field)
      fetchTableData(newModel[0].sort, searchValue, newModel[0].field, status)
    } else {
    }
  }

  const searchTableData = useCallback(
    debounce(async (sort, q, sortColumn, status) => {
      setSearchValue(q)
      try {
        await fetchTableData(sort, q, sortColumn, status)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, sortColumning, status)
  }

  const headerAction = (
    <>
      {dietModule && (dietModuleAccess === 'ADD' || dietModuleAccess === 'EDIT' || dietModuleAccess === 'DELETE') && (
        <Box sx={{ display: 'flex', height: '32px', justifyContent: 'space-between' }}>
          <Button sx={{ px: 7 }} size='small' variant='contained' onClick={() => Router.push('/diet/feed/add-feed')}>
            <Icon icon='mdi:add' fontSize={20} />
            &nbsp; NEW
          </Button>
        </Box>
      )}
    </>
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
        <CardHeader title='Feed Types' action={headerAction} />
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
            sl_no: false
          }}
          hideFooterSelectedRowCount
          disableColumnSelector={true}
          autoHeight
          pagination
          rows={indexedRows === undefined ? [] : indexedRows}
          rowCount={total}
          columns={columns}
          sortingMode='server'
          paginationMode='server'
          pageSizeOptions={[7, 10, 25, 50]}
          paginationModel={paginationModel}
          onSortModelChange={handleSortModel}
          slots={{ toolbar: ServerSideToolbarWithFilter }}
          onPaginationModelChange={setPaginationModel}
          loading={loading}
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
          onCellClick={onCellClick}
        />
      </Card>
    )
  }

  return (
    <>
      {dietModule ? (
        <Grid>
          <TabContext value={status}>
            <TabList onChange={handleChange}>
              <Tab value='' label={<TabBadge label='All' totalCount={status === '' ? total : null} />} />
              <Tab value='1' label={<TabBadge label='Active' totalCount={status === '1' ? total : null} />} />
              <Tab value='0' label={<TabBadge label='Inactive' totalCount={status === '0' ? total : null} />} />
            </TabList>
            <TabPanel value=''>{tableData()}</TabPanel>
            <TabPanel value='1'>{tableData()}</TabPanel>
            <TabPanel value='0'>{tableData()}</TabPanel>
          </TabContext>
        </Grid>
      ) : (
        <>
          <Error404></Error404>
        </>
      )}
    </>
  )
}

export default FeedTypes
