'use client'

// iPad 3 Profile tab — the mobile-app "About Species" design, ported per the approved
// mockup (.superdesign/design_iterations/species_profile_5.html, locked 2026-08-31).
// Eight section cards on the sage ground, each wearing its OWN tint pair (soft tile +
// deep ink partner). The row grammar everywhere is the mobile app's:
//   grey 14px label → bold 16px value in the section ink → 14px plain-language (gloss)
// Four sections (Behaviour · Physical · Reproductive · Habitat) carry the Figma 51:639
// timeline rail — a hairline connector from the section icon with a two-ring dot per
// row — and collapse as accordions: Behaviour open by default, the rest closed.
// Landscape = two columns; portrait stacks to one (the mobile reading order).
//
// SYNTHESIZED FIELDS (no source in the sidecar, flagged 2026-08-31): group/baby names
// (class/order lookup), ID Method (chippedPct-informed), Sexuality (constant). Replace
// with real data if the sidecar ever grows these columns.

import React, { useState } from 'react'
import { Box, Collapse, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'
import * as skin from 'src/views/pages/species-management/ipad3/skin'
import type { SpeciesDetailHeader, SpeciesProfile } from 'src/types/species-management/detail'

interface ProfileTabProps {
  profile?: SpeciesProfile
  header?: SpeciesDetailHeader
}

/* ── helpers ─────────────────────────────────────────────────────────────── */

/** "Least Concern (Low Risk)" → ["Least Concern", "Low Risk"]. Trailing parenthetical only. */
const gloss = (v: string): [string, string | undefined] => {
  const m = /^(.*?)\s*\(([^()]*)\)\s*$/.exec(v)

  return m ? [m[1].trim(), m[2].trim()] : [v.trim(), undefined]
}

const str = (v?: string | number): string | undefined => (v == null || v === '' || v === '-' ? undefined : String(v))

/** Raw enums never ship — "Dimorphism_Size" → "Size Dimorphism", underscores → spaces. */
const pretty = (v?: string): string | undefined => {
  if (!v) return undefined
  const [head, g] = gloss(v)
  const cleaned = head === 'Dimorphism_Size' ? 'Size Dimorphism' : head.replace(/_/g, ' ')

  return g ? `${cleaned} (${g})` : cleaned
}

/** SYNTH — collective + juvenile nouns by order/class (the sidecar has no such columns). */
const groupBaby = (cls?: string, order?: string): { group: string; baby: string } => {
  const o = (order || '').toLowerCase()
  const c = (cls || '').toLowerCase()
  if (o === 'carnivora') return { group: 'Pack', baby: 'Pup' }
  if (o === 'primates') return { group: 'Troop', baby: 'Infant' }
  if (o === 'chiroptera' || o === 'rodentia') return { group: 'Colony', baby: 'Pup' }
  if (o === 'testudines') return { group: 'Bale', baby: 'Hatchling' }
  if (o === 'crocodylia' || o === 'crocodilia') return { group: 'Bask', baby: 'Hatchling' }
  if (o === 'anura') return { group: 'Army', baby: 'Tadpole' }
  if (c === 'aves') return { group: 'Flock', baby: 'Chick' }
  if (c === 'mammalia') return { group: 'Herd', baby: 'Calf' }
  if (c === 'reptilia') return { group: 'Den', baby: 'Hatchling' }
  if (c === 'amphibia') return { group: 'Colony', baby: 'Larva' }
  if (c.includes('pterygii') || c === 'chondrichthyes') return { group: 'School', baby: 'Fry' }

  return { group: 'Group', baby: 'Young' }
}

/* ── the section palette: soft tile + its deep-ink partner (mockup v3 pairs) ── */

type Tint = { tile: string; ink: string }

const useTints = (): Record<string, Tint> => {
  const theme = useTheme()
  const cc = theme.palette.customColors as Record<string, string>

  return {
    teal: { tile: cc.antzSecondaryBg, ink: skin.STROKE_OF['#00abab'] },
    blue: { tile: skin.mixOverWhite(skin.BANNER_TAG_MALE, 0.12), ink: skin.STROKE_OF['#00afd6'] },
    amber: { tile: skin.mixOverWhite(skin.TONE_FILL.warn, 0.13), ink: skin.STROKE_OF['#e4b819'] },
    mint: { tile: skin.TONE_SOFT.good, ink: skin.ACCENT_INK },
    sage: { tile: skin.mixOverWhite(skin.TONE_FILL.neutral, 0.12), ink: skin.TONE_TYPE.neutral }
  }
}

/* ── atoms ───────────────────────────────────────────────────────────────── */

const LABEL_SX = { fontSize: '14px', color: skin.FAINT, mb: '3px' } as const

/** One label/value tile row — value in the section ink, gloss inline in muted. */
const Row: React.FC<{ label: string; value?: string; tint: Tint }> = ({ label, value, tint }) => {
  if (!value) return null
  const [head, g] = gloss(value)

  return (
    <Box sx={{ bgcolor: tint.tile, borderRadius: '12px', px: 4, py: 3.25, '& + &': { mt: 2.5 } }}>
      <Typography sx={LABEL_SX}>{label}</Typography>
      <Typography component='span' sx={{ fontSize: '16px', fontWeight: 700, color: tint.ink }}>
        {head}
      </Typography>
      {g && (
        <Typography component='span' sx={{ fontSize: '14px', color: skin.MUTED, ml: 1.25 }}>
          ({g})
        </Typography>
      )}
    </Box>
  )
}

/** The Figma 51:639 timeline rail — connector line + two-ring dot beside every row. */
const Steps: React.FC<{ tint: Tint; children: React.ReactNode }> = ({ tint, children }) => (
  <Box
    sx={{
      position: 'relative',
      pl: '36px',
      // the connector: drops from under the section icon, stops at the last dot
      '&::before': {
        content: '""',
        position: 'absolute',
        left: '17px',
        top: '-14px',
        bottom: '26px',
        width: '2px',
        borderRadius: '1px',
        bgcolor: skin.ROW_LINE
      },
      '& > div': { position: 'relative' },
      '& > div + div': { mt: 2.5 },
      '& > div::before': {
        content: '""',
        position: 'absolute',
        left: '-27.5px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '19px',
        height: '19px',
        borderRadius: '50%',
        bgcolor: tint.tile
      },
      '& > div::after': {
        content: '""',
        position: 'absolute',
        left: '-22.5px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '9px',
        height: '9px',
        borderRadius: '50%',
        bgcolor: tint.ink
      }
    }}
  >
    {children}
  </Box>
)

/** A section card: icon chip + title; optionally an accordion (chevron, Collapse). */
const Section: React.FC<{
  tint: Tint
  icon: string
  title: string
  collapsible?: boolean
  defaultOpen?: boolean
  children: React.ReactNode
}> = ({ tint, icon, title, collapsible, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Box sx={{ ...skin.cardSx, p: 5 }}>
      <Box
        onClick={collapsible ? () => setOpen(o => !o) : undefined}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          ...(collapsible && {
            cursor: 'pointer',
            userSelect: 'none',
            WebkitTapHighlightColor: 'transparent',
            '&:hover h2': { color: skin.ACCENT_INK }
          })
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            flexShrink: 0,
            borderRadius: '50%',
            bgcolor: tint.tile,
            display: 'grid',
            placeItems: 'center'
          }}
        >
          <Icon icon={icon} fontSize='1.2rem' color={tint.ink} />
        </Box>
        <Typography component='h2' sx={{ fontSize: '18px', fontWeight: 600, color: skin.INK2 }}>
          {title}
        </Typography>
        {collapsible && (
          <Box
            sx={{
              ml: 'auto',
              display: 'flex',
              color: skin.FAINT,
              transition: `transform ${skin.DUR_STD} ${skin.EASE}`,
              transform: open ? 'rotate(180deg)' : 'none'
            }}
          >
            <Icon icon='mdi:chevron-down' fontSize='1.4rem' />
          </Box>
        )}
      </Box>
      {collapsible ? (
        <Collapse in={open} timeout={320}>
          <Box sx={{ pt: 4 }}>{children}</Box>
        </Collapse>
      ) : (
        <Box sx={{ pt: 4 }}>{children}</Box>
      )}
    </Box>
  )
}

