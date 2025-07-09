import React, { useState, useMemo } from 'react'
import {
  Typography,
  Grid,
  Box,
  Chip,
  TextField,
  InputAdornment,
  Paper,
  Avatar,
  Radio,
  Divider,
  Button
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import debounce from 'lodash/debounce'
import Search from 'src/views/utility/Search'
import AddAnimalCountDrawer from '../drawer/AddAnimalCountDrawer'

const speciesList = Array(8).fill({
  name: 'Rainbow Lorikeet',
  scientificName: 'Trichoglossus moluccanus',
  image: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Rainbow_Lorikeet.jpg'
})

const SelectSpeciesCard = ({}) => {
  const theme = useTheme()
  const [selectedSpeciesIndex, setSelectedSpeciesIndex] = useState(null)
  const [search, setSearch] = useState('')
  const [localSearch, setLocalSearch] = useState('')
  const [animalCountDrawerOpen, setanimalCountDrawerOpen] = useState(false)
  const debouncedSearch = useMemo(() => debounce(setSearch, 500), [])

  const handleSearchChange = e => {
    const value = e.target.value
    setLocalSearch(value)
    debouncedSearch(value)
  }

  const handleSearchClear = () => {
    setLocalSearch('')
    debouncedSearch('')
  }
  const handleDone = () => {
    setanimalCountDrawerOpen(true)
  }
  const handlechange = (val, i) => {
    console.log(i, 'val')
    setSelectedSpeciesIndex(i)
  }
  return (
    <>
      <Box sx={{ px: 4, height: '100vh' }}>
        {/* Search */}
        <Search
          sx={{ width: '100%', mt: 4 }}
          textFielsSX={{
            width: '100%',
            height: 52,
            borderRadius: '8px',
            backgroundColor: theme.palette.common.white
          }}
          placeholder='Search by common name or scientific name'
          value={localSearch}
          onChange={handleSearchChange}
          onClear={handleSearchClear}
          backgroundColor={theme.palette.common.white}
        />

        {/* Species Title */}
        <Typography sx={{ fontWeight: 500, color: '#44544A', mb: 3, mt: 4 }}>
          Species ({speciesList?.length})
        </Typography>

        {/* Species List */}
        {speciesList?.map((species, index) => (
          <Paper
            key={index}
            elevation={0}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',

              mb: 3,
              border: selectedSpeciesIndex === index ? '1px solid #37BD69' : '1px solid #fff',
              backgroundColor: selectedSpeciesIndex === index ? '#fff' : '#fff',
              borderRadius: '8px'
            }}
            onClick={() => handlechange(species, index)}
          >
            <Box display='flex' alignItems='center' gap={2} sx={{ p: 2 }}>
              <Avatar src={species.image} alt={species.name} />
              <Box>
                <Typography fontWeight={600} sx={{ color: '#44544A', fontSize: '16px' }}>
                  {species.name}
                </Typography>
                <Typography fontStyle='italic' color='#44544A' sx={{ fontWeight: 400, fontSize: '16px' }}>
                  {species.scientificName}
                </Typography>
              </Box>
            </Box>
            <Box
              sx={{
                height: '63px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderTopRightRadius: selectedSpeciesIndex === index ? '8px' : '0px',
                borderBottomRightRadius: selectedSpeciesIndex === index ? '8px' : '0px',
                background: '#F2FFF8'
              }}
            >
              {' '}
              <Radio checked={selectedSpeciesIndex === index} size='24px' />
            </Box>
          </Paper>
        ))}
      </Box>
      <Box
        sx={{
          position: 'sticky',
          bottom: 0,
          px: 5,
          py: 4,
          mt: 4,
          backgroundColor: theme.palette.common.white,
          boxShadow: `0px -4px 21px 0px ${
            theme.palette.mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.05)'
          }`,
          zIndex: 1
        }}
      >
        <Button
          fullWidth
          variant='contained'
          onClick={handleDone}
          //disabled={newlySelectedItems.length === 0}
        >
          Done
        </Button>
      </Box>
      {/* Sticky footer */}

      <AddAnimalCountDrawer
        open={animalCountDrawerOpen}
        onClose={() => setanimalCountDrawerOpen(false)}
        title='Add Animals'
      />
    </>
  )
}

export default SelectSpeciesCard
