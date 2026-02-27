import React, { useState, useEffect, useCallback } from 'react'

import { Grid, Chip } from '@mui/material'
import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import { useTheme } from '@emotion/react'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import { useRouter } from 'next/router'
import RequestedItems from './RequestedItems'
import ShipmentRequests from './ShipmentRequests'
import PageCardLayout from 'src/views/utility/Layout/PageCardLayout'
const RequestDetailsScreen = () => {
  const theme = useTheme()
  const router = useRouter()
  const { id } = router.query
  const { selectedPharmacy } = usePharmacyContext()

  const [detailsTab, setDetailsTab] = useState(router.query.mainTab || 'Pending')

  const [selectedStoreDetails, setSelectedStoreDetails] = useState({
    storeId: '',
    storeName: ''
  })

  const updateUrlParams = useCallback(
    params => {
      const newQuery = { ...router.query, ...params }
      router.replace({ pathname: router.pathname, query: newQuery }, undefined, { shallow: true })
    },
    [router]
  )

  // useEffect(() => {
  //   if (detailsTab !== router.query.mainTab) {
  //     // debugger
  //     updateUrlParams({
  //       mainTab: detailsTab
  //     })
  //   }
  // }, [detailsTab])

  useEffect(() => {
    if (router.isReady) {
      if (router.query.mainTab && typeof router.query.mainTab === 'string') {
        setDetailsTab(router.query.mainTab)
      }
    }
  }, [router.isReady])

  useEffect(() => {
    if (detailsTab && detailsTab !== router.query.mainTab) {
      updateUrlParams({ mainTab: detailsTab })
    }
  }, [updateUrlParams, detailsTab])

  const TabBadge = ({ label, totalCount }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between' }}>
      {label}
      {totalCount ? (
        <Chip sx={{ ml: '6px', fontSize: '12px' }} size='small' label={totalCount} color='secondary' />
      ) : null}
    </div>
  )

  return (
    <PageCardLayout
      cardStyles={{
        mb: 6,
        width: '100%',
        boxShadow: 'none !important'
      }}
      title={
        selectedPharmacy?.type === 'local'
          ? null
          : selectedStoreDetails?.storeName
          ? selectedStoreDetails?.storeName
          : router?.query?.selectedStoreName
      }
      showIcon={selectedPharmacy?.type !== 'local'}
      titleStyles={{
        fontSize: '20px'
      }}
      onIconClick={() => {
        if (selectedPharmacy?.type === 'local') {
          router.push({
            pathname: `/pharmacy/requests-by-product`,
            query: selectedPharmacy?.id
          })
        } else {
          router.back()
        }
      }}
    >
      <Grid container>
        <Grid
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            mb: 4
          }}
        >
          <TabContext value={detailsTab}>
            <TabList
              variant='scrollable'
              allowScrollButtonsMobile
              sx={{ borderBottom: `1px solid ${theme.palette.customColors.neutral05} !important` }}
              onChange={(event, newValue) => {
                console.log('new tab value: ', newValue)
                setDetailsTab(newValue)

                // updateUrlParams({
                //   mainTab: newValue
                // })
              }}
            >
              <Tab
                value='Pending'
                label={<TabBadge label='Requested Items' totalCount={detailsTab === 'Pending' ? 0 : null} />}
              />
              <Tab
                value='Shipped'
                label={<TabBadge label='Shipment' totalCount={detailsTab === 'Shipped' ? 0 : null} />}
              />
            </TabList>

            <TabPanel
              value='Pending'
              sx={{
                padding: '0 !important'
              }}
            >
              <RequestedItems
                selectedStoreDetails={selectedStoreDetails}
                setSelectedStoreDetails={setSelectedStoreDetails}
                updateUrlParams={updateUrlParams}
              />
            </TabPanel>

            <TabPanel
              value='Shipped'
              sx={{
                padding: '0 !important'
              }}
            >
              {/* <Grid
                sx={{
                  width: '100%',
                  px: '0 !important'
                }}
              > */}
              <ShipmentRequests updateUrlParams={updateUrlParams} />
              {/* </Grid> */}
            </TabPanel>
          </TabContext>
        </Grid>
      </Grid>
    </PageCardLayout>
  )
}

export default React.memo(RequestDetailsScreen)
