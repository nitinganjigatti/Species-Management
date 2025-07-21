import { useTheme } from '@emotion/react'
import { Box, Card, CardHeader, Grid, IconButton, InputAdornment, TextField, Typography } from '@mui/material'
import { format, subMonths } from 'date-fns'
import { debounce } from 'lodash'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'
import Icon from 'src/@core/components/icon'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import { getObservationReport } from 'src/lib/api/compliance/reports'
import Utility from 'src/utility'
import AnimalDrawer from 'src/views/pages/compliance/reports/observation/AnimalDrawer'
import ReportCard from 'src/views/pages/report/ReportCard'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import AnimalParentCard from 'src/views/utility/animalParentCard'
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

        await getObservationReport({ params }).then(res => {
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
              color: theme.palette.customColors.neutralSecondary,
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
            color: theme.palette.customColors.customHeadingTextColor,
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
      width: 200,
      field: 'master_enrichment_type',
      headerName: 'Observation Type',
      sortable: false,
      renderCell: params => <></>
    },
    {
      minWidth: 20,
      width: 400,
      field: 'details',
      headerName: 'Details',
      sortable: false,
      renderCell: params => <></>
    },
    {
      minWidth: 250,
      field: 'reported_by',
      sortable: false,
      headerName: 'Reported By ',
      renderCell: params => <></>
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

  const title = (
    <Typography
      sx={{
        fontSize: '24px',
        fontWeight: 500,
        fontFamily: 'Inter',
        ml: '-12px',
        color: theme.palette.customColors.OnSurfaceVariant
      }}
    >
      Observation Report
    </Typography>
  )

  return (
    <>
      <Card sx={{ p: 6 }}>
        <CardHeader
          title={title}
          action={selectedAnimal !== null && <ExportButton />}
          sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
            [theme.breakpoints.down('sm')]: {
              flexDirection: 'row',
              justifyContent: 'space-between'
            }
          }}
        />
        {selectedAnimal === null ? (
          <ReportCard
            subtitle=' No animal selected'
            description=' Select any animal to view its observation report'
            buttonText='SELECT ANIMAL'
            addHandler={eventHandler}
          />
        ) : (
          <>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 5,
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
            <Grid container gap={4} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Grid size={{ xs: 12, sm: 5, md: 5 }}>
                <Search
                  onChange={e => handleSearch(e.target.value)}
                  value={searchValue}
                  placeholder='Search by date or observation type'
                  onClear={handleSearchClear}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                <CommonDateRangePickers onChange={handleDateRangeChange} filterDates={filterDates} />
              </Grid>
            </Grid>
            <Grid>
              <CommonTable
                columns={columns}
                indexedRows={indexedRows}
                loading={loading}
                total={total}
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
          </>
        )}
      </Card>

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
