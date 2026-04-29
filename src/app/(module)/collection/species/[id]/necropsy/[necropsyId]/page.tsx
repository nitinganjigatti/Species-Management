'use client'

import { Avatar, Box, Button, Card, Divider, Typography } from '@mui/material'
import { useParams } from 'next/navigation'
import React from 'react'
import { useTheme } from '@mui/material/styles'
import DynamicBreadcrumbs from 'src/views/utility/DynamicBreadcrumbs'
import Icon from 'src/@core/components/icon'
// AnimalCard available for future use when API data has sex/gender fields
// import AnimalCard from 'src/views/utility/AnimalCard'

// TODO: Replace with real API data
const necropsyData = {
  necropsy_id: 'H2RE02933456',
  completed_by: 'Jordan Stevenson',
  completed_date: '10/10/2023 • 12:33 PM',
  species: {
    common_name: 'Rainbow Lorikeet',
    scientific_name: 'Trichoglossus Moluccanus',
    image: ''
  },
  animal_info: {
    animal_id: '12345667878',
    breed: 'Breed 12',
    variant: 'Variant 2',
    age: '12y 1m',
    weight: '13 KG',
    site: 'Gagava'
  },
  carcass_submission: {
    date_time: '10:12 PM  20 July 2023',
    general_description:
      'Animals is of 30kg with a BCS 4 when last assessed. Animal seem to have been in healthy condition.',
    short_history: 'Animal was under treatment for mild viral fever disease past week.'
  },
  organ_lesions: [
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
  ],
  lab_requests: [
    { id: 'LT207835473', date: '15 Apr 2025' },
    { id: 'LT207835473', date: '15 Apr 2025' },
    { id: 'LT207835473', date: '15 Apr 2025' }
  ],
  attachments: [
    { name: 'Antz Yelahanka Site...', time: '12:23 PM', type: 'audio' },
    { name: 'Antz Yelahanka Site...', time: '12:23 PM', type: 'image' },
    { name: 'Antz Yelahanka Site...', time: '12:23 PM', type: 'pdf' },
    { name: 'Antz Yelahanka Site...', time: '12:23 PM', type: 'doc' }
  ],
  death_details: {
    date_time: '10:12 PM  20 July 2023',
    place: 'Lorem ipsum dolor sit amet',
    suspected_cause:
      "Euthanasia was performed due to the animal's deteriorating health condition, which had been assessed over the previous week.",
    opinion:
      'The necropsy report indicates that the animal was in a stable condition prior to its passing. Further examination revealed no significant abnormalities in the vital organs, suggesting a natural decline rather than an acute illness.',
    disposal_method: 'Necropsy Report Summary',
    confirmed_cause:
      "Euthanasia was performed due to the animal's deteriorating health condition, which had been assessed over the previous week."
  },
  notes: 'The nursery is optimizing its layout to enhance resource allocation and improve operational efficiency.'
}

