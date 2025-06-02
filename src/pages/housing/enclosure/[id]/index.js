import { useTheme } from '@emotion/react'
import { Breadcrumbs, Card, Tab, Tabs, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import EnclosureWiseSpecies from 'src/components/housing/enclosure/EnclosureWiseSpecies'
import { getEnclosureWiseStat } from 'src/lib/api/housing'
import InsightsCard from 'src/views/utility/insights/InsightsCard'

const tabConfig = [{ label: 'Species', value: 'species', component: EnclosureWiseSpecies }]

const EnclsouerDetails = () => {
  const theme = useTheme()
  const router = useRouter()
  const { id } = router.query

  const [selectedTab, setSelectedTab] = useState(tabConfig[0].value)

  // const { data, isLoading, error } = useQuery({
  //   queryKey: [`enclosure-stats-data`, id],
  //   queryFn: () => {
  //     getEnclosureWiseStat(id)
  //   },
  //   enabled: !!id
  // })

  const { data, isLoading, error } = useQuery({
    queryKey: ['site-detail', id],
    queryFn: () =>
      getEnclosureWiseStat({
        enclosure_id: id
      }),
    enabled: !!id
  })

  const statsData = [
    {
      label: 'Species',
      value: data?.data?.total_species || 0,
      imagePath: '/images/housing/species.svg',
      onClick: () => console.log('Species')
    },
    {
      label: 'Animals',
      value: data?.data?.total_occupants || 0,
      imagePath: '/images/housing/animals.svg',
      onClick: () => console.log('Animals')
    }
  ]

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue)
  }

  const selected = tabConfig.find(tab => tab.value === selectedTab)
  const SelectedComponent = selected?.component || (() => <Box>No component found</Box>)

  return (
    <>
      <Box>
        <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
          <Typography color='inherit' sx={{ cursor: 'pointer' }}>
            Enclosures
          </Typography>
          <Typography color='text.primary'>Enclosure Details</Typography>
        </Breadcrumbs>
        <InsightsCard
          data={data?.data}
          loading={isLoading}
          statsData={statsData}
          error={error}
          zooName={data?.data?.user_enclosure_name}
          subtitle={data?.data?.enclosure_desc}
          userName={data?.data?.incharge_name}
          onCallClick={() => {
            const phoneNumber = data?.data?.incharge_phone_no || '' // Adjust path as needed
            if (phoneNumber) {
              // window.location.href = `tel:${phoneNumber}`
            } else {
              return
            }
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
            <SelectedComponent />
          </Box>
        </Card>
      </Box>
    </>
  )
}

export default EnclsouerDetails
