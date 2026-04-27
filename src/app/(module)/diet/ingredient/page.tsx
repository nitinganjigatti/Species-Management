'use client';
/* eslint-disable lines-around-comment */
import React, { useState, useEffect, useCallback, useContext } from 'react'

import { getIngredientList } from 'src/lib/api/diet/getIngredients'

import FallbackSpinner from 'src/@core/components/spinner/index'
import CardHeader from '@mui/material/CardHeader'
import { debounce } from 'lodash'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import { styled } from '@mui/material/styles'
import MuiTabList from '@mui/lab/TabList'
import TabList from '@mui/lab/TabList'
import moment from 'moment'
import { Avatar, Button, Tooltip, Box, Switch, Divider } from '@mui/material'
import CustomChip from 'src/@core/components/mui/chip'

// ** MUI Imports
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import useSafeRouter from 'src/hooks/useSafeRouter';
import { useParams, useSearchParams } from 'next/navigation';
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import { updateIngredientStatus } from 'src/lib/api/diet/getIngredients'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import ConfirmationCheckBox from 'src/views/forms/form-elements/confirmationCheckBox'
import { useTheme } from '@mui/material/styles'
import AddIngredients from 'src/components/diet/AddIngredients'
import Error404 from 'src/pages/404'
import { useTranslation } from 'react-i18next'
import { AuthContext } from 'src/context/AuthContext'
import Toaster from 'src/components/Toaster'
import RenderUtility from 'src/utility/render'
import MUISearch from 'src/views/forms/form-fields/MUISearch'

const roleColors = {
  active: 'success',
  inactive: 'error'
}

