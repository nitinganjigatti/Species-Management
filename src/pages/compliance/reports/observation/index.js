import { useTheme } from '@emotion/react'
import { Box, Card, CardHeader, Grid, InputAdornment, TextField, Typography } from '@mui/material'
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
  const [sort, setSort] = useState(router.query.sort || 'asc')
  const [sortColumn, setSortColumn] = useState(router.query.column || '')
  const [searchValue, setSearchValue] = useState(router.query.q || '')
  const [exportLoading, setExportLoading] = useState(false)
  const [animalData, setAnimalData] = useState(null)

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
    async ({ q, page, limit }) => {
      try {
        setLoading(true)

        const params = {
          animal_id: selectedAnimal?.animal_id,
          page_no: page + 1,
          limit: limit,
          q: q,
          ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
          ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate }),
          report_type: 'json'
        }

        await getObservationReport({ params }).then(res => {
          if (res?.success === true) {
            setTotal(parseInt(res?.data?.total))
            setRows(loadServerRows(paginationModel?.page, res?.observationData))
            setAnimalData(res?.data?.animalData)
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
    if (selectedAnimal) {
      fetchObservationReport({
        q: searchValue,
        page: paginationModel?.page,
        limit: paginationModel?.pageSize
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

      console.log('Date range selected:', { startDate, endDate })
    } else {
      setFilterDates({
        startDate: '',
        endDate: ''
      })

      updateUrlParams({
        startDate: '',
        endDate: ''
      })

      console.log('Empty date range selected,', { startDate, endDate })
    }
  }

  const searchTableData = useCallback(
    debounce(async (sort, q, column, expired, page, limit) => {
      setSearchValue(q)
      try {
        await getObservationReport({
          q,
          expired,
          page,
          limit
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
    searchTableData(sort, value, sortColumn, paginationModel.page, paginationModel.pageSize)
  }

  console.log(animalData)

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
            <Box>
              <AnimalParentCard data={animalData} />
            </Box>
            <Grid container gap={4} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Grid size={{ xs: 12, sm: 12, md: 5 }}>
                <Search
                  onChange={e => handleSearch(e)}
                  value={searchValue}
                  placeholder='Search by date or observation type'
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 12, md: 6 }}>
                <Grid container gap={2} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Grid size={{ xs: 12, sm: 3, md: 3 }}></Grid>
                  <Grid size={{ xs: 12, sm: 8, md: 8 }}>
                    <CommonDateRangePickers onChange={handleDateRangeChange} filterDates={filterDates} />
                  </Grid>
                </Grid>
              </Grid>
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
        />
      )}
    </>
  )
}

export default ObservationReport
