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
  Typography
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { useTheme } from '@mui/material/styles'
import { debounce } from 'lodash'

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
  const { userData } = useContext(AuthContext)

  const nurseryPermission = userData?.permission?.user_settings?.add_nursery_permisson
  const collectionPermission = userData?.roles?.settings?.enable_egg_collection_module

  const [openDrawer, setOpenDrawer] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [sort, setSort] = useState('desc')
  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })
  const [defaultSite, setDefaultSite] = useState(null)

  const fetchTableData = useCallback(
    async (q = '', siteId) => {
      setLoading(true)
      const params = {
        sort,
        search: q,
        site_id: siteId,
        type: 'all',
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize
      }

      try {
        const res = await GetNurseryList({ params })
        const { total_count, result } = res?.data || {}

        setTotal(parseInt(total_count || 0))
        setRows(result || [])
      } catch (error) {
        console.error('Failed to fetch data:', error) // Optional for debugging
      } finally {
        setLoading(false)
      }
    },
    [paginationModel, sort]
  )

  useEffect(() => {
    if (nurseryPermission || collectionPermission) {
      fetchTableData(searchValue, defaultSite?.site_id)
    }
  }, [fetchTableData, nurseryPermission, collectionPermission, defaultSite?.site_id])

  const handleSortModel = newModel => {
    if (newModel.length) {
      const { sort: newSort, field: newField } = newModel[0]
      setSort(newSort)
      fetchTableData(searchValue, defaultSite?.site_id)
    }
  }

  const searchTableData = useCallback(
    debounce((q, siteId) => {
      fetchTableData(q, siteId)
    }, 1000),
    [fetchTableData]
  )

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
      minWidth: 140,
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
      minWidth: 120,
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
      minWidth: 120,
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
      minWidth: 120,
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
      minWidth: 120,
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
      minWidth: 220,
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

  const headerAction = (
    <>
      {nurseryPermission && (
        <Button size='medium' variant='contained' onClick={() => setOpenDrawer(true)}>
          <Icon icon='mdi:add' fontSize={20} />
          &nbsp; Add New
        </Button>
      )}
    </>
  )

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1
  const indexedRows = rows?.map((row, index) => ({ ...row, id: row.nursery_id, sl_no: getSlNo(index) }))

  const handleCellClick = params => router.push(`/egg/nursery/${params.row.id}`)

  if (!nurseryPermission && !collectionPermission) return <ErrorScreen />
  return (
    <>
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
        <Typography sx={{ cursor: 'pointer' }} color='inherit'>
          Egg
        </Typography>

        <Typography
          sx={{
            color: 'text.primary',
            cursor: 'pointer'
          }}
        >
          Nursery List
        </Typography>
      </Breadcrumbs>
      <Card>
        <CardHeader title='Nursery' action={headerAction} />

        <Box sx={{ mb: 6 }}>
          <Box sx={{ px: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
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
                placeholder='Search'
                onChange={e => {
                  setSearchValue(e.target.value)
                  searchTableData(e.target.value, defaultSite?.site_id)
                }}
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
                options={userData?.user?.zoos[0].sites}
                getOptionLabel={option => option?.site_name || ''}
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
                renderOption={(props, option) => (
                  <li {...props} key={option.site_id}>
                    {option.site_name}
                  </li>
                )}
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
        </Box>

        <DataGrid
          autoHeight
          rows={indexedRows || []}
          rowCount={total}
          columns={columns}
          rowHeight={64}
          pagination
          sortingMode='server'
          paginationMode='server'
          pageSizeOptions={[7, 10, 25, 50]}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          onSortModelChange={handleSortModel}
          loading={loading}
          onCellClick={handleCellClick}
          hideFooterSelectedRowCount
          disableColumnSelector
          disableColumnMenu
          // columnVisibilityModel={{
          //   sl_no: false
          // }}
          sx={{
            '.MuiDataGrid-cell:focus': { outline: 'none' },
            '.MuiDataGrid-main': {
              borderLeft: '1px solid #0000000D',
              borderRight: '1px solid #0000000D',
              marginLeft: '16px',
              marginRight: '16px',
              borderRadius: '8px',
              border: '1px solid rgba(233, 233, 236, 1)'
            },
            '& .MuiDataGrid-footerContainer': { borderTop: 'none' },
            '& .MuiDataGrid-row:hover': { cursor: 'pointer' }
          }}
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
  )
}

export default NurseryList
