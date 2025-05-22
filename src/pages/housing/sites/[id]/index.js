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

// Reset actions
import { clearSection as resetSectionState } from 'src/store/slices/housing/sectionSlice'
import { clearSection as resetNotesState } from 'src/store/slices/housing/notesSlice'

const tabConfig = [
  { label: 'Sections', value: 'sections', component: SectionListing, resetAction: resetSectionState },
  { label: 'Notes', value: 'notes', component: NotesListng, resetAction: resetNotesState }

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
      const params = {
        site_id: id
      }
      dispatch(fetchSite(params))
    }
  }, [dispatch])

  const handleTabChange = (event, newValue) => {
    // Find reset action for previous tab
    const prevTab = tabConfig.find(tab => tab.value === selectedTab)
    if (prevTab?.resetAction) {
      console.log('prevTab >>', prevTab)
      dispatch(prevTab.resetAction())
    }

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
        zooName={data?.site_name}
        subtitle={data?.site_description}
        description={data?.incharges[0]?.full_name}
        userName={data?.incharges[0]?.role_name}
        userImage={data?.incharges[0]?.user_profile_pic}

        // actions={{
        //   onEdit: () => console.log('Edit'),
        //   onDelete: () => console.log('Delete'),
        //   onAddNew: () => console.log('Add new'),
        //   onTimeClick: () => console.log('Time clicked')
        // }}
        onCallClick={() => {
          const phoneNumber = data?.incharges?.[0]?.user_mobile_number || '' // Adjust path as needed
          if (phoneNumber) {
            // window.location.href = `tel:${phoneNumber}`
          } else {
            return
          }
        }}

        // onMessageClick={() => console.log('Message clicked')}
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
