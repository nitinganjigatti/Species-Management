import React, { useState, useEffect, FC, ReactNode } from 'react'
import { Box, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import MedicalRecordsList from './MedicalRecordsList'
import DiagnosisList from './DiagnosisList'
import PrescriptionList from './PrescriptionList'
import LabRequestsList from './LabRequestsList'
import { getMedicalRecordStats } from 'src/lib/api/necropsy/medicalHistory'

// ==================== Types ====================

interface MedicalHistoryTabsProps {
  animalId: number | string
  hideTitle?: boolean
  mortalityId?: number | string | null
  mortalityCreatedAt?: string | null
}

interface MedicalStats {
  medical_record_count?: number
  diagnosis_count?: number
  prescription_count?: number
  lab_request_count?: number
  [key: string]: number | undefined
}

type TabType = 'Medical Records' | 'Diagnosis' | 'Prescription' | 'Lab Requests'

// ==================== Constants ====================

const TABS: TabType[] = ['Medical Records', 'Diagnosis', 'Prescription', 'Lab Requests']

// ==================== Component ====================

const MedicalHistoryTabs: FC<MedicalHistoryTabsProps> = ({
  animalId,
  hideTitle = false,
  mortalityId,
  mortalityCreatedAt
}) => {
  const theme = useTheme()
  const [activeTab, setActiveTab] = useState<TabType>('Medical Records')
  const [medicalStats, setMedicalStats] = useState<MedicalStats | null>(null)
  const [statsLoading, setStatsLoading] = useState<boolean>(true)

  useEffect(() => {
    if (animalId) {
      fetchMedicalStats()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animalId, mortalityId, mortalityCreatedAt])

  const fetchMedicalStats = async (): Promise<void> => {
    try {
      setStatsLoading(true)

      const params = {
        medical: 'zoo',
        animal_id: animalId,
        purpose: 'necropsy',
        ...(mortalityCreatedAt && { till_date: mortalityCreatedAt }),
        ...(mortalityId && { mortality_id: mortalityId })
      }
      const res = await getMedicalRecordStats(params)
      if (res?.success) {
        setMedicalStats(res.data ?? null)
      }
    } catch (error) {
      console.error('Error fetching medical stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  const hasMedicalHistory =
    (medicalStats?.medical_record_count ?? 0) > 0 || (medicalStats?.diagnosis_count ?? 0) > 0

  const renderTabContent = (): ReactNode => {
    switch (activeTab) {
      case 'Medical Records':
        return (
          <MedicalRecordsList animalId={animalId} mortalityId={mortalityId} mortalityCreatedAt={mortalityCreatedAt} />
        )
      case 'Diagnosis':
        return <DiagnosisList animalId={animalId} mortalityId={mortalityId} mortalityCreatedAt={mortalityCreatedAt} />
      case 'Prescription':
        return (
          <PrescriptionList animalId={animalId} mortalityId={mortalityId} mortalityCreatedAt={mortalityCreatedAt} />
        )
      case 'Lab Requests':
        return <LabRequestsList animalId={animalId} mortalityId={mortalityId} mortalityCreatedAt={mortalityCreatedAt} />
      default:
        return null
    }
  }

  const handleTabClick = (tab: TabType): void => {
    setActiveTab(tab)
  }

  // Show "No medical history available" if stats loaded and count is 0
  if (!statsLoading && !hasMedicalHistory) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {!hideTitle && (
          <Typography
            sx={{
              fontSize: '16px',
              fontWeight: 600,
              color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
            }}
          >
            Medical History
          </Typography>
        )}
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10 }}>
          <Typography
            sx={{ fontSize: '0.875rem', color: theme.palette.customColors?.neutralSecondary, fontWeight: 400 }}
          >
            No medical history available
          </Typography>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {!hideTitle && (
        <Typography
          sx={{
            fontSize: '16px',
            fontWeight: 600,
            color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
          }}
        >
          Medical History
        </Typography>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            flex: '1 1 auto',
            minWidth: 0,
            overflowX: 'auto',
            scrollbarColor: 'transparent transparent',
            columnGap: 4
          }}
        >
          <Box sx={{ display: 'inline-flex', gap: 3, pr: 1, alignItems: 'center' }}>
            {TABS.map((tab: TabType) => (
              <Box
                key={tab}
                onClick={() => handleTabClick(tab)}
                sx={{
                  flexShrink: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  px: '16px',
                  py: '8px',
                  borderRadius: '8px',
                  backgroundColor:
                    activeTab === tab ? theme.palette.secondary.dark : theme.palette.customColors?.mdAntzNeutral,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
              >
                <Typography
                  sx={{
                    color:
                      activeTab === tab
                        ? theme.palette.primary.contrastText
                        : theme.palette.customColors?.neutralPrimary,
                    whiteSpace: 'nowrap',
                    fontSize: { xs: '13px', sm: '14px' },
                    fontWeight: 500
                  }}
                >
                  {tab}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {renderTabContent()}
    </Box>
  )
}

export default MedicalHistoryTabs
