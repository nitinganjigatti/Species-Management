import React, { useEffect, useState } from 'react'
import { Typography, Box, Drawer, IconButton, Avatar, Checkbox, Button } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'
import Toaster from 'src/components/Toaster'

const SelectAnimalsDrawer = ({
  open,
  onClose,
  title,
  animalLists,
  exportNumber,
  onSelectAnimals,
  speciesId,
  speciesData,
  exportID,
  selectedExportData,
  draftData,
  commonNameValue,
  initialSelectedAnimals = []
}) => {
  const theme = useTheme()
  const [selectedAnimals, setSelectedAnimals] = useState(initialSelectedAnimals)

  // Update local state when initialSelectedAnimals changes
  useEffect(() => {
    setSelectedAnimals(initialSelectedAnimals)
  }, [initialSelectedAnimals, open])

  const handleCheckboxChange = animal => {
    setSelectedAnimals(prev => {
      const isSelected = prev.some(a => a.id === animal.id)
      if (isSelected) {
        return prev.filter(a => a.id !== animal.id)
      } else {
        return [...prev, animal]
      }
    })
  }

  const validateSelection = () => {
    // Find the species in selectedExportData
    const exportItem = draftData.export.find(e => e.export_id === exportID)
    const speciesData = exportItem?.species?.find(s => s.species_id === speciesId)

    const counts = {
      male: 0,
      female: 0,
      undeterminate: 0
    }

    selectedAnimals.forEach(animal => {
      if (animal.gender === 'male') counts.male++
      else if (animal.gender === 'female') counts.female++
      else counts.undeterminate++
    })

    // Check against allowed counts from selectedExportData
    if (speciesData) {
      // Check for zero counts first
      if (counts.male > 0 && Number(speciesData.male_count || 0) === 0) {
        Toaster({
          type: 'error',
          message: 'Cannot select male animals (count is 0)'
        })
        return false
      }
      if (counts.female > 0 && Number(speciesData.female_count || 0) === 0) {
        Toaster({
          type: 'error',
          message: 'Cannot select female animals (count is 0)'
        })
        return false
      }
      if (counts.undeterminate > 0 && Number(speciesData.undeterminate_count || 0) === 0) {
        Toaster({
          type: 'error',
          message: 'Cannot select unknown animals (count is 0)'
        })
        return false
      }

      // Then check for exceeding counts
      if (counts.male > Number(speciesData.male_count || 0)) {
        Toaster({
          type: 'error',
          message: `Cannot select more than ${speciesData.male_count} male animals`
        })
        return false
      }
      if (counts.female > Number(speciesData.female_count || 0)) {
        Toaster({
          type: 'error',
          message: `Cannot select more than ${speciesData.female_count} female animals`
        })
        return false
      }
      if (counts.undeterminate > Number(speciesData.undeterminate_count || 0)) {
        Toaster({
          type: 'error',
          message: `Cannot select more than ${speciesData.undeterminate_count} unknown animals`
        })
        return false
      }
    }

    return true
  }

  const handleSelect = () => {
    // if (selectedAnimals.length === 0) {
    //   Toaster({
    //     type: 'error',
    //     message: 'Please select at least one animal'
    //   })
    //   return
    // }

    // Validate gender counts
    if (!validateSelection()) {
      return
    }

    // If validation passes, proceed with selection
    onSelectAnimals(selectedAnimals)
    onClose()
  }

  return (
    <Drawer
      open={open}
      //onClose={onClose}
      anchor='right'
    >
      <Box
        sx={{
          width: 570,
          maxWidth: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: theme.palette.customColors.Background
        }}
      >
        {/* Header */}
        <Box sx={{ px: 5, pt: 4, pb: 2, background: '#fff' }}>
          <Box display='flex' justifyContent='space-between' alignItems='center'>
            <Box display='flex' alignItems='center' gap={3}>
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 500 }}>{title}</Typography>
            </Box>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
        {console.log(selectedExportData, 'selectedExportData')}
        <Box sx={{ backgroundColor: '#fff', px: 5, pb: 6, pt: 2 }}>
          <Box
            sx={{
              backgroundColor: '#1F515B0D',
              color: '#FFFFFF',
              borderRadius: '8px',
              padding: '16px',
              width: '100%'
            }}
          >
            <Typography
              sx={{
                fontWeight: '500',
                color: '#1F415B',
                marginBottom: '3px',
                fontSize: '16px'
              }}
            >
              Export ID : {exportNumber}
              {/* {data.exportId} */}
            </Typography>

            <Typography
              sx={{
                color: '#44544A',
                fontWeight: '500',
                fontSize: '16px'
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: 400 }}>Species : </span>
              {commonNameValue}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ px: 0, flex: 1, overflowY: 'auto' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5,
              maxWidth: '600px', // Adjust based on your layout
              margin: 'auto',
              px: 6,
              borderRadius: '8px'
            }}
          >
            <Typography sx={{ pt: 3, fontWeight: 500, fontSize: '18px', color: '#44544A' }}>
              Animals ({animalLists.length})
            </Typography>
            {animalLists.map(animal => (
              <Box
                key={animal.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  // padding: '12px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E5E5',
                  borderRadius: '8px'
                }}
              >
                {/* Gender Avatar */}
                <Avatar
                  sx={{
                    backgroundColor: animal.gender === 'male' ? '#AFEFEB80' : '#FA614026',
                    color: animal.gender === 'male' ? '#00AFD6' : '#FA6140',
                    fontWeight: '500',
                    marginRight: '16px',
                    fontSize: '14px',
                    width: 40,
                    height: 40,
                    borderRadius: '4px',
                    ml: 4
                  }}
                >
                  {animal.gender === 'male' ? 'M' : animal.gender === 'female' ? 'F' : 'U'}
                </Avatar>

                {/* Animal Info */}
                <Box sx={{ flexGrow: 1 }}>
                  <Typography sx={{ fontWeight: '400', color: '#7A8684', fontSize: '14px' }}>
                    Species :{' '}
                    <span style={{ color: '#44544A', fontSize: '14px', fontWeight: 500 }}>
                      {commonNameValue + ' ' + animal.id}
                    </span>
                  </Typography>

                  <Typography sx={{ fontWeight: '400', color: '#7A8684', fontSize: '14px' }}>
                    {animal.identifier_type} :{' '}
                    <span style={{ color: '#44544A', fontSize: '14px', fontWeight: 500 }}>
                      {animal.identifier_value}
                    </span>
                  </Typography>
                </Box>

                {/* Checkbox */}
                <Box
                  sx={{
                    background: '#F2FFF8',
                    borderLeft: '1px solid #C3CEC7',
                    height: '68px',
                    width: '45px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderTopRightRadius: '8px',
                    borderBottomRightRadius: '8px'
                  }}
                >
                  <Checkbox
                    checked={selectedAnimals.some(a => a.id === animal.id)}
                    onChange={() => handleCheckboxChange(animal)}
                  />
                </Box>
              </Box>
            ))}
          </Box>
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
            onClick={handleSelect}
            disabled={initialSelectedAnimals.length === 0 && selectedAnimals.length === 0}
          >
            Select Animals
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

export default React.memo(SelectAnimalsDrawer)
