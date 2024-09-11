// import React, { useCallback, useEffect, useState } from 'react'
// import {
//   Card,
//   CardContent,
//   Grid,
//   Typography,
//   Container,
//   Button,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   Pagination
// } from '@mui/material'
// import CardHeader from '@mui/material/CardHeader'
// import { IconButton } from '@mui/material'
// import EditIcon from '@mui/icons-material/Edit'
// import DeleteIcon from '@mui/icons-material/Delete'
// import { Box, fontSize } from '@mui/system'
// import { LoadingButton } from '@mui/lab'
// import { useTheme } from '@emotion/react'
// import toast from 'react-hot-toast'
// import { AddButton } from 'src/components/Buttons'
// import Icon from 'src/@core/components/icon'
// import Toaster from 'src/components/Toaster'
// import FallbackSpinner from 'src/@core/components/spinner/index'
// import AddLabTest from 'src/views/pages/lab/test/addTest'
// import { addLabTest, deleteLabTest, getLabTestList, updateLabTest } from 'src/lib/api/lab/master'
// import Router, { useRouter } from 'next/router'
// import ConfirmationDeleteDialog from 'src/components/ConfirmationDeleteDialog'
// import ArrowBackIcon from '@mui/icons-material/ArrowBack'

// const TestCard = ({ test, onEdit, onDelete }) => {
//   return (
//     <Card
//       variant='outlined'
//       sx={{
//         height: '100%',
//         display: 'flex',
//         flexDirection: 'column',
//         position: 'relative', // Needed for absolute positioning of icons
//         p: 3
//         // cursor: 'pointer'
//       }}
//     >
//       {/* Icons positioned at the top right */}
//       <Box
//         sx={{
//           position: 'absolute',
//           top: 6,
//           right: 6,
//           display: 'flex',
//           gap: 1 // Space between the icons
//         }}
//       >
//         <IconButton
//           onClick={e => {
//             e.stopPropagation()
//             onEdit(test)
//           }}
//           size='small'
//         >
//           <EditIcon />
//         </IconButton>
//         <IconButton
//           onClick={e => {
//             e.stopPropagation()
//             onDelete(test)
//           }}
//           size='small'
//         >
//           <DeleteIcon />
//         </IconButton>
//       </Box>

//       <CardContent
//         sx={{
//           flexGrow: 1,
//           display: 'flex',
//           flexDirection: 'column',
//           justifyContent: 'center'
//         }}
//       >
//         <Typography variant='h6' component='div'>
//           {test.label}
//         </Typography>
//         <Typography color='text.secondary'>{test.description}</Typography>
//       </CardContent>
//     </Card>
//   )
// }

// const LabTest = () => {
//   const theme = useTheme()
//   const router = useRouter()
//   const [testData, setTestData] = useState([])
//   const [totalCount, setTotalCount] = useState(0)
//   const [page, setPage] = useState(1)
//   const [limit] = useState(10)
//   const editParamsInitialState = { id: null, label: null, description: null, string_id: null }
//   const [openDrawer, setOpenDrawer] = useState(false)
//   const [resetForm, setResetForm] = useState(false)
//   const [submitLoader, setSubmitLoader] = useState(false)
//   const [editParams, setEditParams] = useState(editParamsInitialState)
//   const [loading, setLoading] = useState(false)
//   const [isModalOpenDelete, setIsModalOpenDelete] = useState(false)
//   const [selectedId, setSelectedId] = useState(null)
//   const [btnLoader, setBtnLoader] = useState(false)

//   const { sample_id } = router.query
//   console.log(sample_id, 'sample_id')

//   const fetchLabTestData = useCallback(
//     async (sample_id, page) => {
//       try {
//         setLoading(true)

//         const params = {
//           sample_id: sample_id,
//           page: page,
//           is_child: 1,
//           limit: limit
//         }

//         await getLabTestList({ params: params }).then(res => {
//           if (res.success) {
//             console.log(res, 'res')
//             setTestData(res.data?.data)
//             setTotalCount(res.data?.total_count)
//           }
//         })
//         setLoading(false)
//       } catch (e) {
//         console.log(e)
//         setLoading(false)
//       }
//     },
//     [limit]
//   )
//   useEffect(() => {
//     if (sample_id) {
//       fetchLabTestData(sample_id, page)
//     }
//   }, [fetchLabTestData, sample_id, page])

