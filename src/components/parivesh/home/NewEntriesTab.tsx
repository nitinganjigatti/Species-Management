import React, { useCallback, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardHeader,
  Checkbox,
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
import Icon from 'src/@core/components/icon'
import ImageLightbox from 'src/components/parivesh/ImageLightbox'
import CustomAccordion from 'src/components/parivesh/CustomAccordion'
import { mapOrgData, OrgCountItem } from './OverviewTab'
import { usePariveshContext } from 'src/context/PariveshContext'
import { getEntryList } from 'src/lib/api/parivesh/entryList'
import { getOrgCountList } from 'src/lib/api/parivesh/organizationCount'
import { addBatches } from 'src/lib/api/parivesh/addBatch'
import { deleteSpeciesToOrganization } from 'src/lib/api/parivesh/addSpecies'
import Toaster from 'src/components/Toaster'
import Utility from 'src/utility'
import NewEntryDetailsDialog from './NewEntryDetailsDialog'

// ==================== Types ====================

interface EntryRow {
  id: number
  uid: number
  species_image: string
  common_name: string
  scientific_name: string
  gender: string
  animal_count: number
  possession_type: string
  transaction_date: string
  attachments?: any[]
  [key: string]: any
}

// ==================== Component ====================

const NewEntriesTab: React.FC = () => {
  const { t } = useTranslation()
  const theme = useTheme() as any
  const router = useRouter()
  const queryClient = useQueryClient()
  const { selectedParivesh } = usePariveshContext()

  const [sort, setSort] = useState('desc')
  const [sortColumn, setSortColumn] = useState('scientific_name')
  const [filters, setFilters] = useState({ page: 1, limit: 50 })
  const [selectedRows, setSelectedRows] = useState<number[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [detailData, setDetailData] = useState<EntryRow | null>(null)
  const [btnLoader, setBtnLoader] = useState(false)

  // ==================== Data Fetching ====================

  const { data, isLoading } = useQuery({
    queryKey: ['parivesh-entries', selectedParivesh?.id, filters, sort, sortColumn],
    queryFn: () =>
      getEntryList({
        params: {
          sort,
          org_id: selectedParivesh?.id,
          sortColumn,
          page: filters.page,
          limit: filters.limit
        }
      }),
    enabled: Boolean(selectedParivesh?.id)
  })

  const rows: EntryRow[] = useMemo(() => {
    return (data?.data?.data || []).map((el: any, i: number) => ({ ...el, uid: i + 1, id: el.id || i + 1 }))
  }, [data])

  const total = Number(data?.data?.total_count) || 0

  // Org count list — used to render the "To be submitted" accordion above the table.
  // Matches the old Pages Router behavior: shows yet-to-submit stats per organization.
  const { data: orgCountData } = useQuery({
    queryKey: ['parivesh-org-count', selectedParivesh?.id],
    queryFn: () => getOrgCountList({ params: { id: selectedParivesh?.id } }),
    enabled: Boolean(selectedParivesh?.id)
  })

  const organizationCountList = useMemo(() => {
    if (!orgCountData?.data) return []

    // Mirrors pre-migration logic exactly: filter API response by selected org id, then transform.
    // When 'all' is selected, no org_id matches → empty list → accordion hidden by render guard.
    return (orgCountData.data as OrgCountItem[])
      .filter(org => org.org_id === selectedParivesh?.id)
      .map(org => mapOrgData(org, t))
  }, [orgCountData, selectedParivesh, t])

  // ==================== Handlers ====================

  const handleSortModel = (newModel: GridSortModel) => {
    if (newModel.length) {
      setSort(newModel[0].sort === 'asc' ? 'asc' : 'desc')
      setSortColumn(newModel[0].field)
    }
  }

  const updateSelectAllState = useCallback(
    (currentRows: EntryRow[], currentSelected: number[], model: { page: number; limit: number }) => {
      const start = (model.page - 1) * model.limit
      const end = start + model.limit
      const pageRows = currentRows.slice(start, end)
      setSelectAll(pageRows.length > 0 && pageRows.every(r => currentSelected.includes(r.id)))
    },
    []
  )

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    setSelectAll(checked)
    const start = (filters.page - 1) * filters.limit
    const end = start + filters.limit
    const pageRows = rows.slice(start, end)
    if (checked) {
      setSelectedRows(prev => [...new Set([...prev, ...pageRows.map(r => r.id)])])
    } else {
      setSelectedRows(prev => prev.filter(id => !pageRows.some(r => r.id === id)))
    }
  }

  const handleRowSelection = (id: number) => {
    setSelectedRows(prev => {
      const next = prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
      updateSelectAllState(rows, next, filters)
      return next
    })
  }

  const handleCreateBatch = async () => {
    if (selectedRows.length === 0) {
      router.push('?tab=batches')
      return
    }
    try {
      setBtnLoader(true)
      const res = await addBatches({ org_id: selectedParivesh?.id, id: selectedRows })
      if (res?.success) {
        // Refresh every cached list that the new batch affects, so the user sees fresh data
        // when they land on the Batches tab — not the stale pre-create snapshot.
        queryClient.invalidateQueries({ queryKey: ['parivesh-entries'] })
        queryClient.invalidateQueries({ queryKey: ['parivesh-reported-batches'] })
        queryClient.invalidateQueries({ queryKey: ['parivesh-org-count'] })

        Toaster({ type: 'success', message: res?.message })
        setSelectedRows([])
        setSelectAll(false)
        router.push('?tab=batches')
      } else {
        Toaster({ type: 'error', message: res?.message })
      }
    } catch (e) {
      Toaster({ type: 'error', message: t('something_went_wrong') })
    } finally {
      setBtnLoader(false)
    }
  }

  const handleEdit = (e: React.MouseEvent, row: EntryRow) => {
    e.stopPropagation()
    router.push(`/parivesh/home/new-entries/${row.id}/edit`)
  }

  const handleDelete = (id: number) => {
    setSelectedId(id)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedId) return
    try {
      const res = await deleteSpeciesToOrganization(selectedId, { org_id: selectedParivesh?.id })
      if (res?.success) {
        Toaster({ type: 'success', message: t('parivesh_module.species_deleted_successfully') })
        queryClient.invalidateQueries({ queryKey: ['parivesh-entries'] })
      } else {
        Toaster({ type: 'error', message: t('something_went_wrong') })
      }
    } catch {
      Toaster({ type: 'error', message: t('something_went_wrong') })
    } finally {
      setIsDeleteModalOpen(false)
      setSelectedId(null)
    }
  }

  // ==================== Columns ====================

  const columns = [
    {
      flex: 0.2,
      width: 60,
      field: 'sl_no',
      headerName: 'S.NO',
      sortable: false,
      renderCell: (p: GridRenderCellParams) => <Typography variant='body2'>{p.row.uid}</Typography>
    },
    {
      flex: 0.3,
      minWidth: 80,
      field: 'species_image',
      headerName: t('image'),
      sortable: false,
      renderCell: (p: GridRenderCellParams) => (
        <div onClick={e => e.stopPropagation()}>
          <ImageLightbox images={p.row.species_image} />
        </div>
      )
    },
    {
      flex: 0.4,
      minWidth: 140,
      field: 'common_name',
      headerName: t('parivesh_module.common_name'),
      sortable: false,
      renderCell: (p: GridRenderCellParams) => (
        <Typography noWrap variant='body2' sx={{ fontWeight: 500 }}>
          {p.row.common_name || '-'}
        </Typography>
      )
    },
    {
      flex: 0.4,
      minWidth: 140,
      field: 'scientific_name',
      headerName: t('parivesh_module.scientific_name'),
      sortable: false,
      renderCell: (p: GridRenderCellParams) => (
        <Typography noWrap variant='body2'>
          {p.row.scientific_name || '-'}
        </Typography>
      )
    },
    {
      flex: 0.4,
      minWidth: 120,
      field: 'gender',
      headerName: t('parivesh_module.gender_count'),
      sortable: false,
      renderCell: (p: GridRenderCellParams) => {
        const gender = p.row.gender ? p.row.gender.charAt(0).toUpperCase() + p.row.gender.slice(1) : '-'
        return <Typography variant='body2'>{gender !== '-' ? `${gender} : ${p.row.animal_count}` : '-'}</Typography>
      }
    },
    {
      flex: 0.3,
      minWidth: 120,
      field: 'possession_type',
      headerName: t('category'),
      sortable: false,
      renderCell: (p: GridRenderCellParams) => (
        <Typography noWrap variant='body2'>
          {p.row.possession_type ? p.row.possession_type.charAt(0).toUpperCase() + p.row.possession_type.slice(1) : '-'}
        </Typography>
      )
    },
    {
      flex: 0.4,
      minWidth: 140,
      field: 'transaction_date',
      headerName: t('date'),
      sortable: false,
      renderCell: (p: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography noWrap variant='body2'>
            {p.row.transaction_date
              ? Utility.formatDisplayDate(Utility.convertUTCToLocal(p.row.transaction_date))
              : '-'}
          </Typography>
          <Typography noWrap variant='body2' sx={{ color: '#839D8D', fontSize: '12px' }}>
            {p.row.transaction_date
              ? Utility.extractHoursAndMinutes(Utility.convertUTCToLocal(p.row.transaction_date))
              : ''}
          </Typography>
        </Box>
      )
    },
    {
      flex: 0.3,
      minWidth: 100,
      field: 'action',
      headerName: t('action'),
      sortable: false,
      renderCell: (p: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton size='small' onClick={e => handleEdit(e, p.row as EntryRow)}>
            <Icon icon='mdi:pencil-outline' />
          </IconButton>
          <IconButton
            size='small'
            onClick={e => {
              e.stopPropagation()
              handleDelete(p.row.id)
            }}
          >
            <Icon icon='mdi:delete-outline' />
          </IconButton>
        </Box>
      )
    },
    {
      flex: 0.3,
      minWidth: 80,
      field: 'checkbox',
      sortable: false,
      headerName: (
        <Checkbox
          checked={selectAll}
          indeterminate={selectedRows.length > 0 && !selectAll}
          onChange={handleSelectAll}
        />
      ) as any,
      renderCell: (p: GridRenderCellParams) => (
        <Checkbox
          checked={selectedRows.includes(p.row.id)}
          onClick={e => e.stopPropagation()}
          onChange={() => handleRowSelection(p.row.id)}
        />
      )
    }
  ]

  // ==================== Render ====================

  return (
    <>
      {organizationCountList.length > 0 && (
        <Card sx={{ p: 4, mb: 4 }}>
          {organizationCountList.map((org, idx) => (
            <CustomAccordion
              key={idx}
              title={org.yetToSubmitAccordionData.title}
              data={org.yetToSubmitAccordionData.data}
              cards={org.yetToSubmitAccordionData.cards}
              backgroundImage={org.cover_image || ''}
              isOrganization={selectedParivesh?.id !== 'all'}
              organizationName={selectedParivesh?.id !== 'all' ? org.organization_name : ''}
              summaryIcon='mdi:arrow-top-right'
            />
          ))}
        </Card>
      )}

      <Card sx={{ p: 4 }}>
        <CardHeader
          sx={{ p: 0 }}
          title={t('parivesh_module.new_entries')}
          action={
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button
                variant='contained'
                startIcon={<Icon icon='mdi:add' />}
                onClick={() => router.push('/parivesh/home/new-entries/add')}
              >
                {t('parivesh_module.add_entry')}
              </Button>
              <LoadingButton
                loading={btnLoader}
                variant='contained'
                sx={{ backgroundColor: '#1F415B', '&:hover': { backgroundColor: '#0D2B3E' } }}
                onClick={handleCreateBatch}
                disabled={selectedRows.length === 0}
              >
                {t('parivesh_module.create_batch')}
              </LoadingButton>
            </Box>
          }
        />
        <CommonTable
          columns={columns}
          indexedRows={rows}
          total={total}
          loading={isLoading}
          paginationModel={{ page: filters.page - 1, pageSize: filters.limit }}
          setPaginationModel={(m: any) => {
            const newFilters = { page: m.page + 1, limit: m.pageSize }
            setFilters(newFilters)
            updateSelectAllState(rows, selectedRows, newFilters)
          }}
          handleSortModel={handleSortModel}
          searchValue=''
          getRowHeight={() => 'auto'}
          onRowClick={() => {}}
          onCellClick={(p: any) => {
            if (p.field !== 'action' && p.field !== 'checkbox' && p.field !== 'species_image') {
              setDetailData(p.row)
              setIsDetailModalOpen(true)
            }
          }}
          externalTableStyle={{
            '& .MuiDataGrid-cell': { padding: '12px 8px' },
            '& .MuiDataGrid-row:hover': { cursor: 'pointer' }
          }}
        />
      </Card>

      {/* Entry Detail Dialog */}
      <NewEntryDetailsDialog
        isEditModal={isDetailModalOpen}
        setIsEditModal={setIsDetailModalOpen}
        detailData={detailData}
      />

      {/* Delete Confirmation Dialog */}
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
              {t('parivesh_module.are_you_sure_you_want_to_delete_this_species')}
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

export default NewEntriesTab
