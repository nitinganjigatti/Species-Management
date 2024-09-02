import { useEffect, useState, useCallback, useContext } from 'react'
import {
  Avatar,
  Button,
  Divider,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Breadcrumbs,
  Link
} from '@mui/material'
import toast from 'react-hot-toast'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Icon from 'src/@core/components/icon'
import { debounce } from 'lodash'
import FeedOverview from 'src/views/pages/diet/feed/feedoverview'
import { feedDelete, feedStatusChange, getFeedDetails, getIngredientsOnFeed } from 'src/lib/api/diet/getFeedDetails'
import format from 'date-fns/format'
import Router, { useRouter } from 'next/router'
import { DataGrid } from '@mui/x-data-grid'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import { styled } from '@mui/material/styles'
import MuiTabList from '@mui/lab/TabList'
import moment from 'moment'
import Drawer from '@mui/material/Drawer'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import Tooltip from '@mui/material/Tooltip'
import ModuleDeleteDialogConfirmation from 'src/components/utility/ModuleDeleteDialogConfirmation'
import ActivityLogs from 'src/components/diet/activityLogs'
import Error404 from 'src/pages/404'
import { AuthContext } from 'src/context/AuthContext'
import Toaster from 'src/components/Toaster'
import DeleteDialogConfirmation from 'src/components/utility/DeleteDialogConfirmation'

// Styled TabList component
const TabList = styled(MuiTabList)(({ theme }) => ({
  '& .MuiTabs-indicator': {
    display: 'none'
  },
  '& .Mui-selected': {
    backgroundColor: theme.palette.primary.main,
    color: '#fff!important',
    fontWeight: 500
  },
  '& .MuiTab-root': {
    minHeight: 38,
    minWidth: 170,
    borderRadius: 8,
    padding: 14,
    color: '#7A8684',
    fontWeight: 500
  },
  '& .MuiTabs-flexContainer': {
    borderRadius: 8,
    width: '342px',
    backgroundColor: '#E8F4F2'
  }
}))

