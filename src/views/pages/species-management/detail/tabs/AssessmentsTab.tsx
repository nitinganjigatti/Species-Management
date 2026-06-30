'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Box, Checkbox, Drawer, FormControlLabel, IconButton, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import CustomSwitchTabs from 'src/components/CustomSwitchTabs'
import CustomFilterDrawer from 'src/components/drawers/CustomFilterDrawer'
import FilterButtonWithNotification from 'src/views/utility/FilterButtonWithNotification'
import type {
  AssessmentAnimal,
  CatNumericAnimal,
  CatTypeItem,
  CatValueAnimal,
  ChartEntityRef,
  SpeciesAssessments
} from 'src/types/species-management/detail'
import {
  AnimalCardList,
  ColumnTrend,
  DeltaChip,
  DistributionBarChart,
  EmptyState,
  EntityListDrawer,
  RangeBar,
  SectionCard,
  SparkBars,
  StatTile,
  StatusChip,
  TileGrid
} from 'src/views/pages/species-management/detail/detailUi'

/** A chart bucket the user drilled into → list of animals behind it. */
type BucketDrill = { title: string; subtitle?: string; unit?: string; items: ChartEntityRef[] } | null
type OnBucket = (drill: NonNullable<BucketDrill>) => void

/* ------------------------------------------------------------------ helpers */

const cc = (theme: any) => theme.palette.customColors as Record<string, string>
const distMax = (vals: { count: number }[]) => Math.max(1, ...vals.map(v => v.count))

/** Truncate a long free-text value for compact display. */
const trunc = (s: string, n = 40) => (s.length > n ? `${s.slice(0, n)}…` : s)

/* ------------------------------------------------------------------ Type card */

