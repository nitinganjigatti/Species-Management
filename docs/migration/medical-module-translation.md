# Medical Module — i18n Translation Pass

**Branch**: `medical-app-route`
**Scope**: Wire `react-i18next` translations into all 12 migrated medical components. Add 45 new keys to `en-IN/common.json` under the existing `medical_module` namespace.

> Follow-up to [medical-module-pages-to-app-router.md](./medical-module-pages-to-app-router.md). Only `en-IN/common.json` was populated; other locale files will be done in a follow-up pass.

---

## TL;DR

- 45 new translation keys added under `medical_module` in `public/locales/en-IN/common.json`.
- 12 medical components updated to use `useTranslation()` + `t('…')` calls instead of hardcoded English.
- Top-level keys reused where possible: `search`, `add_new`, `active`, `inactive`, `something_went_wrong`.
- Internal DataGrid `field` IDs and backend type discriminators (`type='complaints'`, etc.) left untranslated — they're not user-facing.
- Project TypeScript: 0 errors after the pass.

---

## Files Touched

### Translation file (1)
- `public/locales/en-IN/common.json` — extended the existing `medical_module` section

### Components (12)
| Component | Location |
|---|---|
| Complaints | `src/components/medical/masters/Complaints.tsx` |
| ComplaintsDetails | `src/components/medical/masters/ComplaintsDetails.tsx` |
| Diagnosis | `src/components/medical/masters/Diagnosis.tsx` |
| DiagnosisDetails | `src/components/medical/masters/DiagnosisDetails.tsx` |
| MonitorCategory | `src/components/medical/masters/MonitorCategory.tsx` |
| MonitorCategoryDetails | `src/components/medical/masters/MonitorCategoryDetails.tsx` |
| Treatment | `src/components/medical/masters/Treatment.tsx` |
| ClinicalPath | `src/components/medical/masters/ClinicalPath.tsx` |
| DeliveryRoute | `src/components/medical/masters/DeliveryRoute.tsx` |
| PurposeOfAnaesthesia | `src/components/medical/masters/PurposeOfAnaesthesia.tsx` |
| Uom | `src/components/medical/masters/Uom.tsx` |
| MedicalRecords | `src/components/medical/medicalRecords/MedicalRecord.tsx` |

---

## Pattern Applied to Every Component

```tsx
// 1. Add import
import { useTranslation } from 'react-i18next'

// 2. Call the hook inside the component
const Component = () => {
  // …other hooks
  const { t } = useTranslation()

  // 3. Use t() in place of hardcoded strings
  return <PageCardLayout title={t('medical_module.category_list')} />
}
```

---

## New Keys Added (under `medical_module`)

### Module labels
| Key | Value |
|---|---|
| `medical` | Medical |
| `category` | Category |
| `complaints` | Complaints |
| `monitor` | Monitor |
| `clin_path` | Clin Path |

### Page titles
| Key | Value |
|---|---|
| `category_list` | Category List |
| `symptoms_list` | Symptoms List |
| `diagnosis_list` | Diagnosis List |
| `uom_full` | UOM (Units Of Measurements) |

### Column headers (used by DataGrid `headerName`)
| Key | Value |
|---|---|
| `sl_no` | SL. NO |
| `no_header` | NO |
| `name_column` | NAME |
| `status_column` | STATUS |
| `action_column` | Action |
| `category_column` | Category |
| `complaints_header` | Complaints |
| `diagnosis_header` | Diagnosis |
| `uom_name` | UOM NAME |
| `uom_abbr` | UOM ABBR |
| `measurement_type` | MEASUREMENT TYPE |
| `active_assessment_type_count` | ACTIVE ASSESSMENT TYPE COUNT |
| `medical_record_id` | MEDICAL RECORD ID |
| `case_type` | CASE TYPE |
| `complaints_column` | COMPLAINTS |
| `diagnosis_column` | DIAGNOSIS |
| `prescriptions` | PRESCRIPTIONS |

### Action buttons
| Key | Value |
|---|---|
| `add_symptom` | Add Symptom |
| `add_diagnosis` | Add Diagnosis |
| `add_monitoring` | Add Monitoring |
| `add_treatment` | Add Treatment |
| `add_clin_path` | Add Clin Path |
| `add_delivery_route` | Add Delivery Route |
| `add_purpose` | Add Purpose |
| `add_uom` | Add UOM |

### Medical Records page
| Key | Value |
|---|---|
| `select_animal` | SELECT ANIMAL |
| `view_medical_records` | VIEW MEDICAL RECORDS |
| `no_animal_selected` | No Animal Selected |
| `select_animal_to_view_records` | Select an animal to view its medical records |
| `all_animals_selected` | All Animals Selected |
| `selected_animals` | Selected Animals |
| `search_by_medical_record_id` | Search by medical record ID |
| `more_count` | `+{{count}} more` _(uses i18n interpolation)_ |

