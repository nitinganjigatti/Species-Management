import React, { useCallback, useEffect, useState, useContext } from 'react'
import Router from 'next/router'
import { useRouter } from 'next/router'
import Icon from 'src/@core/components/icon'
import { DataGrid } from '@mui/x-data-grid'
import { useTheme } from '@mui/material/styles'
import {
  Grid,
  Card,
  CardContent,
  Box,
  Typography,
  CircularProgress,
  Breadcrumbs,
  IconButton,
  Button,
  Avatar,
  Tooltip,
  TextField,
  FormControl,
  Autocomplete,
  FormControlLabel,
  Switch
} from '@mui/material'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import { debounce } from 'lodash'
import { GetRoomDetails } from 'src/lib/api/egg/room/getRoom'
import moment from 'moment'
import DetailCard from 'src/components/egg/DetailCard'
import AddIncubatorRoom from 'src/components/egg/AddIncubatorRoom'
import { getAvailibilityList, getIncubatorList } from 'src/lib/api/egg/incubator'
import AddIncubators from 'src/views/pages/egg/incubator/addIncubators'
import Utility from 'src/utility'
import CustomChip from 'src/@core/components/mui/chip'
import { AuthContext } from 'src/context/AuthContext'
import ErrorScreen from 'src/pages/Error'
import { hatcheryStatus } from 'src/lib/api/egg'
import Toaster from 'src/components/Toaster'
import StatusDialogBox from 'src/views/pages/egg/eggs/eggDetails/StatusDialogBox'
import EditRedirectionDialog from 'src/views/pages/egg/eggs/eggDetails/EditRedirectionDialog'

