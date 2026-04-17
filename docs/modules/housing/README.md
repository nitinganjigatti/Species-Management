# Housing Module Documentation

## Overview

The Housing Module is the core infrastructure management system within the Antz Web Dashboard. It manages the complete zoo/facility hierarchy — from sites down to individual animals — providing tools for animal tracking, transfers, breeding management, health monitoring, and facility operations.

### Entity Hierarchy

```
Zoo (Organization)
 └── Cluster (group of sites)
      └── Site (physical location)
           └── Section (area within site)
                └── Enclosure (animal habitat)
                     └── Sub-Enclosure (nested habitat)
                          └── Animal (individual specimen)
```

## Module Location

- **Components**: `src/components/housing/`
- **Views**: `src/views/pages/housing/`
- **API Layer**: `src/lib/api/housing/`
- **Pages**: `src/pages/` (housing routes)
- **Translations**: `public/locales/en-IN/common.json` → `housing_module` namespace

## Features

### Site Management
- Site listing with search, filtering, and analytics
- Site creation, editing, and deletion
- Site-level insights (animal count, species count, section count)
- Site incharge and team management

### Section Management
- Section listing within sites
- Section CRUD with enclosure and species tracking
- Section-level food wastage analytics
- Animals under treatment tracking per section

### Enclosure Management
- Enclosure listing (section-wise and site-wise)
- Parent-child enclosure hierarchy (sub-enclosures)
- Enclosure overview with population stats
- Enclosure settings and environment configuration

### Cluster Management
- Group sites into logical clusters
- Cluster-level species and incharge views
- Add/remove sites from clusters
- Cluster insights (sites, species, animals)

### Animal Management
- **[Animal Details](./animal-details.md)** — Comprehensive animal profile with 16+ tabs
  - Overview, Taxonomy, Assessment, Notes, Journal, Medical, Mortality
  - Media, Identifiers, History, Incidents, Diet, Lineage, Offspring
  - Hospital Transfer, Incharges

### Animal Transfer System
- **[Animal Transfers](./animal-transfers.md)** — Transfer workflow with approval pipeline
  - In-house (intra-site), Inter-site, and External transfers
  - Multi-step approval workflow with status tracking
  - Transfer team and security team management
  - Transfer pass and checklist functionality

### Notes & Observations
- Entity-specific notes (site, section, enclosure, animal)
- Note types, priority levels, and tagging
- Comments and reactions on notes
- Note filtering by type, priority, creator, and tagged users

### Assessment System
- Custom assessments for all entity types (site, section, enclosure, animal)
- Configurable assessment types with measurement units
- Assessment history and summary views
- Category-based filtering

### Media Management
- Photo, document, and video uploads per entity
- Tab-based filtering by media type
- Infinite scroll pagination
- Restricted media visibility controls

### Food Wastage Tracking
- Site and section-level food wastage analytics
- Date range filtering (week, month, 3 months, 6 months, custom)
- List and graph visualization modes
- Per-section and per-enclosure breakdowns

### Staff & User Management
- User listing with access levels per entity
- Incharge assignment (site, section, enclosure, cluster)
- Role-based filtering
- Team management for transfers (transfer team, security team)

### Breeding & Lineage
- Family tree / pedigree tracking
- Breeding pair management
- Offspring records (litters for mammals, clutches/eggs for birds/reptiles)
- Fetal death tracking
- Egg status tracking with history and media

### Health & Mortality
- Mortality records with manner of death, carcass condition, carcass deposition
- Mortality revocation
- Hospital transfer tracking
- Animals under treatment listing
- Medical records integration (vaccinations, prescriptions, diagnoses)

## Component Structure

