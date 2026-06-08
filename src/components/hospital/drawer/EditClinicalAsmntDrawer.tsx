'use client'

import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Typography,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Drawer,
  Divider,
  FormControlLabel
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'
import useHospitalColorUtils from 'src/hooks/useHospitalColorUtils'
import ActivityList from 'src/views/pages/hospital/symptoms/ActivityList'
import { ActivityFormData } from 'src/types/hospital/components/common'
import SideSheetActionButtons from '../SideSheetActionButtons'
import MUISwitch from 'src/views/forms/form-fields/MUISwitch'
// import MUIDateTimePicker from 'src/views/forms/form-fields/MUIDateTimePicker'
import Utility from 'src/utility'
import { MedicalIdChip } from 'src/views/pages/hospital/utility/hospitalSnippets'
import EditNotes from '../inpatient/EditNotes'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import type { BaseDrawerProps } from 'src/types/hospital'

dayjs.extend(utc)

interface EditClinicalAsmntDrawerProps extends BaseDrawerProps {
  selectedSymptom?: any
  onSave: (payload: any) => void
  clinicalAsmnt: string
  setClinicalAsmnt: (v: string) => void
  setPrognosisValue: (v: string) => void
  prognosisVal: string
  setChronicVal: (v: string) => void
  chronicVal: string
  notes: string
  setNotes: (v: string) => void
  status: string
  setStatus: (v: string) => void
  isSubmitLoading?: boolean
  activityLoader?: boolean
  activityListData?: any
  isDeleting?: boolean
  isUpdating?: boolean
  handleUpdateNotes: () => void
  handleDeleteNotes: () => void
  handleEditNoteClick: (item: any) => void
  isNotesOpen: boolean
  setIsNotesOpen: (v: boolean) => void
  admittedDate?: any
  dischargedDate?: any
  recordedDateTime: any
  setRecordedDateTime: (v: any) => void
  isDischarged?: boolean
  isChanged?: boolean
  medical_record_id?: any
}

