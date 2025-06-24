import React, { useState } from 'react'
import { Box, Button, TextField, Typography, Paper } from '@mui/material'
import SelectSpeciesCard from './SelectSpeciesCard'

const AddNewSpeciesCard = () => {
  const [isAdding, setIsAdding] = useState(false)
  const [commonName, setCommonName] = useState('')
  const [scientificName, setScientificName] = useState('')

  const handleSave = () => {
    console.log('Saved species:', { commonName, scientificName })
    setCommonName('')
    setScientificName('')
    setIsAdding(false)
  }

  return (
    <Box sx={{ px: 2 }}>
      <Box width='100%' display='flex' justifyContent='center' alignItems='center' flexDirection='column' mt={4}>
        {!isAdding ? (
          <Button
            variant='contained'
            sx={{ background: '#1F515B', width: '70%', borderRadius: '8px', mx: 4, mb: 5, height: '50px' }}
            onClick={() => setIsAdding(true)}
          >
            Add New Species
          </Button>
        ) : (
          <Paper
            elevation={2}
            sx={{ p: 4, borderRadius: '8px', border: '1px solid #C3CEC7', boxShadow: 'none', mx: 4 }}
          >
            <Typography fontWeight={500} mb={3}>
              Add New Species
            </Typography>

            <TextField
              fullWidth
              label='Common Name'
              value={commonName}
              onChange={e => setCommonName(e.target.value)}
              sx={{ mb: 3 }}
            />

            <TextField
              fullWidth
              label='Scientific Name'
              value={scientificName}
              onChange={e => setScientificName(e.target.value)}
              sx={{ mb: 4 }}
            />

            <Button
              fullWidth
              variant='contained'
              sx={{
                backgroundColor: '#225B5B',
                height: '50px',
                '&:hover': { backgroundColor: '#1b4b4b' }
              }}
              onClick={handleSave}
            >
              SAVE & SELECT
            </Button>
          </Paper>
        )}
      </Box>
      <SelectSpeciesCard />
    </Box>
  )
}

export default AddNewSpeciesCard
