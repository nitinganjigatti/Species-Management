import { Box, Breadcrumbs, Typography, Tabs, Tab, Card } from '@mui/material'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchInsights } from 'src/store/slices/housing/insightsSlice'
import InsightsCard from 'src/views/utility/insights/InsightsCard'
import Listing from 'src/views/pages/housing/sites/listing'
import { fetchSite } from 'src/store/slices/housing/sitesAnalyticsSlice'
import SectionListing from 'src/views/pages/housing/sections/sectionListing'
import NotesListng from 'src/views/pages/housing/notes/notesListng'
import SpeciesListing from 'src/views/pages/housing/species/speciesListing'


const tabConfig = [
  { label: 'Sections', value: 'sections', component: SectionListing },
  { label: 'Notes', value: 'notes', component: NotesListng },
  {label: 'Species' , value: 'species' , component: SpeciesListing }

  // { label: 'Species', value: 'species', component: Listing },
  // { label: 'Notes', value: 'notes', component: Listing },
]

const SiteDetails = () => {
  const router = useRouter()
  const dispatch = useDispatch()
  const { id } = router.query
  const { data, loading, error } = useSelector(state => state.siteAnalytics)

  console.log('Data >>', data)

  const [selectedTab, setSelectedTab] = useState(tabConfig[0].value)

  useEffect(() => {
    if (id) {
      debugger
      const params = {
        site_id: id
      }
      dispatch(fetchSite(params))
    }
  }, [dispatch])

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue)
  }

  const handleHousingClick = () => {
    router.push('/housing/sites')
  }

  const selected = tabConfig.find(tab => tab.value === selectedTab)
  const SelectedComponent = selected?.component || (() => <Box>No component found</Box>)

  return (
    <Box>
      {/* Breadcrumb */}
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
        <Typography color='inherit' sx={{ cursor: 'pointer' }} onClick={handleHousingClick}>
          Site
        </Typography>
        <Typography color='text.primary'>Site Details</Typography>
      </Breadcrumbs>

      {/* Insights */}
      <InsightsCard
        data={data}
        loading={loading}
        zooName={'Northern Highland Zoological Sanctuary'}
        subtitle={'Bannerghatta North'}
        userName={'Jordan Stevenson'}
        description={'Super Admin'}
        actions={{
          onEdit: () => console.log('Edit'),
          onDelete: () => console.log('Delete'),
          onAddNew: () => console.log('Add new'),
          onTimeClick: () => console.log('Time clicked')
        }}
        onCallClick={() => console.log('Call clicked')}
        onMessageClick={() => console.log('Message clicked')}
        error={error}
        speciesCount={data?.species_count}
        animalCount={data?.animal_count}
        enclosuresCount={data?.enclosure_count}
        sectionsCount={data?.section_count}
      />

      {/* Tabs */}
      <Card sx={{ borderBottom: 1, borderColor: 'divider', mt: 6, p: { xs: 3, md: 5 } }}>
        <Tabs value={selectedTab} onChange={handleTabChange} variant='scrollable' scrollButtons='auto'>
          {tabConfig.map(tab => (
            <Tab key={tab.value} label={tab.label} value={tab.value} />
          ))}
        </Tabs>

        {/* Selected Tab Content */}
        <Box>
          <SelectedComponent />
        </Box>
      </Card>
    </Box>
  )
}

export default SiteDetails
