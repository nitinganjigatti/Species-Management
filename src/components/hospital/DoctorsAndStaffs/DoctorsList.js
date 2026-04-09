'use client'

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
  styled,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Add as AddIcon } from '@mui/icons-material'
import Search from 'src/views/utility/Search'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import Icon from 'src/@core/components/icon'
import AddStaffsDrawer from './AddStaffsDrawer'
import Toaster from 'src/components/Toaster'
import { getHospitalStaff } from 'src/lib/api/hospital/staff'
import { addChiefDoctor } from 'src/lib/api/hospital/staff'
import { removeChiefDoctor } from 'src/lib/api/hospital/staff'
import HospitalAnalytics from 'src/views/pages/hospital/inpatient/HospitalAnalytics'
import { useHospital } from 'src/context/HospitalContext'
import useSafeRouter from 'src/hooks/useSafeRouter'
import MUISwitch from 'src/views/forms/form-fields/MUISwitch'
import DynamicBreadcrumbs from 'src/views/utility/DynamicBreadcrumbs'

const DoctorsList = () => {
  const theme = useTheme()

  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'))
  const { selectedHospital } = useHospital()
  const router = useSafeRouter()
  const [searchValue, setSearchValue] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [openDrawer, setOpenDrawer] = useState(false)
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  // const [sortColumn, setSortColumn] = useState(router.query.column || '')
  // const [sort, setSort] = useState('asc')

  const [paginationModel, setPaginationModel] = useState({
      page: parseInt(router.query.page) || 0,
      pageSize: parseInt(router.query.limit) || 50
    })

  // debounce search to avoid excessive API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchValue)
      setPaginationModel(prev => (prev.page === 0 ? prev : { ...prev, page: 0 }))
    }, 500)

    return () => clearTimeout(handler)
  }, [searchValue, debouncedSearch])

  

  const fetchHospitalStaff = useCallback(async () => {
    setLoading(true)

    try {
      const response = await getHospitalStaff({
        params: {
          page_no: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          q: debouncedSearch,
          hospital_id: selectedHospital?.id
        }
      })

      if (response?.success) {
        setRows(response?.data?.records || [])
        setTotal(response?.data?.total || 0)
      } else {
        Toaster({ type: 'error', message: response?.message || 'Failed to load hospital staff' })
        setRows([])
        setTotal(0)
      }
    } catch (error) {
      console.error('Error fetching hospital staff:', error?.message)
      Toaster({
        type: 'error',
        message: error?.response?.data?.message || error?.message || 'Failed to load hospital staff'
      })
    } finally {
      setLoading(false)
    }
  }, [paginationModel.page, paginationModel.pageSize, debouncedSearch, selectedHospital?.id])

  useEffect(() => {
    fetchHospitalStaff()
  }, [fetchHospitalStaff])


    const indexedRows = useMemo(() => {
    return rows.map((row, index) => {
      const phone = row?.user_mobile_number ? `${row?.user_country_code || ''}${row?.user_mobile_number}` : ''

      return {
        ...row,
        id: row?.user_id || `${index}`,
        sl_no: paginationModel.page * paginationModel.pageSize + index + 1,
        phone
      }
    })
  }, [rows, paginationModel.page, paginationModel.pageSize])


  const addHospitalChiefDoctor = async user_id => {
    try {
      const params = {
        action: 'add',
        hospital_id: selectedHospital?.id,
        hospital_chief_doctor: user_id,
      }
      const response = await addChiefDoctor(params)
      if (response?.message && response?.success === true) {
        Toaster({ type: 'success', message: response?.message })
      }
    } catch (error) {
      Toaster({ type: 'error', message: error?.message })
    }
  }

  const removeHospitalChiefDoctor = async user_id => {
    try {
      const params = {
        action: 'delete',
        hospital_id: selectedHospital?.id,
        hospital_chief_doctor: user_id,
      }
      const response = await removeChiefDoctor(params)
      if (response?.message && response?.success === true) {
        Toaster({ type: 'success', message: response?.message })
      }
    } catch (error) {
      Toaster({ type: 'error', message: error?.message })
    }
  }

    const handleSwitchChange = async (event, userId) => {
    const isChecked = event.target.checked

    try {
      if (isChecked) {
        await addHospitalChiefDoctor(userId)
      } else {
        await removeHospitalChiefDoctor(userId)
      }

      fetchHospitalStaff(isChecked)
    } catch (error) {
      console.error(error)
    }
  }

// const handleSortModel = newModel => {
//   if (!newModel.length) return

