import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Box, Typography, CircularProgress, Button, Card, useTheme, Tabs, Tab } from '@mui/material'
import { useInView } from 'react-intersection-observer'
import { Add as AddIcon } from '@mui/icons-material'

import { getNotesList, addNotesReaction, removeNotesReaction, addNotesComment } from 'src/lib/api/notesModule'
import NoteCard1 from 'src/views/utility/NoteCard1'
// import NoteDetailsDrawer from './NoteDetailsDrawer'
// import NoteFilterDrawer from './NoteFilterDrawer'
import AddNoteDrawer from './AddNoteDrawer'
import { useAuth } from 'src/hooks/useAuth'
import Toaster from 'src/components/Toaster'
import FilterButtonWithNotification from 'src/views/utility/FilterButtonWithNotification'
import NotesDetailsDrawer from './NotesDetailsDrawer'

export interface ReactionCounts {
  like: number
  heart: number
  clap: number
  total_reactions: number
}

export interface ChildMasterType {
  observation_id: number
  parent_observation_type_id: number
  parent_observation_type: string
  string_id: string

  child_observation_type: ChildObservationType[]
}

export interface ChildObservationType {
  child_id: number
  type_name: string
  string_id: string
}
export interface Attachment {
  id: number
  file: string
  file_orginal_name: string
  file_type: string
  file_size: number
}

export interface AssignedUser {
  observation_id: number
  user_id: number

  profile_pic: string
  full_name: string
  user_email: string
  mobile_number: string

  role_id: number | null
  role_name: string | null
}
export interface NoteDetails {
  id: number
  observation_id: number

  modified_by: string | null
  modified_at: string
  created_at: string

  total_comments: number
  created_by: string

  active: number

  profile_pic: string
  observation: string
  commented_by: string

  notes_attachment: any[] // can refine later if needed
}
export interface RefData {
  observation_id: number
  type: string
  ref_id: number
  animalData?: AnimalData
  siteData?: SiteData
  sectionData?: SectionData
  enclosureData?: EnclosureData
}

export interface EnclosureData {
  enclosure_id: number | string
  enclosure_parent_id: string | null
  enclosure_wise_animal_count: number
  image: string
  parent_enclosure_name: string | null
  section_id: number
  section_name: string
  site_id: number
  site_name: string
  species_count: number
  sub_enclosure_count: number | null
  user_enclosure_name: string
}
export interface AnimalData {
  local_identifier_value: string | null
  local_identifier_name: string | null
  user_section_name: string
  animal_id: number | string
  common_name: string
  complete_name: string
  created_by: string | null
  default_icon: string
  scientific_name: string
  section_id: number
  section_name: string
  sex: string
  taxonomy_id: number | string
  type: string
  total_animal: number | string
  user_enclosure_name: string
  zoo_id: number
  site_name: string
  breed_id: number | null
  breed_name: string | null
  morph_id: number | null
  morph_name: string | null
}

export interface SectionData {
  animal_count: number
  enclosure_count: number

  incharge_name: string
  incharge_phone_number: string

  section_id: number
  section_incharge: string

  section_name: string
  site_id: number
  site_name: string

  image: string
}

export interface SiteData {
  site_name: string
  site_description: string
  image: string
}
export interface NotesListResponse {
  success: boolean
  data: NoteItem[]
  message?: string
}
export interface NoteItem {
  favourite_id: number | null
  favourite_type: string | null
  entity_id: number | null
  entity_type: string | null

  observation_id: number
  zoo_id: number
  observation_type_id: number

  priority: string
  observation_name: string

  created_at: string
  modified_at: string

  type_name: string | null
  key: string | null

  created_by: string
  created_by_id: number
  created_by_phone: string

  active: string
  is_deleted: string
  modified_by: string

  reaction_counts: ReactionCounts
  user_reaction: string | null

  child_master_type: ChildMasterType | null

  attachments: Attachment[]
  assign_to: AssignedUser[]

  note: NoteDetails | null

  ref_data: RefData[]
}

interface CommentSubmitData {
  observation_id: number
  observation: string
}

