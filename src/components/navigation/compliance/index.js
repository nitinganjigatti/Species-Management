const composeComplianceNavigation = () => {
  const complianceTitle = {
    sectionTitle: 'Compliance'
  }

  const documentsParent = {
    title: 'Documents',
    path: '',
    icon: 'mdi:file-document-outline',
    children: []
  }

  const exports = {
    title: 'Export',
    path: '/compliance/documents/exports',
    activeWhen: ['/compliance/documents/exports', '/compliance/documents/exports/AddEditExportPermit']
  }

  const imports = {
    title: 'Import',
    path: '/compliance/documents/imports',
    activeWhen: ['/compliance/documents/imports', '/compliance/documents/imports/AddEditImport']
  }

  const shipments = {
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

  const species = {
    title: 'Species',
    path: '/compliance/species'
  }

  const mastersParent = {
    title: 'Masters',
    path: '/compliance/documents/masters',
    icon: '',
    key: 'compliance-masters',
    children: []
  }

  const masterdocuments = {
    title: 'Document Types',
    path: '/compliance/masters/documents'
  }

  const masterimports = {
    title: 'Importer',
    path: '/compliance/masters/imports'
  }

  const masterexports = {
    title: 'Exporter',
    path: '/compliance/masters/exports'
  }

  const reportsParent = {
    title: 'Reports',
    path: '/compliance/documents/reports',
    key: 'compliance-reports',
    icon: '',
    children: []
  }

  const observation = {
    title: 'Observation',
    path: '/compliance/reports/observation'
  }

  const keeperDiary = {
    title: 'Keepers Diary',
    path: '/compliance/reports/keeperDiary'
  }

  const biologistDiary = {
    title: 'Biologist Diary',
    path: '/compliance/reports/biologistDiary'
  }

  const enclosureCountRegister = {
    title: 'Enclosure Count Register',
    path: '/compliance/reports/enclosureCountRegister'
  }

  const dailyReport = {
    title: 'Daily Report',
    path: '/compliance/reports/dailyReport'
  }

  const medicalJournalReport = {
    title: 'Medical Journal Report',
    path: '/compliance/reports/medicalJournalReport'
  }

  const animalStockReport = {
    title: 'Animal Stock Report',
    path: '/compliance/reports/animalStockReport'
  }

  const animalHistoryReport = {
    title: 'Animal History Report',
    path: '/compliance/reports/animalHistoryReport'
  }

  // Add all items under Documents
  documentsParent.children.push(exports, imports, shipments, species, mastersParent, reportsParent)

  mastersParent.children.push(masterdocuments, masterimports, masterexports)

  reportsParent.children.push(
    observation,
    keeperDiary,
    biologistDiary,
    enclosureCountRegister,
    dailyReport,
    medicalJournalReport,
    animalStockReport,
    animalHistoryReport
  )

  const complianceNavigation = [complianceTitle, documentsParent]

  return complianceNavigation
}

const complianceNavigation = () => composeComplianceNavigation()

export default complianceNavigation
