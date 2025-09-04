import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip
} from '@mui/material'
import { useForm } from 'react-hook-form'
import { useTheme } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import AddIcon from '@mui/icons-material/Add'
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'

const AdministerMedicineModal = ({ open, onClose, medicineData, onSubmit }) => {
  const theme = useTheme()
  const [selectedFile, setSelectedFile] = useState(null)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      time: '12:00 PM',
      quantity: '350',
      wastageQuantity: '',
      wastageUnit: 'mg',
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
    setSelectedFile(null)
    onClose()
  }

  const handleFormSubmit = data => {
    const submissionData = {
      ...data,
      batchImage: selectedFile
    }
    onSubmit(submissionData)
    handleClose()
  }

  const handleFileSelect = event => {
    const file = event.target.files[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleSkip = () => {
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='sm'
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          backgroundColor: theme.palette.customColors.Background,
          maxWidth: '562px',
          margin: 'auto'
        }
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#FFFFFF',
          borderBottom: `0.5px solid ${theme.palette.customColors.OutlineVariant}`
        }}
      >
        {/* Title Bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            p: 3,
            borderBottom: `0.5px solid ${theme.palette.customColors.OutlineVariant}`
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 0.5,
                borderRadius: 1
              }}
            >
              <LocalPharmacyIcon sx={{ fontSize: 24, color: theme.palette.customColors.OnSurfaceVariant }} />
            </Box>
            <Typography
              variant='h6'
              sx={{
                fontSize: '24px',
                fontWeight: 500,
                color: theme.palette.customColors.OnSurfaceVariant,
                fontFamily: 'Inter'
              }}
            >
              Administer medicine
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton onClick={handleClose} sx={{ p: 1.25 }}>
            <CloseIcon sx={{ fontSize: 14, color: '#1F515B' }} />
          </IconButton>
        </Box>

        {/* Medicine Info Section */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 3,
            py: 1.25,
            backgroundColor: '#FFFFFF'
          }}
        >
          <Typography
            sx={{
              fontSize: '16px',
              fontWeight: 500,
              color: '#000000',
              fontFamily: 'Inter',
              flexGrow: 1
            }}
          >
            {medicineData?.name || 'Dolo 650 tablet'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
              <CalendarTodayIcon sx={{ fontSize: 18, color: theme.palette.customColors.OnSurfaceVariant }} />
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: theme.palette.customColors.OnSurfaceVariant,
                  fontFamily: 'Inter'
                }}
              >
                2 Jan 2025
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
              <AccessTimeIcon sx={{ fontSize: 18, color: theme.palette.customColors.OnSurfaceVariant }} />
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: theme.palette.customColors.OnSurfaceVariant,
                  fontFamily: 'Inter'
                }}
              >
                12:00 PM
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Content */}
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          <Card
            sx={{
              borderRadius: 2,
              border: `1px solid ${theme.palette.customColors.SurfaceVariant}`,
              backgroundColor: '#FFFFFF'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <form onSubmit={handleSubmit(handleFormSubmit)}>
                {/* Time and Quantity Row */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Typography
                      sx={{
                        fontSize: '16px',
                        fontWeight: 400,
                        color: theme.palette.customColors.OnSurfaceVariant,
                        fontFamily: 'Inter',
                        mb: 1
                      }}
                    >
                      Time
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '56px',
                        px: 2,
                        borderRadius: 1,
                        border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                        backgroundColor: theme.palette.customColors.Surface
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '20px',
                          fontWeight: 500,
                          color: theme.palette.customColors.OnSurfaceVariant,
                          fontFamily: 'Inter'
                        }}
                      >
                        12 : 00 PM
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography
                      sx={{
                        fontSize: '16px',
                        fontWeight: 400,
                        color: theme.palette.customColors.OnSurfaceVariant,
                        fontFamily: 'Inter',
                        mb: 1
                      }}
                    >
                      Quantity
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        height: '56px',
                        px: 2,
                        borderRadius: 1,
                        border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                        backgroundColor: theme.palette.customColors.neutral05
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '20px',
                          fontWeight: 500,
                          color: theme.palette.customColors.OnSurfaceVariant,
                          fontFamily: 'Inter'
                        }}
                      >
                        350
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '16px',
                          fontWeight: 400,
                          color: theme.palette.customColors.OnSurfaceVariant,
                          fontFamily: 'Inter'
                        }}
                      >
                        mg
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Wastage Section */}
                <Box sx={{ mb: 2 }}>
                  <Typography
                    sx={{
                      fontSize: '16px',
                      fontWeight: 400,
                      color: theme.palette.customColors.OnSurfaceVariant,
                      fontFamily: 'Inter',
                      mb: 2
                    }}
                  >
                    Add wastage if any{' '}
                    <Typography
                      component='span'
                      sx={{
                        fontSize: '14px',
                        color: theme.palette.customColors.neutralSecondary
                      }}
                    >
                      (Optional)
                    </Typography>
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <ControlledTextField
                        name='wastageQuantity'
                        control={control}
                        errors={errors}
                        placeholder='Quantity'
                        size='large'
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            height: '56px'
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <ControlledSelect
                        name='wastageUnit'
                        control={control}
                        errors={errors}
                        options={wastageUnits}
                        getOptionLabel={option => option.label}
                        getOptionValue={option => option.value}
                        size='large'
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            height: '56px'
                          }
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>

                {/* Notes Field */}
                <Box sx={{ mb: 2 }}>
                  <ControlledTextArea
                    name='notes'
                    control={control}
                    errors={errors}
                    placeholder='Enter Notes'
                    rows={3}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        minHeight: '86px',
                        alignItems: 'flex-start',
                        pt: 1.5
                      }
                    }}
                  />
                </Box>

                {/* Batch Number Field */}
                <Box sx={{ mb: 2 }}>
                  <ControlledTextField
                    name='batchNumber'
                    control={control}
                    errors={errors}
                    placeholder='Enter batch number if any (optional)'
                    size='large'
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        height: '56px'
                      }
                    }}
                  />
                </Box>

                {/* Batch Image Upload */}
                <Box sx={{ mb: 3 }}>
                  <Box
                    component='label'
                    htmlFor='batch-image-upload'
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1.25,
                      py: 1,
                      borderRadius: 2.5,
                      border: `1px dashed ${theme.palette.customColors.OutlineVariant}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: theme.palette.customColors.neutral05
                      }
                    }}
                  >
                    <AddIcon sx={{ fontSize: 32, color: theme.palette.customColors.OnSurfaceVariant60 }} />
                    <Typography
                      sx={{
                        fontSize: '16px',
                        fontWeight: 400,
                        color: theme.palette.customColors.OnSurfaceVariant60,
                        fontFamily: 'Inter'
                      }}
                    >
                      {selectedFile ? selectedFile.name : 'Batch image'}
                    </Typography>
                  </Box>
                  <input
                    id='batch-image-upload'
                    type='file'
                    accept='image/*'
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                  />
                </Box>
              </form>
            </CardContent>
          </Card>
        </Box>
      </DialogContent>

      {/* Footer Actions */}
      <Box
        sx={{
          display: 'flex',
          gap: 3,
          p: 3,
          backgroundColor: '#FFFFFF',
          boxShadow: '0 -1px 30px 0 rgba(0, 0, 0, 0.10)'
        }}
      >
        <Button
          variant='outlined'
          onClick={handleSkip}
          sx={{
            flex: 1,
            height: '56px',
            borderRadius: 2,
            borderColor: theme.palette.customColors.OnSurfaceVariant,
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '15px',
            fontWeight: 500,
            textTransform: 'uppercase',
            fontFamily: 'Inter',
            '&:hover': {
              borderColor: theme.palette.customColors.OnSurfaceVariant,
              backgroundColor: theme.palette.customColors.neutral05
            }
          }}
        >
          SKIPPED
        </Button>
        <Button
          variant='contained'
          onClick={handleSubmit(handleFormSubmit)}
          sx={{
            flex: 1,
            height: '56px',
            borderRadius: 2,
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.customColors.OnPrimary,
            fontSize: '15px',
            fontWeight: 500,
            textTransform: 'uppercase',
            fontFamily: 'Inter',
            boxShadow: '0 4px 8px -4px rgba(76, 78, 100, 0.42)',
            '&:hover': {
              backgroundColor: theme.palette.primary.dark
            }
          }}
        >
          ADMINISTER
        </Button>
      </Box>
    </Dialog>
  )
}

export default AdministerMedicineModal
