# Internationalization (i18n), RTL & Localization

## Overview

The app supports **6 languages** with automatic RTL (Right-to-Left) for Arabic, single-file translations per locale, MUI component localization, and localStorage language persistence.

| Language         | Code    | Direction | Currency | Status     |
| ---------------- | ------- | --------- | -------- | ---------- |
| English (India)  | `en-IN` | LTR       | INR      | Default    |
| English (US)     | `en-US` | LTR       | USD      | Supported  |
| English          | `en`    | LTR       | USD      | Supported  |
| French           | `fr`    | LTR       | EUR      | Supported  |
| Hindi            | `hi`    | LTR       | INR      | Supported  |
| Arabic           | `ar`    | RTL       | SAR      | Supported  |

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  _app.js                                                          │
│  └── import 'src/configs/i18n'   ◄── initializes i18next          │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  ThemeComponent.js                                          │   │
│  │  ├── MUI locale (enUS, frFR, arSA) via createTheme()       │   │
│  │  └── Direction.js  ◄── RTL/LTR via stylis-plugin-rtl       │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  LanguageDropdown.js                                        │   │
│  │  ├── Shows supported languages from localeConfig.js         │   │
│  │  ├── i18n.changeLanguage(lang) → saves to localStorage      │   │
│  │  └── Auto-sets RTL direction for Arabic                     │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  Components                                                 │   │
│  │  ├── t('save')                    ◄── direct top-level key  │   │
│  │  ├── t('pharmacy_module.dashboard_title') ◄── module key    │   │
│  │  └── <Translations text="Dashboard" /> ◄── auto snake_case  │   │
│  └────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

## File Structure

### Config & Utilities

| File                                          | Purpose                                              |
| --------------------------------------------- | ---------------------------------------------------- |
| `src/configs/i18n.js`                         | i18next initialization (backend, detection, formats)  |
| `src/utility/localeConfig.js`                 | Centralized language config (codes, dirs, currencies) |
| `src/layouts/components/Translations.js`      | Navigation text component with auto snake_case keys   |

### Translation Files

All translations live in a **single `common.json` file per locale** — no separate namespace files.

```
public/locales/
  ├── en-IN/common.json     ← English (India) — default/fallback
  ├── en-US/common.json     ← English (US)
  ├── en/common.json        ← English (generic)
  ├── fr/common.json        ← French
  ├── hi/common.json        ← Hindi
  └── ar/common.json        ← Arabic
```

### Modified Core Files

| File                                                              | Change                                |
| ----------------------------------------------------------------- | ------------------------------------- |
| `src/pages/_app.js`                                               | `import 'src/configs/i18n'`           |
| `src/layouts/components/Translations.js`                          | `toSnakeCase()` for navigation keys   |
| `src/@core/layouts/.../LanguageDropdown.js`                       | Language selector with auto-RTL       |
| `src/@core/layouts/.../UserDropdown.js`                           | `t('app.logout')`, `t('app.media')`   |
| `src/views/forms/form-fields/MUIDatePicker.js`                    | Dynamic dayjs locale                  |
| `src/views/forms/form-fields/MUIDateTimePicker.js`                | Dynamic dayjs locale                  |

---

## Translation Key Structure

All keys are organized in a **flat structure** inside `common.json`:

```json
{
  // ── Top-level: shared reusable strings (no prefix needed) ──
  "add": "Add",
  "save": "Save",
  "name": "Name",
  "status": "Status",
  "date": "Date",
  "yes": "Yes",
  "no": "No",
  "male": "Male",

  // ── Metadata fields ──
  "metadata_added_by": "Added By",
  "metadata_created_on": "Created on",

  // ── Format patterns (with interpolation) ──
  "formats_date": "{{value, intlDate}}",
  "formats_currency": "{{value, currency}}",

  // ── App-level (nested object) ──
  "app": {
    "media": "Media",
    "activity_log": "Activity Log",
    "logout": "Logout"
  },

  // ── Language selector labels (nested object) ──
  "languages": {
    "en-IN": "English",
    "fr": "French",
    "hi": "Hindi",
    "ar": "Arabic"
  },

  // ── Navigation keys (snake_case, nested object) ──
  "navigation": {
    "dashboard": "Dashboard",
    "pharmacy": "Pharmacy",
    "egg_module": "Egg Module",
    "doctors_and_staffs": "Doctors & Staffs"
  },

  // ── Dashboard page ──
  "dashboard": {
    "key_insights": "Key insights",
    "animal_activity": "Animal activity",
    "today": "Today"
  },

  // ── Module sections (flat keys with page prefix) ──
  "pharmacy_module": {
    "dashboard_title": "Pharmacy Dashboard",
    "dashboard_pharmacies": "Pharmacies",
    "products_title": "Product List",
    "products_add_product": "Add Product",
    "request_all_requests_title": "All Requests",
    "tabs_pending": "Pending",
    "reports_purchase_report": "Purchase Report"
  },

  "medical_module": {
    "medical_records_title": "Medical Records",
    "symptoms": "Symptoms",
    "diagnosis": "Diagnosis"
  },

  "hospital_module": { ... },
  "lab_module": { ... },
  "diet_module": { ... },
  "egg_module": { ... },
  "housing_module": { ... },
  "necropsy_module": { ... },
  "compliance_module": { ... },
  "parivesh_module": { ... },
  "reports_module": { ... },
  "settings_module": { ... },
  "confirmation_module": { ... }
}
```

