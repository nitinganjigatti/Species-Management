/* eslint-disable lines-around-comment */
import React, { useState, useEffect, useCallback, useContext } from 'react'

import { getIngredientList } from 'src/lib/api/diet/getIngredients'

import FallbackSpinner from 'src/@core/components/spinner/index'
import CardHeader from '@mui/material/CardHeader'
import { DataGrid } from '@mui/x-data-grid'
import { debounce } from 'lodash'
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
import Router from 'next/router'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import { updateIngredientStatus } from 'src/lib/api/diet/getIngredients'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import ConfirmationCheckBox from 'src/views/forms/form-elements/confirmationCheckBox'
import { useTheme } from '@mui/material/styles'
import AddIngredients from 'src/components/diet/AddIngredients'
import Error404 from 'src/pages/404'

import { AuthContext } from 'src/context/AuthContext'
import Toaster from 'src/components/Toaster'

const roleColors = {
  active: 'success',
  inactive: 'error'
}

const IngredientsList = () => {
  const theme = useTheme()
  const [loader, setLoader] = useState(false)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumning, setsortColumning] = useState('ingredient_name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
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

  const handleChange = (event, newValue) => {
    setTotal(0)
    setStatus(newValue)
  }

  const onClose = () => {
    setDialog(false)
  }

  const fetchTableData = useCallback(
    async (sort, q, sortColumn, status) => {
      try {
        setLoading(true)

        const params = {
          sort,
          q,
          sortColumn,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize,
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
  }, [fetchTableData, status])

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
    debounce(async (sort, q, sortColumn, status) => {
      setSearchValue(q)
      try {
        await fetchTableData(sort, q, sortColumn, status)
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
          <Button size='small' variant='contained' onClick={() => Router.push('/diet/ingredient/add-ingredient')}>
            <Icon icon='mdi:add' fontSize={20} />
            &nbsp; Add New
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

  const handleSwitchChange = async (event, rowData) => {
    console.log(event.target.checked, 'lll')
    console.log(rowData, 'rowData')
    const newIsActive = event.target.checked ? 1 : 0
    try {
      const response = await updateIngredientStatus(rowData?.id, { status: newIsActive })
      console.log(response, 'response')
      if (response.success === true) {
        fetchTableData(sort, searchValue, sortColumning, status)
        Toaster({
          type: 'success',
          message: `Ingredient ${'ING' + rowData.id} has been successfully ${
            newIsActive === 1 ? 'actiavted' : 'deactivated'
          }`
        })
      } else {
        Toaster({ type: 'error', message: 'something went wrong' })
      }
    } catch (error) {
      console.error('Error updating ingredient status:', error)
    }
  }

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, sortColumning, status)
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
      field: 'ingredient_name',
      headerName: 'INGREDIENTS',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* {renderClient(params)} */}
          <Avatar
            variant='square'
            alt='Medicine Image'
            sx={{ width: 40, height: 40, mr: 4, background: '#E8F4F2', padding: '8px', borderRadius: '4px' }}
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
                  maxWidth: '140px'
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
      flex: 0.5,
      minWidth: 30,
      field: 'ingredient_alias',
      headerName: 'Ingredient alias',
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
      flex: 0.3,
      minWidth: 10,
      field: 'id',
      headerName: 'INGREDIENT ID',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', pl: 2 }}>
          {params.row.id ? 'ING' + params.row.id : '-'}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 10,
      field: 'calorie',
      headerName: 'CALORIES',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.calorie ? params.row.calorie + ' Kcal' : '-'}
        </Typography>
      )
    },
    {
      flex: 0.4,
      minWidth: 20,
      field: 'protein',
      headerName: 'PREPARATION TYPES',
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

            // style={{ background: '#1F515B' }}
          >
            <span>{params.row.preparation_type_count ? params.row.preparation_type_count : '-'}</span>
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
          {/* {renderClient(params)} */}
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
            <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: 14 }}>
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
    //   disableColumnMenu: true, // Exclude from column menu
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
    console.log(params, 'params')
    const clickedColumn = params.field !== 'switch'

    if (clickedColumn) {
      const data = params.row

      Router.push({
        pathname: `/diet/ingredient/${data?.id}`
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
            <CardHeader title='Ingredients' action={headerAction} />
            <ConfirmationDialog
              // icon={'mdi:delete'}
              image={'https://app.antzsystems.com/uploads/6515471031963.jpg'}
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

          <AddIngredients
            open={openIngredient}
            handleSidebarClose={handleSidebarClose}
            setSelectedIngredient={setSelectedIngredient}
          />
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
