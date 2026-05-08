'use client'

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { Box, Button, Card, CardHeader, Typography, useTheme, MenuItem, Select, alpha } from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import styled from '@emotion/styled'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams, useRouter } from 'next/navigation'
import { debounce } from 'lodash'
import { useQueryClient } from '@tanstack/react-query'

import CommonTable from 'src/views/table/data-grid/CommonTable'
import TextEllipsisWithModal from 'src/components/TextEllipsisWithModal'
import Toaster from 'src/components/Toaster'
import Search from 'src/views/utility/Search'
import AddHospital from 'src/views/pages/hospital/masters/hospital/AddHospital'
import { StatusChip } from 'src/views/pages/hospital/utility/hospitalSnippets'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import { addHospitalMaster, getHospitalMaster } from 'src/lib/api/hospital/hospitalMaster'
import { getZooWiseSiteLists } from 'src/lib/api/hospital/inpatient'
import DynamicBreadcrumbs from 'src/views/utility/DynamicBreadcrumbs'
import { GridPaginationModel, GridRenderCellParams, GridColDef, GridRowParams, GridSortModel } from '@mui/x-data-grid'
import type { ApiError, GetSiteListsResponse, SelectOption } from 'src/types/hospital/api'
import type { HospitalLists, SiteLists } from 'src/types/hospital/models'
import { HospitalMasterFilters, GetHospitalListResponse, AddHospitalMasterPayload, AddHospitalMasterResponse } from 'src/types/hospital/api/Masters/hospitalDetailTypes'

