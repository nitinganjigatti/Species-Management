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

    // {
    //   sectionTitle: 'Medicine'
    // },

    {
      title: 'Medicine',
      path: '/medicine',
      icon: 'mdi:home-outline',
      children: [
        {
          title: 'GST',
          icon: 'mdi:email-outline',

          path: '/medicine/gst'
        },

        // {
        //   title: 'State',
        //   icon: 'mdi:message-outline',
        //   path: '/medicine/state'
        // },
        {
          title: 'Generic',
          icon: 'mdi:email-outline',
          path: '/medicine/generic'
        },
        {
          title: 'Category',
          icon: 'mdi:email-outline',

          path: '/medicine/category'
        },

        // {
        //   title: 'UOM',
        //   icon: 'mdi:email-outline',
        //   path: '/medicine/uom'
        // },
        {
          title: 'Dosage form',
          icon: 'mdi:email-outline',
          path: '/medicine/dosageForm'
        },
        {
          title: 'Drug class',
          icon: 'mdi:email-outline',
          path: '/medicine/drugClass'
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
