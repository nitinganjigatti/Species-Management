import { Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { TabContext, TabList, TabPanel } from '@mui/lab'
import { Tab } from '@mui/material'

const DepartmentDetailView = ({
  activeTab,
  onTabChange,
  overviewContent,
  usersContent,
  vendorsContent,
  requestsContent,
  showVendorsTab = true
}) => {
  const tabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'users', label: 'Users' },
    ...(showVendorsTab ? [{ value: 'vendors', label: 'Vendors' }] : []),
    { value: 'requests', label: 'Requests' }
  ]
  const theme = useTheme()

  return (
    <TabContext value={activeTab}>
      {/* Tab Header */}
      <Box
        sx={{
          backgroundColor: theme.palette.background.paper,
          borderRadius: '10px 10px 0 0',
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <TabList onChange={(_e, val) => onTabChange(val)} aria-label='department tabs'>
          {tabs.map(tab => (
            <Tab key={tab.value} label={tab.label} value={tab.value} />
          ))}
        </TabList>
      </Box>

      {/* Tab Content */}
      <Box
        sx={{
          backgroundColor: theme.palette.background.paper,
          borderRadius: '0 0 10px 10px',
          boxShadow: 1
        }}
      >
        <TabPanel value='overview' sx={{ p: 4 }}>
          {overviewContent}
        </TabPanel>

        <TabPanel value='users' sx={{ p: 4 }}>
          {usersContent}
        </TabPanel>

        {showVendorsTab && (
          <TabPanel value='vendors' sx={{ p: 4 }}>
            {vendorsContent}
          </TabPanel>
        )}

        <TabPanel value='requests' sx={{ p: 4 }}>
          {requestsContent}
        </TabPanel>
      </Box>
    </TabContext>
  )
}

export default DepartmentDetailView
