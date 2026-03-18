import { useTheme } from '@emotion/react'
import { Breadcrumbs, Card, Tab, Tabs, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import EnclosureOverview from 'src/components/housing/enclosure/EnclosureOverview'
import EnclosureWiseEnclosure from 'src/components/housing/enclosure/EnclosureWiseEnclosure'
import EnclosureWiseSpecies from 'src/components/housing/enclosure/EnclosureWiseSpecies'
import MediaListing from 'src/components/housing/enclosure/MediaListing'
import NotesListing from 'src/components/housing/sites/NotesListing'
import InchargeListing from 'src/components/housing/sites/InchargeListing'
import FoodWastageListing from 'src/components/housing/sites/FoodWastageListing'
import enforceModuleAccess from 'src/components/ProtectedRoute'
import { useAuth } from 'src/hooks/useAuth'
import { getEnclosureWiseStat } from 'src/lib/api/housing'
import InsightsCard from 'src/views/utility/insights/InsightsCard'
import { EntityAssessment } from 'src/components/housing/common/assessment'

interface TabConfigItem {
  label: string
  value: string
  component: React.ComponentType<any>
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

  const auth = useAuth()
  const insightsViewAccess = (auth as any)?.userData?.roles?.settings?.housing_view_insights

  const { data, isLoading, error } = useQuery({
    queryKey: ['site-detail', id],
    queryFn: () =>
      getEnclosureWiseStat({
        enclosure_id: Number(id)
      }),
    enabled: !!id
  })

  // Tab order follows mobile implementation (OccupantScreen.js)
  const tabConfig: TabConfigItem[] = [
    { label: 'Overview', value: 'overview', component: EnclosureOverview },
    { label: 'Species', value: 'species', component: EnclosureWiseSpecies },
    { label: 'Notes', value: 'notes', component: NotesListing },
    { label: 'Assessment', value: 'assessment', component: EntityAssessment },
    { label: 'Media', value: 'media', component: MediaListing },
    { label: 'Incharges', value: 'incharges', component: InchargeListing },
    { label: 'Food Wastage', value: 'foodWastage', component: FoodWastageListing }
  ]

  // Add Enclosures tab only if there are sub-enclosures (insert after Species, index 2)
  if ((data?.data as any)?.total_sub_enclosure_count > 0) {
    tabConfig.splice(2, 0, {
      label: 'Enclosures',
      value: 'enclosures',
      component: EnclosureWiseEnclosure
    })
  }

  useEffect(() => {
    if (!tabConfig.some(tab => tab.value === selectedTab)) {
      setSelectedTab(tabConfig[0].value)
    }
  }, [data])

  const [selectedTab, setSelectedTab] = useState<string>(tabConfig[0].value)

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
    </>
  )
}

export default enforceModuleAccess(EnclsouerDetails, 'enable_housing_in_web')
