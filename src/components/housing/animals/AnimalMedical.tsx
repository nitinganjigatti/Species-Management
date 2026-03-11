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
  Button
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useRouter } from 'next/router'
import {
  Block as BlockIcon,
  Vaccines as VaccineIcon,
  Delete as DeleteIcon,
  Notes as NotesIcon
} from '@mui/icons-material'

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

const MAIN_TABS: MainTabType[] = [
  'Medical Records',
  'Diagnosis',
  'Prescription',
  'Complaints',
  'Clinical Notes',
  'Lab Requests',
  'Vaccination',
  'Deworming',
  'Adverse Rx'
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
  if (data.length === 0) return <EmptyState message='No Clinical Notes Recorded' />

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
                        {note.clinical_notes || note.notes || note.note || 'No notes available'}
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
              Load More
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

const VaccinationList: FC<VaccinationListProps> = ({ animalId, type, canAdd = true }) => {
  const theme = useTheme()
  const [activeSubTab, setActiveSubTab] = useState<'Pending' | 'Upcoming' | 'Completed'>('Pending')
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [pageNo, setPageNo] = useState<number>(1)
  const [hasMore, setHasMore] = useState<boolean>(false)
  const [loadingMore, setLoadingMore] = useState<boolean>(false)

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

  const getStatusColor = (status: string): 'success' | 'warning' | 'info' | 'default' => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success'
      case 'pending':
        return 'warning'
      case 'upcoming':
        return 'info'
      default:
        return 'default'
    }
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
      />

      {loading ? (
        <CardShimmer />
      ) : data.length === 0 ? (
        <EmptyState message={`No ${type === 'vaccination' ? 'Vaccination' : 'Deworming'} Records Found`} />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {data.map((record, index) => (
            <Box
              key={record.id || index}
              sx={{
                border: `1px solid ${theme.palette.success.main}`,
                borderRadius: '12px',
                p: 3,
                backgroundColor: 'transparent',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.success.main, 0.04)
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <VaccineIcon sx={{ fontSize: 24, color: theme.palette.success.main }} />
                <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: theme.palette.text.primary, flex: 1 }}>
                  {record.vaccine_name ||
                    record.medicine_name ||
                    record.name ||
                    (type === 'vaccination' ? 'Vaccine' : 'Deworming')}
                </Typography>
                <Chip
                  label={record.status || activeSubTab}
                  size='small'
                  color={getStatusColor(record.status || activeSubTab)}
                  sx={{ borderRadius: '6px' }}
                />
              </Box>
              {record.dose && (
                <Typography sx={{ fontSize: '0.8125rem', color: theme.palette.text.secondary, ml: 5 }}>
                  Dose: {record.dose}
                </Typography>
              )}
              {record.scheduled_date && (
                <Typography sx={{ fontSize: '0.8125rem', color: theme.palette.text.secondary, ml: 5 }}>
                  Scheduled: {Utility.formatDisplayDate(record.scheduled_date)}
                </Typography>
              )}
              {record.administered_date && (
                <Typography sx={{ fontSize: '0.8125rem', color: theme.palette.text.secondary, ml: 5 }}>
                  Administered: {Utility.formatDisplayDate(record.administered_date)}
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
                  Load More
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
              <Chip label='Blocked' size='small' color='error' sx={{ borderRadius: '6px' }} />
              {canDelete && (
                <IconButton
                  size='small'
                  onClick={() => handleDeleteClick(medicine)}
                  sx={{
                    color: theme.palette.error.main,
                    '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.1) }
                  }}
                >
                  <DeleteIcon fontSize='small' />
                </IconButton>
              )}
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
                Load More
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
  const theme = useTheme()
  const router = useRouter()
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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, py: 4 }}>
      <PillTabs tabs={MAIN_TABS} activeTab={activeTab} onTabClick={handleTabClick} />
      {renderTabContent()}
    </Box>
  )
}

export default AnimalMedical
