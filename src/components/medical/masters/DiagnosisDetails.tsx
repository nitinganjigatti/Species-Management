'use client'

import { Box, Button, Grid, IconButton, Tooltip, Typography, debounce } from '@mui/material'
import Icon from 'src/@core/components/icon'
import { useCallback, useEffect, useState } from 'react'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import {
  addMedicalComplaintOrDiagnosis,
  getMedicalCategoryListById,
  updateMedicalCategoryDiagnosis
} from 'src/lib/api/medical/masters'
import toast from 'react-hot-toast'
import Toaster from 'src/components/Toaster'
import { useAuth } from 'src/hooks/useAuth'
import AddCategories from 'src/views/pages/medical/AddCategories'
import Error404 from 'src/pages/404'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
import MUISearch from 'src/views/forms/form-fields/MUISearch'
import { ExportButton } from 'src/views/utility/render-snippets'
import Utility from 'src/utility'
import DynamicBreadcrumbs from 'src/views/utility/DynamicBreadcrumbs'
import type { GridSortModel, GridRenderCellParams } from '@mui/x-data-grid'

interface DiagnosisRow {
  id: number | string
  med_cat_id?: number | string
  label?: string
  zoo_id?: number | string
  can_edit?: number
  sl_no?: number
  [key: string]: any
}

interface IndexedDiagnosisRow extends DiagnosisRow {
  sl_no: number
}

interface EditParams {
  med_cat_id: number | string | null
  id?: number | string | null
  label: string | null
  type: string | null
  key: string | null
}

interface ApiResponse {
  success?: boolean
  message?: string | Record<string, string[]>
  data?: any
}

