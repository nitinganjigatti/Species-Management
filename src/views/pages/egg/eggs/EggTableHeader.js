import { IconButton, TextField, Typography } from '@mui/material'
import { Box } from '@mui/system'
import React, { useState } from 'react'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@mui/material/styles'
import EggFilterDrawer from './eggFilterDrawer'

const EggTableHeader = ({
  tabValue,
  totalCount,
  setFilterList,
  handleSearch,
  filterList,
  setSelectedFiltersOptions
}) => {
  const theme = useTheme()
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false)

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 4, py: 4 }}>
        <Box>
          <Typography sx={{ fontSize: '14px', fontWeight: 300 }}>
            Total Eggs{' '}
            {tabValue === 'eggs_received'
              ? 'in  Received'
              : tabValue === 'eggs_hatched'
              ? 'Hatched'
              : tabValue === 'eggs_incubation'
              ? 'in Incubation'
              : tabValue === 'eggs_ready_to_be_discarded_at_nursery'
              ? 'in Discard'
              : null}{' '}
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
              InputProps={{
                disableUnderline: true
              }}
              onChange={e => handleSearch(e.target.value)}
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
          >
            <Icon icon='uil:calender' fontSize={24} />
          </Box>
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
              {/* <IconButton>
                <Icon icon='mdi:close' fontSize={18} color={'#1F515B'} />
              </IconButton> */}
            </Box>
          ))}
      </Box>
      <EggFilterDrawer
        setOpenFilterDrawer={setOpenFilterDrawer}
        openFilterDrawer={openFilterDrawer}
        setFilterList={setFilterList}
        setSelectedFiltersOptions={setSelectedFiltersOptions}
      />
    </>
  )
}

export default EggTableHeader
