import { Box, Grid, IconButton, Tooltip, Typography, useTheme } from '@mui/material'
import { debounce, DebouncedFunc } from 'lodash'
import Router, { useRouter } from 'next/router'
import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { AddButtonContained } from 'src/components/ButtonContained'
import { getAssessmentResponseType, getAssessmentTypesList } from 'src/lib/api/report'
import MUISearch from 'src/views/forms/form-fields/MUISearch'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
import Icon from 'src/@core/components/icon'
import { ExportButton } from 'src/views/utility/render-snippets'
import Utility from 'src/utility'
import toast from 'react-hot-toast'
import { addAssessmentMasters, updateAssessmentMasters } from 'src/lib/api/medical/masters'
import AddMonitorDrawer from 'src/views/pages/masters/AddMonitorDrawer'
import { GridSortModel, GridPaginationModel, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { Theme } from '@mui/material/styles'
import { NextPage } from 'next'
import { ChangeEvent, ReactNode } from 'react'

// Types and Interfaces
interface MonitorRow {
  assessment_type_id?: number | string
  assessments_type_label?: string
  active?: string
  description?: string
  response_type?: string
  assessment_category_id?: number | string
  measurement_type?: string
  default_values?: any
  already_in_use?: boolean
  sl_no?: number
  [key: string]: any
}

interface IndexedMonitorRow extends MonitorRow {
  sl_no: number
  id: number | string
}

interface ApiResponse {
  success?: boolean
  message?: string | Record<string, string[]>
  data?: {
    result?: MonitorRow[]
    total_count?: number
  }
}

interface Option {
  label: string
  key: string
}

interface EditParams {
  assessment_type_id?: number | string | null
  assessment_name?: string | null
  status?: string
  description?: string | null
  response_type?: Option | null
  assessment_category_id?: number | string | null
  measurement_type?: string | null
  list_values?: any
}

interface Payload {
  assessment_type_id?: number | string | null
  assessment_name?: string | null
  active?: number
  description?: string | null
  response_type?: string | null
  assessment_category_id?: number | string | null
  measurement_type?: string | null
  list_values?: any
}

interface Filters {
  page: number
  limit: number
  q: string
  sort: 'asc' | 'desc'
  sortColumn: string
}

interface CategoryProps {
  assessment_category_id?: string | number | null
  label?: string | null
}

const AddMonitorCategory: NextPage = () => {
  const router = useRouter()
  const { id, label } = router.query
  const theme: Theme = useTheme()

  // State
  const [rows, setRows] = useState<MonitorRow[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [searchValue, setSearchValue] = useState<string>('')
  const [total, setTotal] = useState<number>(0)
  const [exportLoading, setExportLoading] = useState<boolean>(false)

  // Filters state
  const [filters, setFilters] = useState<Filters>({
    page: 1,
    limit: 50,
    q: '',
    sort: 'asc',
    sortColumn: 'assessments_type_label'
  })

  // Options state
  const [responseTypeOption, setResponseTypeOption] = useState<Option[]>([])
  const [measurementTypeOptions, setMeasurementTypeOption] = useState<Option[]>([])

  // Drawer state
  const editParamsInitialState: EditParams = {
    assessment_type_id: null,
    assessment_name: '',
    status: '1',
    description: '',
    response_type: null,
    assessment_category_id: id ? String(id) : null,
    measurement_type: null,
    list_values: null
  }
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
      sortColumn = 'assessments_type_label'
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

  // Fetch response types
  const fetchResponseTypes = useCallback(async (): Promise<void> => {
    try {
      const response = await getAssessmentResponseType({})

      if (response.data?.response_type) {
        const options: Option[] = response.data.response_type.map((item: any) => ({
          label: item.label,
          key: item.key
        }))
        setResponseTypeOption(options)
      }

      if (response.data?.measurement_types) {
        const options: Option[] = response.data.measurement_types.map((item: any) => ({
          label: item.label,
          key: item.key
        }))
        setMeasurementTypeOption(options)
      }
    } catch (error) {
      console.error('Error fetching response types:', error)
    }
  }, [])

  useEffect(() => {
    fetchResponseTypes()
  }, [fetchResponseTypes])

  const fetchTableData = useCallback(async (): Promise<void> => {
    if (!id) return

    try {
      setLoading(true)

      const params = {
        cat_id: id,
        sort: filters.sort,
        q: filters.q,
        column: filters.sortColumn,
        page_no: filters.page,
        limit: filters.limit,
        status: 'all'
      }

      const res: ApiResponse = await getAssessmentTypesList(params)

      if (res?.success) {
        setRows(res?.data?.result || [])
        setTotal(parseInt(String(res?.data?.total_count || '0'), 10))
      }
    } catch (error) {
      console.error('Error fetching monitor data:', error)
    } finally {
      setLoading(false)
    }
  }, [id, filters.page, filters.limit, filters.q, filters.sort, filters.sortColumn])

  useEffect(() => {
    if (id) {
      fetchTableData()
    }
  }, [fetchTableData, id])

  const updateUrlParams = (updatedFilters: Filters): void => {
    const params = new URLSearchParams()
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value.toString())
      }
    })
    // Preserve id and label in URL
    if (id) params.set('id', id as string)
    if (label) params.set('label', label as string)

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
        page: 1
      }
      setFilters(updated)
      updateUrlParams(updated)
    }
  }

  const handleEdit = (row: MonitorRow): void => {
    const matchedResponseType = responseTypeOption?.find(option => option.key === row.response_type)

    setEditParams({
      assessment_type_id: row.assessment_type_id,
      assessment_name: row.assessments_type_label,
      status: row.active || '1',
      description: row.description || '',
      assessment_category_id: row.assessment_category_id || (id ? String(id) : null),
      measurement_type: row.measurement_type,
      list_values: row.default_values,
      response_type: matchedResponseType ? { label: matchedResponseType.label, key: matchedResponseType.key } : null
    })
    setOpenDrawer(true)
    setResetForm(false) // Set to false for edit mode
  }

  const handleSubmitData = async (payload: Payload): Promise<void> => {
    try {
      setLoading(true)
      setSubmitLoader(true)

      let response: ApiResponse
      if (payload.assessment_type_id) {
        response = await updateAssessmentMasters(payload)
      } else {
        response = await addAssessmentMasters(payload)
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
      console.error('Error submitting form:', e)
      setSubmitLoader(false)
    } finally {
      setSubmitLoader(false)
      setLoading(false)
    }
  }

  const handleExport = async (): Promise<void> => {
    const params = {
      q: filters.q,
      sort: filters.sort,
      column: filters.sortColumn,
      response_type: 'csv',
      cat_id: id,
      status: 'all'
    }

    try {
      setExportLoading(true)
      const response: ApiResponse = await getAssessmentTypesList(params)
      if (response?.success && response?.data) {
        Utility.downloadFileFromURL(response.data)
        toast.success('Export completed successfully')
      }
    } catch (error) {
      console.error('Error exporting data:', error)
      toast.error('Failed to export data')
    } finally {
      setExportLoading(false)
    }
  }

  const getSlNo = (index: number): number => (filters.page - 1) * filters.limit + index + 1

  const indexedRows: IndexedMonitorRow[] = rows.map((row, index) => ({
    ...row,
    id: row.assessment_type_id || index,
    sl_no: getSlNo(index)
  }))

  const columns: GridColDef<IndexedMonitorRow>[] = [
    {
      minWidth: 100,
      flex: 0.1,
      field: 'sl_no',
      headerName: 'SL.NO',
      sortable: false,
      renderCell: (params: GridRenderCellParams<IndexedMonitorRow>): ReactNode => (
        <Typography variant='body2' sx={{ color: theme.palette.customColors?.customHeadingTextColor, pl: '10px' }}>
          {params.row.sl_no}.
        </Typography>
      )
    },
    {
      minWidth: 350,
      flex: 0.3,
      field: 'assessments_type_label',
      headerName: 'NAME',
      sortable: true,
      renderCell: (params: GridRenderCellParams<IndexedMonitorRow>): ReactNode => (
        <Tooltip title={params.row.assessments_type_label || ''}>
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
            {params.row.assessments_type_label}
          </Typography>
        </Tooltip>
      )
    },
    {
      minWidth: 120,
      flex: 0.15,
      field: 'active',
      headerName: 'STATUS',
      sortable: true,
      renderCell: (params: GridRenderCellParams<IndexedMonitorRow>): ReactNode => (
        <Typography
          variant='body2'
          sx={{
            fontSize: '14px',
            fontWeight: 500,
            color: theme.palette.customColors?.customHeadingTextColor,
            pl: '6px'
          }}
        >
          {params.row.active === '1' ? 'Active' : 'Inactive'}
        </Typography>
      )
    },
    {
      minWidth: 150,
      flex: 0.15,
      field: 'action',
      headerName: 'Action',
      sortable: false,
      renderCell: (params: GridRenderCellParams<IndexedMonitorRow>): ReactNode => (
        <Box>
          {params?.row?.already_in_use !== true && (
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
      title='Add Monitoring'
      action={() => {
        // Reset to initial state for add mode
        setEditParams({
          assessment_type_id: null,
          assessment_name: '',
          status: '1',
          description: '',
          response_type: null,
          assessment_category_id: id ? String(id) : null,
          measurement_type: null,
          list_values: null
        })
        setOpenDrawer(true)
        setResetForm(true) // Set to true for add mode
      }}
      fullWidth='fullWidth'
      styles={{
        margin: 0
      }}
      disabled={false}
    />
  )

  const categoryProps: CategoryProps = {
    assessment_category_id: id ? String(id) : null,
    label: label ? String(label) : null
  }

  return (
    <PageCardLayout
      title={label?.toString() || 'Monitor'}
      action={headerAction}
      showIcon={true}
      onIconClick={() => Router.back()}
    >
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

        <AddMonitorDrawer
          drawerWidth={500}
          addEventSidebarOpen={openDrawer}
          responseTypeOption={responseTypeOption}
          handleSidebarClose={() => {
            setOpenDrawer(false)
            setResetForm(true)
          }}
          editParams={editParams}
          resetForm={resetForm}
          handleSubmitData={handleSubmitData}
          category={categoryProps}
          measurementTypeOptions={measurementTypeOptions}
          submitLoader={submitLoader}
        />
      </Grid>
    </PageCardLayout>
  )
}

export default AddMonitorCategory
