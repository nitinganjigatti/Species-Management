import { useTheme } from '@emotion/react'
import { Box, Grid, Typography, useMediaQuery, Theme } from '@mui/material'
import { useRouter, useParams, usePathname, useSearchParams } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import debounce from 'lodash/debounce'
import { getAllSections } from 'src/lib/api/housing'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import Search from 'src/views/utility/Search'
import ListingHeader from '../../../views/pages/housing/utils/ListingHeader'
import { CellInfo } from 'src/utility/render'
import EnclosureDrawer from '../utils/EnclosureDrawer'
import SpeciesDrawer from '../utils/SpeciesDrawer'
import AnimalDrawer from '../utils/AnimalDrawer'
import { useAuth } from 'src/hooks/useAuth'
import UserAvatarDetails from 'src/views/utility/UserAvatarDetails'
import { DrawerType, DrawerData, SectionFilters, IndexedSectionRow, Section } from 'src/types/housing'
import { GridCellParams, GridSortModel } from '@mui/x-data-grid'

interface SectionListingProps {
  selectedTab?: string
  setSelectedTab?: (tab: string) => void
  drawerType: DrawerType
  setDrawerType: (type: DrawerType) => void
  drawerData: DrawerData | null
  setDrawerData: (data: DrawerData | null) => void
  addSuccessCheck?: boolean
  siteId?: string | number
  entityId?: string | number
}

interface PaginationModel {
  page: number
  pageSize: number
}

