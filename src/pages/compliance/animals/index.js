import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useTheme } from '@mui/material/styles'
import { useQuery } from '@tanstack/react-query'
import { Avatar, Box, Typography } from '@mui/material'
import { getComplianceAnimals } from 'src/lib/api/compliance/dashboard'
import AnimalsListingView from 'src/views/pages/compliance/dashboard/AnimalsListingView'

const FILTER_KEYS = ['org_id', 'site_id', 'compliance_species_id']

const ComplianceAnimalsPage = () => {
  const router = useRouter()
  const theme = useTheme()
  const tokens = theme.palette.customColors
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 })
  const [searchValue, setSearchValue] = useState('')
  const [filters, setFilters] = useState({})

  // Sync URL → filters on mount and route change
  useEffect(() => {
    if (!router.isReady) return
    const next = {}
    FILTER_KEYS.forEach(k => {
      if (router.query[k]) next[k] = router.query[k]
    })
    setFilters(next)
  }, [router.isReady, router.query])

  const { data, isFetching } = useQuery({
    queryKey: ['compliance-animals', paginationModel, searchValue, filters],
    queryFn: () =>
      getComplianceAnimals({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        q: searchValue || undefined,
        ...filters
      }),
    enabled: router.isReady
  })

  const rows = useMemo(
    () => (data?.data?.items ?? []).map(a => ({ ...a, id: a.animal_id })),
    [data]
  )

  const activeChips = useMemo(() => {
    const chips = []
    if (filters.org_id) chips.push({ key: 'org_id', label: `Org: ${filters.org_id}` })
    if (filters.site_id) chips.push({ key: 'site_id', label: `Site: ${filters.site_id}` })
    if (filters.compliance_species_id) chips.push({ key: 'compliance_species_id', label: `Species: ${filters.compliance_species_id}` })
    return chips
  }, [filters])

  const handleRemoveChip = key => {
    const { [key]: _, ...next } = filters
    setFilters(next)
    const { [key]: __, ...remaining } = router.query
    router.replace({ pathname: router.pathname, query: remaining }, undefined, { shallow: true })
  }

  const handleClearAll = () => {
    setFilters({})
    router.replace({ pathname: router.pathname, query: {} }, undefined, { shallow: true })
  }

  const renderAnimalCell = params => {
    const a = params.row
    const initials = (a.compliance_common_name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    const genderBg = a.sex === 'male' ? tokens.SecondaryContainer : a.sex === 'female' ? tokens.AntzTertiary : tokens.displaybgSecondary
    const genderFg = a.sex === 'male' ? tokens.OnSecondaryContainer : a.sex === 'female' ? tokens.rusticRed : tokens.Error
    const genderLabel = a.sex === 'male' ? '♂' : a.sex === 'female' ? '♀' : '?'
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 12, fontWeight: 600 }}>{initials}</Avatar>
        <Box>
          <Typography variant='body2' sx={{ fontWeight: 600 }}>
            #{a.animal_id} · {a.compliance_common_name}
            <Box component='span' sx={{ ml: 1, px: 1, py: 0.25, borderRadius: 0.5, fontSize: 10, fontWeight: 600, bgcolor: genderBg, color: genderFg }}>
              {genderLabel}
            </Box>
          </Typography>
          <Typography variant='caption' sx={{ color: 'customColors.neutralSecondary', fontStyle: 'italic' }}>
            {a.compliance_scientific_name}
          </Typography>
        </Box>
      </Box>
    )
  }

  const renderLocationCell = params => (
    <Box>
      <Typography variant='body2' sx={{ fontWeight: 500 }}>{params.row.site_name}</Typography>
      <Typography variant='caption' sx={{ color: 'customColors.neutralSecondary' }}>
        {params.row.section_name} · {params.row.enclosure_name}
      </Typography>
    </Box>
  )

  const columns = [
    { field: 'animal', headerName: 'Animal', flex: 2, renderCell: renderAnimalCell, sortable: false },
    { field: 'location', headerName: 'Location', flex: 1.5, renderCell: renderLocationCell, sortable: false },
    { field: 'organization_name', headerName: 'Organization', flex: 1 },
    {
      field: 'birth_date',
      headerName: 'Born',
      flex: 1,
      valueFormatter: ({ value }) => (value ? new Date(value).toLocaleDateString() : '—')
    }
  ]

  return (
    <AnimalsListingView
      total={data?.data?.total ?? 0}
      rows={rows}
      columns={columns}
      paginationModel={paginationModel}
      setPaginationModel={setPaginationModel}
      searchValue={searchValue}
      handleSearch={setSearchValue}
      activeChips={activeChips}
      onRemoveChip={handleRemoveChip}
      onClearAll={handleClearAll}
      loading={isFetching}
      onRowClick={params => router.push(`/housing/animal/${params.row.animal_id}`)}
      onExportClick={() => {}}
    />
  )
}

export default ComplianceAnimalsPage
