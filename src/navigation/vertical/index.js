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
      path: '/pharmacy/supplier',
      icon: 'mdi:home-outline',
      children: [
        {
          title: 'Supplier',
          icon: 'mdi:email-outline',
          path: '/pharmacy/supplier'
        },
        {
          title: 'Supplier Ledger',
          icon: 'mdi:message-outline',
          path: '/pharmacy/supplier/supplier-ledger'
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
