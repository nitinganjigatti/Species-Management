import React, { useCallback, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import {
  Autocomplete,
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardHeader,
  FormControl,
  Grid,
  TextField,
  Typography,
  debounce
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { useTheme } from '@mui/material/styles'

import Utility from 'src/utility'
import { AuthContext } from 'src/context/AuthContext'
import Icon from 'src/@core/components/icon'
import CustomChip from 'src/@core/components/mui/chip'

import NurseryAddComponent from 'src/components/egg/NurseryAddComponent'
import ErrorScreen from 'src/pages/Error'
import { GetNurseryList } from 'src/lib/api/egg/nursery'

const NurseryList = () => {
  const theme = useTheme()
  const router = useRouter()
  const authData = useContext(AuthContext)

  const egg_nursery_permission = authData?.userData?.permission?.user_settings?.add_nursery_permisson
  const egg_collection_permission = authData?.userData?.roles?.settings?.enable_egg_collection_module

  const [openDrawer, setOpenDrawer] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [sort, setSort] = useState('desc')
  const [sortColumn, setSortColumn] = useState('nursery_name')
  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [defaultSite, setDefaultSite] = useState(null)

  function loadServerRows(currentPage, data) {
    return data
  }

  // const fetchTableData = useCallback(
  //   async (q, siteId) => {
  //     try {
  //       setLoading(true)

  //       const params = {
  //         sort,
  //         search: q || '',
  //         site_id: siteId,
  //         type: 'all',
  //         page: paginationModel.page + 1,
  //         limit: paginationModel.pageSize
  //       }

  //       await GetNurseryList({ params: params }).then(res => {
  //         setTotal(parseInt(res?.data?.total_count))
  //         setRows(loadServerRows(paginationModel.page, res?.data?.result))
  //       })
  //       setLoading(false)
  //     } catch (e) {
  //       setLoading(false)
  //     }
  //   },
  //   [paginationModel]
  // )

  const fetchTableData = useCallback(
    async (q = '', siteId) => {
      setLoading(true)

      const params = {
        sort,
        search: q || '',
        site_id: siteId,
        type: 'all',
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize
      }

      try {
        const res = await GetNurseryList({ params })
        const { total_count, result } = res?.data || {}

        setTotal(parseInt(total_count || 0))
        setRows(loadServerRows(paginationModel.page, result || []))
      } catch (error) {
        console.error('Failed to fetch data:', error) // Optional for debugging
      } finally {
        setLoading(false)
      }
    },
    [paginationModel, sort]
  )

  // useEffect(() => {
  //   if (egg_nursery_permission || egg_collection_permission) {
  //     fetchTableData(searchValue, defaultSite?.site_id)
  //   }
  // }, [fetchTableData])

  useEffect(() => {
    if (egg_nursery_permission || egg_collection_permission) {
      fetchTableData(searchValue, defaultSite?.site_id)
    }
  }, [fetchTableData, egg_nursery_permission, egg_collection_permission, defaultSite?.site_id, searchValue])

  const handleSortModel = newModel => {
    if (newModel.length) {
      const { sort: newSort, field: newField } = newModel[0]
      setSort(newSort)
      setSortColumn(newField)
      fetchTableData(searchValue, defaultSite?.site_id)
    }
  }

  // const searchTableData = useCallback(
  //   debounce(async (q, siteId) => {
  //     setSearchValue(q)
  //     try {
  //       await fetchTableData(q, siteId)
  //     } catch (error) {
  //       console.error(error)
  //     }
  //   }, 1000),
  //   []
  // )

  const searchTableData = useCallback(
    debounce(async (q, siteId) => {
      setSearchValue(q)
      await fetchTableData(q, siteId)
    }, 1000),
    [fetchTableData]
  )

  const handleSearch = (value, siteId) => {
    setSearchValue(value)
    searchTableData(value, siteId)
  }

  const addEventSidebarOpen = () => setOpenDrawer(true)
  const columns = [
    {
      minWidth: 80,
      field: 'id',
      headerName: 'SL.NO',
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '12px',
            fontWeight: '400',
            lineHeight: '14.52px'
          }}
        >
          {params.row.sl_no}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 30,
      sortable: false,
      field: 'Nursery Name',
      headerName: 'Nursery Name',
      align: 'left',

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
          {params.row.nursery_name}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      sortable: false,
      field: 'ROOMS',
      headerName: 'ROOMS',
      align: 'left',
      headerAlign: 'left',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px'
          }}
        >
          {params.row.no_of_rooms}
        </Typography>
      )
    },
    {
      flex: 0.24,
      minWidth: 20,
      sortable: false,
      field: 'INCUBATORS',
      align: 'left',
      headerAlign: 'left',
      headerName: 'INCUBATORS',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.primary.dark,
            fontSize: '14px',
            fontWeight: '500',
            lineHeight: '14.52px'
          }}
        >
          {params.row.no_of_incubators}
        </Typography>
      )
    },
    {
      flex: 0.23,
      minWidth: 20,
      sortable: false,
      field: 'SITE NAME',
      align: 'left',
      headerAlign: 'left',
      headerName: 'SITE NAME',

      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px'
          }}
        >
          {params.row.site_name}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      sortable: false,
      align: 'left',
      field: 'active',
      // headerAlign: 'left',
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
      align: 'left',
      headerAlign: 'left',
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

  const handleCellClick = params => {
    router.push(`/egg/nursery/${params.row.id}`)
  }

  const headerAction = (
    <>
      {egg_nursery_permission && (
        <div>
          <Button size='medium' variant='contained' onClick={() => addEventSidebarOpen()}>
            <Icon icon='mdi:add' fontSize={20} />
            &nbsp; Add New
          </Button>
        </div>
      )}
    </>
  )

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: row.nursery_id,
    sl_no: getSlNo(index)
  }))

  return (
    <>
      {egg_nursery_permission || egg_collection_permission ? (
        <>
          <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
            <Typography sx={{ cursor: 'pointer' }} color='inherit'>
              Egg
            </Typography>

            <Typography sx={{ cursor: 'pointer' }} color='text.primary'>
              Nursery List
            </Typography>
          </Breadcrumbs>
          <Card>
            <CardHeader title='Nursery' action={headerAction} />

            <Box sx={{ display: 'flex', px: 4, gap: 4, flexWrap: 'wrap', mb: 6 }}>
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
                <Icon icon='mi:search' color={theme.palette.customColors.OnSurfaceVariant} />
                <TextField
                  variant='outlined'
                  placeholder='Search...'
                  onChange={e => handleSearch(e.target.value, defaultSite?.site_id)}
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

              <FormControl>
                <Autocomplete
                  name='site'
                  value={defaultSite}
                  disablePortal
                  id='site'
                  sx={{ width: 220 }}
                  options={authData?.userData?.user?.zoos[0].sites}
                  getOptionLabel={option => option.site_name}
                  isOptionEqualToValue={(option, value) => option?.site_id === value?.site_id}
                  onChange={(e, val) => {
                    if (val === null) {
                      setDefaultSite(null)
                      fetchTableData(searchValue, '')
                    } else {
                      setDefaultSite(val)
                      fetchTableData(searchValue, val?.site_id)
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
                        '& input': {
                          position: 'relative',
                          top: -7
                        }
                      }}
                      onChange={e => {
                        // searchNursery(e.target.value)
                      }}
                      {...params}
                      label='Site'
                      placeholder='Search & Select'
                    />
                  )}
                />
              </FormControl>
            </Box>

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
              disableColumnMenu
              autoHeight
              pagination
              rows={indexedRows === undefined ? [] : indexedRows}
              rowCount={total}
              columns={columns}
              sortingMode='server'
              paginationMode='server'
              pageSizeOptions={[7, 10, 25, 50]}
              rowHeight={64}
              paginationModel={paginationModel}
              onSortModelChange={handleSortModel}
              onPaginationModelChange={setPaginationModel}
              loading={loading}
              onCellClick={handleCellClick}
            />
          </Card>
          {openDrawer && (
            <NurseryAddComponent
              openDrawer={openDrawer}
              setOpenDrawer={setOpenDrawer}
              loading={loading}
              fetchTableData={fetchTableData}
            />
          )}
        </>
      ) : (
        <>
          {' '}
          <ErrorScreen></ErrorScreen>
        </>
      )}
    </>
  )
}

export default NurseryList
