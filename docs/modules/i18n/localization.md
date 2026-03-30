# Internationalization (i18n), RTL & Localization

## Overview

The app supports **6 languages** with automatic RTL (Right-to-Left) for Arabic, module-based lazy-loaded translations, MUI component localization, and encrypted language persistence.

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
│  │  ├── Shows all 6 languages                                  │   │
│  │  ├── i18n.changeLanguage(lang)                              │   │
│  │  └── Auto-sets RTL for Arabic                               │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  Components                                                 │   │
│  │  ├── useModuleTranslation('pharmacy')  ◄── per-module hook  │   │
│  │  ├── t('form.name_label')  ◄── module namespace             │   │
│  │  └── tc('buttons.save')    ◄── common namespace             │   │
│  └────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

## File Structure

### Config & Utilities

| File                                   | Purpose                                              |
| -------------------------------------- | ---------------------------------------------------- |
| `src/configs/i18n.js`                  | i18next initialization (backend, detection, formats)  |
| `src/utility/localeConfig.js`          | Centralized language config (codes, dirs, currencies) |
| `src/hooks/useModuleTranslation.js`    | Reusable hook for module-scoped translations          |
| `src/utility/date-currency-formatter.js` | Non-hook formatters for use outside components      |

### Translation Files

```
public/locales/
  ├── en-IN/
  │   ├── common.json        ← shared: buttons, labels, statuses, formats
  │   ├── navigation.json    ← sidebar/nav menu items
  │   ├── dashboard.json     ← dashboard-specific (add as needed)
  │   ├── pharmacy.json      ← pharmacy-specific (add as needed)
  │   └── ...                ← one file per module
  ├── en-US/
  ├── en/
  ├── fr/
  ├── hi/
  └── ar/
```

### Modified Core Files

| File                                                              | Change                                |
| ----------------------------------------------------------------- | ------------------------------------- |
| `src/pages/_app.js`                                               | Uncommented `import 'src/configs/i18n'` |
| `src/pages/_document.js`                                          | Changed `lang='en'` to `lang='en-IN'` |
| `src/layouts/components/Translations.js`                          | Activated i18n for nav menu           |
| `src/@core/layouts/.../LanguageDropdown.js`                       | 6 languages with auto-RTL            |
| `src/@core/theme/ThemeComponent.js`                               | MUI locale integration                |
| `src/views/forms/form-fields/MUIDatePicker.js`                    | Dynamic dayjs locale                  |
| `src/views/forms/form-fields/MUIDateTimePicker.js`                | Dynamic dayjs locale                  |

---

## How It Works

### 1. Language Switching

```
User clicks "French" in LanguageDropdown
         │
         ├── i18n.changeLanguage('fr')
         │     └── i18next loads /locales/fr/common.json (+ any loaded namespaces)
         │     └── All t() calls re-render with French translations
         │
         ├── saveSettings({ direction: 'ltr' })
         │     └── Stored in localStorage
         │
         ├── document.documentElement.lang = 'fr'
         │
         └── ThemeComponent re-creates MUI theme with frFR locale
               └── DataGrid, DatePicker UI text updates to French
```

### 2. RTL Switching (Arabic)

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
         │           └── All CSS automatically flipped (margin-left → margin-right, etc.)
         │
         └── ThemeComponent creates theme with arSA locale + direction: 'rtl'
```

### 3. Namespace Lazy Loading

Namespaces are loaded on demand when a component requests them:

```
User navigates to /pharmacy
         │
         ▼
Component calls useModuleTranslation('pharmacy')
         │
         ▼
i18next checks: is 'pharmacy' namespace loaded for current language?
         │
         ├── YES → returns translations immediately
         │
         └── NO → fetches /locales/fr/pharmacy.json via HTTP backend
                   └── caches it for future use
```

---

## Usage Guide

### In Components (Recommended Pattern)

```jsx
import useModuleTranslation from 'src/hooks/useModuleTranslation'

const PharmacyList = () => {
  const { t, tc } = useModuleTranslation('pharmacy')

  return (
    <div>
      <h1>{t('list.title')}</h1>           {/* → "All Pharmacies" from pharmacy.json */}
      <button>{tc('buttons.add_new')}</button> {/* → "Add New" from common.json */}
      <span>{tc('labels.status')}</span>     {/* → "Status" from common.json */}
    </div>
  )
}
```

### For Common Labels Only

```jsx
import { useTranslation } from 'react-i18next'

const MyComponent = () => {
  const { t } = useTranslation('common')

  return <button>{t('buttons.save')}</button>  // → "Save"
}
```

### Date & Currency Formatting (Inside Components)

```jsx
import { useTranslation } from 'react-i18next'

const OrderDetail = () => {
  const { t } = useTranslation('common')

  return (
    <div>
      {/* Uses i18next interpolation with Intl formatters */}
      <span>{t('formats.date', { value: new Date() })}</span>
      <span>{t('formats.currency', { value: 1500 })}</span>
    </div>
  )
}
```

### Date & Currency Formatting (Outside Components)

```js
import { formatDate, formatCurrency, formatNumber } from 'src/utility/date-currency-formatter'

