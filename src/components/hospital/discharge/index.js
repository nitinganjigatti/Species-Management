import React from 'react'
import { Box, Button, Grid, IconButton, Tooltip, alpha, useTheme } from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import { styled, Typography } from '@mui/material'
import Icon from 'src/@core/components/icon'

// Import the business logic hook
import MortalityDischarge from './MortalityDischarge'
import MortalityDischargeForm from 'src/views/pages/hospital/inpatient/discharge/MortalityDischargeForm'
import TransferDischargeForm from 'src/views/pages/hospital/inpatient/discharge/TransferDischargeForm'
import EnclosureDischargeForm from 'src/views/pages/hospital/inpatient/discharge/EnclosureDischargeForm'
import TreatmentTypeRadioButtons from 'src/views/pages/hospital/utility/TreatmentTypeRadioButtons'
import TransferHospitalDischarge from './TransferHospitalDischarge'
import TransferEnclosureDischarge from './TransferEnclosureDischarge'

const dischargeTypeOptions = [
  { label: 'Mortality', value: 'Mortality' },
  { label: 'Transfer to Hospital', value: 'TransferHospital' },
  { label: 'Transfer to Enclosure', value: 'TransferEnclosure' }
]

const medicationsData = [
  {
    id: 1,
    MedicineName: 'Levothyroxine',
    BrandName: 'Synthroid',
    DosageTimesFrequency: '3 Times / Everyday',
    StartingDate: '2025-01-07',
    EndingDate: '2025-01-11',
    Duration: '5 Days',
    DeliveryRoute: 'Oral'
  },
  {
    id: 2,
    MedicineName: 'Acepromazine',
    BrandName: 'Antiemetic',
    DosageTimesFrequency: '2 Times / Everyday',
    StartingDate: '2025-01-05',
    EndingDate: '2025-01-09',
    Duration: '4 Days',
    DeliveryRoute: 'Oral'
  }
]

