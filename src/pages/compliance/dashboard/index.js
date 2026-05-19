import { useState, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useQuery } from '@tanstack/react-query'
import { Box, Typography } from '@mui/material'
import {
  getOverallStats,
  getOrgsList,
  getSitesList,
  getSpeciesList
} from 'src/lib/api/compliance/dashboard'
import OverviewView from 'src/views/pages/compliance/dashboard/OverviewView'

const ENTITY_FETCHERS = {
  orgs: getOrgsList,
  sites: getSitesList,
  species: getSpeciesList
}

const ROW_ID_KEYS = {
  orgs: 'org_id',
  sites: 'site_id',
  species: 'compliance_species_id'
}

const renderOrgCell = params => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
    <Typography variant='body2'>{params.row.organization_name}</Typography>
    {params.row.short_code ? (
      <Typography
        variant='caption'
        sx={{ px: 1, py: 0.25, borderRadius: 0.5, bgcolor: 'customColors.OnBackground', color: 'primary.dark', fontWeight: 600 }}
      >
        {params.row.short_code}
      </Typography>
    ) : null}
  </Box>
)

const buildColumns = entity => {
  if (entity === 'orgs') {
    return [
      { field: 'organization_name', headerName: 'Organization', flex: 3, renderCell: renderOrgCell },
      { field: 'site_count', headerName: 'Sites', flex: 1, align: 'right', headerAlign: 'right' },
      { field: 'compliance_species_count', headerName: 'Species', flex: 1, align: 'right', headerAlign: 'right' },
      { field: 'animal_count', headerName: 'Animals', flex: 1, align: 'right', headerAlign: 'right' }
    ]
  }
  if (entity === 'sites') {
    return [
      { field: 'site_name', headerName: 'Site', flex: 3 },
      { field: 'org_count', headerName: 'Organizations', flex: 1, align: 'right', headerAlign: 'right' },
      { field: 'compliance_species_count', headerName: 'Species', flex: 1, align: 'right', headerAlign: 'right' },
      { field: 'animal_count', headerName: 'Animals', flex: 1, align: 'right', headerAlign: 'right' }
    ]
  }
  return [
    { field: 'compliance_common_name', headerName: 'Common name', flex: 2 },
    { field: 'compliance_scientific_name', headerName: 'Scientific name', flex: 2 },
    { field: 'org_count', headerName: 'Orgs', flex: 1, align: 'right', headerAlign: 'right' },
    { field: 'site_count', headerName: 'Sites', flex: 1, align: 'right', headerAlign: 'right' },
    { field: 'animal_count', headerName: 'Animals', flex: 1, align: 'right', headerAlign: 'right' }
  ]
}

const ComplianceDashboardOverview = () => {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('orgs')
  const [searchValue, setSearchValue] = useState('')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 })

  const { data: overall } = useQuery({
    queryKey: ['compliance-dashboard-overall'],
    queryFn: getOverallStats
  })

  const { data: tabData, isFetching } = useQuery({
    queryKey: ['compliance-dashboard-list', activeTab, paginationModel, searchValue],
    queryFn: () =>
      ENTITY_FETCHERS[activeTab]({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        q: searchValue || undefined
      }),
    placeholderData: previousData => previousData
  })

  const rows = useMemo(() => {
    const items = tabData?.data?.items ?? []
    return items
      .map(item => ({
        ...item,
        id: item.org_id ?? item.site_id ?? item.compliance_species_id
      }))
      .filter(row => row.id !== undefined)
  }, [tabData])

  const handleRowClick = params => {
    if (params.row.org_id) router.push(`/compliance/dashboard/orgs/${params.row.org_id}`)
    else if (params.row.site_id) router.push(`/compliance/dashboard/sites/${params.row.site_id}`)
    else if (params.row.compliance_species_id) router.push(`/compliance/dashboard/species/${params.row.compliance_species_id}`)
  }

  const handleTabChange = next => {
    setActiveTab(next)
    setPaginationModel({ page: 0, pageSize: 20 })
    setSearchValue('')
  }

  return (
    <OverviewView
      stats={overall?.data}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      rows={rows}
      total={tabData?.data?.total ?? 0}
      columns={buildColumns(activeTab)}
      paginationModel={paginationModel}
      setPaginationModel={setPaginationModel}
      searchValue={searchValue}
      handleSearch={setSearchValue}
      loading={isFetching}
      onRowClick={handleRowClick}
      onExportClick={() => {}}
      onViewAllAnimals={() => router.push('/compliance/animals')}
    />
  )
}

export default ComplianceDashboardOverview
