import React, { useState, FC, useMemo, useEffect } from 'react'
import { Box, Tabs, Tab } from '@mui/material'
import { useRouter } from 'next/router'
import { useQuery } from '@tanstack/react-query'

import { getOffspringStats } from 'src/lib/api/housing'
import { AnimalOffspringProps, OffspringStats } from 'src/types/housing/animalsOffspring'
import { AllOffspring, Litter, Mortality, FetalDeath, Clutch, Egg } from './offspring'

const OFFSPRING_TABS = [
  { value: 'all_offspring', label: 'All Offspring', key: 'all_offspring' },
  { value: 'litter_count', label: 'Litter', key: 'litter_count' },
  { value: 'mortality_count', label: 'Mortality', key: 'mortality_count' },
  { value: 'fetal_death_count', label: 'Fetal Death', key: 'fetal_death_count' },
  { value: 'clutch_count', label: 'Clutch', key: 'clutch_count' },
  { value: 'egg_count', label: 'Egg', key: 'egg_count' }
]

const AnimalOffspring: FC<AnimalOffspringProps> = ({ animalDetails }) => {
  const router = useRouter()
  const { id } = router.query

  const animalId = id as string

  const [activeTab, setActiveTab] = useState('all_offspring')

  const isMother = useMemo(
    () => (animalDetails?.sex === 'female' ? 1 : 0),
    [animalDetails?.sex]
  )

  //  Fetch stats
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ['offspring-stats', animalId, isMother],
    queryFn: () =>
      getOffspringStats({
        parent_id: animalId,
        is_mother: isMother
      }),
    enabled: !!animalId
  })

  const stats: OffspringStats | null = statsData?.success ? statsData.data : null

  // Tab label with count
  const getTabLabel = (key: string, label: string): string => {
    if (isStatsLoading && !stats) return label
    const count = Number(stats?.[key] || 0)
    return count ? `${label} - ${count}` : label
  }

  //  Dynamic tab filtering
  const filteredTabs = useMemo(() => {
    if (!animalDetails) return []

    const reproductionType = animalDetails?.reproduction_type
    const sex = animalDetails?.sex

    let tabs = [...OFFSPRING_TABS]

    //  Egg-laying
    if (reproductionType === 'egg-laying') {
      tabs = tabs.filter(tab =>
        ['all_offspring', 'clutch_count', 'egg_count'].includes(tab.value)
      )

      if (sex === 'male') {
        tabs = tabs.filter(tab => tab.value !== 'clutch_count')
      }
    }

    // Mammals (default)
    else {
      tabs = tabs.filter(tab =>
        ['all_offspring', 'litter_count', 'mortality_count', 'fetal_death_count'].includes(tab.value)
      )

      if (sex === 'male') {
        tabs = tabs.filter(tab => tab.value !== 'litter_count')
      }
    }

    return tabs
  }, [animalDetails])

  // Fix active tab if removed
  useEffect(() => {
    if (!filteredTabs.find(tab => tab.value === activeTab)) {
      setActiveTab(filteredTabs?.[0]?.value || 'all_offspring')
    }
  }, [filteredTabs, activeTab])

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue)
  }

  //  Render tab content
  const renderTabContent = () => {
    const props = { animalDetails, animalId, isMother, stats }

    switch (activeTab) {
      case 'all_offspring':
        return <AllOffspring {...props} />
      case 'litter_count':
        return <Litter {...props} />
      case 'mortality_count':
        return <Mortality {...props} />
      case 'fetal_death_count':
        return <FetalDeath {...props} />
      case 'clutch_count':
        return <Clutch {...props} />
      case 'egg_count':
        return <Egg {...props} />
      default:
        return <AllOffspring {...props} />
    }
  }

  return (
    <Box sx={{ py: 3 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant='scrollable'
          scrollButtons='auto'
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '14px',
              minWidth: 100
            }
          }}
        >
          {filteredTabs.map(tab => (
            <Tab
              key={tab.value}
              value={tab.value}
              label={getTabLabel(tab.key, tab.label)}
            />
          ))}
        </Tabs>
      </Box>

      {renderTabContent()}
    </Box>
  )
}

export default React.memo(AnimalOffspring)