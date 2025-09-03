import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react'
import Router from 'next/router'

import {
  Avatar,
  Button,
  Tooltip,
  Box,
  Breadcrumbs,
  TextField,
  FormControl,
  Autocomplete,
  Card,
  CardHeader,
  Typography
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { useTheme } from '@mui/material/styles'
import { debounce } from 'lodash'

import { AuthContext } from 'src/context/AuthContext'
import Utility from 'src/utility'
import FallbackSpinner from 'src/@core/components/spinner/index'
import CustomChip from 'src/@core/components/mui/chip'
import Icon from 'src/@core/components/icon'
import ErrorScreen from 'src/pages/Error'
import AddIncubators from '../../../views/pages/egg/incubator/addIncubators'

import { getAvailibilityList, getIncubatorList } from 'src/lib/api/egg/incubator'

const IncubatorsList = () => {
  const theme = useTheme()
  const { userData } = useContext(AuthContext)
  const nurseryPermission = userData?.permission?.user_settings?.add_nursery_permisson
  const collectionPermission = userData?.roles?.settings?.enable_egg_collection_module

  const [loader, setLoader] = useState(false)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })
  const [loading, setLoading] = useState(false)
  const [dialog, setDialog] = useState(false)

  const [defaultSite, setDefaultSite] = useState(null)
  const [defaultRoom, setDefaultRoom] = useState(null)
  const [availibilityList, setAvailibilityList] = useState([])
  const [defaultStatus, setDefaultStatus] = useState(null)
  const [defaultAvailibility, setDefaultAvailibility] = useState(null)

  const fetchAvailabilityList = async () => {
    try {
      const res = await getAvailibilityList()
      setAvailibilityList(res?.data?.data || [])
    } catch (error) {
      console.error('Failed to fetch availability list', error)
    }
  }

  const fetchTableData = useCallback(
    async (q = '', siteId, roomId, availability, status) => {
      setLoading(true)
      try {
        const params = {
          q,
          sort,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          type: status || 'all',
          room_id: roomId,
          nursery_id: '',
          availability,
          site_id: siteId
        }

        const res = await getIncubatorList({ params })
        const rawData = res?.data?.data?.result || []
        const listWithId = rawData.map((el, i) => ({
          ...el,
          id: i + 1
        }))

        setTotal(parseInt(res?.data?.data?.total_count || 0))
        setRows(listWithId)
      } catch (error) {
        console.error('Error fetching table data:', error)
      } finally {
        setLoading(false)
      }
    },
    [paginationModel, sort]
  )

  const debouncedSearch = useCallback(
    debounce((q, siteId, roomId, availability, status) => {
      setSearchValue(q)
      fetchTableData(q, siteId, roomId, availability, status)
    }, 1000),
    [fetchTableData]
  )

  const handleSearch = (value, siteId, roomId, availability, status) => {
    setSearchValue(value)
    debouncedSearch(value, siteId, roomId, availability, status)
  }

  const handleSidebarClose = () => setDialog(false)

  const headerAction = nurseryPermission && (
    <Button sx={{ height: '40px', width: '126px' }} size='small' variant='contained' onClick={() => setDialog(true)}>
      <Icon icon='mdi:add' fontSize={20} />
      &nbsp; Add New
    </Button>
  )

  const getSlNo = index => paginationModel.page * paginationModel.pageSize + index + 1
  const indexedRows = useMemo(() => rows.map((row, i) => ({ ...row, sl_no: getSlNo(i) })), [rows, paginationModel])

  useEffect(() => {
    fetchAvailabilityList()
  }, [])

  useEffect(() => {
    if (nurseryPermission || collectionPermission) {
      fetchTableData(
        searchValue,
        defaultSite?.site_id,
        defaultRoom?.room_id,
        defaultAvailibility?.key,
        defaultStatus?.key
      )
    }
  }, [paginationModel])

  const columns = [
    {
      width: 70,
      field: 'id',
      headerName: 'SL.NO',
      align: 'center',
      sortable: false,
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontWeight: '400',
            lineHeight: '14.52px',
            fontSize: '12px'
          }}
        >
          {params.row.sl_no}
        </Typography>
      )
    },
    {
      // flex: 0.27,
      minWidth: 140,
      sortable: false,
      field: 'incubator_code',
      headerName: 'INCUBATOR ID',
      renderCell: params => (
        <Typography
          noWrap
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px'
          }}
        >
          {params.row.incubator_code ? params.row.incubator_code : '-'}
        </Typography>
      )
    },
    {
      // flex: 0.35,
      minWidth: 140,
      sortable: false,
      field: 'incubator_name',
      headerName: 'INCUBATOR NAME',
      renderCell: params => (
        <Tooltip title={params.row.incubator_name ? params.row.incubator_name : '-'}>
          <Typography
            noWrap
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '400',
              lineHeight: '19.36px',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {params.row.incubator_name ? params.row.incubator_name : '-'}
          </Typography>
        </Tooltip>
      )
    },
    {
      // flex: 0.3,
      minWidth: 120,
      sortable: false,
      field: 'availability',
      headerName: 'AVAILABILITY',
      renderCell: params => (
        <Tooltip title={params.row.availability ? params.row.availability : '-'}>
          <Typography
            sx={{
              color: theme.palette.primary.dark,
              fontSize: '14px',
              fontWeight: '500',
              lineHeight: '16.94px',
              textOverflow: 'ellipsis',
              overflow: 'hidden'
            }}
          >
            {params.row.availability ? params.row.availability : '-'}
          </Typography>
        </Tooltip>
      )
    },
    {
      // flex: 0.3,
      minWidth: 140,
      sortable: false,
      field: 'site_name',
      headerName: 'SITE',
      renderCell: params => (
        <Tooltip title={params.row.site_name ? params.row.site_name : '-'}>
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '400',
              lineHeight: '19.36px',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {params.row.site_name ? params.row.site_name : '-'}
          </Typography>
        </Tooltip>
      )
    },
    {
      // flex: 0.3,
      minWidth: 140,
      sortable: false,
      field: 'room_name',
      headerName: 'ROOM',
      renderCell: params => (
        <Tooltip title={params.row.room_name ? params.row.room_name : '-'}>
          <Typography
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '400',
              lineHeight: '19.36px'
            }}
          >
            {params.row.room_name ? params.row.room_name : '-'}
          </Typography>
        </Tooltip>
      )
    },
    {
      // flex: 0.12,
      width: 60,
      sortable: false,
      align: 'right',
      field: 'no_of_eggs',
      headerName: 'EGGS',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px'
          }}
        >
          {params.row.no_of_eggs ? params.row.no_of_eggs : '-'}
        </Typography>
      )
    },
    {
      // flex: 0.2,
      minWidth: 140,
      sortable: false,
      // align: 'center',
      field: 'active',
      headerName: 'Status',
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
    },
    {
      // flex: 0.5,
      minWidth: 220,
      sortable: false,
      field: 'added_by',
      headerName: 'ADDED BY',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar
            variant='square'
            alt='Medicine Image'
            sx={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: theme.palette.customColors.displaybgPrimary,
              overflow: 'hidden'
            }}
          >
            {params.row.user_profile_pic ? (
              <img
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                src={params.row.user_profile_pic}
                alt='Profile'
              />
            ) : (
              <Icon icon='mdi:user' />
            )}
          </Avatar>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography
              noWrap
              sx={{
                color: theme.palette.customColors.OnSurfaceVariant,
                fontSize: '14px',
                fontWeight: '500',
                lineHeight: '16.94px'
              }}
            >
              {params.row.user_full_name ? params.row.user_full_name : '-'}
            </Typography>
            <Typography
              noWrap
              sx={{
                color: theme.palette.customColors.neutralSecondary,
                fontSize: '12px',
                fontWeight: '400',
                lineHeight: '14.52px'
              }}
            >
              {params.row?.created_at
                ? 'Created on' + ' ' + Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row?.created_at))
                : '-'}
            </Typography>
          </Box>
        </Box>
      )
    }
  ]

  const handleCellClick = ({ row }) => Router.push(`/egg/incubators/${row.incubator_id}`)

  if (!nurseryPermission && !collectionPermission) return <ErrorScreen />
  if (loader) return <FallbackSpinner />
  return (
    <>
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
        <Typography color='inherit'>Egg</Typography>
        <Typography
          sx={{
            color: 'text.primary',
            cursor: 'pointer'
          }}
        >
          Incubator List
        </Typography>
      </Breadcrumbs>
      <Card>
        <CardHeader title='Incubator List' action={headerAction} />
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, px: 4, mb: 6 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
              borderRadius: '4px',
              padding: '0 8px',
              height: '40px'
            }}
          >
            <Icon icon='mi:search' fontSize={24} color={theme.palette.customColors.OnSurfaceVariant} />
            <TextField
              variant='outlined'
              placeholder='Search'
              onChange={e =>
                handleSearch(
                  e.target.value,
                  defaultSite?.site_id,
                  defaultRoom?.room_id,
                  defaultAvailibility?.key,
                  defaultStatus?.key
                )
              }
              sx={{
                '& .MuiOutlinedInput-root': {
                  border: 'none',
                  padding: '0',
                  '& fieldset': {
                    border: 'none'
                  }
                }
              }}
              slotProps={{
                input: {}
              }}
            />
          </Box>
          <FormControl>
            <Autocomplete
              name='status'
              value={defaultStatus}
              disablePortal
              id='status'
              sx={{ width: 220 }}
              options={[
                { label: 'All', key: 'all' },
                { label: 'Active', key: 'only_active' },
                { label: 'Inactive', key: 'only_deactive' }
              ]}
              getOptionLabel={option => option.label}
              isOptionEqualToValue={(option, value) => option?.key === value?.key}
              onChange={(e, val) => {
                if (val === null) {
                  setDefaultStatus(null)
                  fetchTableData(searchValue, defaultSite?.site_id, defaultRoom?.room_id, defaultAvailibility?.key, '')
                } else {
                  setDefaultStatus(val)
                  fetchTableData(
                    searchValue,
                    defaultSite?.site_id,
                    defaultRoom?.room_id,
                    defaultAvailibility?.key,
                    val?.key
                  )
                }
              }}
              renderInput={params => (
                <TextField
                  sx={{
                    backgroundColor: theme.palette.primary.contrastText,
                    borderColor: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                    width: '100%',
                    '& .MuiOutlinedInput-root': { height: 40, borderRadius: '4px' },
                    '& .MuiInputLabel-root': { top: -7 },
                    '& .MuiInputLabel-shrink': { top: 0 },
                    '& input': { position: 'relative', top: -0 }
                  }}
                  onChange={e => {}}
                  {...params}
                  label='Status'
                  placeholder='Search & Select'
                />
              )}
            />
          </FormControl>
        </Box>
        <DataGrid
          sx={{
            '.MuiDataGrid-cell:focus': { outline: 'none' },
            '.MuiDataGrid-main': {
              border: '1px solid rgba(233, 233, 236, 1)',
              borderLeft: '1px solid #0000000D',
              borderRight: '1px solid #0000000D',
              marginLeft: '16px',
              marginRight: '16px',
              borderRadius: '8px'
            },
            '& .MuiDataGrid-footerContainer': { borderTop: 'none' },
            '& .MuiDataGrid-row:hover': { cursor: 'pointer' }
          }}
          columnVisibilityModel={{ sl_no: false }}
          hideFooterSelectedRowCount
          disableColumnSelector={true}
          autoHeight
          pagination
          rows={indexedRows === undefined ? [] : indexedRows}
          rowCount={total}
          rowHeight={64}
          columns={columns}
          sortingMode='server'
          paginationMode='server'
          pageSizeOptions={[7, 10, 25, 50]}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          loading={loading}
          onCellClick={handleCellClick}
        />
        <AddIncubators actionApi={fetchTableData} sidebarOpen={dialog} handleSidebarClose={handleSidebarClose} />
      </Card>
    </>
  )
}

export default IncubatorsList
