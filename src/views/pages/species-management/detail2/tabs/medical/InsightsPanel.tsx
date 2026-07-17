'use client'

/*
 * Medical → Insights sub-tab (V7, findings-first). Every card leads with its CONCLUSION as the
 * headline — the metric name is a small eyebrow, the visual is evidence. Forms are chosen per
 * the data's job: line for trend, tiles for a handful of headline numbers, vertical columns
 * with on-mark values, a single-hue heat strip, stat tiles instead of a 3-number chart, and a
 * hero figure + proportion meter + ranked list for care-load. No horizontal bar lists.
 */
import React, { useMemo, useState } from 'react'
import { Avatar, Box, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import type { SpeciesClinical, SpeciesPreventive } from 'src/lib/api/species-management/detail'
import { EmptyState, SectionCard, TrendAreaChart } from 'src/views/pages/species-management/detail2/detailUi'
import { resolveRange, type RangeSelection } from 'src/views/pages/species-management/dashboard/DashboardDateRange'
import { computeInsights, type InsightBarRow, type SignalAnimal } from './signals'
import SignalDrawer, { type SignalDrawerPayload } from './SignalDrawer'

const ANTZ_LOGO = '/images/branding/Antz_logomark_h_color.svg'

const cc = (theme: any) => theme.palette.customColors as Record<string, string>

/* ── card head: eyebrow (metric) + finding (the conclusion, with one highlighted phrase) ── */
const FindingHead: React.FC<{ eyebrow: string; lead: string; leadTone?: 'good' | 'bad'; rest: string }> = ({
  eyebrow,
  lead,
  leadTone = 'good',
  rest
}) => {
  const theme = useTheme() as any
  const c = cc(theme)

  return (
    <Box>
      <Typography
        sx={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.66px', textTransform: 'uppercase', color: c.neutralSecondary }}
      >
        {eyebrow}
      </Typography>
      <Typography sx={{ fontSize: '16px', fontWeight: 600, lineHeight: 1.4, mt: 0.5 }}>
        <Box component='span' sx={{ color: leadTone === 'bad' ? c.Tertiary : theme.palette.primary.dark }}>
          {lead}
        </Box>{' '}
        {rest}
      </Typography>
    </Box>
  )
}

const ClickHint: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme() as any

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 3 }}>
      <Icon icon='mdi:cursor-default-click-outline' fontSize={14} color={cc(theme).neutralSecondary} />
      <Typography variant='caption' sx={{ color: cc(theme).neutralSecondary }}>
        {children}
      </Typography>
    </Box>
  )
}

const ChartsRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 4, alignItems: 'stretch' }}>
    {children}
  </Box>
)

