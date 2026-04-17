import React, { useState, useEffect, FC } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import ClinicalAssessmentCard from 'src/views/pages/hospital/inpatient/ClinicalAssessmentCard'
import ClinicalAssessmentShimmer from 'src/views/pages/hospital/inpatient/shimmer/ClinicalAssessmentShimmer'
import { getMedicalCommonData } from 'src/lib/api/necropsy/medicalHistory'
import { MedicalCommonDataParams } from 'src/types/necropsy/api'

// ==================== Types ====================

interface DiagnosisListProps {
  animalId: number | string
  mortalityId?: number | string | null
  mortalityCreatedAt?: string | null
}

interface DiagnosisCounts {
  active: number
  closed: number
  all: number
}

interface DiagnosisRecord {
  id?: number | string
  clinical_assessment?: string
  [key: string]: unknown
}

interface MedicalCommonDataResponse {
  success: boolean
  data?: {
    result?: DiagnosisRecord[]
    active?: string | number
    closed?: string | number
    all?: string | number
  }
}

type SubTabType = 'Active' | 'Resolved' | 'All'

// ==================== Constants ====================

const SUB_TABS: SubTabType[] = ['Active', 'Resolved', 'All']

// ==================== Component ====================

const DiagnosisList: FC<DiagnosisListProps> = ({ animalId, mortalityId, mortalityCreatedAt }) => {
  const theme = useTheme()
  const { t } = useTranslation('common')
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('Active')
  const [data, setData] = useState<DiagnosisRecord[]>([])
  const [counts, setCounts] = useState<DiagnosisCounts>({ active: 0, closed: 0, all: 0 })
  const [pageNo, setPageNo] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(true)
  const [hasMore, setHasMore] = useState<boolean>(false)
  const [loadingMore, setLoadingMore] = useState<boolean>(false)

  const getTypeParam = (tab: SubTabType): 'active' | 'closed' | 'all' => {
    switch (tab) {
      case 'Active':
        return 'active'
      case 'Resolved':
        return 'closed'
      case 'All':
        return 'all'
      default:
        return 'active'
    }
  }

  const fetchData = async (tab: SubTabType, page: number, append: boolean = false): Promise<void> => {
    try {
      if (page === 1) setLoading(true)
      else setLoadingMore(true)

      const params: MedicalCommonDataParams = {
        medical_type: 'diagnosis',
        type: getTypeParam(tab),
        page_no: page,
        limit: 10,
        purpose: 'necropsy',
        ...(mortalityCreatedAt && { till_date: mortalityCreatedAt }),
        ...(mortalityId && { mortality_id: mortalityId })
      }

      const res = await getMedicalCommonData(Number(animalId), params)

      if (res?.success) {
        const records = (res.data?.result || []) as unknown as DiagnosisRecord[]
        if (append) {
          setData((prev: DiagnosisRecord[]) => [...prev, ...records])
        } else {
          setData(records)
        }
        setCounts({
          active: parseInt(String(res.data?.active || '0')),
          closed: parseInt(String(res.data?.closed || '0')),
          all: parseInt(String(res.data?.all || '0'))
        })
        setHasMore(records.length === 10)
      }
    } catch (error) {
      console.error('Error fetching diagnosis data:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    setPageNo(1)
    setData([])
    fetchData(activeSubTab, 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSubTab, animalId, mortalityId, mortalityCreatedAt])

  const handleLoadMore = (): void => {
    const nextPage = pageNo + 1
    setPageNo(nextPage)
    fetchData(activeSubTab, nextPage, true)
  }

  const getTabCount = (tab: SubTabType): number => {
    switch (tab) {
      case 'Active':
        return counts.active
      case 'Resolved':
        return counts.closed
      case 'All':
        return counts.all
      default:
        return 0
    }
  }

  const handleTabClick = (tab: SubTabType): void => {
    setActiveSubTab(tab)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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
            {SUB_TABS.map((tab: SubTabType) => (
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
                    activeSubTab === tab ? theme.palette.secondary.dark : theme.palette.customColors?.mdAntzNeutral,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
              >
                <Typography
                  sx={{
                    color:
                      activeSubTab === tab
                        ? theme.palette.primary.contrastText
                        : theme.palette.customColors?.neutralPrimary,
                    whiteSpace: 'nowrap',
                    fontSize: { xs: '13px', sm: '14px' },
                    fontWeight: 500
                  }}
                >
                  {`${tab === 'Active' ? t('active') : tab === 'Resolved' ? t('necropsy_module.resolved') : t('all')} - ${getTabCount(tab)}`}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {loading ? (
        <ClinicalAssessmentShimmer count={3} />
      ) : data.length === 0 ? (
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            py: 10
          }}
        >
          <Typography
            sx={{
              fontSize: '0.875rem',
              color: theme.palette.customColors?.neutralSecondary,
              fontWeight: 400
            }}
          >
            {t('necropsy_module.no_diagnosis_recorded')}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {data.map((record: DiagnosisRecord, index: number) => (
            <ClinicalAssessmentCard
              key={record.id || index}
              record={record}
              isDifferential={record.clinical_assessment === 'tentative'}
            />
          ))}

          {hasMore && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
              {loadingMore ? (
                <ClinicalAssessmentShimmer count={1} />
              ) : (
                <Typography
                  onClick={handleLoadMore}
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary,
                    cursor: 'pointer',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  {t('necropsy_module.load_more')}
                </Typography>
              )}
            </Box>
          )}

          {!hasMore && data.length > 10 && (
            <Typography sx={{ textAlign: 'center', mt: 2, color: theme.palette.text.disabled, fontSize: '0.875rem' }}>
              {t('necropsy_module.no_more_diagnosis')}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  )
}

export default DiagnosisList
