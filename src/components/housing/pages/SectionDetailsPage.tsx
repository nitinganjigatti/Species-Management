import { Box, Breadcrumbs, Typography, Card, useTheme, CircularProgress } from '@mui/material'
import { useRouter } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import useTabSync from 'src/hooks/useTabSync'
import InsightsCard from 'src/views/utility/insights/InsightsCard'

// Listing Components
import SpeciesListing from 'src/components/housing/sections/SpeciesListing'
import NotesListing from 'src/components/housing/sites/NotesListing'
import UsersListing from 'src/components/housing/sites/UsersListing'
import InchargeListing from 'src/components/housing/sites/InchargeListing'
import FoodWastageListing from 'src/components/housing/sites/FoodWastageListing'

import { useQuery } from '@tanstack/react-query'
import { getSectionAnalytics, getEntityPermissionCheck } from 'src/lib/api/housing'
import EnclosureListing from 'src/components/housing/sections/EnclosureListing'
import MediaListing from 'src/components/housing/sections/MediaListing'
import MortalityListing from 'src/components/housing/sections/MortalityListing'
import AnimalTreatmentListing from 'src/components/housing/sections/AnimalTreatmentListing'
import { useAuth } from 'src/hooks/useAuth'
import AnimalDrawer from 'src/components/housing/utils/AnimalDrawer'
import EnclosureDrawer from 'src/components/housing/utils/EnclosureDrawer'
import AddEnclosureDrawer from 'src/views/pages/housing/enclosures/AddEnclosureDrawer'
import AddSectionDrawer from 'src/views/pages/housing/section/AddSectionDrawer'
import { EntityAssessment } from 'src/components/housing/common/assessment'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import TabsWithMenu from 'src/views/pages/housing/utils/TabsWithMenu'

interface TabConfigItem {
  labelKey: string
  value: string
  component: React.ComponentType<any>
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
    section_id?: string | string[] | undefined
  }
}

interface StatItem {
  label: string
  value: number
  imagePath: string
  onClick?: () => void
}

interface SectionDetailsPageProps {
  id: string
}

const allTabConfig: TabConfigItem[] = [
  { labelKey: 'enclosures', value: 'enclosures', component: EnclosureListing },
  { labelKey: 'species', value: 'species', component: SpeciesListing, requiresPermission: 'collection_animal_records' },
  { labelKey: 'notes', value: 'notes', component: NotesListing },
  { labelKey: 'housing_module.assessment', value: 'assessment', component: EntityAssessment },
  { labelKey: 'media', value: 'media', component: MediaListing },
  { labelKey: 'housing_module.users', value: 'users', component: UsersListing },
  { labelKey: 'housing_module.incharges', value: 'incharges', component: InchargeListing },
  { labelKey: 'navigation.mortality', value: 'mortality', component: MortalityListing, requiresPermission: 'access_mortality_module' },
  {
    labelKey: 'housing_module.animals_under_treatment',
    value: 'animalTreatment',
    component: AnimalTreatmentListing,
    requiresPermission: 'medical_records'
  },
  { labelKey: 'housing_module.food_wastage', value: 'foodWastage', component: FoodWastageListing }
]

