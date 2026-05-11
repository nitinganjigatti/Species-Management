'use client'

import { Avatar, Box, Button, Card, CircularProgress, Divider, Typography } from '@mui/material'
import { useParams, useSearchParams } from 'next/navigation'
import React from 'react'
import { useTheme } from '@mui/material/styles'
import { useQuery } from '@tanstack/react-query'
import moment from 'moment'
import DynamicBreadcrumbs from 'src/views/utility/DynamicBreadcrumbs'
import Icon from 'src/@core/components/icon'
import { getMortalitySummary, getNecropsySummary, getNecropsyTimeline } from 'src/lib/api/necropsy'
import { ROUTES } from 'src/constants/routes'

// Flip to true once the backend ships a lab-requests endpoint for necropsy.
const FEATURE_LAB_REQUESTS = false

const FALLBACK_ORGAN_LESIONS = [
  {
    title: 'Head and Neck',
    findings: [
      {
        label: 'Skull',
        text: 'The necropsy report indicates that the animal was in a stable condition prior to its passing. Further examination revealed no significant abnormalities in the vital organs.'
      },
      {
        label: 'Nasal Passages',
        text: 'Upon inspection, the nasal passages appeared clear, with no signs of obstruction or inflammation noted during the examination.'
      }
    ]
  },
  {
    title: 'Respiratory System',
    findings: [
      {
        label: 'Skull',
        text: 'The necropsy report reveals that the animal was in a stable condition prior to its passing. Further examination showed no significant abnormalities in the vital organs.'
      },
      {
        label: 'Nasal Passages',
        text: 'Upon inspection, the nasal passages appeared clear, with no signs of obstruction or inflammation noted during the examination.'
      }
    ]
  }
]

const formatDateTime = (date?: string | null, time?: string | null) => {
  if (!date) return '-'
  const dateOnly = moment(date.split(' ')[0], 'YYYY-MM-DD')
  if (!dateOnly.isValid()) return '-'
  const datePart = dateOnly.format('DD MMM YYYY')
  const timeRaw = time || (date.includes(' ') ? date.split(' ')[1] : null)
  if (!timeRaw) return datePart
  const timeMoment = moment(timeRaw, ['HH:mm:ss', 'HH:mm'])
  const timePart = timeMoment.isValid() ? timeMoment.format('hh:mm A') : timeRaw

  return `${timePart}  ${datePart}`
}

const formatCommentDate = (iso?: string) => {
  if (!iso) return ''
  const m = moment(iso, 'YYYY-MM-DD HH:mm:ss')

  return m.isValid() ? m.format('hh:mm A • DD MMM YYYY') : iso
}

const fileTypeFromMime = (mime?: string, fileType?: string): string => {
  const t = (fileType || mime || '').toLowerCase()
  if (t.includes('audio')) return 'audio'
  if (t.includes('pdf')) return 'pdf'
  if (t.includes('word') || t.includes('doc')) return 'doc'
  if (t.includes('image') || t.includes('png') || t.includes('jpg') || t.includes('jpeg')) return 'image'

  return 'doc'
}

const formatAttachmentTime = (iso?: string) => {
  if (!iso) return ''
  const m = moment(iso, 'YYYY-MM-DD HH:mm:ss')

  return m.isValid() ? m.format('hh:mm A') : iso
}

