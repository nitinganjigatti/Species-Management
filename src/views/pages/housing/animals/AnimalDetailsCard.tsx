import React from 'react'
import { useTheme } from '@emotion/react'
import { Box, Grid, Divider, Typography, useMediaQuery, Tooltip } from '@mui/material'

interface AnimalData {
  aid?: string
  accessionDate?: string
  birthDate?: string
  type?: string
  age?: string
  contraceptionStatus?: string
  sexingType?: string
  institutes_label?: string
  collectionType?: string
  organisation?: string
  ownershipTerm?: string
  localIdentifier?: string
  microChip?: string
  identifierName?: string
}

interface AnimalDetailsCardProps {
  data: AnimalData | null
}

interface DetailItem {
  label: string
  value: string | undefined
}

const AnimalDetailsCard: React.FC<AnimalDetailsCardProps> = ({ data }) => {
  const theme = useTheme() as any
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const left: DetailItem[] = [
    { label: 'Animal ID', value: data?.aid },
    { label: 'Accession Date', value: data?.accessionDate },
    { label: 'Birth Date', value: data?.birthDate },
    { label: 'Age', value: data?.type === 'group' ? 'NA' : data?.age },
    { label: 'Contraception Status', value: data?.contraceptionStatus },
    { label: 'Sexing Type', value: data?.sexingType },
    { label: 'Institution', value: data?.institutes_label }
  ]

  const right: DetailItem[] = [
    { label: 'Collection Type', value: data?.collectionType },
    { label: 'Organisation', value: data?.organisation },
    { label: 'Ownership Term', value: data?.ownershipTerm },
    { label: 'Local Identifier', value: data?.localIdentifier },
    { label: 'Micro Chip', value: data?.microChip },
    { label: 'Identifier Name', value: data?.identifierName }
  ]

  return (
    <Box
      sx={{
        background: theme.palette.customColors.displaybgPrimary,
        borderRadius: 1,
        p: { xs: 2, sm: 5 },
        mt: 3
      }}
    >
      <Grid container rowGap={1} spacing={0} alignItems='stretch'>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box
            sx={{
              borderRight: { md: `1px solid ${theme.palette.customColors.OutlineVariant}` },
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              justifyContent: 'space-between',
              pl: { xs: 0, sm: 4 },
              py: 1,
              height: '100%',
              gap: { lg: '110px', xs: '50px' },
              pr: { md: 5, xs: 1 },
              mr: { md: 5, xs: 1 }
            }}
          >
            <Box sx={{ width: '143px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {left.map(item => (
                <Tooltip title={item?.label || ''} key={item.label}>
                  <Typography
                    sx={{
                      color: theme.palette.customColors.secondaryBg,
                      fontWeight: 400,
                      fontSize: '14px',

                      // textOverflow: 'ellipsis',
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
                width: { lg: 'calc(100% - 250px)', md: 'calc(100% - 187px)', xs: 'calc(100% - 187px)' },
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                alignItems: 'start'
              }}
            >
              {left.map(item => (
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
        {/*
          {!isMobile && (
            <Divider
              flexItem
              orientation='vertical'
              sx={{ mx: 0, borderColor: theme.palette.customColors.OutlineVariant }}
            />
          )} */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              justifyContent: 'space-between',
              pl: { xs: 0, sm: 4 },
              height: '100%',
              py: 1,
              gap: { lg: '110px', xs: '50px' },
              pr: { md: 10, xs: 2 }
            }}
          >
            <Box sx={{ width: '143px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {right.map(item => (
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
                width: { lg: 'calc(100% - 220px)', md: 'calc(100% - 170px)', xs: 'calc(100% - 190px)' },
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}
            >
              {right.map(item => (
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
  )
}

export default AnimalDetailsCard
