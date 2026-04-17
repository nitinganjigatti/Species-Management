# Hospital Dashboard - Design Documentation

## Overview

The Hospital Dashboard provides a centralized view of all veterinary hospital operations, patient statuses, clinical insights, and staff workload. It is designed to be the primary landing page for the hospital module, giving veterinarians and hospital administrators an at-a-glance summary of critical information.

## Design Files

- **Pencil Design**: `/.pencil/hospital-dashboard.pen` (4 design variants)
- **HTML Prototype**: `.superdesign/design_iterations/hospital_dashboard_1.html`

## Data Sources (APIs)

| Section | API Source | File |
|---------|-----------|------|
| Stat Cards (Inpatients, Incoming, etc.) | `getHospitalPatients`, `getIncomingPatients`, `getFollowUpPatientsListings`, `getPatientsMortalityListings` | `src/lib/api/hospital/inpatient.js`, `incomingPatient.js` |
| Critical Patients | `getHospitalPatients` (filtered by health status) | `src/lib/api/hospital/inpatient.js` |
| Health Status Overview | `updateAnimalHealthStatus`, patient health status field | `src/lib/api/hospital/inpatient.js` |
| Prescription Administration | `getPrescriptions`, `administerDose` stats | `src/lib/api/hospital/prescription.js` |
| Admission vs Discharge Trends | `getHospitalPatients` with date range filters | `src/lib/api/hospital/inpatient.js` |
| Visit Type Distribution | `case_type` field from patient records | `src/lib/api/hospital/inpatient.js` |
| Top Complaints | `getSymptomsList`, `getSymptomsListForAdding` | `src/lib/api/hospital/symptoms.js` |
| Top Diagnoses | `getDiagnosisList`, `getClinicalAssessments` | `src/lib/api/hospital/clinicalAssessment.js` |
| Recent Inpatients | `getHospitalPatients` (latest admissions) | `src/lib/api/hospital/inpatient.js` |
| Recent Admissions | `getIncomingPatients`, `admitHospitalPatient` | `src/lib/api/hospital/incomingPatient.js` |
| Top Prescribed Medications | `getPrescriptions` (aggregated by medicine) | `src/lib/api/hospital/prescription.js` |
| Veterinarian Caseload | `getHospitalStaff` with patient counts | `src/lib/api/hospital/staff.js` |
| Parameters Monitored | `getTreatmentMonitoringData` | `src/lib/api/hospital/treatmentMonitoring.js` |
| Surgeries Performed | `getPatientSurgeryList` | `src/lib/api/hospital/surgeryMaster.js` |

## Theme Colors

All colors are sourced from `src/layouts/UserThemeOptions.js`:

| Token | Hex | Usage |
|-------|-----|-------|
| Primary | `#37BD69` | Main accent, stable status, progress bars |
| Primary Dark | `#006D35` | Dark green accents, chart bars |
| Secondary | `#00AEA4` | Teal accents, incoming stats, medication bars |
| Secondary Dark | `#1F415B` | Dark teal text, male gender badge |
| Tertiary | `#FA6140` | Emergency badges, orange accents |
| Error | `#FF4D49` | Critical status indicators |
| Error Dark | `#E93353` | Critical badges, mortality |
| Warning | `#FDB528` | Warning status, pending items |
| Warning Moderate | `#E4B819` | Follow-up, stable badges, outpatient |
| Background | `#EFF5F2` | Page body background |
| Surface | `#F2FFF8` | Card hover, surface color |
| Paper | `#FFFFFF` | Card backgrounds |
| On Background | `#E1F9ED` | Stat card backgrounds, inpatient badge bg |
| Table Header | `#C1D3D0` | DataGrid column header background |
| Text Primary | `#44544A` | Primary text (OnSurfaceVariant) |
| Text Secondary | `#7A8684` | Secondary text (neutralSecondary) |
| Outline | `#839D8D` | Table cell borders |
| Outline Variant | `#C3CEC7` | Card borders, dividers |
| Error Container | `#FFD3D3` | Critical badge bg, female gender badge |
| Secondary Container | `#AFEFEB` | Male gender badge, stat card bg |
| Tertiary Container | `#FFBDA8` | Emergency badge bg, surgery stat bg |
| Notes Yellow | `#FCF4AE` | Follow-up stat card bg |
| Card Shadow | `#4C4E6438` | Card elevation shadow |

## Reusable Components

### AnimalCard

Based on `src/views/utility/AnimalCard.js`. Used in all patient listing tables.

**Structure:**
```
Container (flex row, gap: 16px)
  Avatar Column (flex column, gap: 10px, centered)
    Main Avatar (44x44, circular)
    Gender Badge (24x24, borderRadius: 4px)
  Details Column (flex column, gap: 2px)
    Local Identifier / AID (16px, weight 600)
    Common Name (16px, weight 600)
    Scientific Name (13px, weight 500, italic)
```

