import { TabContext, TabList, TabPanel } from '@mui/lab'
import { Breadcrumbs, Grid, Tab, Typography } from '@mui/material'
import React, { useEffect, useState } from 'react'
import ShowLabCard from 'src/components/lab/lab-details/ShowLabCard'
import Site from 'src/components/lab/lab-details/Site'
import Tests from 'src/components/lab/lab-details/Tests'
import Users from 'src/components/lab/lab-details/Users'
import { getLabDeatilsById } from 'src/lib/api/lab/addLab'
import { useRouter } from 'next/router'
import { useTheme } from '@mui/material/styles'
import FallbackSpinner from 'src/@core/components/spinner/index'

const LabDetails = () => {
  const theme = useTheme()
  const router = useRouter()
  const { id, page, q, pageSize } = router.query

  const [loader, setLoader] = useState(false)
  const [status, setStatus] = useState('site')
  const [showLabDetails, setShowLabDetails] = useState()
  const [labTests, setLabTests] = useState()

  const handleChange = (event, newValue) => {
    setStatus(newValue)
  }

  const labDetailsById = async id => {
    try {
      const res = await getLabDeatilsById(id)
      if (res) {
        setShowLabDetails(res?.data[0])
        setLabTests(res?.data[0]?.lab_details)
        setLoader(false)
      }
    } catch (error) {}
  }

  useEffect(() => {
    if (id != undefined) {
      setLoader(true)
      labDetailsById(id)
    }
  }, [id])

  return (
    <>
      {loader ? (
        <FallbackSpinner />
      ) : (
        <>
          <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 5 }}>
            <Typography sx={{ cursor: 'pointer' }} color='inherit'>
              Labs
            </Typography>
            <Typography
              sx={{ cursor: 'pointer' }}
              color='inherit'
              onClick={() =>
                router.push({
                  pathname: '/lab/lab-list',
                  query: { page, q, pageSize }
                })
              }
            >
              Labs list
            </Typography>
            <Typography sx={{ cursor: 'pointer' }} color='text.primary'>
              Lab details
            </Typography>
          </Breadcrumbs>

          <Grid container spacing={2}>
            <Grid item md={3}>
              <ShowLabCard data={showLabDetails} />
            </Grid>
            <Grid item md={9}>
              <TabContext value={status}>
                <TabList onChange={handleChange}>
                  <Tab value='site' label='SITES' sx={{ ml: 5 }} />
                  <Tab value='tests' label='TESTS' />
                  <Tab value='users' label='USERS' />
                </TabList>

                <TabPanel value='site'>
                  <Site labId={id} />
                </TabPanel>
                <TabPanel value='tests'>
                  <Tests labTest={labTests} />
                </TabPanel>
                <TabPanel value='users'>
                  <Users labId={id} />
                </TabPanel>
              </TabContext>
            </Grid>
          </Grid>
        </>
      )}
    </>
  )
}

export default LabDetails