const NecropsyDetail: React.FC = () => {
  const theme = useTheme() as any
  const { id, necropsyId } = useParams() as { id?: string; necropsyId?: string }
  const data = necropsyData

  // Reusable section title
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
      {children}
    </Typography>
  )

  return (
    <Box>
      <DynamicBreadcrumbs
        sx={{ mb: 5 }}
        pageItems={[
          { title: 'Collection', href: '/collection/species' },
          { title: 'Species', href: '/collection/species' },
          { title: id || '', href: `/collection/species/${id}` },
          { title: 'Necropsy', href: `/collection/species/${id}?tab=necropsy` },
          { title: necropsyId || '', href: '#', active: true }
        ]}
      />

      {/* ===== HEADER CARD ===== */}
      <Card sx={{ mb: 5, overflow: 'hidden' }}>
        {/* Top Row */}
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
            Necropsy ID - {data.necropsy_id}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, sm: 3 }, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.customColors.Surface }}>
                <Icon icon='mdi:account' fontSize={18} />
              </Avatar>
              <Box>
                <Typography
                  variant='body2'
                  sx={{ fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  {data.completed_by}
                </Typography>
                <Typography variant='caption' sx={{ color: theme.palette.customColors.neutralSecondary }}>
                  Completed on {data.completed_date}
                </Typography>
              </Box>
            </Box>
            <Button
              variant='text'
              onClick={() => {
                /* TODO: Download report */
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

        {/* Species Card + Animal Info — unified light bg block */}
        <Box
          sx={{
            mx: { xs: 3, sm: 5 },
            mb: { xs: 3, sm: 5 },
            borderRadius: 1,
            backgroundColor: theme.palette.customColors.Background,
            overflow: 'hidden'
          }}
        >
          {/* Species info */}
          <Box sx={{ px: 4, pt: 4, pb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
              <Avatar
                src={data.species.image}
                sx={{ width: 44, height: 44, bgcolor: theme.palette.customColors.Surface }}
              >
                <Icon icon='mdi:paw' fontSize={22} />
              </Avatar>
              <Box>
                <Typography
                  sx={{ fontWeight: 600, fontSize: '1rem', color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  {data.species.common_name}
                </Typography>
                <Typography
                  sx={{ fontSize: '0.85rem', fontStyle: 'italic', color: theme.palette.customColors.neutralSecondary }}
                >
                  {data.species.scientific_name}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Divider */}
          <Divider sx={{ mx: 4 }} />

          {/* Animal Info Row */}
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              px: 4,
              py: 3
            }}
          >
            {[
              { label: 'Animal Id', value: data.animal_info.animal_id },
              { label: 'Breed', value: data.animal_info.breed },
              { label: 'Variant', value: data.animal_info.variant },
              { label: 'Age', value: data.animal_info.age },
              { label: 'Weight', value: data.animal_info.weight },
              { label: 'Site', value: data.animal_info.site }
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
                  {item.value}
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
        <SectionText>{data.carcass_submission.date_time}</SectionText>

        <SectionLabel>General Description</SectionLabel>
        <SectionText>{data.carcass_submission.general_description}</SectionText>

        <SectionLabel>Short History of Illness</SectionLabel>
        <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant, lineHeight: 1.7 }}>
          {data.carcass_submission.short_history}
        </Typography>
      </Card>

      {/* ===== ORGAN-WISE DESCRIPTION OF LESIONS ===== */}
      <Card sx={{ p: { xs: 3, sm: 5 }, mb: 5, border: `1px solid ${theme.palette.customColors.SurfaceVariant}` }}>
        <Typography
          sx={{ fontWeight: 600, fontSize: '1.1rem', mb: 4, color: theme.palette.customColors.OnSurfaceVariant }}
        >
          Organ-wise Description of Lesions
        </Typography>
        {data.organ_lesions.map((organ, idx) => (
          <Box key={idx} sx={{ mb: 5 }}>
            {/* Section header with left accent */}
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
            {organ.findings.map((finding, fIdx) => (
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
        {data.lab_requests.map((lab, idx) => (
          <Box
            key={idx}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              flexDirection: { xs: 'column', sm: 'row' },
              p: 3,
              px: { xs: 3, sm: 4 },
              mb: 1,
              gap: { xs: 0.5, sm: 0 },
              borderRadius: 0.5,
              backgroundColor: theme.palette.customColors.tableHeaderBg,
              border: `1px solid ${theme.palette.customColors.OutlineVariant}`,
              cursor: 'pointer',
              '&:hover': { backgroundColor: theme.palette.customColors.OnBackground }
            }}
          >
            <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
              Lab Test ID: <strong>{lab.id}</strong>
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant }}>
                Requested on • <strong>{lab.date}</strong>
              </Typography>
              <Icon icon='mdi:chevron-right' fontSize={20} color={theme.palette.customColors.Outline} />
            </Box>
          </Box>
        ))}
      </Card>

      {/* ===== ATTACHMENTS ===== */}
      <Card sx={{ p: { xs: 3, sm: 5 }, mb: 5, border: `1px solid ${theme.palette.customColors.SurfaceVariant}` }}>
        <Typography
          sx={{ fontWeight: 600, fontSize: '1.1rem', mb: 4, color: theme.palette.customColors.OnSurfaceVariant }}
        >
          Attachments
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, overflowX: 'auto', pb: 2 }}>
          {data.attachments.map((att, idx) => {
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
                {/* Thumbnail */}
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
                  {isPdf && <Icon icon='mdi:file-pdf-box' fontSize={48} color='#E53935' />}
                  {isDoc && <Icon icon='mdi:file-word-box' fontSize={48} color='#1E88E5' />}
                  {isImage && (
                    <Box
                      component='img'
                      src='/images/housing/testInDev.jpg'
                      alt={att.name}
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                </Box>

                {/* Name + Menu + Time */}
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
      </Card>

      {/* ===== DEATH DETAILS ===== */}
      <Card sx={{ p: { xs: 3, sm: 5 }, mb: 5, border: `1px solid ${theme.palette.customColors.SurfaceVariant}` }}>
        <SectionLabel italic>Time and Date of Death</SectionLabel>
        <SectionText>{data.death_details.date_time}</SectionText>

        <SectionLabel>Place of Death</SectionLabel>
        <SectionText>{data.death_details.place}</SectionText>

        <SectionLabel>Suspected cause of death</SectionLabel>
        <SectionText>{data.death_details.suspected_cause}</SectionText>

        <Divider sx={{ my: 3 }} />

        <SectionLabel>Opinion (Cause of death)</SectionLabel>
        <SectionText>{data.death_details.opinion}</SectionText>

        <SectionLabel>Disposal Method</SectionLabel>
        <SectionText>{data.death_details.disposal_method}</SectionText>

        <SectionLabel>Confirmed Cause of Death (as per necropsy)</SectionLabel>
        <Typography variant='body2' sx={{ color: theme.palette.customColors.OnSurfaceVariant, lineHeight: 1.7 }}>
          {data.death_details.confirmed_cause}
        </Typography>
      </Card>

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
          {data.notes}
        </Typography>
      </Card>
    </Box>
  )
}

export default NecropsyDetail
