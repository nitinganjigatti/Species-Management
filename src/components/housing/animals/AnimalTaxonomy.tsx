import React from 'react'
import { Box, Typography, CircularProgress } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useQuery } from '@tanstack/react-query'
import useSafeRouter from 'src/hooks/useSafeRouter'
import { getTaxonomyHierarchy, TaxonomyHierarchyData } from 'src/lib/api/housing'
import { useTranslation } from 'react-i18next'

interface AnimalTaxonomyProps {
  animalDetails?: {
    taxonomyId?: string
  }
}

// Single taxonomy card with integrated trapezoid background
const TaxonomyCard: React.FC<{
  title: string
  name?: string
  commonName?: string
  cardBg: string
  pyramidBg: string
  levelIndex: number
  totalLevels: number
  isLast?: boolean
}> = ({ title, name, commonName, cardBg, pyramidBg, levelIndex, totalLevels, isLast = false }) => {
  const theme = useTheme()
  const mainText = commonName || name || '-'
  const secondaryText = name

  // Calculate trapezoid widths: narrow at top (level 0), wide at bottom
  const topWidthPct = (levelIndex / totalLevels) * 100
  const bottomWidthPct = ((levelIndex + 1) / totalLevels) * 100
  // clip-path: top-left, top-right, bottom-right, bottom-left
  const clipPath = `polygon(${(100 - topWidthPct) / 2}% 0%, ${(100 + topWidthPct) / 2}% 0%, ${
    (100 + bottomWidthPct) / 2
  }% 100%, ${(100 - bottomWidthPct) / 2}% 100%)`

  return (
    <>
      <Box sx={{ position: 'relative' }}>
        {/* Trapezoid background shape */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundColor: pyramidBg,
            clipPath
          }}
        />
        {/* Card content */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            mx: 'auto',
            width: '100%',
            backgroundColor: cardBg,
            borderRadius: '10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 2.5,
            px: 2
          }}
        >
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 400,
              color: theme.palette.text.secondary,
              textAlign: 'center',
              mb: 0.5
            }}
          >
            {title}
          </Typography>
          <Typography
            sx={{
              fontSize: '22px',
              fontWeight: 600,
              color: theme.palette.text.primary,
              textAlign: 'center',
              mb: 0.5
            }}
          >
            {mainText}
          </Typography>
          <Typography
            sx={{
              fontSize: '15px',
              fontWeight: 400,
              fontStyle: 'italic',
              color: theme.palette.text.secondary,
              textAlign: 'center'
            }}
          >
            {secondaryText || 'NA'}
          </Typography>
        </Box>
      </Box>
      {/* White spacer between cards */}
      {!isLast && <Box sx={{ height: 12, backgroundColor: '#FFFFFF' }} />}
    </>
  )
}

const AnimalTaxonomy: React.FC<AnimalTaxonomyProps> = ({ animalDetails }) => {
  const theme = useTheme()
  const router = useSafeRouter()
  const { id } = router.query
  const { t } = useTranslation()

  const taxonomyId = animalDetails?.taxonomyId

  const { data, isLoading, error } = useQuery({
    queryKey: ['taxonomy-hierarchy', taxonomyId],
    queryFn: () => getTaxonomyHierarchy({ species_id: taxonomyId as string }),
    enabled: !!taxonomyId
  })

  const taxonomyData: TaxonomyHierarchyData | undefined = data?.data

  // Taxonomy levels with colors matching mobile theme
  // Card bg uses opacityColor(color, opacity) — we approximate with rgba
  // Pyramid bg uses separate opacity values
  const levels = [
    {
      key: 'class',
      title: t('animals_module.class'),
      cardBg: 'rgba(255, 235, 153, 0.40)',
      pyramidBg: 'rgba(255, 235, 153, 0.50)'
    },
    {
      key: 'order',
      title: t('animals_module.order'),
      cardBg: 'rgba(144, 202, 249, 0.15)',
      pyramidBg: 'rgba(144, 202, 249, 0.08)'
    },
    {
      key: 'famely',
      title: t('animals_module.family'),
      cardBg: 'rgba(76, 175, 80, 0.12)',
      pyramidBg: 'rgba(76, 175, 80, 0.10)'
    },
    {
      key: 'genus',
      title: t('animals_module.genus'),
      cardBg: 'rgba(255, 183, 157, 0.25)',
      pyramidBg: 'rgba(255, 183, 157, 0.15)'
    },
    {
      key: 'species',
      title: t('species'),
      isSpecies: true,
      cardBg: 'rgba(255, 138, 128, 0.20)',
      pyramidBg: 'rgba(255, 138, 128, 0.25)'
    }
  ]

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography color='error'>{t('animals_module.failed_to_load_taxonomy_data')}</Typography>
      </Box>
    )
  }

  if (!taxonomyId) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography color='text.secondary'>{t('animals_module.no_taxonomy_information_available')}</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ py: 4, px: { xs: 1, sm: 2 } }}>
      <Box sx={{ maxWidth: 650, mx: 'auto' }}>
        <Box>
          {levels.map((level, idx) => {
            let name: string | undefined
            let commonName: string | undefined

            if (level.isSpecies) {
              name = taxonomyData?.complete_name || taxonomyData?.species_common_name
              commonName = taxonomyData?.species_common_name
            } else {
              const levelData = taxonomyData?.[level.key as keyof TaxonomyHierarchyData] as
                | { name?: string; default_common_name?: string }
                | undefined
              name = levelData?.name || levelData?.default_common_name
              commonName = levelData?.default_common_name
            }

            return (
              <TaxonomyCard
                key={level.key}
                title={level.title}
                name={name}
                commonName={commonName}
                cardBg={level.cardBg}
                pyramidBg={level.pyramidBg}
                levelIndex={idx}
                totalLevels={levels.length}
                isLast={idx === levels.length - 1}
              />
            )
          })}
        </Box>
      </Box>
    </Box>
  )
}

export default AnimalTaxonomy