### Key Naming Rules

1. **Top-level keys** — shared strings used everywhere: `add`, `save`, `name`, `status`, `date`
2. **Module keys** — use `<module>_module` suffix: `pharmacy_module`, `medical_module`
3. **Inside modules** — flat with page prefix: `dashboard_title`, `products_add_product`
4. **All keys** use `snake_case`
5. **No nesting** inside modules — keys are flattened with `_` separator

---

## Usage Guide

### Direct access — shared strings

```jsx
import { useTranslation } from 'react-i18next'

const MyComponent = () => {
  const { t } = useTranslation()

  return (
    <div>
      <button>{t('add')}</button>          {/* → "Add" */}
      <button>{t('save')}</button>         {/* → "Save" */}
      <button>{t('cancel')}</button>       {/* → "Cancel" */}
      <label>{t('name')}</label>           {/* → "Name" */}
      <label>{t('status')}</label>         {/* → "Status" */}
      <span>{t('yes')}</span>              {/* → "Yes" */}
      <span>{t('metadata_created_on')}</span> {/* → "Created on" */}
    </div>
  )
}
```

### Module-specific strings

```jsx
const PharmacyDashboard = () => {
  const { t } = useTranslation()

  return (
    <>
      <h1>{t('pharmacy_module.dashboard_title')}</h1>
      <StatCard label={t('pharmacy_module.dashboard_total_skus')} />
      <StatCard label={t('pharmacy_module.dashboard_medicines_out_of_stock')} />

      <Table>
        <TableHead>
          <TableCell>{t('pharmacy_module.products_product_name')}</TableCell>
          <TableCell>{t('status')}</TableCell>      {/* shared */}
          <TableCell>{t('quantity')}</TableCell>     {/* shared */}
        </TableHead>
      </Table>

      <Button>{t('add_new')}</Button>                {/* shared */}
      <Button>{t('apply_filter')}</Button>           {/* shared */}
    </>
  )
}
```

### Navigation (auto snake_case)

Navigation items use the `<Translations>` component which auto-converts titles to snake_case keys:

```jsx
// In navigation config files — title stays human-readable
{ title: 'Egg Module', path: '/egg/dashboard' }
// Translations.js converts "Egg Module" → "egg_module"
// Looks up: t('navigation.egg_module') → translated value
// Falls back to: "Egg Module" if key not found
```

### Date & Currency Formatting

```jsx
const { t } = useTranslation()

// Date formatting (uses Intl.DateTimeFormat with current language)
<span>{t('formats_date', { value: new Date() })}</span>
<span>{t('formats_date_long', { value: new Date() })}</span>
<span>{t('formats_date_time', { value: new Date() })}</span>

// Currency (auto-selects currency based on locale)
<span>{t('formats_currency', { value: 1500 })}</span>

// Number formatting
<span>{t('formats_number', { value: 1234567 })}</span>
```

---

## How It Works

### Language Switching

```
User clicks "French" in LanguageDropdown
         │
         ├── i18n.changeLanguage('fr')
         │     └── Loads /locales/fr/common.json via HTTP backend
         │     └── Saves 'fr' to localStorage key 'i18nextLng'
         │     └── All t() calls re-render with French translations
         │
         ├── saveSettings({ direction: 'ltr' })
         │
         ├── document.documentElement.lang = 'fr'
         │
         └── ThemeComponent re-creates MUI theme with frFR locale
```

### RTL Switching (Arabic)

```
User clicks "Arabic" in LanguageDropdown
         │
         ├── i18n.changeLanguage('ar')
         │
         ├── saveSettings({ direction: 'rtl' })
         │     └── settings.direction = 'rtl'
         │
         ├── Direction.js
         │     ├── document.dir = 'rtl'
         │     └── Wraps app with CacheProvider using stylis-plugin-rtl
         │           └── All CSS automatically flipped
         │
         └── ThemeComponent creates theme with arSA locale + direction: 'rtl'
```

### Language Persistence (Survives Refresh)