const TypeCard: React.FC<{ item: CatTypeItem; onOpen: () => void }> = ({ item, onOpen }) => {
  const theme = useTheme() as any
  const c = cc(theme)

  // assessment name (label) · its headline value (1 line, ellipsis if long) · animal count
  const value =
    item.display === 'numeric'
      ? `${item.avg}${item.uom ? ` ${item.uom}` : ''}`
      : item.display === 'distribution'
        ? item.values[0]?.label ?? '—'
        : item.top[0]?.label ?? '—'

  return (
    <Box
      onClick={onOpen}
      sx={{
        borderRadius: '10px',
        border: `1px solid ${c.SurfaceVariant}`,
        backgroundColor: theme.palette.background.paper,
        p: 2.5,
        cursor: 'pointer',
        transition: 'box-shadow .15s ease, border-color .15s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: 0.75,
        minWidth: 0,
        '&:hover': { boxShadow: 2, borderColor: c.OutlineVariant }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
        <Typography variant='caption' sx={{ color: c.neutralSecondary }} noWrap title={item.type}>
          {item.type}
        </Typography>
        <Icon icon='mdi:chevron-right' fontSize={18} color={c.Outline} />
      </Box>
      <Typography variant='subtitle1' sx={{ fontWeight: 600, color: c.OnSurface }} noWrap title={value}>
        {value}
      </Typography>
      <Typography variant='caption' sx={{ color: c.neutralSecondary }}>
        {item.nAnimals} animals
      </Typography>
    </Box>
  )
}

/* ------------------------------------------------------------------ Type drawer (by-type drill) */

type FilterCat = 'Site' | 'Enclosure' | 'Gender'
interface AnimalFilters {
  Site: string[]
  Enclosure: string[]
  Gender: string[]
  from: string
  to: string
}

const TypeDrawer: React.FC<{
  item: CatTypeItem | null
  onClose: () => void
  onAnimal: (id: string, name?: string) => void
  resolveAnimal?: (id: string) => AssessmentAnimal | undefined
}> = ({ item, onClose, onAnimal, resolveAnimal }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  // distribution/text: which value is active (defaults to the first/top value — no box step)
  const [val, setVal] = useState<string | null>(null)
  // animal-list search (inline) + applied multi-select filters (set via the antz filter drawer)
  const [q, setQ] = useState('')
  const blank = (): AnimalFilters => ({ Site: [], Enclosure: [], Gender: [], from: '', to: '' })
  const [filters, setFilters] = useState<AnimalFilters>(blank())
  const [draft, setDraft] = useState<AnimalFilters>(blank())
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterTab, setFilterTab] = useState<FilterCat>('Site')

  useEffect(() => {
    // open straight into the first value (top one shown on the card)
    if (item && item.display === 'distribution') setVal(item.values[0]?.label ?? null)
    else if (item && item.display === 'text') setVal(item.top[0]?.label ?? null)
    else setVal(null)
  }, [item?.type]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setQ('')
    setFilters(blank())
    setFilterOpen(false)
  }, [val]) // eslint-disable-line react-hooks/exhaustive-deps

  // map a value's animal to the antz AnimalCard's data shape, enriched from the species' animals
  const cardData = (a: CatValueAnimal) => {
    const f = resolveAnimal?.(a.id)

    return {
      local_identifier_name: 'ID',
      local_identifier_value: a.name || a.id,
      gender: f?.gender,
      age: f?.ageYears != null ? `${f.ageYears} yr` : undefined,
      weight: f?.latestWeight != null ? `${f.latestWeight}` : undefined,
      user_enclosure_name: f?.enclosure,
      site_name: f?.site
    }
  }

  const isDist = item && (item.display === 'distribution' || item.display === 'text')
  const values = item ? (item.display === 'distribution' ? item.values : item.display === 'text' ? item.top : []) : []
  const sel = values.find(v => v.label === val) || values[0]
  const headerTitle = isDist ? sel?.label || item?.type : item?.type

  return (
    <Drawer
      anchor='right'
      open={!!item}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: { xs: '100%', sm: 640 }, p: 4 } } }}
    >
      {item && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant='subtitle1' sx={{ fontWeight: 600 }} title={headerTitle}>
                {headerTitle}
              </Typography>
              <Typography variant='caption' sx={{ color: c.neutralSecondary }}>
                {isDist ? `${item.type} · ${(sel?.count ?? 0).toLocaleString()} animals` : `${item.count.toLocaleString()} records · ${item.nAnimals} animals`}
              </Typography>
            </Box>
            <IconButton onClick={onClose}>
              <Icon icon='mdi:close' />
            </IconButton>
          </Box>

          {item.display === 'numeric' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TileGrid>
                <StatTile label='Average' value={`${item.avg}${item.uom ? ` ${item.uom}` : ''}`} tone='info' />
                <StatTile label='Median' value={item.median} tone='neutral' />
                <StatTile label='Min' value={item.min} tone='neutral' />
                <StatTile label='Max' value={item.max} tone='neutral' />
              </TileGrid>
              <SectionCard title={`Animals (${item.animals.length})`}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  {item.animals.map((an: CatNumericAnimal, i) => (
                    <Box
                      key={i}
                      onClick={() => onAnimal(an.id, an.name)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        py: 1,
                        cursor: 'pointer',
                        borderBottom: `1px solid ${c.SurfaceVariant}`,
                        '&:hover': { backgroundColor: c.Surface }
                      }}
                    >
                      <Typography variant='body2' sx={{ flex: 1, color: c.OnSurfaceVariant }} noWrap>
                        {an.name || an.id}
                      </Typography>
                      {an.history && an.history.length > 1 && (
                        <Box sx={{ width: 64 }}>
                          <SparkBars values={an.history.map(h => h.v)} />
                        </Box>
                      )}
                      <Typography variant='body2' sx={{ width: 64, textAlign: 'right', color: c.OnSurface }}>
                        {an.value}
                      </Typography>
                      <Box sx={{ width: 64, display: 'flex', justifyContent: 'flex-end' }}>
                        <DeltaChip pct={an.pctVsAvg} />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </SectionCard>
            </Box>
          )}

          {isDist &&
            (() => {
              const enriched = (sel?.animals || []).map(an => ({ an, full: resolveAnimal?.(an.id) }))
              const uniq = (pick: (e: (typeof enriched)[number]) => string | undefined) =>
                Array.from(new Set(enriched.map(pick).filter(Boolean))) as string[]
              const optsFor: Record<FilterCat, string[]> = {
                Site: uniq(e => e.full?.site),
                Enclosure: uniq(e => e.full?.enclosure),
                Gender: uniq(e => e.full?.gender)
              }
              const facetCats = (['Site', 'Enclosure', 'Gender'] as FilterCat[]).filter(cat => optsFor[cat].length > 1)
              const ql = q.trim().toLowerCase()
              const matchCat = (cat: FilterCat, v?: string) => !filters[cat].length || (v != null && filters[cat].includes(v))
              const filtered = enriched.filter(e => {
                if (!matchCat('Site', e.full?.site)) return false
                if (!matchCat('Enclosure', e.full?.enclosure)) return false
                if (!matchCat('Gender', e.full?.gender)) return false
                if (filters.from && (!e.an.date || e.an.date < filters.from)) return false
                if (filters.to && (!e.an.date || e.an.date > filters.to)) return false
                if (ql && !`${e.an.name || ''} ${e.an.id}`.toLowerCase().includes(ql)) return false

                return true
              })
              const appliedCount =
                filters.Site.length + filters.Enclosure.length + filters.Gender.length + (filters.from || filters.to ? 1 : 0)
              const openFilter = () => {
                setDraft(filters)
                setFilterTab(facetCats[0] || 'Site')
                setFilterOpen(true)
              }
              const toggle = (cat: FilterCat, opt: string) =>
                setDraft(d => ({ ...d, [cat]: d[cat].includes(opt) ? d[cat].filter(x => x !== opt) : [...d[cat], opt] }))

              return (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  {/* value selector — switch the item without leaving the sheet (no boxes) */}
                  {values.length > 1 && (
                    <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
                      {values.map((v, i) => {
                        const active = v.label === sel?.label

                        return (
                          <Box
                            key={i}
                            onClick={() => setVal(v.label)}
                            title={v.label}
                            sx={{
                              flexShrink: 0,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 1,
                              px: 2,
                              py: 1,
                              borderRadius: '20px',
                              cursor: 'pointer',
                              border: `1px solid ${active ? theme.palette.primary.main : c.OutlineVariant}`,
                              backgroundColor: active ? `${theme.palette.primary.main}1A` : 'transparent'
                            }}
                          >
                            <Typography
                              variant='caption'
                              sx={{ fontWeight: 600, color: active ? theme.palette.primary.main : c.OnSurfaceVariant }}
                            >
                              {trunc(v.label, 24)}
                            </Typography>
                            <Typography variant='caption' sx={{ color: c.neutralSecondary }}>
                              {v.count}
                            </Typography>
                          </Box>
                        )
                      })}
                    </Box>
                  )}

                  {/* one search bar + a filter button (opens the antz filter drawer) */}
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <TextField
                      size='small'
                      placeholder='Search animal'
                      value={q}
                      onChange={e => setQ(e.target.value)}
                      sx={{ flex: 1 }}
                      InputProps={{ startAdornment: <Icon icon='mdi:magnify' fontSize={18} /> }}
                    />
                    <FilterButtonWithNotification label='Filter' appliedFiltersCount={appliedCount} onClick={openFilter} />
                  </Box>

                  <Typography variant='caption' sx={{ color: c.neutralSecondary }}>
                    Showing {filtered.length} of {enriched.length}
                  </Typography>

                  {filtered.length ? (
                    <AnimalCardList
                      cards={filtered.map(({ an }) => cardData(an))}
                      onClick={i => onAnimal(filtered[i].an.id, filtered[i].an.name)}
                    />
                  ) : (
                    <EmptyState message='No animals match the filters' />
                  )}

                  {/* reused antz filter drawer: category list + checkboxes + date range */}
                  <CustomFilterDrawer
                    open={filterOpen}
                    onClose={() => setFilterOpen(false)}
                    zIndex={theme.zIndex.drawer + 10}
                    filterLists={[...facetCats, 'Date']}
                    filterLabels={{ Site: 'Site', Enclosure: 'Enclosure', Gender: 'Gender', Date: 'Date Range' }}
                    selectedOptions={{
                      Site: draft.Site,
                      Enclosure: draft.Enclosure,
                      Gender: draft.Gender,
                      Date: draft.from || draft.to ? ['1'] : []
                    }}
                    selectedItem={filterTab}
                    onSelectItem={(it: string) => setFilterTab(it as FilterCat)}
                    onClearAll={() => {
                      const b = blank()
                      setDraft(b)
                      setFilters(b)
                      setFilterOpen(false)
                    }}
                    onApply={() => {
                      setFilters(draft)
                      setFilterOpen(false)
                    }}
                  >
                    {(filterTab as string) === 'Date' ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                        <TextField
                          size='small'
                          type='date'
                          label='From'
                          value={draft.from}
                          onChange={e => setDraft(d => ({ ...d, from: e.target.value }))}
                          InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                          size='small'
                          type='date'
                          label='To'
                          value={draft.to}
                          onChange={e => setDraft(d => ({ ...d, to: e.target.value }))}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        {(optsFor[filterTab] || []).map(o => (
                          <FormControlLabel
                            key={o}
                            control={<Checkbox checked={draft[filterTab].includes(o)} onChange={() => toggle(filterTab, o)} />}
                            label={o}
                          />
                        ))}
                      </Box>
                    )}
                  </CustomFilterDrawer>
                </Box>
              )
            })()}
        </>
      )}
    </Drawer>
  )
}

