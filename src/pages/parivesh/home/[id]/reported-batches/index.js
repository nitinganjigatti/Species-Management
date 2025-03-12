import React, { useCallback, useContext, useEffect, useState } from 'react'
import moment from 'moment'
import {
  Avatar,
  Button,
  Card,
  CardHeader,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Typography,
  debounce
} from '@mui/material'
import { Box } from '@mui/system'
import Icon from 'src/@core/components/icon'
import Router from 'next/router'
import { getBatchListSpecies } from 'src/lib/api/parivesh/batchListSpecies'
import { usePariveshContext } from 'src/context/PariveshContext'
import { useTheme } from '@emotion/react'
import { LoadingButton } from '@mui/lab'
import { deleteBatchToOrg } from 'src/lib/api/parivesh/addBatch'
import Toaster from 'src/components/Toaster'
import FallbackSpinner from 'src/@core/components/spinner'
import ConfirmationDialog from 'src/components/confirmation-dialog'
import ConfirmationCheckBox from 'src/views/forms/form-elements/confirmationCheckBox'
import { DataGrid } from '@mui/x-data-grid'
import ServerSideToolbarWithFilter from 'src/views/table/data-grid/ServerSideToolbarWithFilter'
import Utility from 'src/utility'
import { AuthContext } from 'src/context/AuthContext'
import Error404 from 'src/pages/404'

