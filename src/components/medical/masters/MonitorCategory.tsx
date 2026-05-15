'use client'

import { Grid, Tooltip, Typography, useTheme } from '@mui/material'
import { useCallback, useEffect, useState, useMemo } from 'react'
import { getAssessmentCategoriesList } from 'src/lib/api/report'
import MUISearch from 'src/views/forms/form-fields/MUISearch'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
import Error404 from 'src/pages/404'
import { debounce, DebouncedFunc } from 'lodash'
import { useRouter, useSearchParams } from 'next/navigation'
import { GridSortModel, GridPaginationModel, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { Theme } from '@mui/material/styles'
import { ChangeEvent, ReactNode } from 'react'
import { useAuth } from 'src/hooks/useAuth'
import { useTranslation } from 'react-i18next'

interface MonitorCategoryRow {
  assessment_category_id?: number | string
  label?: string
  assessment_type_count?: number
  active?: string
  sl_no?: number
  [key: string]: any
}

interface IndexedMonitorCategoryRow extends MonitorCategoryRow {
  sl_no: number
  id: number | string
}

interface ApiResponse {
  success?: boolean
  data?: MonitorCategoryRow[]
  message?: string
}

interface Filters {
  page: number
  limit: number
  q: string
}

const MonitorCategory = () => {
  const theme: Theme = useTheme()
  const router = useRouter()
  const searchParams = useSearchParams()
  const authData = useAuth() as any
  const { t } = useTranslation()

  const [rows, setRows] = useState<MonitorCategoryRow[]>([])
  const [allRows, setAllRows] = useState<MonitorCategoryRow[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [searchValue, setSearchValue] = useState<string>('')
  const [total, setTotal] = useState<number>(0)

  const complaints_permission: boolean | undefined =
    authData?.userData?.permission?.user_settings?.medical_add_complaints

  const [filters, setFilters] = useState<Filters>({
    page: 1,
    limit: 50,
    q: ''
  })

  useEffect(() => {
    const page = searchParams?.get('page') || '1'
    const limit = searchParams?.get('limit') || '50'
    const q = searchParams?.get('q') || ''

    setFilters({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      q
    })
    setSearchValue(q)
  }, [searchParams])

  const filterData = (data: MonitorCategoryRow[], searchText: string): MonitorCategoryRow[] => {
    if (!searchText.trim()) return data
    return data.filter(row => row.label?.toLowerCase().includes(searchText.toLowerCase()))
  }

  const fetchTableData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)

      const params = {
        cat_id: searchParams?.get('id') || undefined,
        ref_type: 'animal'
      }
      const res: ApiResponse = await getAssessmentCategoriesList(params)

      if (res?.success) {
        setAllRows(res?.data || [])
        const filteredData = filterData(res?.data || [], filters.q)
        setRows(filteredData)
        setTotal(filteredData.length)
      }
    } catch (error) {
      console.error('Error fetching monitor categories:', error)
    } finally {
      setLoading(false)
    }
  }, [searchParams, filters.q])

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
    router.replace(`/medical/masters/monitor?${params.toString()}`)
  }

  const debouncedSearch: DebouncedFunc<(value: string) => void> = useMemo(
    () =>
      debounce((value: string) => {
        const updated: Filters = { ...filters, q: value, page: 1 }
        setFilters(updated)
        updateUrlParams(updated)

        const filteredData = filterData(allRows, value)
        setRows(filteredData)
        setTotal(filteredData.length)
      }, 1000),
    [filters, allRows]
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
    console.log('Sort model:', newModel)
  }

  const handleRowClick = (params: any): void => {
    const { assessment_category_id, label } = params.row
    const q = label ? `?label=${encodeURIComponent(label)}` : ''
    router.push(`/medical/masters/monitor/${assessment_category_id}${q}`)
  }

  const getSlNo = (index: number): number => (filters.page - 1) * filters.limit + index + 1

  const paginatedRows = useMemo(() => {
    const start = (filters.page - 1) * filters.limit
    const end = start + filters.limit
    return rows.slice(start, end)
  }, [rows, filters.page, filters.limit])

  const indexedRows: IndexedMonitorCategoryRow[] = paginatedRows.map((row, index) => ({
    ...row,
    id: row.assessment_category_id || index,
    sl_no: getSlNo(index)
  }))

  const columns: GridColDef<IndexedMonitorCategoryRow>[] = [
    {
      minWidth: 100,
      flex: 0.1,
      field: 'sl_no',
      headerName: t('medical_module.sl_no'),
      sortable: false,
      renderCell: (params: GridRenderCellParams<IndexedMonitorCategoryRow>): ReactNode => (
        <Typography variant='body2' sx={{ color: theme.palette.customColors?.customHeadingTextColor, pl: '10px' }}>
          {params.row.sl_no}.
        </Typography>
      )
    },
    {
      minWidth: 350,
      flex: 0.4,
      field: 'label',
      headerName: t('medical_module.name_column'),
      sortable: true,
      renderCell: (params: GridRenderCellParams<IndexedMonitorCategoryRow>): ReactNode => (
        <Tooltip title={params.row.label || ''}>
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
            {params.row.label}
          </Typography>
        </Tooltip>
      )
    },
    {
      minWidth: 280,
      flex: 0.3,
      field: 'assessment_type_count',
      headerName: t('medical_module.active_assessment_type_count'),
      sortable: true,
      renderCell: (params: GridRenderCellParams<IndexedMonitorCategoryRow>): ReactNode => (
        <Typography
          variant='body2'
          sx={{
            fontSize: '14px',
            fontWeight: 500,
            color: theme.palette.customColors?.customHeadingTextColor,
            pl: '6px'
          }}
        >
          {params.row.assessment_type_count}
        </Typography>
      )
    },
    {
      minWidth: 120,
      flex: 0.2,
      field: 'active',
      headerName: t('medical_module.status_column'),
      sortable: true,
      renderCell: (params: GridRenderCellParams<IndexedMonitorCategoryRow>): ReactNode => (
        <Typography
          variant='body2'
          sx={{
            fontSize: '14px',
            fontWeight: 500,
            color: theme.palette.customColors?.customHeadingTextColor,
            pl: '6px'
          }}
        >
          {params.row.active === '1' ? t('active') : t('inactive')}
        </Typography>
      )
    }
  ]

  return (
    <>
      {complaints_permission ? (
        <PageCardLayout title={t('medical_module.monitoring')}>
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
                onRowClick={handleRowClick}
              />
            </Grid>
          </Grid>
        </PageCardLayout>
      ) : (
        <Error404 />
      )}
    </>
  )
}

export default MonitorCategory
