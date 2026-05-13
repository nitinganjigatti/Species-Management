import { useState, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useQuery } from '@tanstack/react-query'
import { useTheme } from '@mui/material/styles'
import { getOrgDetail, getOrgSpecies, getOrgSites } from 'src/lib/api/compliance/dashboard'
import EntityDetailView from 'src/views/pages/compliance/dashboard/EntityDetailView'

const OrgDetailPage = () => {
  const router = useRouter()
  const theme = useTheme()
  const tokens = theme.palette.customColors
  const { id } = router.query
  const [pagination, setPagination] = useState({ page: 0, pageSize: 20 })
  const [search, setSearch] = useState('')

  const { data: detail } = useQuery({
    queryKey: ['compliance-org-detail', id],
    queryFn: () => getOrgDetail(id),
    enabled: Boolean(id)
  })

  const { data: speciesData, isFetching: speciesLoading } = useQuery({
    queryKey: ['compliance-org-species', id, pagination, search],
    queryFn: () =>
      getOrgSpecies(id, {
        page: pagination.page + 1,
        limit: pagination.pageSize,
        q: search || undefined
      }),
    enabled: Boolean(id),
    placeholderData: previousData => previousData
  })

  const { data: sitesData } = useQuery({
    queryKey: ['compliance-org-sites', id],
    queryFn: () => getOrgSites(id, { page: 1, limit: 50 }),
    enabled: Boolean(id)
  })

  const speciesRows = useMemo(
    () =>
      (speciesData?.data?.items ?? []).map(item => ({
        ...item,
        id: item.compliance_species_id
      })),
    [speciesData]
  )

  const secondaryRows = useMemo(
    () =>
      (sitesData?.data?.items ?? []).map(s => ({
        id: s.site_id,
        name: s.site_name,
        value: s.animal_count,
        subtext: `${s.species_count} spp.`
      })),
    [sitesData]
  )

  const org = detail?.data
  const stats = [
    { label: 'Compliance species', value: org?.compliance_species_count, icon: 'mdi:leaf', color: 'primary.dark', bg: tokens.OnBackground },
    { label: 'Sites', value: org?.site_count, icon: 'mdi:map-marker-outline', color: 'secondary.main', bg: tokens.antzSecondaryBg },
    { label: 'Animals tracked', value: org?.animal_count, icon: 'mdi:paw', color: tokens.Tertiary, bg: tokens.BgTeritary }
  ]

  const breadcrumb = [
    { label: 'Compliance Dashboard', href: '/compliance/dashboard' },
    { label: 'Organizations', href: '/compliance/dashboard' }
  ]
  if (router.query.from_species_name && router.query.from_species) {
    breadcrumb.push({
      label: router.query.from_species_name,
      href: `/compliance/dashboard/species/${router.query.from_species}`
    })
  } else if (router.query.from_site_name && router.query.from_site) {
    breadcrumb.push({
      label: router.query.from_site_name,
      href: `/compliance/dashboard/sites/${router.query.from_site}`
    })
  }
  breadcrumb.push({ label: org?.organization_name ?? '…' })

  return (
    <EntityDetailView
      breadcrumb={breadcrumb}
      title={org?.organization_name ?? '…'}
      subtitle={org ? `Organization · ID ${org.org_id}` : ''}
      stats={stats}
      primaryPanelTitle='Species'
      primaryPanelSubtitle={`${org?.compliance_species_count ?? 0} compliance species in this organization`}
      primaryRows={speciesRows}
      primaryTotal={speciesData?.data?.total ?? 0}
      primaryColumns={[
        { field: 'compliance_common_name', headerName: 'Common name', flex: 2 },
        { field: 'compliance_scientific_name', headerName: 'Scientific name', flex: 2 },
        { field: 'animal_count', headerName: 'Animals', flex: 1, align: 'right', headerAlign: 'right' },
        { field: 'site_count', headerName: 'Sites', flex: 1, align: 'right', headerAlign: 'right' }
      ]}
      primaryPagination={pagination}
      setPrimaryPagination={setPagination}
      primarySearch={search}
      setPrimarySearch={setSearch}
      primaryLoading={speciesLoading}
      onPrimaryRowClick={params =>
        router.push({
          pathname: `/compliance/dashboard/species/${params.row.compliance_species_id}`,
          query: { from_org: id, from_org_name: org?.organization_name ?? '' }
        })
      }
      secondaryPanelTitle='Sites'
      secondaryPanelSubtitle={`${org?.site_count ?? 0} sites · share of animals`}
      secondaryRows={secondaryRows}
      onSecondaryRowClick={r =>
        router.push({
          pathname: `/compliance/dashboard/sites/${r.id}`,
          query: { from_org: id, from_org_name: org?.organization_name ?? '' }
        })
      }
      animalsCount={org?.animal_count}
      onViewAnimals={() => router.push(`/compliance/animals?org_id=${id}`)}
      onExport={() => {}}
    />
  )
}

export default OrgDetailPage
