import React, { useEffect, useState } from 'react'
import { Box, Typography, Select, MenuItem, TextField, IconButton, Drawer, FormControlLabel } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'
import useHospitalColorUtils from 'src/hooks/useHospitalColorUtils'
import SideSheetActionButtons from '../SideSheetActionButtons'
import MUISwitch from 'src/views/forms/form-fields/MUISwitch'
import MUIDateTimePicker from 'src/views/forms/form-fields/MUIDateTimePicker'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import Utility from 'src/utility'

dayjs.extend(utc)

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
  setStatus,
  admittedDate,
  dischargedDate,
  isDischarged
}) => {
  const theme = useTheme()
  const { getSeverityColor } = useHospitalColorUtils()
  const activities = [1, 2, 3]
  const [recordedDateTime, setRecordedDateTime] = useState(dayjs())
  const [minDate, setMinDate] = useState(null)
  const [maxDate, setMaxDate] = useState(null)

  useEffect(() => {
    if (!open) return

    // Set default date based on discharge status
    if (isDischarged && dischargedDate) {
      // Convert UTC discharge date to local time
      const localDischargeDateTime = dayjs(Utility.convertUTCToLocal(dischargedDate))
      // dayjs.utc(dischargedDate).local()
      const localAdmittedDateTime =  dayjs(Utility.convertUTCToLocal(admittedDate))
      // dayjs.utc(admittedDate).local()

      setRecordedDateTime(localDischargeDateTime)
      setMinDate(localAdmittedDateTime)
      setMaxDate(localDischargeDateTime)
    } else {
      setRecordedDateTime(dayjs())
      setMinDate(admittedDate ? dayjs(Utility.convertUTCToLocal(admittedDate)) : null)

      setMaxDate(dayjs())
      // Set max date to current time for non-discharged animals
    }
    // dayjs.utc(admittedDate).local().
  }, [open, isDischarged, admittedDate, dischargedDate])

  const commonFieldStyles = {
    textAlign: 'left',
    borderRadius: '4px',
    '& .MuiOutlinedInput-root': {
      borderRadius: '4px'
    }
  }

  const handleSave = () => {
    // Validate Clinical Assessment before saving
    if (!clinicalAsmnt) {
      return
    }

    onSave({
      status,
      clinicalAsmnt,
      prognosisVal,
      chronicVal,
      notes,
      recordedDateTime: recordedDateTime.format('YYYY-MM-DD HH:mm:ss')
    })
  }

  const handleCancel = () => {
    onClose()
  }

  // Set default value to 'Differential' when component mounts
  useEffect(() => {
    if (!clinicalAsmnt) {
      setClinicalAsmnt('Tentative')
    }
  }, [])

  // Set default prognosis to 'Favourable' when Diagnosis is selected
  useEffect(() => {
    if (clinicalAsmnt === 'Diagnosis' && !prognosisVal) {
      setPrognosisValue('Favourable')
    }
  }, [clinicalAsmnt])

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
            <Typography sx={{ fontWeight: 400, fontSize: '14px', color: theme.palette.customColors.deepDark, pb: 1 }}>
              Date & Time
            </Typography>
            <Box sx={{ mb: 6 }}>
              <MUIDateTimePicker
                value={recordedDateTime}
                onChange={newValue => setRecordedDateTime(newValue)}
                label=''
                minDateTime={minDate}
                maxDateTime={maxDate}
                ampm={true}
              />
            </Box>

            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 400,
                color: theme.palette.customColors.deepDark,
                mb: 1.7
              }}
            >
              Type*
            </Typography>

            <Select
              value={clinicalAsmnt || 'Tentative'}
              onChange={e => setClinicalAsmnt(e.target.value)}
              fullWidth
              displayEmpty
              required
              error={!clinicalAsmnt}
              sx={{
                background:
                  clinicalAsmnt === 'Tentative' ? theme.palette.customColors.antzNotes80 : theme.palette.common.white,
                color: theme.palette.common.black,
                mb: 0,
                borderRadius: '4px',
                '& .MuiSelect-select': { py: 4.0 },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: !clinicalAsmnt ? theme.palette.error.main : undefined
                }
              }}
            >
              <MenuItem value='Tentative'>Tentative</MenuItem>
              <MenuItem value='Diagnosis'>Diagnosis</MenuItem>
            </Select>
            {!clinicalAsmnt && (
              <Typography
                sx={{
                  color: theme.palette.error.main,
                  fontSize: '0.75rem',
                  mt: 0.5,
                  ml: 2
                }}
              >
                Clinical Assessment is required
              </Typography>
            )}

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
                    value={prognosisVal || 'Favourable'}
                    onChange={e => setPrognosisValue(e.target.value)}
                    sx={{
                      backgroundColor: prognosisVal
                        ? getSeverityColor(prognosisVal).bgColor
                        : getSeverityColor('Favourable').bgColor,

                      fontWeight: 500,
                      height: 56,
                      borderRadius: '4px',
                      width: '260px',
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: '1px solid',
                        borderColor: prognosisVal
                          ? getSeverityColor(prognosisVal).color
                          : getSeverityColor('Favourable').color
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        border: '1px solid',
                        borderColor: prognosisVal
                          ? getSeverityColor(prognosisVal).color
                          : getSeverityColor('Favourable').color
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        border: '1px solid',
                        borderColor: prognosisVal
                          ? getSeverityColor(prognosisVal).color
                          : getSeverityColor('Favourable').color
                      }
                    }}
                  >
                    <MenuItem value='Favourable'>Favourable</MenuItem>
                    <MenuItem value='Guarded'>Guarded</MenuItem>
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
                ...commonFieldStyles,
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
