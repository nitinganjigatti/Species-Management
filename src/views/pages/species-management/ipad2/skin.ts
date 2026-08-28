// ═══════════════════════════════════════════════════════════════════════════════
// iPad 2 SKIN — the Command Centre design language, lifted verbatim from
// /Users/nitin/Project/command-centre-Naveen (src/index.css + src/exec/system.tsx).
// This file is the ONE place iPad 2's look is decided; every ipad2 component reads
// from here instead of hardcoding. Values that overlap the antz theme (#37bd69,
// #006d35, #dae7df, …) stay theme-token reads at call sites; this file carries what
// the antz theme does NOT have (warm ink ramp, hairline, sage ground, emerald hero,
// motion curve). Fonts stay Inter by direction (2026-08-26) — CC's Figtree/Nunito
// split is intentionally NOT ported; numerals still get tabular-nums everywhere.
// ═══════════════════════════════════════════════════════════════════════════════

/** Warm near-black ink ramp — CC types EVERYTHING in these, never pure black. */
export const INK = '#1c1a16' // primary text
export const INK2 = '#3d3a34' // headings, section titles
export const MUTED = '#5c574f' // secondary body, list meta
export const FAINT = '#736e67' // notes, units, captions, table headers
export const VALUE = '#2f2424' // figures / numbers (warm)
export const HERO_INK = '#08100C' // hero figures only (green-black)

/** Surfaces & separation. Cards are white on the sage ground with a hairline —
 *  CC has essentially NO card shadows (five shadows in the whole app). */
export const GROUND = '#e7f0ea' // the sage page ground
export const HAIR = '#f0efec' // the universal hairline / border
export const CARD_RADIUS = '16px' // CC steps 16→20 by container; iPad uses 16
export const TRACK = '#dae7df' // unfilled meters/bars (= antz SurfaceVariant)
export const GRID = 'rgba(0,0,0,0.05)' // chart gridlines (neutral05)

/** Accent duality (CC's load-bearing rule): brand brights are FILLS ONLY;
 *  any accent that is also type/stroke wears the deep ink. */
export const ACCENT_FILL = '#37bd69' // = antz primary.main
export const ACCENT_INK = '#006d35' // = antz primary.dark — THE accent text ink

/** Semantic tones — split between type and marks on purpose (brand amber/error
 *  fail contrast at caption sizes). */
export const TONE_TYPE = { good: '#006d35', warn: '#b45309', bad: '#dc2626', neutral: '#44544a' } as const
export const TONE_FILL = { good: '#37bd69', warn: '#e4b819', bad: '#e93353', neutral: '#839d8d' } as const
export const TONE_SOFT = { good: '#e1f9ed', warn: '#fcf4ae', bad: '#ffd3d3', neutral: '#dae7df' } as const

/** Categorical series ramp (CVD-ordered) — for genuinely unlike categories only;
 *  default chart palette is lightness steps of ONE accent. */
export const SERIES = ['#006d35', '#00abab', '#1f415b', '#e4b819', '#00afd6', '#fa6140', '#e93353', '#839d8d'] as const

/** Lightness-step helper — CC flattens over white (mix), never uses opacity,
 *  so stacked marks stay crisp. step(0)=full accent, then 0.66, 0.46, … */
const STEPS = [1, 0.66, 0.46, 0.31, 0.2, 0.13]
export const mixOverWhite = (hex: string, a: number): string => {
  const n = parseInt(hex.slice(1), 16)
  const ch = (shift: number) => Math.round(((n >> shift) & 255) * a + 255 * (1 - a))

  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')}`
}
export const step = (accent: string, i: number) => mixOverWhite(accent, STEPS[i] ?? 0.1)

/** Fill → stroke/type pairing (CC's `strokeOf`): when an accent must be drawn thin
 *  or written as text, it swaps to its deep ink partner. */
export const STROKE_OF: Record<string, string> = {
  '#37bd69': '#006d35',
  '#00d6c9': '#1f515b',
  '#00abab': '#1f515b',
  '#e4b819': '#8a6d00',
  '#fa6140': '#b8360f',
  '#00afd6': '#1f415b'
}
export const strokeOf = (fill: string): string => STROKE_OF[fill.toLowerCase()] ?? fill

/** The species hero — the ONE dark surface in the language. The tab rail's active
 *  pill (#2f6449) and its icons (#8fd6ae) are matched to this ramp: move together. */
export const HERO_RAMP = 'linear-gradient(145deg, #3e7d5d 0%, #2f6449 52%, #245239 100%)'
export const HERO_MID = '#2f6449' // sliding tab pill
export const HERO_ON = '#eef8f1' // mint-white — title & figures on the hero
export const HERO_SOFT = '#c8e2d1' // binomial, badge text
export const HERO_MUTE = '#b4d4c0' // labels, sub-figures, lineage
export const HERO_MINT = '#8fd6ae' // stat icons, active-tab icon
export const HERO_HAIR = 'rgba(255,255,255,0.2)' // only separation on the hero
export const HERO_GLASS = 'rgba(255,255,255,0.16)' // pills & back button on the hero
export const HERO_SHADOW = '0 3px 18px rgba(15,42,30,0.10)' // the hero's own lift

/** The species-detail BANNER (Figma 23:371, approved 2026-08-27) — its own gradient
 *  and semantic figure inks (all three inks = existing antz theme tokens). */
