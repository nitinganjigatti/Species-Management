import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Box, Typography, CircularProgress, Button, Chip } from '@mui/material'
import { useTheme, alpha } from '@mui/material/styles'
import useSafeRouter from 'src/hooks/useSafeRouter'
import { useDispatch, useSelector } from 'react-redux'
import { useInView } from 'react-intersection-observer'
import { FilterList as FilterIcon, Add as AddIcon } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'

import ObservationNoteCard from 'src/components/notes/ObservationNoteCard'
import ListingHeader from 'src/views/pages/housing/utils/ListingHeader'
import NoteCommentDialog from './NoteCommentDialog'
import NoteDetailsDrawer from './NoteDetailsDrawer'
import NoteFilterDrawer from './NoteFilterDrawer'
import AddNoteDrawer from './AddNoteDrawer'
import {
  fetchNotes,
  fetchObservationMasterList,
  fetchUsers,
  setPagination,
  setFilters,
  clearFilters,
  clearNotes,
  updateNoteLike
} from 'src/store/slices/housing/notesSlice'
import { addNoteReaction, removeNoteReaction, addObservationComment } from 'src/lib/api/housing'
import { useAuth } from 'src/hooks/useAuth'
import Toaster from 'src/components/Toaster'
import type { Note, NotesFilters } from 'src/types/housing'
import type { RootState, AppDispatch } from 'src/store'

interface NotesListingProps {
  refType?: 'site' | 'section' | 'enclosure' | 'animal'
  entityName?: string
  entityImage?: string
  animalData?: any
}

interface CommentSubmitData {
  observation_id: number
  notes: string
}

interface NotesQueryParams {
  id: string | number
  type: 'site' | 'section' | 'enclosure' | 'animal'
  page_no: number
  limit: number
  note_type?: string | number
  priority?: string
  created_by?: string | number
  tagged_to?: string | number
}

const getPriorityBgColor = (priority: string | undefined, theme: any) => {
  switch (priority) {
    case 'Low':
      return theme.palette.customColors?.displaybgPrimary
    case 'Moderate':
      return alpha(theme.palette.customColors?.moderateSecondary, 0.2)
    case 'High':
      return alpha(theme.palette.customColors?.TertiaryContainer, 0.16)
    case 'Critical':
      return alpha(theme.palette.customColors?.ErrorContainer, 0.4)
    default:
      return theme.palette.customColors?.antzSecondaryBg
  }
}