/* ── vertical columns: value ON the mark, label directly beneath — no eye travel ── */
const ColumnChart: React.FC<{
  items: { label: string; display: string; sub?: string; pct: number; hi?: boolean }[]
  onItem?: (index: number) => void
  height?: number
}> = ({ items, onItem, height = 190 }) => {
  const theme = useTheme() as any
  const c = cc(theme)

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 6, height, px: 2 }}>
      {items.map((it, i) => (
        <Box
          key={it.label}
          onClick={onItem ? () => onItem(i) : undefined}
          sx={{
            flex: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end',
            cursor: onItem ? 'pointer' : 'default',
            '&:hover .colbar': onItem ? { opacity: 1 } : undefined
          }}
        >
          <Typography sx={{ fontSize: '14px', fontWeight: 700, color: it.hi ? theme.palette.primary.dark : c.OnSurfaceVariant, mb: 1.5 }}>
            {it.display}
          </Typography>
          <Box
            className='colbar'
            sx={{
              width: '100%',
              maxWidth: 64,
              height: `${Math.max(4, it.pct)}%`,
              borderRadius: '6px 6px 0 0',
              backgroundColor: it.hi ? theme.palette.primary.dark : theme.palette.primary.main,
              opacity: it.hi ? 1 : 0.55,
              transition: 'opacity .15s ease'
            }}
          />
          <Typography
            variant='caption'
            sx={{ color: it.hi ? theme.palette.primary.dark : c.neutralSecondary, fontWeight: it.hi ? 700 : 400, mt: 2 }}
            noWrap
          >
            {it.label}
          </Typography>
          {it.sub && (
            <Typography variant='caption' sx={{ fontSize: 11, color: c.Outline }} noWrap>
              {it.sub}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  )
}

const InsightsPanel: React.FC<{
  clinical?: SpeciesClinical | null
  preventive?: SpeciesPreventive | null
  range: RangeSelection
}> = ({ clinical, preventive, range }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const [drill, setDrill] = useState<SignalDrawerPayload | null>(null)

  const insights = useMemo(() => {
    const now = new Date()
    const { from, to } = resolveRange(range, now)
    const lo = from ? from.getTime() : null
    const hi = to.getTime()
    const inWin = (s?: string) => {
      if (!s) return true
      const t = new Date(s).getTime()
      if (isNaN(t)) return true

      return (lo == null || t >= lo) && t <= hi
    }

    return computeInsights(clinical, preventive, inWin, { from, to }, now)
  }, [clinical, preventive, range])

  const openRows = (title: string, explainer: string, icon: string, animals: SignalAnimal[]) =>
    setDrill({ title, explainer, icon, tone: 'neutral', animals })

  const { morbidity, trend, trendAnimals, risingStreak, hotspots, hotspotAvg, recovery, seasonality, conversion, preventiveLink, pareto } =
    insights

  const delta = morbidity.prevPct != null ? Math.round((morbidity.pct - morbidity.prevPct) * 10) / 10 : null
  const hasData = trend.some(t => t.value > 0) || hotspots.length > 0
  if (!hasData) return <EmptyState message='No clinical activity in this window.' />

  /* findings — the computed one-liners each card leads with */
  const trendFinding =
    risingStreak >= 2
      ? { lead: `${morbidity.pct}% of animals are sick`, tone: 'bad' as const, rest: `— the rate has risen for ${risingStreak} straight months` }
      : delta != null && delta > 0
      ? { lead: `${morbidity.pct}% of animals are sick`, tone: 'bad' as const, rest: `— up ${delta} pt on the previous window` }
      : delta != null && delta < 0
      ? { lead: `${morbidity.pct}% of animals are sick`, tone: 'good' as const, rest: `— down ${Math.abs(delta)} pt on the previous window` }
      : { lead: `${morbidity.pct}% of animals are sick`, tone: 'good' as const, rest: 'in this window' }

  const worstSite = hotspots[0]
  const worstMult = worstSite && hotspotAvg ? Math.round((worstSite.value / hotspotAvg) * 10) / 10 : 0
  const multChip = (rate: number) => {
    if (!hotspotAvg) return { label: '—', bad: false }
    const m = rate / hotspotAvg
    if (m >= 1.5) return { label: `${(Math.round(m * 10) / 10).toFixed(1)}× average`, bad: true }
    if (m >= 0.9) return { label: m >= 1.1 ? `${(Math.round(m * 10) / 10).toFixed(1)}× average` : 'at average', bad: false }

    return { label: `${(Math.round(m * 10) / 10).toFixed(1)}× average`, bad: false }
  }

  const slow = recovery[0]
  const fast = recovery[recovery.length - 1]
  const recoveryRatio = slow && fast && fast.value > 0 ? Math.round((slow.value / fast.value) * 10) / 10 : 0

  // Best consecutive 3-month stretch of the seasonal year.
  const seasonTotal = seasonality.reduce((s, m) => s + m.value, 0)
  let peakStart = 0
  let peakSum = -1
  for (let i = 0; i < 12; i++) {
    const sum = seasonality[i].value + seasonality[(i + 1) % 12].value + seasonality[(i + 2) % 12].value
    if (sum > peakSum) {
      peakSum = sum
      peakStart = i
    }
  }
  const peakShare = seasonTotal ? Math.round((peakSum / seasonTotal) * 100) : 0
  const peakLabel = `${seasonality[peakStart].label}–${seasonality[(peakStart + 2) % 12].label}`
  const seasonMax = Math.max(1, ...seasonality.map(m => m.value))

  const topConv = conversion[0]
  const worstPrev = preventiveLink[0]
  const prevAny = preventiveLink.some(r => r.value > 0)

  const PREV_ICONS: Record<string, string> = {
    'Overdue vaccination': 'mdi:needle',
    'Overdue deworming': 'mdi:pill',
    'Overdue supplements': 'mdi:water'
  }

  const columnItems = (rows: InsightBarRow[], subOf: (r: InsightBarRow) => string | undefined, maxPct: number) => {
    const max = Math.max(1, ...rows.map(r => r.value))

    return rows.slice(0, 5).map((r, i) => ({
      label: r.label,
      display: r.display,
      sub: subOf(r),
      pct: (r.value / (maxPct || max)) * 74, // tallest column ≈ 74% of plot height, mock proportions
      hi: i === 0
    }))
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* 1 · HERO — sickness-rate trend */}
      <SectionCard
        title={<FindingHead eyebrow='Sickness-rate trend · trailing 12 months' lead={trendFinding.lead} leadTone={trendFinding.tone} rest={trendFinding.rest} />}
        action={
          delta != null ? (
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                px: 3,
                py: 1,
                borderRadius: '20px',
                flexShrink: 0,
                backgroundColor: delta > 0 ? c.BgTeritary : c.OnBackground,
                color: delta > 0 ? c.Tertiary : theme.palette.primary.dark
              }}
            >
              <Icon icon={delta > 0 ? 'mdi:trending-up' : 'mdi:trending-down'} fontSize={14} />
              <Typography variant='caption' sx={{ fontWeight: 600, color: 'inherit' }}>
                {delta > 0 ? '+' : ''}
                {delta} pt vs previous window
              </Typography>
            </Box>
          ) : undefined
        }
        titleMb={4}
      >
        <TrendAreaChart
          values={trend.map(t => t.value)}
          labels={trend.map(t => t.label)}
          color={theme.palette.primary.main}
          name='Sickness rate'
          unit='%'
          height={230}
          onPointClick={i =>
            trendAnimals[i]?.length &&
            openRows(
              `${trend[i].label} — sick animals`,
              `${trendAnimals[i].length} animals had an active illness in ${trend[i].label}.`,
              'mdi:chart-line',
              trendAnimals[i]
            )
          }
        />
        <ClickHint>Click a month's point to see that month's sick animals</ClickHint>
      </SectionCard>

      {/* 2 · SITE TILES — a handful of headline numbers, not bars */}
      {hotspots.length > 0 && (
        <SectionCard
          title={
            <FindingHead
              eyebrow='Site hotspots · illness cases per animal housed'
              lead={worstMult >= 1.5 ? `${worstSite.label} runs ${worstMult}× the collection average` : 'No site stands out'}
              leadTone={worstMult >= 1.5 ? 'bad' : 'good'}
              rest={worstMult >= 1.5 ? '— the other sites sit at or below it' : '— sickness rates are even across sites'}
            />
          }
          titleMb={4}
        >
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: `repeat(${Math.min(4, hotspots.length)}, 1fr)` }, gap: 3 }}>
            {hotspots.slice(0, 8).map(site => {
              const chip = multChip(site.value)

              return (
                <Box
                  key={site.label}
                  onClick={() =>
                    openRows(site.label, `${site.sub} — every animal at this site that fell sick in the window.`, 'mdi:map-marker', site.animals)
                  }
                  sx={{
                    border: `1px solid ${chip.bad ? c.OutlineVariant : c.SurfaceVariant}`,
                    backgroundColor: chip.bad ? c.Surface : 'transparent',
                    borderRadius: '10px',
                    p: 3.5,
                    cursor: 'pointer',
                    transition: 'box-shadow .15s ease',
                    '&:hover': { boxShadow: '0 2px 8px rgba(68,84,74,0.14)' }
                  }}
                >
                  <Typography variant='caption' sx={{ fontWeight: 600, color: c.neutralSecondary, display: 'block' }} noWrap>
                    {site.label}
                  </Typography>
                  <Typography sx={{ fontSize: 26, fontWeight: 700, lineHeight: 1, mt: 1.5, color: c.OnSurfaceVariant }}>
                    {site.value.toFixed(1)}{' '}
                    <Box component='span' sx={{ fontSize: 12, fontWeight: 500, color: c.neutralSecondary }}>
                      cases / animal
                    </Box>
                  </Typography>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      mt: 2,
                      px: 2.5,
                      py: 0.5,
                      borderRadius: '20px',
                      fontSize: 11,
                      fontWeight: 700,
                      backgroundColor: chip.bad ? c.BgTeritary : c.OnBackground,
                      color: chip.bad ? c.Tertiary : theme.palette.primary.dark
                    }}
                  >
                    {chip.label}
                  </Box>
                  <Typography variant='caption' sx={{ display: 'block', mt: 2, color: c.neutralSecondary }}>
                    {site.cases} cases · {site.housed} housed
                  </Typography>
                </Box>
              )
            })}
          </Box>
          <ClickHint>Click a site to see its sick animals</ClickHint>
        </SectionCard>
      )}

      {/* 3+4 · vertical columns — value on the mark */}
      <ChartsRow>
        <SectionCard
          title={
            <FindingHead
              eyebrow='Recovery time by condition'
              lead={recoveryRatio >= 2 ? `${slow.label} takes ${recoveryRatio}× longer to clear` : 'Recovery times are even'}
              leadTone='good'
              rest={
                recoveryRatio >= 2
                  ? 'than the fastest condition'
                  : recovery.length
                  ? `— ${fast?.value ?? 0}–${slow?.value ?? 0} days across conditions`
                  : ''
              }
            />
          }
          titleMb={4}
        >
          {recovery.length ? (
            <>
              <ColumnChart
                items={columnItems(recovery, r => `${r.cases} cases`, 0)}
                onItem={i => {
                  const row = recovery[i]
                  openRows(row.label, `${row.sub} — click any animal for its record.`, 'mdi:medical-bag', row.animals)
                }}
              />
              <ClickHint>Click a condition for its cases</ClickHint>
            </>
          ) : (
            <EmptyState message='Not enough resolved cases in this window' />
          )}
        </SectionCard>

        <SectionCard
          title={
            <FindingHead
              eyebrow='Symptom → diagnosis conversion · within 45 days'
              lead={topConv ? `${topConv.label} is the loudest early warning` : 'No escalation pattern yet'}
              leadTone='good'
              rest={topConv ? `— ${topConv.value}% of cases become a diagnosis` : '— not enough symptom volume in this window'}
            />
          }
          titleMb={4}
        >
          {conversion.length ? (
            <>
              <ColumnChart
                items={columnItems(conversion, r => `${r.escalated} of ${r.totalCases}`, 100)}
                onItem={i => {
                  const row = conversion[i]
                  openRows(row.label, `${row.sub} escalated to a diagnosis — the animals it happened to.`, 'mdi:arrow-up-bold-box-outline', row.animals)
                }}
              />
              <ClickHint>Click a symptom to see who escalated</ClickHint>
            </>
          ) : (
            <EmptyState message='Not enough symptom volume in this window' />
          )}
        </SectionCard>
      </ChartsRow>

      {/* 5+6 · heat strip + preventive stat tiles */}
      <ChartsRow>
        <SectionCard
          title={
            <FindingHead
              eyebrow='Seasonality · illness onsets by calendar month'
              lead={seasonTotal ? `${peakLabel} holds ${peakShare}% of the year's cases` : 'No seasonal pattern yet'}
              leadTone='good'
              rest={seasonTotal ? '— plan staffing before the peak' : ''}
            />
          }
          titleMb={4}
        >
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 1.5 }}>
            {seasonality.map(m => {
              const r = m.value / seasonMax
              const bg =
                r >= 0.95
                  ? theme.palette.primary.dark
                  : r >= 0.7
                  ? `${theme.palette.primary.dark}BF`
                  : `${theme.palette.primary.main}${Math.round((0.08 + r * 0.5) * 255).toString(16).padStart(2, '0')}`
              const isPeak = r >= 0.7

              return (
                <Box
                  key={m.label}
                  onClick={() =>
                    m.animals.length &&
                    openRows(`${m.label} — illness onsets`, `${m.animals.length} animals fell sick in ${m.label} across the window.`, 'mdi:calendar-month', m.animals)
                  }
                  sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, cursor: m.animals.length ? 'pointer' : 'default' }}
                >
                  <Box
                    sx={{
                      width: '100%',
                      aspectRatio: '1 / 1.15',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 700,
                      color: isPeak ? theme.palette.common.white : c.OnSurfaceVariant,
                      backgroundColor: bg
                    }}
                  >
                    {m.value || ''}
                  </Box>
                  <Typography variant='caption' sx={{ fontSize: 11, color: r >= 0.95 ? theme.palette.primary.dark : c.neutralSecondary, fontWeight: r >= 0.95 ? 700 : 400 }}>
                    {m.label}
                  </Typography>
                </Box>
              )
            })}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 3.5 }}>
            <Typography variant='caption' sx={{ color: c.neutralSecondary }}>
              fewer
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {[0.12, 0.3, 0.5].map(a => (
                <Box key={a} sx={{ width: 18, height: 8, borderRadius: '2px', backgroundColor: `${theme.palette.primary.main}${Math.round(a * 255).toString(16).padStart(2, '0')}` }} />
              ))}
              <Box sx={{ width: 18, height: 8, borderRadius: '2px', backgroundColor: `${theme.palette.primary.dark}BF` }} />
              <Box sx={{ width: 18, height: 8, borderRadius: '2px', backgroundColor: theme.palette.primary.dark }} />
            </Box>
            <Typography variant='caption' sx={{ color: c.neutralSecondary }}>
              more onsets · click a month
            </Typography>
          </Box>
        </SectionCard>

        <SectionCard
          title={
            <FindingHead
              eyebrow='Preventive ↔ sickness link'
              lead={
                prevAny && worstPrev
                  ? `${worstPrev.label.replace('Overdue ', '').replace(/^./, ch => ch.toUpperCase())} is the leakiest program`
                  : 'Prevention is holding'
              }
              leadTone={prevAny ? 'bad' : 'good'}
              rest={prevAny && worstPrev ? `— ${worstPrev.value} overdue animals fell sick` : '— no overdue animal fell sick in this window'}
            />
          }
          titleMb={4}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {preventiveLink.map((row, i) => {
              const worst = i === 0 && row.value > 0

              return (
                <Box
                  key={row.label}
                  onClick={() => row.value > 0 && openRows(row.label, `${row.sub} also fell sick in this window.`, PREV_ICONS[row.label] ?? 'mdi:shield-alert', row.animals)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    border: `1px solid ${c.SurfaceVariant}`,
                    borderRadius: '10px',
                    px: 4,
                    py: 3,
                    cursor: row.value > 0 ? 'pointer' : 'default',
                    transition: 'box-shadow .15s ease',
                    '&:hover': row.value > 0 ? { boxShadow: '0 2px 8px rgba(68,84,74,0.14)' } : undefined
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '8px',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: worst ? c.BgTeritary : c.displaybgPrimary,
                      color: worst ? c.Tertiary : c.OnPrimaryContainer
                    }}
                  >
                    <Icon icon={PREV_ICONS[row.label] ?? 'mdi:shield-check'} fontSize={20} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 22, fontWeight: 700, lineHeight: 1.1, color: worst ? c.Tertiary : c.OnSurfaceVariant }}>
                      {row.value}
                    </Typography>
                    <Typography variant='caption' sx={{ color: c.neutralSecondary }}>
                      fell sick while overdue on <b>{row.label.replace('Overdue ', '')}</b> · of {row.overdueTotal ?? 0} overdue
                    </Typography>
                  </Box>
                  {row.value > 0 && <Icon icon='mdi:chevron-right' fontSize={16} color={c.Outline} />}
                </Box>
              )
            })}
          </Box>
        </SectionCard>
      </ChartsRow>

      {/* 7 · care-load — hero figure + proportion meter + ranked animal list */}
      <SectionCard
        title={
          <FindingHead
            eyebrow='Care-load concentration'
            lead={pareto.totalEvents ? 'A chronic few, not a sick herd' : 'No clinical events'}
            leadTone='good'
            rest={pareto.totalEvents ? '— a small group of animals generates most of the medical work' : 'in this window'}
          />
        }
        titleMb={4}
      >
        {pareto.totalEvents > 0 ? (
          <>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, flexWrap: 'wrap' }}>
              <Typography sx={{ fontSize: 34, fontWeight: 700, lineHeight: 1, color: c.OnSurfaceVariant }}>
                {pareto.topCount} animals
              </Typography>
              <Typography variant='body2' sx={{ color: c.neutralSecondary }}>
                = {pareto.sharePct}% of all {pareto.totalEvents} clinical events this window
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', height: 10, borderRadius: '5px', overflow: 'hidden', backgroundColor: c.Surface, mt: 3.5, mb: 1.5 }}>
              <Box sx={{ width: `${pareto.sharePct}%`, backgroundColor: theme.palette.primary.dark }} />
              <Box sx={{ flex: 1, backgroundColor: c.OnBackground }} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant='caption' sx={{ color: c.neutralSecondary }}>
                these {pareto.topCount} animals · {pareto.coveredEvents} events
              </Typography>
              <Typography variant='caption' sx={{ color: c.neutralSecondary }}>
                rest of the collection ({Math.max(0, insights.population - pareto.topCount).toLocaleString()} animals) ·{' '}
                {pareto.totalEvents - pareto.coveredEvents} events
              </Typography>
            </Box>
            {pareto.rows.slice(0, 5).map((row, i, arr) => {
              const a = row.animals[0]

              return (
                <Box
                  key={row.label}
                  onClick={() => a && openRows(row.label, `${row.sub} — this window's heaviest care load.`, 'mdi:account-alert', row.animals)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    py: 2.5,
                    borderBottom: i < arr.length - 1 ? `0.5px solid ${c.OutlineVariant}` : 'none',
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: c.Surface }
                  }}
                >
                  <Avatar
                    src={ANTZ_LOGO}
                    alt=''
                    sx={{ width: 40, height: 40, flexShrink: 0, bgcolor: c.Surface, '& img': { objectFit: 'contain', padding: '5px' } }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '15px', fontWeight: 600, color: c.OnSurfaceVariant }} noWrap>
                      {row.label}
                    </Typography>
                    <Typography
                      sx={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.66px', color: c.neutralSecondary, mt: '2px' }}
                      noWrap
                    >
                      {a ? `${a.enclosure} · ${a.site}` : ''}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      px: 2.5,
                      py: 0.75,
                      borderRadius: '20px',
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.4px',
                      textTransform: 'uppercase',
                      backgroundColor: c.displaybgPrimary,
                      color: c.OnPrimaryContainer,
                      flexShrink: 0
                    }}
                  >
                    {row.value} events
                  </Box>
                </Box>
              )
            })}
            {pareto.rows.length > 5 && (
              <Box
                onClick={() =>
                  openRows(
                    'Heaviest care load',
                    `The ${pareto.topCount} animals generating ${pareto.sharePct}% of this window's clinical events.`,
                    'mdi:account-alert',
                    pareto.rows.flatMap(r => r.animals)
                  )
                }
                sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mt: 3, cursor: 'pointer', color: theme.palette.primary.dark }}
              >
                <Typography variant='caption' sx={{ fontWeight: 600, color: 'inherit' }}>
                  View all {pareto.rows.length} animals
                </Typography>
                <Icon icon='mdi:arrow-right' fontSize={14} />
              </Box>
            )}
          </>
        ) : (
          <EmptyState message='No clinical events in this window' />
        )}
      </SectionCard>

      <SignalDrawer payload={drill} onClose={() => setDrill(null)} />
    </Box>
  )
}

export default InsightsPanel
