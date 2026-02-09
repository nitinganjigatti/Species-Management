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
  useTheme
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  Delete as DeleteIcon
} from '@mui/icons-material'
import Icon from 'src/@core/components/icon'
import AddOrganDrawer from './AddOrganDrawer'

const NecropsyOrganSection = ({ organs = [], onChange, disabled = false }) => {
  const theme = useTheme()
  const [openAddOrganDrawer, setOpenAddOrganDrawer] = useState(false)

  const handleApplyOrgans = (newOrgans) => {
    onChange(newOrgans)
  }

  const handleRemoveOrgan = (index) => {
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

  return (
    <Box>
      {/* Add Organ Button */}
      <Box sx={{ mb: 3 }}>
        <Button
          onClick={() => setOpenAddOrganDrawer(true)}
          disabled={disabled}
          sx={{
            width: '100%',
            backgroundColor: theme.palette.customColors?.SecondaryContainer || theme.palette.primary.light,
            color: theme.palette.customColors?.OnSecondaryContainer || theme.palette.primary.dark,
            fontSize: '18px',
            fontWeight: 500,
            textTransform: 'none',
            py: 2,
            '&:hover': {
              backgroundColor: theme.palette.customColors?.SecondaryContainer || theme.palette.primary.light
            },
            '&.Mui-disabled': {
              backgroundColor: theme.palette.action.disabledBackground,
              color: theme.palette.action.disabled
            }
          }}
          startIcon={<Icon icon='mdi:plus' fontSize={24} />}
        >
          Add Organ
        </Button>
      </Box>

      {/* Selected Organs Display */}
      {organs.length > 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {organs.map((organ, organIndex) => (
            <Accordion
              key={organ.id || organIndex}
              defaultExpanded
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: '8px !important',
                '&:before': { display: 'none' },
                boxShadow: 'none',
                '&.Mui-expanded': {
                  margin: 0
                }
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  '& .MuiAccordionSummary-content': {
                    alignItems: 'center',
                    gap: 2,
                    my: 1
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
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
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveOrgan(organIndex)
                    }}
                    sx={{ color: theme.palette.error.main }}
                  >
                    <DeleteIcon fontSize='small' />
                  </IconButton>
                )}
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                {/* Parts */}
                {organ.parts?.map((part, partIndex) => {
                  const partName = part.organ_name || part.label || `Part ${partIndex + 1}`

                  return (
                    <Box
                      key={part.id || partIndex}
                      sx={{
                        mb: 2
                      }}
                    >
                      <TextField
                        fullWidth
                        size='small'
                        label={`Enter ${partName} Description`}
                        multiline
                        rows={2}
                        value={part.value || ''}
                        onChange={(e) => handlePartChange(organIndex, partIndex, 'value', e.target.value)}
                        disabled={disabled}
                      />
                    </Box>
                  )
                })}
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            p: 4,
            textAlign: 'center',
            border: `1px dashed ${theme.palette.divider}`,
            borderRadius: 2,
            bgcolor: theme.palette.customColors?.bodyBg || theme.palette.grey[50]
          }}
        >
          <Typography color='text.secondary'>
            No organs added. Click "Add Organ" to select organs for examination.
          </Typography>
        </Box>
      )}

      {/* Add Organ Drawer */}
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
