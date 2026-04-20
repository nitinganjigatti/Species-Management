'use client'

import React, { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Button, Card, CardHeader, Typography, useTheme } from '@mui/material'
import { useRouter } from 'next/navigation'
import { Add as AddIcon } from '@mui/icons-material'
import { GridRenderCellParams, GridColDef, GridPaginationModel, GridRowParams } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import DynamicBreadcrumbs from 'src/views/utility/DynamicBreadcrumbs'
import { getNoteTypesList } from 'src/lib/api/notesModule'
import TextEllipsisWithModal from 'src/components/TextEllipsisWithModal'
import AddNoteTypeDrawer from './AddNoteTypeDrawer'
import { IndexedNoteTypeRow, NoteTypeItem } from 'src/types/notes'

const NoteTypeListing = () => {
  const { t } = useTranslation()
  const theme = useTheme() as any
  const router = useRouter()
  const [openDrawer, setOpenDrawer] = useState<boolean>(false)
  const [editNoteType, setEditNoteType] = useState<NoteTypeItem | null>(null)

  const {
    data: noteTypes = [],
    isLoading: loading,
    refetch: fetchNoteTypes
  } = useQuery<NoteTypeItem[]>({
    queryKey: ['noteTypes', 'parent'],
    queryFn: async () => {
      const res = await getNoteTypesList({ type: 'parent' })

      return res?.success ? res?.data : []
    }
  })

  const indexedRows = useMemo(() => {
    return noteTypes?.map((row, index) => ({
      ...row,
      sl_no: index + 1
    }))
  }, [noteTypes])

  const columns: GridColDef[] = [
    {
      minWidth: 50,
      field: 'id',
      headerName: t('s_no'),
      sortable: false,
      renderCell: (params: GridRenderCellParams<IndexedNoteTypeRow>) => (
        <Typography sx={{ pl: 3, fontSize: '0.75rem' }}>{params?.row?.sl_no}</Typography>
      )
    },
    {
      flex: 1,
      minWidth: 200,
      field: 'type_name',
      headerName: t('notes_module.type_name'),
      sortable: false,
      renderCell: (params: GridRenderCellParams<IndexedNoteTypeRow>) => (
        <TextEllipsisWithModal
          enableDialog={false}
          text={t(params?.row?.string_id || '', { defaultValue: params?.row?.type_name }) as string}
          style={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontSize: '1rem',
            fontWeight: 400,
            pl: 1.4,
            maxWidth: '100%',
            cursor: 'pointer'
          }}
        />
      )
    }
  ]

  const handleCellClick = (params: GridRowParams<IndexedNoteTypeRow>): void => {
    router.push(`/notes/masters/note-types/${params?.row?.id}`)
  }

  const closeDrawer = () => {
    setOpenDrawer(false)
    setEditNoteType(null)
  }

  return (
    <>
      <DynamicBreadcrumbs
        sx={{ mb: 6, color: theme.palette.customColors.neutralSecondary }}
        pageItems={[{ title: t('notes') }, { title: t('navigation.masters') }, { title: t('navigation.note_types') }]}
      />
      <Card sx={{ p: 6 }}>
        <CardHeader
          sx={{
            display: 'flex',
            padding: '0 0 24px 0'
          }}
          title={
            <Typography
              sx={{
                color: theme.palette.customColors.onSurfaceVariant,
                fontSize: '1.25rem',
                fontWeight: 500
              }}
            >
              {t('navigation.note_types')}
            </Typography>
          }
          action={
            <Button
              variant='contained'
              startIcon={<AddIcon />}
              sx={{ py: 2, px: 3, borderRadius: '4px' }}
              onClick={() => setOpenDrawer(true)}
            >
              {t('notes_module.add_note_type')}
            </Button>
          }
        />
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: { xs: 'space-between', sm: 'normal' },
            gap: 6,
            mb: 1
          }}
        >
          <CommonTable
            columns={columns}
            indexedRows={indexedRows}
            rowHeight={60}
            total={noteTypes?.length}
            hideFooterPagination={true}
            loading={loading}
            onCellClick={handleCellClick}
          />
        </Box>
      </Card>

      {openDrawer && (
        <AddNoteTypeDrawer
          openDrawer={openDrawer}
          closeDrawer={closeDrawer}
          refetch={fetchNoteTypes}
          editNoteType={editNoteType}
        />
      )}
    </>
  )
}

export default NoteTypeListing
