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
      icon: 'material-symbols:bath-public-large-rounded',
      children: [
        {
          title: 'Supplier',
          path: '/pharmacy/supplier'
        },
        {
          title: 'Supplier Ledger',
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
      icon: 'mdi:medical-bag',
      children: [
        {
          title: 'GST',
          path: '/pharmacy/medicine/gst'
        },

        {
          title: 'State',
          path: '/pharmacy/medicine/state'
        },
        {
          title: 'Generic',
          path: '/pharmacy/medicine/generic'
        },
        {
          title: 'Category',
          path: '/pharmacy/medicine/category'
        },

        {
          title: 'UOM',
          path: '/pharmacy/medicine/uom'
        },
        {
          title: 'Dosage form',
          path: '/pharmacy/medicine/dosageForm'
        },
        {
          title: 'Drug class',
          path: '/pharmacy/medicine/drugClass'
        },
        {
          title: 'Medicine',
          path: '/pharmacy/medicine/medicine'
        }
      ]
    },
    {
      title: 'Purchase',
      path: '/pharmacy/purchase',
      icon: 'raphael:cart',
      children: [
        {
          title: 'Purchase list',
          path: '/pharmacy/purchase/purchaseList'
        },

        {
          title: 'Payment list',
          path: '/pharmacy/purchase/paymentList'
        }
      ]
    },
    {
      title: 'Store',
      path: '/pharmacy/store',
      icon: 'bx:store',
      children: [
        {
          title: 'Store list',
          path: '/pharmacy/store/storeList'
        },
        {
          title: 'Rack list',
          path: '/pharmacy/store/rackList'
        }
      ]
    },
    {
      title: 'Stocks',
      path: '/pharmacy/store',
      icon: 'bi:boxes',
      children: [
        {
          title: 'Stock report',
          path: '/pharmacy/stocks/stocksReport'
        },
        {
          title: 'Stock report(Batch wise)',
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
