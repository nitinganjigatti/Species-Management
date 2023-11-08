import React, { useState, useEffect } from 'react'

import { getMedicineList } from 'src/lib/api/getMedicineList'
import { IMAGE_BASE_URL } from 'src/constants/ApiConstant'

// import { getMedicineConfig } from 'src/lib/api/getMedicineConfig'
import TableWithFilter from 'src/components/TableWithFilter'
import Button from '@mui/material/Button'
import FallbackSpinner from 'src/@core/components/spinner/index'

// ** MUI Imports

import Typography from '@mui/material/Typography'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { Box, Avatar, Badge } from '@mui/material'
import IconButton from '@mui/material/IconButton'
import Router from 'next/router'
import CommonDialogBox from 'src/components/CommonDialogBox'
import MedicineConfigure from 'src/components/pharmacy/medicine/MedicineConfigure'

const ListOfMedicine = () => {
  const [medicineList, setMedicineList] = useState([])
  const [loader, setLoader] = useState(false)
  const [show, setShow] = useState(false)
  const [configureMedId, setConfigureMedId] = useState('')

  const closeDialog = () => {
    setShow(false)
  }

  const showDialog = () => {
    setShow(true)
  }

  const getMedicinesLists = async () => {
    setLoader(true)
    const response = await getMedicineList()
    if (response?.length > 0) {
      console.log('list', response)

      // response.sort((a, b) => a.id - b.id)
      let listWithId = response
        ? response.map((el, i) => {
            return { ...el, uid: i + 1 }
          })
        : []
      setMedicineList(listWithId)
      setLoader(false)
    } else {
      setLoader(false)
    }
  }

  const handleEdit = async id => {
    Router.push({
      pathname: '/pharmacy/medicine/medicine/add-medicine',
      query: { id: id, action: 'edit' }
    })
  }

  useEffect(() => {
    console.log(IMAGE_BASE_URL)
    getMedicinesLists()

    // configureMedicine()
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
      headerName: 'MEDICINE NAME',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.name}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'generic_names',
      headerName: 'GENERIC',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.generic_names}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'categories_name',
      headerName: 'CATEGORY',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.categories_name}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'type_name',
      headerName: 'DOSAGE FORM',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.type_name}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'unit_name',
      headerName: 'UOM',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.unit_name}
        </Typography>
      )
    },
    {
      flex: 0.2,
      minWidth: 20,
      field: 'leaf_name',
      headerName: 'LEAFS',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary' }}>
          {params.row.leaf_name}
        </Typography>
      )
    },

    // {
    //   flex: 0.2,
    //   minWidth: 20,
    //   field: 'gst_name',
    //   headerName: 'GST',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {params.row.gst_name}
    //     </Typography>
    //   )
    // },

    {
      flex: 0.2,
      minWidth: 20,
      field: 'image',
      headerName: 'IMAGE',
      renderCell: params => (
        <Badge
          overlap='circular'
          sx={{ ml: 2, cursor: 'pointer' }}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right'
          }}
        >
          <Avatar
            alt='Medicine image'
            sx={{ width: 40, height: 40 }}
            src={params.row.image ? `${IMAGE_BASE_URL}${params.row.image}` : '/images/tablet.PNG'}
          />
        </Badge>
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
        <Box sx={{ marginLeft: -6 }}>
          <IconButton size='small' onClick={() => handleEdit(params.row.id)} aria-label='Edit'>
            <Icon icon='mdi:pencil-outline' />
          </IconButton>
          <IconButton
            size='small'
            onClick={() => {
              setConfigureMedId(params.row.id)
              showDialog()
            }}
          >
            <Icon icon='grommet-icons:configure' />
          </IconButton>
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

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <>
          <CommonDialogBox
            title={'Configure Medicine'}
            dialogBoxStatus={show}
            formComponent={<MedicineConfigure configureMedId={configureMedId} />}
            close={closeDialog}
            show={showDialog}
          />
          <TableWithFilter
            TableTitle={medicineList.length > 0 ? 'Medicine List' : 'Medicine List is empty add Medicine'}
            headerActions={
              <div>
                <Button
                  size='big'
                  variant='contained'
                  onClick={() => {
                    Router.push('/pharmacy/medicine/medicine/add-medicine')
                  }}
                >
                  Add Medicine
                </Button>
              </div>
            }
            columns={columns}
            rows={medicineList}
          />
        </>
      )}
    </>
  )
}

export default ListOfMedicine
