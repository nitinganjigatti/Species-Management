import React, { useState, useEffect } from 'react'

import { getGstList } from 'src/lib/api/getGstList'
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

const ListOfGst = () => {
  const [gstList, setGstList] = useState([])
  const [loader, setLoader] = useState(false)

  const getGstLists = async () => {
    setLoader(true)
    const response = await getGstList()
    if (response?.length > 0) {
      console.log('list', response)
      response.sort((a, b) => a.id - b.id)
      setGstList(response)
      setLoader(false)
    } else {
      setLoader(false)
    }
  }

  useEffect(() => {
    getGstLists()
  }, [])

  const columns = [
    {
      flex: 0.05,
      Width: 40,
      field: 'id',
      headerName: 'SL ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.id}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'name',
      headerName: 'TAX NAME',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.name}
        </Typography>
      )
    },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'tax',
      headerName: 'TAX',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.tax}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'status',
      headerName: 'STATUS',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.status}
        </Typography>
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
          TableTitle={gstList.length > 0 ? 'GST List' : 'GST list is empty add GST'}
          headerActions={
            <div>
              <Button size='big' variant='contained'>
                Add GSt
              </Button>
            </div>
          }
          columns={columns}
          rows={gstList}
        />
      )}
    </>
  )
}

export default ListOfGst
