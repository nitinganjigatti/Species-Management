import { Button, Tooltip, Typography } from '@mui/material'
import { Box, Grid } from '@mui/system'
import React, { useState } from 'react'
import { useTheme } from '@mui/material/styles'
import MediaCard from 'src/views/utility/MediaCard'
import { useRouter } from 'next/router'

const surgeries = [
  'S1235/25',
  'S2345/25',
  'S6598/15',
  'S7346/20',
  'S1628/23',
  'S2347/25',
  'S9460/10',
  'S5814/15',
  'S6312/25',
  'S3842/10',
  'S6245/23',
  'S9730/7',
  'S2278/20',
  'S9370/13',
  'S7765/24',
  'S5458/12'
]

const basicDetails = {
  date: '12 Aug 2024',
  surgeryDuration: '2 hours',
  startTime: '10:00 am',
  endTime: '12:00 pm'
}

const surgeryDetails = {
  procedureName: 'Ovariohysterectomy',
  surgicalApproach: 'Midline abdominal incision',
  typeOfSurgery: 'Elective'
}

const careInstructions = {
  dietInstructions:
    "The surgery was executed flawlessly, with no complications reported during the procedure. The patient remained stable throughout the operation, and a smooth recovery is anticipated. Follow-up evaluations are set for 14 stable throughout the operation, and a smooth recovery is anticipated. Follow-up evaluations are set for 14 stable throughout the operation, and a smooth recovery is anticipated. Follow-up evaluations are set for 14 stable throughout the operation, and a smooth recovery is anticipated. Follow-up evaluations are set for 14 stable throughout the operation, and a smooth recovery is anticipated. Follow-up evaluations are set for 14 August 2024, ensuring ongoing monitoring of the patient's progress.",
  restrictions:
    "The surgery was executed flawlessly, with no complications reported during the procedure. The patient remained stable throughout the operation, and a smooth recovery is anticipated. Follow-up evaluations are set for 14 August 2024, ensuring ongoing monitoring of the patient's progress.",
  additionalNotes:
    "The surgery was executed flawlessly, with no complications reported during the procedure. The patient remained stable throughout the operation, and a smooth recovery is anticipated. Follow-up evaluations are set for 14 August 2024, ensuring ongoing monitoring of the patient's progress."
}

// ✅ Data as variable
const surgeryNotes = {
  paragraph:
    "The surgery was executed flawlessly, with no complications reported during the procedure. The patient remained stable throughout the operation, and a smooth recovery is anticipated. Follow-up evaluations are set for 14 August 2024, ensuring ongoing monitoring of the patient's progress.",
  findings: 'Intestinal foreign body lodged in jejunum',
  procedurePerformed: [
    'Enterotomy performed',
    'Foreign body removed',
    'Intestine lavaged and sutured using absorbable suture material (Vicryl 3-0)'
  ],
  hemostasis: 'Achieve',
  closure: 'Three-layer closure with absorbable sutures for internal layers, nylon for skin'
}

// ✅ Sample data (JSON-like JS object)
const mediaItems = [
  {
    id: 'm1',
    file_original_name: 'Antz Yelahanka Site Visit - Photos.jpg',
    file: 'https://example.com/media/site-visit-photo.jpg',
    type: 'image',
    created_at: '2025-08-12T12:23:00Z'
  },
  {
    id: 'm2',
    file_original_name: 'Antz Yelahanka Site Visit - Report.pdf',
    file: 'https://example.com/media/site-visit-report.pdf',
    type: 'document',
    created_at: '2025-08-12T12:23:00Z'
  },
  {
    id: 'm3',
    file_original_name: 'Antz Yelahanka Site Visit - Walkthrough.mp4',
    file: 'https://example.com/media/walkthrough.mp4',
    type: 'video',
    created_at: '2025-08-12T12:23:00Z'
  },
  {
    id: 'm4',
    file_original_name: 'Antz Yelahanka Site Visit - Sheet.xlsx',
    file: 'https://example.com/media/visit-sheet.xlsx',
    type: 'document',
    created_at: '2025-08-12T12:23:00Z'
  },
  {
    id: 'm5',
    file_original_name: 'Enclosure Reference Image.png',
    file: 'https://example.com/media/enclosure.png',
    type: 'image',
    created_at: '2025-08-12T12:23:00Z'
  },
  {
    id: 'm6',
    file_original_name: 'Site Voice Note.m4a',
    file: 'https://example.com/media/voice-note.m4a',
    type: 'audio',
    created_at: '2025-08-12T12:23:00Z'
  }
]

