import { alpha, Box, Button, CircularProgress, Drawer, Grid, IconButton, Typography, useTheme } from '@mui/material'
import dayjs from 'dayjs'
import React, { useState } from 'react'
import Icon from 'src/@core/components/icon'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import ControlledTextField from 'src/views/forms/form-fields/ControlledTextField'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useForm } from 'react-hook-form'
import ConfirmationDialog from 'src/components/confirmation-dialog'

const defaultValues = {
  observation_time: dayjs(),
  observation_value: '',
  value_unit: null,
  note: ''
}

const schema = yup.object().shape({
  observation_value: yup.string().required('Observation Value is required'),
  observation_time: yup.string().required('Observation time is required'),
  value_unit: yup.object().required('Unit is required')
})

const EditParamsHistory = ({ open, setOpen }) => {
  const theme = useTheme()

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues,
    shouldUnregister: false,
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  const [updateLoading, setUpdateLoading] = useState(false)
  const [units, setUnits] = useState([])
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const onSubmit = data => {}

  const handleEntryDelete = () => {}

  return (
    <>
      <Drawer
        anchor='right'
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: ['100%', '562px'],
              height: '70vh',
              position: 'fixed',
              right: 0,
              bottom: 0,
              top: 'auto',
              borderTopLeftRadius: 16
            }
          }
        }}
      >
        <Box
          sx={{
            backgroundColor: theme.palette.customColors.OnPrimary,
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Box
            className='sidebar-header'
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: theme.palette.customColors.OnPrimary,
              px: '1.5rem',
              pt: '1.5rem'
            }}
          >
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 500, color: theme.palette.customColors.neutralPrimary }}>
              Edit Selected Entry
            </Typography>

            <IconButton size='small' sx={{ color: 'text.primary' }} onClick={() => setOpen(false)}>
              <Icon icon='mdi:close' fontSize={30} />
            </IconButton>
          </Box>
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 5,
                  px: 6,
                  pt: 6,
                  pb: 4
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Typography
                    sx={{
                      fontSize: '1rem',
                      fontWeight: 500,
                      color: theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    Observation Time
                  </Typography>
                  <ControlledTimePicker control={control} name={'observation_time'} label='Time' />
                </Box>
                <Grid container rowSpacing={4} columnSpacing={3}>
                  <Grid size={{ xs: 12 }}>
                    <Typography
                      sx={{
                        fontSize: '1rem',
                        fontWeight: 500,
                        color: theme.palette.customColors.OnSurfaceVariant
                      }}
                    >
                      Enter Observation
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <ControlledTextField
                      control={control}
                      name={'observation_value'}
                      label={'Enter Value'}
                      errors={errors}
                      required
                      inputBackgroundColor={theme.palette.customColors.Surface}
                      sx={{
                        borderRadius: 1
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <ControlledSelect
                      control={control}
                      errors={errors}
                      label={'Select Unit'}
                      name={'value_unit'}
                      getOptionLabel={option => option.label}
                      getOptionValue={option => option.value}
                      required
                      sx={{
                        backgroundColor: theme.palette.customColors.Surface,
                        borderRadius: 1
                      }}
                    />
                  </Grid>
                  <Grid
                    size={{ xs: 12 }}
                    sx={{ backgroundColor: alpha(theme.palette.customColors.antzNotes, 0.6), p: 4, borderRadius: 1 }}
                  >
                    <ControlledTextField
                      control={control}
                      name={'note'}
                      label='Notes(Optional)'
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { border: 'none' },
                          '&:hover fieldset': { border: 'none' },
                          '&.Mui-focused fieldset': { border: 'none' }
                        },
                        '& .MuiInputBase-input': {
                          backgroundColor: 'transparent'
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: theme.palette.customColors.rusticRed
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
            </form>
          </Box>
          <Box
            sx={{
              p: 4,
              borderTop: `1px solid ${theme.palette.divider}`,
              backgroundColor: 'background.paper',
              display: 'flex',
              justifyContent: 'center',
              gap: 2,
              boxShadow: '0px -1px 30px 0px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Button
              variant='outlined'
              fullWidth
              onClick={() => setOpenDeleteDialog(true)}
              sx={{
                borderColor: theme.palette.customColors.Error,
                color: theme.palette.customColors.Error,
                height: '56px',
                fontWeight: 500
              }}
            >
              Delete Entry
            </Button>
            <Button
              variant='contained'
              fullWidth
              sx={{ height: '56px', backgroundColor: theme.palette.customColors.OnPrimaryContainer }}
            >
              {updateLoading ? <CircularProgress size={24} /> : 'UPDATE'}
            </Button>
          </Box>
        </Box>
      </Drawer>
      {openDeleteDialog && (
        <ConfirmationDialog
          dialogBoxStatus={openDeleteDialog}
          onClose={() => setOpenDeleteDialog(false)}
          description={'Are Your Sure You want to delete this current Entry'}
          cancelText={'CANCEL'}
          cancelBtnStyle={{
            borderColor: theme.palette.customColors.OnPrimaryContainer,
            color: theme.palette.customColors.OnPrimaryContainer
          }}
          confirmBtnStyle={{ background: theme.palette.customColors.Error, py: 2 }}
          image={'/images/warning-icon.svg'}
          imgStyle={{ background: theme.palette.customColors.TertiaryLight, p: 4 }}
          confirmAction={handleEntryDelete}
          loading={deleteLoading}
          ConfirmationText={'DELETE'}
        />
      )}
    </>
  )
}

export default EditParamsHistory
