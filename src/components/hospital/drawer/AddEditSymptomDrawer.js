import React, { useState } from 'react'
import {
  Box,
  Typography,
  Select,
  MenuItem,
  TextField,
  Grid,
  IconButton,
  Paper,
  Drawer,
  Divider,
  InputAdornment,
  alpha
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'
import EditIcon from '@mui/icons-material/Edit'

const AddEditSymptomDrawer = ({
  open,
  onClose,
  selectedSymptom,
  onSave,
  severity,
  setSeverity,
  durationValue,
  setDurationValue,
  durationUnit,
  setDurationUnit,
  notes,
  setNotes
}) => {
  const theme = useTheme()

  const handleSave = () => {
    onSave({
      severity,
      durationValue,
      durationUnit,
      notes
    })
  }

  const handleCancel = () => {
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
          backgroundColor: theme.palette.common.white
        }}
      >
        <Box sx={{ px: 5, pt: 4, pb: 2, borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}` }}>
          <Box display='flex' justifyContent='space-between' alignItems='center'>
            <Box display='flex' alignItems='center' gap={3}>
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 500 }}>{selectedSymptom}</Typography>
            </Box>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ pt: 4, pb: 2, borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}` }}>
          <Box sx={{ p: 5, background: theme.palette.common.white, px: 5 }}>
            <Typography
              sx={{ color: theme.palette.customColors.OnPrimaryContainer, fontWeight: 500, fontSize: '16px' }}
            >
              MED-00023
            </Typography>
            <Typography
              sx={{ color: theme.palette.customColors.OnSurfaceVariant, mb: 3, fontWeight: 400, fontSize: '14px' }}
            >
              Dr Nitin Ashok Ganjigatti • 12:05 PM • 19 May 2025
            </Typography>

            <Typography
              sx={{ fontWeight: 400, fontSize: '14px', color: theme.palette.customColors.deepDark, pb: 1, mt: 6 }}
            >
              Status
            </Typography>
            <Select
              value='Active'
              fullWidth
              sx={{
                background: theme.palette.common.white,
                color: theme.palette.common.black,
                mb: 0,
                borderRadius: '4px',
                '& .MuiSelect-select': { py: 4.0 }
              }}
            >
              <MenuItem value='Active'>Active</MenuItem>
              <MenuItem value='Inactive'>Inactive</MenuItem>
            </Select>

            <Box sx={{ display: 'flex', gap: 2, mt: 6 }}>
              <Box>
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 400,
                    color: theme.palette.customColors.deepDark,
                    mb: 1.7
                  }}
                >
                  Severity
                </Typography>

                <Select
                  value={severity}
                  onChange={e => setSeverity(e.target.value)}
                  sx={{
                    backgroundColor:
                      severity === 'High'
                        ? alpha(theme.palette.customColors.TertiaryContainer, 0.15)
                        : severity === 'Extreme'
                        ? alpha(theme.palette.customColors.ErrorContainer, 0.4)
                        : severity === 'Medium'
                        ? theme.palette.customColors.antzNotesLight
                        : theme.palette.customColors.tableHeaderBg,
                    fontWeight: 500,
                    height: 56,
                    borderRadius: '4px',
                    width: '260px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: '1px solid',
                      borderColor:
                        severity === 'High'
                          ? theme.palette.customColors.customDropdownColor
                          : severity === 'Extreme'
                          ? theme.palette.customColors.Error
                          : severity === 'Medium'
                          ? theme.palette.customColors.moderateSecondary
                          : theme.palette.customColors.addPrimary
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      border: '1px solid',
                      borderColor:
                        severity === 'High'
                          ? theme.palette.customColors.customDropdownColor
                          : severity === 'Extreme'
                          ? theme.palette.customColors.Error
                          : severity === 'Medium'
                          ? theme.palette.customColors.moderateSecondary
                          : theme.palette.customColors.addPrimary
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      border: '1px solid',
                      borderColor:
                        severity === 'High'
                          ? theme.palette.customColors.customDropdownColor
                          : severity === 'Extreme'
                          ? theme.palette.customColors.Error
                          : severity === 'Medium'
                          ? theme.palette.customColors.moderateSecondary
                          : theme.palette.customColors.addPrimary
                    }
                  }}
                >
                  <MenuItem value='Low'>Low</MenuItem>
                  <MenuItem value='Medium'>Medium</MenuItem>
                  <MenuItem value='High'>High</MenuItem>
                  <MenuItem value='Extreme'>Extreme</MenuItem>
                </Select>
              </Box>

              <Box>
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 400,
                    color: theme.palette.customColors.deepDark,
                    mb: 1.7
                  }}
                >
                  Duration
                </Typography>
                <TextField
                  type='number'
                  value={durationValue}
                  onChange={e => setDurationValue(e.target.value)}
                  sx={{ width: 260 }}
                  slotProps={{
                    input: {
                      sx: { height: 56, borderRadius: '4px' },
                      endAdornment: (
                        <InputAdornment position='end' sx={{ p: 0, m: 0 }}>
                          <Select
                            value={durationUnit}
                            onChange={e => setDurationUnit(e.target.value)}
                            variant='standard'
                            disableUnderline
                            sx={{
                              fontSize: 14,
                              ml: 1,
                              textAlign: 'right',

                              '& .MuiSelect-select': {
                                paddingRight: '24px'
                              }
                            }}
                          >
                            <MenuItem value='Days'>Days</MenuItem>
                            <MenuItem value='Weeks'>Weeks</MenuItem>
                            <MenuItem value='Months'>Months</MenuItem>
                          </Select>
                        </InputAdornment>
                      )
                    }
                  }}
                />
              </Box>
            </Box>

            <Typography
              sx={{ fontWeight: 400, fontSize: '14px', color: theme.palette.customColors.deepDark, pb: 1, mt: 6 }}
            >
              Notes
            </Typography>
            <TextField
              placeholder='Add notes'
              fullWidth
              multiline
              rows={3}
              onChange={e => setNotes(e.target.value)}
              sx={{
                background: theme.palette.common.white,
                mb: 3
              }}
            />
          </Box>
          <Divider color={theme.palette.customColors.OutlineVariant} />

          <Box sx={{ px: 5, py: 5 }}>
            <Typography sx={{ fontWeight: 600, mb: 2 }}>Activity</Typography>

            <Paper
              sx={{
                p: 3,
                mb: 3,
                background: theme.palette.customColors.bodyBg,
                boxShadow: 'none',
                border: 'none',
                borderRadius: '8px'
              }}
            >
              <Typography
                sx={{ fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant, fontSize: '14px' }}
              >
                Status Update
              </Typography>
              <Typography
                sx={{ color: theme.palette.customColors.neutralSecondary, mb: 3, fontWeight: 400, fontSize: '12px' }}
              >
                Dr. Nitin • 12:05 PM • 19 May 2025
              </Typography>
              <Typography
                sx={{ mb: 1, color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 400, fontSize: '12px' }}
              >
                Severity: <strong>Medium</strong>
              </Typography>
              <Typography
                sx={{ mb: 2, color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 400, fontSize: '12px' }}
              >
                Status: <strong>Active</strong>
              </Typography>
              <Typography
                sx={{ color: theme.palette.customColors.neutralSecondary, fontWeight: 400, fontSize: '12px' }}
              >
                Comment
              </Typography>
              <Typography
                sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 400, fontSize: '14px' }}
              >
                Mild oral plaque formation inside beak noted; no concurrent bacterial infections detected
              </Typography>
            </Paper>

            {[1, 2, 3].map((_, i) => (
              <Paper
                key={i}
                sx={{
                  p: 3,
                  mb: 3,
                  background: alpha(theme.palette.customColors.antzNotes, 0.4),
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  boxShadow: 'none',
                  border: 'none',
                  borderRadius: '8px'
                }}
              >
                <Box>
                  <Typography
                    sx={{ fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant, fontSize: '14px' }}
                  >
                    Beak deformity present with overgrowth and surface cracking; patient shows signs of
                    immunosuppression
                  </Typography>
                  <Typography
                    sx={{
                      color: theme.palette.customColors.neutralSecondary,
                      fontWeight: 400,
                      fontSize: '12px',
                      mt: 1.5
                    }}
                  >
                    Dr. Nitin • 12:05 PM • 19 May 2025
                  </Typography>
                </Box>
                <IconButton size='small' style={{ padding: 1 }}>
                  <EditIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Paper>
            ))}
          </Box>
        </Box>

        <Box
          sx={{
            position: 'sticky',
            bottom: 1,
            backgroundColor: theme.palette.common.white,
            borderTop: `1px solid ${theme.palette.customColors.OutlineVariant}`,
            px: 5,
            py: 6,
            display: 'flex',
            gap: 2
          }}
        >
          <Box
            component='button'
            onClick={handleCancel}
            sx={{
              flex: 1,
              py: 4,
              border: `1px solid ${theme.palette.customColors.OnPrimaryContainer}`,
              borderRadius: '8px',
              backgroundColor: 'transparent',
              color: theme.palette.customColors.OnPrimaryContainer,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            CANCEL
          </Box>
          <Box
            component='button'
            onClick={handleSave}
            sx={{
              flex: 1,
              py: 4,
              borderRadius: '8px',
              backgroundColor: theme.palette.customColors.OnPrimaryContainer,
              color: theme.palette.common.white,
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none'
            }}
          >
            ADD
          </Box>
        </Box>
      </Box>
    </Drawer>
  )
}

export default React.memo(AddEditSymptomDrawer)
