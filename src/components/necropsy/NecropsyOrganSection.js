import React, { useState } from 'react'
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  alpha,
  InputAdornment
} from '@mui/material'
import { ExpandMore as ExpandMoreIcon, Delete as DeleteIcon } from '@mui/icons-material'
import Icon from 'src/@core/components/icon'
import AddOrganDrawer from './AddOrganDrawer'

const NecropsyOrganSection = ({ organs = [], onChange, disabled = false }) => {
  const theme = useTheme()
  const [openAddOrganDrawer, setOpenAddOrganDrawer] = useState(false)

  const handleApplyOrgans = newOrgans => {
    onChange(newOrgans)
  }

  const handleRemoveOrgan = index => {
    const updated = organs.filter((_, i) => i !== index)
    onChange(updated)
  }

  const handlePartChange = (organIndex, partIndex, field, value) => {
    const updated = [...organs]
    const organ = { ...updated[organIndex] }
    const parts = [...organ.parts]
    parts[partIndex] = { ...parts[partIndex], [field]: value }
    organ.parts = parts
    updated[organIndex] = organ
    onChange(updated)
  }

  const handleRemovePart = (organIndex, partIndex) => {
    const updated = [...organs]
    const organ = { ...updated[organIndex] }
    const parts = organ.parts.filter((_, i) => i !== partIndex)

    if (parts.length === 0) {
      onChange(updated.filter((_, i) => i !== organIndex))
    } else {
      organ.parts = parts
      updated[organIndex] = organ
      onChange(updated)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
          Organ-wise Description of Lessions
        </Typography>
        <Box
          onClick={() => setOpenAddOrganDrawer(true)}
          sx={{
            backgroundColor: theme.palette.customColors?.addPrimary,
            py: 2,
            px: 6,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <Icon icon='lucide:square-plus' fontSize={18} color={theme.palette.customColors?.OnPrimary} />
          <Typography sx={{ color: theme.palette.customColors?.OnPrimary, fontSize: '16px', fontWeight: 600 }}>
            Select Organ
          </Typography>
        </Box>
      </Box>

      {organs.length > 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            backgroundColor: alpha(theme.palette.customColors.displaybgPrimary, 0.4),
            py: 4,
            px: 4
          }}
        >
          {organs.map((organ, organIndex) => (
            <Box
              key={organ.id || organIndex}
              sx={{
                borderRadius: '8px'
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 1
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                    {organ.label || `Organ ${organIndex + 1}`}
                  </Typography>

                  <Typography variant='caption' color='text.secondary'>
                    ({organ.parts?.length || 0} parts)
                  </Typography>
                </Box>

                {!disabled && (
                  <IconButton
                    size='small'
                    onClick={() => handleRemoveOrgan(organIndex)}
                    sx={{ color: theme.palette.error.main }}
                  >
                    <Icon icon={'fontisto:close'} color={theme.palette.customColors.Tertiary} fontSize={18} />
                  </IconButton>
                )}
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {organ.parts?.map((part, partIndex) => {
                  const partName = part.organ_name || part.label || `Part ${partIndex + 1}`

                  return (
                    <Box
                      key={part.id || partIndex}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                      }}
                    >
                      <TextField
                        fullWidth
                        size='small'
                        label={`Enter ${partName} Description`}
                        multiline
                        rows={1}
                        value={part.value || ''}
                        onChange={e => handlePartChange(organIndex, partIndex, 'value', e.target.value)}
                        disabled={disabled}
                        sx={{
                          backgroundColor: theme.palette.customColors.OnPrimary,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '4px'
                          },
                          '& .MuiOutlinedInput-input': {
                            padding: '4px 8px'
                          }
                        }}
                        InputProps={{
                          endAdornment: !disabled && (
                            <InputAdornment position='end'>
                              <IconButton
                                size='small'
                                onClick={() => handleRemovePart(organIndex, partIndex)}
                                edge='end'
                                sx={{
                                  color: theme.palette.text.secondary,
                                  '&:hover': {
                                    color: theme.palette.error.main,
                                    backgroundColor: 'transparent'
                                  }
                                }}
                              >
                                <Icon icon='mdi:close' fontSize={18} />
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />
                    </Box>
                  )
                })}
              </Box>
            </Box>
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            p: 4,
            border: `1px dashed ${theme.palette.divider}`,
            borderRadius: 0.4,
            bgcolor: '#E8F4F266',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4
          }}
        >
          <img src='/images/necropsy/organ_sheet.svg' alt='organ_sheet' />
          <Typography sx={{ fontSize: '14px', fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant }}>
            Select new organs or add from templates
          </Typography>
        </Box>
      )}

      <AddOrganDrawer
        open={openAddOrganDrawer}
        setOpen={setOpenAddOrganDrawer}
        organs={organs}
        onApply={handleApplyOrgans}
      />
    </Box>
  )
}

export default React.memo(NecropsyOrganSection)
