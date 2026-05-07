import React, { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardHeader,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography
} from '@mui/material'
import { GridRenderCellParams, GridSortModel } from '@mui/x-data-grid'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@mui/material/styles'
import { LoadingButton } from '@mui/lab'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import Icon from 'src/@core/components/icon'
import { usePariveshContext } from 'src/context/PariveshContext'
import { getBatchListSpecies } from 'src/lib/api/parivesh/batchListSpecies'
import { deleteBatchToOrg } from 'src/lib/api/parivesh/addBatch'
import Toaster from 'src/components/Toaster'
import Utility from 'src/utility'

// ==================== Types ====================

interface BatchRow {
  id: number
  batch_id: string
  batch_code: string
  no_of_animals: number
  created_on?: string
  submitted_on?: string
  accepted_on?: string
  status?: string
  created_by_user?: { user_name?: string; profile_pic?: string }
  submitted_by_user?: { user_name?: string; profile_pic?: string }
  [key: string]: any
}

// ==================== Reported Batches (Yet to Submit) ====================

const ReportedBatchesTable: React.FC = () => {
  const { t } = useTranslation()
  const theme = useTheme() as any
  const router = useRouter()
  const queryClient = useQueryClient()
  const { selectedParivesh } = usePariveshContext()

  const [sortBy, setSortBy] = useState('DESC')
  const [sortColumn, setSortColumn] = useState('created_on')
  const [filters, setFilters] = useState({ page: 1, limit: 50 })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [btnLoader, setBtnLoader] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['parivesh-reported-batches', selectedParivesh?.id, filters, sortBy, sortColumn],
    queryFn: () =>
      getBatchListSpecies({
        params: {
          status: 'yet_to_submitted',
          page: filters.page,
          sortBy,
          sortColumn,
          limit: filters.limit,
          org_id: selectedParivesh?.id !== 'all' ? selectedParivesh?.id : null
        }
      }),
    enabled: Boolean(selectedParivesh?.id)
  })

  const rows: BatchRow[] = useMemo(() => {
    return (data?.data?.data || []).map((el: any, i: number) => ({ ...el, id: i + 1 }))
  }, [data])

  const total = Number(data?.data?.total_count) || 0

  const handleSortModel = (newModel: GridSortModel) => {
    if (newModel.length) {
      setSortBy(newModel[0].sort === 'asc' ? 'DESC' : 'ASC')
      setSortColumn(newModel[0].field)
    }
  }

  const confirmDelete = async () => {
    if (!selectedId) return
    try {
      setBtnLoader(true)
      const res = await deleteBatchToOrg({ org_id: selectedParivesh?.id }, selectedId)
      if (res?.success) {
        Toaster({ type: 'success', message: t('parivesh_module.batch_deleted_successfully') })
        queryClient.invalidateQueries({ queryKey: ['parivesh-reported-batches'] })
      } else {
        Toaster({ type: 'error', message: t('something_went_wrong') })
      }
    } catch {
      Toaster({ type: 'error', message: t('something_went_wrong') })
    } finally {
      setBtnLoader(false)
      setIsDeleteModalOpen(false)
      setSelectedId(null)
    }
  }

  const columns = [
    {
      flex: 0.2,
      width: 60,
      field: 'sl_no',
      headerName: 'S.NO',
      sortable: false,
      renderCell: (p: GridRenderCellParams) => <Typography variant='body2'>{p.row.id}</Typography>
    },
    {
      flex: 0.2,
      minWidth: 120,
      field: 'batch_code',
      headerName: t('parivesh_module.batch_id'),
      sortable: false,
      renderCell: (p: GridRenderCellParams) => <Typography variant='body2'>{p.row.batch_code || '-'}</Typography>
    },
    {
      flex: 0.3,
      minWidth: 120,
      field: 'no_of_animals',
      headerName: t('parivesh_module.no_of_animals'),
      sortable: false,
      renderCell: (p: GridRenderCellParams) => <Typography variant='body2'>{p.row.no_of_animals || '-'}</Typography>
    },
    {
      flex: 0.5,
      minWidth: 160,
      field: 'created_by_user',
      headerName: t('parivesh_module.created_by'),
      sortable: false,
      renderCell: (p: GridRenderCellParams) => (
        <UserAvatarDetails
          profile_image={p.row.created_by_user?.profile_pic}
          user_name={p.row.created_by_user?.user_name}
          date={p.row.created_on}
          size='small'
        />
      )
    },
    {
      flex: 0.3,
      minWidth: 100,
      field: 'status',
      headerName: t('status'),
      sortable: false,
      renderCell: (p: GridRenderCellParams) => (
        <Typography variant='body2' sx={{ color: '#E93353' }}>
          {p.row.status ? t('parivesh_module.yet_to_submit') : '-'}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 80,
      field: 'actions',
      headerName: t('action'),
      sortable: false,
      renderCell: (p: GridRenderCellParams) => (
        <IconButton
          size='small'
          onClick={e => {
            e.stopPropagation()
            setSelectedId(p.row.batch_id)
            setIsDeleteModalOpen(true)
          }}
        >
          <Icon icon='mdi:delete-outline' />
        </IconButton>
      )
    }
  ]

  return (
    <>
      <Card sx={{ p: 4 }}>
        <CardHeader title={t('parivesh_module.to_be_submitted')} />
        <CommonTable
          columns={columns}
          indexedRows={rows}
          total={total}
          loading={isLoading}
          paginationModel={{ page: filters.page - 1, pageSize: filters.limit }}
          setPaginationModel={(m: any) => setFilters({ page: m.page + 1, limit: m.pageSize })}
          handleSortModel={handleSortModel}
          searchValue=''
          getRowHeight={() => 'auto'}
          onRowClick={(p: any) => {
            if (p.row.batch_id) router.push(`/parivesh/home/${p.row.batch_id}`)
          }}
          externalTableStyle={{
            '& .MuiDataGrid-cell': { padding: '12px 8px' },
            '& .MuiDataGrid-row:hover': { cursor: 'pointer' }
          }}
        />
      </Card>

      <Dialog open={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <DialogTitle>
          <IconButton
            onClick={() => setIsDeleteModalOpen(false)}
            sx={{ top: 10, right: 10, position: 'absolute', color: 'grey.500' }}
          >
            <Icon icon='mdi:close' />
          </IconButton>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', pt: 4 }}>
            <Box sx={{ p: 4, borderRadius: 3, backgroundColor: theme.palette.customColors.mdAntzNeutral }}>
              <Icon width='70px' height='70px' color='#ff3838' icon='mdi:delete' />
            </Box>
            <Typography sx={{ fontWeight: 600, fontSize: 24, textAlign: 'center' }}>
              {t('parivesh_module.are_you_sure_you_want_to_delete_this_batch')}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-evenly', width: '100%' }}>
              <Button
                variant='outlined'
                sx={{ color: 'gray', width: '45%' }}
                onClick={() => setIsDeleteModalOpen(false)}
              >
                {t('cancel')}
              </Button>
              <LoadingButton
                loading={btnLoader}
                variant='contained'
                color='error'
                sx={{ width: '45%' }}
                onClick={confirmDelete}
              >
                {t('delete')}
              </LoadingButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent />
      </Dialog>
    </>
  )
}

// ==================== Submitted Batches ====================

const SubmittedBatchesTable: React.FC = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const { selectedParivesh } = usePariveshContext()

  const [sort, setSort] = useState('DESC')
  const [sortColumn, setSortColumn] = useState('submitted_on')
  const [filters, setFilters] = useState({ page: 1, limit: 50 })

  const { data, isLoading } = useQuery({
    queryKey: ['parivesh-submitted-batches', selectedParivesh?.id, filters, sort, sortColumn],
    queryFn: () =>
      getBatchListSpecies({
        params: {
          status: 'all',
          page: filters.page,
          sort,
          sortColumn,
          limit: filters.limit,
          org_id: selectedParivesh?.id !== 'all' ? selectedParivesh?.id : null
        }
      }),
    enabled: Boolean(selectedParivesh?.id)
  })

  const rows: BatchRow[] = useMemo(() => {
    return (data?.data?.data || []).map((el: any, i: number) => ({ ...el, id: i + 1 }))
  }, [data])

  const total = Number(data?.data?.total_count) || 0

  const handleSortModel = (newModel: GridSortModel) => {
    if (newModel.length) {
      setSort(newModel[0].sort === 'asc' ? 'ASC' : 'DESC')
      setSortColumn(newModel[0].field)
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'submitted':
        return '#00AFD6'
      case 'accepted':
        return '#37BD69'
      case 'withdrawn':
        return '#FA6140'
      default:
        return '#E93353'
    }
  }

  const getStatusLabel = (status?: string) => {
    if (!status) return '-'
    if (status === 'accepted') return t('parivesh_module.approved')
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const columns = [
    {
      flex: 0.2,
      width: 60,
      field: 'sl_no',
      headerName: 'S.NO',
      sortable: false,
      renderCell: (p: GridRenderCellParams) => <Typography variant='body2'>{p.row.id}</Typography>
    },
    {
      flex: 0.2,
      minWidth: 120,
      field: 'batch_code',
      headerName: t('parivesh_module.batch_id'),
      sortable: false,
      renderCell: (p: GridRenderCellParams) => <Typography variant='body2'>{p.row.batch_code || '-'}</Typography>
    },
    {
      flex: 0.3,
      minWidth: 140,
      field: 'registration_id',
      headerName: t('parivesh_module.registration_id'),
      sortable: false,
      renderCell: (p: GridRenderCellParams) => (
        <Typography noWrap variant='body2' sx={{ fontWeight: 500 }}>
          {p.row.registration_id || '-'}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 120,
      field: 'no_of_animals',
      headerName: t('parivesh_module.no_of_animals'),
      sortable: false,
      renderCell: (p: GridRenderCellParams) => <Typography variant='body2'>{p.row.no_of_animals || '-'}</Typography>
    },
    {
      flex: 0.3,
      minWidth: 140,
      field: 'submitted_on',
      headerName: t('parivesh_module.submitted_date'),
      sortable: false,
      renderCell: (p: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant='body2'>
            {p.row.submitted_on ? Utility.formatDisplayDate(Utility.convertUTCToLocal(p.row.submitted_on)) : '-'}
          </Typography>
          <Typography variant='body2' sx={{ color: '#839D8D', fontSize: '12px' }}>
            {p.row.submitted_on ? Utility.extractHoursAndMinutes(Utility.convertUTCToLocal(p.row.submitted_on)) : ''}
          </Typography>
        </Box>
      )
    },
    {
      flex: 0.5,
      minWidth: 160,
      field: 'submitted_by_user',
      headerName: t('parivesh_module.submitted_by'),
      sortable: false,
      renderCell: (p: GridRenderCellParams) => (
        <UserAvatarDetails
          profile_image={p.row.submitted_by_user?.profile_pic}
          user_name={p.row.submitted_by_user?.user_name}
          date={p.row.submitted_on}
          size='small'
        />
      )
    },
    {
      flex: 0.3,
      minWidth: 120,
      field: 'status',
      headerName: t('status'),
      sortable: false,
      renderCell: (p: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography noWrap variant='body2' sx={{ color: getStatusColor(p.row.status), fontSize: 14 }}>
            {getStatusLabel(p.row.status)}
          </Typography>
          <Typography noWrap variant='body2' sx={{ color: '#44544a9c', fontSize: 12 }}>
            {p.row.submitted_on ? Utility.formatDisplayDate(Utility.convertUTCToLocal(p.row.submitted_on)) : '-'}
          </Typography>
        </Box>
      )
    }
  ]

  return (
    <Card sx={{ p: 4, mt: 4 }}>
      <CardHeader title={t('parivesh_module.submitted_batches')} />
      <CommonTable
        columns={columns}
        indexedRows={rows}
        total={total}
        loading={isLoading}
        paginationModel={{ page: filters.page - 1, pageSize: filters.limit }}
        setPaginationModel={(m: any) => setFilters({ page: m.page + 1, limit: m.pageSize })}
        handleSortModel={handleSortModel}
        searchValue=''
        getRowHeight={() => 'auto'}
        onRowClick={(p: any) => {
          if (p.row.batch_id) router.push(`/parivesh/home/${p.row.batch_id}`)
        }}
        externalTableStyle={{
          '& .MuiDataGrid-cell': { padding: '12px 8px' },
          '& .MuiDataGrid-row:hover': { cursor: 'pointer' }
        }}
      />
    </Card>
  )
}

// ==================== BatchesTab ====================

const BatchesTab: React.FC = () => (
  <Box>
    <ReportedBatchesTable />
    <SubmittedBatchesTable />
  </Box>
)

export default BatchesTab
