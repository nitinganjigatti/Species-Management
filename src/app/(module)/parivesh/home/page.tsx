'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Box, Chip, Tab, Tabs } from '@mui/material'
import { useTranslation } from 'react-i18next'
import Spinner from 'src/@core/components/spinner'

// Tab components — to be created
import OverviewTab from 'src/components/parivesh/home/OverviewTab'
import NewEntriesTab from 'src/components/parivesh/home/NewEntriesTab'
import BatchesTab from 'src/components/parivesh/home/BatchesTab'

interface TabBadgeProps {
  label: string
  count?: number | null
}

const TabBadge = ({ label, count }: TabBadgeProps) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    {label}
    {count ? <Chip size='small' label={count} color='secondary' sx={{ fontSize: '12px' }} /> : null}
  </Box>
)

const TABS = ['overview', 'new-entries', 'batches'] as const
type TabValue = typeof TABS[number]

const PariveshHomePage = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()

  const tab = (searchParams?.get('tab') as TabValue) || 'overview'
  const activeTab = TABS.includes(tab) ? tab : 'overview'

  const handleTabChange = (_: React.SyntheticEvent, newValue: TabValue) => {
    router.push(`?tab=${newValue}`, { scroll: false })
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />
      case 'new-entries':
        return <NewEntriesTab />
      case 'batches':
        return <BatchesTab />
      default:
        return null
    }
  }

  return (
    <Box>
      <Tabs value={activeTab} onChange={handleTabChange} aria-label='parivesh tabs'>
        <Tab
          value='overview'
          label={<TabBadge label={t('parivesh_module.overview')} />}
        />
        <Tab
          value='new-entries'
          label={<TabBadge label={t('parivesh_module.new_entries')} />}
        />
        <Tab
          value='batches'
          label={<TabBadge label={t('parivesh_module.batches')} />}
        />
      </Tabs>

      <Box sx={{ mt: 4 }}>
        {renderTab()}
      </Box>
    </Box>
  )
}

const PariveshHomePageWrapper = () => (
  <Suspense fallback={<Spinner sx={{}} />}>
    <PariveshHomePage />
  </Suspense>
)

export default PariveshHomePageWrapper
