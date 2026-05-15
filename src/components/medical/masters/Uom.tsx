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
import AddUOMDrawer from 'src/views/pages/masters/AddUOMDrawer'
import toast from 'react-hot-toast'
import { addMeasurementUnits, getMeasurementUnitsMasters, updateMeasurementUnits } from 'src/lib/api/medical/masters'
import Utility from 'src/utility'
import { GridSortModel, GridPaginationModel, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { Theme } from '@mui/material/styles'
import { ChangeEvent, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface UOMRow {
  id?: number | string
  unit_name?: string
  uom_abbr?: string
  measurement_type?: string
  conversion_factor?: number
  same_base_uom?: boolean
  zoo_id?: string
  label?: string
  sl_no?: number
  [key: string]: any
}

interface IndexedUOMRow extends UOMRow {
  sl_no: number
  id: number | string
}

interface ApiResponse {
  success?: boolean
  message?: string | Record<string, string[]>
  data?: any
  total?: number
}

interface EditParams {
  id: number | string | null
  unit_name: string | null
  uom_abbr?: string | null
  measurement_type?: string | null
  conversion_factor?: number | null
  same_base_uom?: boolean | null
}

interface Payload {
  id?: number | string | null
  unit_name?: string | null
  uom_abbr?: string | null
  measurement_type?: string | null
  conversion_factor?: number | null
  same_base_uom?: boolean | null
}

interface Filters {
  page: number
  limit: number
  q: string
  sort: 'asc' | 'desc'
  sortColumn: string
}

const Uom = () => {
  const theme: Theme = useTheme()
  const router = useRouter()
  const searchParams = useSearchParams()
  const authData = useAuth() as any
  const { t } = useTranslation()

  const complaints_permission: boolean | undefined =
    authData?.userData?.permission?.user_settings?.medical_add_complaints

  const [rows, setRows] = useState<UOMRow[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [total, setTotal] = useState<number>(0)
  const [exportLoading, setExportLoading] = useState<boolean>(false)
  const [searchValue, setSearchValue] = useState<string>('')

  const [filters, setFilters] = useState<Filters>({
    page: 1,
    limit: 50,
    q: '',
    sort: 'asc',
    sortColumn: 'unit_name'
  })

  const editParamsInitialState: EditParams = {
    id: null,
    unit_name: null,
    uom_abbr: null,
    measurement_type: null,
    conversion_factor: null,
    same_base_uom: null
  }
  const [openDrawer, setOpenDrawer] = useState<boolean>(false)
  const [resetForm, setResetForm] = useState<boolean>(false)
  const [submitLoader, setSubmitLoader] = useState<boolean>(false)
  const [editParams, setEditParams] = useState<EditParams>(editParamsInitialState)

  useEffect(() => {
    const page = searchParams?.get('page') || '1'
    const limit = searchParams?.get('limit') || '50'
    const q = searchParams?.get('q') || ''
    const sort = (searchParams?.get('sort') as 'asc' | 'desc') || 'asc'
    const sortColumn = searchParams?.get('sortColumn') || 'unit_name'

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
        sort: filters.sort,
        q: filters.q,
        column: filters.sortColumn,
        limit: filters.limit,
        page: filters.page
      }

      const res: ApiResponse = await getMeasurementUnitsMasters({ params })

      if (res?.success && res?.data) {
        setRows(res?.data || [])
        setTotal(res?.total || 0)
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
    router.replace(`/medical/masters/uom?${params.toString()}`)
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
        sortColumn: newModel[0].field,
        page: 1
      }
      setFilters(updated)
      updateUrlParams(updated)
    }
  }

  const handleEdit = (row: UOMRow): void => {
    setEditParams({
      id: row.id || null,
      unit_name: row.unit_name || null,
      uom_abbr: row.uom_abbr || null,
      measurement_type: row.measurement_type || null,
      conversion_factor: row.conversion_factor || null,
      same_base_uom: row.same_base_uom || null
    })
    setOpenDrawer(true)
  }

  const handleExport = async (): Promise<void> => {
    const params = {
      sort: filters.sort,
      q: filters.q,
      column: filters.sortColumn,
      response_type: 'csv'
    }

    try {
      setExportLoading(true)
      const response: ApiResponse = await getMeasurementUnitsMasters({ params })
      if (response?.success && response?.data) {
        Utility.downloadFileFromURL(response?.data)
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
        response = await updateMeasurementUnits(payload)
      } else {
        response = await addMeasurementUnits(payload)
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

  const indexedRows: IndexedUOMRow[] = rows.map((row, index) => ({
    ...row,
    id: row.id || index,
    sl_no: getSlNo(index)
  }))

  const columns: GridColDef<IndexedUOMRow>[] = [
    {
      minWidth: 100,
      flex: 0.1,
      field: 'sl_no',
      headerName: t('medical_module.sl_no'),
      sortable: false,
      renderCell: (params: GridRenderCellParams<IndexedUOMRow>): ReactNode => (
        <Typography variant='body2' sx={{ color: theme.palette.customColors?.customHeadingTextColor, pl: '10px' }}>
          {params.row.sl_no}.
        </Typography>
      )
    },
    {
      minWidth: 350,
      flex: 0.25,
      field: 'unit_name',
      headerName: t('medical_module.uom_name'),
      sortable: true,
      renderCell: (params: GridRenderCellParams<IndexedUOMRow>): ReactNode => (
        <Tooltip title={params.row.unit_name || ''}>
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
            {params.row.unit_name}
          </Typography>
        </Tooltip>
      )
    },
    {
      minWidth: 200,
      flex: 0.2,
      field: 'uom_abbr',
      headerName: t('medical_module.uom_abbr'),
      sortable: true,
      renderCell: (params: GridRenderCellParams<IndexedUOMRow>): ReactNode => (
        <Tooltip title={params.row.uom_abbr || ''}>
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
            {params.row.uom_abbr}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 0.2,
      minWidth: 300,
      field: 'measurement_type',
      headerName: t('medical_module.measurement_type'),
      sortable: true,
      renderCell: (params: GridRenderCellParams<IndexedUOMRow>): ReactNode => (
        <Tooltip title={params.row.measurement_type || ''}>
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
            {params.row.measurement_type}
          </Typography>
        </Tooltip>
      )
    },
    {
      minWidth: 120,
      flex: 0.1,
      field: 'action',
      headerName: t('medical_module.action_column'),
      sortable: false,
      renderCell: (params: GridRenderCellParams<IndexedUOMRow>): ReactNode => (
        <Box>
          {params?.row?.zoo_id === '0' || params?.row?.zoo_id == null ? null : (
            <IconButton
              size='small'
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation()
                handleEdit(params.row)
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
      title={t('medical_module.add_uom')}
      action={() => {
        setOpenDrawer(true)
        setResetForm(true)
        setEditParams({
          id: null,
          unit_name: null,
          uom_abbr: null,
          measurement_type: null,
          conversion_factor: null,
          same_base_uom: null
        })
      }}
      fullWidth='fullWidth'
      styles={{ margin: 0 }}
      disabled={false}
    />
  )

  return (
    <>
      {complaints_permission ? (
        <PageCardLayout title={t('medical_module.uom_full')} action={headerAction}>
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
            <AddUOMDrawer
              drawerWidth={562}
              addEventSidebarOpen={openDrawer}
              handleSidebarClose={() => {
                setOpenDrawer(false)
                setResetForm(true)
                setEditParams({
                  id: null,
                  unit_name: null,
                  uom_abbr: null,
                  measurement_type: null,
                  conversion_factor: null,
                  same_base_uom: null
                })
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

export default Uom
