import React, { useState, useEffect, useCallback, useContext } from 'react'
import Router from 'next/router'

import { Avatar, Button, Tooltip, Box, Breadcrumbs, Grid, TextField, FormControl, Autocomplete } from '@mui/material'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
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
  const authData = useContext(AuthContext)
  const egg_nursery_permission = authData?.userData?.permission?.user_settings?.add_nursery_permisson
  const egg_collection_permission = authData?.userData?.roles?.settings?.enable_egg_collection_module

  const [loader, setLoader] = useState(false)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [dialog, setDialog] = useState(false)

  const [defaultSite, setDefaultSite] = useState(null)
  const [defaultRoom, setDefaultRoom] = useState(null)
  const [availibilityList, setAvailibilityList] = useState([])
  const [defaultStatus, setDefaultStatus] = useState(null)
  const [defaultAvailibility, setDefaultAvailibility] = useState(null)

  // Utility: Load rows from server
  const loadServerRows = (currentPage, data) => data

  // Utility: Generate serial number for each row
  // const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1
  const getSlNo = index => paginationModel.page * paginationModel.pageSize + index + 1

  // 🟩 Transform rows to include sl_no
  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  // 📦 API: Fetch availability list
  const fetchAvailabilityList = async () => {
    try {
      const res = await getAvailibilityList()
      setAvailibilityList(res?.data?.data || [])
    } catch (error) {
      console.error('Failed to fetch availability list', error)
    }
  }

  // 📦 API: Fetch incubator list for table
  const fetchTableData = useCallback(
    async (q, siteId, roomId, availability, status) => {
      setLoading(true)
      try {
        const params = {
          q: q || searchValue,
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
        setRows(loadServerRows(paginationModel.page, listWithId))
      } catch (error) {
        console.error('Error fetching table data:', error)
      } finally {
        setLoading(false)
      }
    },
    [paginationModel, sort, searchValue]
  )

  // 🧠 Debounced Search Function
  const debouncedSearch = useCallback(
    debounce((q, siteId, roomId, availability, status) => {
      setSearchValue(q)
      fetchTableData(q, siteId, roomId, availability, status)
    }, 1000),
    [fetchTableData]
  )

  // 🔍 Search Input Handler
  const handleSearch = (value, siteId, roomId, availability, status) => {
    setSearchValue(value)
    debouncedSearch(value, siteId, roomId, availability, status)
  }

  // ❌ Close sidebar dialog
  const handleSidebarClose = () => {
    setDialog(false)
  }

  // ➕ Add Button
  const headerAction = egg_nursery_permission && (
    <Button sx={{ height: '40px', width: '126px' }} size='small' variant='contained' onClick={() => setDialog(true)}>
      <Icon icon='mdi:add' fontSize={20} />
      &nbsp; Add New
    </Button>
  )

  // 🔁 Fetch on mount (availability + initial table data)
  useEffect(() => {
    fetchAvailabilityList()
  }, [])

  // }, [fetchTableData])  // use this line if there happen any issue while fetching table data
  useEffect(() => {
    if (egg_nursery_permission || egg_collection_permission) {
      fetchTableData(
        searchValue,
        defaultSite?.site_id,
        defaultRoom?.room_id,
        defaultAvailibility?.key,
        defaultStatus?.key
      )
    }
  }, [paginationModel])

  // }, [fetchTableData])  // use this line if there happen any issue while fetching table data

  const columns = [
    {
      minWidth: 80,
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
      flex: 0.27,
      minWidth: 30,
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
      flex: 0.35,
      minWidth: 30,
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
      flex: 0.3,
      minWidth: 10,
      sortable: false,
      field: 'availability',
      headerName: 'AVAILABILITY',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.primary.dark,
            fontSize: '14px',
            fontWeight: '500',
            lineHeight: '16.94px'
          }}
        >
          {params.row.availability ? params.row.availability : '-'}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 20,
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
      flex: 0.3,
      minWidth: 20,
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
      flex: 0.12,
      minWidth: 20,
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
      flex: 0.2,
      minWidth: 20,
      sortable: false,
      align: 'center',
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
      flex: 0.5,
      minWidth: 60,
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

  const onCellClick = params => {
    Router.push({
      pathname: `/egg/incubators/${params.row?.incubator_id}`
    })
  }

  return (
    <>
      {egg_nursery_permission || egg_collection_permission ? (
        loader ? (
          <FallbackSpinner />
        ) : (
          <>
            <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
              <Typography color='inherit'>Egg</Typography>
              <Typography sx={{ cursor: 'pointer' }} color='text.primary'>
                Incubator List
              </Typography>
            </Breadcrumbs>
            <Card>
              <CardHeader title='Incubator List' action={headerAction} />

              <Grid sx={{ ml: 4, mb: 6, mt: -2 }} container columns={15} spacing={6}>
                <Grid item xs={3}>
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
                      placeholder='Search...'
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
                        input: {
                          // disableUnderline: true
                        }
                      }}
                    />
                  </Box>
                </Grid>

                <Grid item size={{ xs: 3 }}>
                  <FormControl fullWidth>
                    <Autocomplete
                      name='status'
                      value={defaultStatus}
                      disablePortal
                      id='status'
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
                          fetchTableData(
                            searchValue,
                            defaultSite?.site_id,
                            defaultRoom?.room_id,
                            defaultAvailibility?.key,
                            ''
                          )
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
                            '& .MuiOutlinedInput-root': {
                              height: 40,
                              borderRadius: '4px'
                            },

                            '& .MuiInputLabel-root': {
                              top: -7
                            },
                            '& .MuiInputLabel-shrink': {
                              top: 0
                            },
                            '& input': {
                              position: 'relative',
                              top: -0
                            }
                          }}
                          onChange={e => {
                            searchNursery(e.target.value)
                          }}
                          {...params}
                          label='Status'
                          placeholder='Search & Select'
                        />
                      )}
                    />
                  </FormControl>
                </Grid>
              </Grid>
              <DataGrid
                sx={{
                  '.MuiDataGrid-cell:focus': {
                    outline: 'none'
                  },
                  '.MuiDataGrid-main': {
                    borderLeft: '1px solid #0000000D',
                    borderRight: '1px solid #0000000D',
                    marginLeft: '16px',
                    marginRight: '16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(233, 233, 236, 1)'
                  },
                  '& .MuiDataGrid-footerContainer': {
                    borderTop: 'none'
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
                rowHeight={64}
                columns={columns}
                sortingMode='server'
                paginationMode='server'
                pageSizeOptions={[7, 10, 25, 50]}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                loading={loading}
                onCellClick={onCellClick}
              />
              <AddIncubators actionApi={fetchTableData} sidebarOpen={dialog} handleSidebarClose={handleSidebarClose} />
            </Card>
          </>
        )
      ) : (
        <>
          {' '}
          <ErrorScreen></ErrorScreen>
        </>
      )}
    </>
  )
}

export default IncubatorsList