```
src/components/housing/
├── pages/                              # Page-level container components
│   ├── SiteDetailsPage.tsx             # Site detail page (13 tabs)
│   ├── SectionDetailsPage.tsx          # Section detail page (10 tabs)
│   ├── EnclosureDetailsPage.tsx        # Enclosure detail page (8 tabs)
│   ├── AnimalDetailsPage.tsx           # Animal detail page (16+ tabs)
│   └── ClustersPage.tsx               # Cluster listing and management
│
├── sites/                              # Site-specific components
│   ├── SiteListing.tsx                 # Main site listing
│   ├── sectionListing.tsx              # Sections within a site
│   ├── speciesListing.tsx              # Species within a site
│   ├── AnimalTransferListing.tsx       # Animal transfer listing
│   ├── AnimalTransferDetailsDrawer.tsx # Transfer detail drawer
│   ├── HospitalTransferListing.tsx     # Hospital transfer listing
│   ├── AnimalTreatmentListing.tsx      # Animals under treatment
│   ├── FoodWastageListing.tsx          # Food wastage data
│   ├── FoodWastageDetailsDrawer.tsx    # Food wastage detail view
│   ├── MediaListing.tsx                # Media gallery
│   ├── NotesListing.tsx                # Notes/observations
│   ├── NoteDetailsDrawer.tsx           # Note detail view
│   ├── AddNoteDrawer.tsx               # Create note
│   ├── EditNoteDrawer.tsx              # Edit note
│   ├── NoteCommentDialog.tsx           # Note comments
│   ├── NoteFilterDrawer.tsx            # Note filtering
│   ├── SelectNoteTypeDrawer.tsx        # Note type selection
│   ├── TeamsListing.tsx                # Transfer/security teams
│   ├── UsersListing.tsx                # Users with access
│   ├── InchargeListing.tsx             # Site incharges
│   ├── mortalityListing.tsx            # Mortality records
│   ├── AddMediaDrawer.tsx              # Media upload
│   ├── SearchUsersDrawer.tsx           # User search for tagging
│   ├── NotifyMembersDrawer.tsx         # Notification members
│   └── UserSearchFilterDrawer.tsx      # User search with filters
│
├── sections/                           # Section-specific components
│   ├── EnclosureListing.tsx            # Enclosures within section
│   ├── SpeciesListing.tsx              # Species within section
│   ├── MortalityListing.tsx            # Section mortality records
│   ├── MediaListing.tsx                # Section media gallery
│   └── AnimalTreatmentListing.tsx      # Section treatment listing
│
├── enclosure/                          # Enclosure-specific components
│   ├── EnclosureOverview.tsx           # Enclosure stats overview
│   ├── EnclosureWiseEnclosure.tsx      # Sub-enclosures listing
│   ├── EnclosureWiseSpecies.tsx        # Species in enclosure
│   └── MediaListing.tsx                # Enclosure media gallery
│
├── clusters/                           # Cluster components
│   ├── ClusterSites.tsx                # Sites within cluster
│   ├── ClusterSpecies.tsx              # Species across cluster
│   ├── ClusterIncharges.tsx            # Cluster incharges
│   └── AddSiteToClusterDrawer.tsx      # Add site to cluster
│
├── animals/                            # Animal detail components
│   ├── AnimalOverview.tsx              # Basic animal info
│   ├── AnimalTaxonomy.tsx              # Taxonomic classification
│   ├── AnimalAssessment.tsx            # Assessment records
│   ├── AnimalMedical.tsx               # Medical records (9 sub-tabs)
│   ├── AnimalMortality.tsx             # Mortality record
│   ├── AnimalHospitalTransfer.tsx      # Hospital transfer history
│   ├── AnimalIdentifier.tsx            # Identifiers (ID, microchip)
│   ├── AnimalMedia.tsx                 # Animal media gallery
│   ├── AnimalHistory.tsx               # Event timeline
│   ├── AnimalJournals.tsx              # Journal entries
│   ├── AnimalDiet.tsx                  # Diet and feeding
│   ├── AnimalLineage.tsx               # Family tree
│   ├── AnimalOffspring.tsx             # Offspring management
│   ├── UploadAnimalDiet.tsx            # Bulk diet upload
│   ├── journalFilter.tsx               # Journal filters
│   │
│   ├── offspring/                      # Offspring sub-components
│   │   ├── AllOffspring.tsx            # All offspring listing
│   │   ├── Litter.tsx                  # Mammal litter management
│   │   ├── LitterDrawer.tsx            # Litter detail drawer
│   │   ├── Clutch.tsx                  # Bird/reptile clutch
│   │   ├── ClutchDrawer.tsx            # Clutch detail drawer
│   │   ├── Egg.tsx                     # Individual egg listing
│   │   ├── EggCard.tsx                 # Egg display card
│   │   ├── EggDrawer.tsx               # Egg detail drawer
│   │   ├── EggStatusDrawer.tsx         # Update egg status
│   │   ├── Mortality.tsx               # Offspring mortality
│   │   ├── FetalDeath.tsx              # Fetal death records
│   │   ├── FetalDeathDrawer.tsx        # Fetal death detail
│   │   └── AddOffspringDrawer.tsx      # Add new offspring
│   │
│   ├── assessment/                     # Animal assessment sub-components
│   │   ├── AssessmentCard.tsx          # Assessment display card
│   │   ├── AssessmentHistoryCard.tsx   # Assessment history
│   │   ├── AssessmentValueDisplay.tsx  # Value with scale
│   │   ├── AssessmentScaleList.tsx     # Scale options
│   │   ├── AssessmentCategoryChips.tsx # Category filter chips
│   │   ├── TypeFilterDrawer.tsx        # Type filter drawer
│   │   ├── AddAssessmentTypeDrawer.tsx # New assessment type
│   │   ├── AddEditAssessmentDrawer.tsx # Add/edit assessment
│   │   └── AssessmentSummaryDrawer.tsx # Assessment summary
│   │
│   ├── AnimalIncidents/                # Incident management
│   │   ├── index.tsx                   # Main incidents page
│   │   ├── CreateMissingIncident.tsx   # Report missing animal
│   │   ├── MissReportIncidentForm.tsx  # Missing report form
│   │   ├── ReportFoundForm.tsx         # Report found form
│   │   └── IncidentDetailsCard.tsx     # Incident display
│   │
│   └── lineage/                        # Lineage sub-components
│       ├── AddParentDrawer.tsx         # Add parent to tree
│       ├── AddPairDrawer.tsx           # Create breeding pair
│       ├── ParentListDrawer.tsx        # Manage parents
│       ├── MultiSelectAnimalDrawer.tsx # Multi-animal selection
│       ├── ExternalAnimalDetailsDialog.tsx # External animal info
│       ├── LineageEntityFilter.tsx     # Entity filter
│       └── LineageFilterDrawer.tsx     # Advanced filtering
│
├── common/                             # Shared housing components
│   └── assessment/                     # Entity assessment (site/section/enclosure)
│       ├── EntityAssessment.tsx        # Assessment tab component
│       ├── AddEditEntityAssessmentDrawer.tsx
│       ├── EntityAssessmentSummaryDrawer.tsx
│       └── AddEntityAssessmentTypeDrawer.tsx
│
└── utils/                              # Reusable drawer components
    ├── AnimalDrawer.tsx                # Animal selection drawer
    ├── SpeciesDrawer.tsx               # Species selection drawer
    ├── EnclosureDrawer.tsx             # Enclosure selection drawer
    ├── SectionsDrawer.tsx              # Section selection drawer
    ├── InchargeDrawer.tsx              # Incharge selection drawer
    ├── InchargeRoleFilterDrawer.tsx    # Role filter for incharges
    └── HospitalTransferDrawer.tsx      # Hospital transfer drawer
```

