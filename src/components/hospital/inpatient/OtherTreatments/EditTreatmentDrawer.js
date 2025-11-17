import React, { useEffect } from 'react'
import dayjs from 'dayjs'
import { Box, Button, Drawer, IconButton, Skeleton, Typography } from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'
import { Icon } from '@iconify/react'
import { Controller, useForm } from 'react-hook-form'

import MUIDatePicker from 'src/views/forms/form-fields/MUIDatePicker'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'

const EditTreatmentDrawer = ({
  open,
  onClose,
  treatment,
  formData,
  onChange,
  onUpdate,
  onDelete,
  onActivityPrefill,
  activities = [],
  isActivitiesLoading = false,
  isSubmitting = false,
  formatTimestamp,
  formatShortDate
}) => {
  const { control, reset } = useForm({
    defaultValues: {
      editNotes: formData.notes || '',
      startDate: formData.startDate || dayjs()
    }
  })

  useEffect(() => {
    reset({
      editNotes: formData.notes || '',
      startDate: formData.startDate || dayjs()
    })
  }, [formData.notes, formData.startDate, reset, open])

  if (!treatment) return null

  const commonFieldStyles = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '8px',
      backgroundColor: '#FFFFFF'
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: '#C3CEC7'
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: '#A3B3AA'
    },
    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#37BD69'
    }
  }

  const activityList = activities || []

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor='right'
      sx={{
        '& .MuiDrawer-paper': {
          width: 540,
          maxWidth: '100%',
          backgroundColor: '#FFFFFF'
        }
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF' }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px',
            height: '77px',
            borderBottom: '1px solid #C3CEC7'
          }}
        >
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: '24px',
              color: '#44544A'
            }}
          >
            Edit Treatment
          </Typography>
          <IconButton onClick={onClose} sx={{ color: '#1F515B', mr: -1 }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px' }}>
            <Box>
              <Typography
                sx={{
                  fontWeight: 500,
                  fontSize: '24px',
                  color: '#44544A',
                  mb: '4px'
                }}
              >
                {treatment.name}
              </Typography>
              <Typography
                sx={{
                  color: '#44544A',
                  fontWeight: 400,
                  fontSize: '14px'
                }}
              >
                {treatment.clinician?.name || '—'} • {formatTimestamp(treatment.lastUpdated)}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Typography
                  sx={{
                    fontWeight: 400,
                    fontSize: '14px',
                    color: '#000000'
                  }}
                >
                  Treatment Start Date
                </Typography>
                <Controller
                  name='startDate'
                  control={control}
                  defaultValue={formData.startDate || dayjs()}
                  render={({ field }) => (
                    <MUIDatePicker
                      value={field.value}
                      onChange={value => {
                        field.onChange(value)
                        onChange('startDate', value)
                      }}
                      label=''
                      format='DD MMM YYYY'
                      sx={{
                        ...commonFieldStyles,
                        '& .MuiOutlinedInput-root': {
                          ...(commonFieldStyles['& .MuiOutlinedInput-root'] || {}),
                          height: '56px'
                        },
                        '& .MuiInputBase-input': {
                          fontWeight: 500,
                          fontSize: '16px',
                          color: '#44544A'
                        }
                      }}
                    />
                  )}
                />
              </Box>

              <ControlledTextArea
                name='editNotes'
                label=''
                control={control}
                errors={{}}
                rows={4}
                placeholder='Add notes'
                onChangeOverride={event => onChange('notes', event?.target?.value || '')}
                inputBackgroundColor='#FFFFFF'
                sx={{
                  ...commonFieldStyles,
                  '& .MuiOutlinedInput-root': {
                    ...(commonFieldStyles['& .MuiOutlinedInput-root'] || {}),
                    minHeight: '120px'
                  }
                }}
              />
            </Box>
          </Box>

          <Box
            sx={{
              borderTop: '1px solid #C3CEC7',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: '24px'
            }}
          >
            <Typography
              sx={{
                fontWeight: 500,
                fontSize: '20px',
                color: '#44544A'
              }}
            >
              Activity
            </Typography>

            {isActivitiesLoading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[1, 2].map(item => (
                  <Skeleton key={`activity-skeleton-${item}`} variant='rounded' height={96} sx={{ borderRadius: '8px' }} />
                ))}
              </Box>
            ) : activityList.length === 0 ? (
              <Typography
                sx={{
                  color: '#7A8684',
                  fontWeight: 400,
                  fontSize: '14px'
                }}
              >
                No activity records available.
              </Typography>
            ) : (
              activityList.map(activity => {
                const isSelected = formData?.activeActivityId === activity.id

                if (activity.isEditable) {
                  return (
                    <Box
                      key={activity.id}
                      role='button'
                      tabIndex={0}
                      onClick={() => onActivityPrefill?.(activity)}
                      onKeyDown={event => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          onActivityPrefill?.(activity)
                        }
                      }}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        borderRadius: '8px',
                        padding: '12px',
                        border: `1px solid ${isSelected ? '#37BD69' : '#FCF4AE'}`,
                        backgroundColor: isSelected ? '#DFF5E7' : '#FCF4AE66',
                        cursor: 'pointer'
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          gap: '8px',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start'
                        }}
                      >
                        <Typography
                          sx={{
                            color: '#44544A',
                            fontWeight: 400,
                            fontSize: '14px'
                          }}
                        >
                          {activity.note || activity.description || 'No notes recorded.'}
                        </Typography>
                        <IconButton
                          size='small'
                          sx={{ color: '#44544A', p: 1 }}
                          onClick={event => {
                            event.stopPropagation()
                            onActivityPrefill?.(activity)
                          }}
                        >
                          <Icon icon='mdi:pencil-outline' />
                        </IconButton>
                      </Box>
                      <Typography
                        sx={{
                          color: '#7A8684',
                          fontWeight: 400,
                          fontSize: '12px',
                          lineHeight: '100%'
                        }}
                      >
                        {activity.author} • {formatTimestamp(activity.timestamp)}
                      </Typography>
                    </Box>
                  )
                }

                return (
                  <Box
                    key={activity.id}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      borderRadius: '8px',
                      padding: '16px',
                      backgroundColor: '#EFF5F2'
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <Typography
                        sx={{
                          color: '#44544A',
                          fontWeight: 500,
                          fontSize: '16px'
                        }}
                      >
                        {activity.treatmentName || activity.title || 'Treatment Activity'}
                      </Typography>
                      {activity.medicalRecordCode ? (
                        <Typography
                          sx={{
                            color: '#7A8684',
                            fontWeight: 400,
                            fontSize: '12px'
                          }}
                        >
                          Medical Record: {activity.medicalRecordCode}
                        </Typography>
                      ) : null}
                      <Typography
                        sx={{
                          color: '#7A8684',
                          fontWeight: 400,
                          fontSize: '12px',
                          lineHeight: '100%'
                        }}
                      >
                        {activity.author} • {formatTimestamp(activity.timestamp)}
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        color: '#44544A',
                        fontWeight: 400,
                        fontSize: '12px'
                      }}
                    >
                      Treatment Start Date:{' '}
                      <Box component='span' sx={{ fontWeight: 600 }}>
                        {formatShortDate(activity.treatmentStartDate)}
                      </Box>
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <Typography
                        sx={{
                          color: '#7A8684',
                          fontWeight: 400,
                          fontSize: '12px'
                        }}
                      >
                        Notes
                      </Typography>
                      <Typography
                        sx={{
                          color: '#44544A',
                          fontWeight: 400,
                          fontSize: '14px'
                        }}
                      >
                        {activity.note || 'No notes recorded.'}
                      </Typography>
                    </Box>
                  </Box>
                )
              })
            )}
          </Box>
        </Box>

        <Box
          sx={{
            boxShadow: '0px -1px 30px 0px #0000001A',
            minHeight: '104px',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            backgroundColor: '#FFFFFF'
          }}
        >
          <Button
            variant='outlined'
            fullWidth
            onClick={onDelete}
            sx={{
              height: '56px',
              borderRadius: '8px',
              borderColor: '#E93353',
              color: '#E93353',
              borderWidth: '1px',
              fontWeight: 600,
              '&:hover': {
                borderColor: '#C41C3D',
                backgroundColor: '#FCE8EC'
              }
            }}
          >
            Delete
          </Button>
          <Button
            variant='contained'
            fullWidth
            onClick={onUpdate}
            disabled={isSubmitting || !formData?.activeActivityId}
            sx={{
              height: '56px',
              borderRadius: '8px',
              fontWeight: 600,
              backgroundColor: '#1F515B',
              boxShadow: '0px 4px 8px -4px #4C4E646B',
              '&:hover': {
                backgroundColor: '#173D44'
              }
            }}
          >
            {isSubmitting ? 'Updating...' : 'Update'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

export default EditTreatmentDrawer
