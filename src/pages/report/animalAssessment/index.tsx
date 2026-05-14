import { useState, useEffect, useRef, useContext, useCallback, useMemo } from 'react'
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
  Tooltip,
  Typography
} from '@mui/material'
import { useTheme } from '@mui/material/styles'

import moment from 'moment'
import dayjs from 'dayjs'

import Utility from 'src/utility'
import { AuthContext } from 'src/context/AuthContext'
import Icon from 'src/@core/components/icon'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'

import Error404 from 'src/pages/401'
import StickyTable from 'src/views/table/sticky-table'
import AnimalParentCard from 'src/views/utility/animalParentCard'
import AssessmentReportFilterDrawer from 'src/views/pages/report/AssessmentReportFilterDrawer'
import AssessmentSpeciesListingDrawer from 'src/views/pages/report/AssessmentSpeciesListingDrawer'
import AssessmentTypeListingDrawer from 'src/views/pages/report/AssessmentTypeListingDrawer'

import { getAnimalAssessment, getAnimalAssessmentReport } from 'src/lib/api/report'
import AnimalCard from 'src/views/utility/AnimalCard'
import ReactTable from 'src/views/table/ReactTable'
import {
  Zoo,
  UserSettings,
  SpeciesItem,
  AssessmentTypeItem,
  AssessmentAnimal,
  TransformedAssessmentItem,
  HeaderItem,
  FilterItems,
  FilterParams,
  SiteData,
  SectionItem,
  EnclosureItem
} from 'src/types/report'

interface AuthContextType {
  userData: {
    user: { zoos: Zoo[] }
    roles: { settings: { enable_reports_module: boolean } }
    permission: { user_settings: UserSettings }
  } | null
}

interface AnimalDetailsData {
  value?: string
  date?: string
  time?: string
  user?: {
    profile_image?: string
    user_first_name?: string
    user_last_name?: string
  }
  default_icon?: string
  local_identifier_name?: string
  local_identifier_value?: string
  animal_id?: number
  primary_taxonomy_id?: number
  common_name?: string
  scientific_name?: string
  age?: string
  total_animal?: number
  type?: string
  breed_name?: string
  morph_name?: string
  site_name?: string
  sex?: string
}

interface DetailsDialogProps {
  animalDetailsData: AnimalDetailsData
}

