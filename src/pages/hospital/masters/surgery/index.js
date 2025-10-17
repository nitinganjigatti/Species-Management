import React, { useCallback, useEffect, useMemo, useState } from 'react'

import AddIcon from '@mui/icons-material/Add'
import {
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardHeader,
  FormControl,
  IconButton,
  MenuItem,
  Select,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { debounce } from 'lodash'
import { useRouter } from 'next/router'

import { SURGERY_VISIT_TYPE_OPTIONS } from 'src/constants/Constants'
import Icon from 'src/@core/components/icon'
import CustomChip from 'src/@core/components/mui/chip'
import Toaster from 'src/components/Toaster'

import CommonTable from 'src/views/table/data-grid/CommonTable'
import Search from 'src/views/utility/Search'
import AddEditSurgeryDrawer from 'src/views/pages/hospital/masters/surgery'

import { addSurgeryMaster, getSurgeryMaster, updateSurgeryMaster } from 'src/lib/api/hospital/surgeryMaster'

const resolveBooleanStatus = value => {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === '1' || normalized === 'true' || normalized === 'active'
  }

  return value === 1 || value === true
}

const Surgery = () => {
  const theme = useTheme()
  const router = useRouter()

  const [searchValue, setSearchValue] = useState('')
  const [selectedVisitType, setSelectedVisitType] = useState('')
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    q: ''
  })
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [selectedSurgery, setSelectedSurgery] = useState(null)

  const safeParseToInt = (value, fallback) => {
    const parsed = parseInt(value, 10)

    return Number.isNaN(parsed) ? fallback : parsed
  }

  useEffect(() => {
    if (!router.isReady) return

    const { page = '1', limit = '10', q = '', visit_type: visitTypeQuery = '' } = router.query

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
    (updatedFilters, visitTypeValue = selectedVisitType) => {
      const params = new URLSearchParams()

      Object.entries(updatedFilters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          params.set(key, value.toString())
        }
      })

      if (visitTypeValue) {
        params.set('visit_type', visitTypeValue)
      }

      router.push({ pathname: router.pathname, query: params.toString() }, undefined, {
        shallow: true
      })
    },
    [router, selectedVisitType]
  )

  const handlePaginationChange = useCallback(
    model => {
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
      debounce(value => {
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
    value => {
      setSearchValue(value)
      debouncedSearch(value)
    },
    [debouncedSearch]
  )

  const handleSearchClear = () => {
    setSearchValue('')
    debouncedSearch('')
  }

  const handleVisitTypeChange = event => {
    const newValue = event.target.value
    setSelectedVisitType(newValue)

    const updated = {
      ...filters,
      page: 1
    }
    setFilters(updated)
    updateUrlParams(updated, newValue)
  }

  const handleAddSurgery = useCallback(() => {
    setSelectedSurgery(null)
    setDrawerOpen(true)
  }, [])

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false)
    setSelectedSurgery(null)
  }, [])

  const handleEditSurgery = useCallback(row => {
    setSelectedSurgery(row)
    setDrawerOpen(true)
  }, [])

  const {
    data: surgeryResponse,
    isFetching,
    refetch
  } = useQuery({
    queryKey: ['hospital-surgery-master', filters, selectedVisitType],
    queryFn: () =>
      getSurgeryMaster({
        params: {
          page_no: filters.page,
          limit: filters.limit,
          q: filters.q,
          visit_type: selectedVisitType
        }
      }),
    keepPreviousData: true,
    staleTime: 60 * 1000
  })

  const dataPayload = surgeryResponse?.data ?? {}

  const rawRows = useMemo(() => {
    if (Array.isArray(dataPayload)) {
      return dataPayload
    }

    const possibleKeys = ['records', 'data', 'surgeries', 'surgery', 'items', 'list']
    for (const key of possibleKeys) {
      if (Array.isArray(dataPayload?.[key])) {
        return dataPayload[key]
      }
    }

    return []
  }, [dataPayload])

  const total = useMemo(() => {
    if (typeof dataPayload?.total === 'number') return dataPayload.total
    if (typeof dataPayload?.count === 'number') return dataPayload.count
    if (typeof dataPayload?.total_records === 'number') return dataPayload.total_records
    if (typeof dataPayload?.totalCount === 'number') return dataPayload.totalCount
    if (typeof dataPayload?.pagination?.total === 'number') return dataPayload.pagination.total

    return rawRows.length
  }, [dataPayload, rawRows.length])

  const getSlNo = useCallback(index => (filters.page - 1) * filters.limit + index + 1, [filters.limit, filters.page])

  const indexedRows = useMemo(
    () =>
      rawRows.map((row, index) => {
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
    async values => {
      setSubmitLoader(true)
      const payload = new FormData()
      const surgeryName = values?.surgery_name?.trim() || ''
      const description = values?.description?.trim() || ''
      const status = values?.status ? 'Active' : 'Inactive'

      payload.append('surgery_name', surgeryName)
      payload.append('description', description)
      payload.append('status', status)

      const surgeryId =
        selectedSurgery?.id ??
        selectedSurgery?.surgery_id ??
        selectedSurgery?.master_surgery_id ??
        selectedSurgery?.surgeryId

      try {
        const response = surgeryId ? await updateSurgeryMaster(surgeryId, payload) : await addSurgeryMaster(payload)

        if (response?.success) {
          Toaster({
            type: 'success',
            message: response?.message || (surgeryId ? 'Surgery updated successfully' : 'Surgery created successfully')
          })
          refetch()
          handleCloseDrawer()
        } else {
          Toaster({ type: 'error', message: response?.message || 'Something went wrong' })
        }
      } catch (error) {
        console.error(error)
        Toaster({ type: 'error', message: error?.message || 'An unexpected error occurred' })
      } finally {
        setSubmitLoader(false)
      }
    },
    [handleCloseDrawer, refetch, selectedSurgery]
  )

  const columns = useMemo(
    () => [
      {
        field: 'sl_no',
        headerName: 'SL.NO',
        minWidth: 80,
        width: 80,
        align: 'center',
        sortable: false,
        renderCell: params => (
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
        headerName: 'Name of Surgery',
        minWidth: 220,
        flex: 1,
        sortable: false,
        renderCell: params => (
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
        headerName: 'Description',
        minWidth: 320,
        flex: 2,
        sortable: false,
        renderCell: params => (
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
        headerName: 'Status',
        minWidth: 150,
        sortable: false,
        renderCell: params => {
          const isActive = resolveBooleanStatus(params.row.status_value)
          return (
            <CustomChip
              skin='light'
              size='small'
              label={isActive ? 'Active' : 'Inactive'}
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
        renderCell: params => (
          <Tooltip title='Edit'>
            <IconButton size='small' onClick={() => handleEditSurgery(params.row)}>
              <Icon color={theme.palette.customColors.OnSurfaceVariant} icon='mdi:pencil-outline' />
            </IconButton>
          </Tooltip>
        )
      }
    ],
    [handleEditSurgery, theme]
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Breadcrumbs separator='/' sx={{ color: theme.palette.customColors.neutralSecondary }}>
        <Typography
          sx={{
            fontSize: '16px',
            lineHeight: '24px',
            fontWeight: 400,
            letterSpacing: '0.15px',
            color: theme.palette.customColors.neutralSecondary
          }}
        >
          Hospital
        </Typography>
        <Typography
          sx={{
            fontSize: '16px',
            lineHeight: '24px',
            fontWeight: 400,
            letterSpacing: '0.15px',
            color: theme.palette.customColors.neutralSecondary
          }}
        >
          Masters
        </Typography>
        <Typography
          sx={{
            fontSize: '16px',
            lineHeight: '24px',
            fontWeight: 400,
            letterSpacing: '0.15px',
            color: theme.palette.customColors.neutralSecondary,
            fontWeight: 500
          }}
        >
          Surgery
        </Typography>
      </Breadcrumbs>

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
              Surgery Master
            </Typography>
          }
          action={
            <Button
              variant='contained'
              startIcon={<AddIcon />}
              sx={{ py: 2, borderRadius: '4px' }}
              onClick={handleAddSurgery}
            >
              Add New Surgery
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
            onChange={event => handleSearch(event.target.value)}
            onClear={handleSearchClear}
            placeholder='Search by Name'
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

          <FormControl size='small' sx={{ minWidth: 180 }}>
            <Select
              displayEmpty
              value={selectedVisitType}
              onChange={handleVisitTypeChange}
              renderValue={value => {
                if (!value) {
                  return 'All visit'
                }

                const selectedOption = SURGERY_VISIT_TYPE_OPTIONS.find(option => option.value === value)

                return selectedOption?.label ?? 'All visit'
              }}
              sx={{
                '& .MuiSelect-select': {
                  // py: 2,
                  px: 3
                },
                borderRadius: '4px'
              }}
            >
              {SURGERY_VISIT_TYPE_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <CommonTable
          externalTableStyle={{ mt: 0 }}
          columns={columns}
          indexedRows={indexedRows}
          total={total}
          loading={isFetching}
          paginationModel={{ page: filters.page - 1, pageSize: filters.limit }}
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
    </Box>
  )
}

export default Surgery
