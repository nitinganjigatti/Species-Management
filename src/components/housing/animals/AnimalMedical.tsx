import React, { useState, useEffect, FC } from 'react'
import { Box, Typography, Chip, Skeleton, CircularProgress, alpha } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useRouter } from 'next/router'
import { Block as BlockIcon, Vaccines as VaccineIcon } from '@mui/icons-material'

// Import necropsy components for reuse
import MedicalRecordsList from 'src/components/necropsy/MedicalRecordsList'
import DiagnosisList from 'src/components/necropsy/DiagnosisList'
import PrescriptionList from 'src/components/necropsy/PrescriptionList'
import ComplaintsList from 'src/components/necropsy/ComplaintsList'
import LabRequestsList from 'src/components/necropsy/LabRequestsList'

// Import APIs
import { getVaccinationList, getMedicineSideEffect } from 'src/lib/api/housing'
import Utility from 'src/utility'
import NoDataFound from 'src/views/utility/NoDataFound'

// ==================== Types ====================

interface AnimalMedicalProps {
  animalDetails?: {
    isAlive?: string
  }
}

type MainTabType = 'Medical Records' | 'Diagnosis' | 'Prescription' | 'Complaints' | 'Lab Requests' | 'Vaccination' | 'Deworming' | 'Adverse Rx'

const MAIN_TABS: MainTabType[] = [
  'Medical Records',
  'Diagnosis',
  'Prescription',
  'Complaints',
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
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10, flexDirection: 'column' }}>
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
  const theme = useTheme()

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
          {tabs.map((tab) => {
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

// ==================== Vaccination/Deworming List ====================

interface VaccinationListProps {
  animalId: number
  type: 'vaccination' | 'deworming'
}

const VaccinationList: FC<VaccinationListProps> = ({ animalId, type }) => {
  const theme = useTheme()
  const [activeSubTab, setActiveSubTab] = useState<'Pending' | 'Upcoming' | 'Completed'>('Pending')
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const fetchData = async (tab: string): Promise<void> => {
    try {
      setLoading(true)

      const res = await getVaccinationList({
        animal_id: animalId,
        type,
        status: tab.toLowerCase() as any,
        page_no: 1
      })

      if (res?.success) {
        setData(res.data || [])
      }
    } catch (error) {
      console.error(`Error fetching ${type} data:`, error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(activeSubTab)
  }, [activeSubTab, animalId, type])

  const getStatusColor = (status: string): 'success' | 'warning' | 'info' | 'default' => {
    switch (status.toLowerCase()) {
      case 'completed': return 'success'
      case 'pending': return 'warning'
      case 'upcoming': return 'info'
      default: return 'default'
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <PillTabs
        tabs={['Pending', 'Upcoming', 'Completed']}
        activeTab={activeSubTab}
        onTabClick={(tab) => setActiveSubTab(tab as any)}
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
                  {record.vaccine_name || record.medicine_name || record.name || (type === 'vaccination' ? 'Vaccine' : 'Deworming')}
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
        </Box>
      )}
    </Box>
  )
}

// ==================== Adverse Rx List ====================

interface AdverseRxListProps {
  animalId: number
}

const AdverseRxList: FC<AdverseRxListProps> = ({ animalId }) => {
  const theme = useTheme()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await getMedicineSideEffect({ animal_id: animalId, page_no: 1 })
        if (res?.success) {
          setData(res.data || [])
        }
      } catch (error) {
        console.error('Error fetching adverse reactions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [animalId])

  if (loading) return <CardShimmer />
  if (data.length === 0) return <EmptyState message='No Adverse Reactions Recorded' />

  return (
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
    </Box>
  )
}

// ==================== Main Component ====================

const AnimalMedical: FC<AnimalMedicalProps> = () => {
  const theme = useTheme()
  const router = useRouter()
  const { id } = router.query

  const [activeTab, setActiveTab] = useState<MainTabType>('Medical Records')
  const animalId = Number(id)

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
      case 'Lab Requests':
        return <LabRequestsList animalId={animalId} />
      case 'Vaccination':
        return <VaccinationList animalId={animalId} type='vaccination' />
      case 'Deworming':
        return <VaccinationList animalId={animalId} type='deworming' />
      case 'Adverse Rx':
        return <AdverseRxList animalId={animalId} />
      default:
        return null
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, py: 4 }}>
      <PillTabs tabs={MAIN_TABS} activeTab={activeTab} onTabClick={(tab) => setActiveTab(tab as MainTabType)} />
      {renderTabContent()}
    </Box>
  )
}

export default AnimalMedical
