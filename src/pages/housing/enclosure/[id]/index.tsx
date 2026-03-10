import { useTheme } from '@emotion/react'
import { Breadcrumbs, Card, Tab, Tabs, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import EnclosureWiseEnclosure from 'src/components/housing/enclosure/EnclosureWiseEnclosure'
import EnclosureWiseSpecies from 'src/components/housing/enclosure/EnclosureWiseSpecies'
import MediaListing from 'src/components/housing/enclosure/MediaListing'
import NotesListing from 'src/components/housing/sites/NotesListing'
import UsersListing from 'src/components/housing/sites/UsersListing'
import InchargeListing from 'src/components/housing/sites/InchargeListing'
import FoodWastageListing from 'src/components/housing/sites/FoodWastageListing'
import enforceModuleAccess from 'src/components/ProtectedRoute'
import { useAuth } from 'src/hooks/useAuth'
import { getEnclosureWiseStat } from 'src/lib/api/housing'
import InsightsCard from 'src/views/utility/insights/InsightsCard'

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

  const tabConfig: TabConfigItem[] = [
    { label: 'Species', value: 'species', component: EnclosureWiseSpecies },
    { label: 'Media', value: 'media', component: MediaListing },
    { label: 'Users', value: 'users', component: UsersListing },
    { label: 'Notes', value: 'notes', component: NotesListing },
    { label: 'Food Wastage', value: 'foodWastage', component: FoodWastageListing },
    { label: 'Incharges', value: 'incharges', component: InchargeListing }
  ]

  // Add Enclosures tab only if there are sub-enclosures
  if ((data?.data as any)?.total_sub_enclosure_count > 0) {
    // Insert after Media tab (index 2)
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

  return (
    <>
      <Box>
        <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
          <Typography onClick={() => router.back()} sx={{ color: theme.palette.text.secondary, cursor: 'pointer' }}>
            Enclosures
          </Typography>
          <Typography color={theme.palette.text.primary}>Enclosure Details</Typography>
        </Breadcrumbs>
        <InsightsCard
          data={data?.data as any}
          loading={isLoading}
          image={(data?.data as any)?.images?.[0]?.file}
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
              entityImage={(data?.data as any)?.images?.[0]?.file}
            />
          </Box>
        </Card>
      </Box>
    </>
  )
}

export default enforceModuleAccess(EnclsouerDetails, 'enable_housing_in_web')
