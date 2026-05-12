import React, { useState, useMemo, useCallback } from 'react'
import { Avatar, Box, Button, FormControl, MenuItem, Select, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { GridRenderCellParams } from '@mui/x-data-grid'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { debounce } from 'lodash'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import Search from 'src/views/utility/Search'
import FilterButtonWithNotification from 'src/views/utility/FilterButtonWithNotification'
import StatChip from 'src/views/utility/StatChip'
import AnimalIdCard from 'src/views/utility/AnimalIdCard'
import Icon from 'src/@core/components/icon'
import { getNecropsySpeciesList, NecropsySpeciesItem } from 'src/lib/api/collection/species'
import { ROUTES } from 'src/constants/routes'

interface NecropsyTabProps {
  speciesId?: string
}

const GENDER_LABELS: Record<string, string> = {
  male: 'M',
  female: 'F',
  undetermined: 'UD',
  indeterminate: 'ID'
}

const formatDate = (iso?: string | null) => {
  if (!iso) return '-'
  const d = new Date(iso.replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return iso

  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
}

const titleCase = (s?: string | null): string => {
  if (!s) return '-'

  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

interface RowLabels {
  aaid: string
  b: string
  m: string
}

const mapNecropsyRow = (item: NecropsySpeciesItem, slNo: number, labels: RowLabels) => ({
  id: `${item.mortality_id}_${slNo}`,
  sl_no: slNo,
  animal_id: item.animal_id ? `${labels.aaid} : ${item.animal_id}` : '-',
  uid:
    item.local_identifier_value && item.local_identifier_name
      ? `${item.local_identifier_name} : ${item.local_identifier_value}`
      : '-',
  animal_name: item.local_identifier_value || item.common_name || '-',
  scientific_name: item.scientific_name || '',
  gender: (item.type || '').toLowerCase() === 'group' ? 'G' : GENDER_LABELS[(item.sex || '').toLowerCase()] || '-',
  breed: item.breed_name ? `${labels.b} - ${item.breed_name}` : `${labels.b} - -`,
  morph: item.morph_name ? `${labels.m} - ${item.morph_name}` : `${labels.m} - -`,
  cause_of_death: titleCase(item.cause),
  necropsy_id: item.necropsy_id || null,
  mortality_id: item.mortality_id,
  necropsy_location: item.necropsy_location || '-',
  necropsy_date: formatDate(item.necropsy_date),
  reported_by: item.reported_by || '-',
  completed_by: item.user_profile_for_necropsy?.name || '-',
  site: item.site_name || '-',
  section: item.section_name || '-',
  enclosure: item.user_enclosure_name || '-',
  priority: titleCase(item.priority),
  image: item.default_icon || ''
})

const NecropsyTab: React.FC<NecropsyTabProps> = ({ speciesId }) => {
  const { t } = useTranslation()
  const theme = useTheme() as any
  const router = useRouter()
  const [searchValue, setSearchValue] = useState('')
  const [filters, setFilters] = useState({ page: 1, limit: 50, q: '', status: 'PENDING' })

  const debouncedSearch = useMemo(
    () => debounce((value: string) => setFilters(prev => ({ ...prev, q: value, page: 1 })), 500),
    []
  )
  const handleSearch = useCallback(
    (value: string) => {
      setSearchValue(value)
      debouncedSearch(value)
    },
    [debouncedSearch]
  )

  const { data: necropsyResponse, isLoading } = useQuery({
    queryKey: ['species-necropsy-list', speciesId, filters],
    queryFn: () =>
      getNecropsySpeciesList({
        taxonomy_id: speciesId as string,
        page_no: filters.page,
        status: filters.status,
        q: filters.q
      }),
    placeholderData: (prev: any) => prev,
    enabled: Boolean(speciesId)
  })

  const totalCount = Number(necropsyResponse?.total_count) || 0
  const getSlNo = (index: number): number => (filters.page - 1) * filters.limit + index + 1

  const rowLabels = useMemo<RowLabels>(
    () => ({
      aaid: t('species_module.label_aaid'),
      b: t('species_module.label_b'),
      m: t('species_module.label_m_short')
    }),
    [t]
  )

  const necropsyRows = useMemo(
    () => (necropsyResponse?.result || []).map((item, index) => mapNecropsyRow(item, getSlNo(index), rowLabels)),
    [necropsyResponse, filters.page, filters.limit, rowLabels]
  )

  const handlePaginationModelChange = (model: { page: number; pageSize: number }) => {
    setFilters(prev => ({ ...prev, page: model.page + 1, limit: model.pageSize }))
  }

  const columns = useMemo(
    () => [
    {
      width: 50,
      sortable: false,
      field: 'sl_no',
      headerName: t('species_module.col_no'),
      renderCell: (p: GridRenderCellParams) => (
        <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
          {p.row.sl_no}
        </Typography>
      )
    },
    {
      minWidth: 180,
      sortable: false,
      field: 'animal_id',
      headerName: t('species_module.col_animal_id'),
      renderCell: (p: GridRenderCellParams) => (
        <AnimalIdCard animalId={p.row.animal_id} uid={p.row.uid} image={p.row.image} />
      )
    },
    {
      width: 200,
      sortable: false,
      field: 'animal_name',
      headerName: t('species_module.col_animal_name'),
      renderCell: (p: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Typography
            variant='body2'
            sx={{ fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant, lineHeight: 1.4 }}
          >
            {p.row.animal_name || '-'}
          </Typography>
          {p.row.scientific_name && (
            <Typography
              variant='caption'
              sx={{ fontStyle: 'italic', color: theme.palette.customColors.neutralSecondary, lineHeight: 1.4 }}
            >
              {p.row.scientific_name}
            </Typography>
          )}
        </Box>
      )
    },
    {
      width: 90,
      sortable: false,
      field: 'gender',
      headerName: t('species_module.col_gender'),
      renderCell: (p: GridRenderCellParams) => {
        const g = p.row.gender
        const bg =
          g === 'M'
            ? `${theme.palette.customColors.SecondaryContainer}80`
            : g === 'F'
            ? `${theme.palette.customColors.Tertiary}4D`
            : g === 'G'
            ? theme.palette.customColors.addPrimary
            : theme.palette.customColors.SurfaceVariant
        const tc =
          g === 'M'
            ? theme.palette.customColors.addPrimary
            : g === 'F'
            ? theme.palette.customColors.Tertiary
            : g === 'G'
            ? theme.palette.common.white
            : theme.palette.customColors.Error

        return <StatChip value={g} bgcolor={bg} color={tc} />
      }
    },
    {
      width: 160,
      sortable: false,
      field: 'breed',
      headerName: t('species_module.col_breed_morph'),
      renderCell: (p: GridRenderCellParams) => (
        <Box>
          <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontSize: '0.8rem' }}>
            {p.row.breed}
          </Typography>
          <Typography variant='caption' sx={{ color: theme.palette.customColors.neutralSecondary }}>
            {p.row.morph}
          </Typography>
        </Box>
      )
    },
    {
      width: 140,
      sortable: false,
      field: 'cause_of_death',
      headerName: t('species_module.col_cause_of_death'),
      renderCell: (p: GridRenderCellParams) => (
        <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
          {p.row.cause_of_death}
        </Typography>
      )
    },
    {
      width: 140,
      sortable: false,
      field: 'necropsy_id',
      headerName: t('species_module.col_necropsy_id'),
      renderCell: (p: GridRenderCellParams) => (
        <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
          {p.row.necropsy_id || '-'}
        </Typography>
      )
    },
    {
      width: 160,
      sortable: false,
      field: 'necropsy_report',
      headerName: t('species_module.col_necropsy_report'),
      renderCell: (p: GridRenderCellParams) =>
        p.row.necropsy_id ? (
          <Typography variant='body2' sx={{ fontWeight: 500, color: theme.palette.customColors.OnSurface }}>
            {t('species_module.yes_uppercase')}
          </Typography>
        ) : (
          <Typography
            variant='body2'
            sx={{ fontWeight: 500, color: theme.palette.customColors.addPrimary, cursor: 'pointer' }}
          >
            {t('species_module.attach_file')}
          </Typography>
        )
    },
    {
      width: 150,
      sortable: false,
      field: 'reported_by',
      headerName: t('species_module.col_reported_by'),
      renderCell: (p: GridRenderCellParams) => (
        <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
          {p.row.reported_by}
        </Typography>
      )
    },
    {
      width: 160,
      sortable: false,
      field: 'completed_by',
      headerName: t('species_module.col_completed_by'),
      renderCell: (p: GridRenderCellParams) => (
        <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
          {p.row.completed_by || '-'}
        </Typography>
      )
    },
    {
      width: 180,
      sortable: false,
      field: 'enclosure',
      headerName: t('species_module.col_enclosure'),
      renderCell: (p: GridRenderCellParams) => (
        <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
          {p.row.enclosure}
        </Typography>
      )
    },
    {
      width: 150,
      sortable: false,
      field: 'site',
      headerName: t('species_module.col_site'),
      renderCell: (p: GridRenderCellParams) => (
        <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
          {p.row.site}
        </Typography>
      )
    }
  ],
    [t, theme]
  )

  const stickyStyles = {
    '& .MuiDataGrid-cell': { py: 2.5, px: 3, display: 'flex', alignItems: 'center' },
    '& .MuiDataGrid-row:hover': { cursor: 'pointer' },
    '& .MuiDataGrid-columnHeader': { px: 3 },
    '& .MuiDataGrid-cell[data-field="sl_no"]': {
      position: 'sticky',
      left: 0,
      zIndex: 3,
      backgroundColor: theme.palette.background.paper
    },
    '& .MuiDataGrid-columnHeader[data-field="sl_no"]': {
      position: 'sticky',
      left: 0,
      zIndex: 5,
      backgroundColor: theme.palette.customColors.customTableHeaderBg
    },
    '& .MuiDataGrid-cell[data-field="animal_id"]': {
      position: 'sticky',
      left: 50,
      zIndex: 3,
      backgroundColor: theme.palette.background.paper,
      borderRight: `1px solid ${theme.palette.customColors.OutlineVariant}`
    },
    '& .MuiDataGrid-columnHeader[data-field="animal_id"]': {
      position: 'sticky',
      left: 50,
      zIndex: 5,
      backgroundColor: theme.palette.customColors.customTableHeaderBg,
      borderRight: `1px solid ${theme.palette.customColors.OutlineVariant}`
    },
    '& .MuiDataGrid-row:hover .MuiDataGrid-cell[data-field="sl_no"]': {
      backgroundColor: theme.palette.customColors.Surface
    },
    '& .MuiDataGrid-row:hover .MuiDataGrid-cell[data-field="animal_id"]': {
      backgroundColor: theme.palette.customColors.Surface
    }
  }

  return (
    <Box>
      <Box
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 4 }}
      >
        <Typography variant='h6' sx={{ fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}>
          {t('species_module.necropsy_count_header')} ({totalCount})
        </Typography>
        <Button
          variant='text'
          onClick={() => {}}
          endIcon={<Icon icon='solar:download-square-linear' />}
          sx={{
            color: theme.palette.customColors.OnSurface,
            fontWeight: 500,
            textTransform: 'none',
            fontSize: '0.875rem'
          }}
        >
          {t('download')}
        </Button>
      </Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          mb: 4,
          gap: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size='small' sx={{ minWidth: 100 }}>
            <Select
              value={filters.status}
              onChange={e => setFilters(prev => ({ ...prev, status: e.target.value as string, page: 1 }))}
              sx={{
                borderRadius: '4px',
                fontSize: '0.875rem',
                color: theme.palette.customColors.OnSurfaceVariant,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.customColors.OutlineVariant }
              }}
            >
              <MenuItem value='PENDING'>{t('species_module.pending')}</MenuItem>
              <MenuItem value='DRAFT'>{t('species_module.draft')}</MenuItem>
              <MenuItem value='COMPLETED'>{t('species_module.completed')}</MenuItem>
            </Select>
          </FormControl>
          <Search
            borderRadius='4px'
            width='180px'
            placeholder={t('search')}
            value={searchValue}
            onClear={() => handleSearch('')}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
          />
        </Box>
        <FilterButtonWithNotification label={t('filter')} onClick={() => {}} sx={{ height: 36 }} />
      </Box>
      <CommonTable
        columns={columns}
        indexedRows={necropsyRows}
        total={totalCount}
        loading={isLoading}
        paginationModel={{ page: filters.page - 1, pageSize: filters.limit }}
        setPaginationModel={handlePaginationModelChange}
        handleSortModel={() => {}}
        searchValue=''
        getRowHeight={() => 'auto'}
        onRowClick={(params: any) => {
          const navId = params.row.necropsy_id || params.row.mortality_id
          const mortalityId = params.row.mortality_id
          //  const qs = mortalityId ? `?mortality_id=${mortalityId}` : ''
          // router.push(`/collection/species/${speciesId}/necropsy/${navId}${qs}`)
          if (speciesId && navId) router.push(ROUTES.collection.necropsy(speciesId, navId, mortalityId))
        }}
        externalTableStyle={stickyStyles}
      />
    </Box>
  )
}

export default NecropsyTab
