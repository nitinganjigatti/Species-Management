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

// Styled TabList component

const roleColors = {
  active: 'success',
  inactive: 'error'
}

const RecipeList = () => {
  const router = useRouter()
  const { query } = router
  const [loader, setLoader] = useState(false)
  const theme = useTheme()
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
          meal_type: 'recipe'
        }

        await getRecipeList({ params: params }).then(res => {
          const startingIndex = paginationModel.page * paginationModel.pageSize

          let listWithId = res.data.result.map((el, i) => {
            return { ...el, uid: startingIndex + i + 1 }
          })
          setTotal(parseInt(res?.data?.total_count))
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
          <Button size='small' variant='contained' onClick={() => Router.push('/diet/recipe/add-recipe')}>
            <Icon icon='mdi:add' fontSize={20} />
            &nbsp; Add New
          </Button>
        </div>
      )}
    </>
  )

  const handleSearch = value => {
    setPaginationModel({ page: 0, pageSize: paginationModel.pageSize })
    updateQueryParams({ q: value, page: 0, pageSize: paginationModel.pageSize })
    setSearchValue(value)
    searchTableData(sortBy, value, sortColumn, searchColumns, status, paginationModel.pageSize)
  }

  const columns = [
    {
      //flex: 0.21,
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
      headerName: 'RECIPE',
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
      //flex: 0.3,
      width: 130,
      field: 'id',
      headerName: 'RECIPE ID',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', pl: 2 }}>
          {params.row.id ? 'REP' + params.row.id : '-'}
        </Typography>
      )
    },
    {
      //flex: 0.3,
      width: 200,
      field: 'portion_size',
      headerName: 'PORTION SIZE',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.portion_size ? `${params.row.portion_size} ${params.row.portion_uom_name || ''}`.trim() : '-'}
        </Typography>
      )
    },
    {
      //flex: 0.4,
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
            <Typography sx={{ pl: 2 }}>{params.row.ingredients_count ? params.row.ingredients_count : '-'}</Typography>
          </Tooltip>
        </Box>
      )
    },
    {
      //flex: 0.5,
      width: 260,
      field: 'user_name',
      headerName: 'CREATED BY',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            variant='square'
            alt='Recipe Image'
            sx={{
              width: 30,
              height: 30,
              mr: 4,
              borderRadius: '50%',
              background: theme.palette.customColors.tableHeaderBg,
              overflow: 'hidden'
            }}
          >
            {params.row.created_by_user?.profile_pic ? (
              <img
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                src={params.row.created_by_user?.profile_pic}
                alt='Profile'
              />
            ) : (
              <Icon icon='mdi:user' />
            )}
          </Avatar>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: 14, fontWeight: 500 }}>
              {params.row.created_by_user?.user_name ? params.row.created_by_user?.user_name : '-'}
            </Typography>
            <Typography noWrap variant='body2' sx={{ color: '#44544a9c', fontSize: 12 }}>
              {params.row.created_at ? 'Created on' + ' ' + moment(params.row.created_at).format('DD/MM/YYYY') : '-'}
            </Typography>
          </Box>
        </Box>
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
  ]

  const onCellClick = params => {
    const clickedColumn = params.field !== 'switch'

    if (clickedColumn) {
      const data = params.row

      router.push({ pathname: `/diet/recipe/${data?.id}` })
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
            <CardHeader title='Recipes' action={headerAction} sx={{ px: 5 }} />
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
                disableColumnMenu
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