**Gender Badge Colors:**
| Gender | Background | Text Color |
|--------|-----------|------------|
| Male | `#AFEFEB` (SecondaryContainer) | `#1F415B` (OnSecondaryContainer) |
| Female | `#FFD3D3` (AntzTertiary) | `#4A0415` |
| Undetermined | `#DDEBE9` (displaybgSecondary) | `#E93353` (Error) |
| Group | `#00AFD6` (addPrimary) | `#FFFFFF` |

### StatCard (CardStatisticsHorizontal)

Based on `src/@core/components/card-statistics/card-stats-horizontal/index.js`.

**Structure:**
```
Card (white, rounded 10px, card-shadow)
  CardContent (flex row, gap: 16px, aligned center)
    Avatar (48x48, rounded 8px, colored background)
      Icon (28x28)
    Info Column
      Value (22px, weight 600, Geist Mono)
      Label (14px, weight 400, Inter)
```

**Stat Card Backgrounds:**
| Stat | Avatar Background |
|------|------------------|
| Inpatients | `#E1F9ED` |
| Incoming | `#AFEFEB` |
| Discharged | `#E1F9ED` |
| Follow-up | `#FCF4AE` |
| Mortality | `#FFD3D3` |
| Parameters | `#AFEFEB` |
| Surgeries | `#FFBDA8` |

### Visit Type Badges

Based on `src/views/pages/hospital/utility/hospitalSnippets.js`.

**Style:** `fontSize: 11px, fontWeight: 500, letterSpacing: 1px, borderRadius: 4px, padding: 4px 8px`

| Type | Background | Text Color |
|------|-----------|------------|
| INPATIENT | `#E1F9ED` | `#37BD69` |
| EMERGENCY | `#FFBDA84D` | `#FA6140` |
| OUTPATIENT | `#FCF4AE4D` | `#E4B819` |
| Follow-up | `#E1F9ED` | `#006D35` |
| Check up | `#AFEFEB4D` | `#00AFD6` |

## Dashboard Sections

### 1. Header Bar
- Fixed at top with white background and bottom border
- Hospital icon (green rounded square) + title + subtitle
- Hospital selector dropdown + date badge

### 2. Stat Cards Row (5 cards)
- **Inpatients** (47) - Currently admitted patients
- **Incoming** (12) - Pending admission
- **Discharged** (8) - Released today
- **Follow-up** (15) - Due this week
- **Mortality** (3) - This month

### 3. Parameters + Surgeries Row (2 cards)
- **Parameters Monitored** (128) - Treatment monitoring data points
- **Surgeries Performed** (14) - With "3 scheduled today" subtitle

### 4. Critical Patients Table
- Red dot indicator + "Requires Attention" badge
- Table with AnimalCard, Complaint, Doctor, Admitted, Status columns
- Rows have red-tinted backgrounds for critical, yellow for warning

### 5. Health Status Overview (Radial Gauges)
- 4 radial progress rings: Stable (82), Critical (12), Recovering (18), Observation (5)
- Colors: Green, Red, Orange, Blue

### 6. Prescription Administration
- Linear progress bar (68% complete)
- Stats: Overdue (8, red), Pending (66, yellow), Completed (156, green)

### 7. Admission vs Discharge Trends (Area Chart)
- 30-day area/line chart
- Teal line for admissions, green line for discharges
- Gradient fill under curves
- Export + Filter action buttons

### 8. Visit Type Distribution (Donut Chart)
- Routine 44% (teal), Emergency 25% (orange), Follow-up 19% (yellow), Transfer 12% (purple)
- Center shows total (85)

### 9. Top Complaints (Ranked List)
- Numbered badges with colored backgrounds
- Right-aligned count numbers
- Items: Respiratory Distress (8), Loss of Appetite (6), Lethargy/Weakness (5), Limping/Lameness (4), Skin Irritation (3)

### 10. Top Diagnoses (Ranked List)
- Same pattern as complaints
- Items: Fracture/Trauma (7), Bacterial Infection (6), Parasitic Infestation (5), Dermatitis (4), Pneumonia (3)

### 11. Recent Inpatients Table
- Full-width table with AnimalCard in first column
- Columns: Animal Name & ID, Complaint, Doctor, Admitted, Status
- Status badges: Critical (red), Stable (yellow), Recovery (green)

### 12. Recent Admissions Table
- Similar structure to Recent Inpatients
- Visit Type column instead of Status (INPATIENT, EMERGENCY, OUTPATIENT)
- Includes timestamp with time

