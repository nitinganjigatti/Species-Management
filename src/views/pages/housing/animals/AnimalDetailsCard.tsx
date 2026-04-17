import React from 'react'
import { useTheme } from '@emotion/react'
import { Box, Grid, Divider, Typography, useMediaQuery, Tooltip } from '@mui/material'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()
  const theme = useTheme() as any
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const left: DetailItem[] = [
    { label: t('housing_module.animal_id') as string, value: data?.aid },
    { label: t('housing_module.accession_date') as string, value: data?.accessionDate },
    { label: t('housing_module.birth_date') as string, value: data?.birthDate },
    { label: t('housing_module.age') as string, value: data?.type === 'group' ? t('na') as string : data?.age },
    { label: t('housing_module.contraception_status') as string, value: data?.contraceptionStatus },
    { label: t('housing_module.sexing_type') as string, value: data?.sexingType },
    { label: t('housing_module.institution') as string, value: data?.institutes_label }
  ]

  const right: DetailItem[] = [
    { label: t('housing_module.collection_type') as string, value: data?.collectionType },
    { label: t('housing_module.organisation') as string, value: data?.organisation },
    { label: t('housing_module.ownership_term') as string, value: data?.ownershipTerm },
    { label: t('housing_module.local_identifier') as string, value: data?.localIdentifier },
    { label: t('housing_module.micro_chip') as string, value: data?.microChip },
    { label: t('housing_module.identifier_name') as string, value: data?.identifierName }
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
                    {item?.value || t('na')}
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
                    {item?.value || t('na')}
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
