import { useTheme } from '@emotion/react'
import { Box, Card, CardHeader, Grid, IconButton, InputAdornment, TextField, Tooltip, Typography } from '@mui/material'
import { format, subMonths } from 'date-fns'
import { debounce } from 'lodash'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Icon from 'src/@core/components/icon'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import { getObservationReport } from 'src/lib/api/compliance/reports'
import Utility, { downloadPDF } from 'src/utility'
import AnimalDrawer from 'src/views/pages/compliance/reports/observation/AnimalDrawer'
import { DownloadReport } from 'src/views/pages/compliance/utility'
import ReportCard from 'src/views/pages/report/ReportCard'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import AnimalCard from 'src/views/utility/AnimalCard'
import AnimalParentCard from 'src/views/utility/animalParentCard'
import ObservationCard from 'src/views/utility/ObservationCard'
import Search from 'src/views/utility/Search'

const ObservationReport = () => {
  const theme = useTheme()
  const router = useRouter()

  const updateUrlParams = params => {
    const query = { ...router.query, ...params }
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true })
  }

  const [animalDrawer, setAnimalDrawer] = useState(false)
  const [selectedAnimal, setSelectedAnimal] = useState(null)
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searchValue, setSearchValue] = useState(router.query.q || '')
  const [isDownloading, setIsDownloading] = useState(false)

  const [filterDates, setFilterDates] = useState({
    startDate: router.query.startDate || Utility.formatDate(format(subMonths(new Date(), 6), 'dd MMM, yyyy')),
    endDate: router.query.endDate || Utility.formatDate(format(new Date(), 'dd MMM, yyyy'))
  })

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page) || 0,
    pageSize: parseInt(router.query.limit) || 50
  })

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
      Observation Report
    </Typography>
  )

  const fetchObservationReport = useCallback(
    async (q = '') => {
      try {
        setLoading(true)

        const params = {
          animal_id: selectedAnimal?.animal_id,
          page_no: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
          ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate }),
          report_type: 'json',
          ...(q && { q })
        }

        await getObservationReport(params).then(res => {
          console.log(res)
          if (res?.success === true) {
            console.log(res, 'res')
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

  const debouncedGetObservationReport = useMemo(
    () =>
      debounce(search => {
        fetchObservationReport(search)
      }, 500),
    [fetchObservationReport]
  )

  useEffect(() => {
    if (selectedAnimal) {
      fetchObservationReport(searchValue)
    }
  }, [selectedAnimal, filterDates, paginationModel.page, paginationModel.pageSize, fetchObservationReport])

  useEffect(() => {
    return () => {
      debouncedGetObservationReport.cancel()
    }
  }, [debouncedGetObservationReport])

  const getSlNo = index => paginationModel.page * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: row.id || index,
    sl_no: getSlNo(index)
  }))

  const columns = [
    {
      width: 90,
      field: 'id',
      headerName: 'SL.NO',
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: params => (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'default'
            }}
          >
            {parseInt(params.row.sl_no) + '.'}
          </Typography>
        </Box>
      )
    },
    {
      minWidth: 20,
      width: 160,
      field: 'date',
      headerName: 'DATE',
      sortable: false,
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Inter'
          }}
        >
          {Utility.formatDisplayDate(Utility.convertUTCToLocalDateTime(params.row.date_time))}
        </Typography>
      )
    },
    {
      minWidth: 20,
      width: 300,
      field: 'master_enrichment_type',
      headerName: 'Observation Type',
      sortable: false,
      renderCell: params => (
        <>
          <ObservationCard
            title={params.row.master_enrichment_type}
            description={params.row.child_enrichment_type}
            containerStyle={{ my: 4 }}
          />
        </>
      )
    },
    {
      minWidth: 20,
      width: 350,
      field: 'details',
      headerName: 'Details',
      sortable: false,
      renderCell: params => (
        <>
          <Tooltip title={params.row.details || ''} arrow placement='bottom'>
            <Typography
              sx={{
                fontSize: '16px',
                p: '0.5rem',
                color: theme.palette.customColors.OnSurfaceVariant,
                display: '-webkit-box',
                WebkitLineClamp: 3, // Max 4 lines
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'normal',
                lineHeight: '2rem',
                maxHeight: 'rem' // 4 lines * 1.5rem line-height
              }}
            >
              {params.row.details}
            </Typography>
          </Tooltip>
        </>
      )
    },
    {
      minWidth: 250,
      field: 'reported_by',
      sortable: false,
      headerName: 'Reported By ',
      renderCell: params => (
        <>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Typography sx={{ fontSize: '16px', fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant }}>
              {params?.row?.reported_by}
            </Typography>
            <Typography sx={{ fontSize: '14px', fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant }}>
              {Utility.convertUTCToLocaltime(params?.row?.date_time)}
            </Typography>
          </Box>
        </>
      )
    }
  ]

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

  const downloadObservationReport = async () => {
    console.log(selectedAnimal, 'selectedAnimal')

    const params = {
      animal_id: selectedAnimal?.animal_id,
      q: searchValue,
      ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
      ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate }),
      report_type: 'pdf'
    }
    try {
      setIsDownloading(true)
      await downloadPDF({
        apiCall: getObservationReport,
        params,
        fileName: `Observation_report_${Date.now()}.pdf`
      })
    } catch (error) {
      console.error('Error downloading report:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  const headerAction = (
    <>
      <DownloadReport isDownloading={isDownloading} handleDownloadReport={downloadObservationReport} />
    </>
  )

  const handleSearchChange = e => {
    const value = e.target.value
    setSearchValue(value)

    if (paginationModel.page !== 0) {
      setPaginationModel(prev => ({ ...prev, page: 0 }))
    }

    debouncedGetObservationReport(value)
  }

  return (
    <>
      {selectedAnimal ? (
        <>
          <Card>
            <CardHeader title={title} action={headerAction} sx={{ pl: 8, pb: 0 }} />
            <Box sx={{ p: 5 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderRadius: '8px',
                  background: '#E8F4F2',
                  pl: 4
                }}
              >
                <AnimalCard data={selectedAnimal} sx={{ border: 'none', background: 'none' }} animal={true} />
                <Box
                  sx={{
                    backgroundColor: '#0000000D',
                    height: { sm: '175px', xs: '190px' },
                    width: '70px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderTopRightRadius: '8px',
                    borderBottomRightRadius: '8px'
                  }}
                >
                  <IconButton onClick={() => setSelectedAnimal(null)}>
                    <Icon icon='mdi:close' color='red' fontSize={30} />
                  </IconButton>
                </Box>
              </Box>
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexDirection: { sm: 'row', xs: 'column' },
                justifyContent: { sm: 'space-between', xs: 'flex-start' },
                alignItems: 'center',
                gap: 4
              }}
            >
              <Box sx={{ width: '100%', px: 6 }}>
                <Search
                  onChange={handleSearchChange}
                  placeholder='Search by date or observation type'
                  value={searchValue}
                  inputStyle={{ py: '10px', px: '12px' }}
                  width='50%'
                />
              </Box>

              <Box sx={{ px: 6, width: { xs: '100%', sm: '60%' } }}>
                <CommonDateRangePickers
                  filterDates={filterDates}
                  onChange={handleDateRangeChange}
                  useCustomText={true}
                  customText='Select a Date Range'
                />
              </Box>
            </Box>
            <Grid
              sx={{
                margin: '0px 1.375rem 0px 1.375rem'
              }}
            >
              <CommonTable
                columns={columns}
                indexedRows={indexedRows}
                loading={loading}
                total={total}
                getRowHeight={() => 'auto'}
                paginationModel={paginationModel}
                setPaginationModel={setPaginationModel}
                searchValue={searchValue}
                onPaginationModelChange={model => {
                  setPaginationModel(model)
                  router.replace({
                    pathname: router.pathname,
                    query: {
                      ...router.query,
                      page: model.page + 1,
                      pageSize: model.pageSize,
                      searchValue
                    }
                  })
                }}
              />
            </Grid>
          </Card>
        </>
      ) : (
        <>
          <Card sx={{ p: 6 }}>
            <CardHeader title={title} sx={{ pt: 0, pb: 4 }} />
            <ReportCard
              subtitle='No Animal Selected'
              description='Select any animal to view its observation report'
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
          handleAnimalClick={animal =>
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
          }
        />
      )}
    </>
  )
}

export default ObservationReport