```
On language change:
  i18n.changeLanguage('hi')
    └── i18next-browser-languagedetector saves to localStorage['i18nextLng'] = 'hi'

On page refresh:
  i18next initializes
    └── detection.order: ['localStorage', 'navigator']
    └── Reads localStorage['i18nextLng'] → 'hi'
    └── Loads /locales/hi/common.json
    └── App renders in Hindi
```

---

## Persistence

| Setting              | Storage      | Key            |
| -------------------- | ------------ | -------------- |
| Language code         | localStorage | `i18nextLng`   |
| Direction (RTL/LTR)  | localStorage | `settings`     |

- Language persists across page refreshes via `i18next-browser-languagedetector`
- Direction persists via the settings context (`src/@core/context/settingsContext.js`)

---

## Adding a New Language

1. Create directory: `public/locales/<code>/`
2. Copy English file as starting point: `cp public/locales/en-IN/common.json public/locales/<code>/common.json`
3. Add entry to `src/utility/localeConfig.js`:
   ```js
   { code: '<code>', label: '<Name>', dir: 'ltr', dayjsLocale: '<dayjs-code>', currency: '<ISO>' }
   ```
4. Add to `supportedLngs` array in `src/configs/i18n.js`
5. If RTL, add to `RTL_LANGUAGES` array in `src/configs/i18n.js`
6. Import dayjs locale in `MUIDatePicker.js` and `MUIDateTimePicker.js`
7. Translate the `common.json` file

---

## Adding Translations to a Module

### Step-by-step

1. **Add keys to `common.json`** under the module section:
   ```json
   {
     "pharmacy_module": {
       "new_page_title": "My New Page",
       "new_page_description": "Description here"
     }
   }
   ```

2. **Use in components:**
   ```jsx
   const { t } = useTranslation()
   return <h1>{t('pharmacy_module.new_page_title')}</h1>
   ```

3. **Add same keys to all locale files** with translations:
   - `public/locales/fr/common.json` → French values
   - `public/locales/hi/common.json` → Hindi values
   - `public/locales/ar/common.json` → Arabic values
   - English locales can share same values

---

## Module Key Reference

| Module | Key Prefix | Example |
|---|---|---|
| Shared | *(top-level)* | `t('save')`, `t('name')`, `t('status')` |
| App | `app.*` | `t('app.logout')`, `t('app.media')` |
| Dashboard | `dashboard.*` | `t('dashboard.key_insights')` |
| Navigation | `navigation.*` | Auto via `<Translations text="..." />` |
| Pharmacy | `pharmacy_module.*` | `t('pharmacy_module.dashboard_title')` |
| Medical | `medical_module.*` | `t('medical_module.symptoms')` |
| Hospital | `hospital_module.*` | `t('hospital_module.surgery_name_of_surgeon')` |
| Lab | `lab_module.*` | `t('lab_module.lab_tests')` |
| Diet | `diet_module.*` | `t('diet_module.meal_meal_name')` |
| Egg | `egg_module.*` | `t('egg_module.eggs_stats')` |
| Housing | `housing_module.*` | `t('housing_module.enclosure')` |
| Necropsy | `necropsy_module.*` | `t('necropsy_module.carcass_transfer')` |
| Compliance | `compliance_module.*` | `t('compliance_module.species')` |
| Parivesh | `parivesh_module.*` | `t('parivesh_module.approved_batches')` |
| Reports | `reports_module.*` | `t('reports_module.daily_report')` |
| Settings | `settings_module.*` | `t('settings_module.zoo_settings')` |
| Confirmation | `confirmation_module.*` | `t('confirmation_module.yes_delete')` |

---

## Dependencies

| Package                            | Version | Purpose                         |
| ---------------------------------- | ------- | ------------------------------- |
| `i18next`                          | 22.4.11 | Core i18n framework             |
| `react-i18next`                    | 12.2.0  | React integration               |
| `i18next-http-backend`             | 2.2.0   | Load translations via HTTP      |
| `i18next-browser-languagedetector` | 7.0.1   | Auto-detect & persist language  |
| `stylis-plugin-rtl`                | 2.1.1   | CSS RTL transformation          |
| `@mui/material` locale exports     | 7.3.8   | MUI component localization      |

All dependencies are **already installed** — no new packages needed.

---

## Console Logs (Development Only)

In development mode, i18next logs are shown in the console:

```
i18next::backendConnector: loaded namespace common for language hi {...}
i18next::backendConnector: loaded namespace common for language en-IN {...}
i18next: languageChanged hi
i18next: initialized {...}
```

These are controlled by `debug: process.env.NODE_ENV === 'development'` in `src/configs/i18n.js` and **do not appear in production builds**.
