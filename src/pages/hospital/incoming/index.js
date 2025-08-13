import { useTheme } from '@emotion/react'
import { Box, Button, Card, CardHeader, Grid, MenuItem, Select, Typography } from '@mui/material'
import { useState } from 'react'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import AnimalParentCard from 'src/views/utility/animalParentCard'
import { VisitType } from 'src/views/utility/render-snippets'
import Search from 'src/views/utility/Search'

const HospitalIncoming = () => {
  const theme = useTheme()
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10
  })

  const visitData = [
    {
      no: 1,
      animalId: 'AAID : 87546/24',
      name: 'Leopard',
      scientificName: 'Panthera pardus',
      gender: 'M',
      age: '4y 6m',
      site: 'R & R',
      medId: 'MED - 12345/25',
      purpose:
        'The patient is admitted due to acute eye pain and swelling, requiring immediate medical intervention and diagnostic tests.',
      visitType: { title: 'Check up' },
      requestedBy: {
        name: 'Ravi Sharma',
        date: '26 Aug 2025, 12:00 pm'
      },
      action: 'Admit'
    },
    {
      no: 2,
      animalId: 'AAID : 87547/24',
      name: 'Bengal Tiger',
      scientificName: 'Panthera tigris tigris',
      gender: 'F',
      age: '3y 2m',
      site: 'R & R',
      medId: 'MED - 23254/25',
      purpose:
        'The patient is admitted due to acute eye pain and swelling, requiring immediate medical intervention and diagnostic tests.',
      visitType: { title: 'Follow-up' },
      requestedBy: {
        name: 'Priya Singh',
        date: '26 Aug 2025, 12:00 pm'
      },
      action: 'Admit'
    },
    {
      no: 3,
      animalId: 'AAID : 87548/24',
      name: 'African Elephant',
      scientificName: 'Loxodonta africana',
      gender: 'M',
      age: '10y 8m',
      site: 'R & R',
      medId: 'MED - 454532/25',
      purpose:
        'The patient is admitted due to acute eye pain and swelling, requiring immediate medical intervention and diagnostic tests.',
      visitType: { title: 'Emergency' },
      requestedBy: {
        name: 'Anjali Verma',
        date: '26 Aug 2025, 12:00 pm'
      },
      action: 'Admit'
    },
    {
      no: 4,
      animalId: 'AAID : 87549/24',
      name: 'Snow Leopard',
      scientificName: 'Panthera uncia',
      gender: 'F',
      age: '2y 1m',
      site: 'R & R',
      medId: 'MED - 567566/25',
      purpose:
        'The patient is admitted due to acute eye pain and swelling, requiring immediate medical intervention and diagnostic tests.',
      visitType: { title: 'Planned' },
      requestedBy: {
        name: 'Vikram Patel',
        date: '26 Aug 2025, 12:00 pm'
      },
      action: 'Admit'
    }
  ]

  const getSlNo = index => (paginationModel.page + 1 - 1) * paginationModel.pageSize + index + 1

  const indexedRows = visitData?.map((row, index) => ({
    ...row,
    id: `${row.animalId}`,
    sl_no: getSlNo(index)
  }))

  const title = (
    <>
      <Typography
        sx={{
          ml: 1.5,
          fontSize: '20px',
          fontWeight: 500,
          fontFamily: 'Inter',
          color: theme.palette.customColors.OnSurfaceVariant
        }}
      >
        Incoming Patients
      </Typography>
    </>
  )

  const columns = [
    {
      flex: 0.4,
      minWidth: 20,
      sortable: false,
      field: 'NO',
      headerName: 'NO',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', p: 2 }}>
          {params.row.sl_no}
        </Typography>
      )
    },

    // {
    //   flex: 0.4,
    //   minWidth: 20,
    //   field: 'animal_name',
    //   headerName: 'Animal Name & ID',
    //   renderCell: params => (
    //     <>
    //     <AnimalParentCard data={params.row.}/>
    //     </>
    //     // <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //     //   {params.row.type_name ? params.row.type_name : ''}
    //     // </Typography>
    //   )
    // },

    {
      flex: 0.7,
      minWidth: 20,
      field: 'purpose',
      sortable: false,
      headerName: 'Purpose of Visit',
      renderCell: params => (
        <Typography
          variant='body2'
          sx={{
            fontSize: '14px',
            fontWeight: 400,
            fontFamily: 'Inter',
            color: theme.palette.customColors.OnSurfaceVariant,
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'normal'
          }}
        >
          <>
            {/* <VisitType title={params.row.medId} /> */}
            {params.row.purpose || ''}
          </>
        </Typography>
      )
    },
    {
      flex: 0.4,
      minWidth: 20,
      field: 'visit_type',
      sortable: false,
      headerName: 'Visit Type',
      renderCell: params => (
        <>
          <VisitType title={params.row.visitType.title} />
        </>
      )
    },

    // {
    //   flex: 0.4,
    //   minWidth: 20,
    //   field: 'requested_by',
    //   headerName: 'Requested By',
    //   renderCell: params => (
    //     <Typography variant='body2' sx={{ color: 'text.primary' }}>
    //       {params.row.requestedBy}
    //     </Typography>
    //   )
    // },

    {
      flex: 0.4,
      minWidth: 20,
      field: 'actions',
      sortable: false,
      headerName: 'Actions',
      renderCell: params => (
        <>
          <Button sx={{ borderRadius: 6 }} variant='contained'>
            Admit
          </Button>
        </>
      )
    }
  ]

  return (
    <>
      <Card>
        <CardHeader title={title} />
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ ml: 2 }}>
            <Search borderRadius='4px' width='343px' placeholder='Search by medical Id or animal id' />
          </Box>
          <Box sx={{ mr: 2 }}>
            <Select
              size='small'
              value={''}
              // onChange={event => handleChangeSize(event, item)}
              displayEmpty
              // error={visibility?.find(visItem => visItem && visItem.id === item.id)?.isVisible && !size[item.id]?.id}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.customColors.Outline
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.customColors.Outline
                },
                '& .MuiOutlinedInput-root': {
                  borderRadius: '0px'
                }
              }}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 300
                  }
                }
              }}
            >
              <MenuItem value='' disabled>
                All visit
              </MenuItem>
            </Select>
            <Box></Box>
          </Box>
        </Box>
        <Grid
          sx={{
            mx: { xs: 3, md: 5 }
          }}
        >
          <CommonTable
            onRowClick={''}
            indexedRows={indexedRows}
            total={10}
            handleSortModel={''}
            columns={columns}
            paginationModel={paginationModel}
            setPaginationModel={setPaginationModel}
            loading={''}
            searchValue={''}
            getRowHeight={() => 'auto'}
          />
        </Grid>
      </Card>
    </>
  )
}

export default HospitalIncoming
