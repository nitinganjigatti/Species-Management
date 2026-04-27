import React, { useState, useEffect, FC } from 'react'
import {
  Box,
  Typography,
  Chip,
  Skeleton,
  CircularProgress,
  alpha,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab
} from '@mui/material'
import { Grid } from '@mui/system'
import { useTheme } from '@mui/material/styles'
import useSafeRouter from 'src/hooks/useSafeRouter'
import {
  Block as BlockIcon,
  Vaccines as VaccineIcon,
  Delete as DeleteIcon,
  Notes as NotesIcon,
  CalendarToday as CalendarIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material'
import { Icon } from '@iconify/react'

// Import necropsy components for reuse
import MedicalRecordsList from 'src/components/necropsy/MedicalRecordsList'
import DiagnosisList from 'src/components/necropsy/DiagnosisList'
import PrescriptionList from 'src/components/necropsy/PrescriptionList'
import ComplaintsList from 'src/components/necropsy/ComplaintsList'
import LabRequestsList from 'src/components/necropsy/LabRequestsList'

// Import APIs
import { getVaccinationList, getMedicineSideEffect, deleteMedicineSideEffect } from 'src/lib/api/housing'
import { getMedicalCommonData } from 'src/lib/api/necropsy/medicalHistory'
import Utility from 'src/utility'
import NoDataFound from 'src/views/utility/NoDataFound'
import Toaster from 'src/components/Toaster'
import { useTranslation } from 'react-i18next'

// ==================== Types ====================

interface AnimalMedicalProps {
  animalDetails?: {
    isAlive?: string
    is_alive?: string | number | boolean
    is_deleted?: string | number
    animal_status?: string
  }
}

type MainTabType =
  | 'Medical Records'
  | 'Diagnosis'
  | 'Prescription'
  | 'Complaints'
  | 'Clinical Notes'
  | 'Lab Requests'
  | 'Vaccination'
  | 'Deworming'
  | 'Adverse Rx'

// Sub-tab configuration matching mobile implementation with icons
const MEDICAL_SUB_TABS: { id: MainTabType; labelKey: string; icon: string }[] = [
  { id: 'Medical Records', labelKey: 'animals_module.basic', icon: 'mdi:heart-pulse' },
  { id: 'Diagnosis', labelKey: 'animals_module.diagnosis', icon: 'mdi:stethoscope' },
  { id: 'Complaints', labelKey: 'animals_module.complaints', icon: 'mdi:emoticon-sad-outline' },
  { id: 'Prescription', labelKey: 'animals_module.prescriptions', icon: 'mdi:prescription' },
  { id: 'Vaccination', labelKey: 'animals_module.vaccination', icon: 'mdi:needle' },
  { id: 'Deworming', labelKey: 'animals_module.deworming', icon: 'mdi:pill' },
  { id: 'Clinical Notes', labelKey: 'animals_module.clinical_notes', icon: 'mdi:note-text' },
  { id: 'Adverse Rx', labelKey: 'animals_module.adverse_rx', icon: 'mdi:alert' },
  { id: 'Lab Requests', labelKey: 'animals_module.lab_requests', icon: 'mdi:flask' }
]

// ==================== Shimmer Component ====================

const CardShimmer: FC<{ count?: number }> = ({ count = 3 }) => {
  const theme = useTheme()

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {Array.from({ length: count }).map((_, i) => (
        <Box
          key={i}
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: '12px',
            p: 3
          }}
        >
          <Skeleton variant='rounded' width={140} height={24} sx={{ mb: 1.5 }} />
          <Skeleton variant='text' width='50%' height={20} sx={{ mb: 1 }} />
          <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
            <Skeleton variant='text' width={40} height={18} />
            <Skeleton variant='text' width={40} height={18} />
            <Skeleton variant='text' width={40} height={18} />
          </Box>
          <Skeleton variant='text' width='30%' height={18} />
        </Box>
      ))}
    </Box>
  )
}

// ==================== Empty State Component ====================

const EmptyState: FC<{ message: string }> = ({ message }) => {
  const theme = useTheme()

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        py: 10,
        flexDirection: 'column'
      }}
    >
      <NoDataFound variant='Meerkat' height={180} width={180} />
      <Typography sx={{ fontSize: '0.875rem', color: theme.palette.text.secondary, fontWeight: 400, mt: 2 }}>
        {message}
      </Typography>
    </Box>
  )
}

// ==================== Pill Tab Component ====================

