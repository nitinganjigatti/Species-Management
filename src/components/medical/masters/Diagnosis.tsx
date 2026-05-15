'use client'

import { Box, Button, Grid, IconButton, Tooltip, Typography, debounce } from '@mui/material'
import Icon from 'src/@core/components/icon'
import { useCallback, useEffect, useState } from 'react'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { useRouter } from 'next/navigation'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import { addMedicalCategory, getCategoriesList, updateMedicalCategory } from 'src/lib/api/medical/masters'
import toast from 'react-hot-toast'
import Toaster from 'src/components/Toaster'
import { useAuth } from 'src/hooks/useAuth'
import AddCategories from 'src/views/pages/medical/AddCategories'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
import MUISearch from 'src/views/forms/form-fields/MUISearch'
import DynamicBreadcrumbs from 'src/views/utility/DynamicBreadcrumbs'
import type { GridSortModel, GridRenderCellParams } from '@mui/x-data-grid'

interface DiagnosisRow {
  med_cat_id: number | string
  label?: string
  type?: string | null
  key?: string | null
  zoo_id?: number | string
  sl_no?: number
  [key: string]: any
}

interface IndexedDiagnosisRow extends DiagnosisRow {
  id: number | string
  sl_no: number
}

interface EditParams {
  med_cat_id: number | string | null
  label: string | null
  type: string | null
  key: string | null
}

interface ApiResponse {
  success?: boolean
  message?: string | Record<string, string[]>
  data?: any
}

const Diagnosis = () => {
  const theme = useTheme()
  const router = useRouter()
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

  function loadServerRows(_currentPage: number, data: DiagnosisRow[]): DiagnosisRow[] {
    return data
  }

  const zoo_id = authData?.userData?.user?.zoos?.[0]?.zoo_id
  const diagnosis_permission = authData?.userData?.permission?.user_settings?.medical_add_diagnosis

  const fetchTableData = useCallback(
    async (q?: string) => {
      try {
        setLoading(true)

        const params = {
          type: 'diagnosis',
          q
        }

        await getCategoriesList({ params: params }).then((res: ApiResponse) => {
          setTotal(parseInt(res?.data?.total_count))
          setRows(loadServerRows(paginationModel.page, res?.data))
        })
        setResetForm(true)
        setLoading(false)
      } catch (e) {
        setLoading(false)
      }
    },
    [paginationModel]
  )

  useEffect(() => {
    if (diagnosis_permission) {
      fetchTableData(searchValue)
    }
  }, [fetchTableData])

  const handleSortModel = (newModel: GridSortModel) => {
    if (newModel.length) {
      setSort(newModel[0].sort as 'asc' | 'desc')
      setSortColumn(newModel[0].field)
      fetchTableData(searchValue)
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

  const handleSubmitData = async (params: { label?: string }) => {
    const payload = {
      label: params?.label,
      type: 'diagnosis'
    }
    try {
      setSubmitLoader(true)
      let response: ApiResponse
      if (editParams?.med_cat_id !== null) {
        response = await updateMedicalCategory(editParams?.med_cat_id, payload)
      } else {
        response = await addMedicalCategory(payload)
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
      console.log(e)
      setSubmitLoader(false)
      toast.error(JSON.stringify(e))
    }
  }

  const handleEdit = async (event: React.MouseEvent, row: DiagnosisRow) => {
    event.stopPropagation()
    setResetForm(true)
    setEditParams({
      med_cat_id: row.med_cat_id,
      label: row.label ?? null,
      type: row.type ?? null,
      key: row.key ?? null
    })
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
      renderCell: (params: GridRenderCellParams<IndexedDiagnosisRow>) => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '12px',
            fontWeight: 400,
            lineHeight: '14.52px'
          }}
        >
          {params.row.sl_no}
        </Typography>
      )
    },
    {
      flex: 1,
      minWidth: 350,
      sortable: false,
      field: 'Category',
      headerName: t('medical_module.category_column'),
      align: 'left' as const,
      renderCell: (params: GridRenderCellParams<IndexedDiagnosisRow>) => (
        <Tooltip title={params.row.label}>
          <Typography
            noWrap
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: 400,
              lineHeight: '19.36px'
            }}
          >
            {params.row.label}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 1,
      minWidth: 150,
      field: 'Action',
      headerName: t('medical_module.action_column'),
      renderCell: (params: GridRenderCellParams<IndexedDiagnosisRow>) => (
        <>
          {params.row.zoo_id === zoo_id ? (
            <Box>
              <IconButton size='small' sx={{ mr: 0.5 }} onClick={e => handleEdit(e, params.row)} aria-label='Edit'>
                <Icon icon='mdi:pencil-outline' />
              </IconButton>
            </Box>
          ) : null}
        </>
      )
    }
  ]

  const handleCellClick = (params: GridRenderCellParams<IndexedDiagnosisRow>) => {
    const { id, label } = params.row
    const query = label ? `?label=${encodeURIComponent(label)}` : ''
    router.push(`/medical/masters/diagnosis/${id}${query}`)
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
    id: row.med_cat_id,
    sl_no: getSlNo(index)
  }))

  return (
    <>
      <DynamicBreadcrumbs
        pageItems={[{ title: t('medical_module.medical') }, { title: t('medical_module.category') }]}
      />

      <PageCardLayout title={t('medical_module.category_list')} action={headerAction}>
        <Grid container>
          <Grid container size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <Grid size={{ xs: 'grow', sm: 3.5, md: 3.5, lg: 3, xl: 2.5 }}>
              <MUISearch
                sx={{ width: { xs: '100%', sm: '250px' } }}
                placeholder={`${t('search')}...`}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
                onClear={() => handleSearch('')}
                value={searchValue}
              />
            </Grid>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <CommonTable
              indexedRows={indexedRows === undefined ? [] : indexedRows}
              total={total}
              columns={columns}
              handleSortModel={handleSortModel}
              loading={loading}
              searchValue={searchValue}
              handleSearch={handleSearch}
              onCellClick={handleCellClick}
              hideFooterPagination={true}
              disablePagination={true}
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
          type='category'
        />
      )}
    </>
  )
}

export default Diagnosis
