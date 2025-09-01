import React from 'react'

// ** MUI Imports
import { Box, Button, Divider, Grid, Typography, useTheme, IconButton } from '@mui/material'
import { alpha, styled } from '@mui/system'
import { LoadingButton } from '@mui/lab'

// ** Custom Core Components
import Icon from 'src/@core/components/icon'
import RichTextEditor from 'src/components/RichTextEditor'

// ** Custom Form Components
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import ControlledDatePicker from 'src/views/forms/form-fields/ControlledDatePicker'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import MUICheckbox from 'src/views/forms/form-fields/MUICheckbox'
import ControlledSwitch from 'src/views/forms/form-fields/ControlledSwitch'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledFileUpload from 'src/views/forms/form-fields/ControlledFileUpload'

// ** Table Component
import CommonTable from 'src/views/table/data-grid/CommonTable'

// ** Utility Components
import { SaveTemplateButton } from 'src/views/utility/render-snippets'

// ** React Hook Form
import { Controller } from 'react-hook-form'

const EnclosureDischargeForm = ({
  control,
  errors,
  templates,
  activeTemplate,
  setActiveTemplate,
  content,
  setContent,
  medicationsData,
  medicationColumns,
  loading,
  onSubmit,
  watch,
  setValue
}) => {
  const theme = useTheme()

  const images = watch('images') || []
  const fileInputRef = React.useRef()

  // Remove image from preview
  const handleRemoveImage = index => {
    const updatedImages = images.filter((_, i) => i !== index)
    setValue('images', updatedImages, { shouldValidate: true })
  }

  // Handle file selection
  const handleFilesChange = files => {
    if (!files || files.length === 0) return

    const validFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) {
        alert('Please select only image files')

        return false
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB')

        return false
      }

      return true
    })
    const newImages = validFiles.map(file => URL.createObjectURL(file))
    if (newImages.length > 0) {
      setValue('images', [...images, ...newImages], { shouldValidate: true })
    }
  }

  return (
    <form noValidate autoComplete='off' onSubmit={onSubmit}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mb: 6 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <StyledTypography>Select location to transfer</StyledTypography>
          <Grid container spacing={6}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <ControlledSelect
                control={control}
                name='transferSite'
                errors={errors}
                label='Site'
                options={[]}
                getOptionLabel={option => option.label}
                getOptionValue={option => option.value}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <ControlledSelect
                control={control}
                name='transferSection'
                errors={errors}
                label='Section'
                options={[]}
                getOptionLabel={option => option.label}
                getOptionValue={option => option.value}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <ControlledSelect
                control={control}
                name='transferEnclosure'
                errors={errors}
                label='Enclosure'
                options={[]}
                getOptionLabel={option => option.label}
                getOptionValue={option => option.value}
              />
            </Grid>
          </Grid>

          <MUICheckbox
            name='returnToOriginal'
            control={control}
            label='Transfer back to animal’s original location'
            labelStyle={{
              fontSize: '1rem',
              fontWeight: '400',
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mt: 4 }}>
            <StyledTypography>Discharge Date & Time</StyledTypography>
            <Grid container spacing={6}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <ControlledDatePicker control={control} name='dischargeDate' label='Date' errors={errors} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <ControlledTimePicker control={control} name='dischargeTime' label='Time' errors={errors} />
              </Grid>
            </Grid>
          </Box>
        </Box>

        {/* Summary & Templates */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            p: 5,
            background: alpha(theme.palette.customColors.displaybgPrimary, 0.4),
            borderRadius: 1,
            mb: 2
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <StyledTypography>Enter summary</StyledTypography>
              <RichTextEditor value={content} onChange={setContent} placeholder='Write something amazing...' />
            </Box>
            <SaveTemplateButton sx={{ pl: 1 }} />
          </Box>
          {/* Templates Section */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <StyledTypography fontWeight={400}>Select from templates</StyledTypography>
              <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <StyledTypography fontWeight={600} color={theme.palette.primary.dark}>
                  See all
                </StyledTypography>
                <Icon icon='mingcute:right-fill' color={theme.palette.primary.dark} fontSize={24} />
              </Box>
            </Box>
            {/* Template */}
            <Box
              sx={{
                flex: '1 1 auto',
                minWidth: 0,
                overflowX: 'auto',
                scrollbarColor: 'transparent transparent',
                paddingBottom: 0
              }}
            >
              <Box sx={{ display: 'inline-flex', gap: 3, pr: 1 }}>
                {templates.map(template => (
                  <Box
                    key={template}
                    onClick={() => setActiveTemplate(template)}
                    sx={{
                      pb: 0,
                      flexShrink: 0,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      px: 6,
                      py: 2,
                      borderRadius: '4px',
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
                        whiteSpace: 'nowrap',
                        fontWeight: activeTemplate === template ? 600 : 400
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

        <Divider />

        {/* Follow-up Section */}
        <Grid container alignItems='center' spacing={2} justifyContent='space-between'>
          <Grid size={{ xs: 12, sm: 6 }}>
            <ControlledSwitch
              name='followUpRequired'
              label={<StyledTypography fontSize='1.25rem'>Is any follow up required?</StyledTypography>}
              labelPosition='start'
              control={control}
              errors={errors}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Grid container spacing={2} alignItems='center'>
              <Grid size={{ xs: 'auto' }}>
                <StyledTypography fontWeight={400}>Enter follow up date</StyledTypography>
              </Grid>
              <Grid
                sx={{
                  flexGrow: {
                    xs: 1,
                    sm: 1
                  },
                  flexBasis: {
                    xs: 'auto',
                    sm: 0
                  }
                }}
              >
                <ControlledDatePicker control={control} name='followUpDate' label='Date' errors={errors} />
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        <Divider />

        {/* Medications */}
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: {
                xs: 'flex-start',
                md: 'center'
              },
              flexDirection: {
                xs: 'column',
                sm: 'row'
              },
              justifyContent: {
                xs: 'flex-start',
                sm: 'space-between'
              },
              gap: {
                xs: 3,
                md: 0
              }
            }}
          >
            <StyledTypography fontSize='1.25rem'>Medications</StyledTypography>
            <Box sx={{ display: 'flex', gap: 4 }}>
              <Button variant='contained'>Add New Prescription</Button>
              <Button variant='outlined' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
                Continue Prescriptions
              </Button>
            </Box>
          </Box>
          <CommonTable
            columns={medicationColumns}
            loading={loading}
            indexedRows={medicationsData}
            rowHeight={64}
            externalTableStyle={{
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: theme.palette.customColors.neutral05,
                fontSize: '0.75rem',
                fontWeight: 600,
                color: theme.palette.customColors.OnSurfaceVariant
              }
            }}
          />
        </Box>

        <Divider />

        {/* Care Instructions */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <StyledTypography fontSize='1.25rem'>Care Instructions</StyledTypography>

          <ControlledTextField
            control={control}
            name={'dietInstructions'}
            errors={errors}
            placeholder={'Enter text'}
            label='Enter diet instructions'
          />
          <ControlledTextField
            control={control}
            name={'restrictions'}
            errors={errors}
            placeholder={'Enter text'}
            label='Enter restriction activities with duration'
          />
          <ControlledTextField
            sx={{ backgroundColor: alpha(theme.palette.customColors.antzNotes, 0.6) }}
            placeholder={'Enter text'}
            control={control}
            name={'additionalNotes'}
            errors={errors}
            label=' Additional notes'
          />
        </Box>

        <Divider />

        {/* Attachments */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <StyledTypography>Attachments</StyledTypography>
          {/* <ControlledFileUpload name='attachment' control={control} errors={errors} label='Upload attachment' /> */}
          <Box>
            {images.length > 0 && (
              <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {images.map((img, index) => {
                  const previewUrl = typeof img === 'string' ? img : URL.createObjectURL(img)

                  return (
                    <Box
                      key={index}
                      sx={{
                        position: 'relative',
                        width: 100,
                        height: 100,
                        borderRadius: 1,
                        backgroundColor: '#eaf6f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <img
                        src={previewUrl}
                        alt={`img-${index}`}
                        style={{
                          width: 80,
                          height: 80,
                          objectFit: 'cover',
                          borderRadius: '50%',
                          display: 'block'
                        }}
                      />
                      <IconButton
                        size='small'
                        sx={{
                          position: 'absolute',
                          top: 6,
                          right: 6,
                          backgroundColor: '#979797',
                          color: '#fff',
                          width: 24,
                          height: 24,
                          zIndex: 1,
                          '&:hover': {
                            backgroundColor: '#757575'
                          }
                        }}
                        onClick={e => {
                          e.stopPropagation()
                          handleRemoveImage(index)
                        }}
                      >
                        <Icon icon='mdi:close' fontSize={18} />
                      </IconButton>
                    </Box>
                  )
                })}
              </Box>
            )}

            <Controller
              name='images'
              control={control}
              render={({ fieldState: { error } }) => (
                <Box>
                  <Box
                    sx={{
                      border: `2px dashed ${error ? theme.palette.error.main : '#E0E0E0'}`,
                      borderRadius: 1,
                      p: 4,
                      textAlign: 'center',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2,
                      '&:hover': {
                        backgroundColor: '#F5F5F5',
                        borderColor: error ? theme.palette.error.main : '#BDBDBD'
                      }
                    }}
                    onClick={() => fileInputRef.current.click()}
                    onDrop={e => {
                      e.preventDefault()
                      handleFilesChange(e.dataTransfer.files)
                    }}
                    onDragOver={e => e.preventDefault()}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.6,
                        gap: 2
                      }}
                    >
                      <img src='/images/housing/gallery-add.svg' alt='Add Image Icon' width='30px' />
                      <StyledTypography fontWeight={400} color={theme.palette.customColors.OnSurfaceVariant60}>
                        Drop your images here
                      </StyledTypography>
                    </Box>

                    <input
                      type='file'
                      accept='image/*'
                      multiple
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      onChange={e => handleFilesChange(e.target.files)}
                    />
                  </Box>
                  {error && (
                    <Typography variant='caption' color='error' sx={{ mt: 1, display: 'block' }}>
                      {error.message}
                    </Typography>
                  )}
                </Box>
              )}
            />
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: {
            xs: 0,
            lg: '270px'
          },
          right: 0,
          width: 'auto',
          backgroundColor: theme.palette.customColors.OnPrimary,
          p: 6,
          boxShadow: `0px -2px 8px ${theme.palette.customColors.shadowColor}`,
          display: 'flex',
          justifyContent: 'flex-end',
          zIndex: 1200,
          borderRadius: '6px 6px 0 0'
        }}
      >
        <LoadingButton
          variant='contained'
          sx={{ backgroundColor: theme.palette.primary.main, px: 20, py: 4, borderRadius: 0.5 }}
          disabled={loading}
          loading={loading}
          type='submit'
        >
          Discharge Animal
        </LoadingButton>
      </Box>
    </form>
  )
}

export default EnclosureDischargeForm

const StyledTypography = styled(Typography)(({ theme, fontWeight, fontSize, color }) => ({
  fontSize: fontSize || '1rem',
  fontWeight: fontWeight || 500,
  color: color || theme.palette.customColors.OnSurfaceVariant
}))
