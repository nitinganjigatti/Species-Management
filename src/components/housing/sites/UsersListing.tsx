import React, { useState, useMemo ,useEffect} from 'react'
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material'
import styled from '@emotion/styled'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import ListingHeader from '../../../views/pages/housing/utils/ListingHeader'
import { getUsersList } from 'src/lib/api/housing'
import { UserWithAccess } from 'src/types/housing/incharge'
import { GridColDef } from '@mui/x-data-grid'
import Search from 'src/views/utility/Search'
import { debounce } from 'lodash'

const UsersListing = () => {
  const router = useRouter()
  const { id } = router.query
  const theme = useTheme()

  const [filters, setFilters] = useState({
    page_no: 1,
    limit: 10,
    search: ''
  })
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchInput, setSearchInput] = useState<string>('')

  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'))

  // Fetch users list
  const { data, isFetching } = useQuery({
    queryKey: ['users-list', id, filters.page_no, filters.search],
    queryFn: () =>
      getUsersList({type: 'site',id,page_no: filters.page_no,search: filters.search}),
    enabled: !!id,
    placeholderData: keepPreviousData
  })

  // user data for the table
  const rows: UserWithAccess[] = data?.data?.result || []
  const total = data?.data?.total_count || 0

  // Debounced search
  const debouncedSearch = useMemo(() => debounce(setSearchQuery, 500), [])
  
    useEffect(() => {
      return () => {
        debouncedSearch.cancel()
      }
    }, [debouncedSearch])

  // Input change handler
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchInput(value)
    debouncedSearch(value)
  }

  // Sync debounced search to filters
useEffect(() => {
  setFilters(prev => ({
    ...prev,
    search: searchQuery,
    page_no: 1
  }))
}, [searchQuery])
  
  // Clear search input handler
  const handleSearchClear = () => {
    setSearchInput('')
    debouncedSearch('')
  }
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
      headerName: 'Users Name',
      minWidth: 400,
      sortable: false,
      renderCell: params => (
        <Box sx={{ pl: 1.4 }}>
          <UserAvatarDetails
            user_name={params?.row?.full_name}
            profile_image={params?.row?.profile_pic}
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
      minWidth: 200,
      sortable: false,
      renderCell: params => {
        const rawPhoneNumber = params.row.mobile_number
        const phoneNumber = rawPhoneNumber?.split('-')?.[1]
          ? rawPhoneNumber
          : null
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

const indexedRows = useMemo(() => {
  return rows?.map((row: any, index: number) => ({
    ...row,
    id: row.user_id || row.id || `user-row-${index}`,
    sl_no: (filters.page_no - 1) * filters.limit + index + 1
  }))
}, [rows, filters.page_no, filters.limit])

  // Pagination change handler
  const handlePaginationChange = (model: { page: number; pageSize: number }) => {
    setFilters(prev => ({
      ...prev,
      page_no: model.page + 1
    }))
  } 

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', my: 4}}>
        <ListingHeader title='Users List' totalCount={total} />
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 4,
            flexWrap: 'wrap'
          }}
        >
          <Search
            width='300px'
            placeholder='Search by name'
            value={searchInput}
            onChange={handleSearchChange}
            onClear={handleSearchClear}
            inputStyle={{ py: '12px', px: '12px' }}
          />
        </Box>
      </Box>
    

        <CommonTable
          columns={columns}
          indexedRows={indexedRows}
          rowHeight={60}
          total={total}
          loading={isFetching}
          paginationModel={{ page: filters.page_no - 1, pageSize: filters.limit }}
          setPaginationModel={handlePaginationChange}
        />
    </>
  )
}

export default React.memo(UsersListing)

const StyledTypography = styled(Typography)<{ fontWeight?: number | string; fontSize?: string; color?: string }>(
  ({ theme, fontWeight, fontSize, color, sx }) => ({
    fontSize: fontSize || '1rem',
    fontWeight: fontWeight || 500,
    color: color || theme.palette.customColors.OnSurfaceVariant,
    ...(sx as any)
  })
)