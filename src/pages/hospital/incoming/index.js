import { useTheme } from '@emotion/react'
import { Box, Button, Card, CardHeader, Grid, MenuItem, Select, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import { useState } from 'react'
import RenderUtility from 'src/utility/render'
import { VisitType } from 'src/views/pages/hospital/utility/hospitalSnippets'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import AnimalCard from 'src/views/utility/AnimalCard'
import Search from 'src/views/utility/Search'

const animalData = {
  sex: 'male',
  animal_id: '6666/66',
  common_name: 'Leopard',
  scientific_name: 'Panthera pardus',
  user_enclosure_name: 'Enclosure 4',
  section_name: 'Leopard section',
  site_name: 'Feline site'
}

const HospitalIncoming = () => {
  const theme = useTheme()
  const router = useRouter()

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

  const columns = [
    {
      minWidth: 20,
      width: 80,
      sortable: false,
      field: 'NO',
      headerName: 'NO',
      renderCell: params => (
        <Typography variant='body2' sx={{ color: 'text.primary', px: 2 }}>
          {params.row.sl_no}
        </Typography>
      )
    },

    {
      width: 300,
      minWidth: 20,
      sortable: false,
      field: 'animal_name',
      headerName: 'Animal Name & ID',
      renderCell: params => (
        <>
          <AnimalCard data={animalData} />
        </>
      )
    },

    {
      width: 400,
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
            whiteSpace: 'normal',
            py: 4
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
      width: 200,
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
    //   width: 200,
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
      width: 150,
      minWidth: 20,
      field: 'actions',
      sortable: false,
      headerName: 'Actions',
      align: 'right',
      headerAlign: 'right',
      renderCell: params => (
        <>
          <Button
            sx={{ borderRadius: 6, px: 4, py: 2 }}
            variant='contained'
            onClick={() => handleAdmitClick(params.row.animalId)}
          >
            Admit
          </Button>
        </>
      )
    }
  ]

  const handleAdmitClick = animalId => {
    router.push(``)
  }

  return (
    <>
      <Card>
        <CardHeader title={RenderUtility?.pageTitle('Incoming Patient')} />
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ ml: 2 }}>
            <Search borderRadius='4px' width='343px' placeholder='Search by medical Id or animal id' />
          </Box>
          <Box sx={{ mr: 2 }}>
            <Select
              size='small'
              value={''}
              displayEmpty
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
            externalTableStyle={{
              '& .MuiDataGrid-cell': {
                padding: 4
              }
            }}
          />
        </Grid>
      </Card>
    </>
  )
}

export default HospitalIncoming
