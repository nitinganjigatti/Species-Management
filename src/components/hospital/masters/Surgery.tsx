'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'

import AddIcon from '@mui/icons-material/Add'
import {
  Box,
  Button,
  Card,
  CardHeader,
  IconButton,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { debounce } from 'lodash'
import useSafeRouter from 'src/hooks/useSafeRouter'

import Icon from 'src/@core/components/icon'
import CustomChip from 'src/@core/components/mui/chip'
import Toaster from 'src/components/Toaster'
import ConfirmationDialog from 'src/components/confirmation-dialog'

import CommonTable from 'src/views/table/data-grid/CommonTable'
import Search from 'src/views/utility/Search'
import AddEditSurgeryDrawer from 'src/views/pages/hospital/masters/surgery'
import DynamicBreadcrumbs from 'src/views/utility/DynamicBreadcrumbs'

import {
  addSurgeryMaster,
  deleteSurgeryMaster,
  getSurgeryMaster,
  updateSurgeryMaster
} from 'src/lib/api/hospital/surgeryMaster'
import { GridPaginationModel, GridRenderCellParams, GridColDef } from '@mui/x-data-grid'
import type { ApiError } from 'src/types/hospital/api'
import { SurgeryResponse, SurgeryFilters, AddUpdateSurgeryPayload, SurgeryFilter } from 'src/types/hospital/api/Masters/surgery'
import type { VisitTypeReason, SurgeryModel } from 'src/types/hospital/models'

const resolveBooleanStatus = (value: string | number | boolean) => {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()

    return normalized === '1' || normalized === 'true' || normalized === 'active'
  }

  return value === 1 || value === true
}

