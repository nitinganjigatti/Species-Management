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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  alpha
} from '@mui/material'
import {
  PlayArrow as StartIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  Timeline as TimelineIcon,
  ExpandMore as ExpandMoreIcon
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
import MortalityReportSection from './MortalityReportSection'
import Icon from 'src/@core/components/icon'

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
    router.push(`/necropsy/necropsy/${mortalityId}/report?status=${status}`)
  }

  const handleContinueEditing = () => {
    router.push(`/necropsy/necropsy/${mortalityId}/report?necropsy_id=${mortalityData?.necropsy_id}&status=${status}`)
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
        {/* NecropsyAnimalInfoCard Skeleton */}
        <NecropsyAnimalInfoCard loading={true} />

        {/* Content Cards Skeleton */}
        <Card sx={{ mt: 3 }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {/* Header */}
            <Skeleton variant='text' width={200} height={28} />

            {/* Grid of info items */}
            <Grid container spacing={6}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Skeleton variant='text' width={120} height={16} />
                    <Skeleton variant='text' width={180} height={20} />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Skeleton variant='text' width={180} height={28} />
            <Grid container spacing={4}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Skeleton variant='text' width={140} height={16} />
                    <Skeleton variant='text' width={200} height={20} />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Skeleton variant='text' width={220} height={28} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {Array.from({ length: 2 }).map((_, i) => (
                <Box
                  key={i}
                  sx={{
                    p: 4,
                    borderRadius: 1,
                    backgroundColor: alpha(theme.palette.grey[200], 0.5)
                  }}
                >
                  <Skeleton variant='text' width={150} height={24} sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Skeleton variant='text' width={100} height={16} />
                      <Skeleton variant='text' width='80%' height={18} />
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Skeleton variant='text' width={100} height={16} />
                      <Skeleton variant='text' width='60%' height={18} />
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
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

  if (isCompleted && necropsyData) {
    return (
      <Box>
        <NecropsyAnimalInfoCard
          mortalityData={mortalityData}
          necropsyData={necropsyData}
          status={status}
          requestId={necropsyData?.necropsy_code}
          onDownloadClick={handleDownloadPdf}
          onEditClick={handleContinueEditing}
          onTimelineClick={() => setShowTimeline(true)}
          downloadLoading={pdfLoading}
        />

        <Box sx={{ mt: 3 }}>
          <NecropsySummaryContent necropsyData={necropsyData} mortalityData={mortalityData} />
        </Box>

        <NecropsyTimelineDrawer open={showTimeline} onClose={() => setShowTimeline(false)} mortalityId={mortalityId} />
      </Box>
    )
  }

  return (
    <Box>
      <NecropsyAnimalInfoCard
        mortalityData={mortalityData}
        necropsyData={necropsyData}
        status={status}
        requestId={necropsyData?.necropsy_code}
      />

      {isDraft && necropsyData && (
        <Card sx={{ mt: 3, bgcolor: alpha(theme.palette.customColors?.antzNotes80, 0.4) }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box
              sx={{
                backgroundColor: theme.palette.customColors.OnPrimary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                width: '44px',
                height: '44px'
              }}
            >
              <Icon
                icon={'fluent:document-text-32-regular'}
                fontSize={22}
                color={theme.palette.customColors.Tertiary}
              />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography
                sx={{ fontSize: '20px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceContainer }}
              >
                {necropsyData?.user_profile?.name || 'Unknown'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.Tertiary }}>
                  Saved as draft
                </Typography>
                <Typography
                  sx={{ fontSize: '14px', fontWeight: 400, color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  <span> &bull; </span>
                  {Utility.convertUtcToLocalReadableDate(necropsyData.modified_at)} <span> &bull; </span>{' '}
                  {Utility.convertUTCToLocaltime(necropsyData.modified_at)}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      <MortalityReportSection data={mortalityData} />

      {mortalityData?.animal_id && (
        <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Accordion
            sx={{
              borderRadius: '8px !important',
              '&:before': { display: 'none' },
              '&.Mui-expanded': { margin: 0 }
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                px: 4,
                py: 1,
                '& .MuiAccordionSummary-content': { my: 2 }
              }}
            >
              <Typography
                sx={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: theme.palette.customColors?.OnSurfaceVariant
                }}
              >
                Medical History
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 4, pt: 2, pb: 6 }}>
              <MedicalHistoryTabs animalId={mortalityData.animal_id} hideTitle />
            </AccordionDetails>
          </Accordion>

          <Accordion
            sx={{
              borderRadius: '8px !important',
              '&:before': { display: 'none' },
              '&.Mui-expanded': { margin: 0 },
              mb: 3
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                px: 4,
                py: 1,
                '& .MuiAccordionSummary-content': { my: 2 }
              }}
            >
              <Typography
                sx={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: theme.palette.customColors?.OnSurfaceVariant
                }}
              >
                Assessments
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 4, pt: 2, pb: 6 }}>
              <AssessmentTabs animalId={mortalityData.animal_id} hideTitle />
            </AccordionDetails>
          </Accordion>
        </Box>
      )}

      <Box sx={{ height: 100 }} />

      <BottomActionBar
        onCancel={() => router.push(`/necropsy/necropsy?status=${status}`)}
        onSubmit={isDraft ? handleContinueEditing : handleStartNecropsy}
        cancelLabel='CANCEL'
        submitLabel={isDraft ? 'CONTINUE EDITING' : 'ADD NECROPSY'}
        cancelBtnStyle={{
          color: theme.palette.customColors?.OnPrimaryContainer || theme.palette.text.primary,
          borderColor: theme.palette.customColors?.OnPrimaryContainer || theme.palette.divider
        }}
        submitBtnStyle={{
          backgroundColor: isDraft ? theme.palette.customColors?.OnPrimaryContainer : theme.palette.primary.main
        }}
        layoutStyle={{
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 400,
                color: theme.palette.customColors?.neutralSecondary
              }}
            >
              Current Status <span> &bull; </span>
            </Typography>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 400,
                color: theme.palette.customColors?.neutralSecondary
              }}
            >
              {isDraft
                ? Utility.AgeConverter(Utility.convertUTCToLocal(necropsyData?.modified_at))
                : Utility.AgeConverter(Utility.convertUTCToLocal(mortalityData?.created_at))}
            </Typography>
            {isDraft && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  ml: 1
                }}
                onClick={() => setShowTimeline(true)}
              >
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: theme.palette.primary.main
                  }}
                >
                  See all
                </Typography>
                <Icon icon='mdi:chevron-right' fontSize={20} color={theme.palette.primary.main} />
              </Box>
            )}
          </Box>
          <Typography
            sx={{
              fontSize: '18px',
              fontWeight: 600,
              color: theme.palette.customColors?.OnSurfaceVariant
            }}
          >
            {isDraft ? 'Draft' : 'Pending'}
          </Typography>
        </Box>
      </BottomActionBar>

      <NecropsyTimelineDrawer open={showTimeline} onClose={() => setShowTimeline(false)} mortalityId={mortalityId} />
    </Box>
  )
}

export default NecropsyDetailContent
