'use client'

import { Box, Grid, IconButton, Tooltip, Typography, useTheme } from '@mui/material'
import { debounce, DebouncedFunc } from 'lodash'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import MUISearch from 'src/views/forms/form-fields/MUISearch'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { ExportButton } from 'src/views/utility/render-snippets'
import Icon from 'src/@core/components/icon'
import { AddButtonContained } from 'src/components/ButtonContained'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
import Error404 from 'src/pages/404'
import { useAuth } from 'src/hooks/useAuth'
import { getMedicalDeliveryRoute, addDeliveryRoute, updateDeliveryRoute } from 'src/lib/api/medical/masters'
import Utility from 'src/utility'
import toast from 'react-hot-toast'
import AddDeliveryRouteDrawer from 'src/views/pages/masters/AddDeliveryRouteDrawer'
import { GridSortModel, GridPaginationModel, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { Theme } from '@mui/material/styles'
import { ChangeEvent, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface DeliveryRouteRow {
  id?: number | string
  delivery?: string
  zoo_id?: string
  sl_no?: number
  [key: string]: any
}

interface IndexedDeliveryRouteRow extends DeliveryRouteRow {
  sl_no: number
  id: number | string
}

interface ApiResponse {
  success?: boolean
  message?: string | Record<string, string[]>
  data?: any
}

interface EditParams {
  id: number | string | null
  name: string | null
}

interface Payload {
  id?: number | string | null
  name?: string | null
}

interface Filters {
  page: number
  limit: number
  q: string
  sort: 'asc' | 'desc'
  sortColumn: string
}

const DeliveryRoute = () => {
  const theme: Theme = useTheme()
  const router = useRouter()
  const searchParams = useSearchParams()
  const authData = useAuth() as any
  const { t } = useTranslation()

  const complaints_permission: boolean | undefined =
    authData?.userData?.permission?.user_settings?.medical_add_complaints

  const [rows, setRows] = useState<DeliveryRouteRow[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [total, setTotal] = useState<number>(0)
  const [exportLoading, setExportLoading] = useState<boolean>(false)
  const [searchValue, setSearchValue] = useState<string>('')

  const [filters, setFilters] = useState<Filters>({
    page: 1,
    limit: 50,
    q: '',
    sort: 'asc',
    sortColumn: 'delivery'
  })

  const editParamsInitialState: EditParams = { id: null, name: null }
  const [openDrawer, setOpenDrawer] = useState<boolean>(false)
  const [resetForm, setResetForm] = useState<boolean>(false)
  const [submitLoader, setSubmitLoader] = useState<boolean>(false)
  const [editParams, setEditParams] = useState<EditParams>(editParamsInitialState)

  useEffect(() => {
    const page = searchParams?.get('page') || '1'
    const limit = searchParams?.get('limit') || '50'
    const q = searchParams?.get('q') || ''
    const sort = (searchParams?.get('sort') as 'asc' | 'desc') || 'asc'
    const sortColumn = searchParams?.get('sortColumn') || 'delivery'

    setFilters({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      q,
      sort,
      sortColumn
    })
    setSearchValue(q)
  }, [searchParams])

  const fetchTableData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)

      const params = {
        sort_order: filters.sort,
        q: filters.q,
        sort_by: filters.sortColumn,
        page: filters.page,
        limit: filters.limit
      }

      const res: ApiResponse = await getMedicalDeliveryRoute({ params })

      if (res?.success) {
        setRows(res?.data?.medical_delivery_route || [])
        setTotal(res?.data?.total_count || 0)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [filters.page, filters.limit, filters.q, filters.sort, filters.sortColumn])

  useEffect(() => {
    if (complaints_permission) {
      fetchTableData()
    }
  }, [fetchTableData])

  const updateUrlParams = (updatedFilters: Filters): void => {
    const params = new URLSearchParams()
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value) params.set(key, value.toString())
    })
    router.replace(`/medical/masters/delivery-route?${params.toString()}`)
  }

  const debouncedSearch: DebouncedFunc<(value: string) => void> = useMemo(
    () =>
      debounce((value: string) => {
        const updated: Filters = { ...filters, q: value, page: 1 }
        setFilters(updated)
        updateUrlParams(updated)
      }, 1000),
    [filters]
  )

  const handleSearch = (value: string): void => {
    setSearchValue(value)
    debouncedSearch(value)
  }

  const handleSearchClear = (): void => {
    setSearchValue('')
    debouncedSearch('')
  }

  const handlePaginationModelChange = (model: GridPaginationModel): void => {
    const updated: Filters = { ...filters, page: model.page + 1, limit: model.pageSize }
    setFilters(updated)
    updateUrlParams(updated)
  }

  const handleSortModel = (newModel: GridSortModel): void => {
    if (newModel.length) {
      const updated: Filters = {
        ...filters,
        sort: newModel[0].sort as 'asc' | 'desc',
        sortColumn: newModel[0].field
      }
      setFilters(updated)
      updateUrlParams(updated)
    }
  }

  const handleEdit = (id: number | string | null, name: string | null): void => {
    setEditParams({ id, name })
    setOpenDrawer(true)
  }

  const handleExport = async (): Promise<void> => {
    const params = {
      response_type: 'csv',
      sort_order: filters.sort,
      sort_by: filters.sortColumn,
      q: filters.q
    }

    try {
      setExportLoading(true)
      const response: ApiResponse = await getMedicalDeliveryRoute({ params })
      if (response?.success && response?.data) {
        Utility.downloadFileFromURL(response.data)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setExportLoading(false)
    }
  }

  const handleSubmitData = async (payload: Payload): Promise<void> => {
    try {
      setLoading(true)
      setSubmitLoader(true)

      let response: ApiResponse
      if (editParams?.id !== null) {
        response = await updateDeliveryRoute(payload)
      } else {
        response = await addDeliveryRoute(payload)
      }

      if (response?.success) {
        setSubmitLoader(false)
        setResetForm(true)
        setOpenDrawer(false)
        toast.success(response?.message as string)
        await fetchTableData()
      } else {
        if (response?.message && typeof response.message === 'object') {
          Object.values(response.message).forEach((msg: string | string[]) => {
            if (Array.isArray(msg)) msg.forEach((m: string) => toast.error(m))
            else toast.error(msg)
          })
        } else {
          toast.error((response?.message as string) || t('something_went_wrong'))
        }
        setSubmitLoader(false)
        setLoading(false)
      }
    } catch (e) {
      console.error(e)
      setSubmitLoader(false)
    } finally {
      setSubmitLoader(false)
      setLoading(false)
    }
  }

  const getSlNo = (index: number): number => (filters.page - 1) * filters.limit + index + 1

  const indexedRows: IndexedDeliveryRouteRow[] = rows.map((row, index) => ({
    ...row,
    id: row.id || index,
    sl_no: getSlNo(index)
  }))

  const columns: GridColDef<IndexedDeliveryRouteRow>[] = [
    {
      minWidth: 140,
      flex: 0.1,
      field: 'sl_no',
      headerName: t('medical_module.sl_no'),
      sortable: false,
      renderCell: (params: GridRenderCellParams<IndexedDeliveryRouteRow>): ReactNode => (
        <Typography variant='body2' sx={{ color: theme.palette.customColors?.customHeadingTextColor, pl: '10px' }}>
          {params.row.sl_no}.
        </Typography>
      )
    },
    {
      minWidth: 350,
      flex: 0.3,
      field: 'delivery',
      headerName: t('medical_module.name_column'),
      sortable: true,
      renderCell: (params: GridRenderCellParams<IndexedDeliveryRouteRow>): ReactNode => (
        <Tooltip title={params.row.delivery || ''}>
          <Typography
            variant='body2'
            sx={{
              fontSize: '14px',
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: theme.palette.customColors?.customHeadingTextColor,
              pl: '6px'
            }}
          >
            {params.row.delivery}
          </Typography>
        </Tooltip>
      )
    },
    {
      minWidth: 150,
      flex: 0.2,
      field: 'action',
      headerName: t('medical_module.action_column'),
      sortable: false,
      renderCell: (params: GridRenderCellParams<IndexedDeliveryRouteRow>): ReactNode => (
        <Box>
          {params?.row?.zoo_id === '0' || params?.row?.zoo_id == null ? null : (
            <IconButton
              size='small'
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation()
                handleEdit(params.row.id, params.row.delivery || null)
              }}
            >
              <Icon icon='mdi:pencil-outline' />
            </IconButton>
          )}
        </Box>
      )
    }
  ]

  const headerAction: ReactNode = (
    <AddButtonContained
      title={t('medical_module.add_delivery_route')}
      action={() => {
        setOpenDrawer(true)
        setResetForm(true)
        setEditParams({ id: null, name: null })
      }}
      fullWidth='fullWidth'
      styles={{ margin: 0 }}
      disabled={false}
    />
  )

  return (
    <>
      {complaints_permission ? (
        <PageCardLayout title={t('medical_module.delivery_route')} action={headerAction}>
          <Grid container>
            <Grid container sx={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <Grid size={{ xs: 'grow', sm: 3.5, md: 3.5, lg: 3, xl: 2.5 }}>
                <MUISearch
                  sx={{ width: { xs: '100%', sm: '250px' } }}
                  placeholder={`${t('search')}...`}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
                  onClear={handleSearchClear}
                  value={searchValue}
                />
              </Grid>
              <Grid>
                <ExportButton
                  onClick={handleExport}
                  loading={loading || exportLoading}
                  disabled={total === 0}
                  bgcolor=''
                />
              </Grid>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <CommonTable
                indexedRows={indexedRows}
                total={total}
                columns={columns}
                loading={loading}
                searchValue={filters.q}
                paginationModel={{ page: filters.page - 1, pageSize: filters.limit }}
                handleSortModel={handleSortModel}
                setPaginationModel={handlePaginationModelChange}
              />
            </Grid>
            <AddDeliveryRouteDrawer
              drawerWidth={562}
              addEventSidebarOpen={openDrawer}
              handleSidebarClose={() => {
                setOpenDrawer(false)
                setResetForm(true)
              }}
              editParams={editParams}
              resetForm={resetForm}
              handleSubmitData={handleSubmitData}
              submitLoader={submitLoader}
            />
          </Grid>
        </PageCardLayout>
      ) : (
        <Error404 />
      )}
    </>
  )
}

export default DeliveryRoute