const EditClinicalAsmntDrawer = ({
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
  isSubmitLoading,
  activityLoader,
  activityListData,
  isDeleting,
  isUpdating,
  handleUpdateNotes,
  handleDeleteNotes,
  handleEditNoteClick,
  isNotesOpen,
  setIsNotesOpen,
  admittedDate,
  dischargedDate,
  recordedDateTime,
  setRecordedDateTime,
  isDischarged,
  isChanged,
  medical_record_id
}: EditClinicalAsmntDrawerProps) => {
  const theme: any = useTheme()
  const { t } = useTranslation()
  const { getSeverityColor } = useHospitalColorUtils()
  const activities = [1, 2, 3]
  const [minDate, setMinDate] = useState<any>(null)
  const [maxDate, setMaxDate] = useState<any>(null)

  useEffect(() => {
    if (!open) return

    // Set date range based on discharge status
    if (isDischarged && dischargedDate) {
      // setMinDate(dayjs.utc(admittedDate).local().startOf('day'))
      // setMaxDate(dayjs.utc(dischargedDate).local().endOf('day'))
      setMinDate(dayjs(Utility.convertUTCToLocal(admittedDate)))
      setMaxDate(dayjs(Utility.convertUTCToLocal(dischargedDate)))
    } else {
      setMinDate(admittedDate ? dayjs(Utility.convertUTCToLocal(admittedDate)): null)
      setMaxDate(dayjs()) // Set max date to current time for non-discharged animals
    }

    // Set recorded datetime from existing data or default
    if (selectedSymptom?.additional_info?.recorded_date_time) {
      // Load existing recorded datetime and convert from UTC to local
      const existingDateTime =
      dayjs(Utility.convertUTCToLocal(selectedSymptom.additional_info.recorded_date_time))
      // dayjs.utc(selectedSymptom.additional_info.recorded_date_time).local()
      setRecordedDateTime(existingDateTime)
    } else {
      // Set default to current time or discharge time
      if (isDischarged && dischargedDate) {
        setRecordedDateTime(dayjs.utc(dischargedDate).local())
      } else {
        setRecordedDateTime(dayjs())
      }
    }
  }, [open, selectedSymptom, isDischarged, admittedDate, dischargedDate])

  const isResolved = status === 'Closed' || status === 'Inactive'

  const commonFieldStyles = {
    textAlign: 'left',
    borderRadius: '4px',
    '& .MuiOutlinedInput-root': {
      borderRadius: '4px'
    }
  }

  const handleSave = () => {
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

  const processedActivities =
    activityListData?.diagnosis_notes?.map((activity: any, index: number) => ({
      ...activity,
      isSystemGenerated: activity?.is_system_generated === 1,
      oldSeverity: activity?.notes_dump?.old_data?.severity || '',
      newSeverity: activity?.notes_dump?.new_data?.severity || '',
      oldPrognosis: activity?.notes_dump?.old_data?.prognosis || '',
      newPrognosis: activity?.notes_dump?.new_data?.prognosis || '',
      createdBy: activity?.created_by_user_name || '',
      formattedTime: activityListData?.diagnosis_notes?.length === index + 1 ? `${Utility.convertUtcToLocalReadableDate(
        activityListData?.recorded_date_time
      )} • ${Utility.convertUTCToLocaltime(activityListData?.recorded_date_time)}` : `${Utility.convertUtcToLocalReadableDate(
        activity?.modified_at || activity.created_at
      )} • ${Utility.convertUTCToLocaltime(activity?.modified_at || activity?.created_at)}`,
      note: activity.note || '',
      clinicalAssessment: activity.clinical_assessment === 'diagnosis' ? 'Diagnosis' : 'Tentative',
      oldRecord: activity?.notes_dump?.old_data?.clinical_assessment,
      newRecord: activity?.notes_dump?.new_data?.clinical_assessment,
      oldIsChronical: activity?.notes_dump?.old_data?.is_cronical,
      newIsChronical: activity?.notes_dump?.new_data?.is_cronical,
      isFromAssessment: true
    })) ||
    // .sort((a, b) => {
    //   return b.isSystemGenerated - a.isSystemGenerated
    // })

    []

  const handleEditActivity = (item: ActivityFormData) => {
    setIsNotesOpen(true)
    handleEditNoteClick(item)
  }

  const renderStatusIcon = (statusValue: string) => {
    const isActive = statusValue === 'Active'

    return (
      <Box
        sx={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: isActive ? theme.palette.primary.main : theme.palette.customColors.neutral_50,
          marginRight: 1
        }}
      />
    )
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

        <Box sx={{ pb: 2, borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}` }}>
          <Box
            sx={{
              p: 5,
              background: isResolved ? theme.palette.customColors.neutral05 : theme.palette.common.white,
              px: 5
            }}
          >
            <MedicalIdChip
              leftImage
              medId={medical_record_id ? `MID-${medical_record_id}` : ''}
              textColor={theme.palette.customColors.OnPrimaryContainer}
            />
            <Typography
              sx={{ color: theme.palette.customColors.OnSurfaceVariant, mb: 3, fontWeight: 400, fontSize: '14px' }}
            >
              {selectedSymptom?.created_by_user_name} • {Utility.formatDisplayDate(selectedSymptom?.created_at)}
            </Typography>

            {/* <Typography
              sx={{ fontWeight: 400, fontSize: '14px', color: theme.palette.customColors.deepDark, pb: 1, mt: 6 }}
            >
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
            </Box> */}

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
                  {t('status')}
                </Typography>

                <Select
                  value={status}
                  onChange={e => setStatus(e.target.value as string)}
                  fullWidth
                  sx={{
                    background: theme.palette.common.white,
                    color: theme.palette.common.black,
                    mb: 0,
                    borderRadius: '4px',
                    width: 260,
                    '& .MuiSelect-select': {
                      py: 4.0,
                      display: 'flex',
                      alignItems: 'center'
                    }
                  }}
                  renderValue={(selected: any) => (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {renderStatusIcon(selected)}
                      <Typography>{selected === 'Active' ? t('hospital_module.active') : t('hospital_module.resolved')}</Typography>
                    </Box>
                  )}
                >
                  <MenuItem value='Active'>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {renderStatusIcon('Active')}
                      <Typography>{t('hospital_module.active')}</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value='Inactive'>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {renderStatusIcon('Inactive')}
                      <Typography>{t('hospital_module.resolved')}</Typography>
                    </Box>
                  </MenuItem>
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
                  {t('hospital_module.clinical_assessment')}
                </Typography>

                <Select
                  value={clinicalAsmnt}
                  onChange={e => setClinicalAsmnt(e.target.value as string)}
                  fullWidth
                  disabled={isResolved}
                  sx={{
                    background: theme.palette.common.white,
                    color: theme.palette.common.black,
                    mb: 0,
                    borderRadius: '4px',
                    width: 260,
                    '& .MuiSelect-select': { py: 4.0 }
                  }}
                >
                  <MenuItem value='diagnosis'>{t('hospital_module.diagnosis')}</MenuItem>
                  <MenuItem value='tentative'>{t('hospital_module.tentative')}</MenuItem>
                </Select>
              </Box>
            </Box>

            {clinicalAsmnt === 'diagnosis' && (
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
                    {t('hospital_module.is_it_chronic')}
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
                    <Typography sx={{ marginRight: 2 }}>{chronicVal === 'Yes' ? t('yes') : t('no')}</Typography>
                    <FormControlLabel
                      control={
                        <MUISwitch
                          checked={chronicVal === 'Yes'}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setChronicVal(e.target.checked ? 'Yes' : 'No')}
                          size='medium'
                          disabled={isResolved}
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
                    {t('hospital_module.prognosis')}
                  </Typography>

                  <Select
                    value={prognosisVal}
                    onChange={e => setPrognosisValue(e.target.value as string)}
                    disabled={isResolved}
                    sx={{
                      backgroundColor: getSeverityColor(prognosisVal).bgColor,

                      fontWeight: 500,
                      height: 56,
                      borderRadius: '4px',
                      width: '260px',
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: '1px solid',
                        borderColor: isResolved ? theme.palette.grey[400] : getSeverityColor(prognosisVal).color
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        border: '1px solid',
                        borderColor: isResolved ? theme.palette.grey[400] : getSeverityColor(prognosisVal).color
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        border: '1px solid',
                        borderColor: isResolved ? theme.palette.grey[400] : getSeverityColor(prognosisVal).color
                      }
                    }}
                  >
                    <MenuItem value='Favourable'>{t('hospital_module.favourable')}</MenuItem>
                    <MenuItem value='Guarded'>{t('hospital_module.guarded')}</MenuItem>
                    <MenuItem value='Doubtful'>{t('hospital_module.doubtful')}</MenuItem>
                    <MenuItem value='Poor'>{t('hospital_module.poor')}</MenuItem>
                    <MenuItem value='Grave'>{t('hospital_module.grave')}</MenuItem>
                  </Select>
                </Box>
              </Box>
            )}

            <Typography
              sx={{ fontWeight: 400, fontSize: '14px', color: theme.palette.customColors.deepDark, pb: 1, mt: 6 }}
            >
              {t('notes')}
            </Typography>
            <TextField
              placeholder={(t('hospital_module.add_notes') as string)}
              fullWidth
              multiline
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              disabled={isResolved}
              sx={{
                ...commonFieldStyles,
                background: theme.palette.common.white,
                mb: 3
              }}
            />
          </Box>
          <Divider color={theme.palette.customColors.OutlineVariant} />
          <Box sx={{ mb: '80px' }}>
            <ActivityList
              activities={processedActivities}
              onEdit={handleEditActivity}
              activityLoader={activityLoader}
              isFromAssessment
            />
          </Box>
        </Box>

        <Box sx={{ position: 'fixed', bottom: 0 }}>
          <SideSheetActionButtons
            isSubmitLoading={isSubmitLoading}
            addLabel={t('update')}
            cancelLabel={t('cancel')}
            onAdd={handleSave}
            onCancel={handleCancel}
            width={260}
            height={50}
            isDisabled={!isChanged}
          />
        </Box>
      </Box>
      <EditNotes
        open={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        notes={notes}
        setNotes={setNotes}
        isUpdating={isUpdating}
        isDeleting={isDeleting}
        handleUpdate={handleUpdateNotes}
        handleDelete={handleDeleteNotes}
      />
    </Drawer>
  )
}

export default React.memo(EditClinicalAsmntDrawer)
