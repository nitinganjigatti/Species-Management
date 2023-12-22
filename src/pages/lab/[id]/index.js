/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable lines-around-comment */
import React, { useState, useEffect, useCallback } from 'react'

import { getLabList } from 'src/lib/api/addLab'
import { IMAGE_BASE_URL } from 'src/constants/ApiConstant'

// import { getMedicineConfig } from 'src/lib/api/getMedicineConfig'
import Button from '@mui/material/Button'
import FallbackSpinner from 'src/@core/components/spinner/index'

// ** MUI Imports

import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import { DataGrid } from '@mui/x-data-grid'
import Card from '@mui/material/Card'
import ServerSideToolbar from 'src/views/table/data-grid/ServerSideToolbar'
import { debounce } from 'lodash'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import {
  Box,
  Stack,
  Dialog,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material'
import IconButton from '@mui/material/IconButton'
import Router from 'next/router'
import CommonDialogBox from 'src/components/CommonDialogBox'
import MedicineConfigure from 'src/components/pharmacy/medicine/MedicineConfigure'
import Utility from 'src/utility'
import { LoadingButton } from '@mui/lab'

const RequestDetails = () => {
  const [loader, setLoader] = useState(false)
  const [rows, setRows] = useState([])
  const [popUpRow, setPopUpRow] = useState([])
  console.log('rows', rows)
  const [loading, setLoading] = useState(false)
  const { id } = Router.query
  console.log('id', id)

  const [open, setOpen] = React.useState(false)

  const handleClickOpen = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  const columns = [
    // {
    //   flex: 0.05,
    //   Width: 40,
    //   field: 'id',
    //   headerName: 'SL ',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {parseInt(params.row.sl_no)}
    //     </Typography>
    //   )
    // },
    {
      flex: 0.3,
      minWidth: 20,
      field: 'lab_name',
      headerName: 'Test Type',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.lab_name}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'type',
      headerName: 'Sample Type',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          <span alt={params.row.type}>{params.row.type}</span>
        </Typography>
      )
    },

    // {
    //   flex: 0.4,
    //   minWidth: 20,
    //   field: 'package',
    //   headerName: 'PACKAGE',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {`${params.row.package} of ${Utility.formatNumber(params.row.package_qty)}
    //       ${params.row.package_uom_label} ${params.row.product_form_label}`}
    //     </Typography>
    //   )
    // },
    {
      flex: 0.4,
      minWidth: 20,
      field: 'address',
      headerName: 'Sample id',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          <span alt={params.row.address}>{params.row.address}</span>
        </Typography>
      )
    },

    // {
    //   flex: 0.3,
    //   minWidth: 20,
    //   field: 'created_at',
    //   headerName: 'Date',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {Utility.formatDate(params.row.created_at)}
    //     </Typography>
    //   )
    // },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'status',
      headerName: 'STATUS',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {parseInt(params.row.status) === 0 ? 'Inactive' : 'Active'}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'Action',
      headerName: 'Action',

      renderCell: params => (
        <Box>
          <IconButton size='small' onClick={() => handleEdit(params.row.id)} aria-label='Edit'>
            <Icon icon='mdi:pencil-outline' />
          </IconButton>
          {/* <IconButton
              size='small'
              onClick={() => {
                setConfigureMedId(params.row.id)
                showDialog()
              }}
            >
              <Icon icon='grommet-icons:configure' />
            </IconButton> */}
          {/* <IconButton size='small'>
              <Icon icon='mdi:eye-outline' />
            </IconButton>

            <IconButton size='small'>
              <Icon icon='mdi:file' />
            </IconButton> */}
        </Box>
      )
    }
  ]

  const indexedRows = rows?.map((row, index) => ({
    ...row,
    sl_no: getSlNo(index)
  }))

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <>
          <Card sx={{ p: 5 }}>
            <IconButton sx={{ mr: 1 }} onClick={() => Router.back()}>
              <Icon icon='ep:back' fontSize={25} color={'#37BD69'} />
            </IconButton>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant='h6'>
                  Request -{' '}
                  <span
                    onClick={handleClickOpen}
                    style={{ color: '#37BD69', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    1234567890
                  </span>
                </Typography>
                <Typography>14 Nov 2023 14:30</Typography>
              </Box>
              <Box gap={2} sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                  sx={{
                    bgcolor: '#EDEDFF',
                    display: 'flex',
                    width: 40,
                    height: 40,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: '10px'
                  }}
                >
                  <Icon icon='ion:location-outline' fontSize={25} color={'#37BD69'} />
                </Box>
                <Typography variant='h6'>
                  Site - <span style={{ color: '#37BD69', fontSize: '20px', fontWeight: 'bold' }}>GAGWA</span>
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 6 }}>
              <Stack direction='row' gap={3}>
                <Typography>
                  No. of Tests : <span style={{ fontSize: '15px', fontWeight: 'bold' }}>10</span>
                </Typography>
                <Typography>
                  No. of Samples : <span style={{ fontSize: '15px', fontWeight: 'bold' }}>10</span>
                </Typography>
              </Stack>

              <Typography>
                Request by - <span style={{ fontSize: '15px', fontWeight: 'bold' }}>12345678</span>
              </Typography>
            </Box>
          </Card>

          <Card sx={{ mt: 5 }}>
            <CardHeader
              title='Test Reports'
              //  action={headerAction}
            />

            <DataGrid
              autoHeight
              // pagination
              rows={indexedRows === undefined ? [] : indexedRows}
              // rowCount={total}
              columns={columns}
              sortingMode='server'
              // paginationMode='server'
              // pageSizeOptions={[7, 10, 25, 50]}
              // paginationModel={paginationModel}
              // onSortModelChange={handleSortModel}
              slots={{ toolbar: ServerSideToolbar }}
              // onPaginationModelChange={setPaginationModel}
              loading={loading}
              // slotProps={{
              //   baseButton: {
              //     variant: 'outlined'
              //   },
              //   toolbar: {
              //     value: searchValue,
              //     clearSearch: () => handleSearch(''),

              //     onChange: event => {
              //       setSearchValue(event.target.value)

              //       return handleSearch(event.target.value)
              //     }
              //   }
              // }}
            />

            <Box>
              <Box sx={{ p: 5, display: 'flex', justifyContent: 'flex-end' }}>
                <LoadingButton variant='contained'>UPLOAD REPORT</LoadingButton>
              </Box>
              <Box sx={{ p: 5 }}>
                <Typography variant='h6'>Reports</Typography>
                <Typography>Images</Typography>
                <Typography>Documents</Typography>
              </Box>
            </Box>
          </Card>
        </>
      )}

      <>
        {/* Open PopUp On Clicking Request Id */}
        <Dialog open={open} onClose={handleClose}>
          <Card sx={{ p: 2, minWidth: 600 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <IconButton onClick={handleClose}>
                <Icon icon='ep:close-bold' fontSize={15} color={'red'} />
              </IconButton>
            </Box>
            <Box ml={3}>
              <Typography variant='h6'>
                Request - <span style={{ color: '#37BD69', fontWeight: 'bold' }}>123456780</span>
              </Typography>
              <Typography>14 Nov 2023 14:30</Typography>
              <Typography>
                Site - <span style={{ fontSize: '15px', fontWeight: 'bold' }}>Gagwa</span>
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, ml: 3, mr: 3 }}>
              <Box gap={4} sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography>
                  No. of Tests : <span style={{ fontWeight: 'bold' }}>10</span>
                </Typography>
                <Typography>
                  No. of Samples : <span style={{ fontWeight: 'bold' }}>5</span>
                </Typography>
              </Box>
              <Typography>
                Request By - <span style={{ fontWeight: 'bold' }}>asdfghjk</span>
              </Typography>
            </Box>

            <Box mt={2}>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#F5F5F7' }}>
                      <TableCell>Data</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* {data.map(row => ( */}
                    <TableRow
                    // key={row.id}
                    >
                      <TableCell>id</TableCell>
                      <TableCell>name</TableCell>
                      <TableCell>status</TableCell>
                    </TableRow>
                    {/* ))} */}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Card>
        </Dialog>
      </>
    </>
  )
}

export default RequestDetails
