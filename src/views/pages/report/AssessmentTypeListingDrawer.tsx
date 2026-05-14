import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { Drawer, IconButton, Typography, CircularProgress, Box, Chip, Tooltip } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import { getAssessmentCategoriesList, getAssessmentTypesList } from 'src/lib/api/report'
import { AssessmentTypeListingDrawerProps } from 'src/types/report'

function AssessmentTypeListingDrawer({
  selectedCategory,
  setSelectedCategory,
  selectedAssessmentType,
  setSelectedAssessmentType,
  openassessmentFilter,
  setOpenAssessmentFilter
}: AssessmentTypeListingDrawerProps) {
  const theme = useTheme()
  const drawerContentRef = useRef<HTMLDivElement>(null)

  const headerRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const [footerH, setFooterH] = useState(0)
  const [headerH, setHeaderH] = useState(0)

  const measure = () => {
    setFooterH(footerRef.current?.getBoundingClientRect().height ?? 0)
    setHeaderH(headerRef.current?.getBoundingClientRect().height ?? 0)
  }

  useLayoutEffect(() => {
    measure()
  }, [])

  useEffect(() => {
    window.addEventListener('resize', measure)

    return () => window.removeEventListener('resize', measure)
  }, [])

  const [tempSelectedCategory, setTempSelectedCategory] = useState(selectedCategory || 0)
  const [tempSelectedAssessmentType, setTempSelectedAssessmentType] = useState(selectedAssessmentType || null)

  const [assessmentcategoryLoading, setAssessmentCategoryLoading] = useState(false)
  const [assessmentCategoryList, setAssessmentCategoryList] = useState<{ assessment_category_id: number; label: string }[]>([])

  const [assessmenttypeLoading, setAssessmentTypeLoading] = useState(false)
  const [assessmentTypeList, setAssessmentTypeList] = useState<{ assessment_type_id: number; assessments_type_label: string; assessment_category_id?: number }[]>([])
  const [assessmentTypeCount, setAssessmentTypeCount] = useState(0)

  const fetchAssessmentCategories = async () => {
    setAssessmentCategoryLoading(true)

    try {
      const res = await getAssessmentCategoriesList({ ref_type: 'animal' })
      const newList: { assessment_category_id: number; label: string }[] = res?.data || []
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
        cat_id: tempSelectedCategory,
        q
      })
      const newAssessmentTypes: { assessment_type_id: number; assessments_type_label: string; assessment_category_id?: number }[] = res?.data?.result || []

      setAssessmentTypeCount(res?.data?.total_count ?? 0)
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
  }, [tempSelectedCategory])

  const handleCloseDrawer = () => {
    setSelectedAssessmentType(tempSelectedAssessmentType ?? '')
    setSelectedCategory(tempSelectedCategory)
    setOpenAssessmentFilter(false)
    setTempSelectedAssessmentType(null)
  }

  return (
    <Drawer
      anchor='right'
      open={openassessmentFilter}
      sx={{
        '& .MuiDrawer-paper': {
          width: ['100%', '562px'],
          height: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'background.default'
        }
      }}
    >
      {/* Header */}
      <Box
        ref={headerRef}
        className='sidebar-header'
        sx={{
          backgroundColor: 'background.default',
          p: theme => theme.spacing(3, 3.255, 3, 5.255)
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
            <Typography sx={{ fontSize: '24px', fontWeight: 500 }}>Select Assessment Type</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <IconButton size='small' sx={{ color: 'text.primary' }} onClick={handleCloseDrawer}>
              <Icon icon='mdi:close' fontSize={24} />
            </IconButton>
          </Box>
        </Box>

        <Box
          sx={{
            my: 4,
            display: 'flex',
            overflowX: 'auto',
            gap: 2,
            backgroundColor: 'background.default',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': {
              display: 'none'
            }
          }}
        >
          {assessmentCategoryList.length > 0 &&
            assessmentCategoryList?.map(category => (
              <Chip
                key={category?.assessment_category_id}
                label={category?.label}
                onClick={() => setTempSelectedCategory(category?.assessment_category_id)}
                sx={{
                  px: 2,
                  py: 1.5,
                  borderRadius: '8px',
                  fontWeight: 400,
                  fontSize: '16px',
                  whiteSpace: 'nowrap',
                  bgcolor:
                    tempSelectedCategory === category?.assessment_category_id
                      ? theme.palette.primary.light
                      : theme.palette.customColors.OnPrimary50,
                  color:
                    tempSelectedCategory === category?.assessment_category_id
                      ? theme.palette.primary.contrastText
                      : theme.palette.primary.light,
                  '&:hover': {
                    cursor: 'pointer',
                    opacity: 0.9
                  }
                }}
              />
            ))}
        </Box>
      </Box>

      {/* Content */}
      {assessmentcategoryLoading || assessmenttypeLoading ? (
        <Box
          sx={{
            backgroundColor: 'background.default',
            height: '100%',
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <CircularProgress size={24} />
        </Box>
      ) : (
        <>
          <Box
            ref={scrollRef}
            sx={{
              flex: '1 1 auto',
              minHeight: 0,
              overflowY: 'auto',
              pb: `calc(${footerH}px + env(safe-area-inset-bottom, 0px) + 16px)`,
              backgroundColor: 'background.default'
            }}
          >
            <Box sx={{ bgcolor: 'background.default', p: theme => theme.spacing(0, 3.255, 3, 5.255) }}>
              <Box sx={{ mt: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {assessmentTypeList.length > 0 &&
                  assessmentTypeList.map((item, index) => {
                    const isSelected = tempSelectedAssessmentType?.assessment_type_id === item?.assessment_type_id

                    return (
                      <Box
                        key={index}
                        onClick={() => setTempSelectedAssessmentType(item)}
                        sx={{
                          bgcolor: theme.palette.primary.contrastText,
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          height: '56px',
                          pl: 4,
                          cursor: 'pointer',
                          border: isSelected ? `1px solid ${theme.palette.primary.main}` : '0px'
                        }}
                      >
                        <Tooltip title={item.assessments_type_label}>
                          <Typography
                            sx={{
                              fontWeight: 600,
                              fontSize: '16px',
                              letterSpacing: 0,
                              display: '-webkit-box',
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {item?.assessments_type_label}
                          </Typography>
                        </Tooltip>
                        <Box
                          sx={{
                            bgcolor: theme.palette.customColors.Surface,
                            minWidth: '56px',
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
                              border: `1.5px solid ${
                                isSelected ? theme.palette.primary.main : theme.palette.customColors.neutralSecondary
                              }`
                            }}
                          >
                            {isSelected && (
                              <Box
                                sx={{
                                  height: '10px',
                                  width: '10px',
                                  borderRadius: '50%',
                                  border: `1.5px solid ${
                                    isSelected
                                      ? theme.palette.primary.main
                                      : theme.palette.customColors.neutralSecondary
                                  }`,
                                  bgcolor: isSelected ? theme.palette.primary.main : 'transparent'
                                }}
                              ></Box>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    )
                  })}
              </Box>
            </Box>
          </Box>

          {/* Bottom Button */}
          <Box
            sx={{
              minHeight: '106px',
              position: 'sticky',
              bottom: 0,
              px: 4,
              maxWidth: '562px',
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
        </>
      )}
    </Drawer>
  )
}

export default AssessmentTypeListingDrawer
