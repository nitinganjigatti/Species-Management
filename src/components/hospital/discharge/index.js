import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Grid,
  styled,
  alpha,
  useTheme,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
  Tooltip
} from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import Icon from 'src/@core/components/icon'
import { useRouter } from 'next/router'

import MortalityDischarge from './MortalityDischarge'
import TransferHospitalDischarge from './TransferHospitalDischarge'
import TransferEnclosureDischarge from './TransferEnclosureDischarge'
import MortalityDischargeForm from 'src/views/pages/hospital/inpatient/discharge/MortalityDischargeForm'
import TransferDischargeForm from 'src/views/pages/hospital/inpatient/discharge/TransferDischargeForm'
import EnclosureDischargeForm from 'src/views/pages/hospital/inpatient/discharge/EnclosureDischargeForm'
import TreatmentTypeRadioButtons from 'src/views/pages/hospital/utility/TreatmentTypeRadioButtons'
import TextEllipsisWithModal from 'src/components/TextEllipsisWithModal'
import Utility from 'src/utility'
import { useDynamicStateContext } from 'src/context/DynamicStatesContext'
import {
  getPrescriptionsByRecord,
  getSecurityCheckForTransfer,
  stopPrescription
} from 'src/lib/api/hospital/prescription'
import Toaster from 'src/components/Toaster'

const STORAGE_KEY = 'medical_record_data'

const dischargeTypeOptions = [
  { label: 'Mortality', value: 'Mortality' },
  { label: 'Transfer to Enclosure', value: 'TransferEnclosure' }

  // { label: 'Transfer to Hospital', value: 'TransferHospital' }
]

