# Animal Details Page

## Overview

The Animal Details page (`AnimalDetailsPage.tsx`) is the most comprehensive detail page in the housing module, providing a complete profile of an individual animal across 16+ tabs. It serves as the central hub for viewing and managing all aspects of an animal's life — from taxonomy and health to breeding and incidents.

**Component**: `src/components/housing/pages/AnimalDetailsPage.tsx`

---

## Tab Configuration

| Tab | Component | Permission Required | Description |
|-----|-----------|---------------------|-------------|
| Overview | `AnimalOverview` | None | Basic info, enclosure details |
| Taxonomy | `AnimalTaxonomy` | None | Taxonomic classification hierarchy |
| Assessment | `AnimalAssessment` | None | Custom assessments with history |
| Notes | `NotesListing` | None | Observations and notes |
| Journal | `AnimalJournals` | None | Journal/log entries |
| Medical | `AnimalMedical` | `medical_records` | Medical records (9 sub-tabs) |
| Mortality | `AnimalMortality` | `access_mortality_module` | Death record and carcass info |
| Media | `AnimalMedia` | None | Photos, documents, videos |
| Identifier | `AnimalIdentifier` | None | ID cards, microchips, bands |
| History | `AnimalHistory` | None | Event timeline |
| Incidents | `AnimalIncidents` | None | Missing/found reports |
| Diet | `AnimalDiet` | `diet_module` | Feeding records |
| Lineage | `AnimalLineage` | None | Family tree and breeding pairs |
| Offspring | `AnimalOffspring` | None | Litters, clutches, eggs |
| Hospital Transfer | `AnimalHospitalTransfer` | None | Hospital transfer history |
| Incharges | `InchargeListing` | None | Assigned incharges |

---

## Component Architecture

### Page Container

```
AnimalDetailsPage
├── AnimalQRCard                    # QR code display
├── AnimalDetailsCard               # Basic info (species, gender, age)
├── EnclosureDetailsCard            # Current enclosure info
└── TabsWithMenu                    # Tab navigation
    ├── AnimalOverview
    ├── AnimalTaxonomy
    ├── AnimalAssessment
    │   ├── AssessmentCard
    │   ├── AssessmentCategoryChips
    │   ├── AddEditAssessmentDrawer
    │   └── AssessmentSummaryDrawer
    ├── NotesListing (reused from sites/)
    ├── AnimalJournals
    │   └── journalFilter
    ├── AnimalMedical
    │   └── Sub-tabs: Records, Diagnosis, Prescription,
    │       Complaints, Clinical Notes, Lab Requests,
    │       Vaccination, Deworming, Adverse Rx
    ├── AnimalMortality
    │   ├── AnimalMortalityEditDrawer
    │   └── AnimalRevokeDrawer
    ├── AnimalMedia
    │   └── AddMediaDrawer
    ├── AnimalIdentifier
    │   └── AddIdentifierDrawer
    ├── AnimalHistory
    │   └── AnimalDetailsHistory
    ├── AnimalIncidents
    │   ├── CreateMissingIncident
    │   ├── MissReportIncidentForm
    │   ├── ReportFoundForm
    │   └── IncidentDetailsCard
    ├── AnimalDiet
    │   └── UploadAnimalDiet
    ├── AnimalLineage
    │   ├── AddParentDrawer
    │   ├── AddPairDrawer
    │   ├── ParentListDrawer
    │   └── MultiSelectAnimalDrawer
    ├── AnimalOffspring
    │   ├── AllOffspring
    │   ├── Litter / LitterDrawer
    │   ├── Clutch / ClutchDrawer
    │   ├── Egg / EggCard / EggDrawer / EggStatusDrawer
    │   ├── Mortality (offspring)
    │   ├── FetalDeath / FetalDeathDrawer
    │   └── AddOffspringDrawer
    ├── AnimalHospitalTransfer
    └── InchargeListing
```

---

## Key API Functions

### Core Animal APIs (`src/lib/api/housing/animal.ts`)