## View Structure

```
src/views/pages/housing/
├── utils/
│   ├── CustomDrawer.tsx                # Reusable drawer base
│   ├── ListingHeader.tsx               # Listing header with title and count
│   ├── TabsWithMenu.tsx                # Tabs with overflow menu
│   └── SiteListingCard.tsx             # Site card for listings
│
├── SectionCard.tsx                     # Section display card
├── AddSectionDrawer.tsx                # Section create/edit form
├── AddSiteDrawer.tsx                   # Site create/edit form
├── HousingSpeciesCard.tsx              # Species card with stats
├── SpeciesInnerCard.tsx                # Species card for drawers
├── AddEnclosureDrawer.tsx              # Enclosure create/edit form
├── EnclosureCard.tsx                   # Enclosure display card
├── AddCluster.tsx                      # Cluster create/edit form
├── SelectedSites.tsx                   # Selected sites for cluster
│
├── AnimalDetailsCard.tsx               # Animal basic details card
├── EnclosureDetailsCard.tsx            # Animal's enclosure details
├── AnimalQRCard.tsx                    # Animal QR code card
├── AnimalMortalityEditDrawer.tsx       # Edit mortality record
├── AnimalRevokeDrawer.tsx              # Revoke mortality
├── AnimalDetailsHistory.tsx            # Animal history timeline
└── AddIdentifierDrawer.tsx             # Add animal identifier
```

