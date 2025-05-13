import React, { useState, useMemo } from 'react'
import {
  Tabs,
  Tab,
  Box,
  Typography
} from '@mui/material'
import AlternativeMedicinesList from './AlternativeMedicinesList' // Assuming it's in the same folder

const AlternativeMedicinesTabs = ({ data, isLoading, onLoadMore, hasMore, onEdit }) => {
  const [activeTab, setActiveTab] = useState('active')

  const handleTabChange = (_, newValue) => setActiveTab(newValue)

  // Filter data into active and inactive
  const filteredData = useMemo(() => {
    const filteredItems = data?.list_items?.filter(item =>
      activeTab === 'active' ? item.status == 1 : Number(item.status) == 0
    ) || []

    return {
      ...data,
      list_items: filteredItems,
      total_count: data?.total_count,
    }
  }, [data, activeTab])

  return (
    <Box>
        <Typography
        variant='h6'
        gutterBottom
        sx={{ color: 'customColors.customHeadingTextColor', fontSize: '16px', fontWeight: 500 }}
      >
        Alternative Medicines {data?.total_count && `(${data?.total_count})`}
      </Typography>
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        indicatorColor='primary'
        textColor='primary'
        sx={{ mb: 2 }}
      >
        <Tab label='Active' value='active' />
        <Tab label='Inactive' value='inactive' />
      </Tabs>

      <AlternativeMedicinesList
        data={filteredData}
        isLoading={isLoading}
        onLoadMore={onLoadMore}
        hasMore={hasMore}
        onEdit={onEdit}
      />
    </Box>
  )
}

export default React.memo(AlternativeMedicinesTabs)