/* ------------------------------------------------------------------ Animal drawer (by-animal drill) */

const AnimalDrawer: React.FC<{ animal: AssessmentAnimal | null; speciesAvgWeight?: number; speciesMinWeight?: number; onClose: () => void }> = ({
  animal,
  speciesAvgWeight,
  speciesMinWeight,
  onClose
}) => {
  const theme = useTheme() as any
  const c = cc(theme)

  // group records by category → type for the readings list
  const grouped = useMemo(() => {
    const m = new Map<string, Map<string, { v: string; d: string }[]>>()
    for (const r of animal?.records || []) {
      if (!m.has(r.c)) m.set(r.c, new Map())
      const tm = m.get(r.c) as Map<string, { v: string; d: string }[]>
      if (!tm.has(r.t)) tm.set(r.t, [])
      tm.get(r.t)?.push({ v: r.v, d: r.d })
    }

    return m
  }, [animal])

  const wVsAvg =
    animal?.latestWeight != null && speciesAvgWeight
      ? Math.round(((animal.latestWeight - speciesAvgWeight) / speciesAvgWeight) * 1000) / 10
      : null

  return (
    <Drawer
      anchor='right'
      open={!!animal}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: { xs: '100%', sm: 580 }, p: 4 } } }}
    >
      {animal && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                {animal.name || animal.antzId}
              </Typography>
              <Typography variant='caption' sx={{ color: c.neutralSecondary }}>
                {[animal.gender, animal.site, animal.enclosure, animal.ageYears != null ? `${animal.ageYears} yr` : null]
                  .filter(Boolean)
                  .join(' · ')}
              </Typography>
            </Box>
            <IconButton onClick={onClose}>
              <Icon icon='mdi:close' />
            </IconButton>
          </Box>

          <TileGrid>
            {animal.latestWeight != null && (
              <StatTile
                label='Latest Weight'
                value={animal.latestWeight}
                sub={wVsAvg != null ? `${wVsAvg > 0 ? '+' : ''}${wVsAvg}% vs avg` : undefined}
                tone='info'
              />
            )}
            {animal.latestBcs != null && <StatTile label='Latest BCS' value={animal.latestBcs} tone='primary' />}
            {animal.weightCount != null && <StatTile label='Weight Records' value={animal.weightCount} tone='neutral' />}
            {animal.assessmentCount != null && (
              <StatTile label='Total Records' value={animal.assessmentCount} tone='neutral' />
            )}
          </TileGrid>

          {animal.weightHistory && animal.weightHistory.length > 1 && (
            <SectionCard title='Weight Trend' sx={{ mt: 3 }}>
              <ColumnTrend
                data={animal.weightHistory.map(h => ({ label: h.d, value: h.v }))}
                tone='info'
                baseline={speciesMinWeight}
              />
              {speciesMinWeight != null && (
                <Typography variant='caption' sx={{ color: c.neutralSecondary }}>
                  Baseline = species minimum ({speciesMinWeight})
                </Typography>
              )}
            </SectionCard>
          )}

          {animal.bcsHistory && animal.bcsHistory.length > 1 && (
            <SectionCard title='BCS Trend' sx={{ mt: 3 }}>
              <ColumnTrend data={animal.bcsHistory.map(h => ({ label: h.d, value: h.v }))} tone='primary' height={100} />
            </SectionCard>
          )}

          {grouped.size > 0 && (
            <SectionCard title='Recent Readings' sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {Array.from(grouped.entries()).map(([cat, types], i) => (
                  <Box key={i}>
                    <Typography variant='caption' sx={{ color: c.neutralSecondary, textTransform: 'uppercase' }}>
                      {cat}
                    </Typography>
                    {Array.from(types.entries()).map(([t, vals], j) => (
                      <Box key={j} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 0.5 }}>
                        <Typography variant='body2' sx={{ color: c.OnSurfaceVariant, flex: 1 }}>
                          {t}
                        </Typography>
                        <Box sx={{ textAlign: 'right', maxWidth: '55%' }}>
                          <Typography variant='body2' sx={{ color: c.OnSurface }} noWrap>
                            {vals[0].v}
                          </Typography>
                          <Typography variant='caption' sx={{ color: c.neutralSecondary }}>
                            {vals[0].d}
                            {vals.length > 1 ? ` · ${vals.length} readings` : ''}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ))}
              </Box>
            </SectionCard>
          )}

          {!animal.weightHistory?.length && !animal.bcsHistory?.length && grouped.size === 0 && (
            <EmptyState message='No assessment history for this animal' />
          )}
        </>
      )}
    </Drawer>
  )
}

