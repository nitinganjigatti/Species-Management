import { Box, Breadcrumbs, Card, CardHeader, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import InsightsCard from 'src/views/utility/insights/InsightsCard'

const Sites = () => {
  const router = useRouter()

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
        <InsightsCard />
      </Box>
      <Card>
        <Box>Content</Box>
      </Card>
    </Box>
  )
}

export default Sites