## API Structure

```
src/lib/api/housing/
├── index.ts          # Barrel exports and type definitions
├── site.ts           # Site CRUD, analytics, team management
├── section.ts        # Section CRUD, analytics, treatment lists
├── enclosure.ts      # Enclosure CRUD, stats, settings
├── cluster.ts        # Cluster CRUD, site assignment
├── animal.ts         # Animal CRUD, identifiers, incidents, mortality, diet, journals
├── common.ts         # Species, mortality, media, users, incharges, permissions
├── observation.ts    # Notes/observations CRUD, templates, comments, reactions
├── transfer.ts       # Animal transfer CRUD, approval workflow, logs, comments
├── lineage.ts        # Family tree, breeding pairs, offspring, clutches, eggs
└── foodWastage.ts    # Food wastage data retrieval and analytics
```

### Key API Functions by Domain

| Domain | File | Key Functions |
|--------|------|---------------|
| Sites | `site.ts` | `getAllSites()`, `AddNewSite()`, `editSite()`, `deleteSite()`, `getSiteAnalytics()` |
| Sections | `section.ts` | `getAllSections()`, `addSection()`, `editSection()`, `deleteSection()`, `getSectionAnalytics()` |
| Enclosures | `enclosure.ts` | `getAllEnclosures()`, `addEnclosureToHousing()`, `editEnclosure()`, `deleteEnclosure()`, `getEnclosureWiseStat()` |
| Clusters | `cluster.ts` | `getClusterList()`, `addCluster()`, `editCluster()`, `deleteCluster()`, `assignSitesToCluster()` |
| Animals | `animal.ts` | `getAllAnimalList()`, `getAnimalDetailsOverview()`, `getAnimalHistory()`, `getAnimalMedia()` |
| Mortality | `animal.ts` | `getAnimalMortalityReport()`, `editAnimalMortality()`, `revokeAnimalMortality()` |
| Identifiers | `animal.ts` | `getAnimalIdentifier()`, `addAnimalIdentifier()`, `editAnimalIdentifier()` |
| Incidents | `animal.ts` | `getAnimalIncidentList()`, `createAnimalIncident()`, `updateAnimalIncident()` |
| Species | `common.ts` | `getAllSpeciesList()`, `getMortalityList()` |
| Media | `common.ts` | `getAllMedia()`, `addMedia()` |
| Users | `common.ts` | `getAllUsers()`, `getUsersList()`, `getInchargeList()`, `addIncharge()` |
| Notes | `observation.ts` | `getAllNotes()`, `createObservation()`, `editObservation()`, `addObservationComment()` |
| Transfers | `transfer.ts` | `getAnimalTransferList()`, `getTransferSummary()`, `approveTransferRequest()`, `rejectTransferRequest()` |
| Lineage | `lineage.ts` | `getLineageParents()`, `addLineagePair()`, `getClutchList()`, `getLitterList()`, `getEggDetails()` |
| Food Wastage | `foodWastage.ts` | `getFoodWastage()`, `getEnclosureFoodWastage()`, `getFoodWastageDetails()` |

## Permissions Reference

| Permission Key | Description | Affects |
|----------------|-------------|---------|
| `housing_view_insights` | View analytics and statistics | Site/Section/Enclosure insights cards |
| `housing_add_enclosure` | Create new enclosures | Add enclosure button |
| `housing_add_section` | Create new sections | Add section button |
| `manage_cluster_permission` | Manage clusters (ADD/EDIT/DELETE) | Cluster CRUD operations |
| `collection_animal_records` | View/manage animal records | Species tab, animal details |
| `access_mortality_module` | View mortality records | Mortality tab |
| `approval_move_animal_external` | Approve animal transfers | Transfer and hospital transfer tabs |
| `medical_records` | View medical records | Medical tab in animal details |
| `diet_module` | View diet information | Diet tab in animal details |