const NotesListing: React.FC = () => {
  const auth = useAuth()
  const theme = useTheme() as any

  const [notesListLoading, setNotesListLoading] = useState<boolean>(false)
  const [notesList, setNotesList] = useState<NoteItem[]>([])
  const [activeTab, setActiveTab] = useState<string>('my_notes')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [likeLoadingId, setLikeLoadingId] = useState<number | null>(null)
  const [commentLoadingId, setCommentLoadingId] = useState<number | null>(null)

  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [commentDialogOpen, setCommentDialogOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState<any | null>(null)
  const [commentLoading, setCommentLoading] = useState(false)
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false)
  const [addNoteDrawerOpen, setAddNoteDrawerOpen] = useState(false)

  const zooId = (auth as any)?.userData?.user?.zoos?.[0]?.zoo_id

  const { ref: loaderRef, inView } = useInView({ threshold: 0 })

  // fetch notes list
  const fetchNotesList = useCallback(
    async (pageNo: number = 1) => {
      setNotesListLoading(true)
      if (pageNo === 1) {
        setHasMore(true)
      }

      try {
        const payload = {
          zoo_id: zooId,
          page_no: pageNo,
          ...(activeTab === 'all_notes' && { type: 'all' })
        }
        const response = await getNotesList({ params: payload })
        if (response?.success) {
          const newData = response?.data || []

          if (pageNo === 1) {
            setNotesList(newData)
          } else {
            setNotesList(prev => [...prev, ...newData])
          }

          if (newData.length < 10) {
            setHasMore(false)
          }
        } else {
          if (pageNo === 1) {
            setNotesList([])
          }
          setHasMore(false)
        }
      } catch (error: any) {
        console.error('Error fetching notes list:', error?.message || error)
      } finally {
        setNotesListLoading(false)
      }
    },
    [activeTab, zooId]
  )

  // handle like click
  const handleLikeClick = async (note: NoteItem) => {
    setLikeLoadingId(note.observation_id)
    const isLiked = note.user_reaction === 'like'
    const observationId = note.observation_id

    // Optimistically update the UI
    const updatedList = notesList?.map((item: NoteItem) => {
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
    } catch (error: any) {
      // Revert optimization on error by re-fetching or using the previous state
      // For simplicity here, we'll re-fetch if possible or just log error
      setNotesList(notesList)
      console.error('Error toggling like:', error?.message || error)
      Toaster({
        type: 'error',
        message: 'Failed to update like'
      })
    } finally {
      setLikeLoadingId(null)
    }
  }

  // handle comment submit
  const handleCommentSubmit = async (data: CommentSubmitData) => {
    setCommentLoadingId(data?.observation_id)
    try {
      const payload = {
        observation_id: data?.observation_id,
        observation: data?.observation
      }
      await addNotesComment(payload)

      setCommentDialogOpen(false)
      setSelectedNote(null)

      fetchNotesList()
      setPage(1)

      Toaster({
        type: 'success',
        message: 'Comment added successfully'
      })
    } catch (error: any) {
      console.error('Error adding comment:', error?.message || error)
      Toaster({
        type: 'error',
        message: 'Failed to add comment'
      })
    } finally {
      setCommentLoadingId(null)
    }
  }

  // handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue)
  }

  const handleNoteClick = (note: NoteItem) => {
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

  // const handleFilterApply = (appliedFilters: Partial<NotesFilters>) => {
  //   dispatch(setFilters(appliedFilters))
  // }

  // const handleClearFilters = () => {
  //   dispatch(clearFilters())
  // }

  // const hasActiveFilters = Object.values(filters).some(v => v !== null)

  const handleCommentClick = (note: NoteItem) => {
    setSelectedNote(note)
    setCommentDialogOpen(true)
  }

  // handle load more
  const handleLoadMore = useCallback(() => {
    if (notesListLoading || !hasMore) return

    const nextPage = page + 1
    setPage(nextPage)

    fetchNotesList(nextPage)
  }, [notesListLoading, page, hasMore, fetchNotesList])

  useEffect(() => {
    if (inView && !notesListLoading && hasMore) {
      handleLoadMore()
    }
  }, [inView])

  useEffect(() => {
    setPage(1)
    setNotesList([])
    setHasMore(true)
    fetchNotesList(1)
  }, [activeTab, fetchNotesList])

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
        {notesList?.map((note: NoteItem, index: number) => (
          <NoteCard1
            key={note.observation_id || index}
            note={note}
            onClick={handleNoteClick}
            onLikeClick={handleLikeClick}
            onCommentClick={handleCommentClick}
            isLikeLoading={likeLoadingId === note.observation_id}
            isCommentLoading={commentLoadingId === note.observation_id}
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

        {hasMore && notesList.length > 0 && (
          <Box ref={loaderRef} display='flex' justifyContent='center' p={4}>
            <CircularProgress size={24} />
          </Box>
        )}

        {!hasMore && notesList.length > 0 && (
          <Typography align='center' sx={{ mt: 4, color: 'text.disabled', pb: 4 }}>
            No more notes to load
          </Typography>
        )}
      </Box>

      <NotesDetailsDrawer
        open={detailsDrawerOpen}
        onClose={() => {
          setDetailsDrawerOpen(false)
          setSelectedNote(null)
        }}
        noteDetails={selectedNote}
        refetchNotesList={() => fetchNotesList()}
        // onUpdate={() => dispatch(fetchNotes(buildQueryParams()))}
      />

      {/* <NoteFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        filters={filters}
        onApply={handleFilterApply}
        onClearAll={handleClearFilters}
      />*/}

      <AddNoteDrawer
        open={addNoteDrawerOpen}
        onClose={() => setAddNoteDrawerOpen(false)}
        // refType={refType}
        // refId={id as string}
        //   onSuccess={handleAddNoteSuccess}
        //   entityName={entityName}
        //   entityImage={entityImage}
        //   animalData={animalData}
      />
    </Box>
  )
}

export default NotesListing
