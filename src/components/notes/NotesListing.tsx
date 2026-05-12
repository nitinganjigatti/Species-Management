'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Typography, CircularProgress, Button, Card, Tabs, Tab, Skeleton } from '@mui/material'
import { useTheme, alpha } from '@mui/material/styles'
import { useInView } from 'react-intersection-observer'
import { Add as AddIcon } from '@mui/icons-material'
import { useAuth } from 'src/hooks/useAuth'
import Toaster from 'src/components/Toaster'
import NoDataFound from 'src/views/utility/NoDataFound'

import { getNotesList, addNotesReaction, removeNotesReaction } from 'src/lib/api/notesModule'
import ObservationNoteCard from './ObservationNoteCard'
import AddNoteDrawer from './AddNoteDrawer'
import FilterButtonWithNotification from 'src/views/utility/FilterButtonWithNotification'
import NotesDetailsDrawer from './NotesDetailsDrawer'
import NotesListingFilterDrawer from './NotesListingFilterDrawer'
import { NoteItem } from 'src/types/notes'
import SessionGuard from '../SessionGuard'
interface Filters {
  'Note Type': string[]
  Priority: string[]
  'Created By': string[]
  'Tagged To': string[]
}

const NotesListing: React.FC = () => {
  const { t } = useTranslation()
  const theme = useTheme() as any
  const auth = useAuth()
  const zooId = (auth as any)?.userData?.user?.zoos?.[0]?.zoo_id

  const [activeTab, setActiveTab] = useState<string>('my_notes')
  const [notesListLoading, setNotesListLoading] = useState<boolean>(false)
  const [notesList, setNotesList] = useState<NoteItem[]>([])
  const [page, setPage] = useState<number>(1)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [filterCount, setFilterCount] = useState<number>(0)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState<boolean>(false)
  const [selectedNote, setSelectedNote] = useState<NoteItem | null>(null)
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState<boolean>(false)
  const [addNoteDrawerOpen, setAddNoteDrawerOpen] = useState<boolean>(false)
  const [openWithComment, setOpenWithComment] = useState<boolean>(false)
  const [likeLoadingId, setLikeLoadingId] = useState<number | null>(null)
  const [filters, setFilters] = useState<Filters>({
    'Note Type': [],
    Priority: [],
    'Created By': [],
    'Tagged To': []
  })

  const { ref: loaderRef, inView } = useInView({ threshold: 0 })

  const fetchNotesList = async (pageNo: number = 1) => {
    setNotesListLoading(true)

    if (pageNo === 1) {
      setHasMore(true)
    }

    try {
      const payload = {
        zoo_id: zooId,
        page_no: pageNo,
        ...(activeTab === 'all_notes' && { type: 'all' }),
        ...(filters['Note Type']?.length > 0 && { note_type: filters['Note Type'].join(', ') }),
        ...(filters['Priority']?.length > 0 && { priority: filters['Priority'].join(',') }),
        ...(activeTab === 'all_notes' &&
          filters['Created By']?.length > 0 && { created_by: filters['Created By'].join(',') }),
        ...(activeTab === 'all_notes' &&
          filters['Tagged To']?.length > 0 && { tagged_to: filters['Tagged To'].join(',') })
      }
      const response = await getNotesList({ params: payload })
      if (response?.success) {
        const newData = response?.data

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
  }

  const handleLikeClick = async (note: NoteItem) => {
    setLikeLoadingId(note.observation_id)

    const isLiked = note?.user_reaction === 'like'
    const observationId = note?.observation_id

    // Optimistically update the UI
    const updatedList = notesList?.map((item: NoteItem) => {
      if (item?.observation_id === observationId) {
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

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue)

    if (filterCount > 0) {
      setFilters({
        'Note Type': [],
        Priority: [],
        'Created By': [],
        'Tagged To': []
      })
      setFilterCount(0)
    }
  }

  const handleNoteClick = (note: NoteItem) => {
    setSelectedNote(note)
    setOpenWithComment(false)
    setDetailsDrawerOpen(true)
  }

  const handleAddNote = () => {
    setAddNoteDrawerOpen(true)
  }

  const handleCommentClick = (note: NoteItem) => {
    setSelectedNote(note)
    setOpenWithComment(true)
    setDetailsDrawerOpen(true)
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
  }, [activeTab, filters])

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
          <Typography sx={{ fontSize: '1.8rem', fontWeight: 600 }}>{t('notes')}</Typography>
          <Button variant='contained' startIcon={<AddIcon />} onClick={handleAddNote}>
            {t('notes_module.add_note')}
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
          <Tab label={t('notes_module.my_notes')} value='my_notes' />
          <Tab label={t('notes_module.all_notes')} value='all_notes' />
        </Tabs>
      </Card>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', py: 3 }}>
        <FilterButtonWithNotification
          sx={{ backgroundColor: theme.palette.customColors.OnPrimary }}
          onClick={() => setFilterDrawerOpen(true)}
          appliedFiltersCount={filterCount}
        />
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          gap: 4,
          cursor: 'pointer'
        }}
      >
        {notesListLoading && notesList?.length === 0 ? (
          <ObservationNoteCardSkeleton />
        ) : (
          <>
            {notesList?.map((note: NoteItem, index: number) => (
              <ObservationNoteCard
                key={note?.observation_id || `note-${index}`}
                note={note}
                onClick={handleNoteClick}
                onLikeClick={handleLikeClick}
                onCommentClick={handleCommentClick}
                isLikeLoading={likeLoadingId === note?.observation_id}
              />
            ))}
          </>
        )}

        {notesListLoading && notesList?.length === 0 && (
          <Box display='flex' justifyContent='center' p={4}>
            <CircularProgress />
          </Box>
        )}

        {!notesListLoading && notesList?.length === 0 && (
          <Card
            sx={{
              textAlign: 'center',
              py: 8,
              px: 2,
              boxShadow: 'none'
            }}
          >
            <NoDataFound />
            <Typography variant='h6' gutterBottom>
              {t('notes_module.no_notes_found')}
            </Typography>
            <Typography color='text.secondary' gutterBottom>
              {t('notes_module.create_your_first_note')}
            </Typography>
          </Card>
        )}

        {hasMore && notesList.length > 0 && (
          <Box ref={loaderRef} display='flex' justifyContent='center' p={4}>
            <CircularProgress size={24} />
          </Box>
        )}
        {/* {hasMore && notesList.length > 0 && (
          <Box
            ref={loaderRef}
            sx={{
              height: 20 // important smooth scrolling skeleton card is big
            }}
          >
            {notesListLoading && <ObservationNoteCardSkeleton />}
          </Box>
        )} */}

        {!hasMore && notesList.length > 0 && (
          <Typography align='center' sx={{ mt: 4, color: 'text.disabled', pb: 4 }}>
            {t('notes_module.no_more_notes_to_load')}
          </Typography>
        )}
      </Box>

      <NotesDetailsDrawer
        open={detailsDrawerOpen}
        onClose={() => {
          setDetailsDrawerOpen(false)
          setSelectedNote(null)
          setOpenWithComment(false)
        }}
        noteDetails={selectedNote}
        openWithComment={openWithComment}
        refetchNotesList={() => fetchNotesList()}
      />

      <AddNoteDrawer
        open={addNoteDrawerOpen}
        onClose={() => setAddNoteDrawerOpen(false)}
        refetchNotesList={() => fetchNotesList()}
      />

      <NotesListingFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        onApplyFilters={(appliedFilters: Filters) => {
          setFilters(appliedFilters)
        }}
        setFilterCount={setFilterCount}
        initialSelectedOptions={filters}
        activeTab={activeTab}
      />
    </Box>
  )
}

