import { Box, Card, CardContent, Typography, Tabs, Tab, useTheme, alpha } from '@mui/material'
import { Theme } from '@mui/material/styles'
import { GridRenderCellParams, GridRowParams } from '@mui/x-data-grid'
import React, { FC, memo, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { debounce } from 'lodash'
import Search from 'src/views/utility/Search'
import FilterButtonWithNotification from 'src/views/utility/FilterButtonWithNotification'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { useNecropsyCenter } from 'src/hooks/necropsy'
import { AuthContext } from 'src/context/AuthContext'
import { getCarcassTransferList } from 'src/lib/api/necropsy'
import CarcassTransferFilterDrawer from 'src/components/necropsy/CarcassTransferFilterDrawer'
import IncomingNecropsyDrawer from 'src/components/necropsy/IncomingNecropsyDrawer'

interface TransferItem {
  transfer_id?: number
  transfer_code?: string
  transfer_status?: string
  activity_status?: string
  is_checkout_required?: number
  is_checkin_required?: number
  mortality_priority?: string
  priority?: string
  total_animals?: number
  source_name?: string
  user_first_name?: string
  user_last_name?: string
}

interface IndexedTransferRow extends TransferItem {
  id: number | string
  sl_no: number
}

interface DateFilter {
  startDate?: Date | string | null
  endDate?: Date | string | null
}

interface FilterState {
  page: number
  limit: number
  q: string
}

interface SelectedOptions {
  Site: (string | number)[]
}

interface StatsState {
  intransit: number
  completed: number
}

interface TabItem {
  key: string
  label: string
}

interface CarcassTransferCardProps {
  filterDate?: DateFilter | null
}

interface PaginationModel {
  page: number
  pageSize: number
}

const getTransferStatus = (item: TransferItem): string => {
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

const TABS: TabItem[] = [
  { key: 'intransit', label: 'Pending Acceptance' },
  { key: 'completed', label: 'Received' }
]

const CarcassTransferCard: FC<CarcassTransferCardProps> = ({ filterDate }) => {
  const theme = useTheme<Theme>()
  const authData = useContext(AuthContext)
  const userId = (authData as any)?.userData?.user?.user_id || ''
  const { selectedCenter: selectedNecropsy } = useNecropsyCenter(userId, false)

  const [activeTab, setActiveTab] = useState<string>('intransit')
  const [data, setData] = useState<TransferItem[]>([])
  const [total, setTotal] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [stats, setStats] = useState<StatsState>({ intransit: 0, completed: 0 })
  const [filters, setFilters] = useState<FilterState>({ page: 1, limit: 50, q: '' })
  const [searchValue, setSearchValue] = useState<string>('')
  const [openFilterDrawer, setOpenFilterDrawer] = useState<boolean>(false)
  const [filterCount, setFilterCount] = useState<number>(0)
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({ Site: [] })
  const [openIncomingDrawer, setOpenIncomingDrawer] = useState<boolean>(false)
  const [selectedTransferRow, setSelectedTransferRow] = useState<TransferItem | null>(null)

  const formatDate = (dateString?: Date | string | null): string | null => {
    if (!dateString) return null

    return new Date(dateString).toISOString().split('T')[0]
  }

  const fetchData = async (): Promise<void> => {
    if (!(selectedNecropsy as any)?.id) return

    try {
      setLoading(true)

      const siteId = selectedOptions.Site?.[0] || undefined

      const res = await getCarcassTransferList({
        page_no: filters.page,
        limit: filters.limit,
        q: filters.q,
        reference_type: 'carcass_transfer',
        transfer_status: activeTab,
        necropsy_center_id: JSON.stringify([(selectedNecropsy as any)?.id]),
        start_date: formatDate(filterDate?.startDate),
        end_date: formatDate(filterDate?.endDate),
        ...(siteId ? { entity_type: 'site', entity_id: siteId } : {})
      })

      if (res?.success) {
        setData(res?.data?.result || [])
        const totalCount = Number(res?.data?.total_count) || 0
        setTotal(totalCount)

        const statsObj = res?.data?.stats || (res as any)?.stats || {}
        console.log('Carcass Transfer Stats:', statsObj)

        setStats({
          intransit: Number(statsObj?.intransit_count ?? statsObj?.pending_count ?? 0),
          completed: Number(statsObj?.completed_count ?? 0)
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [filters.page, filters.limit, filters.q, (selectedNecropsy as any)?.id, filterDate, selectedOptions, activeTab])

  const handlePaginationModelChange = (model: PaginationModel): void => {
    setFilters(prev => ({
      ...prev,
      page: model.page + 1,
      limit: model.pageSize
    }))
  }

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setFilters(prev => ({
          ...prev,
          q: value,
          page: 1
        }))
      }, 500),
    []
  )

  const handleSearch = useCallback(
    (value: string) => {
      setSearchValue(value)
      debouncedSearch(value)
    },
    [debouncedSearch]
  )

  const handleSearchClear = (): void => {
    setSearchValue('')
    debouncedSearch('')
  }

  const applyFilters = (newSelectedOptions: SelectedOptions): void => {
    setSelectedOptions(newSelectedOptions)
    setOpenFilterDrawer(false)
    setFilters(prev => ({ ...prev, page: 1 }))
  }

  const handleRowClick = (params: GridRowParams<IndexedTransferRow>): void => {
    setSelectedTransferRow(params.row)
    setOpenIncomingDrawer(true)
  }

  const handleTabChange = (tabKey: string): void => {
    setActiveTab(tabKey)
    setFilters(prev => ({ ...prev, page: 1 }))
  }

  const indexedRows: IndexedTransferRow[] = data.map((row, index) => ({
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
      renderCell: (params: GridRenderCellParams<IndexedTransferRow>) => (
        <Typography
          variant='body2'
          sx={{ fontSize: '14px', fontWeight: 400, color: (theme.palette as any).customColors.OnSurfaceVariant, px: 2 }}
        >
          {params.row.sl_no}
        </Typography>
      )
    },
    {
      width: 300,
      minWidth: 20,
      sortable: false,
      field: 'transfer_code',
      headerName: 'Transfer ID and Status',
      renderCell: (params: GridRenderCellParams<IndexedTransferRow>) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box
            sx={{
              px: 3,
              py: 2,
              background: (theme.palette as any).customColors.displaybgPrimary,
              borderRadius: 0.4,
              width: 'fit-content'
            }}
          >
            <Typography sx={{ fontSize: '14px', fontWeight: 400, color: (theme.palette as any).customColors.OnSurfaceVariant }}>
              {params.row.transfer_code}
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '14px', fontWeight: 500, color: (theme.palette as any).customColors.OnSurfaceVariant }}>
            {getTransferStatus(params.row)}
          </Typography>
        </Box>
      )
    },
    {
      width: 180,
      minWidth: 20,
      sortable: false,
      field: 'mortality_priority',
      headerName: 'Necropsy Priority',
      renderCell: (params: GridRenderCellParams<IndexedTransferRow>) => {
        const priority = (params.row.mortality_priority || params.row.priority || '')?.toLowerCase()

        if (!priority) return null

        const isHigh = priority === 'high'

        return (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              px: 2,
              py: 2,
              borderRadius: 0.5,
              bgcolor: isHigh
                ? (theme.palette as any).customColors.Tertiary30
                : alpha((theme.palette as any).customColors.SecondaryContainer, 0.5),
              color: isHigh ? (theme.palette as any).customColors.Tertiary : (theme.palette as any).customColors.addPrimary,
              fontWeight: 600,
              fontSize: '14px'
            }}
          >
            {isHigh ? '!!! ' : '! '}
            {priority?.charAt(0).toUpperCase() + priority?.slice(1)}
          </Box>
        )
      }
    },
    {
      width: 150,
      minWidth: 20,
      sortable: false,
      field: 'animal_info',
      headerName: 'Animal Count',
      renderCell: (params: GridRenderCellParams<IndexedTransferRow>) => (
        <Typography
          variant='body2'
          sx={{ fontSize: '14px', fontWeight: 500, color: (theme.palette as any).customColors.OnSurfaceVariant, px: 2 }}
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
      renderCell: (params: GridRenderCellParams<IndexedTransferRow>) => (
        <Typography
          variant='body2'
          sx={{ fontSize: '14px', fontWeight: 500, color: (theme.palette as any).customColors.OnSurfaceVariant, px: 2 }}
        >
          {params.row.source_name}
        </Typography>
      )
    },
    {
      width: 250,
      minWidth: 20,
      sortable: false,
      field: 'requested_by',
      headerName: 'Requested By',
      renderCell: (params: GridRenderCellParams<IndexedTransferRow>) => (
        <Typography sx={{ fontSize: '14px', fontWeight: 400, color: (theme.palette as any).customColors.OnSurfaceVariant }}>
          {params.row.user_first_name} {params?.row?.user_last_name}
        </Typography>
      )
    }
  ]

  return (
    <>
      <Card>
        <CardContent>
          <Typography
            sx={{
              fontSize: '16px',
              fontWeight: 600,
              color: (theme.palette as any).customColors?.OnSurfaceVariant || theme.palette.text.primary,
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
                textFielsSX={{
                  '& .MuiInputBase-input::placeholder': {
                    fontSize: '13px'
                  }
                }}
                placeholder='Search by transfer ID'
              />
            </Box>
            <FilterButtonWithNotification onClick={() => setOpenFilterDrawer(true)} appliedFiltersCount={filterCount} />
          </Box>
          <Box sx={{ mb: 3, mt: 3 }}>
            <Tabs
              value={activeTab}
              onChange={(_e: React.SyntheticEvent, newValue: string) => handleTabChange(newValue)}
              sx={{
                minHeight: 'auto',
                '& .MuiTabs-flexContainer': {
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  width: 'fit-content'
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: theme.palette.primary.main
                }
              }}
            >
              {TABS.map(tab => (
                <Tab
                  key={tab.key}
                  value={tab.key}
                  label={`${tab.label} (${tab.key === 'intransit' ? stats.intransit : stats.completed})`}
                  sx={{
                    textTransform: 'none',
                    fontSize: '14px',
                    fontWeight: 500,
                    minHeight: 'auto',
                    py: 1.5,
                    color: (theme.palette as any).customColors?.neutralSecondary,
                    '&.Mui-selected': {
                      color: theme.palette.primary.main,
                      fontWeight: 600
                    }
                  }}
                />
              ))}
            </Tabs>
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
          hideAcceptButton={activeTab === 'completed'}
        />
      )}
    </>
  )
}

export default memo(CarcassTransferCard)
