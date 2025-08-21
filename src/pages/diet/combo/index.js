import React, { useState, useEffect, useCallback, useContext } from 'react'

import FallbackSpinner from 'src/@core/components/spinner/index'
import CardHeader from '@mui/material/CardHeader'
import { DataGrid } from '@mui/x-data-grid'
import { debounce } from 'lodash'
import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import moment from 'moment'
import { Avatar, Button, Tooltip, Box, Switch, Divider } from '@mui/material'
import toast from 'react-hot-toast'
import { getRecipeList } from 'src/lib/api/diet/recipe'

// ** MUI Imports
import IconButton from '@mui/material/IconButton'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import CustomChip from 'src/@core/components/mui/chip'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import Router, { useRouter } from 'next/router'
import { useTheme } from '@mui/material/styles'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import { updateRecipeStatus } from 'src/lib/api/diet/recipe'
import { AuthContext } from 'src/context/AuthContext'
import RenderUtility from 'src/utility/render'

// Styled TabList component

const roleColors = {
  active: 'success',
  inactive: 'error'
}

const RecipeList = () => {
  const router = useRouter()
  const theme = useTheme()
  const { query } = router
  const [loader, setLoader] = useState(false)

  const [total, setTotal] = useState(0)
  const [sortBy, setSortBy] = useState('desc')
  const [sortColumn, setSortColumn] = useState('created_at')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState(query.q || '')
  const [searchColumns, setSearchColumns] = useState('')

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(query.page || 0, 10),
    pageSize: parseInt(query.pageSize || 50, 10)
  })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(query.status || '')

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
    async (sortBy, q, sortColumn, searchColumns, status, pageSize = paginationModel.pageSize) => {
      try {
        setLoading(true)

        const params = {
          sortBy,
          q,
          sortColumn,
          searchColumns,
          page: paginationModel.page + 1,
          limit: pageSize,
          status,
          meal_type: 'combo'
        }

        await getRecipeList({ params: params }).then(res => {
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
    fetchTableData(sortBy, searchValue, sortColumn, searchColumns, status)
  }, [status, paginationModel.page, paginationModel.pageSize, sortBy, sortColumn])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const handleSortModel = newModel => {
    if (newModel.length) {
      setSortBy(newModel[0].sort)
      setSortColumn(newModel[0].field)

      //setSearchColumns(newModel[0].field)
      fetchTableData(newModel[0].sort, searchValue, newModel[0].field, searchColumns, status)
    } else {
    }
  }

  const searchTableData = useCallback(
    debounce(async (sortBy, q, sortColumn, searchColumns, status, pageSize) => {
      setSearchValue(q)
      try {
        await fetchTableData(sortBy, q, sortColumn, searchColumns, status, pageSize)
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
          <Button size='small' variant='contained' onClick={() => Router.push('/diet/combo/add-combo')}>
            <Icon icon='mdi:add' fontSize={20} />
            &nbsp; Add New
          </Button>
        </div>
      )}
    </>
  )

  const handleSwitchChange = async (event, rowData) => {
    const newIsActive = event.target.checked ? 1 : 0
    try {
      const response = await updateRecipeStatus(rowData?.id, { active: newIsActive })

      if (response.success === true) {
        fetchTableData(sortBy, searchValue, sortColumn, searchColumns, status)

        return toast(
          t => (
            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Icon
                  icon='ooui:success'
                  style={{ marginRight: '20px', fontSize: 50, color: theme.palette.primary.main }}
                />
                <div>
                  <Typography sx={{ fontWeight: 500 }} variant='h5'>
                    Success!
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
                    Recipe {'REP' + rowData.id} has been successfully {newIsActive === 1 ? 'activated' : 'deactivated'}
                  </Typography>
                </div>
              </Box>
              <IconButton
                onClick={() => toast.dismiss(t.id)}
                style={{ position: 'absolute', top: 5, right: 5, float: 'right' }}
              >
                <Icon icon='mdi:close' fontSize={24} />
              </IconButton>
            </Box>
          ),
          {
            style: {
              minWidth: '450px',
              minHeight: '130px'
            }
          }
        )
      } else {
        alert('something went wrong')
      }
    } catch (error) {
      console.error('Error updating ingredient status:', error)
    }
  }

  const handleSearch = value => {
    setPaginationModel({ page: 0, pageSize: paginationModel.pageSize })
    updateQueryParams({ q: value, page: 0, pageSize: paginationModel.pageSize })
    setSearchValue(value)
    searchTableData(sortBy, value, sortColumn, searchColumns, status, paginationModel.pageSize)
  }

  const columns = [
    {
      //flex: 0.01,
      width: 70,
      field: 'uid',
      headerName: 'SL ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', pl: 3 }}>
          {params.row.uid}
        </Typography>
      )
    },
    {
      //flex: 1,
      width: 300,
      field: 'recipe_name',
      headerName: 'MIX',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            variant='square'
            alt='Recipe Image'
            sx={{
              width: 40,
              height: 40,
              mr: 4,
              background: theme.palette.customColors.tableHeaderBg,
              padding: '8px',
              borderRadius: '4px'
            }}
            src={params.row.recipe_image ? params.row.recipe_image : '/icons/icon_recipe_fill.png'}
          >
            {params.row.recipe_image ? null : <Icon icon='healthicons:fruits-outline' />}
          </Avatar>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Tooltip title={params.row.recipe_name} placement='right'>
              <Typography
                noWrap
                variant='body2'
                sx={{
                  color: 'text.primary',
                  fontSize: '14px',
                  fontWeight: '500',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '200px'
                }}
              >
                {params.row.recipe_name ? params.row.recipe_name : '-'}
              </Typography>
            </Tooltip>
          </Box>
        </Box>
      )
    },
    {
      //flex: 0.4,
      width: 130,
      field: 'id',
      headerName: 'MIX ID',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', pl: 2 }}>
          {params.row.id ? 'CMB' + params.row.id : '-'}
        </Typography>
      )
    },

    // {
    //   flex: 0.3,
    //   minWidth: 10,
    //   field: 'total_kcal',
    //   headerName: 'KCAL',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {params.row.total_kcal ? params.row.total_kcal + ' Kcal' : '-'}
    //     </Typography>
    //   )
    // },
    {
      //flex: 0.3,
      width: 200,
      field: 'ingredient_name',
      headerName: 'NO OF ITEMS',
      renderCell: params => (
        <Box variant='body2' sx={{ color: 'text.primary', pl: 3 }}>
          <Tooltip
            title={
              params.row.ingredients && params.row.ingredients.length > 0
                ? params.row.ingredients.map(preparation => (
                    <div style={{ padding: '4px' }} key={preparation.ingredient_name}>
                      {preparation.ingredient_name}
                    </div>
                  ))
                : '-'
            }
            arrow
            placement='right'
          >
            <Typography>{params.row.ingredients_count ? params.row.ingredients_count : '-'}</Typography>
          </Tooltip>
        </Box>
      )
    },
    {
      //flex: 0.7,
      width: 260,
      field: 'user_name',
      headerName: 'CREATED BY',
      renderCell: params => (
        <Box>
          {RenderUtility.renderUserAvatarDetails({
            profile_image: params?.row?.created_by_user?.profile_pic,
            user_name: params?.row?.created_by_user?.user_name,
            date: moment(params?.row?.created_at).format('YYYY-MM-DD')
          })}
        </Box>
      )
    },
    {
      //flex: 0.4,
      width: 100,
      field: 'status',
      headerName: 'STATUS',
      renderCell: params => (
        <CustomChip
          skin='light'
          size='small'
          label={params.row?.active === '1' ? 'Active' : 'InActive'}
          color={params.row?.active === '1' ? roleColors.active : roleColors.inactive}
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

    // {
    //   flex: 0.3,
    //   minWidth: 20,
    //   field: 'switch',
    //   headerName: '',
    //   disableColumnMenu: true,
    //   renderCell: params => (
    //     <Box sx={{ my: 4, height: '40px', display: 'flex', justifyContent: 'space-between' }}>
    //       <Switch
    //         checked={params.row.active === '0' ? false : true}
    //         onChange={event => handleSwitchChange(event, params.row)}
    //         fontSize={2}
    //       />
    //     </Box>
    //   )
    // }
  ]

  const onCellClick = params => {
    const clickedColumn = params.field !== 'switch'

    if (clickedColumn) {
      const data = params.row

      router.push({ pathname: `/diet/combo/${data?.id}` })
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
          <Card>
            <CardHeader title='Mix' action={headerAction} sx={{ px: 5 }} />

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
                    borderLeft: '1px solid #0000000D',
                    borderRight: '1px solid #0000000D',
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
                    clearSearch: () => handleSearch(''),
                    onChange: event => handleSearch(event.target.value)
                  }
                }}
                onCellClick={onCellClick}
              />
            </Box>
          </Card>
        )}
      </>
    )
  }

  return (
    <>
      <Grid>
        <TabContext value={status}>
          <TabList onChange={handleChange}>
            <Tab value='' label={<TabBadge label='All' totalCount={status === '' ? total : null} />} />
            <Tab value='1' label={<TabBadge label='Active' totalCount={status === '1' ? total : null} />} />
            <Tab value='0' label={<TabBadge label='Inactive' totalCount={status === '0' ? total : null} />} />
          </TabList>
          <TabPanel value=''>{tableData()}</TabPanel>
          <TabPanel value='1'>{tableData()}</TabPanel>
          <TabPanel value='0'>{tableData()}</TabPanel>
        </TabContext>
      </Grid>
    </>
  )
}

export default RecipeList
