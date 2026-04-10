import { useTheme } from '@emotion/react'
import { Breadcrumbs, Card, Typography, CircularProgress } from '@mui/material'
import { Box } from '@mui/system'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import useTabSync from 'src/hooks/useTabSync'
import EnclosureOverview from 'src/components/housing/enclosure/EnclosureOverview'
import EnclosureWiseEnclosure from 'src/components/housing/enclosure/EnclosureWiseEnclosure'
import EnclosureWiseSpecies from 'src/components/housing/enclosure/EnclosureWiseSpecies'
import MediaListing from 'src/components/housing/enclosure/MediaListing'
import NotesListing from 'src/components/housing/sites/NotesListing'
import InchargeListing from 'src/components/housing/sites/InchargeListing'
import FoodWastageListing from 'src/components/housing/sites/FoodWastageListing'
import { useAuth } from 'src/hooks/useAuth'
import { getEnclosureWiseStat, getEnclosureBasicInfo, getEntityPermissionCheck } from 'src/lib/api/housing'
import InsightsCard from 'src/views/utility/insights/InsightsCard'
import AnimalDrawer from 'src/components/housing/utils/AnimalDrawer'
import { EntityAssessment } from 'src/components/housing/common/assessment'
import AddEnclosureDrawer from 'src/views/pages/housing/enclosures/AddEnclosureDrawer'
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
  params: Record<string, any>
}

interface StatItem {
  label: string
  value: number
  imagePath: string
  onClick?: () => void
}

interface EnclosureDetailsPageProps {
  id: string
}

const EnclosureDetailsPage: React.FC<EnclosureDetailsPageProps> = ({ id }) => {
  const { t } = useTranslation()
  const theme = useTheme() as any
  const router = useRouter()

  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [showAccessRestricted, setShowAccessRestricted] = useState<boolean>(false)

  const [drawerType, setDrawerType] = useState<string | null>(null)
  const [drawerData, setDrawerData] = useState<DrawerData | null>(null)
  const [showEditEnclosureDrawer, setShowEditEnclosureDrawer] = useState<boolean>(false)
  const [refetchEnclosure, setRefetchEnclosure] = useState<boolean>(false)

  const auth = useAuth()
  const insightsViewAccess = (auth as any)?.userData?.roles?.settings?.housing_view_insights
  const addEnclosureAccess = (auth as any)?.userData?.roles?.settings?.housing_add_enclosure
  const zooId = (auth as any)?.userData?.user?.zoos?.[0]?.zoo_id

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

  const { data: enclosureBasicInfo } = useQuery({
    queryKey: ['enclosure-basic-info', id],
    queryFn: () =>
      getEnclosureBasicInfo({
        enclosure_id: Number(id)
      }),
    enabled: !!id && showEditEnclosureDrawer
  })

  const allTabConfig: TabConfigItem[] = [
    { labelKey: 'overview', value: 'overview', component: EnclosureOverview },
    { labelKey: 'species', value: 'species', component: EnclosureWiseSpecies, requiresPermission: 'collection_animal_records' },
    { labelKey: 'enclosures', value: 'enclosures', component: EnclosureWiseEnclosure },
    { labelKey: 'notes', value: 'notes', component: NotesListing },
    { labelKey: 'housing_module.assessment', value: 'assessment', component: EntityAssessment },
    { labelKey: 'media', value: 'media', component: MediaListing },
    { labelKey: 'housing_module.incharges', value: 'incharges', component: InchargeListing },
    { labelKey: 'housing_module.food_wastage', value: 'foodWastage', component: FoodWastageListing }
  ]

  const tabConfig = useMemo(() => {
    return allTabConfig.filter(tab => {
      if (tab.requiresPermission) {
        if (permissions?.[tab.requiresPermission] !== true) {
          return false
        }
      }

      if (tab.value === 'enclosures' && !((data?.data as any)?.total_sub_enclosure_count > 0)) {
        return false
      }

      return true
    })
  }, [permissions, data])

  const availableTabs = useMemo(() => tabConfig.map(t => t.value), [tabConfig])
  const [selectedTab, setSelectedTab] = useTabSync(allTabConfig[0].value, availableTabs)

  const handleAnimalsInsightClick = (): void => {
    setDrawerType('animals-insights')
    setDrawerData({
      queryKey: 'enclosure-insights-animals-drawer',
      id,
      name: (data?.data as any)?.user_enclosure_name,
      params: {
        enclosure_id: [id]
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
      value: (data?.data as any)?.total_species || 0,
      imagePath: '/images/housing/species.svg',
      onClick: () => setSelectedTab('species')
    },
    {
      label: t('animals'),
      value: (data?.data as any)?.total_occupants || 0,
      imagePath: '/images/housing/animals.svg',
      onClick: handleAnimalsInsightClick
    }
  ]

  const handleTabChange = (event: React.SyntheticEvent, newValue: string): void => {
    setSelectedTab(newValue)
  }

  const selected = tabConfig.find(tab => tab.value === selectedTab)
  const SelectedComponent = selected?.component || (() => <Box>{t('no_component_found')}</Box>)

  const sectionId = (data?.data as any)?.section_id
  const sectionName = (data?.data as any)?.section_name

  const handleBreadcrumbClick = () => {
    if (sectionId) {
      router.push(`/housing/sections/${sectionId}`)
    } else {
      router.push('/housing/sites')
    }
  }

  useEffect(() => {
    const fetchEntityPermission = async (): Promise<void> => {
      if (!id) return

      try {
        const response = await getEntityPermissionCheck({
          entity_type: 'enclosure',
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
            {sectionName || t('housing_module.section_details')}
          </Typography>
          <Typography color={theme.palette.text.primary}>{t('housing_module.enclosure_details')}</Typography>
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
          pageTitle={t('housing_module.enclosure_details')}
          haveInsightsViewAccess={insightsViewAccess}
          actions={{
            onEdit: addEnclosureAccess ? () => setShowEditEnclosureDrawer(true) : null
          }}
          editTooltip={t('housing_module.edit_enclosure') as string}
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
          <TabsWithMenu tabs={tabConfig} selectedTab={selectedTab} onTabChange={handleTabChange} />

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
      {drawerType === 'animals-insights' && (
        <AnimalDrawer
          totalCount={(data?.data as any)?.total_occupants}
          open={!!drawerData}
          onClose={handleDrawerClose}
          data={drawerData as any}
          defaultImage={'/images/housing/Enclosure icon.png'}
        />
      )}
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
                {t('housing_module.you_dont_have_permission_to_access_this_enclosure')}
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

export default EnclosureDetailsPage
