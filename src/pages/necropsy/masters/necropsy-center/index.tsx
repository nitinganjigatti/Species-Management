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
import { Theme } from '@mui/material/styles'
import { GridRenderCellParams, GridColDef, GridPaginationModel } from '@mui/x-data-grid'
import { debounce, DebouncedFunc } from 'lodash'
import { useRouter, NextRouter } from 'next/router'
import { NextPage } from 'next'
import React, { useCallback, useEffect, useMemo, useState, ChangeEvent, ReactNode } from 'react'
import AddnecropsyCenterDrawer from 'src/components/necropsy/AddnecropsyCenterDrawer'
import Icon from 'src/@core/components/icon'
import { getNecropsyCenter } from 'src/lib/api/hospital/inpatientDischarge'
import RenderUtility from 'src/utility/render'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import Search from 'src/views/utility/Search'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'

interface NecropsyCenterFilters {
  page: number
  limit: number
  q: string
}

interface NecropsyCenterRow {
  id?: number
  name?: string
  site_name?: string
  created_by?: {
    name?: string
    user_profile_pic?: string
  }
  sl_no?: number
}

interface IndexedNecropsyCenterRow extends NecropsyCenterRow {
  sl_no: number
}

interface NecropsyCenterApiResponse {
  status?: boolean
  data?: {
    list?: NecropsyCenterRow[]
    total_records?: number
  }
}

const NecropsyCenters: NextPage = () => {
  const theme: Theme = useTheme()
  const router: NextRouter = useRouter()

  const [rows, setRows] = useState<NecropsyCenterRow[]>([])
  const [total, setTotal] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [searchValue, setSearchValue] = useState<string>('')
  const [openAddNecropsyDrawer, setOpenAddNecropsyDrawer] = useState<boolean>(false)
  const [editData, setEditData] = useState<NecropsyCenterRow | null>(null)

  const [filters, setFilters] = useState<NecropsyCenterFilters>({
    page: 1,
    limit: 10,
    q: ''
  })

  useEffect(() => {
    const { page = '1', limit = '10', q = '' } = router.query as { page?: string; limit?: string; q?: string }

    setFilters({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      q: q as string
    })

    setSearchValue(q as string)
  }, [router.query])

  const fetchNecropsyCenters = async (): Promise<void> => {
    try {
      setLoading(true)

      const res: NecropsyCenterApiResponse = await getNecropsyCenter({
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

  const updateUrlParams = (updatedFilters: NecropsyCenterFilters): void => {
    const params = new URLSearchParams()
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value.toString())
      }
    })
    router.push({ query: params.toString() }, undefined, { shallow: true })
  }

  const handlePaginationModelChange = (model: GridPaginationModel): void => {
    const updated: NecropsyCenterFilters = {
      ...filters,
      page: model.page + 1,
      limit: model.pageSize
    }
    setFilters(updated)
    updateUrlParams(updated)
  }

  const debouncedSearch: DebouncedFunc<(value: string) => void> = useMemo(
    () =>
      debounce((value: string) => {
        const updated: NecropsyCenterFilters = {
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
    (value: string): void => {
      setSearchValue(value)
      debouncedSearch(value)
    },
    [debouncedSearch]
  )

  const handleSearchClear = (): void => {
    setSearchValue('')
    debouncedSearch('')
  }

  const getSlNo = (index: number): number => (filters.page - 1) * filters.limit + index + 1

  const indexedRows: IndexedNecropsyCenterRow[] = rows.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const columns: GridColDef[] = [
    {
      minWidth: 20,
      width: 100,
      sortable: false,
      field: 'sl_no',
      headerName: 'SL. NO',
      renderCell: (params: GridRenderCellParams<IndexedNecropsyCenterRow>): ReactNode => (
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
      renderCell: (params: GridRenderCellParams<IndexedNecropsyCenterRow>): ReactNode => (
        <>
          <Tooltip title={params?.row?.name}>
            <Typography
              sx={{ fontSize: '14px', fontWeight: 400, color: (theme as Theme)?.palette?.customColors?.OnSurfaceVariant }}
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
      renderCell: (params: GridRenderCellParams<IndexedNecropsyCenterRow>): ReactNode => (
        <>
          <Tooltip title={params?.row?.site_name}>
            <Typography
              sx={{ fontSize: '14px', fontWeight: 400, color: (theme as Theme)?.palette?.customColors?.OnSurfaceVariant }}
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
      renderCell: (params: GridRenderCellParams<IndexedNecropsyCenterRow>): ReactNode => {
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
      minWidth: 20,
      field: 'action',
      sortable: false,
      headerName: 'Action',
      renderCell: (params: GridRenderCellParams<IndexedNecropsyCenterRow>): ReactNode => {
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

  const headerAction: ReactNode = (
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
                  placeholder='Search by necropsy center'
                  value={searchValue}
                  onClear={handleSearchClear}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
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
