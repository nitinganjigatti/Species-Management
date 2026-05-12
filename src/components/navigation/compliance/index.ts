import type { ComplianceNavItem } from 'src/types/compliance'

const composeComplianceNavigation = (): ComplianceNavItem[] => {
  const complianceTitle: ComplianceNavItem = {
    sectionTitle: 'Compliance',
    title: 'Compliance'
  }

  const documentsParent: ComplianceNavItem = {
    title: 'Documents',
    path: '',
    icon: 'mdi:file-document-outline',
    children: []
  }

  const exports: ComplianceNavItem = {
    title: 'Export',
    path: '/compliance/documents/exports',
    activeWhen: ['/compliance/documents/exports', '/compliance/documents/exports/AddEditExportPermit']
  }

  const imports: ComplianceNavItem = {
    title: 'Import',
    path: '/compliance/documents/imports',
    activeWhen: ['/compliance/documents/imports', '/compliance/documents/imports/AddEditImport']
  }

  const shipments: ComplianceNavItem = {
    title: 'Shipment',
    path: '/compliance/documents/shipments',
    activeWhen: ['/compliance/documents/shipments', '/compliance/documents/shipments/AddEditShipment']
  }

  // const files = {
  //   title: 'Files',
  //   path: '/compliance/documents/files'
  // }

  // const species = {
  //   title: 'Species',
  //   path: '/compliance/documents/species'
  // }

  // const animals = {
  //   title: 'Animals',
  //   path: '/compliance/documents/animals'
  // }

  const species: ComplianceNavItem = {
    title: 'Species',
    path: '/compliance/species'
  }

  const mastersParent: ComplianceNavItem = {
    title: 'Masters',
    path: '/compliance/documents/masters',
    icon: '',
    key: 'compliance-masters',
    children: []
  }

  const masterdocuments: ComplianceNavItem = {
    title: 'Document Types',
    path: '/compliance/masters/documents'
  }

  const masterimports: ComplianceNavItem = {
    title: 'Importer',
    path: '/compliance/masters/imports'
  }

  const masterexports: ComplianceNavItem = {
    title: 'Exporter',
    path: '/compliance/masters/exports'
  }

  const reportsParent: ComplianceNavItem = {
    title: 'Reports',
    path: '/compliance/documents/reports',
    key: 'compliance-reports',
    icon: '',
    children: []
  }

  const observation: ComplianceNavItem = {
    title: 'Observation',
    path: '/compliance/reports/observation'
  }

  const keeperDiary: ComplianceNavItem = {
    title: 'Keepers Diary',
    path: '/compliance/reports/keeperDiary'
  }

  const biologistDiary: ComplianceNavItem = {
    title: 'Biologist Diary',
    path: '/compliance/reports/biologistDiary'
  }

  const enclosureCountRegister: ComplianceNavItem = {
    title: 'Enclosure Count Register',
    path: '/compliance/reports/enclosureCountRegister'
  }

  const dailyReport: ComplianceNavItem = {
    title: 'Daily Report',
    path: '/compliance/reports/dailyReport'
  }

  const medicalJournalReport: ComplianceNavItem = {
    title: 'Medical Journal Report',
    path: '/compliance/reports/medicalJournalReport'
  }

  const animalStockReport: ComplianceNavItem = {
    title: 'Animal Stock Report',
    path: '/compliance/reports/animalStockReport'
  }

  const animalHistoryReport: ComplianceNavItem = {
    title: 'Animal History Report',
    path: '/compliance/reports/animalHistoryReport'
  }

  // Add all items under Documents
  documentsParent.children!.push(exports, imports, shipments, species, mastersParent, reportsParent)

  mastersParent.children!.push(masterdocuments, masterimports, masterexports)

  reportsParent.children!.push(
    observation,
    keeperDiary,
    biologistDiary,
    enclosureCountRegister,
    dailyReport
    // medicalJournalReport,
    // animalStockReport,
    // animalHistoryReport
  )

  const dashboard: ComplianceNavItem = {
    title: 'Dashboard',
    path: '/compliance/dashboard',
    icon: 'mdi:view-dashboard-outline',
    activeWhen: [
      '/compliance/dashboard',
      '/compliance/dashboard/orgs',
      '/compliance/dashboard/sites',
      '/compliance/dashboard/species'
    ]
  }

  const animals: ComplianceNavItem = {
    title: 'Animals',
    path: '/compliance/animals',
    icon: 'mdi:paw',
    activeWhen: ['/compliance/animals']
  }

  const complianceNavigation: ComplianceNavItem[] = [complianceTitle, dashboard, animals, documentsParent]

  return complianceNavigation
}

const complianceNavigation = (): ComplianceNavItem[] => composeComplianceNavigation()

export default complianceNavigation
