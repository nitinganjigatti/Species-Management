import { useTheme } from '@emotion/react'
import {
  Breadcrumbs,
  Box,
  Typography,
  Card,
  CardHeader,
  Grid,
  Button,
  CardContent,
  Select,
  Tooltip,
  MenuItem
} from '@mui/material'
import { width } from '@mui/system'
import React from 'react'
import RenderUtility from 'src/utility/render'
import AnimalCard from 'src/views/pages/housing/animals/AnimalCard'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import AnimalParentCard from 'src/views/utility/animalParentCard'
import { FilterButton, VisitType } from 'src/views/utility/render-snippets'
import Search from 'src/views/utility/Search'

const dummyData = [
  {
    id: 1,
    animalName: 'Leopard',
    animalId: '87546/24',
    species: 'Panthera pardus',
    gender: 'M',
    age: '4y 6m',
    site: 'R & R',
    purposeOfVisit:
      'The patient is admitted due to acute eye pain and swelling, requiring immediate medical intervention and diagidstic tests.',
    medicalId: '87546/24',
    admissionDate: '26 Aug 2025',
    admissionTime: '9:30 AM',
    duration: '1 Day',
    visitType: 'Emergency'
  },
  {
    id: 2,
    animalName: 'Giraffe',
    animalId: '87549/24',
    species: 'Giraffa camelopardalis',
    gender: 'M',
    age: '5y 8m',
    site: 'R & R',
    purposeOfVisit: 'Patient may have a severe dermatitis, need to run some additional tests to confirm',
    medicalId: '87550/24',
    admissionDate: '25 Aug 2025',
    admissionTime: '9:30 AM',
    duration: '2 Days',
    visitType: 'Follow-up'
  },
  {
    id: 3,
    animalName: 'Red Panda',
    animalId: '87551/24',
    species: 'Ailurus fulgens',
    gender: 'F',
    age: '2y 5m',
    site: 'R & R',
    purposeOfVisit:
      'The patient has been diagnosed with chronic gastritis and admitting for additional tests and assessments.',
    medicalId: '87547/24',
    admissionDate: '25 Aug 2025',
    admissionTime: '9:30 AM',
    duration: '2 Days',
    visitType: 'Check up'
  },
  {
    id: 4,
    animalName: 'Gray Wolf',
    animalId: '87550/24',
    species: 'Canis lupus',
    gender: 'F',
    age: '6y 3m',
    site: 'R & R',
    purposeOfVisit: 'The patient has been diagnosed with persistent pancreatitis',
    medicalId: '87548/24',
    admissionDate: '25 Aug 2025',
    admissionTime: '9:30 AM',
    duration: '2 Days',
    visitType: 'Check up'
  }
]

const HospitalInpatient = () => {
  const theme = useTheme()

  const columns = [
    {
      width: 80,
      minWidth: 20,
      field: 'id',
      sortable: false,
      headerName: 'SL.NO',
      align: 'left',
      headerAlign: 'left',

      renderCell: params => (
        <Box sx={{ minWidth: 40, textAlign: 'center' }}>
          <Typography sx={{ color: 'text.primary', fontSize: '14px', fontWeight: '400px' }}>
            {params.row.id + '.'}
          </Typography>
        </Box>
      )
    },
    {
      width: 200,
      minWidth: 20,
      field: 'animal',
      sortable: false,
      headerName: 'Animal Name & Id',
      align: 'left',
      headerAlign: 'left',

      renderCell: params => (
        <>
          <Box>
            <AnimalParentCard />
          </Box>
        </>
      )
    },
    {
      width: 350,
      minWidth: 20,
      field: 'purposeOfVisit',
      headerName: 'Purpose of Visit',
      renderCell: params => (
        <Typography
          sx={{
            color: theme?.palette?.customColors?.OnSurfaceVariant,
            fontSize: '14px',
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'normal'
          }}
        >
          {params.row.purposeOfVisit || ''}
        </Typography>
      )
    },
    {
      width: 150,
      minWidth: 20,
      field: 'medicalId',
      sortable: false,
      headerName: 'Medical Id',
      align: 'left',
      headerAlign: 'left',

      renderCell: params => (
        <>
          <Typography sx={{ fontSize: '14px', fontWeight: 400, color: theme?.palette?.customColors?.OnSurfaceVariant }}>
            {params?.row?.medicalId}
          </Typography>
        </>
      )
    },
    {
      width: 200,
      minWidth: 20,
      field: 'admissionDate',
      sortable: false,
      headerName: 'Admission Date',
      align: 'left',
      headerAlign: 'left',

      renderCell: params => (
        <>
          <Box>
            <Typography
              sx={{ fontSize: '14px', fontWeight: 400, color: theme?.palette?.customColors?.OnSurfaceVariant }}
            >
              {params?.row?.admissionDate}
            </Typography>
            <Typography
              sx={{ fontSize: '12px', fontWeight: 400, color: theme?.palette?.customColors?.OnSurfaceVariant }}
            >
              {params?.row?.admissionTime}
            </Typography>
          </Box>
        </>
      )
    },
    {
      width: 180,
      minWidth: 20,
      field: 'duration',
      sortable: false,
      headerName: 'duration',
      align: 'left',
      headerAlign: 'left',

      renderCell: params => (
        <>
          <Typography sx={{ fontSize: '14px', fontWeight: 400, color: theme?.palette?.customColors?.OnSurfaceVariant }}>
            {params?.row?.duration}
          </Typography>
        </>
      )
    },
    {
      width: 180,
      minWidth: 20,
      field: 'visitType',
      sortable: false,
      headerName: 'Visit Type',
      align: 'left',
      headerAlign: 'left',

      renderCell: params => (
        <>
          <Box>{VisitType({ title: params?.row?.visitType })}</Box>
        </>
      )
    }
  ]

  const headerAction = (
    <>
      <Button variant='contained'>ADD PATIENT</Button>
    </>
  )

  return (
    <>
      <Box>
        <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
          <Typography sx={{ cursor: 'pointer', color: 'inherit' }}>Hospital</Typography>
          <Typography sx={{ cursor: 'pointer', color: 'text.primary' }}>Patients</Typography>
          <Typography sx={{ cursor: 'pointer', color: 'text.primary' }}>Inpatient</Typography>
        </Breadcrumbs>
        <Box>{/* This is for Hospital Card */}</Box>
        <Box sx={{ mt: 6 }}>
          <Card>
            <CardHeader title={RenderUtility?.pageTitle('Inpatients')} action={headerAction} />
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { sm: 'row', xs: 'column' },
                  alignItems: { sm: 'center', xs: 'flex-start' },
                  justifyContent: 'space-between',
                  gap: 3
                }}
              >
                <Search sx={{ width: '100%' }} />
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: { sm: 'flex-end', xs: 'space-between' },
                    gap: 3,
                    width: '100%'
                  }}
                >
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

                  <FilterButton />
                </Box>
              </Box>
              <Grid>
                <CommonTable indexedRows={dummyData} columns={columns} rowHeight={100} />
              </Grid>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </>
  )
}

export default HospitalInpatient