/** A Key Attributes icon tile — white-ish tile with a tinted icon chip. */
const AttrTile: React.FC<{
  icon: string
  chipBg: string
  chipInk: string
  label: string
  value?: string
  tint: Tint
}> = ({ icon, chipBg, chipInk, label, value, tint }) => {
  if (!value) return null
  const [head, g] = gloss(value)

  return (
    <Box sx={{ bgcolor: tint.tile, borderRadius: '12px', p: 3.5 }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: '12px',
          bgcolor: chipBg,
          display: 'grid',
          placeItems: 'center',
          mb: 3
        }}
      >
        <Icon icon={icon} fontSize='1.3rem' color={chipInk} />
      </Box>
      <Typography sx={LABEL_SX}>{label}</Typography>
      <Typography sx={{ fontSize: '16px', fontWeight: 700, color: skin.INK2, lineHeight: 1.3 }}>{head}</Typography>
      {g && <Typography sx={{ fontSize: '14px', color: skin.MUTED, mt: '1px' }}>({g})</Typography>}
    </Box>
  )
}

/* ── the IUCN scale: published Red List fills, current status ringed ─────── */

// skin.RED_LIST (the published fills) reordered to the mobile app's left-to-right
// scale, plus the two regional codes the app shows that the standard list lacks.
const SCALE: { code: string; name: string; fill: string; outline?: string; darkText?: boolean }[] = [
  { code: 'NA', name: 'Not Applicable', fill: '#B7B7B7' },
  { code: 'DD', name: 'Data Deficient', fill: '#D1D1C6', darkText: true },
  { code: 'NE', name: 'Not Evaluated', fill: '#ffffff', outline: '#c8c3ba', darkText: true },
  { code: 'LC', name: 'Least Concern', fill: '#60C659' },
  { code: 'NT', name: 'Near Threatened', fill: '#CCE226', darkText: true },
  { code: 'VU', name: 'Vulnerable', fill: '#F9E814', darkText: true },
  { code: 'EN', name: 'Endangered', fill: '#FC7F3F' },
  { code: 'CR', name: 'Critically Endangered', fill: '#D81E05' },
  { code: 'RE', name: 'Regionally Extinct', fill: '#8f4a7c' },
  { code: 'EW', name: 'Extinct in the Wild', fill: '#542344' },
  { code: 'EX', name: 'Extinct', fill: '#000000' }
]