//   const newSort = newModel[0].sort 
//   const newColumn = newModel[0].field 

//   setSort(newSort)
//   setSortColumn(newColumn)

//   if (newColumn === 'hospital_chief_doctor') {
//     const sortedData = [...rows].sort((a, b) => {
//       if (newSort === 'asc') {
//         return Number(a.is_hospital_chief_doctor) - Number(b.is_hospital_chief_doctor)
//       } else {
//         return Number(b.is_hospital_chief_doctor) - Number(a.is_hospital_chief_doctor)
//       }
//     })

//     setRows(sortedData)
//     return
//   }
// }
  const columns = [
    {
      width: 80,
      minWidth: 20,
      field: 'sl_no',
      sortable: false,
      headerName: 'SL.NO',
      align: 'left',
      headerAlign: 'left',

      renderCell: params => (
        <Box>
          <StyledTypography paddingLeft={1}>{params.row.sl_no ? `${params.row.sl_no}.` : '-'}</StyledTypography>
        </Box>
      )
    },
    {
      minWidth: 300,
      field: 'user_full_name',
      sortable: false,
      headerName: 'Doctors Name',
      align: 'left',
      headerAlign: 'left',
      renderCell: params => (
        <UserAvatarDetails
          user_name={params.row.user_full_name}
          role={params.row.role_name}
          profile_image={params.row.user_profile_pic}
          size='medium'
        />
      )
    },

    // {
    //   minWidth: 250,
    //   field: 'designation',
    //   sortable: false,
    //   headerName: 'Designation',
    //   align: 'left',
    //   headerAlign: 'left',
    //   renderCell: params => <StyledTypography paddingLeft={1}>{params.row?.designation || '-'}</StyledTypography>
    // },

    // {
    //   minWidth: 250,
    //   field: 'specialty',
    //   sortable: false,
    //   headerName: 'Specialty',
    //   align: 'left',
    //   headerAlign: 'left',
    //   renderCell: params => (
    //     <StyledTypography paddingLeft={1} fontSize={'14px'}>
    //       {params.row.specialty || '-'}
    //     </StyledTypography>
    //   )
    // },
    {
      minWidth: 180,
      field: 'assigned_patients',
      sortable: false,
      headerName: 'Assigned Patients',
      align: 'left',
      headerAlign: 'left',
      renderCell: params => <StyledTypography paddingLeft={1}>{params.row.assigned_patients ?? '-'}</StyledTypography>
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
      minWidth: 180,
      field: 'hospital_chief_doctor',
      headerName: 'Chief Doctor',
      align: 'left',
      headerAlign: 'left',
      flex: 1,
      renderCell: params => (
        <MUISwitch
          checked={params.row.is_hospital_chief_doctor === '1'}
          onChange={event => handleSwitchChange(event, params.row.user_id)}
        />
      )
    }

    // {
    //   minWidth: 100,
    //   field: 'actions',
    //   sortable: false,
    //   headerName: '',
    //   align: 'right',
    //   headerAlign: 'right',
    //   renderCell: params => (
    //     <IconButton>
    //       <Icon icon={'tabler:dots-vertical'} />
    //     </IconButton>
    //   )
    // }
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
         <DynamicBreadcrumbs
            sx={{ mb: 5 }}
            pageItems={[{ title: 'Hospital' }, { title: 'Patients' }, { title: 'Doctors & Staffs' }]}
          />
        <HospitalAnalytics />
        <Box sx={{ mt: 6 }}>
          <Card>
            <CardHeader
              title={headerTitle}

              // action={actionHeader}
            />
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
                <Search
                  sx={{ width: '100%' }}
                  value={searchValue}
                  onChange={event => setSearchValue(event.target.value)}
                  onClear={() => setSearchValue('')}
                  placeholder='Search staff'
                />
                {/* <Box
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
                </Box> */}
              </Box>
              <Grid>
                <CommonTable
                  columns={columns}
                  indexedRows={indexedRows}
                  total={total}
                  paginationModel={paginationModel}
                  setPaginationModel={setPaginationModel}
                  loading={loading}
                  // handleSortModel={handleSortModel}
                  // externalTableStyle={
                  //   {'& .MuiDataGrid-cell': {
                  //     // display: 'flex',
                  //     // alignItems: 'center',
                  //     // lineHeight: 'normal'
                  //   },
                  // '& .MuiDataGrid-cell:focus': {
                  //   outline: 'none'
                  // },
                  // '& .MuiDataGrid-cell:focus-within': {
                  //   outline: 'none'
                  // }}
                  // }
                />
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