const MediaScroller = () => {
  return (
    <Box
      sx={{
        // container that takes full width, allows horizontal scroll
        width: '100%',
        overflowX: 'auto',
        py: 2,

        // (optional) slim scrollbar — will work when OS shows classic scrollbars
        '&::-webkit-scrollbar': { height: '2px !important' },
        '&::-webkit-scrollbar-track': { background: 'transparent' },
        '&::-webkit-scrollbar-thumb': { background: '#BDBDBD', borderRadius: '6px' },
        scrollbarWidth: 'thin',
        scrollbarColor: '#BDBDBD transparent'
      }}
    >
      <Box
        sx={{
          display: 'inline-flex',
          gap: 2, // space between cards
          px: 2
        }}
      >
        {mediaItems.map(item => (
          <Box
            key={item.id}
            sx={{
              width: 240,
              flexShrink: 0
            }}
          >
            <MediaCard media={item} isBorderedCard />
          </Box>
        ))}
      </Box>
    </Box>
  )
}

function InpatientSurgery() {
  const theme = useTheme()
  const router = useRouter()

  const handleAddSurgeryRecord = () => {
    router.push(`/hospital/inpatient/AddSurgeryRecord`)
  }

  const [activeSurgery, setActiveSurgery] = useState(surgeries[0])

  const DetailsHeader = ({ text }) => (
    <Box sx={{ backgroundColor: '#E8F4F299', padding: '8px', borderRadius: '4px' }}>
      <Typography
        sx={{
          fontWeight: 500,
          fontSize: '20px',
          letterSpacing: 0,
          color: theme.palette.customColors.OnPrimaryContainer
        }}
      >
        {text}
      </Typography>
    </Box>
  )

  return (
    <Box sx={{ mt: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },

          // alignItems: { sm: 'center', xs: 'fl' },
          gap: '24px'
        }}
      >
        {/* LEFT: takes remaining space + horizontal scroll */}
        <Box
          sx={{
            flex: '1 1 auto',
            minWidth: 0,
            overflowX: 'auto',
            scrollbarColor: 'transparent transparent'
          }}
        >
          <Box sx={{ display: 'inline-flex', gap: '10px', pr: 1 }}>
            {surgeries.map(surgery => (
              <Box
                key={surgery}
                onClick={() => setActiveSurgery(surgery)}
                sx={{
                  flexShrink: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  px: '16px',
                  height: '48px',
                  borderRadius: '8px',
                  backgroundColor:
                    activeSurgery === surgery ? theme.palette.secondary.dark : theme.palette.customColors.mdAntzNeutral,
                  cursor: 'pointer'
                }}
              >
                <Typography
                  sx={{
                    color:
                      activeSurgery === surgery
                        ? theme.palette.primary.contrastText
                        : theme.palette.customColors.neutralPrimary,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {surgery}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* RIGHT: content-size only */}
        <Button
          onClick={handleAddSurgeryRecord}
          variant='contained'
          sx={{ flex: '0 0 auto', whiteSpace: 'nowrap', height: '48px' }}
        >
          Add SURGERY RECORD
        </Button>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: '24px',
              letterSpacing: 0,
              color: theme.palette.customColors.OnSurfaceVariant
            }}
          >
            Surgery Details
          </Typography>
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: '14px',
              letterSpacing: 0,
              color: theme.palette.customColors.OnPrimaryContainer
            }}
          >
            MED-123456
          </Typography>
          {/* <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <Icon color={theme.palette.primary.dark} icon='mdi:pencil-outline' fontSize={20} />
            <Typography sx={{ fontWeight: 500, fontSize: '16px', letterSpacing: 0, color: theme.palette.primary.dark }}>
              Edit
            </Typography>
          </Box> */}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <DetailsHeader text={'Basic details'} />
          <Grid sx={{ px: '8px' }} container spacing={4}>
            {Object.entries(basicDetails).map(([label, value]) => (
              <Grid item size={{ xs: 6, md: 3 }} key={label}>
                <Tooltip title={label.replace(/([A-Z])/g, ' $1')}>
                  <Typography
                    sx={{
                      mb: '4px',
                      fontWeight: 400,
                      fontSize: '14px',
                      letterSpacing: 0,
                      color: theme.palette.customColors.neutralSecondary,
                      textTransform: 'capitalize',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {label.replace(/([A-Z])/g, ' $1')}
                  </Typography>
                </Tooltip>
                <Tooltip title={value}>
                  <Typography
                    sx={{
                      fontWeight: 400,
                      fontSize: '16px',
                      letterSpacing: 0,
                      color: theme.palette.customColors.OnSurfaceVariant,
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {value}
                  </Typography>
                </Tooltip>
              </Grid>
            ))}
          </Grid>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <DetailsHeader text={'Surgery details'} />
          <Grid sx={{ px: '8px' }} container spacing={4}>
            {Object.entries(surgeryDetails).map(([label, value]) => (
              <Grid item size={{ xs: 12, sm: 6, md: 4 }} key={label}>
                <Tooltip title={label.replace(/([A-Z])/g, ' $1')}>
                  <Typography
                    sx={{
                      mb: '4px',
                      fontWeight: 400,
                      fontSize: '14px',
                      letterSpacing: 0,
                      color: theme.palette.customColors.neutralSecondary,
                      textTransform: 'capitalize',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {label.replace(/([A-Z])/g, ' $1')}
                  </Typography>
                </Tooltip>
                <Tooltip title={value}>
                  <Typography
                    sx={{
                      fontWeight: 400,
                      fontSize: '16px',
                      letterSpacing: 0,
                      color: theme.palette.customColors.OnSurfaceVariant,
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {value}
                  </Typography>
                </Tooltip>
              </Grid>
            ))}

            <Box sx={{ mt: 2 }}>
              <Typography
                sx={{
                  mb: '4px',
                  fontWeight: 400,
                  fontSize: '14px',
                  letterSpacing: 0,
                  color: theme.palette.customColors.neutralSecondary
                }}
              >
                Surgery notes
              </Typography>

              {/* Paragraph */}
              <Tooltip title={surgeryNotes.paragraph}>
                <Typography
                  sx={{
                    fontWeight: 400,
                    fontSize: '16px',
                    letterSpacing: 0,
                    color: theme.palette.customColors.OnSurfaceVariant,
                    mb: 1.5,
                    display: '-webkit-box', // for multiline ellipsis
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    WebkitLineClamp: 5,
                    WebkitBoxOrient: 'vertical'
                  }}
                >
                  {surgeryNotes.paragraph}
                </Typography>
              </Tooltip>

              {/* Findings */}
              <Tooltip title={`Findings: ${surgeryNotes.findings}`}>
                <Typography
                  sx={{
                    fontWeight: 400,
                    fontSize: '16px',
                    letterSpacing: 0,
                    color: theme.palette.customColors.OnSurfaceVariant,
                    mb: 1.5,
                    display: '-webkit-box',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical'
                  }}
                >
                  <strong>Findings:</strong> {surgeryNotes.findings}
                </Typography>
              </Tooltip>

              {/* Procedure performed */}
              <Typography
                sx={{
                  fontWeight: 400,
                  fontSize: '16px',
                  letterSpacing: 0,
                  color: theme.palette.customColors.OnSurfaceVariant,
                  mb: 1
                }}
              >
                Procedure Performed:
              </Typography>
              <Box component='ul' sx={{ ml: '-8px', mt: 0, mb: 1 }}>
                {surgeryNotes.procedurePerformed.map((item, idx) => (
                  <li key={idx}>
                    <Tooltip title={item}>
                      <Typography
                        component='span'
                        sx={{
                          fontWeight: 400,
                          fontSize: '16px',
                          letterSpacing: 0,
                          color: theme.palette.customColors.OnSurfaceVariant,
                          display: '-webkit-box', // for multiline ellipsis
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {item}
                      </Typography>
                    </Tooltip>
                  </li>
                ))}
              </Box>

              {/* Hemostasis */}
              <Typography
                sx={{
                  fontWeight: 400,
                  fontSize: '16px',
                  letterSpacing: 0,
                  color: theme.palette.customColors.OnSurfaceVariant,
                  mb: 0.5
                }}
              >
                <strong>Hemostasis:</strong> {surgeryNotes.hemostasis}
              </Typography>

              {/* Closure */}
              <Typography
                sx={{
                  fontWeight: 400,
                  fontSize: '16px',
                  letterSpacing: 0,
                  color: theme.palette.customColors.OnSurfaceVariant
                }}
              >
                <strong>Closure:</strong> {surgeryNotes.closure}
              </Typography>
            </Box>
            <Box>
              <Typography
                sx={{
                  mb: '4px',
                  fontWeight: 400,
                  fontSize: '14px',
                  letterSpacing: 0,
                  color: theme.palette.customColors.neutralSecondary,
                  textTransform: 'capitalize',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                }}
              >
                Complication
              </Typography>
              <Tooltip title={'None'}>
                <Typography
                  sx={{
                    fontWeight: 400,
                    fontSize: '16px',
                    letterSpacing: 0,
                    color: theme.palette.customColors.OnSurfaceVariant,
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'
                  }}
                >
                  None
                </Typography>
              </Tooltip>
            </Box>
          </Grid>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <DetailsHeader text={'Anaesthesia details '} />
          <Box
            sx={{
              px: '8px',
              height: '50px',
              display: 'flex',
              flexWrap: 'wrap',
              columnGap: '24px',
              rowGap: '8px',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Tooltip title={'Anaesthesia Id'}>
                <Typography
                  sx={{
                    fontWeight: 400,
                    fontSize: '14px',
                    letterSpacing: 0,
                    color: theme.palette.customColors.neutralSecondary,
                    textTransform: 'capitalize',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Anaesthesia Id
                </Typography>
              </Tooltip>
              <Tooltip title={'AN123456 | 24 Jun 2024'}>
                <Typography
                  sx={{
                    fontWeight: 400,
                    fontSize: '16px',
                    letterSpacing: 0,
                    color: theme.palette.customColors.OnSurfaceVariant,
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'
                  }}
                >
                  AN12466 | 24 Jun 2024
                </Typography>
              </Tooltip>
            </Box>
            <Typography
              sx={{
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '16px',
                letterSpacing: 0,
                color: theme.palette.primary.dark
              }}
            >
              View details
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <DetailsHeader text={'Care instructions'} />
          <Box sx={{ px: '8px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {Object.entries(careInstructions).map(([label, value]) => (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }} key={label}>
                <Tooltip title={label.replace(/([A-Z])/g, ' $1')}>
                  <Typography
                    sx={{
                      mb: '4px',
                      fontWeight: 400,
                      fontSize: '14px',
                      letterSpacing: 0,
                      color: theme.palette.customColors.neutralSecondary,
                      textTransform: 'capitalize',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {label.replace(/([A-Z])/g, ' $1')}
                  </Typography>
                </Tooltip>
                <Tooltip title={value}>
                  <Typography
                    sx={{
                      fontWeight: 400,
                      fontSize: '16px',
                      letterSpacing: 0,
                      color: theme.palette.customColors.OnSurfaceVariant,
                      textTransform: 'capitalize',
                      display: '-webkit-box', // for multiline ellipsis
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      WebkitLineClamp: 3, // max 3 lines
                      WebkitBoxOrient: 'vertical'
                    }}
                  >
                    {value}
                  </Typography>
                </Tooltip>
              </Box>
            ))}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <DetailsHeader text={'ATTACHMENTS'} />
          <MediaScroller />
        </Box>
      </Box>
    </Box>
  )
}

export default InpatientSurgery
