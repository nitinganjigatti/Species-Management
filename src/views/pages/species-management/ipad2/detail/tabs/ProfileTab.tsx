'use client'

// iPad 2 Profile tab — the CC species-profile grammar (speciesProfile.tsx), ported whole.
// What the animal IS, beside what we hold of it: nothing here is derived or defaulted, and a
// field the extract left empty renders NOTHING — never an em dash, a zero or "Unknown".
//
// The type ladder the page is set on — five rungs, no other size anywhere:
//   LABEL    12px semibold UPPERCASE tracked, faint        — field names, captions, subs
//   BODY     15px                                          — row labels, prose, pills
//   SECTION  16px semibold near-black with an accent glyph — navigation
//   VALUE    18px semibold warm near-black                 — every content value
//   VITAL    26px bold tabular                             — the vital strip's figures only
//
// THE VALUES CARRY THEIR OWN GLOSS — "Least Concern (Low Risk)" — and the parenthetical is
// STRIPPED, never printed: forty support lines doubled the height of every attribute for a
// restatement. THE SCORES ARE NOT ALL OUT OF THE SAME NUMBER: welfare and care judgements are
// 1–5 (five pips), budget is 0–20 (a continuous track) — the old /10 track drew every welfare
// bar at half its true height and printed "Budget 11/10". danger_level is an ordinal the data
// itself states ("3 — Caution"), so it is drawn as five pips and nothing else gets a scale it
// did not arrive with. The macros are RANGES ("20-35%") that do not sum to 100 — spans on one
// shared axis, never a donut, which would state a composition the data does not contain.

import React from 'react'
import { Box, Typography } from '@mui/material'
import Icon from 'src/@core/components/icon'
import * as skin from 'src/views/pages/species-management/ipad2/skin'
import type { SpeciesDetailHeader, SpeciesProfile } from 'src/types/species-management/detail'
import { Pill } from 'src/views/pages/species-management/ipad2/detail/detailUi'

interface ProfileTabProps {
  profile?: SpeciesProfile
  header?: SpeciesDetailHeader
}

/* ── the atom: a value that carries its own caption ──────────────────────── */

/** "Least Concern (Low Risk)" → ["Least Concern", "Low Risk"]. Trailing parenthetical only. */
const gloss = (v: string): [string, string | undefined] => {
  const m = /^(.*?)\s*\(([^()]*)\)\s*$/.exec(v)

  return m ? [m[1].trim(), m[2].trim()] : [v.trim(), undefined]
}

/** The ordinal danger_level states about itself — "3 — Caution (…)" → 3. Absent where unranked. */
const rankOf = (v?: string): number | undefined => {
  const m = /^\s*(\d)\s*[—–-]/.exec(v ?? '')
  const n = m ? Number(m[1]) : NaN

  return Number.isFinite(n) ? n : undefined
}

/** The head of "3 — Caution (…)" without its rank — the pips already state the number. */
const unranked = (v: string): string => v.replace(/^\s*\d\s*[—–-]\s*/, '')

const str = (v?: string | number): string | undefined => (v == null || v === '' || v === '-' ? undefined : String(v))

/* ── formatting, which is units and nothing else ─────────────────────────── */

const num = (v?: string | number): number | undefined => {
  if (v == null || v === '') return undefined
  const n = Number(v)

  return Number.isFinite(n) ? n : undefined
}

