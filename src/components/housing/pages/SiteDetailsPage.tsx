import { Box, Breadcrumbs, Typography, Card, CircularProgress, useTheme } from '@mui/material'
import { useRouter } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'
import useTabSync from 'src/hooks/useTabSync'
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
import { getSpecificSiteAnalytics, getEntityPermissionCheck } from 'src/lib/api/housing'
import AnimalDrawer from 'src/components/housing/utils/AnimalDrawer'
import EnclosureDrawer from 'src/components/housing/utils/EnclosureDrawer'
import { useAuth } from 'src/hooks/useAuth'
import AddSectionDrawer from 'src/views/pages/housing/section/AddSectionDrawer'
import AddSiteDrawer from 'src/views/pages/housing/sites/AddSiteDrawer'
import InchargeListing from 'src/components/housing/sites/InchargeListing'
import { EntityAssessment } from 'src/components/housing/common/assessment'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import TabsWithMenu from 'src/views/pages/housing/utils/TabsWithMenu'
import { useTranslation } from 'react-i18next'

interface TabConfigItem {
  labelKey: string
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

interface SiteDetailsPageProps {
  id: string
}

// Tab order matches mobile implementation (SiteDetails.js)
// Permission checks match mobile: collection_animal_records, access_mortality_module, approval_move_animal_external, medical_records
const allTabConfig: TabConfigItem[] = [
  { labelKey: 'sections', value: 'sections', component: SectionListing },
  {
    labelKey: 'species',
    value: 'species',
    component: SpeciesListing,
    requiresPermission: 'collection_animal_records'
  },
  { labelKey: 'housing_module.animals_under_treatment', value: 'animalTreatment', component: AnimalTreatmentListing },
  { labelKey: 'notes', value: 'notes', component: NotesListing },
  { labelKey: 'housing_module.assessment', value: 'assessment', component: EntityAssessment },
  {
    labelKey: 'housing_module.animal_transfer',
    value: 'animalTransfer',
    component: AnimalTransferListing,
    requiresPermission: 'approval_move_animal_external'
  },
  {
    labelKey: 'housing_module.teams',
    value: 'teams',
    component: TeamsListing,
    requiresSetting: 'ANIMAL_TRANSFER_REQUIRES_APPROVAL'
  },
  { labelKey: 'media', value: 'media', component: MediaListing },
  { labelKey: 'lab_module.users', value: 'users', component: UsersListing },
  { labelKey: 'housing_module.incharges', value: 'incharges', component: InchargeListing },
  {
    labelKey: 'navigation.mortality',
    value: 'mortality',
    component: MortalityListing,
    requiresPermission: 'access_mortality_module'
  },
  { labelKey: 'housing_module.food_wastage', value: 'foodWastage', component: FoodWastageListing },
  {
    labelKey: 'housing_module.hospital_transfer',
    value: 'hospitalTransfer',
    component: HospitalTransferListing,
    requiresPermission: 'approval_move_animal_external'
  }
]

const SiteDetailsPage: React.FC<SiteDetailsPageProps> = ({ id }) => {
  const router = useRouter()
  const theme = useTheme()
  const auth = useAuth()
  const { t } = useTranslation()

  // Entity permission check states
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [showAccessRestricted, setShowAccessRestricted] = useState<boolean>(false)

  const insightsViewAccess = (auth as any)?.userData?.roles?.settings?.housing_view_insights
  const addSectionAccess = (auth as any)?.userData?.roles?.settings?.housing_add_section
  const addSitesAccess = (auth as any)?.userData?.permission?.user_settings?.add_sites
  const loggedInUserId = (auth as any)?.userData?.user?.user_id
  const settings = (auth as any)?.userData?.settings

  const zooId = (auth as any)?.userData?.user?.zoos?.[0]?.zoo_id

  // Merge permissions from both sources (matching mobile implementation)
  const userSettingsPermissions = (auth as any)?.userData?.permission?.user_settings || {}
  const rolesSettingsPermissions = (auth as any)?.userData?.roles?.settings || {}
  const permissions: Record<string, boolean> = { ...userSettingsPermissions, ...rolesSettingsPermissions }

  // Filter tabs based on settings and permissions
  const tabConfig = useMemo(() => {
    return allTabConfig.filter(tab => {
      if (tab.requiresSetting) {
        if (settings?.[tab.requiresSetting] !== true) {
          return false
        }
      }

      if (tab.requiresPermission) {
        if (permissions?.[tab.requiresPermission] !== true) {
          return false
        }
      }

      return true
    })
  }, [settings, permissions])

  const availableTabs = useMemo(() => tabConfig.map(t => t.value), [tabConfig])
  const [selectedTab, setSelectedTab] = useTabSync(allTabConfig[0].value, availableTabs)
  const [drawerType, setDrawerType] = useState<string | null>(null)
  const [drawerData, setDrawerData] = useState<DrawerData | null>(null)
  const [showAddSectionDrawer, setShowAddSectionDrawer] = useState<boolean>(false)
  const [showEditSiteDrawer, setShowEditSiteDrawer] = useState<boolean>(false)
  const [addSuccessCheck, setAddSuccessCheck] = useState<boolean>(false)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['site-detail', id],
    queryFn: () =>
      getSpecificSiteAnalytics({
        site_id: Number(id)
      }),
    enabled: !!id
  })

  const siteData = data?.data as any

  // Check if user is site incharge
  const isSiteIncharge = siteData?.incharges?.some((incharge: any) => incharge?.user_id === loggedInUserId)

  // User can edit/delete site if they have add_sites permission OR are a site incharge
  const canEditSite = addSitesAccess || isSiteIncharge

  const handleTabChange = (event: React.SyntheticEvent, newValue: string): void => {
    setSelectedTab(newValue)
  }

  const handleEnclosureInsightClick = (): void => {
    setDrawerType('enclosures')
    setDrawerData({
      queryKey: 'insights-enclosures-section-drawer',
      id: zooId,
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
      params: {
        site_id: id
      }
    })
  }

  const handleDrawerClose = (): void => {
    setDrawerType(null)
    setDrawerData(null)
  }

  const statsData: StatItem[] = [
    {
      label: t('species'),
      value: siteData?.species_count || 0,
      imagePath: '/images/housing/species.svg',
      onClick: () => setSelectedTab('species')
    },
    {
      label: t('animals'),
      value: siteData?.animal_count || 0,
      imagePath: '/images/housing/animals.svg',
      onClick: handleAmimalsInsightClick
    },
    {
      label: t('sections'),
      value: siteData?.section_count || 0,
      imagePath: '/images/housing/sections.svg',
      onClick: () => setSelectedTab('sections')
    },

    {
      label: t('enclosures'),
      value: siteData?.enclosure_count || 0,
      imagePath: '/images/housing/enclosures.svg',
      onClick: handleEnclosureInsightClick
    }
  ]

  const handleBreadcrumbClick = (): void => {
    router.push('/housing/sites')
  }

  const selected = tabConfig.find(tab => tab.value === selectedTab)
  const SelectedComponent = selected?.component || (() => <Box>{t('no_component_found')}</Box>)

  // Fetch entity permission check
  useEffect(() => {
    const fetchEntityPermission = async (): Promise<void> => {
      if (!id) return

      try {
        const response = await getEntityPermissionCheck({
          entity_type: 'site',
          entity_id: Number(id)
        })

        if (response?.success) {
          if (response?.data?.hasPermission === 1) {
            setHasPermission(true)
          } else {
            setHasPermission(false)
            setShowAccessRestricted(true)
          }
        } else {
          setHasPermission(false)
          setShowAccessRestricted(true)
        }
      } catch (error) {
        console.error('Error fetching entity permission:', error)
        setHasPermission(false)
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

  // Show loading state while checking permission
  if (hasPermission === null) {
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

  return (
    <>
      <Box>
        {/* Breadcrumb */}
        <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
          <Typography color='inherit' sx={{ cursor: 'pointer' }} onClick={handleBreadcrumbClick}>
            {t('housing_module.sites')}
          </Typography>
          <Typography color='text.primary'>{t('housing_module.site_details')}</Typography>
        </Breadcrumbs>

        {/* Insights */}
        <InsightsCard
          data={siteData}
          loading={isLoading}
          image={siteData?.images?.find((img: any) => img?.display_type === 'banner')?.file}
          zooName={siteData?.site_name}
          subtitle={siteData?.site_description}
          userName={siteData?.incharges?.[0]?.full_name}
          description={siteData?.incharges?.[0]?.role_name}
          haveInsightsViewAccess={insightsViewAccess}
          userImage={siteData?.incharges?.[0]?.user_profile_pic}
          pageTitle={t('housing_module.site_details')}
          actions={{
            onAddNew: addSectionAccess ? () => setShowAddSectionDrawer(true) : null,
            onEdit: canEditSite ? () => setShowEditSiteDrawer(true) : null
          }}
          addNewTooltip={t('housing_module.add_new_section') as string}
          editTooltip={t('housing_module.edit_site') as string}
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
          <TabsWithMenu tabs={tabConfig} selectedTab={selectedTab} onTabChange={handleTabChange} />

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
              addSitesAccess={canEditSite}
              settings={settings}
              entityName={siteData?.site_name}
              entityImage={siteData?.images?.find((img: any) => img?.display_type === 'banner')?.file}
              entityType='site'
              entityId={id || ''}
              entityDetails={siteData}
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
      {showEditSiteDrawer && (
        <AddSiteDrawer
          open={showEditSiteDrawer}
          setSiteDrawer={setShowEditSiteDrawer}
          refetch={refetch}
          siteData={
            siteData
              ? {
                  site_id: Number(id),
                  site_name: siteData.site_name,
                  site_description: siteData.site_description,
                  latitude: siteData.latitude,
                  longitude: siteData.longitude,
                  images: siteData.images
                }
              : null
          }
        />
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
                {t('housing_module.you_dont_have_permission_to_access_this_site')}
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

export default SiteDetailsPage
