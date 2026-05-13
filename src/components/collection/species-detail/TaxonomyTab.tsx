import React, { useMemo } from 'react'
import { Box, Card, CircularProgress, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getSpeciesTaxonomyHierarchy, SpeciesTaxonomyHierarchyItem } from 'src/lib/api/collection/species'

interface TaxonomyTabProps {
  speciesId?: string
}

const RANK_ORDER = ['Class', 'Order', 'Family', 'Genus', 'Species']

const TaxonomyTab: React.FC<TaxonomyTabProps> = ({ speciesId }) => {
  const { t } = useTranslation()
  const theme = useTheme() as any

  // Rank labels are translated; backend still keys by English rank_name ('Class', 'Order', ...)
  // so we map: backend key → translated display string.
  const rankLabels: Record<string, string> = useMemo(
    () => ({
      Class: t('species_module.col_class'),
      Order: t('species_module.col_order'),
      Family: t('species_module.col_family'),
      Genus: t('species_module.col_genus'),
      Species: t('species_module.col_species')
    }),
    [t]
  )

  const rankMeta = useMemo<Record<string, { icon: string; color: string }>>(
    () => ({
      Class: { icon: '/images/collection/dna.svg', color: theme.palette.customColors.addPrimary },
      Order: { icon: '/images/collection/bone.svg', color: theme.palette.customColors.Secondary },
      Family: { icon: '/images/collection/leaf.svg', color: theme.palette.primary.main },
      Genus: { icon: '/images/collection/leaf_flower.svg', color: theme.palette.primary.dark },
      Species: { icon: '/images/collection/microscope.svg', color: theme.palette.customColors.Tertiary }
    }),
    [theme]
  )

  const { data: hierarchyResponse, isLoading } = useQuery({
    queryKey: ['species-taxonomy-hierarchy', speciesId],
    queryFn: () => getSpeciesTaxonomyHierarchy({ species_id: speciesId as string }),
    enabled: Boolean(speciesId)
  })

  const taxonomyLevels = useMemo(() => {
    const items = hierarchyResponse?.data || []
    const byRank: Record<string, SpeciesTaxonomyHierarchyItem> = {}
    items.forEach(item => {
      if (item?.rank_name) byRank[item.rank_name] = item
    })

    return RANK_ORDER.filter(rank => byRank[rank]).map(rank => {
      const item = byRank[rank]
      const meta = rankMeta[rank] || { icon: 'mdi:dots-horizontal', color: theme.palette.customColors.Outline }

      return {
        level: rankLabels[rank] || rank.toUpperCase(),
        name: item.complete_name || '-',
        scientific: item.common_name || item.complete_name || '-',
        icon: meta.icon,
        color: meta.color
      }
    })
  }, [hierarchyResponse, rankMeta, theme, rankLabels])

  return (
    <Box>
      <Typography variant='h6' sx={{ fontWeight: 600, mb: 6, color: theme.palette.customColors.OnSurfaceVariant }}>
        {t('species_module.species_taxonomy_title')}
      </Typography>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress size={28} />
        </Box>
      ) : taxonomyLevels.length === 0 ? (
        <Typography sx={{ textAlign: 'center', py: 10, color: theme.palette.customColors.neutralSecondary }}>
          {t('species_module.no_taxonomy_data')}
        </Typography>
      ) : (
        <Box
          sx={{
            display: 'flex',
            alignItems: { xs: 'center', md: 'flex-start' },
            justifyContent: 'center',
            gap: { xs: 4, md: 0 },
            overflowX: { xs: 'visible', md: 'auto' },
            pb: 4,
            flexWrap: { xs: 'wrap', md: 'nowrap' },
            flexDirection: { xs: 'column', sm: 'row' }
          }}
        >
          {taxonomyLevels.map((item, idx, arr) => (
            <React.Fragment key={`${item.level}-${idx}`}>
              <Box sx={{ position: 'relative', minWidth: 180 }}>
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: 1,
                    backgroundColor: item.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 2
                  }}
                >
                  <img
                    src={item.icon}
                    alt={item.level}
                    style={{ width: 26, height: 26, filter: 'brightness(0) invert(1)' }}
                  />
                </Box>
                <Card
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%',
                    mt: '26px',
                    pt: '38px',
                    pb: 6,
                    px: 3,
                    boxShadow: 'none',
                    borderRadius: 1,
                    backgroundColor: theme.palette.background.paper
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: '1rem',
                      letterSpacing: '0.5px',
                      color: theme.palette.customColors.OnSurfaceVariant,
                      mb: 1
                    }}
                  >
                    {item.level}
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontStyle: 'italic',
                      fontSize: '0.9rem',
                      color: item.color,
                      textAlign: 'center'
                    }}
                  >
                    {item.name}
                  </Typography>
                  <Typography
                    variant='caption'
                    sx={{ color: theme.palette.customColors.neutralSecondary, textAlign: 'center', mt: 0.5 }}
                  >
                    {item.scientific}
                  </Typography>
                </Card>
              </Box>

              {idx < arr.length - 1 && (
                <Box
                  sx={{
                    display: { xs: 'none', md: 'flex' },
                    alignItems: 'center',
                    alignSelf: 'stretch',
                    pt: '26px',
                    mx: 1.5,
                    flexShrink: 0
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      borderTop: `2px dashed ${theme.palette.customColors.OutlineVariant}`,
                      position: 'relative'
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        right: -6,
                        top: -6,
                        width: 0,
                        height: 0,
                        borderTop: '5px solid transparent',
                        borderBottom: '5px solid transparent',
                        borderLeft: `6px solid ${theme.palette.customColors.OutlineVariant}`
                      }}
                    />
                  </Box>
                </Box>
              )}
            </React.Fragment>
          ))}
        </Box>
      )}
    </Box>
  )
}

export default TaxonomyTab
