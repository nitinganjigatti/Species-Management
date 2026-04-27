'use client'

import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  styled,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Add as AddIcon } from '@mui/icons-material'
import Search from 'src/views/utility/Search'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import AddStaffsDrawer from './AddStaffsDrawer'
import Toaster from 'src/components/Toaster'
import { getHospitalStaff, addChiefDoctor, removeChiefDoctor } from 'src/lib/api/hospital/staff'
import HospitalAnalyticsRaw from 'src/views/pages/hospital/inpatient/HospitalAnalytics'
const HospitalAnalytics: any = HospitalAnalyticsRaw
import { useHospital } from 'src/context/HospitalContext'
import useSafeRouter from 'src/hooks/useSafeRouter'
import MUISwitchRaw from 'src/views/forms/form-fields/MUISwitch'
const MUISwitch: any = MUISwitchRaw
import DynamicBreadcrumbs from 'src/views/utility/DynamicBreadcrumbs'
import { ApiError } from 'src/types/hospital/api'
import { AddRemoveChiefDoctorResponse, HospitalStaffListResponse } from 'src/types/hospital/api/doctorsAndStaffs'
import { GridColDef, GridPaginationModel, GridRenderCellParams } from '@mui/x-data-grid'
import { HospitalStaff } from 'src/types/hospital/models'
export interface IndexedRows extends HospitalStaff {
  id?: number | string
  sl_no?: number | string
  phone?: string

}

export type Rows = {
  user_id: string | number
  user_mobile_number?: string
  user_country_code?: string
}