export default NotesListing

const ObservationNoteCardSkeleton = () => {
  const theme = useTheme() as any

  return (
    <Box sx={{ width: '100%', maxWidth: '568px', mx: 'auto' }}>
      {[1, 2].map(i => (
        <Card
          key={i}
          sx={{
            boxShadow: 'none',
            borderRadius: '8px',
            backgroundColor: theme.palette.customColors.OnPrimary,
            mb: 5
          }}
        >
          <Box sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {/* Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '90%' }}>
                  <Skeleton variant='rounded' width={30} height={30} />
                  <Skeleton variant='text' width='60%' height={25} />
                </Box>
                <Skeleton variant='rounded' width={80} height={36} />
              </Box>

              {/* Chips */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} variant='rounded' width={60} height={26} />
                ))}
              </Box>

              {/* User info */}
              <Box>
                <Skeleton variant='text' width={120} height={15} />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                  <Skeleton variant='circular' width={36} height={36} />
                  <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                    <Skeleton variant='text' width={150} height={20} />
                    <Skeleton variant='text' width={150} height={20} />
                  </Box>
                </Box>
              </Box>

              {/* Note text */}
              <Box>
                <Skeleton variant='text' width={100} height={15} />
                <Skeleton variant='text' width='100%' />
                <Skeleton variant='text' width='100%' />
              </Box>

              {/* Attachments */}
              <Box sx={{ display: 'flex', gap: 3 }}>
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} variant='text' width={80} />
                ))}
              </Box>

              {/* Animal / Location card */}
              <Skeleton variant='rounded' width='100%' height={80} />

              {/* Image preview */}
              <Skeleton variant='rounded' width='100%' height={200} />
            </Box>
          </Box>

          {/* Footer */}
          <Box
            sx={{
              borderTop: `1px solid ${alpha(theme.palette.common.black, 0.06)}`,
              p: 3,
              display: 'flex',
              gap: 2
            }}
          >
            <Skeleton variant='rounded' width={80} height={36} />
            <Skeleton variant='rounded' width={80} height={36} />
          </Box>
        </Card>
      ))}
    </Box>
  )
}
