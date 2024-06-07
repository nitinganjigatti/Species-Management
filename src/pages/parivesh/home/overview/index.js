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
import { Avatar, Button, Tooltip, Box, Switch, Divider, CardContent } from '@mui/material'
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
import CustomAccordion from 'src/components/parivesh/CustomAccordion'

const Overview = () => {
  const theme = useTheme()
  const [loader, setLoader] = useState(false)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([
    {
      uid: '01',
      id: '1',
      registration_id: 'WL/GJ/132549',
      of_species: '555',
      of_animals: '2501',
      created_at: '2024-06-03 16:07:17',
      approved_date: '2024-06-06 16:07:17',
      created_by_user: {
        user_name: 'sr',
        email: 'sr@mailinator.com',
        profile_pic: 'https://api.dev.antzsystems.com/uploads/11/diet/ingredients/665d9cdd975011717411037.jpg'
      }
    }
  ])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumning, setsortColumning] = useState('registration_id')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)

  const [statusCheckval, setstatusCheckval] = useState(false)
  const [dialog, setDialog] = useState(false)
  const [check, setCheck] = useState(false)
  const [selectedIngredient, setSelectedIngredient] = useState()

  const authData = useContext(AuthContext)
  const dietModule = authData?.userData?.roles?.settings?.diet_module
  const dietModuleAccess = authData?.userData?.roles?.settings?.diet_module_access
  const [openIngredient, setOpenIngredient] = useState(false)
  function loadServerRows(currentPage, data) {
    return data
  }

  const data = [
    { value: 200, label: 'TOTAL ANIMALS', color: '#FFFFFF', borderColor: '#FFFFFF' },
    { value: 103, label: 'MALE', color: '#00AFD6', borderColor: '#00AFD6' },
    { value: 74, label: 'FEMALE', color: '#FFD3D3', borderColor: '#FFD3D3' },
    { value: 23, label: 'OTHERS', color: '#FFFFFF', borderColor: '#FFFFFF' },
    { value: 156, label: 'TOTAL SPECIES', color: '#E4B819', borderColor: '#E4B819' }
  ]

  const cards = [
    {
      value: 60,
      content: 'Parent Stock',
      bgColor: '#37BD69',
      items: [
        { value: 6, bgColor: '#00AFD6' },
        { value: 5, bgColor: '#FFD3D3' },
        { value: 10, bgColor: '#FFFFFF' }
      ]
    },
    {
      value: 25,
      content: 'Acquisition',
      bgColor: '#37BD69',
      items: [
        { value: 11, bgColor: '#00AFD6' },
        { value: 7, bgColor: '#FFD3D3' },
        { value: 6, bgColor: '#FFFFFF' }
      ]
    },
    {
      value: 5,
      content: 'Births',
      bgColor: '#37BD69',
      items: [
        { value: 21, bgColor: '#00AFD6' },
        { value: 2, bgColor: '#FFD3D3' },
        { value: 7, bgColor: '#FFFFFF' }
      ]
    },
    {
      value: 5,
      content: 'Deaths',
      bgColor: '#E93353',
      items: [
        { value: 2, bgColor: '#00AFD6' },
        { value: 6, bgColor: '#FFD3D3' },
        { value: 6, bgColor: '#FFFFFF' }
      ]
    },
    {
      value: 5,
      content: 'Transfers',
      bgColor: '#FA6140',
      items: [
        { value: 6, bgColor: '#00AFD6' },
        { value: 11, bgColor: '#FFD3D3' },
        { value: 3, bgColor: '#FFFFFF' }
      ]
    }
  ]

  const handleChange = (event, newValue) => {
    setTotal(0)
    setValue(newValue)
  }

  const onClose = () => {
    setDialog(false)
  }

  //   const fetchTableData = useCallback(
  //     async (sort, q, sortColumn, status) => {
  //       try {
  //         setLoading(true)

  //         const params = {
  //           sort,
  //           q,
  //           sortColumn,
  //           page: paginationModel.page + 1,
  //           limit: paginationModel.pageSize,
  //           status
  //         }

  //         await getIngredientList({ params: params }).then(res => {
  //           console.log('response', res)

  //           // Generate uid field based on the index
  //           let listWithId = res.data.result.map((el, i) => {
  //             return { ...el, uid: i + 1 }
  //           })
  //           setTotal(parseInt(res?.data?.total_count))
  //           setRows(loadServerRows(paginationModel.page, listWithId))
  //         })
  //         setLoading(false)
  //       } catch (e) {
  //         console.log(e)
  //         setLoading(false)
  //       }
  //     },
  //     [paginationModel]
  //   )

  //   useEffect(() => {
  //     if (dietModule) {
  //       fetchTableData(sort, searchValue, sortColumning, status)
  //     }
  //   }, [fetchTableData, status])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  //   const handleSortModel = newModel => {
  //     if (newModel.length) {
  //       setSort(newModel[0].sort)
  //       setsortColumning(newModel[0].field)
  //       fetchTableData(newModel[0].sort, searchValue, newModel[0].field, status)
  //     } else {
  //     }
  //   }

  //   const searchTableData = useCallback(
  //     debounce(async (sort, q, sortColumn, status) => {
  //       setSearchValue(q)
  //       try {
  //         await fetchTableData(sort, q, sortColumn, status)
  //       } catch (error) {
  //         console.error(error)
  //       }
  //     }, 1000),
  //     []
  //   )

  //   const handleSearch = value => {
  //     setSearchValue(value)
  //     searchTableData(sort, value, sortColumning, status)
  //   }

  const columns = [
    {
      flex: 0.2,
      Width: 40,
      field: 'uid',
      headerName: 'S.NO',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.uid}
        </Typography>
      )
    },
    {
      flex: 0.5,
      minWidth: 30,
      field: 'registration_id',
      headerName: 'REGISTRATION ID',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: '14px', fontWeight: '500' }}>
              {params.row.registration_id ? params.row.registration_id : '-'}
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      flex: 0.3,
      minWidth: 10,
      field: 'of_species',
      headerName: '# OF SPECIES',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.of_species ? params.row.of_species : '-'}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 10,
      field: 'of_animals',
      headerName: '# OF ANIMALS',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.of_animals ? params.row.of_animals : '-'}
        </Typography>
      )
    },
    {
      flex: 0.4,
      minWidth: 20,
      field: 'approved_date',
      headerName: 'Approved DATE',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.approved_date ? moment(params.row.approved_date).format('DD/MM/YYYY') : '-'}
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
            <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: 14 }}>
              {params.row.created_by_user?.user_name ? params.row.created_by_user?.user_name : '-'}
            </Typography>
            <Typography noWrap variant='body2' sx={{ color: '#44544a9c', fontSize: 12 }}>
              {params.row.created_at ? moment(params.row.created_at).format('DD/MM/YYYY') : '-'}
            </Typography>
          </Box>
        </Box>
      )
    }
  ]

  const onCellClick = params => {
    // console.log(params, 'params')
    // const clickedColumn = params.field !== 'switch'
    // if (clickedColumn) {
    //   const data = params.row
    //   Router.push({
    //     pathname: `/diet/ingredient/${data?.id}`
    //   })
    // } else {
    //   return
    // }
  }
  const tableData = () => {
    return (
      <>
        {loader ? (
          <FallbackSpinner />
        ) : (
          <Card sx={{ mt: 4 }}>
            <CardHeader title={'Reported Batches'} action={headerAction} />
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
              //   onSortModelChange={handleSortModel}
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

  const headerAction = (
    <>
      {/* <div>
        <Button size='medium' variant='contained' onClick={() => Router.push('/parivesh/home/add-newentry')}>
          <Icon icon='mdi:add' fontSize={20} />
          &nbsp; ADD ENTRY
        </Button>

        <Button size='medium' variant='contained' sx={{ m: 2, backgroundColor: '#1F415B' }}>
          &nbsp; CREATE BATCH
        </Button>
      </div> */}
    </>
  )

  return (
    <>
      <Box>
        <Card>
          <CardContent sx={{ display: 'flex', flexDirection: 'column' }}>
            <CustomAccordion
              title='Approved by Parivesh'
              summaryIcon='ion:checkmark'
              data={data}
              backgroundImage='https://images.pexels.com/photos/1599452/pexels-photo-1599452.jpeg'
              cards={cards}
              isRKT={true}
              valueRKT={'RKT'}
            />
            <Box
              sx={{
                mt: 3
              }}
            >
              <CustomAccordion
                title='To be submitted'
                summaryIcon='ion:checkmark'
                data={data}
                backgroundImage='https://images.pexels.com/photos/1599452/pexels-photo-1599452.jpeg'
                cards={cards}
              />
            </Box>
            <Grid>{tableData()}</Grid>
          </CardContent>
        </Card>
      </Box>
    </>
  )
}

export default Overview
