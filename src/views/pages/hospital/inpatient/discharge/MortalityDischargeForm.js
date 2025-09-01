import React from 'react'

// ** MUI Imports
import { Box, Divider, Grid, Typography, useTheme, IconButton } from '@mui/material'
import { alpha, styled } from '@mui/system'
import { LoadingButton } from '@mui/lab'

// ** Custom Core Components
import Icon from 'src/@core/components/icon'
import RichTextEditor from 'src/components/RichTextEditor'

// ** Custom Form Components
import ControlledDatePicker from 'src/views/forms/form-fields/ControlledDatePicker'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import ControlledSwitch from 'src/views/forms/form-fields/ControlledSwitch'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledFileUpload from 'src/views/forms/form-fields/ControlledFileUpload'

// ** Utility Components
import { SaveTemplateButton } from 'src/views/utility/render-snippets'

// ** React Hook Form
import { Controller } from 'react-hook-form'

const MortalityDischargeForm = props => {
  const {
    control,
    errors,
    watch,
    onSubmit,
    templates,
    activeTemplate,
    setActiveTemplate,
    necropsyPriorityList,
    deathCauses,
    carcassCondition,
    carcassDeposition,
    content,
    setContent,
    loading,
    setValue
  } = props

  const theme = useTheme()
  const watchRequestNecropsy = watch('requestNecropsy')

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

  const handleTemplateClick = template => {
    setActiveTemplate(template)
    console.log('Template selected:', template)
  }

  return (
    <form noValidate autoComplete='off' onSubmit={onSubmit}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mb: 6 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mb: 4 }}>
          <StyledTypography>Mortality Details</StyledTypography>
          <Grid container spacing={6}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <ControlledDatePicker control={control} name={'dateOfDeath'} label='Date of Death' errors={errors} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <ControlledTimePicker control={control} name={'timeOfDeath'} label='Time of Death' errors={errors} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <ControlledSelect
                control={control}
                name={'causeOfDeath'}
                errors={errors}
                label={'Cause of Death'}
                options={deathCauses}
                getOptionLabel={option => option.label}
                getOptionValue={option => option.value}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <ControlledSelect
                control={control}
                name={'carcassCondition'}
                errors={errors}
                label={'Carcass Condition'}
                options={carcassCondition}
                getOptionLabel={option => option.label}
                getOptionValue={option => option.value}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <ControlledSelect
                control={control}
                name={'carcassDeposition'}
                errors={errors}
                label={'Carcass Deposition'}
                options={carcassDeposition}
                getOptionLabel={option => option.label}
                getOptionValue={option => option.value}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Summary Section */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            p: 5,
            backgroundColor: alpha(theme.palette.customColors.displaybgPrimary, 0.4),
            borderRadius: 1
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
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
                    onClick={() => handleTemplateClick(template)}
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

        {/* Necropsy Section */}
        <Grid container spacing={4} alignItems='center'>
          <Grid
            size={{ xs: 12, sm: 6, md: 6 }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              justifyContent: {
                xs: 'space-between',
                sm: 'flex-start'
              }
            }}
          >
            <StyledTypography fontSize={'1.25rem'}>Request Necropsy</StyledTypography>

            <ControlledSwitch
              name={'requestNecropsy'}
              label={watchRequestNecropsy ? 'Yes' : 'No'}
              control={control}
              errors={errors}
              gap={4}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 6 }}>
            {watchRequestNecropsy === true ? (
              <ControlledSelect
                control={control}
                name={'necropsyPriority'}
                errors={errors}
                label={'Select Priority'}
                fullWidth
                options={necropsyPriorityList}
                getOptionLabel={option => option.label}
                getOptionValue={option => option.value}
              />
            ) : (
              <ControlledTextField
                control={control}
                errors={errors}
                label={'Enter reason why necropsy will not be performed'}
                name={'noNecropsyReason'}
                placeholder={'Enter Reason'}
                fullWidth
              />
            )}
          </Grid>
        </Grid>
        <Divider />

        {/* Attachments */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <StyledTypography>Attachments</StyledTypography>
          {/* <ControlledFileUpload name={'attachment'} control={control} errors={errors} label='Upload attachment' /> */}
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
          zIndex: 1200
        }}
      >
        <LoadingButton
          variant='contained'
          sx={{ backgroundColor: theme.palette.primary.main, px: 6.5, py: 2, borderRadius: 0.5, fontWeight: 400 }}
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

export default MortalityDischargeForm

const StyledTypography = styled(Typography)(({ theme, fontWeight, fontSize, color }) => ({
  fontSize: fontSize || '1rem',
  fontWeight: fontWeight || 500,
  color: color || theme.palette.customColors.OnSurfaceVariant
}))