| Function | Description |
|----------|-------------|
| `getAnimalDetailsOverview()` | Fetch animal basic info, species, gender, age, enclosure |
| `getAnimalHistory()` | Fetch event timeline for animal |
| `getAnimalMedia()` | Fetch media files (photos, documents, videos) |
| `addAnimalMedia()` | Upload media for animal |
| `getAnimalIdentifier()` | Fetch identifiers (ID card, microchip, band) |
| `addAnimalIdentifier()` | Add new identifier |
| `editAnimalIdentifier()` | Update identifier |
| `deleteAnimalIdentifier()` | Remove identifier |
| `getTaxonomyHierarchy()` | Fetch taxonomic classification |

### Medical APIs

| Function | Description |
|----------|-------------|
| `getAnimalTreatmentList()` | Active treatments |
| `getVaccinationList()` | Vaccination records |
| `getMedicineSideEffect()` | Adverse reaction records |
| `deleteMedicineSideEffect()` | Remove adverse reaction |

### Mortality APIs

| Function | Description |
|----------|-------------|
| `getAnimalMortalityReport()` | Fetch mortality record |
| `editAnimalMortality()` | Update mortality details |
| `revokeAnimalMortality()` | Cancel/revoke mortality record |
| `getMannerOfDeath()` | Fetch manner of death options |
| `getCarcassCondition()` | Fetch carcass condition options |
| `getCarcassDeposition()` | Fetch carcass disposal options |

### Incident APIs

| Function | Description |
|----------|-------------|
| `getAnimalIncidentList()` | Fetch incident records |
| `getAnimalIncidentDetails()` | Fetch incident details |
| `createAnimalIncident()` | Create missing/found incident |
| `updateAnimalIncident()` | Update incident |

### Diet & Journal APIs

| Function | Description |
|----------|-------------|
| `getAnimalDietList()` | Fetch diet records |
| `getAnimalJournalLogs()` | Fetch journal entries |
| `getAnimalJournalModules()` | Fetch available journal modules |

### Lineage APIs (`src/lib/api/housing/lineage.ts`)

| Function | Description |
|----------|-------------|
| `getLineageParents()` | Fetch parent animals |
| `getLineagePairs()` | Fetch breeding pairs |
| `addLineageParent()` | Add parent to family tree |
| `addLineagePair()` | Create breeding pair |
| `getClutchList()` | Fetch egg clutches |
| `getLitterList()` | Fetch mammal litters |
| `getOffspringStats()` | Fetch offspring statistics |
| `getEggDetails()` | Fetch individual egg info |
| `updateEggStatus()` | Change egg status |
| `getFetusList()` | Fetch fetus records |

---

## Medical Sub-Tabs

The `AnimalMedical` component provides 9 sub-tabs for comprehensive medical management:

| Sub-Tab | Description |
|---------|-------------|
| Medical Records | General medical records and treatments |
| Diagnosis | Diagnostic records |
| Prescription | Medication prescriptions |
| Complaints | Health complaints and symptoms |
| Clinical Notes | Clinical observation notes |
| Lab Requests | Laboratory test requests |
| Vaccination | Vaccination history |
| Deworming | Deworming records |
| Adverse Rx | Adverse drug reactions |

---

## Offspring Management

The offspring system supports different reproductive types:

### Mammals — Litters
- Track birth events with multiple offspring
- Record individual pup/calf details
- Link offspring to parents in lineage

### Birds/Reptiles — Clutches & Eggs
- Track clutch (group of eggs) records
- Individual egg tracking with status workflow
- Egg status: Laid → Fertile/Infertile → Hatched/Failed
- Egg media uploads and history tracking

### Fetal Deaths
- Track fetal mortality events
- Record gestational age and cause

---

## Navigation

| Action | Route |
|--------|-------|
| View animal details | `/housing/animals/[animal_id]` |
| Navigate to enclosure | `/housing/enclosure/[enclosure_id]` |
| Navigate to section | `/housing/sections/[section_id]` |
| Navigate to site | `/housing/sites/[site_id]` |

---

## Dependencies

- `AnimalDetailsCard`, `EnclosureDetailsCard`, `AnimalQRCard` from `src/views/pages/housing/`
- `TabsWithMenu` from `src/views/pages/housing/utils/`
- `InchargeDrawer` from `src/components/housing/utils/`
- `NotesListing` (reused from sites components)
- `EntityAssessment` from `src/components/housing/common/assessment/`