### Toasts / messages
| Key | Value |
|---|---|
| `export_completed_successfully` | Export completed successfully |
| `failed_to_export_data` | Failed to export data |
| `failed_to_generate_report` | Failed to generate report |
| `failed_to_download_report` | Failed to download report |
| `report_emailed` | Report is being generated and will be sent to your email shortly. |

---

## Reused (NOT duplicated) — top-level keys

These keys already existed at the top of `common.json` and were reused across the medical components:

| Top-level key | Usage |
|---|---|
| `search` | placeholder `\`${t('search')}...\`` |
| `add_new` | "Add New" button label |
| `active` | "Active" status |
| `inactive` | "Inactive" status |
| `something_went_wrong` | generic fallback error toast |
| `category` | (top-level "Category" — not used for column headers; medical-specific `category_column` used instead) |

---

## Special Patterns

### 1. Search placeholder
```tsx
<MUISearch placeholder={`${t('search')}...`} />
```
Top-level `search` returns "Search"; we append `...` for the placeholder convention.

### 2. Status cells (Active / Inactive)
```tsx
{params.row.active === '1' ? t('active') : t('inactive')}
```

### 3. Breadcrumbs
```tsx
<DynamicBreadcrumbs
  pageItems={[
    { title: t('medical_module.medical') },
    { title: t('medical_module.category'), onClick: () => router.back() },
    { title: label } // dynamic from URL — data, not translated
  ]}
/>
```

### 4. Interpolation (only MedicalRecord.tsx)
```tsx
// Old: `+${selectedAnimals.length - 1} more`
// New: t('medical_module.more_count', { count: selectedAnimals.length - 1 })
// Key value: "+{{count}} more"
```

### 5. Default fallback titles
```tsx
<PageCardLayout title={label || t('medical_module.symptoms_list')} />
```
The dynamic `label` is preferred when present; the translated string is the fallback.

---

## What Was NOT Translated

### Intentional exclusions

- **DataGrid `field` IDs** — e.g. `field: 'Category'`, `field: 'Action'`. These are internal sort/filter identifiers, not display text.
- **Backend type discriminators** — e.g. `type='complaints'`, `type='diagnosis'`, `type='clin_path'`. These map to API keys, not labels.
- **`aria-label='Edit'`** — accessibility hint, not a user-visible string (could be translated later if needed).
- **`'N/A'` data fallbacks** in MedicalRecord.tsx — placeholder for missing data values, follows table-data convention.
- **`console.error('…')`** strings — developer logs, not user-visible.
- **Toasts using server response `message`** — e.g. `toast.success(response?.message as string)`. The backend already returns localized text.

### Out of scope (this pass)
- Shared drawer components: `src/views/pages/medical/AddCategories.js`, `DiagnosisAdd.js`, `src/views/pages/masters/AddMonitorDrawer.tsx`, `AddTreatmentMastersDrawer.tsx`, `AddClinicalPathDrawer.tsx`, `AddDeliveryRouteDrawer.tsx`, `AddPurposeOfAnaesthesiaDrawer.tsx`, `AddUOMDrawer.tsx`. These render strings like "Edit Symptoms" / "Add Diagnosis" inside the modal — to be translated in a separate follow-up.
- Other locale files: `en-US`, `hi-IN`, etc. Only `en-IN` updated in this pass.

---

## Verification

```bash
npx tsc --noEmit --skipLibCheck   # 0 errors
```

Component-level — grep confirms no remaining hardcoded display strings in any of the 12 components:

```bash
grep -rn "'NAME'\|'STATUS'\|'Add New'\|'Search\.\.\.'\|'Medical'" \
  src/components/medical/masters/ src/components/medical/medicalRecords/
# (no output — all translated)
```

---

## Follow-Up TODOs

1. **Copy keys to other locales** when those translations are needed:
   ```bash
   cp public/locales/en-IN/common.json public/locales/<lang>/common.json
   # then translate the medical_module values
   ```
2. **Translate the shared drawer components** in `src/views/pages/medical/*` and `src/views/pages/masters/*` so the Add/Edit modals show localized text.
3. **Wire translation in `layout.tsx`** if module-level loading or 404 messages are added in future.

---

## Rollback

```bash
# Revert all translation edits
git checkout HEAD -- \
  public/locales/en-IN/common.json \
  src/components/medical/masters/ \
  src/components/medical/medicalRecords/MedicalRecord.tsx
```

Components fall back to the hardcoded English they had before this pass. No functional impact — translation is purely a display-layer concern.
