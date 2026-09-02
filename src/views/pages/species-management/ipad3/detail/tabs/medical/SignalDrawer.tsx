'use client'

/*
 * Right-side drill drawer for the Medical health signals and Insights cards. Generic: takes a
 * payload (title / explainer / animal rows / optional chain groups) so every signal and every
 * insight drill renders through one standard sheet. Animal rows follow the module standard —
 * default ANTZ avatar, name (+id), enclosure • site beneath.
 */
import React, { useEffect, useMemo, useState } from 'react'
import { Box, Tooltip, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import {
  AnimalCardRow,
  RowMetaText,
  Sheet,
  SheetEmpty,
  SheetFilterBar,
  SheetHeader,
  SheetSection,
  sheetPaperSx,
  SHEET_PX
, SheetDrawer} from 'src/views/pages/species-management/ipad3/detail/detailUi'
import { fmtDate, type SignalAnimal } from './signals'

export interface SignalDrawerPayload {
  title: string
  explainer?: string
  icon: string
  tone: 'error' | 'warning' | 'neutral'
  actionPill?: string // e.g. "Contain"
  animals: SignalAnimal[]
  /** Preselect this site in the Site dropdown (site-row drills pass the FULL dataset plus this,
   *  so the user can switch sites inside the sheet without going back). */
  initialSite?: string
  /** Optional distribution strip above the list — each entry counts rows whose pill matches
   *  its label, so the strip follows the active search/site/enclosure filters. Zero-count
   *  entries are hidden; rows whose pill matches nothing (e.g. lifecycle statuses) stay out. */
  distribution?: { label: string; color: string }[]
  distributionTitle?: string
}

const cc = (theme: any) => theme.palette.customColors as Record<string, string>

const toneColors = (c: Record<string, string>, theme: any, tone: SignalDrawerPayload['tone']) =>
  tone === 'error'
    ? { bg: c.BgTeritary, fg: c.Tertiary }
    : tone === 'warning'
    ? // styleguide yellow — MUI's stock warning orange isn't an Antz color (user 2026-08-03)
      { bg: c.Notes, fg: c.OnSurfaceVariant }
    : { bg: c.displaybgPrimary, fg: c.OnPrimaryContainer }

const StatusPill: React.FC<{ label: string; tone?: SignalAnimal['pillTone'] }> = ({ label, tone = 'neutral' }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const map = {
    error: { bg: c.BgTeritary, fg: c.Tertiary },
    // styleguide yellow, dark grey text — never MUI stock orange, never yellow text
    warning: { bg: c.Notes, fg: c.OnSurfaceVariant },
    success: { bg: c.OnBackground, fg: theme.palette.primary.dark },
    neutral: { bg: c.displaybgPrimary, fg: c.OnPrimaryContainer }
  }[tone]

  return (
    <Box
      component='span'
      sx={{
        px: 2.5,
        py: 0.5,
        borderRadius: '20px',
        backgroundColor: map.bg,
        color: map.fg,
        fontSize: '14px',
        fontWeight: 600,
        letterSpacing: '0.4px',
        whiteSpace: 'nowrap',
        flexShrink: 0
      }}
    >
      {label}
    </Box>
  )
}

/** One signal animal → the standard AnimalCardRow (2026-09-02). Identity lives in the card
 *  (real enclosure; site stays OFF the card — the site section header / dropdown already says
 *  it); condition + date + detail become right-aligned meta lines, plus the optional chip
 *  whose tooltip lists items (see SignalAnimal.chip). */
const AnimalRow: React.FC<{ a: SignalAnimal; last: boolean; onClick?: () => void }> = ({ a, last, onClick }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  // one item per row (card-list hard rule): date and detail each take their own line
  const parts = [a.date ? fmtDate(a.date) : '', a.detail].filter(Boolean)
  const chipNode = a.chip ? (
    <Box component='span' sx={{ display: 'inline-flex', alignItems: 'center', gap: 2, minWidth: 0, maxWidth: '100%' }}>
      <Tooltip
        arrow
        enterTouchDelay={0}
        slotProps={{
          tooltip: {
            sx: {
              backgroundColor: theme.palette.background.paper,
              color: c.OnSurfaceVariant,
              border: `1px solid ${c.SurfaceVariant}`,
              boxShadow: '0 6px 20px rgba(31,81,91,0.18)',
              borderRadius: '8px',
              p: 4,
              maxWidth: 380
            }
          },
          arrow: {
            sx: { color: theme.palette.background.paper, '&::before': { border: `1px solid ${c.SurfaceVariant}` } }
          }
        }}
        title={
          <Box>
            {a.chip.items.map(it => (
              <Typography key={it} sx={{ fontSize: '16px', color: 'inherit', py: 0.75 }}>
                {it}
              </Typography>
            ))}
          </Box>
        }
      >
        <Box
          component='span'
          onClick={e => e.stopPropagation()}
          sx={{
            px: 2.5,
            py: 0.25,
            borderRadius: '14px',
            backgroundColor: c.Surface,
            border: `1px solid ${c.SurfaceVariant}`,
            fontSize: '16px',
            fontWeight: 600,
            color: c.OnSurfaceVariant,
            whiteSpace: 'nowrap',
            flexShrink: 0,
            cursor: 'default'
          }}
        >
          {a.chip.label}
        </Box>
      </Tooltip>
    </Box>
  ) : null

  return (
    <AnimalCardRow
      aid={a.aid}
      enclosure={a.enclosure}
      last={last}
      onClick={onClick}
      chevron={!!onClick}
      trailing={a.pill ? <StatusPill label={a.pill} tone={a.pillTone} /> : undefined}
      meta={
        <>
          {a.condition && (
            <RowMetaText strong wrap>
              {a.condition}
            </RowMetaText>
          )}
          {parts.map((line, li) => (
            <RowMetaText key={li} wrap>
              {line}
            </RowMetaText>
          ))}
          {chipNode}
        </>
      }
    />
  )
}

const SignalDrawer: React.FC<{
  payload: SignalDrawerPayload | null
  onClose: () => void
  onAnimal?: (aid: string) => void
}> = ({ payload, onClose, onAnimal }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const [q, setQ] = useState('')
  const [enc, setEnc] = useState<string | null>(null)
  const [site, setSite] = useState<string | null>(null)

  const optName = (opt: string | null) => (opt ? opt.split(' • ')[0] : null)

  // Site facet: distinct sites in the payload, each labelled with its animal count ("Foxglen • 12").
  const siteOptions = useMemo(() => {
    if (!payload) return []
    const counts = new Map<string, number>()
    for (const a of payload.animals) counts.set(a.site, (counts.get(a.site) ?? 0) + 1)

    return [...counts.entries()].map(([name, n]) => `${name} • ${n}`)
  }, [payload])

  // Fresh sheet → fresh filters (a stale site/enclosure from the previous drill would hide rows).
  // A drill that arrives site-scoped (initialSite) starts with that site picked in the dropdown.
  useEffect(() => {
    setQ('')
    setEnc(null)
    setSite(payload?.initialSite ? siteOptions.find(o => optName(o) === payload.initialSite) ?? null : null)
  }, [payload, siteOptions])

  // Enclosure facet: distinct enclosures, each labelled with its animal count ("Enc 12 • 3").
  // Cascades from the site facet — with a site picked it lists only that site's enclosures.
  const encOptions = useMemo(() => {
    if (!payload) return []
    const selSite = optName(site)
    const counts = new Map<string, number>()
    for (const a of payload.animals) {
      if (selSite && a.site !== selSite) continue
      counts.set(a.enclosure, (counts.get(a.enclosure) ?? 0) + 1)
    }

    return [...counts.entries()].map(([name, n]) => `${name} • ${n}`)
  }, [payload, site])

  const filtered = useMemo(() => {
    if (!payload) return []
    const selSite = optName(site)
    const selEnc = optName(enc)
    const needle = q.trim().toLowerCase()

    return payload.animals.filter(a => {
      if (selSite && a.site !== selSite) return false
      if (selEnc && a.enclosure !== selEnc) return false
      if (!needle) return true

      return [a.name, a.aid, a.site, a.enclosure, a.condition, a.detail].some(v => v?.toLowerCase().includes(needle))
    })
  }, [payload, q, enc, site])

  // Site sections — one header per site, rows beneath (site never repeats on rows).
  const bySite = useMemo(() => {
    const m = new Map<string, SignalAnimal[]>()
    for (const a of filtered) {
      if (!m.has(a.site)) m.set(a.site, [])
      m.get(a.site)!.push(a)
    }

    return [...m.entries()]
  }, [filtered])

  const enclosureCount = useMemo(() => new Set(filtered.map(a => `${a.site}|${a.enclosure}`)).size, [filtered])

  // Distribution strip segments — counted over the FILTERED rows so the strip answers
  // "what do the results look like for what I'm looking at right now".
  const dist = useMemo(() => {
    if (!payload?.distribution) return []

    return payload.distribution
      .map(d => ({ ...d, count: filtered.filter(a => a.pill === d.label).length }))
      .filter(d => d.count > 0)
  }, [payload, filtered])
  const distTotal = dist.reduce((s, d) => s + d.count, 0)

  const tone = payload ? toneColors(c, theme, payload.tone) : null

  return (
    <SheetDrawer
      open={!!payload}
      onClose={onClose}
      PaperProps={{ sx: sheetPaperSx('md') }}
    >
      {payload && tone && (
        <Sheet>
          <SheetHeader
            title={payload.title}
            chip={payload.actionPill ? <StatusPill label={payload.actionPill} tone='error' /> : undefined}
            icon={payload.icon}
            iconTone={tone}
            stats={[
              { label: 'Animals', value: filtered.length },
              { label: 'Enclosures', value: enclosureCount },
              { label: 'Sites', value: bySite.length }
            ]}
            onClose={onClose}
          />

          {/* One consistent bar for every sheet: Site + Enclosure dropdowns, search as an icon. */}
          <SheetFilterBar
            search={q}
            onSearch={setQ}
            searchPlaceholder='Search animal, site, enclosure…'
            facetOptions={encOptions}
            facetValue={enc}
            onFacet={setEnc}
            facetPlaceholder={`All ${encOptions.length} Enclosures`}
            facetIcon='mdi:home-outline'
            facet2Options={siteOptions}
            facet2Value={site}
            onFacet2={v => {
              setSite(v)
              setEnc(null)
            }}
            facet2Placeholder={`All ${siteOptions.length} Sites`}
            facet2Icon='mdi:map-marker-outline'
          />

          {dist.length > 0 && (
            <Box sx={{ px: SHEET_PX, mt: 4 }}>
              <Typography
                sx={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: c.neutralSecondary, mb: 2 }}
              >
                {payload.distributionTitle ?? 'Result Distribution'}
              </Typography>
              <Box sx={{ display: 'flex', height: 30, borderRadius: '8px', overflow: 'hidden' }}>
                {dist.map(d => {
                  const pct = (d.count / distTotal) * 100

                  return (
                    <Box
                      key={d.label}
                      sx={{
                        width: `${pct}%`,
                        backgroundColor: d.color,
                        color: theme.palette.common.white,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden'
                      }}
                    >
                      {pct >= 16 ? `${d.label} • ${d.count}` : pct >= 5 ? d.count : ''}
                    </Box>
                  )
                })}
              </Box>
              <Box sx={{ display: 'flex', gap: 4, mt: 1.5, flexWrap: 'wrap' }}>
                {dist.map(d => (
                  <Typography
                    key={d.label}
                    sx={{ fontSize: '14px', color: c.neutralSecondary, display: 'inline-flex', alignItems: 'center', gap: 1.5 }}
                  >
                    <Box component='span' sx={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: d.color, flexShrink: 0 }} />
                    {d.label} {d.count}
                  </Typography>
                ))}
              </Box>
            </Box>
          )}

          <Box sx={{ flex: 1, overflowY: 'auto', px: SHEET_PX, pb: 3 }}>
            {site ? (
              /* A site is picked — the dropdown IS the context, so no section header: flat list. */
              <Box sx={{ mt: 3 }}>
                {filtered.map((a, i) => (
                  <AnimalRow
                    key={`${a.aid}-${i}`}
                    a={a}
                    last={i === filtered.length - 1}
                    onClick={onAnimal ? () => onAnimal(a.aid) : undefined}
                  />
                ))}
              </Box>
            ) : (
              /* All sites — grouped: site header, its rows, divider, next site. */
              bySite.map(([siteName, list], si) => (
                <SheetSection key={siteName} label={siteName} first={si === 0}>
                  {list.map((a, i) => (
                    <AnimalRow
                      key={`${a.aid}-${i}`}
                      a={a}
                      last={i === list.length - 1}
                      onClick={onAnimal ? () => onAnimal(a.aid) : undefined}
                    />
                  ))}
                </SheetSection>
              ))
            )}
            {!filtered.length && <SheetEmpty>No animals match.</SheetEmpty>}
          </Box>
        </Sheet>
      )}
    </SheetDrawer>
  )
}

export default SignalDrawer