const IngredientsList = () => {
  const theme = useTheme()
  const router = useSafeRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const routerQuery = { ...params, ...(searchParams ? Object.fromEntries(searchParams.entries()) : {}) };
  const { t } = useTranslation()
  const { query } = router
  const [loader, setLoader] = useState(false)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState(query.q || '')
  const [sortColumning, setsortColumning] = useState('ingredient_name')

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(query.page || 0, 10),
    pageSize: parseInt(query.pageSize || 50, 10)
  })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(query.status || '')
  const [statusCheckval, setstatusCheckval] = useState(false)
  const [dialog, setDialog] = useState(false)
  const [check, setCheck] = useState(false)
  const [selectedIngredient, setSelectedIngredient] = useState()
  console.log('selectedIngredient', selectedIngredient)

  const authData = useContext(AuthContext)
  const dietModule = authData?.userData?.roles?.settings?.diet_module
  const dietModuleAccess = authData?.userData?.roles?.settings?.diet_module_access

  const [openIngredient, setOpenIngredient] = useState(false)
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
            ...routerQuery,
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

  const onClose = () => {
    setDialog(false)
  }

  const fetchTableData = useCallback(
    async (sortBy, q, sortColumn, status, pageSize = paginationModel.pageSize) => {
      try {
        setLoading(true)

        const params = {
          sortBy,
          q,
          sortColumn,
          page: paginationModel.page + 1,
          limit: pageSize,
          status
        }

        await getIngredientList({ params: params }).then(res => {
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
    if (dietModule) {
      fetchTableData(sort, searchValue, sortColumning, status)
    }
  }, [status, paginationModel.page, paginationModel.pageSize])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const handleSortModel = newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setsortColumning(newModel[0].field)
      fetchTableData(newModel[0].sort, searchValue, newModel[0].field, status)
    } else {
    }
  }

  const searchTableData = useCallback(
    debounce(async (sortBy, q, sortColumn, status, pageSize) => {
      setSearchValue(q)
      try {
        await fetchTableData(sortBy, q, sortColumn, status, pageSize)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleAddIngerdient = () => {
    setOpenIngredient(true)
  }

  const handleSidebarClose = () => {
    setOpenIngredient(false)
  }

  const headerAction = (
    <>
      {dietModule && (dietModuleAccess === 'ADD' || dietModuleAccess === 'EDIT' || dietModuleAccess === 'DELETE') && (
        <div>
          <Button size='small' variant='contained' onClick={() => router.push('/diet/ingredient/add-ingredient')}>
            <Icon icon='mdi:add' fontSize={20} />
            &nbsp; {t('add_new')}
          </Button>
          {/* <Button sx={{ ml: 4 }} size='small' variant='contained' onClick={handleAddIngerdient}>
        <Icon icon='mdi:add' fontSize={20} />
        &nbsp; Pop
      </Button> */}

          {/* <Button size='small' variant='contained' sx={{ m: 2 }} onClick={handleAddIngerdient}>
        &nbsp; Test Button
      </Button> */}
        </div>
      )}
    </>
  )

  const handleSearch = value => {
    setPaginationModel({ page: 0, pageSize: paginationModel.pageSize })
    setSearchValue(value)
    updateQueryParams({ q: value, page: 0, pageSize: paginationModel.pageSize })
    searchTableData(sort, value, sortColumning, status, paginationModel.pageSize)
  }

  const columns = [
    {
      //flex: 0.1,
      width: 80,
      field: 'uid',
      headerName: 'SL',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', pl: 3 }}>
          {params.row.uid}
        </Typography>
      )
    },
    {
      //flex: 1.1,
      width: 250,
      field: 'ingredient_name',
      headerName: t('diet_module.items'),
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            variant='square'
            alt='Ingredient Image'
            sx={{
              width: 40,
              height: 40,
              mr: 3,
              background: theme.palette.customColors.tableHeaderBg,
              padding: '8px',
              borderRadius: '4px'
            }}
            src={params.row.image ? params.row.image : '/icons/icon_ingredient_fill.png'}
          >
            {params.row.image ? null : <Icon icon='healthicons:fruits-outline' />}
          </Avatar>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Tooltip title={params.row.ingredient_name} placement='right'>
              <Typography
                noWrap
                variant='body2'
                sx={{
                  color: 'text.primary',
                  fontSize: '14px',
                  fontWeight: '500',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '180px'
                }}
              >
                {params.row.ingredient_name ? params.row.ingredient_name : '-'}
              </Typography>
            </Tooltip>
          </Box>
        </Box>
      )
    },
    {
      //flex: 0.54,
      width: 200,
      field: 'feed_type_label',
      headerName: t('diet_module.feed_type'),
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.feed_type_label}
        </Typography>
      )
    },
    {
      //flex: 0.85,
      width: 200,
      field: 'ingredient_alias',
      headerName: t('diet_module.item_alias'),
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography
              noWrap
              variant='body2'
              sx={{ color: 'text.primary', fontSize: '14px', fontWeight: '500', pl: 3 }}
            >
              {params.row.ingredient_alias ? params.row.ingredient_alias : '-'}
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      //flex: 0.6,
      width: 140,
      field: 'id',
      headerName: t('diet_module.item_id'),
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', pl: 2 }}>
          {params.row.id ? 'ING' + params.row.id : '-'}
        </Typography>
      )
    },
    {
      //flex: 0.54,
      width: 150,
      field: 'calorie',
      headerName: t('diet_module.calories'),
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.calorie ? params.row.calorie + ' Kcal' : '-'}
        </Typography>
      )
    },
    {
      //flex: 0.4,
      width: 170,
      field: 'preparation_type_count',
      headerName: t('diet_module.preparation_types'),
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', pl: 3 }}>
          <Tooltip
            title={
              params.row.preparation_types && params.row.preparation_types.length > 0
                ? params.row.preparation_types.map(preparation => (
                    <div style={{ padding: '4px' }} key={preparation.label}>
                      {preparation.label}
                    </div>
                  ))
                : '-'
            }
            arrow
            placement='right'
          >
            <span>{params.row.preparation_type_count ? params.row.preparation_type_count : '-'}</span>
          </Tooltip>
        </Typography>
      )
    },
    {
      //flex: 1,
      width: 260,
      field: 'user_name',
      headerName: t('created_by'),
      renderCell: params => (
        <Box>
          {RenderUtility.renderUserAvatarDetails({
            profile_image: params?.row?.created_by_user?.profile_pic,
            user_name: params?.row?.created_by_user?.user_name,
            date: moment(params?.row?.created_at).format('YYYY-MM-DD')
            //crby_width: 200
          })}
        </Box>
      )
    },
    {
      //flex: 0.5,
      minWidth: 120,
      field: 'status',
      headerName: t('status'),
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
    console.log(params, 'params')
    const clickedColumn = params.field !== 'switch'

    if (clickedColumn) {
      const data = params.row

      router.push({ pathname: `/diet/ingredient/${data?.id}` })
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
            <CardHeader title='Items' action={headerAction} sx={{ px: 5 }} />
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

            <ConfirmationDialog
              icon={'mdi:delete'}
              iconColor={'#ff3838'}
              title={'Are you sure you want to delete this ingredient?'}
              // description={`Since ingredient IND000123 isn't included in any recipe or diet, you can delete it.`}
              formComponent={
                <ConfirmationCheckBox
                  title={'This ingredient is part of 15 recipes and 10 diets.'}
                  label={'Deactivate this ingredient in all records'}
                  description={
                    'Deactivating this ingredient prevents its addition to new recipes or diets, but you can swap it with another ingredient.'
                  }
                  color={theme.palette.formContent?.tertiary}
                  value={check}
                  setValue={setCheck}
                />
              }
              dialogBoxStatus={dialog}
              onClose={onClose}
              ConfirmationText={'Delete'}
              confirmAction={onClose}
            />

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
                columnVisibilityModel={{
                  sl_no: false
                }}
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
      {dietModule ? (
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
          {openIngredient && (
            <AddIngredients
              open={openIngredient}
              handleSidebarClose={handleSidebarClose}
              setSelectedIngredient={setSelectedIngredient}
            />
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

export default IngredientsList
