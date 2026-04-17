import React, { FC, memo } from 'react'
import { Box, Card, CardContent, Typography, Grid, alpha, styled } from '@mui/material'
import Utility from 'src/utility'
import FilePreviewCard from 'src/views/utility/NewMediaCard'
import moment, { Moment } from 'moment'
import { useTheme } from '@mui/system'
import { useTranslation } from 'react-i18next'

interface UserProfile {
  name?: string
  user_profile_pic?: string
}

interface NecropsyDocument {
  id?: number
  file?: string
  file_original_name?: string
  file_type?: string
  user_profile?: UserProfile
}

interface NecropsyAttachments {
  documents?: NecropsyDocument[]
}

interface NecropsyOrganPart {
  id?: number
  organ_name?: string
  value?: string
}

interface NecropsyOrgan {
  id?: number
  label?: string
  parts?: NecropsyOrganPart[]
}

interface NecropsyConductedByUser {
  user_name?: string
  name?: string
}

interface NecropsyData {
  is_unsuitable?: string
  reason_for_unsuitable?: string
  caracass_submission_date?: string
  caracass_submission_time?: string
  death_date?: string
  death_time?: string
  place_of_death?: string
  qr_number?: string
  carcass_weight?: string | number
  carcass_weight_unit_name?: string
  carcass_weight_uom?: string
  approximate_weight?: number | string
  age?: number | string
  age_unit?: string
  approximate_dob?: string
  sex?: string
  history_of_illness?: string
  necropsy_organs?: NecropsyOrgan[]
  attachments?: NecropsyAttachments
  suspected_cause_of_death?: string
  opinion?: string
  disposition?: string
  disposal_method?: string
  confirmed_cause_of_death?: string
  biological_test?: string
  necropsy_date?: string
  necropsy_time?: string
  necropsy_conducted_by?: NecropsyConductedByUser[]
  additional_notes?: string
  modified_at?: string
  created_at?: string
}

interface MortalityData {
  discovered_date?: string
}

interface NecropsySummaryContentProps {
  necropsyData?: NecropsyData | null
  mortalityData?: MortalityData | null
}

interface DateObjectInput {
  day?: number
  month?: number
  year?: number
  week?: number
}

