'use client'

import { Box, Card, CardHeader, CircularProgress, Grid, IconButton, Tooltip, Typography } from '@mui/material'
import { format, subMonths } from 'date-fns'
import { debounce } from 'lodash'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Icon from 'src/@core/components/icon'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import { getAnimalHistoryReport as getAnimalHistoryReport } from 'src/lib/api/compliance/reports'
import { getAnimalDetailsOverview } from 'src/lib/api/housing'
import Utility, { downloadPDF } from 'src/utility'
import AnimalDrawer from 'src/views/pages/compliance/reports/animalHistoryReport/AnimalDrawer'
import { DownloadReport } from 'src/views/pages/compliance/utility'
import ReportCard from 'src/views/pages/report/ReportCard'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import AnimalCard from 'src/views/utility/AnimalCard'
import ObservationCard from 'src/views/utility/ObservationCard'
import Search from 'src/views/utility/Search'
import { useTheme } from '@mui/material/styles'

interface SelectedAnimal {
  animal_id?: string | number
  default_common_name?: string
  common_name?: string
  scientific_name?: string
  complete_name?: string
  user_enclosure_name?: string
  section_name?: string
  site_name?: string
  type?: string
  sex?: string
  default_icon?: string
  total_animal?: number
  local_identifier_name?: string
  local_identifier_value?: string
  life_status?: string
  status?: string
  age?: string
  age_text?: string
  weight?: string | number
  date_of_birth?: string
  dob?: string
  collection_type?: string
  microchip_no?: string
  national_studbook_no?: string
  sire_studbook_no?: string
  international_studbook_no?: string
  dam_studbook_no?: string
  date_of_death?: string
  disposal_method?: string
}

interface FilterDates {
  startDate: string
  endDate: string
}

