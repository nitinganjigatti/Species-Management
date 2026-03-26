# Antz Web Dashboard — Documentation

This folder contains developer documentation for the Antz Web Dashboard project.

## Structure

```
docs/
├── api/                    # API documentation (500+ endpoints)
│   ├── API_README.md       # Quick start guide
│   ├── API_ENDPOINTS.md    # Complete endpoint list with params
│   ├── API_COMPLETE_REFERENCE.md  # Detailed examples for all modules
│   └── API_PARAMETERS.md   # Parameter patterns and structures
├── migration/              # Upgrade and migration guides
│   └── nextjs-15-to-16.md  # Next.js 15 → 16 migration guide
└── modules/                # Module-specific documentation
    ├── hospital/
    │   ├── README.md
    │   └── patient-media-tab.md
    └── necropsy/
        ├── necropsy.md
        ├── necropsy-report-form.md
        ├── medical-history-tabs.md
        ├── carcass-transfer-listing.md
        └── species-view-feature.md
```

## API Documentation

| Guide                                                   | Description                                                  |
| ------------------------------------------------------- | ------------------------------------------------------------ |
| [API README](./api/API_README.md)                       | Quick start guide for API documentation                      |
| [API Endpoints](./api/API_ENDPOINTS.md)                 | Complete list of 500+ endpoints with parameters             |
| [API Complete Reference](./api/API_COMPLETE_REFERENCE.md) | Detailed examples with request/response for all modules   |
| [API Parameters](./api/API_PARAMETERS.md)               | Parameter patterns, structures, and common use cases        |

## Migration Guides

| Guide                                             | Description                                                               |
| ------------------------------------------------- | ------------------------------------------------------------------------- |
| [Next.js 15 → 16](./migration/nextjs-15-to-16.md) | Dependency upgrades, config API changes, Turbopack alias, import path fix |

## Module Documentation

| Module                                     | Description                                          |
| ------------------------------------------ | ---------------------------------------------------- |
| [Hospital](./modules/hospital/README.md)   | Patient management, clinical records, media handling |
| [Necropsy](./modules/necropsy/necropsy.md) | Post-mortem records, carcass management, Redux state |

# Antz Web Dashboard — Documentation

## Modules

| Module                | Description                                                  | Docs                                                                                                                                                                                                                                                                                       |
| --------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Hospital**          | Patient management, medical records, media uploads           | [README](modules/hospital/README.md), [Patient Media Tab](modules/hospital/patient-media-tab.md)                                                                                                                                                                                           |
| **Necropsy**          | Necropsy reports, carcass transfers, species views           | [Overview](modules/necropsy/necropsy.md), [Report Form](modules/necropsy/necropsy-report-form.md), [Carcass Transfer](modules/necropsy/carcass-transfer-listing.md), [Medical History](modules/necropsy/medical-history-tabs.md), [Species View](modules/necropsy/species-view-feature.md) |
| **Zoo Configuration** | Zoo-level settings — timezone, currency, report distribution | [Zoo Settings](modules/zoo-configuration/zoo-settings.md)                                                                                                                                                                                                                                  |
| **QR Download**       | QR code generation and download                              | [README](modules/qr_download/README.md)                                                                                                                                                                                                                                                    |

## Helpers

| Guide                                                   | Description                                                  |
| ------------------------------------------------------- | ------------------------------------------------------------ |
| [Local Dev CORS Proxy](helpers/local-dev-cors-proxy.md) | How to proxy API calls to a local backend during development |
