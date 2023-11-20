const navigation = () => {
  return [
    // {
    //   title: 'Home',
    //   path: '/home',
    //   icon: 'mdi:home-outline'
    // },
    {
      sectionTitle: 'Pharmacy'
    },

    {
      title: 'Medicine',
      path: '/pharmacy/medicine',
      icon: 'mdi:medical-bag',
      children: [
        {
          title: 'Medicine',
          path: '/pharmacy/medicine'
        },
        {
          title: 'Add Medicine',
          path: '/pharmacy/medicine/add-medicine'
        }
      ]
    },

    // {
    //   title: 'Supplier',
    //   path: '/pharmacy/supplier',
    //   icon: 'material-symbols:bath-public-large-rounded',
    //   children: [
    //     {
    //       title: 'Supplier',
    //       path: '/pharmacy/supplier'
    //     },
    //     {
    //       title: 'Supplier Ledger',
    //       path: '/pharmacy/supplier/supplier-ledger'
    //     }
    //   ]
    // },

    // {
    //   sectionTitle: 'Medicine'
    // },

    {
      title: 'Settings',
      path: '/pharmacy/settings',
      icon: 'mdi:settings',
      children: [
        {
          title: 'GST',
          path: '/pharmacy/settings/gst'
        },

        // {
        //   title: 'State',
        //   path: '/pharmacy/medicine/state'
        // },
        // {
        //   title: 'Generic',
        //   path: '/pharmacy/medicine/generic'
        // },
        // {
        //   title: 'Category',
        //   path: '/pharmacy/medicine/category'
        // },

        {
          title: 'UOM',
          path: '/pharmacy/settings/uom'
        },
        {
          title: 'Product Form',
          path: '/pharmacy/settings/product-form'
        },
        {
          title: 'Drug class',
          path: '/pharmacy/settings/drug-class'
        },
        {
          title: 'Manufacturer',
          path: '/pharmacy/settings/manufacturer'
        },
        {
          title: 'Packages',
          path: '/pharmacy/settings/packages'
        },
        {
          title: 'Salts',
          path: '/pharmacy/settings/salts'
        },
        {
          title: 'Storage',
          path: '/pharmacy/settings/storage'
        }
      ]
    }

    // {
    //   title: 'Purchase',
    //   path: '/pharmacy/purchase',
    //   icon: 'raphael:cart',
    //   children: [
    //     {
    //       title: 'Purchase list',
    //       path: '/pharmacy/purchase/purchaseList'
    //     },

    //     {
    //       title: 'Payment list',
    //       path: '/pharmacy/purchase/paymentList'
    //     }
    //   ]
    // },
    // {
    //   title: 'Store',
    //   path: '/pharmacy/store',
    //   icon: 'bx:store',
    //   children: [
    //     {
    //       title: 'Store list',
    //       path: '/pharmacy/store/storeList'
    //     },
    //     {
    //       title: 'Rack list',
    //       path: '/pharmacy/store/rackList'
    //     }
    //   ]
    // },
    // {
    //   title: 'Stocks',
    //   path: '/pharmacy/store',
    //   icon: 'bi:boxes',
    //   children: [
    //     {
    //       title: 'Stock report',
    //       path: '/pharmacy/stocks/stocksReport'
    //     },
    //     {
    //       title: 'Stock report(Batch wise)',
    //       path: '/pharmacy/stocks/stockReportByBatch'
    //     },
    //     {
    //       title: 'Stock Out',
    //       path: '/pharmacy/stocks/stock-out'
    //     },
    //     {
    //       title: 'Expired Medicine',
    //       path: '/pharmacy/stocks/expired-medicine'
    //     }
    //   ]
    // },
    // {
    //   title: 'Shipment',
    //   path: '/pharmacy/shipment',
    //   icon: 'streamline:shipping-box-1-box-package-label-delivery-shipment-shipping',
    //   children: [
    //     {
    //       title: 'Shipment',
    //       path: '/pharmacy/shipment/shipment'
    //     }
    //   ]
    // },
    // {
    //   title: 'Allocation',
    //   path: '/pharmacy/allocation',

    //   icon: 'pajamas:assignee',
    //   children: [
    //     {
    //       title: 'Allocation',
    //       path: '/pharmacy/allocation/allocation'
    //     }
    //   ]
    // },
    // {
    //   title: 'Debit Note',
    //   icon: 'icon-park:play-cycle',
    //   path: '/pharmacy/debitNote',

    //   children: [
    //     {
    //       title: 'Debit Note',
    //       path: '/pharmacy/debitNote/debitNote'
    //     }
    //   ]
    // },
    // {
    //   title: 'Dispatch',
    //   icon: 'bxs:log-out',
    //   children: [
    //     {
    //       title: 'Dispatch',
    //       path: '/pharmacy/dispatch/dispatch'
    //     },
    //     {
    //       title: 'Dispatch validation',
    //       path: '/pharmacy/dispatch/dispatchValidation'
    //     }
    //   ]
    // },
    // {
    //   title: 'Request',
    //   icon: 'lucide:git-pull-request',
    //   path: '/pharmacy/request',

    //   children: [
    //     {
    //       title: 'Request',
    //       path: '/pharmacy/request/requestList'
    //     }
    //   ]
    // }

    // {
    //   sectionTitle: 'Others'
    // },
    // {
    //   title: 'Second Page',
    //   path: '/second-page',
    //   icon: 'mdi:email-outline'
    // },
    // {
    //   path: '/acl',
    //   action: 'read',
    //   subject: 'acl-page',
    //   title: 'Access Control',
    //   icon: 'mdi:shield-outline'
    // }
  ]
}

export default navigation
