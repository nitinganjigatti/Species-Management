import { Box, Breadcrumbs, Typography, Tabs, Tab, Card } from '@mui/material'
import { useRouter } from 'next/router'
import React, { useEffect, useMemo, useState } from 'react'
import InsightsCard from 'src/views/utility/insights/InsightsCard'

// Listing Components
import SectionListing from 'src/components/housing/sites/sectionListing'
import SpeciesListing from 'src/components/housing/sites/speciesListing'
import MortalityListing from 'src/components/housing/sites/mortalityListing'
import AnimalTreatmentListing from 'src/components/housing/sites/AnimalTreatmentListing'
import MediaListing from 'src/components/housing/sites/MediaListing'
import NotesListing from 'src/components/housing/sites/NotesListing'
import TeamsListing from 'src/components/housing/sites/TeamsListing'
import AnimalTransferListing from 'src/components/housing/sites/AnimalTransferListing'
import FoodWastageListing from 'src/components/housing/sites/FoodWastageListing'
import UsersListing from 'src/components/housing/sites/UsersListing'
import HospitalTransferListing from 'src/components/housing/sites/HospitalTransferListing'

import { useQuery } from '@tanstack/react-query'
import { getSpecificSiteAnalytics } from 'src/lib/api/housing'
import AnimalDrawer from 'src/components/housing/utils/AnimalDrawer'
import EnclosureDrawer from 'src/components/housing/utils/EnclosureDrawer'
import { useAuth } from 'src/hooks/useAuth'
import AddSectionDrawer from 'src/views/pages/housing/section/AddSectionDrawer'
import enforceModuleAccess from 'src/components/ProtectedRoute'
import InchargeListing from 'src/components/housing/sites/InchargeListing'

interface TabConfigItem {
  label: string
  value: string
  component: React.ComponentType<any>
  requiresSetting?: string
  requiresPermission?: string
}

interface DrawerData {
  queryKey: string
  id: string | undefined
  name?: string
  params: {
    ref_type?: string
    data_type?: string
    ref_id?: string | undefined
    site_id?: string | string[] | undefined
  }
}

interface StatItem {
  label: string
  value: number
  imagePath: string
  onClick?: () => void
}

const allTabConfig: TabConfigItem[] = [
  { label: 'Sections', value: 'sections', component: SectionListing },
  { label: 'Species', value: 'species', component: SpeciesListing },
  { label: 'Media', value: 'media', component: MediaListing },
  { label: 'Mortality', value: 'mortality', component: MortalityListing },
  {
    label: 'Animals Under Treatment',
    value: 'animalTreatment',
    component: AnimalTreatmentListing
  },
  { label: 'Users', value: 'users', component: UsersListing },
  { label: 'Notes', value: 'notes', component: NotesListing },
  { label: 'Teams', value: 'teams', component: TeamsListing, requiresSetting: 'ANIMAL_TRANSFER_REQUIRES_APPROVAL' },
  {
    label: 'Animal Transfer',
    value: 'animalTransfer',
    component: AnimalTransferListing,
    requiresPermission: 'approval_move_animal_external'
  },
  { label: 'Food Wastage', value: 'foodWastage', component: FoodWastageListing },
  { label: 'Incharges', value: 'incharges', component: InchargeListing },
  { label: 'Hospital Transfer', value: 'hospitalTransfer', component: HospitalTransferListing }
]

