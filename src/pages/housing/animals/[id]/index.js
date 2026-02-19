import { useTheme } from '@emotion/react'
import { Breadcrumbs, Card, Tab, Tabs, Typography, Skeleton } from '@mui/material'
import { Box } from '@mui/system'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import AnimalDiet from 'src/components/housing/animals/AnimalDiet'
import AnimalHistory from 'src/components/housing/animals/AnimalHistory'
import AnimalIdentifier from 'src/components/housing/animals/AnimalIdentifier'
import AnimalIncidents from 'src/components/housing/animals/AnimalIncidents'
import AnimalJournals from 'src/components/housing/animals/AnimalJournals'
import AnimalMortality from 'src/components/housing/animals/AnimalMortality'
import AnimalOverview from 'src/components/housing/animals/AnimalOverview'
import withModuleAccess from 'src/components/ProtectedRoute'
import AnimalQRCard from 'src/views/pages/housing/animals/AnimalQRCard'
import enforceModuleAccess from 'src/components/ProtectedRoute'
import AnimalInsightsCard from 'src/views/utility/insights/AnimalInsightsCard'
import AnimalMedia from 'src/components/housing/animals/AnimalMedia'
import { getAnimalDetailsOverview } from 'src/lib/api/housing'
import Utility from 'src/utility'

const tabConfig = [
  { label: 'Overview', value: 'overview', component: AnimalOverview },
  { label: 'Incidents', value: 'incidents', component: AnimalIncidents },
  { label: 'Diet', value: 'diet', component: AnimalDiet },
  { label: 'Journal', value: 'journal', component: AnimalJournals },
  { label: 'History', value: 'history', component: AnimalHistory },
  { label: 'Identifier', value: 'identifier', component: AnimalIdentifier },
  { label: 'Mortality', value: 'mortality', component: AnimalMortality },
  { label: 'Media', value: 'media', component: AnimalMedia }
]

const AnimalDetais = () => {
  const theme = useTheme()
  const router = useRouter()
  const { id } = router.query

  const [loading, setLoading] = useState(false)
  const [selectedTab, setSelectedTab] = useState(tabConfig[0].value)
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [qrData, setQrData] = useState({})
  const [data, setData] = useState({})
  const [animalDetails, setAnimalDetails] = useState({})
  const [enclosureDetails, setEnclosureDetails] = useState({})

  useEffect(() => {
    const fetchAnimalOverviewData = async () => {
      setLoading(true)

      try {
        const params = {
          animal_id: id
        }
        const response = await getAnimalDetailsOverview(params)

        if (response?.success) {
          setData(response)
          const ad = response?.data?.animal_details
          const ed = response?.data?.enclosure_details
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
            is_deleted: ad?.is_deleted
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

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue)
  }

  // Switch to overview tab if currently on mortality tab but animal is alive
  useEffect(() => {
    if (selectedTab === 'mortality' && animalDetails.isAlive === '1') {
      setSelectedTab('overview')
    }
  }, [animalDetails.isAlive, selectedTab])

  // Filter tabs based on animal's alive status
  const filteredTabConfig = tabConfig.filter(tab => {
    if (tab.value === 'mortality') {
      return animalDetails.isAlive === '0'
    }

    return true
  })

  const selected = filteredTabConfig.find(tab => tab.value === selectedTab)

  const SelectedComponent = selected?.component || (() => <Box>No component found</Box>)

  const handleQrClick = () => {
    setQrDialogOpen(true)
  }

  // Skeleton component for tabs
  const TabsSkeleton = () => (
    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', gap: 2, p: 2 }}>
        {[1, 2, 3, 4, 5, 6].map(item => (
          <Skeleton key={item} variant='rectangular' width={80} height={36} sx={{ borderRadius: 1 }} />
        ))}
      </Box>
    </Box>
  )

  // Skeleton component for overview content (AnimalDetails + EnclosureDetails)
  const OverviewSkeleton = () => (
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
          showQr={true}
          onQrClick={handleQrClick}
          // image={data?.data?.animal_details?.banner_images[0]?.image_path}
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
                />
              </Box>
            </>
          )}
        </Card>
      </Box>
      {qrDialogOpen && (
        <AnimalQRCard open={qrDialogOpen} handleClose={() => setQrDialogOpen(false)} speciesData={qrData} />
      )}
    </>
  )
}

export default enforceModuleAccess(AnimalDetais, 'enable_housing_in_web')