const AnimalHistoryReport = () => {
  const theme = useTheme()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const animalIdParam = searchParams?.get('animal_id')

  const handleAnimalSelect = (animal: SelectedAnimal | null) => {
    if (!animal) return
    setSelectedAnimal({
      animal_id: animal?.animal_id,
      default_common_name: animal?.default_common_name,
      scientific_name: animal?.scientific_name ?? animal?.complete_name,
      user_enclosure_name: animal?.user_enclosure_name,
      section_name: animal?.section_name,
      site_name: animal?.site_name,
      type: animal?.type,
      sex: animal?.sex,
      default_icon: animal?.default_icon,
      total_animal: animal?.total_animal,
      local_identifier_name: animal?.local_identifier_name,
      local_identifier_value: animal?.local_identifier_value
    })
    const params = new URLSearchParams(searchParams?.toString())
    params.set('animal_id', String(animal?.animal_id))
    router.push(`${pathname}?${params.toString()}`)
  }

  const [animalDrawer, setAnimalDrawer] = useState<boolean>(false)
  const [selectedAnimal, setSelectedAnimal] = useState<SelectedAnimal | null>(null)
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [total, setTotal] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [searchValue, setSearchValue] = useState<string>(searchParams?.get('q') || '')
  const [isDownloading, setIsDownloading] = useState<boolean>(false)
  const [animalLoader, setAnimalLoader] = useState<boolean>(false)

  const [filterDates, setFilterDates] = useState<FilterDates>({
    startDate:
      searchParams?.get('startDate') || Utility.formatDate(format(subMonths(new Date(), 6), 'dd MMM, yyyy')),
    endDate: searchParams?.get('endDate') || Utility.formatDate(format(new Date(), 'dd MMM, yyyy'))
  })

  const [paginationModel, setPaginationModel] = useState<{ page: number; pageSize: number }>({
    page: parseInt(searchParams?.get('page') || '0') || 0,
    pageSize: parseInt(searchParams?.get('limit') || '50') || 50
  })

  useEffect(() => {
    if (animalIdParam && !selectedAnimal) {
      const fetchAnimal = async () => {
        setAnimalLoader(true)
        try {
          const res = await getAnimalDetailsOverview({
            animal_id: animalIdParam as any
          })

          if (res?.success) {
            const animalDetails = res?.data?.animal_details as any
            setSelectedAnimal({
              animal_id: animalDetails?.animal_id,
              default_common_name: animalDetails?.common_name,
              scientific_name: animalDetails?.scientific_name ?? animalDetails?.complete_name,
              user_enclosure_name: animalDetails?.user_enclosure_name ?? undefined,
              section_name: animalDetails?.section_name ?? undefined,
              site_name: animalDetails?.site_name ?? undefined,
              type: animalDetails?.type,
              sex: animalDetails?.sex,
              default_icon: animalDetails?.default_icon,
              total_animal: animalDetails?.total_animal,
              local_identifier_name: animalDetails?.local_identifier_name,
              local_identifier_value: animalDetails?.local_identifier_value
            })
            setAnimalLoader(false)
          }
        } catch (err) {
          console.error('Error fetching user by id:', err)
        }
      }

      fetchAnimal()
    }
  }, [animalIdParam])

  const reportCardEventHandler = () => {
    setAnimalDrawer(!animalDrawer)
  }

  const title = (
    <Typography
      sx={{
        fontSize: '24px',
        fontWeight: 500,
        ml: '-12px',
        color: theme.palette.customColors.OnSurfaceVariant
      }}
    >
      Animal History Report
    </Typography>
  )

  const fetchAnimalHistoryReport = useCallback(
    async (q = '') => {
      try {
        setLoading(true)

        const params = {
          animal_id: selectedAnimal?.animal_id || animalIdParam,
          page_no: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
          ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate }),
          report_type: 'json',
          ...(q && { q })
        }

        await getAnimalHistoryReport(params).then(res => {
          const resData = res?.data as any
          if (res?.success === true) {
            setTotal(parseInt(resData?.total))
            setRows(resData?.observationData || [])
          } else {
            setTotal(parseInt(resData?.total) || 0)
            setRows([])
          }
        })
        setLoading(false)
      } catch (e) {
        console.log(e)
        setLoading(false)
      }
    },
    [filterDates, selectedAnimal?.animal_id, paginationModel.page, paginationModel.pageSize, animalIdParam]
  )

  const debouncedGetAnimalHistoryReport = useMemo(
    () =>
      debounce((search: string) => {
        fetchAnimalHistoryReport(search)
      }, 500),
    [fetchAnimalHistoryReport]
  )

  useEffect(() => {
    if (selectedAnimal) {
      fetchAnimalHistoryReport(searchValue)
    }
  }, [selectedAnimal, filterDates, paginationModel.page, paginationModel.pageSize, fetchAnimalHistoryReport])

  useEffect(() => {
    return () => {
      debouncedGetAnimalHistoryReport.cancel()
    }
  }, [debouncedGetAnimalHistoryReport])

  const getSlNo = (index: number) => paginationModel.page * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: row.id || index,
    sl_no: getSlNo(index)
  }))

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    if (startDate && endDate) {
      const formattedStartDate = Utility.formatDate(startDate)
      const formattedEndDate = Utility.formatDate(endDate)
      setFilterDates({
        startDate: formattedStartDate,
        endDate: formattedEndDate
      })
    } else {
      setFilterDates({
        startDate: '',
        endDate: ''
      })
    }
  }

  const downloadAnimalHistoryReport = async () => {
    const params = {
      animal_id: selectedAnimal?.animal_id || animalIdParam,
      q: searchValue,
      ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
      ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate }),
      report_type: 'pdf'
    }
    try {
      setIsDownloading(true)
      await downloadPDF({
        apiCall: getAnimalHistoryReport,
        params,
        fileName: `AnimalHistory_report_${Date.now()}.pdf`
      })
    } catch (error) {
      console.error('Error downloading report:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  const clearAnimalSelection = () => {
    setSelectedAnimal(null)

    const params = new URLSearchParams(searchParams?.toString())
    params.delete('animal_id')
    router.push(`${pathname}?${params.toString()}`)
  }

  const headerAction = (
    <Box sx={{ display: 'flex', gap: '24px' }}>
      <DownloadReport isDownloading={isDownloading} handleDownloadReport={downloadAnimalHistoryReport} />
      <Box
        sx={{
          backgroundColor: '#0000000D',
          height: '32px',
          width: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50px'
        }}
      >
        <IconButton onClick={clearAnimalSelection}>
          <Icon icon='mdi:close' color='red' fontSize={24} />
        </IconButton>
      </Box>
    </Box>
  )

  const rawStatus = selectedAnimal?.life_status || selectedAnimal?.status || ''
  const statusText = rawStatus ? rawStatus.replace(/_/g, ' ') : 'Dead'
  const isDeceased = statusText.toLowerCase().includes('dead') || statusText.toLowerCase().includes('died')
  const statusBadgeColor = isDeceased ? '#FFBDA833' : '#AFEFEB33'
  const statusTextColor = isDeceased ? '#7B1C1C' : '#0F766E'
  const animalImage = selectedAnimal?.default_icon || '/images/branding/Antz_logomark_h_color.svg'

  const summaryFields = [
    { label: 'Animal ID', value: selectedAnimal?.animal_id || 'N/A' },
    { label: 'Common Name', value: selectedAnimal?.default_common_name || selectedAnimal?.common_name || 'N/A' },
    { label: 'Scientific Name', value: selectedAnimal?.scientific_name || 'N/A' },
    { label: 'Sex', value: selectedAnimal?.sex || 'N/A' },
    { label: 'Age', value: selectedAnimal?.age || selectedAnimal?.age_text || 'Not available' },
    { label: 'Weight', value: selectedAnimal?.weight ?? 'Not available' },
    { label: 'Date of birth', value: selectedAnimal?.date_of_birth || selectedAnimal?.dob || 'Not available' },
    { label: 'Collection Type', value: selectedAnimal?.collection_type || selectedAnimal?.type || 'Not available' },
    { label: 'Microchip No', value: selectedAnimal?.microchip_no || 'Not available' },
    { label: 'Section', value: selectedAnimal?.section_name || 'Not available' },
    { label: 'Site', value: selectedAnimal?.site_name || 'Not available' },
    { label: 'Enclosure', value: selectedAnimal?.user_enclosure_name || 'Not available' }
  ]

  const studbookDetails = [
    { label: 'National Studbook No', value: selectedAnimal?.national_studbook_no || 'NSB-56789' },
    { label: 'Sire Name & National Studbook No', value: selectedAnimal?.sire_studbook_no || 'Leo (NSB-12345)' },
    { label: 'International Studbook No', value: selectedAnimal?.international_studbook_no || 'ISB-23456' },
    { label: 'Dam Name & National Studbook No', value: selectedAnimal?.dam_studbook_no || 'Luna (NSB-54321)' }
  ]

  const healthDetails = {
    timeframe: 'Last Month',
    physical: [
      'The animal was observed standing with a hunched posture. This type of stance typically indicates discomfort or distress, particularly in the abdominal region. It may be a sign of digestive issues or internal pain that requires further examination.'
    ],
    genetic: [
      'The animal was observed standing with a hunched posture. This type of stance typically indicates discomfort or distress, particularly in the abdominal region. It may be a sign of digestive issues or internal pain that requires further examination.'
    ],
    author: 'Prajwal Shetty - 12:35 PM - 2 Jan 2025'
  }

  const deathDetails = [
    { label: 'Date of death', value: selectedAnimal?.date_of_death || '12 Jun 2025' },
    { label: 'Disposal Method', value: selectedAnimal?.disposal_method || 'Burial' }
  ]

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value)

    if (paginationModel.page !== 0) {
      setPaginationModel(prev => ({ ...prev, page: 0 }))
    }

    debouncedGetAnimalHistoryReport(value)
  }

  return (
    <>
      {selectedAnimal ? (
        <>
          <Card>
            <CardHeader title={title} action={headerAction} sx={{ pl: 8, pb: 0 }} />
            <Box sx={{ p: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderRadius: '8px',
                  background: '#E8F4F2',
                  p: '16px'
                }}
              >
                <AnimalCard data={selectedAnimal} sx={{ border: 'none', background: 'none' }} animal={true} />
              </Box>
              <Typography
                sx={{
                  fontWeight: 500,
                  fontSize: '20px',
                  letterSpacing: 0,
                  color: theme.palette.customColors.OnSurfaceVariant
                }}
              >
                Animal Details
              </Typography>
              <Box
                sx={{
                  border: '1px solid #0000000D',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '8px',
                  gap: '16px',
                  p: '16px'
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    alignItems: { xs: 'flex-start', md: 'center' },
                    gap: 4
                  }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      flexShrink: 0,
                      width: { xs: '100%', md: 220 }
                    }}
                  >
                    <Box
                      component='img'
                      src={animalImage}
                      alt={selectedAnimal?.default_common_name || 'Selected animal'}
                      sx={{
                        width: '100%',
                        aspectRatio: 1 / 1.2,
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '8px'
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 12,
                        left: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        borderRadius: '6px',
                        backgroundColor: '#FB4364',
                        px: 3,
                        py: 1.2
                      }}
                    >
                      <Icon
                        icon={isDeceased ? 'mdi:skull' : 'mdi:check-circle'}
                        fontSize={18}
                        color={theme.palette.primary.contrastText}
                      />
                      <Typography
                        sx={{
                          fontSize: '14px',
                          fontWeight: 600,
                          textTransform: 'capitalize',
                          color: theme.palette.primary.contrastText
                        }}
                      >
                        {statusText}
                      </Typography>
                    </Box>
                  </Box>
                  <Grid
                    container
                    spacing={'16px'}
                    sx={{
                      padding: '24px',
                      borderRadius: '8px',
                      background:
                        'linear-gradient(283.69deg, rgba(255, 189, 168, 0.1) 27.69%, rgba(255, 189, 168, 0.3) 95.91%)',
                      flex: 1
                    }}
                  >
                    {summaryFields.map(field => (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={field.label}>
                        <Tooltip title={field?.label || ''}>
                          <Typography
                            sx={{
                              fontSize: '14px',
                              fontWeight: 400,
                              color: theme.palette.customColors.OnSurfaceVariant,
                              letterSpacing: 0,
                              textOverflow: 'ellipsis',
                              textWrap: 'nowrap',
                              overflow: 'hidden'
                            }}
                          >
                            {field.label}
                          </Typography>
                        </Tooltip>
                        <Tooltip title={String(field?.value) || ''}>
                          <Typography
                            key={`${field.label}-value`}
                            sx={{
                              width: '100%',
                              color: theme.palette.customColors.OnSurfaceVariant,
                              fontWeight: 600,
                              fontSize: '16px',
                              textOverflow: 'ellipsis',
                              textWrap: 'nowrap',
                              overflow: 'hidden'
                            }}
                          >
                            {field?.value || 'NA'}
                          </Typography>
                        </Tooltip>
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    borderRadius: '8px',
                    p: '24px',
                    backgroundColor: '#AFEFEB33'
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '20px',
                      letterSpacing: 0,
                      fontWeight: 500,
                      color: theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    Studbook Details
                  </Typography>
                  <Grid container spacing={3}>
                    {studbookDetails.map(detail => (
                      <Grid size={{ xs: 12, md: 6 }} key={detail.label}>
                        <Tooltip title={detail?.label || ''}>
                          <Typography
                            sx={{
                              fontSize: '12px',
                              fontWeight: 500,
                              color: theme.palette.customColors.OnSurfaceVariant,
                              textTransform: 'uppercase',
                              textOverflow: 'ellipsis',
                              textWrap: 'nowrap',
                              overflow: 'hidden'
                            }}
                          >
                            {detail.label}
                          </Typography>
                        </Tooltip>
                        <Tooltip title={detail?.value || ''}>
                          <Typography
                            key={`${detail.label}-value`}
                            sx={{
                              width: '100%',
                              color: theme.palette.customColors.OnSurfaceVariant,
                              fontWeight: 600,
                              fontSize: '16px',
                              textOverflow: 'ellipsis',
                              textWrap: 'nowrap',
                              overflow: 'hidden'
                            }}
                          >
                            {detail?.value || 'NA'}
                          </Typography>
                        </Tooltip>
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                <Box
                  sx={{
                    backgroundColor: '#0000000D',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    borderRadius: '8px',
                    p: '24px'
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      justifyContent: 'space-between',
                      alignItems: { xs: 'flex-start', md: 'center' },
                      gap: 2
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '20px',
                        letterSpacing: 0,
                        fontWeight: 500,
                        color: theme.palette.customColors.OnSurfaceVariant
                      }}
                    >
                      Health Details
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        borderRadius: '8px',
                        px: 2.5,
                        py: 1,
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #0000001A'
                      }}
                    >
                      <Typography
                        sx={{ fontSize: '14px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                      >
                        {healthDetails.timeframe}
                      </Typography>
                      <Icon icon='mdi:chevron-down' fontSize={20} color={theme.palette.customColors.OnSurfaceVariant} />
                    </Box>
                  </Box>
                  <Grid container spacing={6}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography
                        sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                      >
                        Physical health check-up details
                      </Typography>
                      <Box
                        component='ul'
                        sx={{ pl: 3, mt: 2, mb: 0, color: theme.palette.customColors.OnSurfaceVariant }}
                      >
                        {healthDetails.physical.map((item, index) => (
                          <Typography
                            component='li'
                            key={`physical-${index}`}
                            sx={{ fontSize: '16px', fontWeight: 400, lineHeight: 1.6, mb: 2 }}
                          >
                            {item}
                          </Typography>
                        ))}
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography
                        sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                      >
                        Genetic health check-up details
                      </Typography>
                      <Box
                        component='ul'
                        sx={{ pl: 3, mt: 2, mb: 0, color: theme.palette.customColors.OnSurfaceVariant }}
                      >
                        {healthDetails.genetic.map((item, index) => (
                          <Typography
                            component='li'
                            key={`genetic-${index}`}
                            sx={{ fontSize: '16px', fontWeight: 400, lineHeight: 1.6, mb: 2 }}
                          >
                            {item}
                          </Typography>
                        ))}
                      </Box>
                    </Grid>
                  </Grid>
                  <Typography
                    sx={{
                      paddingLeft: 3,
                      fontSize: '12px',
                      fontWeight: 400,
                      color: theme.palette.customColors.neutralSecondary
                    }}
                  >
                    {healthDetails.author}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    backgroundColor: '#FFBDA833',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    borderRadius: '8px',
                    p: '24px'
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '20px',
                      letterSpacing: 0,
                      fontWeight: 500,
                      color: theme.palette.customColors.OnSurfaceVariant
                    }}
                  >
                    Death Details
                  </Typography>
                  <Grid container spacing={3}>
                    {deathDetails.map(detail => (
                      <Grid size={{ xs: 12, sm: 6 }} key={detail.label}>
                        <Tooltip title={detail?.label || ''}>
                          <Typography
                            sx={{
                              fontSize: '14px',
                              fontWeight: 400,
                              color: theme.palette.customColors.OnSurfaceVariant,
                              textTransform: 'uppercase',
                              textOverflow: 'ellipsis',
                              textWrap: 'nowrap',
                              overflow: 'hidden'
                            }}
                          >
                            {detail.label}
                          </Typography>
                        </Tooltip>
                        <Tooltip title={detail?.value || ''}>
                          <Typography
                            key={`${detail.label}-value`}
                            sx={{
                              width: '100%',
                              color: theme.palette.customColors.OnSurfaceVariant,
                              fontWeight: 600,
                              fontSize: '16px',
                              textOverflow: 'ellipsis',
                              textWrap: 'nowrap',
                              overflow: 'hidden'
                            }}
                          >
                            {detail?.value || 'NA'}
                          </Typography>
                        </Tooltip>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Box>
            </Box>
          </Card>
        </>
      ) : animalLoader ? (
        <Box display='flex' justifyContent='center' alignItems='center'>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Card sx={{ p: 6 }}>
            <CardHeader title={title} sx={{ pt: 0, pb: 4 }} />
            <ReportCard
              subtitle='No animal selected'
              description='Select any animal to view its history report'
              buttonText='SELECT ANIMAL'
              addHandler={reportCardEventHandler}
            />
          </Card>
        </>
      )}

      {animalDrawer && (
        <AnimalDrawer
          open={animalDrawer}
          onClose={() => setAnimalDrawer(false)}
          handleAnimalClick={handleAnimalSelect as any}
        />
      )}
    </>
  )
}

export default AnimalHistoryReport