const DiagnosisDetails = () => {
  const theme = useTheme()
  const router = useRouter()
  const routeParams = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const id = routeParams?.id
  const label = searchParams?.get('label') || ''
  const authData = useAuth() as any
  const { t } = useTranslation()

  const [openDrawer, setOpenDrawer] = useState<boolean>(false)
  const [searchValue, setSearchValue] = useState<string>('')
  const [sort, setSort] = useState<'asc' | 'desc'>('desc')
  const [sortColumn, setSortColumn] = useState<string>('label')
  const [total, setTotal] = useState<number>(0)
  const [rows, setRows] = useState<DiagnosisRow[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [paginationModel, setPaginationModel] = useState<{ page: number; pageSize: number }>({ page: 0, pageSize: 10 })
  const editParamsInitialState: EditParams = { med_cat_id: null, label: null, type: null, key: null }
  const [editParams, setEditParams] = useState<EditParams>(editParamsInitialState)
  const [resetForm, setResetForm] = useState<boolean>(false)
  const [submitLoader, setSubmitLoader] = useState<boolean>(false)
  const [type, setType] = useState<string>('')
  const [exportLoading, setExportLoading] = useState<boolean>(false)

  function loadServerRows(_currentPage: number, data: DiagnosisRow[]): DiagnosisRow[] {
    return data
  }

  const zoo_id = authData?.userData?.user?.zoos?.[0]?.zoo_id
  const diagnosis_permission = authData?.userData?.permission?.user_settings?.medical_add_diagnosis

  const fetchTableData = useCallback(
    async (q?: string) => {
      try {
        setLoading(true)

        const apiParams = {
          q,
          sort,
          columns: sortColumn,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize
        }

        await getMedicalCategoryListById(id, apiParams).then((res: ApiResponse) => {
          setType(res?.data?.type)
          setTotal(parseInt(res?.data?.total))
          setRows(loadServerRows(paginationModel.page, res?.data?.list))
        })
        setResetForm(true)
        setLoading(false)
      } catch (e) {
        setLoading(false)
      }
    },
    [paginationModel, sort, sortColumn, id]
  )

  const handleExport = async ({ q = searchValue }: { q?: string } = {}) => {
    const apiParams = {
      q,
      sort,
      columns: sortColumn,
      page: paginationModel.page + 1,
      limit: paginationModel.pageSize,
      response_type: 'csv'
    }
    try {
      setExportLoading(true)
      const response = (await getMedicalCategoryListById(id, apiParams)) as ApiResponse
      if (response?.success && response?.data) {
        Utility.downloadFileFromURL(response.data)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setExportLoading(false)
    }
  }

  useEffect(() => {
    if (diagnosis_permission && id) {
      fetchTableData(searchValue)
    }
  }, [fetchTableData])

  const handleSortModel = (newModel: GridSortModel) => {
    if (newModel.length) {
      setSort(newModel[0].sort as 'asc' | 'desc')
      setSortColumn(newModel[0].field)
    }
  }

  const searchTableData = useCallback(
    debounce(async (_sort: string, q: string, _column: string) => {
      setSearchValue(q)
      try {
        await fetchTableData(q)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSearch = (value: string) => {
    setSearchValue(value)
    searchTableData(sort, value, sortColumn)
  }

  const addEventSidebarOpen = () => {
    setEditParams({ med_cat_id: null, label: null, type: null, key: null })
    setResetForm(true)
    setOpenDrawer(true)
  }

  const handleSubmitData = async (formParams: { label?: string }) => {
    const payload = {
      label: formParams?.label,
      category_id: id
    }

    try {
      setSubmitLoader(true)
      let response: ApiResponse
      if (editParams?.med_cat_id !== null) {
        response = await updateMedicalCategoryDiagnosis(editParams?.id, payload)
      } else {
        response = await addMedicalComplaintOrDiagnosis(type, payload)
      }
      if (response?.success) {
        Toaster({ type: 'success', message: response?.message })
        setResetForm(true)
        setSubmitLoader(false)
        setOpenDrawer(false)
        await fetchTableData()
      } else {
        Toaster({ type: 'error', message: response?.message })
        setSubmitLoader(false)
      }
    } catch (e) {
      setSubmitLoader(false)
      toast.error(JSON.stringify(e))
    }
  }

  const handleEdit = async (event: React.MouseEvent, row: DiagnosisRow) => {
    event.stopPropagation()
    setResetForm(true)
    setEditParams(row as unknown as EditParams)
    setOpenDrawer(true)
  }

  const columns = [
    {
      width: 120,
      field: 'id',
      headerName: t('medical_module.no_header'),
      align: 'center' as const,
      headerAlign: 'center' as const,
      sortable: false,
      renderCell: (p: GridRenderCellParams<IndexedDiagnosisRow>) => <Typography>{p.row.sl_no}</Typography>
    },
    {
      width: 350,
      field: 'label',
      headerName: t('medical_module.diagnosis_header'),
      align: 'left' as const,
      renderCell: (p: GridRenderCellParams<IndexedDiagnosisRow>) => (
        <Tooltip title={p.row.label}>
          <Typography noWrap>{p.row.label}</Typography>
        </Tooltip>
      )
    },
    {
      width: 150,
      field: 'Action',
      headerName: t('medical_module.action_column'),
      sortable: false,
      renderCell: (p: GridRenderCellParams<IndexedDiagnosisRow>) => (
        <>
          {p.row.zoo_id === zoo_id && p?.row?.can_edit === 1 ? (
            <Box>
              <IconButton size='small' sx={{ mr: 0.5 }} onClick={e => handleEdit(e, p.row)} aria-label='Edit'>
                <Icon icon='mdi:pencil-outline' />
              </IconButton>
            </Box>
          ) : null}
        </>
      )
    }
  ]

  const handleCellClick = (_p: GridRenderCellParams<IndexedDiagnosisRow>) => {
    // no-op
  }

  const headerAction = (
    <div>
      <Button size='medium' variant='contained' onClick={() => addEventSidebarOpen()}>
        <Icon icon='mdi:add' fontSize={20} />
        &nbsp; {t('add_new')}
      </Button>
    </div>
  )

  const getSlNo = (index: number) => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows: IndexedDiagnosisRow[] = rows?.map((row, index) => ({
    ...row,
    id: row.id,
    sl_no: getSlNo(index)
  }))

  return (
    <>
      {diagnosis_permission ? (
        <>
          <DynamicBreadcrumbs
            pageItems={[
              { title: t('medical_module.medical') },
              { title: t('medical_module.category'), onClick: () => router.back() },
              { title: label }
            ]}
          />
          <PageCardLayout title={label || t('medical_module.diagnosis_list')} action={headerAction}>
            <Grid container>
              <Grid container sx={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <Grid size={{ xs: 'grow', sm: 3.5, md: 3.5, lg: 3, xl: 2.5 }}>
                  <MUISearch
                    sx={{ width: { xs: '100%', sm: '250px' } }}
                    placeholder={`${t('search')}...`}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
                    onClear={() => handleSearch('')}
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
                  indexedRows={indexedRows === undefined ? [] : indexedRows}
                  total={total}
                  columns={columns}
                  paginationModel={paginationModel}
                  handleSortModel={handleSortModel}
                  setPaginationModel={setPaginationModel}
                  pageSizeOptions={[7, 10, 30, 50]}
                  loading={loading}
                  searchValue={searchValue}
                  handleSearch={handleSearch}
                  onCellClick={handleCellClick}
                  columnVisibilityModel={{ sl_no: false }}
                />
              </Grid>
            </Grid>
          </PageCardLayout>

          {openDrawer && (
            <AddCategories
              openDrawer={openDrawer}
              setOpenDrawer={setOpenDrawer}
              loading={submitLoader}
              editParams={editParams}
              resetForm={resetForm}
              handleSubmitData={handleSubmitData}
              type='diagnosis'
            />
          )}
        </>
      ) : (
        <Error404 />
      )}
    </>
  )
}

export default DiagnosisDetails
