import React, { useState } from 'react'
import { Box, Card, Grid, Typography, Avatar, TextField, Button, IconButton } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Icon } from '@iconify/react'
import ControlledDatePicker from 'src/views/forms/form-fields/ControlledDatePicker'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import ControlledMultiFileUpload from 'src/views/forms/form-fields/ControlledMultiFileUpload'
import RichTextEditor from 'src/components/RichTextEditorTwo'

// Save Template UI Component
const SaveTemplateUI = ({ onClose, onSave, loading = false }) => {
  const theme = useTheme()
  const [templateName, setTemplateName] = useState('')

  const handleSave = async () => {
    if (!templateName.trim() || loading) return

    const success = await onSave(templateName.trim())

    if (success) {
      setTemplateName('')
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: { xs: 'start', sm: 'center' },
        gap: '16px',
        flexDirection: { xs: 'column', sm: 'row' }
      }}
    >
      <TextField
        size='small'
        placeholder='Enter template name'
        value={templateName}
        onChange={e => setTemplateName(e.target.value)}
        sx={{
          maxWidth: '413px',
          minWidth: { xs: '100%', sm: '200px' },
          height: '48px',
          flex: 1,
          borderRadius: '4px',
          borderColor: theme.palette.customColors.OutlineVariant,
          backgroundColor: theme.palette.customColors.Surface,
          '& .MuiOutlinedInput-root': {
            height: '48px',
            '& fieldset': {}
          }
        }}
      />
      <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <Button
          variant='contained'
          onClick={handleSave}
          disabled={loading || !templateName.trim()}
          startIcon={
            <Avatar
              src='/icons/FloppyDisk.svg'
              variant='square'
              sx={{
                objectFit: 'contain',
                height: '24px',
                width: '24px',
                filter: 'brightness(0) invert(1)'
              }}
            />
          }
          sx={{
            height: '48px',
            width: '104px',
            backgroundColor: theme.palette.primary.main,
            color: 'white',
            borderRadius: '6px',
            textTransform: 'uppercase',
            fontWeight: 500,
            fontSize: 15,
            '&:hover': {
              backgroundColor: theme.palette.primary.dark
            }
          }}
        >
          {loading ? 'Saving...' : 'Save'}
        </Button>
        <IconButton
          onClick={onClose}
          sx={{
            color: theme.palette.primary.light,
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.04)'
            }
          }}
        >
          <Icon icon='mdi:close' fontSize={19} />
        </IconButton>
      </Box>
    </Box>
  )
}

