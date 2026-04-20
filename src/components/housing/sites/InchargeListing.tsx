import React, { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Button, Typography, useMediaQuery, useTheme } from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import styled from '@emotion/styled'
import { useQuery } from '@tanstack/react-query'
import useSafeRouter from 'src/hooks/useSafeRouter'
import debounce from 'lodash/debounce'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import ListingHeader from '../../../views/pages/housing/utils/ListingHeader'
import InchargeDrawer from '../utils/InchargeDrawer'
import Search from 'src/views/utility/Search'
import { getInchargeList } from 'src/lib/api/housing'
import { useAuth } from 'src/hooks/useAuth'
import { Incharge, InchargeFilters } from 'src/types/housing/incharge'
import { GridColDef } from '@mui/x-data-grid'

interface InchargeListingProps {
  refType?: 'site' | 'section' | 'enclosure' | 'cluster' | 'animal'
}

const InchargeListing: React.FC<InchargeListingProps> = ({ refType = 'site' }) => {
  const { t } = useTranslation()
  const router = useSafeRouter()
  const { id } = router.query
  const theme = useTheme()
  const authData: any = useAuth()
  const addSiteAccess = authData?.userData?.permission?.user_settings?.add_sites
  const addSectionAccess = authData?.userData?.roles?.settings?.housing_add_section
  const addEnclosureAccess = authData?.userData?.roles?.settings?.housing_add_enclosure
  const addClusterAccess = authData?.userData?.roles?.settings?.manage_cluster_permission
  const addAnimalAccess = authData?.userData?.roles?.settings?.collection_animal_records
  const loggedinUserId = authData?.userData?.user?.user_id

  const [openDrawer, setOpenDrawer] = useState<boolean>(false)
  const [searchInput, setSearchInput] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Debounced search
  const debouncedSearch = useMemo(() => debounce((value: string) => setSearchQuery(value), 500), [])

  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value
    setSearchInput(value)
    debouncedSearch(value)
  }

  const handleSearchClear = (): void => {
    setSearchInput('')
    setSearchQuery('')
  }

  // Determine access based on refType
  const getAddAccess = () => {
    switch (refType) {
      case 'site':
        return addSiteAccess
      case 'section':
        return addSectionAccess
      case 'enclosure':
        return addEnclosureAccess
      case 'cluster':
        return addClusterAccess
      case 'animal':
        return addAnimalAccess
      default:
        return false
    }
  }
  const hasAddAccess = getAddAccess()

  // Get label based on refType
  const getEntityLabel = () => {
    switch (refType) {
      case 'site':
        return 'Site'
      case 'section':
        return 'Section'
      case 'enclosure':
        return 'Enclosure'
      case 'cluster':
        return 'Cluster'
      case 'animal':
        return 'Animal'
      default:
        return 'Site'
    }
  }
  const entityLabel = getEntityLabel()

  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'))

  // Fetch incharge list
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['incharge-list', id, refType, searchQuery],
    queryFn: () =>
      getInchargeList({
        ref_id: Number(id),
        ref_type: refType,
        q: searchQuery || undefined
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
      headerName: t('housing_module.incharge_name') as string,
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
      headerName: t('role') as string,
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
      headerName: t('phone') as string,
      minWidth: 180,
      sortable: false,
      renderCell: params => {
        const phoneNumber = params.row.user_mobile_number
        let pressTimer: NodeJS.Timeout

        const handleLongPress = () => {
          if (phoneNumber) {
            navigator.clipboard.writeText(phoneNumber)
            alert(t('housing_module.number_copied_to_clipboard'))
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
      {/* Row 1: Header (left) and Add Button (right) */}
      <Box
        sx={{
          mt: 4,
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
          gap: 2
        }}
      >
        <ListingHeader title={`${entityLabel} Incharge List`} totalCount={total} />

        {(userInList || hasAddAccess) && (
          <Button
            variant='contained'
            startIcon={<AddIcon />}
            sx={{
              py: 2,
              px: 3,
              borderRadius: '4px',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
            onClick={() => setOpenDrawer(true)}
          >
            {t('housing_module.choose_manager', { entity: entityLabel })}
          </Button>
        )}
      </Box>

      {/* Row 2: Search (right) */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          mb: 4
        }}
      >
        <Search
          value={searchInput}
          onChange={handleSearchChange}
          onClear={handleSearchClear}
          placeholder={t('housing_module.search_incharges') as string}
        />
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
          title={t('housing_module.select_manager', { entity: entityLabel }) as string}
          confirmLabel={t('housing_module.choose_manager', { entity: entityLabel }) as string}
          showFilter={true}
          refType={refType}
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
