import { useTheme } from '@emotion/react'
import { Box, Card, CardHeader, Grid, IconButton, InputAdornment, TextField, Tooltip, Typography } from '@mui/material'
import { format, subMonths } from 'date-fns'
import { debounce } from 'lodash'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'
import Icon from 'src/@core/components/icon'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import { getObservationReport } from 'src/lib/api/compliance/reports'
import Utility, { downloadPDF } from 'src/utility'
import AnimalDrawer from 'src/views/pages/compliance/reports/observation/AnimalDrawer'
import { DownloadReport } from 'src/views/pages/compliance/utility'
import ReportCard from 'src/views/pages/report/ReportCard'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import AnimalParentCard from 'src/views/utility/animalParentCard'
import ObservationCard from 'src/views/utility/ObservationCard'
import { ExportButton } from 'src/views/utility/render-snippets'
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
    startDate: router.query.startDate || Utility.formatDate(format(subMonths(new Date(), 1), 'dd MMM, yyyy')),
    endDate: router.query.endDate || Utility.formatDate(format(new Date(), 'dd MMM, yyyy'))
  })

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(router.query.page) || 0,
    pageSize: parseInt(router.query.limit) || 50
  })

  const eventHandler = () => {
    setAnimalDrawer(!animalDrawer)
  }

  function loadServerRows(currentPage, data) {
    return data
  }

  const fetchObservationReport = useCallback(
    async ({ q, page, limit, animalId }) => {
      try {
        setLoading(true)

        const params = {
          animal_id: animalId,
          page_no: page + 1,
          limit: limit,
          q: q,
          ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
          ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate }),
          report_type: 'json'
        }

        await getObservationReport(params).then(res => {
          console.log(res)
          if (res?.success === true) {
            console.log(res, 'res')
            setTotal(parseInt(res?.data?.total))
            setRows(loadServerRows(paginationModel?.page, res?.data?.observationData))
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
    [paginationModel, filterDates]
  )

  useEffect(() => {
    if (selectedAnimal !== null) {
      fetchObservationReport({
        q: searchValue,
        page: paginationModel?.page,
        limit: paginationModel?.pageSize,
        animalId: selectedAnimal?.animal_id
      })
      updateUrlParams({
        q: searchValue,
        page: paginationModel?.page,
        limit: paginationModel?.pageSize,
        startDate: filterDates?.startDate,
        endDate: filterDates?.endDate
      })
    }
  }, [paginationModel.page, paginationModel.pageSize, filterDates, selectedAnimal])

  const getSlNo = index => paginationModel.page * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: row.id || index,
    sl_no: getSlNo(index)
  }))

  console.log(indexedRows, 'indexedRows')

  const columns = [
    {
      width: 90,
      field: 'id',
      headerName: 'SL.NO',
      sortable: false,
      align: 'left',
      headerAlign: 'left',
      renderCell: params => (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'left' }}>
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
      sortable: true,
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
          {params.row.date}
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
            containerStyle={{ my: 2 }}
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
                fontWeight: 400,
                color: theme.palette.customColors.OnSurfaceVariant,
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 4,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'normal',
                maxWidth: '100%'
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
            <Typography sx={{ fontSize: '16px', fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant }}>
              {params?.row?.time}
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

      updateUrlParams({
        startDate: formattedStartDate,
        endDate: formattedEndDate
      })
    } else {
      setFilterDates({
        startDate: '',
        endDate: ''
      })

      updateUrlParams({
        startDate: '',
        endDate: ''
      })
    }
  }

  const searchTableData = useCallback(
    debounce(async (q, page, limit, animalId) => {
      console.log(animalId, 'animalId')
      setSearchValue(q)
      try {
        await fetchObservationReport({
          q,
          page,
          limit,
          animalId
        })

        updateUrlParams({
          q: q,
          page,
          limit,
          startDate: filterDates?.startDate,
          endDate: filterDates?.endDate
        })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    [filterDates]
  )

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(value, paginationModel.page, paginationModel.pageSize, selectedAnimal?.animal_id)
  }

  const handleSearchClear = () => {
    setSearchValue('')
    searchTableData('', paginationModel.page, paginationModel.pageSize, selectedAnimal?.animal_id)
  }

  const downloadObservationReport = async () => {
    console.log(selectedAnimal, 'selectedAnimal')

    const params = {
      animal_id: selectedAnimal?.animal_id,
      page_no: 1,
      limit: total,
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

  const haederAction = (
    <>
      <DownloadReport isDownloading={isDownloading} handleDownloadReport={downloadObservationReport} />
    </> 
  )

  return (
    <>
      {selectedAnimal ? (
        <>
          <Card>
            <CardHeader title="Biologist's Diary Report" action={haederAction} />
            <Box sx={{ p: 5 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                  border: '1px solid #C3CEC7',
                  borderRadius: '8px',
                  background: '#E8F4F2'
                }}
              >
                <AnimalParentCard data={selectedAnimal} sx={{ border: 'none', background: 'none' }} />
                <Box
                  sx={{
                    backgroundColor: '#0000000D',
                    height: { sm: '210px', xs: '280px' },
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

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 0 }}>
              <Box sx={{ ml: 2 }}>
                <TextField
                  variant='outlined'
                  size='small'
                  value={searchValue}
                  onChange={e => handleSearch(e.target.value)}
                  placeholder='Search'
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position='start'>
                          <Icon icon='mi:search' fontSize={24} color={theme.palette.customColors.neutralSecondary} />
                        </InputAdornment>
                      )
                    }
                  }}
                  sx={{
                    width: '320px',
                    backgroundColor: '#fff',
                    ml: 4,
                    mt: 1,
                    borderRadius: '4px',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '4px'
                    }
                  }}
                />
              </Box>

              <Box sx={{ mr: 5 }}>
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
          <ReportCard
            subtitle=' No animal selected'
            description=' Select any animal to view its observation report'
            buttonText='SELECT ANIMAL'
            addHandler={eventHandler}
          />
        </>
      )}

      {animalDrawer && (
        <AnimalDrawer
          open={animalDrawer}
          onClose={() => setAnimalDrawer(false)}
          selectedAnimal={selectedAnimal}
          setSelectedAnimal={setSelectedAnimal}
          handleAnimalClick={animal => setSelectedAnimal(animal)}
        />
      )}
    </>
  )
}

export default ObservationReport