const HospitalDetails = () => {
  const { t } = useTranslation()
  const theme = useTheme()
  const appRouter = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()

  const statusOptions = useMemo(
    () => [
      { label: t('hospital_module.all_status'), value: 'all' },
      { label: t('hospital_module.active'), value: 1 },
      { label: t('hospital_module.in_active'), value: 0 }
    ],
    [t]
  )

  // Get query string parameters from App Router
  const page = searchParams?.get('page') || ''
  const limit = searchParams?.get('limit') || ''
  const q = searchParams?.get('q') || ''
  const active = searchParams?.get('active')
  const sort_order = searchParams?.get('sort_order') || ''
  const sort_by = searchParams?.get('sort_by') || ''

  const [openDrawer, setOpenDrawer] = useState<boolean>(false)
  const [submitLoader, setSubmitLoader] = useState<boolean>(false)
  const [searchValue, setSearchValue] = useState<string>(q || '')
  const [sitesLoading, setSitesLoading] = useState<boolean>(false)
  const [sites, setSites] = useState<SelectOption[]>([])

  const [filters, setFilters] = useState<HospitalMasterFilters>({
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 50,
    q: q || '',
    active: active ? Number(active) : undefined,
    sort_order: sort_order || 'desc',
    sort_by: sort_by || 'occupants'
  })

  //  URL update helper function
  const updateUrlParams = useCallback(
    (updatedFilters: HospitalMasterFilters) => {
      const params = new URLSearchParams()

      Object.entries(updatedFilters).forEach(([key, value]) => {
        if (value !== '' && value !== undefined && value !== null) {
          params.set(key, String(value))
        }
      })

      const basePath = '/hospital/masters/hospital'
      const queryString = params.toString()
      const newUrl = queryString ? `${basePath}?${queryString}` : basePath
      appRouter.push(newUrl)
    },
    [appRouter]
  )

  // Fetch sites
  const fetchSites = useCallback(async (q: string = '') => {
    try {
      setSitesLoading(true)
      const params = { q, limit: 10, page_no: 1 }
      const res = await getZooWiseSiteLists(params) as GetSiteListsResponse
      if (res?.success) {
        const formatted: SelectOption[] = (res?.data?.result ?? []).map((item: SiteLists) => ({
          value: item?.site_id ?? '',
          label: item?.site_name ?? ''
        }))
        setSites(formatted)
      } else {
        setSites([])
      }
    } catch (error: unknown) {
      const err = error as ApiError
      console.error('Error fetchSites:', err?.message)
    } finally {
      setSitesLoading(false)
    }
  }, [])

  const debouncedFetchSites = useMemo(() => {
    return debounce((q: string) => fetchSites(q), 500)
  }, [fetchSites])

  const {
    data: hospitalData,
    isFetching: isLoadingHospitals,
    refetch: refetchHospitals
  } = useQuery<GetHospitalListResponse>({
    queryKey: ['hospital-list', filters],
    queryFn: () =>
      getHospitalMaster({
        params: {
          page: filters.page,
          limit: filters.limit,
          q: filters.q,
          ...(filters.active !== undefined ? { active: filters.active } : {}),
          sort_order: filters.sort_order,
          sort_by: filters.sort_by
        }
      }),
  } )

  const rows = useMemo(() => hospitalData?.data?.hospitals || [], [hospitalData?.data?.hospitals])
  const total = useMemo(() => hospitalData?.data?.total || 0, [hospitalData?.data?.total])

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

  // Debounced search function using useRef to persist across renders
  const debouncedSearchRef = useRef<ReturnType<typeof debounce> | null>(null)

  const debouncedSearch = () => {
    if (!debouncedSearchRef.current) {
      debouncedSearchRef.current = debounce((value: string, currentFilters: HospitalMasterFilters, updateFn: (filters: HospitalMasterFilters) => void) => {
        const updated = {
          ...currentFilters,
          q: value,
          page: 1
        }

        setFilters(updated)
        updateFn(updated)
      }, 500)
    }
  }

  // Cleanup debounce on unmount
  useEffect(() => {
    debouncedSearch()

    return () => {
      if (debouncedSearchRef.current) {
        debouncedSearchRef.current.cancel()
      }
    }
  }, [])

  // Search handler - only updates local state immediately
  const handleSearch = useCallback(
    (value: string) => {
      setSearchValue(value)
      if (debouncedSearchRef.current) {
        debouncedSearchRef.current(value, filters, updateUrlParams)
      }
    },
    [filters, updateUrlParams]
  )

  const handleSearchClear = useCallback(() => {
    setSearchValue('')
    if (debouncedSearchRef.current) {
      debouncedSearchRef.current.cancel()
    }

    const updated = {
      ...filters,
      q: '',
      page: 1
    }

    setFilters(updated)
    updateUrlParams(updated)
  }, [filters, updateUrlParams])

  const handleSubmitData = async (payload: AddHospitalMasterPayload) => {
    setSubmitLoader(true)

    try {
      const response = await addHospitalMaster(payload) as AddHospitalMasterResponse

      if (response?.success) {
        // Invalidate hospital list cache
        queryClient.invalidateQueries({ queryKey: ['hospital-list'] })

        setOpenDrawer(false)
        Toaster({ type: 'success', message: response?.message || t('hospital_module.hospital_created_successfully') })

        return true
      } else {
        Toaster({ type: 'error', message: response?.message || t('hospital_module.failed_to_create_hospital') })

        return false
      }
    } catch (error: unknown) {
      const err = error as ApiError
      console.error('Error adding hospital:', err?.message || error)

      return false
    } finally {
      setSubmitLoader(false)
    }
  }

  const handleSortModel = (newModel: GridSortModel) => {
    if (newModel.length) {
      const updated: HospitalMasterFilters = {
        ...filters,
        sort_order: newModel[0].sort ?? 'desc',
        sort_by: newModel[0].field,
        page: 1
      }
      setFilters(updated)
      updateUrlParams(updated)
    }
  }

  //  Add serial numbers to each row based on current pagination
  const indexedRows = useMemo(() => {
    return rows.map((row: HospitalLists, index: number) => ({
      ...row,
      sl_no: (filters.page - 1) * filters.limit + index + 1
    }))
  }, [rows, filters.page, filters.limit])

  const columns: GridColDef[] =  useMemo
  (() => [
    {
      minWidth: 50,
      field: 'id',
      headerName: t('hospital_module.sl_no') ?? '',
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <StyledTypography fontSize={'0.75rem'} sx={{ pl: 3 }}>
          {params?.row?.sl_no}
        </StyledTypography>
      )
    },
    {
      minWidth: 250,
      field: 'hospital_name',
      headerName: t('hospital_module.hospital_name') ?? '',
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <TextEllipsisWithModal
          enableDialog={false}
          text={params?.row?.hospital_name ?? '-'}
          style={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '1rem',
            fontWeight: 400,
            pl: 1.4,
            maxWidth: '220px',
            cursor: 'pointer'
          }}
        />
      )
    },
    {
      minWidth: 120,
      field: 'rooms',
      headerName: t('hospital_module.room') ?? '',
      renderCell: (params: GridRenderCellParams) => <StyledTypography sx={{ pl: 1.4 }}>{params?.row?.total_rooms ?? '-'}</StyledTypography>
    },
    {
      minWidth: 150,
      field: 'occupants',
      headerName: t('hospital_module.occupants') ?? '',
      renderCell: (params: GridRenderCellParams) => <StyledTypography sx={{ pl: 1.4 }}>{params?.row?.total_occupants ?? '-'}</StyledTypography>
    },
    {
      minWidth: 140,
      field: 'active',
      headerName: t('status') ?? '',
      sortable: false,
      renderCell: (params: GridRenderCellParams) => <StatusChip chipStyles={{ ml: 1.4 }} status={params?.row?.active} />
    },
    {
      minWidth: 200,
      field: 'site_name',
      headerName: t('hospital_module.site_name') ?? '',
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <TextEllipsisWithModal
          enableDialog={false}
          text={params?.row?.site_name ?? '-'}
          style={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '1rem',
            fontWeight: 400,
            pl: 1.4,
            maxWidth: '230px',
            cursor: 'pointer'
          }}
        />
      )
    },
    {
      minWidth: 230,
      field: 'created_by_name',
      headerName: t('hospital_module.added_by') ?? '',
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ pl: 1.4 }}>
          <UserAvatarDetails
            user_name={params?.row?.created_by_name}
            date={params.row.created_at}
            dateType={'created'}
            size='medium'
            profile_image={params?.row?.profile_image}
          />
        </Box>
      )
    },
    {
      minWidth: 230,
      field: 'updated_by_name',
      headerName: t('hospital_module.updated_by') ?? '',
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ pl: 1.4 }}>
          <UserAvatarDetails
            user_name={params?.row?.updated_by_name}
            date={params.row.updated_at}
            dateType={'updated'}
            size='medium'
            profile_image={params?.row?.updated_user_profile_image}
          />
        </Box>
      )
    }
  ],
    [t]
  )

  // getRowClassName function
  const getRowClassName = (params: GridRowParams) => {
    const isActive = String(params?.row?.active) === '1'
    if (!isActive) {
      return 'inactive-row'
    }

    return ''
  }

  //  Handle Status filter change
  const handleStatusChange = (value: string | number) => {
    const activeValue = value === 'all' ? undefined : Number(value)

    const updated: HospitalMasterFilters = {
      ...filters,
      page: 1,
      active: activeValue
    }

    setFilters(updated)
    updateUrlParams(updated)
  }

  const handleRowClick = (params: GridRowParams) => {
    appRouter.push(`/hospital/masters/hospital/${params?.row?.id}`)
  }

  // Fetch sites when drawer opens
  useEffect(() => {
    if (openDrawer) {
      fetchSites('')
    }
  }, [openDrawer, fetchSites])

  // cleanup debounced fetchSites on unmount
  useEffect(() => {
    return () => {
      if (debouncedFetchSites?.cancel) {
        debouncedFetchSites.cancel()
      }
    }
  }, [debouncedFetchSites])

  // refetch on when filters updates
  useEffect(() => {
    refetchHospitals()
  }, [filters, refetchHospitals])

  return (
    <>
      <DynamicBreadcrumbs
        sx={{ mb: 6, color: theme.palette.customColors.neutralSecondary }}
        pageItems={[{ title: 'Hospital' }, { title: 'Masters' }, { title: 'Hospital List' }]}
      />
      <Card sx={{ p: 6 }}>
        <CardHeader
          sx={{
            display: 'flex',
            padding: '0 0 24px 0'
          }}
          title={
            <Typography
              sx={{
                color: theme.palette.customColors.onSurfaceVariant,
                fontSize: '1.25rem',
                fontWeight: 500
              }}
            >
              {t('hospital_module.hospital_list')}
            </Typography>
          }
          action={
            <Button
              variant='contained'
              startIcon={<AddIcon />}
              sx={{ py: 2, px: 3, borderRadius: '4px' }}
              onClick={() => setOpenDrawer(true)}
            >
              {t('hospital_module.add_hospital')}
            </Button>
          }
        />
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: { xs: 'space-between', sm: 'normal' },
            gap: 6,
            mb: 1
          }}
        >
          <Search
            borderRadius={'4px'}
            value={searchValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
            onClear={handleSearchClear}
            placeholder={(t('hospital_module.search_by_hospital_name') as string)}
            textFielsSX={{
              '& .MuiInputBase-input::placeholder': {
                fontSize: '0.875rem'
              }
            }}
            width={{ xs: '100%', sm: 320 } as any}
          />

          <Select
            size='small'
            value={filters.active ?? 'all'}
            displayEmpty
            onChange={e => handleStatusChange(e.target.value)}
            sx={{
              width: { xs: '80%', sm: 130 },
              borderRadius: '4px'
            }}
          >
            {statusOptions.map((item, index) => (
              <MenuItem key={index} value={item.value}>
                {item.label}
              </MenuItem>
            ))}
          </Select>
        </Box>
        <CommonTable
          columns={columns}
          indexedRows={indexedRows}
          rowHeight={60}
          total={total}
          onRowClick={handleRowClick}
          loading={isLoadingHospitals}
          paginationModel={{ page: filters.page - 1, pageSize: filters.limit }}
          setPaginationModel={handlePaginationChange}
          getRowClassName={getRowClassName}
          handleSortModel={handleSortModel}
          externalTableStyle={{
            '& .inactive-row': {
              backgroundColor: alpha(theme.palette.customColors.TertiaryContainer as string, 0.1),
              '&:hover': {
                backgroundColor: alpha(theme.palette.customColors.TertiaryContainer as string, 0.3)
              }
            }
          }}
        />
      </Card>
      {openDrawer && (
        <AddHospital
          handleSidebarOpen={openDrawer}
          handleSidebarClose={() => setOpenDrawer(false)}
          handleSubmitData={handleSubmitData}
          submitLoader={submitLoader}
          sites={sites}
          sitesLoading={sitesLoading}
          onSiteSearch={debouncedFetchSites}
        />
      )}
    </>
  )
}

export default HospitalDetails

const StyledTypography = styled(Typography)(({ theme, fontWeight, fontSize, color, sx }: any) => ({
  fontSize: fontSize || '1rem',
  fontWeight: fontWeight || 400,
  color: color || theme.palette.customColors.OnSurfaceVariant,
  ...sx
}))
