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
import { Avatar, Button, Box } from '@mui/material'

// ** MUI Imports
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import useSafeRouter from 'src/hooks/useSafeRouter';
import { useParams, useSearchParams } from 'next/navigation';
import { getDietList } from 'src/lib/api/diet/dietList'
import CustomChip from 'src/@core/components/mui/chip'

import { AuthContext } from 'src/context/AuthContext'
import { useTheme } from '@mui/material/styles'
import Error404 from 'src/pages/404'

import RenderUtility from 'src/utility/render'
import moment from 'moment'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import { useTranslation } from 'react-i18next'
import MUISearch from 'src/views/forms/form-fields/MUISearch'

// Styled TabList component
const roleColors = {
  active: 'success',
  inactive: 'error'
}

const Diet = () => {
  const router = useSafeRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const routerQuery = { ...params, ...(searchParams ? Object.fromEntries(searchParams.entries()) : {}) } as any;
  const theme = useTheme()
  const { t } = useTranslation()
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState<any[]>([])
  const [searchValue, setSearchValue] = useState(routerQuery.q || '')
  const [sortColumn, setSortColumn] = useState('created_at')

  const [paginationModel, setPaginationModel] = useState({
    page: parseInt(routerQuery.page || 0, 10),
    pageSize: parseInt(routerQuery.pageSize || 50, 10)
  })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(routerQuery.status || '')
  const [loader, setLoader] = useState(false)
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

  const handleChange = (event: any, newValue: any) => {
    setStatus(newValue)
    setTotal(0)
    setPaginationModel({ page: 0, pageSize: 50 })
    updateQueryParams({ page: 0, status: newValue, pageSize: 50 })
  }

  const fetchTableData = useCallback(
    async (sort: any, q: any, sortColumn: any, status: any, pageSize: any = paginationModel.pageSize) => {
      try {
        setLoading(true)

        const apiParams = {
          sortBy: sort,
          q,
          sortColumn,
          page: paginationModel.page + 1,
          limit: pageSize,
          status
        }

        await getDietList({ params: apiParams }).then((res: any) => {
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
    if (dietModule) {
      fetchTableData(sort, searchValue, sortColumn, status)
    }
  }, [status, paginationModel.page, paginationModel.pageSize])

  const getSlNo = (index: any) => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row: any, index: any) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const handleSortModel = (newModel: any) => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)

      fetchTableData(newModel[0].sort, searchValue, newModel[0].field, status)
    } else {
    }
  }

  const searchTableData = useCallback(
    debounce(async (sort: any, q: any, sortColumn: any, status: any, pageSize: any) => {
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
          <Button sx={{ m: 2 }} size='small' variant='contained' onClick={() => router.push('/diet/add-diet')}>
            <Icon icon='mdi:add' fontSize={20} />
            &nbsp; {t('add_new')}
          </Button>
        </div>
      )}
    </>
  )

  const handleSearch = (value: any) => {
    setPaginationModel({ page: 0, pageSize: paginationModel.pageSize })
    updateQueryParams({ q: value, page: 0, pageSize: paginationModel.pageSize })
    setSearchValue(value)
    searchTableData(sort, value, sortColumn, status, paginationModel.pageSize)
  }

  const columns = [
    {
      //flex: 0.19,
      width: 80,
      field: 'uid',
      headerName: 'SL',
      renderCell: (params: any) => (
        <Typography variant='body2' sx={{ color: 'text.primary', pl: 3 }}>
          {params.row.uid}
        </Typography>
      )
    },
    {
      //flex: 0.8,
      width: 350,
      field: 'diet_no',
      headerName: t('diet_module.diet_id'),
      renderCell: (params: any) => (
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
      width: 150,
      field: 'no_meals',
      headerName: t('diet_module.no_of_mixes'),
      renderCell: (params: any) => (
        <Typography variant='body2' sx={{ color: 'text.primary', pl: 3 }}>
          {params.row.combo ? params.row.combo : '-'}
        </Typography>
      )
    },
    {
      //flex: 0.3,
      width: 160,
      field: 'no_recipe',
      headerName: t('diet_module.no_of_recipes'),
      renderCell: (params: any) => (
        <Typography variant='body2' sx={{ color: 'text.primary', pl: 3 }}>
          {params.row.recipe ? params.row.recipe : '-'}
        </Typography>
      )
    },

    {
      //flex: 0.6,
      width: 260,
      field: 'dietitian_name',
      headerName: t('diet_module.nutritionist'),
      renderCell: (params: any) => (
        <>
          <Box>
            <UserAvatarDetails
              profile_image={params.row.dietitian_profile_pic}
              user_name={params.row.dietitian_name}
              role={params.row.dietitian_role_name}
              crby_width='200px'
            />
          </Box>
        </>
      )
    },

    {
      //flex: 0.6,
      width: 260,
      field: 'created_at',
      headerName: t('created_by'),
      renderCell: (params: any) => (
        <>
          <Box>
            {RenderUtility.renderUserAvatarDetails({
              profile_image: params.row.profile_pic,
              user_name: params.row.user_name,
              date: moment(params.row.created_at, 'DD/MM/YYYY').format('YYYY-MM-DD'),
              text_color: undefined,
              description: undefined,
              crby_width: 200
            })}
          </Box>
        </>
      )
    },

    {
      //flex: 0.3,
      width: 120,
      field: 'status',
      headerName: t('status'),
      renderCell: (params: any) => (
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

  const onCellClick = (params: any) => {
    const clickedColumn = params.field !== 'switch'

    if (clickedColumn) {
      const data = params.row

      router.push({ pathname: `/diet/diet/${data?.id}` })
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
          <>
            <Card>
              <CardHeader title={t('navigation.diet')} action={headerAction} sx={{ px: 5 }} />
              <Box sx={{ px: 5, pb: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Box sx={{ width: 250 }}>
                  <MUISearch
                    value={searchValue}
                    onChange={(e: any) => handleSearch(e.target.value)}
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
                  setPaginationModel={(newPaginationModel: any) => {
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
          </>
        )}
      </>
    )
  }

  return (
    <>
      {dietModule ? (
        <Grid>
          {(() => {
            const TC = TabContext as any;
            return (
              <TC value={status}>
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
              </TC>
            );
          })()}
        </Grid>
      ) : (
        <Error404></Error404>
      )}
    </>
  )
}

export default Diet
