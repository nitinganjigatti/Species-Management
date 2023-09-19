import React, { useState, useEffect } from 'react'

import { getDrugs } from 'src/lib/api/getDrugs'
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

const ListOfDrugs = () => {
  const [drugClass, setDrugClass] = useState([])
  const [loader, setLoader] = useState(false)

  const getDrugsLists = async () => {
    setLoader(true)
    const response = await getDrugs()
    if (response?.length > 0) {
      console.log('list', response)
      response.sort((a, b) => a.id - b.id)
      setDrugClass(response)
      setLoader(false)
    } else {
      setLoader(false)
    }

    // setSupplierList(response);
  }

  useEffect(() => {
    getDrugsLists()
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
      headerName: 'NAME',
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
      {/* {gstList.length > 0 ? ( */}

      {loader ? (
        <FallbackSpinner />
      ) : (
        <TableWithFilter
          TableTitle={drugClass.length > 0 ? 'Drug Class List' : 'Drug class list is empty add drug class'}
          headerActions={
            <div>
              <Button
                size='big'
                variant='contained'

                // onClick={() => {
                //   Router.push('/pharmacy/supplier/add-supplier')
                // }}
              >
                Add Drug class
              </Button>
            </div>
          }
          columns={columns}
          rows={drugClass}
        />
      )}
    </>
  )
}

export default ListOfDrugs
