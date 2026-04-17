import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { Box, Button, Card, CardHeader, Typography, useTheme, MenuItem, Select, alpha } from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import styled from '@emotion/styled'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/router'
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

const statusOptions = [
  { label: 'All Status', value: 'all' },
  { label: 'Active', value: 1 },
  { label: 'In Active', value: 0 }
]

const HospitalDetails = () => {
  const theme = useTheme()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { page, limit, q, active, sort_order, sort_by } = router.query

  const [openDrawer, setOpenDrawer] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [searchValue, setSearchValue] = useState(q || '')
  const [sitesLoading, setSitesLoading] = useState(false)
  const [sites, setSites] = useState([])

  const [filters, setFilters] = useState({
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 50,
    q: q || '',
    active: active !== undefined ? Number(active) : undefined,
    sort_order: sort_order || 'desc',
    sort_by: sort_by || 'occupants'
  })

  //  URL update helper function
  const updateUrlParams = useCallback(
    updatedFilters => {
      const params = new URLSearchParams()

      Object.entries(updatedFilters).forEach(([key, value]) => {
        if (value !== '' && value !== undefined && value !== null) {
          params.set(key, value.toString())
        }
      })

      router.replace({ pathname: router.pathname, query: params.toString() }, undefined, {
        shallow: true
      })
    },
    [router]
  )

  // Fetch sites
  const fetchSites = useCallback(async (q = '') => {
    try {
      setSitesLoading(true)
      const params = { q, limit: 10, page_no: 1 }
      const res = await getZooWiseSiteLists(params)
      if (res?.success) {
        const formatted = res?.data?.result?.map(item => ({
          value: item?.site_id,
          label: item?.site_name
        }))
        setSites(formatted)
      } else {
        setSites([])
      }
    } catch (error) {
      console.error('Error fetchSites:', error?.message)
    } finally {
      setSitesLoading(false)
    }
  }, [])

  const debouncedFetchSites = useMemo(() => {
    return debounce(q => fetchSites(q), 500)
  }, [fetchSites])

  const {
    data: hospitalData,
    isFetching: isLoadingHospitals,
    refetch: refetchHospitals
  } = useQuery({
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
    onError: error => {
      console.error('Error fetching hospital list:', error?.message)
    }
  })

  const rows = useMemo(() => hospitalData?.data?.hospitals || [], [hospitalData?.data?.hospitals])
  const total = useMemo(() => hospitalData?.data?.total || 0, [hospitalData?.data?.total])

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

  // Debounced search function using useRef to persist across renders
  const debouncedSearchRef = useRef(null)

  const debouncedSearch = () => {
    if (!debouncedSearchRef.current) {
      debouncedSearchRef.current = debounce((value, currentFilters, updateFn) => {
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
    value => {
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

  const handleSubmitData = async payload => {
    setSubmitLoader(true)

    try {
      const response = await addHospitalMaster(payload)

      if (response?.success) {
        // Invalidate hospital list cache
        queryClient.invalidateQueries(['hospital-list'])

        setOpenDrawer(false)
        Toaster({ type: 'success', message: response?.message || 'Hospital created successfully' })

        return true
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to create Hospital ' })

        return false
      }
    } catch (error) {
      console.error('Error adding hospital:', error?.message || error)

      return false
    } finally {
      setSubmitLoader(false)
    }
  }

  const handleSortModel = newModel => {
    if (newModel.length) {
      const updated = {
        ...filters,
        sort_order: newModel[0].sort,
        sort_by: newModel[0].field,
        page: 1
      }
      setFilters(updated)
      updateUrlParams(updated)
    }
  }

  //  Add serial numbers to each row based on current pagination
  const indexedRows = useMemo(() => {
    return rows.map((row, index) => ({
      ...row,
      sl_no: (filters.page - 1) * filters.limit + index + 1
    }))
  }, [rows, filters.page, filters.limit])

  const columns = [
    {
      minWidth: 50,
      field: 'id',
      headerName: 'Sl.No',
      sortable: false,
      renderCell: params => (
        <StyledTypography fontSize={'0.75rem'} sx={{ pl: 3 }}>
          {params?.row?.sl_no}
        </StyledTypography>
      )
    },
    {
      minWidth: 250,
      field: 'hospital_name',
      headerName: 'Hospital Name',
      sortable: false,
      renderCell: params => (
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
      headerName: 'Rooms',
      renderCell: params => <StyledTypography sx={{ pl: 1.4 }}>{params?.row?.total_rooms ?? '-'}</StyledTypography>
    },
    {
      minWidth: 150,
      field: 'occupants',
      headerName: 'Occupants',
      renderCell: params => <StyledTypography sx={{ pl: 1.4 }}>{params?.row?.total_occupants ?? '-'}</StyledTypography>
    },
    {
      minWidth: 140,
      field: 'active',
      headerName: 'Status',
      sortable: false,
      renderCell: params => <StatusChip chipStyles={{ ml: 1.4 }} status={params?.row?.active} />
    },
    {
      minWidth: 200,
      field: 'site_name',
      headerName: 'Site Name',
      sortable: false,
      renderCell: params => (
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
      headerName: 'Added By',
      sortable: false,
      renderCell: params => (
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
      headerName: 'Updated By',
      sortable: false,
      renderCell: params => (
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
  ]

  // getRowClassName function
  const getRowClassName = params => {
    const isActive = String(params?.row?.active) === '1'
    if (!isActive) {
      return 'inactive-row'
    }

    return ''
  }

  //  Handle Status filter change
  const handleStatusChange = value => {
    const activeValue = value === 'all' ? undefined : value

    const updated = {
      ...filters,
      page: 1,
      active: activeValue
    }

    setFilters(updated)
    updateUrlParams(updated)
  }

  const handleRowClick = params => {
    router.push({
      pathname: `/hospital/masters/hospital/${params?.row?.id}`
    })
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
    if (!router.isReady) return
    refetchHospitals()
  }, [filters, router.isReady])

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
              Hospital List
            </Typography>
          }
          action={
            <Button
              variant='contained'
              startIcon={<AddIcon />}
              sx={{ py: 2, px: 3, borderRadius: '4px' }}
              onClick={() => setOpenDrawer(true)}
            >
              Add Hospital
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
            onChange={e => handleSearch(e.target.value)}
            onClear={handleSearchClear}
            placeholder='Search by Hospital Name'
            textFielsSX={{
              '& .MuiInputBase-input::placeholder': {
                fontSize: '0.875rem'
              }
            }}
            width={{ xs: '100%', sm: 320 }}
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
              backgroundColor: alpha(theme.palette.customColors.TertiaryContainer, 0.1),
              '&:hover': {
                backgroundColor: alpha(theme.palette.customColors.TertiaryContainer, 0.3)
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

const StyledTypography = styled(Typography)(({ theme, fontWeight, fontSize, color, sx }) => ({
  fontSize: fontSize || '1rem',
  fontWeight: fontWeight || 400,
  color: color || theme.palette.customColors.OnSurfaceVariant,
  ...sx
}))
