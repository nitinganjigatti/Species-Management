import { useTheme } from '@emotion/react'
import { useTranslation } from 'react-i18next'
import { Avatar, Box, debounce, Grid, Typography, Theme } from '@mui/material'
import useSafeRouter from 'src/hooks/useSafeRouter'
import React, { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import CommonTable from 'src/views/table/data-grid/CommonTable'
import Search from 'src/views/utility/Search'
import ListingHeader from 'src/views/pages/housing/utils/ListingHeader'
import { fetchNotes, setPagination } from 'src/store/slices/housing/notesSlice'
import { RootState, AppDispatch } from 'src/store/store'
import { Note, IndexedNoteRow } from 'src/types/housing'
import { GridCellParams } from '@mui/x-data-grid'

interface PaginationModel {
  page: number
  pageSize: number
}

const NotesListng: React.FC = () => {
  const { t } = useTranslation()
  const theme = useTheme() as Theme & { palette: any }
  const router = useSafeRouter()
  const [searchValue, setSearchValue] = useState<string>('')
  const [downloadLoading, setDownloadLoading] = useState<boolean>(false)
  const { id } = router.query
  const dispatch = useDispatch<AppDispatch>()

  const { list: noteList, loading, total, page, pageSize } = useSelector((state: RootState) => state.notes)

  useEffect(() => {
    dispatch(fetchNotes({ id: id as string, type: 'site', page_no: page, limit: pageSize, q: searchValue }))
  }, [dispatch, page, pageSize])

  const handlePaginationModelChange = (model: PaginationModel): void => {
    const newPage = model.page + 1
    const newPageSize = model.pageSize

    if (newPage !== page || newPageSize !== pageSize) {
      dispatch(setPagination({ page: newPage, pageSize: newPageSize }))
    }
  }

  const searchTableData = useCallback(
    debounce(async (value: string) => {
      setSearchValue(value)
      try {
        dispatch(fetchNotes({ id: id as string, type: 'site', page_no: page, limit: pageSize, q: value }))
      } catch (error) {
        console.error(error)
      }
    }, 1000),
    []
  )

  const handleSearch = useCallback(
    (value: string): void => {
      setSearchValue(value)
      dispatch(setPagination({ page: 1, pageSize })) // Reset to page 1
      searchTableData(value)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchValue]
  )

  const getSlNo = (index: number): number => (page - 1) * pageSize + index + 1

  const indexedRows: IndexedNoteRow[] = noteList?.map((row: Note, index: number) => ({
    ...row,
    id: row?.observation_id,
    sl_no: getSlNo(index)
  }))

  // const handleRowClick = params => {
  //   router.push({
  //     pathname: `/housing/sites/${params.row.site_id}`
  //   })
  // }

  const columns = [
    {
      width: 100,
      field: 'id',
      headerName: t('s_no'),
      align: 'left' as const,
      headerAlign: 'left' as const,
      renderCell: (params: GridCellParams) => (
        <Typography sx={{ color: theme.palette.customColors.neutralSecondary, fontSize: '14px', fontWeight: 500 }}>
          {parseInt((params.row as IndexedNoteRow).sl_no.toString()) + '.'}
        </Typography>
      )
    },
    {
      width: 200,
      field: 'observation_name',
      align: 'center' as const,
      headerAlign: 'left' as const,
      headerName: t('housing_module.observation_name'),
      renderCell: (params: GridCellParams) => {
        return (
          <Box display='flex' alignItems='center' width='100%' gap={2}>
            <Typography
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '180px',
                color: theme.palette.customColors.OnSurfaceVariant,
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              {(params.row as IndexedNoteRow & { observation_name?: string }).observation_name
                ? (params.row as IndexedNoteRow & { observation_name?: string }).observation_name
                : 'NA'}
            </Typography>
          </Box>
        )
      }
    },
    {
      width: 200,
      field: 'priority',
      headerName: t('priority'),
      align: 'left' as const,
      headerAlign: 'left' as const,
      renderCell: (params: GridCellParams) => (
        <Typography sx={{ color: theme.palette.primary.OnSurface, fontSize: '14px', fontWeight: 600 }}>
          {(params.row as IndexedNoteRow).priority ? (params.row as IndexedNoteRow).priority : '-'}
        </Typography>
      )
    },
    {
      width: 200,
      field: 'created_by_phone',
      headerName: t('phone'),
      align: 'left' as const,
      headerAlign: 'left' as const,
      renderCell: (params: GridCellParams) => (
        <Typography sx={{ color: theme.palette.primary.OnSurface, fontSize: '14px', fontWeight: 600 }}>
          {(params.row as IndexedNoteRow & { created_by_phone?: string }).created_by_phone || 0}
        </Typography>
      )
    },
    {
      width: 200,
      field: 'created_by',
      headerName: t('created_by'),
      align: 'left' as const,
      headerAlign: 'left' as const,
      renderCell: (params: GridCellParams) => (
        <Typography sx={{ color: theme.palette.primary.OnSurface, fontSize: '16px', fontWeight: 600 }}>
          {(params.row as IndexedNoteRow).created_by}
        </Typography>
      )
    },

    {
      flex: 1,
      minWidth: 200,
      field: 'actions',
      headerName: t('actions'),
      align: 'center' as const,
      headerAlign: 'center' as const,
      renderCell: () => (
        <Box display='flex' justifyContent='center' alignItems='center' gap={3}>
          <Box component='img' src='/images/call.png' alt='Phone' sx={{ width: 20, height: 20, cursor: 'pointer' }} />
          <Box
            component='img'
            src='/images/message.png'
            alt='Message'
            sx={{ width: 20, height: 20, cursor: 'pointer' }}
          />
        </Box>
      )
    }
  ]

  const handleDownload = (): void => {
    // download logic here
    console.log('Downloading...')
  }

  return (
    <>
      <ListingHeader title={t('notes')} totalCount={total} />
      <Box>
        <Search
          value={searchValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
          onClear={() => handleSearch('')}
          placeholder={t('search') as string}
          sx={{ mt: 2 }}
        />
        <Grid>
          <CommonTable
            onRowClick={() => {}}
            indexedRows={indexedRows}
            total={total}
            columns={columns}
            pageSizeOptions={[10]}
            paginationModel={{
              page: page - 1,
              pageSize: pageSize
            }}
            setPaginationModel={handlePaginationModelChange}
            paginationMode='server'
            loading={loading}
            searchValue={searchValue}
            maxHeight='80vh'
          />
        </Grid>
      </Box>
    </>
  )
}

export default NotesListng