/* ------------------------------------------------------------------ Overview panel */

const OverviewPanel: React.FC<{ a: SpeciesAssessments; onCategory: (cat: string) => void; onBucket: OnBucket }> = ({
  a,
  onCategory,
  onBucket
}) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const s = a.summary || {}
  const cats = a.catDetail || {}

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <TileGrid>
        <StatTile label='Animals Assessed' value={s.totalAnimals ?? 0} tone='primary' />
        <StatTile label='Total Records' value={(s.totalRecords ?? 0).toLocaleString()} tone='primary' />
        {typeof s.avgWeight === 'number' && <StatTile label='Avg Weight' value={s.avgWeight} tone='info' />}
        {typeof s.avgAge === 'number' && <StatTile label='Avg Age' value={`${s.avgAge} yr`} tone='neutral' />}
        {typeof s.weightCoverage === 'number' && (
          <StatTile label='Weight Coverage' value={`${s.weightCoverage}%`} tone='success' />
        )}
        {typeof s.bcsCoverage === 'number' && <StatTile label='BCS Coverage' value={`${s.bcsCoverage}%`} tone='success' />}
        {s.dateRange && (
          <StatTile label='Date Range' value={s.dateRange.from} sub={`to ${s.dateRange.to}`} tone='neutral' />
        )}
      </TileGrid>

      {a.highlights && Object.keys(a.highlights).length > 0 && (
        <TileGrid>
          {a.highlights.heaviest && (
            <StatTile label='Heaviest' value={a.highlights.heaviest.weight} sub={a.highlights.heaviest.name} tone='info' />
          )}
          {a.highlights.lightest && (
            <StatTile label='Lightest' value={a.highlights.lightest.weight} sub={a.highlights.lightest.name} tone='info' />
          )}
          {a.highlights.oldest && (
            <StatTile label='Oldest' value={a.highlights.oldest.age} sub={a.highlights.oldest.name} tone='neutral' />
          )}
          {a.highlights.youngest && (
            <StatTile label='Youngest' value={a.highlights.youngest.age} sub={a.highlights.youngest.name} tone='neutral' />
          )}
        </TileGrid>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
        {a.ageBands?.length ? (
          <SectionCard title='Age'>
            <DistributionBarChart
              data={a.ageBands.map(b => ({ label: b.label, count: b.count }))}
              tone='neutral'
              onSelect={label => {
                const b = (a.ageBands || []).find(x => x.label === label)
                onBucket({ title: `Age · ${label}`, subtitle: `${b?.count ?? 0} animals`, items: b?.items || [] })
              }}
            />
          </SectionCard>
        ) : null}
        {a.genderComparison && Object.keys(a.genderComparison).length ? (
          <SectionCard title='By Gender'>
            <TileGrid>
              {Object.entries(a.genderComparison).map(([g, v]) => (
                <StatTile
                  key={g}
                  label={g}
                  value={v.avgWeight != null ? v.avgWeight : (v.count ?? '-')}
                  sub={[v.count != null ? `${v.count} animals` : null, v.avgBcs != null ? `BCS ${v.avgBcs}` : null]
                    .filter(Boolean)
                    .join(' · ')}
                  tone='info'
                  onClick={() => onBucket({ title: `Gender · ${g}`, subtitle: `${v.count ?? 0} animals`, items: v.items || [] })}
                />
              ))}
            </TileGrid>
          </SectionCard>
        ) : null}
      </Box>

      {Object.keys(cats).length > 0 && (
        <SectionCard title='Assessment Categories'>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2 }}>
            {Object.entries(cats).map(([cat, items]) => (
              <Box
                key={cat}
                onClick={() => onCategory(cat)}
                sx={{
                  borderRadius: '10px',
                  border: `1px solid ${c.SurfaceVariant}`,
                  p: 3,
                  cursor: 'pointer',
                  transition: 'box-shadow .15s ease',
                  '&:hover': { boxShadow: 2 }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant='subtitle2' sx={{ fontWeight: 600, color: c.OnSurfaceVariant }}>
                    {cat}
                  </Typography>
                  <Icon icon='mdi:chevron-right' fontSize={18} color={c.Outline} />
                </Box>
                <Typography variant='caption' sx={{ color: c.neutralSecondary }}>
                  {items.length} {items.length === 1 ? 'type' : 'types'}
                  {s.categories?.[cat] ? ` · ${s.categories[cat].toLocaleString()} records` : ''}
                </Typography>
              </Box>
            ))}
          </Box>
        </SectionCard>
      )}
    </Box>
  )
}

