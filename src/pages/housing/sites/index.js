import { Box, Breadcrumbs, Card, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchInsights } from 'src/store/slices/housing/insightsSlice'
import InsightsCard from 'src/views/utility/insights/InsightsCard'

const Sites = () => {
  const router = useRouter()

  const dispatch = useDispatch()
  const { data, loading, error } = useSelector(state => state.insights)

  useEffect(() => {
    dispatch(fetchInsights(11))
  }, [dispatch])

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
        <InsightsCard data={data} loading={loading} error={error} />
      </Box>
      <Card>
        <Box>Content</Box>
      </Card>
    </Box>
  )
}

export default Sites
