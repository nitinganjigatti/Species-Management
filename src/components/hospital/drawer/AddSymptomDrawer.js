import React from 'react'
import {
  Box,
  Typography,
  Select,
  MenuItem,
  TextField,
  Grid,
  IconButton,
  Drawer,
  InputAdornment,
  alpha
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'
import useHospitalColorUtils from 'src/hooks/useHospitalColorUtils'
import SideSheetActionButtons from '../SideSheetActionButtons'

const AddSymptomDrawer = ({
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
  const { getSymptomsSeverityColor } = useHospitalColorUtils()

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
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 500 }}>{selectedSymptom?.name}</Typography>
            </Box>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <Box
          sx={{ pt: 4, pb: 2, borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`, height: '100vh' }}
        >
          <Box sx={{ p: 5, background: theme.palette.common.white, px: 5 }}>
            <Box sx={{ display: 'flex', gap: 2, mt: 0 }}>
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
                    backgroundColor: getSymptomsSeverityColor(severity).bgColor,

                    fontWeight: 500,
                    height: 56,
                    borderRadius: '4px',
                    width: '260px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: '1px solid',
                      borderColor: getSymptomsSeverityColor(severity).color
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      border: '1px solid',
                      borderColor: getSymptomsSeverityColor(severity).color
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      border: '1px solid',
                      borderColor: getSymptomsSeverityColor(severity).color
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
                  onChange={e => {
                    const val = e.target.value
                    if (val === '' || Number(val) >= 1) {
                      setDurationValue(val)
                    }
                  }}
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
              value={notes}
              onChange={e => setNotes(e.target.value)}
              sx={{
                background: theme.palette.common.white,
                mb: 3
              }}
            />
          </Box>
        </Box>

        <SideSheetActionButtons
          addLabel='ADD'
          cancelLabel='CANCEL'
          onAdd={handleSave}
          onCancel={handleCancel}
          width={260}
          height={50}
        />
      </Box>
    </Drawer>
  )
}

export default React.memo(AddSymptomDrawer)