/* ------------------------------------------------------------------ Category panel */

const CategoryPanel: React.FC<{
  a: SpeciesAssessments
  category: string
  onType: (item: CatTypeItem) => void
}> = ({ a, category, onType }) => {
  const isPhysical = /physical/i.test(category)

  // Weight & BCS become normal assessment cards (name · value · count) → same value→animals sheet.
  const synth = (type: string, dist?: { label: string; count: number; items?: { id: string; name?: string }[] }[]): CatTypeItem | null => {
    if (!dist?.length) return null
    const values = dist
      .map(d => ({ label: d.label, count: d.count, animals: (d.items || []).map(it => ({ id: it.id, name: it.name })) }))
      .sort((x, y) => y.count - x.count)
    const total = values.reduce((s, v) => s + v.count, 0)

    return { type, display: 'distribution', count: total, nAnimals: total, values }
  }

  const extras = isPhysical
    ? ([synth('Weight', a.weightDistribution), synth('Body Condition Score', a.bcsDistribution)].filter(Boolean) as CatTypeItem[])
    : []
  const items = [...extras, ...(a.catDetail?.[category] || [])]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {items.length > 0 ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 3 }}>
          {items.map((item, i) => (
            <TypeCard key={i} item={item} onOpen={() => onType(item)} />
          ))}
        </Box>
      ) : (
        <EmptyState message='No assessment types recorded for this category' />
      )}
    </Box>
  )
}

