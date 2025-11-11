import React, { useCallback, useState } from 'react'
import { Button, Typography, styled, Box, useTheme, Grid, IconButton, Tooltip } from '@mui/material'
import Icon from 'src/@core/components/icon'
import { Add as AddIcon } from '@mui/icons-material'

// ** Form & Validation Setup
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'

import AddGasDrawer from './AddGasDrawer'
import AddReversalDrug from './AddReversalDrug'
import ControlledAutocomplete from 'src/views/forms/form-fields/ControlledAutocomplete'
import ControlledSelect from 'src/views/forms/form-fields/ControlledSelect'
import ControlledTimePicker from 'src/views/forms/form-fields/ControlledTimePicker'
import ControlledTextArea from 'src/views/forms/form-fields/ControlledTextArea'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import TextEllipsisWithModal from 'src/components/TextEllipsisWithModal'

const drugData = [
  {
    id: 1,
    drug_name: 'Ketamine 100 MG Tablet',
    amount: '10 mg',
    route: 'Intramuscular',
    delivery_time: '12:00 AM',
    delivery: 'Completed',

    notes: 'Time taken for effect looks normal'
  },
  {
    id: 2,
    drug_name: 'Acepromazine',
    amount: '10 mg',
    route: 'Intramuscular',
    delivery_time: '12:00 AM',
    delivery: 'Completed'
  }
]