const NecropsyDetail: React.FC = () => {
  const theme = useTheme() as any
  const { id, necropsyId } = useParams() as { id?: string; necropsyId?: string }
  const searchParams = useSearchParams()
  const mortalityId = searchParams?.get('mortality_id') || necropsyId

  const { data: mortalityResp, isLoading: isMortalityLoading } = useQuery({
    queryKey: ['necropsy-detail-mortality', mortalityId],
    queryFn: () => getMortalitySummary({ mortality_id: mortalityId as string }),
    enabled: Boolean(mortalityId)
  })

  const { data: necropsyResp, isLoading: isNecropsyLoading } = useQuery({
    queryKey: ['necropsy-detail-summary', necropsyId],
    queryFn: () => getNecropsySummary(Number(necropsyId)),
    enabled: Boolean(necropsyId)
  })

  const { data: timelineResp } = useQuery({
    queryKey: ['necropsy-detail-timeline', mortalityId],
    queryFn: () =>
      getNecropsyTimeline({ mortality_id: mortalityId as string, page_no: 1, type: 'necropsy', limit: 10 }),
    enabled: Boolean(mortalityId)
  })

  const mortality = (mortalityResp as any)?.data || {}
  const necropsy = (necropsyResp as any)?.data || {}
  const timeline = ((timelineResp as any)?.data?.result || []) as Array<any>
  const isLoading = isMortalityLoading || isNecropsyLoading

  const necropsyCode = necropsy.necropsy_code || mortality.request_id || necropsyId || '-'
  const conductedBy = necropsy.necropsy_conducted_by?.[0] || necropsy.user_profile || {}
  const completedByName = conductedBy.name || mortality.user_full_name || '-'
  const completedAvatar = conductedBy.user_profile_pic || mortality.user_profile_pic
  const completedDate = necropsy.created_at || mortality.created_at
  const speciesCommonName = necropsy.common_name || mortality.default_common_name || '-'
  const speciesScientificName = necropsy.scientific_name || mortality.complete_name || ''
  const speciesImage = necropsy.default_icon || mortality.default_icon || ''

  const carcassSubmissionDateTime = formatDateTime(necropsy.caracass_submission_date, necropsy.caracass_submission_time)
  const generalDescription = necropsy.general_description || mortality.general_description || ''
  const historyOfIllness = necropsy.history_of_illness || mortality.history_of_illness || ''

  const dateOfDeath = mortality.date_of_death || necropsy.date_of_death
  const dateOfDeathFormatted = dateOfDeath ? formatDateTime(dateOfDeath.split(' ')[0], dateOfDeath.split(' ')[1]) : '-'

  const placeOfDeath = necropsy.place_of_death || ''
  const suspectedCause = necropsy.suspected_cause_of_death || mortality.manner_of_death || '-'
  const opinion = necropsy.opinion || ''
  const disposalMethod = necropsy.disposal_method || mortality.carcass_disposition_name || '-'
  const confirmedCause = necropsy.confirmed_cause_of_death || '-'
  const notes = necropsy.additional_notes || mortality.notes || ''

  const animalIdValue = mortality.animal_id || necropsy.animal_id
  const breed = mortality.breed_name || necropsy.breed_name || '-'
  const morph = mortality.morph_name || necropsy.morph_name || '-'
  const ageDisplay =
    mortality.age && mortality.age_unit ? `${mortality.age} ${mortality.age_unit}` : mortality.age || '-'
  const weightDisplay =
    necropsy.carcass_weight && necropsy.uom_abbr
      ? `${necropsy.carcass_weight} ${necropsy.uom_abbr}`
      : necropsy.carcass_weight || '-'
  const siteName = mortality.site_name || necropsy.site_name || '-'

  const apiOrgans = (necropsy.necropsy_organs || []) as Array<any>
  const organLesions =
    apiOrgans.length > 0
      ? apiOrgans.map((organ: any) => ({
          title: organ.title || organ.body_part_name || organ.organ_name || '-',
          findings: (organ.findings || organ.body_parts || []).map((f: any) => ({
            label: f.label || f.body_part_name || f.organ_name || '-',
            text: f.text || f.description || f.note || ''
          }))
        }))
      : FALLBACK_ORGAN_LESIONS

  const apiAttachments = (necropsy.attachments || []) as Array<any>
  const attachments = apiAttachments.map((a: any) => ({
    name: a.file_original_name || a.file_name || 'Attachment',
    time: formatAttachmentTime(a.created_at),
    type: fileTypeFromMime(a.file_mime_type, a.file_type),
    url: a.file
  }))

  const SectionLabel = ({ children, italic }: { children: React.ReactNode; italic?: boolean }) => (
    <Typography
      sx={{
        fontWeight: 700,
        fontSize: '0.9rem',
        color: theme.palette.customColors.OnSurfaceVariant,
        mb: 1,
        fontStyle: italic ? 'italic' : 'normal'
      }}
    >
      {children}
    </Typography>
  )

  const SectionText = ({ children }: { children: React.ReactNode }) => (
    <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant, mb: 4, lineHeight: 1.7 }}>
      {children || '-'}
    </Typography>
  )

  if (isLoading && !mortalityResp && !necropsyResp) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <DynamicBreadcrumbs
        sx={{ mb: 5 }}
        pageItems={[
          //  { title: 'Collection', href: '/collection/species' },
          // { title: 'Species', href: '/collection/species' },
          // { title: id || '', href: `/collection/species/${id}` },
          // { title: 'Necropsy', href: `/collection/species/${id}?tab=necropsy` },
          { title: 'Collection', href: ROUTES.collection.species },
          { title: 'Species', href: ROUTES.collection.species },
          { title: id || '', href: id ? ROUTES.collection.speciesDetail(id) : '#' },
          { title: 'Necropsy', href: id ? `${ROUTES.collection.speciesDetail(id)}?tab=necropsy` : '#' },
          { title: necropsyCode, href: '#', active: true }
        ]}
      />

      {/* ===== HEADER CARD ===== */}
      <Card sx={{ mb: 5, overflow: 'hidden' }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 3,
            p: { xs: 3, sm: 5 },
            pb: 4
          }}
        >
          <Typography
            variant='h6'
            sx={{
              fontWeight: 600,
              color: theme.palette.customColors.OnSurfaceVariant,
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}
          >
            Necropsy ID - {necropsyCode}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, sm: 3 }, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar
                src={completedAvatar || undefined}
                sx={{ width: 32, height: 32, bgcolor: theme.palette.customColors.Surface }}
              >
                <Icon icon='mdi:account' fontSize={18} />
              </Avatar>
              <Box>
                <Typography
                  variant='body2'
                  sx={{ fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  {completedByName}
                </Typography>
                <Typography variant='caption' sx={{ color: theme.palette.customColors.neutralSecondary }}>
                  Completed on {formatCommentDate(completedDate) || '-'}
                </Typography>
              </Box>
            </Box>
            <Button
              variant='text'
              onClick={() => {
                /* TODO: Backend endpoint pending */
              }}
              endIcon={<Icon icon='solar:download-square-linear' />}
              sx={{
                color: theme.palette.customColors.OnSurface,
                fontWeight: 500,
                textTransform: 'none',
                fontSize: '0.875rem'
              }}
            >
              Download report
            </Button>
          </Box>
        </Box>

        <Box
          sx={{
            mx: { xs: 3, sm: 5 },
            mb: { xs: 3, sm: 5 },
            borderRadius: 1,
            backgroundColor: theme.palette.customColors.Background,
            overflow: 'hidden'
          }}
        >
          <Box sx={{ px: 4, pt: 4, pb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
              <Avatar src={speciesImage} sx={{ width: 44, height: 44, bgcolor: theme.palette.customColors.Surface }}>
                <Icon icon='mdi:paw' fontSize={22} />
              </Avatar>
              <Box>
                <Typography
                  sx={{ fontWeight: 600, fontSize: '1rem', color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  {speciesCommonName}
                </Typography>
                <Typography
                  sx={{ fontSize: '0.85rem', fontStyle: 'italic', color: theme.palette.customColors.neutralSecondary }}
                >
                  {speciesScientificName}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ mx: 4 }} />

          <Box sx={{ display: 'flex', flexWrap: 'wrap', px: 4, py: 3 }}>
            {[
              { label: 'Animal Id', value: animalIdValue ? `AAID : ${animalIdValue}` : '-' },
              { label: 'Breed', value: breed },
              { label: 'Variant', value: morph },
              { label: 'Age', value: ageDisplay },
              { label: 'Weight', value: weightDisplay },
              { label: 'Site', value: siteName }
            ].map((item, i) => (
              <Box
                key={i}
                sx={{
                  flex: { xs: '0 0 50%', sm: '0 0 33%', md: 1 },
                  minWidth: { xs: 'auto', md: 100 },
                  mb: { xs: 2, md: 0 }
                }}
              >
                <Typography
                  variant='caption'
                  sx={{ color: theme.palette.customColors.neutralSecondary, fontSize: '0.7rem' }}
                >
                  {item.label}
                </Typography>
                <Typography
                  variant='body2'
                  sx={{ fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  {item.value || '-'}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Card>

      {/* ===== CARCASS SUBMISSION ===== */}
      <Card
        sx={{
          p: { xs: 3, sm: 5 },
          mb: 5,
          border: `1px solid ${theme.palette.customColors.SurfaceVariant}`
        }}
      >
        <SectionLabel italic>Time and Date of Carcass Submission (at PM room )</SectionLabel>
        <SectionText>{carcassSubmissionDateTime}</SectionText>

        <SectionLabel>General Description</SectionLabel>
        <SectionText>{generalDescription}</SectionText>

        <SectionLabel>Short History of Illness</SectionLabel>
        <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant, lineHeight: 1.7 }}>
          {historyOfIllness || '-'}
        </Typography>
      </Card>

      {/* ===== ORGAN-WISE DESCRIPTION OF LESIONS ===== */}
      <Card sx={{ p: { xs: 3, sm: 5 }, mb: 5, border: `1px solid ${theme.palette.customColors.SurfaceVariant}` }}>
        <Typography
          sx={{ fontWeight: 600, fontSize: '1.1rem', mb: 4, color: theme.palette.customColors.OnSurfaceVariant }}
        >
          Organ-wise Description of Lesions
        </Typography>
        {organLesions.map((organ, idx) => (
          <Box key={idx} sx={{ mb: 5 }}>
            <Box
              sx={{
                backgroundColor: theme.palette.customColors.neutral05,
                borderLeft: `4px solid ${theme.palette.customColors.OutlineVariant}`,
                p: 3,
                pl: 4,
                borderRadius: '0 8px 8px 0',
                mb: 3
              }}
            >
              <Typography
                sx={{ fontWeight: 600, fontSize: '1rem', color: theme.palette.customColors.OnSurfaceVariant }}
              >
                {organ.title}
              </Typography>
            </Box>
            {organ.findings.map((finding: { label: string; text: string }, fIdx: number) => (
              <Box key={fIdx} sx={{ mb: 3, pl: 2 }}>
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    mb: 0.5,
                    color: theme.palette.customColors.OnSurfaceVariant
                  }}
                >
                  {finding.label}:
                </Typography>
                <Typography
                  variant='body2'
                  sx={{ color: theme.palette.customColors.OnSurfaceVariant, lineHeight: 1.7 }}
                >
                  {finding.text}
                </Typography>
              </Box>
            ))}
          </Box>
        ))}
      </Card>

      {/* ===== LAB REQUEST DETAILS ===== */}
      <Card sx={{ p: { xs: 3, sm: 5 }, mb: 5, border: `1px solid ${theme.palette.customColors.SurfaceVariant}` }}>
        <Typography
          sx={{ fontWeight: 600, fontSize: '1.1rem', mb: 4, color: theme.palette.customColors.OnSurfaceVariant }}
        >
          Lab Request Details
        </Typography>
        {FEATURE_LAB_REQUESTS ? null : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 4,
              gap: 1
            }}
          >
            <Icon icon='mdi:flask-empty-outline' fontSize={32} color={theme.palette.customColors.Outline} />
            <Typography variant='body2' sx={{ color: theme.palette.customColors.neutralSecondary }}>
              No lab requests available
            </Typography>
          </Box>
        )}
      </Card>

      {/* ===== ATTACHMENTS ===== */}
      <Card sx={{ p: { xs: 3, sm: 5 }, mb: 5, border: `1px solid ${theme.palette.customColors.SurfaceVariant}` }}>
        <Typography
          sx={{ fontWeight: 600, fontSize: '1.1rem', mb: 4, color: theme.palette.customColors.OnSurfaceVariant }}
        >
          Attachments
        </Typography>
        {attachments.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 4,
              gap: 1
            }}
          >
            <Icon icon='mdi:paperclip' fontSize={32} color={theme.palette.customColors.Outline} />
            <Typography variant='body2' sx={{ color: theme.palette.customColors.neutralSecondary }}>
              No attachments available
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 3, overflowX: 'auto', pb: 2 }}>
            {attachments.map((att, idx) => {
              const isAudio = att.type === 'audio'
              const isPdf = att.type === 'pdf'
              const isDoc = att.type === 'doc'
              const isImage = att.type === 'image'

              return (
                <Box
                  key={idx}
                  sx={{
                    minWidth: 180,
                    maxWidth: 200,
                    border: `0.5px solid ${theme.palette.customColors.OutlineVariant}`,
                    borderRadius: 1,
                    p: 1.5,
                    cursor: 'pointer'
                  }}
                >
                  <Box
                    sx={{
                      width: '100%',
                      height: 140,
                      borderRadius: 1,
                      backgroundColor: isAudio
                        ? theme.palette.customColors.antzNotes
                        : isPdf
                        ? theme.palette.customColors.BgTeritary
                        : isDoc
                        ? theme.palette.customColors.antzSecondaryBg
                        : theme.palette.customColors.SurfaceVariant,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}
                  >
                    {isAudio && (
                      <Icon icon='mdi:microphone' fontSize={48} color={theme.palette.customColors.moderateSecondary} />
                    )}
                    {isPdf && (
                      <Icon icon='mdi:file-pdf-box' fontSize={48} color={theme.palette.customColors.Tertiary} />
                    )}
                    {isDoc && (
                      <Icon
                        icon='mdi:file-word-box'
                        fontSize={48}
                        color={theme.palette.customColors.OnSecondaryContainer}
                      />
                    )}
                    {isImage && (
                      <Box
                        component='img'
                        src={(att as any).url || '/images/housing/testInDev.jpg'}
                        alt={att.name}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                  </Box>

                  <Box sx={{ px: 2, py: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography
                        variant='caption'
                        sx={{
                          color: theme.palette.customColors.OnSurfaceVariant,
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1
                        }}
                      >
                        {att.name}
                      </Typography>
                      <Icon icon='mdi:dots-vertical' fontSize={18} color={theme.palette.customColors.Outline} />
                    </Box>
                    <Typography
                      variant='caption'
                      sx={{ color: theme.palette.customColors.neutralSecondary, fontSize: '0.7rem' }}
                    >
                      {att.time}
                    </Typography>
                  </Box>
                </Box>
              )
            })}
          </Box>
        )}
      </Card>

      {/* ===== DEATH DETAILS ===== */}
      <Card sx={{ p: { xs: 3, sm: 5 }, mb: 5, border: `1px solid ${theme.palette.customColors.SurfaceVariant}` }}>
        <SectionLabel italic>Time and Date of Death</SectionLabel>
        <SectionText>{dateOfDeathFormatted}</SectionText>

        <SectionLabel>Place of Death</SectionLabel>
        <SectionText>{placeOfDeath}</SectionText>

        <SectionLabel>Suspected cause of death</SectionLabel>
        <SectionText>{suspectedCause}</SectionText>

        <Divider sx={{ my: 3 }} />

        <SectionLabel>Opinion (Cause of death)</SectionLabel>
        <SectionText>{opinion}</SectionText>

        <SectionLabel>Disposal Method</SectionLabel>
        <SectionText>{disposalMethod}</SectionText>

        <SectionLabel>Confirmed Cause of Death (as per necropsy)</SectionLabel>
        <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant, lineHeight: 1.7 }}>
          {confirmedCause}
        </Typography>
      </Card>

      {/* ===== ACTIVITY LOG ===== */}
      {timeline.length > 0 && (
        <Card sx={{ p: { xs: 3, sm: 5 }, mb: 5, border: `1px solid ${theme.palette.customColors.SurfaceVariant}` }}>
          <Typography
            sx={{ fontWeight: 600, fontSize: '1.1rem', mb: 4, color: theme.palette.customColors.OnSurfaceVariant }}
          >
            Activity Log
          </Typography>
          {timeline.map((item, idx) => (
            <Box
              key={item.id || idx}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 2,
                py: 2,
                borderBottom:
                  idx < timeline.length - 1 ? `1px solid ${theme.palette.customColors.SurfaceVariant}` : 'none'
              }}
            >
              <Avatar
                src={item.user_profile_pic || undefined}
                sx={{ width: 32, height: 32, bgcolor: theme.palette.customColors.Surface }}
              >
                <Icon icon='mdi:account' fontSize={18} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant='body2'
                  sx={{ color: theme.palette.customColors.OnSurfaceVariant, fontWeight: 500 }}
                >
                  {item.comment}
                </Typography>
                <Typography variant='caption' sx={{ color: theme.palette.customColors.neutralSecondary }}>
                  {item.user_name} • {formatCommentDate(item.created_at)}
                </Typography>
              </Box>
            </Box>
          ))}
        </Card>
      )}

      {/* ===== NOTES ===== */}
      <Card
        sx={{
          p: { xs: 3, sm: 5 },
          mb: 5,
          backgroundColor: theme.palette.customColors.antzNotes,
          borderLeft: `4px solid ${theme.palette.primary.main}`
        }}
      >
        <Typography
          sx={{ fontWeight: 700, fontSize: '0.9rem', mb: 1, color: theme.palette.customColors.OnSurfaceVariant }}
        >
          Notes
        </Typography>
        <Typography
          variant='body2'
          sx={{ fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant, lineHeight: 1.7 }}
        >
          {notes || '-'}
        </Typography>
      </Card>
    </Box>
  )
}

export default NecropsyDetail
