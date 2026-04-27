'use client';
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
import useSafeRouter from 'src/hooks/useSafeRouter';
import { useParams, useSearchParams } from 'next/navigation';
import { getFeedTypeList } from 'src/lib/api/diet/feedType'
import CustomChip from 'src/@core/components/mui/chip'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { TabContext, TabList, TabPanel } from '@mui/lab'
import toast from 'react-hot-toast'
import Tooltip from '@mui/material/Tooltip'
import { useTheme } from '@mui/material/styles'
import Error404 from 'src/pages/404'
import { useTranslation } from 'react-i18next'
import { AuthContext } from 'src/context/AuthContext'
import Toaster from 'src/components/Toaster'
import MUISearch from 'src/views/forms/form-fields/MUISearch'

const FeedTypes = () => {
  const router = useSafeRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const routerQuery = { ...params, ...(searchParams ? Object.fromEntries(searchParams.entries()) : {}) };
  const { t } = useTranslation()
  const theme = useTheme()
  const { query } = router
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [sortColumning, setsortColumning] = useState('feed_type_name')

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(query.page || 0, 10),
    pageSize: parseInt(query.pageSize || 50, 10)
  })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(query.status || '')
  const [searchValue, setSearchValue] = useState(query.q || '')

  const authData = useContext(AuthContext)

  const dietModule = authData?.userData?.roles?.settings?.diet_module
  const dietModuleAccess = authData?.userData?.roles?.settings?.diet_module_access

  function loadServerRows(currentPage, data) {
    return data
  }

  // Common function to update URL query parameters
  const updateQueryParams = useCallback(
    newParams => {
      router.replace(
        {
          pathname: router.pathname,
          query: {
            ...routerQuery,
            ...newParams
          }
        },
        undefined,
        { shallow: true }
      )
    },
    [router]
  )

  useEffect(() => {
    const page = parseInt(query.page || 0, 10)
    const pageSize = parseInt(query.pageSize || 50, 10)
    const status = query.status || ''

    setPaginationModel({ page: page, pageSize: pageSize })
    setStatus(status)
  }, [query.page, query.pageSize, query.status])

  const handleChange = (event, newValue) => {
    setStatus(newValue)
    setTotal(0)
    setPaginationModel({ page: 0, pageSize: 50 })
    updateQueryParams({ page: 0, status: newValue, pageSize: 50 })
  }

  const fetchTableData = useCallback(
    async (sort, q, sortColumn, status, pageSize = paginationModel.pageSize) => {
      try {
        setLoading(true)

        const params = {
          sort,
          q,
          sortColumn,
          page: paginationModel.page + 1,
          limit: pageSize,
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
  }, [status, paginationModel.page, paginationModel.pageSize])

  const columns = [
    {
      //flex: 0.1,
      width: 80,
      field: 'id',
      headerName: 'SL',
      sortable: false,
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', pl: 3 }}>
          {params.row.uid}
        </Typography>
      )
    },
    {
      //flex: 0.5,
      width: 250,
      field: 'feed_type_name',
      headerName: t('diet_module.feeds'),
      sortable: false,
      renderCell: params => (
        <>
          <Avatar
            variant='square'
            alt='Feed Image'
            sx={{
              width: 40,
              height: 40,
              mr: 4,
              background: theme.palette.customColors.tableHeaderBg,
              padding: '8px',
              borderRadius: '4px'
            }}
            src={params?.row?.image ? params?.row?.image : '/icons/feedtypes_dark.svg'}
          ></Avatar>
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
      flex: 0.5,
      minWidth: 10,
      field: 'desc',
      headerName: t('description'),
      sortable: false,
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
      headerName: t('status'),
      sortable: false,
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
    // router.push(`/diet/feed/${id}?id=${params?.id}`)
    router.push({ pathname: `/diet/feed/${params?.id}` })
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
    debounce(async (sort, q, sortColumn, status, pageSize) => {
      setSearchValue(q)
      try {
        await fetchTableData(sort, q, sortColumn, status, pageSize)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSearch = value => {
    setPaginationModel({ page: 0, pageSize: paginationModel.pageSize })

    setSearchValue(value)
    updateQueryParams({ q: value, page: 0, pageSize: paginationModel.pageSize })
    searchTableData(sort, value, sortColumning, status, paginationModel.pageSize)
  }

  const headerAction = (
    <>
      {dietModule && (dietModuleAccess === 'ADD' || dietModuleAccess === 'EDIT' || dietModuleAccess === 'DELETE') && (
        <Box sx={{ display: 'flex', height: '32px', justifyContent: 'space-between' }}>
          <Button size='small' variant='contained' onClick={() => router.push('/diet/feed/add-feed')}>
            <Icon icon='mdi:add' fontSize={20} />
            &nbsp; {t('add_new')}
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
        <CardHeader title={t('navigation.feed_types')} action={headerAction} sx={{ px: 5 }} />
        <Box sx={{ px: 5, pb: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Box sx={{ width: 250 }}>
            <MUISearch
              value={searchValue}
              onChange={e => handleSearch(e.target.value)}
              onClear={() => handleSearch('')}
              placeholder='Search...'
            />
          </Box>
        </Box>
        <Box sx={{ width: '100%', overflowX: 'auto' }}>
          <CommonTable
            indexedRows={indexedRows === undefined ? [] : indexedRows}
            total={total}
            columns={columns}
            paginationModel={paginationModel}
            handleSortModel={handleSortModel}
            setPaginationModel={newPaginationModel => {
              updateQueryParams({
                page: newPaginationModel.page,
                pageSize: newPaginationModel.pageSize
              })
              setPaginationModel(newPaginationModel)
            }}
            loading={loading}
            columnVisibilityModel={{
              sl_no: false
            }}
            onCellClick={onCellClick}
            externalTableStyle={{
              height: 700,
              '.MuiDataGrid-virtualScroller': {
                overflowX: 'auto'
              },
              '.MuiDataGrid-main': {
                marginLeft: '20px',
                marginRight: '20px'
              }
            }}
          />
        </Box>
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
