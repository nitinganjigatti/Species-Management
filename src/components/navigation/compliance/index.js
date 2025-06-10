const composeDietNavigation = () => {
    const pharmacyTitle = {
      sectionTitle: 'Compliance'
    }
  
    const tradeParent = {
      title: 'Trade',
      path: '',
      icon: 'uil:setting',
      children: []
    }
  
    const settingsParent = {
      title: 'Settings',
      path: '',
      icon: 'uil:setting',
      children: []
    }
  
    const documentTypes = {
      title: 'Document Type',
      path: '/compliance/trade/settings/document-type',
    }

    settingsParent.children.push(documentTypes)
    tradeParent.children.push(settingsParent)
  
    const complianceNavigation = [
      pharmacyTitle,
      tradeParent 
    ]
  
    return complianceNavigation
  }
  
  const complianceNavigation = () => composeDietNavigation()
  
  export default complianceNavigation
  