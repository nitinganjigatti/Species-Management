'use client'

import React, { useEffect, useMemo, useState, useCallback } from 'react'
import {
  Box,
  Button,
  Grid,
  styled,
  alpha,
  useTheme,
  CircularProgress,
  Typography,
  IconButton,
  Tooltip
} from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import Icon from 'src/@core/components/icon'
import useSafeRouter from 'src/hooks/useSafeRouter'
import { useParams } from 'next/navigation'

import useMortalityDischarge from './MortalityDischarge'
import useTransferEnclosureDischarge from './TransferEnclosureDischarge'
import MortalityDischargeFormRaw from 'src/views/pages/hospital/inpatient/discharge/MortalityDischargeForm'
import EnclosureDischargeFormRaw from 'src/views/pages/hospital/inpatient/discharge/EnclosureDischargeForm'
import TreatmentTypeRadioButtons from 'src/views/pages/hospital/utility/TreatmentTypeRadioButtons'
import TextEllipsisWithModal from 'src/components/TextEllipsisWithModal'
import Utility from 'src/utility'
import { useDispatch, useSelector } from 'react-redux'
import { updateState, resetState } from 'src/store/slices/hospital/hospitalSlice'
import {
  getPrescriptionsByRecord,
  stopPrescription
} from 'src/lib/api/hospital/prescription'
import Toaster from 'src/components/Toaster'
import ConfirmationDialog from 'src/components/confirmation-dialog'

const MortalityDischargeForm: any = MortalityDischargeFormRaw
const EnclosureDischargeForm: any = EnclosureDischargeFormRaw

const STORAGE_KEY = 'medical_record_data'
const STORAGE_KEY_FORM = 'transfer_enclosure_form'

interface InpatientDischargeProps {
  patientData?: any
  refetchPatient?: () => void
}

interface DischargeFormValues {
  discharge_type: string
}

