'use client';
import React, { useState, useEffect, useCallback, useContext } from 'react'

import FallbackSpinner from 'src/@core/components/spinner/index'
import CardHeader from '@mui/material/CardHeader'
import { debounce } from 'lodash'
import CommonTable from 'src/views/table/data-grid/CommonTable'
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
import useSafeRouter from 'src/hooks/useSafeRouter';
import { useParams, useSearchParams } from 'next/navigation';
import { useTheme } from '@mui/material/styles'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import { updateRecipeStatus } from 'src/lib/api/diet/recipe'
import { AuthContext } from 'src/context/AuthContext'
import RenderUtility from 'src/utility/render'
import { useTranslation } from 'react-i18next'
import MUISearch from 'src/views/forms/form-fields/MUISearch'

// Styled TabList component

const roleColors = {
  active: 'success',
  inactive: 'error'
}

const RecipeList = () => {
  const router = useSafeRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const routerQuery = { ...params, ...(searchParams ? Object.fromEntries(searchParams.entries()) : {}) } as any;
  const theme = useTheme()
  const { t } = useTranslation()
  // const { query } = router
  const [loader, setLoader] = useState(false)

  const [total, setTotal] = useState(0)
  const [sortBy, setSortBy] = useState('desc')
  const [sortColumn, setSortColumn] = useState('created_at')
  const [rows, setRows] = useState<any[]>([])
  const [searchValue, setSearchValue] = useState(routerQuery.q || '')
  const [searchColumns, setSearchColumns] = useState('')

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(routerQuery.page || 0, 10),
    pageSize: parseInt(routerQuery.pageSize || 50, 10)
  })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(routerQuery.status || '')

  const authData = useContext(AuthContext) as any
  const dietModule = authData?.userData?.roles?.settings?.diet_module
  const dietModuleAccess = authData?.userData?.roles?.settings?.diet_module_access

  function loadServerRows(currentPage: any, data: any) {
    return data
  }

  // Common function to update URL query parameters
  const updateQueryParams = useCallback(
    (newParams: any) => {
      router.replace(
        {
          pathname: router.pathname,
          query: {
            ...routerQuery,
            ...newParams
          }
        }
      )
    },
    [router]
  )

  useEffect(() => {
    const page = parseInt(routerQuery.page || 0, 10)
    const pageSize = parseInt(routerQuery.pageSize || 50, 10)
    const status = routerQuery.status || ''

    setPaginationModel({ page: page, pageSize: pageSize })
    setStatus(status)
  }, [routerQuery.page, routerQuery.pageSize, routerQuery.status])

  const handleChange = (event: any, newValue: any) => {
    setStatus(newValue)
    setTotal(0)
    setPaginationModel({ page: 0, pageSize: 50 })
    updateQueryParams({ page: 0, status: newValue, pageSize: 50 })
  }

  const fetchTableData = useCallback(
    async (sortBy: any, q: any, sortColumn: any, searchColumns: any, status: any, pageSize = paginationModel.pageSize) => {
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

          let listWithId = res.data.result.map((el: any, i: any) => {
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
  }, [status, paginationModel.page, paginationModel.pageSize])

  const getSlNo = (index: any) => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row: any, index: any) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const handleSortModel = (newModel: any) => {
    if (newModel.length) {
      setSortBy(newModel[0].sort)
      setSortColumn(newModel[0].field)

      //setSearchColumns(newModel[0].field)
      fetchTableData(newModel[0].sort, searchValue, newModel[0].field, searchColumns, status)
    } else {
    }
  }

  const searchTableData = useCallback(
    debounce(async (sortBy: any, q: any, sortColumn: any, searchColumns: any, status: any, pageSize: any) => {
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
          <Button size='small' variant='contained' onClick={() => router.push('/diet/combo/add-combo')}>
            <Icon icon='mdi:add' fontSize={20} />
            &nbsp; Add New
          </Button>
        </div>
      )}
    </>
  )

  const handleSwitchChange = async (event: any, rowData: any) => {
    const newIsActive = event.target.checked ? 1 : 0
    try {
      const response = await updateRecipeStatus(rowData?.id, { active: newIsActive })

      if (response.success === true) {
        fetchTableData(sortBy, searchValue, sortColumn, searchColumns, status)

        return toast(
          (t: any) => (
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

  const handleSearch = (value: any) => {
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
      sortable: false,
      renderCell: (params: any) => (
        <Typography variant='body2' sx={{ color: 'text.primary', pl: 3 }}>
          {params.row.uid}
        </Typography>
      )
    },
    {
      //flex: 1,
      width: 300,
      field: 'recipe_name',
      headerName: t('navigation.mix'),
      renderCell: (params: any) => (
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
      headerName: t('diet_module.mix_id'),
      renderCell: (params: any) => (
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
      field: 'items',
      headerName: t('diet_module.no_of_items'),
      renderCell: (params: any) => (
        <Box sx={{ color: 'text.primary', pl: 3 }}>
          <Tooltip
            title={
              params.row.ingredients && params.row.ingredients.length > 0
                ? params.row.ingredients.map((preparation: any) => (
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
      headerName: t('created_by'),
      renderCell: (params: any) => (
        <Box>
          {RenderUtility.renderUserAvatarDetails({
            profile_image: params?.row?.created_by_user?.profile_pic,
            user_name: params?.row?.created_by_user?.user_name,
            date: moment(params?.row?.created_at).format('YYYY-MM-DD'),
            text_color: undefined,
            description: undefined,
            crby_width: 200
          })}
        </Box>
      )
    },
    {
      flex: 1,
      minWidth: 100,
      field: 'status',
      headerName: t('status'),
      renderCell: (params: any) => (
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

  const onCellClick = (params: any) => {
    const clickedColumn = params.field !== 'switch'

    if (clickedColumn) {
      const data = params.row

      router.push({ pathname: `/diet/combo/${data?.id}` })
    } else {
      return
    }
  }

  const TabBadge = ({ label, totalCount }: { label: any; totalCount: any }) => (
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
          <FallbackSpinner sx={{}} />
        ) : (
          <Card>
            <CardHeader title='Mix' action={headerAction} sx={{ px: 5 }} />
            <Box sx={{ px: 5, pb: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Box sx={{ width: 250 }}>
                <MUISearch
                  value={searchValue}
                  onChange={e => handleSearch(e.target.value)}
                  onClear={() => handleSearch('')}
                  placeholder='Search...'
                />
              </Box>
            </Box>

            <Box sx={{ width: '100%', overflowX: 'auto' }}>
              <CommonTable
                indexedRows={indexedRows === undefined ? [] : indexedRows}
                total={total}
                columns={columns}
                paginationModel={paginationModel}
                handleSortModel={handleSortModel}
                setPaginationModel={newPaginationModel => {
                  updateQueryParams({
                    page: newPaginationModel.page,
                    pageSize: newPaginationModel.pageSize
                  })
                  setPaginationModel(newPaginationModel)
                }}
                loading={loading}
                onCellClick={onCellClick}
                externalTableStyle={{
                  height: 700,
                  '.MuiDataGrid-virtualScroller': {
                    overflowX: 'auto'
                  },
                  '.MuiDataGrid-main': {
                    marginLeft: '20px',
                    marginRight: '20px'
                  }
                }}
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