const InpatientDischarge = ({ patientData, refetchPatient }) => {
  const theme = useTheme()
  const router = useRouter()
  const { id } = router.query

  const medicalRecordId = patientData?.medical_record_id
  const { data, updateState, resetState } = useDynamicStateContext()
  const medicalRecordData = data[STORAGE_KEY] || {}
  const medical_record_id = medicalRecordData?.medical_record_id
  const discharge_at = medicalRecordData?.discharge_at
  const site_id = medicalRecordData?.site_id
  const purpose_of_visit = medicalRecordData?.purpose_of_visit

  // Separate dynamic states for each medicine table discharge type
  const transferMedicines = data.transfer_medicines || []
  const transferTempMedicines = data.transfer_temp_medicines || []
  const enclosureMedicines = data.enclosure_medicines || []
  const enclosureTempMedicines = data.enclosure_temp_medicines || []

  const [prescription, setPrescription] = useState([])
  const [isPrescriptionLoading, setIsPrescriptionLoading] = useState(false)
  const [isStopPrescriptionLoading, setIsStopPrescriptionLoading] = useState(false)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingTabValue, setPendingTabValue] = useState(null)

  // Track form dirtiness per tab
  const [isMortalityDirty, setIsMortalityDirty] = useState(false)
  const [isTransferHospitalDirty, setIsTransferHospitalDirty] = useState(false)
  const [isTransferEnclosureDirty, setIsTransferEnclosureDirty] = useState(false)
  const [selectedTab, setSelectedTab] = useState('TransferEnclosure')
  const [securityCheck, setSecurityCheck] = useState(null)
  const [isSecurityCheckLoading, setIsSecurityCheckLoading] = useState(false)

  // Mortality
  const {
    causeOfDeath,
    carcassCondition,
    carcassDeposition,
    handleMannerSearch,
    handleConditionSearch,
    handleDispositionSearch,
    fetchLoading: mortalityFetchLoading,
    submitLoader: mortalitySubmitLoader,
    handleSubmitData: handleMortalitySubmitData
  } = MortalityDischarge()

  // Transfer Hospital
  // const {
  //   isLoadingHospital,
  //   hospitalData,
  //   handleHospitalSearch,
  //   submitLoader: transferHospitalSubmitLoader,
  //   handleSubmitData: handleTransferHospitalSubmitData
  // } = TransferHospitalDischarge()

  // RHF for discharge type
  const { control, watch, setValue } = useForm({
    defaultValues: { discharge_type: 'Mortality' }
  })
  const watchDischargeType = watch('discharge_type')

  // Transfer Enclosure
  const { submitLoader: transferEnclosureSubmitLoader, handleSubmitData: handleTransferEnclosureSubmitData } =
    TransferEnclosureDischarge()

  useEffect(() => {
    if (!site_id) return
    setIsSecurityCheckLoading(true)

    const getTransferCheck = async () => {
      await getSecurityCheckForTransfer(site_id).then(res => {
        setSecurityCheck(res?.success)
        setIsSecurityCheckLoading(false)
      })
    }

    getTransferCheck()
  }, [site_id])

  // Fetch active prescriptions
  // const getPrescriptionList = async () => {
  //   try {
  //     setIsPrescriptionLoading(true)

  //     const payload = {
  //       hospital_case_id: id,
  //       medical_record_id: medicalRecordId,
  //       status: 'active',
  //       type: 'prescription'
  //     }
  //     const response = await getPrescriptionsByRecord(payload)

  //     if (response?.success) {
  //       setPrescription(response.data)
  //     } else {
  //       Toaster({ type: 'error', message: response?.message })
  //     }
  //   } catch (error) {
  //     Toaster({ type: 'error', message: error?.response?.data?.message || error?.message || 'Something went wrong' })
  //   } finally {
  //     setIsPrescriptionLoading(false)
  //   }
  // }

  // Stop prescription
  // const handleStopPrescription = async row => {
  //   try {
  //     setIsStopPrescriptionLoading(true)

  //     const payload = {
  //       medical_record_id: row?.medical_record_id,
  //       prescription_id: row?.id,
  //       type: 'prescription',
  //       status: 'stop',
  //       note: row?.notes,
  //       side_effect: row?.side_effect,
  //       case: 'single',
  //       main_prescription_id: row?.prescription_id
  //     }

  //     const response = await stopPrescription(payload)

  //     if (response?.success) {
  //       Toaster({ type: 'success', message: response?.message || 'Medicine stopped successfully' })
  //       getPrescriptionList()
  //     } else {
  //       Toaster({ type: 'error', message: response?.message })
  //     }
  //   } catch (error) {
  //     console.error('Error stopping medicine:', error?.message || error)
  //   } finally {
  //     setIsStopPrescriptionLoading(false)
  //   }
  // }

  // Active prescription table columns (for Transfer Hospital)
  // const prescriptionsColumns = [
  //   {
  //     field: 'id',
  //     headerName: 'Sl.NO',
  //     minWidth: 80,
  //     flex: 1,
  //     sortable: false,
  //     renderCell: params => (
  //       <StyledTypography sx={{ pl: 2 }} fontWeight={400}>
  //         {params.row.sl_no}
  //       </StyledTypography>
  //     )
  //   },
  //   {
  //     field: 'name',
  //     headerName: 'Medicine Name',
  //     minWidth: 200,
  //     flex: 1,
  //     sortable: false,
  //     renderCell: params => (
  //       <TextEllipsisWithModal
  //         enableDialog={false}
  //         text={params.row.name ?? ''}
  //         style={{
  //           color: theme.palette.customColors.OnSurfaceVariant,
  //           fontSize: '1rem',
  //           fontWeight: 600,
  //           pl: 1.4,
  //           maxWidth: '180px'
  //         }}
  //       />
  //     )
  //   },
  //   {
  //     field: 'frequency',
  //     headerName: 'Dosage Times & Frequency',
  //     minWidth: 250,
  //     flex: 1,
  //     sortable: false,
  //     renderCell: params => (
  //       <TextEllipsisWithModal
  //         enableDialog={false}
  //         text={`${params.row.dosage_count} / ${params.row.frequency}` ?? ''}
  //         style={{
  //           color: theme.palette.customColors.OnSurfaceVariant,
  //           fontSize: '1rem',
  //           pl: 1.4,
  //           maxWidth: '230px',
  //           fontWeight: 400
  //         }}
  //       />
  //     )
  //   },
  //   {
  //     field: 'start_date',
  //     headerName: 'Starting Date',
  //     minWidth: 140,
  //     sortable: false,
  //     renderCell: params => (
  //       <StyledTypography sx={{ pl: 1.4 }} fontWeight={400}>
  //         {Utility.convertUtcToLocalReadableDate(params.row.start_date)}
  //       </StyledTypography>
  //     )
  //   },
  //   {
  //     field: 'end_date',
  //     headerName: 'Ending Date',
  //     minWidth: 180,
  //     sortable: false,
  //     renderCell: params => (
  //       <Box
  //         sx={{
  //           display: 'inline-flex',
  //           alignItems: 'center',
  //           gap: 1,
  //           border: `1px solid ${theme.palette.customColors.OnSurface}`,
  //           borderRadius: '4px',
  //           ml: 1.4,
  //           padding: '8px 16px',
  //           width: '160px',
  //           color: theme.palette.customColors.OnSurface
  //         }}
  //       >
  //         <Icon icon='mdi:calendar-blank' style={{ fontSize: 18 }} />
  //         <StyledTypography color={theme.palette.customColors.OnSurface}>
  //           {Utility.convertUtcToLocalReadableDate(params.row.end_date)}
  //         </StyledTypography>
  //       </Box>
  //     )
  //   },
  //   {
  //     field: 'duration',
  //     headerName: 'duration',
  //     minWidth: 120,
  //     sortable: false,
  //     renderCell: params => (
  //       <StyledTypography sx={{ pl: 2 }} fontWeight={400}>
  //         {params.row.duration}
  //       </StyledTypography>
  //     )
  //   },
  //   {
  //     field: 'actions',
  //     headerName: 'Actions',
  //     minWidth: 180,
  //     sortable: false,
  //     renderCell: params =>
  //       isStopPrescriptionLoading ? (
  //         <CircularProgress size={20} />
  //       ) : (
  //         <StyledTypography
  //           sx={{ pl: 2, textTransform: 'capitalize', cursor: 'pointer' }}
  //           fontWeight={600}
  //           color={theme.palette.customColors.OnSurface}
  //           onClick={() => handleStopPrescription(params.row)}
  //         >
  //           Stop Medicine
  //         </StyledTypography>

  //         // <Button
  //         //   variant='outlined'
  //         //   sx={{
  //         //     // ml: 1.4,
  //         //     padding: '8px ',
  //         //     color: theme.palette.customColors.OnSurface,
  //         //     fontSize: '1rem',
  //         //     fontWeight: 600,
  //         //     textTransform: 'capitalize',
  //         //     border: 'none'
  //         //   }}
  //         //   onClick={() => handleStopPrescription(params.row)}
  //         // >
  //         //   Stop Medicine
  //         // </Button>
  //       )
  //   }
  // ]

  // Add prescription rows with serial numbers
  // const prescriptionIndexedRows = useMemo(
  //   () =>
  //     prescription?.map((row, index) => ({
  //       ...row,
  //       sl_no: index + 1
  //     })),
  //   [prescription]
  // )

  // medications table columns
  const medicationsColumns = [
    {
      field: 'id',
      headerName: 'Sl.NO',
      minWidth: 80,
      flex: 1,
      sortable: false,
      renderCell: params => (
        <StyledTypography sx={{ pl: 2 }} fontWeight={400}>
          {params?.row?.sl_no}
        </StyledTypography>
      )
    },
    {
      field: 'name',
      headerName: 'Medicine Name',
      minWidth: 200,
      flex: 1,
      sortable: false,
      renderCell: params => (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <TextEllipsisWithModal
            enableDialog={false}
            text={params?.row?.name ?? ''}
            style={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '1rem',
              fontWeight: 600,
              pl: 1.4,
              maxWidth: '180px'
            }}
          />
          <TextEllipsisWithModal
            enableDialog={false}
            text={params?.row?.generic_name ?? ''}
            style={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '0.875rem',
              pl: 1.4,
              maxWidth: '180px',
              fontStyle: 'italic'
            }}
          />
        </Box>
      )
    },
    {
      field: 'frequency_name',
      headerName: 'Dosage Times & Frequency',
      minWidth: 220,
      flex: 1,
      sortable: false,
      renderCell: params => (
        <TextEllipsisWithModal
          enableDialog={false}
          text={`${params?.row?.schedule_doses?.length} Time / ${params?.row?.frequency_name}` ?? ''}
          style={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '1rem',
            pl: 1.4,
            maxWidth: '200px',
            fontWeight: 400
          }}
        />
      )
    },
    {
      field: 'start_date',
      headerName: 'Starting Date',
      minWidth: 140,
      sortable: false,
      renderCell: params => (
        <StyledTypography sx={{ pl: 1.4 }} fontWeight={400}>
          {Utility.convertUtcToLocalReadableDate(params?.row?.start_date)}
        </StyledTypography>
      )
    },
    {
      field: 'end_date',
      headerName: 'Ending Date',
      minWidth: 140,
      sortable: false,
      renderCell: params => (
        <StyledTypography sx={{ pl: 1.4 }} fontWeight={400}>
          {Utility.convertUtcToLocalReadableDate(params?.row?.end_date)}
        </StyledTypography>
      )
    },
    {
      field: 'duration',
      headerName: 'duration',
      minWidth: 120,
      sortable: false,
      renderCell: params => (
        <StyledTypography sx={{ pl: 2 }} fontWeight={400}>
          {params?.row?.duration}
        </StyledTypography>
      )
    },
    {
      field: 'delivery_route_name',
      headerName: 'Delivery Route',
      minWidth: 140,
      sortable: false,
      renderCell: params => (
        <TextEllipsisWithModal
          enableDialog={false}
          text={params?.row?.delivery_route_label ?? ''}
          style={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '1rem',
            pl: 1.4,
            maxWidth: '200px',
            fontWeight: 400
          }}
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
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

  // Add medication rows with serial numbers
  // const medicationIndexedRows = useMemo(
  //   () =>
  //     enclosureMedicines?.map((row, index) => ({
  //       ...row,
  //       sl_no: index + 1
  //     })),
  //   [enclosureMedicines]
  // )

  // Merge temp to final for Transfer Hospital
  // useEffect(() => {
  //   if (!Array.isArray(transferTempMedicines) || transferTempMedicines?.length === 0) return

  //   const existing = data.transfer_medicines || []
  //   const merged = [...existing]
  //   let hasChanges = false

  //   transferTempMedicines.forEach(newMed => {
  //     if (!merged.some(med => med.id === newMed.id)) {
  //       merged.unshift(newMed)
  //       hasChanges = true
  //     }
  //   })

  //   if (hasChanges) {
  //     updateState('transfer_medicines', merged)
  //   }
  // }, [transferTempMedicines])

  // useEffect(() => {
  //   if (id && medicalRecordId) {
  //     getPrescriptionList()
  //   }
  // }, [])

  useEffect(() => {
    if (!Array.isArray(enclosureTempMedicines) || enclosureTempMedicines?.length === 0) return

    const existing = data?.enclosure_medicines || []
    const merged = [...existing]
    let hasChanges = false

    enclosureTempMedicines.forEach(newMed => {
      const idx = merged.findIndex(med => med.id === newMed.id)

      if (idx >= 0) {
        // ID FOUND UPDATE
        merged[idx] = { ...merged[idx], ...newMed }
        hasChanges = true
      } else {
        // ID NOT FOUND ADD NEW
        merged.unshift(newMed)
        hasChanges = true
      }
    })

    if (hasChanges) {
      updateState('enclosure_medicines', merged)
    }
  }, [enclosureTempMedicines])

  // Clear functions
  const clearTransferHospitalData = useCallback(() => {
    resetState('transfer_medicines')
    resetState('transfer_temp_medicines')
    setIsTransferHospitalDirty(false)
  }, [resetState])

  const clearEnclosureData = useCallback(() => {
    resetState('enclosure_medicines')
    resetState('enclosure_temp_medicines')
    setIsTransferEnclosureDirty(false)
  }, [resetState])

  // Confirm dialog handlers
  const handleConfirm = useCallback(() => {
    // Clear pending data for the tab you're leaving
    if (selectedTab === 'TransferHospital') {
      clearTransferHospitalData()
    } else if (selectedTab === 'TransferEnclosure') {
      clearEnclosureData()
    }

    setConfirmOpen(false)

    if (pendingTabValue) {
      setValue('discharge_type', pendingTabValue)
      setSelectedTab(pendingTabValue)

      router.replace(
        {
          pathname: router.pathname,
          query: { ...router.query, discharge_tab: pendingTabValue }
        },
        undefined,
        { shallow: true }
      )

      setPendingTabValue(null)
    }
  }, [selectedTab, pendingTabValue, clearTransferHospitalData, clearEnclosureData, router, setValue])

  const handleCancel = () => {
    setConfirmOpen(false)
    setPendingTabValue(null)
  }

  // Handle tab change with form and table confirmation
  const handleTabChange = useCallback(
    newType => {
      const leavingHospital =
        selectedTab === 'TransferHospital' &&
        (transferTempMedicines.length > 0 || transferMedicines.length > 0 || isTransferHospitalDirty)

      const leavingEnclosure =
        selectedTab === 'TransferEnclosure' &&
        (enclosureTempMedicines.length > 0 || enclosureMedicines.length > 0 || isTransferEnclosureDirty)

      const leavingMortality = selectedTab === 'Mortality' && isMortalityDirty

      const hasPending = leavingHospital || leavingEnclosure || leavingMortality

      if (hasPending) {
        setPendingTabValue(newType)
        setConfirmOpen(true)

        return
      }

      setValue('discharge_type', newType)
      setSelectedTab(newType)

      router.replace(
        {
          pathname: router.pathname,
          query: { ...router.query, discharge_tab: newType }
        },
        undefined,
        { shallow: true }
      )
    },
    [
      selectedTab,
      setValue,
      router,
      transferTempMedicines,
      transferMedicines,
      isTransferHospitalDirty,
      enclosureTempMedicines,
      enclosureMedicines,
      isTransferEnclosureDirty,
      isMortalityDirty
    ]
  )

  // Initialize from URL
  useEffect(() => {
    const tabFromUrl = router.query.discharge_tab
    if (tabFromUrl && typeof tabFromUrl === 'string') {
      setSelectedTab(tabFromUrl)
      setValue('discharge_type', tabFromUrl)
    }
  }, [router.query.discharge_tab, setValue])

  return (
    <>
      {!patientData ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 20, mb: 20 }}>
          <CircularProgress size={30} />
        </Box>
      ) : discharge_at === null ? (
        isSecurityCheckLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 20, mb: 20 }}>
            <CircularProgress size={30} />
          </Box>
        ) : securityCheck ? (
          <Box sx={{ mt: 6, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {purpose_of_visit && (
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
                <StyledTypography color={theme.palette.customColors.neutralPrimary}>
                  Reason of Admission
                </StyledTypography>
                <StyledTypography
                  color={theme.palette.customColors.neutralPrimary}
                  fontSize='0.875rem'
                  fontWeight={400}
                >
                  {purpose_of_visit}
                </StyledTypography>
              </Box>
            )}

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
                          radioPosition='right'
                          selectedBackgroundColor={theme.palette.customColors.OnPrimaryContainer}
                          selectedFontColor={theme.palette.primary.contrastText}
                          selectedBorderColor='none'
                          onClick={() => handleTabChange(item.value)}
                        />
                      </Grid>
                    ))}
                  </Grid>
                )}
              />
            </Box>

            {watchDischargeType === 'Mortality' && (
              <MortalityDischargeForm
                patientData={patientData}
                watchDischargeType={watchDischargeType}
                causeOfDeath={causeOfDeath}
                carcassCondition={carcassCondition}
                carcassDeposition={carcassDeposition}
                fetchLoading={mortalityFetchLoading}
                handleMannerSearch={handleMannerSearch}
                handleConditionSearch={handleConditionSearch}
                handleDispositionSearch={handleDispositionSearch}
                submitLoader={mortalitySubmitLoader}
                handleSubmitData={handleMortalitySubmitData}
                onDirtyChange={setIsMortalityDirty}
                refetchPatient={refetchPatient}
              />
            )}

            {/* {watchDischargeType === 'TransferHospital' && (
              <TransferDischargeForm
                patientData={patientData}
                watchDischargeType={watchDischargeType}
                isLoadingHospital={isLoadingHospital}
                hospitalData={hospitalData}
                handleHospitalSearch={handleHospitalSearch}
                prescriptionsColumns={prescriptionsColumns}
                prescriptionData={prescriptionIndexedRows}
                isPrescriptionLoading={isPrescriptionLoading}
                submitLoader={transferHospitalSubmitLoader}
                handleSubmitData={handleTransferHospitalSubmitData}
                medicationsColumns={medicationsColumns}
                medicationData={medicationIndexedRows}
                clearData={clearTransferHospitalData}
                onDirtyChange={setIsTransferHospitalDirty}
              />
            )} */}

            {watchDischargeType === 'TransferEnclosure' && (
              <EnclosureDischargeForm
                patientData={patientData}
                watchDischargeType={watchDischargeType}
                submitLoader={transferEnclosureSubmitLoader}
                handleSubmitData={handleTransferEnclosureSubmitData}
                medicationsColumns={medicationsColumns}
                medicationData={enclosureMedicines}
                clearData={clearEnclosureData}
                onDirtyChange={setIsTransferEnclosureDirty}
                refetchPatient={refetchPatient}
                medicalRecordId={id}
              />
            )}

            <ConfirmDialog
              open={confirmOpen}
              message='You have unsaved changes. Do you really want to switch discharge type?'
              onConfirm={handleConfirm}
              onCancel={handleCancel}
            />
          </Box>
        ) : (
          <Box sx={{ my: 20 }}>
            <StyledTypography align='center' sx={{ mt: 4, color: theme.palette.error.main }}>
              Discharge is restricted due to the absence of the security group at the origin site.
            </StyledTypography>
          </Box>
        )
      ) : (
        <Box sx={{ my: 20 }}>
          <StyledTypography align='center' sx={{ mt: 4, color: theme.palette.customColors.OnSurfaceVariant }}>
            This animal has been discharged — no further actions can be performed.
          </StyledTypography>
        </Box>
      )}
    </>
  )
}

export default InpatientDischarge

const StyledTypography = styled(Typography)(({ theme, fontWeight, fontSize, color }) => ({
  fontSize: fontSize || '1rem',
  fontWeight: fontWeight || 500,
  color: color || theme.palette.customColors.OnSurfaceVariant
}))

function ConfirmDialog({ open, message, onConfirm, onCancel }) {
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>Confirmation</DialogTitle>

      <DialogContent>
        <Typography>{message}</Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onCancel} color='inherit'>
          Cancel
        </Button>

        <Button onClick={onConfirm} variant='contained' color='primary'>
          Discard
        </Button>
      </DialogActions>
    </Dialog>
  )
}
