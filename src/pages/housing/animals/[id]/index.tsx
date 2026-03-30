import { useTheme } from '@emotion/react'
import { Breadcrumbs, Card, Tab, Tabs, Typography, Skeleton } from '@mui/material'
import { Box } from '@mui/system'
import { useRouter } from 'next/router'
import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from 'src/context/AuthContext'
import AnimalAssessment from 'src/components/housing/animals/AnimalAssessment'
import AnimalDiet from 'src/components/housing/animals/AnimalDiet'
import AnimalHistory from 'src/components/housing/animals/AnimalHistory'
import AnimalHospitalTransfer from 'src/components/housing/animals/AnimalHospitalTransfer'
import AnimalIdentifier from 'src/components/housing/animals/AnimalIdentifier'
import AnimalIncidents from 'src/components/housing/animals/AnimalIncidents'
import AnimalJournals from 'src/components/housing/animals/AnimalJournals'
import AnimalLineage from 'src/components/housing/animals/AnimalLineage'
import AnimalMedical from 'src/components/housing/animals/AnimalMedical'
import AnimalMortality from 'src/components/housing/animals/AnimalMortality'
import AnimalOffspring from 'src/components/housing/animals/AnimalOffspring'
import AnimalOverview from 'src/components/housing/animals/AnimalOverview'
import AnimalTaxonomy from 'src/components/housing/animals/AnimalTaxonomy'
import NotesListing from 'src/components/housing/sites/NotesListing'
import InchargeListing from 'src/components/housing/sites/InchargeListing'
import AnimalQRCard from 'src/views/pages/housing/animals/AnimalQRCard'
import enforceModuleAccess from 'src/components/ProtectedRoute'
import AnimalInsightsCard from 'src/views/utility/insights/AnimalInsightsCard'
import AnimalMedia from 'src/components/housing/animals/AnimalMedia'
import { getAnimalDetailsOverview } from 'src/lib/api/housing'
import Utility from 'src/utility'

interface TabConfigItem {
  label: string
  value: string
  component: React.ComponentType<any>
}

interface QRData {
  imageUrl?: string
  speciesName?: string
  aid?: string
  qrCodeUrl?: string
}

interface AnimalDetailsState {
  commonName?: string
  scientificName?: string
  aid?: string
  enclosure?: string
  breed?: string
  morph?: string
  sex?: string
  lifeStage?: string
  accessionDate?: string
  birthDate?: string
  age?: string
  type?: string
  taxonomyId?: string
  taxonomy_id?: string | number
  contraceptionStatus?: string
  sexingType?: string
  collectionType?: string
  organisation?: string
  ownershipTerm?: string
  localIdentifier?: string
  isAlive?: string
  identifierName?: string
  isGrouped?: boolean
  in_transit?: boolean
  animal_transfered?: boolean
  institutes_label?: string
  is_necropsy?: boolean
  is_deleted?: boolean
  is_egg_animal?: boolean
  reproduction_type?: string
}

interface EnclosureDetailsState {
  enclusreId?: string
  enclusreType?: string
  sectionName?: string
  siteName?: string
}

interface ApiResponse {
  success?: boolean
  data?: {
    animal_details?: any
    enclosure_details?: any
  }
}

// Tab configuration matching mobile order and structure
const tabConfig: TabConfigItem[] = [
  { label: 'Overview', value: 'overview', component: AnimalOverview },
  { label: 'Taxonomy', value: 'taxonomy', component: AnimalTaxonomy },
  { label: 'Assessment', value: 'assessment', component: AnimalAssessment },
  { label: 'Notes', value: 'notes', component: NotesListing },
  { label: 'Journal', value: 'journal', component: AnimalJournals },
  { label: 'Medical', value: 'medical', component: AnimalMedical },
  { label: 'Mortality', value: 'mortality', component: AnimalMortality },
  { label: 'Media', value: 'media', component: AnimalMedia },
  { label: 'Identifier', value: 'identifier', component: AnimalIdentifier },
  { label: 'History', value: 'history', component: AnimalHistory },
  { label: 'Incidents', value: 'incidents', component: AnimalIncidents },
  { label: 'Diet', value: 'diet', component: AnimalDiet },
  { label: 'Lineage', value: 'lineage', component: AnimalLineage },
  { label: 'Offspring', value: 'offspring', component: AnimalOffspring },
  { label: 'Hospital Transfer', value: 'hospital', component: AnimalHospitalTransfer },
  { label: 'Incharges', value: 'incharges', component: InchargeListing }
]

