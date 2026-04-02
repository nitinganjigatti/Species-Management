# Internationalization (i18n), RTL & Localization

## Overview

The app supports **13 languages** with automatic RTL (Right-to-Left) for Arabic, single-file translations per locale, MUI component localization, localStorage language persistence, and **API-driven translation updates** (same API as the mobile app).

| Language         | Code    | Native Label       | Direction | Currency | Status     |
| ---------------- | ------- | ------------------ | --------- | -------- | ---------- |
| English (India)  | `en-IN` | English            | LTR       | INR      | Default    |
| Hindi            | `hi`    | हिंदी               | LTR       | INR      | Supported  |
| Tamil            | `ta`    | தமிழ்               | LTR       | INR      | Supported  |
| French           | `fr`    | Français           | LTR       | EUR      | Supported  |
| Thai             | `th`    | ไทย                | LTR       | THB      | Supported  |
| Kannada          | `ka`    | ಕನ್ನಡ               | LTR       | INR      | Supported  |
| Chinese          | `ch`    | 中文                | LTR       | CNY      | Supported  |
| Russian          | `ru`    | Русский            | LTR       | RUB      | Supported  |
| Indonesian       | `id`    | Bahasa Indonesia   | LTR       | IDR      | Supported  |
| Gujarati         | `gu`    | ગુજરાતી             | LTR       | INR      | Supported  |
| Telugu           | `te`    | తెలుగు              | LTR       | INR      | Supported  |
| Bengali          | `bn`    | বাংলা               | LTR       | INR      | Supported  |
| Arabic           | `ar`    | العربية              | RTL       | SAR      | Supported  |

English (US) (`en-US`) and English (`en`) are also supported as fallback variants.

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│  _app.js                                                             │
│  ├── import 'src/configs/i18n'   ◄── initializes i18next             │
│  └── <LanguageProvider>          ◄── fetches API translations        │
│        └── <AuthProvider>                                            │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  LanguageContext.js                                             │  │
│  │  ├── On mount: fetchAndMergeTranslations(currentLang)          │  │
│  │  │     ├── API: GET get-files-by-language?language_code={lang}  │  │
│  │  │     ├── fetch(cdn-url) → remoteTranslations                 │  │
│  │  │     ├── i18n.addResourceBundle(lang, 'common', data, T, T)  │  │
│  │  │     └── Cache in IndexedDB                                  │  │
│  │  ├── loadLanguage(lang) → switch language + fetch API          │  │
│  │  └── resetLanguage() → clear cache + reset to en-IN            │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  ThemeComponent.js                                             │  │
│  │  ├── MUI locale (enUS, frFR, arSA) via createTheme()          │  │
│  │  └── Direction.js  ◄── RTL/LTR via stylis-plugin-rtl          │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  LanguageDropdown.js                                           │  │
│  │  ├── Shows 13 languages from localeConfig.js                   │  │
│  │  ├── Labels translate via t('languages.{code}')                │  │
│  │  ├── loadLanguage(lang) → static load + API merge              │  │
│  │  └── Auto-sets RTL direction for Arabic                        │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  Components                                                    │  │
│  │  ├── t('save')                    ◄── direct top-level key     │  │
│  │  ├── t('pharmacy_module.dashboard_title') ◄── module key       │  │
│  │  ├── t(apiKey, { defaultValue })  ◄── dynamic key from API    │  │
│  │  └── <Translations text="Dashboard" /> ◄── auto snake_case    │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

## File Structure

### Config & Utilities

| File                                          | Purpose                                              |
| --------------------------------------------- | ---------------------------------------------------- |
| `src/configs/i18n.js`                         | i18next initialization (backend, detection, formats)  |
| `src/utility/localeConfig.js`                 | Centralized language config (codes, dirs, currencies, nativeLabels) |
| `src/context/LanguageContext.js`              | Language context — API fetch, merge, cache, reset     |
| `src/lib/api/language/index.js`               | API service for `get-files-by-language` endpoint      |
| `src/lib/i18n/translationCache.js`            | IndexedDB cache for translations + formats            |
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
  ├── ar/common.json        ← Arabic
  ├── ta/common.json        ← Tamil
  ├── th/common.json        ← Thai
  ├── ka/common.json        ← Kannada
  ├── ch/common.json        ← Chinese
  ├── ru/common.json        ← Russian
  ├── id/common.json        ← Indonesian
  ├── gu/common.json        ← Gujarati
  ├── te/common.json        ← Telugu
  └── bn/common.json        ← Bengali
