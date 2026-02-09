import React, { useState, useEffect } from 'react'
import { Box, Typography, CircularProgress } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import ClinicalAssessmentCard from 'src/views/pages/hospital/inpatient/ClinicalAssessmentCard'
import ClinicalAssessmentShimmer from 'src/views/pages/hospital/inpatient/shimmer/ClinicalAssessmentShimmer'
import { getMedicalCommonData } from 'src/lib/api/necropsy/medicalHistory'

const SUB_TABS = ['Active', 'Resolved', 'All']

const DiagnosisList = ({ animalId }) => {
  const theme = useTheme()
  const [activeSubTab, setActiveSubTab] = useState('Active')
  const [data, setData] = useState([])
  const [counts, setCounts] = useState({ active: 0, closed: 0, all: 0 })
  const [pageNo, setPageNo] = useState(1)
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const getTypeParam = tab => {
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

  const fetchData = async (tab, page, append = false) => {
    try {
      if (page === 1) setLoading(true)
      else setLoadingMore(true)

      const res = await getMedicalCommonData(animalId, {
        medical_type: 'diagnosis',
        type: getTypeParam(tab),
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
        setCounts({
          active: parseInt(res.data?.active || '0'),
          closed: parseInt(res.data?.closed || '0'),
          all: parseInt(res.data?.all || '0')
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
  }, [activeSubTab, animalId])

  const handleLoadMore = () => {
    const nextPage = pageNo + 1
    setPageNo(nextPage)
    fetchData(activeSubTab, nextPage, true)
  }

  const getTabCount = tab => {
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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Sub-tab pills */}
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
            {SUB_TABS.map(tab => (
              <Box
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                sx={{
                  flexShrink: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  px: '16px',
                  py: '8px',
                  borderRadius: '8px',
                  backgroundColor:
                    activeSubTab === tab
                      ? theme.palette.secondary.dark
                      : theme.palette.customColors.mdAntzNeutral,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
              >
                <Typography
                  sx={{
                    color:
                      activeSubTab === tab
                        ? theme.palette.primary.contrastText
                        : theme.palette.customColors.neutralPrimary,
                    whiteSpace: 'nowrap',
                    fontSize: { xs: '13px', sm: '14px' },
                    fontWeight: 500
                  }}
                >
                  {`${tab} - ${getTabCount(tab)}`}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Content */}
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
              color: theme.palette.customColors.neutralSecondary,
              fontWeight: 400
            }}
          >
            No Diagnosis Recorded
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {data.map((record, index) => (
            <ClinicalAssessmentCard
              key={record.id || index}
              record={record}
              isDifferential={record.clinical_assessment === 'tentative'}
            />
          ))}

          {/* Load More / Infinite scroll loader */}
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
                  Load More
                </Typography>
              )}
            </Box>
          )}

          {/* End of List */}
          {!hasMore && data.length > 10 && (
            <Typography sx={{ textAlign: 'center', mt: 2, color: theme.palette.text.disabled, fontSize: '0.875rem' }}>
              No more assessments to load
            </Typography>
          )}
        </Box>
      )}
    </Box>
  )
}

export default DiagnosisList
