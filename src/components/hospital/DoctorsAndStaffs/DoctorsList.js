import {
  Badge,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  IconButton,
  MenuItem,
  Select,
  styled,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material'
import React, { useState } from 'react'
import { Add as AddIcon } from '@mui/icons-material'
import Search from 'src/views/utility/Search'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import Icon from 'src/@core/components/icon'
import AddStaffsDrawer from './AddStaffsDrawer'

const doctorsData = [
  {
    id: 1,
    doctor_id: 'A001',
    name: 'Dr. Aarav Sharma',
    designation: 'Chief Veterinarian',
    specialty: 'Small Mammals',
    assigned_patients: 3,
    phone: '+91-9876543210'
  },
  {
    id: 2,
    doctor_id: 'A002',
    name: 'Dr. Priya Singh',
    designation: 'Chief Veterinarian',
    specialty: 'Rodents and Rabbits',
    assigned_patients: 1,
    phone: '+91-9123456780'
  },
  {
    id: 3,
    doctor_id: 'A003',
    name: 'Dr. Neha Gupta',
    designation: 'Veterinarian',
    specialty: 'Furry Companions',
    assigned_patients: 3,
    phone: '+91-9988776655'
  },
  {
    id: 4,
    doctor_id: 'A004',
    name: 'Dr. Rohan Mehta',
    designation: 'Veterinarian',
    specialty: 'Tiny Creatures',
    assigned_patients: 2,
    phone: '+91-9012345678'
  },
  {
    id: 5,
    doctor_id: 'A005',
    name: 'Dr. Kavya Iyer',
    designation: 'Veterinarian',
    specialty: 'Little Mammals',
    assigned_patients: 3,
    phone: '+91-9098765432'
  },
  {
    id: 6,
    doctor_id: 'A006',
    name: 'Dr. Vikram Joshi',
    designation: 'Anaesthetist',
    specialty: 'Pocket Pets',
    assigned_patients: 2,
    phone: '+91-9345678901'
  },
  {
    id: 7,
    doctor_id: 'A007',
    name: 'Dr. Ananya Nair',
    designation: 'Veterinarian',
    specialty: 'Compact Mammals',
    assigned_patients: 1,
    phone: '+91-9456789012'
  },
  {
    id: 8,
    doctor_id: 'A008',
    name: 'Dr. Arjun Rao',
    designation: 'Para Veterinarian',
    specialty: 'Miniature Mammals',
    assigned_patients: 4,
    phone: '+91-9567890123'
  },
  {
    id: 9,
    doctor_id: 'A009',
    name: 'Dr. Sneha Desai',
    designation: 'Para Veterinarian',
    specialty: 'Small Animal Species',
    assigned_patients: 1,
    phone: '+91-9678901234'
  }
]

const DoctorsList = () => {
  const theme = useTheme()

  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'))

  const [searchValue, setSearchValue] = useState('')
  const [openDrawer, setOpenDrawer] = useState(false)
  const [rows, setRows] = useState(doctorsData)

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
        <Box>
          <StyledTypography paddingLeft={1}>{params.row.id + '.'}</StyledTypography>
        </Box>
      )
    },
    {
      minWidth: 250,
      field: 'name',
      sortable: false,
      headerName: 'Doctors Name',
      align: 'left',
      headerAlign: 'left',
      renderCell: params => (
        <UserAvatarDetails
          user_name={params.row.name}
          role={params.row.doctor_id}
          profile_image={params.row.default_icon}
          size='medium'
        />
      )
    },
    {
      minWidth: 250,
      field: 'designation',
      sortable: false,
      headerName: 'Designation',
      align: 'left',
      headerAlign: 'left',
      renderCell: params => <StyledTypography paddingLeft={1}>{params.row?.designation}</StyledTypography>
    },
    {
      minWidth: 250,
      field: 'specialty',
      sortable: false,
      headerName: 'Specialty',
      align: 'left',
      headerAlign: 'left',
      renderCell: params => (
        <StyledTypography paddingLeft={1} fontSize={'14px'}>
          {params.row.specialty}
        </StyledTypography>
      )
    },
    {
      minWidth: 180,
      field: 'assigned_patients',
      sortable: false,
      headerName: 'Assigned Patients',
      align: 'left',
      headerAlign: 'left',
      renderCell: params => <StyledTypography paddingLeft={1}>{params.row.assigned_patients}</StyledTypography>
    },
    {
      minWidth: 180,
      field: 'phone',
      sortable: false,
      align: 'left',
      headerAlign: 'left',
      renderCell: params => {
        const phoneNumber = params.row.phone
        let pressTimer

        const handleLongPress = () => {
          if (phoneNumber) {
            navigator.clipboard.writeText(phoneNumber)
            alert('Number copied to clipboard')
          }
        }

        const handleMouseDown = () => {
          pressTimer = setTimeout(handleLongPress, 700)
        }

        const handleMouseUp = () => {
          clearTimeout(pressTimer)
        }

        return isSmallScreen ? (
          phoneNumber ? (
            <Box
              sx={{
                display: 'flex',
                gap: 4
              }}
            >
              <Box
                component='img'
                src='/images/call.png'
                alt='Call'
                sx={{ width: 20, height: 20, cursor: 'pointer' }}
                onClick={() => window.open(`tel:${phoneNumber}`)}
                onTouchStart={handleMouseDown}
                onTouchEnd={handleMouseUp}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
              />
              <Box
                component='img'
                src='/images/message.png'
                alt='Message'
                sx={{ width: 20, height: 20, cursor: 'pointer' }}
                onClick={() => window.open(`sms:${phoneNumber}`)}
              />
            </Box>
          ) : (
            '-'
          )
        ) : (
          <Typography sx={{ fontSize: '14px', fontWeight: 500, cursor: 'default' }}>{phoneNumber || '-'}</Typography>
        )
      }
    },
    {
      minWidth: 100,
      field: 'actions',
      sortable: false,
      headerName: '',
      align: 'right',
      headerAlign: 'right',
      renderCell: params => (
        <IconButton>
          <Icon icon={'tabler:dots-vertical'} />
        </IconButton>
      )
    }
  ]

  const headerTitle = (
    <StyledTypography fontWeight={500} fontSize={'20px'}>
      Hospital Staffs
    </StyledTypography>
  )

  const actionHeader = (
    <Button variant='contained' startIcon={<AddIcon />} onClick={() => setOpenDrawer(true)}>
      ADD NEW
    </Button>
  )

  return (
    <>
      <Box>
        <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
          <Typography sx={{ cursor: 'pointer', color: 'inherit' }}>Hospital</Typography>
          <Typography sx={{ cursor: 'pointer', color: 'text.primary' }}>Doctors And Staffs</Typography>
        </Breadcrumbs>
        <Box></Box>
        <Box sx={{ mt: 6 }}>
          <Card>
            <CardHeader title={headerTitle} action={actionHeader} />
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
                  <Button
                    variant='outlined'
                    sx={{
                      color: theme.palette.customColors.OnSurfaceVariant,
                      borderColor: theme.palette.customColors.OutlineVariant,
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                    startIcon={
                      <TuneRoundedIcon
                        sx={{ height: '24px', width: '24px' }}
                        color={theme.palette.customColors.OnSurfaceVariant}
                      />
                    }
                    endIcon={<Badge sx={{ ml: 2, mr: 2 }} />}
                  >
                    Filter
                  </Button>
                </Box>
              </Box>
              <Grid>
                <CommonTable columns={columns} indexedRows={rows} />
              </Grid>
            </CardContent>
          </Card>
        </Box>
      </Box>
      {openDrawer && <AddStaffsDrawer open={openDrawer} setOpen={setOpenDrawer} />}
    </>
  )
}

export default DoctorsList

const StyledTypography = styled(Typography)(({ theme, fontSize, fontWeight, fontColor }) => ({
  fontSize: fontSize || '16px',
  fontWeight: fontWeight || 400,
  color: fontColor || theme.palette.customColors.OnSurfaceVariant
}))
