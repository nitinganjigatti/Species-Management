import React, { useCallback, useContext, useEffect, useState } from 'react'
import moment from 'moment'
import { Avatar, Card, CardHeader, Grid, Tooltip, Typography, debounce } from '@mui/material'
import Icon from 'src/@core/components/icon'
import { Box } from '@mui/system'
import Router, { useRouter } from 'next/router'
import { usePariveshContext } from 'src/context/PariveshContext'
import { getBatchListSpecies } from 'src/lib/api/parivesh/batchListSpecies'
import FallbackSpinner from 'src/@core/components/spinner'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import ConfirmationCheckBox from 'src/views/forms/form-elements/confirmationCheckBox'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import { useTheme } from '@emotion/react'
import { DataGrid } from '@mui/x-data-grid'
import Utility from 'src/utility'
import { AuthContext } from 'src/context/AuthContext'
import Error404 from 'src/pages/404'

const SubmittedBatches = ({ type }) => {
  const theme = useTheme()
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [dialog, setDialog] = useState(false)
  const [check, setCheck] = useState(false)
  const [sort, setSort] = useState('DESC')
  const [sortColumn, setSortColumn] = useState('submitted_on')
  const [loader, setLoader] = useState(false)
  const { selectedParivesh } = usePariveshContext()
  const authData = useContext(AuthContext)
  const pariveshAccess = authData?.userData?.roles?.settings?.enable_parivesh

  const handleSortModel = newModel => {
    if (newModel.length) {
      const newSort = newModel[0].sort === 'asc' ? 'ASC' : 'DESC'
      setSortBy(newSort)
      setSortColumn(newModel[0].field)
      fetchTableData(newModel[0].sort, searchValue, newModel[0].field)
    } else {
    }
  }

  const searchTableData = useCallback(
    debounce(async (sort, q, sortColumn) => {
      setSearchValue(q)
      try {
        await fetchTableData(sort, q, sortColumn)
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSearch = value => {
    setSearchValue(value)
    searchTableData(sort, value, sortColumn)
  }

  const onClose = () => {
    setDialog(false)
  }
  function loadServerRows(currentPage, data) {
    return data
  }
  const fetchTableData = useCallback(
    async (sort, q, sortColumn) => {
      try {
        setLoading(true)

        const params = {
          q,
          status: 'all',
          page: paginationModel.page + 1,
          sort,
          sortColumn,
          limit: paginationModel.pageSize,
          org_id: selectedParivesh.id !== 'all' ? selectedParivesh.id : null
        }

        await getBatchListSpecies({ params: params }).then(res => {
          console.log('response', res)
          // Generate uid field based on the index
          let listWithId = res.data.data.map((el, i) => {
            return { ...el, id: i + 1 }
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
    [paginationModel, selectedParivesh]
  )

  useEffect(() => {
    fetchTableData(sort, searchValue, sortColumn)
  }, [fetchTableData])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const columns = [
    // {
    //   flex: 0.2,
    //   Width: 40,
    //   field: 'batchId',
    //   headerName: 'BATCH ID',
    //   alignItems: 'left',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {params.row.batch_id}
    //     </Typography>
    //   )
    // },
    {
      flex: 0.2,
      Width: 40,
      field: 'sl_no',
      headerName: 'S.No',
      sortable: false,
      description: 'This column has a value getter and is not sortable.',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.id}
        </Typography>
      )
    },
    {
      flex: 0.3,
      Width: 40,
      field: 'batch_code',
      headerName: 'BATCH ID',
      alignItems: 'left',
      sortable: false,
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.batch_code}
        </Typography>
      )
    },
    {
      flex: 0.4,
      minWidth: 30,
      field: 'registration_id',
      headerName: 'REGISTRATION ID',
      alignItems: 'left',
      sortable: false,
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Tooltip title={params.row.registration_id || '-'}>
              <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: '14px', fontWeight: '500' }}>
                {params.row.registration_id ? params.row.registration_id : '-'}
              </Typography>
            </Tooltip>
          </Box>
        </Box>
      )
    },
    {
      flex: 0.3,
      minWidth: 10,
      field: 'no_of_animals',
      headerName: 'NO. OF ANIMALS',
      alignItems: 'left',
      sortable: false,
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.no_of_animals ? params.row.no_of_animals : '-'}
        </Typography>
      )
    },
    {
      flex: 0.3,
      minWidth: 20,
      field: 'submitted_on',
      headerName: 'SUBMITTED DATE',
      alignItems: 'left',
      sortable: false,
      renderCell: params => (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant='body2' sx={{ color: 'text.primary' }}>
            {params.row.submitted_on
              ? Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.submitted_on))
              : '-'}
          </Typography>
          <Typography variant='body2' sx={{ color: '#839D8D', fontSize: '12px' }}>
            {params.row.submitted_on
              ? Utility.extractHoursAndMinutes(Utility.convertUTCToLocal(params.row.submitted_on))
              : '-'}
          </Typography>
        </Box>
      )
    },

    {
      flex: 0.5,
      minWidth: 60,
      field: 'submitted_by_user',
      headerName: 'SUBMITTED BY',
      sortable: false,
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
            {params.row.submitted_by_user?.profile_pic ? (
              <img
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                src={params.row.submitted_by_user?.profile_pic}
                alt='Profile'
              />
            ) : (
              <Icon icon='mdi:user' />
            )}
          </Avatar>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: 14 }}>
              {params.row.submitted_by_user?.user_name ? params.row.submitted_by_user?.user_name : '-'}
            </Typography>
            <Typography noWrap variant='body2' sx={{ color: '#44544a9c', fontSize: 12 }}>
              {params.row.submitted_on
                ? Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.submitted_on))
                : '-'}
            </Typography>
          </Box>
        </Box>
      )
    },
    // {
    //   flex: 0.5,
    //   minWidth: 60,
    //   field: 'created_by_user',
    //   headerName: 'CREATED BY',
    //   alignItems: 'left',
    //   sortable: false,
    //   renderCell: params => (
    //     <Box sx={{ display: 'flex', alignItems: 'center' }}>
    //       <Avatar
    //         variant='square'
    //         alt='Medicine Image'
    //         sx={{
    //           width: 30,
    //           height: 30,
    //           mr: 4,
    //           borderRadius: '50%',
    //           background: '#E8F4F2',
    //           overflow: 'hidden'
    //         }}
    //       >
    //         {params.row.created_by_user?.profile_pic ? (
    //           <img
    //             style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    //             src={params.row.created_by_user?.profile_pic}
    //             alt='Profile'
    //           />
    //         ) : (
    //           <Icon icon='mdi:user' />
    //         )}
    //       </Avatar>
    //       <Box sx={{ display: 'flex', flexDirection: 'column' }}>
    //         <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: 14 }}>
    //           {params.row.created_by_user?.user_name ? params.row.created_by_user?.user_name : '-'}
    //         </Typography>
    //         <Typography noWrap variant='body2' sx={{ color: '#44544a9c', fontSize: 12 }}>
    //           {params.row.created_on ? moment(params.row.created_on).format('DD/MM/YYYY') : '-'}
    //         </Typography>
    //       </Box>
    //     </Box>
    //   )
    // },

    {
      flex: 0.3,
      minWidth: 20,
      field: 'status',
      headerName: 'Status',
      alignItems: 'left',
      sortable: false,
      renderCell: params => (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography
            noWrap
            variant='body2'
            sx={{
              color:
                params.row.status === 'submitted'
                  ? '#00AFD6'
                  : params.row.status === 'accepted'
                  ? '#37BD69'
                  : params.row.status === 'withdrawn'
                  ? '#FA6140'
                  : '#E93353',
              fontSize: 14
            }}
          >
            {/* {params.row.status ? params.row.status.charAt(0).toUpperCase() + params.row.status.slice(1) : '-'} */}
            {params.row.status
              ? params.row.status === 'accepted'
                ? 'Approved'
                : params.row.status.charAt(0).toUpperCase() + params.row.status.slice(1)
              : '-'}
          </Typography>
          <Typography noWrap variant='body2' sx={{ color: '#44544a9c', fontSize: 12 }}>
            {params.row.submitted_on
              ? Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.submitted_on))
              : '-'}
          </Typography>
        </Box>
        // <Typography variant='body2' sx={{ color: '#E93353' }}>
        //   {params.row.status ? params.row.status : '-'}
        // </Typography>
      )
    }
  ]

  const onCellClick = params => {
    const { id, batchId } = params.row
    // console.log(params, 'params')
    // Router.push(`/parivesh/home/${id}/batch-details?batchId=${batchId}`)
    // Router.push({
    //   pathname: `/parivesh/home/batch-list/batch-details`
    // })
    // console.log(params, 'params')
    const clickedColumn = params.field !== 'switch'
    if (clickedColumn) {
      const { id, batch_id } = params.row
      Router.push({
        pathname: `/parivesh/home/${batch_id}/batch-details`,
        query: { type }
      })
    } else {
      return
    }
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

  const tableData = () => {
    return (
      <>
        {loader ? (
          <FallbackSpinner />
        ) : (
          <Card sx={{ mt: 4 }}>
            <CardHeader title={'Submitted Batches'} action={headerAction} />
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
              disableColumnMenu
              disableColumnFilter
              disableColumnSorting
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
              columns={columns}
              total={total}
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

  return <>{pariveshAccess ? <Grid>{tableData()}</Grid> : <Error404></Error404>}</>
}

export default SubmittedBatches

// import React, { useState, useEffect, useCallback, useContext } from 'react'

// import { getIngredientList } from 'src/lib/api/diet/getIngredients'

// import FallbackSpinner from 'src/@core/components/spinner/index'
// import CardHeader from '@mui/material/CardHeader'
// import { DataGrid } from '@mui/x-data-grid'
// import { debounce } from 'lodash'
// import Tab from '@mui/material/Tab'
// import TabPanel from '@mui/lab/TabPanel'
// import TabContext from '@mui/lab/TabContext'
// import { styled } from '@mui/material/styles'
// import MuiTabList from '@mui/lab/TabList'
// import TabList from '@mui/lab/TabList'
// import moment from 'moment'
// import { Avatar, Button, Tooltip, Box, Switch, Divider, IconButton } from '@mui/material'
// import CustomChip from 'src/@core/components/mui/chip'

// // ** MUI Imports
// import Card from '@mui/material/Card'
// import Typography from '@mui/material/Typography'
// import Chip from '@mui/material/Chip'
// import Grid from '@mui/material/Grid'

// // ** Icon Imports
// import Icon from 'src/@core/components/icon'
// import Router from 'next/router'
// import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
// import { updateIngredientStatus } from 'src/lib/api/diet/getIngredients'
// import ConfirmationDialog from 'src/components/confirmation-dialog'
// import ConfirmationCheckBox from 'src/views/forms/form-elements/confirmationCheckBox'
// import { useTheme } from '@mui/material/styles'
// import AddIngredients from 'src/components/diet/AddIngredients'
// import Error404 from 'src/pages/404'

// import { AuthContext } from 'src/context/AuthContext'
// import Toaster from 'src/components/Toaster'

// const roleColors = {
//   active: 'success',
//   inactive: 'error'
// }

// const SubmittedBatches = ({}) => {
//   const theme = useTheme()

//   const [loader, setLoader] = useState(false)
//   const [total, setTotal] = useState(0)
//   const [sort, setSort] = useState('desc')
//   const [rows, setRows] = useState([
//     {
//       batchId: '#BA12354',
//       id: '1',
//       registration_id: 'WL/GJ/132549',
//       of_species: '555',
//       of_animals: '2501',
//       created_at: '2024-06-03 16:07:17',
//       approved_date: '2024-06-06 16:07:17',
//       status: 'Rejected',
//       submitted_by_user: {
//         user_name: 'sr',
//         email: 'sr@mailinator.com',
//         profile_pic: 'https://api.dev.antzsystems.com/uploads/11/diet/ingredients/665d9cdd975011717411037.jpg'
//       }
//     }
//   ])
//   const [searchValue, setSearchValue] = useState('')
//   const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
//   const [loading, setLoading] = useState(false)

//   const [dialog, setDialog] = useState(false)
//   const [check, setCheck] = useState(false)

//   const authData = useContext(AuthContext)
//   const dietModule = authData?.userData?.roles?.settings?.diet_module

//   const handleChange = (event, newValue) => {
//     setTotal(0)
//     setValue(newValue)
//   }

//   const onClose = () => {
//     setDialog(false)
//   }

//   //   const fetchTableData = useCallback(
//   //     async (sort, q, sortColumn, status) => {
//   //       try {
//   //         setLoading(true)

//   //         const params = {
//   //           sort,
//   //           q,
//   //           sortColumn,
//   //           page: paginationModel.page + 1,
//   //           limit: paginationModel.pageSize,
//   //           status
//   //         }

//   //         await getIngredientList({ params: params }).then(res => {
//   //           console.log('response', res)

//   //           // Generate uid field based on the index
//   //           let listWithId = res.data.result.map((el, i) => {
//   //             return { ...el, uid: i + 1 }
//   //           })
//   //           setTotal(parseInt(res?.data?.total_count))
//   //           setRows(loadServerRows(paginationModel.page, listWithId))
//   //         })
//   //         setLoading(false)
//   //       } catch (e) {
//   //         console.log(e)
//   //         setLoading(false)
//   //       }
//   //     },
//   //     [paginationModel]
//   //   )

//   //   useEffect(() => {
//   //     if (dietModule) {
//   //       fetchTableData(sort, searchValue, sortColumning, status)
//   //     }
//   //   }, [fetchTableData, status])

//   const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

//   const indexedRows = rows?.map((row, index) => ({
//     ...row,
//     sl_no: getSlNo(index)
//   }))

//   //   const handleSortModel = newModel => {
//   //     if (newModel.length) {
//   //       setSort(newModel[0].sort)
//   //       setsortColumning(newModel[0].field)
//   //       fetchTableData(newModel[0].sort, searchValue, newModel[0].field, status)
//   //     } else {
//   //     }
//   //   }

//   //   const searchTableData = useCallback(
//   //     debounce(async (sort, q, sortColumn, status) => {
//   //       setSearchValue(q)
//   //       try {
//   //         await fetchTableData(sort, q, sortColumn, status)
//   //       } catch (error) {
//   //         console.error(error)
//   //       }
//   //     }, 1000),
//   //     []
//   //   )

//   //   const handleSearch = value => {
//   //     setSearchValue(value)
//   //     searchTableData(sort, value, sortColumning, status)
//   //   }

//   const columns = [
//     {
//       flex: 0.2,
//       Width: 40,
//       field: 'batchId',
//       headerName: 'BATCH ID',
//       renderCell: params => (
//         <Typography variant='body2' sx={{ color: 'text.primary' }}>
//           {params.row.batchId}
//         </Typography>
//       )
//     },
//     {
//       flex: 0.4,
//       minWidth: 30,
//       field: 'registration_id',
//       headerName: 'REGISTRATION ID',
//       renderCell: params => (
//         <Box sx={{ display: 'flex', alignItems: 'center' }}>
//           <Box sx={{ display: 'flex', flexDirection: 'column' }}>
//             <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: '14px', fontWeight: '500' }}>
//               {params.row.registration_id ? params.row.registration_id : '-'}
//             </Typography>
//           </Box>
//         </Box>
//       )
//     },
//     {
//       flex: 0.3,
//       minWidth: 10,
//       field: 'of_animals',
//       headerName: 'No OF ANIMALS',
//       renderCell: params => (
//         <Typography variant='body2' sx={{ color: 'text.primary' }}>
//           {params.row.of_animals ? params.row.of_animals : '-'}
//         </Typography>
//       )
//     },
//     {
//       flex: 0.3,
//       minWidth: 20,
//       field: 'approved_date',
//       headerName: 'SUBMITTED DATE',
//       renderCell: params => (
//         <Typography variant='body2' sx={{ color: 'text.primary' }}>
//           {params.row.approved_date ? moment(params.row.approved_date).format('DD/MM/YYYY') : '-'}
//         </Typography>
//       )
//     },
//     {
//       flex: 0.5,
//       minWidth: 60,
//       field: 'submitted_by_user',
//       headerName: 'CREATED BY',

//       renderCell: params => (
//         <Box sx={{ display: 'flex', alignItems: 'center' }}>
//           <Avatar
//             variant='square'
//             alt='Medicine Image'
//             sx={{
//               width: 30,
//               height: 30,
//               mr: 4,
//               borderRadius: '50%',
//               background: '#E8F4F2',
//               overflow: 'hidden'
//             }}
//           >
//             {params.row.submitted_by_user?.profile_pic ? (
//               <img
//                 style={{ width: '100%', height: '100%', objectFit: 'cover' }}
//                 src={params.row.submitted_by_user?.profile_pic}
//                 alt='Profile'
//               />
//             ) : (
//               <Icon icon='mdi:user' />
//             )}
//           </Avatar>
//           <Box sx={{ display: 'flex', flexDirection: 'column' }}>
//             <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: 14 }}>
//               {params.row.submitted_by_user?.user_name ? params.row.submitted_by_user?.user_name : '-'}
//             </Typography>
//             <Typography noWrap variant='body2' sx={{ color: '#44544a9c', fontSize: 12 }}>
//               {params.row.created_at ? moment(params.row.created_at).format('DD/MM/YYYY') : '-'}
//             </Typography>
//           </Box>
//         </Box>
//       )
//     },
//     {
//       flex: 0.3,
//       minWidth: 20,
//       field: 'status',
//       headerName: 'Status',
//       renderCell: params => (
//         <Box sx={{ display: 'flex', flexDirection: 'column' }}>
//           <Typography noWrap variant='body2' sx={{ color: '#E93353', fontSize: 14 }}>
//             {params.row.status ? params.row.status : '-'}
//           </Typography>
//           <Typography noWrap variant='body2' sx={{ color: '#44544a9c', fontSize: 12 }}>
//             {params.row.created_at ? moment(params.row.created_at).format('DD/MM/YYYY') : '-'}
//           </Typography>
//         </Box>
//         // <Typography variant='body2' sx={{ color: '#E93353' }}>
//         //   {params.row.status ? params.row.status : '-'}
//         // </Typography>
//       )
//     }

//     // {
//     //   flex: 0.3,
//     //   minWidth: 20,
//     //   field: 'Action',
//     //   headerName: 'Action',
//     //   renderCell: params => (
//     //     <>
//     //       <Box sx={{ display: 'flex', alignItems: 'right', textAlign: 'right' }}>
//     //         <IconButton size='small' sx={{ mr: 0.5 }} onClick={() => console.log('edit')} aria-label='Edit'>
//     //           <Icon icon='mdi:pencil-outline' />
//     //         </IconButton>
//     //         <IconButton size='small' sx={{ mr: 0.5 }} onClick={() => console.log('edit')} aria-label='Edit'>
//     //           <Icon icon='mdi:close' />
//     //         </IconButton>
//     //       </Box>
//     //     </>
//     //   )
//     // }
//   ]

//   const onCellClick = params => {
//     Router.push(`/parivesh/home/${params?.id}/batch-details`)
//     // Router.push({
//     //   pathname: `/parivesh/home/batch-list/batch-details`
//     // })
//     // console.log(params, 'params')
//     // const clickedColumn = params.field !== 'switch'
//     // if (clickedColumn) {
//     //   const data = params.row
//     //   Router.push({
//     //     pathname: `/diet/ingredient/${data?.id}`
//     //   })
//     // } else {
//     //   return
//     // }
//   }

//   const headerAction = (
//     <>
//       {/* <div>
//         <Button size='medium' variant='contained' onClick={() => Router.push('/parivesh/home/add-newentry')}>
//           <Icon icon='mdi:add' fontSize={20} />
//           &nbsp; ADD ENTRY
//         </Button>

//         <Button size='medium' variant='contained' sx={{ m: 2, backgroundColor: '#1F415B' }}>
//           &nbsp; CREATE BATCH
//         </Button>
//       </div> */}
//     </>
//   )

//   const tableData = () => {
//     return (
//       <>
//         {loader ? (
//           <FallbackSpinner />
//         ) : (
//           <Card sx={{ mt: 4 }}>
//             <CardHeader title={'Submitted Batches'} action={headerAction} />
//             <ConfirmationDialog
//               // icon={'mdi:delete'}
//               image={'https://app.antzsystems.com/uploads/6515471031963.jpg'}
//               iconColor={'#ff3838'}
//               title={'Are you sure you want to delete this ingredient?'}
//               // description={`Since ingredient IND000123 isn't included in any recipe or diet, you can delete it.`}
//               formComponent={
//                 <ConfirmationCheckBox
//                   title={'This ingredient is part of 15 recipes and 10 diets.'}
//                   label={'Deactivate this ingredient in all records'}
//                   description={
//                     'Deactivating this ingredient prevents its addition to new recipes or diets, but you can swap it with another ingredient.'
//                   }
//                   color={theme.palette.formContent?.tertiary}
//                   value={check}
//                   setValue={setCheck}
//                 />
//               }
//               dialogBoxStatus={dialog}
//               onClose={onClose}
//               ConfirmationText={'Delete'}
//               confirmAction={onClose}
//             />
//             <DataGrid
//               sx={{
//                 '.MuiDataGrid-cell:focus': {
//                   outline: 'none'
//                 },

//                 '& .MuiDataGrid-row:hover': {
//                   cursor: 'pointer'
//                 }
//               }}
//               columnVisibilityModel={{
//                 sl_no: false
//               }}
//               hideFooterSelectedRowCount
//               disableColumnSelector={true}
//               autoHeight
//               pagination
//               rows={indexedRows === undefined ? [] : indexedRows}
//               rowCount={total}
//               columns={columns}
//               sortingMode='server'
//               paginationMode='server'
//               pageSizeOptions={[7, 10, 25, 50]}
//               paginationModel={paginationModel}
//               //   onSortModelChange={handleSortModel}
//               slots={{ toolbar: ServerSideToolbarWithFilter }}
//               onPaginationModelChange={setPaginationModel}
//               loading={loading}
//               slotProps={{
//                 baseButton: {
//                   variant: 'outlined'
//                 },
//                 toolbar: {
//                   value: searchValue,
//                   clearSearch: () => handleSearch(''),
//                   onChange: event => handleSearch(event.target.value)
//                 }
//               }}
//               onCellClick={onCellClick}
//             />
//           </Card>
//         )}
//       </>
//     )
//   }

//   return (
//     <>
//       {dietModule ? (
//         <>
//           <Grid>{tableData()}</Grid>
//         </>
//       ) : (
//         <>
//           <Error404 />
//         </>
//       )}
//     </>
//   )
// }

// export default SubmittedBatches
