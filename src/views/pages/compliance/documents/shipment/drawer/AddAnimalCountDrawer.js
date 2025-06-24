import React, { useState } from 'react'
import {
  Box,
  Typography,
  Grid,
  TextField,
  Select,
  MenuItem,
  IconButton,
  Button,
  Paper,
  Drawer,
  Avatar
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import debounce from 'lodash/debounce'
import Search from 'src/views/utility/Search'
import { getAllSpeciesList } from 'src/lib/api/housing'
import CloseIcon from '@mui/icons-material/Close'
import AddIcon from '@mui/icons-material/Add'
import { CellInfo } from 'src/utility/render'
import ExportCard from '../view-component/AddExportPermitCard'
import AnimalCardLayout from '../view-component/AddAnimalCard'

const AnimalForm = ({ index, data, onChange, onRemove }) => (
  <Paper elevation={1} sx={{ p: 3, mb: 4, position: 'relative' }}>
    <Typography fontWeight={500} mb={5}>
      Animal Details
    </Typography>
    <IconButton onClick={() => onRemove(index)} sx={{ position: 'absolute', top: 10, right: 10 }}>
      <CloseIcon />
    </IconButton>
    <Grid container spacing={2} sx={{ mb: 2 }}>
      <Grid item xs={12} sx={{ mb: 1 }}>
        <Select fullWidth value={data.gender} onChange={e => onChange(index, 'gender', e.target.value)} displayEmpty>
          <MenuItem value='' disabled>
            Gender
          </MenuItem>
          <MenuItem value='Male'>Male</MenuItem>
          <MenuItem value='Female'>Female</MenuItem>
          <MenuItem value='Unknown'>Unknown</MenuItem>
        </Select>
      </Grid>
      <Grid item xs={12} sx={{ mb: 1 }}>
        <Select
          fullWidth
          value={data.identifierType}
          onChange={e => onChange(index, 'identifierType', e.target.value)}
          displayEmpty
        >
          <MenuItem value='' disabled>
            Select Identifier Type*
          </MenuItem>
          <MenuItem value='Microchip'>Microchip</MenuItem>
          <MenuItem value='Ring'>Ring</MenuItem>
        </Select>
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label='Identifier Details'
          value={data.identifier}
          onChange={e => onChange(index, 'identifier', e.target.value)}
        />
      </Grid>
    </Grid>
  </Paper>
)

const AddanimalCountDrawer = ({ open, onClose, title }) => {
  const theme = useTheme()
  const [maleCount, setMaleCount] = useState('')
  const [femaleCount, setFemaleCount] = useState('')
  const [unknownCount, setUnknownCount] = useState('')
  const [animals, setAnimals] = useState([])

  const handleAddAnimal = () => {
    setAnimals(prev => [...prev, { gender: '', identifierType: '', identifier: '' }])
  }

  const handleChange = (index, field, value) => {
    const updated = [...animals]
    updated[index][field] = value
    setAnimals(updated)
  }

  const handleRemove = index => {
    setAnimals(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <Drawer open={open} onClose={onClose} anchor='right'>
      <Box
        sx={{
          width: 570,
          maxWidth: '100vw',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: theme.palette.customColors.Background
        }}
      >
        {/* Header */}
        <Box sx={{ px: 5, pt: 4, pb: 2, background: '#fff' }}>
          <Box display='flex' justifyContent='space-between' alignItems='center'>
            <Box display='flex' alignItems='center' gap={3}>
              {/* <Box component='img' src='/images/housing/Enclosure icon.png' alt='icon' sx={{ width: 32, height: 32 }} /> */}
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 500 }}>{title}</Typography>
            </Box>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <Box
          display='flex'
          alignItems='center'
          gap={2}
          sx={{ background: '#fff', mt: 3, mx: 5, p: 5, border: '1px solid #C3CEC7', borderRadius: '8px' }}
        >
          <Avatar src='images/housing/Enclosure icon.png' sx={{ width: 40, height: 40 }} />
          <Box sx={{ ml: 2 }}>
            <Typography fontWeight={600} color='#44544A'>
              Rainbow Lorikeet
            </Typography>
            <Typography fontStyle='italic' color='#44544A' fontWeight={400}>
              Trichoglossus moluccanus
            </Typography>
          </Box>
        </Box>

        <Box sx={{ px: 5, overflowY: 'auto', flexGrow: 1, height: '100vh' }}>
          {/* Total Animal Count */}
          <Typography fontWeight={600} color='#44544A' sx={{ mb: 2, mt: 4 }}>
            Total Animal Count
          </Typography>
          <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
            <Typography fontWeight={500} mb={2}>
              Gender Wise Count
            </Typography>
            <Grid container spacing={2} sx={{ mt: 2, mb: 2 }}>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  type='number'
                  label='# Male'
                  value={maleCount}
                  onChange={e => setMaleCount(e.target.value)}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  type='number'
                  label='# Female'
                  value={femaleCount}
                  onChange={e => setFemaleCount(e.target.value)}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  type='number'
                  label='# Unknown'
                  value={unknownCount}
                  onChange={e => setUnknownCount(e.target.value)}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Animals with Identifier */}
          <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
            <Typography fontWeight={600} color='#44544A'>
              Animals with identifier
            </Typography>
            <Button
              variant='text'
              startIcon={<AddIcon />}
              sx={{ color: '#19966E', fontWeight: 600 }}
              onClick={handleAddAnimal}
            >
              Add Animal
            </Button>
          </Box>

          {animals?.length > 0 ? (
            animals.map((animal, index) => (
              <AnimalForm key={index} index={index} data={animal} onChange={handleChange} onRemove={handleRemove} />
            ))
          ) : (
            <Typography sx={{ background: '#0000000D', p: 12, textAlign: 'center' }}>No Data Available</Typography>
          )}
        </Box>
        {/* Sticky footer */}
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
            //onClick={handleDone}
            //disabled={newlySelectedItems.length === 0}
          >
            Select Animals
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

export default React.memo(AddanimalCountDrawer)
