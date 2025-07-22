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
    path: '/compliance/documents/exports'
  }

  const imports = {
    title: 'Import',
    path: '/compliance/documents/imports'
  }

  const shipments = {
    title: 'Shipment',
    path: '/compliance/documents/shipments'
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

  const mastersParent = {
    title: 'Masters',
    path: '/compliance/documents/masters',
    icon: '',
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

  // Add all items under Documents
  documentsParent.children.push(exports, imports, shipments, mastersParent, reportsParent)

  mastersParent.children.push(masterdocuments, masterimports, masterexports)

  reportsParent.children.push(observation, keeperDiary, biologistDiary)

  const complianceNavigation = [complianceTitle, documentsParent]

  return complianceNavigation
}

const complianceNavigation = () => composeComplianceNavigation()

export default complianceNavigation