export const BANNER_GRAD = 'linear-gradient(161.38deg, #25774d 0%, #0a4d29 71.43%)'
// Same ramp at 90% — laid over the species photo so it ghosts through the banner.
export const BANNER_GRAD_SCRIM = 'linear-gradient(161.38deg, rgba(37,119,77,0.9) 0%, rgba(10,77,41,0.9) 71.43%)'
export const BANNER_YELLOW = '#ffe86e' // = antz customColors.antzNotes80 — Animals
export const BANNER_GREEN = '#52f990' // = antz customColors.PrimaryContainer — Male / Female
export const BANNER_TEAL = '#00d6c9' // = antz customColors.Secondary — Site / Enclosure
export const BANNER_CELL = 'rgba(0,0,0,0.10)' // stat-cell wash over the gradient
export const BANNER_CELL_HAIR = 'rgba(255,255,255,0.10)' // divider between cells
export const BANNER_PHOTO_SHADOW = '7px 4px 54px 0 rgba(0,0,0,0.25)' // photo card lift
export const BANNER_PHOTO_SCRIM = 'rgba(0,0,0,0.40)' // wash over the photo

/** The five shadows CC allows — nothing else casts. */
export const SHADOW_LIFT = '0 1px 2px rgba(15,42,30,0.06)'
export const SHADOW_RAISED = '0 10px 30px rgba(20,40,30,0.14)'
export const SHADOW_TIP = '0 8px 24px rgba(8,16,12,0.28)' // chart tooltip
export const SHADOW_MODAL = '0 24px 70px rgba(15,18,16,0.22)' // sheets / modals
export const TAB_TRACK_INSET = 'inset 0 0 0 1px rgba(31,81,91,0.07)' // tab-strip track stroke

/** Motion — CC's house curve; no springs, no overshoot. */
export const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
export const DUR_FAST = '130ms' // press / hover
export const DUR_STD = '220ms' // content changing in place
export const DUR_EMPH = '320ms' // a surface arriving
export const DUR_REVEAL = '560ms' // a data mark drawing itself in

/** Focus ring — one value everywhere, never browser blue. */
export const FOCUS_RING = 'rgba(55,189,105,0.45)'

/** ── The species-table language (CC speciesList's page inks) ──────────────
 *  The table header is a pale teal-green (not a grey), rows separate with ONE
 *  horizontal hairline (no vertical rules), and only two figures wear colour:
 *  population/births in the list green, deaths in the soft coral. Zeros print
 *  as an em dash in the pale ink — "0 deaths" is a silence, not a finding. */
export const TABLE_HEAD_BG = '#e4efe8' // header bar fill
export const TABLE_HEAD_INK = '#4a6156' // header type — muted dark green, uppercase
export const ROW_LINE = '#eef1ee' // the one row separator
export const ROW_HOVER = '#f4f9f6' // row / option hover wash
export const CORAL = '#d4553a' // deaths & the critical figure — never the alarm red
export const LIST_GREEN = '#1f6b45' // population/births figures + filter accents
export const DASH_INK = '#a9b3ad' // the em-dash / absent-figure ink

// Banner tag hues (user-specified 2026-08-28) — the sex/chip tags under the hero strip.
export const BANNER_TAG_MALE = '#00afd6'
export const BANNER_TAG_FEMALE = '#fa6140' // = customColors.Tertiary
export const BANNER_TAG_UNSEXED = '#e93353'
export const FIELD_BG = '#f4f6f4' // the search field's quiet fill
export const RIBBON_FEMALE = '#8fd9ae' // sex ribbon: female step
export const RIBBON_UNSEXED = '#dcebe1' // sex ribbon: the pale undetermined step

/** IUCN Red List — the published fills, non-negotiable. The FILL carries the
 *  encoding; type set beside it is always readable ink (CC's contrast rule —
 *  the standard's own yellow is 1.9:1 on white). NE's published fill is WHITE,
 *  so it alone carries an outline. */
export const RED_LIST: { code: string; name: string; fill: string; outline?: string }[] = [
  { code: 'EX', name: 'Extinct', fill: '#000000' },
  { code: 'EW', name: 'Extinct in the Wild', fill: '#542344' },
  { code: 'CR', name: 'Critically Endangered', fill: '#D81E05' },
  { code: 'EN', name: 'Endangered', fill: '#FC7F3F' },
  { code: 'VU', name: 'Vulnerable', fill: '#F9E814' },
  { code: 'NT', name: 'Near Threatened', fill: '#CCE226' },
  { code: 'LC', name: 'Least Concern', fill: '#60C659' },
  { code: 'DD', name: 'Data Deficient', fill: '#D1D1C6' },
  { code: 'NE', name: 'Not Evaluated', fill: '#ffffff', outline: '#c8c3ba' },
  { code: 'NC', name: 'Not Checked', fill: '#B7B7B7' }
]

/** card-press — CC's universal pressed feel (asymmetric on purpose). */
export const cardPressSx = {
  transition: `transform ${DUR_STD} ${EASE}`,
  '&:active': { transform: 'scale(0.98)', transitionDuration: DUR_FAST }
} as const

/** The canonical CC card: white on sage, hairline, 16px radius, NO shadow. */
export const cardSx = {
  backgroundColor: '#ffffff',
  border: `1px solid ${HAIR}`,
  borderRadius: CARD_RADIUS,
  boxShadow: 'none'
} as const
