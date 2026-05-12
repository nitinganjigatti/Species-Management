import { useState, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useQuery } from '@tanstack/react-query'
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

const buildColumns = entity => {
  if (entity === 'orgs') {
    return [
      { field: 'organization_name', headerName: 'Organization', flex: 3 },
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
      })
  })

  const rows = useMemo(() => {
    const items = tabData?.data?.items ?? []
    const idKey = ROW_ID_KEYS[activeTab]
    return items.map(item => ({ ...item, id: item[idKey] }))
  }, [tabData, activeTab])

  const handleRowClick = params => {
    const id = params.row[ROW_ID_KEYS[activeTab]]
    router.push(`/compliance/dashboard/${activeTab}/${id}`)
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
