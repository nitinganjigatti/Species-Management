import React, { useMemo, useState } from 'react'
import { Box, Card, CardHeader, Typography } from '@mui/material'
import { GridRenderCellParams, GridSortModel } from '@mui/x-data-grid'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { usePariveshContext } from 'src/context/PariveshContext'
import { getBatchListSpecies } from 'src/lib/api/parivesh/batchListSpecies'
import Utility from 'src/utility'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'

const OrganizationTable: React.FC = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const { selectedParivesh } = usePariveshContext()

  const [sortBy, setSortBy] = useState('DESC')
  const [sortColumn, setSortColumn] = useState('accepted_on')
  const [filters, setFilters] = useState({ page: 1, limit: 50 })

  const { data, isLoading } = useQuery({
    queryKey: ['parivesh-approved-batches', selectedParivesh?.id, filters, sortBy, sortColumn],
    queryFn: () =>
      getBatchListSpecies({
        params: {
          status: 'accepted',
          page: filters.page,
          sort: sortBy,
          sortColumn,
          limit: filters.limit,
          org_id: selectedParivesh?.id !== 'all' ? selectedParivesh?.id : null
        }
      }),
    enabled: Boolean(selectedParivesh?.id)
  })

  const rows = useMemo(() => {
    return (data?.data?.data || []).map((el: any, i: number) => ({ ...el, id: i + 1 }))
  }, [data])

  const total = Number(data?.data?.total_count) || 0

  const handleSortModel = (newModel: GridSortModel) => {
    if (newModel.length) {
      setSortBy(newModel[0].sort === 'asc' ? 'ASC' : 'DESC')
      setSortColumn(newModel[0].field)
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
      flex: 0.5,
      minWidth: 140,
      field: 'registration_id',
      headerName: 'REGISTRATION ID',
      sortable: false,
      renderCell: (p: GridRenderCellParams) => (
        <Typography noWrap variant='body2' sx={{ fontWeight: 500 }}>
          {p.row.registration_id || '-'}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 100,
      field: 'species_count',
      headerName: 'NO. OF SPECIES',
      sortable: false,
      renderCell: (p: GridRenderCellParams) => <Typography variant='body2'>{p.row.species_count || '-'}</Typography>
    },
    {
      flex: 0.3,
      minWidth: 100,
      field: 'no_of_animals',
      headerName: 'NO. OF ANIMALS',
      sortable: false,
      renderCell: (p: GridRenderCellParams) => <Typography variant='body2'>{p.row.no_of_animals || '-'}</Typography>
    },
    {
      flex: 0.4,
      minWidth: 140,
      field: 'accepted_on',
      headerName: 'APPROVED DATE',
      sortable: false,
      renderCell: (p: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant='body2'>
            {p.row.accepted_on ? Utility.formatDisplayDate(Utility.convertUTCToLocal(p.row.accepted_on)) : '-'}
          </Typography>
          <Typography variant='body2' sx={{ color: '#839D8D', fontSize: '12px' }}>
            {p.row.accepted_on ? Utility.extractHoursAndMinutes(Utility.convertUTCToLocal(p.row.accepted_on)) : ''}
          </Typography>
        </Box>
      )
    },
    {
      flex: 0.5,
      minWidth: 160,
      field: 'submitted_by_user',
      headerName: 'SUBMITTED BY',
      sortable: false,
      renderCell: (p: GridRenderCellParams) => (
        <UserAvatarDetails
          profile_image={p.row.submitted_by_user?.profile_pic}
          user_name={p.row.submitted_by_user?.user_name}
          date={p.row.submitted_on}
          size='small'
        />
      )
    }
  ]

  return (
    <Card sx={{ p: 4 }}>
      <CardHeader title={t('parivesh_module.approved_batches')} />
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
        onRowClick={(params: any) => {
          const { batch_id } = params.row
          if (batch_id) router.push(`/parivesh/home/${batch_id}`)
        }}
        externalTableStyle={{
          '& .MuiDataGrid-cell': { padding: '12px 8px' },
          '& .MuiDataGrid-row:hover': { cursor: 'pointer' }
        }}
      />
    </Card>
  )
}

export default OrganizationTable