const FeedDetails = () => {
  const router = useRouter()
  const { id } = router.query
  const [value, setValue] = useState('1')
  const [FeedDetailsValue, setFeedDetails] = useState([])
  const [loader, setLoader] = useState(true)

  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('ASC')
  const [sortColumning, setsortColumning] = useState('ingredient_name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 5 })
  const [loading, setLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  const [deleteDialogBox, setDeleteDialogBox] = useState(false)
  const [statusDialog, setstatusDialog] = useState(false)

  const [isActive, setIsActive] = useState(FeedDetailsValue?.active || '0')

  const authData = useContext(AuthContext)
  const dietModule = authData?.userData?.roles?.settings?.diet_module
  const dietModuleAccess = authData?.userData?.roles?.settings?.diet_module_access

  const onClose = () => {
    setDeleteDialogBox(false)
  }

  const handleClosenew = () => {
    setstatusDialog(false)
  }

  const confirmStatusAction = async () => {
    try {
      const response = await feedStatusChange({ status: 0 }, FeedDetailsValue?.id)
      if (response.success === true) {
        setstatusDialog(false)
        setIsActive(isActive == '1' ? '0' : '1')

        Toaster({ type: 'success', message: response.message })
      } else {
        Toaster({ type: 'error', message: 'something went wrong' })
      }
    } catch (error) {}
  }

  const confirmDeleteAction = async () => {
    try {
      const response = await feedDelete(FeedDetailsValue?.id)
      if (response.success === true) {
        setDeleteDialogBox(false)
        Router.push('/diet/feed')

        Toaster({ type: 'success', message: response.message })
      } else {
        setDeleteDialogBox(false)

        Toaster({ type: 'error', message: response.message })
      }
    } catch (error) {
      console.log('dfghj', error)
    }
  }

  const [activitySidebarOpen, setActivitySidebarOpen] = useState(false)
  const [activitySearchValue, setActivitySearchValue] = useState('')

  const handleSidebarClose = () => {
    setActivitySidebarOpen(false)
  }

  const [expanded, setExpanded] = useState(false)

  const toggleExpanded = () => {
    setExpanded(!expanded)
  }

  const handleChange = (event, newValue) => {
    setValue(newValue)
  }

  function loadServerRows(currentPage, data) {
    return data
  }

  const columns = [
    {
      flex: 0.1,
      minWidth: 30,
      field: 'id',
      headerName: 'SL',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.id}
        </Typography>
      )
    },
    {
      flex: 0.5,
      minWidth: 30,
      field: 'ingredient_name',
      headerName: 'INGREDIENTS',
      renderCell: params => (
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Avatar variant='square' src={params?.row?.image ? params?.row?.image : ''} />
          {params?.row?.ingredient_name ? params?.row?.ingredient_name : ''}
        </Box>
      )
    },
    {
      flex: 0.7,
      minWidth: 10,
      field: 'created_by_user',
      headerName: 'ADDED BY',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0 }}>
          <Avatar
            variant='round'
            src={params?.row?.created_by_user?.profile_pic ? params?.row?.created_by_user?.profile_pic : ''}
          />
          <Box sx={{ display: 'flex', flexDirection: 'column', mx: 2 }}>
            <Typography sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
              {params?.row?.created_by_user?.user_name ? params?.row?.created_by_user?.user_name : ''}
            </Typography>
            <Typography variant='caption' sx={{ color: 'text.disabled', color: 'rgb(76 78 100 / 56%)' }}>
              Added on {format(new Date(params?.row?.created_at ? params?.row?.created_at : ''), 'MM/dd/yyyy')}
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      flex: 0.2,
      minWidth: 10,
      field: 'status',
      headerName: '',
      renderCell: params => (
        <Box sx={{ display: 'flex', gap: 2, cursor: 'pointer' }}>
          <Icon color='#a7a7a7' icon='mdi:eye-outline' />
        </Box>
      )
    }
  ]

  const convertToTitleCase = str => {
    if (!str) return ''

    const firstLetter = str.charAt(0).toUpperCase()
    const restOfWord = str.slice(1).toLowerCase()

    return firstLetter + restOfWord
  }

  const getFeedDetailsList = async id => {
    try {
      const response = await getFeedDetails(id)
      if (response.data.success === true) {
        setFeedDetails(response.data.data)
        setLoader(false)
      }
      setLoader(false)
    } catch (error) {
      // console.log('Feed list', error)
      setLoader(false)
    }
  }

  useEffect(() => {
    if (id) {
      getFeedDetailsList(id)
    }
  }, [id])

  const getIngredientsonFeedList = useCallback(
    async (q, sortColumning) => {
      if (id) {
        try {
          setLoading(true)

          await getIngredientsOnFeed(id, {
            q,
            page: paginationModel.page + 1,
            searchColumns: sortColumning,
            limit: paginationModel.pageSize
          }).then(res => {
            if (res?.data?.success) {
              let listWithId = res.data?.data?.result.map((el, i) => {
                return { ...el, id: i + 1 }
              })
              setTotal(parseInt(res?.data?.data?.total_count))
              setRows(loadServerRows(paginationModel.page, listWithId))
            } else {
              console.log('err', res)
            }
          })
          setLoading(false)
        } catch (e) {
          setLoading(false)
        }
      }
    },
    [paginationModel]
  )
  useEffect(() => {
    getIngredientsonFeedList(searchValue, sortColumning)
  }, [id, getIngredientsonFeedList])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const handleSortModel = newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setsortColumning(newModel[0].field)
      getIngredientsonFeedList(searchValue, newModel[0].field)
    } else {
    }
  }

  const searchTableData = useCallback(
    debounce(async (q, sortColumn) => {
      try {
        await getIngredientsonFeedList(q, sortColumn)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(value, sortColumning)
  }

  return (
    <>
      {dietModule ? (
        <>
          {loader ? (
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 20 }}>
                <CircularProgress />
              </Box>
            </CardContent>
          ) : (
            <Grid container spacing={6}>
              <Grid item xs={12}>
                <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
                  <Typography color='inherit'>Diet</Typography>
                  <Typography sx={{ cursor: 'pointer' }} color='inherit' onClick={() => Router.push('/diet/feed')}>
                    Feed
                  </Typography>
                  <Typography color='text.primary'>Feed Details</Typography>
                </Breadcrumbs>
                <>
                  <Card>
                    <CardContent sx={{ my: 2 }}>
                      <Box sx={{ display: 'flex', height: '32px', justifyContent: 'space-between' }}>
                        <Typography sx={{ fontWeight: 600 }} variant='h6'>
                          {FeedDetailsValue?.feed_type_name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'end' }}>
                          {(dietModuleAccess === 'EDIT' || dietModuleAccess === 'DELETE') && (
                            <Tooltip title='Edit' placement='top'>
                              <Box sx={{ pr: 3 }}>
                                <Icon
                                  icon='bx:pencil'
                                  style={{ cursor: 'pointer' }}
                                  onClick={() =>
                                    Router.push({
                                      pathname: '/diet/feed/add-feed',
                                      query: { id: FeedDetailsValue?.id }
                                    })
                                  }
                                />
                              </Box>
                            </Tooltip>
                          )}
                          {dietModuleAccess === 'DELETE' && (
                            <Tooltip title='Delete' placement='top'>
                              <Box>
                                <Icon
                                  icon='material-symbols:delete-outline'
                                  style={{ cursor: 'pointer', marginLeft: '15px' }}
                                  onClick={() => {
                                    if (Number(FeedDetailsValue?.ingredients) > 0) {
                                      setstatusDialog(true)
                                    } else {
                                      setDeleteDialogBox(true)
                                    }
                                  }}
                                />
                              </Box>
                            </Tooltip>
                          )}
                        </Box>
                      </Box>
                      <Grid container spacing={6} sx={{ mt: 3 }}>
                        <FeedOverview
                          isActive={isActive}
                          setIsActive={setIsActive}
                          FeedDetailsValue={FeedDetailsValue}
                          permission={dietModuleAccess === 'EDIT' || dietModuleAccess === 'DELETE' ? true : false}
                        />
                        <Grid item xs={8}>
                          <TabContext value={value}>
                            <TabList onChange={handleChange} aria-label='customized tabs example'>
                              <Tab
                                style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                                value='1'
                                label='OVERVIEW'
                              />
                              <Tab
                                style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                                value='2'
                                label='USED INGREDIENTS'
                              />
                            </TabList>
                            <TabPanel sx={{ paddingLeft: 0 }} value='1'>
                              {FeedDetailsValue.desc ? (
                                <div>
                                  <Typography sx={{ mb: 2, fontSize: '16px', fontWeight: '600' }}>
                                    Description
                                  </Typography>
                                  <Typography
                                    variant='body2'
                                    sx={{
                                      width: '100%',
                                      color: '#7A8684',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      display: '-webkit-box',
                                      WebkitLineClamp: expanded ? 'unset' : 3,
                                      WebkitBoxOrient: 'vertical',
                                      transition: 'max-height 2s ease-in-out',
                                      maxHeight: expanded ? '1000px' : '60px'
                                    }}
                                  >
                                    {convertToTitleCase(FeedDetailsValue?.desc)}
                                  </Typography>
                                  {FeedDetailsValue?.desc?.length > 180 ? (
                                    <Typography
                                      onClick={toggleExpanded}
                                      sx={{
                                        fontWeight: '600',
                                        fontSize: '13px',
                                        textDecoration: 'underline',

                                        color: '#000',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      {expanded ? 'View less' : 'View more'}
                                    </Typography>
                                  ) : (
                                    ''
                                  )}
                                </div>
                              ) : (
                                ''
                              )}

                              <div>
                                <Divider sx={{ mt: 4, borderColor: '#C3CEC7' }} />
                                <Box className='demo-space-x' sx={{ display: 'flex' }}>
                                  <Avatar
                                    src={
                                      FeedDetailsValue?.created_by_user
                                        ? FeedDetailsValue.created_by_user?.profile_pic
                                        : undefined
                                    }
                                    alt={
                                      FeedDetailsValue?.created_by_user
                                        ? FeedDetailsValue?.created_by_user?.user_name
                                        : 'User'
                                    }
                                  >
                                    {!FeedDetailsValue.created_by_user ? <Icon icon='mdi:user' /> : null}
                                  </Avatar>
                                  <Typography sx={{ color: '#000000' }}>
                                    {FeedDetailsValue?.created_by_user
                                      ? FeedDetailsValue?.created_by_user?.user_name
                                      : '-'}{' '}
                                    <br />
                                    <div style={{ color: '#44544A', fontSize: 12, margin: 0 }}>
                                      {'Created on' + ' ' + moment(FeedDetailsValue?.created_at).format('DD/MM/YYYY')}
                                    </div>
                                  </Typography>

                                  <Box
                                    onClick={() => setActivitySidebarOpen(true)}
                                    sx={{ display: 'flex', marginLeft: 'auto', cursor: 'pointer' }}
                                  >
                                    <Typography sx={{ color: '#000000', my: 3, fontSize: 14 }}>Activity Log</Typography>
                                    <Icon
                                      icon='ph:clock'
                                      style={{ marginLeft: '4px', marginTop: '13px', fontSize: 20 }}
                                    />
                                  </Box>
                                </Box>
                              </div>
                              {/* <Box sx={{ display: 'flex', marginLeft: 'auto', cursor: 'pointer' }}>
                            <Drawer
                              anchor='right'
                              open={activitySidebarOpen}
                              ModalProps={{ keepMounted: true }}
                              sx={{
                                '& .MuiDrawer-paper': { width: ['100%', 520] },
                                height: '100vh',
                                '& .css-e1dg5m-MuiCardContent-root': {
                                  pt: 0
                                }
                              }}
                            >
                              <CardContent> */}
                              <ActivityLogs
                                activitySidebarOpen={activitySidebarOpen}
                                activity_type='feedType'
                                detailsValue={FeedDetailsValue}
                                searchValue={activitySearchValue}
                                setSearchValue={setActivitySearchValue}
                                handleSidebarClose={handleSidebarClose}
                              />
                              {/* </CardContent>
                            </Drawer>
                          </Box> */}
                            </TabPanel>
                            <TabPanel sx={{ p: 0, pt: 2 }} value='2'>
                              <Box sx={{ display: 'flex', mb: 4, height: '32px', justifyContent: 'space-between' }}>
                                <Typography sx={{ fontWeight: 600, fontSize: '16px' }}>Ingredients</Typography>
                                <Button
                                  onClick={() =>
                                    Router.push({
                                      pathname: '/diet/ingredient/add-ingredient',
                                      query: {
                                        feedTypeId: FeedDetailsValue?.id,
                                        feedTypeName: FeedDetailsValue?.feed_type_name
                                      }
                                    })
                                  }
                                  sx={{ px: 7, py: 5, ml: 34 }}
                                  size='small'
                                  variant='contained'
                                >
                                  <Icon icon='mdi:add' fontSize={20} />
                                  &nbsp; Add ingredient
                                </Button>
                              </Box>
                              <DataGrid
                                sx={{
                                  '.MuiDataGrid-cell:focus': {
                                    outline: 'none'
                                  },
                                  '& .MuiDataGrid-row:hover': {
                                    cursor: 'pointer'
                                  },
                                  '& .css-1tg25fo': {
                                    paddingRight: 0
                                  }
                                }}
                                columnVisibilityModel={{
                                  sl_no: false
                                }}
                                hideFooterSelectedRowCount
                                disableColumnSelector={true}
                                autoHeight
                                pagination
                                rows={indexedRows === undefined ? [] : indexedRows}
                                rowCount={total}
                                columns={columns}
                                sortingMode='server'
                                paginationMode='server'
                                pageSizeOptions={[5, 10, 25, 50]}
                                paginationModel={paginationModel}
                                onSortModelChange={handleSortModel}
                                slots={{
                                  toolbar: ServerSideToolbarWithFilter,
                                  searchField: {
                                    '& div .css-1tg25fo': {
                                      backgroundColor: 'lightblue',
                                      paddingRight: 9
                                    }
                                  }
                                }}
                                onPaginationModelChange={setPaginationModel}
                                loading={loading}
                                slotProps={{
                                  baseButton: {
                                    variant: 'outlined'
                                  },
                                  toolbar: {
                                    value: searchValue,
                                    clearSearch: () => handleSearch(''),
                                    onChange: event => handleSearch(event.target.value)
                                  }
                                }}
                              />
                            </TabPanel>
                          </TabContext>
                        </Grid>
                      </Grid>

                      {/* <ModuleDeleteDialogConfirmation
                        handleClosenew={handleClosenew}
                        action={confirmStatusAction}
                        open={statusDialog}
                        type='feed'
                        active={isActive == '1'}
                        message={
                          <span style={{ fontSize: '24px', fontWeight: '600', lineHeight: '1px' }}>
                            Deletion isn't possible!
                          </span>
                        }
                      /> */}
                      <DeleteDialogConfirmation
                        handleClosenew={handleClosenew}
                        action={confirmStatusAction}
                        open={statusDialog}
                        typeCount={FeedDetailsValue?.ingredients}
                        type='feed'
                        active={isActive == '1'}
                        dietCount={FeedDetailsValue.ingredients}
                        actionType={'confirm'}
                        message={
                          <span style={{ fontSize: '24px', fontWeight: '600', lineHeight: '1px' }}>
                            {/* {isActive === '1' ? 'Deactivate' : 'Activate'} Feed Type? */}
                            Deletion isn't possible!
                          </span>
                        }
                      />

                      <ConfirmationDialog
                        icon={'mdi:delete'}
                        iconColor={'#ff3838'}
                        title={'Are you sure you want to delete this Feed?'}
                        dialogBoxStatus={deleteDialogBox}
                        onClose={onClose}
                        ConfirmationText={'Delete'}
                        confirmAction={confirmDeleteAction}
                      />
                    </CardContent>
                  </Card>
                </>
              </Grid>
            </Grid>
          )}
        </>
      ) : (
        <>
          <Error404></Error404>
        </>
      )}
    </>
  )
}

export default FeedDetails