const SurgeryRecordForm = ({
  control,
  errors,
  templates,
  activeTemplate,
  setActiveTemplate,
  setOpenSurgeryTemplateDrawer,
  setOpenAddAnaesthesiaDrawer,
  richNote,
  onRichNoteChange = () => {},
  isSubmitting = false,
  procedureOptions = [],
  procedureLoading = false,
  onProcedureInputChange = () => {},
  onProcedureClear = () => {},
  procedureGetOptionLabel = option => option?.label || '',
  procedureIsOptionEqualToValue = (option, value) => option?.value === value?.value,
  onSaveTemplate = async () => false,
  isSavingTemplate = false,
  clearFieldErrors
}) => {
  const theme = useTheme()
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)

  const handleSaveTemplate = async templateName => {
    const success = await onSaveTemplate(templateName)

    if (success) {
      setShowSaveTemplate(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Card sx={{ p: '16px 24px 24px 24px', borderRadius: '8px' }}>
        <Grid container spacing={'24px'}>
          <Grid item size={{ xs: 12 }}>
            <Typography
              sx={{
                fontWeight: 500,
                fontSize: '20px',
                letterSpacing: 0,
                color: theme.palette.customColors.OnSurfaceVariant
              }}
            >
              Date and time of surgery
            </Typography>
          </Grid>
          <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
            <ControlledDatePicker
              sx={{ width: '100%' }}
              name={'date'}
              label='Date *'
              control={control}
              renderInput={params => (
                <ControlledTextField {...params} fullWidth error={!!errors.date} helperText={errors.date?.message} />
              )}
            />
          </Grid>
          <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
            <ControlledTimePicker
              label='Start Time *'
              name={'startTime'}
              control={control}
              renderInput={params => (
                <ControlledTextField
                  {...params}
                  fullWidth
                  error={!!errors.startTime}
                  helperText={errors.startTime?.message}
                />
              )}
            />
          </Grid>
          <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
            <ControlledTimePicker
              name={'endTime'}
              control={control}
              label='End Time *'
              renderInput={params => (
                <ControlledTextField
                  {...params}
                  fullWidth
                  error={!!errors.endTime}
                  helperText={errors.endTime?.message}
                />
              )}
            />
          </Grid>
          <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
            <ControlledTextField
              name={'duration'}
              label='Duration *'
              control={control}
              errors={errors}
              onChangeOverride={() => clearFieldErrors?.('duration')}
            />
          </Grid>
        </Grid>
      </Card>

      <Card sx={{ display: 'flex', flexDirection: 'column', gap: '24px', p: '16px 24px', borderRadius: '8px' }}>
        <Typography
          sx={{
            fontWeight: 500,
            fontSize: '20px',
            letterSpacing: 0,
            color: theme.palette.customColors.OnSurfaceVariant
          }}
        >
          Surgery details
        </Typography>
        <Grid container spacing={2}>
          <Grid item size={{ xs: 12, sm: 6, md: 4 }}>
            <ControlledAutocomplete
              control={control}
              errors={errors}
              name={'procedure'}
              label='Procedure *'
              options={procedureOptions}
              loading={procedureLoading}
              onInputChange={onProcedureInputChange}
              onItemClear={onProcedureClear}
              getOptionLabel={procedureGetOptionLabel}
              isOptionEqualToValue={procedureIsOptionEqualToValue}
              onChangeOverride={() => clearFieldErrors?.('procedure')}
            />
          </Grid>
          <Grid item size={{ xs: 12, sm: 6, md: 4 }}>
            <ControlledTextField
              name={'typeOfSurgery'}
              label='Type of surgery *'
              control={control}
              errors={errors}
              onChangeOverride={() => clearFieldErrors?.('typeOfSurgery')}
            />
          </Grid>
          <Grid item size={{ xs: 12, sm: 6, md: 4 }}>
            <ControlledTextField
              name={'surgicalApproach'}
              label='Surgical approach *'
              control={control}
              errors={errors}
              onChangeOverride={() => clearFieldErrors?.('surgicalApproach')}
            />
          </Grid>
        </Grid>

        <Box
          sx={{
            backgroundColor: '#E8F4F266',
            padding: '20px',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Typography
              sx={{
                fontWeight: 500,
                fontSize: '16px',
                letterSpacing: 0,
                color: theme.palette.customColors.OnSurfaceVariant
              }}
            >
              Enter surgery notes
            </Typography>

            {/* <ControlledTextArea placeholder={'Enter text'} control={control} name={'notes'} rows={3} errors={errors} /> */}

            <RichTextEditor value={richNote} onChange={onRichNoteChange} placeholder='Enter text...' />
          </Box>

          {showSaveTemplate ? (
            <SaveTemplateUI
              onClose={() => setShowSaveTemplate(false)}
              onSave={handleSaveTemplate}
              loading={isSavingTemplate}
            />
          ) : (
            <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center', mb: '8px', cursor: 'pointer' }}>
              <Avatar
                src='/icons/FloppyDisk.svg'
                variant='square'
                sx={{ objectFit: 'contain', height: '24px', width: '24px' }}
              />
              <Typography
                onClick={() => setShowSaveTemplate(true)}
                sx={{
                  fontWeight: 600,
                  fontSize: '16px',
                  letterSpacing: 0,
                  color: theme.palette.primary.dark
                }}
              >
                Save as template
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography
                sx={{
                  fontWeight: 400,
                  fontSize: '16px',
                  letterSpacing: 0,
                  color: theme.palette.customColors.OnSurfaceVariant
                }}
              >
                Select from templates
              </Typography>
              <Box
                onClick={() => setOpenSurgeryTemplateDrawer(true)}
                sx={{ display: 'flex', gap: '12px', alignItems: 'center', cursor: 'pointer' }}
              >
                <Typography sx={{ color: theme.palette.primary.dark }}>See all</Typography>
                <Icon icon='fa:angle-right' color={theme.palette.primary.dark} fontSize={24} />
              </Box>
            </Box>
            {/* LEFT: takes remaining space + horizontal scroll */}
            <Box
              sx={{
                flex: '1 1 auto',
                minWidth: 0,
                overflowX: 'auto',
                scrollbarColor: 'transparent transparent'
              }}
            >
              <Box sx={{ display: 'inline-flex', gap: '10px', pr: 1 }}>
                {templates.map(template => (
                  <Box
                    key={template}
                    onClick={() => setActiveTemplate(template)}
                    sx={{
                      flexShrink: 0,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      px: '16px',
                      height: '48px',
                      borderRadius: '8px',
                      backgroundColor:
                        activeTemplate === template
                          ? theme.palette.secondary.dark
                          : theme.palette.customColors.mdAntzNeutral,
                      cursor: 'pointer'
                    }}
                  >
                    <Typography
                      sx={{
                        color:
                          activeTemplate === template
                            ? theme.palette.primary.contrastText
                            : theme.palette.customColors.neutralPrimary,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {template}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>

        <ControlledTextField
          name={'complication'}
          control={control}
          errors={errors}
          label={'Complication *'}
          onChangeOverride={() => clearFieldErrors?.('complication')}
        />
      </Card>

      {/* <Card sx={{ borderRadius: '8px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Typography
          sx={{
            fontWeight: 500,
            fontSize: '20px',
            letterSpacing: 0,
            color: theme.palette.customColors.OnSurfaceVariant
          }}
        >
          Anaesthesia details
        </Typography>
        <Box
          onClick={() => setOpenAddAnaesthesiaDrawer(true)}
          sx={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            height: '54px',
            paddingTop: '17px',
            paddingBottom: '18px',
            paddingLeft: '4px',
            borderRadius: '4px',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: '4px',
              background: `
               linear-gradient(90deg, ${theme.palette.customColors.Outline} 0px 5px, transparent 5px 13px) 0 0 / 13px 1px,
               linear-gradient(180deg, ${theme.palette.customColors.Outline} 0px 5px, transparent 5px 13px) calc(100% - 1px) 0 / 1px 13px,
               linear-gradient(270deg, ${theme.palette.customColors.Outline} 0px 5px, transparent 5px 13px) 0 calc(100% - 1px) / 13px 1px,
               linear-gradient(0deg, ${theme.palette.customColors.Outline} 0px 5px, transparent 5px 13px) 0 0 / 1px 13px
             `,
              backgroundRepeat: 'repeat-x, repeat-y, repeat-x, repeat-y',
              pointerEvents: 'none'
            }
          }}
        >
          <Icon icon='mdi:plus' color={theme.palette.customColors.OnSurfaceVariant} fontSize={24} />
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: '16px',
              letterSpacing: 0,
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            Add anaesthesia record{' '}
          </Typography>
        </Box>
      </Card> */}

      <Card sx={{ borderRadius: '8px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Typography
          sx={{
            fontWeight: 500,
            fontSize: '24px',
            letterSpacing: 0,
            color: theme.palette.customColors.OnSurfaceVariant
          }}
        >
          Care Instructions
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: '16px',
              letterSpacing: 0,
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            Enter diet instructions
          </Typography>
          <ControlledTextField control={control} name={'dietInstructions'} errors={errors} placeholder={'Enter text'} />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: '16px',
              letterSpacing: 0,
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            Enter restriction activities with duration
          </Typography>
          <ControlledTextField control={control} name={'restrictions'} errors={errors} placeholder={'Enter text'} />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: '16px',
              letterSpacing: 0,
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            Additional notes
          </Typography>
          <ControlledTextField
            sx={{ borderRadius: '12px', backgroundColor: '#FCF4AE99' }}
            placeholder={'Enter text'}
            control={control}
            name={'additionalNotes'}
            errors={errors}
          />
        </Box>
      </Card>

      <Card
        sx={{
          borderRadius: '8px',
          padding: '24px',
          paddingTop: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}
      >
        <Typography
          sx={{
            fontWeight: 500,
            fontSize: '20px',
            letterSpacing: 0,
            color: theme.palette.customColors.OnSurfaceVariant
          }}
        >
          Attachments
        </Typography>

        <ControlledMultiFileUpload
          name='attachments'
          control={control}
          label='Upload files'
          acceptedFileTypes='images,pdf,csv,audio,videos'
        />
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type='submit' variant='contained' disabled={isSubmitting} sx={{ minWidth: 160 }}>
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </Box>
    </Box>
  )
}

export default SurgeryRecordForm