/** Grams under a kilo, kilograms above it. 70 g and 11 kg, never 0.07 kg or 11000 g. */
const mass = (v?: string | number): string | undefined => {
  const n = num(v)
  if (n === undefined) return undefined

  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)} kg` : `${n < 10 ? +n.toFixed(2) : Math.round(n)} g`
}

const years = (v?: string | number): string | undefined => {
  const n = num(v)

  return n === undefined ? undefined : `${n % 1 === 0 ? n : n.toFixed(1)} yrs`
}

const days = (v?: string | number): string | undefined => {
  const n = num(v)

  return n === undefined ? undefined : `${Math.round(n)} day${Math.round(n) === 1 ? '' : 's'}`
}

const decimal = (v?: string | number): string | undefined => {
  const n = num(v)

  return n === undefined ? undefined : String(n % 1 === 0 ? n : Number(n.toFixed(1)))
}

/** Is there anything to draw? Keeps a whole zone from rendering an empty heading. */
const any = (...v: (string | number | undefined)[]) => v.some(x => x != null && x !== '')

/* ── shared type rungs ───────────────────────────────────────────────────── */

// The tab's whole type ladder — five rungs, stated once so nothing drifts:
// 12px labels/captions · 15px body/rows/prose · 16px section headings ·
// 18px values · 26px vital-strip figures (the one display tier).
const BODY_PX = '15px'
const VALUE_PX = '18px'

const LABEL_SX = {
  display: 'flex',
  alignItems: 'center',
  gap: 1.5,
  fontSize: '12px',
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  color: skin.FAINT
}

/* ── one value, as a block rather than a row ─────────────────────────────── */

const ValueBlock: React.FC<{ label: string; value?: string; icon?: string }> = ({ label, value, icon }) => {
  if (!value) return null
  // [0] only — the gloss is stripped from the value, never printed.
  const head = gloss(value)[0]

  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={LABEL_SX}>
        {icon && <Icon icon={icon} fontSize='0.85rem' color={skin.ACCENT_FILL} />}
        {label}
      </Typography>
      <Typography sx={{ mt: 1, fontSize: VALUE_PX, fontWeight: 600, lineHeight: 1.25, color: skin.VALUE }}>
        {head}
      </Typography>
    </Box>
  )
}

/* ── surfaces and sub-heads ──────────────────────────────────────────────── */

/** A plain white surface — the variety on this page comes from what goes INSIDE. */
const Surface: React.FC<{ children: React.ReactNode; pad?: 'md' | 'lg' }> = ({ children, pad = 'md' }) => (
  <Box component='section' sx={{ ...skin.cardSx, p: pad === 'lg' ? 5 : 4 }}>{children}</Box>
)

/** A block heading INSIDE a surface — a hairline above and a 16px title, never a box. */
const Sub: React.FC<{ label: string; icon?: string; first?: boolean; aside?: string; children: React.ReactNode }> = ({
  label,
  icon,
  first,
  aside,
  children
}) => (
  <Box sx={first ? {} : { mt: 7, pt: 5, borderTop: `1px solid ${skin.HAIR}` }}>
    <Box sx={{ mb: 4, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 3 }}>
      <Typography sx={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: '16px', fontWeight: 600, color: skin.INK }}>
        {icon && <Icon icon={icon} fontSize='1.05rem' color={skin.ACCENT_FILL} />}
        {label}
      </Typography>
      {aside && (
        <Typography sx={{ flexShrink: 0, fontSize: '12px', fontVariantNumeric: 'tabular-nums', color: skin.FAINT }}>
          {aside}
        </Typography>
      )}
    </Box>
    {children}
  </Box>
)

/** The one divider on the page, between what the animal is and what it needs from us. */
const GroupRule: React.FC<{ label: string }> = ({ label }) => (
  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 3 }}>
    <Typography sx={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: skin.MUTED }}>
      {label}
    </Typography>
    <Box sx={{ height: '1px', flex: 1, bgcolor: skin.HAIR }} />
  </Box>
)

/* ── 1 · vital signs, as a measured strip ────────────────────────────────── */

const VitalStrip: React.FC<{ items: { label: string; value: string; sub?: string }[] }> = ({ items }) => {
  if (!items.length) return null

  return (
    <Box component='section' sx={{ ...skin.cardSx, p: 4 }}>
      <Typography sx={{ ...LABEL_SX, color: skin.INK, mb: 2.5 }}>
        <Icon icon='mdi:shimmer' fontSize='0.9rem' color={skin.ACCENT_FILL} />
        Vital signs
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          rowGap: 5,
          '@media (orientation: landscape)': { display: 'flex' }
        }}
      >
        {items.map((m, i) => (
          <Box
            key={m.label}
            sx={{
              minWidth: 0,
              '@media (orientation: landscape)': {
                flex: 1,
                pr: 1,
                ...(i > 0 && { borderLeft: `1px solid ${skin.mixOverWhite(skin.ACCENT_FILL, 0.2)}`, pl: 5 })
              }
            }}
          >
            <Typography sx={LABEL_SX}>{m.label}</Typography>
            <Typography sx={{ mt: 1, fontSize: '26px', fontWeight: 700, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums', color: skin.VALUE }}>
              {m.value}
            </Typography>
            {m.sub && (
              <Typography sx={{ mt: '2px', fontSize: '12px', color: skin.FAINT }}>{m.sub}</Typography>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  )
}

/* ── behaviour: safety marks ─────────────────────────────────────────────── */

/** Danger as five pips — the column is an ordinal and says so. Warm only past the midpoint:
 *  a two-of-five drawn in the alarm colour would make harmless species look like a hazard. */
const DangerPips: React.FC<{ rank: number; of?: number }> = ({ rank, of = 5 }) => {
  const hot = rank >= 4 ? skin.CORAL : rank === 3 ? skin.TONE_TYPE.warn : skin.ACCENT_FILL

  return (
    <Box aria-hidden sx={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
      {Array.from({ length: of }, (_, i) => (
        <Box key={i} sx={{ height: '6px', width: '14px', borderRadius: '999px', bgcolor: i < rank ? hot : skin.TRACK }} />
      ))}
    </Box>
  )
}

/** A yes/no husbandry requirement, as a state rather than a sentence. */
const StateRow: React.FC<{ label: string; value?: string; icon: string }> = ({ label, value, icon }) => {
  if (!value) return null
  const head = gloss(value)[0]
  const yes = /^yes\b/i.test(head)
  const no = /^no\b/i.test(head)
  const tint = yes ? skin.mixOverWhite(skin.ACCENT_FILL, 0.12) : no ? '#f2f1ee' : skin.mixOverWhite(skin.ACCENT_FILL, 0.07)
  const ink = yes ? skin.ACCENT_INK : no ? skin.FAINT : skin.INK2

  return (
    <Box component='li' sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, py: 2.5, listStyle: 'none' }}>
      <Box sx={{ mt: '1px', width: 24, height: 24, flexShrink: 0, display: 'grid', placeItems: 'center', borderRadius: '7px', bgcolor: tint }}>
        <Icon icon={icon} fontSize='0.85rem' color={ink} />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={LABEL_SX}>{label}</Typography>
        <Typography sx={{ fontSize: VALUE_PX, fontWeight: 600, color: skin.VALUE }}>{head}</Typography>
      </Box>
    </Box>
  )
}

/* ── reproduction, as a lifecycle ────────────────────────────────────────── */

/** Two phases with birth between them: gestation/incubation run TO the event, weaning and
 *  independence FROM it — one left-to-right axis would put them on a timeline they don't share.
 *  Post-birth steps are ordered by their own day counts so the arrow never contradicts them. */
const Lifecycle: React.FC<{
  origin?: string
  pre?: { label: string; value: string }
  node: string
  post: { label: string; value: string; days: number }[]
}> = ({ origin, pre, node, post }) => {
  const steps = [
    ...(pre ? [{ ...pre, kind: 'pre' as const }] : []),
    { label: node, value: '', kind: 'node' as const },
    ...post.map(s => ({ label: s.label, value: s.value, kind: 'post' as const }))
  ]
  if (steps.length < 2) return null

  return (
    <Box>
      {origin && (
        <Typography sx={{ mb: 4, fontSize: VALUE_PX, fontWeight: 600, color: skin.VALUE }}>{gloss(origin)[0]}</Typography>
      )}
      {/* The connector is ONE line behind the whole run, so it can't fall out of step. */}
      <Box component='ol' sx={{ position: 'relative', display: 'flex', flexWrap: 'wrap', rowGap: 4, m: 0, p: 0 }}>
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            top: '7px',
            left: 8,
            right: 8,
            height: '1px',
            display: 'none',
            '@media (orientation: landscape)': { display: 'block' },
            bgcolor: skin.mixOverWhite(skin.ACCENT_FILL, 0.28)
          }}
        />
        {steps.map(s => (
          <Box
            component='li'
            key={s.label}
            sx={{
              position: 'relative',
              minWidth: 0,
              flex: 1,
              flexBasis: '46%',
              listStyle: 'none',
              '@media (orientation: landscape)': { flexBasis: 0 }
            }}
          >
            <Box
              aria-hidden
              sx={{
                width: 15,
                height: 15,
                borderRadius: '50%',
                bgcolor: '#ffffff',
                border: `3px solid ${s.kind === 'node' ? skin.ACCENT_FILL : skin.mixOverWhite(skin.ACCENT_FILL, 0.45)}`
              }}
            />
            <Typography
              sx={{
                mt: 2,
                pr: 3,
                fontSize: '12px',
                fontWeight: s.kind === 'node' ? 600 : 500,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: s.kind === 'node' ? skin.ACCENT_INK : skin.FAINT
              }}
            >
              {s.label}
            </Typography>
            {/* Birth is an instant — the empty slot keeps its height so the row stays one baseline. */}
            <Typography
              aria-hidden={s.value ? undefined : true}
              sx={{ fontSize: VALUE_PX, fontWeight: 600, lineHeight: 1.3, fontVariantNumeric: 'tabular-nums', color: skin.VALUE, whiteSpace: 'pre' }}
            >
              {s.value || ' '}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

/* ── diet: three ranges on one axis ──────────────────────────────────────── */

/** "20-35%" is a husbandry tolerance — a bar that STARTS where the range starts. A bar from
 *  zero would state a quantity; this states an interval. Unparseable values print as text. */
const RangeBar: React.FC<{ label: string; value?: string }> = ({ label, value }) => {
  if (!value) return null
  const m = /(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/.exec(value)
  const lo = m ? Number(m[1]) : undefined
  const hi = m ? Number(m[2]) : undefined
  const ok = lo !== undefined && hi !== undefined && hi > lo && hi <= 100

  return (
    <Box component='li' sx={{ py: 2.5, listStyle: 'none' }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 3 }}>
        <Typography sx={{ fontSize: BODY_PX, color: skin.INK }}>{label}</Typography>
        <Typography sx={{ flexShrink: 0, fontSize: BODY_PX, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: skin.VALUE }}>
          {value}
        </Typography>
      </Box>
      {ok && (
        <Box aria-hidden sx={{ mt: 1.5, height: '6px', width: '100%', borderRadius: '999px', bgcolor: skin.TRACK }}>
          <Box sx={{ ml: `${lo}%`, width: `${hi! - lo!}%`, height: '100%', borderRadius: '999px', bgcolor: skin.ACCENT_FILL }} />
        </Box>
      )}
    </Box>
  )
}

/* ── scores ──────────────────────────────────────────────────────────────── */

type Score = [number, number]

/** A score against its OWN denominator: a 1–5 judgement is five segments (it has five possible
 *  answers), budget's 0–20 is a continuous track (twenty segments is a dotted line). Printed as
 *  "4 / 5", never "80%" — these are ordinal judgements, and a species does not have 80% of a
 *  stress risk. */
const ScoreRow: React.FC<{ label: string; score: Score }> = ({ label, score }) => {
  const [value, outOf] = score
  const segmented = outOf <= 6
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, outOf)) * 100))

  return (
    <Box component='li' sx={{ display: 'flex', alignItems: 'center', gap: 3, py: 2, listStyle: 'none' }}>
      <Typography sx={{ minWidth: 0, flex: 1, fontSize: BODY_PX, color: skin.INK }} noWrap>
        {label}
      </Typography>
      {segmented ? (
        <Box aria-hidden sx={{ display: 'flex', flexShrink: 0, alignItems: 'center', gap: '3px' }}>
          {Array.from({ length: outOf }, (_, i) => (
            <Box key={i} sx={{ height: '7px', width: '13px', borderRadius: '999px', bgcolor: i < value ? skin.ACCENT_FILL : skin.TRACK }} />
          ))}
        </Box>
      ) : (
        <Box aria-hidden sx={{ height: '7px', width: 84, flexShrink: 0, overflow: 'hidden', borderRadius: '999px', bgcolor: skin.TRACK }}>
          <Box sx={{ height: '100%', width: `${pct}%`, borderRadius: '999px', bgcolor: skin.ACCENT_FILL }} />
        </Box>
      )}
      <Typography sx={{ width: 46, flexShrink: 0, textAlign: 'right', fontSize: BODY_PX, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: skin.VALUE }}>
        {value}
        <Box component='span' sx={{ fontSize: '12px', color: skin.FAINT }}>
          {' / '}
          {outOf}
        </Box>
      </Typography>
    </Box>
  )
}

const ScoreGroup: React.FC<{ heading: string; items: { label: string; score?: Score }[] }> = ({ heading, items }) => {
  const present = items.filter((i): i is { label: string; score: Score } => !!i.score)
  if (!present.length) return null

  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ ...LABEL_SX, mb: 2 }}>{heading}</Typography>
      <Box component='ul' sx={{ display: 'flex', flexDirection: 'column', m: 0, p: 0 }}>
        {present.map(i => (
          <ScoreRow key={i.label} label={i.label} score={i.score} />
        ))}
      </Box>
    </Box>
  )
}

/* ── standing ────────────────────────────────────────────────────────────── */

/** IUCN and CITES as a status strip. The Red List entry is looked up by NAME (the column's own
 *  wording); the DOT carries the published colour and the type stays legible ink. */
const StandingStrip: React.FC<{ status?: string; cites?: string }> = ({ status, cites }) => {
  if (!status && !cites) return null
  const head = status ? gloss(status)[0] : undefined
  const entry = head ? skin.RED_LIST.find(c => c.name.toLowerCase() === head.toLowerCase()) : undefined

  const items = [
    status && { key: 'iucn', label: 'IUCN Red List', value: status, swatch: entry?.fill, outline: entry?.outline, code: entry?.code },
    cites && { key: 'cites', label: 'CITES', value: cites }
  ].filter(Boolean) as { key: string; label: string; value: string; swatch?: string; outline?: string; code?: string }[]

  return (
    <Surface>
      <Sub label='Conservation standing' icon='mdi:shield-alert-outline' first>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', rowGap: 5, columnGap: 6, '@media (orientation: landscape)': { gridTemplateColumns: 'repeat(3, 1fr)' } }}>
          {items.map(it => (
            <Box key={it.key} sx={{ minWidth: 0 }}>
              <Typography sx={LABEL_SX}>{it.label}</Typography>
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                {it.swatch !== undefined && (
                  <Box
                    aria-hidden
                    sx={{
                      width: 11,
                      height: 11,
                      flexShrink: 0,
                      borderRadius: '50%',
                      bgcolor: it.swatch,
                      boxShadow: it.outline ? `inset 0 0 0 1px ${it.outline}` : undefined
                    }}
                  />
                )}
                <Typography sx={{ minWidth: 0, fontSize: VALUE_PX, fontWeight: 600, color: skin.VALUE }}>
                  {gloss(it.value)[0]}
                </Typography>
                {it.code && (
                  <Box
                    component='span'
                    sx={{
                      flexShrink: 0,
                      borderRadius: '999px',
                      px: 1.5,
                      fontSize: '12px',
                      fontWeight: 600,
                      bgcolor: skin.mixOverWhite(skin.ACCENT_FILL, 0.1),
                      color: skin.ACCENT_INK
                    }}
                  >
                    {it.code}
                  </Box>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      </Sub>
    </Surface>
  )
}

/* ── the tab ─────────────────────────────────────────────────────────────── */

const ProfileTab: React.FC<ProfileTabProps> = ({ profile, header }) => {
  const p = profile || {}

  if (!profile) {
    return (
      <Surface>
        <Sub label='Profile' icon='mdi:shimmer' first>
          <Typography sx={{ fontSize: BODY_PX, color: skin.MUTED }}>
            No reference biology is recorded for this species.
          </Typography>
        </Sub>
      </Surface>
    )
  }

  // The vital signs are whichever this species HAS — a bird and a mammal each keep their own
  // biology without borrowing the other's.
  const vitals = [
    { label: 'Weight', value: mass(p.avgWeightG), sub: 'avg · adult' },
    { label: 'Lifespan', value: years(p.lifespanYears), sub: 'avg · adult' },
    { label: 'Birth weight', value: mass(p.birthWeightG), sub: 'avg · neonate' },
    { label: 'Clutch / litter', value: decimal(p.clutchLitterSize), sub: 'avg' },
    { label: 'Maturity', value: years(p.maturityAgeYears), sub: 'avg' }
  ].filter((v): v is { label: string; value: string; sub: string } => Boolean(v.value)).slice(0, 5)

  // Lifecycle: pre-birth phase named by whichever column the species has.
  const post = [
    { label: 'Weaning', raw: p.weaningAgeDays },
    { label: 'Independence', raw: p.independenceDays }
  ]
    .map(s => ({ label: s.label, value: days(s.raw), days: num(s.raw) }))
    .filter((s): s is { label: string; value: string; days: number } => Boolean(s.value) && s.days !== undefined)
    .sort((a, b) => a.days - b.days)

  const pre = p.gestationDays
    ? { label: 'Gestation', value: days(p.gestationDays)! }
    : p.incubationDays
      ? { label: 'Incubation', value: days(p.incubationDays)! }
      : undefined
  const node = p.incubationDays && !p.gestationDays ? 'Hatch' : 'Birth'

  const danger = rankOf(p.dangerLevel)

  // Scores against their OWN denominators: the judgements are 1–5, budget is 0–20.
  const score = (v?: number, outOf = 5): Score | undefined => (typeof v === 'number' ? [v, outOf] : undefined)

  const range = (p.nativeCountries || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* 1 · THE OPENING STATEMENT. */}
      <VitalStrip items={vitals} />

      {/* 2–4 · WHAT THIS ANIMAL IS. One surface, differently-shaped blocks. */}
      <Surface pad='lg'>
        {any(p.sexualDimorphism, p.sexIdMethod, p.recommendedIdMethod) && (
          <Sub label='Physical & identification' icon='mdi:ruler' first>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 5, columnGap: 6, '@media (orientation: landscape)': { gridTemplateColumns: 'repeat(3, 1fr)' } }}>
              <ValueBlock label='Sexual dimorphism' value={str(p.sexualDimorphism)} />
              <ValueBlock label='Sex ID method' value={str(p.sexIdMethod)} />
              <ValueBlock label='Recommended ID' value={str(p.recommendedIdMethod)} />
            </Box>
            {p.sexIdDescription && (
              <Typography sx={{ mt: 3, fontSize: BODY_PX, lineHeight: 1.6, color: skin.MUTED }}>
                {p.sexIdDescription}
              </Typography>
            )}
          </Sub>
        )}

        {any(
          p.activityPattern,
          p.socialStructure,
          p.habitatZone,
          p.communicationType,
          p.migrationPattern,
          p.dangerLevel,
          p.canBeHandled,
          p.venomousPoisonous
        ) && (
          <Sub
            label='Behaviour'
            icon='mdi:weather-night'
            first={!any(p.sexualDimorphism, p.sexIdMethod, p.recommendedIdMethod)}
          >
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 5, columnGap: 6, '@media (orientation: landscape)': { gridTemplateColumns: 'repeat(3, 1fr)' } }}>
              <ValueBlock label='Activity pattern' value={str(p.activityPattern)} icon='mdi:weather-night' />
              <ValueBlock label='Social structure' value={str(p.socialStructure)} icon='mdi:account-group-outline' />
              <ValueBlock label='Habitat zone' value={str(p.habitatZone)} icon='mdi:map-marker-outline' />
              <ValueBlock label='Communication' value={str(p.communicationType)} icon='mdi:bullhorn-outline' />
              <ValueBlock label='Migration' value={str(p.migrationPattern)} icon='mdi:compass-outline' />
            </Box>

            {/* Safety, as a quiet inset — a different shape from the trait grid because "how it
                lives" and "how close you may get" are read at different moments. */}
            {any(p.dangerLevel, p.canBeHandled, p.venomousPoisonous) && (
              <Box sx={{ mt: 5, borderRadius: '12px', p: 4, bgcolor: '#faf9f7', border: `1px solid ${skin.HAIR}` }}>
                {p.dangerLevel && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', columnGap: 4, rowGap: 1, pb: 1 }}>
                    <Typography sx={LABEL_SX}>Danger level</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                      <Typography sx={{ fontSize: VALUE_PX, fontWeight: 600, color: skin.VALUE }}>
                        {gloss(unranked(p.dangerLevel))[0]}
                      </Typography>
                      {danger !== undefined && <DangerPips rank={danger} />}
                    </Box>
                  </Box>
                )}
                <Box component='ul' sx={{ display: 'flex', flexDirection: 'column', m: 0, p: 0, '@media (orientation: landscape)': { flexDirection: 'row', gap: 8 } }}>
                  <StateRow label='Handling' value={str(p.canBeHandled)} icon='mdi:heart-outline' />
                  <StateRow label='Venom / poison' value={str(p.venomousPoisonous)} icon='mdi:shield-alert-outline' />
                </Box>
              </Box>
            )}
          </Sub>
        )}

        {any(
          p.reproductionType,
          p.gestationDays,
          p.incubationDays,
          p.weaningAgeDays,
          p.independenceDays,
          p.matingSystem,
          p.parentalCare,
          p.littersPerYear
        ) && (
          <Sub label='Reproductive biology' icon='mdi:egg-outline'>
            <Lifecycle origin={str(p.reproductionType)} pre={pre} node={node} post={post} />
            {any(p.matingSystem, p.parentalCare, decimal(p.littersPerYear)) && (
              <Box
                sx={{
                  mt: 5,
                  pt: 4,
                  borderTop: `1px solid ${skin.HAIR}`,
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  rowGap: 5,
                  columnGap: 6,
                  '@media (orientation: landscape)': { gridTemplateColumns: 'repeat(3, 1fr)' }
                }}
              >
                <ValueBlock label='Mating system' value={str(p.matingSystem)} />
                <ValueBlock label='Parental care' value={str(p.parentalCare)} />
                <ValueBlock label='Litters per year' value={decimal(p.littersPerYear)} />
              </Box>
            )}
          </Sub>
        )}
      </Surface>

      {/* 5 · CARE REQUIREMENTS. */}
      <GroupRule label='Care requirements' />

      <Surface pad='lg'>
        {any(p.dietCategory, p.feedingFrequency, p.dailyKcal, p.proteinPct, p.fatPct, p.fiberPct, p.caPRatio) && (
          <Sub label='Dietary requirements' icon='mdi:barley' first>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6, '@media (orientation: landscape)': { flexDirection: 'row', gap: 10 } }}>
              <Box sx={{ minWidth: 0, flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 5, columnGap: 6 }}>
                <ValueBlock label='Diet' value={str(p.dietCategory)} />
                <ValueBlock label='Feeding frequency' value={str(p.feedingFrequency)} />
                <ValueBlock label='Daily energy' value={num(p.dailyKcal) ? `${num(p.dailyKcal)!.toLocaleString()} kcal` : undefined} />
              </Box>
              {any(p.proteinPct, p.fatPct, p.fiberPct, p.caPRatio) && (
                <Box sx={{ minWidth: 0, '@media (orientation: landscape)': { width: '46%' } }}>
                  <Typography sx={{ ...LABEL_SX, mb: 2 }}>Composition · share of diet</Typography>
                  <Box component='ul' sx={{ display: 'flex', flexDirection: 'column', m: 0, p: 0 }}>
                    <RangeBar label='Protein' value={str(p.proteinPct)} />
                    <RangeBar label='Fat' value={str(p.fatPct)} />
                    <RangeBar label='Fibre' value={str(p.fiberPct)} />
                  </Box>
                  {p.caPRatio && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${skin.HAIR}`, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 3 }}>
                      <Typography sx={{ fontSize: BODY_PX, color: skin.INK }}>Ca : P ratio</Typography>
                      <Typography sx={{ fontSize: BODY_PX, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: skin.VALUE }}>
                        {p.caPRatio}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Sub>
        )}

        {any(p.enclosureTypeRequired, p.iucnHabitatDetail, p.substrateType, p.uvLightRequired, p.waterFeatureRequired) && (
          <Sub label='Habitat & enclosure' icon='mdi:home-outline'>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6, '@media (orientation: landscape)': { flexDirection: 'row', gap: 10 } }}>
              <Box sx={{ minWidth: 0, flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 5, columnGap: 6 }}>
                <ValueBlock label='Enclosure type' value={str(p.enclosureTypeRequired)} />
                <ValueBlock label='IUCN habitat' value={str(p.iucnHabitatDetail)} />
                <ValueBlock label='Substrate' value={str(p.substrateType)} />
              </Box>
              <Box component='ul' sx={{ minWidth: 0, m: 0, p: 0, '@media (orientation: landscape)': { width: '46%' } }}>
                <StateRow label='UV light' value={str(p.uvLightRequired)} icon='mdi:weather-sunny' />
                <StateRow label='Water feature' value={str(p.waterFeatureRequired)} icon='mdi:water-outline' />
              </Box>
            </Box>
          </Sub>
        )}

        {/* Welfare describes the animal's requirement; captive-care our position on meeting it.
            Read together, each against its OWN denominator. */}
        <Sub label='Scores' icon='mdi:chart-timeline-variant' aside='judgements out of 5 · budget out of 20'>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', rowGap: 6, columnGap: 10, '@media (orientation: landscape)': { gridTemplateColumns: '1fr 1fr' } }}>
            <ScoreGroup
              heading='Welfare needs'
              items={[
                { label: 'Intelligence', score: score(p.intelligenceScore) },
                { label: 'Activity', score: score(p.activityNeedsScore) },
                { label: 'Social', score: score(p.socialNeedsScore) },
                { label: 'Space', score: score(p.spaceNeedsScore) },
                { label: 'Stress risk', score: score(p.stressRiskScore) }
              ]}
            />
            <ScoreGroup
              heading='Captive-care'
              items={[
                { label: 'Size', score: score(p.sizeScore) },
                { label: 'Need', score: score(p.needScore) },
                { label: 'Conservation priority', score: score(p.conservationPriority) },
                { label: 'Visitor appeal', score: score(p.visitorAppeal) },
                { label: 'Budget', score: score(p.budgetScore, 20) }
              ]}
            />
          </Box>
        </Sub>
      </Surface>

      {/* 6 · NATIVE RANGE. */}
      {range.length > 0 && (
        <Surface pad='lg'>
          <Sub label='Native range' icon='mdi:map-marker-outline' first aside={`${range.length} places`}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
              {range.map((c, i) => (
                <Box
                  key={i}
                  component='span'
                  sx={{
                    borderRadius: '999px',
                    px: 3,
                    py: 1,
                    fontSize: BODY_PX,
                    fontWeight: 500,
                    bgcolor: skin.mixOverWhite(skin.ACCENT_FILL, 0.09),
                    color: skin.ACCENT_INK
                  }}
                >
                  {c}
                </Box>
              ))}
            </Box>
          </Sub>
        </Surface>
      )}

      {/* 7 · CONSERVATION STANDING. */}
      <StandingStrip status={header?.iucnStatus} cites={header?.citesAppendix} />

      {/* 8 · ABOUT THIS SPECIES — prose last, reference figures first. */}
      {any(p.description, p.iconicTrait, p.culturalSignificance, p.visitorTip, ...(p.funFact || [])) && (
        <Surface pad='lg'>
          <Sub label='About this species' icon='mdi:script-text-outline' first>
            {p.description && (
              <Typography sx={{ fontSize: BODY_PX, lineHeight: 1.7, color: skin.INK2 }}>{p.description}</Typography>
            )}
            {any(p.iconicTrait, p.culturalSignificance, p.visitorTip, ...(p.funFact || [])) && (
              <Box sx={{ mt: 5, pt: 4, borderTop: `1px solid ${skin.HAIR}`, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {(
                  [
                    ['Iconic trait', p.iconicTrait],
                    ...(p.funFact || []).map(f => ['Fun fact', f] as [string, string]),
                    ['Cultural significance', p.culturalSignificance],
                    ['Visitor tip', p.visitorTip]
                  ] as [string, string | undefined][]
                )
                  .filter((x): x is [string, string] => typeof x[1] === 'string' && x[1] !== '')
                  .map(([label, text], i) => (
                    <Typography key={`${label}-${i}`} sx={{ fontSize: BODY_PX, lineHeight: 1.7, color: skin.INK2 }}>
                      <Box component='span' sx={{ fontWeight: 600, color: skin.INK }}>
                        {label}.{' '}
                      </Box>
                      {text}
                    </Typography>
                  ))}
              </Box>
            )}
          </Sub>
        </Surface>
      )}

      {/* External references — ours; the CC source has no equivalent. */}
      {p.links && p.links.length > 0 && (
        <Surface pad='lg'>
          <Sub label='External references' icon='mdi:open-in-new' first>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
              {p.links.map((l, i) => (
                <a key={i} href={l.url} target='_blank' rel='noreferrer' style={{ textDecoration: 'none' }}>
                  <Pill label={l.label} icon='mdi:open-in-new' />
                </a>
              ))}
            </Box>
          </Sub>
        </Surface>
      )}

      {/* Subspecies note — the lineage itself already lives in the hero. */}
      {header?.subspecies && (
        <Typography sx={{ fontSize: '12px', color: skin.FAINT }}>ssp. {header.subspecies}</Typography>
      )}
    </Box>
  )
}

export default ProfileTab
