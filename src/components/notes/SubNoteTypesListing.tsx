'use client'

import React, { useState, useMemo } from 'react'
import { Box, Button, Card, CardHeader, Typography, useTheme, IconButton, Tooltip } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useRouter, useParams } from 'next/navigation'
import Icon from 'src/@core/components/icon'
import { useQuery } from '@tanstack/react-query'
import { Add as AddIcon } from '@mui/icons-material'
import { GridRenderCellParams, GridColDef } from '@mui/x-data-grid'
import CommonTable from 'src/views/table/data-grid/CommonTable'
import DynamicBreadcrumbs from 'src/views/utility/DynamicBreadcrumbs'
import { getChildNoteTypesList, getNoteTypesList } from 'src/lib/api/notesModule'
import { IndexedNoteTypeRow, NoteTypeItem } from 'src/types/notes'
import TextEllipsisWithModal from 'src/components/TextEllipsisWithModal'
import AddSubNoteTypeDrawer from './AddSubNoteTypeDrawer'
import AddNoteTypeDrawer from './AddNoteTypeDrawer'

const SubNoteTypeListing = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const theme = useTheme() as any

  const [openDrawer, setOpenDrawer] = useState<boolean>(false)
  const [editSubNote, setEditSubNote] = useState<NoteTypeItem | null>(null)
  const [openParentNoteDrawer, setOpenParentNoteDrawer] = useState<boolean>(false)
  const [editParentNoteType, setEditParentNoteType] = useState<NoteTypeItem | null>(null)

  const { data: childNoteTypes = [], isLoading: loading } = useQuery<NoteTypeItem[]>({
    queryKey: ['child', id],
    queryFn: async () => {
      const res = await getChildNoteTypesList(id as string)

      return res?.success ? res?.data : []
    },
    enabled: !!id
  })

  const indexedRows = useMemo(() => {
    return childNoteTypes?.map((row, index) => ({
      ...row,
      sl_no: index + 1
    }))
  }, [childNoteTypes])

  const { data: parentNoteTypes = [] } = useQuery<NoteTypeItem[]>({
    queryKey: ['noteTypes', 'parent'],
    queryFn: async () => {
      const res = await getNoteTypesList({ type: 'parent' })

      return res?.success ? res?.data : []
    }
  })

  const parentNoteType = parentNoteTypes?.find(note => String(note.id) === String(id))
  const parentTitle = parentNoteType
    ? (t(parentNoteType.string_id || '', { defaultValue: parentNoteType.type_name }) as string)
    : ''

  const openEditSubNoteTypeDrawer = (params: GridRenderCellParams<IndexedNoteTypeRow>) => {
    if (Number(params?.row?.zoo_id) !== 0) {
      setOpenDrawer(true)
      setEditSubNote(params?.row)
    }
  }

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
      headerName: t('notes_module.sub_note_types'),
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
    },
    {
      minWidth: 50,
      field: 'action',
      headerName: t('action'),
      sortable: false,
      renderCell: (params: GridRenderCellParams<IndexedNoteTypeRow>) => {
        return (
          Number(params?.row?.zoo_id) !== 0 && (
            <Tooltip title='Edit'>
              <IconButton
                onClick={e => {
                  e.stopPropagation()
                  openEditSubNoteTypeDrawer(params)
                }}
                size='small'
              >
                <Icon icon='mdi:pencil-outline' style={{ color: theme.palette.customColors.OnSurfaceVariant }} />
              </IconButton>
            </Tooltip>
          )
        )
      }
    }
  ]

  const openAddSubNoteTypeDrawer = () => {
    setEditSubNote(null)
    setOpenDrawer(true)
  }

  const openEditParentNoteDrawer = () => {
    if (!parentNoteType) return
    setEditParentNoteType(parentNoteType)
    setOpenParentNoteDrawer(true)
  }

  const closeParentNoteDrawer = () => {
    setOpenParentNoteDrawer(false)
    setEditParentNoteType(null)
  }

  return (
    <>
      <DynamicBreadcrumbs
        sx={{ mb: 6, color: theme.palette.customColors.neutralSecondary }}
        pageItems={[
          { title: t('notes') },
          { title: t('navigation.masters') },
          { title: t('navigation.note_types'), onClick: () => router.back() },
          { title: t('notes_module.sub_note_types') }
        ]}
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
              {parentTitle}
            </Typography>
          }
          action={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {Number(parentNoteType?.zoo_id) !== 0 && (
                <Tooltip title='Edit Note Type'>
                  <IconButton onClick={openEditParentNoteDrawer} size='small'>
                    <Icon icon='mdi:pencil-outline' style={{ color: theme.palette.customColors.OnSurfaceVariant }} />
                  </IconButton>
                </Tooltip>
              )}

              <Button
                variant='contained'
                startIcon={<AddIcon />}
                sx={{ py: 2, px: 3, borderRadius: '4px' }}
                onClick={openAddSubNoteTypeDrawer}
              >
                {t('notes_module.add_sub_note_type')}
              </Button>
            </Box>
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
            total={childNoteTypes?.length}
            hideFooterPagination={true}
            loading={loading}
          />
        </Box>
      </Card>

      {openDrawer && (
        <AddSubNoteTypeDrawer
          openDrawer={openDrawer}
          closeDrawer={() => setOpenDrawer(false)}
          editSubNote={editSubNote}
          noteTypeId={id}
          parentTitle={parentTitle}
        />
      )}

      {openParentNoteDrawer && (
        <AddNoteTypeDrawer
          openDrawer={openParentNoteDrawer}
          closeDrawer={closeParentNoteDrawer}
          editNoteType={editParentNoteType}
        />
      )}
    </>
  )
}

export default SubNoteTypeListing
