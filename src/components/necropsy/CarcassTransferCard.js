import { Box, Card, CardContent, Typography, useTheme } from '@mui/material'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { debounce } from 'lodash'
import Search from 'src/views/utility/Search'
import FilterButtonWithNotification from 'src/views/utility/FilterButtonWithNotification'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import { useNecropsy } from 'src/context/NecropsyContext'
import { getCarcassTransferList } from 'src/lib/api/necropsy'
import CarcassTransferFilterDrawer from 'src/components/necropsy/CarcassTransferFilterDrawer'
import IncomingNecropsyDrawer from 'src/components/necropsy/IncomingNecropsyDrawer'

const getTransferStatus = item => {
  if (item?.transfer_status === 'CANCELED') return 'Cancelled'

  switch (item?.activity_status) {
    case 'COMPLETED':
      return 'Transfer Completed'
    case 'CANCELED':
      return 'Cancelled'
    case 'REJECTED':
      return 'Rejected'
    case 'RIDE_STARTED':
      return item?.is_checkout_required == 1 ? 'Security Checkout Pending' : 'Security Checkin Pending'
    case 'SECURITY_CHECKOUT_ALLOWED':
      return item?.is_checkin_required == 1 ? 'Security Checkin Pending' : 'Awaiting Approval'
    case 'SECURITY_CHECKIN_ALLOWED':
      return 'Awaiting Approval'
    default:
      return 'Pending'
  }
}

const TABS = [
  { key: 'pending', label: 'Pending Acceptance' },
  { key: 'completed', label: 'Received' }
]

