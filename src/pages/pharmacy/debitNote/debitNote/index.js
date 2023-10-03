import React, { useState, useEffect } from 'react'

import { getDebitNote } from 'src/lib/api/getDebitNote'
import TableWithFilter from 'src/components/TableWithFilter'
import Button from '@mui/material/Button'
import FallbackSpinner from 'src/@core/components/spinner/index'

// ** MUI Imports
import IconButton from '@mui/material/IconButton'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box } from '@mui/material'

import Router from 'next/router'

const ListOfDebitNote = () => {
  const [debitList, setDebitList] = useState([])
  const [loader, setLoader] = useState(false)

  const getDebitLists = async () => {
    setLoader(true)
    const response = await getDebitNote()
    if (response?.length > 0) {
      console.log('list', response)
      response.sort((a, b) => a.id - b.id)
      setDebitList(response)
      setLoader(false)
    } else {
      setLoader(false)
    }
  }

  useEffect(() => {
    getDebitLists()
  }, [])

  const columns = [
    {
      flex: 0.05,
      Width: 40,
      field: 'id',
      headerName: 'SL ',
      renderCell: (params, rowId) => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.id}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'debit_note_no',
      headerName: 'RETURN NO',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.debit_note_no}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'supplier_name',
      headerName: 'SUPPLIER NAME',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.supplier_name}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'debit_note_date',
      headerName: 'DATE',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.debit_note_date}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'total_amount',
      headerName: 'TOTAL AMOUNT',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.total_amount}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'tax_amount',
      headerName: 'TAX AMOUNT',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.tax_amount}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'discount_amount',
      headerName: 'DISCOUNT AMOUNT',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.discount_amount}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'Action',
      headerName: 'Action',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'right', textAlign: 'right' }}>
          {/* <IconButton size='small' sx={{ mr: 0.5 }}>
            <Icon icon='mdi:eye-outline' />
          </IconButton> */}
          <IconButton size='small' sx={{ mr: 0.5 }}>
            <Icon icon='mdi:pencil-outline' />
          </IconButton>
          {/* <IconButton size='small' sx={{ mr: 0.5 }}>
            <Icon icon='mdi:delete-outline' />
          </IconButton> */}
        </Box>
      )
    }
  ]

  const handleHeaderAction = () => {
    console.log('Handle Header Action')
  }

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <TableWithFilter
          TableTitle={debitList.length > 0 ? 'Debit note List' : 'Debit note List is empty add Debit note List'}
          headerActions={
            <div>
              <Button size='big' variant='contained'>
                Add Debit note
              </Button>
            </div>
          }
          columns={columns}
          rows={debitList}
        />
      )}
    </>
  )
}

export default ListOfDebitNote
