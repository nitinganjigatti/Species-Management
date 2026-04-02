'use client'

import { useState, useCallback } from 'react'
import { useTheme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Icon from 'src/@core/components/icon'
import { AddButton } from 'src/components/Buttons'
import Search from 'src/views/utility/Search'
import NoDataFound from 'src/views/utility/NoDataFound'
import DeleteConfirmationDialog from 'src/views/utility/DeleteConfirmationDialog'
import AnnouncementCard from './AnnouncementCard'
import AnnouncementSkeleton from './AnnouncementSkeleton'
import AddAnnouncementDrawer from './AddAnnouncementDrawer'
import AnnouncementDetailsDrawer from './AnnouncementDetailsDrawer'
import {
  useAnnouncementList,
  useDeleteAnnouncement,
  useCancelAnnouncement
} from 'src/hooks/announcement/useAnnouncements'
import useInfiniteScroll from 'src/hooks/useInfiniteScroll'
import useDebounce from 'src/hooks/useDebounce'
import type { AnnouncementFeedProps, Announcement } from 'src/types/announcement'

const AnnouncementFeed = ({ initialFilter = 'all' }: AnnouncementFeedProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'my_posts'>(initialFilter)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Edit announcement state
  const [editAnnouncement, setEditAnnouncement] = useState<Announcement | null>(null)

  // Details drawer state
  const [detailsDrawer, setDetailsDrawer] = useState<{
    open: boolean
    announcementId: number | null
  }>({ open: false, announcementId: null })

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    type: 'delete' | 'cancel' | null
    announcementId: number | null
  }>({ open: false, type: null, announcementId: null })

  const theme = useTheme()

  const debouncedSearch = useDebounce(searchQuery, 500)

  const deleteAnnouncement = useDeleteAnnouncement()
  const cancelAnnouncement = useCancelAnnouncement()

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } = useAnnouncementList({
    q: debouncedSearch || undefined,
    owned_by_me: filter === 'my_posts' ? true : undefined
  })

  const announcements = data?.pages.flatMap(page => page.data?.announcement_details || []) || []

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const loadMoreRef = useInfiniteScroll(handleLoadMore, isFetchingNextPage, hasNextPage ?? false)

  const handleFilterChange = (_event: React.SyntheticEvent, newValue: number) => {
    setFilter(newValue === 0 ? 'all' : 'my_posts')
  }

  const handleEdit = (announcement: Announcement) => {
    // Close details drawer if open
    setDetailsDrawer({ open: false, announcementId: null })
    // Set the announcement to edit and open the drawer
    setEditAnnouncement(announcement)
    setIsDrawerOpen(true)
  }

  const handleDelete = (announcementId: number) => {
    setConfirmDialog({ open: true, type: 'delete', announcementId })
  }

  const handleCancel = (announcementId: number) => {
    setConfirmDialog({ open: true, type: 'cancel', announcementId })
  }

  const handleConfirmDialogClose = () => {
    setConfirmDialog({ open: false, type: null, announcementId: null })
  }

  const handleConfirmAction = () => {
    if (confirmDialog.announcementId) {
      if (confirmDialog.type === 'delete') {
        deleteAnnouncement.mutate(confirmDialog.announcementId)
      } else if (confirmDialog.type === 'cancel') {
        cancelAnnouncement.mutate(confirmDialog.announcementId)
      }
    }
    handleConfirmDialogClose()
  }

  const handleCreateAnnouncement = () => {
    setIsDrawerOpen(true)
  }

  const handleDrawerClose = () => {
    setIsDrawerOpen(false)
    setEditAnnouncement(null)
  }

  const handleCardClick = (announcementId: number) => {
    setDetailsDrawer({ open: true, announcementId })
  }

  const handleDetailsDrawerClose = () => {
    setDetailsDrawer({ open: false, announcementId: null })
  }

  return (
    <Box
      sx={{
        width: '568px',
        maxWidth: '100%',
        mx: 'auto',
        py: 2,
        px: 2
      }}
    >
      <Card
        sx={{
          mb: 6,
          p: 2,
          borderRadius: '8px',
          backgroundColor: theme.palette.customColors.OnPrimary
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2
          }}
        >
          <Typography
            variant='h6'
            sx={{
              fontWeight: 600,
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            Announcements
          </Typography>
          <AddButton
            action={handleCreateAnnouncement}
            title='Create'
            disabled={false}
            styles={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.common.white,
              border: 'none',
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
                border: 'none'
              }
            }}
          />
        </Box>

        <Search
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery('')}
          placeholder='Search announcements...'
          width='100%'
          backgroundColor={theme.palette.customColors.SurfaceVariant}
          borderRadius='8px'
          textFielsSX={{ height: '40px' }}
        />

        <Tabs
          value={filter === 'all' ? 0 : 1}
          onChange={handleFilterChange}
          variant='fullWidth'
          sx={{
            mt: 2,
            minHeight: 40,
            '& .MuiTabs-indicator': {
              backgroundColor: theme.palette.primary.main,
              height: 2,
              borderRadius: '3px 3px 0 0'
            },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.9375rem',
              minHeight: 40,
              flex: 1,
              maxWidth: 'none',
              color: theme.palette.customColors.neutralSecondary,
              borderBottom: `1px solid ${theme.palette.customColors.OutlineVariant}`,
              '&.Mui-selected': {
                color: theme.palette.primary.main,
                fontWeight: 600,
                borderBottom: 'none'
              }
            }
          }}
        >
          <Tab label='All' />
          <Tab label='My Posts' />
        </Tabs>
      </Card>

      {isLoading && (
        <>
          <AnnouncementSkeleton showMedia />
          <AnnouncementSkeleton showDescription />
          <AnnouncementSkeleton showMedia showDescription />
        </>
      )}

      {isError && (
        <Card
          sx={{
            p: 5,
            textAlign: 'center',
            borderRadius: '8px',
            border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
            boxShadow: 'none'
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: theme.palette.customColors.BgTeritary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2
            }}
          >
            <Icon icon='mdi:alert-circle-outline' fontSize={32} color={theme.palette.customColors.Tertiary} />
          </Box>
          <Typography sx={{ mb: 0.5, fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}>
            Failed to load announcements
          </Typography>
          <Typography sx={{ mb: 2, fontSize: '0.875rem', color: theme.palette.customColors.neutralSecondary }}>
            Something went wrong. Please try again.
          </Typography>
          <Button
            variant='outlined'
            onClick={() => refetch()}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              px: 3
            }}
          >
            Retry
          </Button>
        </Card>
      )}

      {!isLoading && !isError && announcements.length === 0 && (
        <Card
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: '8px'
          }}
        >
          <NoDataFound variant='Meerkat' height={120} width={120} />
          <Typography sx={{ mt: 1, fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}>
            {filter === 'my_posts' ? 'No announcements yet' : 'No announcements found'}
          </Typography>
          <Typography sx={{ mt: 0.5, fontSize: '0.875rem', color: theme.palette.customColors.neutralSecondary }}>
            {filter === 'my_posts'
              ? 'Create your first announcement to get started.'
              : searchQuery
              ? 'Try adjusting your search terms.'
              : 'Check back later for new announcements.'}
          </Typography>
        </Card>
      )}

      {!isLoading &&
        announcements.map(announcement => (
          <AnnouncementCard
            key={announcement.announcement_id}
            announcement={announcement}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCancel={handleCancel}
            onClick={() => handleCardClick(announcement.announcement_id)}
          />
        ))}

      {hasNextPage && (
        <Box
          ref={loadMoreRef}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: 3
          }}
        >
          {isFetchingNextPage && <CircularProgress size={24} sx={{ color: theme.palette.primary.main }} />}
        </Box>
      )}

      {!hasNextPage && announcements.length > 0 && (
        <Typography
          sx={{ textAlign: 'center', py: 2, color: theme.palette.customColors.neutralSecondary, fontSize: '0.875rem' }}
        >
          You have reached the end
        </Typography>
      )}

      <AddAnnouncementDrawer
        open={isDrawerOpen}
        onClose={handleDrawerClose}
        editAnnouncement={editAnnouncement}
        onSuccess={() => refetch()}
      />

      <AnnouncementDetailsDrawer
        open={detailsDrawer.open}
        onClose={handleDetailsDrawerClose}
        announcementId={detailsDrawer.announcementId}
        onAnnouncementUpdated={() => refetch()}
        onEdit={handleEdit}
      />

      <DeleteConfirmationDialog
        open={confirmDialog.open}
        handleClose={handleConfirmDialogClose}
        message={
          confirmDialog.type === 'delete'
            ? 'Are you sure you want to delete this announcement?'
            : 'Are you sure you want to cancel this announcement?'
        }
        action={handleConfirmAction}
        loading={deleteAnnouncement.isPending || cancelAnnouncement.isPending}
      />
    </Box>
  )
}

export default AnnouncementFeed