### Settings Dependencies

| Setting Key | Description | Affects |
|-------------|-------------|---------|
| `ANIMAL_TRANSFER_REQUIRES_APPROVAL` | Enable transfer approval workflow | Teams tab visibility |
| `ANIMAL_TRANSFER_REQUIRES_SECURITY_APPROVAL` | Enable security approval step | Security team sub-tab |
| `LAB_LIMS_REQUIRED` | Lab LIMS integration | Config tab visibility |

## Navigation Routes

| Page | Route | Description |
|------|-------|-------------|
| Site Listing | `/housing/sites` | All sites listing |
| Site Details | `/housing/sites/[id]` | Site detail with tabs |
| Section Details | `/housing/sections/[id]` | Section detail with tabs |
| Enclosure Details | `/housing/enclosure/[id]` | Enclosure detail with tabs |
| Animal Details | `/housing/animals/[id]` | Animal detail with tabs |
| Clusters | `/housing/clusters` | Cluster listing |

## Available Documentation

1. **[Animal Details](./animal-details.md)** — Animal detail page with 16+ tabs, medical records, and breeding management
2. **[Animal Transfers](./animal-transfers.md)** — Transfer workflow, approval pipeline, and status management
3. **[Site Details Tabs](../../housing/site-details-tabs.md)** — Detailed tab-by-tab implementation guide with APIs and permissions

## Key Technologies

- **React / Next.js v15**: UI framework and routing
- **MUI v7**: Component library (DataGrid, Tabs, Drawers, Typography)
- **React Query v5**: Server state management and caching
- **React Hook Form + Yup**: Form management and validation
- **React Hot Toast**: User notifications
- **ApexCharts / Recharts**: Food wastage and analytics charts
- **Lodash**: Utility functions (debounce, etc.)
- **react-i18next**: Internationalization
- **Iconify (mdi: prefix)**: Icons throughout the module

## Development Guidelines

### Adding New Features
1. Place business logic components in `src/components/housing/`
2. Place pure UI templates in `src/views/pages/housing/`
3. Create API functions in the relevant file under `src/lib/api/housing/`
4. Add translation keys under `housing_module` in `public/locales/en-IN/common.json`
5. Document new features in this documentation folder

### Component-View Separation
- **Components** (`src/components/housing/`): Contain API calls, React Query hooks, state management, event handlers, and toast notifications
- **Views** (`src/views/pages/housing/`): Pure templates — accept props, render JSX, no API calls or side effects
- Components with their own API logic (drawers, modals) belong in `components/`, not `views/`

### State Management
- Use React Query for server state (API data fetching, caching, pagination)
- Use local state (`useState` / `useReducer`) for UI state (tabs, drawers, filters)
- No Redux usage within the housing module

### Error Handling
- Use `react-hot-toast` for success/error notifications
- Handle API errors gracefully with fallback empty states
- Check entity permissions before rendering tabs and actions

### Performance Patterns
- Infinite scroll pagination for large lists (animals, species, media, notes)
- `useMemo` / `useCallback` for expensive computations and stable references
- Debounced search inputs (500ms default via Lodash `debounce`)
- Conditional tab rendering based on permissions

### UI Patterns
- Tab-based detail pages with `TabsWithMenu` for overflow handling
- Infinite scrolling drawers for entity selection
- `CommonTable` (MUI DataGrid) for tabular listings with pagination
- Insight cards with actionable drill-down for analytics
- Breadcrumb navigation for hierarchy traversal

## Related Documentation

- [Site Details Tabs](../../housing/site-details-tabs.md) — Tab-by-tab implementation guide
- [Animal Details](./animal-details.md) — Animal profile documentation
- [Animal Transfers](./animal-transfers.md) — Transfer workflow documentation
- [Component Library](../../component-library/README.md) — Shared component reference
- [API Documentation](../../api/API_DOCUMENTATION_INDEX.md) — API reference index
