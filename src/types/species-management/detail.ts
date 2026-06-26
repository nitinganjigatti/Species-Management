/**
 * Species Management — detail page data model.
 *
 * Modeled on the wildventure prototype's detail responses (one endpoint per tab).
 * Captures ALL fields the prototype surfaces so no data point is missed. Optional throughout
 * because tabs lazy-load and the backing endpoints may populate incrementally.
 */

/* ------------------------------------------------------------------ Header / hero */

export interface SpeciesDetailHeader {
  speciesId: number
  commonName: string
  scientificName: string
  image?: string
  class?: string
  order?: string
  family?: string
  genus?: string
  subspecies?: string
  endemic?: boolean
  iucnStatus?: string
  iucnTrend?: string
  citesAppendix?: string
  // stats strip
  total?: number
  males?: number
  females?: number
  unsexed?: number
  sites?: number
  enclosures?: number
  pairs?: number
  sexedPct?: number
  chippedPct?: number
  ringedPct?: number
  sexRatio?: string
  births?: number
  deaths?: number
  netChange?: number
  femalesBredPct?: number
}

/* ------------------------------------------------------------------ Profile */

export interface SpeciesProfile {
  // narrative
  description?: string
  iconicTrait?: string
  funFact?: string[]
  culturalSignificance?: string
  visitorTip?: string
  // physical
  avgWeightG?: string | number
  birthWeightG?: string | number
  lifespanYears?: string | number
  sexualDimorphism?: string
  sexIdMethod?: string
  sexIdDescription?: string
  // behavioral
  activityPattern?: string
  socialStructure?: string
  habitatZone?: string
  communicationType?: string
  migrationPattern?: string
  dangerLevel?: string
  canBeHandled?: string
  venomousPoisonous?: string
  // reproductive
  reproductionType?: string
  matingSystem?: string
  parentalCare?: string
  gestationDays?: string | number
  incubationDays?: string | number
  clutchLitterSize?: string | number
  weaningAgeDays?: string | number
  independenceDays?: string | number
  maturityAgeYears?: string | number
  littersPerYear?: string | number
  // diet & nutrition
  dietCategory?: string
  feedingFrequency?: string
  dailyKcal?: string | number
  proteinPct?: string
  fatPct?: string
  fiberPct?: string
  caPRatio?: string
  // habitat & enclosure
  iucnHabitatDetail?: string
  enclosureTypeRequired?: string
  substrateType?: string
  uvLightRequired?: string
  waterFeatureRequired?: string
  // welfare scores (0-10)
  intelligenceScore?: number
  activityNeedsScore?: number
  socialNeedsScore?: number
  spaceNeedsScore?: number
  stressRiskScore?: number
  // captive-care scores (0-10)
  budgetScore?: number
  sizeScore?: number
  needScore?: number
  conservationPriority?: number
  visitorAppeal?: number
  // range
  nativeCountries?: string
  recommendedIdMethod?: string
  // external links
  links?: { label: string; url: string }[]
}

/* ------------------------------------------------------------------ Housing / Pairing */

export interface EnclosureBreed {
  name: string
  male: number
  female: number
  unsexed: number
}

export interface HousingEnclosure {
  name: string
  section?: string
  male: number
  female: number
  unsexed: number
  total: number
  pairs: number
  type: string // classification label (Breeding Ready - Balanced, Lone Male, etc.)
  breeds?: EnclosureBreed[]
}

export interface HousingSite {
  name: string
  enclosures: HousingEnclosure[]
  males: number
  females: number
  unsexed: number
  total: number
  pairs: number
  chipCount?: number
}

export interface SpeciesHousing {
  sites: HousingSite[]
  nSites: number
  nEncl: number
  nPairs: number
  pairedEncl: number
  maleOnlyEncl: number
  femaleOnlyEncl: number
  unsexedOnlyEncl: number
  mixedEncl: number
}

export interface AnimalRecord {
  antzId: string
  name?: string
  site?: string
  section?: string
  enclosure?: string
  gender?: string
  idType?: string
  ring?: string
  chip?: string
  weight?: string
  age?: string
  birthDate?: string
  breed?: string
  morph?: string
  accessionType?: string
  accessionDate?: string
  org?: string
}

/* ------------------------------------------------------------------ Circle of Life */

export interface YearMonthPoint {
  label: string
  value: number
}

export interface BirthRecord {
  date: string
  site?: string
  enclosure?: string
  gender?: string
  breed?: string
}

export interface DeathRecord {
  date: string
  site?: string
  enclosure?: string
  manner?: string
  necropsy?: string
}

export interface SpeciesBirths {
  total: number
  byYearMonth: YearMonthPoint[]
  byGender: { male: number; female: number; undetermined: number }
  seasonal: YearMonthPoint[] // 12 months
  neonatalDeaths?: number
  neonatalMortRate?: number
  neonatalBuckets?: { d1: number; d7: number; d30: number; d90: number; d365: number; over365: number }
  bySite: { site: string; count: number; male: number; female: number; unsexed: number }[]
  recent: BirthRecord[]
  sexedPct?: number
}