const AnimalDetais: React.FC = () => {
  const theme = useTheme() as any
  const router = useRouter()
  const { id } = router.query as { id?: string }
  const authData = useContext(AuthContext) as any

  // Permission checks (matching mobile implementation)
  const permissions = authData?.userData?.roles?.settings || {}
  const hasMedicalRecordsPermission = permissions?.medical_records
  const hasDietModulePermission = permissions?.diet_module
  const hasAccessMortalityModule = permissions?.access_mortality_module
  const hasApprovalMoveAnimalExternal = permissions?.approval_move_animal_external

  const [loading, setLoading] = useState<boolean>(false)
  const [selectedTab, setSelectedTab] = useState<string>(tabConfig[0].value)
  const [qrDialogOpen, setQrDialogOpen] = useState<boolean>(false)
  const [qrData, setQrData] = useState<QRData>({})
  const [data, setData] = useState<ApiResponse>({})
  const [animalDetails, setAnimalDetails] = useState<AnimalDetailsState>({})
  const [enclosureDetails, setEnclosureDetails] = useState<EnclosureDetailsState>({})

  useEffect(() => {
    const fetchAnimalOverviewData = async (): Promise<void> => {
      setLoading(true)

      try {
        const params = {
          animal_id: Number(id)
        }
        const response = await getAnimalDetailsOverview(params)

        if (response?.success) {
          setData(response as unknown as ApiResponse)
          const ad = (response?.data as any)?.animal_details
          const ed = (response?.data as any)?.enclosure_details
          setQrData({
            imageUrl: ad?.default_icon,
            speciesName: ad?.complete_name,
            aid: ad?.animal_id,
            qrCodeUrl: ad?.animal_qr_image
          })
          setAnimalDetails({
            commonName: ad?.common_name,
            scientificName: ad?.complete_name,
            aid: ad?.animal_id,
            enclosure: ad?.user_enclosure_name,
            breed: ad?.breed_name,
            morph: ad?.morph_name,
            sex: ad?.sex,
            lifeStage: ad?.life_stage_name,
            accessionDate: Utility.formatDisplayDate(ad?.accession_date),
            birthDate: Utility.formatDisplayDate(ad?.birth_date),
            age: ad?.age,
            type: ad?.type,
            taxonomyId: ad.taxonomy_id,
            taxonomy_id: ad.taxonomy_id,
            contraceptionStatus: ad?.contraception_status,
            sexingType: ad?.sexing_type,
            collectionType: ad?.master_collection_type,
            organisation: ad?.organization_name,
            ownershipTerm: ad?.ownership_terms_label,
            localIdentifier: ad?.local_identifier_value,
            isAlive: ad?.is_alive,
            identifierName: ad?.local_identifier_name,
            isGrouped: Number(ad?.total_animal) > 1 ? true : false,
            in_transit: ad?.in_transit,
            animal_transfered: ad?.animal_transfered,
            institutes_label: ad?.institutes_label,
            is_necropsy: ad?.is_necropsy,
            is_deleted: ad?.is_deleted,
            is_egg_animal: ad?.is_egg_animal === 1 || ad?.is_egg_animal === '1',
            reproduction_type: ad?.reproduction_type
          })
          setEnclosureDetails({
            enclusreId: ed?.user_enclosure_name,
            enclusreType: ed?.enclosure_type_name,
            sectionName: ed?.section_name,
            siteName: ed?.site_name
          })
          setLoading(false)
        }
      } catch (error) {
        console.error('Cannot fetch Animal Overview', error)
        setLoading(false)
      }
    }

    fetchAnimalOverviewData()
  }, [id])

  console.log(data, 'animalData')

  const handleTabChange = (event: React.SyntheticEvent, newValue: string): void => {
    setSelectedTab(newValue)
  }

  // Filter tabs based on permissions and animal conditions (matching mobile implementation)
  const filteredTabConfig = tabConfig.filter(tab => {
    // Medical tab - requires medical_records permission
    if (tab.value === 'medical' && !hasMedicalRecordsPermission) {
      return false
    }

    // Diet tab - requires diet_module permission
    if (tab.value === 'diet' && !hasDietModulePermission) {
      return false
    }

    // Mortality tab - requires access_mortality_module permission AND animal must be dead
    if (tab.value === 'mortality') {
      if (!hasAccessMortalityModule || animalDetails.isAlive !== '0') {
        return false
      }
    }

    // Lineage tab - hide for group animals
    if (tab.value === 'lineage' && animalDetails.type === 'group') {
      return false
    }

    // Offspring tab - hide for group animals AND indeterminate/undetermined sex
    if (tab.value === 'offspring') {
      if (animalDetails.type === 'group') {
        return false
      }
      if (animalDetails.sex === 'indeterminate' || animalDetails.sex === 'undetermined') {
        return false
      }
    }

    // Hospital Transfer tab - requires approval_move_animal_external permission
    if (tab.value === 'hospital' && !hasApprovalMoveAnimalExternal) {
      return false
    }

    // Assessment tab - hide for group animals (when type is not 'single')
    if (tab.value === 'assessment' && animalDetails.type !== 'single' && animalDetails.type !== '') {
      return false
    }

    return true
  })

  // Switch to overview tab if currently selected tab is no longer available
  useEffect(() => {
    const isTabAvailable = filteredTabConfig.some(tab => tab.value === selectedTab)
    if (!isTabAvailable && filteredTabConfig.length > 0) {
      setSelectedTab('overview')
    }
  }, [filteredTabConfig.length, selectedTab, animalDetails.type, animalDetails.sex, animalDetails.isAlive])

  const selected = filteredTabConfig.find(tab => tab.value === selectedTab)

  const SelectedComponent = selected?.component || (() => <Box>No component found</Box>)

  const handleQrClick = (): void => {
    setQrDialogOpen(true)
  }

  // Skeleton component for tabs
  const TabsSkeleton: React.FC = () => (
    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', gap: 2, p: 2 }}>
        {[1, 2, 3, 4, 5, 6].map(item => (
          <Skeleton key={item} variant='rectangular' width={80} height={36} sx={{ borderRadius: 1 }} />
        ))}
      </Box>
    </Box>
  )

  // Skeleton component for overview content (AnimalDetails + EnclosureDetails)
  const OverviewSkeleton: React.FC = () => (
    <Box sx={{ p: 4 }}>
      {/* Animal Details Section */}
      <Card sx={{ p: 4, mb: 4 }}>
        <Skeleton variant='text' width={180} height={28} sx={{ mb: 3 }} />

        {/* Animal details grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
          {/* Left column */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[1, 2, 3, 4, 5, 6].map(item => (
              <Box key={item} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Skeleton variant='text' width={120} height={20} />
                <Skeleton variant='text' width={100} height={20} />
              </Box>
            ))}
          </Box>

          {/* Right column */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[1, 2, 3, 4, 5, 6].map(item => (
              <Box key={item} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Skeleton variant='text' width={120} height={20} />
                <Skeleton variant='text' width={100} height={20} />
              </Box>
            ))}
          </Box>
        </Box>
      </Card>

      {/* Enclosure Details Section */}
      <Card sx={{ p: 4 }}>
        <Skeleton variant='text' width={200} height={28} sx={{ mb: 3 }} />

        {/* Enclosure details grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
          {/* Left column */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[1, 2, 3].map(item => (
              <Box key={item} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Skeleton variant='text' width={140} height={20} />
                <Skeleton variant='text' width={120} height={20} />
              </Box>
            ))}
          </Box>

          {/* Right column */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[1, 2, 3].map(item => (
              <Box key={item} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Skeleton variant='text' width={140} height={20} />
                <Skeleton variant='text' width={120} height={20} />
              </Box>
            ))}
          </Box>
        </Box>
      </Card>
    </Box>
  )

  return (
    <>
      <Box>
        <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
          <Typography color='inherit' sx={{ cursor: 'pointer' }} onClick={() => router.back()}>
            Animals
          </Typography>
          <Typography color='text.primary'>Animal Details</Typography>
        </Breadcrumbs>
        <AnimalInsightsCard
          isAnimalDetailsPage={true}
          headerDetails={animalDetails}
          animalDetails={animalDetails}
          isSpecies={false}
          isSpeciesDetails={false}
          isSpeciesListing={false}
          onAddNew={() => {}}
          showQr={true}
          onQrClick={handleQrClick}
          image={data?.data?.animal_details?.banner_images[0]?.image_path}
          loading={loading}
        />
        <Card sx={{ mt: 6, p: { xs: 3, md: 5 } }}>
          {loading ? (
            <>
              {/* Show skeleton for tabs */}
              <TabsSkeleton />
              {/* Show skeleton for content */}
              <OverviewSkeleton />
            </>
          ) : (
            <>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={selectedTab} onChange={handleTabChange} variant='scrollable' scrollButtons='auto'>
                  {filteredTabConfig.map(tab => (
                    <Tab key={tab.value} label={tab.label} value={tab.value} />
                  ))}
                </Tabs>
              </Box>
              {/* Selected Tab Content */}
              <Box>
                <SelectedComponent
                  selectedTab={selectedTab}
                  setSelectedTab={setSelectedTab}
                  animalDetails={animalDetails}
                  enclosureDetails={enclosureDetails}
                  refType="animal"
                  entityName={animalDetails?.commonName}
                  entityImage={data?.data?.animal_details?.default_icon}
                  animalData={data?.data?.animal_details}
                />
              </Box>
            </>
          )}
        </Card>
      </Box>
      {qrDialogOpen && (
        <AnimalQRCard open={qrDialogOpen} handleClose={() => setQrDialogOpen(false)} speciesData={qrData as any} />
      )}
    </>
  )
}

export default enforceModuleAccess(AnimalDetais, 'enable_housing_in_web')
