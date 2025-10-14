import React, { useState, useEffect, useCallback, useContext } from 'react'
import FallbackSpinner from 'src/@core/components/spinner/index'
import CardHeader from '@mui/material/CardHeader'
import { DataGrid } from '@mui/x-data-grid'
import { debounce } from 'lodash'
import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import { Avatar, Button, Box } from '@mui/material'

// ** MUI Imports
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import Router, { useRouter } from 'next/router'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import { getDietList } from 'src/lib/api/diet/dietList'
import CustomChip from 'src/@core/components/mui/chip'

import { AuthContext } from 'src/context/AuthContext'
import { useTheme } from '@mui/material/styles'
import Error404 from 'src/pages/404'

import RenderUtility from 'src/utility/render'
import moment from 'moment'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'

// Styled TabList component
const roleColors = {
  active: 'success',
  inactive: 'error'
}

const Diet = () => {
  const router = useRouter()
  const theme = useTheme()
  const { query } = router
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState(query.q || '')
  const [sortColumn, setSortColumn] = useState('created_at')

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(query.page || 0, 10),
    pageSize: parseInt(query.pageSize || 50, 10)
  })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(query.status || '')
  const [loader, setLoader] = useState(false)
  const authData = useContext(AuthContext)
  const dietModule = authData?.userData?.roles?.settings?.diet_module
  const dietModuleAccess = authData?.userData?.roles?.settings?.diet_module_access

  function loadServerRows(currentPage, data) {
    return data
  }

  // Common function to update URL query parameters
  const updateQueryParams = useCallback(
    newParams => {
      router.replace(
        {
          pathname: router.pathname,
          query: {
            ...router.query,
            ...newParams
          }
        },
        undefined,
        { shallow: true }
      )
    },
    [router]
  )

  useEffect(() => {
    const page = parseInt(query.page || 0, 10)
    const pageSize = parseInt(query.pageSize || 50, 10)
    const status = query.status || ''

    setPaginationModel({ page: page, pageSize: pageSize })
    setStatus(status)
  }, [query.page, query.pageSize, query.status])

  const handleChange = (event, newValue) => {
    setStatus(newValue)
    setTotal(0)
    setPaginationModel({ page: 0, pageSize: 50 })
    updateQueryParams({ page: 0, status: newValue, pageSize: 50 })
  }

  const fetchTableData = useCallback(
    async (sort, q, sortColumn, status, pageSize = paginationModel.pageSize) => {
      try {
        setLoading(true)

        const params = {
          sortBy: sort,
          q,
          sortColumn,
          page: paginationModel.page + 1,
          limit: pageSize,
          status
        }

        await getDietList({ params: params }).then(res => {
          const startingIndex = paginationModel.page * paginationModel.pageSize

          let listWithId = res.data.result.map((el, i) => {
            return { ...el, uid: startingIndex + i + 1 }
          })
          setTotal(parseInt(res?.data?.total_count))
          setRows(loadServerRows(paginationModel.page, listWithId))
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
    if (dietModule) {
      fetchTableData(sort, searchValue, sortColumn, status)
    }
  }, [status, paginationModel.page, paginationModel.pageSize, sort, sortColumn])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const handleSortModel = newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)

      fetchTableData(newModel[0].sort, searchValue, newModel[0].field, status)
    } else {
    }
  }

  const searchTableData = useCallback(
    debounce(async (sort, q, sortColumn, status, pageSize) => {
      setSearchValue(q)
      try {
        await fetchTableData(sort, q, sortColumn, status, pageSize)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const headerAction = (
    <>
      {dietModule && (dietModuleAccess === 'ADD' || dietModuleAccess === 'EDIT' || dietModuleAccess === 'DELETE') && (
        <div>
          <Button sx={{ m: 2 }} size='small' variant='contained' onClick={() => Router.push('/diet/add-diet')}>
            <Icon icon='mdi:add' fontSize={20} />
            &nbsp; Add New
          </Button>
          {/* <Button size='small' variant='contained' onClick={addEventSidebarOpen}>
        <Icon icon='mdi:add' fontSize={20} />
        &nbsp; Add Recipe
      </Button> */}
        </div>
      )}
    </>
  )

  const handleSearch = value => {
    setPaginationModel({ page: 0, pageSize: paginationModel.pageSize })
    updateQueryParams({ q: value, page: 0, pageSize: paginationModel.pageSize })
    setSearchValue(value)
    searchTableData(sort, value, sortColumn, status, paginationModel.pageSize)
  }

  const columns = [
    {
      //flex: 0.19,
      width: 70,
      field: 'uid',
      headerName: 'SL',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', pl: 3 }}>
          {params.row.uid}
        </Typography>
      )
    },
    {
      //flex: 0.8,
      width: 350,
      field: 'diet_no',
      headerName: 'Diet Id',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            variant='square'
            alt='Diet Image'
            sx={{
              width: 40,
              height: 40,
              mr: 4,
              background: theme.palette.customColors.tableHeaderBg,
              padding: '8px',
              borderRadius: '4px'
            }}
            src={params.row.diet_image ? params.row.diet_image : '/icons/icon_diet_fill.png'}
          ></Avatar>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: '14px', fontWeight: '500' }}>
              {params.row.diet_no ? params.row.diet_no : '-'}
            </Typography>
            <Typography
              noWrap
              variant='body2'
              sx={{ color: 'text.primary', fontSize: '12px', fontWeight: '500', fontStyle: 'italic' }}
            >
              {params.row.diet_name}
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      //flex: 0.3,
      width: 130,
      field: 'no_meals',
      headerName: 'No of mixes',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', pl: 3 }}>
          {params.row.combo ? params.row.combo : '-'}
        </Typography>
      )
    },
    {
      //flex: 0.3,
      width: 120,
      field: 'no_recipe',
      headerName: 'No of Recipes',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', pl: 3 }}>
          {params.row.recipe ? params.row.recipe : '-'}
        </Typography>
      )
    },

    // {
    //   //flex: 0.6,
    //   width: 260,
    //   field: 'created_at',
    //   headerName: 'CREATED BY',
    //   renderCell: params => (
    //     <Box sx={{ display: 'flex', alignItems: 'center' }}>
    //       <Avatar
    //         variant='square'
    //         alt='Diet Image'
    //         sx={{
    //           width: 30,
    //           height: 30,
    //           mr: 4,
    //           borderRadius: '50%',
    //           background: theme.palette.customColors.tableHeaderBg,
    //           overflow: 'hidden'
    //         }}
    //       >
    //         {params.row.profile_pic ? (
    //           <img
    //             style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    //             src={params.row.profile_pic}
    //             alt='Profile'
    //           />
    //         ) : (
    //           <Icon icon='mdi:user' />
    //         )}
    //       </Avatar>
    //       <Box sx={{ display: 'flex', flexDirection: 'column' }}>
    //         <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: 14, fontWeight: 500 }}>
    //           {params.row.user_name ? params.row.user_name : '-'}
    //         </Typography>
    //         <Typography noWrap variant='body2' sx={{ color: theme.palette.customColors.secondaryBg, fontSize: 12 }}>
    //           {params.row.created_at ? 'Created on' + ' ' + params.row.created_at : '-'}
    //         </Typography>
    //       </Box>
    //     </Box>
    //   )
    // },

    {
      //flex: 0.6,
      width: 260,
      field: 'dietitian_name',
      headerName: 'Nutritionist',
      renderCell: params => (
        <>
          <Box>
            <UserAvatarDetails
              profile_image={params.row.dietitian_profile_pic}
              user_name={params.row.dietitian_name}
              role={params.row.dietitian_role_name}
              crby_width='200px'
            />
            {/* {UserAvatarDetails({
              profile_image: params.row.profile_pic,
              user_name: params.row.user_name,
              descriptors: params.row.dietitian_role_name

              // date: moment(params.row.created_at, 'DD/MM/YYYY').format('YYYY-MM-DD')
            })} */}
          </Box>
        </>
      )
    },

    {
      //flex: 0.6,
      width: 260,
      field: 'created_at',
      headerName: 'CREATED BY',
      renderCell: params => (
        <>
          <Box>
            {RenderUtility.renderUserAvatarDetails({
              profile_image: params.row.profile_pic,
              user_name: params.row.user_name,
              date: moment(params.row.created_at, 'DD/MM/YYYY').format('YYYY-MM-DD'),
              crby_width: 200
            })}
          </Box>
        </>
      )
    },

    {
      //flex: 0.3,
      width: 100,
      field: 'status',
      headerName: 'STATUS',
      renderCell: params => (
        <CustomChip
          skin='light'
          size='small'
          label={params.row?.status === 'active' ? 'Active' : 'InActive'}
          color={params.row?.status === 'active' ? roleColors.active : roleColors.inactive}
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
    }
  ]

  const onCellClick = params => {
    const clickedColumn = params.field !== 'switch'

    if (clickedColumn) {
      const data = params.row

      router.push({ pathname: `/diet/diet/${data?.id}` })
    } else {
      return
    }
  }

  const TabBadge = ({ label, totalCount }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between' }}>
      {label}
      {totalCount ? (
        <Chip sx={{ ml: '6px', fontSize: '12px' }} size='small' label={totalCount} color='secondary' />
      ) : null}
    </div>
  )

  const tableData = () => {
    return (
      <>
        {loader ? (
          <FallbackSpinner />
        ) : (
          <>
            <Card>
              <CardHeader title='Diet' action={headerAction} sx={{ px: 5 }} />

              <Box sx={{ width: '100%', overflowX: 'auto' }}>
                <DataGrid
                  sx={{
                    height: 700,
                    '.MuiDataGrid-cell:focus': {
                      outline: 'none'
                    },
                    '& .MuiDataGrid-row:hover': {
                      cursor: 'pointer'
                    },
                    '& .MuiDataGrid-columnHeaders': {
                      backgroundColor: theme.palette.customColors.customTableHeaderBg,
                      color: theme.palette.customColors.customHeadingTextColor
                    },
                    '.MuiDataGrid-virtualScroller': {
                      overflowX: 'auto'
                    },
                    '.MuiDataGrid-main': {
                      borderLeft: `1px solid ${theme.palette.customColors.mdAntzNeutral}`,
                      borderRight: `1px solid ${theme.palette.customColors.mdAntzNeutral}`,
                      marginLeft: '20px',
                      marginRight: '20px',
                      borderRadius: '8px',
                      border: '1px solid rgba(233, 233, 236, 1)'
                    },
                    '& .MuiDataGrid-footerContainer': {
                      borderTop: 'none'
                    },

                    '& .MuiDataGrid-row:last-of-type .MuiDataGrid-cell': {
                      borderBottom: 'none'
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
                  pageSizeOptions={[7, 10, 25, 50, 100]}
                  paginationModel={paginationModel}
                  onSortModelChange={handleSortModel}
                  slots={{ toolbar: ServerSideToolbarWithFilter }}
                  onPaginationModelChange={newPaginationModel => {
                    updateQueryParams({
                      page: newPaginationModel.page,
                      pageSize: newPaginationModel.pageSize
                    })
                    setPaginationModel(newPaginationModel)
                  }}
                  loading={loading}
                  slotProps={{
                    baseButton: {
                      variant: 'outlined'
                    },
                    toolbar: {
                      value: searchValue,
                      title: 'diet',
                      clearSearch: () => handleSearch(''),
                      onChange: event => handleSearch(event.target.value)
                    }
                  }}
                  onCellClick={onCellClick}
                />
              </Box>
            </Card>
          </>
        )}
      </>
    )
  }

  return (
    <>
      {dietModule ? (
        <Grid>
          <TabContext sx={{ cursor: 'pointer' }} value={status}>
            <TabList onChange={handleChange}>
              <Tab value='' label={<TabBadge label='All' totalCount={status === '' ? total : null} />} />
              <Tab value='1' label={<TabBadge label='Active' totalCount={status === '1' ? total : null} />} />
              <Tab value='0' label={<TabBadge label='Inactive' totalCount={status === '0' ? total : null} />} />
            </TabList>
            <TabPanel sx={{ cursor: 'pointer' }} value='1'>
              {tableData()}
            </TabPanel>
            <TabPanel sx={{ cursor: 'pointer' }} value='0'>
              {tableData()}
            </TabPanel>
            <TabPanel sx={{ cursor: 'pointer' }} value=''>
              {tableData()}
            </TabPanel>
          </TabContext>
        </Grid>
      ) : (
        <Error404></Error404>
      )}
    </>
  )
}

export default Diet
