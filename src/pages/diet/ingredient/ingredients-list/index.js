import React, { useState, useEffect, useCallback } from 'react'

import { getIngredientList } from 'src/lib/api/diet/getFeedDetails'
import { IMAGE_BASE_URL } from 'src/constants/ApiConstant'

import FallbackSpinner from 'src/@core/components/spinner/index'

// ** MUI Imports

import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import { DataGrid } from '@mui/x-data-grid'
import Card from '@mui/material/Card'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import { debounce } from 'lodash'
import CustomAvatar from 'src/@core/components/mui/avatar'
import { getInitials } from 'src/@core/utils/get-initials'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box, Avatar, Button, FormControlLabel, Switch, TextField } from '@mui/material'
import IconButton from '@mui/material/IconButton'
import Router from 'next/router'
import CommonDialogBox from 'src/components/CommonDialogBox'
import MedicineConfigure from 'src/components/pharmacy/medicine/MedicineConfigure'
import Utility from 'src/utility'
import { usePharmacyContext } from 'src/context/PharmacyContext'

import Error404 from 'src/pages/404'
import ServerSideToolbarWithFilterAndToggle from 'src/views/table/data-grid/ServerSideToolbarwithfilter_toggle'

const IngredientsList = ({ fromIngredientsPage }) => {
  const [medicineList, setMedicineList] = useState([])
  const [loader, setLoader] = useState(false)
  const [show, setShow] = useState(false)
  const [configureMedId, setConfigureMedId] = useState('')

  const { selectedPharmacy } = usePharmacyContext()

  console.log(selectedPharmacy)

  const closeDialog = () => {
    setShow(false)
  }

  const showDialog = () => {
    setShow(true)
  }

  const handleEdit = async id => {
    Router.push({
      pathname: '/pharmacy/medicine/add-product',
      query: { id: id, action: 'edit' }
    })
  }

  const renderClient = params => {
    const { row } = params
    const stateNum = Math.floor(Math.random() * 6)
    const states = ['success', 'error', 'warning', 'info', 'primary', 'secondary']
    const color = states[stateNum]
    if (row.avatar) {
      return (
        <CustomAvatar src={`/images/avatars/${row.avatar}`} sx={{ mr: 3, width: '1.875rem', height: '1.875rem' }} />
      )
    } else {
      return (
        <CustomAvatar
          skin='light'
          color={color}
          sx={{ mr: 3, fontSize: '.8rem', width: '1.875rem', height: '1.875rem' }}
        >
          {getInitials(row.full_name ? row.full_name : 'John Doe')}
        </CustomAvatar>
      )
    }
  }

  const columns = [
    {
      flex: 0.05,
      Width: 40,
      field: 'uid',
      headerName: 'SL ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {console.log(params, 'ppp')}
          {params.row.length}
        </Typography>
      )
    },
    {
      flex: 0.6,
      minWidth: 30,
      field: 'ingredient_name',
      headerName: 'INGREDIENTS',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* {renderClient(params)} */}
          <Avatar
            variant='square'
            alt='Medicine Image'
            sx={{ width: 40, height: 40, mr: 4 }}
            src={params.row.image ? `${params.row.image}` : '/images/tablet.png'}
          />
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography noWrap variant='body2' sx={{ color: 'text.primary' }}>
              {params.row.ingredient_name}
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      flex: 0.4,
      minWidth: 20,
      field: 'feedtype',
      headerName: 'FEED TYPE',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          Fruits
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 20,
      field: 'carbs',
      headerName: 'CARBS',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          Nil
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 20,
      field: 'protein',
      headerName: 'PROTEIN',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          <span>0.3g</span>
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 20,
      field: 'fat',
      headerName: 'FAT',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          <span>0.2g</span>
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 20,
      field: 'water',
      headerName: 'WATER',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {/* <span alt={params.row.manufacturer_name}>{params.row.manufacturer_name}</span> */}
          <spna>86%</spna>
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 20,
      field: 'mg',
      headerName: 'MG',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          <spna>6 mg</spna>
        </Typography>
      )
    }

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'Action',
    //   headerName: 'Action',

    //   renderCell: params => (
    //     <>
    //       {selectedPharmacy.type === 'central' &&
    //         (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') && (
    //           <Box>
    //             <IconButton size='small' onClick={() => handleEdit(params.row.id)} aria-label='Edit'>
    //               <Icon icon='mdi:pencil-outline' />
    //             </IconButton>
    //           </Box>
    //         )}
    //     </>
    //   )
    // }
  ]

  /***** Serverside pagination */
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState('desc')
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [sortColumn, setSortColumn] = useState('name')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [loading, setLoading] = useState(false)
  function loadServerRows(currentPage, data) {
    return data
  }

  const fetchTableData = useCallback(
    async ({ sort, q, column }) => {
      try {
        setLoading(true)

        const params = {
          sort,
          q,
          column,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize
        }

        await getIngredientList({ params: params }).then(res => {
          setTotal(parseInt(res?.data?.total_count))
          setRows(loadServerRows(paginationModel.page, res?.data?.result))
        })
        setLoading(false)
      } catch (e) {
        console.log(e)
        setLoading(false)
      }
    },
    [paginationModel]
  )

  const searchTableData = useCallback(
    debounce(async ({ sort, q, column }) => {
      setSearchValue(q)
      try {
        await fetchTableData({ sort, q, column })
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  useEffect(() => {
    fetchTableData({ sort, q: searchValue, column: sortColumn })
  }, [fetchTableData])

  const handleSortModel = async newModel => {
    if (newModel.length > 0) {
      await searchTableData({ sort: newModel[0].sort, q: searchValue, column: newModel[0].field })
    } else {
    }
  }

  const handleSearch = async value => {
    setSearchValue(value)
    await searchTableData({ sort, q: value, column: sortColumn })
  }

  const headerAction = (
    <div>
      {selectedPharmacy.type === 'central' &&
        (selectedPharmacy.permission.key === 'allow_full_access' || selectedPharmacy.permission.key === 'ADD') && (
          <Button
            size='small'
            variant='contained'

            // onClick={() => Router.push('/diet/add-feed')}
          >
            <Icon icon='mdi:add' fontSize={20} />
            &nbsp; Add New
          </Button>
        )}
    </div>
  )

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  return (
    <>
      {/* {selectedPharmacy.type === 'central' ? ( */}
      <>
        {loader ? (
          <FallbackSpinner />
        ) : (
          <>
            <CommonDialogBox
              title={'Configure Medicine'}
              dialogBoxStatus={show}
              formComponent={<MedicineConfigure configureMedId={configureMedId} />}
              close={closeDialog}
              show={showDialog}
            />
            <Card>
              <CardHeader title='Ingredients' action={headerAction} />
              {/* <Box sx={{ my: 4, height: '40px', display: 'flex', justifyContent: 'space-between' }}>
                  <FormControlLabel control={<Switch defaultChecked />} label='Show Active Only' />
                </Box> */}
              <DataGrid
                columnVisibilityModel={{
                  id: false
                }}
                autoHeight
                pagination
                hideFooterSelectedRowCount
                disableColumnSelector={true}
                rows={indexedRows === undefined ? [] : indexedRows}
                rowCount={total}
                columns={columns}
                sortingMode='server'
                paginationMode='server'
                pageSizeOptions={[7, 10, 25, 50]}
                paginationModel={paginationModel}
                onSortModelChange={handleSortModel}
                slots={{ toolbar: ServerSideToolbarWithFilterAndToggle }}
                onPaginationModelChange={setPaginationModel}
                loading={loading}
                className='raghu'
                slotProps={{
                  baseButton: {
                    variant: 'outlined',
                    sx: { float: 'right' }
                  },
                  toolbar: {
                    value: searchValue,
                    clearSearch: () => handleSearch(''),

                    onChange: event => {
                      setSearchValue(event.target.value)

                      return handleSearch(event.target.value)
                    }
                  }
                }}
              />
            </Card>
          </>
        )}
      </>
      {/* ) : (
        <>
          <Error404></Error404>
        </>
      )} */}
    </>
  )
}

export default IngredientsList