const IucnScale: React.FC<{ status?: string; tint: Tint }> = ({ status, tint }) => {
  const head = status ? gloss(status)[0] : undefined
  const current = head ? SCALE.find(c => c.name.toLowerCase() === head.toLowerCase()) : undefined

  return (
    <Box sx={{ bgcolor: tint.tile, borderRadius: '12px', p: 4 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, mb: 3.5 }}>
        {SCALE.map(c => {
          const cur = c.code === current?.code

          return (
            <Box
              key={c.code}
              sx={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                position: 'relative',
                fontSize: '13px',
                fontWeight: 700,
                bgcolor: c.fill,
                color: c.darkText ? skin.MUTED : '#ffffff',
                border: c.outline ? `1.5px solid ${c.outline}` : 'none',
                opacity: cur ? 1 : 0.42,
                ...(cur && {
                  boxShadow: `0 0 0 2px #fff, 0 0 0 4px ${skin.ACCENT_INK}`,
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    bgcolor: skin.TONE_TYPE.bad,
                    border: '2px solid #fff'
                  }
                })
              }}
            >
              {c.code}
            </Box>
          )
        })}
      </Box>
      <Box
        sx={{
          bgcolor: '#ffffff',
          border: `1px solid ${skin.HAIR}`,
          borderRadius: '10px',
          px: 4,
          py: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          fontSize: '16px',
          color: skin.INK2
        }}
      >
        IUCN&nbsp;:&nbsp;
        <Box component='b' sx={{ color: skin.ACCENT_INK, fontWeight: 700 }}>
          {head || 'Not Evaluated'}
        </Box>
        <Box sx={{ ml: 'auto', display: 'flex', color: skin.ACCENT_FILL }}>
          <Icon icon='mdi:information' fontSize='1.25rem' />
        </Box>
      </Box>
    </Box>
  )
}

