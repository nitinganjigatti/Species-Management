import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Box, Typography, CircularProgress, Button, Chip } from '@mui/material'
import { useRouter } from 'next/router'
import { useDispatch, useSelector } from 'react-redux'
import { useInView } from 'react-intersection-observer'
import { FilterList as FilterIcon, Add as AddIcon } from '@mui/icons-material'

import NoteCard from 'src/views/utility/NoteCard'
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
  clearNotes
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

const NotesListing: React.FC<NotesListingProps> = ({ refType = 'site', entityName, entityImage, animalData }) => {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const auth = useAuth()
  const { id } = router.query

  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [commentDialogOpen, setCommentDialogOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [commentLoading, setCommentLoading] = useState(false)
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false)
  const [addNoteDrawerOpen, setAddNoteDrawerOpen] = useState(false)

  const zooId = (auth as any)?.userData?.user?.zoos?.[0]?.zoo_id

  const { list: noteList, loading, total, page, pageSize, filters } = useSelector(
    (state: RootState) => state.notes
  )

  const { ref: loaderRef, inView } = useInView({ threshold: 0 })
  const cooldownRef = useRef(false)
  const prevIdRef = useRef<string | string[] | undefined>(undefined)

  // Fetch observation master list and users on mount
  useEffect(() => {
    dispatch(fetchObservationMasterList())
    if (zooId) {
      dispatch(fetchUsers({ zoo_id: zooId }))
    }
  }, [dispatch, zooId])

  // Build query params based on filters
  const buildQueryParams = useCallback((overridePage?: number): NotesQueryParams => {
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
  }, [id, refType, page, pageSize, filters])

  // Handle id change - clear and fetch fresh data
  useEffect(() => {
    if (id && id !== prevIdRef.current) {
      // Clear previous notes first
      dispatch(clearNotes())

      // Fetch fresh notes for the new id with page 1
      dispatch(fetchNotes({
        id: Array.isArray(id) ? id[0] : id,
        type: refType,
        page_no: 1,
        limit: pageSize
      }))

      prevIdRef.current = id
    }
  }, [dispatch, id, refType, pageSize])

  // Fetch notes when pagination or filters change (but not id - that's handled above)
  useEffect(() => {
    if (id && id === prevIdRef.current && page > 1) {
      dispatch(fetchNotes(buildQueryParams()))
    }
  }, [dispatch, page])

  // Fetch notes when filters change
  useEffect(() => {
    if (id && id === prevIdRef.current) {
      dispatch(fetchNotes(buildQueryParams(1)))
      dispatch(setPagination({ page: 1, pageSize }))
    }
  }, [filters])

  // Clear notes on unmount
  useEffect(() => {
    return () => {
      dispatch(clearNotes())
    }
  }, [])

  // Handle pagination
  const handleLoadMore = useCallback(() => {
    if (cooldownRef.current || loading || noteList.length >= total) return

    cooldownRef.current = true
    dispatch(setPagination({ page: page + 1, pageSize }))

    setTimeout(() => {
      cooldownRef.current = false
    }, 300)
  }, [dispatch, loading, noteList.length, total, page, pageSize])

  useEffect(() => {
    if (inView && noteList.length < total) {
      handleLoadMore()
    }
  }, [inView, handleLoadMore, noteList.length, total])

  // Handle filter apply from drawer
  const handleFilterApply = (appliedFilters: Partial<NotesFilters>) => {
    dispatch(setFilters(appliedFilters))
  }

  const handleClearFilters = () => {
    dispatch(clearFilters())
  }

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(v => v !== null)

  // Handle note click
  const handleNoteClick = (note: Note) => {
    setSelectedNote(note)
    setDetailsDrawerOpen(true)
  }

  // Handle add note
  const handleAddNote = () => {
    setAddNoteDrawerOpen(true)
  }

  // Handle add note success - reset to page 1 and refresh the list
  const handleAddNoteSuccess = () => {
    // Reset pagination and fetch fresh data for page 1
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

  // Handle like click
  const handleLikeClick = async (note: Note) => {
    try {
      const isLiked = note.user_reaction === 'like'

      if (isLiked) {
        await removeNoteReaction(note.observation_id)
      } else {
        await addNoteReaction(note.observation_id)
      }

      dispatch(fetchNotes(buildQueryParams()))

      Toaster({
        type: 'success',
        message: isLiked ? 'Like removed' : 'Liked successfully'
      })
    } catch (error) {
      console.error('Error toggling like:', error)
      Toaster({
        type: 'error',
        message: 'Failed to update like'
      })
    }
  }

  // Handle comment click
  const handleCommentClick = (note: Note) => {
    setSelectedNote(note)
    setCommentDialogOpen(true)
  }

  // Handle comment submit
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
      {/* Header */}
      <ListingHeader title='Notes' totalCount={total} />

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2, mt: 3, mb: 2 }}>
        <Button variant='contained' startIcon={<AddIcon />} onClick={handleAddNote}>
          Add Note
        </Button>
        <Button
          variant={hasActiveFilters ? 'contained' : 'outlined'}
          startIcon={<FilterIcon />}
          onClick={() => setFilterDrawerOpen(true)}
          sx={{ minWidth: 100 }}
        >
          Filters
          {hasActiveFilters && (
            <Chip
              size='small'
              label={Object.values(filters).filter(v => v !== null).length}
              sx={{ ml: 1, height: 20, minWidth: 20 }}
              color='primary'
            />
          )}
        </Button>
      </Box>

      {/* Notes List - Full Width */}
      <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {noteList?.map((note: Note) => (
          <NoteCard
            key={note.observation_id}
            note={note}
            onClick={handleNoteClick}
            onLikeClick={handleLikeClick}
            onCommentClick={handleCommentClick}
          />
        ))}

        {/* Loading State */}
        {loading && noteList.length === 0 && (
          <Box display='flex' justifyContent='center' p={4}>
            <CircularProgress />
          </Box>
        )}

        {/* Empty State */}
        {!loading && noteList.length === 0 && (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              px: 2
            }}
          >
            <Typography variant='h6' color='text.secondary' gutterBottom>
              No notes found
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {hasActiveFilters ? 'Try adjusting your filters' : 'No notes have been added yet'}
            </Typography>
            {!hasActiveFilters && (
              <Button variant='contained' startIcon={<AddIcon />} onClick={handleAddNote} sx={{ mt: 2 }}>
                Add First Note
              </Button>
            )}
          </Box>
        )}

        {/* Load More Indicator */}
        {noteList.length > 0 && noteList.length < total && (
          <Box ref={loaderRef} display='flex' justifyContent='center' p={2}>
            <CircularProgress size={24} />
          </Box>
        )}

        {/* End of List */}
        {noteList.length > 0 && noteList.length >= total && (
          <Typography align='center' sx={{ mt: 4, color: 'text.disabled' }}>
            No more notes to load
          </Typography>
        )}
      </Box>

      {/* Comment Dialog */}
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

      {/* Filter Drawer */}
      <NoteFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        filters={filters}
        onApply={handleFilterApply}
        onClearAll={handleClearFilters}
      />

      {/* Add Note Drawer */}
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