export interface SpeciesDeaths {
  total: number
  byYearMonth: YearMonthPoint[]
  survivalBuckets?: { d7: number; d30: number; d90: number; d365: number; over365: number }
  byManner: { manner: string; count: number }[]
  seasonal: YearMonthPoint[]
  necropsyStats?: Record<string, number>
  carcassCondition?: Record<string, number>
  ageAtDeath?: { avg?: number; min?: number; max?: number; count?: number }
  byOrigin?: Record<string, number>
  avgSurvivalDays?: number
  medianSurvivalDays?: number
  bySite: { site: string; count: number; male: number; female: number; unsexed: number }[]
  recent: DeathRecord[]
}

/* ------------------------------------------------------------------ Assessments */

/** A single assessment reading (used in the per-animal drawer). */
export interface AssessmentReading {
  d: string // date (YYYY-MM-DD)
  c: string // category
  t: string // type
  v: string // raw value
  u?: string // uom
}

export interface AssessmentAnimal {
  antzId: string
  name?: string
  gender?: string
  site?: string
  enclosure?: string
  dob?: string
  ageYears?: number
  latestWeight?: number
  latestWeightDate?: string
  latestBcs?: string | number
  latestBcsDate?: string
  assessmentCount?: number
  weightCount?: number
  categories?: string[]
  weightHistory?: { d: string; v: number }[]
  bcsHistory?: { d: string; v: number }[]
  records?: AssessmentReading[]
}

/** Per-value drill: animals that recorded a given categorical/text value. */
export interface CatValueAnimal {
  id: string
  name?: string
  date?: string
}

/** Per-animal latest reading for a numeric type, with mini history + delta vs species avg. */
export interface CatNumericAnimal {
  id: string
  name?: string
  date?: string
  value: number
  pctVsAvg: number
  history?: { d: string; v: number }[]
}

/** One assessment type within a category, auto-classified by data shape. */
export type CatTypeItem =
  | {
      type: string
      display: 'numeric'
      count: number
      nAnimals: number
      uom?: string
      min: number
      max: number
      avg: number
      median: number
      animals: CatNumericAnimal[]
      changes?: { id: string; name?: string; from: number; to: number; pct: number; date?: string }[]
    }
  | {
      type: string
      display: 'distribution'
      count: number
      nAnimals: number
      values: { label: string; count: number; animals?: CatValueAnimal[] }[]
    }
  | {
      type: string
      display: 'text'
      count: number
      nAnimals: number
      nUnique: number
      top: { label: string; count: number; animals?: CatValueAnimal[] }[]
    }

/** Computed alert data (no UI yet — surfaced via a future species-level notification section). */
export interface AssessmentAlerts {
  config?: { overdueDays: number; underMon: number }
  overdue?: { antzId: string; name?: string; daysSince: number; lastWeight?: number; site?: string; priority?: string }[]
  neverWeighed?: { antzId: string; name?: string; gender?: string; site?: string; ageYears?: number }[]
  underMonitored?: { antzId: string; name?: string; weightCount: number; latestWeight?: number; site?: string }[]
  weightIncreasing?: { antzId: string; name?: string; pctChange: number; baselineWeight?: number; lookback?: string; site?: string }[]
  weightDecreasing?: { antzId: string; name?: string; pctChange: number; baselineWeight?: number; lookback?: string; site?: string }[]
}

/** An animal reference attached to a chart bucket so the bar/segment can drill into its animals. */
export interface ChartEntityRef {
  id: string
  name?: string
  value?: number
}

export interface SpeciesAssessments {
  summary: {
    totalAnimals?: number
    realAnimals?: number
    totalRecords?: number
    avgWeight?: number
    avgAge?: number
    weightCoverage?: number
    bcsCoverage?: number
    categories?: Record<string, number>
    dateRange?: { from: string; to: string }
  }
  animals: AssessmentAnimal[]
  weightDistribution?: { label: string; count: number; items?: ChartEntityRef[] }[]
  bcsDistribution?: { label: string; count: number; items?: ChartEntityRef[] }[]
  ageBands?: { label: string; count: number; avgWeight?: number; items?: ChartEntityRef[] }[]
  genderComparison?: Record<string, { count?: number; avgWeight?: number; avgBcs?: number; items?: ChartEntityRef[] }>
  highlights?: {
    heaviest?: { name: string; weight: number }
    lightest?: { name: string; weight: number }
    oldest?: { name: string; age: string }
    youngest?: { name: string; age: string }
  }
  /** category name → list of typed items (the dynamic engine). */
  catDetail?: Record<string, CatTypeItem[]>
  alerts?: AssessmentAlerts
}

/* ------------------------------------------------------------------ Eggs (egg-laying species only) */

/** Egg lifecycle state — mirrors the antz egg module's egg_status × egg_state model. */
export type EggState = 'received' | 'in_nest' | 'in_incubation' | 'hatched' | 'to_be_discarded' | 'discarded'

export const EGG_STATE_LABEL: Record<EggState, string> = {
  received: 'Received',
  in_nest: 'In the Nest',
  in_incubation: 'In Incubation',
  hatched: 'Hatched',
  to_be_discarded: 'To Be Discarded',
  discarded: 'Discarded'
}

