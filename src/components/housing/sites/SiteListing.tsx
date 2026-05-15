import { useTheme } from '@emotion/react'
import { Box, CircularProgress, Grid, Typography, useMediaQuery, Theme } from '@mui/material'
import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import debounce from 'lodash/debounce'

import CommonTable from 'src/views/table/data-grid/CommonTable'
import Search from 'src/views/utility/Search'
import UserInfoCard from 'src/views/utility/insights/UserInfoCard'
import ListingHeader from '../../../views/pages/housing/utils/ListingHeader'
import { ExportButton } from 'src/views/utility/render-snippets'
import RenderUtility, { CellInfo } from 'src/utility/render'
import SectionsDrawer from '../utils/SectionsDrawer'
import SpeciesDrawer from 'src/components/housing/utils/SpeciesDrawer'
import AnimalsDrawer from 'src/components/housing/utils/AnimalDrawer'
import { getAllSites } from 'src/lib/api/housing'
import EnclosureDrawer from '../utils/EnclosureDrawer'
import { useAuth } from 'src/hooks/useAuth'
import AddSiteDrawer from 'src/views/pages/housing/sites/AddSiteDrawer'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import { DrawerType, DrawerData, SiteFilters, IndexedSiteRow, Site } from 'src/types/housing'
import { GridCellParams, GridSortModel } from '@mui/x-data-grid'
import { useTranslation } from 'react-i18next'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
interface SiteListingProps {
  drawerType: DrawerType
  setDrawerType: (type: DrawerType) => void
  drawerData: DrawerData | null
  setDrawerData: (data: DrawerData | null) => void
  siteDrawer: boolean
  setSiteDrawer: (open: boolean) => void
  totalAnimalsCount?: number
}

interface PaginationModel {
  page: number
  pageSize: number
}

