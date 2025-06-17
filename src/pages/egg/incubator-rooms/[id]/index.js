import React, { useCallback, useEffect, useState, useContext } from 'react'
import Router, { useRouter } from 'next/router'

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
import { DataGrid } from '@mui/x-data-grid'
import { useTheme } from '@mui/material/styles'

import { debounce } from 'lodash'
import moment from 'moment'

import Utility from 'src/utility'
import { AuthContext } from 'src/context/AuthContext'
import ErrorScreen from 'src/pages/Error'

import Icon from 'src/@core/components/icon'
import CustomChip from 'src/@core/components/mui/chip'
import DetailCard from 'src/components/egg/DetailCard'
import Toaster from 'src/components/Toaster'
import AddIncubatorRoom from 'src/components/egg/AddIncubatorRoom'

import AddIncubators from 'src/views/pages/egg/incubator/addIncubators'
import StatusDialogBox from 'src/views/pages/egg/eggs/eggDetails/StatusDialogBox'
import EditRedirectionDialog from 'src/views/pages/egg/eggs/eggDetails/EditRedirectionDialog'

import { getAvailibilityList, getIncubatorList } from 'src/lib/api/egg/incubator'
import { hatcheryStatus } from 'src/lib/api/egg'
import { GetRoomDetails } from 'src/lib/api/egg/room/getRoom'

