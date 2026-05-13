import {
  Box,
  Tab,
  Tabs,
  Typography,
  useTheme,
  Theme,
  MenuItem,
  Select,
  FormControl,
  SelectChangeEvent
} from '@mui/material'
import { useParams } from 'next/navigation'
import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { getAnimalTransferList, AnimalTransferItem } from 'src/lib/api/housing'
import AnimalTransferDetailsDrawer from './AnimalTransferDetailsDrawer'
import Icon from 'src/@core/components/icon'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { GridCellParams } from '@mui/x-data-grid'
import ListingHeader from '../../../views/pages/housing/utils/ListingHeader'
import { debounce } from 'lodash'
import { useAuth } from 'src/hooks/useAuth'
import { useTranslation } from 'react-i18next'

type TransferTabType = 'intra' | 'inter' | 'external'

interface IndexedTransferItem extends AnimalTransferItem {
  id: number | string
  sl_no: number
}

interface AnimalTransferListingProps {
  siteIncharges?: { user_id: number }[]
  loggedInUserId?: number
  addSitesAccess?: boolean
  settings?: Record<string, unknown>
}

// Transfer status configuration matching mobile Config.js TRANSFER_STATUS
// Basic config for dropdown and name lookup
const getTransferStatusList = (t: (key: string) => string) => [
  { id: -1, name: t('show_all'), value: 'ALL' },
  { id: 0, name: t('housing_module.awaiting_approval'), value: 'PENDING' },
  { id: 1, name: t('approved'), value: 'APPROVED' },
  { id: 2, name: t('rejected'), value: 'REJECTED' },
  { id: 3, name: t('canceled'), value: 'CANCELED' },
  { id: 4, name: t('completed'), value: 'COMPLETED' },
  { id: 5, name: t('housing_module.allocate'), value: 'REACHED_DESTINATION', value1: 'ALLOCATE' },
  { id: 6, name: t('housing_module.received_animals'), value: 'RECEIVED_ANIMALS' },
  { id: 7, name: t('housing_module.security_checkout_cleared'), value: 'SECURITY_CHECKOUT_ALLOWED' },
  { id: 8, name: t('housing_module.security_checkin_cleared'), value: 'SECURITY_CHECKIN_ALLOWED' }
]

// Returns status colors based on theme
const getStatusColorsFromTheme = (status: string, theme: Theme): { backgroundColor: string; textColor: string } => {
  const customColors = (theme.palette as any).customColors

  const statusColorMap: Record<string, { backgroundColor: string; textColor: string }> = {
    PENDING: { backgroundColor: customColors?.antzNotes, textColor: customColors?.Tertiary },
    APPROVED: { backgroundColor: customColors?.OnBackground, textColor: theme.palette.primary.main },
    REJECTED: { backgroundColor: customColors?.ErrorContainer, textColor: customColors?.Error },
    CANCELED: { backgroundColor: customColors?.secondaryBg, textColor: customColors?.OnPrimary },
    COMPLETED: { backgroundColor: customColors?.deepDark, textColor: customColors?.OnPrimary },
    REACHED_DESTINATION: { backgroundColor: theme.palette.primary.main, textColor: customColors?.OnPrimary },
    ALLOCATE: { backgroundColor: theme.palette.primary.main, textColor: customColors?.OnPrimary },
    RECEIVED_ANIMALS: { backgroundColor: theme.palette.primary.main, textColor: customColors?.OnPrimary },
    SECURITY_CHECKOUT_ALLOWED: {
      backgroundColor: customColors?.OnPrimary,
      textColor: customColors?.OnPrimaryContainer
    },
    SECURITY_CHECKIN_ALLOWED: { backgroundColor: customColors?.OnPrimary, textColor: customColors?.OnPrimaryContainer }
  }

  return (
    statusColorMap[status] || { backgroundColor: theme.palette.grey[100], textColor: customColors?.OnPrimaryContainer }
  )
}

const getTransferTabs = (t: (key: string) => string) => [
  { id: 'intra', label: t('housing_module.in_house'), icon: 'mdi:arrow-down' },
  { id: 'inter', label: t('housing_module.inter_site'), icon: 'mdi:swap-horizontal' },
  { id: 'external', label: t('housing_module.external'), icon: 'mdi:location-exit' }
]