export interface SpeciesEgg {
  eggCode: string // AEID-style system code
  eggNumber: string // UEID-style user identifier
  state: EggState
  condition: string // Fresh / Fertile / Infertile / Cracked / Rotten / Dead-in-shell
  collectionDate: string
  layDate?: string
  hatchedDate?: string
  weight?: number // grams
  shellThickness?: number // mm
  site?: string
  enclosure?: string
  nursery?: string
  clutchId?: string
  // Parentage is enclosure-derived and often uncertain. When the enclosure holds multiple
  // candidates of a sex, EVERY one is a "probable" parent (mirrors the egg module's ProbableParent).
  // `*KnownId` is set only when a single candidate makes the parent certain.
  probableMothers?: { antzId: string; name: string }[]
  motherKnownId?: string
  probableFathers?: { antzId: string; name: string }[]
  fatherKnownId?: string
  discardReason?: string
  necropsy?: boolean
  daysSinceCollection?: number
  history?: { date: string; state: EggState; note?: string }[]
}

export interface SpeciesEggs {
  isEggLayer: boolean
  eggs: SpeciesEgg[]
  summary: { total: number; byState: Record<EggState, number> }
  // distinct facet values present, for the filter UI
  sites: string[]
  enclosures: string[]
  conditions: string[]
}

/* ------------------------------------------------------------------ Medical */

export interface MedicalAnimalEvent {
  id: number | string
  name?: string
  site?: string
  enclosure?: string
  status?: string
  scheduledQty?: number
  qtyAdministered?: number
  wastageQty?: number
  unit?: string
  closedAt?: string
}

export interface MedicalDateEvent {
  date: string
  count: number
  status?: string
  active?: number
  closed?: number
  sites?: string[]
  animals: MedicalAnimalEvent[]
}

/** Vaccination / Deworming — medicine-first. */
export interface MedicineGroup {
  name: string
  dosageTypes?: string[]
  avgScheduledQty?: number
  avgWastage?: number
  unit?: string
  completed: number
  pending: number
  upcoming: number
  neverGivenCount?: number
  sites?: string[]
  dateEvents: MedicalDateEvent[]
}

export interface SpeciesMedication {
  summary: {
    uniqueMedicines?: number
    completed?: number
    pending?: number
    upcoming?: number
    uniqueAnimals?: number
    totalAnimals?: number
    neverTreated?: number
  }
  medicines: MedicineGroup[]
  neverTreated: { id: number | string; name?: string; sex?: string; site?: string; enclosure?: string }[]
}

/** Complaints / Diagnosis — type-first. */
export interface ConditionGroup {
  name: string
  active: number
  closed: number
  animals: number
  avgResolutionDays?: number
  dateEvents: MedicalDateEvent[]
}

export interface SpeciesConditions {
  summary: {
    uniqueTypes?: number
    active?: number
    closed?: number
    uniqueAnimals?: number
    totalAnimals?: number
    closureRate?: number
  }
  items: ConditionGroup[]
}

/* ------------------------------------------------------------------ Identification */

export interface SpeciesIdentification {
  idTypes: { type: string; count: number }[]
  total: number
  siteCoverage?: { site: string; pct: number }[]
}

/* ------------------------------------------------------------------ Breeds */

export interface BreedRow {
  name: string
  sites: number
  enclosures: number
  male: number
  female: number
  unsexed: number
  total: number
}

export interface SpeciesBreeds {
  breeds: BreedRow[]
  nBreeds: number
}

/* ------------------------------------------------------------------ Tabs */

export type SpeciesDetailTab =
  | 'profile'
  | 'pairing'
  | 'housing'
  | 'circle'
  | 'eggs'
  | 'assessments'
  | 'medical'
  | 'identification'
  | 'breeds'

export type MedicalSubTab = 'vaccination' | 'deworming' | 'complaints' | 'diagnosis'
export type CircleSubTab = 'births' | 'deaths' | 'lifespan'

/* ------------------------------------------------------------------ Lifecycle events */
/** A single real birth/death event (day-level), from public/species-data/lifecycle/<id>.json. */
export interface LifecycleBirth {
  d: string // YYYY-MM-DD
  aid?: string // antz_animal_id
  idn?: string // local identifier name (e.g. "Name")
  idv?: string // local identifier value (e.g. "Riley 62")
  g?: string // gender
  s?: string // site
  e?: string // enclosure
  b?: string // breed
  k?: number // animal count (omitted when 1)
}
export interface LifecycleDeath {
  d: string // YYYY-MM-DD (mortality recorded on)
  aid?: string // antz_animal_id
  idn?: string // local identifier name
  idv?: string // local identifier value
  g?: string // gender
  s?: string // site
  e?: string // enclosure
  m?: string // manner of death
  c?: string // carcass condition
  y?: string // necropsy status (Pending | Completed | NA)
  a?: number // age at death (years); omitted when no usable birth date
  k?: number // died count (omitted when 1)
}
export interface SpeciesLifecycle {
  births: LifecycleBirth[]
  deaths: LifecycleDeath[]
}