### 13. Top Prescribed Medications (Horizontal Bar Chart)
- ApexCharts horizontal bar style (borderRadius: 10 on right end)
- Teal bars (`#00AEA4`)
- Items: Amoxicillin (85), Ketoprofen (72), Ivermectin (65), Dexamethasone (50), Vitamin B Complex (43), Metronidazole (38)

### 14. Veterinarian Caseload (Horizontal Bar Chart)
- Green bars (`#37BD69`)
- Items: Dr. Sharma (28), Dr. Patel (24), Dr. Kumar (21), Dr. Singh (16), Dr. Reddy (14)

## Design Variants

### Variant 1 - Full Width Stacked
- Traditional top-to-bottom layout
- Full-width sections with side-by-side pairs
- Most detailed, includes all tables with 5 rows each
- Best for: Detailed data review, larger screens

### Variant 2 - Compact Grid
- 7 stat cards in a single row
- 3-column chart row (Health Status + Trends + Visit Type)
- Critical patients as compact cards alongside complaints/diagnoses
- 3-column bottom (Prescription + Medications + Caseload)
- Best for: Quick overview, less scrolling

### Variant 3 - Hero Banner
- Dark green (`#006D35`) header banner with embedded translucent stat cards
- 2-column body: charts on left, critical patients + lists on right
- Full-width tables at bottom
- Best for: Visual impact, executive presentation

### Variant 4 - Bento Grid
- Large colored number stat cards (numbers are primary visual element)
- 3-column asymmetric grid fitting charts, lists, and status together
- Compact card-based layout
- Best for: Information density, single-screen overview

## Card Styling Pattern

All cards follow the app's MUI Card pattern:

```css
background: #FFFFFF;
border-radius: 10px;
box-shadow: 0px 2px 10px 0px #4C4E6438;
padding: 24px;
```

No borders on cards - elevation through shadow only.

## Table Styling Pattern

Follows `src/views/table/data-grid/CommonTable.js`:

```css
/* Container */
border: 1px solid rgba(233, 233, 236, 1);
border-radius: 8px;

/* Header */
background-color: #C1D3D0;
min-height: 56px;
font-weight: 500;
color: #44544A;

/* Cells */
border-bottom: 0.5px solid #839D8D;

/* Row Hover */
background-color: #F2FFF8;
box-shadow: 0px 1px 8px 0px #0000001A;
```

## Typography

| Element | Font | Size | Weight | Color |
|---------|------|------|--------|-------|
| Page Title | Inter | 20px | 600 | `#44544A` |
| Card Title | Inter | 20px | 500 | `#44544A` |
| Section Title | Inter | 16px | 500 | `#44544A` |
| Stat Value | Geist Mono | 22px | 600 | `#44544A` |
| Stat Label | Inter | 14px | 400 | `#44544A` |
| Body Text | Inter | 14px | 400 | `#44544A` |
| Secondary Text | Inter | 14px | 400 | `#7A8684` |
| Table Header | Inter | 14px | 500 | `#44544A` |
| Badge Text | Inter | 11-13px | 500 | varies |
| Mono Data | Geist Mono | 12-13px | 600 | `#44544A` |

## Charts Configuration (ApexCharts)

### Horizontal Bar Charts
```javascript
plotOptions: {
  bar: {
    horizontal: true,
    borderRadius: 10,
    borderRadiusApplication: 'end',
    barHeight: '55-60%'
  }
}
```

### Area/Line Charts
```javascript
stroke: { curve: 'smooth', width: 3 },
fill: {
  type: 'gradient',
  gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05 }
},
markers: { size: 4, colors: ['#fff'], strokeWidth: 2 }
```

### Donut Charts
```javascript
plotOptions: {
  pie: {
    donut: {
      size: '65%',
      labels: { show: true, total: { show: true } }
    }
  }
},
stroke: { width: 3, colors: ['#fff'] }
```

### Radial Bar Charts
```javascript
plotOptions: {
  radialBar: {
    hollow: { size: '30%' },
    track: { background: '#DAE7DF' }
  }
}
```

## Implementation Notes

1. **State Management**: Use `HospitalContext` (`src/context/HospitalContext.js`) for selected hospital and stats
2. **Grid Layout**: Use MUI `Grid container spacing={6}` (24px gaps) matching the pharmacy dashboard pattern
3. **Chart Library**: Use `react-apexcharts` (already installed in the project)
4. **Table Component**: Use `CommonTable` (`src/views/table/data-grid/CommonTable.js`) for patient listings
5. **AnimalCard**: Reuse `src/views/utility/AnimalCard.js` in table `renderCell`
6. **Visit Type Badges**: Reuse `VisitType` from `src/views/pages/hospital/utility/hospitalSnippets.js`
7. **API Base URL**: `https://api.dev.antzsystems.com/api/`
8. **Route**: Proposed at `/hospital/dashboard/`
