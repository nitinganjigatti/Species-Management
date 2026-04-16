import { Box, Grid, IconButton, Tooltip, Typography, useTheme } from '@mui/material'
import { debounce, DebouncedFunc } from 'lodash'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState, useMemo } from 'react'
import MUISearch from 'src/views/forms/form-fields/MUISearch'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { ExportButton } from 'src/views/utility/render-snippets'
import Icon from 'src/@core/components/icon'
import { AddButtonContained } from 'src/components/ButtonContained'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
import Utility from 'src/utility'
import toast from 'react-hot-toast'
import AddPurposeOfAnaesthesiaDrawer from 'src/views/pages/masters/AddPurposeOfAnaesthesiaDrawer'
import { getAssesmentList } from 'src/lib/api/hospital/anesthesia'
import { addAssessmentMastersByType, updateAssessmentMastersByType } from 'src/lib/api/medical/masters'
import { GridSortModel, GridPaginationModel, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { Theme } from '@mui/material/styles'
import { NextPage } from 'next'
import { ChangeEvent, ReactNode } from 'react'

// Types and Interfaces
interface PurposeRow {
  id?: number | string
  name?: string
  is_selected?: string
  sl_no?: number
  [key: string]: any
}

interface IndexedPurposeRow extends PurposeRow {
  sl_no: number
  id: number | string
}

interface ApiResponse {
  success?: boolean
  message?: string | Record<string, string[]>
  data?: {
    records?: PurposeRow[]
    total?: number
    download_url?: string
  }
}

interface EditParams {
  id: number | string | null
  name: string | null
}

interface Payload {
  id?: number | string | null
  name?: string | null
  type: string
}

interface Filters {
  page: number
  limit: number
  q: string
  sort: 'asc' | 'desc'
  sortColumn: string
}

const PurposeOfAnaesthesia: NextPage = () => {
  const theme: Theme = useTheme()
  const router = useRouter()

  // State
  const [rows, setRows] = useState<PurposeRow[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [total, setTotal] = useState<number>(0)
  const [exportLoading, setExportLoading] = useState<boolean>(false)
  const [searchValue, setSearchValue] = useState<string>('')

  // Filters state
  const [filters, setFilters] = useState<Filters>({
    page: 1,
    limit: 50,
    q: '',
    sort: 'asc',
    sortColumn: 'name'
  })

  // Drawer state
  const editParamsInitialState: EditParams = { id: null, name: null }
  const [openDrawer, setOpenDrawer] = useState<boolean>(false)
  const [resetForm, setResetForm] = useState<boolean>(false)
  const [submitLoader, setSubmitLoader] = useState<boolean>(false)
  const [editParams, setEditParams] = useState<EditParams>(editParamsInitialState)

  // Sync filters with URL query params on mount
  useEffect(() => {
    const {
      page = '1',
      limit = '50',
      q = '',
      sort = 'asc',
      sortColumn = 'name'
    } = router.query as {
      page?: string
      limit?: string
      q?: string
      sort?: 'asc' | 'desc'
      sortColumn?: string
    }

    setFilters({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      q: q as string,
      sort: sort as 'asc' | 'desc',
      sortColumn: sortColumn as string
    })
    setSearchValue(q as string)
  }, [router.query])

  const fetchTableData = async (): Promise<void> => {
    try {
      setLoading(true)

      const params = {
        sort: filters.sort,
        q: filters.q,
        column: filters.sortColumn,
        limit: filters.limit,
        page: filters.page,
        type: 'purpose'
      }

      const res: ApiResponse = await getAssesmentList(params)

      if (res?.success) {
        setRows(res?.data?.records || [])
        setTotal(res?.data?.total || 0)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch data when filters change
  useEffect(() => {
    fetchTableData()
  }, [filters.page, filters.limit, filters.q, filters.sort, filters.sortColumn])

  const updateUrlParams = (updatedFilters: Filters): void => {
    const params = new URLSearchParams()
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value.toString())
      }
    })
    router.push({ query: params.toString() }, undefined, { shallow: true })
  }

  const debouncedSearch: DebouncedFunc<(value: string) => void> = useMemo(
    () =>
      debounce((value: string) => {
        const updated: Filters = {
          ...filters,
          q: value,
          page: 1
        }
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
    const updated: Filters = {
      ...filters,
      page: model.page + 1,
      limit: model.pageSize
    }
    setFilters(updated)
    updateUrlParams(updated)
  }

  const handleSortModel = (newModel: GridSortModel): void => {
    if (newModel.length) {
      const updated: Filters = {
        ...filters,
        sort: newModel[0].sort as 'asc' | 'desc',
        sortColumn: newModel[0].field,
        page: 1 // Reset to first page when sorting
      }
      setFilters(updated)
      updateUrlParams(updated)
    }
  }

  const handleEdit = (id: number | string | null, name: string | null): void => {
    setEditParams({ id: id, name: name })
    setOpenDrawer(true)
  }

  const handleExport = async (): Promise<void> => {
    const params = {
      response_type: 'csv',
      sort: filters.sort,
      column: filters.sortColumn,
      q: filters.q,
      type: 'purpose'
    }

    try {
      setExportLoading(true)

      const response: ApiResponse = await getAssesmentList(params)
      if (response?.success && response?.data?.download_url) {
        Utility.downloadFileFromURL(response.data.download_url)
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
        response = await updateAssessmentMastersByType(payload)
      } else {
        response = await addAssessmentMastersByType(payload)
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
            if (Array.isArray(msg)) {
              msg.forEach((m: string) => toast.error(m))
            } else {
              toast.error(msg)
            }
          })
        } else {
          toast.error((response?.message as string) || 'Something went wrong')
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

  const indexedRows: IndexedPurposeRow[] = rows.map((row, index) => ({
    ...row,
    id: row.id || index,
    sl_no: getSlNo(index)
  }))

  const columns: GridColDef<IndexedPurposeRow>[] = [
    {
      minWidth: 140,
      flex: 0.1,
      field: 'sl_no',
      headerName: 'SL.NO',
      sortable: false,
      renderCell: (params: GridRenderCellParams<IndexedPurposeRow>): ReactNode => (
        <Typography variant='body2' sx={{ color: theme.palette.customColors?.customHeadingTextColor, pl: '10px' }}>
          {params.row.sl_no}.
        </Typography>
      )
    },
    {
      minWidth: 350,
      flex: 0.3,
      field: 'name',
      headerName: 'NAME',
      sortable: true,
      renderCell: (params: GridRenderCellParams<IndexedPurposeRow>): ReactNode => (
        <Tooltip title={params.row.name || ''}>
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
            {params.row.name}
          </Typography>
        </Tooltip>
      )
    },
    {
      minWidth: 150,
      flex: 0.2,
      field: 'action',
      headerName: 'Action',
      sortable: false,
      renderCell: (params: GridRenderCellParams<IndexedPurposeRow>): ReactNode => (
        <Box>
          {params?.row?.is_selected !== '0' ? null : (
            <IconButton
              size='small'
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation()
                handleEdit(params.row.id, params.row.name || null)
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
      title='Add Purpose'
      action={() => {
        setOpenDrawer(true)
        setResetForm(true)
        setEditParams({ id: null, name: null })
      }}
      fullWidth='fullWidth'
      styles={{
        margin: 0
      }}
      disabled={false}
    />
  )

  return (
    <PageCardLayout title='Purpose Of Anaesthesia' action={headerAction}>
      <Grid container>
        <Grid container sx={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
          <Grid size={{ xs: 'grow', sm: 3.5, md: 3.5, lg: 3, xl: 2.5 }}>
            <MUISearch
              sx={{
                width: {
                  xs: '100%',
                  sm: '250px'
                }
              }}
              placeholder='Search...'
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
              onClear={handleSearchClear}
              value={searchValue}
            />
          </Grid>
          <Grid>
            <ExportButton onClick={handleExport} loading={loading || exportLoading} disabled={total === 0} bgcolor='' />
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
        <AddPurposeOfAnaesthesiaDrawer
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
  )
}

export default PurposeOfAnaesthesia