const CarcassTransferCard = ({ filterDate }) => {
  const theme = useTheme()
  const { selectedNecropsy } = useNecropsy()

  const [activeTab, setActiveTab] = useState('pending')
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({ pending: 0, completed: 0 })
  const [filters, setFilters] = useState({ page: 1, limit: 50, q: '' })
  const [searchValue, setSearchValue] = useState('')
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false)
  const [filterCount, setFilterCount] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState({ Site: [] })
  const [openIncomingDrawer, setOpenIncomingDrawer] = useState(false)
  const [selectedTransferRow, setSelectedTransferRow] = useState(null)

  const formatDate = dateString => {
    if (!dateString) return null

    return new Date(dateString).toISOString().split('T')[0]
  }

  const fetchData = async () => {
    if (!selectedNecropsy?.id) return

    try {
      setLoading(true)

      const siteId = selectedOptions.Site?.[0] || undefined

      const res = await getCarcassTransferList({
        page_no: filters.page,
        limit: filters.limit,
        q: filters.q,
        request_from: 'web',
        reference_type: 'carcass_transfer',
        transfer_status: activeTab,
        necropsy_center_id: JSON.stringify([selectedNecropsy?.id]),
        from_date: formatDate(filterDate?.startDate),
        to_date: formatDate(filterDate?.endDate),
        ...(siteId ? { entity_type: 'site', entity_id: siteId } : {})
      })

      if (res?.success) {
        setData(res?.data?.result || [])
        const totalCount = Number(res?.data?.total_count) || 0
        setTotal(totalCount)

        const statsObj = res?.data?.stats || res?.stats || {}

        const pendingVal = Number(statsObj?.pending_count ?? statsObj?.transfer_pending_count ?? 0)

        const completedVal = Number(statsObj?.completed_count ?? statsObj?.transfer_completed_count ?? 0)

        setStats(prev => ({
          pending: pendingVal || (activeTab === 'pending' ? totalCount : prev.pending),
          completed: completedVal || (activeTab === 'completed' ? totalCount : prev.completed)
        }))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [filters.page, filters.limit, filters.q, selectedNecropsy?.id, filterDate, selectedOptions, activeTab])

  const handlePaginationModelChange = model => {
    setFilters(prev => ({
      ...prev,
      page: model.page + 1,
      limit: model.pageSize
    }))
  }

  const debouncedSearch = useMemo(
    () =>
      debounce(value => {
        setFilters(prev => ({
          ...prev,
          q: value,
          page: 1
        }))
      }, 500),
    []
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

  const applyFilters = newSelectedOptions => {
    setSelectedOptions(newSelectedOptions)
    setOpenFilterDrawer(false)
    setFilters(prev => ({ ...prev, page: 1 }))
  }

  const handleRowClick = params => {
    setSelectedTransferRow(params.row)
    setOpenIncomingDrawer(true)
  }

  const handleTabChange = tabKey => {
    setActiveTab(tabKey)
    setFilters(prev => ({ ...prev, page: 1 }))
  }

  const indexedRows = data.map((row, index) => ({
    ...row,
    id: row.transfer_id || index,
    sl_no: (filters.page - 1) * filters.limit + index + 1
  }))

  const columns = [
    {
      minWidth: 20,
      width: 80,
      sortable: false,
      field: 'sl_no',
      headerName: 'SL. NO',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{ fontSize: '14px', fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant, px: 2 }}
        >
          {params.row.sl_no}
        </Typography>
      )
    },
    {
      width: 180,
      minWidth: 20,
      sortable: false,
      field: 'transfer_code',
      headerName: 'Transfer Code',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{ fontSize: '14px', fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant, px: 2 }}
        >
          {params.row.transfer_code}
        </Typography>
      )
    },
    {
      width: 150,
      minWidth: 20,
      sortable: false,
      field: 'animal_info',
      headerName: 'Animal Count',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{ fontSize: '14px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant, px: 2 }}
        >
          {Number(params.row.total_animals) || 0}
        </Typography>
      )
    },
    {
      width: 200,
      minWidth: 20,
      sortable: false,
      field: 'source_name',
      headerName: 'Source Site',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{ fontSize: '14px', fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant, px: 2 }}
        >
          {params.row.source_name}
        </Typography>
      )
    },
    {
      width: 250,
      minWidth: 20,
      sortable: false,
      field: 'security_status',
      headerName: 'Security Status',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{ fontSize: '14px', fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant, px: 2 }}
        >
          {getTransferStatus(params.row)}
        </Typography>
      )
    },
    {
      width: 150,
      minWidth: 20,
      sortable: false,
      field: 'mortality_priority',
      headerName: 'Priority',
      renderCell: params => {
        const priority = (params.row.mortality_priority || params.row.priority || '')?.toLowerCase()

        if (!priority) return null

        const isHigh = priority === 'high'

        return (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              px: 2,
              py: 0.5,
              borderRadius: 0.5,
              bgcolor: isHigh ? theme.palette.customColors.Tertiary30 : theme.palette.customColors.antzInfoLight,
              color: isHigh ? theme.palette.customColors.Tertiary : theme.palette.customColors.addPrimary,
              fontWeight: 600,
              fontSize: '14px'
            }}
          >
            {isHigh ? '!!! ' : '! '}
            {priority.charAt(0).toUpperCase() + priority.slice(1)}
          </Box>
        )
      }
    },
    {
      width: 250,
      minWidth: 20,
      sortable: false,
      field: 'requested_by',
      headerName: 'Requested By',
      renderCell: params => (
        <UserAvatarDetails
          user_name={params.row.user_first_name}
          date={params.row.created_at}
          show_time
          size='medium'
        />
      )
    }
  ]

  return (
    <>
      <Card
        sx={{
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          borderBottom: `0.5px solid ${theme.palette.divider}`,
          elevation: 'none',
          boxShadow: 'none'
        }}
      >
        <CardContent>
          <Typography
            sx={{
              fontSize: '16px',
              fontWeight: 600,
              color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary,
              mb: 4
            }}
          >
            Carcass Transfer
          </Typography>

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              alignItems: { xs: 'stretch', sm: 'center' },
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ flex: { xs: '1 1 auto', sm: '0 1 auto' } }}>
              <Search
                borderRadius='4px'
                value={searchValue}
                onClear={handleSearchClear}
                onChange={e => handleSearch(e.target.value)}
                textFielsSX={{
                  '& .MuiInputBase-input::placeholder': {
                    fontSize: '13px'
                  }
                }}
                placeholder='Search by transfer code, site...'
              />
            </Box>
            <FilterButtonWithNotification onClick={() => setOpenFilterDrawer(true)} appliedFiltersCount={filterCount} />
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, boxShadow: 'none', elevation: 'none' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box
              sx={{
                flex: '1 1 auto',
                minWidth: 0,
                overflowX: 'auto',
                scrollbarColor: 'transparent transparent'
              }}
            >
              <Box sx={{ display: 'inline-flex', gap: 3, pr: 1, alignItems: 'center' }}>
                {TABS.map(tab => (
                  <Box
                    key={tab.key}
                    onClick={() => handleTabChange(tab.key)}
                    sx={{
                      flexShrink: 0,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      px: '16px',
                      py: '8px',
                      borderRadius: '8px',
                      backgroundColor:
                        activeTab === tab.key ? theme.palette.secondary.dark : theme.palette.customColors.mdAntzNeutral,
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease'
                    }}
                  >
                    <Typography
                      sx={{
                        color:
                          activeTab === tab.key
                            ? theme.palette.primary.contrastText
                            : theme.palette.customColors.neutralPrimary,
                        whiteSpace: 'nowrap',
                        fontSize: { xs: '13px', sm: '14px' },
                        fontWeight: 500
                      }}
                    >
                      {tab.label} - {tab.key === 'pending' ? stats.pending : stats.completed}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>

          <CommonTable
            key={activeTab}
            indexedRows={indexedRows}
            columns={columns}
            loading={loading}
            total={total}
            paginationModel={{ page: filters.page - 1, pageSize: filters.limit }}
            setPaginationModel={handlePaginationModelChange}
            searchValue=''
            getRowHeight={() => 'auto'}
            onRowClick={handleRowClick}
            externalTableStyle={{
              '& .MuiDataGrid-cell': {
                padding: 4
              },
              '& .MuiDataGrid-row:hover': {
                cursor: 'pointer'
              }
            }}
          />
        </CardContent>
      </Card>

      <CarcassTransferFilterDrawer
        open={openFilterDrawer}
        onClose={() => setOpenFilterDrawer(false)}
        onApplyFilters={applyFilters}
        setFilterCount={setFilterCount}
        initialSelectedOptions={selectedOptions}
      />

      {openIncomingDrawer && (
        <IncomingNecropsyDrawer
          open={openIncomingDrawer}
          onClose={() => {
            setOpenIncomingDrawer(false)
            setSelectedTransferRow(null)
          }}
          transferId={selectedTransferRow?.transfer_id}
          onAcceptSuccess={fetchData}
        />
      )}
    </>
  )
}

export default CarcassTransferCard
