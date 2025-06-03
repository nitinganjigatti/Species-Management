import { LoadingButton } from '@mui/lab'
import { Drawer, IconButton, Typography, CircularProgress, Box, Chip } from '@mui/material'
import Icon from 'src/@core/components/icon'
import React, { useState, useEffect, useRef, useContext } from 'react'
import { useTheme } from '@mui/material/styles'
import { getAssessmentCategoriesList, getAssessmentTypesList } from 'src/lib/api/report'
import { AuthContext } from 'src/context/AuthContext'

function AssessmentTypeFilter({
  selectedAssessmentType,
  setSelectedAssessmentType,
  openassessmentFilter,
  setOpenAssessmentFilter
}) {
  const theme = useTheme()
  const drawerContentRef = useRef(null)

  const [tempSelectedAssessmentType, setTempSelectedAssessmentType] = useState(selectedAssessmentType || null)

  const [assessmentcategoryLoading, setAssessmentCategoryLoading] = useState(false)
  const [assessmentCategoryList, setAssessmentCategoryList] = useState([])

  const [assessmenttypeLoading, setAssessmentTypeLoading] = useState(false)
  const [assessmentTypeList, setAssessmentTypeList] = useState([])
  const [assessmentTypeCount, setAssessmentTypeCount] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState(0)

  const fetchAssessmentCategories = async () => {
    setAssessmentCategoryLoading(true)

    try {
      const res = await getAssessmentCategoriesList({ ref_type: 'animal' })
      //   console.log('res.data', res.data)
      const newList = res?.data || []
      setAssessmentCategoryList([
        {
          assessment_category_id: 0,
          label: 'All'
        },
        ...newList
      ])
    } catch (err) {
      console.error('Failed to fetch assessment category list:', err)
    } finally {
      setAssessmentCategoryLoading(false)
    }
  }

  const fetchAssessmentTypes = async (q = '') => {
    setAssessmentTypeLoading(true)

    try {
      const res = await getAssessmentTypesList({
        ref_type: 'animal',
        cat_id: selectedCategory,
        q
        // limit: 10,
        // page_no: pageNum
      })
      const newAssessmentTypes = res?.data?.result || []

      setAssessmentTypeCount(res?.data?.total_count)
      setAssessmentTypeList(newAssessmentTypes)
    } catch (err) {
      console.error('Failed to fetch taxonomy list:', err)
    } finally {
      setAssessmentTypeLoading(false)
    }
  }

  useEffect(() => {
    fetchAssessmentCategories()
  }, [])

  useEffect(() => {
    fetchAssessmentTypes()
  }, [selectedCategory])

  const handleCloseDrawer = () => {
    setSelectedAssessmentType(tempSelectedAssessmentType)
    setOpenAssessmentFilter(false)
    setTempSelectedAssessmentType(null)
  }

  // const debouncedSearch = useCallback(
  //   debounce(value => {
  //     setPage(1)
  //     setSpeciesList([])
  //     setHasMore(true)
  //     fetchSpecies(value, 1, true)
  //   }, 500),
  //   []
  // )

  //   const handleSearchChange = e => {
  //     const value = e.target.value
  //     setSearchValue(value)
  //     debouncedSearch(value)
  //   }

  //   const handleScroll = () => {
  //     if (!drawerContentRef.current || loading || !hasMore) return
  //     const { scrollTop, scrollHeight, clientHeight } = drawerContentRef.current
  //     if (scrollHeight - scrollTop <= clientHeight + 100) {
  //       const nextPage = page + 1
  //       setPage(nextPage)
  //       fetchSpecies(searchValue, nextPage)
  //     }
  //   }

  return (
    <Drawer
      anchor='right'
      open={openassessmentFilter}
      sx={{
        '& .MuiDrawer-paper': { width: ['100%', '562px'], height: '100vh' },
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        backgroundColor: 'background.default'
      }}
    >
      {/* Header */}
      <Box
        className='sidebar-header'
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'background.default',
          p: theme => theme.spacing(3, 3.255, 3, 5.255)
        }}
      >
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
          <Typography sx={{ fontSize: '24px', fontWeight: 500 }}>select Assessment</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <IconButton size='small' sx={{ color: 'text.primary' }} onClick={handleCloseDrawer}>
            <Icon icon='mdi:close' fontSize={24} />
          </IconButton>
        </Box>
      </Box>

      {/* Content */}
      <Box
        // ref={drawerContentRef}
        // onScroll={handleScroll}
        sx={{
          overflowY: 'auto',
          flexGrow: 1,
          backgroundColor: 'background.default'
        }}
      >
        <Box sx={{ bgcolor: 'background.default', p: theme => theme.spacing(3, 3.255, 3, 5.255) }}>
          <Box
            sx={{
              display: 'flex',
              overflowX: 'auto',
              gap: 2,
              scrollbarWidth: 'none', // Firefox
              '&::-webkit-scrollbar': {
                display: 'none' // Chrome
              }
            }}
          >
            {assessmentcategoryLoading ? (
              <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mt: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              assessmentCategoryList.length > 0 &&
              assessmentCategoryList?.map(category => (
                <Chip
                  key={category?.assessment_category_id}
                  label={category?.label}
                  onClick={() => setSelectedCategory(category?.assessment_category_id)}
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderRadius: '8px',
                    fontWeight: 400,
                    fontSize: '16px',
                    whiteSpace: 'nowrap',
                    bgcolor: selectedCategory === category?.assessment_category_id ? '#1F515B' : '#FFFFFFBF',
                    color: selectedCategory === category?.assessment_category_id ? '#FFFFFF' : '#1F515B',
                    '&:hover': {
                      cursor: 'pointer',
                      opacity: 0.9
                    }
                  }}
                />
              ))
            )}
          </Box>
          <Box sx={{ pb: 25, mt: 4, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {assessmenttypeLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              assessmentTypeList.length > 0 &&
              assessmentTypeList.map((item, index) => {
                const isSelected = tempSelectedAssessmentType?.assessment_type_id === item?.assessment_type_id

                return (
                  <Box
                    key={index}
                    onClick={() => setTempSelectedAssessmentType(item)}
                    sx={{
                      bgcolor: '#FFFFFF',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      height: '56px',
                      pl: 4,
                      cursor: 'pointer',
                      border: isSelected ? '1px solid #37BD69' : '0px'
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontSize: '16px',
                        lineHeight: '100%',
                        letterSpacing: 0
                      }}
                    >
                      {item?.assessments_type_label}
                    </Typography>
                    <Box
                      sx={{
                        bgcolor: '#F2FFF8',
                        width: '56px',
                        height: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderTopRightRadius: '8px',
                        borderBottomRightRadius: '8px'
                      }}
                    >
                      <Box
                        sx={{
                          height: '18px',
                          width: '18px',
                          padding: '3px',
                          borderRadius: '50%',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          border: `1.5px solid ${isSelected ? '#37BD69' : '#7A8684'}`
                        }}
                      >
                        {isSelected && (
                          <Box
                            sx={{
                              height: '10px',
                              width: '10px',
                              borderRadius: '50%',
                              border: `1.5px solid ${isSelected ? '#37BD69' : '#7A8684'}`,
                              bgcolor: isSelected ? '#37BD69' : 'transparent'
                            }}
                          ></Box>
                        )}
                      </Box>
                    </Box>
                  </Box>
                )
              })
            )}
          </Box>
        </Box>
      </Box>

      {/* Bottom Button */}
      <Box
        sx={{
          height: '106px',
          width: '100%',
          maxWidth: '562px',
          position: 'fixed',
          bottom: 0,
          px: 4,
          bgcolor: 'white',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
          display: 'flex',
          boxShadow: '0px -4px 10px rgba(0, 0, 0, 0.2)',
          zIndex: 123
        }}
      >
        <LoadingButton
          disabled={!tempSelectedAssessmentType?.assessment_category_id}
          sx={{ height: '58px' }}
          fullWidth
          variant='contained'
          size='large'
          onClick={() => handleCloseDrawer()}
        >
          DONE
        </LoadingButton>
      </Box>
    </Drawer>
  )
}

export default AssessmentTypeFilter
