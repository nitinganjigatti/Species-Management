import React, { useMemo } from 'react'
import { Box, Card, CardContent } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import CustomAccordion from 'src/components/parivesh/CustomAccordion'
import { usePariveshContext } from 'src/context/PariveshContext'
import { getOrgCountList } from 'src/lib/api/parivesh/organizationCount'
import OrganizationTable from './OrganizationTable'

// ==================== Types ====================

interface StatItem {
  value: number
  label: string
  color: string
  borderColor: string
}

interface CardItem {
  value: number
  bgColor: string
}

interface PossessionCard {
  value: number
  content: string
  bgColor: string
  items: CardItem[]
}

interface PossessionCounts {
  births: { total: number; male: number; female: number; other: number }
  deaths: { total: number; male: number; female: number; other: number }
  acquisitions: { total: number; male: number; female: number; other: number }
  transfers: { total: number; male: number; female: number; other: number }
}

export interface CountData {
  total_animal: number
  net_animal: number
  male_count: number
  female_count: number
  other_count: number
  species_count: number
  possession_counts: PossessionCounts
}

export interface OrgCountItem {
  organization_name: string
  org_id: number
  species_image: string
  cover_image: string
  approved_count_data: CountData
  yet_to_submitted_count: CountData
  submitted_count_data: CountData
}

export interface TransformedOrg {
  organization_name: string
  org_id: number
  species_image: string
  cover_image: string
  approvedAccordionData: { title: string; data: StatItem[]; cards: PossessionCard[] }
  yetToSubmitAccordionData: { title: string; data: StatItem[]; cards: PossessionCard[] }
  submittedAccordionData: { title: string; data: StatItem[]; cards: PossessionCard[] }
}

// ==================== Helpers ====================

export const buildStats = (d: CountData, t: (key: string) => string): StatItem[] => [
  { value: d.total_animal, label: t('parivesh_module.animal_records'), color: '#FFFFFF', borderColor: '#FFFFFF' },
  { value: d.net_animal, label: t('parivesh_module.net_animals'), color: '#FFFFFF', borderColor: '#FFFFFF' },
  { value: d.male_count, label: t('male'), color: '#00AFD6', borderColor: '#00AFD6' },
  { value: d.female_count, label: t('female'), color: '#FFD3D3', borderColor: '#FFD3D3' },
  { value: d.other_count, label: t('parivesh_module.others'), color: '#FFFFFF', borderColor: '#FFFFFF' },
  { value: d.species_count, label: t('parivesh_module.total_species'), color: '#E4B819', borderColor: '#E4B819' }
]

export const buildCards = (d: CountData, t: (key: string) => string): PossessionCard[] => [
  {
    value: d.possession_counts.births.total,
    content: t('parivesh_module.births'),
    bgColor: '#37BD69',
    items: [
      { value: d.possession_counts.births.male, bgColor: '#00AFD6' },
      { value: d.possession_counts.births.female, bgColor: '#FFD3D3' },
      { value: d.possession_counts.births.other, bgColor: '#FFFFFF' }
    ]
  },
  {
    value: d.possession_counts.deaths.total,
    content: t('parivesh_module.deaths'),
    bgColor: '#E93353',
    items: [
      { value: d.possession_counts.deaths.male, bgColor: '#00AFD6' },
      { value: d.possession_counts.deaths.female, bgColor: '#FFD3D3' },
      { value: d.possession_counts.deaths.other, bgColor: '#FFFFFF' }
    ]
  },
  {
    value: d.possession_counts.acquisitions.total,
    content: t('parivesh_module.acquisition'),
    bgColor: '#37BD69',
    items: [
      { value: d.possession_counts.acquisitions.male, bgColor: '#00AFD6' },
      { value: d.possession_counts.acquisitions.female, bgColor: '#FFD3D3' },
      { value: d.possession_counts.acquisitions.other, bgColor: '#FFFFFF' }
    ]
  },
  {
    value: d.possession_counts.transfers.total,
    content: t('parivesh_module.transfers'),
    bgColor: '#FA6140',
    items: [
      { value: d.possession_counts.transfers.male, bgColor: '#00AFD6' },
      { value: d.possession_counts.transfers.female, bgColor: '#FFD3D3' },
      { value: d.possession_counts.transfers.other, bgColor: '#FFFFFF' }
    ]
  }
]

export const mapOrgData = (org: OrgCountItem, t: (key: string) => string): TransformedOrg => ({
  organization_name: org.organization_name,
  org_id: org.org_id,
  species_image: org.species_image,
  cover_image: org.cover_image,
  approvedAccordionData: {
    title: t('parivesh_module.approved_by_parivesh'),
    data: buildStats(org.approved_count_data, t),
    cards: buildCards(org.approved_count_data, t)
  },
  yetToSubmitAccordionData: {
    title: t('parivesh_module.to_be_submitted'),
    data: buildStats(org.yet_to_submitted_count, t),
    cards: buildCards(org.yet_to_submitted_count, t)
  },
  submittedAccordionData: {
    title: t('parivesh_module.submitted_data'),
    data: buildStats(org.submitted_count_data, t),
    cards: buildCards(org.submitted_count_data, t)
  }
})

// ==================== Empty state data ====================

