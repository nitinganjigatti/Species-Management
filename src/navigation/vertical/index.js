const navigation = () => {
  return [
    {
      title: 'Home',
      path: '/home',
      icon: 'mdi:home-outline'
    },
    {
      sectionTitle: 'Pharmacy'
    },
    {
      title: 'Supplier',
      path: '/supplier',
      icon: 'mdi:home-outline',
      children: [
        {
          title: 'Suppliers',
          icon: 'mdi:email-outline',
          path: '/supplier'
        },
        {
          title: 'Supplier Ledger',
          icon: 'mdi:message-outline',
          path: '/supplier/supplier-ledger'
        }
      ]
    },
    {
      sectionTitle: 'Others'
    },
    {
      title: 'Second Page',
      path: '/second-page',
      icon: 'mdi:email-outline'
    },
    {
      path: '/acl',
      action: 'read',
      subject: 'acl-page',
      title: 'Access Control',
      icon: 'mdi:shield-outline'
    }
  ]
}

export default navigation
