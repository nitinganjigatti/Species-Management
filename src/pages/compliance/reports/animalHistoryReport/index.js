import { Box, Card, CardHeader, CircularProgress, Grid, IconButton, Tooltip, Typography } from '@mui/material'
import { format, subMonths } from 'date-fns'
import { debounce } from 'lodash'
import { useRouter } from 'next/router'
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

const AnimalHistoryReport = () => {
  const theme = useTheme()
  const router = useRouter()

  const handleAnimalSelect = animal => {
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
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, animal_id: animal?.animal_id }
      },
      undefined,
      { shallow: true }
    )
  }

  const [animalDrawer, setAnimalDrawer] = useState(false)
  const [selectedAnimal, setSelectedAnimal] = useState(null)
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searchValue, setSearchValue] = useState(router.query.q || '')
  const [isDownloading, setIsDownloading] = useState(false)
  const [animalLoader, setAnimalLoader] = useState(false)

  const [filterDates, setFilterDates] = useState({
    startDate: router.query.startDate || Utility.formatDate(format(subMonths(new Date(), 6), 'dd MMM, yyyy')),
    endDate: router.query.endDate || Utility.formatDate(format(new Date(), 'dd MMM, yyyy'))
  })

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page) || 0,
    pageSize: parseInt(router.query.limit) || 50
  })

  useEffect(() => {
    if (router.query.animal_id && !selectedAnimal) {
      const fetchAnimal = async () => {
        setAnimalLoader(true)
        try {
          const res = await getAnimalDetailsOverview({
            animal_id: router.query.animal_id
          })

          if (res?.success) {
            setSelectedAnimal({
              animal_id: res?.data?.animal_details?.animal_id,
              default_common_name: res?.data?.animal_details?.common_name,
              scientific_name: res?.data?.animal_details?.scientific_name ?? res?.data?.animal_details?.complete_name,
              user_enclosure_name: res?.data?.animal_details?.user_enclosure_name,
              section_name: res?.data?.animal_details?.section_name,
              site_name: res?.data?.animal_details?.site_name,
              type: res?.data?.animal_details?.type,
              sex: res?.data?.animal_details?.sex,
              default_icon: res?.data?.animal_details?.default_icon,
              total_animal: res?.data?.animal_details?.total_animal,
              local_identifier_name: res?.data?.animal_details?.local_identifier_name,
              local_identifier_value: res?.data?.animal_details?.local_identifier_value
            })
            setAnimalLoader(false)
          }
        } catch (err) {
          console.error('Error fetching user by id:', err)
        }
      }

      fetchAnimal()
    }
  }, [router.query.animal_id])

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
          animal_id: selectedAnimal?.animal_id || router.query.animal_id,
          page_no: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
          ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate }),
          report_type: 'json',
          ...(q && { q })
        }

        await getAnimalHistoryReport(params).then(res => {
          if (res?.success === true) {
            setTotal(parseInt(res?.data?.total))
            setRows(res?.data?.observationData)
          } else {
            setTotal(parseInt(res?.data?.total))
            setRows([])
          }
        })
        setLoading(false)
      } catch (e) {
        console.log(e)
        setLoading(false)
      }
    },
    [filterDates, selectedAnimal?.animal_id, paginationModel.page, paginationModel.pageSize]
  )

  const debouncedGetAnimalHistoryReport = useMemo(
    () =>
      debounce(search => {
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

  const getSlNo = index => paginationModel.page * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: row.id || index,
    sl_no: getSlNo(index)
  }))

  const handleDateRangeChange = (startDate, endDate) => {
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
      animal_id: selectedAnimal?.animal_id || router.query.animal_id,
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

    const { animal_id, ...rest } = router.query
    router.push(
      {
        pathname: router.pathname,
        query: rest
      },
      undefined,
      { shallow: false }
    )
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

  const handleSearchChange = e => {
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
                      <Grid item size={{ xs: 12, sm: 6, md: 4 }} key={field.label}>
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
                        <Tooltip title={field?.value || ''}>
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
                      <Grid item size={{ xs: 12, md: 6 }} key={detail.label}>
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
                    <Grid item size={{ xs: 12, md: 6 }}>
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
                    <Grid item size={{ xs: 12, md: 6 }}>
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
                      <Grid item size={{ xs: 12, sm: 6 }} key={detail.label}>
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
          selectedAnimal={selectedAnimal}
          setSelectedAnimal={setSelectedAnimal}
          handleAnimalClick={handleAnimalSelect}
        />
      )}
    </>
  )
}

export default AnimalHistoryReport