const NecropsySummaryContent: FC<NecropsySummaryContentProps> = ({ necropsyData, mortalityData }) => {
  const theme = useTheme()
  const { t } = useTranslation()

  if (!necropsyData) return null

  const isUnsuitable = necropsyData.is_unsuitable === '1'

  const formatDate = (date?: string): string => {
    if (!date) return t('necropsy_module.na')

    return Utility.formatDisplayDate(date)
  }

  const formatTime = (time?: string): string => {
    if (!time) return t('necropsy_module.na')

    if (typeof time === 'string' && time.includes(':')) {
      const today = new Date()
      const [hours, minutes] = time.split(':')
      today.setHours(parseInt(hours), parseInt(minutes), 0)

      return Utility.extractHoursAndMinutes(today)
    }

    return Utility.extractHoursAndMinutes(time)
  }

  const getYMD = (
    startDate: Date | Moment | string,
    endDate: Date | Moment | string
  ): { year: number; month: number; day: number } => {
    const start = moment(startDate).startOf('day')
    const end = moment(endDate).startOf('day')

    let year = end.diff(start, 'years')
    start.add(year, 'years')

    let month = end.diff(start, 'months')
    start.add(month, 'months')

    let day = end.diff(start, 'days')

    return { year, month, day }
  }

  const getDateDifference = (startDate: Date | Moment | string, endDate: Date | Moment | string): string => {
    const { year, month, day } = getYMD(startDate, endDate)

    const parts: string[] = []

    if (year > 0) parts.push(`${year} ${year > 1 ? t('necropsy_module.year_unit_plural') : t('necropsy_module.year_unit')}`)
    if (month > 0) parts.push(`${month} ${month > 1 ? t('necropsy_module.month_unit_plural') : t('necropsy_module.month_unit')}`)
    if (day > 0) parts.push(`${day} ${day > 1 ? t('necropsy_module.day_unit_plural') : t('necropsy_module.day_unit')}`)

    return parts.length > 0 ? parts.join(' ') : '--'
  }

  const getDOBObject = (dateObj: DateObjectInput | null = null): Date | null => {
    const { day, month, year, week } = dateObj || {}
    if (day || month || year || week) {
      const discoveredDate = mortalityData?.discovered_date || necropsyData?.death_date
      if (!discoveredDate) return null

      const endDate = moment(Utility.convertUTCToLocal(discoveredDate))

      let updatedDate = endDate.clone()

      if (year) {
        updatedDate = updatedDate.subtract(year, 'years')
      }
      if (month) {
        updatedDate = updatedDate.subtract(month, 'months')
      }
      if (week) {
        updatedDate = updatedDate.subtract(week, 'weeks')
      }
      if (day) {
        updatedDate = updatedDate.subtract(day, 'days')
      }

      return updatedDate.toDate()
    }

    return null
  }

  const getAgeDisplay = (): string => {
    if (!necropsyData.age) return '--'

    const approx = necropsyData.approximate_dob === '1' ? ` ${t('necropsy_module.approximate')}` : ''
    const ageUnit = necropsyData.age_unit || 'day'

    const dob = getDOBObject({ [ageUnit]: necropsyData.age as number })
    if (!dob) {
      return `${necropsyData.age} ${ageUnit}${approx}`
    }

    const discoveredDate = mortalityData?.discovered_date || necropsyData?.death_date
    if (!discoveredDate) {
      return `${necropsyData.age} ${ageUnit}${approx}`
    }

    const formattedAge = getDateDifference(dob, moment(Utility.convertUTCToLocal(discoveredDate)))

    return `${formattedAge}${approx}`
  }

  const getSexDisplay = (): string => {
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
                  {isUnsuitable ? t('necropsy_module.unsuitable_for_necropsy_label') : t('necropsy_module.suitable_for_necropsy')}
                </Typography>
              </Box>
              {isUnsuitable && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <SubHeaderText>{t('necropsy_module.reason_for_unsuitability')}</SubHeaderText>
                  <ValueText>{necropsyData.reason_for_unsuitable}</ValueText>
                </Box>
              )}
            </Box>
            <Grid container spacing={6}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <SubHeaderText>{t('necropsy_module.carcass_submission_date_and_time')} </SubHeaderText>
                <ValueText>{`${formatDate(necropsyData.caracass_submission_date)}  •  ${formatTime(
                  necropsyData.caracass_submission_time
                )}`}</ValueText>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <SubHeaderText>{t('necropsy_module.date_and_time_of_death')} </SubHeaderText>
                <ValueText>{`${formatDate(necropsyData.death_date)}  •  ${formatTime(
                  necropsyData.death_time
                )}`}</ValueText>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <SubHeaderText>{t('necropsy_module.place_of_death')} </SubHeaderText>
                <ValueText>{necropsyData.place_of_death ? necropsyData.place_of_death : '--'}</ValueText>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 12 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <SubHeaderText>{t('necropsy_module.qr_number')} </SubHeaderText>
                <ValueText>{necropsyData.qr_number ? necropsyData.qr_number : '--'}</ValueText>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <SubHeaderText>{t('necropsy_module.weight')} </SubHeaderText>
                <ValueText
                  sx={{ fontSize: '16px', fontWeight: 500, color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  {Number(necropsyData?.carcass_weight)
                    ? `${Number(necropsyData.carcass_weight)} ${
                        necropsyData.carcass_weight_unit_name || necropsyData.carcass_weight_uom || ''
                      }${necropsyData?.approximate_weight == 1 ? ` ${t('necropsy_module.approx')}` : ''}`
                    : '--'}
                </ValueText>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <SubHeaderText>{t('necropsy_module.age')} </SubHeaderText>
                <ValueText>{getAgeDisplay()}</ValueText>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography
                  sx={{ fontSize: '14px', fontWeight: 400, color: theme.palette.customColors.neutralSecondary }}
                >
                  {t('necropsy_module.confirmed_sex')}{' '}
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
              <HeaderText>{t('necropsy_module.clinical_history')}</HeaderText>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <SubHeaderText>{t('necropsy_module.short_history_of_illness')} </SubHeaderText>
                <ValueText>{necropsyData.history_of_illness}</ValueText>
              </Box>
            </CardContent>
          </Card>
        )}
        {((necropsyData.necropsy_organs?.length ?? 0) > 0 || (necropsyData.attachments?.documents?.length ?? 0) > 0) && (
          <Card sx={{ mt: 6 }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {(necropsyData.necropsy_organs?.length ?? 0) > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <HeaderText>{t('necropsy_module.examination_findings')}</HeaderText>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {necropsyData.necropsy_organs?.map((organ, index) => (
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
                              {part.organ_name && <SubHeaderText>{t('necropsy_module.organ_description', { organName: part.organ_name })}</SubHeaderText>}
                              <Typography
                                sx={{
                                  fontSize: '14px',
                                  fontWeight: 500,
                                  color: theme.palette.customColors.OnSurfaceVariant,
                                  whiteSpace: 'pre-wrap'
                                }}
                              >
                                {part.value || t('necropsy_module.no_description')}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
              {(necropsyData?.attachments?.documents?.length ?? 0) > 0 && (
                <>
                  <HeaderText>{t('necropsy_module.attachments_count', { count: necropsyData.attachments?.documents?.length ?? 0 })}</HeaderText>
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
                    {necropsyData.attachments?.documents?.map((doc, index) => (
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
            <HeaderText>{t('necropsy_module.conclusion')}</HeaderText>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <SubHeaderText>{t('necropsy_module.suspected_cause_of_death')}</SubHeaderText>
                <ValueText>
                  {necropsyData.suspected_cause_of_death ? necropsyData.suspected_cause_of_death : '--'}
                </ValueText>
              </Grid>
              <Grid size={{ xs: 12 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <SubHeaderText>{t('necropsy_module.opinion_cause_of_death')}</SubHeaderText>
                <ValueText>{necropsyData.opinion ? necropsyData.opinion : '--'}</ValueText>
              </Grid>
              <Grid size={{ xs: 12, sm: 12, md: 4 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <SubHeaderText>{t('necropsy_module.disposal_method')}</SubHeaderText>
                <ValueText>
                  {necropsyData.disposition || necropsyData.disposal_method
                    ? necropsyData.disposition || necropsyData.disposal_method
                    : '--'}
                </ValueText>
              </Grid>
              <Grid size={{ xs: 12, sm: 12, md: 8 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <SubHeaderText>{t('necropsy_module.confirmed_cause_of_death')}</SubHeaderText>
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
                  {t('necropsy_module.additional_information')}
                </Typography>
                <Box>
                  <SubHeaderText>{t('necropsy_module.biological_tests_if_any')}</SubHeaderText>
                  <ValueText>{necropsyData?.biological_test}</ValueText>
                </Box>
              </Box>
            )}
            <Grid container spacing={4}>
              <Grid size={{ xs: 12 }}>
                <Typography
                  sx={{ fontSize: '16px', fontWeight: 600, color: theme.palette.customColors.OnSurfaceVariant }}
                >
                  {t('necropsy_module.necropsy_details')}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 12, md: 4 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <SubHeaderText>{t('necropsy_module.necropsy_date_and_time')} </SubHeaderText>
                <ValueText>{`${formatDate(necropsyData.necropsy_date)} • ${formatTime(
                  necropsyData.necropsy_time
                )}`}</ValueText>
              </Grid>
              <Grid size={{ xs: 12, sm: 12, md: 8 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <SubHeaderText>{t('necropsy_module.pathologist')}</SubHeaderText>
                <ValueText>
                  {(necropsyData.necropsy_conducted_by?.length ?? 0) > 0
                    ? necropsyData.necropsy_conducted_by?.map(user => user.user_name || user.name).join(', ')
                    : '--'}
                </ValueText>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        {necropsyData?.additional_notes && (
          <Card sx={{ mt: 6 }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <HeaderText>{t('necropsy_module.additional_notes')}</HeaderText>
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

export default memo(NecropsySummaryContent)
