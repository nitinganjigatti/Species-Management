import React from 'react'
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Grid,
  Card,
  CardContent,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { useForm } from 'react-hook-form'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import ControlledSelectWithTextField from 'src/views/forms/form-fields/ControlledSelectWithTextField'
import ControlledFileUpload from 'src/views/forms/form-fields/ControlledFileUpload'
import ControlledMultiFileUpload from 'src/views/forms/form-fields/ControlledMultiFileUpload'

const AdministerMedicineModal = ({ scheduleDosage, handleSidebarOpen, handleSidebarClose, onSubmit, submitLoader }) => {
  const theme = useTheme()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      time: '',
      quantity: '',
      wastageQuantity: '',
      wastageUnit: '',
      notes: '',
      batchNumber: ''
    }
  })

  const wastageUnits = [
    { label: 'mg', value: 'mg' },
    { label: 'ml', value: 'ml' },
    { label: 'g', value: 'g' }
  ]

  const handleClose = () => {
    reset()
    handleSidebarClose()
  }

  const handleFormSubmit = data => {
    onSubmit(data)
    handleClose()
  }

  const handleSkip = () => {
    handleSidebarClose()
  }

  return (
    <Dialog
      open={handleSidebarOpen}
      onClose={handleClose}
      slotProps={{
        paper: {
          sx: {
            borderRadius: 1,
            maxWidth: '562px'
          }
        }
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: theme.palette.customColors.OnPrimary
        }}
      >
        {/* Title Bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 6,
            borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <img src='/icons/activity_icon.png' style={{ width: '30px', height: '30px' }} alt='Filter Icon' />
              <Typography
                sx={{ fontSize: '1.5rem', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
              >
                Administer medicine
              </Typography>
            </Box>
          </Box>
          <IconButton size='small' onClick={handleClose} sx={{ color: theme.palette.text.primary, p: 0 }}>
            <Icon icon='mdi:close' fontSize={24} />
          </IconButton>
        </Box>

        {/* Medicine Info Section */}
        <Box
          sx={{
            display: 'flex',
            flexFlow: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 6,
            py: 3,
            backgroundColor: theme.palette.customColors.OnPrimary
          }}
        >
          <Typography
            sx={{
              fontSize: '1rem',
              fontWeight: 500,
              color: theme.palette.primary.deepDark
            }}
          >
            Dolo 650 tablet
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarTodayIcon sx={{ fontSize: 18, color: theme.palette.customColors.OnSurfaceVariant }} />
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: theme.palette.customColors.OnSurfaceVariant
                }}
              >
                2 Jan 2025
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
              <AccessTimeIcon sx={{ fontSize: 18, color: theme.palette.customColors.OnSurfaceVariant }} />
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: theme.palette.customColors.OnSurfaceVariant
                }}
              >
                12:00 PM
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Content */}
      <DialogContent sx={{ p: 6 }}>
        <Card
          sx={{
            borderRadius: 1,
            border: `1px solid ${theme.palette.customColors.SurfaceVariant}`,
            boxShadow: 0
          }}
        >
          <CardContent sx={{ p: 6 }}>
            <form onSubmit={handleSubmit(handleFormSubmit)}>
              <Grid container spacing={4}>
                {scheduleDosage ? (
                  <>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <ControlledTimePicker name={'time'} control={control} label='Select Time' format='hh:mm A' />
                    </Grid>
                    <Grid size={{ xs: 12, md: 8 }}>
                      <ControlledSelectWithTextField
                        textFieldName='schedules'
                        selectFieldName='quantity'
                        secondSelectFieldName='wastageUnit'
                        control={control}
                        errors={errors}
                        options={wastageUnits}
                        secondOptions={wastageUnits}
                        label='Quantity'
                        placeholder='Enter quantity'
                        type='number'
                        getOptionLabel={option => option.label}
                        getOptionValue={option => option.value}
                        getSecondOptionLabel={option => option.label}
                        getSecondOptionValue={option => option.value}
                        required
                        selectWidth={{ xs: 50, sm: 80 }}
                        secondSelectWidth={{ xs: 50, sm: 80 }}
                        showEmptyMenuItem={{ xs: false, md: true }}
                        showEmptyMenuItemLabel={{ xs: false, md: true }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Button
                        variant='outlined'
                        fullWidth
                        sx={{
                          fontSize: '1rem',
                          backgroundColor: theme.palette.customColors.displaybgPrimary,
                          color: theme.palette.customColors.OnSurface,
                          border: 'none',
                          borderRadius: '4px',
                          fontWeight: 400,
                          py: '1.125rem'
                        }}
                      >
                        Calculated dosage
                        <Typography
                          component='span'
                          sx={{
                            fontSize: '1.25rem',
                            fontWeight: 500,
                            color: theme.palette.customColors.OnSurfaceVariant,
                            ml: 2
                          }}
                        >
                          310 mg
                        </Typography>
                      </Button>
                    </Grid>
                  </>
                ) : (
                  <>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <ControlledTimePicker
                        name={'time'}
                        control={control}
                        label='Select Time'
                        format='hh:mm A'
                        sx={{ backgroundColor: theme.palette.customColors.Surface }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <ControlledSelectWithTextField
                        textFieldName='schedules'
                        selectFieldName='quantity'
                        control={control}
                        errors={errors}
                        options={wastageUnits}
                        label='Quantity'
                        placeholder='Enter quantity'
                        type='number'
                        getOptionLabel={option => option.label}
                        getOptionValue={option => option.value}
                        required
                        selectWidth={80}
                      />
                    </Grid>
                  </>
                )}

                <Grid xs={12}>
                  <Accordion
                    defaultExpanded={scheduleDosage === undefined}
                    disableGutters
                    sx={{
                      border: 'none',
                      boxShadow: 'none'
                    }}
                  >
                    <AccordionSummary
                      expandIcon={scheduleDosage ? <ExpandMoreIcon /> : null}
                      aria-controls='panel1-content'
                      id='panel1-header'
                      sx={{
                        px: 0,
                        minHeight: 'auto',
                        pointerEvents: scheduleDosage ? 'auto' : 'none', // accordion disable interaction

                        '& .MuiAccordionSummary-content': {
                          margin: '0.5rem 0'
                        },
                        '& .MuiAccordionSummary-content.Mui-expanded': {
                          margin: '0.5rem 0 1rem'
                        }
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '1rem',
                          fontWeight: 500,
                          color: theme.palette.customColors.OnSurfaceVariant
                        }}
                      >
                        Add wastage if any
                        <Typography
                          component='span'
                          sx={{
                            fontSize: '1rem',
                            color: theme.palette.customColors.neutralSecondary,
                            ml: 1
                          }}
                        >
                          (Optional)
                        </Typography>
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 0, py: 1 }}>
                      <Grid container spacing={4}>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <ControlledTextField
                            name='wastageQuantity'
                            control={control}
                            errors={errors}
                            label='Quantity*'
                            placeholder={'Enter Quantity '}
                            type='number'
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                          <ControlledSelect
                            name='wastageUnit'
                            label='Unit'
                            control={control}
                            errors={errors}
                            options={wastageUnits}
                            getOptionLabel={option => option.label}
                            getOptionValue={option => option.value}
                          />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                          <ControlledTextArea
                            label='Notes'
                            name='notes'
                            control={control}
                            errors={errors}
                            placeholder='Enter Notes'
                            rows={3}
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <ControlledTextField
                            name='batchNumber'
                            control={control}
                            errors={errors}
                            label='Batch Number'
                            placeholder='Enter batch number if any (optional)'
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          {/* <ControlledFileUpload
                            name='attachment'
                            control={control}
                            errors={errors}
                            label='Upload attachment'
                          /> */}
                          <ControlledMultiFileUpload
                            name='attachment'
                            control={control}
                            errors={errors}
                            label='Batch Image'
                          />
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </DialogContent>

      <Box
        sx={{
          p: 6,
          display: 'flex',
          justifyContent: 'center',
          gap: 6,
          boxShadow: '0px -2px 6px rgba(0, 0, 0, 0.1)',
          backgroundColor: theme.palette.background.paper
        }}
      >
        {scheduleDosage ? (
          <LoadingButton variant='contained' type='submit' loading={submitLoader} sx={{ flex: 1, py: 2 }}>
            ADMINISTER
          </LoadingButton>
        ) : (
          <>
            <LoadingButton
              variant='outlined'
              type='button'
              loading={submitLoader}
              sx={{ flex: 1, py: 2 }}
              onClick={handleSkip}
            >
              SKIPPED
            </LoadingButton>
            <LoadingButton variant='contained' type='submit' loading={submitLoader} sx={{ flex: 1, py: 2 }}>
              ADMINISTER
            </LoadingButton>
          </>
        )}
      </Box>
    </Dialog>
  )
}

export default AdministerMedicineModal