const SectionListing: React.FC<SectionListingProps> = ({
  selectedTab,
  setSelectedTab,
  drawerType,
  setDrawerType,
  drawerData,
  setDrawerData,
  addSuccessCheck,
  siteId,
  entityId
}) => {
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const routerParams = useParams<{ id: string }>()
  const routerId = routerParams?.id
  const id = siteId ?? entityId ?? routerId
  const theme = useTheme() as Theme & { palette: any }

  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'))

  const searchParams = useSearchParams()
  const [downloading, setDownloading] = useState<boolean>(false)
  const [inputValue, setInputValue] = useState<string>(searchParams?.get('sectionSearch') || '')

  const [filters, setFilters] = useState<SectionFilters>({
    page: 1,
    pageSize: 10,
    search: '',
    sortBy: '',
    sortOrder: 'asc'
  })

  const [totalCount, setTotalCount] = useState<number>(0)

  const auth = useAuth()
  const insightsViewAccess = (auth as any)?.userData?.roles?.settings?.housing_view_insights

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['sections', id, filters],
    queryFn: () =>
      getAllSections({
        site_id: Number(id),
        page_no: filters.page,
        limit: filters.pageSize,
        search: filters.search,
        sort_by: filters.sortBy,
        sort_order: filters.sortOrder as 'asc' | 'desc' | undefined
      }),
    enabled: !!id,
    placeholderData: keepPreviousData
  })

  const sectionList: Section[] = data?.data?.result || []
  const total: number = data?.data?.total_count || 0

  const updateUrlParams = (updatedFilters: SectionFilters): void => {
    const updatedQuery = {
      sectionPage: updatedFilters.page,
      sectionPageSize: updatedFilters.pageSize,
      sectionSearch: updatedFilters.search,
      sectionSortBy: updatedFilters.sortBy,
      sectionSortOrder: updatedFilters.sortOrder
    }

    const params = new URLSearchParams()
    Object.entries(updatedQuery).forEach(([k, v]) => {
      if (v) params.set(k, v.toString())
    })
    router.replace(`${pathname}?${params.toString()}`)
  }

  const getSlNo = (index: number): number => (filters.page - 1) * filters.pageSize + index + 1

  const indexedRows: IndexedSectionRow[] = sectionList.map((row, index) => ({
    ...row,
    id: +row?.section_id,
    sl_no: getSlNo(index)
  }))

  const handlePaginationModelChange = (model: PaginationModel): void => {
    const updated: SectionFilters = {
      ...filters,
      page: model.page + 1,
      pageSize: model.pageSize
    }
    setFilters(updated)
    updateUrlParams(updated)
  }

  const handleSortModelChange = (sortModel: GridSortModel): void => {
    let updated: SectionFilters
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

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setFilters(prev => {
          const updated: SectionFilters = {
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

  const handleSearch = (value: string): void => {
    setInputValue(value)
    debouncedSearch(value)
  }

  const handleDownload = (): void => {
    if (!indexedRows || indexedRows.length === 0) return

    setDownloading(true)

    const csvHeader = ['SL.NO', 'Section Name', 'Species Count', 'Animal Count', 'Enclosure Count', 'In-Charge']

    const csvRows = indexedRows.map(row => [
      row.sl_no,
      `"${row.section_name}"`,
      row.species_count || 0,
      row.animal_count || 0,
      row.enclosure_count || 0,
      `"${row.incharge_name || '-'}"`
    ])

    const csvContent = [csvHeader.join(','), ...csvRows.map(row => row.join(','))].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `sections_export_${new Date().toISOString()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setDownloading(false)
  }

  const handleRowClick = (params: GridCellParams): void => {
    if (
      params.field === 'actions' ||
      params.field === 'id' ||
      params.field === 'species' ||
      params.field === 'animals' ||
      params.field === 'enclosures'
    ) {
      return
    }
    router.push(`/housing/sites/${id}/section/${(params.row as IndexedSectionRow).section_id}`)
  }

  useEffect(() => {
    setFilters(prev => ({
      page: Number(searchParams?.get('sectionPage')) || 1,
      pageSize: Number(searchParams?.get('sectionPageSize')) || 10,
      search: searchParams?.get('sectionSearch') || '',
      sortBy: searchParams?.get('sectionSortBy') || '',
      sortOrder: (searchParams?.get('sectionSortOrder') as 'asc' | 'desc') || 'asc'
    }))
    setInputValue(searchParams?.get('sectionSearch') || '')
  }, [searchParams])

  const handleDrawerClose = (): void => {
    setDrawerType(null)
    setDrawerData(null)
  }

  useEffect(() => {
    if (addSuccessCheck) {
      refetch()
    }
  }, [addSuccessCheck, refetch])

  const columns = [
    {
      width: 90,
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
            {parseInt((params.row as IndexedSectionRow).sl_no.toString()) + '.'}
          </Typography>
        </Box>
      )
    },
    {
      width: 350,
      field: 'section_name',
      headerName: t('housing_module.section_name'),
      sortable: false,
      renderCell: (params: GridCellParams) => (
        <CellInfo
          value={(params.row as IndexedSectionRow).section_name}
          subtitle={''}
          color={theme.palette.customColors?.OnSurfaceVariant || ''}
          subtitleColor={theme.palette.customColors?.OnSurfaceVariant || ''}
          imgUrl={(params.row as IndexedSectionRow).images?.find((img: any) => img?.display_type === 'banner')?.file}
          defaultImage={'/images/housing/section-icon-colored.png'}
          defaultImageAlt={'Section'}
          avatarUrl={''}
          inchagename={''}
        />
      )
    },
    ...(insightsViewAccess
      ? [
          {
            width: 180,
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
                  cursor: 'pointer',
                  justifyContent: 'left',
                  pl: 2
                }}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation()
                  setDrawerType('species')
                  setDrawerData({
                    queryKey: 'section-species-drawer',
                    id: (params.row as IndexedSectionRow).section_id,
                    name: (params.row as IndexedSectionRow).section_name,
                    image: (params.row as IndexedSectionRow).images?.find((img: any) => img?.display_type === 'banner')
                      ?.file,
                    params: {
                      section_id: (params.row as IndexedSectionRow).section_id
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
                  {(params.row as IndexedSectionRow).species_count || 0}
                </Typography>
              </Box>
            )
          },
          {
            width: 150,
            field: 'animals',
            headerName: t('animals'),
            headerAlign: 'left' as const,
            align: 'left' as const,
            sortable: false,
            renderCell: (params: GridCellParams) => (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  justifyContent: 'left',
                  pl: 2
                }}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation()
                  setDrawerType('animals')
                  setTotalCount((params.row as IndexedSectionRow).animal_count || 0)
                  setDrawerData({
                    queryKey: 'section-animals-drawer',
                    id: (params.row as IndexedSectionRow).section_id,
                    name: (params.row as IndexedSectionRow).section_name,
                    image: (params.row as IndexedSectionRow).images?.find((img: any) => img?.display_type === 'banner')
                      ?.file,
                    params: {
                      section_id: (params.row as IndexedSectionRow).section_id
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
                  {(params.row as IndexedSectionRow).animal_count || 0}
                </Typography>
              </Box>
            )
          },
          {
            width: 150,
            field: 'enclosures',
            headerName: t('enclosures'),
            headerAlign: 'left' as const,
            align: 'left' as const,
            sortable: false,
            renderCell: (params: GridCellParams) => (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'default',
                  justifyContent: 'left',
                  pl: 2
                }}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation()
                }}
              >
                <Typography
                  sx={{
                    color: theme.palette.primary.OnSurface,
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: 'default'
                  }}
                >
                  {(params.row as IndexedSectionRow).enclosure_count || 0}
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
        <UserAvatarDetails
          profile_image={(params.row as IndexedSectionRow)?.incharge_image}
          user_name={(params.row as IndexedSectionRow)?.incharge_name}
        />
      )
    },
    {
      width: 150,
      field: 'actions',
      headerName: t('actions'),
      align: 'left' as const,
      headerAlign: 'left' as const,
      sortable: false,
      renderCell: (params: GridCellParams) => {
        const phoneNumber = (params.row as IndexedSectionRow).incharge_mobile_no
        let pressTimer: NodeJS.Timeout

        const handleLongPress = (): void => {
          if (phoneNumber) {
            navigator.clipboard.writeText(phoneNumber)
            alert(t('housing_module.number_copied_to_clipboard'))
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
    }
  ]

  return (
    <>
      <Box sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, flexWrap: 'wrap' }}>
          <ListingHeader title={t('housing_module.all_sections')} totalCount={insightsViewAccess ? total : 0} />
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
            '& .MuiDataGrid-cell': {
              pt: 4,
              py: 4,
              px: 4
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: '12px',
              fontWeight: 600,
              mr: 1
            }
          }}
        >
          <CommonTable
            onCellClick={handleRowClick}
            indexedRows={indexedRows}
            total={total}
            columns={columns}
            pageSizeOptions={[10]}
            paginationModel={{
              page: filters.page - 1,
              pageSize: filters.pageSize
            }}
            setPaginationModel={handlePaginationModelChange}
            handleSortModel={handleSortModelChange}
            getRowHeight={() => 60}
            loading={isFetching}
            searchValue=''
            maxHeight='80vh'
          />
        </Grid>
      </Box>
      {drawerType === 'species' && <SpeciesDrawer open={!!drawerData} onClose={handleDrawerClose} data={drawerData} />}
      {drawerType === 'animals' && (
        <AnimalDrawer
          totalCount={totalCount}
          open={!!drawerData}
          onClose={handleDrawerClose}
          data={drawerData}
          defaultImage={'/images/housing/section-icon-colored.png'}
        />
      )}
      {drawerType === 'enclosures' && (
        <EnclosureDrawer open={!!drawerData} onClose={handleDrawerClose} data={drawerData} />
      )}
    </>
  )
}

export default React.memo(SectionListing)
