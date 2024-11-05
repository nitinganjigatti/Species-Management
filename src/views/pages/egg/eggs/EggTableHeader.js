import { IconButton, TextField, Typography } from '@mui/material'
import { Box } from '@mui/system'
import React, { useState } from 'react'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import EggFilterDrawer from './eggFilterDrawer'
import { useRouter } from 'next/router'
import ExcelExportButton from './exportEggListExcel'

const EggTableHeader = ({
  totalCount,
  setFilterList,
  handleSearch,
  filterList,
  setSelectedFiltersOptions,
  selectedFiltersOptions,
  searchQuery,
  setSearchQuery,
  selectedOptions,
  setSelectedOptions,
  data
}) => {
  const theme = useTheme()
  const router = useRouter()
  const { search_value, subTab_value, tab_Value } = router.query
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false)

  const [selectedDate, setSelectedDate] = useState(null)

  const handleRemoveFilter = item => {
    const updatedFilterList = filterList.filter(filter => filter.id !== item.id || filter.name !== item.name)
    setFilterList(updatedFilterList)

    const newSelectedFilters = { ...selectedFiltersOptions }

    // console.log('newSelectedFilters :>> ', newSelectedFilters)

    if (item?.id === 'collected_date') {
      newSelectedFilters.collected_date = null
      setSelectedDate(null)
    }

    // else if (item?.id === 'search') {
    //   setSearchQuery('')
    //   handleSearch('')
    //   router.push({ query: { ...router.query, search_value: '' } }, undefined, { shallow: true }) // Update the URL without a page refresh
    // }
    else {
      newSelectedFilters.status = null
    }

    for (const category in newSelectedFilters) {
      if (Array.isArray(newSelectedFilters[category])) {
        newSelectedFilters[category] = newSelectedFilters[category].filter(
          filter => filter.id !== item.id || filter.name !== item.name
        )
      }
    }

    // Update the state with the new selected filters
    setSelectedFiltersOptions(newSelectedFilters)
    setSelectedOptions(newSelectedFilters)

    // Optionally refetch the table data if needed
    // fetchTableData();
  }

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 4, py: 4 }}>
        <Box>
          <Typography sx={{ fontSize: '14px', fontWeight: 300 }}>
            {' '}
            {tab_Value === 'eggs_received'
              ? 'Total eggs in  received'
              : tab_Value === 'eggs_hatched'
              ? 'Total eggs in hatched'
              : tab_Value === 'eggs_incubation'
              ? 'Total eggs in incubation'
              : tab_Value === 'eggs_ready_to_be_discarded_at_nursery'
              ? 'Total eggs to be discarded'
              : tab_Value === 'eggs_discarded' && subTab_value === 'eggs_discarded'
              ? 'Total batch discarded'
              : tab_Value === 'eggs_discarded' && subTab_value === 'eggs_discarded_at_nursery'
              ? 'Total eggs discarded'
              : 'Total eggs'}{' '}
            : <span style={{ fontWeight: 500, color: '#000000' }}>{totalCount}</span>
          </Typography>
        </Box>
        <Box sx={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid #C3CEC7',
              borderRadius: '4px',
              padding: '0 8px',
              height: '40px'
            }}
          >
            <Icon icon='mi:search' fontSize={20} />
            <TextField
              variant='outlined'
              placeholder='Search'
              value={searchQuery}
              InputProps={{
                disableUnderline: true
              }}
              onChange={e => {
                setSearchQuery(e.target.value)
                handleSearch(e.target.value)

                router.push({ query: { ...router.query, search_value: e.target.value } }, undefined, { shallow: true })
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  border: 'none',
                  padding: '0',
                  '& fieldset': {
                    border: 'none'
                  }
                }
              }}
            />
          </Box>

          <ExcelExportButton tab_Value={tab_Value} subTab_value={subTab_value} data={data} />
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '4px',
              bgcolor: theme?.palette.customColors?.lightBg,
              alignItems: 'center',
              cursor: 'pointer'
            }}
            onClick={() => setOpenFilterDrawer(true)}
          >
            <Icon icon='mage:filter' fontSize={24} />
          </Box>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: '12px', px: 4, mb: 4, flexWrap: 'wrap' }}>
        {filterList?.length > 0 &&
          filterList?.map((item, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '6px',
                p: '8px',
                py: '2px',
                bgcolor: '#EFF5F2',
                borderRadius: '8px'
              }}
            >
              <Typography sx={{ fontSize: '14px', fontWeight: 'bold', color: '#000000', textTransform: 'capitalize' }}>
                {item?.name}
              </Typography>{' '}
              <IconButton onClick={() => handleRemoveFilter(item)}>
                <Icon icon='mdi:close' fontSize={18} color={'#1F515B'} />
              </IconButton>
            </Box>
          ))}
      </Box>
      {openFilterDrawer && (
        <EggFilterDrawer
          setOpenFilterDrawer={setOpenFilterDrawer}
          openFilterDrawer={openFilterDrawer}
          setFilterList={setFilterList}
          filterLi={filterList}
          setSelectedFiltersOptions={setSelectedFiltersOptions}
          selectedOptions={selectedOptions}
          setSelectedOptions={setSelectedOptions}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />
      )}
    </>
  )
}

export default EggTableHeader