const allocateButtonCheck = (
  activityStatus: string,
  item: AnimalTransferItem,
  loggedInUserId?: number | string
): string => {
  if (activityStatus === 'REACHED_DESTINATION') {
    try {
      const userDetails = item.user_details ? JSON.parse(item.user_details) : []
      const userIdNum = loggedInUserId ? parseInt(String(loggedInUserId), 10) : null
      if (userIdNum !== null && userDetails.includes(userIdNum)) {
        return 'ALLOCATE'
      }
    } catch {
      // Ignore JSON parse errors
    }
    if (item.transfer_type === 'intra') {
      return 'ALLOCATE'
    }
  }

  return activityStatus
}

const getStatusText = (
  item: AnimalTransferItem,
  loggedInUserId?: number | string,
  t?: (key: string) => string
): string => {
  const activityStatus = item.activity_status || ''
  const comments = item.comments || ''
  const transferType = item.transfer_type

  if (comments === 'Received Animals') {
    try {
      const userDetails = item.user_details ? JSON.parse(item.user_details) : []
      const userIdNum = loggedInUserId ? parseInt(String(loggedInUserId), 10) : null
      if (userIdNum !== null && userDetails.includes(userIdNum)) {
        return t ? t('housing_module.allocate') : 'Allocate'
      }
    } catch {
      // Ignore JSON parse errors
    }
    // 2. If comments is "Received Animals" and transfer_type is "intra"
    if (transferType === 'intra') {
      return t ? t('housing_module.allocate') : 'Allocate'
    }
  }

  // 3. If activity_status is "REACHED_DESTINATION" (independent of comments)
  if (activityStatus === 'REACHED_DESTINATION') {
    return t ? t('housing_module.allocate') : 'Allocate'
  }

  // Otherwise use comments field (matching mobile behavior)
  // Mobile uses getTranslationAndReplaceText which essentially returns the comments
  if (comments) {
    return comments
  }

  // Fallback to status name from config
  const statusList = t ? getTransferStatusList(t) : []
  const statusConfig = statusList.find(s => s.value === activityStatus || (s as any).value1 === activityStatus)

  if (statusConfig) {
    return statusConfig.name
  }

  // Final fallback - format the activity_status
  return activityStatus?.replace(/_/g, ' ') || (t ? t('pending') : 'Pending')
}

// Get status colors using theme (matching mobile)
const getStatusColors = (
  item: AnimalTransferItem,
  loggedInUserId: number | string | undefined,
  theme: Theme
): { backgroundColor: string; textColor: string } => {
  const activityStatus = item.activity_status || ''
  const transformedStatus = allocateButtonCheck(activityStatus, item, loggedInUserId)

  return getStatusColorsFromTheme(transformedStatus, theme)
}

