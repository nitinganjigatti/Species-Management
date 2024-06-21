// src/pages/RepotedBatch.js

import React, { useCallback, useEffect, useState } from 'react'

import moment from 'moment'
import CustomTable from 'src/components/parivesh/CustomTable'
import { Avatar, Button, Dialog, DialogContent, DialogTitle, IconButton, Typography, debounce } from '@mui/material'
import { Box } from '@mui/system'
import Icon from 'src/@core/components/icon'
import Router from 'next/router'
import { getBatchListSpecies } from 'src/lib/api/parivesh/batchListSpecies'
import { usePariveshContext } from 'src/context/PariveshContext'
import { useTheme } from '@emotion/react'
import { LoadingButton } from '@mui/lab'
import { deleteBatchToOrg } from 'src/lib/api/parivesh/addBatch'
import Toaster from 'src/components/Toaster'

const ReportedBatches = ({ searchParams, type }) => {
  const theme = useTheme()
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [dialog, setDialog] = useState(false)
  const [check, setCheck] = useState(false)
  const [sort, setSort] = useState('desc')
  const [sortColumn, setSortColumn] = useState('batch_code')
  const { selectedParivesh } = usePariveshContext()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [btnLoader, setBtnLoader] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

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
          status: 'yet_to_submitted',
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
      org_id: selectedParivesh.id !== 'all' ? selectedParivesh.id : null
    }
    try {
      setIsModalOpen(false)
      const response = await deleteBatchToOrg(payload, selectedId)
      if (response.success === true) {
        Toaster({ type: 'success', message: `Batch ${selectedId} has been successfully deleted` })
        // Reload the table data
        fetchTableData(sort, searchValue, sortColumn)
      } else {
        Toaster({ type: 'error', message: 'something went wrong' })
      }
    } catch (error) {}
  }

  const columns = [
    {
      flex: 0.2,
      Width: 40,
      field: 'batch_id',
      headerName: 'BATCH ID',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.batch_id}
        </Typography>
      )
    },
    {
      flex: 0.2,
      Width: 40,
      field: 'batch_code',
      headerName: 'BATCH CODE',
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
      field: 'no_of_animals',
      headerName: '# OF ANIMALS',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.no_of_animals ? params.row.no_of_animals : '-'}
        </Typography>
      )
    },

    {
      flex: 0.5,
      minWidth: 60,
      field: 'submitted_by_user',
      headerName: 'SUBMITTED BY',

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
              {params.row.submitted_on ? moment(params.row.submitted_on).format('DD/MM/YYYY') : '-'}
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      flex: 0.3,
      minWidth: 20,
      field: 'status',
      headerName: 'Status',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: '#E93353' }}>
          {params.row.status ? params.row.status : '-'}
        </Typography>
      )
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

  return (
    <>
      <CustomTable
        rows={indexedRows === undefined ? [] : indexedRows}
        columns={columns}
        total={total}
        loading={loading}
        searchValue={searchValue}
        paginationModel={paginationModel}
        setPaginationModel={setPaginationModel}
        handleSearch={handleSearch}
        onCellClick={onCellClick}
        dialog={dialog}
        onClose={onClose}
        check={check}
        setCheck={setCheck}
        headerAction={headerAction}
        title={'Reported Batches'}
        searchParams={searchParams}
      />
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
                Are you sure you want to delete this Batch?
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
  )
}

export default ReportedBatches
