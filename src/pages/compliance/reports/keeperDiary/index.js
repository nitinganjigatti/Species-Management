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
import { useCallback, useEffect, useState } from 'react'
import Icon from 'src/@core/components/icon'
import CommonDateRangePickers from 'src/components/custom-date-picker/CommonDateRangePickers'
import Utility from 'src/utility'
import UserDrawer from 'src/views/pages/compliance/reports/keepers/UserDrawer'
import ReportCard from 'src/views/pages/report/ReportCard'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import { format, subDays, subMonths } from 'date-fns'
import { getDiaryReportList } from 'src/lib/api/compliance/reports'

const KeeperDiaryReport = () => {
  const theme = useTheme()
  const [userDrawer, setUserDrawer] = useState(false)
  const [userDetail, setUserDetail] = useState(null)
  const [keeperList, setKeeperList] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [filterDates, setFilterDates] = useState({
    startDate: Utility.formatDate(format(subMonths(new Date(), 1), 'dd MMM, yyyy')),
    endDate: Utility.formatDate(format(new Date(), 'dd MMM, yyyy'))
  })

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10
  })

  const eventHandler = () => {
    setUserDrawer(true)
  }

  const getUserKeeperReport = async () => {
    setLoading(true)
    const params = {
      ...(filterDates?.startDate !== '' && { from_date: filterDates?.startDate }),
      ...(filterDates?.endDate !== '' && { to_date: filterDates?.endDate }),
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
      console.log('error >>')
      setLoading(true)
    }
  }

  useEffect(() => {
    getUserKeeperReport()
  }, [userDetail, filterDates, paginationModel.page, paginationModel.pageSize])

  const UserSelectionCard = ({ user }) => {
    return (
      <Box
        sx={{
          backgroundColor: '#eef6f4',
          borderRadius: '8px',
          // p: 5,
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
            {/* <Typography sx={{ fontSize: 12, color: '#555' }}>User ID: {user?.user_id}</Typography> */}
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
            <Typography sx={{ fontSize: '16px', color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 500 }}>
              Role: {user?.role_name || 'N/A'}
            </Typography>
          </Box>
        </Box>

        {/* Right box with light background and red close icon */}
        <Box
          sx={{
            backgroundColor: '#e6f0ee',
            height: '120px',
            width: '70px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center', // ✅ Center horizontally
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

  const CardWrapper = ({ data }) => {
    return (
      <>
        <UserSelectionCard user={data} />
      </>
    )
  }

  const headerAction = (
    <Typography
      onClick={''}
      sx={{
        fontSize: '20px',
        fontWeight: '400',
        fontFamily: 'Inter',
        color: '#006D35',
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        mr: 4
      }}
    >
      Download report
      <img src='/images/download1.svg' alt='download icon' style={{ marginLeft: 8, width: 30, height: 30 }} />
    </Typography>
  )

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
      width: 200,
      field: 'scientific_name',
      headerName: 'Scientific Name',
      hide: true,
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', ml: 2 }}>
          {params.row.scientific_name ? params.row.scientific_name : '-'}
        </Typography>
      )
    },
    {
      minWidth: 200,
      field: 'enclosure',
      headerName: 'enclosure',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', ml: 5 }}>
          {params.row.enclosure ? params.row.enclosure : '-'}
        </Typography>
      )
    },

    {
      minWidth: 300,
      field: 'details',
      headerName: 'Details',
      headerAlign: 'left',
      align: 'left',
      renderCell: params => (
        <Tooltip title={params.row.details || ''} arrow placement='bottom'>
          <Typography
            variant='body2'
            sx={{
              color: 'text.primary',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100%',
              display: 'block' // ensure ellipsis works properly
            }}
          >
            {params.row.details}
          </Typography>
        </Tooltip>
      )
    },

    {
      minWidth: 200,
      field: 'sex',
      headerName: 'Sex',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.sex ? params.row.sex : '-'}
        </Typography>
      )
    },

    {
      minWidth: 200,
      field: 'taxonomy',
      headerName: 'Taxonomy',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.taxonomy ? params.row.taxonomy : '-'}
        </Typography>
      )
    },

    {
      minWidth: 200,
      field: 'master_enrichment_type',
      headerName: 'Master Type',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.master_enrichment_type ? params.row.master_enrichment_type : '-'}
        </Typography>
      )
    },

    {
      minWidth: 200,
      field: 'child_enrichment_type',
      headerName: 'Child Type',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.child_enrichment_type ? params.row.child_enrichment_type : '-'}
        </Typography>
      )
    }
  ]

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
      Keeper's Diary Report
    </Typography>
  )

  console.log('Keeper >>', userDetail)

  const getSlNo = index => paginationModel.page * paginationModel.pageSize + index + 1

  const indexedRows = keeperList?.map((row, index) => ({
    ...row,
    id: row.id || index, // ensure there's always a fallback ID
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

  return (
    <>
      {userDetail ? (
        <Card>
          <CardHeader title='Keepers Diary Report' action={headerAction} />
          <Box sx={{ p: 5 }}>
            <CardWrapper key={userDetail.user_id} data={userDetail} />
          </Box>

          {/* Search field */}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 0 }}>
            {/* Search Box */}
            <Box sx={{ ml: 2 }}>
              <TextField
                variant='outlined'
                size='small'
                value={''}
                onChange={''}
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
                  borderRadius: '4px', // Applies to the container
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '4px' // Applies to the input field
                  }
                }}
              />
            </Box>

            <Box sx={{ mr: 5 }}>
              <CommonDateRangePickers filterDates={filterDates} onChange={handleDateRangeChange} />
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
            />
          </Grid>
        </Card>
      ) : (
        <Card sx={{ p: 6 }}>
          <CardHeader title={title} />
          <ReportCard
            subtitle='No Keeper selected'
            description=' Select any keeper to view report'
            buttonText='SELECT KEEPER'
            addHandler={eventHandler}
          />
        </Card>
      )}

      {userDrawer && <UserDrawer open={userDrawer} onClose={handleClose} setUserDetail={setUserDetail} />}
    </>
  )
}
export default KeeperDiaryReport
