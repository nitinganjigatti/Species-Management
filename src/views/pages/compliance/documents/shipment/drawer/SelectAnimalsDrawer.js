import React, { useEffect, useState } from 'react'
import { Typography, Box, Drawer, IconButton, Avatar, Checkbox, Button, alpha } from '@mui/material'
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
    const exportItem = draftData.export.find(e => e.export_id === exportID)
    const speciesData = exportItem?.species?.find(s => s.master_species_id === speciesId)

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

    if (speciesData) {
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
    if (!validateSelection()) {
      return
    }

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
        <Box sx={{ px: 5, pt: 4, pb: 2, background: theme.palette.common.white }}>
          <Box display='flex' justifyContent='space-between' alignItems='center'>
            <Box display='flex' alignItems='center' gap={3}>
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 500 }}>{title}</Typography>
            </Box>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ backgroundColor: theme.palette.common.white, px: 5, pb: 6, pt: 2 }}>
          <Box
            sx={{
              backgroundColor: theme.palette.customColors.OnPrimarycontainer10,
              color: theme.palette.customColors.OnPrimary,
              borderRadius: '8px',
              padding: '16px',
              width: '100%'
            }}
          >
            <Typography
              sx={{
                fontWeight: '500',
                color: theme.palette.customColors.OnSecondaryContainer,
                marginBottom: '3px',
                fontSize: '16px'
              }}
            >
              Export ID : {exportNumber}
              {/* {data.exportId} */}
            </Typography>

            <Typography
              sx={{
                color: theme.palette.customColors.OnSurfaceVariant,
                fontWeight: '500',
                fontSize: '16px'
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: 400 }}>Species : </span>
              {commonNameValue ? commonNameValue : 'N/A'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ px: 0, flex: 1, overflowY: 'auto' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5,
              maxWidth: '600px',
              margin: 'auto',
              px: 6,
              borderRadius: '8px'
            }}
          >
            <Typography
              sx={{ pt: 3, fontWeight: 500, fontSize: '18px', color: theme.palette.customColors.OnSurfaceVariant }}
            >
              Animals with identifier ({animalLists.length})
            </Typography>
            {animalLists?.length > 0 ? (
              animalLists.map(animal => {
                const isSelected = selectedAnimals.some(a => a.id === animal.id)
                const handleToggle = () => handleCheckboxChange(animal)

                return (
                  <Box
                    key={animal.id}
                    onClick={handleToggle}
                    onKeyDown={event => {
                      if (event.target !== event.currentTarget) return
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        handleToggle()
                      }
                    }}
                    tabIndex={0}
                    role='button'
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      // padding: '12px',
                      backgroundColor: theme.palette.customColors.OnPrimary,
                      border: '1px solid #E5E5E5',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <Avatar
                      sx={{
                        backgroundColor:
                          animal.gender === 'male'
                            ? alpha(theme.palette.customColors.SecondaryContainer, 0.5)
                            : animal.gender === 'female'
                            ? alpha(theme.palette.customColors.customDropdownColor, 0.15)
                            : animal.gender === 'unknown'
                            ? theme.palette.customColors.displaybgSecondary
                            : '',
                        color:
                          animal.gender === 'male'
                            ? theme.palette.customColors.addPrimary
                            : animal.gender === 'female'
                            ? theme.palette.customColors.customDropdownColor
                            : animal.gender === 'unknown'
                            ? theme.palette.customColors.OnPrimaryContainer
                            : '',
                        fontWeight: '500',
                        marginRight: '16px',
                        fontSize: '14px',
                        width: 40,
                        height: 40,
                        borderRadius: '4px',
                        ml: 4
                      }}
                    >
                      {animal.gender === 'male'
                        ? 'M'
                        : animal.gender === 'female'
                        ? 'F'
                        : animal.gender === 'unknown'
                        ? 'U'
                        : ''}
                    </Avatar>

                    <Box sx={{ flexGrow: 1 }}>
                      <Typography
                        sx={{ fontWeight: '400', color: theme.palette.customColors.secondaryBg, fontSize: '14px' }}
                      >
                        Species :{' '}
                        <span
                          style={{
                            color: theme.palette.customColors.OnSurfaceVariant,
                            fontSize: '14px',
                            fontWeight: 500
                          }}
                        >
                          {commonNameValue ? commonNameValue : 'N/A'}
                        </span>
                      </Typography>

                      <Typography
                        sx={{ fontWeight: '400', color: theme.palette.customColors.secondaryBg, fontSize: '14px' }}
                      >
                        {animal.identifier_type} :{' '}
                        <span
                          style={{
                            color: theme.palette.customColors.OnSurfaceVariant,
                            fontSize: '14px',
                            fontWeight: 500
                          }}
                        >
                          {animal.identifier_value}
                        </span>
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        background: theme.palette.customColors.Surface,
                        borderLeft: `1px solid ${theme.palette.customColors.OutlineVariant}`,
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
                        checked={isSelected}
                        onClick={event => {
                          event.stopPropagation()
                        }}
                        onChange={event => {
                          event.stopPropagation()
                          handleToggle()
                        }}
                      />
                    </Box>
                  </Box>
                )
              })
            ) : (
              <Typography
                sx={{
                  background: theme.palette.customColors.mdAntzNeutral,
                  p: 12,
                  textAlign: 'center',
                  borderRadius: '8px',
                  fontWeight: '500'
                }}
              >
                No Animals to show
              </Typography>
            )}
          </Box>
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
