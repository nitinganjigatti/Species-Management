import { useTheme } from '@emotion/react'
import {
  Avatar,
  Box,
  Card,
  CardHeader,
  Grid,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { useEffect, useState, useCallback, useMemo } from 'react'
import Icon from 'src/@core/components/icon'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import Utility from 'src/utility'
import UserDrawer from 'src/views/pages/compliance/reports/keepers/UserDrawer'
import ReportCard from 'src/views/pages/report/ReportCard'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { format, subMonths } from 'date-fns'
import { getDiaryReportList } from 'src/lib/api/compliance/reports'
import ObservationView from 'src/views/pages/compliance/reports/biologists/Observation'
import debounce from 'lodash/debounce'
import { downloadPDF } from 'src/utility'
import { DownloadReport } from 'src/views/pages/compliance/utility'
import AnimalView from 'src/views/pages/compliance/reports/biologists/ReportAnimalView'

const BiologistDiaryReport = () => {
  const theme = useTheme()
  const [userDrawer, setUserDrawer] = useState(false)
  const [userDetail, setUserDetail] = useState(null)
  const [biologistList, setBiologistList] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)

  const [filterDates, setFilterDates] = useState({
    startDate: Utility.formatDate(format(subMonths(new Date(), 6), 'dd MMM, yyyy')),
    endDate: Utility.formatDate(format(new Date(), 'dd MMM, yyyy'))
  })

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 50
  })

  const [searchValue, setSearchValue] = useState('')

  const eventHandler = () => {
    setUserDrawer(true)
  }

  // Main API call function
  const getBiologistReport = useCallback(
    async (search = '') => {
      setLoading(true)

      const params = {
        ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
        ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate }),
        user_id: userDetail?.user_id,
        page_no: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        report_type: 'json',
        type: 'biologist',
        ...(search && { q: search })
      }

      try {
        const response = await getDiaryReportList(params)
        if (response?.success) {
          setBiologistList(response?.data?.observationData)
          setTotal(response?.data?.total)
        } else {
          console.log('error >>')
        }
      } catch (error) {
        console.error('Error fetching biologist report:', error)
      } finally {
        setLoading(false)
      }
    },
    [filterDates, userDetail?.user_id, paginationModel.page, paginationModel.pageSize]
  )

  // Create debounced function using useMemo to prevent recreation on every render
  const debouncedGetBiologistReport = useMemo(
    () =>
      debounce(search => {
        getBiologistReport(search)
      }, 500),
    [getBiologistReport]
  )

  // Effect for initial load and when dependencies change (except search)
  useEffect(() => {
    if (userDetail) {
      getBiologistReport(searchValue)
    }
  }, [userDetail, filterDates, paginationModel.page, paginationModel.pageSize, getBiologistReport])

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedGetBiologistReport.cancel()
    }
  }, [debouncedGetBiologistReport])

  const UserSelectionCard = ({ user }) => {
    return (
      <Box
        sx={{
          backgroundColor: '#eef6f4',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '100%',
          maxHeight: '500px'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, p: 5 }}>
          <Avatar src={user?.user_profile_pic} sx={{ width: 56, height: 56 }} />
          <Box>
            <Typography
              sx={{
                fontSize: '20px',
                fontWeight: 500,
                color: theme.palette.customColors.OnSurfaceVariant
              }}
            >
              {user?.user_name || '-'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}>
                {user?.role_name || '-'}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            backgroundColor: '#e6f0ee',
            height: '98px',
            width: '70px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderTopRightRadius: '8px',
            borderBottomRightRadius: '8px'
          }}
        >
          <IconButton onClick={() => setUserDetail(null)}>
            <Icon icon='mdi:close' color='red' fontSize={30} />
          </IconButton>
        </Box>
      </Box>
    )
  }

  const handleClose = () => {
    setUserDrawer(false)
  }

  // const CardWrapper = ({ data }) => {
  //   return (
  //     <>
  //       <UserSelectionCard user={data} />
  //     </>
  //   )
  // }

  const handleDownloadReport = async () => {
    const params = {
      ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
      ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate }),
      user_id: userDetail?.user_id,
      report_type: 'pdf',
      type: 'biologist',
      ...(searchValue && { q: searchValue })
    }
    try {
      setIsDownloading(true)
      await downloadPDF({
        apiCall: getDiaryReportList,
        params,
        fileName: `biologist_report_${Date.now()}.pdf`
      })
    } catch (error) {
      console.error('Error downloading report:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  const headerAction = (
    <>
      <DownloadReport isDownloading={isDownloading} handleDownloadReport={handleDownloadReport} />
    </>
  )

  const columns = [
    {
      flex: 0.1,
      field: 'id',
      headerName: 'NO.',
      sortable: false,
      align: 'left',
      headerAlign: 'left',
      renderCell: params => (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'left',
            p: '0.5rem'
          }}
        >
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
      flex: 0.3,
      field: 'animal_name',
      headerName: 'ANIMAL NAME',
      sortable: false,
      renderCell: params => <AnimalView data={params.row} />
    },
    {
      flex: 0.3,
      field: 'observation',
      headerName: 'OBSERVATION',
      sortable: false,
      renderCell: params => <ObservationView data={params.row} />
    },
    {
      flex: 0.3,
      field: 'details',
      headerName: 'DETAILS',
      sortable: false,
      renderCell: params => {
        const text = params.row.details ? params.row.details : '-'

        return (
          <Tooltip title={text} enterDelay={500} arrow>
            <Typography
              variant='body2'
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
              {text}
            </Typography>
          </Tooltip>
        )
      }
    }
  ]

  const title = (
    <Typography
      sx={{
        fontSize: '24px',
        fontWeight: 500,
        ml: '-12px',
        color: theme.palette.customColors.OnSurfaceVariant
      }}
    >
      Biologist's Diary Report
    </Typography>
  )

  const getSlNo = index => {
    const slNo = paginationModel.page * paginationModel.pageSize + index + 1

    return slNo < 10 ? `0${slNo}` : slNo
  }

  const indexedRows = biologistList?.map((row, index) => ({
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

  // Handle search input change
  const handleSearchChange = e => {
    const value = e.target.value
    setSearchValue(value) // Update input immediately for UI responsiveness

    // Reset to first page when searching
    if (paginationModel.page !== 0) {
      setPaginationModel(prev => ({ ...prev, page: 0 }))
    }

    // Call debounced API function
    debouncedGetBiologistReport(value)
  }

  return (
    <>
      {userDetail ? (
        <Card>
          <CardHeader title={title} action={headerAction} sx={{ pl: 8, pb: 0 }} />
          <Box sx={{ py: '16px', px: '22px' }}>
            <UserSelectionCard user={userDetail} />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 0, px: 4 }}>
            <Box>
              <TextField
                variant='outlined'
                size='small'
                value={searchValue}
                onChange={handleSearchChange}
                placeholder='Search by Entity or date'
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
                  ml: 2,
                  mt: 1,
                  borderRadius: '4px',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '4px'
                  }
                }}
              />
            </Box>

            <Box sx={{ mr: 1.5 }}>
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
              onRowClick={''}
              indexedRows={indexedRows}
              total={total}
              columns={columns}
              paginationModel={paginationModel}
              handleSortModel={''}
              setPaginationModel={setPaginationModel}
              loading={loading}
              searchValue={''}
              getRowHeight={() => 'auto'}
            />
          </Grid>
        </Card>
      ) : (
        <Card sx={{ p: 6 }}>
          <CardHeader title={title} sx={{ pt: 0, pb: 4 }} />
          <ReportCard
            subtitle='No Biologist selected'
            description='Select any biologist to view report'
            buttonText='SELECT BIOLOGIST'
            addHandler={eventHandler}
          />
        </Card>
      )}

      {userDrawer && (
        <UserDrawer
          open={userDrawer}
          onClose={handleClose}
          setUserDetail={setUserDetail}
          placeholder='Search by Biologist name or ID'
          queryKey='user-biologist-Report'
          headerText='Select the Biologist'
          footerText='generate biologist Diary REPORT'
        />
      )}
    </>
  )
}

export default BiologistDiaryReport
