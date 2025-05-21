import { Box, Breadcrumbs, Typography, Tabs, Tab, Card } from '@mui/material'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchInsights } from 'src/store/slices/housing/insightsSlice'
import InsightsCard from 'src/views/utility/insights/InsightsCard'
import Listing from 'src/views/pages/housing/sites/listing'

const tabConfig = [
    { label: 'Sections', value: 'sections', component: Listing },
    { label: 'Enclosures', value: 'enclosures', component: Listing },

    // { label: 'Species', value: 'species', component: Listing },
    // { label: 'Notes', value: 'notes', component: Listing },
  ]

const SiteDetails = () => {
    const router = useRouter()
    const dispatch = useDispatch()
    const { data, loading, error } = useSelector(state => state.insights)
  
    const [selectedTab, setSelectedTab] = useState(tabConfig[0].value)
  
    useEffect(() => {
      dispatch(fetchInsights(11))
    }, [dispatch])
  
    const handleTabChange = (event, newValue) => {
      setSelectedTab(newValue)
    }
  
    const handleHousingClick = () => {
      router.push('/housing')
    }
  
    const selected = tabConfig.find(tab => tab.value === selectedTab)
    const SelectedComponent = selected?.component || (() => <Box>No component found</Box>)
  
    return (
      <Box>
        {/* Breadcrumb */}
        <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
          <Typography color='inherit' sx={{ cursor: 'pointer' }} onClick={handleHousingClick}>
            Housing
          </Typography>
          <Typography color='text.primary'>Site Details</Typography>
        </Breadcrumbs>
  
        {/* Insights */}
        <InsightsCard data={data} loading={loading} error={error} />
  
        {/* Tabs */}
        <Card sx={{ borderBottom: 1, borderColor: 'divider', mt: 6, p: { xs: 3, md: 5 } }}>
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            variant='scrollable'
            scrollButtons='auto'
          >
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