// These use the current i18n language automatically
formatDate('2024-03-25')                    // → "25/03/2024" (en-IN)
formatDate('2024-03-25', 'long')            // → "25 Mar 2024"
formatDate('2024-03-25', 'datetime')        // → "25/03/2024 00:00"
formatCurrency(1500)                        // → "₹1,500.00" (en-IN) / "$1,500.00" (en-US)
formatCurrency(1500, { currency: 'EUR' })   // → "€1,500.00"
formatNumber(1234567)                       // → "12,34,567" (en-IN) / "1,234,567" (en-US)
```

---

## Translation Key Naming Convention

### Namespace = Module Name

| Module       | Namespace file         |
| ------------ | ---------------------- |
| Navigation   | `navigation.json`      |
| Shared/Common| `common.json`          |
| Dashboard    | `dashboard.json`       |
| Pharmacy     | `pharmacy.json`        |
| Diet         | `diet.json`            |
| Egg Module   | `egg.json`             |
| Parivesh     | `parivesh.json`        |
| Hospital     | `hospital.json`        |

### Key Structure

```
<section>.<element>

Sections:
  list     → list pages (titles, buttons, search)
  detail   → detail/view pages
  form     → form fields (labels, placeholders, validation)
  table    → table columns, empty states
  dialog   → dialog/modal text
  toast    → success/error notification messages
  error    → error messages
```

### Example

```json
{
  "list": {
    "title": "All Pharmacies",
    "add_button": "Add Pharmacy",
    "search_placeholder": "Search pharmacies..."
  },
  "form": {
    "name_label": "Pharmacy Name",
    "name_required": "Pharmacy name is required"
  },
  "table": {
    "col_name": "Name",
    "col_status": "Status",
    "no_data": "No pharmacies found"
  },
  "toast": {
    "create_success": "Pharmacy created successfully",
    "delete_confirm": "Are you sure you want to delete?"
  }
}
```

### Rules

1. Namespace = module folder name (lowercase)
2. Top-level groups: `list`, `detail`, `form`, `table`, `dialog`, `toast`, `error`
3. Keys use `snake_case`
4. Reusable labels go in `common`, not duplicated per module
5. Pluralization: `"item": "{{count}} item"`, `"item_plural": "{{count}} items"`
6. Interpolation: `"greeting": "Hello, {{name}}"`

---

## Adding a New Language

1. Create directory: `public/locales/<code>/`
2. Copy English files as starting point: `cp -r public/locales/en-IN/* public/locales/<code>/`
3. Add entry to `src/utility/localeConfig.js`:
   ```js
   { code: '<code>', label: '<Name>', dir: 'ltr', dayjsLocale: '<dayjs-code>', currency: '<ISO>' }
   ```
4. If RTL, add to `RTL_LANGUAGES` array in `src/configs/i18n.js`
5. Import dayjs locale in `MUIDatePicker.js` and `MUIDateTimePicker.js`
6. Translate the JSON files

---

## Adding Translations to a New Module

### Step-by-step

1. **Create the translation file:**
   ```
   public/locales/en-IN/<module>.json
   ```

2. **Extract hardcoded strings from components:**
   ```json
   {
     "list": {
       "title": "All Items",
       "add_button": "Add Item"
     }
   }
   ```

3. **Use the hook in components:**
   ```jsx
   import useModuleTranslation from 'src/hooks/useModuleTranslation'

   const MyComponent = () => {
     const { t, tc } = useModuleTranslation('<module>')
     return <h1>{t('list.title')}</h1>
   }
   ```

4. **Copy to other locales:**
   ```bash
   for lang in en-US en fr hi ar; do
     cp public/locales/en-IN/<module>.json public/locales/$lang/<module>.json
   done
   ```

5. **Translate** the copied files (can be done later — English shows as fallback)

---

## Persistence

| Setting       | Storage        | Key            |
| ------------- | -------------- | -------------- |
| Language code  | localStorage   | `i18nextLng`   |
| Direction (RTL/LTR) | localStorage | `settings` (inside settings object) |

- Language persists across page refreshes via `i18next-browser-languagedetector`
- Direction persists via the existing settings context (`src/@core/context/settingsContext.js`)

---

## Dependencies

| Package                          | Version | Purpose                         |
| -------------------------------- | ------- | ------------------------------- |
| `i18next`                        | 22.4.11 | Core i18n framework             |
| `react-i18next`                  | 12.2.0  | React integration               |
| `i18next-http-backend`           | 2.2.0   | Load translations via HTTP      |
| `i18next-browser-languagedetector` | 7.0.1 | Auto-detect browser language    |
| `stylis-plugin-rtl`              | 2.1.1   | CSS RTL transformation          |
| `@mui/material` locale exports   | 7.3.8   | MUI component localization      |

All dependencies are **already installed** — no new packages needed.
