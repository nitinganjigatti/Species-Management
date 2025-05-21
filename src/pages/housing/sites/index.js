import { Box, Breadcrumbs, Card, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useAuth } from 'src/hooks/useAuth'
import { fetchInsights } from 'src/store/slices/housing/insightsSlice'
import Listing from 'src/views/pages/housing/sites/listing'
import InsightsCard from 'src/views/utility/insights/InsightsCard'

const Sites = () => {
  const router = useRouter()

  const dispatch = useDispatch()
  const { data, loading, error } = useSelector(state => state.insights)
  const auth = useAuth()
  const zooId = auth?.userData?.user?.zoos[0]?.zoo_id

  useEffect(() => {
    dispatch(fetchInsights(zooId))
  }, [dispatch, zooId])

  const handleHousingClick = () => {
    // router.push('/housing')
  }

  return (
    <Box>
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
        <Typography color='inherit' sx={{ cursor: 'pointer' }} onClick={handleHousingClick}>
          Housing
        </Typography>

        <Typography sx={{ cursor: 'pointer' }} color='text.primary'>
          Site List
        </Typography>
      </Breadcrumbs>
      <Box>
        {/* For testing with all the data */}

        {/* <InsightsCard
          data={data}
          loading={loading}
          error={error}
          zooName='Bannerghatta Zoo'
          subtitle='Bannerghatta Zoo'
          userName='Jordan Stevenson'
          actions={{
            onEdit: () => console.log('Edit'),
            onDelete: () => console.log('Delete'),
            onAddNew: () => console.log('Add new'),
            onTimeClick: () => console.log('Time clicked')
          }}
          onCallClick={() => console.log('Call clicked')}
          onMessageClick={() => console.log('Message clicked')}
          onInfoClick={{
            species: () => console.log('Species clicked'),
            animals: () => console.log('Animals clicked'),
            sections: () => console.log('Sections clicked'),
            enclosures: () => console.log('Enclosures clicked')
          }}
        /> */}
        <InsightsCard data={data} loading={loading} error={error} isAllSites />
        <Box sx={{ mt: 6 }}>
          <Card sx={{ p: { xs: 3, md: 5 } }}>
            <Listing />
          </Card>
        </Box>
      </Box>
    </Box>
  )
}

export default Sites