```

These static files serve as **bundled fallbacks**. The API provides the latest translations which override these.

### Modified Core Files

| File                                                              | Change                                |
| ----------------------------------------------------------------- | ------------------------------------- |
| `src/pages/_app.js`                                               | `import 'src/configs/i18n'` + `<LanguageProvider>` wrapping `<AuthProvider>` |
| `src/configs/i18n.js`                                             | 13 languages in `supportedLngs`       |
| `src/utility/localeConfig.js`                                     | 13 languages with `nativeLabel`       |
| `src/context/LanguageContext.js`                                  | API fetch + merge + IndexedDB cache   |
| `src/context/AuthContext.js`                                      | `resetLanguage()` on logout           |
| `src/@core/layouts/.../LanguageDropdown.js`                       | Uses `loadLanguage()` from context, `t()` labels with nativeLabel fallback |
| `src/layouts/components/Translations.js`                          | `toSnakeCase()` for navigation keys   |
| `src/@core/layouts/.../UserDropdown.js`                           | `t('app.logout')`, `t('app.media')`   |
| `src/views/forms/form-fields/MUIDatePicker.js`                    | Dynamic dayjs locale                  |
| `src/views/forms/form-fields/MUIDateTimePicker.js`                | Dynamic dayjs locale                  |

---

## Translation Data Flow

### Two-Layer Translation Loading

The app uses a **two-layer approach** (same as the mobile app):

1. **Static (instant)** — `i18next-http-backend` loads `public/locales/{lang}/common.json` on language change
2. **API (background)** — `LanguageContext` fetches translations from the API and merges on top

```
App loads / language switches
  │
  ├─► LAYER 1 (instant): i18next-http-backend
  │     └── loads /locales/{lang}/common.json
  │     └── components render immediately with static translations
  │
  └─► LAYER 2 (background): LanguageContext.fetchAndMergeTranslations()
        ├── API: GET get-files-by-language?language_code={lang}
        │     Response: { translations: "cdn-url", formats: "cdn-url" }
        ├── fetch(cdn-url) → remoteTranslations JSON
        ├── i18n.addResourceBundle(lang, 'common', remoteData, true, true)
        │     deep=true, overwrite=true → remote keys override static
        ├── Cache in IndexedDB
        └── Components silently update with latest translations
```

### Fallback Chain

```
API → IndexedDB cache → static bundled file → fallbackLng (en-IN)
```

### API Details

```
GET {BASE_URL}get-files-by-language?language_code={code}
```

- Same API endpoint used by the mobile app
- Returns CDN URLs pointing to translation and format JSON files
- Auth headers: `Authorization: Bearer {token}`, `ZooId`, `CurrentTimeZone`

Response:

```json
{
  "data": {
    "translations": "https://cdn-url/locales/hi/translations.json",
    "formats": "https://cdn-url/locales/hi/formats.json"
  }
}
```

### Cache Strategy: IndexedDB

Translations are cached in **IndexedDB** (not localStorage) because translation data can be 16K+ keys (~150-310 KB per language). localStorage has a ~5 MB limit which is risky for large Unicode translations.

| Storage | Limit | Usage |
|---------|-------|-------|
| IndexedDB | 50-100+ MB | Translation + format cache |
| localStorage | ~5 MB | Language preference (`i18nextLng`) only |
| React Context | RAM | `formats` object only (~315 bytes) |

Only the **currently selected** language is cached at a time.

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
    "ar": "Arabic",
    "ta": "Tamil",
    "th": "Thai",
    "ka": "Kannada",
    "ch": "Chinese",
    "ru": "Russian",
    "id": "Indonesian",
    "gu": "Gujarati",
    "te": "Telugu",
    "bn": "Bengali"
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

  "medical_module": { ... },
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

### Dynamic keys (key comes from API response)

Many APIs return data where each item has both a **translation key** (`_string_id` field) and a **raw value** (fallback). The `_string_id` fields map to keys in the translations JSON fetched from the language API.

**Typical API response structure:**

```json
{
  "data": [
    {
      "id": 1,
      "title": "Pending Necropsy",
      "title_string_id": "dashboard.pending_necropsy",
      "status": "Completed",
      "status_string_id": "medical.status_completed",
      "category": "Deworming",
      "category_string_id": "Deworming.Deworming"
    }
  ]
}
```

**How to use:**

```jsx
const { t } = useTranslation()