const AnimalAssessment = () => {
  const theme = useTheme()
  const authData = useContext(AuthContext) as AuthContextType
  const enable_animal_assessment_report = authData?.userData?.permission?.user_settings?.enable_animal_assessment_report

  const [initialLoad, setInitialLoad] = useState(true)
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesItem[]>([])
  const [selectAllActive, setSelectAllActive] = useState(false)
  const [isSearchResult, setIsSearchResult] = useState(false)
  const [openspeciesFilter, setOpenspeciesFilter] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(0)
  const [selectedAssessmentType, setSelectedAssessmentType] = useState<AssessmentTypeItem | ''>('')
  const [openassessmentFilter, setOpenAssessmentFilter] = useState(false)

  const [search, setSearch] = useState<string | undefined>()
  const defaultEndDate = dayjs().format('YYYY-MM-DD')
  const defaultStartDate = dayjs().subtract(6, 'month').format('YYYY-MM-DD')

  const getDefaultFilterDates = () => ({
    startDate: defaultStartDate,
    endDate: defaultEndDate
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [assessmentData, setAssessmentData] = useState<AssessmentAnimal[]>([])
  const [maxAssessmentCount, setMaxAssessmentCount] = useState(0)
  const [headerList, setHeaderList] = useState<HeaderItem[]>([])
  const [dataList, setDataList] = useState<TransformedAssessmentItem[]>([])
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })
  const [total, setTotal] = useState(0)

  const [openFilterDrawer, setOpenFilterDrawer] = useState(false)
  const tabsforfilter = ['Site, Sec or Encl.', 'Accession Date', 'Gender']
  const [activeTab, setActiveTab] = useState('Site, Sec or Encl.')
  const [openSiteListDrawer, setSiteListDrawer] = useState(false)

  const [siteData, setSiteData] = useState<SiteData[]>([])
  const [sectionsData, setSectionsData] = useState<SectionItem[]>([])
  const [enclosuresData, setEnclosuresData] = useState<EnclosureItem[]>([])
  const [selectedSections, setSelectedSections] = useState<(string | number)[]>([])
  const [selectedEnclosures, setSelectedEnclosures] = useState<(string | number)[]>([])

  const getDefaultSelectedItems = (): FilterItems => ({
    Site: [],
    Section: [],
    Enclosure: [],
    gender: [],
    accession_start: null,
    accession_end: null
  })

  const [selectedItems, setSelectedItems] = useState<FilterItems>(getDefaultSelectedItems())
  const [tempSelectedItems, setTempSelectedItems] = useState<FilterItems>(getDefaultSelectedItems())
  const [filterDates, setFilterDates] = useState(getDefaultFilterDates())
  const [filterCount, setFilterCount] = useState(0)

  const [showDetailsPopUp, setShowDetailsPopUp] = useState(false)
  const [animalDetailsData, setAnimalDetailsData] = useState<AnimalDetailsData>({})

  // Only pass null if select all is active AND it's not a search result
  const taxonomyIds = useMemo(
    () =>
      selectAllActive && !isSearchResult
        ? null
        : selectedSpecies?.map(species => species?.tsn_id).filter(Boolean).join(',') || '',
    [selectAllActive, isSearchResult, selectedSpecies]
  )

  const selectedSpeciesIcon = useMemo(
    () => selectedSpecies?.[0]?.default_icon || '/branding/antz/Antz_logomark_h_color.svg',
    [selectedSpecies]
  )

  const resetDrawerFilters = () => {
    setSelectedItems(getDefaultSelectedItems())
    setTempSelectedItems(getDefaultSelectedItems())
    setSelectedSections([])
    setSelectedEnclosures([])
    setFilterCount(0)
    setSearchTerm('')
    setSearchQuery('')
  }

  //////////////////////////////////////////////////////////////
  const [searchTerm, setSearchTerm] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const searchRef = useRef<HTMLInputElement>(null)
  const skipNextFetchRef = useRef(false)

  useEffect(() => {
    if (searchRef.current && document.activeElement !== searchRef.current) {
      searchRef.current.focus()
    }
  }, [assessmentData])

  const animalAssessmentReport = async (searchValue: string = search || '', pageOverride?: number) => {
    setIsLoading(true)

    const params: FilterParams = {
      page: (typeof pageOverride === 'number' ? pageOverride : paginationModel.page) + 1,
      limit: paginationModel.pageSize
    }

    const payload: Record<string, string | number | null | undefined> = {
      taxonomy_ids: taxonomyIds,
      assessment_type_ids: (selectedAssessmentType as AssessmentTypeItem)?.assessment_type_id || '',
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
      setInitialLoad(false)
      const res = await getAnimalAssessmentReport(params, payload)
      setAssessmentData(res?.data?.animals || [])
      setMaxAssessmentCount(res?.data?.max_assessment_count || 0)
      setTotal(res?.data?.total_records ?? 0)
    } catch (error) {
      console.error('error', error)
    } finally {
      setIsLoading(false)
    }
  }

  const debouncedSearch = useCallback(
    debounce((value: string, pageOverride?: number) => {
      animalAssessmentReport(value, pageOverride)
    }, 500),
    [selectedSpecies, selectedAssessmentType, filterDates, selectedItems]
  )

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value
    skipNextFetchRef.current = true
    resetDrawerFilters()
    setPaginationModel(prev => ({ ...prev, page: 0 }))
    setSearch(value)
    debouncedSearch(value, 0)
  }

  const handleGenerate = () => {
    resetDrawerFilters()
    setFilterDates(getDefaultFilterDates())
    setSearch('')
    setPaginationModel(prev => ({ ...prev, page: 0 }))
  }

  useEffect(() => {
    if (!selectedSpecies?.length || !selectedAssessmentType) return
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false
      return
    }
    animalAssessmentReport()
  }, [paginationModel, filterDates, selectedItems])

  useEffect(() => {
    setPaginationModel(prev => (prev.page === 0 ? prev : { ...prev, page: 0 }))
  }, [selectedItems])

  useEffect(() => transformAnimalData(), [assessmentData])

  // Transform raw animal data
  const transformAnimalData = () => {
    const animals = assessmentData || []

    const transformed: TransformedAssessmentItem[] = animals?.map(animal => {
      const age = (() => {
        if (animal.animal_type === 'group') return 'NA'
        if (!animal.birth_date || !moment(animal.birth_date).isValid()) return 'NA'

        const birth = moment(animal.birth_date)
        const now = moment()

        const years = now.diff(birth, 'years')
        const months = now.diff(birth, 'months') % 12
        const days = now.diff(birth.clone().add({ years, months }), 'days')

        const parts: string[] = []
        if (years > 0) parts.push(`${years}y`)
        if (months > 0) parts.push(`${months}m`)
        if (days > 0 || parts.length === 0) parts.push(`${days}d`)

        return parts.join(' ')
      })()

      const recordMap: Record<string, { value: string; date: string; time: string; user: { profile_image?: string; user_first_name?: string; user_last_name?: string } }> = {}
      animal.assessment_data.assessments.forEach((assessment, index) => {
        recordMap[`record_${index}`] = {
          value: `${assessment.assessment_value} ${assessment?.uom_abbr ? assessment.uom_abbr : ''}${''}`,
          date: moment(
            Utility.convertUTCToLocalDate(
              assessment.assessment_recorded_date + ' ' + assessment.assessment_recorded_time
            )
          ).format('DD MMM YYYY'),
          time: Utility.extractHoursAndMinutes(
            Utility?.convertUTCToLocal(assessment.assessment_recorded_date + ' ' + assessment.assessment_recorded_time)
          ),
          user: assessment.user_details
        }
      })

      return {
        ...recordMap,
        default_icon: animal.default_icon,
        local_identifier_name: animal.identifier_type,
        local_identifier_value: animal.identifier_value,
        animal_id: animal.animal_id,
        primary_taxonomy_id: animal.taxonomy_id,
        common_name: animal.common_name,
        scientific_name: animal.scientific_name,
        age,
        total_animal: animal.total_animal,
        type: animal.animal_type,
        breed_name: animal.breed_name,
        morph_name: animal.morph_name,
        site_name: animal.site,
        sex: animal.sex
      }
    })

    setDataList(transformed)

    const headers: HeaderItem[] = [
      { key: 'default_icon', label: 'ANIMAL DETAILS' },
      ...Array.from({ length: maxAssessmentCount || (transformed.length > 0 ? 1 : 0) }, (_, i) => ({
        key: `record_${i}`,
        label:
          i === 0 ? (
            <span style={{ display: 'inline-block', marginLeft: '14px' }}>
              {(selectedAssessmentType as AssessmentTypeItem)?.assessments_type_label}
            </span>
          ) : (
            ' '
          )
      }))
    ]
    setHeaderList(headers)
  }

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
          zIndex: 1099
        },
        columnStyle: {
          border: `1px solid ${theme.palette.customColors.customTableBorderBg}`,
          borderRight: 'none',
          boxSizing: 'border-box'
        },
        renderCell: (params: { row: Record<string, string | number | boolean | undefined | null> }) => {
          return <AnimalCard sx={{ border: 'none' }} data={params?.row} />
        }
      }
    }

    return {
      field: header.key,
      headerName: header.label,
      width: 240,
      sortable: false,
      disableColumnMenu: true,
      columnStyle: {
        height: '100px',
        border: `1px solid ${theme.palette.customColors.customTableBorderBg}`,
        borderLeft: i === 1 && 'none'
      },
      renderCell: (params: { row: Record<string, string | number | boolean | undefined | null> }) => {
        const record = params?.row[header.key as string] as { value: string; date: string; time: string; user: AnimalDetailsData['user'] } | undefined

        return record ? (
          <Box
            onClick={() => {
              setAnimalDetailsData({
                ...record,
                default_icon: params?.row?.default_icon as string | undefined,
                local_identifier_name: params?.row?.identifier_type as string | undefined,
                local_identifier_value: params?.row?.identifier_value as string | undefined,
                animal_id: params?.row?.animal_id as number | undefined,
                primary_taxonomy_id: params?.row?.taxonomy_id as number | undefined,
                common_name: params?.row?.common_name as string | undefined,
                scientific_name: params?.row?.scientific_name as string | undefined,
                age: params.row.age as string | undefined,
                total_animal: params?.row?.total_animal as number | undefined,
                type: params?.row?.type as string | undefined,
                breed_name: params?.row?.breed_name as string | undefined,
                morph_name: params?.row?.morph_name as string | undefined,
                site_name: params?.row?.site_name as string | undefined,
                sex: params?.row?.sex as string | undefined
              })
              setShowDetailsPopUp(true)
            }}
            sx={{ p: 4, cursor: 'pointer' }}
          >
            <Tooltip title={record.value} placement='top'>
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 600,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  mb: '16px',
                  textOverflow: 'ellipsis'
                }}
              >
                {record.value}
              </Typography>
            </Tooltip>
            <Typography
              color='textSecondary'
              sx={{
                fontSize: 12
              }}
            >
              {record.date}
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%'
            }}
          >
            <Typography>N/A</Typography>
          </Box>
        )
      }
    }
  })

  const handleDateRangeChange = (startDate: Date | null, endDate: Date | null) => {
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
    resetDrawerFilters()
    setSearch('')
    setPaginationModel(prev => ({ ...prev, page: 0 }))
  }

  const siteList = async (q = '') => {
    try {
      const sites = authData?.userData?.user?.zoos[0]?.sites || []
      const filteredSites = q ? sites.filter(site => site.site_name.toLowerCase().includes(q.toLowerCase())) : sites

      setSiteData(
        filteredSites.map(site => ({
          ...site,
          site_id: (site as { id?: number; site_id: string | number }).id ?? site.site_id,
          site_name: site.site_name
        }))
      )
    } catch (e) {
      console.error('Error processing site list:', e)
    }
  }

  useEffect(() => {
    siteList()
  }, [openFilterDrawer])

  const downloadNewCSVFile = (csvContent: string) => {
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

  const getDataToExport = async () => {
    if (selectedSpecies?.length && selectedAssessmentType) {
      setIsDownloading(true)

      const params: FilterParams = {
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        taxonomy_ids: taxonomyIds ?? undefined,
        assessment_type_ids: (selectedAssessmentType as AssessmentTypeItem)?.assessment_type_id,
        start_date: filterDates.startDate,
        end_date: filterDates.endDate,
        q: search || '',
        site_ids: selectedItems.Site.toString() || '',
        section_ids: selectedItems.Section.toString() || '',
        enclosure_ids: selectedItems.Enclosure.toString() || '',
        gender: selectedItems.gender.toString() || '',
        accession_start: selectedItems.accession_start ?? '',
        accession_end: selectedItems.accession_end ?? ''
      }

      try {
        const response = await getAnimalAssessment(params)
        if (response?.success) {
          downloadNewCSVFile(response?.data as string)
        } else {
          console.warn('No  data available to export')
        }
      } catch (error) {
        console.error('error', error)
      } finally {
        setIsDownloading(false)
      }
    }
  }

  const DetailsDialog = ({ animalDetailsData }: DetailsDialogProps) => {
    return (
      <Dialog open={showDetailsPopUp}>
        <Box sx={{ bgcolor: theme.palette.primary.contrastText, height: '416px', width: '560px', borderRadius: '8px' }}>
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
                bgcolor: theme.palette.customColors.lightBg,
                borderRadius: '8px'
              }}
            >
              <AnimalParentCard backgroundColor={theme.palette.customColors.lightBg} data={animalDetailsData} />
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
                {(selectedAssessmentType as AssessmentTypeItem)?.assessments_type_label}
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
                      {animalDetailsData?.user?.user_first_name} {animalDetailsData?.user?.user_last_name}
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
                    {animalDetailsData.date} {animalDetailsData.time ? `• ${animalDetailsData.time}` : ''}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Dialog>
    )
  }

  return (
    <>
      {!enable_animal_assessment_report ? (
        <>
          <Error404 />
        </>
      ) : (
        <>
          <Card>
            <Box sx={{ display: 'flex', flexDirection: 'column', px: '24px', gap: 4, my: 4 }}>
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
                <Box
                  onClick={() => setOpenspeciesFilter(true)}
                  sx={{
                    cursor: 'pointer',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    minWidth: 200
                  }}
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
                      alignItems: 'center',
                      gap: 2,
                      padding: '16px',
                      height: '56px',
                      borderRadius: '8px',
                      border: `1px solid ${theme.palette.customColors.OutlineVariant}`
                    }}
                  >
                    {selectedSpecies?.length ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
                        {selectAllActive && !isSearchResult ? (
                          <Typography
                            sx={{
                              flex: 1,
                              fontWeight: 500,
                              fontSize: '16px',
                              lineHeight: '100%',
                              letterSpacing: '0%',
                              color: theme.palette.primary.light
                            }}
                          >
                            All
                          </Typography>
                        ) : (
                          <>
                            <Typography
                              sx={{
                                flex: 1,
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
                              {`${selectedSpecies?.[0]?.common_name} `}
                              <span style={{ fontStyle: 'italic' }}>{`(${selectedSpecies?.[0]?.complete_name})`}</span>
                            </Typography>
                            {selectedSpecies.length > 1 && (
                              <Typography
                                sx={{
                                  fontWeight: 600,
                                  fontSize: '14px',
                                  color: theme.palette.primary.main,
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                +{selectedSpecies.length - 1}
                              </Typography>
                            )}
                          </>
                        )}
                      </Box>
                    ) : (
                      <Typography
                        sx={{
                          flex: 1,
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
                    <IconButton sx={{ mr: -4, width: '37px', flexShrink: 0 }}>
                      <Icon icon='fa:angle-right' fontSize={20} color={theme.palette.primary.light} />
                    </IconButton>
                  </Box>
                </Box>

                <Box
                  onClick={() => setOpenAssessmentFilter(true)}
                  sx={{
                    cursor: 'pointer',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    minWidth: 200
                  }}
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
                    {(selectedAssessmentType as AssessmentTypeItem)?.assessments_type_label ? (
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
                        {`${(selectedAssessmentType as AssessmentTypeItem)?.assessments_type_label} `}
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

                <Box sx={{ minWidth: 120 }}>
                  <Button
                    variant='contained'
                    disabled={!selectedSpecies.length || !selectedAssessmentType || isLoading}
                    sx={{ width: '127px', height: '56px', borderRadius: '8px' }}
                    fullWidth
                    onClick={handleGenerate}
                  >
                    Generate
                  </Button>
                </Box>
              </Box>

              {!initialLoad && (
                <>
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 4,
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mt: 1
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                      <TextField
                        inputRef={searchRef}
                        autoFocus
                        value={search}
                        onChange={e => handleSearchChange(e)}
                        variant='outlined'
                        disabled={isLoading}
                        size='small'
                        placeholder='Search'
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position='start'>
                              <Icon
                                icon='mi:search'
                                fontSize={24}
                                color={theme.palette.customColors.neutralSecondary}
                              />
                            </InputAdornment>
                          ),
                          endAdornment: search && (
                            <InputAdornment position='end'>
                              <IconButton
                                size='small'
                                onClick={() => handleSearchChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>)}
                                edge='end'
                              >
                                <Icon icon='ic:round-close' fontSize={20} />
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                        sx={{
                          backgroundColor: theme.palette.primary.contrastText,
                          '& .MuiOutlinedInput-root': {
                            width: '240px',
                            borderRadius: '4px'
                          }
                        }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 4, justifyContent: 'end', alignItems: 'center' }}>
                      <CommonDateRangePickers
                        onChange={handleDateRangeChange}
                        filterDates={filterDates}
                      />

                      {(authData?.userData?.user?.zoos[0]?.sites?.length ?? 0) > 0 && (
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
                          {filterCount > 0 && (
                            <Typography
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
                            </Typography>
                          )}
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
                          cursor: isDownloading ? 'not-allowed' : 'pointer'
                        }}
                        onClick={isDownloading ? undefined : () => getDataToExport()}
                        aria-disabled={isDownloading}
                      >
                        {isDownloading ? (
                          <CircularProgress color='success' size={30} />
                        ) : (
                          <Icon icon='ic:round-download' fontSize={20} />
                        )}
                      </Box>
                    </Box>
                  </Box>
                  {columns?.length > 0 ? (
                    <ReactTable
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
                      serverSide
                      modifyColumnPinning
                      hideHeaderWhenEmpty
                      searchMode='server'
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

          {!dataList?.length && !isLoading && (
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
                  {initialLoad
                    ? 'Select Species and Assessment Type to Generate Report'
                    : 'Reports not available for this search'}
                </Typography>
              )}
            </Box>
          )}

          {openFilterDrawer && (
            <AssessmentReportFilterDrawer
              setOpenFilterDrawer={setOpenFilterDrawer}
              searchTerm={searchQuery}
              setSearchTerm={setSearchQuery}
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
              selectedItems={selectedItems}
              setSelectedItems={setSelectedItems}
              tempSelectedItems={tempSelectedItems}
              setTempSelectedItems={setTempSelectedItems}
            />
          )}
          {openspeciesFilter && (
            <AssessmentSpeciesListingDrawer
              selectedSpecies={selectedSpecies}
              setSelectedSpecies={setSelectedSpecies}
              openspeciesFilter={openspeciesFilter}
              setOpenspeciesFilter={setOpenspeciesFilter}
              selectAllActive={selectAllActive}
              setSelectAllActive={setSelectAllActive}
              isSearchResult={isSearchResult}
              setIsSearchResult={setIsSearchResult}
            />
          )}
          {openassessmentFilter && (
            <AssessmentTypeListingDrawer
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
      )}
    </>
  )
}

export default AnimalAssessment