const DoctorsList = () => {
  const { t } = useTranslation()
  const theme = useTheme()

  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'))
  const { selectedHospital }= useHospital()
  const router: any = useSafeRouter()
  const [searchValue, setSearchValue] = useState<string>('')
  const [debouncedSearch, setDebouncedSearch] = useState<string>('')
  const [openDrawer, setOpenDrawer] = useState<boolean>(false)
  const [rows, setRows] = useState<IndexedRows[]>([])
  const [total, setTotal] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: parseInt(router.query.page) || 0,
    pageSize: parseInt(router.query.limit) || 50
  })

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchValue)
      setPaginationModel((prev: GridPaginationModel) => (prev.page === 0 ? prev : { ...prev, page: 0 }))
    }, 500)

    return () => clearTimeout(handler)
  }, [searchValue, debouncedSearch])

  const fetchHospitalStaff = async () => {
    setLoading(true)

    try {
      const response: HospitalStaffListResponse = await getHospitalStaff({
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
    } catch (error: unknown) {
      const err = error as ApiError
      console.error('Error fetching hospital staff:', err?.message)
      Toaster({
        type: 'error',
        message: err?.response?.data?.message || err?.message || 'Failed to load hospital staff'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedHospital?.id){
    fetchHospitalStaff()
  }
  }, [paginationModel.page, paginationModel.pageSize, debouncedSearch, selectedHospital?.id])

  const indexedRows: IndexedRows[] = useMemo(() => {
    return rows.map((row: Rows, index: number) => {
      const phone = row?.user_mobile_number ? `${row?.user_country_code || ''}${row?.user_mobile_number}` : ''

      return {
        ...row,
        id: row?.user_id || `${index}`,
        sl_no: paginationModel.page * paginationModel.pageSize + index + 1,
        phone
      }
    })
  }, [rows, paginationModel.page, paginationModel.pageSize])

  const addHospitalChiefDoctor = async (user_id: number | string) => {
    try {
      const params = {
        action: 'add',
        hospital_id: selectedHospital?.id,
        hospital_chief_doctor: user_id
      } as const
      const response: AddRemoveChiefDoctorResponse = await addChiefDoctor(params)
      if (response?.message && response?.success === true) {
        Toaster({ type: 'success', message: response?.message })
      }
    } catch (error: unknown) {
      const err = error as ApiError
      Toaster({ type: 'error', message: err?.message })
    }
  }

  const removeHospitalChiefDoctor = async (user_id: string | number) => {
    try {
      const params = {
        action: 'delete',
        hospital_id: selectedHospital?.id,
        hospital_chief_doctor: user_id
      } as const
      const response: AddRemoveChiefDoctorResponse = await removeChiefDoctor(params)
      if (response?.message && response?.success === true) {
        Toaster({ type: 'success', message: response?.message })
      }
    } catch (error: unknown) {
      const err = error as ApiError
      Toaster({ type: 'error', message: err?.message })
    }
  }

  const handleSwitchChange = async (event: React.ChangeEvent<HTMLInputElement>, userId: string | number) => {
    const isChecked = event.target.checked

    try {
      if (isChecked) {
        await addHospitalChiefDoctor(userId)
      } else {
        await removeHospitalChiefDoctor(userId)
      }

      fetchHospitalStaff()
    } catch (error) {
      console.error(error)
    }
  }

  const columns: GridColDef[] = [
    {
      width: 80,
      minWidth: 20,
      field: 'sl_no',
      sortable: false,
      headerName: t('hospital_module.sl_no') ?? '',
      align: 'left',
      headerAlign: 'left',
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <StyledTypography paddingLeft={1}>{params.row.sl_no ? `${params.row.sl_no}.` : '-'}</StyledTypography>
        </Box>
      )
    },
    {
      minWidth: 300,
      field: 'user_full_name',
      sortable: false,
      headerName: t('hospital_module.doctors_name') ?? '',
      align: 'left',
      headerAlign: 'left',
      renderCell: (params: GridRenderCellParams) => (
        <UserAvatarDetails
          user_name={params.row.user_full_name}
          role={params.row.role_name}
          profile_image={params.row.user_profile_pic}
          size='medium'
        />
      )
    },
    {
      minWidth: 180,
      field: 'assigned_patients',
      sortable: false,
      headerName: t('hospital_module.assigned_patients') ?? '',
      align: 'left',
      headerAlign: 'left',
      renderCell: (params: GridRenderCellParams) => (
        <StyledTypography paddingLeft={1}>{params.row.assigned_patients ?? '-'}</StyledTypography>
      )
    },
    {
      minWidth: 180,
      field: 'phone',
      sortable: false,
      align: 'left',
      headerAlign: 'left',
      renderCell: (params: GridRenderCellParams) => {
        const phoneNumber = params.row.phone
        let pressTimer: ReturnType<typeof setTimeout>

        const handleLongPress = () => {
          if (phoneNumber) {
            navigator.clipboard.writeText(phoneNumber)
            alert(t('hospital_module.number_copied_to_clipboard'))
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
      headerName: t('hospital_module.chief_doctor') ?? '',
      align: 'left',
      headerAlign: 'left',
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <MUISwitch
          checked={params.row.is_hospital_chief_doctor === '1'}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleSwitchChange(event, params.row.user_id)}
        />
      )
    }
  ]

  const headerTitle = (
    <StyledTypography fontWeight={500} fontSize={'20px'}>
      {t('hospital_module.hospital_staffs')}
    </StyledTypography>
  )

  return (
    <>
      <Box>
        <DynamicBreadcrumbs
          sx={{ mb: 5 }}
          pageItems={[{ title: t('navigation.hospital') }, { title: t('hospital_module.patients') }, { title: t('hospital_module.doctors_and_staffs') }]}
        />
        <HospitalAnalytics />
        <Box sx={{ mt: 6 }}>
          <Card>
            <CardHeader title={headerTitle} />
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
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSearchValue(event.target.value)}
                  onClear={() => setSearchValue('')}
                  placeholder={(t('hospital_module.search_staff') as string)}
                />
              </Box>
              <Grid>
                <CommonTable
                  columns={columns}
                  indexedRows={indexedRows}
                  total={total}
                  paginationModel={paginationModel}
                  setPaginationModel={setPaginationModel}
                  loading={loading}
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

const StyledTypography = styled(Typography)(({ theme, fontSize, fontWeight, fontColor }: any) => ({
  fontSize: fontSize || '16px',
  fontWeight: fontWeight || 400,
  color: fontColor || theme.palette.customColors.OnSurfaceVariant
}))
