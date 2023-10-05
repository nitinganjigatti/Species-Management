import React, { useState, useEffect } from 'react'

import { getUnits } from 'src/lib/api/getUnits'
import TableWithFilter from 'src/components/TableWithFilter'
import Button from '@mui/material/Button'
import FallbackSpinner from 'src/@core/components/spinner/index'

// ** MUI Imports

import Typography from '@mui/material/Typography'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box, Drawer } from '@mui/material'
import IconButton from '@mui/material/IconButton'

import Router from 'next/router'

const ListOfUOM = () => {
  const [uomList, setUomList] = useState([])
  const [loader, setLoader] = useState(false)

  const getUOMLists = async () => {
    setLoader(true)
    const response = await getUnits()
    if (response?.length > 0) {
      console.log('list', response)

      // response.sort((a, b) => a.id - b.id)
      let listWithId = response
        ? response.map((el, i) => {
            return { ...el, uid: i + 1 }
          })
        : []
      setUomList(listWithId)
      setLoader(false)
    } else {
      setLoader(false)
    }
  }

  const handleEdit = async (id, name, status) => {}

  useEffect(() => {
    getUOMLists()
  }, [])

  const columns = [
    {
      flex: 0.05,
      Width: 40,
      field: 'uid',
      headerName: 'SL ',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.uid}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'name',
      headerName: 'UOM NAME',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.name}
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
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'Action',
      headerName: 'Action',
      renderCell: params => (
        <Box sx={{ display: 'flex', alignItems: 'right', textAlign: 'right' }}>
          <IconButton size='small' sx={{ mr: 0.5 }} onClick={() => handleEdit(params.row.id)} aria-label='Edit'>
            <Icon icon='mdi:pencil-outline' />
          </IconButton>
        </Box>
      )
    }
  ]

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <>
          <TableWithFilter
            TableTitle={
              uomList.length > 0 ? 'UOM (Unit of Measurement) List' : 'UOM (Unit of Measurement) List is empty add UOM'
            }
            headerActions={
              <div>
                <Button size='big' variant='contained'>
                  Add UOM
                </Button>
              </div>
            }
            columns={columns}
            rows={uomList}
          />
        </>
      )}
    </>
  )
}

export default ListOfUOM
