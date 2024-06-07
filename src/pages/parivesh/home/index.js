import React, { useState } from 'react'

// ** MUI Imports
import TabList from '@mui/lab/TabList'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import Overview from './overview'
import NewEntry from './new-entries'
import Batches from './batch-list'

const Home = () => {
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState('overview')

  const handleChange = (event, newValue) => {
    setTotal(0)
    setStatus(newValue)
  }

  const TabBadge = ({ label, totalCount }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between' }}>
      {label}
      {totalCount ? (
        <Chip sx={{ ml: '6px', fontSize: '12px' }} size='small' label={totalCount} color='secondary' />
      ) : null}
    </div>
  )

  return (
    <>
      <Grid>
        <TabContext value={status}>
          <TabList onChange={handleChange} aria-label='simple tabs example'>
            <Tab
              value='overview'
              label={<TabBadge label='overview' totalCount={status === 'overview' ? total : null} />}
            />

            <Tab
              value='new entries'
              label={<TabBadge label='new entries' totalCount={status === 'new entries' ? total : null} />}
            />
            <Tab
              value='batches'
              label={<TabBadge label='batches' totalCount={status === 'batches' ? total : null} />}
            />
          </TabList>

          <TabPanel value='overview'>
            <Overview />
          </TabPanel>
          <TabPanel value='new entries'>
            <NewEntry />
          </TabPanel>
          <TabPanel value='batches'>
            <Batches />
          </TabPanel>
        </TabContext>
      </Grid>
    </>
  )
}

export default Home