const AnimalTransferListing: React.FC<AnimalTransferListingProps> = () => {
  const { t } = useTranslation()
  const theme = useTheme() as Theme
  const { id: siteId } = useParams<{ id: string }>() ?? {}
  const auth = useAuth()
  const loggedInUserId = (auth as any)?.userData?.user?.user_id

  const TRANSFER_STATUS = useMemo(() => getTransferStatusList(t), [t])
  const TRANSFER_TABS = useMemo(() => getTransferTabs(t), [t])

  const [activeTab, setActiveTab] = useState<TransferTabType>('intra')
  const [loading, setLoading] = useState<boolean>(false)
  const [transferList, setTransferList] = useState<AnimalTransferItem[]>([])
  const [totalCount, setTotalCount] = useState<number>(0)
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  // const [searchValue, setSearchValue] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false)
  const [selectedTransfer, setSelectedTransfer] = useState<IndexedTransferItem | null>(null)

  // Debounced search
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setSearchQuery(value)
        setPage(1)
      }, 500),
    []
  )

  // const handleSearchChange = useCallback(
  //   (e: React.ChangeEvent<HTMLInputElement>) => {
  //     setSearchValue(e.target.value)
  //     debouncedSearch(e.target.value)
  //   },
  //   [debouncedSearch]
  // )

  // const handleSearchClear = (): void => {
  //   setSearchValue('')
  //   setSearchQuery('')
  //   setPage(1)
  // }

  const fetchTransferList = async (): Promise<void> => {
    if (!siteId) {
      return
    }

    setLoading(true)
    try {
      const params = {
        site_id: siteId as string,
        transfer_type: activeTab,
        filter_type: filterStatus,
        page_no: page,
        q: searchQuery || undefined
      }

      const response = await getAnimalTransferList(params)

      if (response?.success) {
        const resultData = response?.data?.result || []
        const totalCountData = response?.data?.total_count || 0

        setTransferList(resultData)
        setTotalCount(totalCountData)
      } else {
        setTransferList([])
        setTotalCount(0)
      }
    } catch {
      setTransferList([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransferList()
  }, [siteId, activeTab, filterStatus, page, pageSize, searchQuery])

  const handleTabChange = (_event: React.SyntheticEvent, newValue: TransferTabType): void => {
    setActiveTab(newValue)
    setPage(1)
    setFilterStatus('ALL')
  }

  const handleFilterChange = (event: SelectChangeEvent<string>): void => {
    setFilterStatus(event.target.value)
    setPage(1)
  }

  const handlePaginationChange = (model: { page: number; pageSize: number }): void => {
    setPage(model.page + 1)
    setPageSize(model.pageSize)
  }

  const handleRowClick = (params: { row: IndexedTransferItem }): void => {
    setSelectedTransfer(params.row)
    setDrawerOpen(true)
  }

  const handleDrawerClose = (): void => {
    setDrawerOpen(false)
    setSelectedTransfer(null)
  }

  const handleStatusChange = (): void => {
    // Refresh the list when status changes
    fetchTransferList()
  }

  // Format animal count display
  const formatAnimalCount = (total: number, transferred: number): string => {
    if (transferred >= total || transferred === 0) {
      return `${total}`
    }

    return `${transferred}/${total}`
  }

  // Format date display
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-'

    try {
      const date = new Date(dateString)

      return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  const indexedRows: IndexedTransferItem[] = transferList.map((row, index) => ({
    ...row,
    id: row.animal_movement_id || index,
    sl_no: (page - 1) * pageSize + index + 1
  }))

  const columns = [
    {
      minWidth: 20,
      width: 80,
      field: 'sl_no',
      headerName: t('housing_module.sl_no'),
      align: 'left' as const,
      headerAlign: 'left' as const,
      sortable: false,
      renderCell: (params: GridCellParams) => (
        <Typography
          sx={{
            color: theme.palette.customColors.onPrimaryContainer,
            fontSize: '14px',
            fontWeight: 500,
            pl: 2
          }}
        >
          {(params.row as IndexedTransferItem).sl_no}.
        </Typography>
      )
    },
    {
      minWidth: 200,
      field: 'request_id',
      headerName: t('housing_module.transfer_id'),
      align: 'left' as const,
      headerAlign: 'left' as const,
      sortable: false,
      renderCell: (params: GridCellParams) => {
        const row = params.row as IndexedTransferItem
        const tabConfig = TRANSFER_TABS.find(tab => tab.id === row.transfer_type)

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {tabConfig && (
              <Icon icon={tabConfig.icon} fontSize={16} color={theme.palette.customColors.onPrimaryContainer} />
            )}
            <Typography
              sx={{
                color: theme.palette.customColors.onPrimaryContainer,
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              {row.request_id?.toUpperCase() || '-'}
            </Typography>
          </Box>
        )
      }
    },
    {
      minWidth: 150,
      width: 220,
      field: 'destination_name',
      headerName: t('housing_module.destination'),
      align: 'left' as const,
      headerAlign: 'left' as const,
      sortable: false,
      renderCell: (params: GridCellParams) => {
        const row = params.row as IndexedTransferItem
        const siteIdNum = siteId ? parseInt(siteId as string, 10) : null
        const isIncoming = siteIdNum !== null && row.destination_id == siteIdNum

        const displayName =
          row.transfer_type === 'inter'
            ? isIncoming
              ? row.source_site_name
              : row.destination_name
            : row.destination_name

        return (
          <Typography
            sx={{
              color: theme.palette.customColors.onPrimaryContainer,
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            {displayName || '-'}
          </Typography>
        )
      }
    },
    {
      minWidth: 100,
      width: 140,
      field: 'animal_count',
      headerName: t('animals'),
      align: 'center' as const,
      headerAlign: 'center' as const,
      sortable: false,
      renderCell: (params: GridCellParams) => {
        const row = params.row as IndexedTransferItem

        return (
          <Typography
            sx={{
              color: theme.palette.customColors.onPrimaryContainer,
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            {formatAnimalCount(row.animal_count || 0, row.transferred_animal_count || 0)}
          </Typography>
        )
      }
    },
    {
      minWidth: 150,
      width: 180,
      field: 'requested_on',
      headerName: t('housing_module.requested_on'),
      align: 'left' as const,
      headerAlign: 'left' as const,
      sortable: false,
      renderCell: (params: GridCellParams) => {
        const row = params.row as IndexedTransferItem

        return (
          <Typography
            sx={{
              color: theme.palette.customColors.neutralSecondary,
              fontSize: '13px',
              fontWeight: 400
            }}
          >
            {formatDate(row.requested_on)}
          </Typography>
        )
      }
    },
    {
      flex: 1,
      minWidth: 300,
      field: 'activity_status',
      headerName: t('status'),
      align: 'left' as const,
      headerAlign: 'left' as const,
      sortable: false,
      renderCell: (params: GridCellParams) => {
        const row = params.row as IndexedTransferItem
        const statusText = getStatusText(row, loggedInUserId, t)
        const statusColors = getStatusColors(row, loggedInUserId, theme)

        return (
          <Box
            sx={{
              backgroundColor: statusColors.backgroundColor,
              color: statusColors.textColor,
              fontSize: '12px',
              fontWeight: 500,
              textAlign: 'center',
              px: 2,
              py: 1,
              borderRadius: '4px',
              minWidth: '85px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {statusText}
          </Box>
        )
      }
    }
  ]

  return (
    <Box sx={{ mt: 4 }}>
      {/* Sub-tabs for transfer types */}
      <Box sx={{ display: 'inline-block', borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ minHeight: 48 }}>
          {TRANSFER_TABS.map(tab => (
            <Tab
              key={tab.id}
              value={tab.id}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Icon icon={tab.icon} fontSize={18} />
                  <span>{tab.label}</span>
                </Box>
              }
            />
          ))}
        </Tabs>
      </Box>

      <Box sx={{ mt: 4 }}>
        {/* Header with filter and search */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 4,
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <ListingHeader
            title={`${TRANSFER_TABS.find(tab => tab.id === activeTab)?.label || ''} ${t('housing_module.transfers')}`}
            totalCount={totalCount}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Search */}
            {/* <Search
              width={250}
              placeholder='Search by Transfer ID'
              value={searchValue}
              onChange={handleSearchChange}
              onClear={handleSearchClear}
            /> */}

            {/* Status Filter */}
            <FormControl size='small' sx={{ minWidth: 180 }}>
              <Select
                value={filterStatus}
                onChange={handleFilterChange}
                displayEmpty
                sx={{
                  '& .MuiSelect-select': {
                    fontSize: '14px'
                  }
                }}
              >
                {TRANSFER_STATUS.map(status => (
                  <MenuItem key={status.id} value={status.value}>
                    {status.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Transfer List Table */}
        <CommonTable
          columns={columns}
          indexedRows={indexedRows}
          loading={loading}
          total={totalCount}
          paginationModel={{ page: page - 1, pageSize }}
          setPaginationModel={handlePaginationChange}
          onRowClick={handleRowClick}
          getRowHeight={() => 'auto'}
          externalTableStyle={{
            '& .MuiDataGrid-cell': {
              padding: '12px 8px'
            },
            '& .MuiDataGrid-row:hover': {
              cursor: 'pointer'
            }
          }}
        />
      </Box>

      {/* Transfer Details Drawer */}
      <AnimalTransferDetailsDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        transferId={selectedTransfer?.animal_movement_id || null}
        transferType={selectedTransfer?.transfer_type || activeTab}
        siteId={siteId as string}
        onStatusChange={handleStatusChange}
      />
    </Box>
  )
}

export default AnimalTransferListing
