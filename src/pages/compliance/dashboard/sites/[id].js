import { useState, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useQuery } from '@tanstack/react-query'
import { useTheme } from '@mui/material/styles'
import { getSiteDetail, getSiteSpecies, getSiteOrgs } from 'src/lib/api/compliance/dashboard'
import EntityDetailView from 'src/views/pages/compliance/dashboard/EntityDetailView'

const SiteDetailPage = () => {
  const router = useRouter()
  const theme = useTheme()
  const tokens = theme.palette.customColors
  const { id } = router.query
  const [pagination, setPagination] = useState({ page: 0, pageSize: 20 })
  const [search, setSearch] = useState('')

  const { data: detail } = useQuery({
    queryKey: ['compliance-site-detail', id],
    queryFn: () => getSiteDetail(id),
    enabled: Boolean(id)
  })

  const { data: speciesData, isFetching: speciesLoading } = useQuery({
    queryKey: ['compliance-site-species', id, pagination, search],
    queryFn: () =>
      getSiteSpecies(id, {
        page: pagination.page + 1,
        limit: pagination.pageSize,
        q: search || undefined
      }),
    enabled: Boolean(id)
  })

  const { data: orgsData } = useQuery({
    queryKey: ['compliance-site-orgs', id],
    queryFn: () => getSiteOrgs(id, { page: 1, limit: 50 }),
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
      (orgsData?.data?.items ?? []).map(o => ({
        id: o.org_id,
        name: o.organization_name,
        value: o.animal_count,
        subtext: `${o.compliance_species_count} spp.`
      })),
    [orgsData]
  )

  const site = detail?.data
  const stats = [
    { label: 'Compliance species', value: site?.compliance_species_count, icon: 'mdi:leaf', color: 'primary.dark', bg: tokens.OnBackground },
    { label: 'Organizations', value: site?.org_count, icon: 'mdi:office-building-outline', color: 'secondary.main', bg: tokens.antzSecondaryBg },
    { label: 'Animals tracked', value: site?.animal_count, icon: 'mdi:paw', color: tokens.Tertiary, bg: tokens.BgTeritary }
  ]

  return (
    <EntityDetailView
      breadcrumb={[
        { label: 'Compliance Dashboard', href: '/compliance/dashboard' },
        { label: 'Sites', href: '/compliance/dashboard' },
        { label: site?.site_name ?? '…' }
      ]}
      title={site?.site_name ?? '…'}
      subtitle={site ? `Site · ID ${site.site_id}` : ''}
      stats={stats}
      primaryPanelTitle='Species'
      primaryPanelSubtitle={`${site?.compliance_species_count ?? 0} compliance species at this site`}
      primaryRows={speciesRows}
      primaryTotal={speciesData?.data?.total ?? 0}
      primaryColumns={[
        { field: 'compliance_common_name', headerName: 'Common name', flex: 2 },
        { field: 'compliance_scientific_name', headerName: 'Scientific name', flex: 2 },
        { field: 'animal_count', headerName: 'Animals', flex: 1, align: 'right', headerAlign: 'right' },
        { field: 'org_count', headerName: 'Orgs', flex: 1, align: 'right', headerAlign: 'right' }
      ]}
      primaryPagination={pagination}
      setPrimaryPagination={setPagination}
      primarySearch={search}
      setPrimarySearch={setSearch}
      primaryLoading={speciesLoading}
      onPrimaryRowClick={params => router.push(`/compliance/dashboard/species/${params.row.compliance_species_id}`)}
      secondaryPanelTitle='Organizations'
      secondaryPanelSubtitle={`${site?.org_count ?? 0} organizations · share of animals`}
      secondaryRows={secondaryRows}
      onSecondaryRowClick={r => router.push(`/compliance/dashboard/orgs/${r.id}`)}
      animalsCount={site?.animal_count}
      onViewAnimals={() => router.push(`/compliance/animals?site_id=${id}`)}
      onExport={() => {}}
    />
  )
}

export default SiteDetailPage