const getEmptyStats = (t: (key: string) => string): StatItem[] => [
  { value: 0, label: t('parivesh_module.animal_records'), color: '#FFFFFF', borderColor: '#FFFFFF' },
  { value: 0, label: t('parivesh_module.net_animals'), color: '#FFFFFF', borderColor: '#FFFFFF' },
  { value: 0, label: t('male'), color: '#00AFD6', borderColor: '#00AFD6' },
  { value: 0, label: t('female'), color: '#FFD3D3', borderColor: '#FFD3D3' },
  { value: 0, label: t('parivesh_module.others'), color: '#FFFFFF', borderColor: '#FFFFFF' },
  { value: 0, label: t('parivesh_module.total_species'), color: '#E4B819', borderColor: '#E4B819' }
]

const getEmptyCards = (t: (key: string) => string): PossessionCard[] => [
  { value: 0, content: t('parivesh_module.births'), bgColor: '#37BD69', items: [{ value: 0, bgColor: '#00AFD6' }, { value: 0, bgColor: '#FFD3D3' }, { value: 0, bgColor: '#FFFFFF' }] },
  { value: 0, content: t('parivesh_module.deaths'), bgColor: '#E93353', items: [{ value: 0, bgColor: '#00AFD6' }, { value: 0, bgColor: '#FFD3D3' }, { value: 0, bgColor: '#FFFFFF' }] },
  { value: 0, content: t('parivesh_module.acquisition'), bgColor: '#37BD69', items: [{ value: 0, bgColor: '#00AFD6' }, { value: 0, bgColor: '#FFD3D3' }, { value: 0, bgColor: '#FFFFFF' }] },
  { value: 0, content: t('parivesh_module.transfers'), bgColor: '#FA6140', items: [{ value: 0, bgColor: '#00AFD6' }, { value: 0, bgColor: '#FFD3D3' }, { value: 0, bgColor: '#FFFFFF' }] }
]

// ==================== Component ====================

const OverviewTab: React.FC = () => {
  const { t } = useTranslation()
  const { selectedParivesh, setSelectedParivesh, organizationList } = usePariveshContext()

  const organizationDetails = useMemo(() => {
    if (!selectedParivesh?.id) return []
    return organizationList.filter((el: any) => el.id === selectedParivesh.id)
  }, [selectedParivesh, organizationList])

  const { data: orgCountData } = useQuery({
    queryKey: ['parivesh-org-count', selectedParivesh?.id],
    queryFn: () => getOrgCountList({ params: { id: selectedParivesh?.id } }),
    enabled: Boolean(selectedParivesh?.id)
  })

  const organizationCountList: TransformedOrg[] = useMemo(() => {
    if (!orgCountData?.data) return []
    return (orgCountData.data as OrgCountItem[]).map(org => mapOrgData(org, t))
  }, [orgCountData, t])

  const handleBoxClick = (organization: any) => {
    setSelectedParivesh(organization)
  }

  return (
    <Box>
      {organizationDetails.map((organization: any, index: number) => {
        const orgData = organizationCountList.find(org => org.org_id === organization.id)

        if (orgData) {
          return (
            <Card key={index} sx={{ mb: 6 }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column' }}>
                <CustomAccordion
                  title={orgData.approvedAccordionData.title}
                  data={orgData.approvedAccordionData.data}
                  cards={orgData.approvedAccordionData.cards}
                  backgroundImage={orgData.cover_image || ''}
                  isOrganization
                  organizationName={orgData.organization_name}
                  showDetails
                  summaryIcon='ion:checkmark'
                  handleBoxClick={() => handleBoxClick(organization)}
                />
                <Box sx={{ mt: 3 }}>
                  <CustomAccordion
                    title={orgData.yetToSubmitAccordionData.title}
                    data={orgData.yetToSubmitAccordionData.data}
                    cards={orgData.yetToSubmitAccordionData.cards}
                    backgroundImage={orgData.cover_image || ''}
                    summaryIcon='mdi:arrow-top-right'
                  />
                </Box>
                {selectedParivesh?.id && (
                  <Box sx={{ mt: 3 }}>
                    <CustomAccordion
                      title={orgData.submittedAccordionData.title}
                      data={orgData.submittedAccordionData.data}
                      cards={orgData.submittedAccordionData.cards}
                      backgroundImage={orgData.cover_image || ''}
                      summaryIcon='mdi:checkbox-marked'
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          )
        }

        // Empty state — org found but no count data yet
        return (
          <Card key={index} sx={{ mb: 6 }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column' }}>
              <CustomAccordion
                title={t('parivesh_module.approved_by_parivesh')}
                data={getEmptyStats(t)}
                cards={getEmptyCards(t)}
                backgroundImage=''
                isOrganization
                organizationName={organization.organization_name}
                showDetails
                summaryIcon='ion:checkmark'
                handleBoxClick={() => handleBoxClick(organization)}
              />
              <Box sx={{ mt: 3 }}>
                <CustomAccordion
                  title={t('parivesh_module.to_be_submitted')}
                  data={getEmptyStats(t)}
                  cards={getEmptyCards(t)}
                  backgroundImage=''
                  summaryIcon='mdi:arrow-top-right'
                />
              </Box>
            </CardContent>
          </Card>
        )
      })}

      {selectedParivesh?.zoo_id && <OrganizationTable />}
    </Box>
  )
}

export default OverviewTab
