'use client'

import React, { useState } from 'react'
import { Box, Chip, Tooltip, Typography } from '@mui/material'
import { alpha, useTheme, Theme } from '@mui/material/styles'
import { useParams } from 'next/navigation'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import useHospitalColorUtils from 'src/hooks/useHospitalColorUtils'
import { MedicalIdChip } from '../utility/hospitalSnippets'
import Utility from 'src/utility'
import AddEditSymptomDrawer from 'src/components/hospital/drawer/AddEditSymptomDrawer'
import { updateSymptoms, getNotesListForSymptom } from 'src/lib/api/hospital/symptoms'
import Toaster from 'src/components/Toaster'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { GetSymptomRecordPayload, GetSymptomRecordResponse, UpdateSymptomsCardPayload } from 'src/types/hospital/api/Inpatient/symptoms'
import { Id, Severity, SymptomStatus } from 'src/types/hospital/models'
import { AddSymptomsCard, SymptomList, SymptomRecords, UpdateSymptomsCard } from 'src/types/hospital/models/symptoms'
import { DurationUnit } from 'src/types/hospital/models'
import { SymptomsCardProps } from 'src/types/hospital/components/symptoms'
import { UpdateSymptomsCardFormData, PreviousDetails } from 'src/types/hospital/components/symptoms'

