import React, { useCallback, useEffect, useState, useContext } from 'react'

import toast from 'react-hot-toast'
import Toaster from 'src/components/Toaster'
import {
  getMortalityReasonsList,
  addMortalityReasons,
  updateMortalityReasons,
  deleteMortalityReasons
} from 'src/lib/api/lab/mortality'
import { Box, Breadcrumbs, Button, Card, CardHeader, IconButton, Typography } from '@mui/material'
import Icon from 'src/@core/components/icon'

// import ConfirmationDeleteDialog from 'src/components/ConfirmationDeleteDialog'
import { AuthContext } from 'src/context/AuthContext'
import Error404 from 'src/pages/404'
import AddMortalityReasons from 'src/views/pages/lab/mortality-reason'
import TableWithFilter from 'src/components/TableWithFilter'
import { useTheme } from '@mui/material/styles'
import { DataGrid } from '@mui/x-data-grid'
import QuickSearchToolbar from 'src/views/table/data-grid/QuickSearchToolbar'

const escapeRegExp = value => {
  return value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
}

const MortalityReason = () => {
  const theme = useTheme()
  const authData = useContext(AuthContext)
  const [openDrawer, setOpenDrawer] = useState(false)
  const [rows, setRows] = useState([])
  const editParamsInitialState = { id: null, label: null }
  const [editParams, setEditParams] = useState(editParamsInitialState)
  const [resetForm, setResetForm] = useState(false)
  const [submitLoader, setSubmitLoader] = useState(false)
  const [isModalOpenDelete, setIsModalOpenDelete] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  const [data, setData] = useState([])
  const [searchText, setSearchText] = useState('')
  const [filteredData, setFilteredData] = useState([])
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 })

  const medical_add_mortality_reasons = authData?.userData?.permission?.user_settings?.medical_add_mortality_reasons

  const handleSearch = searchValue => {
    setSearchText(searchValue)
    const searchRegex = new RegExp(escapeRegExp(searchValue), 'i')

    const filteredRows = data.filter(row => {
      return Object.keys(row).some(field => {
        // @ts-ignore
        //   return searchRegex.test(row[field].toString())
        // })
        return row[field]?.toString() && searchRegex.test(row[field].toString())
      })
    })
    if (searchValue.length) {
      setFilteredData(filteredRows)
    } else {
      setFilteredData([])
    }
  }

  useEffect(() => {
    setData(rows)
  }, [rows])

  const fetchTableData = useCallback(async q => {
    try {
      const params = {}
      await getMortalityReasonsList({ params: params }).then(res => {
        // setTotal(parseInt(res?.data?.length))
        setRows(res?.data)
      })
      setResetForm(true)
    } catch (e) {
      setRows([])
      console.log('error', e)
    }
  }, [])

  useEffect(() => {
    fetchTableData()
  }, [fetchTableData])

  const addEventSidebarOpen = () => {
    setEditParams({ id: null, label: null })
    setResetForm(true)
    setOpenDrawer(true)
  }

  const handleSubmitData = async payload => {
    try {
      setSubmitLoader(true)
      var response
      if (editParams?.id !== null) {
        response = await updateMortalityReasons(editParams?.id, payload)
      } else {
        response = await addMortalityReasons(payload)
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
  }

  // const confirmDeleteAction = async () => {
  //   try {
  //     setBtnLoader(true)
  //     const res = await deleteMortalityReasons(selectedId)
  //     if (res?.success) {
  //       setBtnLoader(false)
  //       setIsModalOpenDelete(false)
  //       Toaster({ type: 'success', message: res?.message })
  //       await fetchTableData()
  //     } else {
  //       setBtnLoader(false)
  //       setIsModalOpenDelete(false)
  //       Toaster({ type: 'error', message: res?.message })
  //     }
  //   } catch (error) {
  //     console.error('Error uploading files:', error)
  //   } finally {
  //     setBtnLoader(false)
  //     setIsModalOpenDelete(false)
  //   }
  // }

  const handleDelete = (event, testId) => {
    event.stopPropagation()
    console.log('Delete:', testId)
    setIsModalOpenDelete(true)
    setSelectedId(testId?.id)
  }

  const columns = [
    {
      flex: 0.3,
      minWidth: 30,
      sortable: false,
      field: 'Mortality Reasons',
      headerName: 'Mortality Reasons',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography noWrap variant='body2' sx={{ color: 'text.primary', pl: 2 }}>
            {params.row.name ? params.row.name : '-'}
          </Typography>
        </Box>
      )
    },

    {
      flex: 0.3,
      Width: 30,
      field: 'Description ',
      headerName: 'Description ',
      sortable: false,
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography noWrap variant='body2' sx={{ color: 'text.primary', pl: 2 }}>
            {params.row.description ? params.row.description : 'NA'}
          </Typography>
        </Box>
      )
    },

    // {
    //   flex: 0.4,
    //   minWidth: 40,
    //   field: 'user_name',
    //   headerName: 'CREATED BY',
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
    //           background: theme.palette.customColors.displaybgPrimary,
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
    //         <Typography noWrap variant='body2' sx={{ color:  theme.palette.customColors.neutralSecondary, fontSize: 12 }}>
    //           {params.row.created_at ? moment(params.row.created_at).format('DD/MM/YYYY') : '-'}
    //         </Typography>
    //       </Box>
    //     </Box>
    //   )
    // },
    {
      flex: 0.2,
      minWidth: 30,
      field: 'Action',
      headerName: 'Action',
      sortable: false,
      renderCell: params => (
        <>
          {parseInt(params.row.zoo_id) === 0 ? null : (
            <Box>
              <IconButton size='small' sx={{ mr: 0.5 }} onClick={e => handleEdit(e, params.row)} aria-label='Edit'>
                <Icon icon='mdi:pencil-outline' />
              </IconButton>
              {/* <IconButton size='small' sx={{ mr: 0.5 }} onClick={e => handleDelete(e, params.row)} aria-label='delete'>
              <Icon icon='mdi:delete-outline' />
            </IconButton> */}
            </Box>
          )}
        </>
      )
    }
  ]

  // const handleCellClick = params => {
  //   setEditParams(params)
  //   setOpenDetailsDrawer(true)
  // }

  const headerAction = (
    <div>
      <Button size='medium' variant='contained' onClick={() => addEventSidebarOpen()}>
        <Icon icon='mdi:add' fontSize={20} />
        &nbsp; Add New
      </Button>
    </div>
  )

  return (
    <>
      {medical_add_mortality_reasons ? (
        <>
          <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
            <Typography sx={{ cursor: 'pointer' }} color='inherit'>
              Lab Master
            </Typography>
            <Typography
              sx={{
                color: 'text.primary',
                cursor: 'pointer'
              }}
            >
              Mortality Reason
            </Typography>
          </Breadcrumbs>
          <Card>
            {/* <TableWithFilter
              TableTitle='Mortality Reason'
              columns={columns || []}
              rows={rows || []}
              headerActions={headerAction}
            /> */}
            <CardHeader
              title={'Mortality Reason'}
              sx={{ paddingX: 5 }}
              action={headerAction !== undefined ? headerAction : null}
            />
            <DataGrid
              sx={{
                paddingX: 5,
                borderTopLeftRadius: '8px',
                '& .MuiBox-root': {
                  paddingX: 0
                },
                '.MuiDataGrid-main': {
                  border: `1px solid ${theme.palette.customColors.mdAntzNeutral}`,
                  borderRadius: '8px'
                },
                '& .MuiDataGrid-footerContainer': {
                  border: 'none !important'
                },
                '.MuiDataGrid-cell:focus': {
                  outline: 'none'
                },

                '& .MuiDataGrid-row:hover': {
                  cursor: 'pointer'
                }
              }}
              autoHeight
              disableColumnFilter
              hideFooterSelectedRowCount
              disableColumnMenu
              disableColumnSelector={true}
              columns={columns || []}
              pageSizeOptions={[7, 10, 25, 50]}
              paginationModel={paginationModel}
              slots={{ toolbar: QuickSearchToolbar }}
              onPaginationModelChange={setPaginationModel}
              rows={filteredData.length ? filteredData : data}
              slotProps={{
                baseButton: {
                  variant: 'outlined'
                },
                toolbar: {
                  value: searchText,
                  clearSearch: () => handleSearch(''),
                  onChange: event => handleSearch(event.target.value)
                }
              }}
            />
          </Card>
          {openDrawer && (
            <AddMortalityReasons
              addEventSidebarOpen={openDrawer}
              setOpenDrawer={setOpenDrawer}
              handleSubmitData={handleSubmitData}
              resetForm={resetForm}
              submitLoader={submitLoader}
              editParams={editParams}
            />
          )}

          {/* <ConfirmationDeleteDialog
            open={isModalOpenDelete}
            onClose={() => setIsModalOpenDelete(false)}
            confirmLoading={btnLoader}
            onConfirm={confirmDeleteAction}
            title='Are you sure you want to delete this Mortality Reason?'
          /> */}
        </>
      ) : (
        <>
          <Error404></Error404>
        </>
      )}
    </>
  )
}

export default MortalityReason