const InpatientDischarge = ({ patientData }) => {
  const theme = useTheme()

  // Initialize the mortality business logic hook
  const {
    causeOfDeath,
    carcassCondition,
    carcassDeposition,
    handleMannerSearch,
    handleConditionSearch,
    handleDispositionSearch,
    submitLoader: mortalitySubmitLoader,
    fetchLoading: mortalityFetchLoading,
    error: mortalityError,
    handleSubmitData: handleMortalitySubmitData,
    resetForm: resetMortalityForm
  } = MortalityDischarge()

  const {
    hospital,
    handleHospitalSearch,
    submitLoader: transferHospitalSubmitLoader,
    fetchLoading: transferHospitalFetchLoading,
    error: transferHospitalError,
    handleSubmitData: handleTransferHospitalSubmitData,
    resetForm: resetTransferHospitalForm
  } = TransferHospitalDischarge()

  const {
    submitLoader: transferEnclosureSubmitLoader,
    fetchLoading: transferEnclosureFetchLoading,
    error: transferEnclosureError,
    handleSubmitData: handleTransferEnclosureSubmitData,
    resetForm: resetTransferEnclosureForm
  } = TransferEnclosureDischarge()

  const prescriptionsColumns = [
    {
      field: 'id',
      headerName: 'Sl.NO',
      minWidth: 50,
      sortable: false,
      renderCell: params => (
        <StyledTypography sx={{ pl: 2 }} fontWeight={400}>
          {params.row.id}
        </StyledTypography>
      )
    },
    {
      field: 'MedicineName',
      headerName: 'Medicine Name',
      minWidth: 180,
      flex: 1,
      sortable: false,
      renderCell: params => (
        <Tooltip title={params.row.MedicineName}>
          <StyledTypography
            sx={{ pl: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            fontWeight={600}
          >
            {params.row.MedicineName}
          </StyledTypography>
        </Tooltip>
      )
    },
    {
      field: 'DosageTimesFrequency',
      headerName: 'Dosage Times & Frequency',
      minWidth: 200,
      flex: 1,
      sortable: false,
      renderCell: params => (
        <StyledTypography
          sx={{ pl: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          fontWeight={400}
        >
          {params.row.DosageTimesFrequency}
        </StyledTypography>
      )
    },
    {
      field: 'StartingDate',
      headerName: 'Starting Date',
      minWidth: 140,
      sortable: false,
      renderCell: params => (
        <StyledTypography sx={{ pl: 2 }} fontWeight={400}>
          {params.row.StartingDate}
        </StyledTypography>
      )
    },
    {
      field: 'EndingDate',
      headerName: 'Ending Date',
      minWidth: 180,
      sortable: false,
      renderCell: params => (
        <Button
          variant='outlined'
          // sx={{ pl: 2, border: `1px solid ${theme.palette.customColors.OnSurface}`, borderRadius: '4px' }}
          sx={{
            border: `1px solid ${theme.palette.customColors.OnSurface}`,
            borderRadius: '4px',

            // padding: '0 10px',
            color: theme.palette.customColors.OnSurface
          }}
          startIcon={
            <Icon
              icon='mdi:calendar-blank'
              style={{
                fontSize: 18
              }}
            />
          }
        >
          <StyledTypography color={theme.palette.customColors.OnSurface}>{params.row.EndingDate}</StyledTypography>
        </Button>

        // <ControlledDatePicker control={control} name='discharge_date' label='Date' errors={errors} />
      )
    },
    {
      field: 'Duration',
      headerName: 'Duration',
      minWidth: 120,
      sortable: false,
      renderCell: params => (
        <StyledTypography sx={{ pl: 2 }} fontWeight={400}>
          {params.row.Duration}
        </StyledTypography>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      headerAlign: 'center',
      align: 'center',
      minWidth: 180,
      sortable: false,
      renderCell: params => (
        <Button>
          <StyledTypography
            sx={{ textTransform: 'capitalize' }}
            fontWeight={600}
            color={theme.palette.customColors.OnSurface}
          >
            Stop Medicine
          </StyledTypography>
        </Button>
      )
    }
  ]

  const medicationColumns = [
    {
      field: 'id',
      headerName: 'Sl.NO',
      minWidth: 50,
      sortable: false,
      renderCell: params => (
        <StyledTypography sx={{ pl: 2 }} fontWeight={400}>
          {params.row.id}
        </StyledTypography>
      )
    },
    {
      field: 'MedicineName',
      headerName: 'Medicine Name',
      minWidth: 180,
      flex: 1,
      sortable: false,
      renderCell: params => (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Tooltip title={params.row.MedicineName}>
            <StyledTypography
              sx={{ pl: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              fontWeight={600}
            >
              {params.row.MedicineName}
            </StyledTypography>
          </Tooltip>
          <Tooltip title={params.row.BrandName}>
            <StyledTypography
              sx={{ pl: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              fontSize={'0.875rem'}
            >
              {params.row.BrandName}
            </StyledTypography>
          </Tooltip>
        </Box>
      )
    },
    {
      field: 'DosageTimesFrequency',
      headerName: 'Dosage Times & Frequency',
      minWidth: 200,
      flex: 1,
      sortable: false,
      renderCell: params => (
        <StyledTypography
          sx={{ pl: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          fontWeight={400}
        >
          {params.row.DosageTimesFrequency}
        </StyledTypography>
      )
    },
    {
      field: 'StartingDate',
      headerName: 'Starting Date',
      minWidth: 140,
      sortable: false,
      renderCell: params => (
        <StyledTypography sx={{ pl: 2 }} fontWeight={400}>
          {params.row.StartingDate}
        </StyledTypography>
      )
    },
    {
      field: 'EndingDate',
      headerName: 'Ending Date',
      minWidth: 140,
      sortable: false,
      renderCell: params => (
        <StyledTypography sx={{ pl: 2 }} fontWeight={400}>
          {params.row.EndingDate}
        </StyledTypography>
      )
    },
    {
      field: 'Duration',
      headerName: 'Duration',
      minWidth: 120,
      sortable: false,
      renderCell: params => (
        <StyledTypography sx={{ pl: 2 }} fontWeight={400}>
          {params.row.Duration}
        </StyledTypography>
      )
    },
    {
      field: 'DeliveryRoute',
      headerName: 'Delivery Route',
      minWidth: 140,
      sortable: false,
      renderCell: params => (
        <StyledTypography sx={{ pl: 2 }} fontWeight={400}>
          {params.row.DeliveryRoute}
        </StyledTypography>
      )
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
              <Icon icon='mdi:pencil-outline' fontSize={20} />
            </IconButton>
          </Tooltip>

          <Tooltip title='Delete'>
            <IconButton size='small' onClick={() => {}}>
              <Icon icon='mdi:close' fontSize={20} />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ]

  // Form for discharge type selection
  const { control, watch } = useForm({
    defaultValues: {
      discharge_type: 'Mortality'
    }
  })

  const watchDischargeType = watch('discharge_type')

  return (
    <Box sx={{ mt: 6, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Admission Info */}
      <Box
        sx={{
          background: alpha(theme.palette.customColors.antzNotes, 0.6),
          p: 6,
          borderRadius: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}
      >
        <StyledTypography color={theme.palette.customColors.neutralPrimary}>Reason of Admission</StyledTypography>
        <StyledTypography color={theme.palette.customColors.neutralPrimary} fontSize={'0.875rem'} fontWeight={400}>
          {patientData?.purpose_of_visit}
        </StyledTypography>
      </Box>

      {/* Discharge Type Selection */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <StyledTypography>Discharge Type</StyledTypography>
        <Controller
          name='discharge_type'
          control={control}
          render={({ field }) => (
            <Grid container spacing={6}>
              {dischargeTypeOptions.map((item, index) => (
                <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
                  <TreatmentTypeRadioButtons
                    label={item.label}
                    isSelected={field.value === item.value}
                    onClick={() => field.onChange(item.value)}
                    radioPosition='right'
                    selectedBackgroundColor={theme.palette.customColors.OnPrimaryContainer}
                    selectedFontColor={theme.palette.primary.contrastText}
                    selectedBorderColor='none'
                  />
                </Grid>
              ))}
            </Grid>
          )}
        />
      </Box>

      {/* Conditional Forms */}
      {watchDischargeType === 'Mortality' && (
        <MortalityDischargeForm
          causeOfDeath={causeOfDeath}
          carcassCondition={carcassCondition}
          carcassDeposition={carcassDeposition}
          fetchLoading={mortalityFetchLoading}
          error={mortalityError}
          submitLoader={mortalitySubmitLoader}
          handleSubmitData={handleMortalitySubmitData}
          resetForm={resetMortalityForm}
          patientData={patientData}
          watchDischargeType={watchDischargeType}
          handleMannerSearch={handleMannerSearch}
          handleConditionSearch={handleConditionSearch}
          handleDispositionSearch={handleDispositionSearch}
        />
      )}

      {watchDischargeType === 'TransferHospital' && (
        <TransferDischargeForm
          fetchLoading={transferHospitalFetchLoading}
          error={transferHospitalError}
          submitLoader={transferHospitalSubmitLoader}
          handleSubmitData={handleTransferHospitalSubmitData}
          resetForm={resetTransferHospitalForm}
          patientData={patientData}
          watchDischargeType={watchDischargeType}
          hospitalList={hospital}
          handleHospitalSearch={handleHospitalSearch}
          medicationColumns={medicationColumns}
          prescriptionsColumns={prescriptionsColumns}
          medicationsData={medicationsData}
        />
      )}

      {watchDischargeType === 'TransferEnclosure' && (
        <EnclosureDischargeForm
          fetchLoading={transferEnclosureFetchLoading}
          error={transferEnclosureError}
          submitLoader={transferEnclosureSubmitLoader}
          handleSubmitData={handleTransferEnclosureSubmitData}
          resetForm={resetTransferEnclosureForm}
          patientData={patientData}
          watchDischargeType={watchDischargeType}
          medicationColumns={medicationColumns}
          medicationsData={medicationsData}
        />
      )}
    </Box>
  )
}

export default InpatientDischarge

const StyledTypography = styled(Typography)(({ theme, fontWeight, fontSize, color }) => ({
  fontSize: fontSize || '1rem',
  fontWeight: fontWeight || 500,
  color: color || theme.palette.customColors.OnSurfaceVariant
}))
