/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useCallback } from 'react'

import { CardHeader, Grid, Card, Chip } from '@mui/material'
import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import Icon from 'src/@core/components/icon'
import { useTheme } from '@emotion/react'
import { usePharmacyContext } from 'src/context/PharmacyContext'
import { useRouter } from 'next/router'
import RequestedItems from './RequestedItems'
import ShipmentRequests from './ShipmentRequests'
import Error404 from 'src/pages/404'

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
      // const query = { ...router.query, ...params }
      // router.replace({ pathname: router.pathname, query }, undefined, { shallow: true })
      // console.log('in function', router.query)

      const newQuery = { ...router.query, ...params }

      router.replace({ pathname: router.pathname, query: newQuery }, undefined)
    },
    [router, detailsTab]
  )

  useEffect(() => {
    updateUrlParams({
      mainTab: detailsTab
    })
  }, [detailsTab])

  const TabBadge = ({ label, totalCount }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between' }}>
      {label}
      {totalCount ? (
        <Chip sx={{ ml: '6px', fontSize: '12px' }} size='small' label={totalCount} color='secondary' />
      ) : null}
    </div>
  )

  return (
    <Grid container>
      {selectedPharmacy.type === 'central' ? (
        <Card sx={{ mb: 6, width: '100%', boxShadow: 'none !important' }}>
          <CardHeader
            avatar={
              <Icon
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  router.back()
                }}
                icon='ep:back'
              />
            }
            title={selectedStoreDetails?.storeName ? selectedStoreDetails?.storeName : router?.query?.selectedStoreName}
          />

          <Grid
            spacing={2}
            sx={{
              px: 6,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              mb: 4
            }}
          >
            <TabContext value={detailsTab}>
              <TabList
                sx={{ borderBottom: `1px solid ${theme.palette.customColors.neutral05} !important` }}
                onChange={(event, newValue) => {
                  console.log('new tab value: ', newValue)
                  setDetailsTab(newValue)
                  updateUrlParams({
                    mainTab: newValue
                  })
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
                <Grid
                  sx={{
                    width: '100%',
                    px: '0 !important'
                  }}
                >
                  <ShipmentRequests updateUrlParams={updateUrlParams} />
                </Grid>
              </TabPanel>
            </TabContext>
          </Grid>
        </Card>
      ) : (
        <Grid sx={{ mb: 6, width: '100%' }}>
          <Error404></Error404>
        </Grid>
      )}
    </Grid>
  )
}

export default RequestDetailsScreen
