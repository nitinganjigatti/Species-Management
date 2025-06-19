import { Alert, AlertTitle, Button, Card } from '@mui/material'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import FallbackSpinner from 'src/@core/components/spinner'
import ShipRequest from 'src/components/pharmacy/localDispatch/ShipRequestForm'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import { getDispatchItemsByBatchId, getRequestItemsListById } from 'src/lib/api/pharmacy/getRequestItemsList'

const ShipmentDetails = () => {
  const router = useRouter()
  const { id } = router.query

  const { selectedPharmacy } = usePharmacyContext()
  const [loader, setLoader] = useState(false)
  const [permissionView, setPermissionView] = useState(false)
  const [requestItems, setRequestItems] = useState([])
  const [dispatchedItems, setDispatchedItems] = useState([])

  const getRequestItemLists = async id => {
    try {
      setLoader(true)
      const response = await getRequestItemsListById(id)
      if (response.success) {
        const responseData = response.data

        const mappedWithUid = response?.data?.request_item_details?.map((item, index) => ({
          ...item,
          sl_no: index + 1
        }))

        responseData['request_item_details'] = mappedWithUid
        setRequestItems(responseData)
        setLoader(false)
        setPermissionView(true)
      } else {
        setLoader(false)
        setPermissionView(false)
      }
    } catch (e) {
      setLoader(false)
      setPermissionView(false)
    }
  }

  const getDispatchedItems = async id => {
    try {
      setLoader(true)
      const response = await getDispatchItemsByBatchId(id)
      if (response.success) {
        var responseData = response?.data

        const data = responseData?.dispatch_items?.map((el, index) => {
          const items = {
            sl_no: index + 1,
            id: index + 1,
            dispatch_id: el.dispatch_id,
            dispatch_item_id: el.dispatch_item_id,
            stock_item_id: el.stock_item_id,
            request_number: el.request_number,
            medicin_name: el.medicin_name,
            unit_price: el.unit_price,
            mrp_price: el.mrp_price,
            purchase_price: el.purchase_price,
            batch_no: el.batch_no,
            expiry_date: el.expiry_date,
            dispatch_qty: el.dispatch_qty,
            dispatch_box_qty: el.dispatch_box_qty,
            unit_id: el.unit_id,
            leaf_id: el.leaf_id,
            leaf_name: el.leaf_name,
            net_amount: el.net_amount,
            dispatch_status: el.dispatch_status,
            description: el.description,
            stock_qty: el.stock_qty,
            from_store_name: el.from_store_name,
            to_store_name: el.to_store_name,
            total_requested_qty: el.total_requested_qty,
            total_dispatch_qty: el.total_dispatch_qty,
            package: `${el?.package} of ${el?.package_qty} ${el?.package_uom_label} ${el?.product_form_label}`,
            manufacture: el?.manufacturer
          }

          return items
        })
        var dispatches = data?.filter(item => item.dispatch_status !== 'Shipped' && item.dispatch_status !== 'PickedUp')
        responseData['dispatch_items'] = dispatches
        setDispatchedItems(responseData.dispatch_items)
        setLoader(false)
      } else {
        setLoader(false)
      }
    } catch (e) {
      console.log(e)
      setLoader(false)
    }
  }

  const init = async id => {
    if (id !== undefined) {
      await getRequestItemLists(id)
      await getDispatchedItems(id)
    }
  }

  useEffect(() => {
    if (id !== undefined) {
      init(id)
    }
  }, [id, selectedPharmacy.id])

  return (
    <Card sx={{ p: 1 }}>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <>
          {permissionView ? (
            <ShipRequest dispatchedItems={dispatchedItems} storeDetails={requestItems} />
          ) : (
            <Alert severity='warning'>
              <AlertTitle>Warning</AlertTitle>
              You don't have an access to view this request
              <Button
                onClick={() => {
                  router.push('/pharmacy/direct-dispatch/direct-dispatch-list/')
                }}
                variant='contained'
                size='small'
                sx={{ mx: 4 }}
              >
                Back to list
              </Button>
            </Alert>
          )}
        </>
      )}
    </Card>
  )
}

export default ShipmentDetails
