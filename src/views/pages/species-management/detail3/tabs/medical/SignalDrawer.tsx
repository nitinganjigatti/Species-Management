'use client'

/*
 * Right-side drill drawer for the Medical health signals and Insights cards. Generic: takes a
 * payload (title / explainer / animal rows / optional chain groups) so every signal and every
 * insight drill renders through one standard sheet. Animal rows follow the module standard —
 * default ANTZ avatar, name (+id), enclosure · site beneath.
 */
import React, { useMemo, useState } from 'react'
import { Box, Drawer } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import {
  Sheet,
  SheetEmpty,
  SheetFilterBar,
  SheetHeader,
  SheetRow,
  SheetSearch,
  SheetSection
} from 'src/views/pages/species-management/detail3/detailUi'
import { fmtDate, type SignalAnimal } from './signals'

export interface SignalDrawerPayload {
  title: string
  explainer?: string
  icon: string
  tone: 'error' | 'warning' | 'neutral'
  actionPill?: string // e.g. "Contain"
  animals: SignalAnimal[]
}

const cc = (theme: any) => theme.palette.customColors as Record<string, string>

const toneColors = (c: Record<string, string>, theme: any, tone: SignalDrawerPayload['tone']) =>
  tone === 'error'
    ? { bg: c.BgTeritary, fg: c.Tertiary }
    : tone === 'warning'
    ? { bg: `${theme.palette.warning.main}29`, fg: theme.palette.warning.dark }
    : { bg: c.displaybgPrimary, fg: c.OnPrimaryContainer }

const StatusPill: React.FC<{ label: string; tone?: SignalAnimal['pillTone'] }> = ({ label, tone = 'neutral' }) => {
  const theme = useTheme() as any
  const c = cc(theme)
  const map = {
    error: { bg: c.BgTeritary, fg: c.Tertiary },
    warning: { bg: `${theme.palette.warning.main}29`, fg: theme.palette.warning.dark },
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
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.4px',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        flexShrink: 0
      }}
    >
      {label}
    </Box>
  )
}

/** One signal animal → the standard SheetRow. Caption = condition (emphasized) + date + detail. */
const AnimalRow: React.FC<{ a: SignalAnimal; last: boolean; onClick?: () => void }> = ({ a, last, onClick }) => {
  const parts = [a.date ? fmtDate(a.date) : '', a.detail].filter(Boolean).join(' · ')
  const caption = [a.condition, parts].filter(Boolean).join(' · ')

  return (
    <SheetRow
      avatar
      title={a.name}
      caption={caption || undefined}
      subline={a.enclosure}
      last={last}
      onClick={onClick}
      chevron={!!onClick}
      trailing={a.pill ? <StatusPill label={a.pill} tone={a.pillTone} /> : undefined}
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

  // Enclosure facet: distinct enclosures in the payload, each labelled with its animal count
  // ("Enc 12 · 3"). The "All …" state is value === null (the placeholder). Only shown when the
  // signal touches more than one enclosure.
  const encOptions = useMemo(() => {
    if (!payload) return []
    const counts = new Map<string, number>()
    for (const a of payload.animals) counts.set(a.enclosure, (counts.get(a.enclosure) ?? 0) + 1)

    return [...counts.entries()].map(([name, n]) => `${name} · ${n}`)
  }, [payload])
  const encName = (opt: string | null) => (opt ? opt.split(' · ')[0] : null)

  const filtered = useMemo(() => {
    if (!payload) return []
    const selEnc = encName(enc)
    const needle = q.trim().toLowerCase()

    return payload.animals.filter(a => {
      if (selEnc && a.enclosure !== selEnc) return false
      if (!needle) return true

      return [a.name, a.aid, a.site, a.enclosure, a.condition, a.detail].some(v => v?.toLowerCase().includes(needle))
    })
  }, [payload, q, enc])

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

  const tone = payload ? toneColors(c, theme, payload.tone) : null

  return (
    <Drawer
      anchor='right'
      open={!!payload}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 500 }, maxWidth: '100%' } }}
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

          {encOptions.length > 1 ? (
            <SheetFilterBar
              search={q}
              onSearch={setQ}
              searchPlaceholder='Search animal, site, enclosure…'
              facetOptions={encOptions}
              facetValue={enc}
              onFacet={setEnc}
              facetPlaceholder={`All ${encOptions.length} Enclosures`}
              facetIcon='mdi:home-outline'
            />
          ) : (
            payload.animals.length > 8 && (
              <SheetSearch value={q} onChange={setQ} placeholder='Search animal, site…' />
            )
          )}

          <Box sx={{ flex: 1, overflowY: 'auto', px: 3, pb: 3 }}>
            {bySite.map(([site, list], si) => (
              <SheetSection key={site} label={site} first={si === 0}>
                {list.map((a, i) => (
                  <AnimalRow
                    key={`${a.aid}-${i}`}
                    a={a}
                    last={i === list.length - 1}
                    onClick={onAnimal ? () => onAnimal(a.aid) : undefined}
                  />
                ))}
              </SheetSection>
            ))}
            {!filtered.length && <SheetEmpty>No animals match.</SheetEmpty>}
          </Box>
        </Sheet>
      )}
    </Drawer>
  )
}

export default SignalDrawer
