# Antz Web Dashboard — Documentation

This folder contains developer documentation for the Antz Web Dashboard project.

## Structure

```
docs/
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

## Migration Guides

| Guide | Description |
|---|---|
| [Next.js 15 → 16](./migration/nextjs-15-to-16.md) | Dependency upgrades, config API changes, Turbopack alias, import path fix |

## Module Documentation

| Module | Description |
|---|---|
| [Hospital](./modules/hospital/README.md) | Patient management, clinical records, media handling |
| [Necropsy](./modules/necropsy/necropsy.md) | Post-mortem records, carcass management, Redux state |
