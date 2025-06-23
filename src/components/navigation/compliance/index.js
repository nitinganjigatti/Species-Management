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

  const files = {
    title: 'Files',
    path: '/compliance/documents/files'
  }

  const species = {
    title: 'Species',
    path: '/compliance/documents/species'
  }

  const animals = {
    title: 'Animals',
    path: '/compliance/documents/animals'
  }

  const mastersParent = {
    title: 'masters',
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

  // Add all items under Documents
  documentsParent.children.push(exports, imports, shipments, files, species, animals, mastersParent)

  mastersParent.children.push(masterdocuments, masterimports, masterexports)

  const complianceNavigation = [complianceTitle, documentsParent]

  return complianceNavigation
}

const complianceNavigation = () => composeComplianceNavigation()

export default complianceNavigation
