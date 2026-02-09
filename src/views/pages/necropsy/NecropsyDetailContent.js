import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Skeleton,
  Divider,
  Chip,
  useTheme
} from '@mui/material'
import {
  PlayArrow as StartIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material'
import { useRouter } from 'next/router'
import Utility from 'src/utility'
import NecropsyAnimalInfoCard from 'src/components/necropsy/NecropsyAnimalInfoCard'
import { getMortalitySummary, getNecropsySummary, getNecropsyPdf } from 'src/lib/api/necropsy'
import { downloadPDF } from 'src/utility'
import MedicalHistoryTabs from 'src/components/necropsy/MedicalHistoryTabs'
import AssessmentTabs from 'src/components/necropsy/AssessmentTabs'
import Toaster from 'src/components/Toaster'
import BottomActionBar from 'src/views/utility/BottomActionBar'
import NecropsyTimelineDrawer from 'src/components/necropsy/NecropsyTimelineDrawer'
import NecropsySummaryContent from './NecropsySummaryContent'

const NecropsyDetailContent = ({ mortalityId, status }) => {
  const theme = useTheme()
  const router = useRouter()

  const [mortalityData, setMortalityData] = useState(null)
  const [necropsyData, setNecropsyData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [showTimeline, setShowTimeline] = useState(false)

  const isCompleted = status === 'COMPLETED' || status === 'UNSUITABLE'
  const isDraft = status === 'DRAFT'

  useEffect(() => {
    if (mortalityId) {
      fetchData()
    }
  }, [mortalityId])

  const fetchData = async () => {
    try {
      setLoading(true)

      const mortalityRes = await getMortalitySummary({ mortality_id: mortalityId })
      if (mortalityRes?.success) {
        setMortalityData(mortalityRes.data)

        const necropsyId = mortalityRes.data?.necropsy_id
        if (necropsyId && (isDraft || isCompleted)) {
          const necropsyRes = await getNecropsySummary(necropsyId)
          if (necropsyRes?.success) {
            setNecropsyData(necropsyRes.data)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      Toaster({ type: 'error', message: 'Failed to load necropsy details' })
    } finally {
      setLoading(false)
    }
  }

  const handleStartNecropsy = () => {
    router.push(`/necropsy/${mortalityId}/report?status=${status}`)
  }

  const handleContinueEditing = () => {
    router.push(`/necropsy/${mortalityId}/report?necropsy_id=${mortalityData?.necropsy_id}&status=${status}`)
  }

  const handleDownloadPdf = async () => {
    if (!mortalityData?.necropsy_id) return

    try {
      setPdfLoading(true)
      const payload = {
        necropsy_id: mortalityData?.necropsy_id
      }
      await downloadPDF({
        apiCall: getNecropsyPdf,
        params: payload,
        fileName: `Necropsy_Report_${mortalityData.necropsy_id}.pdf`
      })
    } catch (error) {
      console.error('Error downloading PDF:', error)
      Toaster({ type: 'error', message: 'Failed to download PDF' })
    } finally {
      setPdfLoading(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Animal Info Card shimmer */}
        <Card sx={{ boxShadow: 'none' }}>
          <CardContent>
            <Grid container spacing={8} alignItems='stretch'>
              <Grid size={{ xs: 12, sm: 12, md: 5 }}>
                <Skeleton variant='rectangular' width='100%' height={140} sx={{ borderRadius: 1 }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 12, md: 7 }}>
                <Grid container spacing={2} columnSpacing={4} rowSpacing={4}>
                  {Array.from(new Array(6)).map((_, i) => (
                    <Grid key={i} size={{ xs: 12, sm: 6 }}>
                      <Skeleton variant='rectangular' width='100%' height={60} sx={{ borderRadius: 1 }} />
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Mortality Details Card shimmer */}
        <Card>
          <CardContent sx={{ p: 6, '&:last-child': { pb: 6 } }}>
            <Skeleton variant='text' width={140} height={20} sx={{ mb: 1 }} />
            <Skeleton variant='rounded' width='100%' height={60} sx={{ borderRadius: 2 }} />
            <Skeleton variant='text' width={80} height={20} sx={{ mt: 4, mb: 1 }} />
            <Skeleton variant='rounded' width='100%' height={60} sx={{ borderRadius: 2 }} />
          </CardContent>
        </Card>

        {/* Medical History Card shimmer */}
        <Card>
          <CardContent sx={{ p: 6, '&:last-child': { pb: 6 } }}>
            <Skeleton variant='text' width={160} height={24} sx={{ mb: 3 }} />
            <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} variant='rounded' width={120} height={36} sx={{ borderRadius: '8px' }} />
              ))}
            </Box>
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} variant='rounded' width='100%' height={100} sx={{ borderRadius: '12px', mb: 2 }} />
            ))}
          </CardContent>
        </Card>

        {/* Assessments Card shimmer */}
        <Card>
          <CardContent sx={{ p: 6, '&:last-child': { pb: 6 } }}>
            <Skeleton variant='text' width={140} height={24} sx={{ mb: 3 }} />
            <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} variant='rounded' width={100} height={36} sx={{ borderRadius: '8px' }} />
              ))}
            </Box>
            {Array.from({ length: 3 }).map((_, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
                <Box sx={{ flexShrink: 0, width: 90, textAlign: 'right' }}>
                  <Skeleton variant='text' width={80} height={18} sx={{ ml: 'auto' }} />
                  <Skeleton variant='text' width={60} height={16} sx={{ ml: 'auto' }} />
                </Box>
                <Skeleton variant='rounded' sx={{ flex: 1, height: 56, borderRadius: '12px' }} />
              </Box>
            ))}
          </CardContent>
        </Card>
      </Box>
    )
  }

  if (!mortalityData) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 8 }}>
          <Typography color='text.secondary'>No mortality data found for this record.</Typography>
          <Button variant='outlined' sx={{ mt: 2 }} onClick={() => router.push(`/necropsy?status=${status}`)}>
            Back to Listing
          </Button>
        </CardContent>
      </Card>
    )
  }

  // For COMPLETED/UNSUITABLE, show the full necropsy summary
  if (isCompleted && necropsyData) {
    return (
      <Box>
        <NecropsyAnimalInfoCard mortalityData={mortalityData} />

        <Box sx={{ mt: 3 }}>
          <NecropsySummaryContent
            necropsyData={necropsyData}
            mortalityData={mortalityData}
            actionButtons={
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant='outlined'
                  startIcon={<TimelineIcon />}
                  onClick={() => setShowTimeline(true)}
                >
                  See Timeline
                </Button>
                <Button
                  variant='outlined'
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadPdf}
                  disabled={pdfLoading}
                >
                  {pdfLoading ? 'Generating...' : 'Download PDF'}
                </Button>
                <Button
                  variant='outlined'
                  startIcon={<EditIcon />}
                  onClick={handleContinueEditing}
                >
                  Edit
                </Button>
              </Box>
            }
          />
        </Box>

        <NecropsyTimelineDrawer
          open={showTimeline}
          onClose={() => setShowTimeline(false)}
          mortalityId={mortalityId}
        />
      </Box>
    )
  }

  // For PENDING / DRAFT, show mortality details with action buttons
  return (
    <Box>
      <NecropsyAnimalInfoCard mortalityData={mortalityData} />

      {/* Status indicator for draft */}
      {isDraft && necropsyData && (
        <Card sx={{ mt: 3, bgcolor: theme.palette.customColors?.avatarBackground || '#FFF3E0' }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip label='DRAFT' color='warning' size='small' sx={{ fontWeight: 600 }} />
              <Typography variant='body2'>
                Saved as draft by{' '}
                <strong>{necropsyData?.user_profile?.name || 'Unknown'}</strong>
                {necropsyData?.modified_at && (
                  <> on {Utility.convertUtcToLocalReadableDate(necropsyData.modified_at)}</>
                )}
              </Typography>
            </Box>
            <Button
              variant='text'
              startIcon={<TimelineIcon />}
              onClick={() => setShowTimeline(true)}
              sx={{ fontWeight: 500, fontSize: '13px' }}
            >
              View Timeline
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Mortality Details Card - Only show if history_of_illness or notes exist */}
      {(mortalityData.history_of_illness || mortalityData.notes) && (
        <Card sx={{ mt: 3, mb: 3 }}>
          <CardContent sx={{ p: 6, '&:last-child': { pb: 6 } }}>
            {/* History of Illness - Only show if data exists */}
            {mortalityData.history_of_illness && (
              <Box>
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 400,
                    color: theme.palette.customColors?.neutralSecondary || theme.palette.text.secondary
                  }}
                >
                  History of Illness
                </Typography>
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 400,
                    color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary,
                    mt: 1,
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.6,
                    p: 3,
                    borderRadius: 1,
                    bgcolor: theme.palette.customColors?.displaybgPrimary || theme.palette.grey[50]
                  }}
                >
                  {mortalityData.history_of_illness}
                </Typography>
              </Box>
            )}

            {/* Notes - Only show if data exists */}
            {mortalityData.notes && (
              <Box sx={{ mt: mortalityData.history_of_illness ? 5 : 0 }}>
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 400,
                    color: theme.palette.customColors?.neutralSecondary || theme.palette.text.secondary
                  }}
                >
                  Notes
                </Typography>
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 400,
                    color: theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary,
                    mt: 1,
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.6,
                    p: 3,
                    borderRadius: 1,
                    bgcolor: theme.palette.customColors?.displaybgPrimary || theme.palette.grey[50]
                  }}
                >
                  {mortalityData.notes}
                </Typography>
              </Box>
            )}

          </CardContent>
        </Card>
      )}

      {/* Medical History & Assessments — each in its own Card */}
      {mortalityData?.animal_id && (
        <>
          <Card sx={{ mt: 3 }}>
            <CardContent sx={{ p: 6, '&:last-child': { pb: 6 } }}>
              <MedicalHistoryTabs animalId={mortalityData.animal_id} />
            </CardContent>
          </Card>
          <Card sx={{ mt: 3, mb: 3 }}>
            <CardContent sx={{ p: 6, '&:last-child': { pb: 6 } }}>
              <AssessmentTabs animalId={mortalityData.animal_id} />
            </CardContent>
          </Card>
        </>
      )}

      {/* Spacer for fixed bottom bar */}
      <Box sx={{ height: 100 }} />

      <BottomActionBar
        onCancel={() => router.push(`/necropsy?status=${status}`)}
        onSubmit={isDraft ? handleContinueEditing : handleStartNecropsy}
        cancelLabel='Back'
        submitLabel={isDraft ? 'Continue Editing' : 'Update Necropsy'}
        cancelBtnStyle={{
          color: theme.palette.customColors?.OnPrimaryContainer || theme.palette.text.primary,
          borderColor: theme.palette.customColors?.OnPrimaryContainer || theme.palette.divider
        }}
        submitBtnStyle={{
          backgroundColor: theme.palette.customColors?.OnPrimaryContainer || theme.palette.primary.main
        }}
      />

      <NecropsyTimelineDrawer
        open={showTimeline}
        onClose={() => setShowTimeline(false)}
        mortalityId={mortalityId}
      />
    </Box>
  )
}

export default NecropsyDetailContent