const SectionDetailsPage: React.FC<SectionDetailsPageProps> = ({ id }) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const router = useRouter()

  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [showAccessRestricted, setShowAccessRestricted] = useState<boolean>(false)

  const [drawerType, setDrawerType] = useState<string | null>(null)
  const [drawerData, setDrawerData] = useState<DrawerData | null>(null)
  const [addEnclosureDrawerOpen, setAddEnclosureDrawerOpen] = useState<boolean>(false)
  const [showEditSectionDrawer, setShowEditSectionDrawer] = useState<boolean>(false)
  const [refetchEnclosure, setRefechEnclosure] = useState<boolean>(false)
  const [addSuccessCheck, setAddSuccessCheck] = useState<boolean>(false)
  const auth = useAuth()

  const insightsViewAccess = (auth as any)?.userData?.roles?.settings?.housing_view_insights
  const addEnclosureAccess = (auth as any)?.userData?.roles?.settings?.housing_add_enclosure
  const addSectionAccess = (auth as any)?.userData?.roles?.settings?.housing_add_section

  const zooId = (auth as any)?.userData?.user?.zoos?.[0]?.zoo_id

  const userSettingsPermissions = (auth as any)?.userData?.permission?.user_settings || {}
  const rolesSettingsPermissions = (auth as any)?.userData?.roles?.settings || {}
  const permissions: Record<string, boolean> = { ...userSettingsPermissions, ...rolesSettingsPermissions }

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['section-insights', id],
    queryFn: () =>
      getSectionAnalytics({
        section_id: +id!,
        zoo_id: zooId
      }),
    enabled: !!id && !!zooId
  })

  const tabConfig = useMemo(() => {
    return allTabConfig.filter(tab => {
      if (tab.requiresPermission) {
        if (permissions?.[tab.requiresPermission] !== true) {
          return false
        }
      }

      if (tab.value === 'foodWastage' && String((data?.data as any)?.is_system_generated) === '1') {
        return false
      }

      return true
    })
  }, [permissions, data])

  const availableTabs = useMemo(() => tabConfig.map(t => t.value), [tabConfig])
  const [selectedTab, setSelectedTab] = useTabSync(allTabConfig[0].value, availableTabs)

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
        section_id: id
      }
    })
  }

  const handleAmimalsInsightClick = (): void => {
    setDrawerType('animals-insights')
    setDrawerData({
      queryKey: 'insights-animals-section-drawer',
      id: zooId,
      name: data?.data?.section_name,
      params: {
        section_id: [id]
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
      value: data?.data?.total_species || 0,
      imagePath: '/images/housing/species.svg',
      onClick: () => setSelectedTab('species')
    },
    {
      label: t('animals'),
      value: data?.data?.total_animals || 0,
      imagePath: '/images/housing/animals.svg',
      onClick: handleAmimalsInsightClick
    },
    {
      label: t('enclosures'),
      value: data?.data?.total_enclosures || 0,
      imagePath: '/images/housing/enclosures.svg',
      onClick: () => setSelectedTab('enclosures')
    }
  ]

  const siteId = (data?.data as any)?.site_id
  const siteName = (data?.data as any)?.site_name

  const handleBreadcrumbClick = (): void => {
    if (siteId) {
      router.push(`/housing/sites/${siteId}`)
    } else {
      router.push('/housing/sites')
    }
  }

  const selected = tabConfig.find(tab => tab.value === selectedTab)
  const SelectedComponent = selected?.component || (() => <Box>{t('no_component_found')}</Box>)

  useEffect(() => {
    const fetchEntityPermission = async (): Promise<void> => {
      if (!id) return

      try {
        const response = await getEntityPermissionCheck({
          entity_type: 'section',
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

  const handleAccessRestrictedConfirmation = (): void => {
    setShowAccessRestricted(false)
    router.push('/housing/sites')
  }

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
        <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
          <Typography
            onClick={handleBreadcrumbClick}
            sx={{ color: theme.palette.text.secondary, cursor: 'pointer' }}
          >
            {siteName || t('housing_module.site_details')}
          </Typography>
          <Typography color={theme.palette.text.primary}>{t('housing_module.section_details')}</Typography>
        </Breadcrumbs>

        <InsightsCard
          data={data?.data as any}
          loading={isLoading}
          zooName={(data?.data as any)?.section_name}
          image={(data?.data as any)?.images?.find((img: any) => img?.display_type === 'banner')?.file}
          subtitle=''
          userName={(data?.data as any)?.incharge_name}
          description=''
          userImage=''
          pageTitle={t('housing_module.section_details')}
          actions={{
            onAddNew: addEnclosureAccess ? () => setAddEnclosureDrawerOpen(true) : null,
            onEdit: addSectionAccess ? () => setShowEditSectionDrawer(true) : null
          }}
          addNewTooltip={t('housing_module.add_new_enclosure') as string}
          editTooltip={t('housing_module.edit_section') as string}
          onCallClick={() => {
            const phoneNumber = (data?.data as any)?.incharge_phone_number || ''
            if (phoneNumber) {
              // window.location.href = `tel:${phoneNumber}`
            } else {
              return
            }
          }}
          onMessageClick={() => {
            const phoneNumber = (data?.data as any)?.incharge_phone_number || ''
            if (phoneNumber) {
              window.open(`sms:${phoneNumber}`)
            } else return
          }}
          haveInsightsViewAccess={insightsViewAccess}
          error={error}
          statsData={statsData as any}
          qrCodeImage={(data?.data as any)?.qr_code_image}
          entityName={(data?.data as any)?.section_name}
          entityId={(data?.data as any)?.section_id}
        />

        <Card sx={{ mt: 6, p: { xs: 3, md: 5 } }}>
          <TabsWithMenu tabs={tabConfig} selectedTab={selectedTab} onTabChange={handleTabChange} />

          <Box>
            <SelectedComponent
              selectedTab={selectedTab}
              setSelectedTab={setSelectedTab}
              drawerType={drawerType}
              setDrawerType={setDrawerType}
              drawerData={drawerData}
              setDrawerData={setDrawerData}
              refetchEnclosure={refetchEnclosure}
              refType='section'
              entityName={(data?.data as any)?.section_name}
              entityImage={(data?.data as any)?.images?.find((img: any) => img?.display_type === 'banner')?.file}
              entityType='section'
              entityId={id || ''}
              entityDetails={data?.data}
            />
          </Box>
        </Card>
        {drawerType === 'animals-insights' && (
          <AnimalDrawer
            totalCount={(data?.data as any)?.total_animals}
            open={!!drawerData}
            onClose={handleDrawerClose}
            data={drawerData as any}
            defaultImage={'/images/housing/section-colored-icon.svg'}
          />
        )}
        {drawerType === 'enclosures' && (
          <EnclosureDrawer open={!!drawerData} onClose={handleDrawerClose} data={drawerData as any} />
        )}
      </Box>
      {addEnclosureDrawerOpen && (
        <AddEnclosureDrawer
          open={addEnclosureDrawerOpen}
          setAddEnclosureDrawerOpen={setAddEnclosureDrawerOpen}
          sectionId={id ?? null}
          zooId={zooId}
          refetchEnclosure={refetchEnclosure}
          setRefechEnclosure={setRefechEnclosure}
        />
      )}
      {showEditSectionDrawer && (
        <AddSectionDrawer
          open={showEditSectionDrawer}
          setShowAddSectionDrawer={setShowEditSectionDrawer}
          selectedSiteId={(data?.data as any)?.site_id?.toString() || ''}
          addSuccessCheck={addSuccessCheck}
          setAddSuccessCheck={setAddSuccessCheck}
          refetch={refetch}
          sectionData={(data?.data as any) ? {
            section_id: (data?.data as any)?.section_id,
            section_name: (data?.data as any)?.section_name,
            section_site_id: (data?.data as any)?.site_id,
            section_latitude: (data?.data as any)?.section_latitude,
            section_longitude: (data?.data as any)?.section_longitude,
            images: (data?.data as any)?.images
          } : null}
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
                {t('housing_module.you_dont_have_permission_to_access_this_section')}
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

export default SectionDetailsPage