// Validation Schema
const schema = yup.object().shape({
  recovery_type: yup.string().required('Recovery Type is required'),
  recovery_first_effect: yup.date().nullable().required('Recovery 1st Effect is required'),
  recovery_full_effect: yup.date().nullable().required('Recovery Full Effect is required'),
  notes: yup.string().trim().required('Notes is required'),
  induction: yup.string().required('Induction is required'),
  tolerance: yup.string().required('Tolerance  is required'),
  recovery: yup.string().required('Recovery is required'),
  overall: yup.string().required('Overall is required')
})
function RecoveryAndReversal() {
  const theme = useTheme()
  const [openDrawer, setOpenDrawer] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)

  // Default Form Values
  const defaultValues = {
    drug_name: null,
    recovery_first_effect: null,
    recovery_full_effect: null,
    notes: '',
    induction: '',
    tolerance: '',
    recovery: '',
    overall: ''
  }

  const {
    reset,
    control,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
    shouldUnregister: false,
    mode: 'onBlur',
    reValidateMode: 'onChange'
  })

  // Add Medications /Gas handler
  const handleSubmitData = useCallback(async payload => {
    setSubmitLoader(true)
    try {
      alert(JSON.stringify(payload))
    } catch (error) {
      console.error('Error adding data:', error)
    } finally {
      setSubmitLoader(false)
      setOpenDrawer(null)
    }
  }, [])

  const drugColumns = [
    {
      field: 'id',
      headerName: 'Sl.NO',
      minWidth: 80,
      flex: 1,
      sortable: false,
      renderCell: params => <StyledTypography>{params.row.id}</StyledTypography>
    },
    {
      field: 'drug_name',
      headerName: 'Drug',
      minWidth: 220,
      flex: 1,
      sortable: false,
      renderCell: params => (
        <TextEllipsisWithModal
          enableDialog={false}
          text={params.row.drug_name ?? '-'}
          style={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '14px',
            fontWeight: 500,
            pl: 2,
            maxWidth: '200px'
          }}
        />
      )
    },

    {
      field: 'amount',
      headerName: 'Amount',
      minWidth: 100,
      sortable: false,
      renderCell: params => <StyledTypography>{params.row.amount}</StyledTypography>
    },
    {
      field: 'route',
      headerName: 'Route',
      minWidth: 140,
      sortable: false,
      renderCell: params => <StyledTypography>{params.row.route}</StyledTypography>
    },
    {
      field: 'delivery_time',
      headerName: 'Delivery Time',
      minWidth: 130,
      sortable: false,
      renderCell: params => <StyledTypography>{params.row.delivery_time}</StyledTypography>
    },
    {
      field: 'delivery',
      headerName: 'Delivery',
      minWidth: 120,
      sortable: false,
      renderCell: params => <StyledTypography>{params.row.delivery}</StyledTypography>
    },
    {
      field: 'recovery_full_effect',
      headerName: 'Max.Effect',
      minWidth: 130,
      sortable: false,
      renderCell: params => <StyledTypography>{params.row.delivery_time}</StyledTypography>
    },

    {
      field: 'actions',
      headerName: 'Actions',
      headerAlign: 'center',
      align: 'center',
      width: 120,
      sortable: false,
      renderCell: params => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title='Edit'>
            <IconButton size='small' onClick={() => {}}>
              <Icon icon='mdi:pencil-outline' fontSize={20} color={theme.palette.customColors.OnSurfaceVariant} />
            </IconButton>
          </Tooltip>

          <Tooltip title='Delete'>
            <IconButton size='small' onClick={() => {}}>
              <Icon icon='mdi:delete-outline' fontSize={20} color={theme.palette.customColors.Error} />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ]

  return (
    <Box sx={{ p: '0 24px 24px 24px' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
        <Typography
          sx={{
            fontSize: '1rem',
            fontWeight: 600,
            color: theme.palette.customColors.OnSurfaceVariant
          }}
        >
          Recovery and reversal
        </Typography>
        <Button
          variant='outlined'
          endIcon={<AddIcon />}
          onClick={() => setOpenDrawer(true)}
          sx={{
            flex: 1,
            py: '8px',
            borderRadius: '8px',
            borderColor: theme.palette.primary.main,
            fontSize: '1rem',
            fontWeight: 500
          }}
        >
          Add Reversal Drug
        </Button>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <StyledTypography fontSize={'1rem'}>Reversal drug</StyledTypography>
        <Button variant='contained' endIcon={<AddIcon />} onClick={() => setOpenDrawer(true)}>
          Add New{' '}
        </Button>
      </Box>

      {/* {drawerType === 'medication' && ( */}
      <CommonTable
        columns={drugColumns}
        // loading={loading}
        indexedRows={drugData}
        rowHeight={64}
        total={drugData?.length || 0}
        externalTableStyle={{
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: theme.palette.customColors.Background,
            fontSize: '0.75rem',
            fontWeight: 600,
            color: theme.palette.customColors.OnSurfaceVariant
          }
        }}
      />
      {/* )} */}

      <Box sx={{ width: '100%' }}>
        <form autoComplete='off' onSubmit={submitLoader ? undefined : handleSubmit()}>
          <Grid container spacing={6}>
            <Grid size={{ xs: 4 }}>
              <ControlledSelect
                control={control}
                name='recovery_type'
                errors={errors}
                label='Recovery Type*'
                options={[]}
                getOptionLabel={option => option.label}
                getOptionValue={option => option.value}
              />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <ControlledTimePicker
                control={control}
                name={'recovery_first_effect'}
                label='Recovery 1st Effect*'
                errors={errors}
              />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <ControlledTimePicker
                control={control}
                name={'recovery_full_effect'}
                label='Recovery Full Effect*'
                errors={errors}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <ControlledTextArea
                name='notes'
                control={control}
                placeholder='Enter notes'
                fullWidth={true}
                minRows={2}
                inputBackgroundColor={theme.palette.customColors.Notes}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <StyledTypography fontSize={'1rem'}>Anaesthesia ratings</StyledTypography>
            </Grid>
            <Grid size={{ xs: 3 }}>
              <ControlledSelect
                control={control}
                name='induction'
                errors={errors}
                label='Induction*'
                options={[]}
                getOptionLabel={option => option.label}
                getOptionValue={option => option.value}
              />
            </Grid>
            <Grid size={{ xs: 3 }}>
              <ControlledSelect
                control={control}
                name='tolerance'
                errors={errors}
                label='Tolerance*'
                options={[]}
                getOptionLabel={option => option.label}
                getOptionValue={option => option.value}
              />
            </Grid>
            <Grid size={{ xs: 3 }}>
              <ControlledSelect
                control={control}
                name='recovery'
                errors={errors}
                label='Recovery*'
                options={[]}
                getOptionLabel={option => option.label}
                getOptionValue={option => option.value}
              />
            </Grid>
            <Grid size={{ xs: 3 }}>
              <ControlledSelect
                control={control}
                name='overall'
                errors={errors}
                label='Overall*'
                options={[]}
                getOptionLabel={option => option.label}
                getOptionValue={option => option.value}
              />
            </Grid>
          </Grid>
        </form>
      </Box>

      {/* Drawer component */}
      {openDrawer && (
        <AddReversalDrug
          handleSidebarOpen={openDrawer}
          handleSubmitData={handleSubmitData}
          handleSidebarClose={() => setOpenDrawer(null)}
          submitLoader={submitLoader}
        />
      )}
    </Box>
  )
}

export default RecoveryAndReversal

const StyledTypography = styled(Typography)(({ theme, fontWeight, fontSize, color, sx = {} }) => ({
  fontSize: fontSize || '14px',
  fontWeight: fontWeight || 500,
  color: color || theme.palette.customColors.OnSurfaceVariant,
  paddingLeft: '8px',
  ...sx
}))