/* ------------------------------------------------------------------ Tab root */

const AssessmentsTab: React.FC<{ assessments?: SpeciesAssessments }> = ({ assessments }) => {
  const a = assessments
  const [sub, setSub] = useState<string>('overview')
  const [typeDrill, setTypeDrill] = useState<CatTypeItem | null>(null)
  const [animalDrill, setAnimalDrill] = useState<AssessmentAnimal | null>(null)
  const [bucketDrill, setBucketDrill] = useState<BucketDrill>(null)

  // index animals by id for the by-animal drill
  const animalById = useMemo(() => {
    const m = new Map<string, AssessmentAnimal>()
    for (const an of a?.animals || []) m.set(an.antzId, an)

    return m
  }, [a])

  // categories present, ordered by record volume; Physical Health pinned first if it has any data
  const categories = useMemo(() => {
    if (!a) return [] as string[]
    const fromDetail = Object.keys(a.catDetail || {})
    const hasPhysical =
      fromDetail.some(c => /physical/i.test(c)) || !!a.weightDistribution?.length || !!a.bcsDistribution?.length
    const set = new Set(fromDetail)
    if (hasPhysical) set.add('Physical Health')
    const counts = a.summary?.categories || {}

    return Array.from(set).sort((x, y) => {
      if (/physical/i.test(x)) return -1
      if (/physical/i.test(y)) return 1

      return (counts[y] || 0) - (counts[x] || 0)
    })
  }, [a])

  if (!a || !a.summary?.totalRecords) return <EmptyState message='No assessment data available' />

  const openAnimal = (id: string, name?: string) => setAnimalDrill(animalById.get(id) || { antzId: id, name })

  const options = [{ label: 'Overview', value: 'overview' }, ...categories.map(c => ({ label: c, value: c }))]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box sx={{ overflowX: 'auto', pb: 1, '& .MuiToggleButtonGroup-root .MuiToggleButton-root': { px: 4 } }}>
        <CustomSwitchTabs
          options={options}
          value={sub}
          onChange={(_e: React.SyntheticEvent, v: string | null) => v && setSub(v)}
        />
      </Box>

      {sub === 'overview' ? (
        <OverviewPanel a={a} onCategory={setSub} onBucket={setBucketDrill} />
      ) : (
        <CategoryPanel a={a} category={sub} onType={setTypeDrill} />
      )}

      <TypeDrawer
        item={typeDrill}
        onClose={() => setTypeDrill(null)}
        onAnimal={openAnimal}
        resolveAnimal={(id: string) => animalById.get(id)}
      />
      <AnimalDrawer
        animal={animalDrill}
        speciesAvgWeight={a.summary?.avgWeight}
        speciesMinWeight={a.highlights?.lightest?.weight}
        onClose={() => setAnimalDrill(null)}
      />
      {/* chart bucket → list of animals behind it; real animals drill into the animal drawer */}
      <EntityListDrawer
        open={!!bucketDrill}
        title={bucketDrill?.title}
        subtitle={bucketDrill?.subtitle}
        unit={bucketDrill?.unit}
        items={bucketDrill?.items}
        isClickable={(id: string) => animalById.has(id)}
        onItemClick={(id: string) => {
          setBucketDrill(null)
          openAnimal(id)
        }}
        onClose={() => setBucketDrill(null)}
      />
    </Box>
  )
}

export default AssessmentsTab
