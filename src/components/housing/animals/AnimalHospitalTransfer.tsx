import React, { useMemo, useState } from 'react'
import { Box, Typography, useTheme } from '@mui/material'
import styled from '@emotion/styled'
import { useRouter } from 'next/router'
import { useAuth } from 'src/hooks/useAuth'

import TextEllipsisWithModal from 'src/components/TextEllipsisWithModal'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { getNewIncomingPatientsLists } from 'src/lib/api/hospital/incomingPatient'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import HospitalTransferDrawer from 'src/components/housing/utils/HospitalTransferDrawer'
import { GridRenderCellParams, GridRowParams, GridColDef, GridPaginationModel } from '@mui/x-data-grid'

interface StyledTypographyProps {
  fontWeight?: number | string
  fontSize?: string
  color?: string
  sx?: any
}
interface TransferFilters {
  page_no: number
  limit: number
}
interface HospitalTransferRow {
  transfer_id?: string | number
  transfer_code?: string
  transfer_status?: string
  activity_status?: string
  is_checkout_required?: number
  is_checkin_required?: number
  total_animals?: number | string
  source_name?: string
  destination_name?: string
  reason_for_transfer?: string
  user_first_name?: string
  user_last_name?: string
  user_profile_pic?: string
  created_at?: string
  transfer_type?: string
}
interface IndexedHospitalTransferRow extends HospitalTransferRow {
  id: number | string
  sl_no: number
}
interface TransferStatusInfo {
  label: string
}

const AnimalHospitalTransfer = () => {
  const router = useRouter()
  const { id } = router.query
  const theme = useTheme()
  const authData: any = useAuth()
  const settings = authData?.userData?.settings

  const [filters, setFilters] = useState<TransferFilters>({ page_no: 1, limit: 10 })
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false)
  const [selectedTransferRow, setSelectedTransferRow] = useState<HospitalTransferRow | null>(null)

  // Fetch hospital transfer listing data with filters
  const { data, isFetching, refetch } = useQuery({
    queryKey: ['transfer-hospital', filters, id],
    queryFn: () =>
      getNewIncomingPatientsLists({
        page_no: filters?.page_no,
        limit: filters?.limit,
        entity_type: 'animal',
        entity_id: id,
        reference_type: 'hospital_transfer',
        request_from: 'mobile'
      }),
    enabled: !!id,
    placeholderData: keepPreviousData
  })

  const rows: HospitalTransferRow[] = data?.data?.result || []
  const total: number = data?.data?.total_count || 0

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
      headerName: 'Sl No',
      minWidth: 70,
      maxWidth: 80,
      sortable: false,
      renderCell: (params: GridRenderCellParams<IndexedHospitalTransferRow>) => (
        <StyledTypography sx={{ pl: 2 }}>{params?.row?.sl_no}</StyledTypography>
      )
    },
    {
      field: 'transfer_code',
      headerName: 'Transfer Code',
      minWidth: 200,
      sortable: false,
      renderCell: (params: GridRenderCellParams<IndexedHospitalTransferRow>) => (
        <StyledTypography sx={{ pl: 2 }}>{params?.row?.transfer_code || '-'}</StyledTypography>
      )
    },
    {
      field: 'total_animals',
      headerName: 'Total Animals',
      minWidth: 150,
      sortable: false,
      renderCell: (params: GridRenderCellParams<IndexedHospitalTransferRow>) => (
        <StyledTypography sx={{ pl: 2 }}>{params?.row?.total_animals || '-'}</StyledTypography>
      )
    },
    {
      field: 'source',
      headerName: 'Source',
      minWidth: 200,
      sortable: false,
      renderCell: (params: GridRenderCellParams<IndexedHospitalTransferRow>) => (
        <StyledTypography sx={{ pl: 2 }}>{params?.row?.source_name}</StyledTypography>
      )
    },
    {
      field: 'destination',
      headerName: 'Destination',
      minWidth: 200,
      sortable: false,
      renderCell: (params: GridRenderCellParams<IndexedHospitalTransferRow>) => (
        <StyledTypography sx={{ pl: 2 }}>{params?.row?.destination_name || '-'}</StyledTypography>
      )
    },
    {
      field: 'transfer_status',
      headerName: 'Transfer Status',
      minWidth: 250,
      sortable: false,
      renderCell: (params: GridRenderCellParams<IndexedHospitalTransferRow>) => {
        const statusObj = getTransferStatus(params.row)
        return (
          <TextEllipsisWithModal
            enableDialog={false}
            text={statusObj.label}
            style={{
              color: theme.palette.customColors.OnSurfaceVariant || theme.palette.text.primary,
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
      headerName: 'Reason For Transfer',
      minWidth: 200,
      sortable: false,
      renderCell: (params: GridRenderCellParams<IndexedHospitalTransferRow>) => (
        <TextEllipsisWithModal
          enableDialog={false}
          text={params?.row?.reason_for_transfer || '-'}
          style={{
            color: theme.palette.customColors.OnSurfaceVariant || theme.palette.text.primary,
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
      headerName: 'Requested By',
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

export default React.memo(AnimalHospitalTransfer)

const StyledTypography = styled(Typography)<StyledTypographyProps>(({ theme, fontWeight, fontSize, color, sx }) => ({
  fontSize: fontSize || '1rem',
  fontWeight: fontWeight || 400,
  color: color || (theme as any).palette?.customColors?.OnSurfaceVariant || (theme as any).palette?.text?.primary,
  ...(sx as any)
}))
