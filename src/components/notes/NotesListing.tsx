import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Box, Typography, CircularProgress, Button, Card, useTheme ,Tabs,Tab} from '@mui/material'
import { useInView } from 'react-intersection-observer'
import { Add as AddIcon } from '@mui/icons-material'

import { getNotesList,addNotesReaction,removeNotesReaction } from 'src/lib/api/notesModule'
import NoteCard1 from 'src/views/utility/NoteCard1'
// import NoteCommentDialog from './NoteCommentDialog'
// import NoteDetailsDrawer from './NoteDetailsDrawer'
// import NoteFilterDrawer from './NoteFilterDrawer'
// import AddNoteDrawer from './AddNoteDrawer'

import { useAuth } from 'src/hooks/useAuth'
import Toaster from 'src/components/Toaster'
import FilterButtonWithNotification from 'src/views/utility/FilterButtonWithNotification'
import NotesDetailsDrawer from './NotesDetailsDrawer'

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
  const auth = useAuth()
  const theme = useTheme() as any

  const [notesListLoading, setNotesListLoading] = useState<boolean>(false)
  const [notesList, setNotesList] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<string>('my_notes')
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [commentDialogOpen, setCommentDialogOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState<any | null>(null)
  const [commentLoading, setCommentLoading] = useState(false)
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false)
  const [addNoteDrawerOpen, setAddNoteDrawerOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const zooId = (auth as any)?.userData?.user?.zoos?.[0]?.zoo_id



  const { ref: loaderRef, inView } = useInView({ threshold: 0 })
  const cooldownRef = useRef(false)
  const prevIdRef = useRef<string | string[] | undefined>(undefined)

  const fetchNotesList = async (pageNo: number = 1) => {
      if (pageNo === 1) {
        setNotesListLoading(true)
      }

      try {
        const payload = {
          zoo_id: zooId,
          page_no: pageNo,
          limit: 10,
          ...(activeTab === 'all_notes' && { type: 'all' })
        }
        const response = await getNotesList({ params: payload })
        if (response?.success) {
          if (pageNo === 1) {
            setNotesList(response?.data || [])
          } else {
            setNotesList(prev => [...prev, ...(response?.data || [])])
          }
          setTotal(Number(response?.total_count) || 0)
        } else if (pageNo === 1) {
          setNotesList([])
          setTotal(0)
        }
      } catch (error: any) {
        console.error('Error fetching notes list:', error?.message || error)
      } finally {
        if (pageNo === 1) {
          setNotesListLoading(false)
        }
      }
  }


  const handleTabChange =(event: React.SyntheticEvent, newValue: string)=>{
    setActiveTab(newValue)
  }

  const handleLikeClick = async (note: any) => {
    const isLiked = note.user_reaction === 'like'
    const observationId = note.observation_id

    // Optimistically update the UI
    const updatedList = notesList.map((item: any) => {
      if (item.observation_id === observationId) {
        const newReaction = isLiked ? null : 'like'
        const newCount = (item.reaction_counts?.like || 0) + (isLiked ? -1 : 1)

        return {
          ...item,
          user_reaction: newReaction,
          reaction_counts: {
            ...item.reaction_counts,
            like: Math.max(0, newCount)
          }
        }
      }

      return item
    })

    setNotesList(updatedList)

    try {
      const payload = { notes_id: observationId }
      if (isLiked) {
        await removeNotesReaction(payload)
      } else {
        await addNotesReaction(payload)
      }

      Toaster({
        type: 'success',
        message: isLiked ? 'Like removed' : 'Liked successfully'
      })
    } catch (error:any) {
      // Revert optimization on error by re-fetching or using the previous state
      // For simplicity here, we'll re-fetch if possible or just log error
      setNotesList(notesList)
      console.error('Error toggling like:', error?.message || error)
      Toaster({
        type: 'error',
        message: 'Failed to update like'
      })
    }
  }


  const handleLoadMore = useCallback(() => {
    if (cooldownRef.current || notesListLoading || notesList.length >= total) return

    cooldownRef.current = true
    const nextPage = page + 1
    setPage(nextPage)
    fetchNotesList(nextPage)

    setTimeout(() => {
      cooldownRef.current = false
    }, 300)
  }, [notesListLoading, notesList.length, total, page, fetchNotesList])


  useEffect(() => {
    if (inView && notesList.length > 0 && notesList.length < total && !notesListLoading) {
      handleLoadMore()
    }
  }, [inView, notesList.length, total, notesListLoading, handleLoadMore])


  // const handleFilterApply = (appliedFilters: Partial<NotesFilters>) => {
  //   dispatch(setFilters(appliedFilters))
  // }

  // const handleClearFilters = () => {
  //   dispatch(clearFilters())
  // }

  // const hasActiveFilters = Object.values(filters).some(v => v !== null)

  const handleNoteClick = (note: Note) => {
    setSelectedNote(note)
    setDetailsDrawerOpen(true)
  }

  // Handle add note
  const handleAddNote = () => {
    setAddNoteDrawerOpen(true)
  }

  // const handleAddNoteSuccess = () => {
  //   dispatch(setPagination({ page: 1, pageSize }))
  //   dispatch(
  //     fetchNotes({
  //       id: Array.isArray(id) ? id[0] : id || '',
  //       type: refType,
  //       page_no: 1,
  //       limit: pageSize,
  //       ...(filters.noteType && { note_type: String(filters.noteType) }),
  //       ...(filters.priority && { priority: String(filters.priority) }),
  //       ...(filters.createdBy && { created_by: String(filters.createdBy) }),
  //       ...(filters.taggedTo && { tagged_to: String(filters.taggedTo) })
  //     })
  //   )
  // }

  

  const handleCommentClick = (note: Note) => {
    setSelectedNote(note)
    setCommentDialogOpen(true)
  }

  // const handleCommentSubmit = async (data: CommentSubmitData) => {
  //   setCommentLoading(true)
  //   try {
  //     const formData = new FormData()
  //     formData.append('observation_id', data.observation_id.toString())
  //     formData.append('notes', data.notes)

  //     await addObservationComment(formData)

  //     setCommentDialogOpen(false)
  //     setSelectedNote(null)

  //     dispatch(fetchNotes(buildQueryParams()))

  //     Toaster({
  //       type: 'success',
  //       message: 'Comment added successfully'
  //     })
  //   } catch (error) {
  //     console.error('Error adding comment:', error)
  //     Toaster({
  //       type: 'error',
  //       message: 'Failed to add comment'
  //     })
  //   } finally {
  //     setCommentLoading(false)
  //   }
  // }

  useEffect(() => {
    setPage(1)
    fetchNotesList(1)
  }, [activeTab])


  return (
    <Box sx={{ width: '100%', maxWidth: '568px', mx: 'auto' }}>
      <Card
        sx={{
          boxShadow: 'none',
          borderRadius: '8px',
          backgroundColor: theme.palette.customColors.OnPrimary
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 4
          }}
        >
          <Typography sx={{ fontSize: '1.8rem', fontWeight: 600 }}>Notes</Typography>
          <Button variant='contained' startIcon={<AddIcon />} onClick={handleAddNote}>
            Add Note
          </Button>
        </Box>
        <Tabs
          variant='fullWidth'
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            width: '100%',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500
            }
          }}
        >
          <Tab label='My Notes' value='my_notes' />
          <Tab label='All Notes' value='all_notes' />
        </Tabs>


      </Card>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', py: 3 }}>
        <FilterButtonWithNotification sx={{ backgroundColor: theme.palette.customColors.OnPrimary }} />
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',

          gap: 4
        }}
      >
        {notesList?.map((note: any) => (

          <NoteCard1
            key={note.observation_id}
            note={note}
            onClick={handleNoteClick}
            onLikeClick={handleLikeClick}
            onCommentClick={handleCommentClick}
          />
        ))}

        {notesListLoading && notesList.length === 0 && (
          <Box display='flex' justifyContent='center' p={4}>
            <CircularProgress />
          </Box>
        )}

        {!notesListLoading && notesList.length === 0 && (
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
              No notes have been added yet
            </Typography>
            <Button variant='contained' startIcon={<AddIcon />} onClick={handleAddNote} sx={{ mt: 2 }}>
              Add First Note
            </Button>
          </Box>
        )}


        {notesList.length > 0 && notesList.length < total && (
          <Box ref={loaderRef} display='flex' justifyContent='center' p={4}>
            <CircularProgress size={24} />
          </Box>
        )}

        {notesList.length > 0 && notesList.length >= total && total > 0 && (
          <Typography align='center' sx={{ mt: 4, color: 'text.disabled', pb: 4 }}>
            No more notes to load
          </Typography>
        )}

      </Box>

      {/* <NoteCommentDialog
        open={commentDialogOpen}
        onClose={() => {
          setCommentDialogOpen(false)
          setSelectedNote(null)
        }}
        note={selectedNote}
        onSubmit={handleCommentSubmit}
        loading={commentLoading}
      /> */}

      <NotesDetailsDrawer
        open={detailsDrawerOpen}
        onClose={() => {
          setDetailsDrawerOpen(false)
          setSelectedNote(null)
        }}
        note={selectedNote}
        // onUpdate={() => dispatch(fetchNotes(buildQueryParams()))}
      />

      {/* <NoteFilterDrawer
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
      /> */}
    </Box>
  )
}

export default NotesListing
