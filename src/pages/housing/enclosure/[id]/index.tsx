import { useTheme } from '@emotion/react'
import { Breadcrumbs, Card, Tab, Tabs, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import React, { useEffect, useMemo, useState } from 'react'
import EnclosureOverview from 'src/components/housing/enclosure/EnclosureOverview'
import EnclosureWiseEnclosure from 'src/components/housing/enclosure/EnclosureWiseEnclosure'
import EnclosureWiseSpecies from 'src/components/housing/enclosure/EnclosureWiseSpecies'
import MediaListing from 'src/components/housing/enclosure/MediaListing'
import NotesListing from 'src/components/housing/sites/NotesListing'
import InchargeListing from 'src/components/housing/sites/InchargeListing'
import FoodWastageListing from 'src/components/housing/sites/FoodWastageListing'
import enforceModuleAccess from 'src/components/ProtectedRoute'
import { useAuth } from 'src/hooks/useAuth'
import { getEnclosureWiseStat, getEnclosureBasicInfo } from 'src/lib/api/housing'
import InsightsCard from 'src/views/utility/insights/InsightsCard'
import { EntityAssessment } from 'src/components/housing/common/assessment'
import AddEnclosureDrawer from 'src/views/pages/housing/enclosures/AddEnclosureDrawer'

interface TabConfigItem {
  label: string
  value: string
  component: React.ComponentType<any>
  requiresPermission?: string
}

interface DrawerData {
  queryKey: string
  id: string | undefined
  name?: string
  params: Record<string, any>
}

interface StatItem {
  label: string
  value: number
  imagePath: string
  onClick?: () => void
}

const EnclsouerDetails: React.FC = () => {
  const theme = useTheme() as any
  const router = useRouter()
  const { id } = router.query as { id?: string }

  const [drawerType, setDrawerType] = useState<string | null>(null)
  const [drawerData, setDrawerData] = useState<DrawerData | null>(null)
  const [showEditEnclosureDrawer, setShowEditEnclosureDrawer] = useState<boolean>(false)
  const [refetchEnclosure, setRefetchEnclosure] = useState<boolean>(false)

  const auth = useAuth()
  const insightsViewAccess = (auth as any)?.userData?.roles?.settings?.housing_view_insights
  const addEnclosureAccess = (auth as any)?.userData?.roles?.settings?.housing_add_enclosure
  const zooId = (auth as any)?.userData?.user?.zoos?.[0]?.zoo_id

  // Merge permissions from both sources (matching mobile implementation)
  const userSettingsPermissions = (auth as any)?.userData?.permission?.user_settings || {}
  const rolesSettingsPermissions = (auth as any)?.userData?.roles?.settings || {}
  const permissions: Record<string, boolean> = { ...userSettingsPermissions, ...rolesSettingsPermissions }

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['enclosure-detail', id],
    queryFn: () =>
      getEnclosureWiseStat({
        enclosure_id: Number(id)
      }),
    enabled: !!id
  })

  // Fetch enclosure basic info for edit mode
  const { data: enclosureBasicInfo } = useQuery({
    queryKey: ['enclosure-basic-info', id],
    queryFn: () =>
      getEnclosureBasicInfo({
        enclosure_id: Number(id)
      }),
    enabled: !!id && showEditEnclosureDrawer
  })

  // Tab order follows mobile implementation (OccupantScreen.js)
  // Permission checks match mobile: collection_animal_records, medical_records
  const allTabConfig: TabConfigItem[] = [
    { label: 'Overview', value: 'overview', component: EnclosureOverview },
    { label: 'Species', value: 'species', component: EnclosureWiseSpecies, requiresPermission: 'collection_animal_records' },
    { label: 'Enclosures', value: 'enclosures', component: EnclosureWiseEnclosure },
    { label: 'Notes', value: 'notes', component: NotesListing },
    { label: 'Assessment', value: 'assessment', component: EntityAssessment },
    // TODO: Uncomment when Medical tab component is implemented
    // { label: 'Medical', value: 'medical', component: MedicalListing, requiresPermission: 'medical_records' },
    { label: 'Media', value: 'media', component: MediaListing },
    { label: 'Incharges', value: 'incharges', component: InchargeListing },
    { label: 'Food Wastage', value: 'foodWastage', component: FoodWastageListing }
  ]

  const [selectedTab, setSelectedTab] = useState<string>(allTabConfig[0].value)

  // Filter tabs based on permissions and data conditions
  const tabConfig = useMemo(() => {
    return allTabConfig.filter(tab => {
      // Check permission requirement
      if (tab.requiresPermission) {
        if (permissions?.[tab.requiresPermission] !== true) {
          return false
        }
      }

      // Hide Enclosures tab if no sub-enclosures
      if (tab.value === 'enclosures' && !((data?.data as any)?.total_sub_enclosure_count > 0)) {
        return false
      }

      return true
    })
  }, [permissions, data])

  const statsData: StatItem[] = [
    {
      label: 'Species',
      value: (data?.data as any)?.total_species || 0,
      imagePath: '/images/housing/species.svg',
      onClick: () => setSelectedTab('species')
    },
    {
      label: 'Animals',
      value: (data?.data as any)?.total_occupants || 0,
      imagePath: '/images/housing/animals.svg',
      onClick: () => console.log('Animals')
    }
  ]

  const handleTabChange = (event: React.SyntheticEvent, newValue: string): void => {
    setSelectedTab(newValue)
  }

  const handleEnclosureListingClick = (): void => {
    router.back()
  }

  const selected = tabConfig.find(tab => tab.value === selectedTab)
  const SelectedComponent = selected?.component || (() => <Box>No component found</Box>)

  useEffect(() => {
    // Updating URL with tab parameter when tab changes
    router.replace(
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

  // Reset to first available tab if selected tab becomes unavailable due to permissions
  useEffect(() => {
    const isSelectedTabAvailable = tabConfig.some(tab => tab.value === selectedTab)
    if (!isSelectedTabAvailable && tabConfig.length > 0) {
      setSelectedTab(tabConfig[0].value)
    }
  }, [tabConfig, selectedTab])

  const sectionId = (data?.data as any)?.section_id
  const sectionName = (data?.data as any)?.section_name

  const handleBreadcrumbClick = () => {
    if (sectionId) {
      router.push(`/housing/sections/${sectionId}`)
    } else {
      router.push('/housing/sites')
    }
  }

  return (
    <>
      <Box>
        <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
          <Typography
            onClick={handleBreadcrumbClick}
            sx={{ color: theme.palette.text.secondary, cursor: 'pointer' }}
          >
            {sectionName || 'Section Details'}
          </Typography>
          <Typography color={theme.palette.text.primary}>Enclosure Details</Typography>
        </Breadcrumbs>
        <InsightsCard
          data={data?.data as any}
          loading={isLoading}
          image={(data?.data as any)?.images?.find((img: any) => img?.display_type === 'banner')?.file}
          statsData={statsData as any}
          error={error}
          zooName={(data?.data as any)?.user_enclosure_name}
          subtitle={(data?.data as any)?.enclosure_desc}
          userName={(data?.data as any)?.incharge_name}
          userImage=""
          description=""
          pageTitle="Enclosure Details"
          haveInsightsViewAccess={insightsViewAccess}
          actions={{
            onEdit: addEnclosureAccess ? () => setShowEditEnclosureDrawer(true) : null
          }}
          editTooltip='Edit enclosure'
          onCallClick={() => {
            const phoneNumber = (data?.data as any)?.incharge_phone_no || ''
            if (phoneNumber) {
              // window.location.href = `tel:${phoneNumber}`
            } else {
              return
            }
          }}
          onMessageClick={() => {
            const phoneNumber = (data?.data as any)?.incharge_mobile_no || ''
            if (phoneNumber) {
              window.open(`sms:${phoneNumber}`)
            } else return
          }}
          qrCodeImage={(data?.data as any)?.enclosure_qr_image || (data?.data as any)?.qr_code_image}
          entityName={(data?.data as any)?.user_enclosure_name}
          entityId={(data?.data as any)?.enclosure_id}
        />
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
              refType="enclosure"
              entityName={(data?.data as any)?.user_enclosure_name}
              entityImage={(data?.data as any)?.images?.find((img: any) => img?.display_type === 'banner')?.file}
              entityType="enclosure"
              entityId={id || ''}
              entityDetails={data?.data}
            />
          </Box>
        </Card>
      </Box>
      {showEditEnclosureDrawer && (
        <AddEnclosureDrawer
          open={showEditEnclosureDrawer}
          setAddEnclosureDrawerOpen={setShowEditEnclosureDrawer}
          sectionId={(data?.data as any)?.section_id?.toString() || null}
          zooId={zooId}
          refetchEnclosure={refetchEnclosure}
          setRefechEnclosure={setRefetchEnclosure}
          refetch={refetch}
          enclosureData={{
            enclosure_id: (data?.data as any)?.enclosure_id,
            user_enclosure_name: (data?.data as any)?.user_enclosure_name,
            section_id: (data?.data as any)?.section_id,
            section_name: (data?.data as any)?.section_name,
            enclosure_desc: (data?.data as any)?.enclosure_desc,
            enclosure_environment: (data?.data as any)?.enclosure_environment || enclosureBasicInfo?.data?.enclosure_environment,
            enclosure_type: (data?.data as any)?.enclosure_type || enclosureBasicInfo?.data?.enclosure_type,
            enclosure_type_id: (data?.data as any)?.enclosure_type_id || enclosureBasicInfo?.data?.enclosure_type_id,
            enclosure_is_movable: (data?.data as any)?.enclosure_is_movable || enclosureBasicInfo?.data?.enclosure_is_movable,
            enclosure_is_walkable: (data?.data as any)?.enclosure_is_walkable || enclosureBasicInfo?.data?.enclosure_is_walkable,
            enclosure_sunlight: (data?.data as any)?.enclosure_sunlight || enclosureBasicInfo?.data?.enclosure_sunlight,
            enclosure_parent_id: (data?.data as any)?.enclosure_parent_id,
            parent_enclosure_name: (data?.data as any)?.parent_enclosure_name,
            enclosure_lat: (data?.data as any)?.enclosure_lat,
            enclosure_long: (data?.data as any)?.enclosure_long,
            commistioned_date: (data?.data as any)?.commistioned_date || enclosureBasicInfo?.data?.created_at,
            enclosure_code: (data?.data as any)?.enclosure_code,
            user_enclosure_id: (data?.data as any)?.user_enclosure_id,
            images: (data?.data as any)?.images
          }}
        />
      )}
    </>
  )
}

export default enforceModuleAccess(EnclsouerDetails, 'enable_housing_in_web')
