import { useState, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useQuery } from '@tanstack/react-query'
import { useTheme } from '@mui/material/styles'
import { getSpeciesDetail, getSpeciesOrgs, getSpeciesSites } from 'src/lib/api/compliance/dashboard'
import EntityDetailView from 'src/views/pages/compliance/dashboard/EntityDetailView'

const SpeciesDetailPage = () => {
  const router = useRouter()
  const theme = useTheme()
  const tokens = theme.palette.customColors
  const { id } = router.query
  const [pagination, setPagination] = useState({ page: 0, pageSize: 20 })
  const [search, setSearch] = useState('')

  const { data: detail } = useQuery({
    queryKey: ['compliance-species-detail', id],
    queryFn: () => getSpeciesDetail(id),
    enabled: Boolean(id)
  })

  const { data: orgsData, isFetching: orgsLoading } = useQuery({
    queryKey: ['compliance-species-orgs', id, pagination, search],
    queryFn: () =>
      getSpeciesOrgs(id, {
        page: pagination.page + 1,
        limit: pagination.pageSize,
        q: search || undefined
      }),
    enabled: Boolean(id),
    placeholderData: previousData => previousData
  })

  const { data: sitesData } = useQuery({
    queryKey: ['compliance-species-sites', id],
    queryFn: () => getSpeciesSites(id, { page: 1, limit: 50 }),
    enabled: Boolean(id)
  })

  const orgRows = useMemo(
    () =>
      (orgsData?.data?.items ?? []).map(item => ({
        ...item,
        id: item.org_id
      })),
    [orgsData]
  )

  const secondaryRows = useMemo(
    () =>
      (sitesData?.data?.items ?? []).map(s => ({
        id: s.site_id,
        name: s.site_name,
        value: s.animal_count,
        subtext: `${s.org_count} orgs`
      })),
    [sitesData]
  )

  const species = detail?.data
  const stats = [
    { label: 'Organizations', value: species?.org_count, icon: 'mdi:office-building-outline', color: 'primary.dark', bg: tokens.OnBackground },
    { label: 'Sites', value: species?.site_count, icon: 'mdi:map-marker-outline', color: 'secondary.main', bg: tokens.antzSecondaryBg },
    { label: 'Animals tracked', value: species?.animal_count, icon: 'mdi:paw', color: tokens.Tertiary, bg: tokens.BgTeritary }
  ]

  const breadcrumb = [
    { label: 'Compliance Dashboard', href: '/compliance/dashboard' },
    { label: 'Species', href: '/compliance/dashboard' }
  ]
  if (router.query.from_org_name && router.query.from_org) {
    breadcrumb.push({
      label: router.query.from_org_name,
      href: `/compliance/dashboard/orgs/${router.query.from_org}`
    })
  } else if (router.query.from_site_name && router.query.from_site) {
    breadcrumb.push({
      label: router.query.from_site_name,
      href: `/compliance/dashboard/sites/${router.query.from_site}`
    })
  }
  breadcrumb.push({ label: species?.compliance_common_name ?? '…' })

  return (
    <EntityDetailView
      breadcrumb={breadcrumb}
      title={species?.compliance_common_name ?? '…'}
      subtitle={species ? species.compliance_scientific_name : ''}
      stats={stats}
      primaryPanelTitle='Organizations'
      primaryPanelSubtitle={`${species?.org_count ?? 0} organizations holding this species`}
      primaryRows={orgRows}
      primaryTotal={orgsData?.data?.total ?? 0}
      primaryColumns={[
        { field: 'organization_name', headerName: 'Organization', flex: 3 },
        { field: 'short_code', headerName: 'Code', flex: 1 },
        { field: 'site_count', headerName: 'Sites', flex: 1, align: 'right', headerAlign: 'right' },
        { field: 'animal_count', headerName: 'Animals', flex: 1, align: 'right', headerAlign: 'right' }
      ]}
      primaryPagination={pagination}
      setPrimaryPagination={setPagination}
      primarySearch={search}
      setPrimarySearch={setSearch}
      primaryLoading={orgsLoading}
      onPrimaryRowClick={params =>
        router.push({
          pathname: `/compliance/dashboard/orgs/${params.row.org_id}`,
          query: { from_species: id, from_species_name: species?.compliance_common_name ?? '' }
        })
      }
      secondaryPanelTitle='Sites'
      secondaryPanelSubtitle={`${species?.site_count ?? 0} sites · share of animals`}
      secondaryRows={secondaryRows}
      onSecondaryRowClick={r =>
        router.push({
          pathname: `/compliance/dashboard/sites/${r.id}`,
          query: { from_species: id, from_species_name: species?.compliance_common_name ?? '' }
        })
      }
      animalsCount={species?.animal_count}
      onViewAnimals={() => router.push(`/compliance/animals?compliance_species_id=${id}`)}
      onExport={() => {}}
    />
  )
}

export default SpeciesDetailPage
