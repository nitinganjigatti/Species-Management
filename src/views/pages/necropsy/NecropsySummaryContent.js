import React from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Divider,
  Chip,
  Avatar,
  Tooltip,
  useTheme
} from '@mui/material'
import Utility from 'src/utility'

const NecropsySummaryContent = ({ necropsyData, mortalityData, actionButtons }) => {
  const theme = useTheme()

  if (!necropsyData) return null

  const isUnsuitable = necropsyData.is_unsuitable === '1' || necropsyData.is_unsuitable === 1

  const labelColor = theme.palette.customColors?.secondaryBg || theme.palette.text.secondary
  const valueColor = theme.palette.customColors?.OnSurfaceVariant || theme.palette.text.primary
  const borderColor = theme.palette.customColors?.OutlineVariant || theme.palette.divider

  const sectionTitleSx = {
    fontSize: '16px',
    fontWeight: 600,
    color: valueColor,
    mb: 3
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'

    return Utility.formatDisplayDate(date)
  }

  const formatTime = (time) => {
    if (!time) return 'N/A'
    // If time is already in HH:mm:ss format, parse it
    if (typeof time === 'string' && time.includes(':')) {
      const today = new Date()
      const [hours, minutes] = time.split(':')
      today.setHours(parseInt(hours), parseInt(minutes), 0)

      return Utility.extractHoursAndMinutes(today)
    }

    return Utility.extractHoursAndMinutes(time)
  }

  const getAgeDisplay = () => {
    if (!necropsyData.age) return 'N/A'
    const approx = necropsyData.approximate_dob ? ' (Approximate)' : ''

    return `${necropsyData.age} ${necropsyData.age_unit || ''}${approx}`
  }

  const getSexDisplay = () => {
    const sex = necropsyData.sex
    if (!sex) return 'N/A'

    return sex.charAt(0).toUpperCase() + sex.slice(1)
  }

  const AlignedFields = ({ items }) => {
    const mid = Math.ceil(items.length / 2)
    const left = items.slice(0, mid)
    const right = items.slice(mid)

    const renderHalf = (fields, showBorder) => (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'stretch',
          borderRight: showBorder ? { md: `1px solid ${borderColor}` } : 'none',
          pr: showBorder ? { md: 5, xs: 1 } : { md: 10, xs: 2 },
          mr: showBorder ? { md: 5, xs: 1 } : 0,
          pl: { xs: 0, sm: 4 },
          py: 1,
          height: '100%',
          gap: { lg: '60px', xs: '30px' }
        }}
      >
        <Box sx={{ width: '180px', minWidth: '180px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {fields.map((item, index) => (
            <Tooltip key={index} title={item.label || ''}>
              <Typography
                sx={{
                  color: labelColor,
                  fontWeight: 400,
                  fontSize: '14px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {item.label}
              </Typography>
            </Tooltip>
          ))}
        </Box>
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            alignItems: 'start'
          }}
        >
          {fields.map((item, index) => (
            <Tooltip key={index} title={item.value || 'N/A'}>
              <Typography
                sx={{
                  width: '100%',
                  color: valueColor,
                  fontWeight: 500,
                  fontSize: '14px',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden'
                }}
              >
                {item.value || 'N/A'}
              </Typography>
            </Tooltip>
          ))}
        </Box>
      </Box>
    )

    return (
      <Grid container rowGap={1} spacing={0} alignItems='stretch'>
        <Grid item size={{ xs: 12, md: 6 }}>
          {renderHalf(left, true)}
        </Grid>
        {right.length > 0 && (
          <Grid item size={{ xs: 12, md: 6 }}>
            {renderHalf(right, false)}
          </Grid>
        )}
      </Grid>
    )
  }

  return (
    <Card>
      <CardContent sx={{ p: { xs: 3, sm: 6 }, '&:last-child': { pb: { xs: 3, sm: 6 } } }}>
        {/* Necropsy Suitability + Action Buttons */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography sx={sectionTitleSx}>Necropsy Suitability</Typography>
            <Chip
              label={isUnsuitable ? 'Unsuitable for Necropsy' : 'Suitable for Necropsy'}
              color={isUnsuitable ? 'error' : 'success'}
              variant='outlined'
              sx={{ fontWeight: 600 }}
            />
          </Box>
          {actionButtons}
        </Box>
        {isUnsuitable && necropsyData.reason_for_unsuitable && (
          <Box sx={{ mt: 2, pl: { xs: 0, sm: 4 } }}>
            <Typography sx={{ color: labelColor, fontWeight: 400, fontSize: '14px' }}>Reason</Typography>
            <Typography sx={{ color: valueColor, fontWeight: 500, fontSize: '14px', mt: 0.5, whiteSpace: 'pre-wrap' }}>
              {necropsyData.reason_for_unsuitable}
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 5 }} />

        {/* Carcass Details */}
        <Typography sx={sectionTitleSx}>Carcass Details</Typography>
        <AlignedFields
          items={[
            { label: 'Submission Date', value: formatDate(necropsyData.caracass_submission_date) },
            { label: 'Submission Time', value: formatTime(necropsyData.caracass_submission_time) },
            { label: 'Date of Death', value: formatDate(necropsyData.death_date) },
            { label: 'Time of Death', value: formatTime(necropsyData.death_time) },
            { label: 'Place of Death', value: necropsyData.place_of_death },
            {
              label: 'Carcass Weight',
              value: necropsyData.carcass_weight
                ? `${necropsyData.carcass_weight} ${necropsyData.carcass_weight_unit_name || necropsyData.carcass_weight_uom || ''}${necropsyData.approximate_weight ? ' (Approx.)' : ''}`
                : null
            },
            { label: 'Confirmed Sex', value: getSexDisplay() },
            { label: 'Age', value: getAgeDisplay() }
          ]}
        />

        {/* Clinical History */}
        {necropsyData.history_of_illness && (
          <>
            <Divider sx={{ my: 5 }} />
            <Typography sx={sectionTitleSx}>Clinical History</Typography>
            <Box
              sx={{
                p: 3,
                borderRadius: 1,
                bgcolor: theme.palette.customColors?.displaybgPrimary || theme.palette.grey[50]
              }}
            >
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 400,
                  color: valueColor,
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6
                }}
              >
                {necropsyData.history_of_illness}
              </Typography>
            </Box>
          </>
        )}

        <Divider sx={{ my: 5 }} />

        {/* Necropsy Details */}
        <Typography sx={sectionTitleSx}>Necropsy Details</Typography>
        <Grid container spacing={0} alignItems='stretch'>
          <Grid item size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                borderRight: { md: `1px solid ${borderColor}` },
                pr: { md: 5, xs: 1 },
                pl: { xs: 0, sm: 4 },
                py: 1,
                gap: { lg: '60px', xs: '30px' }
              }}
            >
              <Typography
                sx={{
                  width: '180px',
                  minWidth: '180px',
                  color: labelColor,
                  fontWeight: 400,
                  fontSize: '14px'
                }}
              >
                Necropsy Date
              </Typography>
              <Typography
                sx={{
                  color: valueColor,
                  fontWeight: 500,
                  fontSize: '14px'
                }}
              >
                {formatDate(necropsyData.necropsy_date)}
              </Typography>
            </Box>
          </Grid>
          <Grid item size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                pl: { xs: 0, sm: 4, md: 5 },
                py: 1,
                gap: { lg: '60px', xs: '30px' }
              }}
            >
              <Typography
                sx={{
                  width: '180px',
                  minWidth: '180px',
                  color: labelColor,
                  fontWeight: 400,
                  fontSize: '14px'
                }}
              >
                Necropsy Time
              </Typography>
              <Typography
                sx={{
                  color: valueColor,
                  fontWeight: 500,
                  fontSize: '14px'
                }}
              >
                {formatTime(necropsyData.necropsy_time)}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {necropsyData.general_description && (
          <Box sx={{ mt: 3 }}>
            <Typography sx={{ color: labelColor, fontWeight: 400, fontSize: '14px', pl: { xs: 0, sm: 4 }, mb: 1 }}>
              General Description
            </Typography>
            <Box
              sx={{
                p: 3,
                borderRadius: 1,
                bgcolor: theme.palette.customColors?.displaybgPrimary || theme.palette.grey[50]
              }}
            >
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 400,
                  color: valueColor,
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6
                }}
              >
                {necropsyData.general_description}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Conducted By */}
        {necropsyData.necropsy_conducted_by?.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography sx={{ color: labelColor, fontWeight: 400, fontSize: '14px', pl: { xs: 0, sm: 4 }, mb: 1.5 }}>
              Necropsy Conducted By
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, pl: { xs: 0, sm: 4 } }}>
              {necropsyData.necropsy_conducted_by.map((user, index) => (
                <Chip
                  key={user.user_id || index}
                  avatar={<Avatar src={user.user_profile_pic}>{(user.user_name || user.name)?.charAt(0)}</Avatar>}
                  label={
                    <Box>
                      <Typography sx={{ fontWeight: 500, fontSize: '13px', color: valueColor }}>
                        {user.user_name || user.name}
                      </Typography>
                      {(user.role_name || user.role) && (
                        <Typography sx={{ fontSize: '11px', color: labelColor }}>
                          {user.role_name || user.role}
                        </Typography>
                      )}
                    </Box>
                  }
                  variant='outlined'
                  sx={{
                    height: 'auto',
                    py: 0.5,
                    '& .MuiChip-label': { display: 'flex', flexDirection: 'column' }
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Examination Findings */}
        {necropsyData.necropsy_organs?.length > 0 && (
          <>
            <Divider sx={{ my: 5 }} />
            <Typography sx={sectionTitleSx}>Examination Findings</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {necropsyData.necropsy_organs.map((organ, index) => (
                <Box
                  key={organ.id || index}
                  sx={{
                    p: 3,
                    borderRadius: 1,
                    bgcolor: theme.palette.customColors?.displaybgPrimary || theme.palette.grey[50]
                  }}
                >
                  <Typography sx={{ fontSize: '14px', fontWeight: 600, color: valueColor, mb: 1 }}>
                    {organ.label}
                  </Typography>
                  {organ.parts?.map((part, pIndex) => (
                    <Box key={part.id || pIndex} sx={{ ml: 2, mb: 1 }}>
                      {part.organ_name && (
                        <Typography sx={{ color: labelColor, fontWeight: 400, fontSize: '14px', mb: 0.5 }}>
                          {part.organ_name}
                        </Typography>
                      )}
                      <Typography sx={{ fontSize: '14px', fontWeight: 400, color: valueColor, whiteSpace: 'pre-wrap' }}>
                        {part.value || 'No description'}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ))}
            </Box>
          </>
        )}

        {/* Attachments */}
        {necropsyData.attachments?.documents?.length > 0 && (
          <>
            <Divider sx={{ my: 5 }} />
            <Typography sx={sectionTitleSx}>Attachments</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {necropsyData.attachments.documents.map((doc, index) => {
                const isImage = ['jpeg', 'jpg', 'png', 'gif', 'webp', 'svg'].some(ext =>
                  doc.file?.toLowerCase()?.endsWith(ext) || doc.file_original_name?.toLowerCase()?.endsWith(ext)
                )

                return (
                  <Box
                    key={doc.id || index}
                    sx={{
                      width: 100,
                      height: 100,
                      borderRadius: 1,
                      overflow: 'hidden',
                      border: `1px solid ${theme.palette.divider}`,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: theme.palette.customColors?.displaybgPrimary || theme.palette.grey[50]
                    }}
                    onClick={() => doc.file && window.open(doc.file, '_blank')}
                  >
                    {isImage ? (
                      <img
                        src={doc.file}
                        alt={doc.file_original_name || 'attachment'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <Box sx={{ textAlign: 'center', p: 1 }}>
                        <Typography sx={{ fontSize: '10px', wordBreak: 'break-all', color: valueColor }}>
                          {doc.file_original_name || doc.file_type || 'File'}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )
              })}
            </Box>
          </>
        )}

        <Divider sx={{ my: 5 }} />

        {/* Cause of Death */}
        <Typography sx={sectionTitleSx}>Cause of Death</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pl: { xs: 0, sm: 4 } }}>
          {[
            { label: 'Suspected Cause of Death', value: necropsyData.suspected_cause_of_death },
            { label: 'Confirmed Cause of Death', value: necropsyData.confirmed_cause_of_death },
            { label: 'Disposal Method', value: necropsyData.disposition || necropsyData.disposal_method },
            { label: 'Opinion', value: necropsyData.opinion }
          ].map((item, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: { xs: 2, sm: 4 }
              }}
            >
              <Typography
                sx={{
                  width: '200px',
                  minWidth: '200px',
                  color: labelColor,
                  fontWeight: 400,
                  fontSize: '14px'
                }}
              >
                {item.label}
              </Typography>
              <Typography
                sx={{
                  flex: 1,
                  color: valueColor,
                  fontWeight: 500,
                  fontSize: '14px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {item.value || 'N/A'}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Additional Information */}
        {(necropsyData.additional_notes || necropsyData.qr_number) && (
          <>
            <Divider sx={{ my: 5 }} />
            <Typography sx={sectionTitleSx}>Additional Information</Typography>
            {necropsyData.qr_number && (
              <AlignedFields items={[{ label: 'QR Number', value: necropsyData.qr_number }]} />
            )}
            {necropsyData.additional_notes && (
              <Box sx={{ mt: necropsyData.qr_number ? 3 : 0 }}>
                <Typography sx={{ color: labelColor, fontWeight: 400, fontSize: '14px', pl: { xs: 0, sm: 4 }, mb: 1 }}>
                  Additional Notes
                </Typography>
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 1,
                    bgcolor: theme.palette.customColors?.displaybgPrimary || theme.palette.grey[50]
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '14px',
                      fontWeight: 400,
                      color: valueColor,
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.6
                    }}
                  >
                    {necropsyData.additional_notes}
                  </Typography>
                </Box>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default NecropsySummaryContent
