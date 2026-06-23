'use client'

import React from 'react'
import { Box, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { SpeciesDetailHeader, SpeciesProfile } from 'src/types/species-management/detail'
import { MiniBarRow, Pill, SectionCard, StatusChip } from 'src/views/pages/species-management/detail/detailUi'

interface ProfileTabProps {
  profile?: SpeciesProfile
  header?: SpeciesDetailHeader
}

/**
 * Definition-list layout: label → value rows with hairline dividers, two balanced
 * columns on wider screens. No icons — clean, scannable spec-sheet treatment.
 * (icon field accepted for call-site compatibility but intentionally not rendered.)
 */
const FieldGrid: React.FC<{ items: { label: string; value?: React.ReactNode; icon?: string }[] }> = ({ items }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors as Record<string, string>
  const visible = items.filter(i => i.value !== undefined && i.value !== null && i.value !== '' && i.value !== '-')
  if (!visible.length) return null

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, columnGap: 8 }}>
      {visible.map((i, idx) => (
        <Box
          key={idx}
          sx={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 3,
            py: 1.5,
            borderBottom: `1px solid ${cc.SurfaceVariant}`
          }}
        >
          <Typography variant='caption' sx={{ color: cc.neutralSecondary, minWidth: 132, flexShrink: 0 }}>
            {i.label}
          </Typography>
          <Typography variant='body2' sx={{ color: cc.OnSurfaceVariant, fontWeight: 500 }}>
            {i.value}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}

const ScoreBars: React.FC<{ scores: { label: string; value?: number }[] }> = ({ scores }) => {
  const visible = scores.filter(s => typeof s.value === 'number')
  if (!visible.length) return null

  return (
    <Box>
      {visible.map((s, i) => (
        <MiniBarRow key={i} label={s.label} value={s.value as number} max={10} trailing={`${s.value}/10`} />
      ))}
    </Box>
  )
}

const ProfileTab: React.FC<ProfileTabProps> = ({ profile, header }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors as Record<string, string>
  const p = profile || {}

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Narrative */}
      {(p.description || p.iconicTrait || (p.funFact && p.funFact.length) || p.culturalSignificance || p.visitorTip) && (
        <SectionCard title='Overview'>
          {p.description && (
            <Typography variant='body1' sx={{ color: cc.OnSurfaceVariant, mb: 2 }}>
              {p.description}
            </Typography>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {p.iconicTrait && (
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                <StatusChip label='Signature Trait' tone='info' />
                <Typography variant='body2' sx={{ color: cc.OnSurfaceVariant }}>
                  {p.iconicTrait}
                </Typography>
              </Box>
            )}
            {p.funFact?.map((f, i) => (
              <Box key={i} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                <StatusChip label='Fun Fact' tone='success' />
                <Typography variant='body2' sx={{ color: cc.OnSurfaceVariant }}>
                  {f}
                </Typography>
              </Box>
            ))}
            {p.culturalSignificance && (
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                <StatusChip label='Cultural Significance' tone='warning' />
                <Typography variant='body2' sx={{ color: cc.OnSurfaceVariant }}>
                  {p.culturalSignificance}
                </Typography>
              </Box>
            )}
            {p.visitorTip && (
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                <StatusChip label='Visitor Tip' tone='primary' />
                <Typography variant='body2' sx={{ color: cc.OnSurfaceVariant }}>
                  {p.visitorTip}
                </Typography>
              </Box>
            )}
          </Box>
        </SectionCard>
      )}

      {/* Physical */}
      <SectionCard title='Physical Characteristics'>
        <FieldGrid
          items={[
            { label: 'Weight', value: p.avgWeightG, icon: 'mdi:scale' },
            { label: 'Birth Weight', value: p.birthWeightG, icon: 'mdi:egg-outline' },
            { label: 'Lifespan', value: p.lifespanYears, icon: 'mdi:timer-sand' },
            { label: 'Sexual Dimorphism', value: p.sexualDimorphism, icon: 'mdi:gender-male-female' },
            { label: 'Sex ID Method', value: p.sexIdMethod, icon: 'mdi:magnify' },
            { label: 'Sex ID Details', value: p.sexIdDescription }
          ]}
        />
      </SectionCard>

      {/* Behavioral */}
      <SectionCard title='Behavioral Profile'>
        <FieldGrid
          items={[
            { label: 'Activity Pattern', value: p.activityPattern, icon: 'mdi:clock-outline' },
            { label: 'Social Structure', value: p.socialStructure, icon: 'mdi:account-group' },
            { label: 'Habitat Zone', value: p.habitatZone, icon: 'mdi:tree' },
            { label: 'Communication', value: p.communicationType, icon: 'mdi:bullhorn-outline' },
            { label: 'Migration', value: p.migrationPattern, icon: 'mdi:compass-outline' },
            { label: 'Danger Level', value: p.dangerLevel, icon: 'mdi:alert-outline' },
            { label: 'Handling', value: p.canBeHandled, icon: 'mdi:hand-back-right-outline' },
            { label: 'Venom / Poison', value: p.venomousPoisonous, icon: 'mdi:snake' }
          ]}
        />
      </SectionCard>

      {/* Reproductive */}
      <SectionCard title='Reproductive Biology'>
        <FieldGrid
          items={[
            { label: 'Reproduction', value: p.reproductionType, icon: 'mdi:sync' },
            { label: 'Mating System', value: p.matingSystem, icon: 'mdi:heart-outline' },
            { label: 'Parental Care', value: p.parentalCare, icon: 'mdi:paw' },
            { label: 'Gestation (days)', value: p.gestationDays, icon: 'mdi:timer-outline' },
            { label: 'Incubation (days)', value: p.incubationDays, icon: 'mdi:egg-outline' },
            { label: 'Clutch / Litter Size', value: p.clutchLitterSize },
            { label: 'Weaning Age (days)', value: p.weaningAgeDays },
            { label: 'Independence (days)', value: p.independenceDays },
            { label: 'Sexual Maturity (yrs)', value: p.maturityAgeYears },
            { label: 'Litters / Year', value: p.littersPerYear }
          ]}
        />
      </SectionCard>

      {/* Diet & Nutrition */}
      <SectionCard title='Dietary Requirements'>
        <FieldGrid
          items={[
            { label: 'Diet', value: p.dietCategory, icon: 'mdi:food-apple-outline' },
            { label: 'Feeding Frequency', value: p.feedingFrequency, icon: 'mdi:clock-time-four-outline' },
            { label: 'Daily kcal', value: p.dailyKcal },
            { label: 'Protein', value: p.proteinPct },
            { label: 'Fat', value: p.fatPct },
            { label: 'Fiber', value: p.fiberPct },
            { label: 'Ca:P Ratio', value: p.caPRatio }
          ]}
        />
      </SectionCard>

      {/* Habitat & Enclosure */}
      <SectionCard title='Habitat & Enclosure'>
        <FieldGrid
          items={[
            { label: 'IUCN Habitat', value: p.iucnHabitatDetail, icon: 'mdi:earth' },
            { label: 'Enclosure Type', value: p.enclosureTypeRequired, icon: 'mdi:home-outline' },
            { label: 'Substrate', value: p.substrateType },
            { label: 'UV Light', value: p.uvLightRequired, icon: 'mdi:weather-sunny' },
            { label: 'Water Feature', value: p.waterFeatureRequired, icon: 'mdi:water-outline' }
          ]}
        />
      </SectionCard>

      {/* Welfare & captive-care scores */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
        <SectionCard title='Welfare Needs (0–10)'>
          <ScoreBars
            scores={[
              { label: 'Intelligence', value: p.intelligenceScore },
              { label: 'Activity', value: p.activityNeedsScore },
              { label: 'Social', value: p.socialNeedsScore },
              { label: 'Space', value: p.spaceNeedsScore },
              { label: 'Stress Risk', value: p.stressRiskScore }
            ]}
          />
        </SectionCard>
        <SectionCard title='Captive-Care Scores (0–10)'>
          <ScoreBars
            scores={[
              { label: 'Budget', value: p.budgetScore },
              { label: 'Size', value: p.sizeScore },
              { label: 'Need', value: p.needScore },
              { label: 'Conservation Priority', value: p.conservationPriority },
              { label: 'Visitor Appeal', value: p.visitorAppeal }
            ]}
          />
        </SectionCard>
      </Box>

      {/* Native range */}
      {p.nativeCountries && (
        <SectionCard title='Native Range'>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {p.nativeCountries.split(',').map((c, i) => (
              <Pill key={i} label={c.trim()} />
            ))}
          </Box>
        </SectionCard>
      )}

      {/* Identification recommendation */}
      {(p.recommendedIdMethod || p.sexIdMethod) && (
        <SectionCard title='Identification'>
          <FieldGrid
            items={[
              { label: 'Recommended ID', value: p.recommendedIdMethod, icon: 'mdi:barcode' },
              { label: 'Sex ID Method', value: p.sexIdMethod }
            ]}
          />
        </SectionCard>
      )}

      {/* External links */}
      {p.links && p.links.length > 0 && (
        <SectionCard title='External References'>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {p.links.map((l, i) => (
              <a key={i} href={l.url} target='_blank' rel='noreferrer' style={{ textDecoration: 'none' }}>
                <Pill label={l.label} icon='mdi:open-in-new' />
              </a>
            ))}
          </Box>
        </SectionCard>
      )}

      {/* Taxonomy breadcrumb */}
      {header && (header.class || header.order || header.family || header.genus) && (
        <Typography variant='caption' sx={{ color: cc.neutralSecondary }}>
          {[header.class, header.order, header.family, header.genus].filter(Boolean).join('  ›  ')}
          {header.subspecies ? `  ·  ssp. ${header.subspecies}` : ''}
        </Typography>
      )}
    </Box>
  )
}

export default ProfileTab