const SiteDetails: React.FC = () => {
  const router = useRouter()
  const { id } = router.query as { id?: string }
  const auth = useAuth()

  const insightsViewAccess = (auth as any)?.userData?.roles?.settings?.housing_view_insights
  const addSectionAccess = (auth as any)?.userData?.roles?.settings?.housing_add_section
  const addSitesAccess = (auth as any)?.userData?.permission?.user_settings?.add_sites
  const loggedInUserId = (auth as any)?.userData?.user?.user_id
  const settings = (auth as any)?.userData?.settings

  const zooId = (auth as any)?.userData?.user?.zoos?.[0]?.zoo_id

  // Merge permissions from both sources (matching mobile implementation)
  const userSettingsPermissions = (auth as any)?.userData?.permission?.user_settings || {}
  const rolesSettingsPermissions = (auth as any)?.userData?.roles?.settings || {}
  const permissions = { ...userSettingsPermissions, ...rolesSettingsPermissions }

  // Filter tabs based on settings and permissions
  const tabConfig = useMemo(() => {
    return allTabConfig.filter(tab => {
      // Check setting requirement
      if (tab.requiresSetting) {
        if (settings?.[tab.requiresSetting] !== true) {
          return false
        }
      }

      // Check permission requirement
      if (tab.requiresPermission) {
        if (permissions?.[tab.requiresPermission] !== true) {
          return false
        }
      }

      return true
    })
  }, [settings, userSettingsPermissions, rolesSettingsPermissions])

  const [selectedTab, setSelectedTab] = useState<string>(allTabConfig[0].value)
  const [drawerType, setDrawerType] = useState<string | null>(null)
  const [drawerData, setDrawerData] = useState<DrawerData | null>(null)
  const [showAddSectionDrawer, setShowAddSectionDrawer] = useState<boolean>(false)
  const [addSuccessCheck, setAddSuccessCheck] = useState<boolean>(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['site-detail', id],
    queryFn: () =>
      getSpecificSiteAnalytics({
        site_id: Number(id)
      }),
    enabled: !!id
  })

  const handleTabChange = (event: React.SyntheticEvent, newValue: string): void => {
    // Find reset action for previous tab
    // const prevTab = tabConfig.find(tab => tab.value === selectedTab)
    // if (prevTab?.resetAction) {
    //   dispatch(prevTab.resetAction())
    // }

    setSelectedTab(newValue)
  }

  const handleEnclosureInsightClick = (): void => {
    setDrawerType('enclosures')
    setDrawerData({
      queryKey: 'insights-enclosures-section-drawer',
      id: zooId,

      // name: params.row?.site_name,
      // image: params.row?.images?.[0]?.file,
      params: {
        ref_type: 'zoo',
        data_type: 'enclosure',
        ref_id: zooId,
        site_id: id
      }
    })
  }

  const handleAmimalsInsightClick = (): void => {
    setDrawerType('animals-insights')
    setDrawerData({
      queryKey: 'insights-animals-section-drawer',
      id: zooId,

      name: data?.data?.site_name,

      // image: params.row?.images?.[0]?.file,
      params: {
        site_id: id
      }
    })
  }

  const handleDrawerClose = (): void => {
    setDrawerType(null)
    setDrawerData(null)
  }

  const siteData = data?.data as any

  const statsData: StatItem[] = [
    {
      label: 'Species',
      value: siteData?.species_count || 0,
      imagePath: '/images/housing/species.svg',
      onClick: () => setSelectedTab('species')
    },
    {
      label: 'Animals',
      value: siteData?.animal_count || 0,
      imagePath: '/images/housing/animals.svg',
      onClick: handleAmimalsInsightClick
    },
    {
      label: 'Sections',
      value: siteData?.section_count || 0,
      imagePath: '/images/housing/sections.svg',
      onClick: () => setSelectedTab('sections')
    },

    {
      label: 'Enclosures',
      value: siteData?.enclosure_count || 0,
      imagePath: '/images/housing/enclosures.svg',
      onClick: handleEnclosureInsightClick
    }
  ]

  const handleHousingClick = (): void => {
    router.back()
  }

  const selected = tabConfig.find(tab => tab.value === selectedTab)
  const SelectedComponent = selected?.component || (() => <Box>No component found</Box>)

  useEffect(() => {
    // Updating URL with tab parameter when tab changes
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, tab: selectedTab }
      },
      undefined,
      { shallow: true }
    )
  }, [selectedTab])

  // To read the tab parameter on component mount
  useEffect(() => {
    if (router.query.tab) {
      setSelectedTab(router.query.tab as string)
    }
  }, [router.query.tab])

  return (
    <>
      <Box>
        {/* Breadcrumb */}
        <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
          <Typography color='inherit' sx={{ cursor: 'pointer' }} onClick={handleHousingClick}>
            Site
          </Typography>
          <Typography color='text.primary'>Site Details</Typography>
        </Breadcrumbs>

        {/* Insights */}
        <InsightsCard
          data={siteData}
          loading={isLoading}
          image={siteData?.images?.[0]?.file}
          zooName={siteData?.site_name}
          subtitle={siteData?.site_description}
          userName={siteData?.incharges?.[0]?.full_name}
          description={siteData?.incharges?.[0]?.role_name}
          haveInsightsViewAccess={insightsViewAccess}
          userImage={siteData?.incharges?.[0]?.user_profile_pic}
          pageTitle='Site Details'
          actions={{
            onAddNew: addSectionAccess ? () => setShowAddSectionDrawer(true) : null
          }}
          onCallClick={() => {
            const phoneNumber = siteData?.incharges?.[0]?.user_mobile_number || ''
            if (phoneNumber) {
              // window.location.href = `tel:${phoneNumber}`
            } else {
              return
            }
          }}
          onMessageClick={() => {
            const phoneNumber = siteData?.incharges?.[0]?.user_mobile_number || ''
            if (phoneNumber) {
              window.open(`sms:${phoneNumber}`)
            } else return
          }}
          error={error}
          statsData={statsData as any}
        />

        {/* Tabs */}
        <Card sx={{ mt: 6, p: { xs: 3, md: 5 } }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={selectedTab} onChange={handleTabChange} variant='scrollable' scrollButtons='auto'>
              {tabConfig.map(tab => (
                <Tab key={tab.value} label={tab.label} value={tab.value} />
              ))}
            </Tabs>
          </Box>

          {/* Selected Tab Content */}
          <Box>
            <SelectedComponent
              selectedTab={selectedTab}
              setSelectedTab={setSelectedTab}
              drawerType={drawerType}
              setDrawerType={setDrawerType}
              drawerData={drawerData}
              setDrawerData={setDrawerData}
              addSuccessCheck={addSuccessCheck}
              siteIncharges={siteData?.incharges || []}
              loggedInUserId={loggedInUserId}
              addSitesAccess={addSitesAccess}
              settings={settings}
              entityName={siteData?.site_name}
              entityImage={siteData?.images?.[0]?.file}
            />
          </Box>
        </Card>
        {drawerType === 'animals-insights' && (
          <AnimalDrawer
            totalCount={siteData?.animal_count}
            open={!!drawerData}
            onClose={handleDrawerClose}
            data={drawerData as any}
            defaultImage={'/images/housing/site-icon-colored.svg'}
          />
        )}
        {drawerType === 'enclosures' && (
          <EnclosureDrawer open={!!drawerData} onClose={handleDrawerClose} data={drawerData as any} />
        )}
      </Box>
      {showAddSectionDrawer && (
        <AddSectionDrawer
          open={showAddSectionDrawer}
          setShowAddSectionDrawer={setShowAddSectionDrawer}
          selectedSiteId={id || ''}
          addSuccessCheck={addSuccessCheck}
          setAddSuccessCheck={setAddSuccessCheck}
        />
      )}
    </>
  )
}

export default enforceModuleAccess(SiteDetails, 'enable_housing_in_web')
