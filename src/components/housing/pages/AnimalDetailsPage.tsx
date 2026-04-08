import { useTheme } from '@emotion/react'
import { Breadcrumbs, Card, Typography, Skeleton, CircularProgress } from '@mui/material'
import { Box } from '@mui/system'
import { useRouter } from 'next/navigation'
import React, { useContext, useEffect, useMemo, useState } from 'react'
import { AuthContext } from 'src/context/AuthContext'
import useTabSync from 'src/hooks/useTabSync'
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
import AnimalInsightsCard from 'src/views/utility/insights/AnimalInsightsCard'
import AnimalMedia from 'src/components/housing/animals/AnimalMedia'
import { getAnimalDetailsOverview, getEntityPermissionCheck } from 'src/lib/api/housing'
import Utility from 'src/utility'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import TabsWithMenu from 'src/views/pages/housing/utils/TabsWithMenu'
import { useTranslation } from 'react-i18next'

interface TabConfigItem {
  labelKey: string
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

interface AnimalDetailsPageProps {
  id: string
}

// Tab configuration matching mobile order and structure
const tabConfig: TabConfigItem[] = [
  { labelKey: 'animals_module.overview', value: 'overview', component: AnimalOverview },
  { labelKey: 'animals_module.taxonomy', value: 'taxonomy', component: AnimalTaxonomy },
  { labelKey: 'housing_module.assessment', value: 'assessment', component: AnimalAssessment },
  { labelKey: 'notes', value: 'notes', component: NotesListing },
  { labelKey: 'animals_module.journal', value: 'journal', component: AnimalJournals },
  { labelKey: 'animals_module.medical', value: 'medical', component: AnimalMedical },
  { labelKey: 'navigation.mortality', value: 'mortality', component: AnimalMortality },
  { labelKey: 'media', value: 'media', component: AnimalMedia },
  { labelKey: 'identifier', value: 'identifier', component: AnimalIdentifier },
  { labelKey: 'animals_module.history', value: 'history', component: AnimalHistory },
  { labelKey: 'animals_module.incidents', value: 'incidents', component: AnimalIncidents },
  { labelKey: 'animals_module.diet', value: 'diet', component: AnimalDiet },
  { labelKey: 'animals_module.lineage', value: 'lineage', component: AnimalLineage },
  { labelKey: 'animals_module.offspring', value: 'offspring', component: AnimalOffspring },
  { labelKey: 'animals_module.hospital_transfer', value: 'hospital', component: AnimalHospitalTransfer },
  { labelKey: 'housing_module.incharges', value: 'incharges', component: InchargeListing }
]

const AnimalDetailsPage: React.FC<AnimalDetailsPageProps> = ({ id }) => {
  const { t } = useTranslation()
  const theme = useTheme() as any
  const router = useRouter()
  const authData = useContext(AuthContext) as any

  // Permission checks (matching mobile implementation)
  const permissions = authData?.userData?.roles?.settings || {}
  const hasMedicalRecordsPermission = permissions?.medical_records
  const hasDietModulePermission = permissions?.diet_module
  const hasAccessMortalityModule = permissions?.access_mortality_module
  const hasApprovalMoveAnimalExternal = permissions?.approval_move_animal_external

  // Entity permission check states
  const [hasEntityPermission, setHasEntityPermission] = useState<boolean | null>(null)
  const [showAccessRestricted, setShowAccessRestricted] = useState<boolean>(false)

  const [loading, setLoading] = useState<boolean>(false)
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



  const handleTabChange = (event: React.SyntheticEvent, newValue: string): void => {
    setSelectedTab(newValue)
  }

  // Filter tabs based on permissions and animal conditions (matching mobile implementation)
  const filteredTabConfig = tabConfig.filter(tab => {
    if (tab.value === 'medical' && !hasMedicalRecordsPermission) {
      return false
    }

    if (tab.value === 'diet' && !hasDietModulePermission) {
      return false
    }

    if (tab.value === 'mortality') {
      if (!hasAccessMortalityModule || animalDetails.isAlive !== '0') {
        return false
      }
    }

    if (tab.value === 'lineage' && animalDetails.type === 'group') {
      return false
    }

    if (tab.value === 'offspring') {
      if (animalDetails.type === 'group') {
        return false
      }
      if (animalDetails.sex === 'indeterminate' || animalDetails.sex === 'undetermined') {
        return false
      }
    }

    if (tab.value === 'hospital' && !hasApprovalMoveAnimalExternal) {
      return false
    }

    if (tab.value === 'assessment' && animalDetails.type !== 'single' && animalDetails.type !== '') {
      return false
    }

    return true
  })

  const availableTabs = useMemo(() => filteredTabConfig.map(t => t.value), [filteredTabConfig])
  const [selectedTab, setSelectedTab] = useTabSync(tabConfig[0].value, availableTabs)

  // Fetch entity permission check
  useEffect(() => {
    const fetchEntityPermission = async (): Promise<void> => {
      if (!id) return

      try {
        const response = await getEntityPermissionCheck({
          entity_type: 'animal',
          entity_id: Number(id)
        })

        if (response?.success) {
          if (response?.data?.hasPermission === 1) {
            setHasEntityPermission(true)
          } else {
            setHasEntityPermission(false)
            setShowAccessRestricted(true)
          }
        } else {
          setHasEntityPermission(false)
          setShowAccessRestricted(true)
        }
      } catch (error) {
        console.error('Error fetching entity permission:', error)
        setHasEntityPermission(false)
        setShowAccessRestricted(true)
      }
    }

    fetchEntityPermission()
  }, [id])

  // Handle access restricted confirmation
  const handleAccessRestrictedConfirmation = (): void => {
    setShowAccessRestricted(false)
    router.push('/housing/sites')
  }

  const selected = filteredTabConfig.find(tab => tab.value === selectedTab)

  const SelectedComponent = selected?.component || (() => <Box>{t('no_component_found')}</Box>)

  const handleQrClick = (): void => {
    setQrDialogOpen(true)
  }

  // Show loading state while checking permission
  if (hasEntityPermission === null) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          width: '100%',
          gap: 3
        }}
      >
        <CircularProgress size={60} />
      </Box>
    )
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
      <Card sx={{ p: 4, mb: 4 }}>
        <Skeleton variant='text' width={180} height={28} sx={{ mb: 3 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[1, 2, 3, 4, 5, 6].map(item => (
              <Box key={item} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Skeleton variant='text' width={120} height={20} />
                <Skeleton variant='text' width={100} height={20} />
              </Box>
            ))}
          </Box>
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
      <Card sx={{ p: 4 }}>
        <Skeleton variant='text' width={200} height={28} sx={{ mb: 3 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[1, 2, 3].map(item => (
              <Box key={item} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Skeleton variant='text' width={140} height={20} />
                <Skeleton variant='text' width={120} height={20} />
              </Box>
            ))}
          </Box>
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
            {t('animals')}
          </Typography>
          <Typography color='text.primary'>{t('animals_module.animal_details')}</Typography>
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
              <TabsSkeleton />
              <OverviewSkeleton />
            </>
          ) : (
            <>
              <TabsWithMenu tabs={filteredTabConfig} selectedTab={selectedTab} onTabChange={handleTabChange} />
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
      {showAccessRestricted && (
        <ConfirmationDialog
          dialogBoxStatus={showAccessRestricted}
          onClose={() => setShowAccessRestricted(false)}
          title={t('housing_module.access_restricted')}
          cancelBtnStyle={{
            borderColor: theme.palette.grey[500],
            color: theme.palette.grey[700]
          }}
          confirmBtnStyle={{
            background: theme.palette.primary.main,
            py: 2
          }}
          image={'/images/warning-icon.svg'}
          imgStyle={{
            background: theme.palette.grey[200],
            p: 4
          }}
          confirmAction={handleAccessRestrictedConfirmation}
          ConfirmationText={t('ok')}
          description={
            <Box>
              <Typography variant='body1' sx={{ mb: 1 }}>
                {t('animals_module.you_dont_have_permission_to_access_this_animal')}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {t('housing_module.please_contact_your_administrator_or_request_access_to_proceed')}
              </Typography>
            </Box>
          }
          allowCancel={false}
        />
      )}
    </>
  )
}

export default AnimalDetailsPage