const Listing: React.FC<SiteListingProps> = ({
  drawerType,
  setDrawerType,
  drawerData,
  setDrawerData,
  siteDrawer,
  setSiteDrawer,
  totalAnimalsCount
}) => {
  const theme = useTheme() as Theme & { palette: any }
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useTranslation()
  const auth = useAuth()
  const searchParams = useSearchParams()

  const [inputValue, setInputValue] = useState<string>(searchParams?.get('search') || '')

  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'))

  const [filters, setFilters] = useState<SiteFilters>({
    page: 1,
    pageSize: 10,
    search: '',
    sortBy: '',
    sortOrder: 'asc'
  })
  const [totalAnimalCount, setTotalAnimalCount] = useState<number>(0)

  const insightsViewAccess = (auth as any)?.userData?.roles?.settings?.housing_view_insights

  // Populate filters from query string on mount
  useEffect(() => {
    const page = searchParams?.get('page') || '1'
    const pageSize = searchParams?.get('pageSize') || '10'
    const search = searchParams?.get('search') || ''
    const sortBy = searchParams?.get('sortBy') || ''
    const sortOrder = searchParams?.get('sortOrder') || 'asc'

    setFilters({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      search,
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc'
    })
  }, [searchParams])

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['sites', filters],
    queryFn: () =>
      getAllSites({
        page_no: filters.page,
        limit: filters.pageSize,
        q: filters.search,
        sort_by: filters.sortBy,
        sort_order: filters.sortOrder
      }),
    placeholderData: keepPreviousData
  })

  const total: number = data?.data?.total_count || 0
  const siteList: Site[] = data?.data?.result || []

  // useEffect(() => {
  //   if (siteList.length === 1) {
  //     router.replace({
  //       pathname: `/housing/sites/${siteList[0].site_id}`,
  //       query: { ...filters }
  //     })
  //   }
  // }, [siteList, router])

  const updateUrlParams = (updatedFilters: SiteFilters): void => {
    const params = new URLSearchParams()
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value.toString())
      }
    })
    router.replace(`${pathname}?${params.toString()}`)
  }

  const handlePaginationModelChange = (model: PaginationModel): void => {
    const updated: SiteFilters = {
      ...filters,
      page: model.page + 1,
      pageSize: model.pageSize
    }
    setFilters(updated)
    updateUrlParams(updated)
  }

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setFilters(prev => {
          const updated: SiteFilters = {
            ...prev,
            search: value,
            page: 1
          }
          updateUrlParams(updated)

          return updated
        })
      }, 500),
    []
  )

  useEffect(() => {
    return () => debouncedSearch.cancel()
  }, [debouncedSearch])

  const handleSearch = useCallback(
    (value: string): void => {
      setInputValue(value)
      debouncedSearch(value)
    },
    [debouncedSearch]
  )

  const handleSortModelChange = (sortModel: GridSortModel): void => {
    let updated: SiteFilters
    if (sortModel.length > 0) {
      const { field, sort } = sortModel[0]
      updated = {
        ...filters,
        sortBy: field,
        sortOrder: sort as 'asc' | 'desc',
        page: 1
      }
    } else {
      updated = {
        ...filters,
        sortBy: '',
        sortOrder: 'asc'
      }
    }
    setFilters(updated)
    updateUrlParams(updated)
  }

  const getSlNo = (index: number): number => (filters.page - 1) * filters.pageSize + index + 1

  const indexedRows: IndexedSiteRow[] = siteList.map((row, index) => ({
    ...row,
    id: +row.site_id,
    sl_no: getSlNo(index)
  }))

  const handleRowClick = (params: GridCellParams): void => {
    router.push(`/housing/sites/${(params.row as IndexedSiteRow).site_id}`)
  }

  const handleDownload = (): void => {
    console.log('Downloading...')
  }

  const handleDrawerClose = (): void => {
    setDrawerType(null)
    setDrawerData(null)
  }

  const columns = [
    {
      width: 100,
      field: 'id',
      headerName: t('s_no'),
      align: 'left' as const,
      headerAlign: 'left' as const,
      sortable: false,
      renderCell: (params: GridCellParams) => (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'left',
            pl: 2
          }}
        >
          <Typography
            sx={{
              color: theme.palette.customColors.neutralSecondary,
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            {parseInt((params.row as IndexedSiteRow).sl_no.toString()) + '.'}
          </Typography>
        </Box>
      )
    },
    {
      width: 330,
      field: 'site_name',
      align: 'left' as const,
      headerName: t('housing_module.site_name'),
      sortable: false,
      renderCell: (params: GridCellParams) => (
        <Box
          sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation()
            handleRowClick(params)
          }}
        >
          <CellInfo
            value={(params.row as IndexedSiteRow).site_name}
            subtitle=''
            color={theme.palette.customColors?.OnSurfaceVariant || ''}
            subtitleColor={theme.palette.customColors?.OnSurfaceVariant || ''}
            imgUrl={(params.row as IndexedSiteRow).images?.[0]?.file}
            defaultImage={'/images/housing/site-icon-colored.svg'}
            defaultImageAlt={'Site'}
            avatarUrl=''
            inchagename=''
          />
        </Box>
      )
    },
    ...(insightsViewAccess
      ? [
          {
            width: 170,
            field: 'species',
            headerName: t('species'),
            align: 'left' as const,
            headerAlign: 'left' as const,
            sortable: false,
            renderCell: (params: GridCellParams) => (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  pl: 2,
                  justifyContent: 'left',
                  cursor: 'pointer'
                }}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation()
                  setDrawerType('species')
                  setDrawerData({
                    queryKey: 'site-species-drawer',
                    id: (params.row as IndexedSiteRow).site_id,
                    name: (params.row as IndexedSiteRow).site_name,
                    image: (params.row as IndexedSiteRow).images?.[0]?.file,
                    params: {
                      site_id: (params.row as IndexedSiteRow).site_id
                    }
                  })
                }}
              >
                <Typography
                  sx={{
                    color: theme.palette.primary.OnSurface,
                    fontSize: '16px',
                    fontWeight: 600
                  }}
                >
                  {(params.row as IndexedSiteRow).species_count || 0}
                </Typography>
              </Box>
            )
          },
          {
            width: 150,
            field: 'animals',
            headerName: t('animals'),
            align: 'left' as const,
            headerAlign: 'left' as const,
            sortable: false,
            renderCell: (params: GridCellParams) => (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'left',
                  pl: 2,
                  cursor: 'pointer'
                }}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation()
                  setDrawerType('animals')
                  setDrawerData({
                    queryKey: 'site-animals-drawer',
                    id: (params.row as IndexedSiteRow).site_id,
                    name: (params.row as IndexedSiteRow).site_name,
                    image: (params.row as IndexedSiteRow).images?.[0]?.file,
                    params: {
                      site_id: (params.row as IndexedSiteRow).site_id
                    }
                  })
                  setTotalAnimalCount((params.row as IndexedSiteRow).animal_count || 0)
                }}
              >
                <Typography
                  sx={{
                    color: theme.palette.primary.OnSurface,
                    fontSize: '16px',
                    fontWeight: 600
                  }}
                >
                  {(params.row as IndexedSiteRow).animal_count || 0}
                </Typography>
              </Box>
            )
          },
          {
            width: 150,
            field: 'sections',
            headerName: t('sections'),
            align: 'left' as const,
            headerAlign: 'left' as const,
            sortable: false,
            renderCell: (params: GridCellParams) => (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'left',
                  pl: 2,
                  cursor: 'pointer'
                }}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation()
                  setDrawerType('sections')
                  setDrawerData({
                    queryKey: 'site-sections-drawer',
                    id: (params.row as IndexedSiteRow)?.site_id,
                    name: (params.row as IndexedSiteRow)?.site_name,
                    image: (params.row as IndexedSiteRow)?.images?.[0]?.file,
                    params: {
                      site_id: (params.row as IndexedSiteRow)?.site_id
                    }
                  })
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: '16px',
                    color: theme.palette.primary.OnSurface
                  }}
                >
                  {(params.row as IndexedSiteRow).section_count}
                </Typography>
              </Box>
            )
          },
          {
            width: 150,
            field: 'enclosures',
            headerName: t('enclosures'),
            align: 'left' as const,
            headerAlign: 'left' as const,
            sortable: false,
            renderCell: (params: GridCellParams) => (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'left',
                  pl: 2,
                  cursor: 'default'
                }}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation()
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: '16px',
                    color: theme.palette.primary.OnSurface
                  }}
                >
                  {(params.row as IndexedSiteRow).enclosure_count}
                </Typography>
              </Box>
            )
          }
        ]
      : []),
    {
      width: 180,
      field: 'incharge',
      headerName: t('in_charge'),
      align: 'left' as const,
      headerAlign: 'left' as const,
      sortable: false,
      renderCell: (params: GridCellParams) => (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'left',
            pl: 2
          }}
        >
          <UserAvatarDetails
            profile_image={(params.row as IndexedSiteRow)?.incharge_image}
            user_name={(params.row as IndexedSiteRow)?.incharge_name}
          />
        </Box>
      )
    },
    {
      flex: 1,
      minWidth: 150,
      field: 'actions',
      headerName: t('actions'),
      align: 'left' as const,
      headerAlign: 'left' as const,
      sortable: false,
      renderCell: (params: GridCellParams) => {
        const phoneNumber = (params.row as IndexedSiteRow).incharge_mobile_no
        let pressTimer: NodeJS.Timeout

        const handleLongPress = (): void => {
          if (phoneNumber) {
            navigator.clipboard.writeText(phoneNumber)
            alert('Number copied to clipboard')
          }
        }

        const handleMouseDown = (): void => {
          pressTimer = setTimeout(handleLongPress, 700)
        }

        const handleMouseUp = (): void => {
          clearTimeout(pressTimer)
        }

        return isSmallScreen ? (
          phoneNumber ? (
            <Box
              display='flex'
              gap={4}
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'left',
                pl: 2
              }}
            >
              {/* Call Icon */}
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
              {/* Message Icon */}
              <Box
                component='img'
                src='/images/message.png' // <-- Replace with your message icon path
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
    }
  ]

  // if (siteList.length === 1) {
  //   // Loader while redirecting to details page
  //   return (
  //     <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
  //       <CircularProgress />
  //     </Box>
  //   )
  // }

  return (
    <>
      <Box sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, flexWrap: 'wrap' }}>
          <ListingHeader title={t('housing_module.all_sites')} totalCount={total} />
          <Search
            value={inputValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
            onClear={() => handleSearch('')}
            placeholder={t('search') as string}
            sx={{ justifyContent: 'flex-end' }}
          />
          {/* <ExportButton loading={downloading} onClick={handleDownload} /> */}
        </Box>
        <Grid
          sx={{
            '& .MuiDataGrid-columnHeaderTitle': {
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '12px',
              fontWeight: 600
            }
          }}
        >
          <CommonTable
            // onCellClick={handleRowClick}
            indexedRows={indexedRows}
            total={total}
            columns={columns}
            pageSizeOptions={[10]}
            paginationModel={{ page: filters.page - 1, pageSize: filters.pageSize }}
            setPaginationModel={handlePaginationModelChange}
            handleSortModel={handleSortModelChange}
            loading={isFetching}
            getRowHeight={() => 60}
            searchValue=''
            maxHeight='80vh'
          />
        </Grid>
      </Box>

      {drawerType === 'sections' && (
        <SectionsDrawer open={!!drawerData} onClose={handleDrawerClose} data={drawerData} />
      )}
      {drawerType === 'species' && <SpeciesDrawer open={!!drawerData} onClose={handleDrawerClose} data={drawerData} />}
      {drawerType === 'animals' && (
        <AnimalsDrawer
          totalCount={totalAnimalCount}
          open={!!drawerData}
          onClose={handleDrawerClose}
          data={drawerData}
          defaultImage={'/images/housing/site-icon-colored.svg'}
        />
      )}
      {drawerType === 'insights-animals' && (
        <AnimalsDrawer
          totalCount={totalAnimalsCount}
          open={!!drawerData}
          onClose={handleDrawerClose}
          data={drawerData}
          defaultImage={'/images/housing/site-icon-colored.svg'}
        />
      )}
      {drawerType === 'enclosures' && (
        <EnclosureDrawer open={!!drawerData} onClose={handleDrawerClose} data={drawerData} />
      )}
      {siteDrawer && <AddSiteDrawer open={siteDrawer} setSiteDrawer={setSiteDrawer} refetch={refetch} />}
    </>
  )
}

export default React.memo(Listing)
