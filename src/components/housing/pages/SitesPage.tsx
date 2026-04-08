import { Box, Breadcrumbs, Card, Typography } from '@mui/material'
import React, { useState } from 'react'
import { useAuth } from 'src/hooks/useAuth'
import SiteListing from 'src/components/housing/sites/SiteListing'
import InsightsCard from 'src/views/utility/insights/InsightsCard'
import { getSiteAnalytics } from 'src/lib/api/housing'
import { useQuery } from '@tanstack/react-query'
import type { DrawerType, DrawerData } from 'src/types/housing'
import { useTranslation } from 'react-i18next'

interface StatItem {
  label: string
  value: number
  imagePath: string
  onClick?: () => void
}

const SitesPage: React.FC = () => {
  const { t } = useTranslation()

  const [drawerType, setDrawerType] = useState<DrawerType>(null)
  const [drawerData, setDrawerData] = useState<DrawerData | null>(null)
  const [siteDrawer, setSiteDrawer] = useState<boolean>(false)

  const auth = useAuth()
  const insightsViewAccess = (auth as any)?.userData?.roles?.settings?.housing_view_insights
  const addSiteAccess = (auth as any)?.userData?.permission?.user_settings?.add_sites
  const zooId = (auth as any)?.userData?.user?.zoos?.[0]?.zoo_id

  const handleEnclosureInsightClick = (): void => {
    setDrawerType('enclosures')
    setDrawerData({
      queryKey: 'insights-enclosures-sites-drawer',
      id: zooId,
      name: '',
      params: {
        ref_type: 'zoo',
        data_type: 'enclosure',
        ref_id: zooId
      }
    })
  }

  const handleAnimalInsightClick = (): void => {
    setDrawerType('insights-animals')
    setDrawerData({
      queryKey: 'insights-animals-sites-drawer',
      id: zooId,
      name: '',
      params: {
        ref_type: 'zoo',
        data_type: 'animal',
        ref_id: zooId
      }
    })
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ['site-insights', zooId],
    queryFn: () => getSiteAnalytics(zooId),
    enabled: !!zooId
  })

  const handleButtonClick = (): void => {
    setSiteDrawer(true)
  }

  const statsData: StatItem[] = [
    {
      label: t('species'),
      value: data?.data?.zoo_stats?.total_species || 0,
      imagePath: '/images/housing/species.svg'
    },
    {
      label: t('animals'),
      value: data?.data?.zoo_stats?.total_animals || 0,
      imagePath: '/images/housing/animals.svg',
      onClick: handleAnimalInsightClick
    },
    {
      label: t('sections'),
      value: data?.data?.zoo_stats?.total_sections || 0,
      imagePath: '/images/housing/sections.svg'
    },
    {
      label: t('enclosures'),
      value: data?.data?.zoo_stats?.total_enclosures || 0,
      imagePath: '/images/housing/enclosures.svg',
      onClick: handleEnclosureInsightClick
    }
  ]

  return (
    <Box>
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
        <Typography color='inherit' sx={{ cursor: 'pointer' }}>
          {t('housing_module.housing')}
        </Typography>

        <Typography sx={{ cursor: 'pointer' }} color='text.primary'>
          {t('housing_module.site_list')}
        </Typography>
      </Breadcrumbs>
      <Box>
        <InsightsCard
          data={data?.data}
          image={data?.data?.images?.[0]?.file}
          loading={isLoading}
          pageTitle={t('housing_module.all_site_insights')}
          isListingPage
          error={error as any}
          haveInsightsViewAccess={insightsViewAccess}
          statsData={statsData as any}
          zooName=''
          subtitle=''
          userName=''
          description=''
          userImage=''
          onCallClick={() => {}}
          onMessageClick={() => {}}
          actions={{
            onAddNew: addSiteAccess ? handleButtonClick : null
          }}
        />
        <Box sx={{ mt: 6 }}>
          <Card sx={{ p: { xs: 3, md: 5 } }}>
            <SiteListing
              drawerType={drawerType}
              setDrawerType={setDrawerType}
              drawerData={drawerData}
              setDrawerData={setDrawerData}
              siteDrawer={siteDrawer}
              setSiteDrawer={setSiteDrawer}
              totalAnimalsCount={data?.data?.zoo_stats?.total_animals || 0}
            />
          </Card>
        </Box>
      </Box>
    </Box>
  )
}

export default SitesPage
