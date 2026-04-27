import React, { useEffect, useMemo, useState } from 'react'
import { Box, Typography, Tabs, Tab, useTheme } from '@mui/material'
import styled from '@emotion/styled'
import useSafeRouter from 'src/hooks/useSafeRouter'
import debounce from 'lodash/debounce'
import { useAuth } from 'src/hooks/useAuth'

import TextEllipsisWithModal from 'src/components/TextEllipsisWithModal'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import Search from 'src/views/utility/Search'
import { getNewIncomingPatientsLists } from 'src/lib/api/hospital/incomingPatient'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import HospitalTransferDrawer from 'src/components/housing/utils/HospitalTransferDrawer'
import {
  StyledTypographyProps,
  TransferFilters,
  HospitalTransferRow,
  HospitalTransferStats,
  IndexedHospitalTransferRow,
  TransferStatusInfo
} from 'src/types/housing/hospitalTransfer'
import { GridRenderCellParams, GridRowParams, GridColDef, GridPaginationModel } from '@mui/x-data-grid'
import { useTranslation } from 'react-i18next'
import ListingHeader from 'src/views/pages/housing/utils/ListingHeader'

const HospitalTransferListing = () => {
  const router = useSafeRouter()
  const { id } = router.query
  const theme = useTheme()
  const { t } = useTranslation()
  const authData: any = useAuth()
  const settings = authData?.userData?.settings

  const [activeTab, setActiveTab] = useState('pending')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchInput, setSearchInput] = useState<string>('')
  const [filters, setFilters] = useState<TransferFilters>({ page_no: 1, limit: 10, search: '' })
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false)
  const [selectedTransferRow, setSelectedTransferRow] = useState<HospitalTransferRow | null>(null)

  // Debounce search input
  const debouncedSearch = useMemo(() => debounce(setSearchQuery, 500), [])

  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  // Fetch hospital transfer listing data with filters and active tab
  const { data, isFetching, refetch } = useQuery({
    queryKey: ['transfer-hospital', filters, activeTab, id],
    queryFn: () =>
      getNewIncomingPatientsLists({
        page_no: filters?.page_no,
        limit: filters?.limit,
        q: filters?.search,
        entity_type: 'site',
        entity_id: id,
        reference_type: 'hospital_transfer',
        transfer_status: activeTab,
        request_from: 'mobile'
      }),
    enabled: !!id,
    placeholderData: keepPreviousData
  })

  const rows: HospitalTransferRow[] = data?.data?.result || []
  const total: number = data?.data?.total_count || 0
  const stats: HospitalTransferStats = data?.data?.stats || {}

  // Handles tab change and resets search state
  const handleTabChange = (e: React.SyntheticEvent, newValue: string): void => {
    setActiveTab(newValue)
    setSearchQuery('')
    setSearchInput('')
  }

  // Handles search input change with debouncing
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value
    setSearchInput(value)
    debouncedSearch(value)
  }

  // Sync debounced search to filters
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      search: searchQuery,
      page_no: 1
    }))
  }, [searchQuery])

  // Clears search input and updates filters
  const handleSearchClear = (): void => {
    setSearchInput('')
    debouncedSearch('')
  }

  // Gets the label for a tab, including the item count if available
  const getTabLabel = (key: string, label: string): string => {
    if (isFetching && !data) return label

    let statKey = `${key}_count`
    if (key === 'cancelled') statKey = 'canceled_count'

    const count = Number(stats[statKey] || 0)

    return count ? `${label} - ${count}` : label
  }

  // Determines the transfer status label  based on activity and settings
  const getTransferStatus = (item: HospitalTransferRow): TransferStatusInfo => {
    const transfer_type = item?.transfer_type

    const labels: Record<string, TransferStatusInfo> = {
      pending: { label: 'Pending' },
      cancelled: { label: 'Cancelled' },
      rejected: { label: 'Rejected' },
      completed: { label: 'Transfer Completed' },
      awaitingApproval: { label: 'Awaiting Acceptance' },
      loadingPending: { label: 'Loading Pending' },
      checkoutPending: { label: 'Security Checkout Pending' },
      checkingPending: { label: 'Security Checking Pending' }
    } as const

    // If transfer is explicitly canceled
    if (item?.transfer_status === 'CANCELED') return labels.cancelled

    // Map activity status to labels
    switch (item?.activity_status) {
      case 'COMPLETED':
        return labels.completed
      case 'CANCELED':
        return labels.cancelled
      case 'REJECTED':
        return labels.rejected
    }

    // Special case for carcass pending approval
    const isCarcassPending = transfer_type === 'carcass' && item?.activity_status === 'PENDING'
    if (settings?.ANIMAL_TRANSFER_REQUIRES_APPROVAL && isCarcassPending) {
      return labels.loadingPending
    }

    // If approval is not required, it moves to awaiting acceptance
    if (!settings?.ANIMAL_TRANSFER_REQUIRES_APPROVAL) {
      return labels.awaitingApproval
    }

    // Handle security-related statuses
    if (settings?.ANIMAL_TRANSFER_REQUIRES_SECURITY_APPROVAL) {
      switch (item?.activity_status) {
        case 'RIDE_STARTED':
          return item?.is_checkout_required === 1 ? labels.checkoutPending : labels.checkingPending

        case 'SECURITY_CHECKOUT_ALLOWED':
          return item?.is_checkin_required === 1 ? labels.checkingPending : labels.awaitingApproval

        case 'SECURITY_CHECKIN_ALLOWED':
          return labels.awaitingApproval
      }
    } else {
      // If security approval is NOT required
      switch (item?.activity_status) {
        case 'RIDE_STARTED':
        case 'SECURITY_CHECKIN_ALLOWED':
          return labels.awaitingApproval
      }
    }

    return labels.pending
  }

  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: t('s_no') as string,
      minWidth: 70,
      maxWidth: 80,
      sortable: false,
      renderCell: (params: GridRenderCellParams<IndexedHospitalTransferRow>) => (
        <StyledTypography sx={{ pl: 2 }}>{params?.row?.sl_no}</StyledTypography>
      )
    },
    {
      field: 'transfer_code',
      headerName: t('housing_module.transfer_code') as string,
      minWidth: 200,
      sortable: false,
      renderCell: (params: GridRenderCellParams<IndexedHospitalTransferRow>) => (
        <StyledTypography sx={{ pl: 2 }}>{params?.row?.transfer_code || '-'}</StyledTypography>
      )
    },
    {
      field: 'total_animals',
      headerName: t('housing_module.total_animals') as string,
      minWidth: 150,
      sortable: false,
      renderCell: (params: GridRenderCellParams<IndexedHospitalTransferRow>) => (
        <StyledTypography sx={{ pl: 2 }}>{params?.row?.total_animals || '-'}</StyledTypography>
      )
    },
    {
      field: 'source',
      headerName: t('housing_module.source') as string,
      minWidth: 200,
      sortable: false,
      renderCell: (params: GridRenderCellParams<IndexedHospitalTransferRow>) => (
        <StyledTypography sx={{ pl: 2 }}>{params?.row?.source_name}</StyledTypography>
      )
    },
    {
      field: 'destination',
      headerName: t('housing_module.destination') as string,
      minWidth: 200,
      sortable: false,
      renderCell: (params: GridRenderCellParams<IndexedHospitalTransferRow>) => (
        <StyledTypography sx={{ pl: 2 }}>{params?.row?.destination_name || '-'}</StyledTypography>
      )
    },
    {
      field: 'transfer_status',
      headerName: t('housing_module.transfer_status') as string,
      minWidth: 250,
      sortable: false,
      renderCell: (params: GridRenderCellParams<IndexedHospitalTransferRow>) => {
        const statusObj = getTransferStatus(params.row)

        return (
          <TextEllipsisWithModal
            enableDialog={false}
            text={statusObj.label}
            style={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '1rem',
              fontWeight: 400,
              pl: 1.4,
              maxWidth: '250px'
            }}
          />
        )
      }
    },
    {
      field: 'reason',
      headerName: t('housing_module.reason_for_transfer') as string,
      minWidth: 200,
      sortable: false,
      renderCell: (params: GridRenderCellParams<IndexedHospitalTransferRow>) => (
        <TextEllipsisWithModal
          enableDialog={false}
          text={params?.row?.reason_for_transfer || '-'}
          style={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '1rem',
            fontWeight: 400,
            pl: 1.4,
            maxWidth: '350px'
          }}
        />
      )
    },
    {
      field: 'requested_by',
      headerName: t('housing_module.requested_by') as string,
      flex: 1,
      minWidth: 250,
      sortable: false,
      renderCell: (params: GridRenderCellParams<IndexedHospitalTransferRow>) => (
        <Box sx={{ pl: 1.4 }}>
          <UserAvatarDetails
            user_name={`${params?.row?.user_first_name} ${params?.row?.user_last_name}`}
            profile_image={params?.row?.user_profile_pic || ''}
            date={params.row.created_at || ''}
            size='medium'
            show_time={true}
          />
        </Box>
      )
    }
  ]

  // Creates indexed rows for data grid
  const indexedRows: IndexedHospitalTransferRow[] = useMemo(() => {
    return rows.map((row, index) => ({
      ...row,
      id: row.transfer_id || `transfer-row-${index}`,
      sl_no: (filters.page_no - 1) * filters.limit + index + 1
    }))
  }, [rows, filters.page_no, filters.limit])

  // Handles data grid pagination changes
  const handlePaginationChange = (paginationModel: GridPaginationModel): void => {
    setFilters(prev => ({
      ...prev,
      page_no: paginationModel.page + 1,
      limit: paginationModel.pageSize
    }))
  }

  // Opens the transfer detail drawer on row click
  const handleRowClick = (params: GridRowParams<IndexedHospitalTransferRow>): void => {
    setSelectedTransferRow(params.row)
    setIsDrawerOpen(true)
  }

  return (
    <>
      <Box sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, mb: 4 }}>
          <ListingHeader title={t('housing_module.hospital_transfer')} totalCount={total} />
          <Search
            width='300px'
            placeholder={t('housing_module.search_by_animal_id') as string}
            value={searchInput}
            onChange={handleSearchChange}
            onClear={handleSearchClear}
            inputStyle={{ py: '12px', px: '12px' }}
          />
        </Box>

        <Box sx={{ display: 'inline-block', borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ minHeight: 48 }}>
            <Tab value='pending' label={getTabLabel('pending', t('pending'))} />
            <Tab value='intransit' label={getTabLabel('intransit', t('housing_module.in_transit'))} />
            <Tab value='completed' label={getTabLabel('completed', t('accepted'))} />
            <Tab value='cancelled' label={getTabLabel('cancelled', t('canceled'))} />
            <Tab value='rejected' label={getTabLabel('rejected', t('rejected'))} />
          </Tabs>
        </Box>

        <CommonTable
          columns={columns}
          indexedRows={indexedRows}
          rowHeight={60}
          total={total}
          loading={isFetching}
          paginationModel={{ page: filters.page_no - 1, pageSize: filters.limit }}
          setPaginationModel={handlePaginationChange}
          onRowClick={handleRowClick}
        />
      </Box>
      {isDrawerOpen && (
        <HospitalTransferDrawer
          open={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false)
            setSelectedTransferRow(null)
          }}
          transferId={selectedTransferRow?.transfer_id}
          onAcceptSuccess={() => refetch()}
          showQRCode={true}
        />
      )}
    </>
  )
}

export default React.memo(HospitalTransferListing)

const StyledTypography = styled(Typography)<StyledTypographyProps>(({ theme, fontWeight, fontSize, color, sx }) => ({
  fontSize: fontSize || '1rem',
  fontWeight: fontWeight || 400,
  color: color || (theme as any).palette?.customColors?.OnSurfaceVariant || (theme as any).palette?.text?.primary,
  ...(sx as any)
}))