//   const handleSidebarClose = () => {
//     setOpenDrawer(false)
//   }
//   const addEventSidebarOpen = () => {
//     setEditParams({ id: null, label: null, description: null, string_id: null })
//     setResetForm(true)
//     setOpenDrawer(true)
//   }

//   const handleSubmitData = async payload => {
//     try {
//       setSubmitLoader(true)
//       var response
//       if (editParams?.id !== null) {
//         response = await updateLabTest(editParams?.id, payload)
//       } else {
//         response = await addLabTest(payload)
//       }
//       if (response?.success) {
//         Toaster({ type: 'success', message: response?.message })
//         setSubmitLoader(false)
//         setResetForm(true)
//         setOpenDrawer(false)
//         await fetchLabTestData(sample_id)
//       } else {
//         Toaster({ type: 'error', message: response?.message })
//         setSubmitLoader(false)
//       }
//     } catch (e) {
//       console.log(e)
//       setSubmitLoader(false)
//       toast.error(JSON.stringify(e))
//     }
//   }
//   const handleEdit = sample => {
//     console.log('Edit:', sample)
//     setEditParams(sample)
//     setResetForm(true)
//     setOpenDrawer(true)
//     // Add your logic to handle the edit action
//   }

//   const handleDelete = sample => {
//     console.log('Delete:', sample)
//     setIsModalOpenDelete(true)
//     setSelectedId(sample?.id)
//     // Add your logic to handle the delete action
//   }

//   const confirmDeleteAction = async () => {
//     try {
//       setBtnLoader(true)
//       const res = await deleteLabTest(selectedId)
//       if (res?.success) {
//         setBtnLoader(false)
//         setIsModalOpenDelete(false)
//         Toaster({ type: 'success', message: res?.message })
//         await fetchLabTestData(sample_id)
//       } else {
//         setBtnLoader(false)
//         setIsModalOpenDelete(false)
//         Toaster({ type: 'error', message: res?.message })
//       }
//     } catch (error) {
//       console.error('Error uploading files:', error)
//     } finally {
//       setIsModalOpenDelete(false)
//       setBtnLoader(false)
//     }
//   }

//   const headerAction = (
//     <>
//       <AddButton title='Add Test' action={() => addEventSidebarOpen()} />
//     </>
//   )

//   const titleAction = (
//     <Box display='flex' alignItems='center'>
//       <IconButton onClick={() => router.back()}>
//         <ArrowBackIcon />
//       </IconButton>
//       <Typography variant='h6' ml={1}>
//         Lab Test
//       </Typography>
//     </Box>
//   )
//   const handlePageChange = (event, value) => {
//     setPage(value)
//   }

//   return (
//     <>
//       {loading ? (
//         <FallbackSpinner />
//       ) : (
//         <Container>
//           <Card variant='outlined' sx={{ mb: 2 }}>
//             <CardHeader title={titleAction} action={headerAction} />
//           </Card>

//           {testData.length > 0 ? (
//             <>
//               <Grid container spacing={2}>
//                 {testData.map(test => (
//                   <Grid item xs={12} key={test.id}>
//                     <TestCard test={test} onEdit={handleEdit} onDelete={handleDelete} />
//                   </Grid>
//                 ))}
//               </Grid>
//               <Box display='flex' justifyContent='end' mt={4}>
//                 <Pagination
//                   count={Math.ceil(totalCount / limit)}
//                   page={page}
//                   onChange={handlePageChange}
//                   color='primary'
//                 />
//               </Box>
//             </>
//           ) : (
//             <Box display='flex' justifyContent='center' mt={4}>
//               <Typography variant='body1' color='textSecondary'>
//                 No data available
//               </Typography>
//             </Box>
//           )}
//         </Container>
//       )}

//       <AddLabTest
//         drawerWidth={400}
//         addEventSidebarOpen={openDrawer}
//         handleSidebarClose={handleSidebarClose}
//         handleSubmitData={handleSubmitData}
//         resetForm={resetForm}
//         submitLoader={submitLoader}
//         editParams={editParams}
//       />

//       <ConfirmationDeleteDialog
//         open={isModalOpenDelete}
//         onClose={() => setIsModalOpenDelete(false)}
//         confirmLoading={btnLoader}
//         onConfirm={confirmDeleteAction}
//         title='Are you sure you want to delete this lab test?'
//       />
//     </>
//   )
// }

// export default LabTest

