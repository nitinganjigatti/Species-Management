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
      path: '/pharmacy/medicine',
      icon: 'mdi:home-outline',
      children: [
        {
          title: 'GST',
          icon: 'mdi:email-outline',

          path: '/pharmacy/medicine/gst'
        },

        // {
        //   title: 'State',
        //   icon: 'mdi:message-outline',
        //   path: '/pharmacy/medicine/state'
        // },
        {
          title: 'Generic',
          icon: 'mdi:email-outline',
          path: '/pharmacy/medicine/generic'
        },
        {
          title: 'Category',
          icon: 'mdi:email-outline',

          path: '/pharmacy/medicine/category'
        },

        // {
        //   title: 'UOM',
        //   icon: 'mdi:email-outline',
        //   path: '/pharmacy/medicine/uom'
        // },
        {
          title: 'Dosage form',
          icon: 'mdi:email-outline',
          path: '/pharmacy/medicine/dosageForm'
        },
        {
          title: 'Drug class',
          icon: 'mdi:email-outline',
          path: '/pharmacy/medicine/drugClass'
        }
      ]
    },
    {
      title: 'Purchase',
      path: '/pharmacy/purchase',
      icon: 'mdi:home-outline',
      children: [
        {
          title: 'Purchase list',
          icon: 'mdi:email-outline',
          path: '/pharmacy/purchase/purchaseList'
        },

        {
          title: 'Payment list',
          icon: 'mdi:email-outline',
          path: '/pharmacy/purchase/paymentList'
        }
      ]
    },
    {
      title: 'Store',
      path: '/pharmacy/store',
      icon: 'mdi:home-outline',
      children: [
        {
          title: 'Store list',
          icon: 'mdi:email-outline',
          path: '/pharmacy/store/storeList'
        },
        {
          title: 'Rack list',
          icon: 'mdi:email-outline',
          path: '/pharmacy/store/rackList'
        }
      ]
    },
    {
      title: 'Stocks',
      path: '/pharmacy/store',
      icon: 'mdi:home-outline',
      children: [
        {
          title: 'Stock report',
          icon: 'mdi:email-outline',
          path: '/pharmacy/stocks/stocksReport'
        },
        {
          title: 'Stock report(Batch wise)',
          icon: 'mdi:email-outline',
          path: '/pharmacy/stocks/stockReportByBatch'
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
