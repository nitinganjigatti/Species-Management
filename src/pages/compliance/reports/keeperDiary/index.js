import { useCallback, useEffect, useState } from 'react'

import { useTheme } from '@emotion/react'
import { Avatar, Box, Card, CardHeader, Grid, IconButton, Tooltip, Typography } from '@mui/material'
import { debounce } from 'lodash'
import { format, subMonths } from 'date-fns'

import Utility, { downloadPDF } from 'src/utility'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import Icon from 'src/@core/components/icon'
import enforceModuleAccess from 'src/components/ProtectedRoute'
import Search from 'src/views/utility/Search'
import ObservationCard from 'src/views/utility/ObservationCard'
import { DownloadReport } from 'src/views/pages/compliance/utility'
import UserDrawer from 'src/views/pages/compliance/reports/keepers/UserDrawer'
import ReportCard from 'src/views/pages/report/ReportCard'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import AnimalView from 'src/views/pages/compliance/reports/biologists/ReportAnimalView'

import { getDiaryReportList } from 'src/lib/api/compliance/reports'

const KeeperDiaryReport = () => {
  const theme = useTheme()
  const [userDrawer, setUserDrawer] = useState(false)
  const [userDetail, setUserDetail] = useState(null)
  const [keeperList, setKeeperList] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)

  const [filterDates, setFilterDates] = useState({
    startDate: Utility.formatDate(format(subMonths(new Date(), 6), 'dd MMM, yyyy')),
    endDate: Utility.formatDate(format(new Date(), 'dd MMM, yyyy'))
  })
  const [searchValue, setSearchValue] = useState('')

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 50
  })

  const eventHandler = () => {
    setUserDrawer(true)
  }

  const getUserKeeperReport = async q => {
    setLoading(true)

    const params = {
      ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
      ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate }),
      ...(q?.trim() !== '' && { q: q.trim() }),
      user_id: userDetail?.user_id,
      page_no: paginationModel.page + 1,
      limit: paginationModel.pageSize,
      report_type: 'json'
    }

    const response = await getDiaryReportList(params)
    if (response?.success) {
      setKeeperList(response?.data?.observationData)
      setTotal(response?.data?.total)
      setLoading(false)
    } else {
      console.error('error >>')
      setLoading(true)
    }
  }

  const handleDateRangeChange = (startDate, endDate) => {
    if (paginationModel.page !== 0) {
      setPaginationModel(prev => ({ ...prev, page: 0 }))
    }
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

  useEffect(() => {
    if (userDetail) {
      getUserKeeperReport(searchValue)
    }
  }, [userDetail, paginationModel, filterDates])

  const debouncedSearch = useCallback(
    debounce(q => {
      setPaginationModel({ page: 0, pageSize: 10 }) // reset page on search
    }, 800),
    []
  )

  const handleSearchChange = e => {
    const value = e.target.value
    setSearchValue(value) // Update input immediately for UI responsiveness

    // Call debounced API function
    debouncedSearch(value)
  }

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, p: 5 }}>
          <Avatar src={user?.user_profile_pic} sx={{ width: 56, height: 56 }} />
          <Box>
            <Typography
              sx={{
                fontFamily: 'Inter',
                fontSize: '20px',
                fontWeight: 500,
                color: theme.palette.customColors.OnSurfaceVariant
              }}
            >
              {user?.user_name}
            </Typography>
            <Typography sx={{ fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant }}>
              {user?.role_name || 'N/A'}
            </Typography>
          </Box>
        </Box>

        {/* Right box with light background and red close icon */}
        <Box
          sx={{
            backgroundColor: '#0000000D',
            height: { sm: '98px', xs: '120px' },
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

  const downloadKeeperDiaryReport = async () => {
    const params = {
      user_id: userDetail?.user_id,
      q: searchValue,
      ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
      ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate }),
      report_type: 'pdf'
    }
    try {
      setIsDownloading(true)
      await downloadPDF({
        apiCall: getDiaryReportList,
        params,
        fileName: `Keeper_Diary_Report_${Date.now()}.pdf`
      })
    } catch (error) {
      console.error('Error downloading report:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  const headerAction = <DownloadReport isDownloading={isDownloading} handleDownloadReport={downloadKeeperDiaryReport} />

  const columns = [
    {
      width: 100,
      field: 'id',
      headerName: 'SL.NO',
      sortable: false,
      align: 'left',
      headerAlign: 'left',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.neutralSecondary,
            fontSize: '14px',
            fontWeight: 500,
            p: '16px'
          }}
        >
          {parseInt(params.row.sl_no)}.
        </Typography>
      )
    },
    {
      field: 'animal_name',
      headerName: 'Entity',
      flex: 2,
      minWidth: 400,
      sortable: false,
      renderCell: params => (
        <Box sx={{ p: '0.5rem', mt: 2 }}>
          <AnimalView data={params.row} />
        </Box>
      )
    },
    {
      field: 'ObservationType',
      headerName: 'Observation Type',
      flex: 1,
      sortable: false,
      minWidth: 250,
      renderCell: params => (
        <Box sx={{ p: 2 }}>
          <ObservationCard
            title={params.row.master_enrichment_type}
            description={params.row.child_enrichment_type}
            dateTime={params.row.date_time}
          />
        </Box>
      )
    },
    {
      field: 'details',
      headerName: 'Details',
      sortable: false,
      flex: 2,
      minWidth: 350,
      headerAlign: 'left',
      align: 'left',
      renderCell: params => (
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
      )
    },
    {
      field: 'sex',
      headerName: 'Sex',
      sortable: false,
      flex: 0.5,
      minWidth: 160,
      renderCell: params => {
        const sex = params.row.sex
        const capitalizedSex = sex ? sex.charAt(0).toUpperCase() + sex.slice(1).toLowerCase() : '-'

        return (
          <Typography
            sx={{ fontSize: '16px', fontWeight: 400, pl: 2, color: theme.palette.customColors.OnSurfaceVariant }}
          >
            {capitalizedSex}
          </Typography>
        )
      }
    },
    {
      field: 'taxonomy',
      headerName: 'Taxonomy',
      sortable: false,
      flex: 1,
      minWidth: 160,
      renderCell: params => (
        <Typography
          sx={{ fontSize: '16px', fontWeight: 400, pl: 2, color: theme.palette.customColors.OnSurfaceVariant }}
        >
          {params.row.taxonomy || '-'}
        </Typography>
      )
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
      Keeper's Diary Report
    </Typography>
  )

  const getSlNo = index => paginationModel.page * paginationModel.pageSize + index + 1

  const indexedRows = keeperList?.map((row, index) => ({
    ...row,
    id: row.id || index, // ensure there's always a fallback ID
    sl_no: getSlNo(index)
  }))

  return (
    <>
      {userDetail ? (
        <Card>
          <CardHeader title={title} action={headerAction} sx={{ pl: 8, pb: 0 }} />
          <Box sx={{ py: '16px', px: '22px' }}>
            <UserSelectionCard user={userDetail} />
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
                onClear={() => {
                  setSearchValue('')
                  debouncedSearch('')
                }}
                onChange={handleSearchChange}
                placeholder='Search by Entity or observation type'
                value={searchValue}
                inputStyle={{ py: '10px', px: '12px' }}
                width={{ xs: '100%', sm: '70%' }}
              />
            </Box>

            <Box sx={{ px: 6, width: { xs: '100%', sm: '70%' } }}>
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
              getRowHeight={() => 'auto'}
              indexedRows={indexedRows}
              total={total}
              columns={columns}
              paginationModel={paginationModel}
              handleSortModel={''}
              setPaginationModel={setPaginationModel}
              loading={loading}
              searchValue={''}
            />
          </Grid>
        </Card>
      ) : (
        <Card sx={{ p: 6 }}>
          <CardHeader title={title} sx={{ pt: 0, pb: 4 }} />
          <ReportCard
            subtitle='No Keeper selected'
            description=' Select any keeper to view report'
            buttonText='SELECT KEEPER'
            addHandler={eventHandler}
          />
        </Card>
      )}

      {userDrawer && (
        <UserDrawer
          open={userDrawer}
          onClose={handleClose}
          setUserDetail={setUserDetail}
          placeholder='Search by Keeper name'
          title='Keepers'
        />
      )}
    </>
  )
}

export default enforceModuleAccess(KeeperDiaryReport, 'compliance_module')
