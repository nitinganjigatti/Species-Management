import React from 'react'
import { Box, Typography, Select, MenuItem, TextField, IconButton, Drawer, FormControlLabel } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'
import useHospitalColorUtils from 'src/hooks/useHospitalColorUtils'
import SideSheetActionButtons from '../SideSheetActionButtons'
import MUISwitch from 'src/views/forms/form-fields/MUISwitch'

const AddClinicalAsmntDrawer = ({
  open,
  onClose,
  selectedSymptom,
  onSave,
  clinicalAsmnt,
  setClinicalAsmnt,
  setPrognosisValue,
  prognosisVal,
  setChronicVal,
  chronicVal,
  notes,
  setNotes,
  status,
  setStatus
}) => {
  const theme = useTheme()
  const { getSeverityColor } = useHospitalColorUtils()
  const activities = [1, 2, 3]

  const handleSave = () => {
    onSave({
      status,
      clinicalAsmnt,
      prognosisVal,
      chronicVal,
      notes
    })
  }

  const handleCancel = () => {
    onClose()
  }

  return (
    <Drawer open={open} anchor='right'>
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

        <Box sx={{ pb: 2 }}>
          <Box sx={{ p: 5, background: theme.palette.common.white, px: 5 }}>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 400,
                color: theme.palette.customColors.deepDark,
                mb: 1.7
              }}
            >
              Clinical Assessment
            </Typography>

            <Select
              value={clinicalAsmnt}
              onChange={e => setClinicalAsmnt(e.target.value)}
              fullWidth
              sx={{
                background: theme.palette.common.white,
                color: theme.palette.common.black,
                mb: 0,
                borderRadius: '4px',
                '& .MuiSelect-select': { py: 4.0 }
              }}
            >
              <MenuItem value='Diagnosis'>Diagnosis</MenuItem>
              <MenuItem value='Differential'>Differential</MenuItem>
            </Select>
            {/* </Box>
            </Box> */}

            {clinicalAsmnt === 'Diagnosis' && (
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
                    Is it Chronic?
                  </Typography>
                  <Box
                    display='flex'
                    alignItems='center'
                    justifyContent='flex-start'
                    sx={{
                      border: '1px solid #C3CEC7',
                      borderRadius: '4px',
                      padding: '8px 16px',
                      backgroundColor: '#fff',
                      width: 260,
                      height: '56px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Typography sx={{ marginRight: 2 }}>{chronicVal}</Typography>
                    <FormControlLabel
                      control={
                        <MUISwitch
                          checked={chronicVal === 'Yes'}
                          onChange={e => setChronicVal(e.target.checked ? 'Yes' : 'No')}
                          size='medium'
                        />
                      }
                      label=''
                      sx={{ ml: 0.25 }}
                    />
                  </Box>
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
                    Prognosis
                  </Typography>

                  <Select
                    value={prognosisVal}
                    onChange={e => setPrognosisValue(e.target.value)}
                    sx={{
                      backgroundColor: prognosisVal ? getSeverityColor(prognosisVal).bgColor : '',

                      fontWeight: 500,
                      height: 56,
                      borderRadius: '4px',
                      width: '260px',
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: '1px solid',
                        borderColor: getSeverityColor(prognosisVal).color
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        border: '1px solid',
                        borderColor: getSeverityColor(prognosisVal).color
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        border: '1px solid',
                        borderColor: getSeverityColor(prognosisVal).color
                      }
                    }}
                  >
                    <MenuItem value='Guarded'>Guarded</MenuItem>
                    <MenuItem value='Favourable'>Favourable</MenuItem>
                    <MenuItem value='Doubtful'>Doubtful</MenuItem>
                    <MenuItem value='Poor'>Poor</MenuItem>
                    <MenuItem value='Grave'>Grave</MenuItem>
                  </Select>
                </Box>
              </Box>
            )}

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
        <Box sx={{ position: 'fixed', bottom: 0 }}>
          <SideSheetActionButtons
            addLabel='ADD'
            cancelLabel='CANCEL'
            onAdd={handleSave}
            onCancel={handleCancel}
            width={260}
            height={50}
          />
        </Box>
      </Box>
    </Drawer>
  )
}

export default React.memo(AddClinicalAsmntDrawer)