const InpatientDischarge = ({ patientData, refetchPatient }: InpatientDischargeProps) => {
  const { t } = useTranslation()
  const theme: any = useTheme()
  const router = useSafeRouter()
  const routerParams: any = useParams()
  // Get id from dynamic route params (App Router) or from router.query fallback
  const id = routerParams?.id || (router.query as any)?.id

  const dischargeTypeOptions = [
    { label: t('hospital_module.mortality'), value: 'Mortality' },
    { label: t('hospital_module.transfer_to_enclosure'), value: 'TransferEnclosure' }
  ]

  const dispatch = useDispatch()
  const hospitalData: any = useSelector((state: any) => state.hospital.data)
  const medicalRecordData: any = hospitalData[STORAGE_KEY] || {}

  const purpose_of_visit = medicalRecordData?.purpose_of_visit
  const status = medicalRecordData?.status
  const animal_id = medicalRecordData?.animal_id

  // Separate dynamic states for each medicine table discharge type
  const transferMedicines = hospitalData.transfer_medicines || []
  const enclosureMedicines = hospitalData.enclosure_medicines || []
  const enclosureTempMedicines = hospitalData.enclosure_temp_medicines || []

  const [prescription, setPrescription] = useState<any[]>([])
  const [isPrescriptionLoading, setIsPrescriptionLoading] = useState<boolean>(false)
  const [isStopPrescriptionLoading, setIsStopPrescriptionLoading] = useState<boolean>(false)

  const [isMortalityDirty, setIsMortalityDirty] = useState<boolean>(false)
  const [isTransferHospitalDirty, setIsTransferHospitalDirty] = useState<boolean>(false)
  const [isTransferEnclosureDirty, setIsTransferEnclosureDirty] = useState<boolean>(false)
  const [selectedTab, setSelectedTab] = useState<string>('TransferEnclosure')
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false)
  const [pendingTabValue, setPendingTabValue] = useState<any>(null)

  const [dischargeConfirmOpen, setDischargeConfirmOpen] = useState<boolean>(false)
  const [pendingDischargeData, setPendingDischargeData] = useState<any>(null)

  const { control, watch, setValue } = useForm<DischargeFormValues>({
    defaultValues: { discharge_type: (router.query as any).discharge_tab || 'TransferEnclosure' }
  })
  const watchDischargeType = watch('discharge_type')

  const {
    causeOfDeath,
    carcassCondition,
    carcassDeposition,
    necropsyCenter,
    mannerLoading,
    conditionLoading,
    dispositionLoading,
    necropsyLoading,
    submitLoader: mortalitySubmitLoader,
    fetchManner,
    fetchCondition,
    fetchDisposition,
    fetchNecropsyCenter,
    handleMannerSearch,
    handleConditionSearch,
    handleDispositionSearch,
    handleNecropsyCenterSearch,
    handleSubmitData: handleMortalitySubmitData
  } = useMortalityDischarge()

  const {
    sites,
    sections,
    enclosures,
    siteLoading,
    sectionLoading,
    enclosureLoading,
    submitLoader: transferEnclosureSubmitLoader,
    handleSiteSearch,
    handleSectionSearch,
    handleEnclosureSearch,
    fetchSites,
    fetchSections,
    fetchEnclosures,
    clearSections,
    clearEnclosures,
    handleSubmitData: handleTransferEnclosureSubmitData
  } = useTransferEnclosureDischarge()

  // Initial data fetch for mortality form dropdowns
  useEffect(() => {
    if (!router.isReady || watchDischargeType !== 'Mortality' || status === 'discharge') return

    const load = async () => {
      try {
        await Promise.all([fetchManner(''), fetchCondition(''), fetchDisposition(''), fetchNecropsyCenter('')])
      } catch (error: any) {
        console.error('Initial fetch failed:', error?.message)
      }
    }

    load()
  }, [router.isReady, watchDischargeType, status])

  // Prefill from patientData initially, or restore from sessionStorage when navigating back from prescription
  useEffect(() => {
    if (!router.isReady || watchDischargeType !== 'TransferEnclosure' || status === 'discharge') return

    const saved = sessionStorage.getItem('transfer_enclosure_form')

    let siteId: any = null
    let siteLabel = ''

    let sectionId: any = null
    let sectionLabel = ''

    let enclosureId: any = null
    let enclosureLabel = ''

    if (saved) {
      // Restore previous selections from sessionStorage when returning from prescription
      const parsed = JSON.parse(saved)

      siteId = parsed?.site_name?.value || null
      siteLabel = parsed?.site_name?.label || ''

      sectionId = parsed?.section_name?.value || null
      sectionLabel = parsed?.section_name?.label || ''

      enclosureId = parsed?.user_enclosure_name?.value || null
      enclosureLabel = parsed?.user_enclosure_name?.label || ''
    } else if (patientData?.animal_detail) {
      // Fallback to animal's current location from backend to prefill default transfer location
      siteId = patientData?.animal_detail?.site_id || null
      siteLabel = patientData?.animal_detail?.site_name || ''

      sectionId = patientData?.animal_detail?.section_id || null
      sectionLabel = patientData?.animal_detail?.section_name || ''

      enclosureId = patientData?.animal_detail?.user_enclosure_id || null
      enclosureLabel = patientData?.animal_detail?.user_enclosure_name || ''
    }

    if (!siteId) {
      fetchSites('')

      return
    }

    fetchSites(siteLabel || '')
    fetchSections(siteId, sectionLabel || '')

    if (sectionId) {
      fetchEnclosures(sectionId, enclosureLabel || '')
    }
  }, [
    router.isReady,
    watchDischargeType,
    status,
    patientData?.animal_detail?.site_id,
    patientData?.animal_detail?.section_id,
    patientData?.animal_detail?.user_enclosure_id
  ])

  // Fetch active prescriptions
  const getPrescriptionList = useCallback(async () => {
    if (!id || !animal_id) return

    try {
      setIsPrescriptionLoading(true)

      const payload = {
        hospital_case_id: id,

        // medical_record_id: medical_record_id, // removed
        animal_id: animal_id, // added this to get active prescription from the other medical records
        status: 'active',
        type: 'prescription'
      }
      const response: any = await getPrescriptionsByRecord(payload)

      if (response?.success) {
        setPrescription(response.data)
      } else {
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (error: any) {
      console.error('Error fetching medicine:', error?.message || error)
    } finally {
      setIsPrescriptionLoading(false)
    }
  }, [id, animal_id])

  // Stop prescription
  const handleStopPrescription = async (row: any) => {
    try {
      setIsStopPrescriptionLoading(true)

      const payload = {
        medical_record_id: row?.medical_record_id,
        prescription_id: row?.id,
        type: 'prescription',
        request_from: 'hospital_module',
        status: 'stop',
        note: row?.notes,
        side_effect: row?.side_effect,
        case: 'single',
        main_prescription_id: row?.prescription_id
      }

      const response: any = await stopPrescription(payload)

      if (response?.success) {
        Toaster({ type: 'success', message: response?.message || t('hospital_module.medicine_stopped_successfully') })
        getPrescriptionList()
      } else {
        Toaster({ type: 'error', message: response?.message })
      }
    } catch (error: any) {
      console.error('Error stopping medicine:', error?.message || error)
    } finally {
      setIsStopPrescriptionLoading(false)
    }
  }

  // Active prescription table columns
  const prescriptionsColumns: any[] = [
    {
      field: 'id',
      headerName: 'Sl.NO',
      minWidth: 80,
      flex: 1,
      sortable: false,
      renderCell: (params: any) => (
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
      renderCell: (params: any) => (
        <TextEllipsisWithModal
          enableDialog={false}
          text={params?.row?.name || '-'}
          style={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '1rem',
            fontWeight: 600,
            pl: 1.4,
            maxWidth: '180px'
          }}
        />
      )
    },
    {
      field: 'frequency',
      headerName: 'Dosage Times & Frequency',
      minWidth: 250,
      flex: 1,
      sortable: false,
      renderCell: (params: any) => {
        const dosage = params?.row?.dosage_count
        const frequency = params?.row?.frequency

        const isInvalid =
          dosage === null ||
          dosage === undefined ||
          dosage === 0 ||
          dosage === '0' ||
          dosage === '0 Time' ||
          frequency === null ||
          frequency === undefined ||
          frequency === ''

        if (isInvalid) {
          return (
            <StyledTypography sx={{ pl: 1.4 }} fontWeight={400}>
              -
            </StyledTypography>
          )
        }

        return (
          <TextEllipsisWithModal
            enableDialog={false}
            text={`${dosage} / ${frequency}`}
            style={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '1rem',
              pl: 1.4,
              maxWidth: '230px',
              fontWeight: 400
            }}
          />
        )
      }
    },
    {
      field: 'start_date',
      headerName: 'Starting Date',
      minWidth: 140,
      sortable: false,
      renderCell: (params: any) => (
        <StyledTypography sx={{ pl: 1.4 }} fontWeight={400}>
          {Utility.convertUtcToLocalReadableDate(params?.row?.start_date)}
        </StyledTypography>
      )
    },
    {
      field: 'end_date',
      headerName: 'Ending Date',
      minWidth: 180,
      sortable: false,
      renderCell: (params: any) => {
        const endDate = params?.row?.end_date
        const formattedDate = endDate ? Utility.convertUtcToLocalReadableDate(endDate) : null

        if (!endDate || !formattedDate || formattedDate === 'Invalid date') {
          return (
            <StyledTypography sx={{ pl: 1.4 }} fontWeight={400}>
              -
            </StyledTypography>
          )
        }

        return (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              border: `1px solid ${theme.palette.customColors.OnSurface}`,
              borderRadius: '4px',
              ml: 1.4,
              padding: '8px 16px',
              width: '160px',
              color: theme.palette.customColors.OnSurface
            }}
          >
            <Icon icon='mdi:calendar-blank' style={{ fontSize: 18 }} />
            <StyledTypography color={theme.palette.customColors.OnSurface}>{formattedDate}</StyledTypography>
          </Box>
        )
      }
    },
    {
      field: 'duration',
      headerName: 'duration',
      minWidth: 120,
      sortable: false,
      renderCell: (params: any) => (
        <StyledTypography sx={{ pl: 2 }} fontWeight={400}>
          {params?.row?.duration}
        </StyledTypography>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      minWidth: 160,
      sortable: false,
      renderCell: (params: any) =>
        isStopPrescriptionLoading ? (
          <CircularProgress size={20} />
        ) : (
          <Button
            variant='outlined'
            sx={{
              padding: '8px ',
              color: theme.palette.customColors.OnSurface,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'capitalize',
              border: 'none'
            }}
            onClick={() => handleStopPrescription(params?.row)}
          >
            Stop Medicine
          </Button>
        )
    }
  ]

  // Add prescription rows with serial numbers
  const prescriptionIndexedRows = useMemo(
    () =>
      prescription?.map((row: any, index: number) => ({
        ...row,
        sl_no: index + 1
      })),
    [prescription]
  )

  const medicationsColumns: any[] = [
    {
      field: 'id',
      headerName: 'Sl.NO',
      minWidth: 80,
      flex: 1,
      sortable: false,
      renderCell: (params: any) => (
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
      renderCell: (params: any) => (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <TextEllipsisWithModal
            enableDialog={false}
            text={params?.row?.name || '-'}
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
            text={params?.row?.generic_name}
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
      minWidth: 250,
      flex: 1,
      sortable: false,
      renderCell: (params: any) => (
        <TextEllipsisWithModal
          enableDialog={false}
          text={`${params?.row?.schedule_doses?.length} Time / ${params?.row?.frequency_name}`}
          style={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '1rem',
            pl: 1.4,
            maxWidth: '230px',
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
      renderCell: (params: any) => (
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
      renderCell: (params: any) => (
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
      renderCell: (params: any) => (
        <StyledTypography sx={{ pl: 2 }} fontWeight={400}>
          {params?.row?.frequency_key === 'one_time' ? '1 day' : params?.row?.duration}
        </StyledTypography>
      )
    },
    {
      field: 'delivery_route_name',
      headerName: 'Delivery Route',
      minWidth: 160,
      sortable: false,
      renderCell: (params: any) => (
        <TextEllipsisWithModal
          enableDialog={false}
          text={params?.row?.delivery_route_label}
          style={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '1rem',
            pl: 1.4,
            maxWidth: '140px',
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
      renderCell: (params: any) => (
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

  useEffect(() => {
    if (!router.isReady || watchDischargeType !== 'TransferEnclosure' || status === 'discharge') return

    getPrescriptionList()
  }, [router.isReady, watchDischargeType, status, getPrescriptionList])

  // Merge temp to final for Transfer Enclosure
  useEffect(() => {
    if (!Array.isArray(enclosureTempMedicines) || enclosureTempMedicines?.length === 0) return

    const existing = hospitalData?.enclosure_medicines || []
    const merged = [...existing]
    let hasChanges = false

    enclosureTempMedicines.forEach((newMed: any) => {
      const idx = merged.findIndex((med: any) => med.id === newMed.id)

      if (idx >= 0) {
        // ID found update
        merged[idx] = { ...merged[idx], ...newMed }
        hasChanges = true
      } else {
        // ID not found add new
        merged.unshift(newMed)
        hasChanges = true
      }
    })

    if (hasChanges) {
      dispatch(updateState({ key: 'enclosure_medicines', value: merged }))
    }
  }, [enclosureTempMedicines])

  const clearTransferHospitalData = () => {
    dispatch(resetState('transfer_medicines'))
    dispatch(resetState('transfer_temp_medicines'))
    setIsTransferHospitalDirty(false)
  }

  const clearEnclosureData = () => {
    dispatch(resetState('enclosure_medicines'))
    dispatch(resetState('enclosure_temp_medicines'))
    sessionStorage.removeItem(STORAGE_KEY_FORM)
    setIsTransferEnclosureDirty(false)
  }

  // Discharge confirmation handlers
  const handleMortalitySubmitWithConfirmation = async (payload: any) => {
    return new Promise(resolve => {
      setPendingDischargeData({
        title: 'Are you sure you want to discharge this animal as Mortality?',
        onConfirm: async () => {
          const success = await handleMortalitySubmitData(payload)
          setDischargeConfirmOpen(false)
          setPendingDischargeData(null)
          resolve(success)

          return success
        }
      })
      setDischargeConfirmOpen(true)
    })
  }

  const handleEnclosureSubmitWithConfirmation = async (payload: any) => {
    return new Promise(resolve => {
      const originalSite = patientData?.animal_detail?.site_id
      const originalSection = patientData?.animal_detail?.section_id
      const originalEnclosure = patientData?.animal_detail?.user_enclosure_id

      const isLocationChanged =
        Number(payload.transfer_to_site_id) !== Number(originalSite) ||
        Number(payload.transfer_to_section_id) !== Number(originalSection) ||
        Number(payload.transfer_to_enclosure_id) !== Number(originalEnclosure)

      const isCritical = patientData?.health_status === 'critical'
      const criticalWarning = isCritical ? "The animal's health status is currently marked as critical." : ''

      const titleMessage = isLocationChanged
        ? `Are you sure you want to proceed with the discharge?`
        : `Are you sure you want to discharge this animal to enclosure?`

      setPendingDischargeData({
        title: titleMessage,
        description: criticalWarning,
        additionalDescription: isLocationChanged ? `Transferring animal to a different location.` : '',
        onConfirm: async () => {
          const success = await handleTransferEnclosureSubmitData(payload)
          setDischargeConfirmOpen(false)
          setPendingDischargeData(null)
          resolve(success)

          return success
        }
      })
      setDischargeConfirmOpen(true)
    })
  }

  const handleDischargeConfirm = async () => {
    if (pendingDischargeData) {
      const success = await pendingDischargeData.onConfirm()
      if (success) {
        setDischargeConfirmOpen(false)
        setPendingDischargeData(null)
      }
    }
  }

  const handleDischargeCancel = () => {
    setDischargeConfirmOpen(false)
    setPendingDischargeData(null)
  }

  // Tab confirmation handlers
  const handleConfirm = () => {
    if (selectedTab === 'TransferHospital') {
      clearTransferHospitalData()
    } else if (selectedTab === 'TransferEnclosure') {
      clearEnclosureData()
    }

    setConfirmOpen(false)

    if (pendingTabValue) {
      setValue('discharge_type', pendingTabValue)
      setSelectedTab(pendingTabValue)

      ;(router.replace as any)(
        {
          pathname: router.pathname,
          query: { ...router.query, discharge_tab: pendingTabValue }
        },
        undefined,
        { shallow: true }
      )

      setPendingTabValue(null)
    }
  }

  const handleCancel = () => {
    setConfirmOpen(false)
    setPendingTabValue(null)
  }

  // Handle tab change with form and table confirmation
  const handleTabChange = (newType: string) => {
    if (newType === selectedTab) return

    const leavingHospital =
      (selectedTab === 'TransferHospital' && transferMedicines.length > 0) || isTransferHospitalDirty

    const leavingEnclosure =
      (selectedTab === 'TransferEnclosure' && enclosureMedicines.length > 0) || isTransferEnclosureDirty
    const leavingMortality = selectedTab === 'Mortality' && isMortalityDirty
    const hasPending = leavingHospital || leavingEnclosure || leavingMortality

    if (hasPending) {
      setPendingTabValue(newType)
      setConfirmOpen(true)

      return
    }

    setValue('discharge_type', newType)
    setSelectedTab(newType)

    ;(router.replace as any)(
      {
        pathname: router.pathname,
        query: { ...router.query, discharge_tab: newType }
      },
      undefined,
      { shallow: true }
    )
  }

  // Initialize from URL
  useEffect(() => {
    if (!router.isReady) return

    const tabFromUrl = (router.query as any).discharge_tab
    if (tabFromUrl && typeof tabFromUrl === 'string') {
      setSelectedTab(tabFromUrl)
      setValue('discharge_type', tabFromUrl)
    }
  }, [router.isReady, (router.query as any).discharge_tab])

  // on refresh page clears the session storage data
  useEffect(() => {
    const handleRefresh = () => {
      sessionStorage.removeItem('transfer_enclosure_form')
    }
    window.addEventListener('beforeunload', handleRefresh)

    return () => {
      window.removeEventListener('beforeunload', handleRefresh)
    }
  }, [])

  // Clear enclosure_medicines when navigating away from discharge, unless going to schedule-prescription
  // Mirrors Pages Router router.events.on('routeChangeStart') by intercepting history API calls
  useEffect(() => {
    const handleNavigation = (url: string) => {
      if (!String(url).includes('schedule-prescription')) {
        clearEnclosureData()
      }
    }

    const originalPushState = window.history.pushState.bind(window.history)
    const originalReplaceState = window.history.replaceState.bind(window.history)

    window.history.pushState = function (...args: Parameters<typeof window.history.pushState>) {
      handleNavigation(String(args[2] ?? ''))
      return originalPushState(...args)
    }

    window.history.replaceState = function (...args: Parameters<typeof window.history.replaceState>) {
      handleNavigation(String(args[2] ?? ''))
      return originalReplaceState(...args)
    }

    return () => {
      window.history.pushState = originalPushState
      window.history.replaceState = originalReplaceState
    }
  }, [])

  // patient data initial loading
  if (!patientData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 20 }}>
        <CircularProgress size={30} />
      </Box>
    )
  }

  //  if already discharged show message
  if (status == 'discharge') {
    return (
      <Box sx={{ my: 20 }}>
        <StyledTypography align='center' sx={{ mt: 4, color: theme.palette.customColors.OnSurfaceVariant }}>
          This animal has been discharged — no further actions can be performed.
        </StyledTypography>
      </Box>
    )
  }

  return (
    <>
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
            <StyledTypography color={theme.palette.customColors.neutralPrimary}>Reason of Admission</StyledTypography>
            <StyledTypography color={theme.palette.customColors.neutralPrimary} fontSize='0.875rem' fontWeight={400}>
              {purpose_of_visit}
            </StyledTypography>
          </Box>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <StyledTypography>Discharge Type</StyledTypography>
          <Controller
            name='discharge_type'
            control={control}
            render={({ field }) => (
              <Grid container spacing={6}>
                {dischargeTypeOptions?.map((item: any, index: number) => (
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
            causeOfDeath={causeOfDeath}
            carcassCondition={carcassCondition}
            carcassDeposition={carcassDeposition}
            necropsyCenter={necropsyCenter}
            mannerLoading={mannerLoading}
            conditionLoading={conditionLoading}
            dispositionLoading={dispositionLoading}
            necropsyLoading={necropsyLoading}
            submitLoader={mortalitySubmitLoader}
            handleMannerSearch={handleMannerSearch}
            handleConditionSearch={handleConditionSearch}
            handleDispositionSearch={handleDispositionSearch}
            handleNecropsyCenterSearch={handleNecropsyCenterSearch}
            handleSubmitData={handleMortalitySubmitWithConfirmation}
            patientData={patientData}
            watchDischargeType={watchDischargeType}
            onDirtyChange={setIsMortalityDirty}
            refetchPatient={refetchPatient}
          />
        )}

        {watchDischargeType === 'TransferEnclosure' && (
          <EnclosureDischargeForm
            sites={sites}
            sections={sections}
            enclosures={enclosures}
            siteLoading={siteLoading}
            sectionLoading={sectionLoading}
            enclosureLoading={enclosureLoading}
            submitLoader={transferEnclosureSubmitLoader}
            handleSiteSearch={handleSiteSearch}
            handleSectionSearch={handleSectionSearch}
            handleEnclosureSearch={handleEnclosureSearch}
            fetchSections={fetchSections}
            fetchEnclosures={fetchEnclosures}
            clearSections={clearSections}
            clearEnclosures={clearEnclosures}
            handleSubmitData={handleEnclosureSubmitWithConfirmation}
            patientData={patientData}
            watchDischargeType={watchDischargeType}
            refetchPatient={refetchPatient}
            medicationsColumns={medicationsColumns}
            medicationData={enclosureMedicines}
            clearEnclosureData={clearEnclosureData}
            onDirtyChange={setIsTransferEnclosureDirty}
            medicalRecordId={id}
            prescriptionsColumns={prescriptionsColumns}
            prescriptionData={prescriptionIndexedRows}
            isPrescriptionLoading={isPrescriptionLoading}
          />
        )}
        {confirmOpen && (
          <ConfirmationDialog
            dialogBoxStatus={confirmOpen}
            onClose={handleCancel}
            title={'You have unsaved changes. Do you really want to switch discharge type?'}
            cancelText={'Cancel'}
            confirmBtnStyle={{ background: theme.palette.customColors.primary, py: 2 }}
            confirmAction={handleConfirm}
            ConfirmationText={'Yes'}
          />
        )}
        {dischargeConfirmOpen && (
          <ConfirmationDialog
            dialogBoxStatus={dischargeConfirmOpen}
            onClose={handleDischargeCancel}
            loading={watchDischargeType === 'Mortality' ? mortalitySubmitLoader : transferEnclosureSubmitLoader}
            title={pendingDischargeData?.title || 'Are you sure you want to discharge this animal?'}
            description={pendingDischargeData?.description || ''}
            additionalDescription={pendingDischargeData?.additionalDescription || ''}
            cancelText={'Cancel'}
            confirmBtnStyle={{ background: theme.palette.customColors.primary, py: 2 }}
            confirmAction={handleDischargeConfirm}
            ConfirmationText={'Yes, Discharge'}
            image={'/images/warning-icon.svg'}
            imgStyle={{ background: theme.palette.customColors.TertiaryLight, p: 4 }}
          />
        )}
      </Box>
    </>
  )
}

export default InpatientDischarge

const StyledTypography = styled(Typography)(({ theme, fontWeight, fontSize, color }: any) => ({
  fontSize: fontSize || '1rem',
  fontWeight: fontWeight || 500,
  color: color || theme.palette.customColors.OnSurfaceVariant
}))
