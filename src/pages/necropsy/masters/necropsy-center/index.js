import {
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material'
import { debounce } from 'lodash'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import AddnecropsyCenterDrawer from 'src/components/necropsy/AddnecropsyCenterDrawer'
import Icon from 'src/@core/components/icon'
import { getNecropsyCenter } from 'src/lib/api/hospital/inpatientDischarge'
import RenderUtility from 'src/utility/render'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import Search from 'src/views/utility/Search'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'

const NecropsyCenters = () => {
  const theme = useTheme()
  const router = useRouter()

  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [openAddNecropsyDrawer, setOpenAddNecropsyDrawer] = useState(false)
  const [editData, setEditData] = useState(null)

  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    q: ''
  })

  useEffect(() => {
    const { page = '1', limit = '10', q = '' } = router.query

    setFilters({
      page: parseInt(page),
      limit: parseInt(limit),
      q
    })

    setSearchValue(q)
  }, [router.query])

  const fetchNecropsyCenters = async () => {
    try {
      setLoading(true)

      const res = await getNecropsyCenter({
        page_no: filters?.page,
        limit: filters?.limit,
        q: filters?.q
      })

      if (res?.status === true) {
        setRows(res?.data?.list || [])
        setTotal(res?.data?.total_records || 0)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  console.log(rows, 'rows')

  useEffect(() => {
    fetchNecropsyCenters()
  }, [filters.page, filters.limit, filters.q])

  const updateUrlParams = updatedFilters => {
    const params = new URLSearchParams()
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value.toString())
      }
    })
    router.push({ query: params.toString() }, undefined, { shallow: true })
  }

  const handlePaginationModelChange = model => {
    const updated = {
      ...filters,
      page: model.page + 1,
      limit: model.pageSize
    }
    setFilters(updated)
    updateUrlParams(updated)
  }

  const debouncedSearch = useMemo(
    () =>
      debounce(value => {
        const updated = {
          ...filters,
          q: value,
          page: 1
        }
        setFilters(updated)
        updateUrlParams(updated)
      }, 500),
    [filters]
  )

  const handleSearch = useCallback(
    value => {
      setSearchValue(value)
      debouncedSearch(value)
    },
    [debouncedSearch]
  )

  const handleSearchClear = () => {
    setSearchValue('')
    debouncedSearch('')
  }

  const getSlNo = index => (filters.page - 1) * filters.limit + index + 1

  const indexedRows = rows.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const columns = [
    {
      minWidth: 20,
      width: 100,
      sortable: false,
      field: 'sl_no',
      headerName: 'SL. NO',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', px: 2 }}>
          {params.row.sl_no}
        </Typography>
      )
    },
    {
      width: 300,
      minWidth: 20,
      field: 'name',
      sortable: false,
      headerName: 'Necropsy Center',
      renderCell: params => (
        <>
          <Tooltip title={params?.row?.name}>
            <Typography
              sx={{ fontSize: '14px', fontWeight: 400, color: theme?.palette?.customColors?.OnSurfaceVariant }}
            >
              {params?.row?.name}
            </Typography>
          </Tooltip>
        </>
      )
    },
    {
      width: 250,
      minWidth: 20,
      field: 'site_name',
      sortable: false,
      headerName: 'Site',
      renderCell: params => (
        <>
          <Tooltip title={params?.row?.site_name}>
            <Typography
              sx={{ fontSize: '14px', fontWeight: 400, color: theme?.palette?.customColors?.OnSurfaceVariant }}
            >
              {params?.row?.site_name ? params?.row?.site_name : 'N/A'}
            </Typography>
          </Tooltip>
        </>
      )
    },
    {
      width: 350,
      minWidth: 20,
      field: 'created_by',
      sortable: false,
      headerName: 'Created By',
      align: 'left',
      headerAlign: 'left',
      renderCell: params => {
        return (
          <UserAvatarDetails
            user_name={params?.row?.created_by?.name}
            profile_image={params?.row?.created_by?.user_profile_pic}
          />
        )
      }
    },
    {
      width: 100,
      miWidth: 20,
      field: 'action',
      sortable: false,
      headerName: 'Action',
      renderCell: params => {
        return (
          <Tooltip title='Edit Necropsy Center'>
            <IconButton
              onClick={() => {
                setEditData(params.row)
                setOpenAddNecropsyDrawer(true)
              }}
            >
              <Icon icon='mdi:pencil-outline' />
            </IconButton>
          </Tooltip>
        )
      }
    }
  ]

  const headerAction = (
    <>
      <Button variant='contained' onClick={() => setOpenAddNecropsyDrawer(true)}>
        ADD NECROPSY CENTER
      </Button>
    </>
  )

  return (
    <>
      <Box>
        <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
          <Typography sx={{ cursor: 'pointer', color: 'inherit' }}>Necropsy</Typography>
          <Typography sx={{ cursor: 'pointer', color: 'text.primary' }}>Masters</Typography>
          <Typography sx={{ cursor: 'pointer', color: 'text.primary' }}>Necropsy Center</Typography>
        </Breadcrumbs>
        <Box sx={{ mt: 6 }}>
          <Card>
            <CardHeader title={RenderUtility?.pageTitle('Necropsy Center')} action={headerAction} />
            <CardContent>
              <Box>
                <Search
                  borderRadius='4px'
                  width='343px'
                  placeholder='Search by medical Id / AID / animal identifier'
                  value={searchValue}
                  onClear={handleSearchClear}
                  onChange={e => handleSearch(e.target.value)}
                  textFielsSX={{
                    '& .MuiInputBase-input::placeholder': {
                      fontSize: '13px'
                    }
                  }}
                />
              </Box>
              <Box>
                <CommonTable
                  columns={columns}
                  indexedRows={indexedRows}
                  total={total}
                  loading={loading}
                  paginationModel={{ page: filters.page - 1, pageSize: filters.limit }}
                  setPaginationModel={handlePaginationModelChange}
                  searchValue=''
                  getRowHeight={() => 'auto'}
                  externalTableStyle={{
                    '& .MuiDataGrid-cell': {
                      padding: 4
                    },
                    '& .MuiDataGrid-row:hover': {
                      cursor: 'pointer'
                    }
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
      {openAddNecropsyDrawer && (
        <AddnecropsyCenterDrawer
          open={openAddNecropsyDrawer}
          setOpen={setOpenAddNecropsyDrawer}
          editData={editData}
          setEditData={setEditData}
          onSuccess={fetchNecropsyCenters}
        />
      )}
    </>
  )
}

export default NecropsyCenters
