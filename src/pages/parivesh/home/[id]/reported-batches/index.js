// src/pages/RepotedBatch.js

import React, { useState } from 'react'

import moment from 'moment'
import CustomTable from 'src/components/parivesh/CustomTable'
import { Avatar, IconButton, Typography } from '@mui/material'
import { Box } from '@mui/system'
import Icon from 'src/@core/components/icon'
import Router from 'next/router'

const ReportedBatches = ({ searchParams }) => {
  const [rows, setRows] = useState([
    {
      batchId: '#BA12354',
      id: '22',
      registration_id: 'WL/GJ/132549',
      of_species: '555',
      of_animals: '2501',
      created_at: '2024-06-03 16:07:17',
      approved_date: '2024-06-06 16:07:17',
      status: 'Yet to Submitted',
      submitted_by_user: {
        user_name: 'sr',
        email: 'sr@mailinator.com',
        profile_pic: 'https://api.dev.antzsystems.com/uploads/11/diet/ingredients/665d9cdd975011717411037.jpg'
      }
    }
  ])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [dialog, setDialog] = useState(false)
  const [check, setCheck] = useState(false)

  const handleSearch = value => {
    setSearchValue(value)
    // Call searchTableData or similar function
  }

  const onClose = () => {
    setDialog(false)
  }

  const onCellClick = params => {
    const { id, batchId } = params.row
    Router.push(`/parivesh/home/${id}/batch-details?batchId=${batchId}`)
    // Router.push({
    //   pathname: '/parivesh/home//batch-details'
    // })

    // debugger
    // const clickedColumn = params.field !== 'switch'
    // if (clickedColumn) {
    //   const data = params.row
    //   Router.push({
    //     pathname: `/parivesh/home/batch-list/batch-details`
    //   })
    // } else {
    //   return
    // }
  }

  const columns = [
    {
      flex: 0.2,
      Width: 40,
      field: 'batchId',
      headerName: 'BATCH ID',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.batchId}
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
      field: 'of_animals',
      headerName: '# OF ANIMALS',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.of_animals ? params.row.of_animals : '-'}
        </Typography>
      )
    },
    {
      flex: 0.3,
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
              {params.row.created_at ? moment(params.row.created_at).format('DD/MM/YYYY') : '-'}
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
          <IconButton>
            <Icon icon='mdi:edit' />
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
        rows={rows}
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
    </>
  )
}

export default ReportedBatches
