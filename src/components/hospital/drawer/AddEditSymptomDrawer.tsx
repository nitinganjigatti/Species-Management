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
  InputAdornment
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'
import useHospitalColorUtils from 'src/hooks/useHospitalColorUtils'
import ActivityList from 'src/views/pages/hospital/symptoms/ActivityList'
import { ActivityFormData } from 'src/types/hospital/components/common'
import SideSheetActionButtons from '../SideSheetActionButtons'
import { updateNotes } from 'src/lib/api/hospital/clinicalAssessment'
import { deleteNoteSymptoms } from 'src/lib/api/hospital/symptoms'
import Utility from 'src/utility'
import Toaster from 'src/components/Toaster'
import EditNotes from '../inpatient/EditNotes'
import useSafeRouter from 'src/hooks/useSafeRouter'
import { useParams } from 'next/navigation'
import MUIDateTimePicker from 'src/views/forms/form-fields/MUIDateTimePicker'
import dayjs, { Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import type { BaseDrawerProps, Id } from 'src/types/hospital'
import { Severity, SymptomStatus } from 'src/types/hospital/models'
import { ComplaintNotes, SymptomList, SymptomRecords } from 'src/types/hospital/models/symptoms'
import { DeleteSymptomNotesResponse, GetSymptomRecordResponse, GetSymptomsCardResponse } from 'src/types/hospital/api/Inpatient/symptoms'
import { DurationUnit } from 'src/types/hospital/models'
import { UpdateSymptomsCardFormData } from 'src/types/hospital/components/symptoms'
import { UpdateNotesPayload, UpdateNotesResponse } from 'src/types/hospital/api/Inpatient/symptomClinical'
import { AddEditSymptomDrawerProps } from 'src/types/hospital/components/symptoms'

dayjs.extend(utc)
dayjs.extend(timezone)


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
  setNotes,
  setNoteId,
  noteId,
  status,
  setStatus,
  activityListData,
  activityLoader,
  temporarilySelected,
  setSymptomNoteModal,
  symptomNoteModal,
  fetchNotesForSymptom,
  setIsUpdating,
  isUpdating,
  setIsDeleting,
  isDeleting,
  isSubmitLoading,
  setActivityListData,
  isChanged,
  isResolved,
  admittedDate,
  dischargedDate,
  isDischarged
}: AddEditSymptomDrawerProps) => {
  const theme: any = useTheme()
  const { t } = useTranslation()
  const { getSymptomsSeverityColor } = useHospitalColorUtils()
  const router: any = useSafeRouter()
  const routerParams: any = useParams()
  // Get id from dynamic route params (App Router) or from router.query fallback
  const id = routerParams?.id || router.query?.id

  const [recordedDateTime, setRecordedDateTime] = useState<any>(dayjs())
  const [minDate, setMinDate] = useState<any>(null)
  const [maxDate, setMaxDate] = useState<any>(null)

  useEffect(() => {
    if (!open) return

    // Set default date and restrictions based on discharge status
    if (isDischarged && dischargedDate) {
      // Convert UTC dates to local time
      setMinDate(dayjs.utc(admittedDate).local().startOf('day'))
      setMaxDate(dayjs.utc(dischargedDate).local().endOf('day'))
    } else {
      setMinDate(admittedDate ? dayjs.utc(admittedDate).local().startOf('day') : null)
      setMaxDate(dayjs()) // Set max date to current time for non-discharged animals
    }

    // Set initial value from selectedSymptom if available
    if (selectedSymptom?.additional_info?.recorded_date_time) {
      // Parse as local time (not UTC)
      const localDateTime = dayjs.utc(selectedSymptom?.additional_info?.recorded_date_time).local()
      setRecordedDateTime(localDateTime)
    } else if (selectedSymptom?.created_at) {
      // Parse as UTC and convert to local time
      const localDateTime = dayjs.utc(selectedSymptom.created_at).local()
      setRecordedDateTime(localDateTime)
    } else {
      setRecordedDateTime(dayjs())
    }
  }, [open, selectedSymptom, isDischarged, admittedDate, dischargedDate])

  const handleSave = () => {
    onSave({
      status,
      severity,
      durationValue,
      durationUnit,
      notes,
      recordedDateTime: recordedDateTime.format('YYYY-MM-DD HH:mm:ss')
    })
  }

  const handleCancel = () => {
    onClose()
  }

  const processedActivities =
    activityListData?.complaint_notes?.map((activity: ComplaintNotes, index: number) => ({
      ...activity,
      isSystemGenerated: activity?.is_system_generated === 1,
      oldSeverity: activity?.notes_dump?.old_data?.severity || '' as Severity,
      newSeverity: activity?.notes_dump?.new_data?.severity || '' as Severity,
      createdBy: activity?.created_by_user_name || '',
      formattedTime: activityListData?.complaint_notes?.length === index + 1 ? `${Utility.convertUtcToLocalReadableDate(activityListData?.recorded_date_time)} • ${Utility.convertUTCToLocaltime(
        activityListData?.recorded_date_time
      )}` : `${Utility.convertUtcToLocalReadableDate(activity?.created_at)} • ${Utility.convertUTCToLocaltime(
        activity?.created_at
      )}`,
      note: activity.note || ''
    })) ||
    // .sort((a, b) => {
    //   return b.isSystemGenerated - a.isSystemGenerated
    // })

    []

  const handleEditActivity = (value: ActivityFormData) => {
    setSymptomNoteModal(true)
    setNotes(value?.note)
    setNoteId(value?.note_id ?? '')
  }

  const handleCloseModal = () => {
    setSymptomNoteModal(false)
  }

  const handleUpdateNotes = async (newNotes?: any) => {
    if (!notes?.trim()) {
      Toaster({ type: 'error', message: t('hospital_module.enter_notes_before_updating') })

      return
    }
    setIsUpdating(true)

    try {
      const payload = {
        main_id: temporarilySelected?.complaint_id ?? '',
        med_id: temporarilySelected?.medical_record_id ?? '',
        type: 'COMPLAINT',
        note: notes || '',
        note_id: noteId || '',
        hospital_case_id: id || ''
      }
      const response: UpdateNotesResponse = await updateNotes(payload as UpdateNotesPayload)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || t('hospital_module.notes_updated_successfully') })
        setNotes('')
        setSymptomNoteModal(false)

        const responseNotes: GetSymptomRecordResponse = await fetchNotesForSymptom(temporarilySelected)
        if (responseNotes?.success === true) {
          setActivityListData(responseNotes?.data || [])
        }
      } else {
        Toaster({ type: 'error', message: response?.message || t('hospital_module.failed_to_update_notes') })
      }
    } catch (error) {
      console.error('Error updating notes:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteNotes = async () => {
    if (!notes?.trim()) {
      Toaster({ type: 'error', message: t('hospital_module.enter_notes_to_delete') })

      return
    }
    setIsDeleting(true)

    try {
      const response: DeleteSymptomNotesResponse = await deleteNoteSymptoms(noteId)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || t('hospital_module.notes_deleted_successfully') })
        setNotes('')
        setSymptomNoteModal(false)
        const responseNotes: GetSymptomRecordResponse = await fetchNotesForSymptom(temporarilySelected)
        if (responseNotes?.success === true) {
          setActivityListData(responseNotes?.data || [])
        }
      } else {
        Toaster({ type: 'error', message: response?.message || t('hospital_module.failed_to_delete_notes') })
      }
    } catch (error) {
      console.error('Error deleting notes:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const renderStatusIcon = (statusValue: string) => {
    const isActive = statusValue === 'active'

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
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 1,
            px: 5,
            pt: 4,
            pb: 2,
            borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`,
            backgroundColor: theme.palette.common.white
          }}
        >
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
          sx={{
            flex: 1,
            overflowY: 'auto',
            minHeight: 0
          }}
        >
          <Box
            sx={{
              p: 5,
              background: status === 'closed' ? theme.palette.customColors.mdAntzNeutral : theme.palette.common.white,
              px: 5
            }}
          >
            <Typography
              sx={{ color: theme.palette.customColors.OnPrimaryContainer, fontWeight: 500, fontSize: '16px' }}
            >
              {selectedSymptom?.medical_record_code || 'N/A'}
            </Typography>
            <Typography
              sx={{ color: theme.palette.customColors.OnSurfaceVariant, mb: 3, fontWeight: 400, fontSize: '14px' }}
            >
              {selectedSymptom?.created_by_user_name || selectedSymptom?.additional_info?.resolved_user_name}{' '}
              <Box component='span' sx={{ mx: 2, color: theme.palette.customColors.neutralSecondary }}>•</Box>
              {/* {Utility?.formatDisplayDate(selectedSymptom?.latest_note?.modified_at || selectedSymptom?.created_at)} */}
              {Utility?.formatDisplayDate(selectedSymptom?.created_at)}
              <Box component='span' sx={{ mx: 2, color: theme.palette.customColors.neutralSecondary }}>•</Box>
              {Utility.convertUTCToLocaltime(selectedSymptom?.created_at)}
              {/* {Utility.convertUTCToLocaltime(selectedSymptom?.latest_note?.modified_at || selectedSymptom?.created_at)} */}
            </Typography>

            {!selectedSymptom && (
              <>
                <Typography
                  sx={{ fontWeight: 400, fontSize: '14px', color: theme.palette.customColors.deepDark, pb: 1, mt: 6 }}
                >
                  {t('hospital_module.date_and_time')}
                </Typography>
                <Box sx={{ mb: 6 }}>
                  <MUIDateTimePicker
                    value={recordedDateTime}
                    onChange={(newValue: any) => setRecordedDateTime(newValue)}
                    label=''
                    disabled={status === 'closed'}
                    minDateTime={minDate}
                    maxDateTime={maxDate}
                    ampm={true}
                    format={undefined}
                  />
                </Box>
              </>
            )}

            <Typography
              sx={{ fontWeight: 400, fontSize: '14px', color: theme.palette.customColors.deepDark, pb: 1, mt: 6 }}
            >
              {t('status')}
            </Typography>
            <Select
              value={status}
              onChange={e => setStatus(e.target.value as SymptomStatus)}
              fullWidth
              sx={{
                background: theme.palette.common.white,
                color: theme.palette.common.black,
                mb: 0,
                borderRadius: '4px',
                '& .MuiSelect-select': { py: 4.0 }
              }}
              renderValue={(selected: SymptomStatus) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {renderStatusIcon(selected)}
                  <Typography>{selected === 'active' ? t('hospital_module.active') : t('hospital_module.resolved')}</Typography>
                </Box>
              )}
            >
              <MenuItem value='active'>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {renderStatusIcon('active')}
                  <Typography>{t('hospital_module.active')}</Typography>
                </Box>
              </MenuItem>
              <MenuItem value='closed'>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {renderStatusIcon('closed')}
                  <Typography>{t('hospital_module.resolved')}</Typography>
                </Box>
              </MenuItem>
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
                  {t('hospital_module.severity')}
                </Typography>

                <Select
                  value={severity}
                  onChange={e => setSeverity(e.target.value as Severity)}
                  disabled={status === 'closed'}
                  sx={{
                    backgroundColor: getSymptomsSeverityColor(severity).bgColor,
                    fontWeight: 500,
                    height: 56,
                    borderRadius: '4px',
                    width: '260px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: '1px solid',
                      borderColor: `${getSymptomsSeverityColor(severity).color} !important`
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
                  <MenuItem value='Mild'>{t('hospital_module.severity_mild')}</MenuItem>
                  <MenuItem value='Moderate'>{t('hospital_module.severity_moderate')}</MenuItem>
                  <MenuItem value='High'>{t('hospital_module.severity_high')}</MenuItem>
                  <MenuItem value='Extreme'>{t('hospital_module.severity_extreme')}</MenuItem>
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
                  {t('hospital_module.duration')}
                </Typography>
                <TextField
                  type='number'
                  value={durationValue}
                  disabled={status === 'closed'}
                  onChange={e => {
                    const val = e.target.value
                    if (val === '' || Number(val) >= 0) {
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
                            onChange={e => setDurationUnit(e.target.value as DurationUnit)}
                            variant='standard'
                            disabled={status === 'closed'}
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
                            <MenuItem value='Days'>{t('hospital_module.duration_days')}</MenuItem>
                            <MenuItem value='Weeks'>{t('hospital_module.duration_weeks')}</MenuItem>
                            <MenuItem value='Months'>{t('hospital_module.duration_months')}</MenuItem>
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
              {t('notes')}
            </Typography>
            <TextField
              placeholder={(t('hospital_module.add_notes') as string)}
              disabled={status === 'closed'}
              fullWidth
              multiline
              rows={3}
              //value={notes}
              onChange={e => setNotes(e.target.value)}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: theme.palette.common.white
                }
              }}
            />
          </Box>
          {processedActivities?.length > 0 ? (
            <Box sx={{ pb: 20 }}>
              <Divider color={theme.palette.customColors.OutlineVariant} />
              <ActivityList
                activities={processedActivities}
                onEdit={handleEditActivity}
                activityLoader={activityLoader}
              />
            </Box>
          ) : (
            ''
          )}
        </Box>
        <Box
          sx={{
            position: 'sticky',
            bottom: 0,
            left: 0,
            width: '100%',
            backgroundColor: theme.palette.common.white,
            zIndex: 1,
            flexShrink: 0
          }}
        >
          <SideSheetActionButtons
            addLabel={t('update')}
            cancelLabel={t('cancel')}
            onAdd={handleSave}
            isSubmitLoading={isSubmitLoading}
            onCancel={handleCancel}
            width={260}
            height={50}
            isDisabled={!isChanged}
          />
        </Box>
      </Box>

      <EditNotes
        open={symptomNoteModal}
        onClose={handleCloseModal}
        setNotes={setNotes}
        notes={notes}
        isUpdating={isUpdating}
        isDeleting={isDeleting}
        handleUpdate={handleUpdateNotes}
        handleDelete={handleDeleteNotes}
      />
    </Drawer>
  )
}

export default React.memo(AddEditSymptomDrawer)