// t(key, { defaultValue: fallback })
//   ↓ key from API       ↓ raw value as fallback if key not found
t(item.title_string_id, { defaultValue: item.title })
t(item.status_string_id, { defaultValue: item.status })
t(item.category_string_id, { defaultValue: item.category })
```

**What happens internally:**

```text
t("dashboard.pending_necropsy", { defaultValue: "Pending Necropsy" })
  │
  ├── Language is Hindi?
  │     → Looks up "dashboard.pending_necropsy" in Hindi translations
  │     → Found: "लंबित शव परीक्षण" → returns Hindi text
  │
  ├── Language is English?
  │     → Looks up "dashboard.pending_necropsy" in English translations
  │     → Found: "Pending Necropsy" → returns English text
  │
  └── Key not found in any translation?
        → Returns defaultValue: "Pending Necropsy" (the raw API value)
```

The `defaultValue` is the safety net — if the translation key doesn't exist (API hasn't provided that translation yet, or it's a new key), the user still sees the raw text instead of a broken key like `"dashboard.pending_necropsy"`.

**Data type rules — when to translate and when not to:**

| Data type | How to translate | Example |
|-----------|-----------------|---------|
| Static UI label | `t('known.key')` | `t('save')`, `t('status')` |
| API data with `_string_id` | `t(item.string_id, { defaultValue: item.value })` | `t(item.status_string_id, { defaultValue: item.status })` |
| API data without `_string_id` | Don't translate — show raw value | `{record.animal_name}` |
| String with variables | `t('key', { var: value })` | `t('Animals_in_X', { name: 'Zone A' })` |

This is the web equivalent of the mobile app's `getTranslatedText({ key, value })` helper — but built into i18next, no custom helper needed.

### String with variable replacement

```jsx
// In common.json: "Animals_in_X": "Animals in {{name}}"
t('Animals_in_X', { name: 'Enclosure A' })  // → "Animals in Enclosure A"

// In common.json: "hello_name": "Hello, {{name}}!"
t('hello_name', { name: 'John' })  // → "Hello, John!"
```

This replaces the mobile app's `getTranslationAndReplaceText()` helper.

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

### Using formats from API (same as mobile)

```jsx
import { useLanguage } from 'src/context/LanguageContext'

const { formats } = useLanguage()
// formats contains date_formats, number config, currency config from the API
```

### Language switching

```jsx
import { useLanguage } from 'src/context/LanguageContext'

const { loadLanguage } = useLanguage()
await loadLanguage('hi')  // switches instantly + API merge in background
```

### Outside React components (utility files, helpers)

```jsx
import i18n from 'src/configs/i18n'
i18n.t('some.key')  // works anywhere without hooks
```

---

## Real-World Usage Examples

### Example 1: Page with API data + static labels

A typical page that fetches data from an API and displays it with translated labels.

**Mobile app approach:**

```jsx
// Mobile — HomeStatCarousel.js
import { translate } from '../../i18n/i18n'
import { getTranslatedText } from '../../utils/Utils'

const HomeStatCarousel = ({ data }) => {
  return data.map(item => (
    <View>
      {/* Static key — developer knows the key */}
      <Text>{translate.t("allocation.pending_to_do")}</Text>

      {/* Dynamic key — key comes from API response */}
      <Text>{getTranslatedText({
        key: item?.title_string,       // e.g. "dashboard.pending_necropsy"
        value: item?.title             // e.g. "Pending Necropsy" (fallback)
      })}</Text>

      <Text>{getTranslatedText({
        key: item?.subtitle_string,
        value: item?.subtitle
      })}</Text>
    </View>
  ))
}
```

**Web app equivalent:**

```jsx
// Web — DashboardStats.js
import { useTranslation } from 'react-i18next'

const DashboardStats = ({ data }) => {
  const { t } = useTranslation()

  return data.map(item => (
    <Box>
      {/* Static key — same concept, just t() instead of translate.t() */}
      <Typography>{t('allocation.pending_to_do')}</Typography>

      {/* Dynamic key — built-in defaultValue replaces getTranslatedText() */}
      <Typography>{t(item?.title_string, { defaultValue: item?.title })}</Typography>

      <Typography>{t(item?.subtitle_string, { defaultValue: item?.subtitle })}</Typography>
    </Box>
  ))
}
```

### Example 2: Table with API data + translated headers and cell values

**Mobile app approach:**

```jsx
// Mobile — uses translate.t() for headers, getTranslatedText() for dynamic data
import { translate } from '../../i18n/i18n'
import { getTranslatedText } from '../../utils/Utils'

