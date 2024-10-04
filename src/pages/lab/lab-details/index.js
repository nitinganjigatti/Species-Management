import { TabContext, TabList, TabPanel } from '@mui/lab'
import { Box, Grid, Tab } from '@mui/material'
import React, { useEffect, useState } from 'react'
import Equipments from 'src/components/lab/lab-details/Equipments'
import OverView from 'src/components/lab/lab-details/OverView'
import ShowLabCard from 'src/components/lab/lab-details/ShowLabCard'
import Site from 'src/components/lab/lab-details/Site'
import Tests from 'src/components/lab/lab-details/Tests'
import Users from 'src/components/lab/lab-details/Users'
import { getLabDeatilsById } from 'src/lib/api/lab/addLab'
import { useRouter } from 'next/router'
import FallbackSpinner from 'src/@core/components/spinner/index'

const LabDetails = () => {
  const [loader, setLoader] = useState(false)
  const [status, setStatus] = useState('site')
  const [showLabDetails, setShowLabDetails] = useState()
  const [labTests, setLabTests] = useState()

  const handleChange = (event, newValue) => {
    setStatus(newValue)
  }
  const router = useRouter()
  const { id } = router.query

  const labDetailsById = async id => {
    try {
      const res = await getLabDeatilsById(id)
      if (res) {
        // console.log('res show', res?.data[0])
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
      )}
    </>
  )
}

export default LabDetails
