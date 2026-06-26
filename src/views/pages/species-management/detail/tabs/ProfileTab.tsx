'use client'

import React from 'react'
import { Box, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import type { SpeciesDetailHeader, SpeciesProfile } from 'src/types/species-management/detail'
import { MiniBarRow, Pill, SectionCard, StatusChip } from 'src/views/pages/species-management/detail/detailUi'

interface ProfileTabProps {
  profile?: SpeciesProfile
  header?: SpeciesDetailHeader
}

// ── value helpers ───────────────────────────────────────────────────────────────
const has = (v: unknown) => v !== undefined && v !== null && v !== '' && v !== '-'
const toNum = (v?: string | number) => {
  const x = Number(v)

  return v != null && v !== '' && Number.isFinite(x) ? x : null
}
// grams → "1.1 kg" at/above 1kg, else "320 g"
const fmtWeight = (v?: string | number) => {
  const x = toNum(v)
  if (x == null) return (v as React.ReactNode) ?? null

  return x >= 1000 ? `${+(x / 1000).toFixed(1)} kg` : `${x.toLocaleString()} g`
}
const fmtUnit = (v: string | number | undefined, unit: string) => {
  const x = toNum(v)

  return x != null ? `${x.toLocaleString()} ${unit}` : ((v as React.ReactNode) ?? null)
}

type Field = { label: string; value?: React.ReactNode; icon?: string }

// ── A single labelled metric in the Vital Signs hero band ────────────────────────
const Vital: React.FC<{ label: string; value: React.ReactNode; sub?: string }> = ({ label, value, sub }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors as Record<string, string>

  return (
    <Box sx={{ minWidth: 132 }}>
      <Typography variant='caption' sx={{ display: 'block', color: cc.neutralSecondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </Typography>
      <Typography variant='h4' sx={{ color: cc.OnSurface, fontWeight: 600, lineHeight: 1.1, mt: 0.5 }}>
        {value}
      </Typography>
      {sub && (
        <Typography variant='caption' sx={{ color: cc.neutralSecondary }}>
          {sub}
        </Typography>
      )}
    </Box>
  )
}

// ── A scannable grid of labelled values (replaces the old label→value list) ──────
const SpecGrid: React.FC<{ items: Field[] }> = ({ items }) => {
  const theme = useTheme() as any
  const cc = theme.palette.customColors as Record<string, string>
  const visible = items.filter(i => has(i.value))
  if (!visible.length) return null

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3, 1fr)' }, columnGap: 5, rowGap: 3 }}>
      {visible.map((i, idx) => (
        <Box key={idx} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', minWidth: 0 }}>
          {i.icon && (
            <Icon icon={i.icon} fontSize='1.15rem' color={cc.Outline} style={{ marginTop: 2, flexShrink: 0 }} />
          )}
          <Box sx={{ minWidth: 0 }}>
            <Typography variant='caption' sx={{ display: 'block', color: cc.neutralSecondary }}>
              {i.label}
            </Typography>
            <Typography variant='body2' sx={{ color: cc.OnSurfaceVariant, fontWeight: 600 }}>
              {i.value}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  )
}

// A spec section that renders nothing when it has no populated fields.
const SpecSection: React.FC<{ title: string; items: Field[] }> = ({ title, items }) => {
  if (!items.filter(i => has(i.value)).length) return null

  return (
    <SectionCard title={title}>
      <SpecGrid items={items} />
    </SectionCard>
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

  // Vital Signs hero — the species' defining numbers. Weight / Lifespan / Birth weight
  // are framed as the average of one healthy ("best") representative animal.
  const vitals = (
    [
      has(p.avgWeightG) && { label: 'Weight', value: fmtWeight(p.avgWeightG), sub: 'avg · healthy adult' },
      has(p.lifespanYears) && { label: 'Lifespan', value: fmtUnit(p.lifespanYears, 'yrs'), sub: 'avg · healthy adult' },
      has(p.birthWeightG) && { label: 'Birth Weight', value: fmtWeight(p.birthWeightG), sub: 'avg · healthy neonate' },
      has(p.maturityAgeYears) && { label: 'Sexual Maturity', value: fmtUnit(p.maturityAgeYears, 'yrs') },
      has(p.clutchLitterSize) && { label: 'Clutch / Litter', value: p.clutchLitterSize }
    ] as ({ label: string; value: React.ReactNode; sub?: string } | false)[]
  ).filter(Boolean) as { label: string; value: React.ReactNode; sub?: string }[]

  const hasNarrative = p.description || p.iconicTrait || (p.funFact && p.funFact.length) || p.culturalSignificance || p.visitorTip
  const welfare = [
    { label: 'Intelligence', value: p.intelligenceScore },
    { label: 'Activity', value: p.activityNeedsScore },
    { label: 'Social', value: p.socialNeedsScore },
    { label: 'Space', value: p.spaceNeedsScore },
    { label: 'Stress Risk', value: p.stressRiskScore }
  ]
  const care = [
    { label: 'Budget', value: p.budgetScore },
    { label: 'Size', value: p.sizeScore },
    { label: 'Need', value: p.needScore },
    { label: 'Conservation Priority', value: p.conservationPriority },
    { label: 'Visitor Appeal', value: p.visitorAppeal }
  ]
  const hasWelfare = welfare.some(s => typeof s.value === 'number')
  const hasCare = care.some(s => typeof s.value === 'number')

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Narrative lead */}
      {hasNarrative && (
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

      {/* Vital Signs — the signature band (tinted surface, large numbers) */}
      {vitals.length > 0 && (
        <SectionCard title='Vital Signs' sx={{ backgroundColor: cc.Surface }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', columnGap: { xs: '40px', md: '88px' }, rowGap: '24px' }}>
            {vitals.map((v, i) => (
              <Vital key={i} label={v.label} value={v.value} sub={v.sub} />
            ))}
          </Box>
        </SectionCard>
      )}

      {/* Detail spec sections (each hides itself when empty) */}
      <SpecSection
        title='Physical & Identification'
        items={[
          { label: 'Sexual Dimorphism', value: p.sexualDimorphism, icon: 'mdi:gender-male-female' },
          { label: 'Sex ID Method', value: p.sexIdMethod, icon: 'mdi:magnify' },
          { label: 'Sex ID Details', value: p.sexIdDescription, icon: 'mdi:information-outline' },
          { label: 'Recommended ID', value: p.recommendedIdMethod, icon: 'mdi:barcode' }
        ]}
      />

      <SpecSection
        title='Behavioral Profile'
        items={[
          { label: 'Activity Pattern', value: p.activityPattern, icon: 'mdi:clock-outline' },
          { label: 'Social Structure', value: p.socialStructure, icon: 'mdi:account-group-outline' },
          { label: 'Habitat Zone', value: p.habitatZone, icon: 'mdi:tree-outline' },
          { label: 'Communication', value: p.communicationType, icon: 'mdi:bullhorn-outline' },
          { label: 'Migration', value: p.migrationPattern, icon: 'mdi:compass-outline' },
          { label: 'Danger Level', value: p.dangerLevel, icon: 'mdi:alert-outline' },
          { label: 'Handling', value: p.canBeHandled, icon: 'mdi:hand-back-right-outline' },
          { label: 'Venom / Poison', value: p.venomousPoisonous, icon: 'mdi:snake' }
        ]}
      />

      <SpecSection
        title='Reproductive Biology'
        items={[
          { label: 'Reproduction', value: p.reproductionType, icon: 'mdi:sync' },
          { label: 'Mating System', value: p.matingSystem, icon: 'mdi:heart-outline' },
          { label: 'Parental Care', value: p.parentalCare, icon: 'mdi:paw' },
          { label: 'Gestation', value: fmtUnit(p.gestationDays, 'days'), icon: 'mdi:timer-outline' },
          { label: 'Incubation', value: fmtUnit(p.incubationDays, 'days'), icon: 'mdi:egg-outline' },
          { label: 'Weaning Age', value: fmtUnit(p.weaningAgeDays, 'days'), icon: 'mdi:baby-bottle-outline' },
          { label: 'Independence', value: fmtUnit(p.independenceDays, 'days'), icon: 'mdi:bird' },
          { label: 'Litters / Year', value: p.littersPerYear, icon: 'mdi:calendar-refresh-outline' }
        ]}
      />

      <SpecSection
        title='Dietary Requirements'
        items={[
          { label: 'Diet', value: p.dietCategory, icon: 'mdi:food-apple-outline' },
          { label: 'Feeding Frequency', value: p.feedingFrequency, icon: 'mdi:clock-time-four-outline' },
          { label: 'Daily Energy', value: fmtUnit(p.dailyKcal, 'kcal'), icon: 'mdi:fire' },
          { label: 'Protein', value: p.proteinPct, icon: 'mdi:food-drumstick-outline' },
          { label: 'Fat', value: p.fatPct, icon: 'mdi:water-opacity' },
          { label: 'Fiber', value: p.fiberPct, icon: 'mdi:grain' },
          { label: 'Ca : P Ratio', value: p.caPRatio, icon: 'mdi:bone' }
        ]}
      />

      <SpecSection
        title='Habitat & Enclosure'
        items={[
          { label: 'IUCN Habitat', value: p.iucnHabitatDetail, icon: 'mdi:earth' },
          { label: 'Enclosure Type', value: p.enclosureTypeRequired, icon: 'mdi:home-outline' },
          { label: 'Substrate', value: p.substrateType, icon: 'mdi:layers-outline' },
          { label: 'UV Light', value: p.uvLightRequired, icon: 'mdi:weather-sunny' },
          { label: 'Water Feature', value: p.waterFeatureRequired, icon: 'mdi:water-outline' }
        ]}
      />

      {/* Care profile — paired score panels */}
      {(hasWelfare || hasCare) && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
          {hasWelfare && (
            <SectionCard title='Welfare Needs (0–10)'>
              <ScoreBars scores={welfare} />
            </SectionCard>
          )}
          {hasCare && (
            <SectionCard title='Captive-Care Scores (0–10)'>
              <ScoreBars scores={care} />
            </SectionCard>
          )}
        </Box>
      )}

      {/* Native range */}
      {has(p.nativeCountries) && (
        <SectionCard title='Native Range'>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {(p.nativeCountries as string).split(',').map((c, i) => (
              <Pill key={i} label={c.trim()} />
            ))}
          </Box>
        </SectionCard>
      )}

      {/* External references */}
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
