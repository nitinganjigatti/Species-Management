import { useState, useEffect, useContext, useCallback } from 'react'
import {
  Avatar,
  Box,
  Button,
  Card,
  CircularProgress,
  debounce,
  Dialog,
  IconButton,
  InputAdornment,
  TextField,
  Typography
} from '@mui/material'
import { useTheme } from '@mui/material/styles'

import moment from 'moment'
import dayjs from 'dayjs'

import Utility from 'src/utility'
import { AuthContext } from 'src/context/AuthContext'
import Icon from 'src/@core/components/icon'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'

import StickyTable from 'src/views/table/sticky-table'
import AssessmentReportFilterDrawer from 'src/views/pages/report/AssessmentReportFilterDrawer'
import AssessmentSpeciesFilter from 'src/views/pages/report/AssessmentSpeciesFilter'
import AssessmentTypeFilter from 'src/views/pages/report/AssessmentTypeFilter'

import { getAnimalAssessment, getAnimalAssessmentReport } from 'src/lib/api/report'

const AnimalAssessment = () => {
  const theme = useTheme()
  const authData = useContext(AuthContext)

  const [selectedSpecie, setSelectedSpecie] = useState(null)
  const [openspeciesFilter, setOpenspeciesFilter] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(0)
  const [selectedAssessmentType, setSelectedAssessmentType] = useState(null)
  const [openassessmentFilter, setOpenAssessmentFilter] = useState(false)

  const [search, setSearch] = useState()
  const defaultEndDate = dayjs().format('YYYY-MM-DD')
  const defaultStartDate = dayjs().subtract(6, 'month').format('YYYY-MM-DD')
  const [filterDates, setFilterDates] = useState({
    startDate: defaultStartDate,
    endDate: defaultEndDate
  })

  const [isLoading, setIsLoading] = useState(false)
  const [assessmentData, setAssessmentData] = useState([])
  const [maxAssessmentCount, setMaxAssessmentCount] = useState(0)
  const [headerList, setHeaderList] = useState([])
  const [dataList, setDataList] = useState([])
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [total, setTotal] = useState(0)

  const [openFilterDrawer, setOpenFilterDrawer] = useState(false)
  const tabsforfilter = ['Site, Sec or Encl.', 'Accession Date', 'Gender']
  const [activeTab, setActiveTab] = useState('Site, Sec or Encl.')
  const [openSiteListDrawer, setSiteListDrawer] = useState(false)

  const [siteData, setSiteData] = useState([])
  const [sectionsData, setSectionsData] = useState([])
  const [enclosuresData, setEnclosuresData] = useState([])
  const [selectedSections, setSelectedSections] = useState([])
  const [selectedEnclosures, setSelectedEnclosures] = useState([])

  const [selectedItems, setSelectedItems] = useState({
    Site: [],
    Section: [],
    Enclosure: [],
    gender: [],
    accession_start: null,
    accession_end: null
  })
  const [tempSelectedItems, setTempSelectedItems] = useState(selectedItems)
  const [filterCount, setFilterCount] = useState(0)

  const [showDetailsPopUp, setShowDetailsPopUp] = useState(false)
  const [animalDetailsData, setAnimalDetailsData] = useState({})

  //////////////////////////////////////////////////////////////
  const [searchTerm, setSearchTerm] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // api call for table data
  const animalAssessmentReport = async searchValue => {
    setIsLoading(true)
    const params = {
      page: paginationModel.page + 1,
      limit: paginationModel.pageSize
    }
    const payload = {
      taxonomy_ids: selectedSpecie?.tsn_id,
      assessment_type_ids: selectedAssessmentType?.assessment_type_id,
      start_date: filterDates.startDate,
      end_date: filterDates.endDate,
      q: searchValue || '',
      site_ids: selectedItems.Site.toString() || '',
      section_ids: selectedItems.Section.toString() || '',
      enclosure_ids: selectedItems.Enclosure.toString() || '',
      gender: selectedItems.gender.toString() || '',
      accession_start: selectedItems.accession_start || '',
      accession_end: selectedItems.accession_end || ''
    }

    try {
      const res = await getAnimalAssessmentReport(params, payload)

      setAssessmentData(res?.data?.animals || [])
      setMaxAssessmentCount(res?.data?.max_assessment_count || 0)
      setTotal(res?.data?.total_records)
    } catch (error) {
      console.log('error', error)
    } finally {
      setIsLoading(false)
    }
  }

  const debouncedSearch = useCallback(
    debounce(searchValue => {
      animalAssessmentReport(searchValue)
    }, 500),
    []
  )

  const handleSearchChange = e => {
    const value = e.target.value
    setSearch(value)
    debouncedSearch(value)
  }

  useEffect(() => {
    if (selectedSpecie && selectedAssessmentType) {
      animalAssessmentReport()
    }
  }, [paginationModel, filterDates, selectedItems])

  useEffect(() => {
    if (assessmentData?.length) {
      transformAnimalData()
    }
  }, [assessmentData])

  // Transform raw animal data
  const transformAnimalData = () => {
    const animals = assessmentData || []
    const transformed = animals?.map(animal => {
      const age =
        animal.birth_date && moment(animal.birth_date).isValid()
          ? `${moment().diff(moment(animal.birth_date), 'years')}y ${
              moment().diff(moment(animal.birth_date), 'months') % 12
            }m`
          : '-'
      const recordMap = {}
      animal.assessment_data.assessments.forEach((assessment, index) => {
        recordMap[`record_${index}`] = {
          value: `${assessment.assessment_value} ${assessment?.uom_abbr ?? assessment.assessment_type}${
            Number(assessment?.assessment_value) > 1 ? 's' : ''
          }`,
          date: moment(assessment.assessment_recorded_date).format('DD MMM YYYY'),
          time: moment(assessment.assessment_recorded_time, 'HH:mm:ss').format('hh:mm A'),
          user: assessment.user_details
        }
      })

      return {
        ...recordMap,
        default_icon: '',
        primary_identifier_type: animal.identifier_type,
        primary_identifier_value: animal.identifier_value,
        primary_animal_id: animal.animal_id,
        primary_taxonomy_id: animal.taxonomy_id,
        common_name: animal.common_name,
        scientific_name: animal.scientific_name,
        age,
        site: animal.site,
        sex: animal.sex
      }
    })

    setDataList(transformed)
    // setTotal(transformed.length)

    const headers = [
      { key: 'default_icon', label: 'ANIMAL DETAILS' },
      ...Array.from({ length: maxAssessmentCount }, (_, i) => ({
        key: `record_${i}`,
        label:
          i === 0 ? (
            <span style={{ display: 'inline-block', marginLeft: '14px' }}>
              {selectedAssessmentType?.assessments_type_label}
            </span>
          ) : (
            ''
          )
      }))
    ]
    setHeaderList(headers)
  }

  const AnimalCard = ({ animalData }) => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          alignItems: 'center'
        }}
      >
        <Avatar
          sx={{
            '& > img': {
              objectFit:
                animalData?.default_icon?.includes('class_images') && animalData?.default_icon?.endsWith('.svg')
                  ? 'contain'
                  : 'cover',
              padding:
                animalData?.default_icon?.includes('class_images') && animalData?.default_icon.endsWith('.svg')
                  ? '3px'
                  : 0
            },
            width: 32,
            height: 32
          }}
          alt={animalData?.default_icon}
          src={animalData?.default_icon}
        />
        <Avatar
          sx={{
            width: 22.22,
            height: 20.15,
            bgcolor:
              animalData?.type === 'group'
                ? theme.palette.customColors.addPrimary
                : animalData?.sex === 'male'
                ? theme.palette.customColors.SecondaryContainer
                : animalData?.sex === 'female'
                ? theme.palette.customColors.AntzTertiary
                : animalData?.sex === 'undetermined' || animalData?.sex === 'indeterminate'
                ? theme.palette.customColors.displaybgSecondary
                : theme.palette.customColors.SecondaryContainer,
            objectFit: 'contain',
            pt: 0.2,
            height: 24,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
          variant='rounded'
        >
          {animalData?.type === 'group' ? (
            <Typography sx={{ fontSize: 14, color: theme.palette.primary.contrastText, fontWeight: 500 }}>G</Typography>
          ) : animalData?.sex === 'male' ? (
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.customColors.OnSecondaryContainer }}>
              M
            </Typography>
          ) : animalData?.sex === 'female' ? (
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#4A0415' }}>F</Typography>
          ) : animalData?.sex === 'undetermined' ? (
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.customColors.Error }}>UD</Typography>
          ) : animalData?.sex === 'indeterminate' ? (
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}>
              ID
            </Typography>
          ) : (
            <Typography sx={{ fontSize: 14 }}>-</Typography>
          )}
        </Avatar>
      </Box>
      <Box>
        <Typography
          sx={{
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: 0,
            color: theme.palette.customColors.OnSurfaceVariant
          }}
        >
          AID: {animalData?.primary_animal_id}
        </Typography>
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 500,
            letterSpacing: 0,
            color: theme.palette.customColors.OnSurfaceVariant
          }}
        >
          {animalData?.common_name}
        </Typography>
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 400,
            letterSpacing: 0,
            color: theme.palette.customColors.OnSurfaceVariant
          }}
        >
          {animalData?.scientific_name}
        </Typography>
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 400,
            letterSpacing: 0,
            color: theme.palette.customColors.OnSurfaceVariant
          }}
        >
          Age : {animalData?.age}
        </Typography>
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 400,
            letterSpacing: 0,
            color: theme.palette.customColors.OnSurfaceVariant
          }}
        >
          Site : {animalData?.site}
        </Typography>
      </Box>
    </Box>
  )

  const columns = headerList.map((header, i) => {
    if (header.key === 'default_icon') {
      return {
        field: 'Animals',
        headerName: header.label,
        pinned: 'left',
        width: 300,
        height: 131,
        sortable: false,
        headerStyle: {
          zIndex: 1000 + 1
        },
        columnStyle: {
          border: `1px solid ${theme.palette.customColors.customTableBorderBg}`,
          borderRight: 'none',
          p: 0,
          m: 0
        },
        disableColumnMenu: true,
        renderCell: params => (
          <Box
            sx={{
              paddingLeft: '20px'
            }}
          >
            <AnimalCard animalData={params?.row} />
          </Box>
        )
      }
    }
    return {
      field: header.key,
      headerName: header.label,
      width: 240,
      sortable: false,
      disableColumnMenu: true,
      headerStyle: i === 1 && { position: 'sticky', left: 300, zIndex: 1000, p: 0, m: 0 },
      columnStyle: {
        height: '100px',
        border: `1px solid ${theme.palette.customColors.customTableBorderBg}`,
        borderLeft: i === 1 && 'none',
        p: 0,
        m: 0
      },
      renderCell: params => {
        // console.log('params', params)
        const record = params?.row[header.key]
        return record ? (
          <Box
            onClick={() => {
              setAnimalDetailsData({
                ...record,
                default_icon: '',
                primary_animal_id: params?.row.primary_animal_id,
                common_name: params?.row.common_name,
                scientific_name: params?.row.scientific_name,
                age: params.row.age,
                site: params?.row.site,
                sex: params.row.sex
              })
              setShowDetailsPopUp(true)
            }}
            sx={{ p: 4 }}
          >
            <Typography fontSize={14} fontWeight={600}>
              {record.value}
            </Typography>
            <Typography fontSize={12} color='textSecondary'>
              {record.date}
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              flex: 1,
              backgroundColor: theme.palette.customColors.cardHeaderBg,
              height: '100%'
              // mr: headerList.length === i + 1 ? '-20px' : 0
            }}
          ></Box>
        )
      }
    }
  })

  const handleDateRangeChange = (startDate, endDate) => {
    if (startDate && endDate) {
      setFilterDates({
        startDate: Utility.formatDate(startDate),
        endDate: Utility.formatDate(endDate)
      })
    } else {
      setFilterDates({
        startDate: '',
        endDate: ''
      })
    }
  }

  const siteList = async (q = '') => {
    try {
      const sites = authData.userData.user.zoos[0]?.sites || []
      const filteredSites = q ? sites.filter(site => site.site_name.toLowerCase().includes(q.toLowerCase())) : sites

      setSiteData(prev =>
        filteredSites.map(site => ({
          site_id: site.id,
          site_name: site.site_name,
          ...site
        }))
      )
    } catch (e) {
      console.error('Error processing site list:', e)
    }
  }

  useEffect(() => {
    siteList()
  }, [openFilterDrawer])

  const downloadNewCSVFile = csvContent => {
    try {
      const url = csvContent
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'download')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error downloading CSV:', error)
    }
  }

  // for download data in csv
  const getDataToExport = async type => {
    if (selectedSpecie && selectedAssessmentType) {
      setIsLoading(true)
      const params = {
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        taxonomy_ids: selectedSpecie?.tsn_id,
        assessment_type_ids: selectedAssessmentType?.assessment_type_id,
        start_date: filterDates.startDate,
        end_date: filterDates.endDate,
        q: search || '',
        site_ids: selectedItems.Site.toString() || '',
        section_ids: selectedItems.Section.toString() || '',
        enclosure_ids: selectedItems.Enclosure.toString() || '',
        gender: selectedItems.gender.toString() || '',
        accession_start: selectedItems.accession_start || '',
        accession_end: selectedItems.accession_end || ''
      }

      try {
        const response = await getAnimalAssessment(params)
        if (response?.success) {
          downloadNewCSVFile(response?.data)
        } else {
          console.warn('No  data available to export')
        }
      } catch (error) {
        console.log('error', error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const DetailsDialog = ({ animalDetailsData }) => {
    // console.log('animalDetailsData', animalDetailsData)
    return (
      <>
        <Dialog open={showDetailsPopUp}>
          <Box
            sx={{ bgcolor: theme.palette.primary.contrastText, height: '416px', width: '560px', borderRadius: '8px' }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                height: '52px',
                padding: '16px',
                bgcolor: theme.palette.customColors.displaybgSecondary
              }}
            >
              <Typography
                sx={{ fontSize: '16px', fontWeight: 500, letterSpacing: 0, color: theme.palette.customColors.deepDark }}
              >
                Assessment Details
              </Typography>
              <IconButton
                aria-label='close'
                onClick={() => setShowDetailsPopUp(false)}
                sx={{ top: 10, right: 10, position: 'absolute', color: 'grey.500' }}
              >
                <Icon color={theme.palette.primary.light} icon='mdi:close' />
              </IconButton>
            </Box>
            <Box
              sx={{
                height: '364px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                overflowY: 'auto',
                '&::-webkit-scrollbar': {
                  width: '4px'
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  borderRadius: '9px'
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: 'transparent'
                }
              }}
            >
              <Box
                sx={{
                  minHeight: '121px',
                  bgcolor: theme.palette.customColors.lightBg,
                  borderRadius: '8px',
                  padding: '10px',
                  paddingLeft: '20px'
                }}
              >
                <AnimalCard animalData={animalDetailsData} />
              </Box>

              <Box sx={{ gap: '8px', display: 'flex', flexDirection: 'column' }}>
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 600,
                    letterSpacing: 0,
                    color: theme.palette.customColors.OnSurfaceVariant
                  }}
                >
                  {selectedAssessmentType?.assessments_type_label}
                </Typography>
                <Box
                  sx={{
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '24px',
                    bgcolor: theme.palette.customColors.mdAntzNeutral,
                    borderRadius: '8px'
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '16px',
                      fontWeight: 400,
                      letterSpacing: 0,
                      lineHeight: '20px',
                      color: theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    {animalDetailsData.value}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Avatar
                        sx={{
                          '& > img': {
                            objectFit: 'contain'
                          },
                          width: 24,
                          height: 24
                        }}
                        alt={animalDetailsData?.user?.profile_image}
                        src={animalDetailsData?.user?.profile_image}
                      />
                      <Typography
                        sx={{
                          fontSize: '14px',
                          fontWeight: 400,
                          letterSpacing: 0,
                          color: theme.palette.customColors.OnSurfaceVariant
                        }}
                      >
                        {animalDetailsData?.user?.user_first_name} {animalDetailsData?.user.user_last_name}
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        fontWeight: 400,
                        letterSpacing: 0,
                        color: theme.palette.customColors.OnSurfaceVariant
                      }}
                    >
                      {animalDetailsData.time} • {animalDetailsData.date}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Dialog>
      </>
    )
  }

  return (
    <>
      <Card>
        <Box sx={{ display: 'flex', flexDirection: 'column', px: 4, gap: 4, my: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ color: theme.palette.customColors.OnSurfaceVariant }} variant='h5'>
              Animal Assessment Report
            </Typography>
          </Box>

          <Box
            sx={{
              backgroundColor: theme.palette.customColors.tableHeaderBg,
              borderRadius: '8px',
              padding: '24px',
              display: 'flex',
              alignItems: 'end',
              gap: '24px',
              flexWrap: 'wrap'
            }}
          >
            {/* Species Side Sheet */}
            <Box
              onClick={() => setOpenspeciesFilter(true)}
              sx={{ cursor: 'pointer', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 200 }}
            >
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: '14px',
                  lineHeight: '100%',
                  letterSpacing: '0%',
                  color: theme.palette.customColors.OnSurfaceVariant
                }}
              >
                Species
              </Typography>
              <Box
                sx={{
                  bgcolor: theme.palette.primary.contrastText,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  height: '56px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.palette.customColors.OutlineVariant}`
                }}
              >
                {selectedSpecie?.tsn_id ? (
                  <Typography
                    sx={{
                      fontWeight: 500,
                      fontSize: '16px',
                      lineHeight: '100%',
                      letterSpacing: '0%',
                      color: theme.palette.primary.light,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {`${selectedSpecie?.common_name} (${selectedSpecie?.complete_name})`}
                  </Typography>
                ) : (
                  <Typography
                    sx={{
                      fontWeight: 400,
                      fontSize: '16px',
                      lineHeight: '100%',
                      letterSpacing: '0%',
                      color: theme.palette.customColors.neutralSecondary,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Select Species
                  </Typography>
                )}
                <IconButton sx={{ mr: -4, width: '37px' }}>
                  <Icon icon='fa:angle-right' fontSize={20} color={theme.palette.primary.light} />
                </IconButton>
              </Box>
            </Box>

            {/* Assessment Side Sheet */}
            <Box
              onClick={() => setOpenAssessmentFilter(true)}
              sx={{ cursor: 'pointer', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 200 }}
            >
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: '14px',
                  lineHeight: '100%',
                  letterSpacing: '0%',
                  color: theme.palette.customColors.OnSurfaceVariant
                }}
              >
                Assessment Type
              </Typography>
              <Box
                sx={{
                  bgcolor: theme.palette.primary.contrastText,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  height: '56px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.palette.customColors.OutlineVariant}`
                }}
              >
                {selectedAssessmentType?.assessments_type_label ? (
                  <Typography
                    sx={{
                      fontWeight: 500,
                      fontSize: '16px',
                      letterSpacing: '0%',
                      color: theme.palette.primary.light,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {`${selectedAssessmentType?.assessments_type_label} `}
                  </Typography>
                ) : (
                  <Typography
                    sx={{
                      fontWeight: 400,
                      fontSize: '16px',
                      letterSpacing: '0%',
                      color: theme.palette.customColors.neutralSecondary,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Select Assessment Type
                  </Typography>
                )}

                <IconButton sx={{ mr: -4, width: '37px' }}>
                  <Icon icon='fa:angle-right' fontSize={20} color={theme.palette.primary.light} />
                </IconButton>
              </Box>
            </Box>

            {/* Generate Button */}
            <Box sx={{ minWidth: 120 }}>
              <Button
                variant='contained'
                disabled={!selectedSpecie || !selectedAssessmentType || isLoading}
                sx={{ width: '127px', height: '56px', borderRadius: '8px' }}
                fullWidth
                onClick={() => animalAssessmentReport()}
              >
                Generate
              </Button>
            </Box>
          </Box>

          {dataList?.length > 0 && (
            <>
              <Box sx={{ display: 'flex', gap: 4, justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                  <TextField
                    value={search}
                    onChange={e => handleSearchChange(e)}
                    variant='outlined'
                    disabled={isLoading}
                    size='small'
                    placeholder='Search'
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position='start'>
                          <Icon icon='mi:search' fontSize={24} color={theme.palette.customColors.neutralSecondary} />
                        </InputAdornment>
                      )
                    }}
                    sx={{
                      width: '240px',
                      backgroundColor: theme.palette.primary.contrastText,
                      borderRadius: '4px', // Applies to the container
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '4px' // Applies to the input field
                      }
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 4, justifyContent: 'end', alignItems: 'center' }}>
                  <CommonDateRangePickers disabled={true} onChange={handleDateRangeChange} filterDates={filterDates} />

                  {authData?.userData?.user?.zoos[0]?.sites.length > 0 && (
                    <Box
                      sx={{
                        position: 'relative',
                        display: 'flex',
                        justifyContent: 'center',
                        width: '60px',
                        height: '40px',
                        borderRadius: '4px',
                        bgcolor: theme?.palette.customColors?.lightBg,
                        alignItems: 'center',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        if (!isLoading) {
                          setOpenFilterDrawer(true)
                        }
                      }}
                    >
                      <Icon icon='mage:filter' fontSize={24} />
                      {/* <Typography
                        sx={{
                          position: 'absolute',
                          top: '-15px',
                          right: '-10px',
                          minWidth: '27px',
                          height: '27px',
                          paddingX: 2,
                          borderRadius: '14px',
                          backgroundColor: theme.palette.primary.light,
                          color: theme.palette.primary.contrastText,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 500
                        }}
                      >
                        {filterCount}
                      </Typography> */}
                    </Box>
                  )}

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      width: '60px',
                      height: '40px',
                      borderRadius: '4px',
                      bgcolor: theme?.palette.customColors?.lightBg,
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                    onClick={() => getDataToExport()}
                  >
                    {isLoading ? (
                      <CircularProgress color='success' size={30} />
                    ) : (
                      <Icon icon='ic:round-download' fontSize={20} />
                    )}
                  </Box>
                </Box>
              </Box>
              {columns?.length > 0 ? (
                <StickyTable
                  rows={dataList}
                  rowCount={total}
                  rowHeight={127.5}
                  headerHeight={50}
                  pagination={true}
                  columns={columns}
                  pageSizeOptions={[5, 10, 25, 50]}
                  rowsInView={10}
                  rowsInViewOptions={[5, 10, 25]}
                  paginationModel={paginationModel}
                  onPaginationModelChange={setPaginationModel}
                  loading={isLoading}
                  downloadExcel
                  searchMode='server'
                  disableColumnSorting={true}
                />
              ) : (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <CircularProgress />
                </Box>
              )}
            </>
          )}
        </Box>
      </Card>

      {!dataList?.length > 0 && (
        <Box
          sx={{
            mt: 4,
            bgcolor: theme.palette.customColors.Surface,
            height: '216px',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          {isLoading ? (
            <CircularProgress color='success' size={30} />
          ) : (
            <Typography
              sx={{
                fontSize: '20px',
                fontWeight: 500,
                lineHeight: '100%',
                letterSpacing: 0,
                color: theme.palette.primary.light
              }}
            >
              Select Species and Assessment Type to Generate Report
            </Typography>
          )}
        </Box>
      )}

      {openFilterDrawer && (
        <AssessmentReportFilterDrawer
          setOpenFilterDrawer={setOpenFilterDrawer}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          openFilterDrawer={openFilterDrawer}
          setFilterCount={setFilterCount}
          tabsforfilter={tabsforfilter}
          openSiteListDrawer={openSiteListDrawer}
          setSiteListDrawer={setSiteListDrawer}
          sectionsData={sectionsData}
          setSectionsData={setSectionsData}
          enclosuresData={enclosuresData}
          setEnclosuresData={setEnclosuresData}
          selectedSections={selectedSections}
          setSelectedSections={setSelectedSections}
          selectedEnclosures={selectedEnclosures}
          setSelectedEnclosures={setSelectedEnclosures}
          siteData={siteData}
          setActiveTab={setActiveTab}
          activeTab={activeTab}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedItems={selectedItems}
          setSelectedItems={setSelectedItems}
          tempSelectedItems={tempSelectedItems}
          setTempSelectedItems={setTempSelectedItems}
        />
      )}
      {openspeciesFilter && (
        <AssessmentSpeciesFilter
          selectedSpecie={selectedSpecie}
          setSelectedSpecie={setSelectedSpecie}
          openspeciesFilter={openspeciesFilter}
          setOpenspeciesFilter={setOpenspeciesFilter}
        />
      )}
      {openassessmentFilter && (
        <AssessmentTypeFilter
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedAssessmentType={selectedAssessmentType}
          setSelectedAssessmentType={setSelectedAssessmentType}
          openassessmentFilter={openassessmentFilter}
          setOpenAssessmentFilter={setOpenAssessmentFilter}
        />
      )}
      {showDetailsPopUp && <DetailsDialog animalDetailsData={animalDetailsData} />}
    </>
  )
}

export default AnimalAssessment

{
  /* {authData?.userData?.user?.zoos[0]?.sites.length > 0 && (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: 'center',
                      borderRadius: '8px',
                      mr: 1
                    }}
                  >
                    <Button
                      onClick={() => setOpenFilterDrawer(true)}
                      variant='outlined'
                      sx={{
                        width: '129px',
                        height: '40px',
                        display: 'flex',
                        color: theme.palette.customColors.OnSurfaceVariant,
                        borderRadius: '4px',
                        fontWeight: 400,
                        fontSize: '16px',
                        fontFamily: 'Inter',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2,
                        minWidth: '100px'
                      }}
                    >
                      <img
                        src='/images/filterIcon.png'
                        style={{ width: '30px', height: '30px', marginBottom: '3px', marginTop: '7px' }}
                        alt='Filter Icon'
                      />

                      <Typography
                        sx={{ color: theme.palette.primary.light, textTransform: 'capitalize', mr: 8, fontSize: '16px', fontWeight: 400 }}
                      >
                        Filter
                      </Typography>

                      <Box
                        sx={{
                          position: 'absolute',
                          top: '5px',
                          right: '6px',
                          width: '29px',
                          height: '27px',
                          borderRadius: '69%',
                          backgroundColor: theme.palette.primary.light,
                          color: theme.palette.primary.contrastText,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 500
                        }}
                      >
                        {filterCount}
                      </Box>
                    </Button>
                  </Box>
                )} */
}