import {
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardHeader,
  FormControlLabel,
  IconButton,
  Switch,
  Tooltip,
  Typography,
  debounce
} from '@mui/material'
import Icon from 'src/@core/components/icon'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import { useRouter } from 'next/router'
import { useTheme } from '@mui/material/styles'
import Router from 'next/router'
import {
  addMedicalComplaintOrDiagnosis,
  getMedicalCategoryListById,
  updateMedicalCategory
} from 'src/lib/api/medical/masters'
import toast from 'react-hot-toast'
import Toaster from 'src/components/Toaster'
import { AuthContext } from 'src/context/AuthContext'
import AddLabTest from 'src/views/pages/lab/test/addTest'
import { addLabTest, deleteLabTest, getLabTestList, updateLabTest } from 'src/lib/api/lab/master'
import moment from 'moment'
import TestDetails from 'src/views/pages/lab/test/testDetails'
import ConfirmationDeleteDialog from 'src/components/ConfirmationDeleteDialog'

const LabTest = () => {
  const theme = useTheme()
  const router = useRouter()
  const { id } = router.query
  const authData = useContext(AuthContext)
  const [openDrawer, setOpenDrawer] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [sort, setSort] = useState('desc')
  const [sortColumn, setSortColumn] = useState('label')
  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const editParamsInitialState = { id: null, label: null, sample_type_count: null, sub_test_count: null }
  const [editParams, setEditParams] = useState(editParamsInitialState)
  const [resetForm, setResetForm] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [openDetailsDrawer, setOpenDetailsDrawer] = useState(false)
  const [isModalOpenDelete, setIsModalOpenDelete] = useState(false)
  const [btnLoader, setBtnLoader] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  function loadServerRows(currentPage, data) {
    return data
  }

  // console.log(id, 'id')

  const fetchTableData = useCallback(
    async q => {
      try {
        setLoading(true)

        const params = {
          q,
          sort,
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize
        }

        await getLabTestList({ params: params }).then(res => {
          console.log(res, 'resqwe')
          setTotal(parseInt(res?.data?.total_count))
          setRows(loadServerRows(paginationModel.page, res?.data?.data))
        })
        setResetForm(true)
        setLoading(false)
      } catch (e) {
        setLoading(false)
      }
    },
    [paginationModel]
  )

  useEffect(() => {
    fetchTableData(searchValue)
  }, [fetchTableData])

  const handleSortModel = newModel => {
    if (newModel.length) {
      setSort(newModel[0].sort)
      setSortColumn(newModel[0].field)
      fetchTableData(searchValue, newModel[0].field, status)
    } else {
    }
  }

  const searchTableData = useCallback(
    debounce(async (sort, q, column) => {
      setSearchValue(q)
      try {
        await fetchTableData(q, column)
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

  const addEventSidebarOpen = () => {
    setEditParams({ id: null, label: null, sample_type_count: null, sub_test_count: null })
    setResetForm(true)
    setOpenDrawer(true)
  }

  const handleSubmitData = async payload => {
    console.log(payload, 'ghghhg')

    try {
      setSubmitLoader(true)
      var response
      if (editParams?.id !== null) {
        response = await updateLabTest(editParams?.id, payload)
      } else {
        response = await addLabTest(payload)
      }
      if (response?.success) {
        Toaster({ type: 'success', message: response?.message })
        setResetForm(true)
        setSubmitLoader(false)
        setOpenDrawer(false)
        await fetchTableData()
      } else {
        Toaster({ type: 'error', message: response?.message })
        setSubmitLoader(false)
      }
    } catch (e) {
      console.log(e)
      setSubmitLoader(false)
      toast.error(JSON.stringify(e))
    }
  }

  const handleEdit = async (event, params) => {
    event.stopPropagation()
    setResetForm(true)
    setEditParams(params)
    setOpenDrawer(true)
    console.log('params >>', params)
  }

  const confirmDeleteAction = async () => {
    try {
      setBtnLoader(true)
      const res = await deleteLabTest(selectedId)
      if (res?.success) {
        setBtnLoader(false)
        setIsModalOpenDelete(false)
        Toaster({ type: 'success', message: res?.message })
        await fetchTableData()
      } else {
        setBtnLoader(false)
        setIsModalOpenDelete(false)
        Toaster({ type: 'error', message: res?.message })
      }
    } catch (error) {
      console.error('Error uploading files:', error)
    } finally {
      setBtnLoader(false)
      setIsModalOpenDelete(false)
    }
  }

  const handleDelete = (event, testId) => {
    event.stopPropagation()
    console.log('Delete:', testId)
    setIsModalOpenDelete(true)
    setSelectedId(testId?.id)
    // Add your logic to handle the delete action
  }

  const columns = [
    {
      flex: 0.3,
      minWidth: 30,
      sortable: false,
      field: 'LAB TEST NAME',
      headerName: 'LAB TEST NAME',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography noWrap variant='body2' sx={{ color: 'text.primary', pl: 2 }}>
            {params.row.label ? params.row.label : '-'}
          </Typography>
        </Box>
      )
    },
    {
      flex: 0.3,
      Width: 30,
      field: 'NO OF SAMPLES TYPES',
      headerName: 'NO OF SAMPLES TYPES',
      sortable: false,
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography noWrap variant='body2' sx={{ color: 'text.primary', pl: 2 }}>
            {params.row.sample_type_count ? params.row.sample_type_count : '-'}
          </Typography>
        </Box>
      )
    },
    {
      flex: 0.3,
      Width: 30,
      field: 'NO OF SUB TESTS ',
      headerName: 'NO OF SUB TESTS ',
      sortable: false,
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography noWrap variant='body2' sx={{ color: 'text.primary', pl: 2 }}>
            {params.row.sub_test_count ? params.row.sub_test_count : '-'}
          </Typography>
        </Box>
      )
    },
    {
      flex: 0.4,
      minWidth: 40,
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
              {params.row.created_on ? moment(params.row.created_on).format('DD/MM/YYYY') : '-'}
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      flex: 0.2,
      minWidth: 30,
      field: 'Action',
      headerName: 'Action',
      sortable: false,
      // headerAlign: 'center',
      renderCell: params => (
        <>
          <Box>
            <FormControlLabel control={<Switch defaultChecked size='small' />} />

            <IconButton size='small' sx={{ mr: 0.5 }} onClick={e => handleEdit(e, params.row)} aria-label='Edit'>
              <Icon icon='mdi:pencil-outline' />
            </IconButton>
            <IconButton size='small' sx={{ mr: 0.5 }} onClick={e => handleDelete(e, params.row)} aria-label='delete'>
              <Icon icon='mdi:delete-outline' />
            </IconButton>
          </Box>
        </>
      )
    }
  ]

  const handleCellClick = params => {
    setEditParams(params)
    // setEditParams({ id: null, label: null, sample_type_count: null, sub_test_count: null })
    setOpenDetailsDrawer(true)
    // router.push(`complaints/${params.row.id}`)
  }

  const headerAction = (
    <div>
      <Button size='medium' variant='contained' onClick={() => addEventSidebarOpen()}>
        <Icon icon='mdi:add' fontSize={20} />
        &nbsp; Add New
      </Button>
    </div>
  )

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    id: row.id,
    sl_no: getSlNo(index)
  }))

  return (
    <>
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
        <Typography sx={{ cursor: 'pointer' }} color='inherit'>
          Lab
        </Typography>
        <Typography sx={{ cursor: 'pointer' }} color='inherit' onClick={() => router.back()}>
          Lab Master
        </Typography>
        <Typography sx={{ cursor: 'pointer' }} color='text.primary'>
          Lab Tests
        </Typography>
      </Breadcrumbs>
      <Card>
        <CardHeader title='Lab Tests' action={headerAction} />

        <DataGrid
          //   hideFooterPagination={true}
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
          disableColumnMenu
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
          onCellClick={handleCellClick}
        />
      </Card>
      {openDrawer && (
        <AddLabTest
          addEventSidebarOpen={openDrawer}
          setOpenDrawer={setOpenDrawer}
          handleSubmitData={handleSubmitData}
          resetForm={resetForm}
          submitLoader={submitLoader}
          editParams={editParams}
        />
      )}
      {openDetailsDrawer && (
        <TestDetails
          addEventSidebarOpen={openDetailsDrawer}
          setOpenDetailsDrawer={setOpenDetailsDrawer}
          editParams={editParams}
          setOpenDrawer={setOpenDrawer}
          fetchTableData={fetchTableData}
        />
      )}
      <ConfirmationDeleteDialog
        open={isModalOpenDelete}
        onClose={() => setIsModalOpenDelete(false)}
        confirmLoading={btnLoader}
        onConfirm={confirmDeleteAction}
        title='Are you sure you want to delete this lab test?'
      />
    </>
  )
}

export default LabTest