/* ── the tab ─────────────────────────────────────────────────────────────── */

const ProfileTab: React.FC<ProfileTabProps> = ({ profile, header }) => {
  const theme = useTheme()
  const cc = theme.palette.customColors as Record<string, string>
  const T = useTints()

  if (!profile) {
    return (
      <Box sx={{ ...skin.cardSx, p: 5 }}>
        <Typography sx={{ fontSize: '15px', color: skin.MUTED }}>
          No reference biology is recorded for this species.
        </Typography>
      </Box>
    )
  }

  const p = profile
  const names = groupBaby(header?.class, header?.order)

  // SYNTH: ID method — chipped stock reads Microchip; otherwise the class convention.
  const idMethod =
    str(p.recommendedIdMethod) ||
    ((header?.chippedPct ?? 0) > 0
      ? 'Microchip'
      : (header?.class || '').toLowerCase() === 'aves'
        ? 'Leg Ring / Band'
        : 'Visual / Photo ID')

  const sci = header?.scientificName || ''
  const links =
    p.links && p.links.length
      ? p.links
      : [
          { label: 'IUCN Red List', url: `https://www.iucnredlist.org/search?query=${encodeURIComponent(sci)}` },
          { label: 'CITES', url: `https://checklist.cites.org/#/en/search?fullText=${encodeURIComponent(sci)}` }
        ]

  // Key Attributes chip tints (the mockup's semantic hues, all token-derived).
  const chip = {
    blue: { bg: skin.mixOverWhite(skin.BANNER_TAG_MALE, 0.16), ink: skin.STROKE_OF['#00afd6'] },
    amber: { bg: skin.TONE_SOFT.warn, ink: skin.STROKE_OF['#e4b819'] },
    green: { bg: skin.TONE_SOFT.good, ink: skin.ACCENT_INK },
    orange: { bg: cc.BgTeritary, ink: skin.STROKE_OF['#fa6140'] },
    red: { bg: skin.TONE_SOFT.bad, ink: skin.TONE_TYPE.bad }
  }

  const dangerVal = str(p.dangerLevel)
  const danger = dangerVal ? gloss(dangerVal) : undefined

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: 4,
        alignItems: 'start',
        '@media (orientation: landscape)': { gridTemplateColumns: '1fr 1fr' }
      }}
    >
      {/* ════ LEFT COLUMN ════ */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <Section tint={T.teal} icon='mdi:clipboard-text-outline' title='About Species'>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            {[
              { l: 'A Group is Called', v: names.group },
              { l: 'A Baby is Called', v: names.baby }
            ].map(n => (
              <Box key={n.l} sx={{ bgcolor: T.teal.tile, borderRadius: '12px', px: 3, py: 4, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '14px', color: skin.FAINT, mb: 1 }}>{n.l}</Typography>
                <Typography sx={{ fontSize: '18px', fontWeight: 700, color: T.teal.ink }}>{n.v}</Typography>
              </Box>
            ))}
          </Box>
        </Section>

        <Section tint={T.teal} icon='mdi:paw' title='Key Attributes'>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            <AttrTile icon='mdi:home-map-marker' chipBg={chip.blue.bg} chipInk={chip.blue.ink} label='Where It Lives' value={str(p.habitatZone)} tint={T.teal} />
            <AttrTile icon='mdi:food-drumstick' chipBg={chip.amber.bg} chipInk={chip.amber.ink} label='Diet Type' value={str(p.dietCategory)} tint={T.teal} />
            <AttrTile icon='mdi:weather-sunset' chipBg={chip.green.bg} chipInk={chip.green.ink} label='Activity Pattern' value={str(p.activityPattern)} tint={T.teal} />
            <AttrTile icon='mdi:account-group' chipBg={chip.orange.bg} chipInk={chip.orange.ink} label='Social Grouping' value={str(p.socialStructure)} tint={T.teal} />
            <AttrTile icon='mdi:heart-multiple' chipBg={chip.blue.bg} chipInk={chip.blue.ink} label='Mating Style' value={str(p.matingSystem)} tint={T.teal} />
            <AttrTile icon='mdi:alert' chipBg={chip.red.bg} chipInk={chip.red.ink} label='Venom/Poison Risk' value={str(p.venomousPoisonous)} tint={T.teal} />
            {danger && (
              <Box
                sx={{
                  gridColumn: '1 / -1',
                  bgcolor: skin.TONE_SOFT.bad,
                  borderRadius: '12px',
                  p: 3.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3.5
                }}
              >
                <Box sx={{ width: 40, height: 40, flexShrink: 0, borderRadius: '12px', bgcolor: '#ffffff', display: 'grid', placeItems: 'center' }}>
                  <Icon icon='mdi:skull' fontSize='1.3rem' color={skin.TONE_TYPE.bad} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={LABEL_SX}>Danger to Handlers</Typography>
                  <Typography component='span' sx={{ fontSize: '16px', fontWeight: 700, color: skin.TONE_TYPE.bad }}>
                    {danger[0]}
                  </Typography>
                  {danger[1] && (
                    <Typography component='span' sx={{ fontSize: '14px', color: skin.MUTED, ml: 1.25 }}>
                      ({danger[1]})
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
          </Box>
        </Section>

        <Section tint={T.mint} icon='mdi:shield-outline' title='Conservation Risk Level'>
          <IucnScale status={header?.iucnStatus} tint={T.mint} />
        </Section>
      </Box>

      {/* ════ RIGHT COLUMN ════ */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <Section tint={T.blue} icon='mdi:owl' title='Behaviour' collapsible defaultOpen>
          <Steps tint={T.blue}>
            <Row label='Communication' value={str(p.communicationType)} tint={T.blue} />
            <Row label='Migration' value={str(p.migrationPattern)} tint={T.blue} />
            <Row label='Handling Safety' value={str(p.canBeHandled)} tint={T.blue} />
          </Steps>
        </Section>

        <Section tint={T.amber} icon='mdi:timer-sand' title='Physical Attributes' collapsible defaultOpen={false}>
          <Steps tint={T.amber}>
            <Row label='Sex Difference Level' value={str(p.sexualDimorphism)} tint={T.amber} />
            <Row label='How to Identify Sex' value={pretty(p.sexIdMethod)} tint={T.amber} />
            <Row label='ID Method' value={idMethod} tint={T.amber} />
          </Steps>
        </Section>

        <Section tint={T.mint} icon='mdi:dna' title='Reproductive Biology' collapsible defaultOpen={false}>
          <Steps tint={T.mint}>
            {/* SYNTH: Sexuality — effectively universal for held species. */}
            <Row label='Sexuality' value='Sexual' tint={T.mint} />
            <Row label='How it Reproduces' value={str(p.reproductionType)} tint={T.mint} />
            <Row label='Who Raises Young' value={str(p.parentalCare)} tint={T.mint} />
          </Steps>
        </Section>

        <Section tint={T.sage} icon='mdi:home-variant-outline' title='Habitat & Enclosure' collapsible defaultOpen={false}>
          <Steps tint={T.sage}>
            <Row label='Enclosure Type' value={str(p.enclosureTypeRequired)} tint={T.sage} />
            <Row label='Substrate' value={str(p.substrateType)} tint={T.sage} />
            <Row label='Water Features' value={str(p.waterFeatureRequired)} tint={T.sage} />
            <Row label='UV Light Requirements' value={str(p.uvLightRequired)} tint={T.sage} />
          </Steps>
        </Section>

        <Section tint={T.teal} icon='mdi:link-variant' title='Reference Links'>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {links.map(l => (
              <Box
                key={l.label}
                component='a'
                href={l.url}
                target='_blank'
                rel='noreferrer'
                sx={{
                  bgcolor: T.teal.tile,
                  color: T.teal.ink,
                  borderRadius: '999px',
                  px: 4.5,
                  py: 2.25,
                  fontSize: '15px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1.75,
                  textDecoration: 'none'
                }}
              >
                <Icon icon='mdi:open-in-new' fontSize='1rem' />
                {l.label}
              </Box>
            ))}
          </Box>
        </Section>
      </Box>
    </Box>
  )
}

export default ProfileTab
