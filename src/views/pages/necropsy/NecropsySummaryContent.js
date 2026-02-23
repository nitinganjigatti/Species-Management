import React from 'react'
import { Box, Card, CardContent, Typography, Grid, useTheme, alpha, styled } from '@mui/material'
import Utility from 'src/utility'
import FilePreviewCard from 'src/views/utility/NewMediaCard'

const NecropsySummaryContent = ({ necropsyData }) => {
  const theme = useTheme()

  if (!necropsyData) return null

  const isUnsuitable = necropsyData.is_unsuitable === '1'

  const formatDate = date => {
    if (!date) return 'N/A'

    return Utility.formatDisplayDate(date)
  }

  const formatTime = time => {
    if (!time) return 'N/A'

    if (typeof time === 'string' && time.includes(':')) {
      const today = new Date()
      const [hours, minutes] = time.split(':')
      today.setHours(parseInt(hours), parseInt(minutes), 0)

      return Utility.extractHoursAndMinutes(today)
    }

    return Utility.extractHoursAndMinutes(time)
  }

  const getAgeDisplay = () => {
    if (!necropsyData.age) return '--'
    const approx = necropsyData.approximate_dob === '1' ? ' (Approximate)' : ''

    return `${necropsyData.age} ${necropsyData.age_unit || ''}${approx}`
  }

  const getSexDisplay = () => {
    const sex = necropsyData.sex
    if (!sex) return '--'

    return sex.charAt(0).toUpperCase() + sex.slice(1)
  }

  return (
    <>
      <Box>
        <Card sx={{ mt: 6 }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Box
                sx={{
                  px: 6,
                  py: 3,
                  borderRadius: 1,
                  width: 'fit-content',
                  backgroundColor: isUnsuitable
                    ? theme.palette.customColors.Tertiary20
                    : alpha(theme.palette.customColors.PrimaryContainer, 0.16)
                }}
              >
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: isUnsuitable ? theme.palette.customColors.Tertiary : theme.palette.customColors.OnSurface
                  }}
                >
                  {isUnsuitable ? 'Unsuitable for Necropsy' : 'Suitable for Necropsy'}
                </Typography>
              </Box>
              {isUnsuitable && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <SubHeaderText>Reason for Unsuitability</SubHeaderText>
                  <ValueText>{necropsyData.reason_for_unsuitable}</ValueText>
                </Box>
              )}
            </Box>
            <Grid container spacing={6}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <SubHeaderText>Carcass Submission Date and Time </SubHeaderText>
                <ValueText>{`${formatDate(necropsyData.caracass_submission_date)}  •  ${formatTime(
                  necropsyData.caracass_submission_time
                )}`}</ValueText>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <SubHeaderText>Date and Time of Death </SubHeaderText>
                <ValueText>{`${formatDate(necropsyData.death_date)}  •  ${formatTime(
                  necropsyData.death_time
                )}`}</ValueText>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <SubHeaderText>Place of Death </SubHeaderText>
                <ValueText>{necropsyData.place_of_death ? necropsyData.place_of_death : '--'}</ValueText>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 12 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <SubHeaderText>QR Number </SubHeaderText>
                <ValueText>{necropsyData.qr_number ? necropsyData.qr_number : '--'}</ValueText>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <SubHeaderText>Weight </SubHeaderText>
                <ValueText
                  sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  {necropsyData.carcass_weight
                    ? `${necropsyData.carcass_weight} ${
                        necropsyData.carcass_weight_unit_name || necropsyData.carcass_weight_uom || ''
                      }${necropsyData.approximate_weight === '1' ? ' (Approx.)' : ''}`
                    : '--'}
                </ValueText>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <SubHeaderText>Age </SubHeaderText>
                <ValueText>{getAgeDisplay()}</ValueText>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography
                  sx={{ fontSize: '14px', fontWeight: 400, color: theme.palette.customColors.neutralSecondary }}
                >
                  Confirmed Sex{' '}
                </Typography>
                <Typography
                  sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  {getSexDisplay()}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        {necropsyData.history_of_illness && (
          <Card sx={{ mt: 6 }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <HeaderText>Clinical History</HeaderText>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <SubHeaderText>Short History of Illness </SubHeaderText>
                <ValueText>{necropsyData.history_of_illness}</ValueText>
              </Box>
            </CardContent>
          </Card>
        )}
        {(necropsyData.necropsy_organs?.length > 0 || necropsyData.attachments?.documents?.length > 0) && (
          <Card sx={{ mt: 6 }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {necropsyData.necropsy_organs?.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <HeaderText>Examination Findings</HeaderText>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {necropsyData.necropsy_organs.map((organ, index) => (
                      <Box
                        key={organ.id || index}
                        sx={{
                          p: 4,
                          borderRadius: 1,
                          backgroundColor: alpha(theme.palette.customColors.displaybgPrimary, 0.6)
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: '16px',
                            fontWeight: 600,
                            color: theme.palette.customColors.OnSurfaceVariant,
                            mb: 2
                          }}
                        >
                          {organ.label}
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {organ.parts?.map((part, pIndex) => (
                            <Box key={part.id || pIndex} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              {part.organ_name && <SubHeaderText>{`${part.organ_name} Description`}</SubHeaderText>}
                              <Typography
                                sx={{
                                  fontSize: '14px',
                                  fontWeight: 500,
                                  color: theme.palette.customColors.OnSurfaceVariant,
                                  whiteSpace: 'pre-wrap'
                                }}
                              >
                                {part.value || 'No description'}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
              {necropsyData.attachments?.documents?.length > 0 && (
                <>
                  <HeaderText>{`Attachments - ${necropsyData.attachments.documents.length}`}</HeaderText>
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 4,
                      overflowX: 'auto',
                      width: '100%',
                      pb: 2,
                      '&::-webkit-scrollbar': {
                        height: 6
                      },
                      '&::-webkit-scrollbar-thumb': {
                        backgroundColor: theme.palette.divider,
                        borderRadius: 3
                      }
                    }}
                  >
                    {necropsyData.attachments.documents.map((doc, index) => (
                      <Box key={doc.id || index} sx={{ flexShrink: 0 }}>
                        <FilePreviewCard
                          fileUrl={doc.file}
                          fileName={doc.file_original_name}
                          fileType={doc.file_type}
                          user={{
                            created_at: necropsyData.modified_at || necropsyData.created_at,
                            user_profile: {
                              user_full_name: doc.user_profile?.name,
                              user_profile_pic: doc.user_profile?.user_profile_pic
                            }
                          }}
                          width='220px'
                          height='220px'
                          showTitle
                        />
                      </Box>
                    ))}
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        )}

        <Card sx={{ mt: 6 }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <HeaderText>Conclusion</HeaderText>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <SubHeaderText>Suspected Cause of Death</SubHeaderText>
                <ValueText>
                  {necropsyData.suspected_cause_of_death ? necropsyData.suspected_cause_of_death : '--'}
                </ValueText>
              </Grid>
              <Grid size={{ xs: 12 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <SubHeaderText>{`Opinion (Cause Of Death)`}</SubHeaderText>
                <ValueText>{necropsyData.opinion ? necropsyData.opinion : '--'}</ValueText>
              </Grid>
              <Grid size={{ xs: 12, sm: 12, md: 4 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <SubHeaderText>Dispposal Method</SubHeaderText>
                <ValueText>
                  {necropsyData.disposition || necropsyData.disposal_method
                    ? necropsyData.disposition || necropsyData.disposal_method
                    : '--'}
                </ValueText>
              </Grid>
              <Grid size={{ xs: 12, sm: 12, md: 8 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <SubHeaderText>Confirmed Cause of Death</SubHeaderText>
                <ValueText>
                  {necropsyData.confirmed_cause_of_death ? necropsyData.confirmed_cause_of_death : '--'}
                </ValueText>
              </Grid>
            </Grid>
            {necropsyData?.biological_test && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Typography
                  sx={{ fontSize: '16px', fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  Additional Information
                </Typography>
                <Box>
                  <SubHeaderText>{`Biological Tests ( if any)`}</SubHeaderText>
                  <ValueText>{necropsyData?.biological_test}</ValueText>
                </Box>
              </Box>
            )}
            <Grid container spacing={4}>
              <Grid size={{ xs: 12 }}>
                <Typography
                  sx={{ fontSize: '16px', fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  Necropsy Details
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 12, md: 4 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <SubHeaderText>Necropsy Date and Time </SubHeaderText>
                <ValueText>{`${formatDate(necropsyData.necropsy_date)} • ${formatTime(
                  necropsyData.necropsy_time
                )}`}</ValueText>
              </Grid>
              <Grid size={{ xs: 12, sm: 12, md: 8 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <SubHeaderText>Pathologist</SubHeaderText>
                <ValueText>
                  {necropsyData.necropsy_conducted_by?.length > 0
                    ? necropsyData.necropsy_conducted_by.map(user => user.user_name || user.name).join(', ')
                    : '--'}
                </ValueText>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        {necropsyData?.additional_notes && (
          <Card sx={{ mt: 6 }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <HeaderText>Additional notes</HeaderText>
              <Box sx={{ p: 4, backgroundColor: theme.palette.customColors.antzNotes, borderRadius: 1 }}>
                <ValueText>{necropsyData.additional_notes}</ValueText>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    </>
  )
}

const HeaderText = styled(Typography)(({ theme }) => ({
  fontSize: '20px',
  fontWeight: 500,
  color: theme.palette.customColors.OnSurfaceVariant
}))

const SubHeaderText = styled(Typography)(({ theme }) => ({
  fontSize: '14px',
  fontWeight: 400,
  color: theme.palette.customColors.neutralSecondary
}))

const ValueText = styled(Typography)(({ theme }) => ({
  fontSize: '16px',
  fontWeight: 500,
  color: theme.palette.customColors.OnSurfaceVariant
}))

export default NecropsySummaryContent