const RoomDetails = () => {
  const cuurent_date = moment().format('YYYY-MM-DD')
  const router = useRouter()
  const { id } = router.query

  const theme = useTheme()
  const editParamsInitialState = { site_id: null, room_name: null, nursery_id: null, nursery_name: null }
  const [editParams, setEditParams] = useState(editParamsInitialState)

  // console.log('editParams :>> ', editParams)
  const [loader, setLoader] = useState(false)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('room_name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [detailsData, setDetailsData] = useState({})

  const [availibilityList, setAvailibilityList] = useState([])
  const [defaultAvailibility, setDefaultAvailibility] = useState(null)

  const [openStatusDialog, setOpenStatusDialog] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const [active, setActive] = useState(false)

  // console.log('detailsData :>> ', detailsData)

  const [isOpen, setIsOpen] = useState(false)
  const [DetailsListData, setDetailsListData] = useState({})
  const [dialog, setDialog] = useState(false)
  const [isPreFilled, setIsPreFilled] = useState({})

  const [openRedirectionDialog, setOpenRedirectionDialog] = useState(false)
  const [editMessage, setEditMessage] = useState('')

  const authData = useContext(AuthContext)
  const egg_nursery_permission = authData?.userData?.permission?.user_settings?.add_nursery_permisson
  const egg_collection_permission = authData?.userData?.roles?.settings?.enable_egg_collection_module

  const EditRedirectionFunc = event => {
    handleEdit(
      event,
      detailsData.site_id,
      detailsData.room_name,
      detailsData.nursery_id,
      detailsData.room_id,
      detailsData.nursery_name
    )
    setOpenRedirectionDialog(false)
  }

  const hatcheryStatusFunc = () => {
    setStatusLoading(true)
    try {
      hatcheryStatus({
        ref_type: 'room',
        ref_id: id,
        status: active ? 'deactivate' : 'activate'
      }).then(response => {
        if (response.success) {
          Toaster({ type: 'success', message: response.message })
          setOpenStatusDialog(false)
          setStatusLoading(false)
          setActive(!active)
          fetchDetailsData()
        } else {
          Toaster({ type: 'error', message: response.message })
          setEditMessage(response?.message)
          setOpenRedirectionDialog(true)
          fetchDetailsData()
          setOpenStatusDialog(false)
          setStatusLoading(false)
        }
      })
    } catch (error) {
      setOpenStatusDialog(false)
      setStatusLoading(false)
      Toaster({ type: 'error', message: response.message })
    }
  }

  const fetchTableData = useCallback(
    async (q, availability) => {
      try {
        // console.log('til_date', cuurent_date)
        setLoading(true)

        const params = {
          sort,
          q,
          room_id: id,
          availability,
          til_date: cuurent_date,
          page_no: paginationModel.page + 1,
          limit: paginationModel.pageSize
        }

        await getIncubatorList({ params }).then(res => {
          // Generate uid field based on the index
          let listWithId = res?.data?.data?.result?.map((el, i) => {
            return { ...el, id: i + 1 }
          })
          setTotal(parseInt(res?.data?.data?.total_count))
          setRows(loadServerRows(paginationModel.page, listWithId))

          // setstatusCheckval(res?.data?.result.map(all => all.active))
        })
        setLoading(false)
      } catch (e) {
        console.log(e)
        setLoading(false)
      }
    },
    [paginationModel]
  )

  useEffect(() => {
    if (egg_nursery_permission || egg_collection_permission) {
      fetchTableData(searchValue, defaultAvailibility?.key)
    }
  }, [fetchTableData])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const searchTableData = useCallback(
    debounce(async (q, status) => {
      setSearchValue(q)
      try {
        await fetchTableData(q, status)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSearch = (value, status) => {
    setSearchValue(value)
    searchTableData(value, status)
  }

  const AvailibityList = async () => {
    try {
      await getAvailibilityList().then(res => {
        setAvailibilityList(res?.data?.data)
      })
    } catch (e) {
      console.log(e)
    }
  }

  useEffect(() => {
    AvailibityList()
  }, [])

  const columns = [
    {
      flex: 0.05,
      Width: 40,
      field: 'id',
      headerName: 'NO',
      align: 'center',
      sortable: false,
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontWeight: '400',
            lineHeight: '14.52px',
            fontSize: '12px'
          }}
        >
          {params.row.sl_no}
        </Typography>
      )
    },

    {
      flex: 0.27,
      minWidth: 30,
      sortable: false,
      field: 'incubator_code',
      headerName: 'INCUBATOR ID',
      renderCell: params => (
        <Typography
          noWrap
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px'
          }}
        >
          {params.row.incubator_code ? params.row.incubator_code : '-'}
        </Typography>
      )
    },
    {
      flex: 0.35,
      minWidth: 30,
      sortable: false,
      field: 'incubator_name',
      headerName: 'INCUBATOR NAME',
      renderCell: params => (
        <Tooltip title={params.row.incubator_name ? params.row.incubator_name : '-'}>
          <Typography
            noWrap
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '400',
              lineHeight: '19.36px',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {params.row.incubator_name ? params.row.incubator_name : '-'}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 0.3,
      minWidth: 10,
      sortable: false,
      field: 'availability',
      headerName: 'AVAILABILITY',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.primary.dark,
            fontSize: '14px',
            fontWeight: '500',
            lineHeight: '16.94px'
          }}
        >
          {params.row.availability ? params.row.availability : '-'}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 20,
      sortable: false,
      field: 'site_name',
      headerName: 'SITE',
      renderCell: params => (
        <Tooltip title={params.row.site_name ? params.row.site_name : '-'}>
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '400',
              lineHeight: '19.36px',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {params.row.site_name ? params.row.site_name : '-'}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 0.3,
      minWidth: 20,
      sortable: false,
      field: 'room_name',
      headerName: 'ROOM NO',
      renderCell: params => (
        <Tooltip title={params.row.room_name ? params.row.room_name : '-'}>
          <Typography
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '16px',
              fontWeight: '400',
              lineHeight: '19.36px'
            }}
          >
            {params.row.room_name ? params.row.room_name : '-'}
          </Typography>
        </Tooltip>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      sortable: false,
      align: 'center',
      field: 'max_no_eggs',
      headerName: 'Max EGG',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px'
          }}
        >
          {params.row.max_eggs ? params.row.max_eggs : '-'}
        </Typography>
      )
    },
    {
      flex: 0.14,
      minWidth: 20,
      sortable: false,
      align: 'center',
      field: 'no_of_eggs',
      headerName: 'EGGS',
      renderCell: params => (
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '19.36px'
          }}
        >
          {params.row.no_of_eggs ? params.row.no_of_eggs : '-'}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      sortable: false,
      align: 'center',
      field: 'active',
      headerName: 'Status',
      renderCell: params => (
        <CustomChip
          skin='light'
          size='small'
          label={params.row?.active === '1' ? 'Active' : 'InActive'}
          color={params.row?.active === '1' ? 'success' : 'error'}
          sx={{
            height: 20,
            fontWeight: 600,
            borderRadius: '5px',
            fontSize: '0.875rem',
            textTransform: 'capitalize',
            '& .MuiChip-label': { mt: -0.25 }
          }}
        />
      )
    },
    {
      flex: 0.5,
      minWidth: 60,
      sortable: false,
      field: 'added_by',
      headerName: 'ADDED BY',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar
            variant='square'
            alt='Medicine Image'
            sx={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: '#E8F4F2',
              overflow: 'hidden'
            }}
          >
            {params.row.user_profile_pic ? (
              <img
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                src={params.row.user_profile_pic}
                alt='Profile'
              />
            ) : (
              <Icon icon='mdi:user' />
            )}
          </Avatar>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography
              noWrap
              sx={{
                color: theme.palette.customColors.OnSurfaceVariant,
                fontSize: '14px',
                fontWeight: '500',
                lineHeight: '16.94px'
              }}
            >
              {params.row.user_full_name ? params.row.user_full_name : '-'}
            </Typography>
            <Typography
              noWrap
              sx={{
                color: theme.palette.customColors.neutralSecondary,
                fontSize: '12px',
                fontWeight: '400',
                lineHeight: '14.52px'
              }}
            >
              {params.row?.created_at
                ? 'Created on' + ' ' + Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.created_at))
                : '-'}
            </Typography>
          </Box>
        </Box>
      )
    }
  ]
  function loadServerRows(currentPage, data) {
    return data
  }

  const fetchDetailsData = useCallback(async () => {
    try {
      setLoader(true)

      await GetRoomDetails(id).then(res => {
        setDetailsData(res?.data)
        setDetailsListData({
          list: {
            Room: res?.data?.room_name,
            'Nursery Name': res?.data?.nursery_name,
            Site: res?.data?.site_name,
            Incubator: res?.data?.no_of_incubators,
            Eggs: res?.data?.no_of_eggs
          },
          Avatar: {
            profile_Pic: res?.data?.user_profile_pic,
            user_Name: res?.data?.user_full_name,
            create_at: res?.data?.created_at,
            site_id: res?.data?.site_id
          }
        })
        setActive(Boolean(Number(res?.data?.active)))
        setIsPreFilled(res?.data)
      })
      setLoader(false)
    } catch (e) {
      setLoader(false)
    }
  }, [])

  const handleEdit = async (event, site_id, room_name, nursery_id, room_id, nursery_name) => {
    event?.stopPropagation()
    setEditParams({
      site_id: site_id,
      room_name: room_name,
      nursery_id: nursery_id,
      room_id: room_id,
      nursery_name: nursery_name
    })
    setIsOpen(true)
  }

  // const headerAction = (
  //   <>
  //     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  //       <IconButton
  //         sx={{ mr: 4 }}
  //         onClick={event =>
  //           handleEdit(
  //             event,
  //             detailsData.site_id,
  //             detailsData.room_name,
  //             detailsData.nursery_id,
  //             detailsData.room_id,
  //             detailsData.nursery_name
  //           )
  //         }
  //       >
  //         <Icon
  //           icon='material-symbols:edit-outline'
  //           fontSize={28}
  //           color={theme.palette.customColors.OnSurfaceVariant}
  //         />
  //       </IconButton>

  //       <Button size='medium' variant='contained' onClick={() => setDialog(true)}>
  //         <Icon icon='mdi:add' fontSize={20} />
  //         &nbsp; ADD INCUBATOR
  //       </Button>
  //     </Box>
  //   </>
  // )

  useEffect(() => {
    if (egg_nursery_permission || egg_collection_permission) {
      fetchDetailsData()
    }
  }, [fetchDetailsData])

  // const onCellClick = params => {
  //   console.log(params, 'params')

  //   Router.push({
  //     pathname: `/egg/incubators/${params.row?.id}`
  //   })
  // }

  const handleSidebarClose = () => {
    setDialog(false)
  }

  const onCellClick = params => {
    // console.log(params, 'params')

    Router.push({
      pathname: `/egg/incubators/${params.row?.incubator_id}`
    })
  }

  return (
    <>
      {egg_nursery_permission || egg_collection_permission ? (
        loader ? (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 20 }}>
              <CircularProgress />
            </Box>
          </CardContent>
        ) : (
          <Grid container spacing={6}>
            <Grid item xs={12}>
              <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
                <Typography sx={{ cursor: 'pointer' }} color='inherit'>
                  Egg
                </Typography>

                <Typography
                  sx={{ cursor: 'pointer' }}
                  color='inherit '
                  onClick={() => Router.push('/egg/incubator-rooms/')}
                >
                  Incubator Room
                </Typography>
                <Typography color='text.primary' sx={{ cursor: 'pointer' }}>
                  Room Details
                </Typography>
              </Breadcrumbs>

              <Card>
                {/* <CardHeader title='Rooms Details' action={headerAction} /> */}
                <Box sx={{ m: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <Icon
                      style={{ cursor: 'pointer', fontSize: '24px' }}
                      onClick={() => Router.push('/egg/incubator-rooms')}
                      color={theme.palette.customColors.OnSurfaceVariant}
                      icon='material-symbols:arrow-back'
                    />
                    <Typography
                      sx={{
                        color: theme.palette.customColors.OnSurfaceVariant,
                        fontWeight: 500,
                        fontSize: '24px',
                        lineHeight: '29.05px'
                      }}
                    >
                      Room Details
                    </Typography>
                  </Box>

                  {egg_nursery_permission && (
                    // <Box sx={{ display: 'flex', alignItems: 'center', gap: '24px' }}>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px' }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={active}
                            onChange={e => {
                              setOpenStatusDialog(true)
                            }}
                          />
                        }
                        labelPlacement='start'
                        label='Active'
                      />

                      <IconButton
                        onClick={event =>
                          handleEdit(
                            event,
                            detailsData.site_id,
                            detailsData.room_name,
                            detailsData.nursery_id,
                            detailsData.room_id,
                            detailsData.nursery_name
                          )
                        }
                      >
                        <Icon
                          icon='material-symbols:edit-outline'
                          fontSize={28}
                          color={theme.palette.customColors.OnSurfaceVariant}
                        />
                      </IconButton>

                      <Button size='medium' variant='contained' onClick={() => setDialog(true)}>
                        <Icon icon='mdi:add' fontSize={20} />
                        &nbsp; ADD INCUBATOR
                      </Button>
                    </Box>

                    // </Box>
                  )}
                </Box>
                <Grid sx={{ ml: -2, mb: 6 }} container columns={15} spacing={6}>
                  <Grid item xs={3}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        border: '1px solid #C3CEC7',
                        borderRadius: '4px',
                        padding: '0 8px',
                        height: '40px'
                      }}
                    >
                      <Icon icon='mi:search' color={theme.palette.customColors.OnSurfaceVariant} />
                      <TextField
                        variant='outlined'
                        placeholder='Search...'
                        InputProps={{
                          disableUnderline: true
                        }}
                        onChange={e => handleSearch(e.target.value, defaultAvailibility?.key)}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            border: 'none',
                            padding: '0',
                            '& fieldset': {
                              border: 'none'
                            }
                          }
                        }}
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={3}>
                    <FormControl fullWidth>
                      <Autocomplete
                        name='availibility'
                        value={defaultAvailibility}
                        disablePortal
                        id='availibility'
                        options={availibilityList?.length > 0 ? availibilityList : []}
                        getOptionLabel={option => option.label}
                        isOptionEqualToValue={(option, value) => option?.key === value?.key}
                        onChange={(e, val) => {
                          if (val === null) {
                            setDefaultAvailibility(null)
                            fetchTableData(searchValue, '')
                          } else {
                            setDefaultAvailibility(val)
                            fetchTableData(searchValue, val?.key)
                          }
                        }}
                        renderInput={params => (
                          <TextField
                            sx={{
                              backgroundColor: '#fff',
                              borderColor: '1px solid #C3CEC7',
                              width: '100%',
                              '& .MuiOutlinedInput-root': {
                                height: 40,
                                borderRadius: '4px'
                              },
                              '& .MuiInputLabel-root': {
                                top: -7
                              },
                              '& input': {
                                position: 'relative',
                                top: -7
                              }
                            }}
                            onChange={e => {
                              // searchSite(e.target.value)
                            }}
                            {...params}
                            label='Availibility'
                            placeholder='Search & Select'
                          />
                        )}
                      />
                    </FormControl>
                  </Grid>
                </Grid>
                <Box sx={{ px: '16px', mt: '0px', mb: '24px' }}>
                  <DetailCard DetailsListData={DetailsListData?.Avatar?.site_id && DetailsListData} />
                </Box>
                <Box>
                  <DataGrid
                    sx={{
                      '.MuiDataGrid-cell:focus': {
                        outline: 'none'
                      },

                      '& .MuiDataGrid-row:hover': {
                        cursor: 'pointer'
                      }
                    }}
                    columnVisibilityModel={{
                      sl_no: false
                    }}
                    disableColumnSelector={true}
                    autoHeight
                    pagination
                    rows={indexedRows === undefined ? [] : indexedRows}
                    rowCount={total}
                    columns={columns}
                    sortingMode='server'
                    paginationMode='server'
                    rowHeight={64}
                    pageSizeOptions={[7, 10, 25, 50]}
                    paginationModel={paginationModel}
                    // onSortModelChange={handleSortModel}
                    // slots={{ toolbar: ServerSideToolbarWithFilter }}
                    onPaginationModelChange={setPaginationModel}
                    loading={loading}
                    // slotProps={{
                    //   baseButton: {
                    //     variant: 'outlined'
                    //   },
                    //   toolbar: {
                    //     value: searchValue,
                    //     clearSearch: () => handleSearch(''),
                    //     onChange: event => handleSearch(event.target.value)
                    //   }
                    // }}
                    onCellClick={onCellClick}
                  />
                </Box>
              </Card>
            </Grid>
            {isOpen && (
              <AddIncubatorRoom
                callApi={fetchDetailsData}
                callTableApi={fetchTableData}
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                editParams={editParams}
              />
            )}

            {dialog && (
              <AddIncubators
                actionApi={fetchTableData}
                detailsApi={fetchDetailsData}
                sidebarOpen={dialog}
                handleSidebarClose={handleSidebarClose}
                incubatorDetail={isPreFilled}
              />
            )}
            <StatusDialogBox
              active={active}
              refType={'room'}
              openStatusDialog={openStatusDialog}
              setOpenStatusDialog={setOpenStatusDialog}
              elements={total}
              statusLoading={statusLoading}
              hatcheryStatusFunc={hatcheryStatusFunc}
            />
            <EditRedirectionDialog
              refType={'incubator room'}
              message={editMessage}
              openRedirectionDialog={openRedirectionDialog}
              setOpenRedirectionDialog={setOpenRedirectionDialog}
              EditRedirectionFunc={EditRedirectionFunc}
            />
          </Grid>
        )
      ) : (
        <>
          {' '}
          <ErrorScreen></ErrorScreen>
        </>
      )}
    </>
  )
}

export default RoomDetails
