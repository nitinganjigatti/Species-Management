import { useState, useEffect, useCallback } from 'react'
import { Box, Card, CardContent, CardHeader, Typography, Chip, Grid } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import UserWiseList from 'src/views/pages/report/caretaker-report/UserWiseList'
import AnimalWiseList from 'src/views/pages/report/caretaker-report/AnimalWiseList'
import { getKeepersWithAnimals, getAnimalsWithKeepers } from 'src/lib/api/caretaker'
import RenderUtility from 'src/utility/render'

const PAGE_SIZE = 20

const CaretakerReport = () => {
  const theme = useTheme()
  const [viewType, setViewType] = useState('user')
  const [loading, setLoading] = useState(false)

  // User wise state
  const [keepers, setKeepers] = useState([])
  const [keepersPagination, setKeepersPagination] = useState({ total: 0, page: 0, pageSize: PAGE_SIZE })

  // Animal wise state
  const [animals, setAnimals] = useState([])
  const [animalsPagination, setAnimalsPagination] = useState({ total: 0, page: 0, pageSize: PAGE_SIZE })

  const fetchKeepers = useCallback(async (page = 0, pageSize = PAGE_SIZE) => {
    setLoading(true)
    try {
      const response = await getKeepersWithAnimals({ page: page + 1, per_page: pageSize })
      if (response?.success) {
        setKeepers(response.data || [])
        setKeepersPagination({
          total: response.pagination?.total || response.data?.length || 0,
          page,
          pageSize
        })
      }
    } catch (error) {
      console.error('Error fetching keepers:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAnimals = useCallback(async (page = 0, pageSize = PAGE_SIZE) => {
    setLoading(true)
    try {
      const response = await getAnimalsWithKeepers({ page: page + 1, per_page: pageSize })
      if (response?.success) {
        setAnimals(response.data || [])
        setAnimalsPagination({
          total: response.pagination?.total || response.data?.length || 0,
          page,
          pageSize
        })
      }
    } catch (error) {
      console.error('Error fetching animals:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (viewType === 'user') {
      fetchKeepers(0, PAGE_SIZE)
    } else {
      fetchAnimals(0, PAGE_SIZE)
    }
  }, [viewType, fetchKeepers, fetchAnimals])

  const handleViewChange = (event, newValue) => {
    if (newValue !== null) {
      setViewType(newValue)
    }
  }

  const handleKeepersPaginationChange = model => {
    fetchKeepers(model.page, model.pageSize)
  }

  const handleAnimalsPaginationChange = model => {
    fetchAnimals(model.page, model.pageSize)
  }

  const TabBadge = ({ label, totalCount }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      {label}
      {totalCount ? (
        <Chip sx={{ ml: '6px', fontSize: '12px' }} size='small' label={totalCount} color='secondary' />
      ) : null}
    </Box>
  )

  const tableContent = () => (
    <Card>
      <CardHeader
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'start', sm: 'center', md: 'center' },
          flexDirection: { xs: 'column', sm: 'row', md: 'row' },
          mx: { xs: 2, sm: 0, md: 0 },
          gap: { xs: 2, sm: 0, md: 0 }
        }}
        title={RenderUtility.pageTitle('Caretaker Report')}
      />
      <Grid sx={{ margin: '0px 1.375rem 1.375rem 1.375rem' }}>
        {viewType === 'user' ? (
          <UserWiseList
            data={keepers}
            pagination={keepersPagination}
            loading={loading}
            onPaginationChange={handleKeepersPaginationChange}
          />
        ) : (
          <AnimalWiseList
            data={animals}
            pagination={animalsPagination}
            loading={loading}
            onPaginationChange={handleAnimalsPaginationChange}
          />
        )}
      </Grid>
    </Card>
  )

  return (
    <Grid>
      <TabContext value={viewType}>
        <TabList variant='scrollable' allowScrollButtonsMobile onChange={handleViewChange}>
          <Tab
            value='user'
            label={<TabBadge label='User wise' totalCount={viewType === 'user' ? keepersPagination.total : null} />}
          />
          <Tab
            value='animal'
            label={<TabBadge label='Animal wise' totalCount={viewType === 'animal' ? animalsPagination.total : null} />}
          />
        </TabList>
        <TabPanel value='user'>{tableContent()}</TabPanel>
        <TabPanel value='animal'>{tableContent()}</TabPanel>
      </TabContext>
    </Grid>
  )
}

export default CaretakerReport