const NotesListing: React.FC<NotesListingProps> = ({ refType = 'site', entityName, entityImage, animalData }) => {
  const router = useSafeRouter()
  const theme = useTheme() as any
  const dispatch = useDispatch<AppDispatch>()
  const auth = useAuth()
  const { t } = useTranslation()
  const { id } = router.query

  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [commentDialogOpen, setCommentDialogOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [commentLoading, setCommentLoading] = useState(false)
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false)
  const [addNoteDrawerOpen, setAddNoteDrawerOpen] = useState(false)

  const zooId = (auth as any)?.userData?.user?.zoos?.[0]?.zoo_id

  const { list: noteList, loading, total, page, pageSize, filters } = useSelector((state: RootState) => state.notes)

  const { ref: loaderRef, inView } = useInView({ threshold: 0 })
  const cooldownRef = useRef(false)
  const prevIdRef = useRef<string | string[] | undefined>(undefined)
  const handleLoadMoreRef = useRef<() => void>(() => {})
  const skipNextFilterEffect = useRef(true)

  useEffect(() => {
    dispatch(fetchObservationMasterList())
    if (zooId) {
      dispatch(fetchUsers({ zoo_id: zooId }))
    }
  }, [dispatch, zooId])

  const buildQueryParams = useCallback(
    (overridePage?: number): NotesQueryParams => {
      const params: NotesQueryParams = {
        id: Array.isArray(id) ? id[0] : id || '',
        type: refType,
        page_no: overridePage ?? page,
        limit: pageSize
      }

      if (filters.noteType) params.note_type = String(filters.noteType)
      if (filters.priority) params.priority = String(filters.priority)
      if (filters.createdBy) params.created_by = String(filters.createdBy)
      if (filters.taggedTo) params.tagged_to = String(filters.taggedTo)

      return params
    },
    [id, refType, page, pageSize, filters]
  )

  useEffect(() => {
    if (id && id !== prevIdRef.current) {
      skipNextFilterEffect.current = true
      dispatch(clearNotes())

      dispatch(
        fetchNotes({
          id: Array.isArray(id) ? id[0] : id,
          type: refType,
          page_no: 1,
          limit: pageSize
        })
      )

      prevIdRef.current = id
    }
  }, [dispatch, id, refType, pageSize])

  useEffect(() => {
    if (skipNextFilterEffect.current) {
      skipNextFilterEffect.current = false
      return
    }
    if (id && id === prevIdRef.current) {
      dispatch(fetchNotes(buildQueryParams(1)))
      dispatch(setPagination({ page: 1, pageSize }))
    }
  }, [filters])

  useEffect(() => {
    return () => {
      dispatch(clearNotes())
    }
  }, [])

  const handleLoadMore = useCallback(() => {
    if (cooldownRef.current || loading || noteList.length >= total) return

    cooldownRef.current = true
    const nextPage = page + 1
    dispatch(setPagination({ page: nextPage, pageSize }))
    dispatch(fetchNotes(buildQueryParams(nextPage)))

    setTimeout(() => {
      cooldownRef.current = false
    }, 300)
  }, [dispatch, loading, noteList.length, total, page, pageSize, buildQueryParams])

  handleLoadMoreRef.current = handleLoadMore

  useEffect(() => {
    if (inView) {
      handleLoadMoreRef.current()
    }
  }, [inView])

  const handleFilterApply = (appliedFilters: Partial<NotesFilters>) => {
    dispatch(setFilters(appliedFilters))
  }

  const handleClearFilters = () => {
    dispatch(clearFilters())
  }

  const hasActiveFilters = Object.values(filters).some(v => v !== null)

  const totalFilterCount = Object.values(filters)
    .filter(v => v !== null)
    .reduce((sum, v) => sum + String(v).split(',').filter(Boolean).length, 0)

  const handleNoteClick = (note: Note) => {
    setSelectedNote(note)
    setDetailsDrawerOpen(true)
  }

  // Handle add note
  const handleAddNote = () => {
    setAddNoteDrawerOpen(true)
  }

  const handleAddNoteSuccess = () => {
    dispatch(setPagination({ page: 1, pageSize }))
    dispatch(
      fetchNotes({
        id: Array.isArray(id) ? id[0] : id || '',
        type: refType,
        page_no: 1,
        limit: pageSize,
        ...(filters.noteType && { note_type: String(filters.noteType) }),
        ...(filters.priority && { priority: String(filters.priority) }),
        ...(filters.createdBy && { created_by: String(filters.createdBy) }),
        ...(filters.taggedTo && { tagged_to: String(filters.taggedTo) })
      })
    )
  }

  const handleLikeClick = async (note: Note) => {
    const isLiked = note.user_reaction === 'like'
    const newLikedState = !isLiked

    dispatch(updateNoteLike({ observationId: note.observation_id, isLiked: newLikedState }))

    try {
      if (isLiked) {
        await removeNoteReaction(note.observation_id)
      } else {
        await addNoteReaction(note.observation_id)
      }

      Toaster({
        type: 'success',
        message: isLiked ? 'Like removed' : 'Liked successfully'
      })
    } catch (error) {
      dispatch(updateNoteLike({ observationId: note.observation_id, isLiked: isLiked }))
      console.error('Error toggling like:', error)
      Toaster({
        type: 'error',
        message: 'Failed to update like'
      })
    }
  }

  const handleCommentClick = (note: Note) => {
    setSelectedNote(note)
    setCommentDialogOpen(true)
  }

  const handleCommentSubmit = async (data: CommentSubmitData) => {
    setCommentLoading(true)
    try {
      const formData = new FormData()
      formData.append('observation_id', data.observation_id.toString())
      formData.append('notes', data.notes)

      await addObservationComment(formData)

      setCommentDialogOpen(false)
      setSelectedNote(null)

      dispatch(fetchNotes(buildQueryParams()))

      Toaster({
        type: 'success',
        message: 'Comment added successfully'
      })
    } catch (error) {
      console.error('Error adding comment:', error)
      Toaster({
        type: 'error',
        message: 'Failed to add comment'
      })
    } finally {
      setCommentLoading(false)
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <ListingHeader title={t('notes')} totalCount={total} />
        {(total > 0 || hasActiveFilters) && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2, mt: 3, mb: 2 }}>
            <Button variant='contained' startIcon={<AddIcon />} onClick={handleAddNote}>
              {t('housing_module.add_note')}
            </Button>
            <Button
              variant={hasActiveFilters ? 'contained' : 'outlined'}
              startIcon={<FilterIcon />}
              onClick={() => setFilterDrawerOpen(true)}
              sx={{ minWidth: 100 }}
            >
              {t('filters')}
              {hasActiveFilters && (
                <Chip
                  size='small'
                  label={totalFilterCount}
                  sx={{ ml: 1, height: 20, minWidth: 20 }}
                  color='primary'
                />
              )}
            </Button>
          </Box>
        )}
      </Box>

      <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
        {noteList?.map((note: Note) => (
          <ObservationNoteCard
            key={note.observation_id}
            note={note as any}
            onClick={handleNoteClick as any}
            onLikeClick={handleLikeClick as any}
            onCommentClick={handleCommentClick as any}
            sx={{
              width: '100%',
              maxWidth: 568,
              backgroundColor: getPriorityBgColor(note.priority, theme),
              border: `1px solid ${theme.palette.divider}`
            }}
          />
        ))}

        {loading && noteList.length === 0 && (
          <Box display='flex' justifyContent='center' p={4}>
            <CircularProgress />
          </Box>
        )}

        {!loading && noteList.length === 0 && (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              px: 2
            }}
          >
            <Typography variant='h6' color='text.secondary' gutterBottom>
              {t('housing_module.no_notes_found')}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {hasActiveFilters ? t('housing_module.adjust_filters') : t('housing_module.no_notes_added')}
            </Typography>
            {!hasActiveFilters && (
              <Button variant='contained' startIcon={<AddIcon />} onClick={handleAddNote} sx={{ mt: 2 }}>
                {t('housing_module.add_first_note')}
              </Button>
            )}
          </Box>
        )}

        {noteList.length > 0 && noteList.length < total && (
          <Box ref={loaderRef} display='flex' justifyContent='center' p={2}>
            <CircularProgress size={24} />
          </Box>
        )}

        {noteList.length > 0 && noteList.length >= total && (
          <Typography align='center' sx={{ mt: 4, color: 'text.disabled' }}>
            {t('housing_module.no_more_notes')}
          </Typography>
        )}
      </Box>

      <NoteCommentDialog
        open={commentDialogOpen}
        onClose={() => {
          setCommentDialogOpen(false)
          setSelectedNote(null)
        }}
        note={selectedNote}
        onSubmit={handleCommentSubmit}
        loading={commentLoading}
      />

      <NoteDetailsDrawer
        open={detailsDrawerOpen}
        onClose={() => {
          setDetailsDrawerOpen(false)
          setSelectedNote(null)
        }}
        note={selectedNote}
        onUpdate={() => dispatch(fetchNotes(buildQueryParams()))}
      />

      <NoteFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        filters={filters}
        onApply={handleFilterApply}
        onClearAll={handleClearFilters}
      />

      <AddNoteDrawer
        open={addNoteDrawerOpen}
        onClose={() => setAddNoteDrawerOpen(false)}
        refType={refType}
        refId={id as string}
        onSuccess={handleAddNoteSuccess}
        entityName={entityName}
        entityImage={entityImage}
        animalData={animalData}
      />
    </Box>
  )
}

export default NotesListing