const RoomDetails = () => {
  const theme = useTheme()
  const router = useRouter()
  const authData = useContext(AuthContext)
  const cuurent_date = moment().format('YYYY-MM-DD')

  const { id } = router.query
  const editParamsInitialState = { site_id: null, room_name: null, nursery_id: null, nursery_name: null }
  const egg_nursery_permission = authData?.userData?.permission?.user_settings?.add_nursery_permisson
  const egg_collection_permission = authData?.userData?.roles?.settings?.enable_egg_collection_module

  const [editParams, setEditParams] = useState(editParamsInitialState)
  const [loader, setLoader] = useState(false)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [detailsData, setDetailsData] = useState({})

  const [availibilityList, setAvailibilityList] = useState([])
  const [defaultAvailibility, setDefaultAvailibility] = useState(null)

  const [openStatusDialog, setOpenStatusDialog] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const [active, setActive] = useState(false)

  const [isOpen, setIsOpen] = useState(false)
  const [DetailsListData, setDetailsListData] = useState({})
  const [dialog, setDialog] = useState(false)
  const [isPreFilled, setIsPreFilled] = useState({})

  const [openRedirectionDialog, setOpenRedirectionDialog] = useState(false)
  const [editMessage, setEditMessage] = useState('')

  // ✅ Extracted helper functions and cleaned structure for clarity
  // const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1
  const getSlNo = index => paginationModel.page * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const loadServerRows = (currentPage, data) => data

  // const fetchTableData = useCallback(
  //   async (q, availability) => {
  //     try {
  //       setLoading(true)

  //       const params = {
  //         sort,
  //         q,
  //         room_id: id,
  //         availability,
  //         til_date: cuurent_date,
  //         page_no: paginationModel.page + 1,
  //         limit: paginationModel.pageSize
  //       }

  //       await getIncubatorList({ params }).then(res => {
  //         // Generate uid field based on the index
  //         let listWithId = res?.data?.data?.result?.map((el, i) => {
  //           return { ...el, id: i + 1 }
  //         })
  //         setTotal(parseInt(res?.data?.data?.total_count))
  //         setRows(loadServerRows(paginationModel.page, listWithId))

  //         // setstatusCheckval(res?.data?.result.map(all => all.active))
  //       })
  //       setLoading(false)
  //     } catch (e) {
  //       console.log(e)
  //       setLoading(false)
  //     }
  //   },
  //   [paginationModel]
  // )

  // ✅ Fetch incubator list
  const fetchTableData = useCallback(
    async (q = '', availability) => {
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

      try {
        const res = await getIncubatorList({ params })
        const listWithId = res?.data?.data?.result?.map((el, i) => ({ ...el, id: i + 1 }))
        setTotal(parseInt(res?.data?.data?.total_count ?? '0'))
        setRows(loadServerRows(paginationModel.page, listWithId))
      } catch (error) {
        console.error('Error fetching incubator list:', error)
      } finally {
        setLoading(false)
      }
    },
    [paginationModel]
  )

  // ✅ Debounced search
  const searchTableData = useCallback(
    debounce(async (q, status) => {
      setSearchValue(q)
      try {
        await fetchTableData(q, status)
      } catch (error) {
        console.error(error)
      }
    }, 1000),

    // []
    [fetchTableData]
  )

  const handleSearch = (value, status) => {
    setSearchValue(value)
    searchTableData(value, status)
  }

  // ✅ Availability List
  const AvailibityList = async () => {
    try {
      const res = await getAvailibilityList()
      setAvailibilityList(res?.data?.data ?? [])
    } catch (error) {
      console.error('Error fetching availability list:', error)
    }
  }

  useEffect(() => {
    AvailibityList()
  }, [])

  // ✅ Edit Redirection
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

  // ✅ Hatchery Status Update
  const hatcheryStatusFunc = async () => {
    setStatusLoading(true)

    try {
      const response = await hatcheryStatus({
        ref_type: 'room',
        ref_id: id,
        status: active ? 'deactivate' : 'activate'
      })
      if (response.success) {
        Toaster({ type: 'success', message: response.message })
        setActive(!active)
      } else {
        Toaster({ type: 'error', message: response.message })
        setEditMessage(response?.message)
        setOpenRedirectionDialog(true)
      }
      fetchDetailsData()
    } catch (error) {
      Toaster({ type: 'error', message: response.message })
    } finally {
      setOpenStatusDialog(false)
      setStatusLoading(false)
    }
  }

  useEffect(() => {
    if (egg_nursery_permission || egg_collection_permission) {
      fetchTableData(searchValue, defaultAvailibility?.key)
    }
  }, [fetchTableData])

  const columns = [
    {
      minWidth: 80,
      field: 'id',
      headerName: 'SL.NO',
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
      headerName: 'ROOM',
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
              background: theme.palette.customColors.displaybgPrimary,
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

  // ✅ Fetch Room Details
  const fetchDetailsData = useCallback(async () => {
    setLoader(true)

    try {
      const res = await GetRoomDetails(id)
      const data = res?.data
      setDetailsData(data)
      setDetailsListData({
        list: {
          Room: data?.room_name,
          'Nursery Name': data?.nursery_name,
          Site: data?.site_name,
          Incubator: data?.no_of_incubators,
          Eggs: data?.no_of_eggs
        },
        Avatar: {
          profile_Pic: data?.user_profile_pic,
          user_Name: data?.user_full_name,
          create_at: data?.created_at,
          site_id: data?.site_id
        }
      })
      setActive(Boolean(Number(data?.active)))
      setIsPreFilled(data)
    } catch (error) {
      console.error('Error fetching room details:', error)
    } finally {
      setLoader(false)
    }
  }, [])

  useEffect(() => {
    if (egg_nursery_permission || egg_collection_permission) {
      fetchDetailsData()
    }
  }, [fetchDetailsData])

  const handleEdit = (event, site_id, room_name, nursery_id, room_id, nursery_name) => {
    event?.stopPropagation()
    setEditParams({ site_id, room_name, nursery_id, room_id, nursery_name })
    setIsOpen(true)
  }
  const handleSidebarClose = () => setDialog(false)

  const onCellClick = params => {
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
            <Grid item size={{ xs: 12 }}>
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
                <Grid sx={{ ml: 4, mb: 6 }} container columns={15} spacing={6}>
                  <Grid item size={{ xs: 3 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                        borderRadius: '4px',
                        padding: '0 8px',
                        height: '40px'
                      }}
                    >
                      <Icon icon='mi:search' color={theme.palette.customColors.OnSurfaceVariant} />
                      <TextField
                        variant='outlined'
                        placeholder='Search...'
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
                        slotProps={{
                          input: {
                            disableunderline: true
                          }
                        }}
                      />
                    </Box>
                  </Grid>

                  <Grid item size={{ xs: 3 }}>
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
                              backgroundColor: theme.palette.primary.contrastText,
                              borderColor: `1px solid ${theme.palette.customColors.OutlineVariant}`,
                              width: '100%',
                              '& .MuiOutlinedInput-root': {
                                height: 40,
                                borderRadius: '4px'
                              },
                              '& .MuiInputLabel-root': {
                                top: -7
                              },
                              '& .MuiInputLabel-shrink': {
                                top: 0
                              },
                              '& input': {
                                position: 'relative',
                                top: -0
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
                      '.MuiDataGrid-main': {
                        borderLeft: '1px solid #0000000D',
                        borderRight: '1px solid #0000000D',
                        marginLeft: '16px',
                        marginRight: '16px',
                        borderRadius: '8px',
                        border: '1px solid rgba(233, 233, 236, 1)'
                      },
                      '& .MuiDataGrid-footerContainer': {
                        borderTop: 'none'
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
                    onPaginationModelChange={setPaginationModel}
                    loading={loading}
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
              toggleHatcheryStatus={hatcheryStatusFunc}
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
