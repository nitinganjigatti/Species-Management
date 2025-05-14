import React, { useState, useMemo } from 'react'
import {
  Tabs,
  Tab,
  Box,
  Typography
} from '@mui/material'
import AlternativeMedicinesList from './AlternativeMedicinesList' // Assuming it's in the same folder

const AlternativeMedicinesTabs = ({ data, isLoading, onLoadMore, onEdit }) => {
  const [activeTab, setActiveTab] = useState('active')

  const handleTabChange = (_, newValue) => setActiveTab(newValue)

  const tabData = data[activeTab] || { list_items: [], hasMore: true }

  const handleLoadMore = () => {
    if (tabData.hasMore && !isLoading) {
      onLoadMore(activeTab)
    }
  }

  return (
    <Box>
      <Typography
        variant='h6'
        gutterBottom
        sx={{ color: 'customColors.customHeadingTextColor', fontSize: '16px', fontWeight: 500 }}
      >
        Alternative Medicines ({tabData?.total_count})
      </Typography>
      <Tabs value={activeTab} onChange={handleTabChange} indicatorColor='primary' textColor='primary' sx={{ mb: 2 }}>
        <Tab label='Active' value='active' />
        <Tab label='Inactive' value='inactive' />
      </Tabs>

      <AlternativeMedicinesList
        data={{ list_items: tabData.list_items }}
        isLoading={isLoading}
        onLoadMore={handleLoadMore}
        hasMore={tabData.hasMore}
        onEdit={onEdit}
      />
    </Box>
  )
}


export default React.memo(AlternativeMedicinesTabs)
