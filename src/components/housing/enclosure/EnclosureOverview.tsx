import React from 'react'
import { Box, Grid, Typography, Tooltip, CircularProgress } from '@mui/material'
import { useTheme } from '@emotion/react'
import { useRouter } from 'next/router'
import { useQuery } from '@tanstack/react-query'
import ListingHeader from 'src/views/pages/housing/utils/ListingHeader'
import { getEnclosureBasicInfo, EnclosureBasicInfo } from 'src/lib/api/housing'
import NoDataFound from 'src/views/utility/NoDataFound'

interface DetailItem {
  label: string
  value: string | undefined
}

interface EnclosureOverviewProps {
  enclosureId?: string
}

const EnclosureOverview: React.FC<EnclosureOverviewProps> = ({ enclosureId }) => {
  const theme = useTheme() as any
  const router = useRouter()
  const { id } = router.query

  const effectiveId = enclosureId || (id as string)

  const { data, isLoading, error } = useQuery({
    queryKey: ['enclosure-basic-info', effectiveId],
    queryFn: () => getEnclosureBasicInfo({ enclosure_id: Number(effectiveId) }),
    enabled: !!effectiveId
  })

  const basicInfo: EnclosureBasicInfo | undefined = data?.data

  // Left column data - Enclosure Information
  const leftColumn: DetailItem[] = [
    { label: 'Enclosure Name', value: basicInfo?.user_enclosure_name },
    { label: 'Parent Enclosure', value: basicInfo?.parent_enclosure_name },
    { label: 'Section', value: basicInfo?.section_name },
    { label: 'Site', value: basicInfo?.site_name }
  ]

  // Right column data - Enclosure Characteristics
  const rightColumn: DetailItem[] = [
    { label: 'Enclosure Type', value: basicInfo?.enclosure_type },
    { label: 'Sunlight', value: basicInfo?.enclosure_sunlight },
    { label: 'Environment Type', value: basicInfo?.enclosure_environment },
    {
      label: 'Movable',
      value: basicInfo?.enclosure_is_movable === '0' || basicInfo?.enclosure_is_movable === 0 ? 'No' : 'Yes'
    }
  ]

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200, mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error || !basicInfo) {
    return (
      <Box sx={{ py: 8 }}>
        <NoDataFound height={250} width={250} />
      </Box>
    )
  }

  return (
    <Box sx={{ mt: 4 }}>
      <ListingHeader title='Enclosure Details' />

      {/* Enclosure Information Card */}
      <Box
        sx={{
          background: theme.palette.customColors.displaybgPrimary,
          borderRadius: 1,
          p: { xs: 2, sm: 5 },
          mt: 3
        }}
      >
        <Typography
          sx={{
            color: theme.palette.customColors.OnSurfaceVariant,
            fontWeight: 500,
            fontSize: '16px',
            mb: 3
          }}
        >
          Enclosure Information
        </Typography>

        <Grid container rowGap={1} spacing={0} alignItems='stretch'>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                borderRight: { md: `1px solid ${theme.palette.customColors.OutlineVariant}` },
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'stretch',
                justifyContent: 'space-between',
                pl: { xs: 0, sm: 2 },
                py: 1,
                height: '100%',
                gap: { lg: '80px', xs: '40px' },
                pr: { md: 5, xs: 1 },
                mr: { md: 5, xs: 1 }
              }}
            >
              <Box sx={{ minWidth: '120px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {leftColumn.map(item => (
                  <Tooltip title={item?.label || ''} key={item.label}>
                    <Typography
                      sx={{
                        color: theme.palette.customColors.secondaryBg,
                        fontWeight: 400,
                        fontSize: '14px',
                        textWrap: 'nowrap',
                        overflow: 'hidden'
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
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  alignItems: 'start'
                }}
              >
                {leftColumn.map(item => (
                  <Tooltip title={item?.value || ''} key={item.label + '-value'}>
                    <Typography
                      sx={{
                        width: '100%',
                        color: theme.palette.customColors.OnSurfaceVariant,
                        fontWeight: 500,
                        fontSize: '14px',
                        textOverflow: 'ellipsis',
                        textWrap: 'nowrap',
                        overflow: 'hidden'
                      }}
                    >
                      {item?.value || 'NA'}
                    </Typography>
                  </Tooltip>
                ))}
              </Box>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'stretch',
                justifyContent: 'space-between',
                pl: { xs: 0, sm: 2 },
                height: '100%',
                py: 1,
                gap: { lg: '80px', xs: '40px' },
                pr: { md: 5, xs: 2 }
              }}
            >
              <Box sx={{ minWidth: '120px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {rightColumn.map(item => (
                  <Tooltip title={item?.label || ''} key={item.label}>
                    <Typography
                      sx={{
                        color: theme.palette.customColors.secondaryBg,
                        fontWeight: 400,
                        fontSize: '14px',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden'
                      }}
                    >
                      {item?.label || ''}
                    </Typography>
                  </Tooltip>
                ))}
              </Box>
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2
                }}
              >
                {rightColumn.map(item => (
                  <Tooltip title={item?.value || ''} key={item.label + '-value'}>
                    <Typography
                      sx={{
                        color: theme.palette.customColors.OnSurfaceVariant,
                        fontWeight: 500,
                        fontSize: '14px',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden'
                      }}
                    >
                      {item?.value || 'NA'}
                    </Typography>
                  </Tooltip>
                ))}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Description Card - Only show if description exists */}
      {basicInfo?.enclosure_desc && (
        <Box
          sx={{
            background: theme.palette.customColors.displaybgPrimary,
            borderRadius: 1,
            p: { xs: 2, sm: 5 },
            mt: 3
          }}
        >
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontWeight: 500,
              fontSize: '16px',
              mb: 2
            }}
          >
            Description
          </Typography>
          <Typography
            sx={{
              color: theme.palette.customColors.OnSurfaceVariant,
              fontWeight: 400,
              fontSize: '14px',
              lineHeight: 1.6
            }}
          >
            {basicInfo.enclosure_desc}
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default React.memo(EnclosureOverview)
