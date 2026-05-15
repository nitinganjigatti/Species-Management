'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Chip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  IconButton
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import { LoadingButton } from '@mui/lab'
import Icon from 'src/@core/components/icon'
import UserWiseList from 'src/views/pages/report/caretaker-report/UserWiseList'
import AnimalWiseList from 'src/views/pages/report/caretaker-report/AnimalWiseList'
import { getKeepersWithAnimals, getAnimalsWithKeepers, exportAnimalKeeperReport } from 'src/lib/api/caretaker'
import RenderUtility from 'src/utility/render'
import { Keeper, AnimalWise, PaginationModel } from 'src/types/report'
import { TabBadgeProps } from 'src/types/report'

const PAGE_SIZE = 20

const CaretakerReport = () => {
  const theme = useTheme()
  const [viewType, setViewType] = useState<'animal' | 'user'>('animal')
  const [loading, setLoading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  // Download dialog state
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false)
  const [downloadFilter, setDownloadFilter] = useState<'all' | 'withKeeper' | 'withoutKeeper'>('withKeeper')

  // User wise state
  const [keepers, setKeepers] = useState<Keeper[]>([])
  const [keepersPagination, setKeepersPagination] = useState<PaginationModel>({ total: 0, page: 0, pageSize: PAGE_SIZE })

  // Animal wise state
  const [animals, setAnimals] = useState<AnimalWise[]>([])
  const [animalsPagination, setAnimalsPagination] = useState<PaginationModel>({ total: 0, page: 0, pageSize: PAGE_SIZE })

  const fetchKeepers = useCallback(async (page = 0, pageSize = PAGE_SIZE) => {
    setLoading(true)
    try {
      const response = await getKeepersWithAnimals({ page: page + 1, per_page: pageSize })
      if (response?.success) {
        setKeepers(response.data || [])
        setKeepersPagination({
          total: response.pagination?.total || response.data?.length || 0,
          page,
          pageSize
        })
      }
    } catch (error) {
      console.error('Error fetching keepers:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAnimals = useCallback(async (page = 0, pageSize = PAGE_SIZE) => {
    setLoading(true)
    try {
      const response = await getAnimalsWithKeepers({ page: page + 1, per_page: pageSize })
      if (response?.success) {
        setAnimals(response.data || [])
        setAnimalsPagination({
          total: response.pagination?.total || response.data?.length || 0,
          page,
          pageSize
        })
      }
    } catch (error) {
      console.error('Error fetching animals:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (viewType === 'user') {
      fetchKeepers(0, PAGE_SIZE)
    } else {
      fetchAnimals(0, PAGE_SIZE)
    }
  }, [viewType, fetchKeepers, fetchAnimals])

  const handleViewChange = (_event: React.SyntheticEvent, newValue: string) => {
    if (newValue !== null) {
      setViewType(newValue as 'animal' | 'user')
    }
  }

  const handleKeepersPaginationChange = (model: PaginationModel) => {
    fetchKeepers(model.page, model.pageSize)
  }

  const handleAnimalsPaginationChange = (model: PaginationModel) => {
    fetchAnimals(model.page, model.pageSize)
  }

  const handleOpenDownloadDialog = () => {
    setDownloadFilter('withKeeper')
    setDownloadDialogOpen(true)
  }

  const handleCloseDownloadDialog = () => {
    setDownloadDialogOpen(false)
  }

  const handleDownloadReport = async () => {
    setIsDownloading(true)
    try {
      // Build filter param based on selection
      const filterParam: string | undefined =
        downloadFilter === 'all' ? undefined : downloadFilter === 'withKeeper' ? 'with_keeper' : 'without_keeper'

      const response = await exportAnimalKeeperReport({ filter: filterParam })

      if (response?.success && response.data) {
        // Open the download URL in a new tab
        window.open(response.data, '_blank')
      }

      setDownloadDialogOpen(false)
    } catch (error) {
      console.error('Error downloading report:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  const TabBadge = ({ label, totalCount }: TabBadgeProps) => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      {label}
      {totalCount ? (
        <Chip sx={{ ml: '6px', fontSize: '12px' }} size='small' label={totalCount} color='secondary' />
      ) : null}
    </Box>
  )

  const tableContent = () => (
    <Card>
      <CardHeader
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'start', sm: 'center', md: 'center' },
          flexDirection: { xs: 'column', sm: 'row', md: 'row' },
          mx: { xs: 2, sm: 0, md: 0 },
          gap: { xs: 2, sm: 0, md: 0 }
        }}
        title={RenderUtility.pageTitle(viewType === 'animal' ? 'Animal Wise Report' : 'Keeper Wise Report')}
        action={
          viewType === 'animal' && (
            <LoadingButton
              size='medium'
              variant='contained'
              startIcon={<Icon icon='material-symbols:download' />}
              onClick={handleOpenDownloadDialog}
            >
              Download Report
            </LoadingButton>
          )
        }
      />
      <Grid sx={{ margin: '0px 1.375rem 1.375rem 1.375rem' }}>
        {viewType === 'user' ? (
          <UserWiseList
            data={keepers}
            pagination={keepersPagination}
            loading={loading}
            onPaginationChange={handleKeepersPaginationChange}
          />
        ) : (
          <AnimalWiseList
            data={animals}
            pagination={animalsPagination}
            loading={loading}
            onPaginationChange={handleAnimalsPaginationChange}
          />
        )}
      </Grid>
    </Card>
  )

  return (
    <Grid>
      <TabContext value={viewType}>
        <TabList variant='scrollable' allowScrollButtonsMobile onChange={handleViewChange}>
          <Tab
            value='animal'
            label={<TabBadge label='Animal Wise' totalCount={viewType === 'animal' ? (animalsPagination.total ?? null) : null} />}
          />
          <Tab
            value='user'
            label={<TabBadge label='Keeper Wise' totalCount={viewType === 'user' ? (keepersPagination.total ?? null) : null} />}
          />
        </TabList>
        <TabPanel value='animal'>{tableContent()}</TabPanel>
        <TabPanel value='user'>{tableContent()}</TabPanel>
      </TabContext>

      {/* Download Dialog */}
      <Dialog
        open={downloadDialogOpen}
        onClose={handleCloseDownloadDialog}
        PaperProps={{
          sx: { borderRadius: '12px', minWidth: 400, maxWidth: 500 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography sx={{ fontSize: '20px', fontWeight: 600 }}>Download Animal Keeper Report</Typography>
          <IconButton onClick={handleCloseDownloadDialog} size='small'>
            <Icon icon='mdi:close' />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: theme.palette.text.secondary, mb: 3 }}>
            Select which animals to include in the Excel report:
          </Typography>
          <RadioGroup value={downloadFilter} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDownloadFilter(e.target.value as 'all' | 'withKeeper' | 'withoutKeeper')}>
            <Box
              sx={{
                border: `1px solid ${downloadFilter === 'all' ? theme.palette.primary.main : theme.palette.divider}`,
                borderRadius: '8px',
                p: 2,
                mb: 2,
                cursor: 'pointer',
                backgroundColor: downloadFilter === 'all' ? (theme.palette.primary as unknown as Record<string, string>).lighter : 'transparent'
              }}
              onClick={() => setDownloadFilter('all')}
            >
              <FormControlLabel
                value='all'
                control={<Radio color='primary' />}
                label={
                  <Box>
                    <Typography sx={{ fontWeight: 600 }}>All Animals</Typography>
                    <Typography sx={{ color: theme.palette.text.secondary, fontSize: '14px' }}>
                      Download complete report
                    </Typography>
                  </Box>
                }
                sx={{ m: 0, width: '100%' }}
              />
            </Box>
            <Box
              sx={{
                border: `1px solid ${downloadFilter === 'withKeeper' ? theme.palette.primary.main : theme.palette.divider}`,
                borderRadius: '8px',
                p: 2,
                mb: 2,
                cursor: 'pointer',
                backgroundColor: downloadFilter === 'withKeeper' ? (theme.palette.primary as unknown as Record<string, string>).lighter : 'transparent'
              }}
              onClick={() => setDownloadFilter('withKeeper')}
            >
              <FormControlLabel
                value='withKeeper'
                control={<Radio color='primary' />}
                label={
                  <Box>
                    <Typography sx={{ fontWeight: 600 }}>With Keeper</Typography>
                    <Typography sx={{ color: theme.palette.text.secondary, fontSize: '14px' }}>
                      Only animals with assigned caretakers
                    </Typography>
                  </Box>
                }
                sx={{ m: 0, width: '100%' }}
              />
            </Box>
            <Box
              sx={{
                border: `1px solid ${downloadFilter === 'withoutKeeper' ? theme.palette.primary.main : theme.palette.divider}`,
                borderRadius: '8px',
                p: 2,
                cursor: 'pointer',
                backgroundColor: downloadFilter === 'withoutKeeper' ? (theme.palette.primary as unknown as Record<string, string>).lighter : 'transparent'
              }}
              onClick={() => setDownloadFilter('withoutKeeper')}
            >
              <FormControlLabel
                value='withoutKeeper'
                control={<Radio color='primary' />}
                label={
                  <Box>
                    <Typography sx={{ fontWeight: 600 }}>Without Keeper</Typography>
                    <Typography sx={{ color: theme.palette.text.secondary, fontSize: '14px' }}>
                      Only animals without caretakers
                    </Typography>
                  </Box>
                }
                sx={{ m: 0, width: '100%' }}
              />
            </Box>
          </RadioGroup>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center', gap: 2 }}>
          <Button variant='outlined' onClick={handleCloseDownloadDialog} sx={{ minWidth: 100 }}>
            Cancel
          </Button>
          <LoadingButton
            variant='contained'
            loading={isDownloading}
            startIcon={<Icon icon='material-symbols:download' />}
            onClick={handleDownloadReport}
            sx={{ minWidth: 150 }}
          >
            Download Excel
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}

export default CaretakerReport