<Text>{translate.t("Deworming.Completed_Deworming")}</Text>

{records.map(record => (
  <View>
    <Text>{getTranslatedText({
      key: record.status_string_id,       // "medical.status_completed"
      value: record.status                 // "Completed"
    })}</Text>
    <Text>{getTranslatedText({
      key: record.category_string_id,     // "Deworming.Deworming"
      value: record.category               // "Deworming"
    })}</Text>
  </View>
))}
```

**Web app equivalent:**

```jsx
// Web — MedicalRecordsTable.js
import { useTranslation } from 'react-i18next'

const MedicalRecordsTable = ({ records }) => {
  const { t } = useTranslation()

  return (
    <Table>
      <TableHead>
        <TableRow>
          {/* Static keys for table headers */}
          <TableCell>{t('name')}</TableCell>
          <TableCell>{t('status')}</TableCell>
          <TableCell>{t('medical_module.category')}</TableCell>
          <TableCell>{t('date')}</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {records.map(record => (
          <TableRow key={record.id}>
            <TableCell>{record.animal_name}</TableCell>

            {/* Dynamic keys — key from API, fallback to raw value */}
            <TableCell>
              {t(record.status_string_id, { defaultValue: record.status })}
            </TableCell>
            <TableCell>
              {t(record.category_string_id, { defaultValue: record.category })}
            </TableCell>

            {/* Date formatting */}
            <TableCell>
              {t('formats_date', { value: new Date(record.created_at) })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

### Example 3: Form with translated labels, placeholders, and validation

```jsx
import { useTranslation } from 'react-i18next'

const AnimalForm = () => {
  const { t } = useTranslation()

  return (
    <form>
      {/* Static translated labels */}
      <TextField label={t('name')} placeholder={t('medical_module.enter_animal_name')} />
      <TextField label={t('medical_module.symptoms')} />

      {/* Dropdown with API data — items have string_id for translation */}
      <Select label={t('medical_module.category')}>
        {categories.map(cat => (
          <MenuItem key={cat.id} value={cat.id}>
            {t(cat.name_string_id, { defaultValue: cat.name })}
          </MenuItem>
        ))}
      </Select>

      {/* Buttons with static keys */}
      <Button>{t('save')}</Button>
      <Button>{t('cancel')}</Button>
    </form>
  )
}
```

### Example 4: Dashboard page with stats + charts (real pattern from codebase)

```jsx
// Based on actual src/pages/dashboard/index.js
import { useTranslation } from 'react-i18next'
import { useLanguage } from 'src/context/LanguageContext'

const Dashboard = () => {
  const { t } = useTranslation()
  const { formats, locale } = useLanguage()
  const [statsData, setStatsData] = useState([])

  useEffect(() => {
    // Fetch dashboard data from API
    getDashboardAnalytics().then(data => setStatsData(data))
  }, [])

  return (
    <>
      {/* Static section headers */}
      <DashboardCardHeader title={t('dashboard.key_insights')} />
      <DashboardCardHeader title={t('dashboard.animal_activity')} />
      <DashboardCardHeader title={t('dashboard.pending_requests_pharmacy')} />

      {/* Stats cards with API data — translate dynamic labels */}
      {statsData.map(stat => (
        <StatCard
          key={stat.id}
          label={t(stat.label_string_id, { defaultValue: stat.label })}
          value={stat.count}
        />
      ))}

      {/* Currency display using locale from context */}
      <Typography>
        {t('formats_currency', { value: totalRevenue })}
      </Typography>
    </>
  )
}
```

### Example 5: String with variables (replaces mobile's getTranslationAndReplaceText)

**Mobile app approach:**

```jsx
// Mobile — custom helper for variable replacement
import { getTranslationAndReplaceText } from '../../utils/Utils'

// translation key: "Animals_in_X" → "Animals in X"
const text = getTranslationAndReplaceText({
  key: "Animals_in_X",
  value: "Animals in X",
  tag: "X",
  valueToBeReplaced: enclosureName
})

// translation key: "total_X_animals" → "Total X animals"
const text2 = getTranslationAndReplaceText({
  key: "total_X_animals",
  value: "Total X animals",
  tag: "X",
  valueToBeReplaced: animalCount
})
```

**Web app equivalent:**

```jsx
// Web — built-in i18next interpolation, no helper needed

// In common.json:
// "Animals_in_X": "Animals in {{name}}"
// "total_X_animals": "Total {{count}} animals"

const { t } = useTranslation()

const text = t('Animals_in_X', { name: enclosureName })
// → "Animals in Enclosure A"

const text2 = t('total_X_animals', { count: animalCount })
// → "Total 25 animals"

// Multiple variables:
// "transfer_summary": "{{count}} animals transferred from {{source}} to {{destination}}"
const text3 = t('transfer_summary', {
  count: 5,
  source: 'Enclosure A',
  destination: 'Enclosure B'
})
// → "5 animals transferred from Enclosure A to Enclosure B"
```

### Example 6: Conditional text with translation

```jsx
const { t } = useTranslation()

// Status badge — key from API, fallback to raw value
const statusText = t(item.status_string_id, { defaultValue: item.status })

// Gender — static keys
const genderText = item.gender === 'male' ? t('male') : t('female')

// Boolean display
const activeText = item.is_active ? t('yes') : t('no')
```

### Quick Reference: Mobile → Web Conversion

| Mobile Code | Web Code |
|---|---|
| `translate.t("key")` | `t('key')` |
| `getTranslatedText({ key, value })` | `t(key, { defaultValue: value })` |
| `getTranslationAndReplaceText({ key, value, tag, valueToBeReplaced })` | `t('key', { varName: value })` |
| `translate.t("key", { defaultValue: "fallback" })` | `t('key', { defaultValue: 'fallback' })` |
| `formatDate(date, 'short', formats)` | `t('formats_date', { value: date })` |
| `formatCurrency(1000, formats)` | `t('formats_currency', { value: 1000 })` |
| `useLanguage().formats` | `useLanguage().formats` (same) |
| `useLanguage().locale` | `useLanguage().locale` (same) |
| `loadI18n('hi')` + `navigation.reset()` | `loadLanguage('hi')` (auto re-renders) |

---

### Example 7: Using API translation keys (antz-complaints, antz-diagnosis, etc.)

The language API returns a large nested JSON with domain-specific translation groups like `antz-complaints`, `antz-diagnosis`, `antz-prescription`, `antz-life-stage`, etc. After the API fetch, `LanguageContext` merges this entire JSON into i18next via `addResourceBundle`. All keys become accessible through `t()`.

**API translation JSON structure (Hindi example):**

```json
{
  "antz-complaints": {
    "anxiety_or_stress_signs": "चिंता या तनाव के लक्षण",
    "vomiting": "उल्टी करना",
    "loss-of-appetite": "भूख में कमी",
    "limping-or-difficulty-moving": "लंगड़ाना या चलने में कठिनाई"
  },
  "antz-diagnosis": {
    "respiratory_infections": "श्वसन संक्रमण",
    "pneumonia": "न्यूमोनिया",
    "fractures": "भंग"
  },
  "antz-life-stage": {
    "juvenile": "किशोर",
    "adult": "वयस्क"
  },
  "antz-prescription": {
    "amoxicillin": "एमोक्सिसिलिन",
    "meloxicam": "मेलोक्सिकैम"
  }
}
```

**Using in components — direct key access:**

```jsx
const { t } = useTranslation()

// Complaints
t('antz-complaints.vomiting')                    // → "उल्टी करना" (Hindi)
t('antz-complaints.loss-of-appetite')            // → "भूख में कमी" (Hindi)

// Diagnosis
t('antz-diagnosis.pneumonia')                    // → "न्यूमोनिया" (Hindi)

// Life stages
t('antz-life-stage.adult')                       // → "वयस्क" (Hindi)

// Medicines
t('antz-prescription.amoxicillin')               // → "एमोक्सिसिलिन" (Hindi)
```

**Using with dynamic keys from API response data:**

The backend API returns records where each item has a `_string_id` field that maps directly to these translation keys:

```jsx
// API returns medical record:
// {
//   complaint: "Vomiting",
//   complaint_string_id: "antz-complaints.vomiting",
//   diagnosis: "Pneumonia",
//   diagnosis_string_id: "antz-diagnosis.pneumonia",
//   medicine: "Amoxicillin",
//   medicine_string_id: "antz-prescription.amoxicillin"
// }

const MedicalRecordCard = ({ record }) => {
  const { t } = useTranslation()

  return (
    <Card>
      {/* Static UI labels from public/locales/hi/common.json */}
      <Typography variant="h6">{t('medical_module.medical_records_title')}</Typography>

      {/* Dynamic keys from API data — translated using API translation JSON */}
      <Typography>
        {t('medical_module.complaint')}: {t(record.complaint_string_id, { defaultValue: record.complaint })}
      </Typography>
      {/* → "शिकायत: उल्टी करना" (Hindi) */}
      {/* → "Complaint: Vomiting" (English) */}

      <Typography>
        {t('medical_module.diagnosis')}: {t(record.diagnosis_string_id, { defaultValue: record.diagnosis })}
      </Typography>
      {/* → "निदान: न्यूमोनिया" (Hindi) */}

      <Typography>
        {t('medical_module.medicine')}: {t(record.medicine_string_id, { defaultValue: record.medicine })}
      </Typography>
      {/* → "दवा: एमोक्सिसिलिन" (Hindi) */}
    </Card>
  )
}
```

**How the two layers work together:**

| Source | Contains | Example keys |
|--------|----------|-------------|
| Static file (`public/locales/hi/common.json`) | UI labels, navigation, module titles | `save`, `navigation.dashboard`, `medical_module.diagnosis` |
| API translation JSON (fetched from CDN) | Domain data — complaints, diagnosis, medicines, feed types, ingredients, etc. | `antz-complaints.vomiting`, `antz-diagnosis.pneumonia`, `antz-prescription.amoxicillin` |

Both merge into i18next. A single `t()` call reads from the merged result — no need to know which source a key came from.

---

## How It Works

### Language Switching

```
User clicks "हिंदी" in LanguageDropdown
         │
         ├── loadLanguage('hi') from LanguageContext
         │     ├── i18n.changeLanguage('hi')        ← INSTANT
         │     │     └── Loads /locales/hi/common.json via HTTP backend
         │     │     └── Saves 'hi' to localStorage key 'i18nextLng'
         │     │     └── All t() calls re-render with Hindi translations
         │     │
         │     └── fetchAndMergeTranslations('hi')  ← BACKGROUND
         │           ├── API: GET get-files-by-language?language_code=hi
         │           ├── fetch(cdn-url) → remote translations
         │           ├── i18n.addResourceBundle('hi', 'common', data, true, true)
         │           └── Cache in IndexedDB
         │
         ├── saveSettings({ direction: 'ltr' })
         │
         ├── document.documentElement.lang = 'hi'
         │
         └── ThemeComponent re-creates MUI theme with locale
```

### RTL Switching (Arabic)

```
User clicks "العربية" in LanguageDropdown
         │
         ├── loadLanguage('ar')
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
  loadLanguage('hi')
    └── i18n.changeLanguage('hi')
    └── i18next-browser-languagedetector saves to localStorage['i18nextLng'] = 'hi'

On page refresh:
  i18next initializes
    └── detection.order: ['localStorage', 'navigator']
    └── Reads localStorage['i18nextLng'] → 'hi'
    └── Loads /locales/hi/common.json (static — instant)
    └── LanguageContext mounts → fetches API translations → merges on top
    └── App renders in Hindi
```

### Logout Resets Language

```
handleLogout() in AuthContext
  │
  ├── resetLanguage() from LanguageContext
  │     ├── clearTranslationCache()           ← clears IndexedDB
  │     ├── localStorage.removeItem('i18nextLng')
  │     └── i18n.changeLanguage('en-IN')      ← reset to default
  │
  └── router.push('/login')
```

---

## Persistence

| Setting              | Storage      | Key            |
| -------------------- | ------------ | -------------- |
| Language code         | localStorage | `i18nextLng`   |
| Direction (RTL/LTR)  | localStorage | `settings`     |
| Translation cache     | IndexedDB    | `i18n_cache` DB, `translations` store |
| Format cache          | IndexedDB    | `i18n_cache` DB, `translations` store |

- Language persists across page refreshes via `i18next-browser-languagedetector`
- Direction persists via the settings context (`src/@core/context/settingsContext.js`)
- Translation cache persists across sessions, cleared on logout

---

## Mobile vs Web Comparison

| Aspect | Mobile App | Web Dashboard |
|--------|-----------|---------------|
| i18n library | `i18n-js` | `i18next` + `react-i18next` |
| API endpoint | `get-files-by-language` | `get-files-by-language` (same) |
| Merge strategy | `{ ...bundled, ...remote }` | `addResourceBundle(deep, overwrite)` (same result) |
| Cache storage | Device filesystem (expo-file-system) | IndexedDB |
| Context hook | `useLanguage()` → `{ formats, locale, loadI18n }` | `useLanguage()` → `{ formats, locale, loadLanguage, resetLanguage }` |
| Translation access | `translate.t("key")` | `t("key")` via `useTranslation()` hook |
| Dynamic keys | `getTranslatedText({ key, value })` | `t(key, { defaultValue: value })` (built-in) |
| Variable replacement | `getTranslationAndReplaceText()` | `t('key', { var: value })` (built-in) |
| Language switch | `loadI18n()` + `navigation.reset()` | `loadLanguage()` (auto re-render) |
| Language reset | Logout + passcode fail + inactivity | Logout |
| RTL support | Not implemented | Implemented (Arabic) |

---

## Adding a New Language

1. Create directory: `public/locales/<code>/`
2. Copy English file as starting point: `cp public/locales/en-IN/common.json public/locales/<code>/common.json`
3. Add entry to `src/utility/localeConfig.js`:
   ```js
   { code: '<code>', label: '<Name>', nativeLabel: '<NativeScript>', dir: 'ltr', dayjsLocale: '<dayjs-code>', currency: '<ISO>' }
   ```
4. Add to `supportedLngs` array in `src/configs/i18n.js`
5. Add language name to the `languages` object in **all** locale `common.json` files
6. If RTL, add to `RTL_LANGUAGES` array in `src/configs/i18n.js`
7. Import dayjs locale in `MUIDatePicker.js` and `MUIDateTimePicker.js`
8. Translate the `common.json` file (or rely on API to provide translations)

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
   - Or rely on the API to provide translations for these keys

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
| `i18next-http-backend`             | 2.2.0   | Load static translations via HTTP |
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

---

## Files Created (API Integration)

| File | Purpose |
|------|---------|
| `src/lib/api/language/index.js` | API service — calls `GET get-files-by-language?language_code={code}` |
| `src/lib/i18n/translationCache.js` | IndexedDB cache for translations + formats |
| `src/context/LanguageContext.js` | Language context with `useLanguage()` hook |
| `public/locales/{ta,th,ka,ch,ru,id,gu,te,bn}/common.json` | 9 placeholder locale files (English fallback) |

## Files Modified (API Integration)

| File | Change |
|------|--------|
| `src/configs/i18n.js` | Added 9 new languages to `supportedLngs` |
| `src/utility/localeConfig.js` | 13 languages with `nativeLabel` in native script |
| `src/@core/.../LanguageDropdown.js` | Uses `loadLanguage()` from LanguageContext, shows translated labels via `t()` with `nativeLabel` fallback |
| `src/context/AuthContext.js` | Calls `resetLanguage()` on both `logOutUser` and `handleLogout` |
| `src/pages/_app.js` | Wrapped `AuthProvider` with `LanguageProvider` |
| `public/locales/*/common.json` | All 15 locale files updated with 13 language entries in `languages` object |

---

## Testing Checklist

- [ ] Language switch loads static translations instantly
- [ ] API translations merge on top in background
- [ ] If API fails, falls back to IndexedDB cache
- [ ] If cache empty, falls back to static bundled files
- [ ] Remote translations override bundled keys
- [ ] Bundled keys not in remote are preserved
- [ ] Formats (date, currency, number) load correctly per language
- [ ] RTL direction toggles for Arabic
- [ ] LTR direction for all other languages
- [ ] Language persists on page reload (localStorage `i18nextLng`)
- [ ] Logout resets language to en-IN
- [ ] Logout clears IndexedDB translation cache
- [ ] All 13 languages appear in dropdown
- [ ] Dropdown labels translate when switching language
- [ ] New languages (ta, th, ka, etc.) work end-to-end
- [ ] No console errors when switching languages rapidly
- [ ] 16K+ translation keys don't cause storage issues