interface PillTabProps {
  tabs: string[]
  activeTab: string
  onTabClick: (tab: string) => void
  getCounts?: (tab: string) => number | null
}

const PillTabs: FC<PillTabProps> = ({ tabs, activeTab, onTabClick, getCounts }) => {
  const theme = useTheme() as any

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box
        sx={{
          flex: '1 1 auto',
          minWidth: 0,
          overflowX: 'auto',
          scrollbarColor: 'transparent transparent',
          '&::-webkit-scrollbar': { display: 'none' }
        }}
      >
        <Box sx={{ display: 'inline-flex', gap: 2, pr: 1, alignItems: 'center' }}>
          {tabs.map(tab => {
            const count = getCounts ? getCounts(tab) : null

            return (
              <Box
                key={tab}
                onClick={() => onTabClick(tab)}
                sx={{
                  flexShrink: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  px: '16px',
                  py: '8px',
                  borderRadius: '8px',
                  backgroundColor:
                    activeTab === tab
                      ? theme.palette.secondary.dark
                      : theme.palette.customColors?.mdAntzNeutral || alpha(theme.palette.grey[500], 0.1),
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
              >
                <Typography
                  sx={{
                    color:
                      activeTab === tab
                        ? theme.palette.primary.contrastText
                        : theme.palette.customColors?.neutralPrimary || theme.palette.text.primary,
                    whiteSpace: 'nowrap',
                    fontSize: { xs: '13px', sm: '14px' },
                    fontWeight: 500
                  }}
                >
                  {count !== null ? `${tab} - ${count}` : tab}
                </Typography>
              </Box>
            )
          })}
        </Box>
      </Box>
    </Box>
  )
}

// ==================== Clinical Notes List ====================

interface ClinicalNotesListProps {
  animalId: number
}

const ClinicalNotesList: FC<ClinicalNotesListProps> = ({ animalId }) => {
  const { t } = useTranslation()
  const theme = useTheme() as any
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [pageNo, setPageNo] = useState<number>(1)
  const [hasMore, setHasMore] = useState<boolean>(false)
  const [loadingMore, setLoadingMore] = useState<boolean>(false)

  const fetchData = async (page: number, append: boolean = false): Promise<void> => {
    try {
      if (page === 1) setLoading(true)
      else setLoadingMore(true)

      const res = await getMedicalCommonData(animalId, {
        medical_type: 'clinical_notes',
        type: 'all',
        page_no: page,
        limit: 10
      })

      if (res?.success) {
        const records = res.data?.result || []
        if (append) {
          setData(prev => [...prev, ...records])
        } else {
          setData(records)
        }
        setHasMore(records.length === 10)
      }
    } catch (error) {
      console.error('Error fetching clinical notes:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchData(1)
  }, [animalId])

  const handleLoadMore = (): void => {
    const nextPage = pageNo + 1
    setPageNo(nextPage)
    fetchData(nextPage, true)
  }

  if (loading) return <CardShimmer />
  if (data.length === 0) return <EmptyState message={t('animals_module.no_clinical_notes_recorded')} />

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {data.map((record: any, index: number) => {
        const medicalRecordId = record.medical_record_id || 'N/A'
        const notes = Array.isArray(record.data) ? record.data : [record]

        return (
          <Box key={medicalRecordId + index}>
            {medicalRecordId !== 'N/A' && (
              <Typography
                sx={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: theme.palette.customColors?.OnSurfaceVarient || theme.palette.text.primary,
                  mb: 2
                }}
              >
                {medicalRecordId}
              </Typography>
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {notes.map((note: any, noteIdx: number) => (
                <Box
                  key={note.id || noteIdx}
                  sx={{
                    borderRadius: '12px',
                    p: 3,
                    backgroundColor:
                      theme.palette.customColors?.displaybgPrimary || alpha(theme.palette.grey[500], 0.05)
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <NotesIcon sx={{ fontSize: 20, color: theme.palette.primary.main, mt: 0.5 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        sx={{
                          fontSize: '0.9375rem',
                          fontWeight: 500,
                          color: theme.palette.text.primary,
                          lineHeight: 1.6
                        }}
                      >
                        {note.clinical_notes || note.notes || note.note || t('animals_module.no_notes_available')}
                      </Typography>
                      {note.created_at && (
                        <Typography
                          sx={{
                            fontSize: '0.8125rem',
                            color: theme.palette.text.secondary,
                            mt: 1
                          }}
                        >
                          {Utility.convertUTCToLocalDateTime(note.created_at)}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )
      })}

      {hasMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
          {loadingMore ? (
            <CircularProgress size={24} />
          ) : (
            <Typography
              onClick={handleLoadMore}
              sx={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: theme.palette.primary.main,
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              {t('animals_module.load_more')}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  )
}

// ==================== Vaccination/Deworming List ====================

interface VaccinationListProps {
  animalId: number
  type: 'vaccination' | 'deworming'
  canAdd?: boolean
}

interface VaccinationCounts {
  pending: number
  upcoming: number
  completed: number
}

const VaccinationList: FC<VaccinationListProps> = ({ animalId, type, canAdd = true }) => {
  const { t } = useTranslation()
  const theme = useTheme() as any
  const [activeSubTab, setActiveSubTab] = useState<'Pending' | 'Upcoming' | 'Completed'>('Pending')
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [pageNo, setPageNo] = useState<number>(1)
  const [hasMore, setHasMore] = useState<boolean>(false)
  const [loadingMore, setLoadingMore] = useState<boolean>(false)
  const [counts, setCounts] = useState<VaccinationCounts>({ pending: 0, upcoming: 0, completed: 0 })

  const fetchData = async (tab: string, page: number, append: boolean = false): Promise<void> => {
    try {
      if (page === 1) setLoading(true)
      else setLoadingMore(true)

      const res = await getVaccinationList({
        animal_id: animalId,
        type,
        status: tab.toLowerCase() as any,
        page_no: page,
        length: 10
      })

      if (res?.success) {
        // Handle both response formats: res.data.result (mobile) or res.data (array)
        const responseData = res.data

        const records = Array.isArray(responseData) ? responseData : responseData?.result || []

        // Update counts from stats if available
        if (!Array.isArray(responseData) && responseData?.stats) {
          setCounts({
            pending: parseInt(String(responseData.stats.pending)) || 0,
            upcoming: parseInt(String(responseData.stats.upcoming)) || 0,
            completed: parseInt(String(responseData.stats.completed)) || 0
          })
        }

        if (append) {
          setData(prev => [...prev, ...records])
        } else {
          setData(records)
        }
        setHasMore(records.length === 10)
      }
    } catch (error) {
      console.error(`Error fetching ${type} data:`, error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    setPageNo(1)
    setData([])
    fetchData(activeSubTab, 1)
  }, [activeSubTab, animalId, type])

  const handleLoadMore = (): void => {
    const nextPage = pageNo + 1
    setPageNo(nextPage)
    fetchData(activeSubTab, nextPage, true)
  }

  const getCounts = (tab: string): number | null => {
    const key = tab.toLowerCase() as keyof VaccinationCounts

    return counts[key] ?? null
  }

  // Status detection matching mobile implementation
  const isPending = (status: string | null): boolean => status === 'pending' || status === null

  const isCompleted = (status: string | null): boolean =>
    status === 'administrator' || status === 'completed' || status === 'withheld'
  const isStopped = (status: string | null): boolean => status === 'stopped' || status === 'close'

  // Get background color based on status and side effect
  const getCardBackground = (record: any): string => {
    const hasSideEffect = record?.caused_adverse_effects === '1'
    const stopped = isStopped(record?.status)

    if (hasSideEffect) {
      return stopped
        ? alpha(theme.palette.customColors?.neutralPrimary || theme.palette.grey[500], 0.02)
        : alpha(theme.palette.warning.light, 0.15)
    }
    if (isPending(record?.status)) {
      return theme.palette.customColors?.surface || theme.palette.background.paper
    }
    if (isCompleted(record?.status) || stopped) {
      return alpha(theme.palette.customColors?.neutralPrimary || theme.palette.grey[500], 0.02)
    }

    return theme.palette.background.paper
  }

  // Format dose string matching mobile
  const formatDose = (record: any): string => {
    const quantity = record?.quantity_administered ?? record?.scheduled_quantity
    const unit = record?.administritive_unit ?? record?.scheduled_unit ?? ''
    const weightUnit = record?.administritive_weight_uom_abbr ?? record?.weight_unit_name

    if (!quantity) return ''

    let doseStr = `${quantity}${unit}`
    if (weightUnit) {
      doseStr += ` / ${weightUnit}`
    }

    return doseStr
  }

  // Format date matching mobile
  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return ''

    return Utility.formatDisplayDate(dateStr)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <PillTabs
        tabs={['Pending', 'Upcoming', 'Completed']}
        activeTab={activeSubTab}
        onTabClick={tab => {
          setActiveSubTab(tab as any)
          setPageNo(1)
        }}
        getCounts={getCounts}
      />

      {loading ? (
        <CardShimmer />
      ) : data.length === 0 ? (
        <EmptyState message={`No ${type === 'vaccination' ? 'Vaccination' : 'Deworming'} Records Found`} />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {data.map((record, index) => {
            const hasSideEffect = record?.caused_adverse_effects === '1'
            const stopped = isStopped(record?.status)
            const isControlledSubstance = record?.schedule_vaccine_cs === '1'
            const vaccineName = record?.medicine_name || record?.vaccine_name || record?.name || ''
            const vaccineDate = record?.generate_for_date || record?.scheduled_date
            const stopDate = record?.administritive_date_time
            const dose = formatDose(record)
            const notes = record?.prescription_note
            const alternativeVaccine = record?.alternate_vaccine_name
            const isAlternateCS = record?.alternate_vaccine_cs === '1'

            return (
              <Box
                key={record.id || index}
                sx={{
                  border: `1px solid ${theme.palette.customColors?.outlineVariant || theme.palette.divider}`,
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: getCardBackground(record)
                }}
              >
                {/* Header Section */}
                <Box
                  sx={{
                    px: 2,
                    py: 1.5,
                    backgroundColor: hasSideEffect
                      ? stopped
                        ? alpha(theme.palette.customColors?.neutralPrimary || theme.palette.grey[500], 0.02)
                        : alpha(theme.palette.warning.light, 0.15)
                      : 'transparent'
                  }}
                >
                  {/* Vaccine Name with CS Badge */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {isControlledSubstance && (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 22,
                          height: 22,
                          borderRadius: '4px',
                          backgroundColor: theme.palette.error.main,
                          flexShrink: 0
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: '10px',
                            fontWeight: 700,
                            color: theme.palette.common.white,
                            lineHeight: 1
                          }}
                        >
                          CS
                        </Typography>
                      </Box>
                    )}
                    <Typography
                      sx={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: theme.palette.customColors?.neutralPrimary || theme.palette.text.primary,
                        flex: 1,
                        textDecoration: stopped ? 'line-through' : 'none'
                      }}
                    >
                      {vaccineName}
                    </Typography>
                  </Box>

                  {/* Alternative Vaccine */}
                  {alternativeVaccine && (
                    <Box sx={{ mt: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Icon
                          icon='mdi:arrow-u-right-bottom'
                          width={16}
                          height={16}
                          color={theme.palette.customColors?.addPrimary || theme.palette.success.main}
                        />
                        <Typography
                          sx={{
                            fontSize: '0.75rem',
                            color: theme.palette.customColors?.addPrimary || theme.palette.success.main
                          }}
                        >
                          Alternative Vaccine
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, ml: 2.5 }}>
                        {isAlternateCS && (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 18,
                              height: 18,
                              borderRadius: '3px',
                              backgroundColor: theme.palette.error.main,
                              flexShrink: 0
                            }}
                          >
                            <Typography sx={{ fontSize: '8px', fontWeight: 700, color: theme.palette.common.white }}>
                              CS
                            </Typography>
                          </Box>
                        )}
                        <Typography
                          sx={{
                            fontSize: '0.8125rem',
                            color: theme.palette.customColors?.onSurfaceVariant || theme.palette.text.secondary
                          }}
                        >
                          {alternativeVaccine}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Stopped Timestamp */}
                  {stopped && stopDate && (
                    <Typography
                      sx={{
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        color: theme.palette.error.main,
                        mt: 0.5
                      }}
                    >
                      Stopped on {Utility.convertUTCToLocalDateTime(stopDate)}
                    </Typography>
                  )}
                </Box>

                {/* Side Effect Warning */}
                {hasSideEffect && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      px: 2,
                      py: 1,
                      backgroundColor: getCardBackground(record)
                    }}
                  >
                    <WarningIcon sx={{ fontSize: 18, color: theme.palette.error.main }} />
                    <Typography
                      sx={{
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: theme.palette.error.main,
                        textTransform: 'uppercase'
                      }}
                    >
                      Caused Adverse Side Effects
                    </Typography>
                  </Box>
                )}

                {/* Details Section */}
                <Box
                  sx={{
                    px: 2,
                    py: 1.5,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    backgroundColor: getCardBackground(record)
                  }}
                >
                  {/* Date and Dose Row */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* Date */}
                    {vaccineDate && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarIcon
                          sx={{
                            fontSize: 18,
                            color: theme.palette.customColors?.onSurfaceVariant || theme.palette.text.secondary
                          }}
                        />
                        <Typography
                          sx={{
                            fontSize: '0.875rem',
                            color: theme.palette.customColors?.onSurfaceVariant || theme.palette.text.secondary
                          }}
                        >
                          {formatDate(vaccineDate)}
                        </Typography>
                      </Box>
                    )}

                    {/* Dose Badge */}
                    {dose && (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          px: 1,
                          py: 0.5,
                          borderRadius: '4px',
                          backgroundColor: alpha(
                            theme.palette.customColors?.neutralPrimary || theme.palette.grey[500],
                            0.05
                          )
                        }}
                      >
                        <Icon
                          icon='mdi:scale-balance'
                          width={16}
                          height={16}
                          color={theme.palette.customColors?.onSurfaceVariant || theme.palette.text.secondary}
                        />
                        <Typography
                          sx={{
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: theme.palette.customColors?.onSurfaceVariant || theme.palette.text.secondary
                          }}
                        >
                          {dose}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Notes */}
                  {notes && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                      <InfoIcon
                        sx={{
                          fontSize: 18,
                          color: theme.palette.customColors?.onSurfaceVariant || theme.palette.text.secondary,
                          mt: 0.25
                        }}
                      />
                      <Typography
                        sx={{
                          fontSize: '0.8125rem',
                          fontStyle: 'italic',
                          color: theme.palette.customColors?.onSurfaceVariant || theme.palette.text.secondary
                        }}
                      >
                        {notes}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            )
          })}

          {hasMore && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
              {loadingMore ? (
                <CircularProgress size={24} />
              ) : (
                <Typography
                  onClick={handleLoadMore}
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: theme.palette.primary.main,
                    cursor: 'pointer',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  {t('animals_module.load_more')}
                </Typography>
              )}
            </Box>
          )}
        </Box>
      )}
    </Box>
  )
}

// ==================== Adverse Rx List ====================

interface AdverseRxListProps {
  animalId: number
  canDelete?: boolean
}

const AdverseRxList: FC<AdverseRxListProps> = ({ animalId, canDelete = true }) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [pageNo, setPageNo] = useState<number>(1)
  const [hasMore, setHasMore] = useState<boolean>(false)
  const [loadingMore, setLoadingMore] = useState<boolean>(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [deleting, setDeleting] = useState<boolean>(false)

  const fetchData = async (page: number, append: boolean = false): Promise<void> => {
    try {
      if (page === 1) setLoading(true)
      else setLoadingMore(true)

      const res = await getMedicineSideEffect({ animal_id: animalId, page_no: page })

      if (res?.success) {
        // Handle both response formats: res.data.result (mobile) or res.data (array)
        const responseData = res.data
        const records = Array.isArray(responseData) ? responseData : responseData?.result || []

        if (append) {
          setData(prev => [...prev, ...records])
        } else {
          setData(records)
        }
        setHasMore(records.length === 10)
      }
    } catch (error) {
      console.error('Error fetching adverse reactions:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchData(1)
  }, [animalId])

  const handleLoadMore = (): void => {
    const nextPage = pageNo + 1
    setPageNo(nextPage)
    fetchData(nextPage, true)
  }

  const handleDeleteClick = (item: any) => {
    setSelectedItem(item)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedItem) return

    setDeleting(true)
    try {
      const res = await deleteMedicineSideEffect({
        side_effect_id: selectedItem.side_effect_id || selectedItem.id
      })

      if (res?.success) {
        Toaster({ type: 'success', message: res.message || 'Side effect deleted successfully' })
        // Refresh the list
        setPageNo(1)
        fetchData(1)
      } else {
        Toaster({ type: 'error', message: res?.message || 'Failed to delete side effect' })
      }
    } catch (error) {
      console.error('Error deleting side effect:', error)
      Toaster({ type: 'error', message: 'Failed to delete side effect' })
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setSelectedItem(null)
    }
  }

  if (loading) return <CardShimmer />
  if (data.length === 0) return <EmptyState message='No Adverse Reactions Recorded' />

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {data.map((medicine, index) => (
          <Box
            key={medicine.id || index}
            sx={{
              border: `1px solid ${theme.palette.error.main}`,
              borderRadius: '12px',
              p: 3,
              backgroundColor: alpha(theme.palette.error.main, 0.04)
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <BlockIcon sx={{ fontSize: 20, color: theme.palette.error.main }} />
              <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: theme.palette.error.main, flex: 1 }}>
                {medicine.medicine_name || medicine.name || 'Unknown Medicine'}
              </Typography>
            </Box>
            {medicine.side_effect && (
              <Typography sx={{ fontSize: '0.8125rem', color: theme.palette.text.secondary, ml: 4.5 }}>
                Side Effect: {medicine.side_effect}
              </Typography>
            )}
            {medicine.reason && (
              <Typography sx={{ fontSize: '0.8125rem', color: theme.palette.text.secondary, ml: 4.5 }}>
                Reason: {medicine.reason}
              </Typography>
            )}
          </Box>
        ))}

        {hasMore && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
            {loadingMore ? (
              <CircularProgress size={24} />
            ) : (
              <Typography
                onClick={handleLoadMore}
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: theme.palette.primary.main,
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                {t('animals_module.load_more')}
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>Delete Side Effect</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the side effect record for{' '}
            <strong>{selectedItem?.medicine_name || selectedItem?.name || 'this medicine'}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color='error' variant='contained' disabled={deleting}>
            {deleting ? <CircularProgress size={20} color='inherit' /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

// ==================== Main Component ====================

const AnimalMedical: FC<AnimalMedicalProps> = ({ animalDetails }) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const router = useSafeRouter()
  const { id } = router.query

  const [activeTab, setActiveTab] = useState<MainTabType>('Medical Records')
  const animalId = Number(id)

  // Permission checks
  const isAliveValue = animalDetails?.is_alive ?? animalDetails?.isAlive
  const isAlive = isAliveValue === true || isAliveValue === '1' || isAliveValue === 1 || isAliveValue === 'true'
  const isDeleted = animalDetails?.is_deleted === '1' || animalDetails?.is_deleted === 1
  const isOnHold = animalDetails?.animal_status === 'ON_HOLD'

  const canPerformActions = isAlive && !isDeleted

  const handleTabClick = (tab: string) => {
    if (isOnHold && ['Vaccination', 'Deworming', 'Adverse Rx'].includes(tab)) {
      Toaster({ type: 'warning', message: 'This animal is currently on hold. Actions are limited.' })
    }
    setActiveTab(tab as MainTabType)
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Medical Records':
        return <MedicalRecordsList animalId={animalId} />
      case 'Diagnosis':
        return <DiagnosisList animalId={animalId} />
      case 'Prescription':
        return <PrescriptionList animalId={animalId} />
      case 'Complaints':
        return <ComplaintsList animalId={animalId} mortalityId={null} mortalityCreatedAt={null} />
      case 'Clinical Notes':
        return <ClinicalNotesList animalId={animalId} />
      case 'Lab Requests':
        return <LabRequestsList animalId={animalId} />
      case 'Vaccination':
        return <VaccinationList animalId={animalId} type='vaccination' canAdd={canPerformActions} />
      case 'Deworming':
        return <VaccinationList animalId={animalId} type='deworming' canAdd={canPerformActions} />
      case 'Adverse Rx':
        return <AdverseRxList animalId={animalId} canDelete={canPerformActions} />
      default:
        return null
    }
  }

  const handleSubTabChange = (event: React.SyntheticEvent, newValue: MainTabType): void => {
    handleTabClick(newValue)
  }

  return (
    <Grid container sx={{ mt: 4 }}>
      {/* Sub-tabs */}
      <Grid size={{ xs: 12 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
          <Tabs
            value={activeTab}
            onChange={handleSubTabChange}
            variant='scrollable'
            scrollButtons='auto'
            sx={{
              '& .MuiTab-root': {
                minHeight: 48,
                textTransform: 'none',
                fontWeight: 500
              }
            }}
          >
            {MEDICAL_SUB_TABS.map(tab => (
              <Tab
                key={tab.id}
                value={tab.id}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Icon icon={tab.icon} fontSize={18} />
                    <span>{t(tab.labelKey)}</span>
                  </Box>
                }
              />
            ))}
          </Tabs>
        </Box>
      </Grid>

      {/* Tab Content */}
      <Grid size={{ xs: 12 }} sx={{ width: '100%' }}>
        {renderTabContent()}
      </Grid>
    </Grid>
  )
}

export default AnimalMedical