const SymptomsCard = ({ record, isResolved, fetchSymptoms, setPage, patientData, isDischared }: SymptomsCardProps) => {
  const { t } = useTranslation()
  const theme = useTheme<Theme>()
  const params = useParams()
  const id = (params?.id as string) ?? ''

  const [symptomDrawerNewOpen, setSymptomDrawerNewOpen] = useState<boolean>(false)
  const [selectedSymptoms, setSelectedSymptoms] = useState<UpdateSymptomsCardFormData | null>(null)
  const [severity, setSeverity] = useState<Severity>('Mild')
  const [durationValue, setDurationValue] = useState<number | string>(0)
  const [durationUnit, setDurationUnit] = useState<DurationUnit>('Days')
  const [notes, setNotes] = useState<string>('')
  const [noteId, setNoteId] = useState<Id>('')
  const [status, setStatus] = useState<SymptomStatus>('')
  const [temporarilySelected, setTemporarilySelected] = useState<SymptomList | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false)
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false)
  const [activityLoader, setactivityLoader] = useState<boolean>(false)
  const [activityListData, setActivityListData] = useState<SymptomRecords | null>(null)
  const [symptomNoteModal, setSymptomNoteModal] = useState<boolean>(false)
  const [isUpdating, setIsUpdating] = useState<boolean>(false)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const [pendingDetails, setPendingDetails] = useState<UpdateSymptomsCardFormData| null>(null)
  const [previousDetails, setPreviousDetails] = useState<PreviousDetails | null>(null)
  const { getSymptomsSeverityColor } = useHospitalColorUtils()

  const handleClickDetail = async (recordData: SymptomList) => {
    try {
      setactivityLoader(true)
      setSymptomDrawerNewOpen(true)

      const mappedSeverity =
        recordData?.additional_info?.severity === 'Mild'
          ? 'Mild'
          : recordData?.additional_info?.severity === 'Moderate'
          ? 'Moderate'
          : recordData?.additional_info?.severity

      // Format recorded_date_time as string
      const recordedDateTime = recordData?.additional_info?.recorded_date_time || recordData?.created_at
      const localDateTime = dayjs(recordedDateTime).format('YYYY-MM-DD HH:mm:ss')
      setPreviousDetails({
        severity: mappedSeverity,
        durationValue: recordData?.additional_info?.duration || 0,
        durationUnit: recordData?.additional_info?.duration_unit,
        status: recordData?.status,
        recordedDateTime: localDateTime
      })
      setSeverity(mappedSeverity)
      setDurationValue(
        recordData?.additional_info?.duration === 'null' ||
          recordData?.additional_info?.duration == null ||
          recordData?.additional_info?.duration === ''
          ? 0
          : recordData?.additional_info?.duration
      )
      setDurationUnit(recordData?.additional_info?.duration_unit)
      setStatus(recordData?.status)
      setTemporarilySelected(recordData)

      const response = await fetchNotesForSymptom(recordData)
      if (response?.success) {
        setActivityListData(response?.data || [])
      } else {
        Toaster({ type: 'error', message: response?.message || (t('hospital_module.failed_to_fetch_notes') as string) })
      }
    } catch (error) {
      Toaster({ type: 'error', message: t('hospital_module.error_fetching_notes') as string })
    } finally {
      setactivityLoader(false)
    }
  }

  const fetchNotesForSymptom = async (recordData: SymptomList | null) => {
    const params: GetSymptomRecordPayload = {
      entity: 'complaint',
      medical_id: recordData?.medical_record_id,
      record_id: recordData?.complaint_id
    }

    try {
      const response = await getNotesListForSymptom(params)

      return response
    } catch (error) {
      console.error('Error fetching notes for symptom:', error)
      throw error
    }
  }

  const cancelSymptomSelection = () => {
    setSymptomDrawerNewOpen(false)
  }

  const addSymptomDetails = (details: UpdateSymptomsCardFormData) => {
    setPendingDetails(details)
    // setIsDeleteDialogOpen(true)
    handleConfirmAddSymptom(details)
  }

  const isChanged =
    previousDetails?.severity !== severity ||
    previousDetails?.durationValue !== durationValue ||
    previousDetails?.durationUnit !== durationUnit ||
    previousDetails?.status !== status

    const canEnableButton = isChanged || notes?.trim()?.length > 0

    const handleConfirmAddSymptom = async (pendingDetails: UpdateSymptomsCardFormData) => {
      if (!pendingDetails) return

      try {
        setDeleteLoading(true)

        // Check if date/time was changed
        const dateChanged = previousDetails?.recordedDateTime !== pendingDetails?.recordedDateTime

      const isSystemGenerated = isChanged ? true : false

      const payload: UpdateSymptomsCardPayload = {
        main_id: temporarilySelected?.complaint_id || '',
        med_id: temporarilySelected?.medical_record_id || '' ,
        animal_id: patientData?.animal_detail?.animal_id || '',  
        type: 'COMPLAINT',
        is_system_generated: isSystemGenerated ? 1 : 0,
        severity: pendingDetails?.severity,
        duration: pendingDetails?.durationValue == 0 ? '' : pendingDetails?.durationValue || '',
        duration_unit: pendingDetails?.durationUnit,
        status: pendingDetails?.status,
        note: pendingDetails?.notes,
        hospital_case_id: id,
        recorded_date_time: pendingDetails?.recordedDateTime || temporarilySelected?.additional_info?.recorded_date_time || new Date().toISOString()
      }

      const response = await updateSymptoms(payload)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || (t('hospital_module.symptom_updated_successfully') as string) })

        setSelectedSymptoms(pendingDetails)
        setSymptomDrawerNewOpen(false)
        fetchSymptoms('', 1, false)
        setPage(1)
        setDeleteLoading(false)
      } else {
        Toaster({ type: 'error', message: response?.message || (t('hospital_module.failed_to_update_symptom') as string) })
        setDeleteLoading(false)
      }
    } catch (error) {
      Toaster({ type: 'error', message: t('hospital_module.error_updating_symptom') as string })
    } finally {
      setIsDeleteDialogOpen(false)
      setPendingDetails(null)
      setDeleteLoading(false)
    }
  }

  const handleDeleteDialogClose = () => {
    setIsDeleteDialogOpen(false)
    setPendingDetails(null)
  }

  const hasData = (data: unknown) =>
    (Array.isArray(data) && data?.length > 0) || (data && typeof data === 'object' && Object.keys(data)?.length > 0)

  const formatDurationUnit = (value: number | string,
  unit: string) => {
    if (!unit) return ''

    return Number(value) === 1 || Number(value) === 0 ? unit.replace(/s$/i, '') : unit;
  }

  return (
    <Box
      sx={{
        borderRadius: '8px',
        padding: { xs: '16px', sm: '20px', md: '24px' },
        backgroundColor: isResolved
          ? alpha(theme.palette.customColors.neutralSecondary ?? '', 0.05)
          : getSymptomsSeverityColor(
              record?.additional_info?.severity === 'Mild'
                ? 'Mild'
                : record?.additional_info?.severity === 'Moderate'
                ? 'Moderate'
                : record?.additional_info?.severity
            ).bgColor
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: '1fr 2fr',
            md: '1fr 2fr 1fr'
          },
          gap: { xs: 1.5, sm: 2 },
          alignItems: { xs: 'flex-start', sm: 'center' }
        }}
        onClick={() => (isDischared ? null : handleClickDetail(record))}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <MedicalIdChip
            leftImage
            medId={record?.medical_record_code || (t('na') as string)}
            rightDot={patientData?.medical_record_code === record?.medical_record_code}
            dotColor={theme.palette.primary.main}
            textColor={theme.palette.customColors.OnSurface}
          />
          <Typography
            sx={{
              textDecoration: isResolved ? 'line-through' : 'none',
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
              color: isResolved
                ? theme.palette.customColors.OnSurfaceVariant
                : getSymptomsSeverityColor(
                    record?.additional_info?.severity === 'Mild'
                      ? 'Mild'
                      : record?.additional_info?.severity === 'Moderate'
                      ? 'Moderate'
                      : record?.additional_info?.severity
                  ).color,
              fontWeight: 500
            }}
          >
            {record.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip
              label={record?.additional_info?.severity}
              size='small'
              sx={{
                backgroundColor: theme.palette.customColors.OnPrimary,
                border: `1px solid ${theme.palette.customColors.mdAntzNeutral}`,
                color: isResolved
                  ? theme.palette.customColors.neutralSecondary
                  : getSymptomsSeverityColor(
                      record?.additional_info?.severity === 'Mild'
                        ? 'Mild'
                        : record?.additional_info?.severity === 'Moderate'
                        ? 'Moderate'
                        : record?.additional_info?.severity
                    ).color,
                borderRadius: '4px',
                fontSize: '0.875rem',
                fontWeight: 500
              }}
            />

            {record?.additional_info?.duration &&
              record?.additional_info?.duration !== '0' &&
              record?.additional_info?.duration !== 'null' && (
                <Box
                  component='span'
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    color: theme.palette.customColors.OnSurfaceVariant
                  }}
                >
                  {record?.additional_info?.duration}{' '}
                  {formatDurationUnit(record?.additional_info?.duration, record?.additional_info?.duration_unit)}
                </Box>
              )}
          </Box>
        </Box>

        <Box sx={{ gridColumn: { xs: '1', sm: '2', md: '2' } }}>
          {Number(record?.comment_count ?? 0) > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
              <Typography sx={{ fontSize: '0.875rem', color: theme.palette.customColors.neutralSecondary }}>
                {t('hospital_module.activity')}:
              </Typography>

              <Typography sx={{ fontSize: '1rem', color: theme.palette.customColors.OnSurface, fontWeight: 600 }}>
                {record?.comment_count === '1' ? '1' : '+' + (Number(record?.comment_count ?? 0) - 1)}
              </Typography>
            </Box>
          )}

          {record?.additional_info &&
          (hasData(record?.latest_note?.notes_dump?.new_data) || hasData(record?.latest_note?.notes_dump?.old_data)) ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 0.5,
                flexWrap: 'wrap'
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  color: theme.palette.customColors.OnSurfaceVariant
                }}
              >
                {t('hospital_module.severity')} :{' '}
              </Typography>
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 400 }}>
                <Box component='span' sx={{ color: theme.palette.customColors.secondaryBg }}>
                  {record?.latest_note?.notes_dump?.old_data?.severity}
                </Box>
                {record?.latest_note?.notes_dump?.old_data?.severity && (
                  <Box component='span' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}> → </Box>
                )}
                <Box component='strong' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
                  {record?.latest_note?.notes_dump?.new_data?.severity || record?.additional_info?.severity}
                </Box>
              </Typography>
            </Box>
          ) : (
            <Typography
              sx={{
                fontSize: '0.875rem',
                color: theme.palette.customColors.OnSurfaceVariant
              }}
            >
              {t('hospital_module.severity')} :{' '}
              <Box component='strong' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
                {record?.additional_info?.severity}
              </Box>
            </Typography>
          )}

          {record?.latest_note?.note && (
            <Tooltip
              title={
                <Box sx={{ whiteSpace: 'pre-wrap' }}>
                  {record?.latest_note?.note}
                </Box>
              }
              arrow
              placement='top'
            >
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  color: theme.palette.customColors.OnSurfaceVariant,
                  mb: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                  lineHeight: '1.4',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {t('hospital_module.notes_label')} : {record?.latest_note?.note}
              </Typography>
            </Tooltip>
          )}

          <Typography sx={{ fontSize: '0.75rem', color: theme.palette.customColors.neutralSecondary }}>
            {t('hospital_module.last_updated')}:{' '}
            {Number(record?.comment_count ?? 0) > 1 ? `${Utility?.convertUtcToLocalReadableDate(
              record?.latest_note?.modified_at || record?.created_at || record?.latest_note?.created_at
            )} • ${Utility.convertUTCToLocaltime(
              record?.latest_note?.modified_at || record?.created_at || record?.latest_note?.created_at
            )}` : `${Utility?.convertUtcToLocalReadableDate(record?.additional_info?.recorded_date_time)} • ${Utility.convertUTCToLocaltime(
              record?.additional_info?.recorded_date_time
            )}`}
          </Typography>
        </Box>

        {record.created_by_user_name && (
          <Box
            sx={{
              gridColumn: { xs: '1', sm: '1 / span 2', md: '3' },
              mt: { xs: 1, md: 0 },
              borderTop: { xs: `1px solid ${alpha(theme.palette.divider, 0.1)}`, md: 'none' },
              pt: { xs: 1.5, md: 0 }
            }}
          >
            <Typography
              sx={{
                mb: { xs: 1, md: 2 },
                color: theme.palette.customColors.neutralSecondary,
                fontSize: '0.75rem',
                ml: { xs: 0, md: 1 }
              }}
            >
              {record?.status === 'active'
                ? record?.latest_note?.modified_at?.slice(0, 19) === record?.created_at
                  ? t('hospital_module.created_by')
                  : t('hospital_module.updated_by')
                : t('hospital_module.resolved_by')}
            </Typography>
            <UserAvatarDetails
              profile_image={
                record?.status === 'active'
                  ? record?.created_user_profile_pic
                  : record?.additional_info?.resolved_user_profile_pic
              }
              user_name={record?.additional_info?.resolved_user_name || record?.created_by_user_name}
              date={
                record?.status === 'active'
                  ? Number(record?.comment_count ?? 0) > 1 ? record?.latest_note?.modified_at || record?.created_at || record?.latest_note?.created_at : record?.additional_info?.recorded_date_time
                  : record?.latest_note?.modified_at || record?.additional_info?.closed_comment_date
              }
              show_time
              compact={true}
            />
          </Box>
        )}
      </Box>

      {symptomDrawerNewOpen && (
        <AddEditSymptomDrawer
          open={symptomDrawerNewOpen}
          onClose={cancelSymptomSelection}
          selectedSymptom={temporarilySelected}
          severity={severity}
          setSeverity={setSeverity}
          durationValue={durationValue}
          setDurationValue={setDurationValue}
          durationUnit={durationUnit}
          setDurationUnit={setDurationUnit}
          notes={notes}
          status={status}
          setStatus={setStatus}
          setNotes={setNotes}
          setNoteId={setNoteId}
          noteId={noteId}
          onSave={addSymptomDetails}
          isSubmitLoading={deleteLoading}
          activityListData={activityListData}
          activityLoader={activityLoader}
          temporarilySelected={temporarilySelected}
          setSymptomNoteModal={setSymptomNoteModal}
          symptomNoteModal={symptomNoteModal}
          fetchNotesForSymptom={fetchNotesForSymptom}
          setIsUpdating={setIsUpdating}
          isUpdating={isUpdating}
          setIsDeleting={setIsDeleting}
          isDeleting={isDeleting}
          setActivityListData={setActivityListData}
          isChanged={canEnableButton}
          admittedDate={patientData?.admitted_at}
          dischargedDate={patientData?.discharge_at}
          isDischarged={patientData?.status === 'discharge'}
        />
      )}
      {isDeleteDialogOpen && (
        <ConfirmationDialog
          dialogBoxStatus={isDeleteDialogOpen}
          onClose={handleDeleteDialogClose}
          title={(t('hospital_module.save_changes_confirmation') as string)}
          cancelText={t('cancel')}
          confirmBtnStyle={{ background: theme.palette.primary.main, py: 2 }}
          image={'/images/warning-icon.svg'}
          imgStyle={{ background: theme.palette.customColors.mdAntzNeutral, p: 4 }}
          confirmAction={handleConfirmAddSymptom as any}
          loading={deleteLoading}
          ConfirmationText={t('yes')}
          description={''}
        />
      )}
    </Box>
  )
}

export default SymptomsCard
