import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Box, Button, Typography, CircularProgress, debounce } from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import { useRouter } from 'next/router'
import Search from 'src/views/utility/Search'
import MUISwitch from 'src/views/forms/form-fields/MUISwitch'
import { useTheme } from '@mui/material/styles'
import { getSymptomsList } from 'src/lib/api/hospital/symptoms'
import SymptomsCard from 'src/views/pages/hospital/inpatient/SymptomsCard'
import ClinicalAssessmentShimmer from 'src/views/pages/hospital/inpatient/shimmer/ClinicalAssessmentShimmer'

const Symptoms = ({ selectedTab, patientData }) => {
  const router = useRouter()
  const { id, animal_id } = router.query
  const [currentTab, setCurrentTab] = useState('Active')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentRecordOnly, setCurrentRecordOnly] = useState(false)
  const [records, setRecords] = useState([])
  const [recordTypeCount, setRecordTypeCount] = useState({})
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [isFetchingMore, setIsFetchingMore] = useState(false)

  const theme = useTheme()
  const observerRef = useRef(null)

  const tabs = ['Active', 'Resolved', 'All']

  const tabTypeMap = {
    Active: 'active',
    Resolved: 'closed',
    All: 'all'
  }

  const getCurrentTabCount = () => {
    return recordTypeCount?.[tabTypeMap[currentTab]] || 0
  }

  const fetchSymptoms = async (query = '', newPage = 1, append = false) => {
    try {
      if (newPage === 1) setLoading(true)
      else setIsFetchingMore(true)

      const params = {
        type: tabTypeMap[currentTab],
        page_no: newPage,
        limit: 20,
        medical_type: 'complaint',
        q: query
      }

      if (currentRecordOnly && patientData?.medical_record_id) {
        params.medical_record_id = patientData?.medical_record_id
      }

      const response = await getSymptomsList(animal_id, params)

      if (response.success === true) {
        if (newPage > 1 && response?.data?.result?.length === 0) {
          return
        }
        setRecords(prevRecords => (append ? [...prevRecords, ...response?.data?.result] : response?.data?.result || []))
        setRecordTypeCount(response?.data)
        setTotalCount(response?.data?.total_count || 0)
      }
    } catch (error) {
      console.error('Error fetching symptoms:', error)
    } finally {
      setLoading(false)
      setIsFetchingMore(false)
    }
  }

  const debouncedFetchSymptoms = useCallback(
    debounce(query => {
      setPage(1)
      fetchSymptoms(query, 1, false)
    }, 500),
    [currentTab, patientData, animal_id, currentRecordOnly]
  )

  const handleTabChange = newValue => {
    setCurrentTab(newValue)
    setPage(1)
    setRecords([])
    setRecordTypeCount({})
  }

  useEffect(() => {
    if (selectedTab === 'symptoms') {
      setPage(1)
      if (searchQuery.trim()) {
        debouncedFetchSymptoms(searchQuery.trim())
      } else {
        fetchSymptoms('', 1, false)
      }
    }
  }, [selectedTab, currentTab, searchQuery, currentRecordOnly])

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()

    const observer = new IntersectionObserver(entries => {
      const firstEntry = entries[0]
      const currentTabCount = getCurrentTabCount()
      if (
        firstEntry.isIntersecting &&
        !isFetchingMore &&
        !loading &&
        records.length > 0 &&
        records?.length < currentTabCount
      ) {
        const nextPage = page + 1
        setPage(nextPage)
        fetchSymptoms(searchQuery.trim(), nextPage, true)
      }
    })

    const scrollTrigger = document.getElementById('infinite-scroll-trigger')
    if (scrollTrigger) observer.observe(scrollTrigger)

    observerRef.current = observer

    return () => observer.disconnect()
  }, [page, loading, searchQuery, records, isFetchingMore, currentTab, recordTypeCount])

  const handleSearchClear = () => {
    setSearchQuery('')
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 6,
            flexWrap: 'wrap',
            rowGap: 4
          }}
        >
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
                {tabs.map(tab => {
                  const countKey = tabTypeMap[tab]
                  const tabCount = recordTypeCount?.[countKey] || 0

                  return (
                    <Box
                      key={tab}
                      onClick={() => handleTabChange(tab)}
                      sx={{
                        flexShrink: 0,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        px: '16px',
                        py: '8px',
                        borderRadius: '8px',
                        backgroundColor:
                          currentTab === tab ? theme.palette.secondary.dark : theme.palette.customColors.mdAntzNeutral,
                        cursor: 'pointer'
                      }}
                    >
                      <Typography
                        sx={{
                          color:
                            currentTab === tab
                              ? theme.palette.primary.contrastText
                              : theme.palette.customColors.neutralPrimary,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {tab} - {tabCount}
                      </Typography>
                    </Box>
                  )
                })}
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
            <Search value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onClear={handleSearchClear} />
            <Button
              variant='contained'
              startIcon={<AddIcon />}
              onClick={() =>
                router.push(
                  `/hospital/inpatient/${id}/symptoms/?animal_id=${animal_id}&medical_record_id=${patientData?.medical_record_id}`
                )
              }
            >
              ADD NEW
            </Button>
          </Box>
        </Box>

        <MUISwitch
          label='Current Medical Record Only'
          checked={currentRecordOnly}
          onChange={e => setCurrentRecordOnly(e.target.checked)}
          size='small'
          sx={{ ml: 2.6 }}
        />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {loading ? (
          <Box sx={{ display: 'flex', py: 2 }}>
            <ClinicalAssessmentShimmer rows={8} />
          </Box>
        ) : records?.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: '70%',
              textAlign: 'center'
            }}
          >
            <img src='/images/no_data_animal_2.png' alt='Grocery Icon' width='250px' />
          </Box>
        ) : (
          records.map((record, index) => (
            <SymptomsCard
              key={index}
              record={record}
              setPage={setPage}
              isDifferential={record.type === 'Differential'}
              isResolved={record.status === 'closed'}
              fetchSymptoms={fetchSymptoms}
            />
          ))
        )}

        <Box
          id='infinite-scroll-trigger'
          sx={{
            display: 'flex',
            justifyContent: 'center',
            py: 1
          }}
        >
          {isFetchingMore && <CircularProgress size={24} />}
        </Box>

        {!loading && !isFetchingMore && records?.length >= 1 && (
          <Typography sx={{ textAlign: 'center', color: theme.palette.text.disabled }}>
            No more symptoms to load
          </Typography>
        )}
      </Box>
    </Box>
  )
}

export default Symptoms