const Surgery = () => {
  const { t } = useTranslation()
  const theme = useTheme()
  const router = useSafeRouter()

  const [searchValue, setSearchValue] = useState<string>('')
  const [selectedVisitType, setSelectedVisitType] = useState<VisitTypeReason>('')

  const [filters, setFilters] = useState<SurgeryFilters>({
    page: 1,
    limit: 10,
    q: ''
  })
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false)
  const [submitLoader, setSubmitLoader] = useState<boolean>(false)
  const [selectedSurgery, setSelectedSurgery] = useState<SurgeryModel | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false)
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false)
  const [surgeryToDelete, setSurgeryToDelete] = useState<SurgeryModel | null>(null)

  const safeParseToInt = (value: string, fallback: number) => {
    const parsed = parseInt(value, 10)

    return Number.isNaN(parsed) ? fallback : parsed
  }

  useEffect(() => {
    if (!router.isReady) return

    const { page = '1', limit = '10', q = '', visit_type: visitTypeQuery = '' } = router.query as any

    const safePage = Array.isArray(page) ? page[0] : page
    const safeLimit = Array.isArray(limit) ? limit[0] : limit
    const safeQuery = Array.isArray(q) ? q[0] : q
    const safeVisitType = Array.isArray(visitTypeQuery) ? visitTypeQuery[0] : visitTypeQuery

    setFilters({
      page: safeParseToInt(safePage || '1', 1),
      limit: safeParseToInt(safeLimit || '10', 10),
      q: safeQuery || ''
    })

    setSearchValue(safeQuery || '')
    setSelectedVisitType(safeVisitType || '')
  }, [router.isReady, router.query])

  const updateUrlParams = useCallback(
    (updatedFilters: SurgeryFilters, visitTypeValue: string = selectedVisitType) => {
      const params = new URLSearchParams()

      Object.entries(updatedFilters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          params.set(key, String(value))
        }
      })

      if (visitTypeValue) {
        params.set('visit_type', visitTypeValue)
      }

      const queryString = params.toString()
      router.push(`${router.pathname}?${queryString}`)
    },
    [router, selectedVisitType]
  )

  const handlePaginationChange = useCallback(
    (model: GridPaginationModel) => {
      const updated = {
        ...filters,
        page: model.page + 1,
        limit: model.pageSize
      }
      setFilters(updated)
      updateUrlParams(updated)
    },
    [filters, updateUrlParams]
  )

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        const updated = {
          ...filters,
          q: value,
          page: 1
        }
        setFilters(updated)
        updateUrlParams(updated)
      }, 500),
    [filters, updateUrlParams]
  )

  const handleSearch = useCallback(
    (value: string) => {
      setSearchValue(value)
      debouncedSearch(value)
    },
    [debouncedSearch]
  )

  const handleSearchClear = () => {
    setSearchValue('')
    debouncedSearch('')
  }

  const handleAddSurgery = useCallback(() => {
    setSelectedSurgery(null)
    setDrawerOpen(true)
  }, [])

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false)
    setSelectedSurgery(null)
  }, [])

  const resolveSurgeryId = useCallback((row: SurgeryModel | null) => {
    if (!row) return null

    return row?.id ?? row?.surgery_id ?? row?.master_surgery_id ?? row?.surgeryId ?? null
  }, [])

  const handleEditSurgery = useCallback((row: SurgeryModel) => {
    setSelectedSurgery(row)
    setDrawerOpen(true)
  }, [])

  const handleDeletePrompt = useCallback((row: SurgeryModel) => {
    setSurgeryToDelete(row)
    setDeleteDialogOpen(true)
  }, [])

  const handleCloseDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false)
    setDeleteLoading(false)
    setSurgeryToDelete(null)
  }, [])

  const {
    data: surgeryResponse,
    isFetching,
    refetch
  } = useQuery<SurgeryResponse>({
    queryKey: ['hospital-surgery-master', filters, selectedVisitType],
    queryFn: () =>
      getSurgeryMaster({
        params: {
          page_no: filters.page ?? '',
          limit: filters.limit ?? '',
          q: filters.q,
          visit_type: selectedVisitType
        }
      }),
    keepPreviousData: true,
    staleTime: 60 * 1000
  } as any)

  
  const dataPayload: SurgeryResponse  = surgeryResponse?.data ?? {}

  const rawRows = useMemo(() => {
    if (Array.isArray(dataPayload)) {
      return dataPayload
    }
    const payload = dataPayload as Record<string, unknown>

    const possibleKeys = ['records', 'data', 'surgeries', 'surgery', 'items', 'list']
    for (const key of possibleKeys) {
      if (Array.isArray(payload?.[key])) {
        return payload[key]
      }
    }

    return []
  }, [dataPayload])

  const total = useMemo(() => {
    if (typeof dataPayload?.total === 'number')
    return dataPayload.total
    if (typeof dataPayload?.count === 'number') return dataPayload.count
    if (typeof dataPayload?.total_records === 'number') return dataPayload.total_records
    if (typeof dataPayload?.totalCount === 'number') return dataPayload.totalCount
    if (typeof dataPayload?.pagination?.total === 'number') return dataPayload.pagination.total

    return rawRows.length
  }, [dataPayload, rawRows.length])

  const getSlNo = useCallback((index: number) => ((filters.page ?? 1) - 1) *  (filters.limit ?? 10)  + index + 1, [filters.limit, filters.page])

  const indexedRows = useMemo(
    () =>
      rawRows.map((row: SurgeryModel & Record<string, unknown>, index: number) => {
        const resolvedId =
          row?.id ??
          row?.surgery_id ??
          row?.master_surgery_id ??
          row?.surgeryId ??
          `${row?.name ?? row?.surgery_name ?? 'surgery'}-${index}`

        return {
          ...row,
          id: resolvedId,
          sl_no: getSlNo(index),
          display_name: row?.name ?? row?.surgery_name ?? row?.title ?? '',
          display_description: row?.description ?? row?.surgery_description ?? row?.details ?? '',
          status_value: row?.status ?? row?.active ?? row?.is_active ?? row?.isActive
        }
      }),
    [getSlNo, rawRows]
  )

  const handleSubmitSurgery = useCallback(
    async (values: AddUpdateSurgeryPayload) => {
      setSubmitLoader(true)
      const payload = new FormData()
      const surgeryName = values?.surgery_name?.trim() || ''
      const description = values?.description?.trim() || ''
      const status = values?.status ? t('hospital_module.active') : t('hospital_module.inactive')

      payload.append('surgery_name', surgeryName)
      payload.append('description', description)
      payload.append('status', status)

      const surgeryId = resolveSurgeryId(selectedSurgery)

      try {
        const response = surgeryId ? await updateSurgeryMaster(surgeryId, (payload as AddUpdateSurgeryPayload)) : await addSurgeryMaster((payload as AddUpdateSurgeryPayload))

        if (response?.success) {
          Toaster({
            type: 'success',
            message: response?.message || (surgeryId ? t('hospital_module.surgery_updated_successfully') : t('hospital_module.surgery_created_successfully'))
          })
          refetch()
          handleCloseDrawer()
        } else {
          Toaster({ type: 'error', message: response?.message || t('hospital_module.something_went_wrong') })
        }
      } catch (error: unknown) {
        const err = error as ApiError
        console.error(err)
        Toaster({ type: 'error', message: err?.message || 'An unexpected error occurred' })
      } finally {
        setSubmitLoader(false)
      }
    },
    [handleCloseDrawer, refetch, resolveSurgeryId, selectedSurgery]
  )

  const handleConfirmDelete = useCallback(async () => {
    const surgeryId = resolveSurgeryId(surgeryToDelete)
    if (!surgeryId) {
      handleCloseDeleteDialog()

      return
    }

    setDeleteLoading(true)
    try {
      const response = await deleteSurgeryMaster(surgeryId)
      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || t('hospital_module.surgery_deleted_successfully') })
        refetch()
        handleCloseDeleteDialog()
      } else {
        Toaster({ type: 'error', message: response?.message || t('hospital_module.failed_to_delete_surgery') })
        setDeleteLoading(false)
      }
    } catch (error: unknown) {
      const err = error as ApiError
      Toaster({ type: 'error', message: err?.message || t('hospital_module.an_unexpected_error_occurred')  })
      setDeleteLoading(false)
    }
  }, [handleCloseDeleteDialog, refetch, resolveSurgeryId, surgeryToDelete])

  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: 'sl_no',
        headerName: t('hospital_module.sl_no') ?? '',
        minWidth: 80,
        width: 80,
        align: 'center',
        sortable: false,
        renderCell: (params: GridRenderCellParams) => (
          <Typography
            sx={{
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: 500,
              lineHeight: '100%',
              letterSpacing: '0.1px',
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            {params.row.sl_no}
          </Typography>
        )
      },
      {
        field: 'display_name',
        headerName: t('hospital_module.name_of_surgery') ?? '',
        minWidth: 220,
        flex: 1,
        sortable: false,
        renderCell: (params: GridRenderCellParams) => (
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: 400,
              lineHeight: '100%',
              letterSpacing: '0'
            }}
          >
            {params.row.display_name || '-'}
          </Typography>
        )
      },
      {
        field: 'display_description',
        headerName: t('hospital_module.description') ?? '',
        minWidth: 320,
        flex: 2,
        sortable: false,
        renderCell: (params: GridRenderCellParams) => (
          <Tooltip
            title={params.row.display_description || '-'}
            placement='top-start'
            slotProps={{
              tooltip: {
                sx: {
                  backgroundColor: theme.palette.customColors.OnPrimaryContainer,
                  color: theme.palette.primary.contrastText,
                  boxShadow: '8px -1px 24px 0px #00000014'
                }
              },
              arrow: {
                sx: {
                  color: theme.palette.customColors.OnPrimaryContainer
                }
              }
            }}
            arrow
          >
            <Typography
              sx={{
                color: theme.palette.customColors.OnSurfaceVariant,
                fontSize: '16px',
                fontWeight: 400,
                lineHeight: '100%',
                letterSpacing: '0',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {params.row.display_description || '-'}
            </Typography>
          </Tooltip>
        )
      },
      {
        field: 'status_value',
        headerName: t('hospital_module.status') ?? '',
        minWidth: 150,
        sortable: false,
        renderCell: (params: GridRenderCellParams) => {
          const isActive = resolveBooleanStatus(params.row.status_value)

          return (
            <CustomChip
              skin='light'
              size='small'
              label={isActive ? t('hospital_module.active') : t('hospital_module.inactive')}
              color={isActive ? 'success' : 'error'}
              sx={{
                height: 20,
                fontWeight: 600,
                borderRadius: '16px',
                fontSize: '0.75rem',
                textTransform: 'capitalize',
                '& .MuiChip-label': { mt: -0.25 }
              }}
            />
          )
        }
      },
      {
        field: 'actions',
        headerName: '',
        sortable: false,
        minWidth: 80,
        width: 80,
        align: 'right',
        headerAlign: 'right',
        renderCell: (params: GridRenderCellParams) => (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0 }}>
            <Tooltip title={(t('edit') as string)}>
              <IconButton size='small' onClick={() => handleEditSurgery(params.row)}>
                <Icon color={theme.palette.customColors.OnSurfaceVariant} icon='mdi:pencil-outline' />
              </IconButton>
            </Tooltip>
            {/* <Tooltip title='Delete'>
              <IconButton size='small' onClick={() => handleDeletePrompt(params.row)}>
                <Icon color={theme.palette.customColors.OnSurfaceVariant} icon='mdi:delete-outline' />
              </IconButton>
            </Tooltip> */}
          </Box>
        )
      }
    ],
    [handleDeletePrompt, handleEditSurgery, theme, t]
  )

  return (
    <>
      <DynamicBreadcrumbs
        pageItems={[{ title: 'Hospital' }, { title: 'Masters' }, { title: 'Surgery' }]}
        sx={{ mb: 6, color: theme.palette.customColors.neutralSecondary }}
      />

      <Card sx={{ p: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <CardHeader
          sx={{ p: 0 }}
          title={
            <Typography
              sx={{
                color: theme.palette.customColors.OnSurfaceVariant,
                fontSize: '24px',
                fontWeight: 500,
                lineHeight: '100%',
                letterSpacing: 0
              }}
            >
              {t('hospital_module.surgery_master')}
            </Typography>
          }
          action={
            <Button
              variant='contained'
              startIcon={<AddIcon />}
              sx={{ py: 2, borderRadius: '4px' }}
              onClick={handleAddSurgery}
            >
              {t('hospital_module.add_new_surgery')}
            </Button>
          }
        />

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: '24px',
            alignItems: { xs: 'stretch', sm: 'center' }
          }}
        >
          <Search
            borderRadius={'4px'}
            value={searchValue}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleSearch(event.target.value)}
            onClear={handleSearchClear}
            placeholder={(t('hospital_module.search_by_name') as string)}
            textFielsSX={{
              '& .MuiInputBase-input::placeholder': {
                fontFamily: 'Inter',
                fontWeight: 300,
                fontSize: '14px',
                lineHeight: '100%',
                letterSpacing: '0%',
                color: theme.palette.customColors.neutralSecondary
              }
            }}
          />
        </Box>

        <CommonTable
          externalTableStyle={{ mt: 0 }}
          columns={columns}
          indexedRows={indexedRows}
          total={total}
          loading={isFetching}
          paginationModel={{ page: (filters.page ?? 1) - 1,
          pageSize: filters.limit ?? 10 }}
          setPaginationModel={handlePaginationChange}
          rowHeight={64}
          pageSizeOptions={[10, 25, 50]}
          searchValue=''
        />
      </Card>
      <AddEditSurgeryDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        onSubmit={handleSubmitSurgery}
        loading={submitLoader}
        initialData={selectedSurgery}
      />
      {deleteDialogOpen && (
        <ConfirmationDialog
          dialogBoxStatus={deleteDialogOpen}
          onClose={handleCloseDeleteDialog}
          title={(t('hospital_module.delete_surgery_confirm') as string)}
          description={t('hospital_module.delete_surgery_confirm_desc')}
          cancelText={t('cancel')}
          ConfirmationText={t('delete')}
          confirmAction={handleConfirmDelete}
          loading={deleteLoading}
          image='/images/warning-icon.svg'
          imgStyle={{ background: theme.palette.customColors.TertiaryLight, p: 4 }}
          confirmBtnStyle={{ background: theme.palette.customColors.Error, py: 2 }}
          cancelBtnStyle={{
            color: theme.palette.customColors.neutralSecondary,
            borderColor: theme.palette.customColors.neutralSecondary
          }}
        />
      )}
    </>
  )
}

export default Surgery
