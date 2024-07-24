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
import Router from 'next/router'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import { updateRecipeStatus } from 'src/lib/api/diet/recipe'
import { AuthContext } from 'src/context/AuthContext'

// Styled TabList component

const roleColors = {
  active: 'success',
  inactive: 'error'
}

const RecipeList = () => {
  const [loader, setLoader] = useState(false)

  const [total, setTotal] = useState(0)
  const [sortBy, setSortBy] = useState('desc')
  const [sortColumn, setSortColumn] = useState('created_at')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [searchColumns, setSearchColumns] = useState('recipe_name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')

  const authData = useContext(AuthContext)
  const dietModule = authData?.userData?.roles?.settings?.diet_module
  const dietModuleAccess = authData?.userData?.roles?.settings?.diet_module_access

  function loadServerRows(currentPage, data) {
    return data
  }

  const handleChange = (event, newValue) => {
    setTotal(0)
    setStatus(newValue)
  }

  const fetchTableData = useCallback(
    async (sortBy, q, sortColumn, searchColumns, status) => {
      try {
        setLoading(true)

        const params = {
          sortBy,
          q,
          sortColumn,
          searchColumns,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          status
        }

        await getRecipeList({ params: params }).then(res => {
          console.log('response', res)

          // Generate uid field based on the index
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
  }, [fetchTableData, status])

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
    debounce(async (sortBy, q, sortColumn, searchColumns, status) => {
      setSearchValue(q)
      try {
        await fetchTableData(sortBy, q, sortColumn, searchColumns, status)
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

  const handleSwitchChange = async (event, rowData) => {
    const newIsActive = event.target.checked ? 1 : 0
    try {
      const response = await updateRecipeStatus(rowData?.id, { active: newIsActive })
      console.log(response, 'response')
      if (response.success === true) {
        fetchTableData(sortBy, searchValue, sortColumn, searchColumns, status)

        return toast(
          t => (
            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Icon icon='ooui:success' style={{ marginRight: '20px', fontSize: 50, color: '#37BD69' }} />
                <div>
                  <Typography sx={{ fontWeight: 500 }} variant='h5'>
                    Success!
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant='body2' sx={{ color: '#44544A' }}>
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
    setSearchValue(value)
    searchTableData(sortBy, value, sortColumn, searchColumns, status)
  }

  const columns = [
    {
      flex: 0.05,
      Width: 40,
      field: 'uid',
      headerName: 'SL ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', pl: 3 }}>
          {params.row.uid}
        </Typography>
      )
    },
    {
      flex: 0.5,
      minWidth: 30,
      field: 'recipe_name',
      headerName: 'RECIPE',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            variant='square'
            alt='Recipe Image'
            sx={{ width: 40, height: 40, mr: 4, background: '#E8F4F2', padding: '8px', borderRadius: '4px' }}
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
                  maxWidth: '140px'
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
      flex: 0.3,
      minWidth: 10,
      field: 'id',
      headerName: 'RECIPE ID',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.id ? 'REP' + params.row.id : '-'}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 10,
      field: 'total_kcal',
      headerName: 'KCAL',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.total_kcal ? params.row.total_kcal + ' Kcal' : '-'}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 20,
      field: 'ingredient_name',
      headerName: 'NO OF INGREDIENTS',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', pl: 2 }}>
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

            // style={{ background: '#1F515B' }}
          >
            <span>{params.row.ingredients_count ? params.row.ingredients_count : '-'}</span>
          </Tooltip>
        </Typography>
      )
    },
    {
      flex: 0.6,
      minWidth: 60,
      field: 'user_name',
      headerName: 'CREATED BY',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            variant='square'
            alt='Medicine Image'
            sx={{
              width: 30,
              height: 30,
              mr: 4,
              borderRadius: '50%',
              background: '#E8F4F2',
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
      flex: 0.3,
      minWidth: 10,
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

  console.log('total Count ?>>>', total)

  const onCellClick = params => {
    console.log(params, 'params')
    const clickedColumn = params.field !== 'switch'

    if (clickedColumn) {
      const data = params.row

      Router.push({
        pathname: `/diet/recipe/${data?.id}`
      })
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
            <CardHeader title='Recipes' action={headerAction} />

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
              hideFooterSelectedRowCount
              disableColumnSelector={true}
              autoHeight
              pagination
              rows={indexedRows === undefined ? [] : indexedRows}
              rowCount={total}
              columns={columns}
              sortingMode='server'
              paginationMode='server'
              pageSizeOptions={[7, 10, 25, 50]}
              paginationModel={paginationModel}
              onSortModelChange={handleSortModel}
              slots={{ toolbar: ServerSideToolbarWithFilter }}
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
              onCellClick={onCellClick}
            />
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