const ReportedBatches = ({ type }) => {
  const theme = useTheme()
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [dialog, setDialog] = useState(false)
  const [check, setCheck] = useState(false)
  const [sortBy, setSortBy] = useState('DESC')
  const [sortColumn, setSortColumn] = useState('batch_code')
  const { selectedParivesh } = usePariveshContext()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [btnLoader, setBtnLoader] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [loader, setLoader] = useState(false)
  const authData = useContext(AuthContext)
  const pariveshAccess = authData?.userData?.roles?.settings?.enable_parivesh

  const handleSortModel = newModel => {
    console.log(newModel, 'newModel')
    if (newModel.length) {
      const newSort = newModel[0].sort === 'asc' ? 'DESC' : 'ASC' // Invert the sort direction
      setSortBy(newSort)
      setSortColumn(newModel[0].field)
      fetchTableData(newSort, searchValue, newModel[0].field) // Use the inverted sort direction here
    } else {
      // Handle the case where newModel is empty, if necessary
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
    searchTableData(sortBy, value, sortColumn)
  }

  const onClose = () => {
    setDialog(false)
  }

  function loadServerRows(currentPage, data) {
    return data
  }

  const fetchTableData = useCallback(
    async (sortBy, q, sortColumn) => {
      try {
        setLoading(true)

        const params = {
          q,
          status: 'yet_to_submitted',
          page: paginationModel.page + 1,
          sortBy,
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
    fetchTableData(sortBy, searchValue, sortColumn)
  }, [fetchTableData])

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  const onCellClick = params => {
    // const { id, batchId } = params.row
    // Router.push(`/parivesh/home/${id}/batch-details?batchId=${batchId}`)
    console.log(params.row)
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

  const handleDelete = async id => {
    setSelectedId(id)
    setIsModalOpen(true)
  }

  const confirmDeleteAction = async () => {
    const payload = {
      org_id: selectedParivesh.id
    }
    try {
      setIsModalOpen(false)
      const response = await deleteBatchToOrg(payload, selectedId)
      if (response.success === true) {
        Toaster({ type: 'success', message: `Batch has been successfully deleted` })
        // Reload the table data
        fetchTableData(sortBy, searchValue, sortColumn)
      } else {
        Toaster({ type: 'error', message: 'something went wrong' })
      }
    } catch (error) {}
  }

  const columns = [
    // {
    //   flex: 0.2,
    //   Width: 40,
    //   field: 'batch_id',
    //   headerName: 'BATCH ID',
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
      flex: 0.2,
      Width: 40,
      field: 'batch_code',
      headerName: 'BATCH ID',
      sortable: false,
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.batch_code}
        </Typography>
      )
    },
    // {
    //   flex: 0.4,
    //   minWidth: 30,
    //   field: 'registration_id',
    //   headerName: 'REGISTRATION ID',
    //   sortable: false,
    //   renderCell: params => (
    //     <Box sx={{ display: 'flex', alignItems: 'center' }}>
    //       <Box sx={{ display: 'flex', flexDirection: 'column' }}>
    //         <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: '14px', fontWeight: '500' }}>
    //           {params.row.registration_id ? params.row.registration_id : 'NA'}
    //         </Typography>
    //       </Box>
    //     </Box>
    //   )
    // },
    {
      flex: 0.3,
      minWidth: 10,
      field: 'no_of_animals',
      headerName: 'NO. OF ANIMALS',
      sortable: false,
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.no_of_animals ? params.row.no_of_animals : '-'}
        </Typography>
      )
    },

    // {
    //   flex: 0.5,
    //   minWidth: 60,
    //   field: 'submitted_by_user',
    //   headerName: 'SUBMITTED BY',
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
    //         {params.row.submitted_by_user?.profile_pic ? (
    //           <img
    //             style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    //             src={params.row.submitted_by_user?.profile_pic}
    //             alt='Profile'
    //           />
    //         ) : (
    //           <Icon icon='mdi:user' />
    //         )}
    //       </Avatar>
    //       <Box sx={{ display: 'flex', flexDirection: 'column' }}>
    //         <Typography noWrap variant='body2' sx={{ color: 'text.primary', fontSize: 14 }}>
    //           {params.row.submitted_by_user?.user_name ? params.row.submitted_by_user?.user_name : '-'}
    //         </Typography>
    //         <Typography noWrap variant='body2' sx={{ color: '#44544a9c', fontSize: 12 }}>
    //           {params.row.submitted_on ? moment(params.row.submitted_on).format('DD/MM/YYYY') : '-'}
    //         </Typography>
    //       </Box>
    //     </Box>
    //   )
    // },
    {
      flex: 0.5,
      minWidth: 60,
      field: 'created_by_user',
      headerName: 'CREATED BY',
      alignItems: 'left',
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
              {params.row.created_on
                ? Utility.formatDisplayDate(Utility.convertUTCToLocal(params.row.created_on))
                : '-'}
            </Typography>
          </Box>
        </Box>
      )
    },
    // {
    //   flex: 0.3,
    //   minWidth: 20,
    //   field: 'status',
    //   headerName: 'Status',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: '#E93353' }}>
    //       {params.row.status ? params.row.status : '-'}
    //     </Typography>
    //   )
    // },
    // {
    //   flex: 0.3,
    //   minWidth: 20,
    //   field: 'status',
    //   headerName: 'Status',
    //   renderCell: params => {
    //     let status = params.row.status ? params.row.status : '-'

    //     if (status !== '-') {
    //       status = status
    //         .split('_')
    //         .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    //         .join(' ')
    //     }

    //     return (
    //       <Typography variant='body2' sx={{ color: '#E93353' }}>
    //         {status}
    //       </Typography>
    //     )
    //   }
    // },
    {
      flex: 0.3,
      minWidth: 20,
      field: 'status',
      headerName: 'Status',
      renderCell: params => {
        return (
          <Typography variant='body2' sx={{ color: '#E93353' }}>
            {params.row.status ? 'Yet To Submit' : '-'}
          </Typography>
        )
      }
    },

    {
      flex: 0.3,
      minWidth: 10,
      field: 'actions',
      headerName: 'ACTIONS',
      renderCell: params => (
        <Box>
          {/* <IconButton
            size='small'
            sx={{ mr: 0.5 }}
            onClick={event => {
              event.stopPropagation()

              console.log('Edit clicked', params)
              // Your edit logic here
            }}
            aria-label='Edit'
          >
            <Icon icon='mdi:edit' />
          </IconButton> */}
          <IconButton
            size='small'
            sx={{ mr: 0.5 }}
            onClick={event => {
              event.stopPropagation()
              handleDelete(params.row.batch_id)
              console.log('delete clicked', params)
              // Your edit logic here
            }}
            aria-label='delete'
          >
            <Icon icon='mdi:delete-outline' />
          </IconButton>
        </Box>
      )
    }
  ]
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
            <CardHeader title={'To be Submitted'} action={headerAction} />
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

  return (
    <>
      {pariveshAccess ? (
        <>
          <Grid>{tableData()}</Grid>
          <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)}>
            <DialogTitle>
              <IconButton
                aria-label='close'
                onClick={() => setIsModalOpen(false)}
                sx={{ top: 10, right: 10, position: 'absolute', color: 'grey.500' }}
              >
                <Icon icon='mdi:close' />
              </IconButton>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '32px',

                  // padding: '40px',
                  alignItems: 'center'
                }}
              >
                <Box
                  sx={{
                    padding: '16px',
                    borderRadius: '12px',
                    backgroundColor: theme.palette.customColors.mdAntzNeutral
                  }}
                >
                  <Icon width='70px' height='70px' color={'#ff3838'} icon={'mdi:delete'} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: 24, textAlign: 'center', mb: '12px' }}>
                    Are you sure you want to delete this batch?
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-evenly', width: '100%' }}>
                  <Button
                    loading={btnLoader}
                    onClick={() => setIsModalOpen(false)}
                    variant='outlined'
                    sx={{
                      color: 'gray',
                      width: '45%'
                    }}
                  >
                    Cancel
                  </Button>

                  <LoadingButton
                    loading={btnLoader}
                    size='large'
                    variant='contained'
                    sx={{ width: '45%' }}
                    onClick={() => confirmDeleteAction()}
                  >
                    Delete
                  </LoadingButton>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent />
          </Dialog>
        </>
      ) : (
        <Error404></Error404>
      )}
    </>
  )
}

export default ReportedBatches
