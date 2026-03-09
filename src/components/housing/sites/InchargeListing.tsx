import React, { useState, useMemo } from 'react'
import { Box, Button, Typography, useMediaQuery, useTheme } from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import styled from '@emotion/styled'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import ListingHeader from '../../../views/pages/housing/utils/ListingHeader'
import InchargeDrawer from '../utils/InchargeDrawer'
import { getInchargeList } from 'src/lib/api/housing'
import { useAuth } from 'src/hooks/useAuth'
import { Incharge, InchargeFilters } from 'src/types/housing/incharge'
import { GridColDef } from '@mui/x-data-grid'

const InchargeListing = () => {
  const router = useRouter()
  const { id } = router.query
  const theme = useTheme()
  const authData: any = useAuth()
  const addSiteAccess = authData?.userData?.permission?.user_settings?.add_sites
  const loggedinUserId = authData?.userData?.user?.user_id

  const [openDrawer, setOpenDrawer] = useState<boolean>(false)

  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'))

  // Fetch incharge list
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['incharge-list', id],
    queryFn: () =>
      getInchargeList({
        ref_id: Number(id),
        ref_type: 'site'
      }),
    enabled: !!id
  })

  // Memoized incharge data for the table
  const rows: Incharge[] = useMemo(() => (data?.data?.incharges || []) as unknown as Incharge[], [data])
  const total = useMemo(() => data?.data?.total_count || 0, [data])
  const userInList = useMemo(
    () => rows?.some((item: Incharge) => item?.user_id === loggedinUserId),
    [rows, loggedinUserId]
  )

  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'Sl No',
      minWidth: 50,
      sortable: false,
      renderCell: params => (
        <StyledTypography fontSize={'0.75rem'} sx={{ pl: 3 }}>
          {params?.row?.sl_no}
        </StyledTypography>
      )
    },
    {
      field: 'name',
      headerName: 'Inchargers Name',
      minWidth: 500,
      sortable: false,
      renderCell: params => (
        <Box sx={{ pl: 1.4 }}>
          <UserAvatarDetails
            user_name={`${params?.row?.user_first_name} ${params?.row?.user_last_name}`}
            profile_image={params?.row?.user_profile_pic}
            size='medium'
          />
        </Box>
      )
    },
    {
      field: 'role',
      headerName: 'Role',
      minWidth: 300,
      sortable: false,
      renderCell: params => (
        <Box sx={{ pl: 1.4 }}>
          <Typography>{params?.row?.role_name || '-'}</Typography>
        </Box>
      )
    },
    {
      field: 'phone',
      headerName: 'Phone',
      minWidth: 180,
      sortable: false,
      renderCell: params => {
        const phoneNumber = params.row.user_mobile_number
        let pressTimer: NodeJS.Timeout

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

        return (
          <Box sx={{ pl: 1.4 }}>
            {isSmallScreen ? (
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
              <Typography sx={{ fontSize: '14px', fontWeight: 500, cursor: 'default' }}>
                {phoneNumber || '-'}
              </Typography>
            )}
          </Box>
        )
      }
    }
  ]

  // Index rows for pagination
  const indexedRows = useMemo(() => {
    return rows?.map((row: Incharge, index: number) => ({
      ...row,
      id: row.user_id,
      sl_no: index + 1
    }))
  }, [rows])

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', my: 4 }}>
        <ListingHeader title='Site Incharge List' totalCount={total} />

        {userInList ||
          (addSiteAccess && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 4,
                flexWrap: 'wrap'
              }}
            >
              <Button
                variant='contained'
                startIcon={<AddIcon />}
                sx={{ py: 2, px: 3, borderRadius: '4px' }}
                onClick={() => setOpenDrawer(true)}
              >
                Choose Site Manager
              </Button>
            </Box>
          ))}
      </Box>
      <Box sx={{ mt: 4 }}>
        <CommonTable
          columns={columns}
          indexedRows={indexedRows}
          rowHeight={60}
          total={total}
          loading={isLoading}
          disablePagination={true}
          hideFooterPagination={true}
        />
      </Box>
      {openDrawer && (
        <InchargeDrawer
          openDrawer={openDrawer}
          closeDrawer={() => setOpenDrawer(false)}
          selectedUsers={rows}
          title='Select Site Manager'
          confirmLabel='Choose Site Manager'
          showFilter={true}
          onSelect={(selectedUsers: Incharge[]) => {
            if (selectedUsers && selectedUsers.length > 0) {
              refetch()
            }
          }}
        />
      )}
    </>
  )
}

export default React.memo(InchargeListing)

const StyledTypography = styled(Typography)<{ fontWeight?: number | string; fontSize?: string; color?: string }>(
  ({ theme, fontWeight, fontSize, color, sx }) => ({
    fontSize: fontSize || '1rem',
    fontWeight: fontWeight || 500,
    color: color || (theme as any).palette?.customColors?.OnSurfaceVariant,
    ...(sx as any)
  })
)
